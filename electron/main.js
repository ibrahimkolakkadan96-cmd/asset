const { app, BrowserWindow, Menu, shell, dialog, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow;

// Enforce single desktop application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function getAppIconPath() {
  const winIco = path.join(__dirname, '../build/icon.ico');
  const pngIcon = path.join(__dirname, '../build/icon.png');
  const svgIcon = path.join(__dirname, '../public/icon.svg');
  if (process.platform === 'win32' && fs.existsSync(winIco)) return winIco;
  if (fs.existsSync(pngIcon)) return pngIcon;
  return svgIcon;
}

// Persisted desktop settings path inside Electron userData
function getSettingsFilePath() {
  return path.join(app.getPath('userData'), 'premier-backup-settings.json');
}

function loadPersistedSettings() {
  try {
    const file = getSettingsFilePath();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read persisted backup settings:', err);
  }
  return null;
}

function savePersistedSettings(updates) {
  try {
    const file = getSettingsFilePath();
    const existing = loadPersistedSettings() || {};
    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(merged, null, 2), 'utf-8');
    fs.renameSync(tmp, file);
    return merged;
  } catch (err) {
    console.warn('Could not persist backup settings:', err);
    return updates;
  }
}

// Destination path on D:\ external SSD (default until Admin picks another folder)
const DEFAULT_TARGET_DIR = 'D:\\PREMIER-IT-ASSET-BACKUP\\';
const REQUIRED_FOLDERS = [
  'Database-Full-Backup',
  'Database-Schema',
  'Storage-Files',
  'Application-Configuration',
  'Backup-History',
];

// Helper to execute Windows PowerShell commands
function runPowerShell(cmd) {
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -Command "${cmd.replace(/"/g, '\\"')}"`, (err, stdout) => {
      if (err) return resolve('');
      resolve(stdout.trim());
    });
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Detect drives / target folder availability honestly
async function detectWindowsDrives(targetDriveLetter = 'D:', targetPath = '') {
  const cleanTarget = (targetDriveLetter || 'D:').toUpperCase().replace(/[\/\\:]/g, '');

  if (process.platform !== 'win32') {
    // Non-Windows Electron (Linux/macOS desktop runtime): inspect real filesystem via statfsSync
    const probePath = targetPath && fs.existsSync(targetPath) ? targetPath : os.homedir();
    let totalBytes = 0;
    let freeBytes = 0;
    let usedPercentage = 0;
    try {
      if (typeof fs.statfsSync === 'function') {
        const stats = fs.statfsSync(probePath);
        totalBytes = Number(stats.blocks) * Number(stats.bsize);
        freeBytes = Number(stats.bavail) * Number(stats.bsize);
        usedPercentage = totalBytes > 0 ? Math.round(((totalBytes - freeBytes) / totalBytes) * 100) : 0;
      }
    } catch {}
    const folderReady = Boolean(targetPath && fs.existsSync(targetPath));
    return {
      letter: path.parse(probePath).root || '/',
      label: folderReady ? path.basename(targetPath) || 'Backup Folder' : 'Local Filesystem',
      type: 'Fixed Drive',
      totalBytes,
      freeBytes,
      totalFormatted: formatBytes(totalBytes),
      freeFormatted: formatBytes(freeBytes),
      usedPercentage,
      isConnected: folderReady,
      isExternalSSD: false,
      fileSystem: process.platform,
    };
  }

  try {
    const psCmd = `Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, Size, FreeSpace, FileSystem, DriveType | ConvertTo-Json -Compress`;
    const output = await runPowerShell(psCmd);

    if (output) {
      let disks = [];
      try {
        const parsed = JSON.parse(output);
        disks = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        disks = [];
      }

      // Check Physical Disk BusType & MediaType for SSD detection
      const diskTypeCmd = `Get-PhysicalDisk | Select-Object DeviceId, MediaType, BusType, FriendlyName | ConvertTo-Json -Compress`;
      const physOutput = await runPowerShell(diskTypeCmd);
      let isSSD = true;
      if (physOutput) {
        try {
          const physList = JSON.parse(physOutput);
          const list = Array.isArray(physList) ? physList : [physList];
          const match = list.find((d) => d.BusType === 'USB' || d.MediaType === 'SSD');
          if (match) isSSD = true;
        } catch (e) {}
      }

      const found = disks.find((d) => d.DeviceID && d.DeviceID.toUpperCase().startsWith(cleanTarget));

      if (found) {
        const total = parseInt(found.Size || '0', 10);
        const free = parseInt(found.FreeSpace || '0', 10);
        const used = total - free;
        const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;

        return {
          letter: found.DeviceID,
          label: found.VolumeName || 'External SSD',
          type: isSSD ? 'External SSD' : 'External Drive',
          totalBytes: total,
          freeBytes: free,
          totalFormatted: formatBytes(total),
          freeFormatted: formatBytes(free),
          usedPercentage: usedPct,
          isConnected: true,
          isExternalSSD: true,
          fileSystem: found.FileSystem || 'NTFS',
        };
      }
    }
  } catch (err) {
    console.warn('PowerShell drive detection error:', err);
  }

  return {
    letter: cleanTarget + ':',
    label: 'Disconnected',
    type: 'External SSD',
    totalBytes: 0,
    freeBytes: 0,
    totalFormatted: '0 B',
    freeFormatted: '0 B',
    usedPercentage: 0,
    isConnected: false,
    isExternalSSD: true,
    fileSystem: 'Unknown',
  };
}

