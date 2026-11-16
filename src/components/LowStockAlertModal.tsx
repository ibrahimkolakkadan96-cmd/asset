import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { formatBranchLabel } from '../types';
import { AlertTriangle, X, ArrowRight, ShieldAlert, Package, Printer } from 'lucide-react';

interface LowStockAlertModalProps {
  onNavigateToModule: (module: 'printers' | 'accessories') => void;
}

export const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({ onNavigateToModule }) => {
  const { lowStockAlerts, dismissAlert } = useTracker();

  // Find zero stock items first, then low stock items
  const activeAlerts = lowStockAlerts;
  if (activeAlerts.length === 0) return null;

  // Show the most critical alert in a high-priority banner or popup dialog
  const critical = activeAlerts[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-2xl shadow-2xl border ${
        critical.isZeroStock
          ? 'bg-[#FFFDF7] border-2 border-[#F4A58F] text-[#303B38]'
          : 'bg-[#FFFDF7] border-2 border-[#F4A58F]/60 text-[#303B38]'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl text-white shadow-xs shrink-0 ${
              critical.isZeroStock ? 'bg-[#F4A58F] animate-bounce' : 'bg-[#F4A58F]'
            }`}>
              {critical.isZeroStock ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                  critical.isZeroStock ? 'bg-[#FDECE7] text-[#303B38] border border-[#F4A58F]' : 'bg-[#D8EEE4] text-[#303B38]'
                }`}>
                  {critical.isZeroStock ? 'OUT OF STOCK ALERT' : 'LOW STOCK ALERT'}
                </span>
                <span className="text-[11px] font-bold text-[#7F8983]">
                  {formatBranchLabel(critical.branchNumber)}
                </span>
              </div>
              <h4 className="text-sm font-black text-[#303B38] mt-1">
                {critical.title}
              </h4>
              <p className="text-xs text-[#7F8983] mt-0.5">
                Current Stock: <strong className="text-[#303B38] font-bold">{critical.currentStock} pcs</strong> (Threshold: {critical.minimumStock} pcs)
              </p>
              <p className="text-[11px] text-[#7F8983]">
                Location: {critical.location}
              </p>
            </div>
          </div>

          <button
            onClick={() => dismissAlert(critical.id)}
            className="p-1 rounded-lg text-[#7F8983] hover:text-[#303B38] hover:bg-[#F8F5EE] transition cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-[#E9E5DA] flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#7F8983]">
            {activeAlerts.length > 1 ? `+${activeAlerts.length - 1} other items need restock` : 'Immediate action recommended'}
          </span>
          <button
            onClick={() => {
              dismissAlert(critical.id);
              onNavigateToModule(critical.type === 'CARTRIDGE' ? 'printers' : 'accessories');
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Restock Stock IN</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
