import * as XLSX from 'xlsx';
import { SystemAsset, AccessoryStock, StockTransaction, ALL_BRANCHES, STANDARD_ACCESSORIES } from '../types';
import { calculateDaysSinceIssued } from './calculations';

export function exportTrackerToExcel(
  systems: SystemAsset[],
  accessories: AccessoryStock[],
  transactions: StockTransaction[]
): void {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: Dashboard Summary
  // -------------------------------------------------------------
  const totalSystems = systems.length;
  const activeSystems = systems.filter((s) => s.status === 'Active').length;
  const repairSystems = systems.filter((s) => s.status === 'Under Repair').length;
  const returnedSystems = systems.filter((s) => s.status === 'Returned').length;
  const totalAccStock = accessories.reduce((sum, a) => sum + (Number(a.availableStock) || 0), 0);
  const lowStockCount = accessories.filter((a) => a.availableStock <= 1).length;

  const dashboardData: (string | number)[][] = [
    ['IT ASSET & ACCESSORIES MANAGEMENT TRACKER – BRANCH 1 TO 22'],
    ['Generated On:', new Date().toLocaleString()],
    [],
    ['KEY PERFORMANCE INDICATORS (KPIs)'],
    ['Metric Name', 'Count / Value', 'Status / Target'],
    ['Total Branches Tracked', 22, 'Branches 1 through 22'],
    ['Total Systems Registered', totalSystems, 'Across all 22 branches'],
    ['Active Systems in Operation', activeSystems, `${Math.round((activeSystems / (totalSystems || 1)) * 100)}% of total`],
    ['Systems Under Repair', repairSystems, repairSystems > 0 ? 'Requires attention' : 'Optimal'],
    ['Returned / Decommissioned Systems', returnedSystems, 'In central depot / store'],
    ['Total Available Accessories', totalAccStock, 'Units ready for issue'],
    ['Low Stock Items (<= 1 pc Alert)', lowStockCount, lowStockCount > 0 ? 'CRITICAL RESTOCK REQUIRED' : 'Sufficient'],
    [],
    ['BRANCH-WISE BREAKDOWN SUMMARY'],
    ['Branch Number', 'Total Systems', 'Active Systems', 'Under Repair', 'Returned', 'Total Accessories Stock', 'Low Stock Items (<=1)'],
  ];

  for (const bNum of ALL_BRANCHES) {
    const bSys = systems.filter((s) => s.branchNumber === bNum);
    const bAcc = accessories.filter((a) => a.branchNumber === bNum);
    const bActive = bSys.filter((s) => s.status === 'Active').length;
    const bRepair = bSys.filter((s) => s.status === 'Under Repair').length;
    const bRet = bSys.filter((s) => s.status === 'Returned').length;
    const bTotalAcc = bAcc.reduce((sum, a) => sum + a.availableStock, 0);
    const bLow = bAcc.filter((a) => a.availableStock <= 1).length;

    dashboardData.push([
      `Branch ${bNum}`,
      bSys.length,
      bActive,
      bRepair,
      bRet,
      bTotalAcc,
      bLow > 0 ? `${bLow} [ALERT]` : 0,
    ]);
  }

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');

  // -------------------------------------------------------------
  // Sheet 2: System Details (Main Sheet)
  // -------------------------------------------------------------
  const systemHeaders = [
    'Branch Number',
    'System / PC Name',
    'System Generation',
    'Processor Details',
    'RAM Capacity',
    'Storage Type (SSD / HDD)',
    'Storage Capacity',
    'Windows Version',
    'System Serial Number',
    'System Issue Date',
    'System Return Date',
    'Days Since Issued',
    'System Status',
    'Remarks',
  ];

  const systemRows = systems.map((sys) => {
    const days = calculateDaysSinceIssued(sys.issueDate || '', sys.returnDate || '');
    return [
      `Branch ${sys.branchNumber}`,
      sys.systemName,
      sys.generation,
      sys.processor,
      sys.ram,
      sys.storageType,
      sys.storageCapacity,
      sys.windowsVersion,
      sys.serialNumber,
      sys.issueDate,
      sys.returnDate || '',
      days,
      sys.status,
      sys.remarks || '',
    ];
  });

  const wsSystems = XLSX.utils.aoa_to_sheet([systemHeaders, ...systemRows]);
  
  // Set column widths for professional display
  wsSystems['!cols'] = [
    { wch: 14 }, // Branch Number
    { wch: 20 }, // System Name
    { wch: 16 }, // Generation
    { wch: 28 }, // Processor
    { wch: 18 }, // RAM
    { wch: 16 }, // Storage Type
    { wch: 18 }, // Storage Capacity
    { wch: 22 }, // Windows Version
    { wch: 20 }, // Serial Number
    { wch: 16 }, // Issue Date
    { wch: 16 }, // Return Date
    { wch: 18 }, // Days Since Issued
    { wch: 16 }, // Status
    { wch: 35 }, // Remarks
  ];
  XLSX.utils.book_append_sheet(wb, wsSystems, 'System Details');

  // -------------------------------------------------------------
  // Sheet 3: IT Accessories Stock (Separate Sheet)
  // -------------------------------------------------------------
  const accHeaders = [
    'Branch Number',
    'Accessory Name',
    'Opening Stock',
    'Stock IN',
    'Stock OUT',
    'Available Stock',
    'Stock Alert Level',
    'Transaction Date',
    'Remarks',
  ];

  const accRows = accessories.map((acc) => {
    let alertStatus = 'NORMAL';
    if (acc.availableStock <= 0) {
      alertStatus = '🔴 OUT OF STOCK (0)';
    } else if (acc.availableStock === 1) {
      alertStatus = '🔴 CRITICAL LOW (1 PIECE)';
    } else if (acc.availableStock <= 3) {
      alertStatus = '🟡 LOW STOCK WARNING';
    }

    return [
      `Branch ${acc.branchNumber}`,
      acc.accessoryName,
      acc.openingStock,
      acc.stockIn,
      acc.stockOut,
      acc.availableStock,
      alertStatus,
      acc.lastTransactionDate,
      acc.remarks || '',
    ];
  });

  const wsAccessories = XLSX.utils.aoa_to_sheet([accHeaders, ...accRows]);
  wsAccessories['!cols'] = [
    { wch: 14 },
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 26 },
    { wch: 16 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAccessories, 'Accessories Stock');

  // -------------------------------------------------------------
  // Sheet 4: Stock IN-OUT Transactions
  // -------------------------------------------------------------
  const txHeaders = [
    'Transaction ID',
    'Transaction Date',
    'Branch Number',
    'Accessory Name',
    'Transaction Type (IN / OUT)',
    'Quantity',
    'Issued To / Received From',
    'Reference / Challan No.',
    'Remarks',
  ];

  const txRows = transactions.map((tx) => [
    tx.id,
    tx.transactionDate,
    `Branch ${tx.branchNumber}`,
    tx.accessoryName,
    tx.type,
    tx.quantity,
    tx.issuedToOrFrom || '',
    tx.referenceNo || '',
    tx.remarks || '',
  ]);

  const wsTransactions = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  wsTransactions['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'IN-OUT Transactions');

  // -------------------------------------------------------------
  // Sheet 5: Branch-Wise Stock Matrix
  // -------------------------------------------------------------
  const matrixHeaders = [
    'Branch Number',
    ...STANDARD_ACCESSORIES,
    'Total Accessories',
    'Low Stock Items (<=1)',
  ];

  const matrixRows = ALL_BRANCHES.map((bNum) => {
    const bAcc = accessories.filter((a) => a.branchNumber === bNum);
    const row: (string | number)[] = [`Branch ${bNum}`];

    let total = 0;
    let lowCount = 0;

    for (const accName of STANDARD_ACCESSORIES) {
      const match = bAcc.find((a) => a.accessoryName.toLowerCase() === accName.toLowerCase());
      const qty = match ? match.availableStock : 0;
      total += qty;
      if (qty <= 1) lowCount++;
      row.push(qty <= 1 ? `${qty} [ALERT]` : qty);
    }

    row.push(total);
    row.push(lowCount > 0 ? `${lowCount} ALERT(S)` : 0);
    return row;
  });

  const wsMatrix = XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixRows]);
  wsMatrix['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Branch Stock Matrix');

  // Generate binary and trigger download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `IT_Asset_Tracker_Branches_1_to_22_${dateStr}.xlsx`);
}

