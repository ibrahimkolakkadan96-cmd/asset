const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const DEV_PORT = 3000;
const DEV_URL = `http://localhost:${DEV_PORT}`;
const ROOT_DIR = path.resolve(__dirname, '..');

function isWindows() {
  return process.platform === 'win32';
}

function checkServerReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkServerReady(url)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log('[PREMIER IT ASSET TRACKER] Starting Vite development server...');

  const npmCmd = isWindows() ? 'npm.cmd' : 'npm';
  const viteProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: isWindows(),
  });

  const ready = await waitForServer(DEV_URL);
  if (!ready) {
    console.error(`[ERROR] Vite dev server did not respond at ${DEV_URL} within 60 seconds.`);
    viteProc.kill();
    process.exit(1);
  }

  console.log(`[PREMIER IT ASSET TRACKER] Launching Electron desktop window (${DEV_URL})...`);

  const electronBin = require('electron');
  const electronProc = spawn(electronBin, ['.'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      VITE_DEV_SERVER_URL: DEV_URL,
    },
  });

  const cleanup = () => {
    try {
      if (!viteProc.killed) viteProc.kill();
    } catch {}
    try {
      if (!electronProc.killed) electronProc.kill();
    } catch {}
  };

  electronProc.on('close', (code) => {
    cleanup();
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[ERROR] electron:dev failed:', err);
  process.exit(1);
});
