# PREMIER IT ASSET TRACKER — Windows Desktop Application Build & Install Guide

**Company:** PREMIER AUTO PARTS LLC  
**Application:** PREMIER IT ASSET TRACKER v3.0.0  
**Architecture:** Electron + React + Vite + Centralized Supabase Cloud PostgreSQL  
**Locations Supported:** Central Office (`0`) + Branches `1` to `22`

---

## 1. Architecture Overview

- **Desktop Runtime:** Electron (`electron/main.js`, `electron/preload.js`) wrapping the production Vite bundle (`dist/index.html` loaded with relative paths `base: './'`).
- **Centralized Cloud Database:** Every installed Windows PC connects directly to the same Supabase Cloud project (`https://bigkrsehqqopiqlpxfms.supabase.co`). There is **no separate local database per PC**.
- **Real-Time Synchronization:** Inserts, edits, issues, returns, transfers, and deletes broadcast over Supabase Realtime (`postgres_changes`) and sync automatically across all open Windows desktops.
- **Native Desktop Capabilities:**
  - Single-instance lock (re-focuses running window if opened twice).
  - Native Windows folder picker & `.json` restore file picker (`dialog:selectBackupFolder`, `dialog:selectRestoreFile`).
  - Direct filesystem backup writes & physical verification (`D:\PREMIER-IT-ASSET-BACKUP\` or any chosen folder).

---

## 2. Prerequisites (For Building the Windows Installer)

On a **Windows 10 / Windows 11 (x64)** build machine:
1. Install **Node.js 18 LTS or 20 LTS** from [https://nodejs.org/](https://nodejs.org/).
2. Verify installation in Command Prompt or PowerShell:
   ```bat
   node -v
   npm -v
   ```
3. Ensure `.env` (or environment variables) contains your Supabase connection details (already pre-configured in `.env.example` / `src/lib/supabase.ts`):
   ```env
   VITE_SUPABASE_URL=https://bigkrsehqqopiqlpxfms.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Enozxe-UN--W8qOjjwYraQ_hdzfMq2l
   ```
   > **Security Note:** Only the public publishable key (`sb_publishable_...`) is bundled in the desktop client. Never embed `service_role` or secret keys in client code.

---

## 3. Building the Windows `.EXE` Installer (`PREMIER_IT_ASSET_TRACKER_Setup.exe`)

### Option A — One-Click Windows Batch Script
Double-click `build-windows-exe.bat` in the project root, or run in Command Prompt:
```bat
.\build-windows-exe.bat
```

### Option B — Manual NPM Commands
```bat
npm install
npm run electron:dev
npm run electron:build
```
*(Or run `npm run build:exe` to build both the NSIS Setup installer and Portable EXE.)*

### Output Files Generated in `dist_electron\`
- **`dist_electron\PREMIER_IT_ASSET_TRACKER_Setup.exe`** — NSIS Windows Installation Wizard
- **`dist_electron\PREMIER_IT_ASSET_TRACKER_Portable.exe`** — Standalone Portable Windows Executable (when running `npm run build:exe`)

---

## 4. Installing on Branch PCs & Central Office

1. Copy `PREMIER_IT_ASSET_TRACKER_Setup.exe` to any branch PC (Windows 10 / 11 x64).
2. Double-click `PREMIER_IT_ASSET_TRACKER_Setup.exe` and accept UAC elevation if prompted.
3. The NSIS Setup Wizard configures:
   - **Default Install Directory:** `C:\Program Files\PREMIER IT ASSET TRACKER\` (customizable during install).
   - **Desktop Shortcut:** `PREMIER IT ASSET TRACKER`
   - **Start Menu Shortcut:** `PREMIER AUTO PARTS LLC -> PREMIER IT ASSET TRACKER`
   - **Windows Programs & Features Entry:** Full Uninstaller (`PREMIER IT ASSET TRACKER`).
4. Launch the app and sign in with a registered Supabase user account (Admin or authorized branch staff).

---

## 5. Verifying Multi-PC Centralized Synchronization

1. Open **PREMIER IT ASSET TRACKER** on **PC #1** (e.g., Central Office) and **PC #2** (e.g., Branch 4).
2. Check the header status badge: it must display **`Cloud Synced`**.
3. On **PC #1**, add or update an IT System, Cartridge Stock IN/OUT, Accessory Transfer, Mobile, or Laptop.
4. Observe **PC #2** automatically updating within seconds via Supabase Realtime (or click **Sync Cloud** in the top bar for an immediate full refresh).

---

## 6. Backup & Restore Workflow (Admin Only)

Navigate to **Backup & Restore** (`Admin` role required):
- **Physical Disk / Folder Test:** Click **Run 5-Step Verification** to verify folder creation, write access, `BACKUP_TEST.txt` verification, full 12-table Supabase snapshot, and non-zero file size on `D:\PREMIER-IT-ASSET-BACKUP\` or a chosen custom folder.
- **Manual Backup / Choose Folder:** Select any local drive, external SSD, or network folder via the native Windows dialog and click **Run Backup Now**.
- **Export `.JSON` / `.SQL`:** Download standalone `.json` snapshots or full PostgreSQL `.sql` dumps.
- **Restore from Backup or Uploaded `.JSON`:** Restores records to centralized Supabase Cloud in dependency order while creating a pre-restore rollback snapshot automatically.

---

## 7. Troubleshooting

| Symptom | Cause | Resolution |
|---|---|---|
| Top bar shows **Offline** or **Sync Alert** | No internet connection or firewall blocking `*.supabase.co` | Allow HTTPS (`443`) traffic to `bigkrsehqqopiqlpxfms.supabase.co`; the app auto-reconnects every 15 seconds or via **Reconnect**. |
| `42501` / RLS Permission Denied on Save/Restore | Logged-in user lacks write permissions in Supabase RLS policy | Sign in with an authorized Admin Supabase account or verify Row Level Security policies in Supabase Dashboard. |
| Running `npm run electron:build` on Linux container stops at `makensis` / `wine` | NSIS `.exe` packaging requires Windows (or Linux with Wine + NSIS) | Run `npm run electron:build` (or `build-windows-exe.bat`) on a Windows 10/11 PC to produce the NSIS `.exe` installer. |
| External SSD folder not found (`D:\PREMIER-IT-ASSET-BACKUP\`) | Drive letter differs on target PC | Click **Choose Destination Folder** inside Backup & Restore to pick the exact connected drive path. |
