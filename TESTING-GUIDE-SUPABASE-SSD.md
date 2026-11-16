# PREMIER IT ASSET TRACKER
## SUPABASE DATABASE + EXTERNAL SSD BACKUP & RESTORE TESTING GUIDE

This guide provides end-to-end instructions for testing and running the **PREMIER IT Asset & Accessories Tracker (Branch 1-22)** with Supabase Cloud Database and automatic External SSD (`D:\`) PostgreSQL backups.

---

### 1. System Architecture Overview

```
[ PREMIER IT ASSET TRACKER ]
  │
  ├── Frontend UI (React + TypeScript + Tailwind)
  │    ├── 22 Branch Matrix & Computer Specifications
  │    ├── Accessories Stock IN/OUT & Days Calculation
  │    ├── Supabase Tables Explorer & Schema DDL Viewer
  │    └── External SSD Backup & Restore Dashboard
  │
  ├── Database Layer
  │    ├── Supabase Cloud Database (PostgreSQL 15+)
  │    │    ├── public.systems (All 22 Branch PCs)
  │    │    ├── public.accessories (Branch Stock)
  │    │    ├── public.transactions (Stock Movement Logs)
  │    │    ├── public.branches (Branch 1-22 Directory)
  │    │    └── public.storage_files (Asset Invoices & Photos)
  │    └── Resilient Firestore & Local Fallback
  │
  └── Native Windows Backend (Electron Main Process)
       ├── External SSD Detection (D:\) via PowerShell
       ├── Automated 5-Folder Directory Provisioning
       ├── PostgreSQL pg_dump & Plain .SQL Exporter
       ├── SHA-256 Cryptographic Checksum Engine
       ├── Atomic Write Protocol (.tmp -> .dump)
       └── 60-Second Background Scheduler
```

---

### 2. Destination Directory on External SSD (`D:\`)

When your external SSD is connected to `D:\`, the system automatically provisions and manages:

```
D:\PREMIER-IT-ASSET-BACKUP\
  ├── Database-Full-Backup\
  │     ├── PREMIER_ASSET_BACKUP_YYYY-MM-DD_HHMMSS.dump  (PostgreSQL Binary Dump)
  │     ├── PREMIER_ASSET_BACKUP_YYYY-MM-DD_HHMMSS.sql   (Full SQL DDL + Rows)
  │     └── PRE_RESTORE_SAFETY_*.json                    (Pre-Restore Rollback Points)
  │
  ├── Database-Schema\
  │     └── schema_YYYY-MM-DD_HHMMSS.sql                 (DDL Schema, Constraints, Indexes)
  │
  ├── Storage-Files\
  │     └── storage_manifest_YYYY-MM-DD_HHMMSS.json      (Bucket Attachments & Invoices)
  │
  ├── Application-Configuration\
  │     └── config_PREMIER_ASSET_BACKUP_*.json           (Project & Branch Configuration)
  │
  └── Backup-History\
        └── history-index.json                           (Tamper-Proof Audit Trail)
```

---

### 3. Step-by-Step Testing Instructions

#### A. In the Web Application & Live Preview
1. Open the **"💾 Supabase & SSD Backup (D:\)"** worksheet tab (or click **"Supabase & D:\ Backup"** in the top navigation bar).
2. Inspect the **Supabase Database** card:
   - Click **Ping** to verify live connection latency and host status.
   - Click **Configure Keys** if you wish to connect your own Supabase project URL and Anon Key.
3. Switch to the **Supabase Database Tables** tab:
   - View all 5 tables (`systems`, `accessories`, `transactions`, `branches`, `storage_files`).
   - Click **View Schema DDL** to review or copy the PostgreSQL schema SQL.
4. Click **"⚡ Manual Backup (pg_dump to D:\)"**:
   - Watch the live progress bar (0% to 100%) as it executes SSD verification, DDL generation, row serialization, and SHA-256 calculation.
   - Upon completion, the backup appears in the history table.
5. In the history table:
   - Click **Verify Hash** to test SHA-256 integrity verification.
   - Click **.SQL** to download the self-contained PostgreSQL SQL dump directly.
6. Test Database Restoration:
   - Click **Restore...** on any backup in the table.
   - Notice the prompt requires the **Administrator Password** to prevent unauthorized rollbacks.
   - An automatic pre-restoration rollback snapshot is created before the database is restored.

#### B. In the Installed Windows EXE Application
1. Double-click **`build-windows-exe.bat`** (or run `npm run build:exe`).
2. Locate the output files in `dist_electron\`:
   - `PREMIER-IT-Asset-Tracker-Setup.exe` (Windows Installer)
   - `PREMIER-IT-Asset-Tracker-Portable.exe` (Portable USB Edition)
3. Launch the application on Windows with your external SSD plugged in at `D:\`.
4. The application communicates with the native Electron backend via secure IPC:
   - Real-time disk capacity, free storage, and drive type are detected.
   - Backups write directly to `D:\PREMIER-IT-ASSET-BACKUP\` using atomic rename.
   - If the SSD is unplugged during a backup, the transfer safely aborts without leaving corrupted files.

---

### 4. Automated Backup Scheduler Options

- **Daily Backup**: Automatically fires at the configured 24-hour time (default: `23:00`).
- **Weekly Backup**: Fires on the selected day of the week (e.g. Sunday).
- **Startup Catch-Up**: If your PC was turned off during a scheduled backup, the application detects the missed run at launch and immediately performs the backup once `D:\` is detected.
- **Windows Notifications**: Displays native Windows desktop notifications upon completion.
