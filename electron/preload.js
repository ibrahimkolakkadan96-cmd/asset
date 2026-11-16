const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: '3.0.0',

  // Desktop environment metadata
  getDesktopInfo: () => ipcRenderer.invoke('app:getDesktopInfo'),

  // Persisted desktop backup settings (Electron userData)
  getBackupSettings: () => ipcRenderer.invoke('settings:getBackupSettings'),
  saveBackupSettings: (settings) => ipcRenderer.invoke('settings:saveBackupSettings', settings),

  // Drive detection (selected drive / folder)
  getDriveInfo: (driveLetterOrPayload) => ipcRenderer.invoke('backup:getDriveInfo', driveLetterOrPayload),

  // Native folder / file dialogs
  selectBackupFolder: (currentPath) => ipcRenderer.invoke('dialog:selectBackupFolder', currentPath),
  selectRestoreFile: (defaultDir) => ipcRenderer.invoke('dialog:selectRestoreFile', defaultDir),
  listLocalBackups: (targetPath) => ipcRenderer.invoke('backup:listLocalBackups', targetPath),

  // Folders on backup destination
  initFolders: (targetPath) => ipcRenderer.invoke('backup:initFolders', targetPath),

  // Test destination folder existence, Windows write permissions, and BACKUP_TEST.txt verification
  testFolderAndPermissions: (targetPath) => ipcRenderer.invoke('backup:testFolderAndPermissions', targetPath),

  // Physical file verification check (exists and size > 0)
  verifyPhysicalFile: (filePath) => ipcRenderer.invoke('backup:verifyPhysicalFile', filePath),

  // Full Supabase PostgreSQL & Database Backup
  writeFullBackup: (payload) => ipcRenderer.invoke('backup:writeFullBackup', payload),
  writeBackup: (payload) => ipcRenderer.invoke('backup:writeFullBackup', payload),

  // Read Backup for Restore
  readBackup: (payload) => ipcRenderer.invoke('backup:readBackup', payload),

  // Safety restore point
  writeSafetyPoint: (payload) => ipcRenderer.invoke('backup:writeSafetyPoint', payload),

  // Open directory in Windows File Explorer
  openPath: (targetPath) => ipcRenderer.invoke('backup:openPath', targetPath),

  // Native Windows toast notification
  showNotification: (options) => ipcRenderer.invoke('backup:showNotification', options),

  // Background scheduler listener
  onSchedulerTick: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('scheduler:tick', subscription);
    return () => ipcRenderer.removeListener('scheduler:tick', subscription);
  },
});
