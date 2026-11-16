import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Monitor,
  Download,
  Terminal,
  Layers,
  Copy,
  Check,
  X,
  FileCode,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Cpu,
  Package,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ExeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const ExeGeneratorModal: React.FC<ExeGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'instant' | 'electron' | 'pwa' | 'powershell'>('instant');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [zipMessage, setZipMessage] = useState<string>('');

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsAppInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const currentAppUrl = window.location.origin;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePwaInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    }
  };

  // Download Complete Ready-to-Package Windows Desktop Project (.zip)
  const handleDownloadFullProjectZip = async () => {
    setIsZipping(true);
    setDownloadSuccess(false);
    setZipMessage('');

    try {
      const response = await fetch('./PREMIER-IT-ASSET-TRACKER-Windows-Desktop-Project.zip');
      if (!response.ok) {
        throw new Error(`Project archive unavailable (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'PREMIER-IT-ASSET-TRACKER-Windows-Desktop-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipMessage('PREMIER-IT-ASSET-TRACKER-Windows-Desktop-Project.zip downloaded! Extract on Windows and run: npm install && npm run electron:build');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 7000);
    } catch (err) {
      console.error('Failed to download complete project zip, falling back to quick kit', err);
      await handleDownloadQuickKitPackage();
    } finally {
      setIsZipping(false);
    }
  };

  // Generate and download lightweight C# / Batch Windows launcher kit (.zip)
  const handleDownloadQuickKitPackage = async () => {
    setIsZipping(true);
    setDownloadSuccess(false);
    setZipMessage('');

    try {
      const zip = new JSZip();

      // 1. Batch file for native csc.exe compiler
      const nativeCompilerBat = `@echo off
setlocal
title IT Asset Tracker - Native Windows .EXE Compiler
echo ========================================================
echo   INSTANT NATIVE WINDOWS .EXE COMPILER
echo   IT Asset & Accessories Tracker (Branch 1-22)
echo ========================================================
echo.
echo Searching for Windows built-in C# compiler (csc.exe)...

set CSC=""
if exist "%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe" (
    set CSC="%SystemRoot%\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe"
) else if exist "%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe" (
    set CSC="%SystemRoot%\\Microsoft.NET\\Framework\\v4.0.30319\\csc.exe"
)

if %CSC%=="" (
    echo [ERROR] Microsoft .NET Framework C# compiler was not found!
    echo Please make sure .NET Framework 4.5+ is enabled in Windows features.
    pause
    exit /b 1
)

echo Found C# compiler at: %CSC%
echo Compiling IT_Asset_Tracker.exe ...

%CSC% /target:winexe /optimize+ /out:IT_Asset_Tracker.exe ITAssetTracker.cs

if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed!
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! "IT_Asset_Tracker.exe" has been created!
echo   Double click IT_Asset_Tracker.exe to run the application.
echo ========================================================
echo.
pause
`;

      // 2. C# source file
      const csharpSource = `using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace ITAssetTracker
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string targetUrl = "${currentAppUrl}";
                string localDist = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "dist", "index.html");

                if (File.Exists(localDist))
                {
                    targetUrl = "file:///" + localDist.Replace('\\\\', '/');
                }

                string[] browserPaths = new string[]
                {
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\\Edge\\Application\\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\\Edge\\Application\\msedge.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\\Chrome\\Application\\chrome.exe"),
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\\Chrome\\Application\\chrome.exe")
                };

                string foundBrowser = null;
                foreach (string p in browserPaths)
                {
                    if (File.Exists(p))
                    {
                        foundBrowser = p;
                        break;
                    }
                }

                string userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ITAssetTrackerApp");

                if (foundBrowser != null)
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = foundBrowser;
                    psi.Arguments = string.Format("--app=\\"{0}\\" --window-size=1440,900 --user-data-dir=\\"{1}\\" --enable-features=OverlayScrollbar", targetUrl, userDataDir);
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                }
                else
                {
                    Process.Start(targetUrl);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error launching IT Asset Tracker: " + ex.Message, "IT Asset Tracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
`;

      // 3. 1-click standalone desktop launcher
      const standaloneBat = `@echo off
:: IT Asset & Accessories Tracker (Branch 1-22) - Windows Launcher
:: Launches in borderless standalone desktop window mode

set APP_URL=${currentAppUrl}

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)

if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)

if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)

