import { getSupabaseClient } from './supabase';
import {
  ITSystem,
  PrinterModel,
  CartridgeModel,
  CartridgeBranchStock,
  CartridgeTransaction,
  ITAccessoryCategory,
  ITAccessoryItem,
  AccessoryTransaction,
  MobileAsset,
  MobileAssignmentHistory,
  CompanyLaptop,
  LaptopAssignmentHistory,
  CustomAssetCategory,
  CustomAssetItem,
  CustomFieldDefinition,
  AssetAuditLog,
  STANDARD_ACCESSORIES,
} from '../types';

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUuid(id?: string): boolean {
  return !!id && UUID_REGEX.test(id);
}

// Parse custom category description + embedded schema fields safely
function encodeCategoryDescription(desc: string | undefined, fields: CustomFieldDefinition[]): string {
  const cleanDesc = (desc || '').trim();
  if (!fields || fields.length === 0) return cleanDesc;
  return `${cleanDesc}\n__FIELDS__:${JSON.stringify(fields)}`;
}

function decodeCategoryDescription(raw?: string | null): { description: string; customFields: CustomFieldDefinition[] } {
  if (!raw) return { description: '', customFields: [] };
  const marker = '\n__FIELDS__:';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    // Also support raw starting with __FIELDS__:
    if (raw.startsWith('__FIELDS__:')) {
      try {
        return { description: '', customFields: JSON.parse(raw.slice('__FIELDS__:'.length)) };
      } catch {
        return { description: raw, customFields: [] };
      }
    }
    return { description: raw, customFields: [] };
  }
  const desc = raw.slice(0, idx);
  try {
    const fields = JSON.parse(raw.slice(idx + marker.length));
    return { description: desc, customFields: Array.isArray(fields) ? fields : [] };
  } catch {
    return { description: desc, customFields: [] };
  }
}

export interface CentralDatabaseSnapshot {
  systems: ITSystem[];
  printerModels: PrinterModel[];
  cartridgeModels: CartridgeModel[];
  cartridgeStock: CartridgeBranchStock[];
  cartridgeTransactions: CartridgeTransaction[];
  accessoryCategories: ITAccessoryCategory[];
  accessoryItems: ITAccessoryItem[];
  accessoryTransactions: AccessoryTransaction[];
  mobileAssets: MobileAsset[];
  mobileHistory: MobileAssignmentHistory[];
  laptops: CompanyLaptop[];
  laptopHistory: LaptopAssignmentHistory[];
  customCategories: CustomAssetCategory[];
  customAssets: CustomAssetItem[];
  auditLogs: AssetAuditLog[];
  tableCounts: Record<string, number>;
}

export function formatSupabaseError(err: any): string {
  if (!err) return 'Unknown Supabase database error.';
  const msg = err.message || String(err);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
    return 'Network error: Unable to reach Supabase Cloud. Check internet connectivity.';
  }
  if (err.code === '42501' || msg.toLowerCase().includes('row-level security')) {
    return 'Database access blocked by Supabase Row Level Security (RLS). Please sign in with an authorized Supabase Auth email & password or verify table RLS policies.';
  }
  if (err.code === '23505') {
    return `Duplicate record rejected by database constraint: ${err.details || msg}`;
  }
  return msg;
}