/**
 * Parses an uploaded Excel workbook to extract systems, accessories, and transactions
 */
export async function parseExcelFile(
  file: File
): Promise<{
  systems: SystemAsset[];
  accessories: AccessoryStock[];
  transactions: StockTransaction[];
}> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  const systems: SystemAsset[] = [];
  const accessories: AccessoryStock[] = [];
  const transactions: StockTransaction[] = [];

  // 1. Check for "System Details" sheet
  const sysSheetName = wb.SheetNames.find(
    (name) => name.toLowerCase().includes('system') || name.toLowerCase().includes('asset')
  );
  if (sysSheetName) {
    const ws = wb.Sheets[sysSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
    // First row is headers, remaining rows are data
    if (rawData.length > 1) {
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[1]) continue; // Skip empty rows

        let branchNum = 1;
        if (typeof row[0] === 'number') {
          branchNum = Math.max(1, Math.min(22, row[0]));
        } else if (typeof row[0] === 'string') {
          const match = row[0].match(/\d+/);
          if (match) branchNum = Math.max(1, Math.min(22, parseInt(match[0], 10)));
        }

        const systemName = String(row[1] || `PC-${i}`).trim();
        const generation = String(row[2] || '12th Gen').trim();
        const processor = String(row[3] || 'Intel Core i5').trim();
        const ram = String(row[4] || '16GB DDR4').trim();
        const storageType = (String(row[5] || 'SSD').trim() as any) || 'SSD';
        const storageCapacity = String(row[6] || '512GB SSD').trim();
        const windowsVersion = String(row[7] || 'Windows 11 Pro').trim();
        const serialNumber = String(row[8] || `SN-${branchNum}-${Date.now()}-${i}`).trim();
        const issueDate = String(row[9] || new Date().toISOString().split('T')[0]).trim();
        const returnDate = row[10] ? String(row[10]).trim() : '';
        const status = (String(row[12] || 'Active').trim() as any) || 'Active';
        const remarks = row[13] ? String(row[13]).trim() : '';

        systems.push({
          id: `imp-sys-${Date.now()}-${i}`,
          branchNumber: branchNum,
          systemName,
          generation,
          processor,
          ram,
          storageType: ['SSD', 'HDD', 'SSD + HDD'].includes(storageType) ? storageType : 'SSD',
          storageCapacity,
          windowsVersion,
          serialNumber,
          issueDate,
          returnDate,
          status: ['Active', 'Returned', 'Under Repair'].includes(status) ? status : 'Active',
          remarks,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Check for "Accessories Stock" sheet
  const accSheetName = wb.SheetNames.find((name) => name.toLowerCase().includes('accessor'));
  if (accSheetName) {
    const ws = wb.Sheets[accSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
    if (rawData.length > 1) {
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[1]) continue;

        let branchNum = 1;
        if (typeof row[0] === 'number') {
          branchNum = Math.max(1, Math.min(22, row[0]));
        } else if (typeof row[0] === 'string') {
          const match = row[0].match(/\d+/);
          if (match) branchNum = Math.max(1, Math.min(22, parseInt(match[0], 10)));
        }

        const accessoryName = String(row[1]).trim();
        const openingStock = Number(row[2]) || 0;
        const stockIn = Number(row[3]) || 0;
        const stockOut = Number(row[4]) || 0;
        const availableStock = openingStock + stockIn - stockOut;
        const lastTransactionDate = row[7] ? String(row[7]).trim() : new Date().toISOString().split('T')[0];
        const remarks = row[8] ? String(row[8]).trim() : '';

        accessories.push({
          id: `B${branchNum}_${accessoryName.replace(/\s+/g, '_')}`,
          branchNumber: branchNum,
          accessoryName,
          openingStock,
          stockIn,
          stockOut,
          availableStock,
          lastTransactionDate,
          remarks,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 3. Check for "Transactions" sheet
  const txSheetName = wb.SheetNames.find(
    (name) => name.toLowerCase().includes('transact') || name.toLowerCase().includes('in-out')
  );
  if (txSheetName) {
    const ws = wb.Sheets[txSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
    if (rawData.length > 1) {
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[3]) continue;

        const id = String(row[0] || `TX-${1000 + i}`).trim();
        const transactionDate = String(row[1] || new Date().toISOString().split('T')[0]).trim();
        let branchNum = 1;
        if (typeof row[2] === 'number') {
          branchNum = Math.max(1, Math.min(22, row[2]));
        } else if (typeof row[2] === 'string') {
          const match = row[2].match(/\d+/);
          if (match) branchNum = Math.max(1, Math.min(22, parseInt(match[0], 10)));
        }
        const accessoryName = String(row[3]).trim();
        const typeRaw = String(row[4] || 'IN').toUpperCase().trim();
        const type = typeRaw.includes('OUT') ? 'OUT' : 'IN';
        const quantity = Number(row[5]) || 1;
        const issuedToOrFrom = row[6] ? String(row[6]).trim() : '';
        const referenceNo = row[7] ? String(row[7]).trim() : '';
        const remarks = row[8] ? String(row[8]).trim() : '';

        transactions.push({
          id,
          transactionDate,
          branchNumber: branchNum,
          accessoryName,
          type,
          quantity,
          issuedToOrFrom,
          referenceNo,
          remarks,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  return { systems, accessories, transactions };
}
