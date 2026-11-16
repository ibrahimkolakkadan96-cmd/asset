import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const ARCHIVE_NAME = 'PREMIER-IT-ASSET-TRACKER-Windows-Desktop-Project.zip';
const ROOT_OUTPUT = path.join(ROOT_DIR, ARCHIVE_NAME);
const PUBLIC_OUTPUT = path.join(ROOT_DIR, 'public', ARCHIVE_NAME);

const INCLUDED_ROOT_FILES = [
  '.env.example',
  '.gitignore',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'metadata.json',
  'build-windows-exe.bat',
  'BUILD-AND-INSTALL-GUIDE.md',
  'TESTING-GUIDE-SUPABASE-SSD.md',
  'ITAssetTracker.cs',
  'Launch-IT-Asset-Tracker.bat',
  'generate-native-exe.bat',
];

const INCLUDED_DIRS = ['src', 'electron', 'build', 'public', 'scripts'];

const EXCLUDED_NAMES = new Set([
  'node_modules',
  'dist',
  'dist_electron',
  '.git',
  '.DS_Store',
]);

function walkDirectory(dirPath, zip, relativeBase) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    if (entry.name.endsWith('.zip')) continue;

    const fullPath = path.join(dirPath, entry.name);
    const zipPath = path.posix.join(relativeBase, entry.name);

    if (entry.isDirectory()) {
      walkDirectory(fullPath, zip, zipPath);
    } else if (entry.isFile()) {
      const data = fs.readFileSync(fullPath);
      zip.file(zipPath, data);
    }
  }
}

async function exportProjectZip() {
  const zip = new JSZip();
  const rootFolder = zip.folder('PREMIER-IT-ASSET-TRACKER');

  for (const relFile of INCLUDED_ROOT_FILES) {
    const absFile = path.join(ROOT_DIR, relFile);
    if (fs.existsSync(absFile)) {
      rootFolder.file(relFile, fs.readFileSync(absFile));
    }
  }

  // Generate clean .env for Windows Vite build (publishable client key only; no secrets)
  const cleanEnv = [
    '# PREMIER IT ASSET TRACKER - Centralized Supabase Cloud Configuration',
    'VITE_SUPABASE_URL="https://bigkrsehqqopiqlpxfms.supabase.co"',
    'VITE_SUPABASE_ANON_KEY="sb_publishable_Enozxe-UN--W8qOjjwYraQ_hdzfMq2l"',
    'VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Enozxe-UN--W8qOjjwYraQ_hdzfMq2l"',
    '',
  ].join('\n');
  rootFolder.file('.env', cleanEnv);

  for (const dirName of INCLUDED_DIRS) {
    walkDirectory(path.join(ROOT_DIR, dirName), rootFolder, dirName);
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(ROOT_OUTPUT, buffer);
  fs.mkdirSync(path.dirname(PUBLIC_OUTPUT), { recursive: true });
  fs.writeFileSync(PUBLIC_OUTPUT, buffer);

  const fileCount = Object.keys(zip.files).filter((k) => !zip.files[k].dir).length;
  const sizeKb = (buffer.length / 1024).toFixed(1);
  console.log(`[EXPORT ZIP] Created ${ARCHIVE_NAME} (${fileCount} files, ${sizeKb} KB)`);
  console.log(`  -> ${ROOT_OUTPUT}`);
  console.log(`  -> ${PUBLIC_OUTPUT}`);
}

exportProjectZip().catch((err) => {
  console.error('[EXPORT ZIP ERROR]', err);
  process.exit(1);
});
