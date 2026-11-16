import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { FunctionSquare, Check, X } from 'lucide-react';

export const FormulaBar: React.FC = () => {
  const { selectedCellFormula, activeTab } = useTracker();

  const defaultCell = activeTab === 'dashboard' 
    ? 'DASHBOARD!B5' 
    : activeTab === 'systems' 
    ? 'SYSTEMS!L2' 
    : activeTab === 'accessories'
    ? 'ACCESSORIES!F2'
    : activeTab === 'printers'
    ? 'CARTRIDGES!D4'
    : activeTab === 'mobiles'
    ? 'MOBILES!C2'
    : activeTab === 'laptops'
    ? 'LAPTOPS!D2'
    : activeTab === 'branches'
    ? 'BRANCH_MATRIX!B2'
    : 'CUSTOM!B2';

  const defaultFormula = activeTab === 'systems'
    ? '=IF(ISBLANK(Staff), "Standby", "Assigned")'
    : activeTab === 'accessories'
    ? '=OpeningStock + StockIn - StockOut'
    : activeTab === 'printers'
    ? '=IF(CurrentStock <= MinStock, "ALERT_RESTOCK", "OK")'
    : activeTab === 'dashboard'
    ? '=SUM(CartridgeStock!C2:C110)'
    : '=VLOOKUP(Branch, Inventory, 6, FALSE)';

  const activeCoord = selectedCellFormula?.cell || defaultCell;
  const activeFx = selectedCellFormula?.formula || defaultFormula;
  const activeVal = selectedCellFormula?.value || 'Select any row or cell to view formula breakdown';

  return (
    <div className="bg-[#F8F5EE] border-b border-[#E9E5DA] px-4 py-1.5 flex items-center gap-3 text-xs font-mono select-none">
      {/* Name Box */}
      <div className="flex items-center gap-1.5 bg-[#FFFDF7] border border-[#E9E5DA] rounded-md px-2.5 py-1 min-w-[130px] font-semibold text-[#303B38] shadow-xs">
        <span className="text-[10px] uppercase tracking-wider text-[#7F8983]">Cell</span>
        <span className="text-[#303B38] font-bold truncate">{activeCoord}</span>
      </div>

      {/* Function icon button divider */}
      <div className="flex items-center gap-1 text-[#7F8983]">
        <div className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#EADCCB]/50 text-[#7F8983] cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center justify-center w-5 h-5 rounded hover:bg-[#D8EEE4] text-[#303B38] cursor-pointer">
          <Check className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-0.5 px-1 py-0.5 text-[#303B38] font-bold italic">
          <span className="text-[#7F8983]">f</span><span className="text-[#303B38]">x</span>
        </div>
      </div>

      {/* Formula content */}
      <div className="flex-1 bg-[#FFFDF7] border border-[#E9E5DA] rounded-md px-3 py-1 text-[#303B38] shadow-xs flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[#303B38] font-semibold">{activeFx}</span>
        </div>
        <div className="text-[11px] text-[#7F8983] font-sans truncate pl-2 border-l border-[#E9E5DA] shrink-0">
          Result: <strong className="text-[#303B38] font-mono">{activeVal}</strong>
        </div>
      </div>
    </div>
  );
};