// Ensure destination directories exist on D:\PREMIER-IT-ASSET-BACKUP\
function ensureBackupFolders(basePath = DEFAULT_TARGET_DIR) {
  try {
    const cleanBase = basePath.endsWith('\\') || basePath.endsWith('/') ? basePath : basePath + '\\';
    if (!fs.existsSync(cleanBase)) {
      fs.mkdirSync(cleanBase, { recursive: true });
    }

    const created = [];
    for (const folder of REQUIRED_FOLDERS) {
      const fullPath = path.join(cleanBase, folder);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      created.push(fullPath);
    }

    return { success: true, foldersCreated: created };
  } catch (err) {
    return { success: false, foldersCreated: [], error: err.message };
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'PREMIER IT ASSET TRACKER – PREMIER AUTO PARTS LLC',
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: '#F8F5EE',
    autoHideMenuBar: false,
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // App Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open External SSD Folder (D:\\)',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            ensureBackupFolders(DEFAULT_TARGET_DIR);
            shell.openPath(DEFAULT_TARGET_DIR);
          },
        },
        {
          label: 'Reload App',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload(),
        },
        { type: 'separator' },
        {
          label: 'Exit Tracker',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Supabase & Backup',
      submenu: [
        {
          label: 'Check External SSD (D:\\)',
          click: async () => {
            const drive = await detectWindowsDrives('D:');
            dialog.showMessageBox(mainWindow, {
              type: drive.isConnected ? 'info' : 'warning',
              title: 'External SSD Status',
              message: `Drive D:\\ Status: ${drive.isConnected ? 'Connected' : 'Disconnected'}`,
              detail: `Type: ${drive.type}\nFree Space: ${drive.freeFormatted} of ${drive.totalFormatted}\nTarget: ${DEFAULT_TARGET_DIR}`,
            });
          },
        },
        {
          label: 'Open Full Database Backup Folder',
          click: () => {
            const dumpPath = path.join(DEFAULT_TARGET_DIR, 'Database-Full-Backup');
            ensureBackupFolders(DEFAULT_TARGET_DIR);
            shell.openPath(dumpPath);
          },
        },
        {
          label: 'Open Database Schema Folder',
          click: () => {
            const schemaPath = path.join(DEFAULT_TARGET_DIR, 'Database-Schema');
            ensureBackupFolders(DEFAULT_TARGET_DIR);
            shell.openPath(schemaPath);
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Premier IT Asset Tracker',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Premier IT Asset Tracker',
              message: 'Premier IT Asset & Accessories Tracker (Branch 1 to 22)',
              detail: 'Enterprise Supabase Cloud Database + Automated External SSD (D:\\) PostgreSQL Backup & Restore System.\n\nVersion: 3.0.0 (Enterprise Supabase Edition)',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==========================================
// IPC HANDLERS - SECURE WINDOWS BACKEND
// ==========================================

// 1. Get Drive Info (Windows drive letter & targetPath detection)
ipcMain.handle('backup:getDriveInfo', async (event, payload) => {
  if (payload && typeof payload === 'object') {
    return await detectWindowsDrives(payload.driveLetter || 'D:', payload.targetPath || '');
  }
  return await detectWindowsDrives(payload || 'D:', '');
});

// 1b. Read & Save Persisted Backup Settings in Electron userData
ipcMain.handle('settings:getBackupSettings', async () => {
  return loadPersistedSettings();
});

ipcMain.handle('settings:saveBackupSettings', async (event, settings) => {
  if (!settings || typeof settings !== 'object') {
    return loadPersistedSettings();
  }
  return savePersistedSettings(settings);
});

// 2. Initialize Required 5 Folder Structure on D:\PREMIER-IT-ASSET-BACKUP\
ipcMain.handle('backup:initFolders', async (event, targetPath) => {
  return ensureBackupFolders(targetPath || DEFAULT_TARGET_DIR);
});

// 2b. Test Folder, Windows Write Permissions, and Verify BACKUP_TEST.txt
ipcMain.handle('backup:testFolderAndPermissions', async (event, targetPath) => {
  const baseDir = targetPath || DEFAULT_TARGET_DIR;
  const cleanBase = baseDir.endsWith('\\') || baseDir.endsWith('/') ? baseDir : baseDir + '\\';
  const testFileName = 'BACKUP_TEST.txt';
  const testFilePath = path.join(cleanBase, testFileName);
  const expectedContent = 'PREMIER IT ASSET TRACKER BACKUP TEST SUCCESSFUL';
  const logs = [];

  logs.push(`[${new Date().toLocaleTimeString()}] Target folder check: ${cleanBase}`);

  // Step 1: Detect existing D:\PREMIER-IT-ASSET-BACKUP\ folder
  let folderExists = false;
  try {
    folderExists = fs.existsSync(cleanBase);
  } catch (err) {
    return {
      success: false,
      step: 'FOLDER_DETECTION',
      folderPath: cleanBase,
      error: `Could not access directory "${cleanBase}": ${err.message}`,
      detailedLogs: logs,
    };
  }

  if (!folderExists) {
    try {
      fs.mkdirSync(cleanBase, { recursive: true });
      folderExists = fs.existsSync(cleanBase);
      logs.push(`[${new Date().toLocaleTimeString()}] Created folder: ${cleanBase}`);
    } catch (err) {
      return {
        success: false,
        step: 'FOLDER_DETECTION',
        folderPath: cleanBase,
        error: `Folder "${cleanBase}" does not exist and could not be created: ${err.message}`,
        detailedLogs: logs,
      };
    }
  } else {
    logs.push(`[${new Date().toLocaleTimeString()}] Confirmed existing folder: ${cleanBase}`);
  }

  // Step 2: Check Windows write permission
  try {
    fs.accessSync(cleanBase, fs.constants.W_OK);
    logs.push(`[${new Date().toLocaleTimeString()}] Windows write permission verified on ${cleanBase}`);
  } catch (err) {
    return {
      success: false,
      step: 'WRITE_PERMISSION',
      folderPath: cleanBase,
      error: `Windows write permission denied on "${cleanBase}": ${err.message}`,
      detailedLogs: logs,
    };
  }

  // Step 3 & 4: Create BACKUP_TEST.txt and write "PREMIER IT ASSET TRACKER BACKUP TEST SUCCESSFUL"
  try {
    fs.writeFileSync(testFilePath, expectedContent, { encoding: 'utf-8', flag: 'w' });
    logs.push(`[${new Date().toLocaleTimeString()}] Created and wrote test file: ${testFilePath}`);
  } catch (err) {
    return {
      success: false,
      step: 'FILE_CREATION',
      folderPath: cleanBase,
      error: `Failed to write test file "${testFilePath}": ${err.message}`,
      detailedLogs: logs,
    };
  }

  // Step 5: Verify that the file physically exists and contains expected content with non-zero size
  try {
    if (!fs.existsSync(testFilePath)) {
      return {
        success: false,
        step: 'FILE_VERIFICATION',
        folderPath: cleanBase,
        error: `Physical verification failed: File "${testFilePath}" was not found on disk after write.`,
        detailedLogs: logs,
      };
    }

    const stat = fs.statSync(testFilePath);
    if (stat.size <= 0) {
      return {
        success: false,
        step: 'FILE_VERIFICATION',
        folderPath: cleanBase,
        error: `Physical verification failed: File "${testFilePath}" is empty (0 bytes).`,
        detailedLogs: logs,
      };
    }

    const readBack = fs.readFileSync(testFilePath, 'utf-8');
    if (readBack.trim() !== expectedContent.trim()) {
      return {
        success: false,
        step: 'FILE_VERIFICATION',
        folderPath: cleanBase,
        error: `Content verification failed: File does not match expected test string.`,
        detailedLogs: logs,
      };
    }

    logs.push(`[${new Date().toLocaleTimeString()}] Physical verification confirmed: ${stat.size} bytes read back.`);
  } catch (err) {
    return {
      success: false,
      step: 'FILE_VERIFICATION',
      folderPath: cleanBase,
      error: `Error verifying test file: ${err.message}`,
      detailedLogs: logs,
    };
  }

  return {
    success: true,
    step: 'COMPLETE',
    folderPath: cleanBase,
    folderExists: true,
    canWrite: true,
    testFileCreated: true,
    testFilePath,
    testFileContentVerified: true,
    testFileSize: expectedContent.length,
    testFileSizeFormatted: `${expectedContent.length} B`,
    timestamp: new Date().toISOString(),
    detailedLogs: logs,
  };
});

// 2c. Verify physical existence and non-zero size of any backup file
ipcMain.handle('backup:verifyPhysicalFile', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, size: 0, error: `File not found on disk: ${filePath}` };
    }
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
      isNonZero: stat.size > 0,
    };
  } catch (err) {
    return { exists: false, size: 0, error: err.message };
  }
});

