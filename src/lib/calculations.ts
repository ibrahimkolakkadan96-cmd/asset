import { SystemAsset, AccessoryStock, StockTransaction, ALL_BRANCHES, BranchSummary } from '../types';

/**
 * Calculates the number of days since the system was issued.
 * If returned (or returnDate is present), calculates days between issueDate and returnDate.
 * Otherwise, calculates days between issueDate and current date.
 */
export function calculateDaysSinceIssued(issueDate: string, returnDate?: string): number {
  if (!issueDate) return 0;
  
  const issue = new Date(issueDate);
  if (isNaN(issue.getTime())) return 0;

  const endDate = returnDate && returnDate.trim() !== '' ? new Date(returnDate) : new Date();
  if (isNaN(endDate.getTime())) return 0;

  const diffTime = endDate.getTime() - issue.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Checks if stock quantity is low stock (1 or 0/negative)
 */
export function isLowStock(availableStock: number): boolean {
  return availableStock <= 1;
}

export function getStockStatus(availableStock: number): {
  label: string;
  isCritical: boolean;
  isOutOfStock: boolean;
  colorClass: string;
  badgeClass: string;
} {
  if (availableStock <= 0) {
    return {
      label: 'Out of Stock (0)',
      isCritical: true,
      isOutOfStock: true,
      colorClass: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      badgeClass: 'bg-red-600 text-white animate-pulse',
    };
  }
  if (availableStock === 1) {
    return {
      label: 'Critical Low (1 Pc)',
      isCritical: true,
      isOutOfStock: false,
      colorClass: 'text-red-700 bg-red-100 border-red-300 font-bold',
      badgeClass: 'bg-red-500 text-white',
    };
  }
  if (availableStock <= 3) {
    return {
      label: 'Low Warning',
      isCritical: false,
      isOutOfStock: false,
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      badgeClass: 'bg-amber-500 text-white',
    };
  }
  return {
    label: 'Normal Stock',
    isCritical: false,
    isOutOfStock: false,
    colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    badgeClass: 'bg-emerald-600 text-white',
  };
}

/**
 * Recomputes accessory stock balance given opening stock and list of transactions
 */
export function recomputeStockBalance(
  openingStock: number,
  transactions: StockTransaction[],
  branchNumber: number,
  accessoryName: string
): { stockIn: number; stockOut: number; availableStock: number; lastDate: string } {
  const filtered = transactions.filter(
    (tx) => tx.branchNumber === branchNumber && tx.accessoryName.toLowerCase() === accessoryName.toLowerCase()
  );

  let stockIn = 0;
  let stockOut = 0;
  let lastDate = '';

  for (const tx of filtered) {
    if (tx.type === 'IN') {
      stockIn += Number(tx.quantity) || 0;
    } else if (tx.type === 'OUT') {
      stockOut += Number(tx.quantity) || 0;
    }
    if (!lastDate || tx.transactionDate > lastDate) {
      lastDate = tx.transactionDate;
    }
  }

  const availableStock = openingStock + stockIn - stockOut;

  return { stockIn, stockOut, availableStock, lastDate };
}

/**
 * Calculates branch-wise summary metrics for all 22 branches
 */
export function calculateBranchSummaries(
  systems: SystemAsset[],
  accessories: AccessoryStock[]
): BranchSummary[] {
  return ALL_BRANCHES.map((bNum) => {
    const branchSystems = systems.filter((s) => s.branchNumber === bNum);
    const branchAccs = accessories.filter((a) => a.branchNumber === bNum);

    const totalSystems = branchSystems.length;
    const activeSystems = branchSystems.filter((s) => s.status === 'Active').length;
    const underRepairSystems = branchSystems.filter((s) => s.status === 'Under Repair').length;
    const returnedSystems = branchSystems.filter((s) => s.status === 'Returned').length;

    let totalAccessories = 0;
    let lowStockItemsCount = 0;
    const accessoryBreakdown: Record<string, number> = {};

    for (const acc of branchAccs) {
      totalAccessories += acc.availableStock;
      if (acc.availableStock <= 1) {
        lowStockItemsCount++;
      }
      accessoryBreakdown[acc.accessoryName] = acc.availableStock;
    }

    return {
      branchNumber: bNum,
      branchName: `Branch ${bNum}`,
      totalSystems,
      activeSystems,
      underRepairSystems,
      returnedSystems,
      totalAccessories,
      totalAccessoriesStock: totalAccessories,
      lowStockItemsCount,
      accessoryBreakdown,
    };
  });
}
