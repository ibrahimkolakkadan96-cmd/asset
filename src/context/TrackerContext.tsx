import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  AssetAuditLog,
  LowStockAlertItem,
  SystemAsset,
  AccessoryStock,
  StockTransaction,
  STANDARD_ACCESSORIES,
} from '../types';

export type { LowStockAlertItem };
import { getSupabaseClient } from '../lib/supabase';
import {
  fetchAllCentralData,
  generateUuid,
  isValidUuid,
  formatSupabaseError,
  encodeCategoryDescription,
  dbInsertAuditLog,
} from '../lib/supabaseSync';
import { useAuth } from './AuthContext';

export type ActiveModule =
  | 'dashboard'
  | 'systems'
  | 'printers'
  | 'accessories'
  | 'mobiles'
  | 'laptops'
  | 'custom'
  | 'branches'
  | 'backup';

interface TrackerContextType {
  // Navigation & Branch Filter
  activeTab: ActiveModule;
  setActiveTab: (tab: ActiveModule) => void;
  selectedBranch: number | null; // null = all locations, 0 = Central Office, 1-22 = Branches
  setSelectedBranch: (b: number | null) => void;

  // 1. IT Systems
  systems: ITSystem[];
  addSystem: (item: Omit<ITSystem, 'id' | 'updatedAt'>) => Promise<void>;
  updateSystem: (id: string, updates: Partial<ITSystem>) => Promise<void>;
  deleteSystem: (id: string) => Promise<void>;

  // 2. Printer Cartridges
  printerModels: PrinterModel[];
  cartridgeModels: CartridgeModel[];
  cartridgeStock: CartridgeBranchStock[];
  cartridgeTransactions: CartridgeTransaction[];
  addPrinterModel: (model: Omit<PrinterModel, 'id' | 'createdAt'>) => Promise<void>;
  updatePrinterModel: (id: string, updates: Partial<PrinterModel>) => Promise<void>;
  deletePrinterModel: (id: string) => Promise<{ success: boolean; error?: string }>;
  addCartridgeModel: (cart: Omit<CartridgeModel, 'id' | 'updatedAt'>) => Promise<void>;
  updateCartridgeModel: (id: string, updates: Partial<CartridgeModel>) => Promise<void>;
  deleteCartridgeModel: (id: string) => Promise<{ success: boolean; error?: string }>;
  cartridgeStockIn: (params: {
    cartridgeId: string;
    branchNumber: number;
    quantity: number;
    performedBy: string;
    remarks: string;
    referenceInvoiceNo?: string;
  }) => Promise<void>;
  cartridgeStockOut: (params: {
    cartridgeId: string;
    branchNumber: number;
    quantity: number;
    performedBy: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateCartridgeMinStock: (cartridgeId: string, branchNumber: number, newMin: number) => Promise<void>;

  // 3. IT Accessories
  accessoryCategories: ITAccessoryCategory[];
  accessoryItems: ITAccessoryItem[];
  accessoryTransactions: AccessoryTransaction[];
  addAccessoryCategory: (name: string) => Promise<void>;
  addAccessoryItem: (item: Omit<ITAccessoryItem, 'id' | 'updatedAt'>) => Promise<void>;
  updateAccessoryItem: (id: string, updates: Partial<ITAccessoryItem>) => Promise<void>;
  deleteAccessoryItem: (id: string) => Promise<void>;
  accessoryStockIn: (params: {
    accessoryId: string;
    branchNumber: number;
    quantity: number;
    receivedBy: string;
    issuedBy: string;
    remarks: string;
  }) => Promise<void>;
  accessoryStockOut: (params: {
    accessoryId: string;
    branchNumber: number;
    quantity: number;
    receivedBy: string;
    issuedBy: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;
  accessoryTransfer: (params: {
    accessoryId: string;
    fromBranch: number;
    toBranch: number;
    quantity: number;
    issuedBy: string;
    receivedBy: string;
    remarks: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // 4. Mobile Assets
  mobileAssets: MobileAsset[];
  mobileHistory: MobileAssignmentHistory[];
  addMobileAsset: (mob: Omit<MobileAsset, 'id' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateMobileAsset: (id: string, updates: Partial<MobileAsset>) => Promise<{ success: boolean; error?: string }>;
  deleteMobileAsset: (id: string) => Promise<void>;
  transferMobileAsset: (params: {
    mobileId: string;
    toBranch: number;
    newStaffName: string;
    remarks: string;
  }) => Promise<void>;

  // 5. Company Laptops
  laptops: CompanyLaptop[];
  laptopHistory: LaptopAssignmentHistory[];
  addLaptop: (lap: Omit<CompanyLaptop, 'id' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateLaptop: (id: string, updates: Partial<CompanyLaptop>) => Promise<void>;
  deleteLaptop: (id: string) => Promise<void>;
  transferLaptop: (params: {
    laptopId: string;
    toBranch: number;
    newStaffName: string;
    remarks: string;
  }) => Promise<void>;

  // 6. Custom Assets
  customCategories: CustomAssetCategory[];
  customAssets: CustomAssetItem[];
  addCustomCategory: (cat: Omit<CustomAssetCategory, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomCategory: (id: string, updates: Partial<CustomAssetCategory>) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;
  addCustomAsset: (asset: Omit<CustomAssetItem, 'id' | 'updatedAt'>) => Promise<void>;
  updateCustomAsset: (id: string, updates: Partial<CustomAssetItem>) => Promise<void>;
  deleteCustomAsset: (id: string) => Promise<void>;

  // Audit Logs, Alerts & Centralized Cloud Status
  auditLogs: AssetAuditLog[];
  lowStockAlerts: LowStockAlertItem[];
  dismissedAlerts: string[];
  dismissAlert: (alertId: string) => void;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  syncError: string | null;
  clearSyncError: () => void;
  isLoadingData: boolean;
  isOnline: boolean;
  lastSaved: Date | null;
  tableCounts: Record<string, number>;
  refreshFromCloud: () => Promise<void>;
  resetAllData: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
  importFromExcel: (
    systems: SystemAsset[],
    accessories: AccessoryStock[],
    transactions: StockTransaction[]
  ) => Promise<void>;
  selectedCellFormula?: { cell: string; formula: string; value: string } | null;
  setSelectedCellFormula?: (info: { cell: string; formula: string; value: string } | null) => void;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveModule>('dashboard');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedCellFormula, setSelectedCellFormula] = useState<{
    cell: string;
    formula: string;
    value: string;
  } | null>(null);

  // Live centralized state (sourced directly from Supabase Cloud)
  const [systems, setSystems] = useState<ITSystem[]>([]);
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);
  const [cartridgeModels, setCartridgeModels] = useState<CartridgeModel[]>([]);
  const [cartridgeStock, setCartridgeStock] = useState<CartridgeBranchStock[]>([]);
  const [cartridgeTransactions, setCartridgeTransactions] = useState<CartridgeTransaction[]>([]);
  const [accessoryCategories, setAccessoryCategories] = useState<ITAccessoryCategory[]>(
    STANDARD_ACCESSORIES.map((name, i) => ({ id: `cat-${i + 1}`, name }))
  );
  const [accessoryItems, setAccessoryItems] = useState<ITAccessoryItem[]>([]);
  const [accessoryTransactions, setAccessoryTransactions] = useState<AccessoryTransaction[]>([]);
  const [mobileAssets, setMobileAssets] = useState<MobileAsset[]>([]);
  const [mobileHistory, setMobileHistory] = useState<MobileAssignmentHistory[]>([]);
  const [laptops, setLaptops] = useState<CompanyLaptop[]>([]);
  const [laptopHistory, setLaptopHistory] = useState<LaptopAssignmentHistory[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomAssetCategory[]>([]);
  const [customAssets, setCustomAssets] = useState<CustomAssetItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AssetAuditLog[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const actorName = currentUser?.displayName || currentUser?.username || 'Authorized Administrator';
  const isFetchingRef = useRef(false);

  // Fetch all 12 tables from centralized Supabase Cloud
  const refreshFromCloud = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setSyncStatus('offline');
      setSyncError('No internet connection detected. Waiting to reconnect to Supabase Cloud...');
      setIsLoadingData(false);
      return;
    }

    isFetchingRef.current = true;
    setSyncStatus('syncing');

    try {
      const result = await fetchAllCentralData();
      if (result.success && result.data) {
        const d = result.data;
        setSystems(d.systems);
        setPrinterModels(d.printerModels);
        setCartridgeModels(d.cartridgeModels);
        setCartridgeStock(d.cartridgeStock);
        setCartridgeTransactions(d.cartridgeTransactions);
        setAccessoryCategories(d.accessoryCategories);
        setAccessoryItems(d.accessoryItems);
        setAccessoryTransactions(d.accessoryTransactions);
        setMobileAssets(d.mobileAssets);
        setMobileHistory(d.mobileHistory);
        setLaptops(d.laptops);
        setLaptopHistory(d.laptopHistory);
        setCustomCategories(d.customCategories);
        setCustomAssets(d.customAssets);
        setAuditLogs(d.auditLogs);
        setTableCounts(d.tableCounts);
        setSyncStatus('synced');
        setSyncError(null);
        setLastSaved(new Date());
      } else {
        setSyncStatus(result.isNetworkError ? 'offline' : 'error');
        setSyncError(result.error || 'Failed to synchronize with Supabase Cloud database.');
      }
    } catch (err: any) {
      setSyncStatus('offline');
      setSyncError(formatSupabaseError(err));
    } finally {
      isFetchingRef.current = false;
      setIsLoadingData(false);
    }
  }, []);

  // Initial load + reload on authentication change
  useEffect(() => {
    refreshFromCloud();
  }, [isAuthenticated, refreshFromCloud]);

  // Internet online/offline listeners + automatic reconnect every 15s when offline/error
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncError(null);
      refreshFromCloud();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      setSyncError('Internet connection lost. Changes paused until connection to Supabase Cloud returns.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const retryTimer = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        if (syncStatus === 'offline' || syncStatus === 'error') {
          refreshFromCloud();
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(retryTimer);
    };
  }, [syncStatus, refreshFromCloud]);

  // Real-time multi-PC synchronization via Supabase Realtime postgres_changes
  useEffect(() => {
    if (!isAuthenticated) return;
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch {
      return;
    }

    const tables = [
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
    ];

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase.channel('premier-central-sync');
    tables.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          refreshFromCloud();
        }, 400);
      });
    });

