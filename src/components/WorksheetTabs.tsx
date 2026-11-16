import React from 'react';
import { useTracker, ActiveModule } from '../context/TrackerContext';
import {
  LayoutDashboard,
  Monitor,
  Printer,
  Package,
  Smartphone,
  Laptop,
  Layers,
  Building2,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';

export const WorksheetTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    systems,
    cartridgeStock,
    accessoryItems,
    mobileAssets,
    laptops,
    customAssets,
    lowStockAlerts,
  } = useTracker();

  const zeroStockCount = lowStockAlerts.filter((a) => a.isZeroStock).length;
  const lowStockCount = lowStockAlerts.length;

  const tabs: Array<{
    id: ActiveModule;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    countBadge?: number | string | null;
    alertBadge?: boolean;
  }> = [
    {
      id: 'dashboard',
      name: 'Executive Dashboard',
      icon: LayoutDashboard,
      countBadge: null,
    },
    {
      id: 'systems',
      name: 'IT Systems (Desktops)',
      icon: Monitor,
      countBadge: systems.length,
    },
    {
      id: 'printers',
      name: 'Printer Cartridges',
      icon: Printer,
      countBadge: cartridgeStock.reduce((sum, c) => sum + c.currentStock, 0),
      alertBadge: cartridgeStock.some((c) => c.currentStock <= c.minimumStockLevel),
    },
    {
      id: 'accessories',
      name: 'IT Accessories',
      icon: Package,
      countBadge: accessoryItems.reduce((sum, a) => sum + a.currentStock, 0),
      alertBadge: accessoryItems.some((a) => a.currentStock <= a.minimumStock),
    },
    {
      id: 'mobiles',
      name: 'Mobile Assets (IMEI)',
      icon: Smartphone,
      countBadge: mobileAssets.length,
    },
    {
      id: 'laptops',
      name: 'Company Laptops',
      icon: Laptop,
      countBadge: laptops.length,
    },
    {
      id: 'custom',
      name: 'Custom Assets',
      icon: Layers,
      countBadge: customAssets.length,
    },
    {
      id: 'branches',
      name: 'Branch Matrix (1-22)',
      icon: Building2,
      countBadge: '22 Br',
    },
    {
      id: 'backup',
      name: 'Supabase & SSD (D:\\)',
      icon: HardDrive,
      countBadge: 'D:\\ SSD',
    },
  ];

  return (
    <div className="bg-[#EADCCB]/30 border-b border-[#E9E5DA] px-3 pt-2 flex items-center gap-1 overflow-x-auto text-xs select-none">
      <div className="flex items-center gap-1.5 px-2 text-[#7F8983] font-bold text-[11px] uppercase tracking-wider shrink-0">
        <span>Modules:</span>
      </div>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 font-medium rounded-t-xl transition-all shrink-0 cursor-pointer border-t border-x ${
              isActive
                ? 'bg-[#FFFDF7] text-[#303B38] border-t-2 border-t-[#A8DCCB] border-x-[#E9E5DA] shadow-xs font-bold'
                : 'bg-[#F8F5EE]/70 hover:bg-[#FFFDF7] text-[#7F8983] hover:text-[#303B38] border-transparent hover:border-[#E9E5DA]'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[#303B38]' : 'text-[#7F8983]'}`} />
            <span>{tab.name}</span>

            {tab.countBadge !== undefined && tab.countBadge !== null && (
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-semibold border ${
                  tab.alertBadge
                    ? 'bg-[#F4A58F] text-white border-[#F4A58F] font-bold animate-pulse'
                    : isActive
                    ? 'bg-[#D8EEE4] text-[#303B38] border-[#A8DCCB]'
                    : 'bg-[#F8F5EE] text-[#7F8983] border-[#E9E5DA]'
                }`}
              >
                {tab.countBadge}
              </span>
            )}
          </button>
        );
      })}

      {lowStockCount > 0 && (
        <div className="ml-auto pl-2 shrink-0 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDECE7] border border-[#F4A58F] text-[11px] font-bold text-[#303B38]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#F4A58F]" />
          <span>{zeroStockCount > 0 ? `${zeroStockCount} Out of Stock` : `${lowStockCount} Low Stock`}</span>
        </div>
      )}
    </div>
  );
};
