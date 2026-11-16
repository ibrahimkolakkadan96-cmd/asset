import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { useAuth } from '../context/AuthContext';
import { ALL_LOCATIONS, formatBranchLabel } from '../types';
import { exportTrackerToExcel } from '../lib/excelExport';
import { isElectronEnv } from '../lib/backupService';
import {
  FileSpreadsheet,
  Download,
  Upload,
  PlusCircle,
  ArrowLeftRight,
  Cloud,
  CloudOff,
  RefreshCw,
  Building2,
  Monitor,
  HardDrive,
  LogOut,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  onOpenAddSystem: () => void;
  onOpenLogTx: () => void;
  onOpenImport: () => void;
  onOpenExeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddSystem,
  onOpenLogTx,
  onOpenImport,
  onOpenExeModal,
}) => {
  const {
    systems,
    accessoryItems,
    accessoryTransactions,
    selectedBranch,
    setSelectedBranch,
    syncStatus,
    isOnline,
    refreshFromCloud,
    activeTab,
    setActiveTab,
  } = useTracker();

  const { currentUser, logout, isAdmin } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDesktop = isElectronEnv();

  const handleExport = () => {
    exportTrackerToExcel(systems as any, accessoryItems as any, accessoryTransactions as any);
  };

  const handleRefreshCloud = async () => {
    setIsRefreshing(true);
    await refreshFromCloud();
    setIsRefreshing(false);
  };

  return (
    <header className="bg-[#FFFDF7] text-[#303B38] border-b border-[#E9E5DA] shadow-xs sticky top-0 z-30">
      {/* Top Main Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs border border-[#96cebc]">
            <FileSpreadsheet className="w-6 h-6 text-[#303B38]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold tracking-tight text-[#303B38] flex items-center gap-1.5">
                PREMIER IT ASSET TRACKER
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#D8EEE4] text-[#303B38] rounded-md border border-[#A8DCCB]">
                CENTRAL + BRANCH 1 TO 22
              </span>
              {isDesktop && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EADCCB]/70 text-[#303B38] rounded-md border border-[#E9E5DA]">
                  WINDOWS DESKTOP
                </span>
              )}
            </div>
            <p className="text-xs text-[#7F8983]">
              PREMIER AUTO PARTS LLC • Centralized Supabase Cloud Hardware &amp; Stock Management
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Centralized Cloud Sync Pill */}
          <button
            onClick={handleRefreshCloud}
            title="Click to synchronize latest records from centralized Supabase Cloud"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer shadow-xs ${
              !isOnline || syncStatus === 'offline'
                ? 'bg-[#FDECE7] text-[#303B38] border-[#F4A58F]'
                : syncStatus === 'error'
                ? 'bg-[#FDECE7] text-[#303B38] border-[#F4A58F]'
                : syncStatus === 'syncing' || isRefreshing
                ? 'bg-[#EADCCB]/50 text-[#303B38] border-[#BFDCCB]'
                : 'bg-[#D8EEE4] text-[#303B38] border-[#A8DCCB]'
            }`}
          >
            {!isOnline || syncStatus === 'offline' ? (
              <CloudOff className="w-3.5 h-3.5 text-[#F4A58F]" />
            ) : syncStatus === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-[#F4A58F]" />
            ) : syncStatus === 'syncing' || isRefreshing ? (
              <RefreshCw className="w-3.5 h-3.5 text-[#303B38] animate-spin" />
            ) : (
              <Cloud className="w-3.5 h-3.5 text-[#303B38]" />
            )}
            <span>
              {!isOnline || syncStatus === 'offline'
                ? 'Offline'
                : syncStatus === 'error'
                ? 'Sync Alert'
                : syncStatus === 'syncing' || isRefreshing
                ? 'Syncing...'
                : 'Cloud Synced'}
            </span>
          </button>

          {/* Branch Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[#F8F5EE] border border-[#E9E5DA] rounded-lg px-2.5 py-1.5 text-xs text-[#303B38] shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-[#303B38] shrink-0" />
            <span className="text-[#7F8983] font-medium">Location:</span>
            <select
              value={selectedBranch === null ? 'all' : selectedBranch}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedBranch(val === 'all' ? null : parseInt(val, 10));
              }}
              className="bg-transparent text-[#303B38] font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#FFFDF7] text-[#303B38]">
                All Locations (Central + 22)
              </option>
              {ALL_LOCATIONS.map((b) => (
                <option key={b} value={b} className="bg-[#FFFDF7] text-[#303B38]">
                  {formatBranchLabel(b)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action: New System */}
          <button
            onClick={onOpenAddSystem}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-90 active:scale-95 text-[#303B38] border border-[#91c9b6] px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#303B38]" />
            <span>+ Add System</span>
          </button>

          {/* Quick Action: Log Movement */}
          <button
            onClick={onOpenLogTx}
            className="flex items-center gap-1.5 bg-[#FFFDF7] hover:bg-[#F8F5EE] active:scale-95 text-[#303B38] border border-[#BFDCCB] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Stock IN / OUT</span>
          </button>

          {/* External SSD Backup */}
          <button
            onClick={() => setActiveTab('backup')}
            title={isAdmin ? 'Centralized Supabase Backup & Local Drive Export' : 'Admin only area'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border shadow-xs active:scale-95 ${
              activeTab === 'backup'
                ? 'bg-[#A8DCCB] text-[#303B38] border-[#8cc6b3] shadow-sm font-extrabold'
                : 'bg-[#FFFDF7] hover:bg-[#D8EEE4]/60 text-[#303B38] border-[#E9E5DA]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-[#303B38]" />
            <span>Backup &amp; Restore</span>
            {isAdmin && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8DCCB] border border-[#303B38]" title="Admin Authorized" />
            )}
          </button>

          {/* Windows .EXE Generator */}
          <button
            onClick={onOpenExeModal}
            title="Windows Desktop Application (.EXE) Setup & Installer Guide"
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-90 active:scale-95 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs border border-[#F4A58F] transition cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span>Windows .EXE</span>
          </button>

          {/* Excel Export */}
          <button
            onClick={handleExport}
            title="Export complete Excel (.xlsx) report"
            className="flex items-center gap-1.5 bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#E9E5DA] px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#303B38]" />
            <span className="hidden sm:inline font-semibold">Export .XLSX</span>
          </button>

          {/* Excel Import */}
          <button
            onClick={onOpenImport}
            title="Import records from Excel spreadsheet"
            className="flex items-center gap-1.5 bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#E9E5DA] px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#7F8983]" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Safe Cloud Reload */}
          <button
            onClick={handleRefreshCloud}
            disabled={isRefreshing}
            title="Reload latest live records from Supabase Cloud"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#7F8983] hover:text-[#303B38] border border-[#E9E5DA] transition cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* User Profile Pill & Logout */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#E9E5DA]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F5EE] border border-[#E9E5DA] text-xs">
              <div className="w-5 h-5 rounded-full bg-[#A8DCCB] text-[#303B38] flex items-center justify-center font-bold text-[10px]">
                {currentUser?.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="font-bold text-[#303B38] text-[11px] truncate max-w-[120px]">
                  {currentUser?.displayName || currentUser?.username || 'User'}
                </span>
                <span className="text-[9px] text-[#7F8983] uppercase font-semibold">
                  {currentUser?.role === 'admin' ? 'Super Admin' : currentUser?.role || 'Staff'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout from Premier IT Asset Tracker"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFFDF7] hover:bg-[#FDECE7] text-[#7F8983] hover:text-[#F4A58F] border border-[#E9E5DA] hover:border-[#F4A58F]/40 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
