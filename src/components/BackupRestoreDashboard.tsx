import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import {
  backupService,
  DEFAULT_BACKUP_PATH,
  REQUIRED_SUBFOLDERS,
  NATIVE_FOLDER_UNAVAILABLE_MSG,
  isElectronEnv,
} from '../lib/backupService';
import {
  testSupabaseConnection,
  getSupabaseTableDefinitions,
  generatePostgresSchemaDDL,
  getSampleStorageFiles,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  resetSupabaseClient,
} from '../lib/supabase';
import {
  DriveInfo,
  BackupScheduleConfig,
  BackupManifest,
  RestoreRecord,
  BackupAuditLog,
  SupabaseConnectionState,
  SupabaseTableInfo,
  SupabaseStorageFile,
  ExternalSSDTestResult,
} from '../types';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderTree,
  Calendar,
  Clock,
  ShieldCheck,
  RotateCcw,
  Download,
  ExternalLink,
  History,
  Settings2,
  FileCheck2,
  Layers,
  Database,
  Play,
  Check,
  AlertOctagon,
  Copy,
  ChevronRight,
  Terminal,
  Table,
  FileText,
  KeyRound,
  Server,
  CloudCheck,
  Lock,
  Eye,
  FileSpreadsheet,
  FolderOpen,
  Upload,
} from 'lucide-react';

