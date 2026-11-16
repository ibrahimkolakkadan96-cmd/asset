export const BRANCH_COUNT = 22;
export const ALL_BRANCHES = Array.from({ length: BRANCH_COUNT }, (_, i) => i + 1);
export const ALL_LOCATIONS = [0, ...ALL_BRANCHES]; // 0 = Central Office, 1..22 = Branches

export function formatBranchLabel(branchNumber: number | null | undefined): string {
  if (branchNumber === null || branchNumber === undefined) return 'All Locations';
  if (branchNumber === 0) return 'Central Office';
  return `Branch ${branchNumber}`;
}

export const STANDARD_ACCESSORIES = [
  'Keyboard',
  'Mouse',
  'Mouse Pad',
  'Monitor',
  'VGA Cable',
  'HDMI Cable',
  'DP Cable',
  'LAN Cable',
  'UPS',
  'Landline Phone',
];

export type UserRole = 'admin' | 'branch_manager' | 'viewer';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  assignedBranch: number | null; // null = all 22 branches (admin)
  department: string;
  avatarUrl?: string;
  lastLoginAt: string;
}

// -------------------------------------------------------------
// 1. IT System Management (Desktop / PC)
// -------------------------------------------------------------
export interface ITSystem {
  id: string;
  branchNumber: number; // Branch 1 to 22
  systemName: string; // e.g. "BR01-PC-01"
  processor: string; // e.g. "Intel Core i5-12400"
  ram: string; // e.g. "16GB DDR4"
  ssd: string; // e.g. "512GB NVMe SSD"
  windowsVersion: string; // e.g. "Windows 11 Pro 64-bit"
  assignedStaffName: string; // e.g. "John Doe (Branch Accountant)"
  remarks: string;
  status?: 'Active' | 'Under Repair' | 'Spare / Standby' | 'Returned';
  generation?: string;
  storageType?: string;
  storageCapacity?: string;
  serialNumber?: string;
  issueDate?: string;
  returnDate?: string | null;
  updatedAt: string;
}

// -------------------------------------------------------------
// 2. Printer Cartridge Management
// -------------------------------------------------------------
export interface PrinterModel {
  id: string;
  brand: string; // e.g. "HP", "Canon", "Brother", "Epson"
  modelName: string; // e.g. "LaserJet Pro MFP M428fdw"
  printerType?: string;
  supportedCartridges?: string[]; // Cartridge IDs or model names
  cartridgeCompatibility?: string[];
  remarks: string;
  createdAt: string;
}

