import type {
  BackupManifest,
  BackupScheduleConfig,
  DriveInfo,
  ExternalSSDTestResult,
} from './index';

export interface ElectronDesktopAPI {
  isDesktop: boolean;
  platform: string;
  version: string;
  getDesktopInfo: () => Promise<{
    isDesktop: boolean;
    appVersion: string;
    electronVersion: string;
    platform: string;
    arch: string;
    hostname: string;
  }>;
  getBackupSettings: () => Promise<Partial<BackupScheduleConfig> | null>;
  saveBackupSettings: (settings: Partial<BackupScheduleConfig>) => Promise<Partial<BackupScheduleConfig>>;
  getDriveInfo: (driveLetterOrPayload: string | { driveLetter: string; targetPath?: string }) => Promise<DriveInfo>;
  selectBackupFolder: (currentPath?: string) => Promise<{
    canceled: boolean;
    path: string | null;
    error?: string;
  }>;
  selectRestoreFile: (defaultDir?: string) => Promise<{
    canceled: boolean;
    filePath?: string;
    fileName?: string;
    content?: string;
  }>;
  listLocalBackups: (targetPath?: string) => Promise<BackupManifest[]>;
  initFolders: (targetPath?: string) => Promise<{
    success: boolean;
    foldersCreated: string[];
    error?: string;
  }>;
  testFolderAndPermissions: (targetPath?: string) => Promise<ExternalSSDTestResult>;
  verifyPhysicalFile: (filePath: string) => Promise<{
    exists: boolean;
    size: number;
    sizeFormatted?: string;
    isNonZero?: boolean;
    error?: string;
  }>;
  writeFullBackup: (payload: Record<string, unknown>) => Promise<{
    success: boolean;
    physicallyVerified?: boolean;
    rootBackupFile?: string;
    rootDumpFile?: string;
    dumpPath?: string;
    sqlPath?: string;
    schemaPath?: string;
    verifiedFileSize?: number;
    verifiedFileSizeFormatted?: string;
  }>;
  writeBackup: (payload: Record<string, unknown>) => Promise<unknown>;
  readBackup: (payload: string | { backupId: string; targetPath?: string }) => Promise<unknown>;
  writeSafetyPoint: (payload: {
    targetPath?: string;
    safetyPointId: string;
    data: unknown;
  }) => Promise<{ success: boolean; path: string }>;
  openPath: (targetPath?: string) => Promise<boolean>;
  showNotification: (options: { title: string; body: string }) => Promise<boolean>;
  onSchedulerTick: (
    callback: (data: { timestamp: string; targetPath: string; isConnected: boolean }) => void
  ) => () => void;
}

declare global {
  interface Window {
    electronDesktop?: ElectronDesktopAPI;
  }
}