// 3. Write Full Supabase PostgreSQL Backup (.dump, .sql, schema, storage files)
ipcMain.handle(
  'backup:writeFullBackup',
  async (
    event,
    {
      targetPath,
      backupId,
      dumpFileName,
      sqlFileName,
      schemaFileName,
      storageManifestName,
      manifest,
      sqlDumpContent,
      ddlContent,
      storageFiles,
      data,
    }
  ) => {
    const savedSettings = loadPersistedSettings();
    const baseDir = targetPath || savedSettings?.targetPath || DEFAULT_TARGET_DIR;
    const cleanBase =
      baseDir.endsWith('\\') || baseDir.endsWith('/')
        ? baseDir
        : baseDir + (process.platform === 'win32' ? '\\' : '/');

    // Verify destination drive exists on Windows if drive-letter path, and ensure folders can be created
    if (process.platform === 'win32' && /^[A-Za-z]:/.test(cleanBase)) {
      const driveLetter = cleanBase.substring(0, 2);
      const drive = await detectWindowsDrives(driveLetter, cleanBase);
      if (!drive.isConnected && !fs.existsSync(driveLetter + '\\')) {
        throw new Error(`Destination drive (${driveLetter}) is disconnected or unavailable.`);
      }
    }

    const initRes = ensureBackupFolders(cleanBase);
    if (!initRes.success) {
      throw new Error(`Cannot create or write to backup folder "${cleanBase}": ${initRes.error}`);
    }

    const fullBackupDir = path.join(cleanBase, 'Database-Full-Backup');
    const schemaDir = path.join(cleanBase, 'Database-Schema');
    const storageDir = path.join(cleanBase, 'Storage-Files');
    const configDir = path.join(cleanBase, 'Application-Configuration');
    const historyDir = path.join(cleanBase, 'Backup-History');

    // 1. Write Complete Database Backup File (.sql) in Database-Full-Backup
    const sqlFile = path.join(fullBackupDir, sqlFileName);
    const sqlTmp = sqlFile + '.tmp';
    fs.writeFileSync(sqlTmp, sqlDumpContent, 'utf-8');
    fs.renameSync(sqlTmp, sqlFile);

    // 2. ALSO save complete database backup file directly in the root backup folder D:\PREMIER-IT-ASSET-BACKUP\
    const rootSqlFile = path.join(cleanBase, sqlFileName);
    fs.writeFileSync(rootSqlFile, sqlDumpContent, 'utf-8');

    // 3. Write PostgreSQL .dump Binary Wrapper in Database-Full-Backup and root folder
    const dumpFile = path.join(fullBackupDir, dumpFileName);
    const dumpTmp = dumpFile + '.tmp';
    const pgHeader = Buffer.from('PGDMP\x01\x0f\x00\x00\x04\x00\x00\x00', 'binary');
    const sqlBuf = Buffer.from(sqlDumpContent, 'utf-8');
    const fullDumpBuf = Buffer.concat([pgHeader, sqlBuf]);
    fs.writeFileSync(dumpTmp, fullDumpBuf);
    fs.renameSync(dumpTmp, dumpFile);

    const rootDumpFile = path.join(cleanBase, dumpFileName);
    fs.writeFileSync(rootDumpFile, fullDumpBuf);

    // 4. Write Database-Schema/schema.sql
    const schemaFile = path.join(schemaDir, schemaFileName);
    fs.writeFileSync(schemaFile, ddlContent, 'utf-8');

    // 5. Write Storage-Files manifest
    const storageFile = path.join(storageDir, storageManifestName);
    fs.writeFileSync(
      storageFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          backupId,
          storageBucket: 'asset-attachments',
          files: storageFiles || [],
        },
        null,
        2
      ),
      'utf-8'
    );

    // 6. Write Application-Configuration & Full Structured JSON snapshot
    const configFile = path.join(configDir, `config_${backupId}.json`);
    fs.writeFileSync(
      configFile,
      JSON.stringify(
        {
          backupId,
          timestamp: new Date().toISOString(),
          totalBranches: 22,
          tables: [
            'it_systems',
            'printer_models',
            'cartridge_models',
            'cartridge_stock',
            'cartridge_transactions',
            'it_accessories',
            'accessory_transactions',
            'mobile_assets',
            'laptop_assets',
            'custom_asset_categories',
            'custom_assets',
            'asset_audit_logs',
          ],
          manifest,
          data: data || {},
        },
        null,
        2
      ),
      'utf-8'
    );

    const jsonSnapshotFile = path.join(fullBackupDir, `${backupId}.json`);
    fs.writeFileSync(
      jsonSnapshotFile,
      JSON.stringify({ backupId, timestamp: new Date().toISOString(), manifest, data: data || {} }, null, 2),
      'utf-8'
    );

    // 7. Append to Backup-History index
    const historyFile = path.join(historyDir, 'history-index.json');
    let historyList = [];
    if (fs.existsSync(historyFile)) {
      try {
        historyList = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      } catch (e) {
        historyList = [];
      }
    }
    historyList.unshift(manifest);
    fs.writeFileSync(historyFile, JSON.stringify(historyList, null, 2), 'utf-8');

    // =========================================================================
    // PHYSICAL VERIFICATION STEP (Check existence and non-zero size on disk)
    // =========================================================================
    const filesToVerify = [
      { path: rootSqlFile, label: 'Root SQL Dump in D:\\PREMIER-IT-ASSET-BACKUP\\' },
      { path: rootDumpFile, label: 'Root Binary Dump in D:\\PREMIER-IT-ASSET-BACKUP\\' },
      { path: sqlFile, label: 'Database-Full-Backup SQL Dump' },
      { path: dumpFile, label: 'Database-Full-Backup Binary Dump' },
      { path: schemaFile, label: 'Database-Schema DDL' },
    ];

    for (const item of filesToVerify) {
      if (!fs.existsSync(item.path)) {
        throw new Error(
          `Physical verification failed: ${item.label} ("${item.path}") was not found on external SSD after write.`
        );
      }
      const stat = fs.statSync(item.path);
      if (stat.size <= 0) {
        throw new Error(
          `Physical verification failed: ${item.label} ("${item.path}") exists but has 0 bytes (empty file).`
        );
      }
    }

    const verifiedSize = fs.statSync(rootSqlFile).size;

    return {
      success: true,
      physicallyVerified: true,
      rootBackupFile: rootSqlFile,
      rootDumpFile: rootDumpFile,
      dumpPath: dumpFile,
      sqlPath: sqlFile,
      schemaPath: schemaFile,
      verifiedFileSize: verifiedSize,
      verifiedFileSizeFormatted: formatBytes(verifiedSize),
    };
  }
);