export interface CartridgeModel {
  id: string;
  printerModelId?: string;
  printerModel?: string;
  printerModelName?: string; // e.g. "HP LaserJet Pro M428fdw"
  cartridgeModel: string; // e.g. "HP 59A (CF259A)"
  color?: string; // "Black", "Cyan", "Magenta", "Yellow"
  pageYield?: number; // e.g. 3000 pages
  currentStock?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  storageLocation?: string;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartridgeBranchStock {
  id: string;
  cartridgeId: string;
  cartridgeModel: string;
  printerModelName?: string;
  branchNumber: number; // Branch 1 to 22
  currentStock: number;
  minimumStockLevel: number; // Default = 2
  maximumStockLevel: number;
  storageLocation: string; // e.g. "Branch 1 IT Room Shelf 2"
  remarks: string;
  updatedAt: string;
}

export interface CartridgeTransaction {
  id: string;
  cartridgeId: string;
  cartridgeModel: string;
  branchNumber: number;
  type: 'IN' | 'OUT' | 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  transactionDate: string; // YYYY-MM-DD
  performedBy: string; // Staff/Admin name
  referenceInvoiceNo?: string;
  remarks: string;
  createdAt: string;
}

// -------------------------------------------------------------
// 3. IT Accessories Management
// -------------------------------------------------------------
export interface ITAccessoryCategory {
  id: string;
  name: string; // Keyboard, Mouse, Monitor, VGA Cable, HDMI Cable, UPS, Landline Phone, etc.
}

export interface ITAccessoryItem {
  id: string;
  name?: string;
  accessoryName?: string;
  category?: string;
  model: string;
  brand: string;
  quantity?: number;
  minimumStock: number; // default 2
  currentStock: number; // available
  branchNumber?: number; // Branch 1-22
  branch?: number;
  storageLocation: string;
  remarks: string;
  updatedAt: string;
}

export interface AccessoryTransaction {
  id: string;
  accessoryId: string;
  accessoryName: string;
  model?: string;
  branchNumber?: number;
  type: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
  fromBranch?: number;
  toBranch?: number;
  date?: string;
  issueDate?: string;
  receivedBy: string;
  issuedBy: string;
  referenceNo?: string;
  remarks: string;
  createdAt?: string;
}

// -------------------------------------------------------------
// 4. Mobile Asset Management
// -------------------------------------------------------------
export type MobileStatus = 'Assigned' | 'Available / In Stock' | 'Under Repair' | 'Decommissioned' | 'Available';

export interface MobileAsset {
  id: string;
  brand?: string;
  mobileBrand?: string;
  model?: string;
  mobileModel?: string;
  imei1: string; // unique
  imei2?: string;
  serialNumber: string;
  assignedStaffName?: string;
  staffName?: string;
  branchNumber: number; // Branch 1 to 22
  assignedDate: string; // YYYY-MM-DD
  status?: MobileStatus;
  mobileStatus?: MobileStatus;
  remarks: string;
  updatedAt: string;
}

export interface MobileAssignmentHistory {
  id: string;
  mobileId: string;
  imei1?: string;
  mobileModel?: string;
  action?: 'ASSIGN' | 'TRANSFER' | 'RETURN';
  fromBranch?: number;
  toBranch?: number;
  branchNumber?: number;
  staffName: string;
  assignedDate?: string;
  returnedDate?: string | null;
  date?: string;
  remarks: string;
}

// -------------------------------------------------------------
// 5. Company Laptop Management
// -------------------------------------------------------------
export type LaptopStatus = 'Assigned' | 'Available / In Stock' | 'Under Maintenance' | 'Decommissioned' | 'In Pool' | 'Retired';

export interface CompanyLaptop {
  id: string;
  brand?: string;
  laptopBrand?: string;
  model?: string;
  laptopModel?: string;
  serialNumber: string; // unique
  processor: string;
  ram: string;
  ssd: string;
  windowsVersion: string;
  assignedStaffName?: string;
  staffName?: string;
  branchNumber: number; // Branch 1 to 22
  assignedDate: string; // YYYY-MM-DD
  status?: LaptopStatus;
  laptopStatus?: LaptopStatus;
  remarks: string;
  updatedAt: string;
}

export interface LaptopAssignmentHistory {
  id: string;
  laptopId: string;
  serialNumber?: string;
  laptopModel?: string;
  action?: 'ASSIGN' | 'TRANSFER' | 'RETURN';
  fromBranch?: number;
  toBranch?: number;
  branchNumber?: number;
  staffName: string;
  assignedDate?: string;
  returnedDate?: string | null;
  date?: string;
  remarks: string;
}

// -------------------------------------------------------------
// 6. Custom Asset Management (Dynamic Admin Fields)
// -------------------------------------------------------------
export interface CustomFieldDefinition {
  id: string;
  name: string; // e.g. "MAC Address", "IP Address", "Warranty Expiry"
  type: 'text' | 'number' | 'date';
  required?: boolean;
}

export type CustomAssetField = CustomFieldDefinition;

export interface CustomAssetCategory {
  id: string;
  name: string; // e.g. "Barcode Scanners", "Receipt Printers", "Network Switches", "CCTV Cameras"
  description?: string;
  customFields: CustomFieldDefinition[];
  createdAt: string;
}

export interface CustomAssetItem {
  id: string;
  name?: string;
  assetName?: string;
  categoryId: string;
  categoryName: string;
  modelName?: string;
  brand?: string;
  serialNumber?: string;
  branchNumber: number; // Branch 1-22
  assignedStaff?: string;
  status: 'Active' | 'In Stock' | 'Maintenance' | 'Retired' | 'In Use' | 'Available' | 'Under Maintenance';
  customFieldValues?: Record<string, any>;
  customValues?: Record<string, string>;
  remarks: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// 7. General Asset Movement & Audit Logs
// -------------------------------------------------------------
export interface AssetAuditLog {
  id: string;
  timestamp: string;
  module?: 'SYSTEMS' | 'PRINTERS' | 'ACCESSORIES' | 'MOBILES' | 'LAPTOPS' | 'CUSTOM' | 'BACKUP';
  action: string;
  assetName?: string;
  branchNumber?: number;
  performedBy: string;
  details: string;
  itemType?: string;
}

// -------------------------------------------------------------
// 8. Low Stock Alert Types
// -------------------------------------------------------------
export interface LowStockAlertItem {
  id: string;
  itemType: 'Cartridge' | 'Accessory';
  type: 'CARTRIDGE' | 'ACCESSORY';
  itemName: string;
  title: string;
  model: string;
  branchNumber: number;
  branchName: string;
  currentStock: number;
  minimumStock: number;
  isZeroStock: boolean;
  modelOrPart: string;
  location: string;
}

// -------------------------------------------------------------
// 9. Backward Compatibility Legacy Types
// -------------------------------------------------------------
export type SystemStatus = 'Active' | 'Returned' | 'Under Repair' | 'Spare / Standby';
export type StorageType = 'SSD' | 'HDD' | 'SSD + HDD';
export type TransactionType = 'IN' | 'OUT' | 'TRANSFER';

export interface SystemAsset {
  id: string;
  branchNumber: number;
  systemName: string;
  generation?: string;
  processor: string;
  ram: string;
  storageType?: StorageType;
  storageCapacity?: string;
  ssd?: string;
  windowsVersion: string;
  serialNumber?: string;
  assignedStaffName?: string;
  issueDate?: string;
  returnDate?: string | null;
  status: SystemStatus;
  remarks?: string;
  updatedAt?: string;
}

export interface AccessoryStock {
  id: string;
  branchNumber: number;
  accessoryName: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  availableStock: number;
  lastTransactionDate?: string;
  remarks?: string;
  updatedAt?: string;
}

export interface StockTransaction {
  id: string;
  transactionDate: string;
  branchNumber: number;
  accessoryName: string;
  type: TransactionType;
  quantity: number;
  issuedToOrFrom: string;
  referenceNo?: string;
  remarks?: string;
  createdAt: string;
}

export interface BranchSummary {
  branchNumber: number;
  branchName?: string;
  totalSystems: number;
  activeSystems: number;
  underRepairSystems?: number;
  returnedSystems?: number;
  totalAccessoriesStock?: number;
  totalAccessories?: number;
  lowStockItemsCount: number;
  accessoryBreakdown?: Record<string, number>;
}

// -------------------------------------------------------------
// 10. External SSD & Backup Types
// -------------------------------------------------------------
export interface DriveInfo {
  letter: string;
  label: string;
  type:
    | 'External SSD'
    | 'External HDD'
    | 'USB Drive'
    | 'Fixed Drive'
    | 'Linked Local/External Folder'
    | 'Web Browser Mode'
    | 'Unknown';
  totalBytes: number;
  freeBytes: number;
  totalFormatted: string;
  freeFormatted: string;
  usedPercentage: number;
  isConnected: boolean;
  isExternalSSD: boolean;
  fileSystem: string;
}

export interface BackupScheduleConfig {
  frequency: 'daily' | 'weekly' | 'manual';
  dailyTime: string;
  weeklyDay: number;
  backupOnStartupIfMissed: boolean;
  notifyOnComplete: boolean;
  targetDrive: string;
  targetPath: string;
  retentionDays: number;
  lastBackupTime: string | null;
  nextBackupTime: string | null;
}

export interface SupabaseTableInfo {
  name: string;
  rowCount: number;
  description: string;
  primaryKey: string;
  columnsCount: number;
  hasForeignKeys: boolean;
  branchFilterSupport: boolean;
}

export interface SupabaseStorageFile {
  id: string;
  name: string;
  bucket: string;
  size: number;
  sizeFormatted?: string;
  mimeType: string;
  createdAt: string;
  url?: string;
}

export interface SupabaseConnectionState {
  status: 'connected' | 'connecting' | 'offline' | 'error';
  projectUrl: string;
  latencyMs: number;
  host: string;
  databaseName: string;
  activeTablesCount: number;
  sslEnabled: boolean;
  lastChecked: string;
  errorMessage?: string;
}

export interface ExternalSSDTestResult {
  success: boolean;
  step?: 'FOLDER_DETECTION' | 'WRITE_PERMISSION' | 'FILE_CREATION' | 'FILE_VERIFICATION' | 'COMPLETE';
  folderPath: string;
  folderExists: boolean;
  canWrite: boolean;
  testFileCreated: boolean;
  testFilePath: string;
  testFileContentVerified: boolean;
  testFileSize: number;
  testFileSizeFormatted: string;
  timestamp: string;
  driveInfo?: DriveInfo;
  error?: string;
  detailedLogs: string[];
}

export interface BackupManifest {
  id: string;
  timestamp: string;
  formattedDate: string;
  projectName: string;
  projectId: string;
  databaseId: string;
  dumpFileName: string;
  sqlFileName: string;
  schemaFileName: string;
  totalBranches: number;
  tablesIncluded: string[];
  counts: {
    systems: number;
    accessories: number;
    cartridges?: number;
    laptops?: number;
    mobiles?: number;
    customAssets?: number;
    transactions: number;
    storageFiles: number;
  };
  fileSize: number;
  fileSizeFormatted: string;
  sha256: string;
  status: 'completed' | 'failed' | 'verifying';
  backupPath: string;
  exportMethod:
    | 'Supabase-PostgreSQL-pg_dump'
    | 'Supabase-PostgreSQL-Full-Export'
    | 'PostgreSQL-Full-Dump'
    | 'Firestore-Managed-GCS-Export'
    | 'JSON-File-Import';
  integrityVerified: boolean;
  notes?: string;
}

export interface RestoreRecord {
  id: string;
  timestamp: string;
  formattedDate: string;
  sourceBackupId: string;
  safetyRestorePointId: string;
  databaseType: 'Supabase-PostgreSQL';
  restoredCounts: {
    systems: number;
    accessories: number;
    transactions: number;
    laptops?: number;
    mobiles?: number;
    cartridges?: number;
    storageFiles?: number;
  };
  restoredTables: string[];
  status: 'success' | 'failed';
  verifiedIntegrity: boolean;
  restoredBy: string;
}

export interface BackupAuditLog {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  details?: string;
}