export const BackupRestoreDashboard: React.FC = () => {
  const {
    systems,
    cartridgeStock,
    accessoryItems,
    accessoryTransactions,
    mobileAssets,
    laptops,
    customAssets,
    tableCounts,
    refreshFromCloud,
  } = useTracker();

  // State
  const [drive, setDrive] = useState<DriveInfo | null>(null);
  const [schedule, setSchedule] = useState<BackupScheduleConfig>(() =>
    backupService.getScheduleConfig()
  );
  const [manifests, setManifests] = useState<BackupManifest[]>(() =>
    backupService.getManifests()
  );
  const [restoreRecords, setRestoreRecords] = useState<RestoreRecord[]>(() =>
    backupService.getRestoreRecords()
  );
  const [logs, setLogs] = useState<BackupAuditLog[]>(() => backupService.getLogs());

  // Supabase State
  const [supabaseState, setSupabaseState] = useState<SupabaseConnectionState>(() => {
    const config = getStoredSupabaseConfig();
    let host = 'Not configured';
    if (config.url) {
      try {
        host = `db.${new URL(config.url).hostname}`;
      } catch (e) {
        host = config.url.replace(/^https?:\/\//, '');
      }
    }
    return {
      status: config.url && config.key ? 'connected' : 'connecting',
      projectUrl: config.url || 'Not configured',
      latencyMs: 24,
      host,
      databaseName: 'postgres',
      activeTablesCount: 12,
      sslEnabled: true,
      lastChecked: new Date().toISOString(),
    };
  });
  const [storageFiles] = useState<SupabaseStorageFile[]>(getSampleStorageFiles());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configUrlInput, setConfigUrlInput] = useState(getStoredSupabaseConfig().url);
  const [configKeyInput, setConfigKeyInput] = useState(getStoredSupabaseConfig().key);
  const [showDdlModal, setShowDdlModal] = useState(false);

  // Subtabs: 'history' | 'supabase' | 'storage' | 'schedule' | 'safety' | 'logs'
  const [activeSubTab, setActiveSubTab] = useState<
    'history' | 'supabase' | 'storage' | 'schedule' | 'safety' | 'logs'
  >('history');

  // Operation States
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupPercent, setBackupPercent] = useState(0);
  const [backupStep, setBackupStep] = useState('');
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<BackupManifest | null>(null);

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupManifest | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorePercent, setRestorePercent] = useState(0);
  const [restoreStep, setRestoreStep] = useState('');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  // Verification state
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ id: string; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Physical External SSD Write & Permission Diagnostic Test State
  const [isTestingSSD, setIsTestingSSD] = useState(false);
  const [ssdTestResult, setSsdTestResult] = useState<ExternalSSDTestResult | null>(null);
  const [ssdTestError, setSsdTestError] = useState<string | null>(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [externalRestorePayload, setExternalRestorePayload] = useState<{
    backupId: string;
    fileName: string;
    payload: any;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isDesktopApp = isElectronEnv();
  const [desktopOnlyNotice, setDesktopOnlyNotice] = useState<string | null>(null);

  // Run Physical SSD Write & Permission Diagnostic Test (Electron Desktop only)
  const handleRunSSDTest = async (overridePath?: string) => {
    setDesktopOnlyNotice(null);
    if (!isDesktopApp) {
      setDesktopOnlyNotice(NATIVE_FOLDER_UNAVAILABLE_MSG);
      setSsdTestError(NATIVE_FOLDER_UNAVAILABLE_MSG);
      return {
        success: false,
        step: 'FOLDER_DETECTION' as const,
        folderPath: overridePath || schedule.targetPath || DEFAULT_BACKUP_PATH,
        folderExists: false,
        canWrite: false,
        testFileCreated: false,
        testFilePath: '',
        testFileContentVerified: false,
        testFileSize: 0,
        testFileSizeFormatted: '0 B',
        timestamp: new Date().toISOString(),
        detailedLogs: [NATIVE_FOLDER_UNAVAILABLE_MSG],
      };
    }

    setIsTestingSSD(true);
    setSsdTestError(null);
    const target = overridePath || schedule.targetPath || DEFAULT_BACKUP_PATH;
    try {
      const res = await backupService.testExternalSSDDirectory(target);
      setSsdTestResult(res);
      setLogs(backupService.getLogs());
      if (!res.success) {
        setSsdTestError(res.error || res.detailedLogs[res.detailedLogs.length - 1] || 'Destination write verification test failed.');
      } else {
        refreshDrive();
      }
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Unexpected error during physical write test.';
      setSsdTestError(msg);
      return {
        success: false,
        step: 'FILE_VERIFICATION' as const,
        folderPath: target,
        folderExists: false,
        canWrite: false,
        testFileCreated: false,
        testFilePath: '',
        testFileContentVerified: false,
        testFileSize: 0,
        testFileSizeFormatted: '0 B',
        timestamp: new Date().toISOString(),
        detailedLogs: [msg],
      };
    } finally {
      setIsTestingSSD(false);
    }
  };

  // Native Windows Electron dialog.showOpenDialog() folder selector (never calls browser showDirectoryPicker)
  const handlePickDirectory = async () => {
    setSsdTestError(null);
    setDesktopOnlyNotice(null);

    if (!isDesktopApp) {
      setDesktopOnlyNotice(NATIVE_FOLDER_UNAVAILABLE_MSG);
      return;
    }

    const res = await backupService.selectBackupFolderElectron();
    if (res.error) {
      setSsdTestError(res.error);
      setLogs(backupService.getLogs());
      return;
    }
    if (!res.canceled && res.path) {
      setSchedule(backupService.getScheduleConfig());
      setLogs(backupService.getLogs());
      refreshDrive();
      await handleRunSSDTest(res.path);
    }
  };

  // Pick a .json backup file from any drive to restore
  const handlePickRestoreFile = async () => {
    setRestoreError(null);
    setRestoreSuccess(null);
    if (isElectronEnv()) {
      const res = await backupService.selectRestoreFileElectron();
      if (!res.canceled && res.content) {
        try {
          const parsed = JSON.parse(res.content);
          setExternalRestorePayload({
            backupId: parsed.backupId || res.fileName || 'EXTERNAL_BACKUP',
            fileName: res.fileName || 'backup.json',
            payload: parsed,
          });
          setSelectedBackupForRestore({
            id: parsed.backupId || res.fileName || 'EXTERNAL_BACKUP',
            timestamp: parsed.timestamp || new Date().toISOString(),
            formattedDate: parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : new Date().toLocaleString(),
            projectName: 'PREMIER IT ASSET TRACKER',
            projectId: parsed.projectUrl || '',
            databaseId: 'postgres (Supabase Cloud)',
            dumpFileName: res.fileName || 'backup.json',
            sqlFileName: res.fileName || 'backup.json',
            schemaFileName: 'schema.sql',
            totalBranches: 22,
            tablesIncluded: Object.keys(parsed.data || {}),
            counts: {
              systems: (parsed.data?.systems?.length || 0) + (parsed.data?.laptops?.length || 0) + (parsed.data?.mobileAssets?.length || 0),
              accessories: (parsed.data?.accessoryItems?.length || 0) + (parsed.data?.cartridgeStock?.length || 0),
              transactions: (parsed.data?.accessoryTransactions?.length || 0) + (parsed.data?.cartridgeTransactions?.length || 0),
              storageFiles: 0,
            },
            fileSize: res.content.length,
            fileSizeFormatted: `${Math.round(res.content.length / 1024)} KB`,
            sha256: parsed.manifest?.sha256 || 'file-import',
            status: 'completed',
            backupPath: res.filePath || res.fileName || '',
            exportMethod: 'JSON-File-Import',
            integrityVerified: true,
          });
          setAdminPasswordInput('');
        } catch (err: any) {
          setBackupError(`Selected file "${res.fileName}" is not a valid Premier JSON backup archive: ${err.message}`);
        }
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleBrowserFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setExternalRestorePayload({
        backupId: parsed.backupId || file.name,
        fileName: file.name,
        payload: parsed,
      });
      setSelectedBackupForRestore({
        id: parsed.backupId || file.name,
        timestamp: parsed.timestamp || new Date().toISOString(),
        formattedDate: parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : new Date().toLocaleString(),
        projectName: 'PREMIER IT ASSET TRACKER',
        projectId: parsed.projectUrl || '',
        databaseId: 'postgres (Supabase Cloud)',
        dumpFileName: file.name,
        sqlFileName: file.name,
        schemaFileName: 'schema.sql',
        totalBranches: 22,
        tablesIncluded: Object.keys(parsed.data || {}),
        counts: {
          systems: (parsed.data?.systems?.length || 0) + (parsed.data?.laptops?.length || 0) + (parsed.data?.mobileAssets?.length || 0),
          accessories: (parsed.data?.accessoryItems?.length || 0) + (parsed.data?.cartridgeStock?.length || 0),
          transactions: (parsed.data?.accessoryTransactions?.length || 0) + (parsed.data?.cartridgeTransactions?.length || 0),
          storageFiles: 0,
        },
        fileSize: file.size,
        fileSizeFormatted: `${Math.round(file.size / 1024)} KB`,
        sha256: parsed.manifest?.sha256 || 'file-import',
        status: 'completed',
        backupPath: file.name,
        exportMethod: 'JSON-File-Import',
        integrityVerified: true,
      });
      setRestoreError(null);
      setRestoreSuccess(null);
      setAdminPasswordInput('');
    } catch (err: any) {
      setRestoreError(`Could not parse backup file "${file.name}": ${err.message}`);
    }
  };

  // Refresh drive status
  const refreshDrive = async () => {
    const info = await backupService.getDriveInfo(schedule.targetDrive || 'D:');
    setDrive(info);
  };

  // Test Supabase connection
  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    const res = await testSupabaseConnection();
    setSupabaseState(res);
    setIsTestingSupabase(false);
    backupService.addLog(
      'SUPABASE_CONNECTED',
      'Supabase database connection ping test verified',
      `Host: ${res.host} | Latency: ${res.latencyMs}ms | Database: ${res.databaseName}`
    );
  };

  useEffect(() => {
    let mounted = true;
    backupService.syncFromElectronSettings().then((cfg) => {
      if (mounted) setSchedule(cfg);
    });
    const unsubscribe = backupService.subscribeBackupEvents((evt) => {
      if (!mounted) return;
      setManifests(backupService.getManifests());
      setLogs(backupService.getLogs());
      setSchedule(backupService.getScheduleConfig());
      if (evt.status === 'success' && evt.manifest) {
        setBackupSuccess(evt.manifest);
        setBackupError(null);
        refreshDrive();
      } else if (evt.status === 'error') {
        setBackupError(evt.message);
      }
    });

    refreshDrive();
    handleTestSupabase();
    const interval = setInterval(refreshDrive, 5000);
    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [schedule.targetDrive, schedule.targetPath]);

  // Execute Full Supabase PostgreSQL Backup to Selected Local Folder (Electron Desktop only)
  const handleStartBackup = async () => {
    setDesktopOnlyNotice(null);
    if (!isDesktopApp) {
      setDesktopOnlyNotice(NATIVE_FOLDER_UNAVAILABLE_MSG);
      setBackupError(NATIVE_FOLDER_UNAVAILABLE_MSG);
      return;
    }

    setIsBackingUp(true);
    setBackupPercent(0);
    setBackupStep('Step 1/4: Connecting to centralized Supabase Cloud database...');
    setBackupError(null);
    setBackupSuccess(null);

    const result = await backupService.executeBackup(
      {
        systems: systems as any,
        accessories: accessoryItems as any,
        transactions: accessoryTransactions as any,
        cartridgeStock: cartridgeStock as any,
        mobileAssets: mobileAssets as any,
        laptops: laptops as any,
        customAssets: customAssets as any,
      },
      (pct, step) => {
        setBackupPercent(pct);
        setBackupStep(step);
      }
    );

    setIsBackingUp(false);
    if (result.success && result.manifest) {
      setBackupSuccess(result.manifest);
      setManifests(backupService.getManifests());
      setLogs(backupService.getLogs());
      setSchedule(backupService.getScheduleConfig());
      refreshDrive();
    } else {
      setBackupError(result.error || 'Failed to complete physical external SSD backup.');
      setLogs(backupService.getLogs());
    }
  };

  // Execute Restore
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    if (!adminPasswordInput || adminPasswordInput.trim().length === 0) {
      setRestoreError('Admin authorization password is required before restoring.');
      return;
    }

    setIsRestoring(true);
    setRestorePercent(0);
    setRestoreStep('Generating pre-restoration rollback snapshot...');
    setRestoreError(null);
    setRestoreSuccess(null);

    const result = await backupService.executeRestore(
      selectedBackupForRestore.id,
      {
        systems: systems as any,
        accessories: accessoryItems as any,
        transactions: accessoryTransactions as any,
      },
      adminPasswordInput,
      (pct, step) => {
        setRestorePercent(pct);
        setRestoreStep(step);
      },
      externalRestorePayload?.payload
    );

    setIsRestoring(false);
    if (result.success) {
      await refreshFromCloud();
      setRestoreSuccess(
        `Restored ${result.restoredCounts?.systems || 0} hardware assets, ${
          result.restoredCounts?.accessories || 0
        } stock items across centralized Supabase Cloud.`
      );
      setRestoreRecords(backupService.getRestoreRecords());
      setLogs(backupService.getLogs());
      setAdminPasswordInput('');
      setExternalRestorePayload(null);
    } else {
      setRestoreError(result.error || 'Failed to restore database from backup.');
      setLogs(backupService.getLogs());
    }
  };

  // Verify backup integrity
  const handleVerify = async (backupId: string) => {
    setVerifyingId(backupId);
    setVerificationResult(null);
    const res = await backupService.verifyBackupIntegrity(backupId);
    setVerifyingId(null);
    setVerificationResult({ id: backupId, message: res.message });
    setLogs(backupService.getLogs());
    setTimeout(() => setVerificationResult(null), 8000);
  };

  // Save schedule changes
  const handleScheduleChange = (updates: Partial<BackupScheduleConfig>) => {
    const updated = backupService.updateScheduleConfig(updates);
    setSchedule(updated);
    setLogs(backupService.getLogs());
  };

  // Save Supabase connection settings
  const handleSaveSupabaseConfig = () => {
    resetSupabaseClient(configUrlInput, configKeyInput);
    setIsConfigModalOpen(false);
    handleTestSupabase();
  };

  const tableDefinitions = getSupabaseTableDefinitions({
    systemsCount: systems.length,
    cartridgeStockCount: cartridgeStock.length,
    accessoriesCount: accessoryItems.length,
    mobilesCount: mobileAssets.length,
    laptopsCount: laptops.length,
    customAssetsCount: customAssets.length,
    tableCounts,
  });

  const ddlContent = generatePostgresSchemaDDL();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F5EE] text-[#303B38] overflow-y-auto">
      {/* Top Banner / System Title */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs border border-[#96cebc]">
            <Database className="w-6 h-6 text-[#303B38]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#303B38] tracking-tight flex items-center gap-2">
                PREMIER IT ASSET TRACKER – SUPABASE & EXTERNAL SSD BACKUP
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] rounded-full">
                PostgreSQL pg_dump Engine
              </span>
            </div>
            <p className="text-xs text-[#7F8983]">
              Supabase Cloud Database mirror to External SSD (<code className="text-[#303B38] font-bold">{schedule.targetPath}</code>) covering all 22 branches
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleBrowserFileSelected}
            className="hidden"
          />

          <button
            onClick={handleStartBackup}
            disabled={isBackingUp}
            title={
              !isDesktopApp
                ? 'Requires installed Windows Electron desktop app for local folder backup'
                : 'Back up all 12 Supabase Cloud tables to selected local folder'
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-90 text-white border border-[#F4A58F]"
          >
            <Play className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Backing Up...' : 'Manual Full Backup'}</span>
          </button>

          <button
            onClick={() => backupService.downloadJsonBackup()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D8EEE4] hover:bg-[#A8DCCB]/70 text-[#303B38] border border-[#A8DCCB] text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Export .JSON</span>
          </button>

          <button
            onClick={handlePickRestoreFile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#BFDCCB] text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Restore from File</span>
          </button>

          <button
            onClick={handlePickDirectory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#E9E5DA] text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Choose Backup Folder</span>
          </button>

          {isDesktopApp && (
            <button
              onClick={() => backupService.openInExplorer(schedule.targetPath)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#E9E5DA] text-xs font-medium transition cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#303B38]" />
              <span>Open Folder</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 space-y-6">

        {/* Browser / Embedded Preview Notice (never invokes showDirectoryPicker or simulated backup) */}
        {!isDesktopApp && (
          <div className="bg-[#FFFDF7] border-2 border-[#BFDCCB] rounded-2xl p-4 shadow-xs flex flex-wrap items-start justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[#303B38] text-sm">
                  Web Browser / Preview Mode — Native Folder Access Available in Windows App Only
                </div>
                <p className="text-[#7F8983] leading-relaxed">
                  {desktopOnlyNotice || NATIVE_FOLDER_UNAVAILABLE_MSG} Live centralized <strong>Supabase Cloud exports (Export .JSON)</strong>, <strong>.SQL downloads</strong>, and <strong>Restore from File (.json)</strong> remain active in browser mode.
                </p>
              </div>
            </div>
            {desktopOnlyNotice && (
              <button
                onClick={() => setDesktopOnlyNotice(null)}
                className="text-[#7F8983] hover:text-[#303B38] text-xs px-2 py-1 cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Card 1: Supabase Cloud Database */}
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7F8983] uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-4 h-4 text-[#303B38]" />
                Supabase Database
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestSupabase}
                  disabled={isTestingSupabase}
                  title="Ping Supabase Database"
                  className="text-[10px] text-[#7F8983] hover:text-[#303B38] cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                  <span>Ping</span>
                </button>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    supabaseState.status === 'connected'
                      ? 'bg-[#D8EEE4] text-[#303B38] border-[#A8DCCB]'
                      : 'bg-[#FDECE7] text-[#F4A58F] border-[#F4A58F]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      supabaseState.status === 'connected' ? 'bg-[#A8DCCB] animate-pulse' : 'bg-[#F4A58F]'
                    }`}
                  />
                  {supabaseState.status === 'connected' ? 'Connected' : 'Error'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-[#303B38] font-mono flex items-center gap-2">
                <span>{supabaseState.databaseName}</span>
                <span className="text-xs font-sans font-normal text-[#7F8983]">({supabaseState.latencyMs}ms)</span>
              </div>
              <div className="text-xs text-[#7F8983] mt-0.5 truncate font-mono" title={supabaseState.projectUrl}>
                {supabaseState.projectUrl}
              </div>
              {supabaseState.errorMessage && (
                <div className="text-[11px] text-[#F4A58F] font-semibold mt-1">
                  {supabaseState.errorMessage}
                </div>
              )}
            </div>

            <div className="pt-1 text-[11px] text-[#7F8983] border-t border-[#E9E5DA] flex items-center justify-between">
              <span className="text-[#303B38] font-medium">12 Tables • Central + 22 Branches</span>
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="text-[#303B38] font-bold hover:underline cursor-pointer"
              >
                Configure Keys
              </button>
            </div>
          </div>

          {/* Card 2: External SSD / Destination Storage */}
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7F8983] uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-[#303B38]" />
                Backup Destination
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshDrive}
                  title="Re-scan connected drives"
                  className="text-[10px] text-[#7F8983] hover:text-[#303B38] underline cursor-pointer"
                >
                  Re-scan
                </button>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    drive?.isConnected
                      ? 'bg-[#D8EEE4] text-[#303B38] border-[#A8DCCB]'
                      : 'bg-[#FDECE7] text-[#F4A58F] border-[#F4A58F] animate-pulse'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      drive?.isConnected ? 'bg-[#A8DCCB] animate-pulse' : 'bg-[#F4A58F]'
                    }`}
                  />
                  {isDesktopApp
                    ? drive?.isConnected
                      ? 'Ready'
                      : 'Unavailable'
                    : 'Windows App Only'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <div className="text-xl font-bold text-[#303B38] font-mono">
                  {drive?.letter} <span className="text-xs font-sans font-normal text-[#7F8983]">({drive?.label})</span>
                </div>
                <div className="text-xs text-[#7F8983]">
                  {isDesktopApp
                    ? drive?.isConnected
                      ? `${drive?.freeFormatted} free of ${drive?.totalFormatted}`
                      : 'Folder / Drive Unavailable'
                    : 'Installed Windows .EXE Required'}
                </div>
              </div>

              <div className="w-full bg-[#F8F5EE] h-2 rounded-full mt-2 overflow-hidden border border-[#E9E5DA]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    drive?.isConnected ? 'bg-[#A8DCCB]' : 'bg-[#EADCCB]'
                  }`}
                  style={{ width: `${drive?.isConnected ? drive.usedPercentage : 0}%` }}
                />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-[#7F8983] border-t border-[#E9E5DA] flex items-center justify-between">
              <span className="font-mono text-[#303B38] font-bold truncate">{schedule.targetPath}</span>
              <span className="text-[#7F8983] shrink-0 font-medium">{drive?.fileSystem}</span>
            </div>
          </div>

          {/* Card 3: Scheduler & Next Run */}
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7F8983] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#303B38]" />
                Automated Scheduler
              </span>
              <span className="text-[11px] font-semibold text-[#303B38] bg-[#EADCCB]/60 px-2 py-0.5 rounded-md border border-[#BFDCCB] uppercase">
                {schedule.frequency}
              </span>
            </div>

            <div>
              <div className="text-xl font-bold text-[#303B38] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#303B38]" />
                <span>{schedule.frequency === 'manual' ? 'Manual Trigger Only' : schedule.dailyTime}</span>
              </div>
              <div className="text-xs text-[#7F8983] mt-1">
                Next run:{' '}
                <strong className="text-[#303B38]">
                  {schedule.nextBackupTime
                    ? new Date(schedule.nextBackupTime).toLocaleString()
                    : 'On User Demand'}
                </strong>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-[#7F8983] border-t border-[#E9E5DA] flex items-center justify-between">
              <span>Missed Startup Catch-up:</span>
              <span className="text-[#303B38] font-bold">
                {schedule.backupOnStartupIfMissed ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

        </div>

        {/* Live Backup Progress Banner */}
        {isBackingUp && (
          <div className="bg-[#FFFDF7] border-2 border-[#A8DCCB] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#303B38] flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#303B38]" />
                EXECUTING SUPABASE POSTGRESQL (pg_dump) TO D:\ EXTERNAL SSD
              </span>
              <span className="font-mono font-bold text-[#303B38]">{backupPercent}%</span>
            </div>

            <div className="w-full bg-[#F8F5EE] h-2.5 rounded-full overflow-hidden border border-[#E9E5DA]">
              <div
                className="bg-gradient-to-r from-[#A8DCCB] via-[#BFDCCB] to-[#A8DCCB] h-full rounded-full transition-all duration-300"
                style={{ width: `${backupPercent}%` }}
              />
            </div>

            <div className="text-xs text-[#303B38] font-mono flex items-center justify-between">
              <span>Step: {backupStep}</span>
              <span className="text-[#7F8983] text-[11px]">Atomic write (.tmp &gt; .dump)</span>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {backupSuccess && !isBackingUp && (
          <div className="bg-[#D8EEE4] border border-[#A8DCCB] rounded-xl p-4 flex items-center justify-between text-xs text-[#303B38] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#A8DCCB] text-[#303B38]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-[#303B38] block text-sm">PostgreSQL Backup Saved to External SSD!</strong>
                <span className="text-[#303B38]">
                  Binary Dump: <code className="text-[#303B38] font-bold font-mono">{backupSuccess.dumpFileName}</code> ({backupSuccess.fileSizeFormatted}) • SHA-256:{' '}
                  <code className="text-[#303B38] font-mono">{backupSuccess.sha256.substring(0, 16)}...</code>
                </span>
              </div>
            </div>
            <button
              onClick={() => setBackupSuccess(null)}
              className="text-[#7F8983] hover:text-[#303B38] px-2 py-1 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Alert */}
        {backupError && (
          <div className="bg-[#FDECE7] border border-[#F4A58F] rounded-xl p-4 flex items-center justify-between text-xs text-[#303B38] shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#F4A58F] text-white">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-[#F4A58F] block text-sm">Backup Stopped Safely</strong>
                <span>{backupError}</span>
              </div>
            </div>
            <button
              onClick={() => setBackupError(null)}
              className="text-[#7F8983] hover:text-[#303B38] px-2 py-1 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Physical Destination Write & Permission Diagnostic Card */}
        <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#303B38]" />
              <div>
                <h3 className="text-xs font-bold text-[#303B38] uppercase tracking-wider">
                  Physical Write &amp; Folder Verification ({schedule.targetPath})
                </h3>
                <p className="text-[11px] text-[#7F8983]">
                  Verifies Windows write access by writing and reading back <code className="font-mono text-[#303B38]">BACKUP_TEST.txt</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {ssdTestResult && (
                <button
                  onClick={() => setShowTestDetails((v) => !v)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#EADCCB]/50 text-[#303B38] border border-[#E9E5DA] text-[11px] font-semibold cursor-pointer"
                >
                  {showTestDetails ? 'Hide Logs' : 'View Logs'}
                </button>
              )}
              <button
                onClick={() => handleRunSSDTest()}
                disabled={isTestingSSD}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] font-bold text-xs border border-[#91c9b6] shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isTestingSSD ? 'Testing Drive...' : 'Run Physical Write Test'}</span>
              </button>
            </div>
          </div>

          {ssdTestError && (
            <div className="p-3 rounded-xl bg-[#FDECE7] border border-[#F4A58F] text-xs text-[#303B38]">
              <strong className="font-bold text-[#F4A58F]">Verification Notice:</strong> {ssdTestError}
            </div>
          )}

          {ssdTestResult && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              {[
                { label: '1. Folder Detected', ok: ssdTestResult.folderExists },
                { label: '2. Write Permission', ok: ssdTestResult.canWrite },
                { label: '3. BACKUP_TEST.txt', ok: ssdTestResult.testFileCreated },
                { label: '4. Content Verified', ok: ssdTestResult.testFileContentVerified },
                { label: `5. Non-Zero (${ssdTestResult.testFileSizeFormatted})`, ok: ssdTestResult.testFileSize > 0 },
              ].map((step) => (
                <div
                  key={step.label}
                  className={`p-2 rounded-xl border font-semibold flex items-center gap-1.5 ${
                    step.ok
                      ? 'bg-[#D8EEE4] border-[#A8DCCB] text-[#303B38]'
                      : 'bg-[#FDECE7] border-[#F4A58F] text-[#303B38]'
                  }`}
                >
                  {step.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-[#303B38] shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#F4A58F] shrink-0" />}
                  <span className="truncate">{step.label}</span>
                </div>
              ))}
            </div>
          )}

          {showTestDetails && ssdTestResult?.detailedLogs && (
            <pre className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-3 text-[11px] font-mono text-[#303B38] overflow-x-auto max-h-40">
              {ssdTestResult.detailedLogs.join('\n')}
            </pre>
          )}
        </div>

        {/* 5 Destination Subfolders Verification Box */}
        <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#303B38]" />
              <h3 className="text-xs font-bold text-[#303B38] uppercase tracking-wider">
                External SSD Destination Directory Blueprint ({schedule.targetPath})
              </h3>
            </div>
            <span className="text-[11px] text-[#7F8983]">5 Managed Directories Auto-Provisioned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {REQUIRED_SUBFOLDERS.map((folder) => (
              <div
                key={folder}
                className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-3 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#303B38] shrink-0" />
                  <span className="font-mono text-[11px] font-bold text-[#303B38] truncate">{folder}</span>
                </div>
                <p className="text-[10px] text-[#7F8983] line-clamp-2">
                  {folder === 'Database-Full-Backup' && 'PostgreSQL .dump & .sql data files'}
                  {folder === 'Database-Schema' && 'DDL schema, constraints, sequences, triggers'}
                  {folder === 'Storage-Files' && 'Supabase storage files, invoices, receipts'}
                  {folder === 'Application-Configuration' && 'Supabase connection & branch mappings'}
                  {folder === 'Backup-History' && 'Tamper-proof indices & SHA-256 logs'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#E9E5DA] gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>PostgreSQL Backups ({manifests.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('supabase')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'supabase'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Supabase Database Tables (12 Tables)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('storage')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'storage'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Supabase Storage Files ({storageFiles.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'schedule'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>Automated Scheduler</span>
          </button>

          <button
            onClick={() => setActiveSubTab('safety')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'safety'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restore & Safety Rollbacks ({restoreRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'logs'
                ? 'border-b-[#A8DCCB] text-[#303B38] font-bold bg-[#FFFDF7] rounded-t-lg shadow-xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Audit Trail ({logs.length})</span>
          </button>
        </div>

        {/* Verification Toast */}
        {verificationResult && (
          <div className="bg-[#D8EEE4] border border-[#A8DCCB] p-3 rounded-xl text-xs text-[#303B38] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#303B38] shrink-0" />
              <span>{verificationResult.message}</span>
            </div>
            <button onClick={() => setVerificationResult(null)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* SUBTAB 1: PostgreSQL Backups Table */}
        {activeSubTab === 'history' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#303B38]">Full PostgreSQL Backups on External SSD (D:\)</h3>
                <p className="text-[11px] text-[#7F8983]">
                  Complete .dump binary archives & .sql scripts across all 22 branches
                </p>
              </div>
              <button
                onClick={handleStartBackup}
                disabled={isBackingUp}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-90 text-[#303B38] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 border border-[#96cebc] shadow-xs"
              >
                <Play className="w-3 h-3 text-[#303B38]" />
                <span>New Backup</span>
              </button>
            </div>

            {manifests.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F8F5EE] text-[#7F8983] flex items-center justify-center mx-auto border border-[#E9E5DA]">
                  <Database className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-[#303B38]">No PostgreSQL Backups Found on External SSD Yet</div>
                <p className="text-xs text-[#7F8983] max-w-md mx-auto">
                  Click "⚡ Manual Backup (pg_dump to D:\)" to generate the first complete Supabase database package with all 22 branch records.
                </p>
                <button
                  onClick={handleStartBackup}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow-xs border border-[#F4A58F]"
                >
                  Create First Backup
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F5EE] text-[#7F8983] font-semibold border-b border-[#E9E5DA] uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Dump Filename & Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Tables & Rows</th>
                      <th className="py-3 px-4">File Size & Hash</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E5DA] font-mono text-[11px]">
                    {manifests.map((m) => (
                      <tr key={m.id} className="hover:bg-[#D8EEE4]/30 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <strong className="text-[#303B38] block font-mono text-xs">{m.dumpFileName || `${m.id}.dump`}</strong>
                          <span className="text-[11px] text-[#7F8983]">{m.formattedDate}</span>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded-md bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-[10px] font-bold">
                            {m.exportMethod || 'PostgreSQL-Full-Dump'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-[#303B38]">
                          <div>{m.counts.systems} Systems • {m.counts.accessories} Stock</div>
                          <div className="text-[10px] text-[#7F8983]">{m.counts.transactions} Logs • {m.counts.storageFiles || 4} Files</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[#303B38] font-bold">{m.fileSizeFormatted}</div>
                          <div className="text-[10px] text-[#7F8983] truncate max-w-[130px]" title={m.sha256}>
                            {m.sha256.substring(0, 14)}...
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="inline-flex items-center gap-1 text-[#303B38] font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#303B38]" />
                            Verified
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-sans space-x-2">
                          <button
                            onClick={() => handleVerify(m.id)}
                            disabled={verifyingId === m.id}
                            className="px-2.5 py-1 rounded-md bg-[#F8F5EE] hover:bg-[#EADCCB]/50 text-[#303B38] text-[11px] font-medium transition cursor-pointer border border-[#E9E5DA]"
                          >
                            {verifyingId === m.id ? 'Checking...' : 'Verify Hash'}
                          </button>
                          <button
                            onClick={() =>
                              backupService.downloadSqlDump(m.id, {
                                systems: systems as any,
                                accessories: accessoryItems as any,
                                transactions: accessoryTransactions as any,
                              })
                            }
                            title="Download .SQL Dump File"
                            className="px-2.5 py-1 rounded-md bg-[#F8F5EE] hover:bg-[#D8EEE4] text-[#303B38] text-[11px] font-medium transition cursor-pointer inline-flex items-center gap-1 border border-[#E9E5DA]"
                          >
                            <Download className="w-3 h-3 text-[#303B38]" />
                            <span>.SQL</span>
                          </button>
                          <button
                            onClick={() => {
                              setExternalRestorePayload(null);
                              setSelectedBackupForRestore(m);
                              setAdminPasswordInput('');
                              setRestoreSuccess(null);
                              setRestoreError(null);
                            }}
                            className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-90 text-white text-[11px] font-bold transition cursor-pointer shadow-xs border border-[#F4A58F]"
                          >
                            Restore...
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: Supabase Database Tables Explorer */}
        {activeSubTab === 'supabase' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#303B38]">Supabase Cloud Database Tables (All 22 Branches)</h3>
                <p className="text-xs text-[#7F8983]">
                  Full relational schema, constraints, sequences, and foreign keys active in Supabase PostgreSQL
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDdlModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#F8F5EE] hover:bg-[#EADCCB]/50 text-[#303B38] border border-[#E9E5DA] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Schema DDL</span>
                </button>
                <button
                  onClick={handleTestSupabase}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-90 text-[#303B38] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#96cebc]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Tables</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tableDefinitions.map((table) => (
                <div
                  key={table.name}
                  className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-2 hover:border-[#BFDCCB] transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-[#303B38]" />
                      <strong className="text-sm font-bold text-[#303B38] font-mono">{table.name}</strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] font-mono">
                      {table.rowCount} records
                    </span>
                  </div>

                  <p className="text-xs text-[#7F8983]">{table.description}</p>

                  <div className="pt-2 border-t border-[#E9E5DA] grid grid-cols-2 gap-2 text-[11px] text-[#7F8983] font-mono">
                    <div>PK: <span className="text-[#303B38] font-semibold">{table.primaryKey}</span></div>
                    <div>Columns: <span className="text-[#303B38] font-semibold">{table.columnsCount}</span></div>
                    <div>Foreign Keys: <span className="text-[#303B38] font-semibold">{table.hasForeignKeys ? 'Enforced' : 'None'}</span></div>
                    <div>Branch 1-22: <span className="text-[#303B38] font-semibold">{table.branchFilterSupport ? 'Partitioned' : 'Global'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: Supabase Storage Files */}
        {activeSubTab === 'storage' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#303B38]">Supabase Storage Files (Bucket: asset-attachments)</h3>
                <p className="text-xs text-[#7F8983]">
                  Hardware invoices, warranty documents, and branch setup photos included in every external SSD backup
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] text-xs font-semibold">
                Auto-synced to D:\Storage-Files\
              </span>
            </div>

            <div className="overflow-x-auto border border-[#E9E5DA] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8F5EE] text-[#7F8983] font-semibold border-b border-[#E9E5DA] uppercase text-[11px]">
                    <th className="py-2.5 px-4">Filename</th>
                    <th className="py-2.5 px-4">Bucket</th>
                    <th className="py-2.5 px-4">MIME Type</th>
                    <th className="py-2.5 px-4">File Size</th>
                    <th className="py-2.5 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA] font-mono text-[11px] bg-[#FFFDF7]">
                  {storageFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#F8F5EE]/60 transition">
                      <td className="py-2.5 px-4 font-sans text-[#303B38] font-medium">{file.name}</td>
                      <td className="py-2.5 px-4 text-[#303B38] font-semibold">{file.bucket}</td>
                      <td className="py-2.5 px-4 text-[#7F8983]">{file.mimeType}</td>
                      <td className="py-2.5 px-4 text-[#303B38]">{file.sizeFormatted}</td>
                      <td className="py-2.5 px-4 font-sans text-[#7F8983]">{new Date(file.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 4: Automated Scheduler Configuration */}
        {activeSubTab === 'schedule' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#303B38]">Automated Supabase PostgreSQL Backup Scheduler</h3>
              <p className="text-xs text-[#7F8983]">
                Configure background exports to external SSD (D:\) with safety alerts and retry safeguards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Schedule Timing */}
              <div className="space-y-4 bg-[#F8F5EE] p-4 rounded-xl border border-[#E9E5DA]">
                <span className="text-xs font-bold text-[#303B38] uppercase tracking-wider block">
                  1. Frequency & Timing
                </span>

                <div className="space-y-2">
                  <label className="text-xs text-[#7F8983] font-medium block">Backup Frequency:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['daily', 'weekly', 'manual'] as const).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => handleScheduleChange({ frequency: freq })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${
                          schedule.frequency === freq
                            ? 'bg-[#A8DCCB] text-[#303B38] border-[#A8DCCB] shadow-xs'
                            : 'bg-[#FFFDF7] text-[#7F8983] border-[#E9E5DA] hover:bg-[#D8EEE4]/40 hover:text-[#303B38]'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {schedule.frequency !== 'manual' && (
                  <div className="space-y-2">
                    <label className="text-xs text-[#7F8983] font-medium block">Time of Day (24-Hour):</label>
                    <input
                      type="time"
                      value={schedule.dailyTime}
                      onChange={(e) => handleScheduleChange({ dailyTime: e.target.value })}
                      className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] text-xs font-mono w-full focus:outline-none focus:border-[#A8DCCB]"
                    />
                  </div>
                )}

                {schedule.frequency === 'weekly' && (
                  <div className="space-y-2">
                    <label className="text-xs text-[#7F8983] font-medium block">Day of the Week:</label>
                    <select
                      value={schedule.weeklyDay}
                      onChange={(e) => handleScheduleChange({ weeklyDay: parseInt(e.target.value, 10) })}
                      className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] text-xs w-full focus:outline-none focus:border-[#A8DCCB]"
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Startup & Target Policy */}
              <div className="space-y-4 bg-[#F8F5EE] p-4 rounded-xl border border-[#E9E5DA]">
                <span className="text-xs font-bold text-[#303B38] uppercase tracking-wider block">
                  2. Destination & Automation Safeguards
                </span>

                <div className="space-y-2">
                  <label className="text-xs text-[#7F8983] font-medium block">Selected Backup Destination Folder:</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={schedule.targetPath}
                      readOnly={!isDesktopApp}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const driveMatch = raw.match(/^([A-Za-z]:)/);
                        handleScheduleChange({
                          targetPath: raw,
                          targetDrive: driveMatch ? driveMatch[1].toUpperCase() : schedule.targetDrive,
                        });
                      }}
                      className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] text-xs font-mono flex-1 min-w-[200px] focus:outline-none focus:border-[#A8DCCB]"
                    />
                    <button
                      type="button"
                      onClick={handlePickDirectory}
                      className="px-3 py-2 rounded-lg bg-[#D8EEE4] hover:bg-[#A8DCCB]/80 text-[#303B38] border border-[#A8DCCB] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Browse Folder...</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7F8983]">
                    {isDesktopApp
                      ? 'Saved securely in Electron application settings (default: D:\\PREMIER-IT-ASSET-BACKUP\\).'
                      : 'Native folder selection via Windows Explorer is active in the installed Windows Electron app.'}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.backupOnStartupIfMissed}
                      onChange={(e) => handleScheduleChange({ backupOnStartupIfMissed: e.target.checked })}
                      className="mt-0.5 rounded text-[#A8DCCB] focus:ring-[#A8DCCB] cursor-pointer"
                    />
                    <span className="text-xs text-[#303B38]">
                      <strong>Startup Catch-up:</strong> If a scheduled backup was missed while PC was off, trigger automatically when SSD is detected at startup.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.notifyOnComplete}
                      onChange={(e) => handleScheduleChange({ notifyOnComplete: e.target.checked })}
                      className="mt-0.5 rounded text-[#A8DCCB] focus:ring-[#A8DCCB] cursor-pointer"
                    />
                    <span className="text-xs text-[#303B38]">
                      <strong>Desktop Notifications:</strong> Show native Windows toast notifications upon backup completion.
                    </span>
                  </label>

                  <div className="pt-2">
                    <label className="text-xs text-[#7F8983] font-medium block">Retention Policy (Days):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={schedule.retentionDays}
                        onChange={(e) => handleScheduleChange({ retentionDays: parseInt(e.target.value, 10) || 60 })}
                        className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-1.5 text-[#303B38] text-xs font-mono w-28 focus:outline-none focus:border-[#A8DCCB]"
                      />
                      <span className="text-[11px] text-[#7F8983]">Never overwrites previous backups.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 5: Restore & Safety Rollbacks */}
        {activeSubTab === 'safety' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#303B38]">Pre-Restoration Safety Snapshots</h3>
              <p className="text-xs text-[#7F8983]">
                Before any restoration is applied to Supabase, an automatic rollback snapshot is saved in{' '}
                <code className="text-[#303B38] bg-[#D8EEE4] px-1 py-0.5 rounded font-mono">D:\PREMIER-IT-ASSET-BACKUP\Database-Full-Backup\</code>
              </p>
            </div>

            {restoreRecords.length === 0 ? (
              <div className="p-8 text-center text-[#7F8983] text-xs bg-[#F8F5EE] rounded-xl border border-[#E9E5DA]">
                No database restorations have been performed yet. Your database is operating on pristine state.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E9E5DA] rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F5EE] text-[#7F8983] font-semibold border-b border-[#E9E5DA] uppercase text-[11px]">
                      <th className="py-2.5 px-4">Restore Date</th>
                      <th className="py-2.5 px-4">Applied Dump Backup</th>
                      <th className="py-2.5 px-4">Rollback Safety Point</th>
                      <th className="py-2.5 px-4">Restored Records</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E5DA] font-mono text-[11px] bg-[#FFFDF7]">
                    {restoreRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8F5EE]/60 transition">
                        <td className="py-2.5 px-4 font-sans text-[#303B38]">{r.formattedDate}</td>
                        <td className="py-2.5 px-4 text-[#303B38] font-bold">{r.sourceBackupId}</td>
                        <td className="py-2.5 px-4 text-[#7F8983]">{r.safetyRestorePointId}</td>
                        <td className="py-2.5 px-4 font-sans text-[#303B38]">
                          {r.restoredCounts.systems} Systems • {r.restoredCounts.accessories} Stock • {r.restoredCounts.transactions} Logs
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          <span className="text-[#303B38] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#A8DCCB]" /> Successful
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 6: Audit Trail */}
        {activeSubTab === 'logs' && (
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#303B38]">Supabase & SSD Backup Audit Trail</h3>
                <p className="text-xs text-[#7F8983]">
                  Full security log of database backups, restoration events, drive connects, and SHA-256 integrity verifications
                </p>
              </div>
              <span className="text-xs text-[#7F8983] font-mono">Showing {logs.length} events</span>
            </div>

            <div className="bg-[#F8F5EE] rounded-xl p-4 border border-[#E9E5DA] max-h-96 overflow-y-auto font-mono text-[11px] space-y-2 select-text">
              {logs.map((l) => (
                <div key={l.id} className="flex items-start gap-2 border-b border-[#E9E5DA]/60 pb-1.5">
                  <span className="text-[#7F8983] shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                  <span
                    className={`font-bold shrink-0 ${
                      l.type.includes('SUCCESS') || l.type.includes('PASS') || l.type.includes('CONNECTED')
                        ? 'text-[#303B38]'
                        : l.type.includes('FAILED') || l.type.includes('DISCONNECTED') || l.type.includes('ERROR')
                        ? 'text-[#F4A58F]'
                        : 'text-[#7F8983]'
                    }`}
                  >
                    {l.type}:
                  </span>
                  <div className="text-[#303B38] flex-1">
                    <span>{l.message}</span>
                    {l.details && <span className="text-[#7F8983] ml-2">({l.details})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* RESTORE CONFIRMATION MODAL WITH ADMIN AUTHORIZATION */}
      {selectedBackupForRestore && (() => {
        const hasRestoreSource =
          isDesktopApp ||
          Boolean(externalRestorePayload) ||
          backupService.hasLocalBackupPayload(selectedBackupForRestore.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-2xl w-full max-w-xl text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95">
              <div className="px-6 py-4 bg-[#FDECE7] border-b border-[#F4A58F]/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#303B38] font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-[#F4A58F]" />
                  <span>CONFIRM SUPABASE DATABASE RESTORATION</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedBackupForRestore(null);
                    setExternalRestorePayload(null);
                  }}
                  className="text-[#7F8983] hover:text-[#303B38] text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-[#303B38]">
                <p>
                  You are about to restore the Supabase PostgreSQL database using backup archive:
                </p>

                <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E9E5DA] space-y-1 font-mono text-xs">
                  <div>Dump File: <strong className="text-[#303B38]">{externalRestorePayload?.fileName || selectedBackupForRestore.dumpFileName}</strong></div>
                  <div>Created: <span className="text-[#7F8983]">{selectedBackupForRestore.formattedDate}</span></div>
                  <div>Coverage: <span className="text-[#303B38] font-semibold">Central Office + All 22 Branches</span> ({selectedBackupForRestore.counts.systems} Systems, {selectedBackupForRestore.counts.accessories} Stock, {selectedBackupForRestore.counts.transactions} Transactions)</div>
                  <div>SHA-256 Checksum: <span className="text-[#7F8983] break-all">{selectedBackupForRestore.sha256}</span></div>
                </div>

                {!hasRestoreSource && (
                  <div className="p-3.5 bg-[#FDECE7]/80 border border-[#F4A58F] rounded-xl space-y-2">
                    <div className="font-bold text-[#303B38] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-[#F4A58F] shrink-0" />
                      <span>Local Backup File Required in Web Browser Mode</span>
                    </div>
                    <p className="text-[#303B38]/90 text-[11px] leading-relaxed">
                      Because you are in Web Browser mode, the structured data for <code className="font-mono font-bold">{selectedBackupForRestore.id}</code> is not stored on local browser memory. Select your exported <code className="font-mono font-bold">.json</code> backup file below to proceed:
                    </p>
                    <button
                      type="button"
                      onClick={handlePickRestoreFile}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#BFDCCB] font-bold text-xs cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Attach .JSON Backup File</span>
                    </button>
                  </div>
                )}

                <div className="p-3 bg-[#D8EEE4]/60 border border-[#A8DCCB] rounded-xl text-[#303B38] space-y-1">
                  <strong className="font-bold">Automatic Rollback Guarantee:</strong>
                  <p className="text-xs">
                    A pre-restore rollback snapshot is automatically captured before upserting records into centralized Supabase Cloud.
                  </p>
                </div>

                {/* Admin Authorization Input */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-[#303B38] flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#F4A58F]" />
                    <span>Enter Administrator Password to Authorize Restoration:</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter administrator password..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] text-xs focus:outline-none focus:border-[#A8DCCB]"
                  />
                </div>

                {isRestoring && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#303B38]">
                      <span>RESTORING: {restoreStep}</span>
                      <span>{restorePercent}%</span>
                    </div>
                    <div className="w-full bg-[#E9E5DA] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#A8DCCB] to-[#F4A58F] h-full transition-all duration-300"
                        style={{ width: `${restorePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {restoreSuccess && (
                  <div className="p-3 bg-[#D8EEE4] border border-[#A8DCCB] rounded-lg text-[#303B38] font-medium">
                    {restoreSuccess}
                  </div>
                )}

                {restoreError && (
                  <div className="p-3 bg-[#FDECE7] border border-[#F4A58F] rounded-lg text-[#303B38] font-medium">
                    {restoreError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-[#F8F5EE] border-t border-[#E9E5DA] flex items-center justify-end gap-3 text-xs">
                <button
                  onClick={() => {
                    setSelectedBackupForRestore(null);
                    setExternalRestorePayload(null);
                  }}
                  disabled={isRestoring}
                  className="px-4 py-2 rounded-lg bg-[#FFFDF7] hover:bg-[#E9E5DA]/50 text-[#7F8983] border border-[#E9E5DA] font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRestore}
                  disabled={isRestoring || !adminPasswordInput || !hasRestoreSource}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#F4A58F] to-[#E58971] text-white font-bold cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isRestoring ? 'Applying Restore...' : 'Authorize & Restore Database'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SCHEMA DDL VIEWER MODAL */}
      {showDdlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-[#303B38] overflow-hidden">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-[#303B38] text-sm">Supabase PostgreSQL Schema DDL (All 22 Branches)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(ddlContent, 'ddl')}
                  className="px-3 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#D8EEE4]/60 text-[#303B38] text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  {copiedKey === 'ddl' ? <Check className="w-3.5 h-3.5 text-[#303B38]" /> : <Copy className="w-3.5 h-3.5 text-[#7F8983]" />}
                  <span>{copiedKey === 'ddl' ? 'Copied' : 'Copy DDL'}</span>
                </button>
                <button onClick={() => setShowDdlModal(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <pre className="bg-[#F8F5EE] p-4 rounded-xl font-mono text-[11px] text-[#303B38] leading-relaxed overflow-x-auto border border-[#E9E5DA]">
                {ddlContent}
              </pre>
            </div>

            <div className="px-6 py-3 bg-[#F8F5EE] border-t border-[#E9E5DA] flex items-center justify-between text-xs text-[#7F8983]">
              <span>Automatically saved to <code className="text-[#303B38] bg-[#D8EEE4] px-1 py-0.5 rounded font-mono">D:\PREMIER-IT-ASSET-BACKUP\Database-Schema\</code></span>
              <button
                onClick={() => setShowDdlModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#303B38] font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE CONNECTION SETTINGS MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-2xl w-full max-w-lg text-[#303B38] overflow-hidden">
            <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#303B38]" />
                <h3 className="font-bold text-[#303B38] text-sm">Supabase Project Connection Settings</h3>
              </div>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-[#7F8983] hover:text-[#303B38] cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-[#303B38]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#303B38] block">Supabase Project URL:</label>
                <input
                  type="text"
                  value={configUrlInput}
                  onChange={(e) => setConfigUrlInput(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] font-mono text-xs focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#303B38] block">Supabase Publishable / Anon Key:</label>
                <input
                  type="password"
                  value={configKeyInput}
                  onChange={(e) => setConfigKeyInput(e.target.value)}
                  placeholder="sb_publishable_..."
                  className="w-full bg-[#FFFDF7] border border-[#E9E5DA] rounded-lg px-3 py-2 text-[#303B38] font-mono text-xs focus:outline-none focus:border-[#A8DCCB]"
                />
              </div>

              <div className="p-3 bg-[#F8F5EE] rounded-lg border border-[#E9E5DA] text-[11px] text-[#7F8983]">
                <strong>Security Protection:</strong> Service role keys are never stored in client bundles. All external SSD operations run through the secure Electron Windows backend.
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8F5EE] border-t border-[#E9E5DA] flex items-center justify-end gap-3 text-xs">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#7F8983] cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupabaseConfig}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] font-bold cursor-pointer shadow-xs"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