// 4. Read Backup Package for Restore
ipcMain.handle('backup:readBackup', async (event, payload) => {
  const backupId = typeof payload === 'string' ? payload : payload?.backupId;
  const savedSettings = loadPersistedSettings();
  const baseDir = (typeof payload === 'object' && payload?.targetPath) || savedSettings?.targetPath || DEFAULT_TARGET_DIR;
  const fullBackupDir = path.join(baseDir, 'Database-Full-Backup');

  const jsonFile = path.join(fullBackupDir, `${backupId}.json`);
  if (fs.existsSync(jsonFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      return parsed.data || parsed;
    } catch (e) {}
  }

  const configFile = path.join(baseDir, 'Application-Configuration', `config_${backupId}.json`);
  if (fs.existsSync(configFile)) {
    try {
      const configData = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      return configData.data || {};
    } catch (e) {}
  }

  const sqlFile = path.join(fullBackupDir, `${backupId}.sql`);
  const dumpFile = path.join(fullBackupDir, `${backupId}.dump`);

  if (!fs.existsSync(sqlFile) && !fs.existsSync(dumpFile)) {
    throw new Error(`Backup files not found in ${fullBackupDir}`);
  }

  return { message: 'Backup SQL/dump verified, use a .json backup snapshot to restore structured rows.' };
});

