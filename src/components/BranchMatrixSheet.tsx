import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Grid3X3,
  Building2,
  Monitor,
  Laptop,
  Smartphone,
  Printer,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface BranchMatrixSheetProps {
  onQuickRestock?: (branch: number, accessory: string) => void;
}

export const BranchMatrixSheet: React.FC<BranchMatrixSheetProps> = () => {
  const {
    systems,
    laptops,
    mobileAssets,
    cartridgeModels,
    cartridgeStock,
    accessoryCategories,
    accessoryItems,
    customAssets,
    setSelectedBranch,
    setActiveTab,
  } = useTracker();

  const [matrixView, setMatrixView] = useState<'overview' | 'cartridges' | 'accessories'>('overview');

  // Jump helper
  const handleBranchClick = (branch: number, targetTab: any) => {
    setSelectedBranch(branch);
    setActiveTab(targetTab);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
      {/* Header */}
      <div className="bg-[#FFFDF7] border-b border-[#E9E5DA] px-6 py-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#303B38] tracking-tight">
                22-Branch Multi-Asset Allocation Matrix
              </h1>
              <p className="text-xs text-[#7F8983]">
                Full enterprise cross-tabulation comparing inventory across Branches 1 to 22
              </p>
            </div>
          </div>

          {/* Sub Navigation Strip */}
          <div className="flex items-center gap-1 bg-[#F8F5EE] p-1 rounded-xl border border-[#E9E5DA]">
            <button
              onClick={() => setMatrixView('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                matrixView === 'overview'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>All Assets Overview</span>
            </button>
            <button
              onClick={() => setMatrixView('cartridges')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                matrixView === 'cartridges'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cartridges Matrix</span>
            </button>
            <button
              onClick={() => setMatrixView('accessories')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                matrixView === 'accessories'
                  ? 'bg-[#A8DCCB] text-[#303B38] font-bold shadow-xs'
                  : 'text-[#7F8983] hover:text-[#303B38]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Accessories Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E9E5DA] shadow-xs overflow-hidden">
          {matrixView === 'overview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch Location</th>
                    <th className="py-3 px-4 text-center">Desktops (PC)</th>
                    <th className="py-3 px-4 text-center">Laptops</th>
                    <th className="py-3 px-4 text-center">Mobiles (IMEI)</th>
                    <th className="py-3 px-4 text-center">Accessories (pcs)</th>
                    <th className="py-3 px-4 text-center">Cartridges (pcs)</th>
                    <th className="py-3 px-4 text-center">Custom Assets</th>
                    <th className="py-3 px-4 text-center">Total Assets</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {ALL_LOCATIONS.map((b) => {
                    const bSystems = systems.filter((s) => s.branchNumber === b).length;
                    const bLaptops = laptops.filter((l) => l.branchNumber === b).length;
                    const bMobiles = mobileAssets.filter((m) => m.branchNumber === b).length;
                    const bAcc = accessoryItems
                      .filter((a) => a.branchNumber === b)
                      .reduce((sum, a) => sum + a.currentStock, 0);
                    const bCart = cartridgeStock
                      .filter((c) => c.branchNumber === b)
                      .reduce((sum, c) => sum + c.currentStock, 0);
                    const bCustom = customAssets.filter((c) => c.branchNumber === b).length;
                    const bTotal = bSystems + bLaptops + bMobiles + bAcc + bCart + bCustom;

                    return (
                      <tr key={b} className="hover:bg-[#F8F5EE]/60 transition">
                        <td className="py-3 px-4 font-bold text-[#303B38] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#A8DCCB]"></span>
                          <span>{formatBranchLabel(b)}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-[#303B38]">{bSystems}</td>
                        <td className="py-3 px-4 text-center font-medium text-[#303B38]">{bLaptops}</td>
                        <td className="py-3 px-4 text-center font-medium text-[#303B38]">{bMobiles}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#F8F5EE] border border-[#E9E5DA] font-semibold text-[#303B38]">
                            {bAcc} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#D8EEE4] border border-[#A8DCCB] font-bold text-[#303B38]">
                            {bCart} pcs
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-[#7F8983]">{bCustom}</td>
                        <td className="py-3 px-4 text-center font-bold text-[#303B38] bg-[#F8F5EE]/30">
                          {bTotal} items
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleBranchClick(b, 'systems')}
                            className="text-[11px] font-bold text-[#303B38] hover:underline"
                          >
                            Explore →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#EADCCB]/40 font-bold text-[#303B38] border-t-2 border-[#E9E5DA]">
                  <tr>
                    <td className="py-3 px-4">Enterprise Grand Total (22 Branches)</td>
                    <td className="py-3 px-4 text-center">{systems.length}</td>
                    <td className="py-3 px-4 text-center">{laptops.length}</td>
                    <td className="py-3 px-4 text-center">{mobileAssets.length}</td>
                    <td className="py-3 px-4 text-center">
                      {accessoryItems.reduce((sum, a) => sum + a.currentStock, 0)} pcs
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cartridgeStock.reduce((sum, c) => sum + c.currentStock, 0)} pcs
                    </td>
                    <td className="py-3 px-4 text-center">{customAssets.length}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-[#303B38]">
                      {systems.length +
                        laptops.length +
                        mobileAssets.length +
                        accessoryItems.reduce((s, a) => s + a.currentStock, 0) +
                        cartridgeStock.reduce((s, c) => s + c.currentStock, 0) +
                        customAssets.length}{' '}
                      Units
                    </td>
                    <td className="py-3 px-4 text-right">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {matrixView === 'cartridges' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    {cartridgeModels.map((cm) => (
                      <th key={cm.id} className="py-3 px-3 text-center">
                        <div>{cm.cartridgeModel}</div>
                        <div className="text-[10px] text-[#7F8983] font-normal">{cm.color}</div>
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Branch Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {ALL_LOCATIONS.map((b) => {
                    let branchSum = 0;
                    return (
                      <tr key={b} className="hover:bg-[#F8F5EE]/60 transition">
                        <td className="py-3 px-4 font-bold text-[#303B38]">{formatBranchLabel(b)}</td>
                        {cartridgeModels.map((cm) => {
                          const stock = cartridgeStock.find(
                            (s) => s.branchNumber === b && s.cartridgeId === cm.id
                          );
                          const qty = stock ? stock.currentStock : 0;
                          const min = stock ? stock.minimumStockLevel : 2;
                          branchSum += qty;

                          const isZero = qty === 0;
                          const isLow = !isZero && qty <= min;

                          return (
                            <td key={cm.id} className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isZero
                                    ? 'bg-[#F4A58F] text-white shadow-xs'
                                    : isLow
                                    ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                                    : 'bg-[#D8EEE4] text-[#303B38]'
                                }`}
                              >
                                {qty}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center font-bold text-[#303B38] bg-[#F8F5EE]/40">
                          {branchSum} pcs
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {matrixView === 'accessories' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                  <tr>
                    <th className="py-3 px-4">Branch</th>
                    {accessoryCategories.map((cat) => (
                      <th key={cat.id} className="py-3 px-3 text-center">
                        {cat.name}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Total Per Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E5DA]/60">
                  {ALL_LOCATIONS.map((b) => {
                    let totalPcs = 0;
                    return (
                      <tr key={b} className="hover:bg-[#F8F5EE]/60 transition">
                        <td className="py-3 px-4 font-bold text-[#303B38]">{formatBranchLabel(b)}</td>
                        {accessoryCategories.map((cat) => {
                          const items = accessoryItems.filter(
                            (i) => i.branchNumber === b && i.category === cat.name
                          );
                          const count = items.reduce((sum, i) => sum + i.currentStock, 0);
                          totalPcs += count;
                          const isLow = count <= 2 && count > 0;
                          const isZero = count === 0;

                          return (
                            <td key={cat.id} className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  isZero
                                    ? 'bg-[#F8F5EE] text-[#7F8983]'
                                    : isLow
                                    ? 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                                    : 'bg-[#D8EEE4] text-[#303B38]'
                                }`}
                              >
                                {count}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center font-bold text-[#303B38] bg-[#F8F5EE]/40">
                          {totalPcs} pcs
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
