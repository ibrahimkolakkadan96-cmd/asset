@echo off
setlocal enabledelayedexpansion

title PREMIER IT ASSET TRACKER - Windows EXE Builder (Electron + NSIS)
echo ========================================================
echo   PREMIER AUTO PARTS LLC
echo   PREMIER IT ASSET TRACKER (Central Office + Branch 1-22)
echo   WINDOWS DESKTOP INSTALLER (.EXE) BUILDER
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js 18+ from https://nodejs.org/ and re-run this script.
    echo.
    pause
    exit /b 1
)

echo [1/4] Installing Node dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies.
    pause
    exit /b 1
)

echo.
echo [2/4] Verifying Electron & Electron Builder...
call npx electron-builder --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing electron and electron-builder...
    call npm install --save-dev electron electron-builder
)

echo.
echo [3/4] Compiling React + Vite production bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Vite build failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Building Windows NSIS Setup Installer (PREMIER_IT_ASSET_TRACKER_Setup.exe)...
call npm run electron:build
if %errorlevel% neq 0 (
    echo [ERROR] Electron-builder failed to create the Windows EXE.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! Windows Setup Installer generated in dist_electron\:
echo   - dist_electron\PREMIER_IT_ASSET_TRACKER_Setup.exe
echo   Default Install Path: C:\Program Files\PREMIER IT ASSET TRACKER\
echo ========================================================
echo.
explorer dist_electron
pause