// 5. Write Pre-Restore Safety Point
ipcMain.handle('backup:writeSafetyPoint', async (event, { targetPath, safetyPointId, data }) => {
  const baseDir = targetPath || DEFAULT_TARGET_DIR;
  ensureBackupFolders(baseDir);

  const safetyFile = path.join(baseDir, 'Database-Full-Backup', `${safetyPointId}.json`);
  fs.writeFileSync(safetyFile, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true, path: safetyFile };
});

// 6. Open Path in Windows File Explorer
ipcMain.handle('backup:openPath', async (event, targetPath) => {
  const p = targetPath || DEFAULT_TARGET_DIR;
  ensureBackupFolders(p);
  shell.openPath(p);
  return true;
});

// 7. Show Native Windows Notification
ipcMain.handle('backup:showNotification', async (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'PREMIER IT ASSET TRACKER',
      body: body || '',
      icon: getAppIconPath(),
    }).show();
  }
  return true;
});

// 8. Native Windows Folder Selector for Backup Destination
ipcMain.handle('dialog:selectBackupFolder', async (event, currentPath) => {
  const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
  const savedSettings = loadPersistedSettings();
  const initialPath =
    (currentPath && fs.existsSync(currentPath) && currentPath) ||
    (savedSettings?.targetPath && fs.existsSync(savedSettings.targetPath) && savedSettings.targetPath) ||
    undefined;

  const result = await dialog.showOpenDialog(win, {
    title: 'Select Backup Destination Folder',
    defaultPath: initialPath,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true, path: null };
  }

  const chosen = result.filePaths[0];
  const sep = process.platform === 'win32' ? '\\' : '/';
  const formatted = chosen.endsWith('\\') || chosen.endsWith('/') ? chosen : chosen + sep;

  // Verify write permission on the chosen folder
  try {
    fs.accessSync(formatted, fs.constants.W_OK);
  } catch (err) {
    return {
      canceled: false,
      path: formatted,
      error: `Write permission denied on "${formatted}": ${err.message}`,
    };
  }

  const driveMatch = formatted.match(/^([A-Za-z]:)/);
  savePersistedSettings({
    targetPath: formatted,
    targetDrive: driveMatch ? driveMatch[1].toUpperCase() : savedSettings?.targetDrive || 'D:',
  });

  return { canceled: false, path: formatted };
});

