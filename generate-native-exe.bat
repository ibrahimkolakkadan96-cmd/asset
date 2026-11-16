@echo off
setlocal

title IT Asset Tracker - Native Windows EXE Generator
echo ========================================================
echo   INSTANT NATIVE WINDOWS .EXE COMPILER
echo   IT Asset & Accessories Tracker (Branch 1-22)
echo ========================================================
echo.
echo Searching for Windows built-in C# compiler (csc.exe)...

set CSC=""
if exist "%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set CSC="%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set CSC="%SystemRoot%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
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
echo   You can now double click IT_Asset_Tracker.exe to run
echo   the tracker in a clean, standalone desktop window.
echo ========================================================
echo.
pause