if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)

start "" "%APP_URL%"
exit
`;

      // 4. Automated Electron EXE builder script
      const electronBat = `@echo off
setlocal
title IT Asset Tracker - Automated Electron .EXE Builder
echo ========================================================
echo   IT ASSET & ACCESSORIES TRACKER (BRANCH 1-22)
echo   BUILDING WINDOWS INSTALLER & PORTABLE .EXE
echo ========================================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required! Download from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Installing dependencies and Electron...
call npm install
call npm install --save-dev electron electron-builder

echo [2/3] Compiling React and Vite app...
call npm run build

echo [3/3] Packaging Windows executable (.exe)...
call npx electron-builder --win nsis portable --x64

echo.
echo ========================================================
echo   BUILD COMPLETE! Check "dist_electron" folder for:
echo   - PREMIER_IT_ASSET_TRACKER_Setup.exe (NSIS Installer)
echo   - PREMIER_IT_ASSET_TRACKER_Portable.exe (Standalone EXE)
echo   Default Install Path: C:\\Program Files\\PREMIER IT ASSET TRACKER\\
echo ========================================================
explorer dist_electron
pause
`;

      // 5. Readme guide
      const readmeText = `========================================================================
  IT ASSET & ACCESSORIES TRACKER (BRANCH 1-22)
  WINDOWS DESKTOP APPLICATION & .EXE GENERATOR PACKAGE
========================================================================

You have 3 easy ways to run or build the .EXE file on your Windows computer:

------------------------------------------------------------------------
METHOD 1: INSTANT NATIVE WINDOWS .EXE (ZERO DEPENDENCIES)
------------------------------------------------------------------------
1. Double-click "Compile-IT-Asset-Tracker-EXE.bat"
2. Windows will automatically use its built-in C# compiler (csc.exe)
   to compile "IT_Asset_Tracker.exe" in under 2 seconds!
3. Double-click "IT_Asset_Tracker.exe" to launch the tracker in a dedicated,
   borderless desktop window. No Node.js or extra software needed!

------------------------------------------------------------------------
METHOD 2: 1-CLICK STANDALONE WINDOW LAUNCHER
------------------------------------------------------------------------
1. Double-click "Launch-IT-Asset-Tracker.bat"
2. Immediately opens the app in native window mode without address bar
   or browser tabs.

------------------------------------------------------------------------
METHOD 3: PRODUCTION INSTALLER (.EXE) VIA ELECTRON BUILDER
------------------------------------------------------------------------
1. Ensure Node.js (v18+) is installed on Windows.
2. Double-click "Build-Electron-EXE.bat"
   (or run in terminal: npm run electron:build)
3. Outputs to "dist_electron\\":
   - PREMIER_IT_ASSET_TRACKER_Setup.exe (Windows Setup Wizard -> C:\\Program Files\\PREMIER IT ASSET TRACKER\\)
   - PREMIER_IT_ASSET_TRACKER_Portable.exe (Portable USB-friendly EXE)

Central Office & Branch 1 to 22 data syncs automatically with centralized Supabase Cloud!
External SSD / Folder Backups (D:\\PREMIER-IT-ASSET-BACKUP\\) supported natively in Desktop mode.
`;

      // Add files to zip
      zip.file('Compile-IT-Asset-Tracker-EXE.bat', nativeCompilerBat);
      zip.file('ITAssetTracker.cs', csharpSource);
      zip.file('Launch-IT-Asset-Tracker.bat', standaloneBat);
      zip.file('Build-Electron-EXE.bat', electronBat);
      zip.file('README-WINDOWS-DESKTOP.txt', readmeText);

      // Generate zip blob and trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'IT-Asset-Tracker-Windows-EXE-Package.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setZipMessage('IT-Asset-Tracker-Windows-EXE-Package.zip downloaded! Extract and double-click the compiler or runner.');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to create zip package', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Download individual file directly
  const downloadSingleFile = (filename: string, content: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLauncherBat = () => {
    const batContent = `@echo off
set APP_URL=${currentAppUrl}
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)
if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="%APP_URL%" --window-size=1440,900
    exit
)
start "" "%APP_URL%"
exit`;
    downloadSingleFile('Launch-IT-Asset-Tracker.bat', batContent);
  };

  const powershellCommand = `$url = "${currentAppUrl}"; $code = @'
