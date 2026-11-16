import React, { useState, useEffect, useRef } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { FormulaBar } from './components/FormulaBar';
import { WorksheetTabs } from './components/WorksheetTabs';
import { DashboardSheet } from './components/DashboardSheet';
import { SystemManagementModule } from './components/SystemManagementModule';
import { PrinterCartridgeModule } from './components/PrinterCartridgeModule';
import { AccessoriesModule } from './components/AccessoriesModule';
import { MobileManagementModule } from './components/MobileManagementModule';
import { LaptopManagementModule } from './components/LaptopManagementModule';
import { CustomAssetModule } from './components/CustomAssetModule';
import { BranchMatrixSheet } from './components/BranchMatrixSheet';
import { BackupRestoreDashboard } from './components/BackupRestoreDashboard';
import { LowStockAlertModal } from './components/LowStockAlertModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExeGeneratorModal } from './components/ExeGeneratorModal';
import { backupService, BackupEventNotification, isElectronEnv } from './lib/backupService';
import {
  Monitor,
  HardDrive,
  ShieldAlert,
  Info,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  X,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

function TrackerApp() {
  const {
    activeTab,
    setActiveTab,
    lowStockAlerts,
    syncError,
    clearSyncError,
    isOnline,
    isLoadingData,
    refreshFromCloud,
    systems,
    accessoryItems,
    accessoryTransactions,
    cartridgeStock,
    mobileAssets,
    laptops,
    customAssets,
  } = useTracker();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExeModalOpen, setIsExeModalOpen] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [backupNotice, setBackupNotice] = useState<BackupEventNotification | null>(null);
  const startupCheckedRef = useRef(false);

  const latestDataRef = useRef({
    systems,
    accessoryItems,
    accessoryTransactions,
    cartridgeStock,
    mobileAssets,
    laptops,
    customAssets,
  });

  useEffect(() => {
    latestDataRef.current = {
      systems,
      accessoryItems,
      accessoryTransactions,
      cartridgeStock,
      mobileAssets,
      laptops,
      customAssets,
    };
  }, [systems, accessoryItems, accessoryTransactions, cartridgeStock, mobileAssets, laptops, customAssets]);

  // Subscribe to backup success/failure notifications and run Electron scheduled backups
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const unsubscribeEvents = backupService.subscribeBackupEvents((evt) => {
      if (evt.status === 'success' || evt.status === 'error') {
        setBackupNotice(evt);
      }
    });

    if (!isElectronEnv()) {
      return () => {
        unsubscribeEvents();
      };
    }

    let cancelled = false;
    backupService.syncFromElectronSettings().then(() => {
      if (cancelled || startupCheckedRef.current) return;
      startupCheckedRef.current = true;
      const d = latestDataRef.current;
      backupService.checkAndRunScheduledBackup(
        {
          systems: d.systems as any,
          accessories: d.accessoryItems as any,
          transactions: d.accessoryTransactions as any,
          cartridgeStock: d.cartridgeStock as any,
          mobileAssets: d.mobileAssets as any,
          laptops: d.laptops as any,
          customAssets: d.customAssets as any,
        },
        true
      );
    });

    const unsubTick = window.electronDesktop?.onSchedulerTick?.(() => {
      const d = latestDataRef.current;
      backupService.checkAndRunScheduledBackup(
        {
          systems: d.systems as any,
          accessories: d.accessoryItems as any,
          transactions: d.accessoryTransactions as any,
          cartridgeStock: d.cartridgeStock as any,
          mobileAssets: d.mobileAssets as any,
          laptops: d.laptops as any,
          customAssets: d.customAssets as any,
        },
        false
      );
    });

    return () => {
      cancelled = true;
      unsubscribeEvents();
      if (unsubTick) unsubTick();
    };
  }, [isAuthenticated, isAdmin]);

  // Loading splash while verifying secure session
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F5EE] text-[#303B38]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center shadow-md animate-pulse">
          <Monitor className="w-6 h-6 text-[#303B38]" />
        </div>
        <p className="mt-4 text-xs font-bold tracking-wider uppercase text-[#7F8983]">
          Validating Premier Security Session...
        </p>
      </div>
    );
  }

  // If unauthenticated, always display the Login Screen first
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const zeroStockCount = lowStockAlerts.filter((a) => a.isZeroStock).length;
  const lowStockCount = lowStockAlerts.filter((a) => !a.isZeroStock).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] font-sans text-[#303B38] antialiased selection:bg-[#A8DCCB] selection:text-[#303B38]">
      {/* Top Application Navbar */}
      <Navbar
        onOpenAddSystem={() => setActiveTab('systems')}
        onOpenLogTx={() => setActiveTab('accessories')}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExeModal={() => setIsExeModalOpen(true)}
      />

      {/* Excel Formula Bar */}
      <FormulaBar />

      {/* Centralized Supabase Offline / Sync Error Alert */}
      {(!isOnline || syncError) && (
        <div className="bg-[#FDECE7] border-b border-[#F4A58F] px-4 py-2 text-xs text-[#303B38] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="w-4 h-4 text-[#F4A58F] shrink-0" />
            <span className="truncate font-medium">
              <strong className="font-bold">Centralized Database Notice:</strong>{' '}
              {!isOnline
                ? 'Internet connection unavailable. Application will automatically reconnect to Supabase Cloud when online.'
                : syncError}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refreshFromCloud()}
              className="flex items-center gap-1 bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#F4A58F]/60 px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reconnect</span>
            </button>
            {syncError && (
              <button
                onClick={clearSyncError}
                className="text-[#7F8983] hover:text-[#303B38] p-1 cursor-pointer"
                title="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Initial Cloud Sync Banner */}
      {isLoadingData && isOnline && (
        <div className="bg-[#D8EEE4]/70 border-b border-[#A8DCCB] px-4 py-1.5 text-xs text-[#303B38] flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#303B38]" />
          <span className="font-semibold">Loading centralized company inventory from Supabase Cloud (Central Office + Branches 1–22)...</span>
        </div>
      )}

      {/* Backup Success / Failure Notification Banner */}
      {backupNotice && (
        <div
          className={`border-b px-4 py-2 text-xs flex items-center justify-between gap-3 ${
            backupNotice.status === 'success'
              ? 'bg-[#D8EEE4] border-[#A8DCCB] text-[#303B38]'
              : 'bg-[#FDECE7] border-[#F4A58F] text-[#303B38]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {backupNotice.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#303B38] shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-[#F4A58F] shrink-0" />
            )}
            <span className="truncate">
              <strong className="font-bold">{backupNotice.title}:</strong> {backupNotice.message}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('backup')}
              className="bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] border border-[#BFDCCB] px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer"
            >
              View Backup Center
            </button>
            <button
              onClick={() => setBackupNotice(null)}
              className="text-[#7F8983] hover:text-[#303B38] p-1 cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Info / Quick Reference Strip */}
      {showInfoBanner && (
        <div className="bg-gradient-to-r from-[#D8EEE4] via-[#F8F5EE] to-[#D8EEE4] text-[#303B38] px-4 py-2 text-xs flex items-center justify-between gap-3 border-b border-[#E9E5DA] shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <Info className="w-3.5 h-3.5 text-[#303B38] shrink-0" />
            <span className="truncate">
              <strong>Centralized Architecture:</strong> Real-time Supabase Cloud sync across <strong>Central Office + Branches 1 to 22</strong> — changes on any PC sync instantly.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lowStockAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab('printers')}
                className="flex items-center gap-1.5 bg-[#FDECE7] text-[#F4A58F] border border-[#F4A58F] px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3 text-[#F4A58F]" />
                <span>{zeroStockCount > 0 ? `${zeroStockCount} Out of Stock` : `${lowStockCount} Low Stock`}</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('backup')}
              className="flex items-center gap-1.5 bg-[#FFFDF7] hover:bg-[#F8F5EE] text-[#303B38] px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border border-[#BFDCCB] shadow-xs"
            >
              <HardDrive className="w-3 h-3 text-[#303B38]" />
              <span>Backup &amp; Restore</span>
            </button>
            <button
              onClick={() => setIsExeModalOpen(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#F4A58F] to-[#e89078] hover:opacity-90 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              <Monitor className="w-3 h-3 text-white" />
              <span>Windows .EXE Setup</span>
            </button>
            <button
              onClick={() => setShowInfoBanner(false)}
              className="text-[#7F8983] hover:text-[#303B38] text-[11px] hover:underline cursor-pointer ml-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Excel Worksheet Navigation Tabs */}
      <WorksheetTabs />

      {/* Active Worksheet Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F5EE]">
        {activeTab === 'dashboard' && <DashboardSheet />}
        {activeTab === 'systems' && <SystemManagementModule />}
        {activeTab === 'printers' && <PrinterCartridgeModule />}
        {activeTab === 'accessories' && <AccessoriesModule />}
        {activeTab === 'mobiles' && <MobileManagementModule />}
        {activeTab === 'laptops' && <LaptopManagementModule />}
        {activeTab === 'custom' && <CustomAssetModule />}
        {activeTab === 'branches' && <BranchMatrixSheet />}
        {activeTab === 'backup' && (
          isAdmin ? (
            <BackupRestoreDashboard />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8F5EE]">
              <div className="w-16 h-16 rounded-2xl bg-[#FDECE7] border border-[#F4A58F] flex items-center justify-center text-[#F4A58F] mb-4 shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-[#303B38]">
                Administrator Authorization Required
              </h2>
              <p className="text-xs text-[#7F8983] max-w-md mt-1.5 leading-relaxed">
                Supabase Database Full Backups, Schema DDL exports, and External SSD (D:\) operations are strictly restricted to corporate IT Administrators at Premier Auto Parts LLC.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] text-[#303B38] font-bold text-xs shadow-xs hover:opacity-90 cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )
        )}
      </main>

      {/* Automatic Low Stock / Out of Stock Popup Notification Modal */}
      <LowStockAlertModal onNavigateToModule={(mod) => setActiveTab(mod)} />

      {/* Utility Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ExeGeneratorModal
        isOpen={isExeModalOpen}
        onClose={() => setIsExeModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TrackerProvider>
        <TrackerApp />
      </TrackerProvider>
    </AuthProvider>
  );
}
