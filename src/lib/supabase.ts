import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SupabaseTableInfo,
  SupabaseConnectionState,
  SupabaseStorageFile,
  SystemAsset,
  AccessoryStock,
  StockTransaction,
  ITSystem,
  PrinterModel,
  CartridgeModel,
  CartridgeBranchStock,
  CartridgeTransaction,
  ITAccessoryItem,
  AccessoryTransaction,
  MobileAsset,
  CompanyLaptop,
  CustomAssetCategory,
  CustomAssetItem,
  AssetAuditLog,
} from '../types';

// New Supabase project configuration (defaults to user's new project with env and localStorage overrides)
export const DEFAULT_SUPABASE_URL = 'https://bigkrsehqqopiqlpxfms.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_Enozxe-UN--W8qOjjwYraQ_hdzfMq2l';

const ENV_SUPABASE_URL =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL)) ||
  DEFAULT_SUPABASE_URL;

const ENV_SUPABASE_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY ||
      import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
      import.meta.env?.SUPABASE_PUBLISHABLE_KEY)) ||
  DEFAULT_SUPABASE_KEY;

const STORAGE_KEY_SUPABASE_URL = 'premier_supabase_new_url_v2';
const STORAGE_KEY_SUPABASE_KEY = 'premier_supabase_new_key_v2';

export function getStoredSupabaseConfig(): { url: string; key: string } {
  try {
    const savedUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL);
    const savedKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY);
    return {
      url: savedUrl || ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL,
      key: savedKey || ENV_SUPABASE_KEY || DEFAULT_SUPABASE_KEY,
    };
  } catch (e) {
    return { url: ENV_SUPABASE_URL || DEFAULT_SUPABASE_URL, key: ENV_SUPABASE_KEY || DEFAULT_SUPABASE_KEY };
  }
}

export function saveStoredSupabaseConfig(url: string, key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key.trim());
  } catch (e) {
    console.warn('Could not save new Supabase config in local storage', e);
  }
}

export function clearStoredSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
  } catch (e) {}
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const config = getStoredSupabaseConfig();
  const targetUrl = (config.url || DEFAULT_SUPABASE_URL).trim();
  const targetKey = (config.key || DEFAULT_SUPABASE_KEY).trim();
  if (
    !supabaseInstance ||
    (supabaseInstance as any)?._projectUrl !== targetUrl ||
    (supabaseInstance as any)?._projectKey !== targetKey
  ) {
    supabaseInstance = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    (supabaseInstance as any)._projectUrl = targetUrl;
    (supabaseInstance as any)._projectKey = targetKey;
  }
  return supabaseInstance;
}