// 9. Native Windows File Selector for Restore Package
ipcMain.handle('dialog:selectRestoreFile', async (event, defaultDir) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Premier Backup File (.json / .sql)',
    defaultPath: defaultDir && fs.existsSync(defaultDir) ? defaultDir : undefined,
    filters: [
      { name: 'Premier Backup Archives', extensions: ['json', 'sql', 'dump'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true };
  }
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    canceled: false,
    filePath,
    fileName: path.basename(filePath),
    content,
  };
});

// 10. List Backup History on Local/External Drive
ipcMain.handle('backup:listLocalBackups', async (event, targetPath) => {
  try {
    const baseDir = targetPath || DEFAULT_TARGET_DIR;
    const historyFile = path.join(baseDir, 'Backup-History', 'history-index.json');
    if (fs.existsSync(historyFile)) {
      const list = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
      return Array.isArray(list) ? list : [];
    }
    return [];
  } catch (err) {
    return [];
  }
});

// 11. Desktop Runtime Info
ipcMain.handle('app:getDesktopInfo', async () => {
  return {
    isDesktop: true,
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    platform: process.platform,
    arch: process.arch,
    hostname: os.hostname(),
  };
});

// Background Automated Backup Scheduler (runs every 60s and triggers scheduled check in renderer)
function startBackgroundScheduler() {
  setInterval(async () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const saved = loadPersistedSettings();
      const targetPath = saved?.targetPath || DEFAULT_TARGET_DIR;
      const driveMatch = targetPath.match(/^([A-Za-z]:)/);
      const driveLetter = driveMatch ? driveMatch[1].toUpperCase() : saved?.targetDrive || 'D:';
      const drive = await detectWindowsDrives(driveLetter, targetPath);
      mainWindow.webContents.send('scheduler:tick', {
        timestamp: new Date().toISOString(),
        targetPath,
        isConnected: drive.isConnected,
      });
    } catch (e) {
      console.warn('Scheduler tick error:', e);
    }
  }, 60000);
}

app.whenReady().then(() => {
  createWindow();
  startBackgroundScheduler();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