using System; using System.Diagnostics; using System.IO;
namespace App { class P { [STAThread] static void Main() {
    string u = "$url";
    string edge = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86) + @"\\Microsoft\\Edge\\Application\\msedge.exe";
    if (File.Exists(edge)) { Process.Start(new ProcessStartInfo(edge, "--app=\\"" + u + "\\" --window-size=1440,900") { UseShellExecute = false }); }
    else { Process.Start(u); }
}}}
'@; Add-Type -TypeDefinition $code -Language CSharp -OutputAssembly "$HOME\\Desktop\\IT_Asset_Tracker.exe" -OutputType WindowsApplication; Write-Host "DONE! IT_Asset_Tracker.exe created on your Windows Desktop!" -ForegroundColor Green`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-[#303B38] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8F5EE] border-b border-[#E9E5DA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A8DCCB] to-[#BFDCCB] flex items-center justify-center text-[#303B38] shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#303B38] tracking-tight">
                  Windows Desktop Application (.EXE) Generator
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] rounded-full">
                  Windows 10 / 11 Ready
                </span>
              </div>
              <p className="text-xs text-[#7F8983]">
                Package and run IT Asset Tracker as a standalone native Windows executable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#7F8983] hover:text-[#303B38] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Download Hero Banner */}
        <div className="p-4 bg-gradient-to-r from-[#D8EEE4]/60 via-[#F8F5EE] to-[#D8EEE4]/60 border-b border-[#E9E5DA] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#A8DCCB]/40 text-[#303B38] border border-[#A8DCCB]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[#303B38]">
                Download Complete Windows EXE Packaging Project (.zip)
              </div>
              <div className="text-xs text-[#7F8983]">
                Full React + Vite + Electron source code, icons, NSIS installer config & build scripts
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadFullProjectZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#E58971] hover:opacity-95 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
            <span>{isZipping ? 'Preparing ZIP...' : 'Download Full Project (.zip)'}</span>
          </button>
        </div>

        {downloadSuccess && (
          <div className="bg-[#D8EEE4] text-[#303B38] px-4 py-2 text-xs flex items-center justify-between border-b border-[#A8DCCB] animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#303B38]" />
              <span>{zipMessage}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E9E5DA] bg-[#F8F5EE]/80 px-4 pt-2 gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex items-center gap-2 px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'instant'
                ? 'border-[#A8DCCB] text-[#303B38] bg-[#FFFDF7] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>1. Instant Windows .EXE (Native)</span>
          </button>

          <button
            onClick={() => setActiveTab('electron')}
            className={`flex items-center gap-2 px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'electron'
                ? 'border-[#A8DCCB] text-[#303B38] bg-[#FFFDF7] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>2. Electron Installer & Portable .EXE</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-[#A8DCCB] text-[#303B38] bg-[#FFFDF7] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Direct Windows App Install (PWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('powershell')}
            className={`flex items-center gap-2 px-3.5 py-2 font-semibold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'powershell'
                ? 'border-[#A8DCCB] text-[#303B38] bg-[#FFFDF7] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[#7F8983] hover:text-[#303B38]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>4. PowerShell 1-Liner</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-[#303B38] bg-[#FFFDF7]">
          
          {/* TAB 1: Instant Native Windows .EXE */}
          {activeTab === 'instant' && (
            <div className="space-y-4">
              <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#303B38]">
                      Instant Native Windows .EXE Compiler (No Node.js Required)
                    </h4>
                    <p className="text-xs text-[#7F8983] mt-1">
                      Every Windows 10 & 11 machine has Microsoft’s official C# compiler (<code className="text-[#303B38] bg-white/70 px-1 py-0.5 rounded font-mono">csc.exe</code>) pre-installed. You can compile a native standalone <code className="text-[#303B38] bg-white/70 px-1 py-0.5 rounded font-mono">IT_Asset_Tracker.exe</code> executable in 1 second!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl p-3.5 space-y-2">
                    <span className="font-semibold text-[#303B38] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#A8DCCB] text-[#303B38] text-[11px] flex items-center justify-center font-bold">1</span>
                      Download Native Batch Compiler
                    </span>
                    <p className="text-[#7F8983] text-[11px]">
                      Downloads <code className="text-[#303B38]">Compile-IT-Asset-Tracker-EXE.bat</code> and <code className="text-[#303B38]">ITAssetTracker.cs</code>.
                    </p>
                    <button
                      onClick={handleDownloadQuickKitPackage}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#A8DCCB] to-[#BFDCCB] hover:opacity-95 text-[#303B38] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Compiler & Source</span>
                    </button>
                  </div>

                  <div className="bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl p-3.5 space-y-2">
                    <span className="font-semibold text-[#303B38] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#EADCCB] text-[#303B38] text-[11px] flex items-center justify-center font-bold">2</span>
                      1-Click Standalone Desktop Runner
                    </span>
                    <p className="text-[#7F8983] text-[11px]">
                      Opens tracker immediately in borderless standalone desktop window mode.
                    </p>
                    <button
                      onClick={handleDownloadLauncherBat}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#303B38] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Desktop Runner (.bat)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Step by step */}
              <div className="space-y-2">
                <h5 className="font-semibold text-[#303B38] text-xs">How it runs on Windows:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-[#7F8983] pl-1">
                  <li>Extract the downloaded zip or place the files in any folder (e.g. <code className="text-[#303B38]">C:\IT-Tracker</code>).</li>
                  <li>Double-click <strong className="text-[#303B38]">Compile-IT-Asset-Tracker-EXE.bat</strong>.</li>
                  <li>Windows outputs <strong className="text-[#303B38]">IT_Asset_Tracker.exe</strong> right next to it.</li>
                  <li>You can pin <strong className="text-[#303B38]">IT_Asset_Tracker.exe</strong> to your Taskbar or Windows Start Menu!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: Electron Installer & Portable .EXE */}
          {activeTab === 'electron' && (
            <div className="space-y-4">
              <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#303B38]">
                      Full Electron Production Installer (.exe) & Portable (.exe)
                    </h4>
                    <p className="text-xs text-[#7F8983] mt-1">
                      The project includes pre-configured <code className="text-[#303B38] font-mono">electron/main.js</code>, <code className="text-[#303B38] font-mono">electron/preload.js</code>, <code className="text-[#303B38] font-mono">electron/dev-runner.js</code>, and NSIS installer configs in <code className="text-[#303B38] font-mono">package.json</code>.
                    </p>
                  </div>
                </div>

                {/* Commands */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[#303B38] font-medium text-[11px]">
                      <span>Development Mode & Windows NSIS Installer Build:</span>
                      <button
                        onClick={() => handleCopy('npm install && npm run electron:build', 'cmd1')}
                        className="text-[#7F8983] hover:text-[#303B38] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'cmd1' ? <Check className="w-3 h-3 text-[#303B38]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'cmd1' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-[#FFFDF7] font-mono text-[#303B38] text-xs overflow-x-auto border border-[#E9E5DA]">
                      {`npm install\nnpm run electron:dev\nnpm run electron:build`}
                    </pre>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[#303B38] font-medium text-[11px]">
                      <span>Or run the automated Windows batch builder:</span>
                      <button
                        onClick={() => handleCopy('.\\build-windows-exe.bat', 'cmd2')}
                        className="text-[#7F8983] hover:text-[#303B38] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'cmd2' ? <Check className="w-3 h-3 text-[#303B38]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'cmd2' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-[#FFFDF7] font-mono text-[#303B38] text-xs overflow-x-auto border border-[#E9E5DA]">
                      .\build-windows-exe.bat
                    </pre>
                  </div>
                </div>

                <div className="bg-[#FFFDF7] rounded-lg p-3 border border-[#E9E5DA] space-y-1">
                  <span className="font-semibold text-[#303B38]">Output Artifact created in <code className="text-[#303B38] bg-[#D8EEE4] px-1 py-0.5 rounded font-mono">dist_electron/</code>:</span>
                  <ul className="list-disc list-inside space-y-1 text-[#7F8983] pt-1">
                    <li><strong className="text-[#303B38]">PREMIER_IT_ASSET_TRACKER_Setup.exe</strong> (NSIS Wizard installing to <code className="text-[#303B38]">C:\Program Files\PREMIER IT ASSET TRACKER\</code> with Desktop & Start Menu shortcuts and Uninstaller)</li>
                    <li>Run <code className="text-[#303B38]">npm run build:exe</code> to also output <strong className="text-[#303B38]">PREMIER_IT_ASSET_TRACKER_Portable.exe</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Direct Windows App Install (PWA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#303B38]">
                      Install as Windows Desktop App via Chrome / Microsoft Edge
                    </h4>
                    <p className="text-xs text-[#7F8983] mt-1">
                      Windows automatically generates an actual <code className="text-[#303B38] font-mono">msedge_proxy.exe</code> or <code className="text-[#303B38] font-mono">chrome_proxy.exe</code> shortcut on your Windows Desktop and Start Menu! It runs in its own dedicated, chromeless window just like any native software.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-[#FFFDF7] border border-[#E9E5DA] rounded-xl space-y-3">
                  {isAppInstalled ? (
                    <div className="flex items-center gap-2 text-[#303B38] font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-[#A8DCCB]" />
                      <span>This app is already running as an installed Windows Desktop Application!</span>
                    </div>
                  ) : deferredPrompt ? (
                    <div className="space-y-2">
                      <p className="text-[#7F8983]">Click below to trigger the Windows 1-Click App Installation:</p>
                      <button
                        onClick={handlePwaInstall}
                        className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F4A58F] to-[#E58971] text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Download className="w-4 h-4" />
                        <span>Install IT Asset Tracker on Windows</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-[#303B38] font-semibold">
                        How to install in 2 clicks on Windows:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#303B38]">
                        <div className="bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] space-y-1">
                          <strong className="text-[#303B38] block">In Microsoft Edge:</strong>
                          <p className="text-[#7F8983] text-[11px]">
                            1. Click the <strong>App Available</strong> icon in the address bar (or click <code className="text-[#303B38]">...</code> menu &gt; <strong>Apps</strong>).<br />
                            2. Click <strong>Install this site as an app</strong>.<br />
                            3. Check <strong>Create Desktop shortcut</strong> and <strong>Pin to Taskbar</strong>.
                          </p>
                        </div>
                        <div className="bg-[#F8F5EE] p-3 rounded-xl border border-[#E9E5DA] space-y-1">
                          <strong className="text-[#303B38] block">In Google Chrome:</strong>
                          <p className="text-[#7F8983] text-[11px]">
                            1. Click the <strong>Install</strong> icon on the right side of the URL bar (or <code className="text-[#303B38]">...</code> &gt; <strong>Save and Share</strong> &gt; <strong>Install page as app</strong>).<br />
                            2. Confirm <strong>Install</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PowerShell 1-Liner */}
          {activeTab === 'powershell' && (
            <div className="space-y-4">
              <div className="bg-[#F8F5EE] border border-[#E9E5DA] rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#D8EEE4] text-[#303B38] border border-[#A8DCCB] shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#303B38]">
                      Instant PowerShell Command (Generates EXE on your Desktop)
                    </h4>
                    <p className="text-xs text-[#7F8983] mt-1">
                      Paste this single command into Windows PowerShell (Win + R &gt; powershell). It compiles <code className="text-[#303B38] font-mono">IT_Asset_Tracker.exe</code> and places it directly on your Windows Desktop!
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[#303B38] font-medium text-[11px]">
                    <span>Copy & Paste into Windows PowerShell:</span>
                    <button
                      onClick={() => handleCopy(powershellCommand, 'ps1')}
                      className="text-[#303B38] hover:bg-[#E9E5DA]/50 flex items-center gap-1 cursor-pointer bg-[#FFFDF7] border border-[#E9E5DA] px-2 py-1 rounded-lg"
                    >
                      {copiedKey === 'ps1' ? <Check className="w-3 h-3 text-[#303B38]" /> : <Copy className="w-3 h-3 text-[#7F8983]" />}
                      <span>{copiedKey === 'ps1' ? 'Copied to Clipboard!' : 'Copy Command'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-[#FFFDF7] font-mono text-[11px] text-[#303B38] overflow-x-auto border border-[#E9E5DA] leading-relaxed whitespace-pre-wrap select-all">
                    {powershellCommand}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F8F5EE] border-t border-[#E9E5DA] flex items-center justify-between text-[#7F8983] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A8DCCB]"></span>
            <span>Centralized Supabase Cloud database (Central Office + Branches 1-22) built-in</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#FFFDF7] border border-[#E9E5DA] hover:bg-[#E9E5DA]/50 text-[#303B38] font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
