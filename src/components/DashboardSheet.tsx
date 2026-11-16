import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { ALL_LOCATIONS, formatBranchLabel } from '../types';
import {
  Monitor,
  Printer,
  Package,
  Smartphone,
  Laptop,
  Layers,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  History,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Cpu,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';

interface DashboardSheetProps {
  onQuickRestock?: (branch: number, accessory: string) => void;
}

export const DashboardSheet: React.FC<DashboardSheetProps> = () => {
  const {
    systems,
    printerModels,
    cartridgeModels,
    cartridgeStock,
    accessoryItems,
    mobileAssets,
    laptops,
    customAssets,
    lowStockAlerts,
    auditLogs,
    setActiveTab,
    setSelectedBranch,
  } = useTracker();

  // KPI Calculations
  const totalSystems = systems.length;
  const activeSystems = systems.filter((s) => s.status === 'Active').length;

  const totalLaptops = laptops.length;
  const assignedLaptops = laptops.filter((l) => l.status === 'Assigned').length;

  const totalMobiles = mobileAssets.length;
  const assignedMobiles = mobileAssets.filter((m) => m.status === 'Assigned').length;

  const totalAccessoryUnits = accessoryItems.reduce((sum, a) => sum + a.currentStock, 0);
  const totalCartridgeUnits = cartridgeStock.reduce((sum, c) => sum + c.currentStock, 0);

  const outOfStockCount = lowStockAlerts.filter((a) => a.isZeroStock).length;
  const lowStockCount = lowStockAlerts.filter((a) => !a.isZeroStock).length;

  // Jump to module
  const handleJump = (tab: any, branch?: number) => {
    if (branch) setSelectedBranch(branch);
    setActiveTab(tab);
  };

  return (
    <div className="flex-1 overflow-auto bg-[#F8F5EE] p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A8DCCB] animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#303B38] bg-[#D8EEE4] px-2.5 py-0.5 rounded-full border border-[#A8DCCB]">
              PREMIER AUTO PARTS LLC • ENTERPRISE ASSET DASHBOARD
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#303B38] mt-1.5 tracking-tight">
            22-Branch IT Infrastructure Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#7F8983] mt-0.5">
            Desktops, Laptops, Dual-IMEI Mobiles, Printer Cartridges, and Peripheral Stock Tracking
          </p>
        </div>

        {/* Quick Nav Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleJump('systems')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5EE] hover:bg-[#EADCCB]/40 text-[#303B38] border border-[#E9E5DA] rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Monitor className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Systems ({totalSystems})</span>
          </button>
          <button
            onClick={() => handleJump('laptops')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5EE] hover:bg-[#EADCCB]/40 text-[#303B38] border border-[#E9E5DA] rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Laptops ({totalLaptops})</span>
          </button>
          <button
            onClick={() => handleJump('printers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5EE] hover:bg-[#EADCCB]/40 text-[#303B38] border border-[#E9E5DA] rounded-xl text-xs font-semibold transition cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Cartridges ({totalCartridgeUnits})</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Center (If any alerts exist) */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <div className="bg-gradient-to-r from-[#FDECE7] via-[#FFFDF7] to-[#FDECE7] border border-[#F4A58F] rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F4A58F]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F4A58F] text-white flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#303B38] uppercase tracking-wide">
                  Autonomous Inventory Alerts Triggered (Rule: Stock ≤ 2 Pieces)
                </h3>
                <p className="text-[11px] text-[#7F8983]">
                  <strong>{outOfStockCount}</strong> items completely Out of Stock (0 pcs), and <strong>{lowStockCount}</strong> items at or below critical minimum threshold.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJump('printers')}
                className="px-3 py-1 rounded-lg bg-[#F4A58F] text-white font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-xs"
              >
                Review Printer Stock
              </button>
              <button
                onClick={() => handleJump('accessories')}
                className="px-3 py-1 rounded-lg bg-[#FFFDF7] border border-[#BFDCCB] text-[#303B38] font-bold text-xs hover:bg-[#F8F5EE] transition cursor-pointer shadow-xs"
              >
                Review Accessories
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3">
            {lowStockAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl p-2.5 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#303B38] text-[11px]">
                    {alert.branchName}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      alert.isZeroStock
                        ? 'bg-[#F4A58F] text-white'
                        : 'bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F]'
                    }`}
                  >
                    {alert.isZeroStock ? '0 UNITS' : `${alert.currentStock} UNITS`}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-[#303B38] truncate">
                  {alert.itemName}
                </div>
                <div className="text-[10px] text-[#7F8983] mt-1 flex justify-between">
                  <span>Type: {alert.itemType}</span>
                  <span>Min Level: {alert.minimumStock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 KPI Executive Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. IT Systems */}
        <div
          onClick={() => handleJump('systems')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Desktops</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Monitor className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{totalSystems}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">{activeSystems} Active Online</div>
          </div>
        </div>

        {/* 2. Laptops */}
        <div
          onClick={() => handleJump('laptops')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Laptops</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Laptop className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{totalLaptops}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">{assignedLaptops} Deployed</div>
          </div>
        </div>

        {/* 3. Mobiles */}
        <div
          onClick={() => handleJump('mobiles')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Mobiles (IMEI)</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{totalMobiles}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">{assignedMobiles} Assigned</div>
          </div>
        </div>

        {/* 4. IT Accessories */}
        <div
          onClick={() => handleJump('accessories')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Accessories</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{totalAccessoryUnits}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">{accessoryItems.length} SKU models</div>
          </div>
        </div>

        {/* 5. Printer Models */}
        <div
          onClick={() => handleJump('printers')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Printers</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Printer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{printerModels.length}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">{cartridgeModels.length} Cartridge Types</div>
          </div>
        </div>

        {/* 6. Cartridge Stock */}
        <div
          onClick={() => handleJump('printers')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Toner Stock</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{totalCartridgeUnits}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">Across 22 branches</div>
          </div>
        </div>

        {/* 7. Custom Assets */}
        <div
          onClick={() => handleJump('custom')}
          className="bg-[#FFFDF7] hover:bg-[#D8EEE4]/30 border border-[#E9E5DA] p-3.5 rounded-2xl shadow-xs transition cursor-pointer group flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#7F8983]">Custom Assets</span>
            <div className="w-7 h-7 rounded-lg bg-[#D8EEE4] text-[#303B38] flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-[#303B38]">{customAssets.length}</div>
            <div className="text-[10px] text-[#7F8983] mt-0.5">Scanners & Network</div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Branch-wise Asset Breakdown & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 22-Branch Asset Matrix Table */}
        <div className="lg:col-span-2 bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/30 to-[#FFFDF7]">
            <div>
              <h2 className="text-xs font-bold text-[#303B38] uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#303B38]" />
                <span>Branch-wise Asset Allocation Summary (Branches 1 - 22)</span>
              </h2>
              <p className="text-[11px] text-[#7F8983]">
                Click on any branch to jump directly to its workstations and inventory
              </p>
            </div>
            <button
              onClick={() => setActiveTab('branches')}
              className="text-xs font-bold text-[#303B38] hover:underline flex items-center gap-1"
            >
              <span>Full Matrix View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#EADCCB]/30 text-[#303B38] border-b border-[#E9E5DA] sticky top-0 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Branch</th>
                  <th className="py-2.5 px-3 text-center">Desktops</th>
                  <th className="py-2.5 px-3 text-center">Laptops</th>
                  <th className="py-2.5 px-3 text-center">Mobiles</th>
                  <th className="py-2.5 px-3 text-center">Accessories</th>
                  <th className="py-2.5 px-3 text-center">Cartridges</th>
                  <th className="py-2.5 px-3 text-right">Quick Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5DA]/60">
                {ALL_LOCATIONS.map((b) => {
                  const bSystems = systems.filter((s) => s.branchNumber === b).length;
                  const bLaptops = laptops.filter((l) => l.branchNumber === b).length;
                  const bMobiles = mobileAssets.filter((m) => m.branchNumber === b).length;
                  const bAccStock = accessoryItems
                    .filter((a) => a.branchNumber === b)
                    .reduce((sum, a) => sum + a.currentStock, 0);
                  const bCartStock = cartridgeStock
                    .filter((c) => c.branchNumber === b)
                    .reduce((sum, c) => sum + c.currentStock, 0);

                  const hasLow =
                    cartridgeStock.some((c) => c.branchNumber === b && c.currentStock <= c.minimumStockLevel) ||
                    accessoryItems.some((a) => a.branchNumber === b && a.currentStock <= a.minimumStock);

                  return (
                    <tr
                      key={b}
                      className="hover:bg-[#F8F5EE] transition-colors cursor-pointer group"
                      onClick={() => handleJump('systems', b)}
                    >
                      <td className="py-2.5 px-3 font-bold text-[#303B38] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#A8DCCB]"></span>
                        <span>{formatBranchLabel(b)}</span>
                        {hasLow && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F4A58F] animate-ping" title="Low stock alert" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#303B38]">
                        {bSystems}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#303B38]">
                        {bLaptops}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-[#303B38]">
                        {bMobiles}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F8F5EE] border border-[#E9E5DA] font-medium text-[#303B38]">
                          {bAccStock} pcs
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#D8EEE4] border border-[#A8DCCB] font-bold text-[#303B38]">
                          {bCartStock} pcs
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="text-[11px] text-[#7F8983] group-hover:text-[#303B38] group-hover:font-bold transition">
                          View Assets →
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Movements Feed */}
        <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E9E5DA] flex items-center justify-between bg-gradient-to-r from-[#D8EEE4]/30 to-[#FFFDF7]">
            <div>
              <h2 className="text-xs font-bold text-[#303B38] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#303B38]" />
                <span>Live Audit Activity Log</span>
              </h2>
              <p className="text-[11px] text-[#7F8983]">
                Recent transfers, stock adjustments, and registrations
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D8EEE4] rounded-md text-[#303B38]">
              Real-time
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto max-h-96 space-y-2.5">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#7F8983] text-center py-10">No recent transactions recorded.</p>
            ) : (
              auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-[#F8F5EE] border border-[#E9E5DA] text-xs space-y-1 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#303B38] text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-[#7F8983]">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#303B38] font-medium">
                    {log.details}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#7F8983] pt-0.5">
                    <span>
                      {log.branchNumber ? `Branch ${log.branchNumber}` : 'All Branches'}
                    </span>
                    <span>By: {log.performedBy}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