export async function fetchAllCentralData(): Promise<{
  success: boolean;
  data?: CentralDatabaseSnapshot;
  error?: string;
  isNetworkError?: boolean;
  isRlsOrAuthIssue?: boolean;
}> {
  const supabase = getSupabaseClient();

  try {
    const [
      sysRes,
      prnRes,
      cartModRes,
      cartStkRes,
      cartTxRes,
      accRes,
      accTxRes,
      mobRes,
      lapRes,
      custCatRes,
      custAssRes,
      auditRes,
    ] = await Promise.all([
      supabase.from('it_systems').select('*').order('updated_at', { ascending: false }),
      supabase.from('printer_models').select('*').order('created_at', { ascending: false }),
      supabase.from('cartridge_models').select('*').order('created_at', { ascending: false }),
      supabase.from('cartridge_stock').select('*').order('updated_at', { ascending: false }),
      supabase.from('cartridge_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('it_accessories').select('*').order('updated_at', { ascending: false }),
      supabase.from('accessory_transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('mobile_assets').select('*').order('updated_at', { ascending: false }),
      supabase.from('laptop_assets').select('*').order('updated_at', { ascending: false }),
      supabase.from('custom_asset_categories').select('*').order('created_at', { ascending: false }),
      supabase.from('custom_assets').select('*').order('updated_at', { ascending: false }),
      supabase.from('asset_audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    const firstErr =
      sysRes.error ||
      prnRes.error ||
      cartModRes.error ||
      cartStkRes.error ||
      cartTxRes.error ||
      accRes.error ||
      accTxRes.error ||
      mobRes.error ||
      lapRes.error ||
      custCatRes.error ||
      custAssRes.error ||
      auditRes.error;

    if (firstErr) {
      const formatted = formatSupabaseError(firstErr);
      const isNet = formatted.includes('Network error');
      const isRls = firstErr.code === '42501' || firstErr.code === 'PGRST301';
      return { success: false, error: formatted, isNetworkError: isNet, isRlsOrAuthIssue: isRls };
    }

    const prnRows = prnRes.data || [];
    const printerMap = new Map<string, any>(prnRows.map((p: any) => [p.id, p]));

    const printerModels: PrinterModel[] = prnRows.map((p: any) => ({
      id: p.id,
      brand: p.brand || 'HP',
      modelName: p.model_name || '',
      remarks: '',
      createdAt: p.created_at || new Date().toISOString(),
    }));

    const cartModRows = cartModRes.data || [];
    const cartridgeMap = new Map<string, any>(cartModRows.map((c: any) => [c.id, c]));

    const cartridgeModels: CartridgeModel[] = cartModRows.map((c: any) => {
      const linkedPrinter = c.printer_model_id ? printerMap.get(c.printer_model_id) : null;
      return {
        id: c.id,
        printerModelId: c.printer_model_id || undefined,
        printerModel: linkedPrinter ? `${linkedPrinter.brand} ${linkedPrinter.model_name}` : '',
        printerModelName: linkedPrinter ? linkedPrinter.model_name : '',
        cartridgeModel: c.cartridge_model || '',
        minimumStockLevel: c.min_stock_level ?? 2,
        maximumStockLevel: c.max_stock_level ?? 20,
        storageLocation: c.storage_location || 'Central IT Store',
        remarks: c.remarks || '',
        createdAt: c.created_at,
        updatedAt: c.updated_at || c.created_at,
      };
    });

    const cartStkRows = cartStkRes.data || [];
    const cartridgeStock: CartridgeBranchStock[] = cartStkRows.map((s: any) => {
      const mod = cartridgeMap.get(s.cartridge_model_id);
      const linkedPrinter = mod?.printer_model_id ? printerMap.get(mod.printer_model_id) : null;
      return {
        id: s.id,
        cartridgeId: s.cartridge_model_id,
        cartridgeModel: mod?.cartridge_model || 'Cartridge',
        printerModelName: linkedPrinter?.model_name || '',
        branchNumber: s.branch_number ?? 0,
        currentStock: s.current_stock ?? 0,
        minimumStockLevel: mod?.min_stock_level ?? 2,
        maximumStockLevel: mod?.max_stock_level ?? 20,
        storageLocation: mod?.storage_location || 'IT Store',
        remarks: mod?.remarks || '',
        updatedAt: s.updated_at || new Date().toISOString(),
      };
    });

    const cartridgeTransactions: CartridgeTransaction[] = (cartTxRes.data || []).map((t: any) => {
      const mod = cartridgeMap.get(t.cartridge_model_id);
      const rawType = String(t.transaction_type || 'IN').toUpperCase();
      const normType: CartridgeTransaction['type'] =
        rawType === 'STOCK_OUT' || rawType === 'OUT' ? 'OUT' : 'IN';
      return {
        id: t.id,
        cartridgeId: t.cartridge_model_id,
        cartridgeModel: mod?.cartridge_model || 'Cartridge',
        branchNumber: t.branch_number ?? 0,
        type: normType,
        quantity: t.quantity ?? 0,
        transactionDate: (t.created_at || new Date().toISOString()).split('T')[0],
        performedBy: t.performed_by || 'System',
        remarks: t.remarks || '',
        createdAt: t.created_at || new Date().toISOString(),
      };
    });

    const systems: ITSystem[] = (sysRes.data || []).map((s: any) => ({
      id: s.id,
      branchNumber: s.branch_number ?? 0,
      systemName: s.system_name || '',
      processor: s.processor || '',
      ram: s.ram || '',
      ssd: s.ssd || '',
      windowsVersion: s.windows_version || 'Windows 11 Pro',
      assignedStaffName: s.assigned_staff_name || 'Unassigned',
      remarks: s.remarks || '',
      status: 'Active',
      updatedAt: s.updated_at || s.created_at || new Date().toISOString(),
    }));

    const accRows = accRes.data || [];
    const accMap = new Map<string, any>(accRows.map((a: any) => [a.id, a]));
    const accessoryItems: ITAccessoryItem[] = accRows.map((a: any) => ({
      id: a.id,
      name: a.accessory_name || '',
      accessoryName: a.accessory_name || '',
      category: a.accessory_name || 'General',
      brand: a.brand || '',
      model: a.model || '',
      branchNumber: a.branch_number ?? 0,
      branch: a.branch_number ?? 0,
      quantity: a.quantity ?? 0,
      currentStock: a.quantity ?? 0,
      minimumStock: a.min_stock ?? 2,
      storageLocation: a.storage_location || 'IT Store',
      remarks: a.remarks || '',
      updatedAt: a.updated_at || a.created_at || new Date().toISOString(),
    }));

    const categoryNames = new Set<string>(STANDARD_ACCESSORIES);
    accessoryItems.forEach((a) => {
      if (a.accessoryName) categoryNames.add(a.accessoryName);
    });
    const accessoryCategories: ITAccessoryCategory[] = Array.from(categoryNames).map((name, i) => ({
      id: `cat-${i + 1}`,
      name,
    }));

    const accessoryTransactions: AccessoryTransaction[] = (accTxRes.data || []).map((t: any) => {
      const acc = accMap.get(t.accessory_id);
      const rawType = String(t.transaction_type || 'IN').toUpperCase();
      const normType: AccessoryTransaction['type'] =
        rawType === 'TRANSFER' ? 'TRANSFER' : rawType === 'OUT' ? 'OUT' : 'IN';
      return {
        id: t.id,
        accessoryId: t.accessory_id,
        accessoryName: acc?.accessory_name || 'Accessory',
        model: acc?.model || '',
        branchNumber: t.to_branch ?? t.from_branch ?? 0,
        type: normType,
        quantity: t.quantity ?? 0,
        fromBranch: t.from_branch ?? undefined,
        toBranch: t.to_branch ?? undefined,
        issueDate: (t.created_at || new Date().toISOString()).split('T')[0],
        receivedBy: t.received_by || '',
        issuedBy: t.issued_by || '',
        remarks: t.remarks || '',
        createdAt: t.created_at || new Date().toISOString(),
      };
    });

    const mobileAssets: MobileAsset[] = (mobRes.data || []).map((m: any) => ({
      id: m.id,
      brand: m.mobile_brand || '',
      mobileBrand: m.mobile_brand || '',
      model: m.mobile_model || '',
      mobileModel: m.mobile_model || '',
      imei1: m.imei_1 || '',
      imei2: m.imei_2 || '',
      serialNumber: m.serial_number || '',
      assignedStaffName: m.staff_name || '',
      staffName: m.staff_name || '',
      branchNumber: m.branch_number ?? 0,
      assignedDate: m.assigned_date || (m.created_at || new Date().toISOString()).split('T')[0],
      status: m.mobile_status || 'Assigned',
      mobileStatus: m.mobile_status || 'Assigned',
      remarks: m.remarks || '',
      updatedAt: m.updated_at || m.created_at || new Date().toISOString(),
    }));

    const laptops: CompanyLaptop[] = (lapRes.data || []).map((l: any) => ({
      id: l.id,
      brand: l.laptop_brand || '',
      laptopBrand: l.laptop_brand || '',
      model: l.laptop_model || '',
      laptopModel: l.laptop_model || '',
      serialNumber: l.serial_number || '',
      processor: l.processor || '',
      ram: l.ram || '',
      ssd: l.ssd || '',
      windowsVersion: l.windows_version || 'Windows 11 Pro',
      assignedStaffName: l.staff_name || '',
      staffName: l.staff_name || '',
      branchNumber: l.branch_number ?? 0,
      assignedDate: l.assigned_date || (l.created_at || new Date().toISOString()).split('T')[0],
      status: l.laptop_status || 'Assigned',
      laptopStatus: l.laptop_status || 'Assigned',
      remarks: l.remarks || '',
      updatedAt: l.updated_at || l.created_at || new Date().toISOString(),
    }));

    const custCatRows = custCatRes.data || [];
    const custCatMap = new Map<string, any>(custCatRows.map((c: any) => [c.id, c]));
    const customCategories: CustomAssetCategory[] = custCatRows.map((c: any) => {
      const decoded = decodeCategoryDescription(c.description);
      return {
        id: c.id,
        name: c.category_name || '',
        description: decoded.description,
        customFields: decoded.customFields,
        createdAt: c.created_at || new Date().toISOString(),
      };
    });

    const customAssets: CustomAssetItem[] = (custAssRes.data || []).map((ca: any) => {
      const cat = custCatMap.get(ca.category_id);
      const cf = ca.custom_fields && typeof ca.custom_fields === 'object' ? ca.custom_fields : {};
      return {
        id: ca.id,
        name: ca.asset_name || '',
        assetName: ca.asset_name || '',
        categoryId: ca.category_id,
        categoryName: cat?.category_name || 'Custom Asset',
        branchNumber: ca.branch_number ?? 0,
        serialNumber: cf.__serialNumber || '',
        status: cf.__status || 'Active',
        customFieldValues: cf,
        customValues: cf,
        remarks: ca.remarks || '',
        updatedAt: ca.updated_at || ca.created_at || new Date().toISOString(),
      };
    });

    const auditRows = auditRes.data || [];
    const auditLogs: AssetAuditLog[] = auditRows.map((a: any) => ({
      id: a.id,
      timestamp: a.created_at || new Date().toISOString(),
      module: (a.module_name || 'SYSTEMS') as AssetAuditLog['module'],
      action: a.action || 'UPDATE',
      assetName: a.asset_id || '',
      performedBy: a.performed_by || 'Authorized User',
      details: a.details || '',
    }));

    // Derive Mobile and Laptop history from asset_audit_logs
    const mobileHistory: MobileAssignmentHistory[] = auditRows
      .filter((a: any) => a.module_name === 'MOBILES' && (a.action === 'CREATE' || a.action === 'TRANSFER'))
      .map((a: any) => ({
        id: `mhist-${a.id}`,
        mobileId: a.asset_id || '',
        mobileModel: a.asset_id || 'Mobile Device',
        action: a.action === 'TRANSFER' ? 'TRANSFER' : 'ASSIGN',
        staffName: a.performed_by || 'Staff',
        date: (a.created_at || new Date().toISOString()).split('T')[0],
        remarks: a.details || '',
      }));

    const laptopHistory: LaptopAssignmentHistory[] = auditRows
      .filter((a: any) => a.module_name === 'LAPTOPS' && (a.action === 'CREATE' || a.action === 'TRANSFER'))
      .map((a: any) => ({
        id: `lhist-${a.id}`,
        laptopId: a.asset_id || '',
        laptopModel: a.asset_id || 'Company Laptop',
        action: a.action === 'TRANSFER' ? 'TRANSFER' : 'ASSIGN',
        staffName: a.performed_by || 'Staff',
        date: (a.created_at || new Date().toISOString()).split('T')[0],
        remarks: a.details || '',
      }));

    const tableCounts: Record<string, number> = {
      it_systems: systems.length,
      printer_models: printerModels.length,
      cartridge_models: cartridgeModels.length,
      cartridge_stock: cartridgeStock.length,
      cartridge_transactions: cartridgeTransactions.length,
      it_accessories: accessoryItems.length,
      accessory_transactions: accessoryTransactions.length,
      mobile_assets: mobileAssets.length,
      laptop_assets: laptops.length,
      custom_asset_categories: customCategories.length,
      custom_assets: customAssets.length,
      asset_audit_logs: auditLogs.length,
    };

    return {
      success: true,
      data: {
        systems,
        printerModels,
        cartridgeModels,
        cartridgeStock,
        cartridgeTransactions,
        accessoryCategories,
        accessoryItems,
        accessoryTransactions,
        mobileAssets,
        mobileHistory,
        laptops,
        laptopHistory,
        customCategories,
        customAssets,
        auditLogs,
        tableCounts,
      },
    };
  } catch (err: any) {
    const formatted = formatSupabaseError(err);
    return {
      success: false,
      error: formatted,
      isNetworkError: formatted.includes('Network error'),
    };
  }
}

export async function dbInsertAuditLog(entry: {
  id: string;
  module: string;
  action: string;
  assetName: string;
  details: string;
  performedBy: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('asset_audit_logs').insert({
    id: isValidUuid(entry.id) ? entry.id : generateUuid(),
    module_name: entry.module,
    action: entry.action,
    asset_id: entry.assetName,
    details: entry.details,
    performed_by: entry.performedBy,
    created_at: new Date().toISOString(),
  });
  if (error) console.warn('Audit log sync notice:', error.message);
}

export { encodeCategoryDescription };