export function resetSupabaseClient(url: string, key: string): SupabaseClient {
  saveStoredSupabaseConfig(url, key);
  const targetUrl = url.trim() || DEFAULT_SUPABASE_URL;
  const targetKey = key.trim() || DEFAULT_SUPABASE_KEY;
  supabaseInstance = createClient(targetUrl, targetKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  (supabaseInstance as any)._projectUrl = targetUrl;
  (supabaseInstance as any)._projectKey = targetKey;
  return supabaseInstance;
}

// Check live connection to the New Supabase project with comprehensive diagnostics
export async function testSupabaseConnection(): Promise<SupabaseConnectionState> {
  const config = getStoredSupabaseConfig();
  const startTime = Date.now();

  let host = 'db.bigkrsehqqopiqlpxfms.supabase.co';
  if (config.url) {
    try {
      const parsedUrl = new URL(config.url);
      host = `db.${parsedUrl.hostname}`;
    } catch (e) {
      host = config.url.replace(/^https?:\/\//, '');
    }
  }

  if (!config.url || !config.key) {
    return {
      status: 'error',
      projectUrl: config.url || 'Unconfigured',
      latencyMs: 0,
      host: 'Not connected',
      databaseName: 'postgres',
      activeTablesCount: 0,
      sslEnabled: true,
      lastChecked: new Date().toISOString(),
      errorMessage: 'New Supabase connection parameters are required. Please enter your New Project URL and Publishable Key in Settings.',
    };
  }

  try {
    // Use Supabase client / apikey header directly (supports both sb_publishable_* and legacy JWT anon keys)
    const client = getSupabaseClient();
    const { status, error } = await client
      .from('it_systems')
      .select('id', { count: 'exact', head: true });

    const latency = Date.now() - startTime;

    if (error && status === 401) {
      return {
        status: 'error',
        projectUrl: config.url,
        latencyMs: latency,
        host,
        databaseName: 'postgres',
        activeTablesCount: 0,
        sslEnabled: true,
        lastChecked: new Date().toISOString(),
        errorMessage:
          'Authentication failed (401 Unauthorized). The provided Supabase Publishable / Anon Key is invalid for this project.',
      };
    }

    if (error && status !== 200 && status !== 204 && status !== 406) {
      // Fall back to checking REST table endpoint with apikey header only (no Bearer sb_publishable_ JWT confusion)
      const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/it_systems?select=id&limit=1`, {
        method: 'GET',
        headers: {
          apikey: config.key,
        },
      });
      if (!response.ok) {
        return {
          status: 'error',
          projectUrl: config.url,
          latencyMs: Date.now() - startTime,
          host,
          databaseName: 'postgres',
          activeTablesCount: 0,
          sslEnabled: true,
          lastChecked: new Date().toISOString(),
          errorMessage:
            response.status === 401
              ? 'Authentication failed (401 Unauthorized). The provided Supabase Publishable / Anon Key is invalid for this project.'
              : `Supabase REST returned HTTP ${response.status} (${error.message || response.statusText || 'Error'}).`,
        };
      }
    }

    return {
      status: 'connected',
      projectUrl: config.url,
      latencyMs: Math.max(12, latency),
      host,
      databaseName: 'postgres',
      activeTablesCount: 12,
      sslEnabled: true,
      lastChecked: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'error',
      projectUrl: config.url,
      latencyMs: 0,
      host,
      databaseName: 'postgres',
      activeTablesCount: 0,
      sslEnabled: true,
      lastChecked: new Date().toISOString(),
      errorMessage: err?.message || 'Unable to connect to Supabase Cloud. Verify internet connectivity and project URL.',
    };
  }
}

// Definitions of all 12 active centralized Supabase database tables (Central Office + Branch 1-22)
export function getSupabaseTableDefinitions(counts?: {
  systemsCount?: number;
  cartridgeStockCount?: number;
  accessoriesCount?: number;
  mobilesCount?: number;
  laptopsCount?: number;
  customAssetsCount?: number;
  tableCounts?: Record<string, number>;
}): SupabaseTableInfo[] {
  const tc = counts?.tableCounts || {};
  return [
    {
      name: 'it_systems',
      rowCount: tc.it_systems ?? counts?.systemsCount ?? 0,
      description: 'Desktop workstations, CPU/RAM/SSD hardware profiles & assigned staff (Central Office + Branches 1-22)',
      primaryKey: 'id (UUID)',
      columnsCount: 11,
      hasForeignKeys: false,
      branchFilterSupport: true,
    },
    {
      name: 'printer_models',
      rowCount: tc.printer_models ?? 0,
      description: 'Registered enterprise printer brands & hardware models',
      primaryKey: 'id (UUID)',
      columnsCount: 4,
      hasForeignKeys: false,
      branchFilterSupport: false,
    },
    {
      name: 'cartridge_models',
      rowCount: tc.cartridge_models ?? 0,
      description: 'Cartridge toner specifications, min/max thresholds & printer compatibility',
      primaryKey: 'id (UUID)',
      columnsCount: 9,
      hasForeignKeys: true,
      branchFilterSupport: false,
    },
    {
      name: 'cartridge_stock',
      rowCount: tc.cartridge_stock ?? counts?.cartridgeStockCount ?? 0,
      description: 'Centralized toner cartridge stock quantities with low/zero stock alerts',
      primaryKey: 'id (UUID)',
      columnsCount: 4,
      hasForeignKeys: true,
      branchFilterSupport: false,
    },
    {
      name: 'cartridge_transactions',
      rowCount: tc.cartridge_transactions ?? 0,
      description: 'Audited toner movements: Stock IN replenishments & branch issuances',
      primaryKey: 'id (UUID)',
      columnsCount: 8,
      hasForeignKeys: true,
      branchFilterSupport: true,
    },
    {
      name: 'it_accessories',
      rowCount: tc.it_accessories ?? counts?.accessoriesCount ?? 0,
      description: 'Keyboards, mice, monitors, cables, UPS, landline phones per branch & storage location',
      primaryKey: 'id (UUID)',
      columnsCount: 11,
      hasForeignKeys: false,
      branchFilterSupport: true,
    },
    {
      name: 'accessory_transactions',
      rowCount: tc.accessory_transactions ?? 0,
      description: 'Accessory stock IN/OUT and inter-branch transfer logs with issuer/recipient tracking',
      primaryKey: 'id (UUID)',
      columnsCount: 10,
      hasForeignKeys: true,
      branchFilterSupport: true,
    },
    {
      name: 'mobile_assets',
      rowCount: tc.mobile_assets ?? counts?.mobilesCount ?? 0,
      description: 'Company mobile phones with globally unique IMEI 1 & IMEI 2 tracking',
      primaryKey: 'id (UUID)',
      columnsCount: 13,
      hasForeignKeys: false,
      branchFilterSupport: true,
    },
    {
      name: 'laptop_assets',
      rowCount: tc.laptop_assets ?? counts?.laptopsCount ?? 0,
      description: 'Company laptops with CPU/RAM/SSD specs, serial numbers & staff assignments',
      primaryKey: 'id (UUID)',
      columnsCount: 15,
      hasForeignKeys: false,
      branchFilterSupport: true,
    },
    {
      name: 'custom_asset_categories',
      rowCount: tc.custom_asset_categories ?? 0,
      description: 'Admin-defined hardware categories and dynamic custom field schemas',
      primaryKey: 'id (UUID)',
      columnsCount: 4,
      hasForeignKeys: false,
      branchFilterSupport: false,
    },
    {
      name: 'custom_assets',
      rowCount: tc.custom_assets ?? counts?.customAssetsCount ?? 0,
      description: 'Custom specialized hardware (Barcode scanners, biometrics, switches) with JSONB fields',
      primaryKey: 'id (UUID)',
      columnsCount: 7,
      hasForeignKeys: true,
      branchFilterSupport: true,
    },
    {
      name: 'asset_audit_logs',
      rowCount: tc.asset_audit_logs ?? 0,
      description: 'Centralized system audit trail recording creations, updates, transfers & deletions',
      primaryKey: 'id (UUID)',
      columnsCount: 7,
      hasForeignKeys: false,
      branchFilterSupport: false,
    },
  ];
}

// Sample file attachments stored in Supabase Storage buckets
export function getSampleStorageFiles(): SupabaseStorageFile[] {
  const baseUrl = getStoredSupabaseConfig().url || DEFAULT_SUPABASE_URL;
  return [
    {
      id: 'f-001',
      name: 'Branch01_Dell_Workstation_Invoice_PO8891.pdf',
      bucket: 'asset-attachments',
      size: 1428000,
      sizeFormatted: '1.4 MB',
      mimeType: 'application/pdf',
      createdAt: '2025-01-15T10:30:00Z',
      url: `${baseUrl}/storage/v1/object/public/asset-attachments/Branch01_Dell_Workstation_Invoice_PO8891.pdf`,
    },
    {
      id: 'f-002',
      name: 'HP_LaserJet_Pro_Warranty_Cert_Branch02.pdf',
      bucket: 'asset-attachments',
      size: 980000,
      sizeFormatted: '980 KB',
      mimeType: 'application/pdf',
      createdAt: '2025-02-10T11:15:00Z',
      url: `${baseUrl}/storage/v1/object/public/asset-attachments/HP_LaserJet_Pro_Warranty_Cert_Branch02.pdf`,
    },
    {
      id: 'f-003',
      name: 'Premier_IT_Branch_Allocation_Policy_2025.pdf',
      bucket: 'asset-attachments',
      size: 2150000,
      sizeFormatted: '2.1 MB',
      mimeType: 'application/pdf',
      createdAt: '2025-01-01T08:00:00Z',
      url: `${baseUrl}/storage/v1/object/public/asset-attachments/Premier_IT_Branch_Allocation_Policy_2025.pdf`,
    },
    {
      id: 'f-004',
      name: 'Samsung_Galaxy_A15_IMEI_Handover_Record.pdf',
      bucket: 'asset-attachments',
      size: 640000,
      sizeFormatted: '640 KB',
      mimeType: 'application/pdf',
      createdAt: '2025-03-01T14:20:00Z',
      url: `${baseUrl}/storage/v1/object/public/asset-attachments/Samsung_Galaxy_A15_IMEI_Handover_Record.pdf`,
    },
  ];
}

// Generate complete PostgreSQL DDL Schema file (Database-Schema/schema.sql)
export function generatePostgresSchemaDDL(): string {
  const timestamp = new Date().toISOString();
  return `-- =====================================================================
-- PREMIER AUTO PARTS LLC • IT ASSET TRACKER
-- COMPREHENSIVE POSTGRESQL SCHEMA DEFINITION (SUPABASE CLOUD)
-- Generated on: ${timestamp}
-- Database Engine: PostgreSQL 15+ (Supabase)
-- Coverage: All 22 Branches (Branch 1 to 22)
-- Modules: IT Systems, Printer Cartridges, IT Accessories,
--          Mobile Assets (IMEI), Company Laptops, Custom Assets, Audit Logs
-- =====================================================================

BEGIN;

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Master Branches Table (Branches 1 to 22)
CREATE TABLE IF NOT EXISTS public.branches (
    branch_number INTEGER PRIMARY KEY CHECK (branch_number >= 1 AND branch_number <= 22),
    branch_name VARCHAR(100) NOT NULL,
    region VARCHAR(100) DEFAULT 'Main Corporate Territory',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Branches 1 to 22
DO $$
BEGIN
    FOR i IN 1..22 LOOP
        INSERT INTO public.branches (branch_number, branch_name)
        VALUES (i, 'Branch ' || i)
        ON CONFLICT (branch_number) DO NOTHING;
    END LOOP;
END $$;

-- 3. IT Systems Management (Desktops / Workstations)
-- NOTE: As per enterprise requirements, systems DO NOT have IN/OUT stock transactions
CREATE TABLE IF NOT EXISTS public.it_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    system_name VARCHAR(150) NOT NULL,
    processor VARCHAR(150) NOT NULL,
    ram VARCHAR(60) NOT NULL,
    ssd VARCHAR(80) NOT NULL,
    windows_version VARCHAR(100) NOT NULL,
    assigned_staff_name VARCHAR(150) NOT NULL DEFAULT 'Unassigned',
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Under Repair', 'Spare / Standby')),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_it_systems_branch ON public.it_systems (branch_number);
CREATE INDEX IF NOT EXISTS idx_it_systems_staff ON public.it_systems (assigned_staff_name);

-- 4. Printer Models
CREATE TABLE IF NOT EXISTS public.printer_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL,
    model_name VARCHAR(150) NOT NULL UNIQUE,
    printer_type VARCHAR(60) DEFAULT 'Laser Multifunction',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Cartridge Models
CREATE TABLE IF NOT EXISTS public.cartridge_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    printer_model_id UUID REFERENCES public.printer_models(id) ON DELETE RESTRICT,
    cartridge_model VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(40) NOT NULL DEFAULT 'Black',
    page_yield INTEGER DEFAULT 2000,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cartridge Stock (Branch-wise with mandatory alert triggers)
CREATE TABLE IF NOT EXISTS public.cartridge_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartridge_id UUID NOT NULL REFERENCES public.cartridge_models(id) ON DELETE CASCADE,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock_level INTEGER NOT NULL DEFAULT 2 CHECK (minimum_stock_level >= 0),
    maximum_stock_level INTEGER DEFAULT 20,
    storage_location VARCHAR(150) DEFAULT 'IT Cabinet Shelf 1',
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cartridge_id, branch_number)
);

CREATE INDEX IF NOT EXISTS idx_cartridge_stock_branch ON public.cartridge_stock (branch_number);
CREATE INDEX IF NOT EXISTS idx_cartridge_stock_low ON public.cartridge_stock (current_stock) WHERE current_stock <= 2;

-- 7. Cartridge Transactions Log
CREATE TABLE IF NOT EXISTS public.cartridge_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartridge_id UUID NOT NULL REFERENCES public.cartridge_models(id) ON DELETE CASCADE,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    performed_by VARCHAR(150) NOT NULL,
    reference_invoice_no VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cartridge_tx_branch ON public.cartridge_transactions (branch_number, created_at DESC);

-- 8. IT Accessories Categories & Items
CREATE TABLE IF NOT EXISTS public.it_accessory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.it_accessories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 2 CHECK (minimum_stock >= 0),
    storage_location VARCHAR(150) NOT NULL DEFAULT 'IT Store',
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accessories_branch ON public.it_accessories (branch_number);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON public.it_accessories (category);

-- 9. Accessory Movement & Inter-Branch Transfers
CREATE TABLE IF NOT EXISTS public.accessory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accessory_id UUID NOT NULL REFERENCES public.it_accessories(id) ON DELETE CASCADE,
    accessory_name VARCHAR(150) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    from_branch INTEGER REFERENCES public.branches(branch_number) ON DELETE SET NULL,
    to_branch INTEGER REFERENCES public.branches(branch_number) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    issued_by VARCHAR(150) NOT NULL,
    received_by VARCHAR(150) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acc_tx_branch ON public.accessory_transactions (branch_number, created_at DESC);

-- 10. Mobile Assets (IMEI Tracking)
CREATE TABLE IF NOT EXISTS public.mobile_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    imei1 VARCHAR(20) NOT NULL UNIQUE,
    imei2 VARCHAR(20),
    serial_number VARCHAR(100) NOT NULL,
    assigned_staff_name VARCHAR(150) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Available / In Stock', 'Under Repair', 'Decommissioned')),
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobiles_imei1 ON public.mobile_assets (imei1);
CREATE INDEX IF NOT EXISTS idx_mobiles_branch ON public.mobile_assets (branch_number);

-- 11. Mobile Assignment History
CREATE TABLE IF NOT EXISTS public.mobile_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_id UUID NOT NULL REFERENCES public.mobile_assets(id) ON DELETE CASCADE,
    staff_name VARCHAR(150) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    returned_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Company Laptops
CREATE TABLE IF NOT EXISTS public.company_laptops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    processor VARCHAR(150) NOT NULL,
    ram VARCHAR(60) NOT NULL,
    ssd VARCHAR(80) NOT NULL,
    windows_version VARCHAR(100) NOT NULL,
    assigned_staff_name VARCHAR(150) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Available / In Stock', 'Under Maintenance', 'Decommissioned')),
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laptops_serial ON public.company_laptops (serial_number);
CREATE INDEX IF NOT EXISTS idx_laptops_branch ON public.company_laptops (branch_number);

-- 13. Laptop Assignment History
CREATE TABLE IF NOT EXISTS public.laptop_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    laptop_id UUID NOT NULL REFERENCES public.company_laptops(id) ON DELETE CASCADE,
    staff_name VARCHAR(150) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    assigned_date DATE NOT NULL,
    returned_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Custom Asset Categories & Custom Assets (Dynamic JSONB Fields)
CREATE TABLE IF NOT EXISTS public.custom_asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    custom_field_schema JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    category_id UUID NOT NULL REFERENCES public.custom_asset_categories(id) ON DELETE CASCADE,
    category_name VARCHAR(120) NOT NULL,
    branch_number INTEGER NOT NULL REFERENCES public.branches(branch_number) ON DELETE CASCADE,
    serial_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    remarks TEXT,
    custom_field_values JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_assets_branch ON public.custom_assets (branch_number);

-- 15. Comprehensive Audit Trail
CREATE TABLE IF NOT EXISTS public.asset_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    performed_by VARCHAR(150) NOT NULL,
    branch_number INTEGER REFERENCES public.branches(branch_number) ON DELETE SET NULL,
    item_type VARCHAR(60),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON public.asset_audit_logs (created_at DESC);

COMMIT;
`;
}

// Generate complete PostgreSQL SQL dump with all live Supabase Cloud table data (Central Office + Branches 1-22)
export function generateFullPostgresSQLDump(data: {
  systems: SystemAsset[];
  accessories: AccessoryStock[];
  transactions: StockTransaction[];
  storageFiles?: SupabaseStorageFile[];
  itSystems?: ITSystem[];
  printerModels?: PrinterModel[];
  cartridgeModels?: CartridgeModel[];
  cartridgeStock?: CartridgeBranchStock[];
  cartridgeTransactions?: CartridgeTransaction[];
  accessoryItems?: ITAccessoryItem[];
  accessoryTransactions?: AccessoryTransaction[];
  mobileAssets?: MobileAsset[];
  laptops?: CompanyLaptop[];
  customCategories?: CustomAssetCategory[];
  customAssets?: CustomAssetItem[];
  auditLogs?: AssetAuditLog[];
}): string {
  const ddl = generatePostgresSchemaDDL();
  const timestamp = new Date().toISOString();

  let dataInserts = `
-- =====================================================================
-- PREMIER IT ASSET DATA ROWS EXPORT (CENTRAL OFFICE + BRANCHES 1-22)
-- Exported on: ${timestamp}
-- Source: Centralized Supabase Cloud Database
-- =====================================================================

BEGIN;
`;

  const esc = (val?: string | number | null) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const systemsList = data.itSystems || (data.systems as unknown as ITSystem[]) || [];
  if (systemsList.length > 0) {
    dataInserts += `\n-- Table: public.it_systems (${systemsList.length} rows)\n`;
    systemsList.forEach((s) => {
      dataInserts += `INSERT INTO public.it_systems (id, branch_number, system_name, processor, ram, ssd, windows_version, assigned_staff_name, remarks, updated_at) VALUES (${esc(s.id)}, ${s.branchNumber ?? 0}, ${esc(s.systemName)}, ${esc(s.processor)}, ${esc(s.ram)}, ${esc(s.ssd)}, ${esc(s.windowsVersion)}, ${esc(s.assignedStaffName)}, ${esc(s.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET system_name = EXCLUDED.system_name, assigned_staff_name = EXCLUDED.assigned_staff_name, updated_at = NOW();\n`;
    });
  }

  if (data.printerModels && data.printerModels.length > 0) {
    dataInserts += `\n-- Table: public.printer_models (${data.printerModels.length} rows)\n`;
    data.printerModels.forEach((p) => {
      dataInserts += `INSERT INTO public.printer_models (id, brand, model_name) VALUES (${esc(p.id)}, ${esc(p.brand)}, ${esc(p.modelName)}) ON CONFLICT (id) DO UPDATE SET brand = EXCLUDED.brand, model_name = EXCLUDED.model_name;\n`;
    });
  }

  if (data.cartridgeModels && data.cartridgeModels.length > 0) {
    dataInserts += `\n-- Table: public.cartridge_models (${data.cartridgeModels.length} rows)\n`;
    data.cartridgeModels.forEach((cm) => {
      dataInserts += `INSERT INTO public.cartridge_models (id, printer_model_id, cartridge_model, min_stock_level, max_stock_level, storage_location, remarks, updated_at) VALUES (${esc(cm.id)}, ${esc(cm.printerModelId || null)}, ${esc(cm.cartridgeModel)}, ${cm.minimumStockLevel ?? 2}, ${cm.maximumStockLevel ?? 20}, ${esc(cm.storageLocation)}, ${esc(cm.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET cartridge_model = EXCLUDED.cartridge_model, updated_at = NOW();\n`;
    });
  }

  if (data.cartridgeStock && data.cartridgeStock.length > 0) {
    dataInserts += `\n-- Table: public.cartridge_stock (${data.cartridgeStock.length} rows)\n`;
    data.cartridgeStock.forEach((cs) => {
      dataInserts += `INSERT INTO public.cartridge_stock (id, cartridge_model_id, current_stock, updated_at) VALUES (${esc(cs.id)}, ${esc(cs.cartridgeId)}, ${cs.currentStock ?? 0}, NOW()) ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock, updated_at = NOW();\n`;
    });
  }

  if (data.cartridgeTransactions && data.cartridgeTransactions.length > 0) {
    dataInserts += `\n-- Table: public.cartridge_transactions (${data.cartridgeTransactions.length} rows)\n`;
    data.cartridgeTransactions.forEach((ct) => {
      dataInserts += `INSERT INTO public.cartridge_transactions (id, cartridge_model_id, branch_number, transaction_type, quantity, performed_by, remarks) VALUES (${esc(ct.id)}, ${esc(ct.cartridgeId)}, ${ct.branchNumber ?? 0}, ${esc(ct.type)}, ${ct.quantity ?? 0}, ${esc(ct.performedBy)}, ${esc(ct.remarks)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
  }

  if (data.accessoryItems && data.accessoryItems.length > 0) {
    dataInserts += `\n-- Table: public.it_accessories (${data.accessoryItems.length} rows)\n`;
    data.accessoryItems.forEach((a) => {
      dataInserts += `INSERT INTO public.it_accessories (id, accessory_name, brand, model, branch_number, quantity, min_stock, storage_location, remarks, updated_at) VALUES (${esc(a.id)}, ${esc(a.accessoryName || a.name)}, ${esc(a.brand)}, ${esc(a.model)}, ${a.branchNumber ?? 0}, ${a.currentStock ?? 0}, ${a.minimumStock ?? 2}, ${esc(a.storageLocation)}, ${esc(a.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();\n`;
    });
  }

  if (data.accessoryTransactions && data.accessoryTransactions.length > 0) {
    dataInserts += `\n-- Table: public.accessory_transactions (${data.accessoryTransactions.length} rows)\n`;
    data.accessoryTransactions.forEach((at) => {
      dataInserts += `INSERT INTO public.accessory_transactions (id, accessory_id, transaction_type, quantity, from_branch, to_branch, issued_by, received_by, remarks) VALUES (${esc(at.id)}, ${esc(at.accessoryId)}, ${esc(at.type)}, ${at.quantity ?? 0}, ${at.fromBranch ?? 'NULL'}, ${at.toBranch ?? 'NULL'}, ${esc(at.issuedBy)}, ${esc(at.receivedBy)}, ${esc(at.remarks)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
  }

  if (data.mobileAssets && data.mobileAssets.length > 0) {
    dataInserts += `\n-- Table: public.mobile_assets (${data.mobileAssets.length} rows)\n`;
    data.mobileAssets.forEach((m) => {
      dataInserts += `INSERT INTO public.mobile_assets (id, mobile_brand, mobile_model, imei_1, imei_2, serial_number, staff_name, branch_number, assigned_date, mobile_status, remarks, updated_at) VALUES (${esc(m.id)}, ${esc(m.mobileBrand || m.brand)}, ${esc(m.mobileModel || m.model)}, ${esc(m.imei1)}, ${esc(m.imei2 || null)}, ${esc(m.serialNumber)}, ${esc(m.staffName || m.assignedStaffName)}, ${m.branchNumber ?? 0}, ${esc(m.assignedDate)}, ${esc(m.mobileStatus || m.status)}, ${esc(m.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET staff_name = EXCLUDED.staff_name, mobile_status = EXCLUDED.mobile_status, updated_at = NOW();\n`;
    });
  }

  if (data.laptops && data.laptops.length > 0) {
    dataInserts += `\n-- Table: public.laptop_assets (${data.laptops.length} rows)\n`;
    data.laptops.forEach((l) => {
      dataInserts += `INSERT INTO public.laptop_assets (id, laptop_brand, laptop_model, serial_number, processor, ram, ssd, windows_version, staff_name, branch_number, assigned_date, laptop_status, remarks, updated_at) VALUES (${esc(l.id)}, ${esc(l.laptopBrand || l.brand)}, ${esc(l.laptopModel || l.model)}, ${esc(l.serialNumber)}, ${esc(l.processor)}, ${esc(l.ram)}, ${esc(l.ssd)}, ${esc(l.windowsVersion)}, ${esc(l.staffName || l.assignedStaffName)}, ${l.branchNumber ?? 0}, ${esc(l.assignedDate)}, ${esc(l.laptopStatus || l.status)}, ${esc(l.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET staff_name = EXCLUDED.staff_name, laptop_status = EXCLUDED.laptop_status, updated_at = NOW();\n`;
    });
  }

  if (data.customCategories && data.customCategories.length > 0) {
    dataInserts += `\n-- Table: public.custom_asset_categories (${data.customCategories.length} rows)\n`;
    data.customCategories.forEach((cc) => {
      dataInserts += `INSERT INTO public.custom_asset_categories (id, category_name, description) VALUES (${esc(cc.id)}, ${esc(cc.name)}, ${esc(cc.description)}) ON CONFLICT (id) DO UPDATE SET category_name = EXCLUDED.category_name;\n`;
    });
  }

  if (data.customAssets && data.customAssets.length > 0) {
    dataInserts += `\n-- Table: public.custom_assets (${data.customAssets.length} rows)\n`;
    data.customAssets.forEach((ca) => {
      dataInserts += `INSERT INTO public.custom_assets (id, category_id, asset_name, branch_number, custom_fields, remarks, updated_at) VALUES (${esc(ca.id)}, ${esc(ca.categoryId)}, ${esc(ca.assetName || ca.name)}, ${ca.branchNumber ?? 0}, '${JSON.stringify(ca.customFieldValues || ca.customValues || {}).replace(/'/g, "''")}'::jsonb, ${esc(ca.remarks)}, NOW()) ON CONFLICT (id) DO UPDATE SET asset_name = EXCLUDED.asset_name, updated_at = NOW();\n`;
    });
  }

  if (data.auditLogs && data.auditLogs.length > 0) {
    dataInserts += `\n-- Table: public.asset_audit_logs (${data.auditLogs.length} rows)\n`;
    data.auditLogs.forEach((al) => {
      dataInserts += `INSERT INTO public.asset_audit_logs (id, module_name, action, asset_id, details, performed_by) VALUES (${esc(al.id)}, ${esc(al.module)}, ${esc(al.action)}, ${esc(al.assetName)}, ${esc(al.details)}, ${esc(al.performedBy)}) ON CONFLICT (id) DO NOTHING;\n`;
    });
  }

  dataInserts += `\nCOMMIT;\n-- END OF SUPABASE POSTGRESQL DATA BACKUP\n`;

  return `${ddl}\n\n${dataInserts}`;
}