    channel.subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, refreshFromCloud]);

  // Audit helper (persists to Supabase asset_audit_logs + updates state)
  const recordAudit = async (
    module: AssetAuditLog['module'],
    action: AssetAuditLog['action'],
    assetName: string,
    details: string,
    branchNumber?: number
  ) => {
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    const entry: AssetAuditLog = {
      id,
      timestamp: nowIso,
      module,
      action,
      assetName,
      branchNumber,
      performedBy: actorName,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 199)]);
    await dbInsertAuditLog({
      id,
      module: module || 'SYSTEMS',
      action,
      assetName,
      details,
      performedBy: actorName,
    });
  };

  // Helper to mark sync error cleanly
  const handleWriteError = (err: any, fallbackContext: string): string => {
    const formatted = formatSupabaseError(err);
    const fullMsg = `${fallbackContext}: ${formatted}`;
    setSyncStatus(formatted.includes('Network error') ? 'offline' : 'error');
    setSyncError(fullMsg);
    return fullMsg;
  };

  const markSynced = () => {
    setSyncStatus('synced');
    setSyncError(null);
    setLastSaved(new Date());
  };

  // Compute Low Stock & Zero Stock Alerts
  const lowStockAlerts = useMemo<LowStockAlertItem[]>(() => {
    const alerts: LowStockAlertItem[] = [];

    cartridgeStock.forEach((cs) => {
      if (cs.currentStock <= cs.minimumStockLevel) {
        alerts.push({
          id: `alert-cart-${cs.id}`,
          itemType: 'Cartridge',
          type: 'CARTRIDGE',
          itemName: cs.cartridgeModel,
          title: `Cartridge: ${cs.cartridgeModel}`,
          model: cs.cartridgeModel,
          modelOrPart: cs.cartridgeModel,
          branchNumber: cs.branchNumber,
          branchName: cs.branchNumber === 0 ? 'Central Office' : `Branch ${cs.branchNumber}`,
          currentStock: cs.currentStock,
          minimumStock: cs.minimumStockLevel,
          isZeroStock: cs.currentStock <= 0,
          location: cs.storageLocation || `Branch ${cs.branchNumber}`,
        });
      }
    });

    accessoryItems.forEach((acc) => {
      if (acc.currentStock <= acc.minimumStock) {
        const bNum = acc.branchNumber ?? acc.branch ?? 0;
        const name = acc.accessoryName || acc.name || 'Accessory';
        alerts.push({
          id: `alert-acc-${acc.id}`,
          itemType: 'Accessory',
          type: 'ACCESSORY',
          itemName: name,
          title: `Accessory: ${name}`,
          model: acc.model || name,
          modelOrPart: acc.model || name,
          branchNumber: bNum,
          branchName: bNum === 0 ? 'Central Office' : `Branch ${bNum}`,
          currentStock: acc.currentStock,
          minimumStock: acc.minimumStock,
          isZeroStock: acc.currentStock <= 0,
          location: acc.storageLocation || `Branch ${bNum}`,
        });
      }
    });

    return alerts.sort((a, b) => a.currentStock - b.currentStock);
  }, [cartridgeStock, accessoryItems]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => [...prev, alertId]);
  };

  // -------------------------------------------------------------
  // 1. IT Systems Management Actions (Supabase: it_systems)
  // -------------------------------------------------------------
  const addSystem = async (item: Omit<ITSystem, 'id' | 'updatedAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const { error } = await supabase.from('it_systems').insert({
      id,
      branch_number: item.branchNumber,
      system_name: item.systemName,
      processor: item.processor,
      ram: item.ram,
      ssd: item.ssd,
      windows_version: item.windowsVersion,
      assigned_staff_name: item.assignedStaffName || 'Unassigned',
      remarks: item.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to save IT System to Supabase');
      return;
    }

    const newSystem: ITSystem = { ...item, id, updatedAt: nowIso };
    setSystems((prev) => [newSystem, ...prev]);
    markSynced();
    await recordAudit(
      'SYSTEMS',
      'CREATE',
      newSystem.systemName,
      `Added PC workstation assigned to ${newSystem.assignedStaffName}`,
      newSystem.branchNumber
    );
  };

  const updateSystem = async (id: string, updates: Partial<ITSystem>) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const dbPayload: Record<string, any> = { updated_at: nowIso };
    if (updates.branchNumber !== undefined) dbPayload.branch_number = updates.branchNumber;
    if (updates.systemName !== undefined) dbPayload.system_name = updates.systemName;
    if (updates.processor !== undefined) dbPayload.processor = updates.processor;
    if (updates.ram !== undefined) dbPayload.ram = updates.ram;
    if (updates.ssd !== undefined) dbPayload.ssd = updates.ssd;
    if (updates.windowsVersion !== undefined) dbPayload.windows_version = updates.windowsVersion;
    if (updates.assignedStaffName !== undefined) dbPayload.assigned_staff_name = updates.assignedStaffName;
    if (updates.remarks !== undefined) dbPayload.remarks = updates.remarks;

    const { error } = await supabase.from('it_systems').update(dbPayload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update IT System in Supabase');
      return;
    }

    setSystems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: nowIso } : s))
    );
    markSynced();
    const existing = systems.find((s) => s.id === id);
    if (existing) {
      await recordAudit(
        'SYSTEMS',
        'UPDATE',
        updates.systemName || existing.systemName,
        `Updated PC workstation specs / staff assignment`,
        updates.branchNumber ?? existing.branchNumber
      );
    }
  };

  const deleteSystem = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const existing = systems.find((s) => s.id === id);

    const { error } = await supabase.from('it_systems').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete IT System from Supabase');
      return;
    }

    setSystems((prev) => prev.filter((s) => s.id !== id));
    markSynced();
    if (existing) {
      await recordAudit(
        'SYSTEMS',
        'DELETE',
        existing.systemName,
        `Removed system record from Branch ${existing.branchNumber}`,
        existing.branchNumber
      );
    }
  };

  // -------------------------------------------------------------
  // 2. Printer & Cartridge Actions (Supabase: printer_models, cartridge_models, cartridge_stock, cartridge_transactions)
  // -------------------------------------------------------------
  const addPrinterModel = async (model: Omit<PrinterModel, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const { error } = await supabase.from('printer_models').insert({
      id,
      brand: model.brand,
      model_name: model.modelName,
      created_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to add Printer Model in Supabase');
      return;
    }

    const newPrn: PrinterModel = { ...model, id, createdAt: nowIso };
    setPrinterModels((prev) => [newPrn, ...prev]);
    markSynced();
    await recordAudit('PRINTERS', 'CREATE', newPrn.modelName, `Registered printer model (${newPrn.brand})`);
  };

  const updatePrinterModel = async (id: string, updates: Partial<PrinterModel>) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const payload: Record<string, any> = {};
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.modelName !== undefined) payload.model_name = updates.modelName;

    const { error } = await supabase.from('printer_models').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update Printer Model in Supabase');
      return;
    }

    setPrinterModels((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    markSynced();
    await recordAudit('PRINTERS', 'UPDATE', updates.modelName || id, `Updated printer model details`);
  };

  const deletePrinterModel = async (id: string) => {
    const prn = printerModels.find((p) => p.id === id);
    if (!prn) return { success: false, error: 'Printer model not found.' };

    const hasLinked = cartridgeModels.some(
      (c) =>
        c.printerModelId === id ||
        (c.printerModel || c.printerModelName || '').toLowerCase().includes(prn.modelName.toLowerCase())
    );
    if (hasLinked) {
      return {
        success: false,
        error: `Cannot delete "${prn.modelName}". Active cartridge stock models are linked to this printer. Please reassign or remove linked cartridges first.`,
      };
    }

    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const { error } = await supabase.from('printer_models').delete().eq('id', id);
    if (error) {
      const msg = handleWriteError(error, 'Failed to delete Printer Model from Supabase');
      return { success: false, error: msg };
    }

    setPrinterModels((prev) => prev.filter((p) => p.id !== id));
    markSynced();
    await recordAudit('PRINTERS', 'DELETE', prn.modelName, `Deleted printer model`);
    return { success: true };
  };

  const addCartridgeModel = async (cart: Omit<CartridgeModel, 'id' | 'updatedAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const stockId = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const matchedPrinter = printerModels.find(
      (p) =>
        p.id === cart.printerModelId ||
        p.modelName.toLowerCase() === (cart.printerModelName || cart.printerModel || '').toLowerCase()
    );

    const { error } = await supabase.from('cartridge_models').insert({
      id,
      printer_model_id: matchedPrinter?.id || (isValidUuid(cart.printerModelId) ? cart.printerModelId : null),
      cartridge_model: cart.cartridgeModel,
      min_stock_level: cart.minimumStockLevel ?? 2,
      max_stock_level: cart.maximumStockLevel ?? 20,
      storage_location: cart.storageLocation || 'Central IT Store',
      remarks: cart.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to register Cartridge Model in Supabase');
      return;
    }

    // Create initial cartridge_stock row in Supabase
    const initialStockQty = cart.currentStock ?? 0;
    const { error: stkErr } = await supabase.from('cartridge_stock').insert({
      id: stockId,
      cartridge_model_id: id,
      current_stock: initialStockQty,
      updated_at: nowIso,
    });

    if (stkErr) {
      console.warn('Cartridge initial stock insert notice:', stkErr.message);
    }

    const newCart: CartridgeModel = { ...cart, id, printerModelId: matchedPrinter?.id, updatedAt: nowIso };
    setCartridgeModels((prev) => [newCart, ...prev]);
    setCartridgeStock((prev) => [
      {
        id: stockId,
        cartridgeId: id,
        cartridgeModel: newCart.cartridgeModel,
        printerModelName: matchedPrinter?.modelName || '',
        branchNumber: 0,
        currentStock: initialStockQty,
        minimumStockLevel: newCart.minimumStockLevel ?? 2,
        maximumStockLevel: newCart.maximumStockLevel ?? 20,
        storageLocation: newCart.storageLocation || 'Central IT Store',
        remarks: newCart.remarks || '',
        updatedAt: nowIso,
      },
      ...prev,
    ]);
    markSynced();
    await recordAudit('PRINTERS', 'CREATE', newCart.cartridgeModel, `Registered cartridge model in central database`);
  };

  const updateCartridgeModel = async (id: string, updates: Partial<CartridgeModel>) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const payload: Record<string, any> = { updated_at: nowIso };
    if (updates.cartridgeModel !== undefined) payload.cartridge_model = updates.cartridgeModel;
    if (updates.minimumStockLevel !== undefined) payload.min_stock_level = updates.minimumStockLevel;
    if (updates.maximumStockLevel !== undefined) payload.max_stock_level = updates.maximumStockLevel;
    if (updates.storageLocation !== undefined) payload.storage_location = updates.storageLocation;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;

    const { error } = await supabase.from('cartridge_models').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update Cartridge Model in Supabase');
      return;
    }

    setCartridgeModels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: nowIso } : c))
    );
    if (updates.cartridgeModel) {
      setCartridgeStock((prev) =>
        prev.map((s) => (s.cartridgeId === id ? { ...s, cartridgeModel: updates.cartridgeModel! } : s))
      );
    }
    markSynced();
    await recordAudit('PRINTERS', 'UPDATE', updates.cartridgeModel || id, `Updated cartridge model specifications`);
  };

  const deleteCartridgeModel = async (id: string) => {
    const cart = cartridgeModels.find((c) => c.id === id);
    if (!cart) return { success: false, error: 'Cartridge model not found' };

    const totalRemaining = cartridgeStock
      .filter((s) => s.cartridgeId === id)
      .reduce((sum, s) => sum + s.currentStock, 0);

    if (totalRemaining > 0) {
      return {
        success: false,
        error: `Cannot delete "${cart.cartridgeModel}". There are still ${totalRemaining} pieces in stock. Issue or adjust stock to 0 before deleting.`,
      };
    }

    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    await supabase.from('cartridge_stock').delete().eq('cartridge_model_id', id);
    const { error } = await supabase.from('cartridge_models').delete().eq('id', id);
    if (error) {
      const msg = handleWriteError(error, 'Failed to delete Cartridge Model from Supabase');
      return { success: false, error: msg };
    }

    setCartridgeModels((prev) => prev.filter((c) => c.id !== id));
    setCartridgeStock((prev) => prev.filter((s) => s.cartridgeId !== id));
    markSynced();
    await recordAudit('PRINTERS', 'DELETE', cart.cartridgeModel, `Deleted cartridge model`);
    return { success: true };
  };

  const cartridgeStockIn = async (params: {
    cartridgeId: string;
    branchNumber: number;
    quantity: number;
    performedBy: string;
    remarks: string;
    referenceInvoiceNo?: string;
  }) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const cart = cartridgeModels.find((c) => c.id === params.cartridgeId);
    const cartName = cart ? cart.cartridgeModel : 'Toner Cartridge';
    const existingRow = cartridgeStock.find((s) => s.cartridgeId === params.cartridgeId);
    const newQty = (existingRow ? existingRow.currentStock : 0) + params.quantity;
    const stockRowId = existingRow?.id || generateUuid();

    if (existingRow) {
      const { error } = await supabase
        .from('cartridge_stock')
        .update({ current_stock: newQty, updated_at: nowIso })
        .eq('id', existingRow.id);
      if (error) {
        handleWriteError(error, 'Failed to update Cartridge Stock IN in Supabase');
        return;
      }
    } else {
      const { error } = await supabase.from('cartridge_stock').insert({
        id: stockRowId,
        cartridge_model_id: params.cartridgeId,
        current_stock: newQty,
        updated_at: nowIso,
      });
      if (error) {
        handleWriteError(error, 'Failed to insert Cartridge Stock IN in Supabase');
        return;
      }
    }

    const txId = generateUuid();
    const { error: txErr } = await supabase.from('cartridge_transactions').insert({
      id: txId,
      cartridge_model_id: params.cartridgeId,
      branch_number: params.branchNumber,
      transaction_type: 'IN',
      quantity: params.quantity,
      performed_by: params.performedBy || actorName,
      remarks: params.referenceInvoiceNo
        ? `${params.remarks} (Ref: ${params.referenceInvoiceNo})`.trim()
        : params.remarks,
      created_at: nowIso,
    });
    if (txErr) {
      handleWriteError(txErr, 'Stock updated, but failed to log cartridge transaction');
    }

    setCartridgeStock((prev) => {
      if (existingRow) {
        return prev.map((s) =>
          s.id === existingRow.id ? { ...s, currentStock: newQty, updatedAt: nowIso } : s
        );
      }
      return [
        {
          id: stockRowId,
          cartridgeId: params.cartridgeId,
          cartridgeModel: cartName,
          branchNumber: params.branchNumber,
          currentStock: newQty,
          minimumStockLevel: cart?.minimumStockLevel ?? 2,
          maximumStockLevel: cart?.maximumStockLevel ?? 20,
          storageLocation: cart?.storageLocation || `Branch ${params.branchNumber} Store`,
          remarks: params.remarks,
          updatedAt: nowIso,
        },
        ...prev,
      ];
    });

    const tx: CartridgeTransaction = {
      id: txId,
      cartridgeId: params.cartridgeId,
      cartridgeModel: cartName,
      branchNumber: params.branchNumber,
      type: 'IN',
      quantity: params.quantity,
      transactionDate: nowIso.split('T')[0],
      performedBy: params.performedBy || actorName,
      referenceInvoiceNo: params.referenceInvoiceNo,
      remarks: params.remarks,
      createdAt: nowIso,
    };
    setCartridgeTransactions((prev) => [tx, ...prev]);
    markSynced();
    await recordAudit(
      'PRINTERS',
      'STOCK_IN',
      cartName,
      `Stock IN: +${params.quantity} pcs for Branch ${params.branchNumber}`,
      params.branchNumber
    );
  };

  const cartridgeStockOut = async (params: {
    cartridgeId: string;
    branchNumber: number;
    quantity: number;
    performedBy: string;
    remarks: string;
  }) => {
    const current = cartridgeStock.find((s) => s.cartridgeId === params.cartridgeId);
    const available = current ? current.currentStock : 0;

    if (params.quantity > available) {
      return {
        success: false,
        error: `Cannot issue ${params.quantity} pieces. Only ${available} available in central stock.`,
      };
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const newQty = Math.max(0, available - params.quantity);
    if (current) {
      const { error } = await supabase
        .from('cartridge_stock')
        .update({ current_stock: newQty, updated_at: nowIso })
        .eq('id', current.id);
      if (error) {
        const msg = handleWriteError(error, 'Failed to update Cartridge Stock OUT in Supabase');
        return { success: false, error: msg };
      }
    }

    const cart = cartridgeModels.find((c) => c.id === params.cartridgeId);
    const cartName = cart ? cart.cartridgeModel : 'Toner Cartridge';
    const txId = generateUuid();

    const { error: txErr } = await supabase.from('cartridge_transactions').insert({
      id: txId,
      cartridge_model_id: params.cartridgeId,
      branch_number: params.branchNumber,
      transaction_type: 'OUT',
      quantity: params.quantity,
      performed_by: params.performedBy || actorName,
      remarks: params.remarks,
      created_at: nowIso,
    });
    if (txErr) {
      handleWriteError(txErr, 'Failed to save Cartridge OUT transaction');
    }

    setCartridgeStock((prev) =>
      prev.map((s) =>
        s.cartridgeId === params.cartridgeId ? { ...s, currentStock: newQty, updatedAt: nowIso } : s
      )
    );

    const tx: CartridgeTransaction = {
      id: txId,
      cartridgeId: params.cartridgeId,
      cartridgeModel: cartName,
      branchNumber: params.branchNumber,
      type: 'OUT',
      quantity: params.quantity,
      transactionDate: nowIso.split('T')[0],
      performedBy: params.performedBy || actorName,
      remarks: params.remarks,
      createdAt: nowIso,
    };
    setCartridgeTransactions((prev) => [tx, ...prev]);
    markSynced();
    await recordAudit(
      'PRINTERS',
      'STOCK_OUT',
      cartName,
      `Stock OUT: -${params.quantity} pcs to Branch ${params.branchNumber}`,
      params.branchNumber
    );
    return { success: true };
  };

  const updateCartridgeMinStock = async (cartridgeId: string, branchNumber: number, newMin: number) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const { error } = await supabase
      .from('cartridge_models')
      .update({ min_stock_level: newMin, updated_at: nowIso })
      .eq('id', cartridgeId);
    if (error) {
      handleWriteError(error, 'Failed to update Cartridge min alert level in Supabase');
      return;
    }

    setCartridgeModels((prev) =>
      prev.map((c) => (c.id === cartridgeId ? { ...c, minimumStockLevel: newMin, updatedAt: nowIso } : c))
    );
    setCartridgeStock((prev) =>
      prev.map((s) =>
        s.cartridgeId === cartridgeId ? { ...s, minimumStockLevel: newMin, updatedAt: nowIso } : s
      )
    );
    markSynced();
    await recordAudit(
      'PRINTERS',
      'UPDATE',
      `Cartridge Min Threshold`,
      `Admin updated minimum stock alert level to ${newMin} pcs`,
      branchNumber
    );
  };

  // -------------------------------------------------------------
  // 3. IT Accessories Actions (Supabase: it_accessories, accessory_transactions)
  // -------------------------------------------------------------
  const addAccessoryCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!accessoryCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setAccessoryCategories((prev) => [...prev, { id: `cat-${Date.now()}`, name: trimmed }]);
    }
    await recordAudit('ACCESSORIES', 'CREATE', trimmed, `Added accessory category "${trimmed}"`);
  };

  const addAccessoryItem = async (item: Omit<ITAccessoryItem, 'id' | 'updatedAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const branchNum = item.branchNumber ?? item.branch ?? 0;
    const accName = item.accessoryName || item.name || 'Accessory';
    const qty = item.currentStock ?? item.quantity ?? 0;

    const { error } = await supabase.from('it_accessories').insert({
      id,
      accessory_name: accName,
      brand: item.brand || 'Standard',
      model: item.model || 'Standard',
      branch_number: branchNum,
      quantity: qty,
      min_stock: item.minimumStock ?? 2,
      storage_location: item.storageLocation || 'IT Store',
      remarks: item.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to add IT Accessory to Supabase');
      return;
    }

    const newItem: ITAccessoryItem = {
      ...item,
      id,
      name: accName,
      accessoryName: accName,
      branchNumber: branchNum,
      branch: branchNum,
      quantity: qty,
      currentStock: qty,
      updatedAt: nowIso,
    };
    setAccessoryItems((prev) => [newItem, ...prev]);
    markSynced();
    await recordAudit(
      'ACCESSORIES',
      'CREATE',
      `${accName} (${newItem.model})`,
      `Added accessory to Branch ${branchNum}`,
      branchNum
    );
  };

  const updateAccessoryItem = async (id: string, updates: Partial<ITAccessoryItem>) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const payload: Record<string, any> = { updated_at: nowIso };
    if (updates.accessoryName || updates.name) payload.accessory_name = updates.accessoryName || updates.name;
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.model !== undefined) payload.model = updates.model;
    if (updates.branchNumber !== undefined || updates.branch !== undefined) {
      payload.branch_number = updates.branchNumber ?? updates.branch;
    }
    if (updates.currentStock !== undefined || updates.quantity !== undefined) {
      payload.quantity = updates.currentStock ?? updates.quantity;
    }
    if (updates.minimumStock !== undefined) payload.min_stock = updates.minimumStock;
    if (updates.storageLocation !== undefined) payload.storage_location = updates.storageLocation;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;

    const { error } = await supabase.from('it_accessories').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update IT Accessory in Supabase');
      return;
    }

    setAccessoryItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: nowIso } : a))
    );
    markSynced();
    await recordAudit('ACCESSORIES', 'UPDATE', updates.accessoryName || updates.name || id, `Updated accessory details`);
  };

  const deleteAccessoryItem = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const item = accessoryItems.find((a) => a.id === id);

    const { error } = await supabase.from('it_accessories').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete IT Accessory from Supabase');
      return;
    }

    setAccessoryItems((prev) => prev.filter((a) => a.id !== id));
    markSynced();
    if (item) {
      await recordAudit(
        'ACCESSORIES',
        'DELETE',
        item.accessoryName || item.name || 'Accessory',
        `Removed accessory record`,
        item.branchNumber ?? item.branch
      );
    }
  };

  const accessoryStockIn = async (params: {
    accessoryId: string;
    branchNumber: number;
    quantity: number;
    receivedBy: string;
    issuedBy: string;
    remarks: string;
  }) => {
    const item = accessoryItems.find((a) => a.id === params.accessoryId);
    if (!item) return;

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');
    const newQty = item.currentStock + params.quantity;

    const { error } = await supabase
      .from('it_accessories')
      .update({ quantity: newQty, updated_at: nowIso })
      .eq('id', params.accessoryId);

    if (error) {
      handleWriteError(error, 'Failed to commit Accessory Stock IN to Supabase');
      return;
    }

    const txId = generateUuid();
    await supabase.from('accessory_transactions').insert({
      id: txId,
      accessory_id: params.accessoryId,
      transaction_type: 'IN',
      quantity: params.quantity,
      to_branch: params.branchNumber,
      issued_by: params.issuedBy || actorName,
      received_by: params.receivedBy || actorName,
      remarks: params.remarks || '',
      created_at: nowIso,
    });

    setAccessoryItems((prev) =>
      prev.map((a) =>
        a.id === params.accessoryId ? { ...a, currentStock: newQty, quantity: newQty, updatedAt: nowIso } : a
      )
    );
    const tx: AccessoryTransaction = {
      id: txId,
      accessoryId: params.accessoryId,
      accessoryName: item.accessoryName || item.name || 'Accessory',
      model: item.model,
      type: 'IN',
      quantity: params.quantity,
      toBranch: params.branchNumber,
      issueDate: nowIso.split('T')[0],
      receivedBy: params.receivedBy,
      issuedBy: params.issuedBy,
      remarks: params.remarks,
      createdAt: nowIso,
    };
    setAccessoryTransactions((prev) => [tx, ...prev]);
    markSynced();
    await recordAudit(
      'ACCESSORIES',
      'STOCK_IN',
      tx.accessoryName,
      `Stock IN: +${params.quantity} pcs for Branch ${params.branchNumber}`,
      params.branchNumber
    );
  };

  const accessoryStockOut = async (params: {
    accessoryId: string;
    branchNumber: number;
    quantity: number;
    receivedBy: string;
    issuedBy: string;
    remarks: string;
  }) => {
    const item = accessoryItems.find((a) => a.id === params.accessoryId);
    if (!item) return { success: false, error: 'Accessory not found' };

    if (params.quantity > item.currentStock) {
      return {
        success: false,
        error: `Cannot issue ${params.quantity} units. Only ${item.currentStock} units available in stock.`,
      };
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');
    const newQty = Math.max(0, item.currentStock - params.quantity);

    const { error } = await supabase
      .from('it_accessories')
      .update({ quantity: newQty, updated_at: nowIso })
      .eq('id', params.accessoryId);

    if (error) {
      const msg = handleWriteError(error, 'Failed to commit Accessory Stock OUT to Supabase');
      return { success: false, error: msg };
    }

    const txId = generateUuid();
    await supabase.from('accessory_transactions').insert({
      id: txId,
      accessory_id: params.accessoryId,
      transaction_type: 'OUT',
      quantity: params.quantity,
      from_branch: params.branchNumber,
      issued_by: params.issuedBy || actorName,
      received_by: params.receivedBy || 'Staff',
      remarks: params.remarks || '',
      created_at: nowIso,
    });

    setAccessoryItems((prev) =>
      prev.map((a) =>
        a.id === params.accessoryId ? { ...a, currentStock: newQty, quantity: newQty, updatedAt: nowIso } : a
      )
    );
    const tx: AccessoryTransaction = {
      id: txId,
      accessoryId: params.accessoryId,
      accessoryName: item.accessoryName || item.name || 'Accessory',
      model: item.model,
      type: 'OUT',
      quantity: params.quantity,
      fromBranch: params.branchNumber,
      issueDate: nowIso.split('T')[0],
      receivedBy: params.receivedBy,
      issuedBy: params.issuedBy,
      remarks: params.remarks,
      createdAt: nowIso,
    };
    setAccessoryTransactions((prev) => [tx, ...prev]);
    markSynced();
    await recordAudit(
      'ACCESSORIES',
      'STOCK_OUT',
      tx.accessoryName,
      `Stock OUT: -${params.quantity} pcs to ${params.receivedBy}`,
      params.branchNumber
    );
    return { success: true };
  };

  const accessoryTransfer = async (params: {
    accessoryId: string;
    fromBranch: number;
    toBranch: number;
    quantity: number;
    issuedBy: string;
    receivedBy: string;
    remarks: string;
  }) => {
    const item = accessoryItems.find((a) => a.id === params.accessoryId);
    if (!item) return { success: false, error: 'Accessory not found' };

    if (params.quantity > item.currentStock) {
      return {
        success: false,
        error: `Cannot transfer ${params.quantity} units. Only ${item.currentStock} units in Branch ${params.fromBranch}.`,
      };
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const newSourceQty = item.currentStock - params.quantity;
    const { error: srcErr } = await supabase
      .from('it_accessories')
      .update({ quantity: newSourceQty, updated_at: nowIso })
      .eq('id', params.accessoryId);

    if (srcErr) {
      const msg = handleWriteError(srcErr, 'Failed to deduct source stock for transfer in Supabase');
      return { success: false, error: msg };
    }

    const destExisting = accessoryItems.find(
      (a) =>
        (a.branchNumber ?? a.branch) === params.toBranch &&
        (a.accessoryName || a.name) === (item.accessoryName || item.name) &&
        a.model === item.model
    );

    let newDestItem: ITAccessoryItem | null = null;
    if (destExisting) {
      const newDestQty = (destExisting.currentStock || 0) + params.quantity;
      const { error: dstErr } = await supabase
        .from('it_accessories')
        .update({ quantity: newDestQty, updated_at: nowIso })
        .eq('id', destExisting.id);
      if (dstErr) {
        const msg = handleWriteError(dstErr, 'Failed to add destination stock for transfer in Supabase');
        return { success: false, error: msg };
      }
    } else {
      const destId = generateUuid();
      const accName = item.accessoryName || item.name || 'Accessory';
      const { error: dstInsErr } = await supabase.from('it_accessories').insert({
        id: destId,
        accessory_name: accName,
        brand: item.brand || 'Standard',
        model: item.model || 'Standard',
        branch_number: params.toBranch,
        quantity: params.quantity,
        min_stock: item.minimumStock ?? 2,
        storage_location: `Branch ${params.toBranch} Store`,
        remarks: `Transferred from Branch ${params.fromBranch}`,
        created_at: nowIso,
        updated_at: nowIso,
      });
      if (dstInsErr) {
        const msg = handleWriteError(dstInsErr, 'Failed to create destination branch stock in Supabase');
        return { success: false, error: msg };
      }
      newDestItem = {
        id: destId,
        name: accName,
        accessoryName: accName,
        model: item.model,
        brand: item.brand,
        quantity: params.quantity,
        currentStock: params.quantity,
        minimumStock: item.minimumStock,
        branchNumber: params.toBranch,
        branch: params.toBranch,
        storageLocation: `Branch ${params.toBranch} Store`,
        remarks: `Transferred from Branch ${params.fromBranch}`,
        updatedAt: nowIso,
      };
    }

    const txId = generateUuid();
    await supabase.from('accessory_transactions').insert({
      id: txId,
      accessory_id: params.accessoryId,
      transaction_type: 'TRANSFER',
      quantity: params.quantity,
      from_branch: params.fromBranch,
      to_branch: params.toBranch,
      issued_by: params.issuedBy || actorName,
      received_by: params.receivedBy || 'Branch Staff',
      remarks: params.remarks || '',
      created_at: nowIso,
    });

    setAccessoryItems((prev) => {
      const updated = prev.map((a) => {
        if (a.id === params.accessoryId) {
          return { ...a, currentStock: newSourceQty, quantity: newSourceQty, updatedAt: nowIso };
        }
        if (destExisting && a.id === destExisting.id) {
          const newDestQty = (a.currentStock || 0) + params.quantity;
          return { ...a, currentStock: newDestQty, quantity: newDestQty, updatedAt: nowIso };
        }
        return a;
      });
      if (newDestItem) updated.push(newDestItem);
      return updated;
    });

    const tx: AccessoryTransaction = {
      id: txId,
      accessoryId: params.accessoryId,
      accessoryName: item.accessoryName || item.name || 'Accessory',
      model: item.model,
      type: 'TRANSFER',
      quantity: params.quantity,
      fromBranch: params.fromBranch,
      toBranch: params.toBranch,
      issueDate: nowIso.split('T')[0],
      receivedBy: params.receivedBy,
      issuedBy: params.issuedBy,
      remarks: params.remarks,
      createdAt: nowIso,
    };
    setAccessoryTransactions((prev) => [tx, ...prev]);
    markSynced();
    await recordAudit(
      'ACCESSORIES',
      'TRANSFER',
      tx.accessoryName,
      `Branch Transfer: ${params.quantity} units from Branch ${params.fromBranch} to Branch ${params.toBranch}`,
      params.fromBranch
    );
    return { success: true };
  };

  // -------------------------------------------------------------
  // 4. Mobile Asset Actions (Supabase: mobile_assets)
  // -------------------------------------------------------------
  const addMobileAsset = async (mob: Omit<MobileAsset, 'id' | 'updatedAt'>) => {
    const imeiExists = mobileAssets.some(
      (m) => m.imei1.trim() === mob.imei1.trim() || (mob.imei2 && m.imei1.trim() === mob.imei2.trim())
    );
    if (imeiExists) {
      return {
        success: false,
        error: `IMEI Number (${mob.imei1}) is already registered in the system. IMEI must be globally unique.`,
      };
    }

    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const mobBrand = mob.brand || mob.mobileBrand || 'Mobile';
    const mobModel = mob.model || mob.mobileModel || 'Device';
    const mobStaff = mob.assignedStaffName || mob.staffName || 'Staff';
    const mobStatus = mob.status || mob.mobileStatus || 'Assigned';

    const { error } = await supabase.from('mobile_assets').insert({
      id,
      mobile_brand: mobBrand,
      mobile_model: mobModel,
      imei_1: mob.imei1,
      imei_2: mob.imei2 || null,
      serial_number: mob.serialNumber || '',
      staff_name: mobStaff,
      branch_number: mob.branchNumber,
      assigned_date: mob.assignedDate || nowIso.split('T')[0],
      mobile_status: mobStatus,
      remarks: mob.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      const msg = handleWriteError(error, 'Failed to register Mobile Asset in Supabase');
      return { success: false, error: msg };
    }

    const newMob: MobileAsset = {
      ...mob,
      id,
      brand: mobBrand,
      mobileBrand: mobBrand,
      model: mobModel,
      mobileModel: mobModel,
      assignedStaffName: mobStaff,
      staffName: mobStaff,
      status: mobStatus,
      mobileStatus: mobStatus,
      updatedAt: nowIso,
    };
    setMobileAssets((prev) => [newMob, ...prev]);

    const hist: MobileAssignmentHistory = {
      id: `mhist-${id}`,
      mobileId: id,
      imei1: newMob.imei1,
      mobileModel: mobModel,
      action: 'ASSIGN',
      branchNumber: newMob.branchNumber,
      toBranch: newMob.branchNumber,
      staffName: mobStaff,
      assignedDate: newMob.assignedDate,
      date: newMob.assignedDate,
      remarks: newMob.remarks || 'Initial mobile registration & staff assignment',
    };
    setMobileHistory((prev) => [hist, ...prev]);
    markSynced();
    await recordAudit(
      'MOBILES',
      'CREATE',
      `${mobBrand} ${mobModel}`,
      `Registered Mobile (IMEI: ${newMob.imei1}) assigned to ${mobStaff}`,
      newMob.branchNumber
    );
    return { success: true };
  };

  const updateMobileAsset = async (id: string, updates: Partial<MobileAsset>) => {
    if (updates.imei1) {
      const conflict = mobileAssets.some((m) => m.id !== id && m.imei1 === updates.imei1);
      if (conflict) {
        return { success: false, error: `IMEI (${updates.imei1}) is already in use by another mobile device.` };
      }
    }

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const payload: Record<string, any> = { updated_at: nowIso };
    if (updates.brand || updates.mobileBrand) payload.mobile_brand = updates.brand || updates.mobileBrand;
    if (updates.model || updates.mobileModel) payload.mobile_model = updates.model || updates.mobileModel;
    if (updates.imei1 !== undefined) payload.imei_1 = updates.imei1;
    if (updates.imei2 !== undefined) payload.imei_2 = updates.imei2;
    if (updates.serialNumber !== undefined) payload.serial_number = updates.serialNumber;
    if (updates.assignedStaffName || updates.staffName) {
      payload.staff_name = updates.assignedStaffName || updates.staffName;
    }
    if (updates.branchNumber !== undefined) payload.branch_number = updates.branchNumber;
    if (updates.assignedDate !== undefined) payload.assigned_date = updates.assignedDate;
    if (updates.status || updates.mobileStatus) payload.mobile_status = updates.status || updates.mobileStatus;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;

    const { error } = await supabase.from('mobile_assets').update(payload).eq('id', id);
    if (error) {
      const msg = handleWriteError(error, 'Failed to update Mobile Asset in Supabase');
      return { success: false, error: msg };
    }

    setMobileAssets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: nowIso } : m))
    );
    markSynced();
    await recordAudit(
      'MOBILES',
      'UPDATE',
      updates.mobileModel || updates.model || id,
      `Updated mobile asset specifications/status`,
      updates.branchNumber
    );
    return { success: true };
  };

  const deleteMobileAsset = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const mob = mobileAssets.find((m) => m.id === id);

    const { error } = await supabase.from('mobile_assets').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete Mobile Asset from Supabase');
      return;
    }

    setMobileAssets((prev) => prev.filter((m) => m.id !== id));
    markSynced();
    if (mob) {
      await recordAudit(
        'MOBILES',
        'DELETE',
        `${mob.mobileBrand || mob.brand} ${mob.mobileModel || mob.model}`,
        `Deleted mobile asset (IMEI: ${mob.imei1})`,
        mob.branchNumber
      );
    }
  };

  const transferMobileAsset = async (params: {
    mobileId: string;
    toBranch: number;
    newStaffName: string;
    remarks: string;
  }) => {
    const mob = mobileAssets.find((m) => m.id === params.mobileId);
    if (!mob) return;

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    setSyncStatus('syncing');
    const fromBranch = mob.branchNumber;

    const { error } = await supabase
      .from('mobile_assets')
      .update({
        branch_number: params.toBranch,
        staff_name: params.newStaffName,
        assigned_date: today,
        remarks: params.remarks,
        updated_at: nowIso,
      })
      .eq('id', params.mobileId);

    if (error) {
      handleWriteError(error, 'Failed to transfer Mobile Asset in Supabase');
      return;
    }

    setMobileAssets((prev) =>
      prev.map((m) =>
        m.id === params.mobileId
          ? {
              ...m,
              branchNumber: params.toBranch,
              staffName: params.newStaffName,
              assignedStaffName: params.newStaffName,
              assignedDate: today,
              remarks: params.remarks,
              updatedAt: nowIso,
            }
          : m
      )
    );

    const hist: MobileAssignmentHistory = {
      id: `mhist-${Date.now()}`,
      mobileId: mob.id,
      imei1: mob.imei1,
      mobileModel: mob.mobileModel || mob.model,
      action: 'TRANSFER',
      fromBranch,
      toBranch: params.toBranch,
      staffName: params.newStaffName,
      date: today,
      remarks: params.remarks,
    };
    setMobileHistory((prev) => [hist, ...prev]);
    markSynced();
    await recordAudit(
      'MOBILES',
      'TRANSFER',
      `${mob.mobileBrand || mob.brand} ${mob.mobileModel || mob.model}`,
      `Transferred mobile from Branch ${fromBranch} to Branch ${params.toBranch} (Assigned: ${params.newStaffName})`,
      params.toBranch
    );
  };

  // -------------------------------------------------------------
  // 5. Company Laptop Actions (Supabase: laptop_assets)
  // -------------------------------------------------------------
  const addLaptop = async (lap: Omit<CompanyLaptop, 'id' | 'updatedAt'>) => {
    const serialExists = laptops.some(
      (l) => l.serialNumber.trim().toLowerCase() === lap.serialNumber.trim().toLowerCase()
    );
    if (serialExists) {
      return {
        success: false,
        error: `Serial Number (${lap.serialNumber}) is already registered in the laptop pool.`,
      };
    }

    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const lapBrand = lap.brand || lap.laptopBrand || 'Laptop';
    const lapModel = lap.model || lap.laptopModel || 'Device';
    const lapStaff = lap.assignedStaffName || lap.staffName || 'Staff';
    const lapStatus = lap.status || lap.laptopStatus || 'Assigned';

    const { error } = await supabase.from('laptop_assets').insert({
      id,
      laptop_brand: lapBrand,
      laptop_model: lapModel,
      serial_number: lap.serialNumber,
      processor: lap.processor,
      ram: lap.ram,
      ssd: lap.ssd,
      windows_version: lap.windowsVersion,
      staff_name: lapStaff,
      branch_number: lap.branchNumber,
      assigned_date: lap.assignedDate || nowIso.split('T')[0],
      laptop_status: lapStatus,
      remarks: lap.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      const msg = handleWriteError(error, 'Failed to register Company Laptop in Supabase');
      return { success: false, error: msg };
    }

    const newLap: CompanyLaptop = {
      ...lap,
      id,
      brand: lapBrand,
      laptopBrand: lapBrand,
      model: lapModel,
      laptopModel: lapModel,
      assignedStaffName: lapStaff,
      staffName: lapStaff,
      status: lapStatus,
      laptopStatus: lapStatus,
      updatedAt: nowIso,
    };
    setLaptops((prev) => [newLap, ...prev]);

    const hist: LaptopAssignmentHistory = {
      id: `lhist-${id}`,
      laptopId: id,
      serialNumber: newLap.serialNumber,
      laptopModel: lapModel,
      action: 'ASSIGN',
      branchNumber: newLap.branchNumber,
      toBranch: newLap.branchNumber,
      staffName: lapStaff,
      assignedDate: newLap.assignedDate,
      date: newLap.assignedDate,
      remarks: newLap.remarks || 'Initial laptop assignment',
    };
    setLaptopHistory((prev) => [hist, ...prev]);
    markSynced();
    await recordAudit(
      'LAPTOPS',
      'CREATE',
      `${lapBrand} ${lapModel}`,
      `Registered company laptop (S/N: ${newLap.serialNumber}) for ${lapStaff}`,
      newLap.branchNumber
    );
    return { success: true };
  };

  const updateLaptop = async (id: string, updates: Partial<CompanyLaptop>) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const payload: Record<string, any> = { updated_at: nowIso };
    if (updates.brand || updates.laptopBrand) payload.laptop_brand = updates.brand || updates.laptopBrand;
    if (updates.model || updates.laptopModel) payload.laptop_model = updates.model || updates.laptopModel;
    if (updates.serialNumber !== undefined) payload.serial_number = updates.serialNumber;
    if (updates.processor !== undefined) payload.processor = updates.processor;
    if (updates.ram !== undefined) payload.ram = updates.ram;
    if (updates.ssd !== undefined) payload.ssd = updates.ssd;
    if (updates.windowsVersion !== undefined) payload.windows_version = updates.windowsVersion;
    if (updates.assignedStaffName || updates.staffName) {
      payload.staff_name = updates.assignedStaffName || updates.staffName;
    }
    if (updates.branchNumber !== undefined) payload.branch_number = updates.branchNumber;
    if (updates.assignedDate !== undefined) payload.assigned_date = updates.assignedDate;
    if (updates.status || updates.laptopStatus) payload.laptop_status = updates.status || updates.laptopStatus;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;

    const { error } = await supabase.from('laptop_assets').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update Company Laptop in Supabase');
      return;
    }

    setLaptops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updatedAt: nowIso } : l))
    );
    markSynced();
    await recordAudit(
      'LAPTOPS',
      'UPDATE',
      updates.laptopModel || updates.model || id,
      `Updated laptop specifications/staff`,
      updates.branchNumber
    );
  };

  const deleteLaptop = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const lap = laptops.find((l) => l.id === id);

    const { error } = await supabase.from('laptop_assets').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete Company Laptop from Supabase');
      return;
    }

    setLaptops((prev) => prev.filter((l) => l.id !== id));
    markSynced();
    if (lap) {
      await recordAudit(
        'LAPTOPS',
        'DELETE',
        `${lap.laptopBrand || lap.brand} ${lap.laptopModel || lap.model}`,
        `Deleted laptop asset (S/N: ${lap.serialNumber})`,
        lap.branchNumber
      );
    }
  };

  const transferLaptop = async (params: {
    laptopId: string;
    toBranch: number;
    newStaffName: string;
    remarks: string;
  }) => {
    const lap = laptops.find((l) => l.id === params.laptopId);
    if (!lap) return;

    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];
    setSyncStatus('syncing');
    const fromBranch = lap.branchNumber;

    const { error } = await supabase
      .from('laptop_assets')
      .update({
        branch_number: params.toBranch,
        staff_name: params.newStaffName,
        assigned_date: today,
        remarks: params.remarks,
        updated_at: nowIso,
      })
      .eq('id', params.laptopId);

    if (error) {
      handleWriteError(error, 'Failed to transfer Company Laptop in Supabase');
      return;
    }

    setLaptops((prev) =>
      prev.map((l) =>
        l.id === params.laptopId
          ? {
              ...l,
              branchNumber: params.toBranch,
              staffName: params.newStaffName,
              assignedStaffName: params.newStaffName,
              assignedDate: today,
              remarks: params.remarks,
              updatedAt: nowIso,
            }
          : l
      )
    );

    const hist: LaptopAssignmentHistory = {
      id: `lhist-${Date.now()}`,
      laptopId: lap.id,
      serialNumber: lap.serialNumber,
      laptopModel: lap.laptopModel || lap.model,
      action: 'TRANSFER',
      fromBranch,
      toBranch: params.toBranch,
      staffName: params.newStaffName,
      date: today,
      remarks: params.remarks,
    };
    setLaptopHistory((prev) => [hist, ...prev]);
    markSynced();
    await recordAudit(
      'LAPTOPS',
      'TRANSFER',
      `${lap.laptopBrand || lap.brand} ${lap.laptopModel || lap.model}`,
      `Transferred laptop from Branch ${fromBranch} to Branch ${params.toBranch} (Assigned: ${params.newStaffName})`,
      params.toBranch
    );
  };

  // -------------------------------------------------------------
  // 6. Custom Asset Actions (Supabase: custom_asset_categories, custom_assets)
  // -------------------------------------------------------------
  const addCustomCategory = async (cat: Omit<CustomAssetCategory, 'id' | 'createdAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const { error } = await supabase.from('custom_asset_categories').insert({
      id,
      category_name: cat.name,
      description: encodeCategoryDescription(cat.description, cat.customFields),
      created_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to add Custom Asset Category in Supabase');
      return;
    }

    const newCat: CustomAssetCategory = { ...cat, id, createdAt: nowIso };
    setCustomCategories((prev) => [newCat, ...prev]);
    markSynced();
    await recordAudit(
      'CUSTOM',
      'CREATE',
      newCat.name,
      `Added custom asset category with ${newCat.customFields.length} custom fields`
    );
  };

  const updateCustomCategory = async (id: string, updates: Partial<CustomAssetCategory>) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const existing = customCategories.find((c) => c.id === id);

    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.category_name = updates.name;
    if (updates.description !== undefined || updates.customFields !== undefined) {
      payload.description = encodeCategoryDescription(
        updates.description ?? existing?.description,
        updates.customFields ?? existing?.customFields ?? []
      );
    }

    const { error } = await supabase.from('custom_asset_categories').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update Custom Category in Supabase');
      return;
    }

    setCustomCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    markSynced();
    await recordAudit('CUSTOM', 'UPDATE', updates.name || id, `Updated custom category configuration`);
  };

  const deleteCustomCategory = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const cat = customCategories.find((c) => c.id === id);

    await supabase.from('custom_assets').delete().eq('category_id', id);
    const { error } = await supabase.from('custom_asset_categories').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete Custom Category from Supabase');
      return;
    }

    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    setCustomAssets((prev) => prev.filter((a) => a.categoryId !== id));
    markSynced();
    if (cat) {
      await recordAudit('CUSTOM', 'DELETE', cat.name, `Deleted custom category and associated items`);
    }
  };

  const addCustomAsset = async (asset: Omit<CustomAssetItem, 'id' | 'updatedAt'>) => {
    const supabase = getSupabaseClient();
    const id = generateUuid();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const assetName = asset.name || asset.assetName || 'Custom Asset';
    const customFieldsPayload = {
      ...(asset.customFieldValues || asset.customValues || {}),
      ...(asset.serialNumber ? { __serialNumber: asset.serialNumber } : {}),
      __status: asset.status || 'Active',
    };

    const { error } = await supabase.from('custom_assets').insert({
      id,
      category_id: asset.categoryId,
      asset_name: assetName,
      branch_number: asset.branchNumber,
      custom_fields: customFieldsPayload,
      remarks: asset.remarks || '',
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (error) {
      handleWriteError(error, 'Failed to add Custom Asset in Supabase');
      return;
    }

    const newAsset: CustomAssetItem = {
      ...asset,
      id,
      name: assetName,
      assetName,
      updatedAt: nowIso,
    };
    setCustomAssets((prev) => [newAsset, ...prev]);
    markSynced();
    await recordAudit(
      'CUSTOM',
      'CREATE',
      assetName,
      `Added custom asset (${newAsset.categoryName}) for Branch ${newAsset.branchNumber}`,
      newAsset.branchNumber
    );
  };

  const updateCustomAsset = async (id: string, updates: Partial<CustomAssetItem>) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    const existing = customAssets.find((a) => a.id === id);
    const payload: Record<string, any> = { updated_at: nowIso };
    if (updates.name || updates.assetName) payload.asset_name = updates.name || updates.assetName;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.branchNumber !== undefined) payload.branch_number = updates.branchNumber;
    if (updates.remarks !== undefined) payload.remarks = updates.remarks;
    if (updates.customFieldValues || updates.customValues || updates.status || updates.serialNumber) {
      payload.custom_fields = {
        ...(existing?.customFieldValues || existing?.customValues || {}),
        ...(updates.customFieldValues || updates.customValues || {}),
        ...(updates.serialNumber !== undefined ? { __serialNumber: updates.serialNumber } : {}),
        ...(updates.status !== undefined ? { __status: updates.status } : {}),
      };
    }

    const { error } = await supabase.from('custom_assets').update(payload).eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to update Custom Asset in Supabase');
      return;
    }

    setCustomAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: nowIso } : a))
    );
    markSynced();
    await recordAudit('CUSTOM', 'UPDATE', updates.name || updates.assetName || id, `Updated custom asset details`);
  };

  const deleteCustomAsset = async (id: string) => {
    const supabase = getSupabaseClient();
    setSyncStatus('syncing');
    const asset = customAssets.find((a) => a.id === id);

    const { error } = await supabase.from('custom_assets').delete().eq('id', id);
    if (error) {
      handleWriteError(error, 'Failed to delete Custom Asset from Supabase');
      return;
    }

    setCustomAssets((prev) => prev.filter((a) => a.id !== id));
    markSynced();
    if (asset) {
      await recordAudit(
        'CUSTOM',
        'DELETE',
        asset.name || asset.assetName || 'Custom Asset',
        `Removed custom asset`,
        asset.branchNumber
      );
    }
  };

  // Safe cloud refresh (never wipes existing Supabase company data!)
  const resetAllData = async () => {
    await refreshFromCloud();
  };

  const resetToSampleData = resetAllData;

  const importFromExcel = async (
    impSystems: SystemAsset[],
    impAccessories: AccessoryStock[],
    _impTransactions: StockTransaction[]
  ) => {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();
    setSyncStatus('syncing');

    if (impSystems && impSystems.length > 0) {
      const rows = impSystems.map((s) => ({
        id: isValidUuid(s.id) ? s.id : generateUuid(),
        branch_number: s.branchNumber ?? 0,
        system_name: s.systemName,
        processor: s.processor || 'Unknown',
        ram: s.ram || '8GB',
        ssd: s.ssd || `${s.storageCapacity || '512GB'} ${s.storageType || 'SSD'}`,
        windows_version: s.windowsVersion || 'Windows 11 Pro',
        assigned_staff_name: s.assignedStaffName || 'Staff Member',
        remarks: s.remarks || 'Imported via Excel',
        created_at: nowIso,
        updated_at: nowIso,
      }));
      const { error } = await supabase.from('it_systems').upsert(rows);
      if (error) {
        handleWriteError(error, 'Failed to import IT Systems to Supabase');
        return;
      }
    }

    if (impAccessories && impAccessories.length > 0) {
      const rows = impAccessories.map((a) => ({
        id: isValidUuid(a.id) ? a.id : generateUuid(),
        accessory_name: a.accessoryName,
        brand: 'Premier IT',
        model: 'Standard OEM',
        branch_number: a.branchNumber ?? 0,
        quantity: a.availableStock ?? 0,
        min_stock: 2,
        storage_location: `Branch ${a.branchNumber ?? 0} IT Store`,
        remarks: a.remarks || 'Imported via Excel',
        created_at: nowIso,
        updated_at: nowIso,
      }));
      const { error } = await supabase.from('it_accessories').upsert(rows);
      if (error) {
        handleWriteError(error, 'Failed to import IT Accessories to Supabase');
        return;
      }
    }

    await refreshFromCloud();
    await recordAudit(
      'SYSTEMS',
      'IMPORT',
      'Excel Import',
      `Imported ${impSystems?.length || 0} systems and ${impAccessories?.length || 0} accessories to Supabase Cloud`
    );
  };

  return (
    <TrackerContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedBranch,
        setSelectedBranch,

        // 1. Systems
        systems,
        addSystem,
        updateSystem,
        deleteSystem,

        // 2. Cartridges
        printerModels,
        cartridgeModels,
        cartridgeStock,
        cartridgeTransactions,
        addPrinterModel,
        updatePrinterModel,
        deletePrinterModel,
        addCartridgeModel,
        updateCartridgeModel,
        deleteCartridgeModel,
        cartridgeStockIn,
        cartridgeStockOut,
        updateCartridgeMinStock,

        // 3. Accessories
        accessoryCategories,
        accessoryItems,
        accessoryTransactions,
        addAccessoryCategory,
        addAccessoryItem,
        updateAccessoryItem,
        deleteAccessoryItem,
        accessoryStockIn,
        accessoryStockOut,
        accessoryTransfer,

        // 4. Mobiles
        mobileAssets,
        mobileHistory,
        addMobileAsset,
        updateMobileAsset,
        deleteMobileAsset,
        transferMobileAsset,

        // 5. Laptops
        laptops,
        laptopHistory,
        addLaptop,
        updateLaptop,
        deleteLaptop,
        transferLaptop,

        // 6. Custom Assets
        customCategories,
        customAssets,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
        addCustomAsset,
        updateCustomAsset,
        deleteCustomAsset,

        // Audit, Alerts & Centralized Sync
        auditLogs,
        lowStockAlerts: lowStockAlerts.filter((a) => !dismissedAlerts.includes(a.id)),
        dismissedAlerts,
        dismissAlert,
        syncStatus,
        syncError,
        clearSyncError: () => setSyncError(null),
        isLoadingData,
        isOnline,
        lastSaved,
        tableCounts,
        refreshFromCloud,
        resetAllData,
        resetToSampleData,
        importFromExcel,
        selectedCellFormula,
        setSelectedCellFormula,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
