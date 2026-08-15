'use strict';

const { app, BrowserWindow, dialog, shell, Tray, Menu, nativeImage, screen, ipcMain } = require('electron');
const { spawn, execFileSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const net = require('net');

const APP_USER_MODEL_ID = 'com.deepseek.harness.desktop';

// Windows taskbar groups by AppUserModelID; must match desktop shortcut.
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

// Writable state lives in userData (app.asar is read-only when packaged).
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'DeepSeekHarnessDesktop'));
} catch (_) {}
const DATA_DIR = app.getPath('userData');
try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (_) {}

/** Packaged: resources/dsh-runtime. Dev: ./dsh-runtime or sibling deepseek-harness. */
function resolveDshRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dsh-runtime');
  }
  const candidates = [
    path.join(__dirname, 'dsh-runtime'),
    path.resolve(__dirname, '..', 'deepseek-harness'),
    path.resolve(__dirname, '..'),
  ];
  for (const candidate of candidates) {
    const bin = path.join(candidate, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
    if (fs.existsSync(bin)) return candidate;
  }
  return path.join(__dirname, 'dsh-runtime');
}

const DSH_ROOT = resolveDshRoot();
const ICON_CANDIDATES = [
  path.join(__dirname, 'assets', 'deepseek.ico'),
  path.join(__dirname, 'assets', 'icon.png'),
  path.join(__dirname, 'deepseek.ico'),
  path.join(DSH_ROOT, 'deepseek.ico'),
  path.join(DSH_ROOT, 'deepseek-icon-180.png'),
];
const ICON_PATH = ICON_CANDIDATES.find((p) => fs.existsSync(p)) || ICON_CANDIDATES[0];
const DSH_CMD = path.join(DSH_ROOT, 'dsh.cmd');
const PET_HTML = path.join(__dirname, 'pet-desktop.html');
const PET_PRELOAD = path.join(__dirname, 'pet-preload.js');
const PET_PREFS_FILE = path.join(DATA_DIR, 'pet-prefs.json');
const NETWORK_PREFS_FILE = path.join(DATA_DIR, 'network-prefs.json');
const DEFAULT_PORT = 3080;
const HOST = '127.0.0.1';
const READY_TIMEOUT_MS = 90_000;
const READY_POLL_MS = 400;
const PID_FILE = path.join(DATA_DIR, 'dsh-server.pid');
const LOG_FILE = path.join(DATA_DIR, 'desktop.log');
const DEFAULT_PET_SIZE = { width: 280, height: 300 };
const DEFAULT_CLASH_PORTS = [7897, 7890, 7891, 10809];

let mainWindow = null;
let splashWindow = null;
let petWindow = null;
let tray = null;
let dshProcess = null;
let chosenPort = DEFAULT_PORT;
let shuttingDown = false;
let petPrefs = loadPetPrefs();
let networkPrefs = loadNetworkPrefs();
let petEnabled = petPrefs.enabled !== false;
let agentStatusTimer = null;
let lastAgentMode = 'idle';

function loadNetworkPrefs() {
  const fallback = {
    mode: 'direct', // direct | auto | proxy — default direct (most reliable for DeepSeek API)
    proxyUrl: 'http://127.0.0.1:7897',
  };
  try {
    if (!fs.existsSync(NETWORK_PREFS_FILE)) return fallback;
    const raw = JSON.parse(fs.readFileSync(NETWORK_PREFS_FILE, 'utf8'));
    const mode = ['auto', 'direct', 'proxy'].includes(raw.mode) ? raw.mode : 'direct';
    const proxyUrl =
      typeof raw.proxyUrl === 'string' && raw.proxyUrl.trim()
        ? raw.proxyUrl.trim()
        : fallback.proxyUrl;
    return { mode, proxyUrl };
  } catch (_) {
    return fallback;
  }
}

function saveNetworkPrefs(patch) {
  networkPrefs = { ...networkPrefs, ...(patch || {}) };
  try {
    fs.writeFileSync(NETWORK_PREFS_FILE, JSON.stringify(networkPrefs, null, 2), 'utf8');
  } catch (err) {
    log(`save network prefs failed: ${err.message}`);
  }
  return networkPrefs;
}

/** Accept full URL, host:port, or bare port (→ http://127.0.0.1:PORT). */
function normalizeProxyUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return { ok: false, error: '代理地址不能为空' };
  if (/^\d{2,5}$/.test(s)) {
    const port = Number(s);
    if (port < 1 || port > 65535) return { ok: false, error: '端口无效' };
    s = `http://127.0.0.1:${port}`;
  } else if (/^[\w.-]+:\d{2,5}$/.test(s)) {
    s = `http://${s}`;
  }
  let u;
  try {
    u = new URL(s);
  } catch (_) {
    return { ok: false, error: '格式无效，例如 http://127.0.0.1:7897 或 7897' };
  }
  const proto = u.protocol.toLowerCase();
  if (!['http:', 'https:', 'socks:', 'socks4:', 'socks5:'].includes(proto)) {
    return { ok: false, error: '仅支持 http / https / socks5' };
  }
  if (!u.hostname) return { ok: false, error: '缺少主机名' };
  const port = u.port ? Number(u.port) : proto === 'https:' ? 443 : 80;
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return { ok: false, error: '端口无效' };
  }
  // Keep explicit form so logs/tray show the exact URL users set.
  return { ok: true, url: s };
}

let proxyPrefsWindow = null;

function openProxyPrefsWindow() {
  if (proxyPrefsWindow && !proxyPrefsWindow.isDestroyed()) {
    proxyPrefsWindow.focus();
    return;
  }
  const parent =
    mainWindow && !mainWindow.isDestroyed()
      ? mainWindow
      : BrowserWindow.getFocusedWindow() || undefined;
  proxyPrefsWindow = new BrowserWindow({
    width: 440,
    height: 300,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: '代理设置',
    parent,
    modal: Boolean(parent),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'proxy-prefs-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  proxyPrefsWindow.loadFile(path.join(__dirname, 'proxy-prefs.html'));
  proxyPrefsWindow.once('ready-to-show', () => {
    if (proxyPrefsWindow && !proxyPrefsWindow.isDestroyed()) proxyPrefsWindow.show();
  });
  proxyPrefsWindow.on('closed', () => {
    proxyPrefsWindow = null;
  });
}

function isLocalPortOpen(port) {
  try {
    const script = `$c=New-Object Net.Sockets.TcpClient; try { $c.Connect('127.0.0.1',${Number(port)}); $c.Close(); '1' } catch { '0' }`;
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { windowsHide: true, encoding: 'utf8', timeout: 1500 },
    );
    return String(out).trim() === '1';
  } catch (_) {
    return false;
  }
}

function readWindowsSystemProxyUrl() {
  if (process.platform !== 'win32') return '';
  try {
    const ps = `(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings').ProxyEnable; (Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings').ProxyServer`;
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', ps],
      { windowsHide: true, encoding: 'utf8', timeout: 2000 },
    );
    const lines = String(out)
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const enabled = lines[0] === '1' || /^true$/i.test(lines[0] || '');
    const server = lines[1] || '';
    if (!enabled || !server) return '';
    // formats: 127.0.0.1:7897 or http=127.0.0.1:7897;https=...
    let hostPort = server;
    const httpsPart = server.split(';').find((p) => /^https=/i.test(p));
    const httpPart = server.split(';').find((p) => /^http=/i.test(p));
    if (httpsPart) hostPort = httpsPart.split('=')[1];
    else if (httpPart) hostPort = httpPart.split('=')[1];
    hostPort = hostPort.replace(/^https?:\/\//i, '');
    if (!hostPort) return '';
    return `http://${hostPort}`;
  } catch (_) {
    return '';
  }
}

/**
 * Resolve outbound proxy for the dsh child.
 * Node fetch ignores WinINET unless NODE_USE_ENV_PROXY=1 + HTTP(S)_PROXY.
 *
 * auto = ONLY follow Windows system proxy when it is enabled.
 * Do NOT treat "Clash port is listening" as must-proxy — mixed-port stays
 * open even in Clash 直连, and forcing it caused TRANSPORT failures.
 */
function resolveOutboundProxy() {
  const mode = networkPrefs.mode || 'direct';
  if (mode === 'direct') {
    return { mode, proxyUrl: '', reason: 'forced-direct' };
  }
  if (mode === 'proxy') {
    return {
      mode,
      proxyUrl: networkPrefs.proxyUrl || 'http://127.0.0.1:7897',
      reason: 'forced-proxy',
    };
  }
  // auto
  const sys = readWindowsSystemProxyUrl();
  if (sys) return { mode: 'auto', proxyUrl: sys, reason: 'windows-system-proxy' };
  return { mode: 'auto', proxyUrl: '', reason: 'auto-direct-no-system-proxy' };
}

function applyProxyEnv(env, resolved) {
  // Always clear first so a previous shell proxy cannot leak into "direct".
  for (const k of [
    'HTTP_PROXY',
    'HTTPS_PROXY',
    'ALL_PROXY',
    'http_proxy',
    'https_proxy',
    'all_proxy',
    'NODE_USE_ENV_PROXY',
    'GLOBAL_AGENT_HTTP_PROXY',
    'GLOBAL_AGENT_HTTPS_PROXY',
  ]) {
    delete env[k];
  }
  // Loopback only — never put api.deepseek.com here or "强制代理" is silently bypassed.
  const noProxy = ['127.0.0.1', 'localhost', '::1'];
  env.NO_PROXY = [...new Set([...(env.NO_PROXY || '').split(',').map((s) => s.trim()).filter(Boolean), ...noProxy])].join(',');
  env.no_proxy = env.NO_PROXY;
  if (resolved.proxyUrl) {
    env.HTTP_PROXY = resolved.proxyUrl;
    env.HTTPS_PROXY = resolved.proxyUrl;
    env.ALL_PROXY = resolved.proxyUrl;
    env.NODE_USE_ENV_PROXY = '1';
  }
  return env;
}

const IN_APP_PET_SIZES = [
  { id: 'xs', label: '更小（160）', px: 160 },
  { id: 'sm', label: '小（200）', px: 200 },
  { id: 'md', label: '中（260）', px: 260 },
  { id: 'lg', label: '大（320）', px: 320 },
];

function normalizeInAppSize(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 200;
  return Math.min(360, Math.max(140, Math.round(n)));
}

function loadPetPrefs() {
  const fallback = {
    x: null,
    y: null,
    opacity: 1,
    width: DEFAULT_PET_SIZE.width,
    height: DEFAULT_PET_SIZE.height,
    enabled: true,
    inAppEnabled: true,
    inAppSize: 200,
  };
  try {
    if (!fs.existsSync(PET_PREFS_FILE)) return fallback;
    const raw = JSON.parse(fs.readFileSync(PET_PREFS_FILE, 'utf8'));
    return {
      x: Number.isFinite(raw.x) ? raw.x : null,
      y: Number.isFinite(raw.y) ? raw.y : null,
      opacity: Number.isFinite(raw.opacity) ? Math.min(1, Math.max(0.2, raw.opacity)) : 1,
      width: Number.isFinite(raw.width) ? Math.min(480, Math.max(160, raw.width)) : DEFAULT_PET_SIZE.width,
      height: Number.isFinite(raw.height) ? Math.min(520, Math.max(180, raw.height)) : DEFAULT_PET_SIZE.height,
      enabled: raw.enabled !== false,
      inAppEnabled: raw.inAppEnabled !== false,
      inAppSize: normalizeInAppSize(raw.inAppSize ?? 200),
    };
  } catch (_) {
    return fallback;
  }
}

function savePetPrefs(patch) {
  petPrefs = { ...petPrefs, ...(patch || {}) };
  try {
    fs.writeFileSync(PET_PREFS_FILE, JSON.stringify(petPrefs, null, 2), 'utf8');
  } catch (err) {
    log(`save pet prefs failed: ${err.message}`);
  }
  return petPrefs;
}

function clampPetPosition(x, y, width, height) {
  const displays = screen.getAllDisplays();
  let best = screen.getPrimaryDisplay().workArea;
  let bestDist = Infinity;
  const cx = x + width / 2;
  const cy = y + height / 2;
  for (const d of displays) {
    const a = d.workArea;
    const dx = Math.max(a.x - cx, 0, cx - (a.x + a.width));
    const dy = Math.max(a.y - cy, 0, cy - (a.y + a.height));
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  const maxX = best.x + best.width - width;
  const maxY = best.y + best.height - height;
  return {
    x: Math.round(Math.min(Math.max(x, best.x), Math.max(best.x, maxX))),
    y: Math.round(Math.min(Math.max(y, best.y), Math.max(best.y, maxY))),
  };
}

function defaultPetPosition(width, height) {
  const display = screen.getPrimaryDisplay().workArea;
  return {
    x: display.x + display.width - width - 16,
    y: display.y + display.height - height - 8,
  };
}

function applyPetOpacity(opacity) {
  const value = Math.min(1, Math.max(0.2, Number(opacity) || 1));
  savePetPrefs({ opacity: value });
  if (petWindow && !petWindow.isDestroyed()) {
    if (typeof petWindow.setOpacity === 'function') petWindow.setOpacity(value);
    petWindow.webContents.send('pet-prefs', { ...petPrefs });
  }
}

function applyPetSize(size) {
  const width = Math.min(480, Math.max(160, Number(size && size.width) || DEFAULT_PET_SIZE.width));
  const height = Math.min(520, Math.max(180, Number(size && size.height) || DEFAULT_PET_SIZE.height));
  savePetPrefs({ width, height });
  if (petWindow && !petWindow.isDestroyed()) {
    const [x, y] = petWindow.getPosition();
    const pos = clampPetPosition(x, y, width, height);
    petWindow.setBounds({ x: pos.x, y: pos.y, width, height });
  }
}

petPrefs = loadPetPrefs();
petEnabled = petPrefs.enabled !== false;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // CRITICAL: must not reach boot() — a second boot kills :3080 and freezes the first UI.
  app.exit(0);
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) showMainWindow();
  });
}

function log(msg) {
  const line = `[dsh-desktop] ${new Date().toISOString()} ${msg}`;
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (_) {}
  console.log(line);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, HOST);
  });
}

function killPidTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch (_) {}
}

function killPortListeners(port) {
  if (process.platform !== 'win32') return;
  try {
    const ps = `
      # Only LISTEN owners — never kill Established peers (avoids murdering a healthy dsh).
      $conns = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue
      foreach ($c in @($conns)) {
        $op = $c.OwningProcess
        if ($op -and $op -ne $PID) { taskkill /PID $op /T /F 2>$null | Out-Null }
      }
      # Fallback via netstat when Get-NetTCPConnection is flaky
      netstat -ano | Select-String ":${port}\\s+.*LISTENING" | ForEach-Object {
        if ($_ -match '(\\d+)\\s*$') {
          $p = [int]$Matches[1]
          if ($p -gt 0) { taskkill /PID $p /T /F 2>$null | Out-Null }
        }
      }
    `;
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { windowsHide: true, stdio: 'ignore' },
    );
  } catch (_) {}
}

function killStrayDshNodes() {
  if (process.platform !== 'win32') return;
  try {
    const ps = `
      Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
        Where-Object { $_.CommandLine -match 'dsh\\\\lib\\\\bin\\.js web|@deepseek-ai\\\\dsh\\\\lib\\\\bin\\.js web|deepseek-harness.*web --host' } |
        ForEach-Object { taskkill /PID $_.ProcessId /T /F 2>$null | Out-Null }
    `;
    execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { windowsHide: true, stdio: 'ignore' },
    );
  } catch (_) {}
}

async function waitUntilPortFree(port, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortFree(port)) return true;
    killPortListeners(port);
    await new Promise((r) => setTimeout(r, 350));
  }
  return isPortFree(port);
}

function cleanupStaleServer() {
  try {
    if (fs.existsSync(PID_FILE)) {
      const old = Number(String(fs.readFileSync(PID_FILE, 'utf8')).trim());
      if (old) {
        log(`cleanup stale pid file pid=${old}`);
        killPidTree(old);
      }
      fs.unlinkSync(PID_FILE);
    }
  } catch (_) {}
  killStrayDshNodes();
  killPortListeners(DEFAULT_PORT);
}

async function pickPort() {
  // Prefer default; reclaim if stale from a previous crash.
  if (!(await isPortFree(DEFAULT_PORT))) {
    log(`port ${DEFAULT_PORT} busy — reclaiming`);
    killPortListeners(DEFAULT_PORT);
    killStrayDshNodes();
    await waitUntilPortFree(DEFAULT_PORT, 8000);
  }
  for (let p = DEFAULT_PORT; p < DEFAULT_PORT + 20; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`No free port in ${DEFAULT_PORT}-${DEFAULT_PORT + 19}`);
}

function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve(true);
          return;
        }
        retry();
      });
      req.on('error', retry);
      req.setTimeout(1500, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }
      setTimeout(tick, READY_POLL_MS);
    };
    tick();
  });
}

function readDeepSeekApiKey() {
  try {
    const credPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.dsh', '.credentials.yaml');
    if (!fs.existsSync(credPath)) return process.env.DEEPSEEK_API_KEY || '';
    const raw = fs.readFileSync(credPath, 'utf8');
    const m = raw.match(/^\s*DEEPSEEK_API_KEY:\s*(\S+)/m);
    return (m && m[1]) || process.env.DEEPSEEK_API_KEY || '';
  } catch (_) {
    return process.env.DEEPSEEK_API_KEY || '';
  }
}

/**
 * Sanitize DEEPSEEK_BASE_URL from shell/user env.
 * Common footgun: copying UI text like `[https://api.deepseek.com/v1]` into the env var.
 * Adapter appends `/chat/completions`, so strip a trailing `/v1`.
 */
function normalizeDeepSeekBaseUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return 'https://api.deepseek.com';
  s = s.replace(/^['"]+|['"]+$/g, '');
  s = s.replace(/^\[+|\]+$/g, '');
  s = s.trim();
  s = s.replace(/\/+$/, '');
  s = s.replace(/\/v1$/i, '');
  if (!/^https?:\/\//i.test(s)) {
    log(`WARNING: invalid DEEPSEEK_BASE_URL=${JSON.stringify(raw)}; falling back to public API`);
    return 'https://api.deepseek.com';
  }
  return s;
}

function resolveNodeExecutable() {
  if (process.platform === 'win32') {
    const candidates = [
      process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'nodejs', 'node.exe') : '',
      'C:\\Program Files\\nodejs\\node.exe',
      'C:\\Program Files (x86)\\nodejs\\node.exe',
    ].filter(Boolean);
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  return 'node';
}

function startDsh(port) {
  return new Promise((resolve, reject) => {
    const dshBin = path.join(DSH_ROOT, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
    const nodeExe = resolveNodeExecutable();
    const canDirect = fs.existsSync(dshBin) && fs.existsSync(nodeExe);
    if (!canDirect && !fs.existsSync(DSH_CMD)) {
      reject(
        new Error(
          `dsh runtime missing.\nexpected: ${dshBin}\nDSH_ROOT=${DSH_ROOT}\npackaged=${app.isPackaged}`,
        ),
      );
      return;
    }
    const args = canDirect
      ? [dshBin, 'web', '--host', HOST, '--port', String(port)]
      : ['web', '--host', HOST, '--port', String(port)];
    const exe = canDirect ? nodeExe : DSH_CMD;
    log(`spawn: ${exe} ${args.join(' ')}`);
    log(`DSH_ROOT=${DSH_ROOT} packaged=${app.isPackaged}`);

    const apiKey = readDeepSeekApiKey();
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    if (apiKey) {
      env.DEEPSEEK_API_KEY = apiKey;
      log(`injected DEEPSEEK_API_KEY from credentials (len=${apiKey.length})`);
    } else {
      log('WARNING: DEEPSEEK_API_KEY missing');
    }
    // Prefer IPv4 for DeepSeek TLS; some Windows stacks flap on IPv6 → TRANSPORT errors.
    env.NODE_OPTIONS = [env.NODE_OPTIONS, '--dns-result-order=ipv4first'].filter(Boolean).join(' ').trim();
    env.DEEPSEEK_BASE_URL = normalizeDeepSeekBaseUrl(env.DEEPSEEK_BASE_URL);
    log(`DEEPSEEK_BASE_URL=${env.DEEPSEEK_BASE_URL}`);
    const resolved = resolveOutboundProxy();
    applyProxyEnv(env, resolved);
    log(
      `network mode=${networkPrefs.mode} resolved=${resolved.proxyUrl || 'direct'} reason=${resolved.reason}`,
    );

    dshProcess = spawn(exe, args, {
      cwd: DSH_ROOT,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: !canDirect,
    });

    try {
      fs.writeFileSync(PID_FILE, String(dshProcess.pid));
    } catch (_) {}

    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    dshProcess.stdout.on('data', (buf) => log(`dsh stdout: ${buf.toString().trim()}`));
    dshProcess.stderr.on('data', (buf) => log(`dsh stderr: ${buf.toString().trim()}`));
    dshProcess.on('error', (err) => fail(err));
    dshProcess.on('exit', (code, signal) => {
      log(`dsh exited code=${code} signal=${signal}`);
      try {
        if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
      } catch (_) {}
      if (!settled && !shuttingDown) {
        fail(new Error(`dsh exited early (code=${code})`));
      }
      if (settled && !shuttingDown && mainWindow && !mainWindow.isDestroyed()) {
        dialog.showErrorBox('DeepSeek Harness', '后台服务已退出，窗口将关闭。');
        app.quit();
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(dshProcess);
      }
    }, 300);
  });
}

function killDshTree() {
  const pid = dshProcess && dshProcess.pid;
  log(`killing dsh tree pid=${pid} port=${chosenPort}`);
  if (pid) killPidTree(pid);
  killPortListeners(chosenPort);
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch (_) {}
  dshProcess = null;
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 220,
    resizable: false,
    maximizable: false,
    minimizable: false,
    frame: true,
    autoHideMenuBar: true,
    title: 'DeepSeek Harness',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    backgroundColor: '#f5f5f7',
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
      background:#f5f5f7;color:#1d1d1f}
    .box{text-align:center}
    .t{font-size:18px;font-weight:600;margin-bottom:8px}
    .s{font-size:13px;color:#6e6e73}
  </style></head><body><div class="box">
    <div class="t">DeepSeek Harness</div>
    <div class="s">正在启动本地服务…</div>
  </div></body></html>`;
  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  splashWindow.on('closed', () => {
    splashWindow = null;
    if (!mainWindow && !shuttingDown) {
      forceQuit('splash-closed');
    }
  });
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  // Outside-app pet only while main UI is closed/hidden.
  hidePetWindow();
  applyInAppPetVisibility();
}

function hideMainToTray() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.hide();
  showPetWindow();
}

function createPetWindow() {
  if (petWindow && !petWindow.isDestroyed()) return petWindow;
  const width = petPrefs.width || DEFAULT_PET_SIZE.width;
  const height = petPrefs.height || DEFAULT_PET_SIZE.height;
  const fallback = defaultPetPosition(width, height);
  const pos = clampPetPosition(
    petPrefs.x != null ? petPrefs.x : fallback.x,
    petPrefs.y != null ? petPrefs.y : fallback.y,
    width,
    height,
  );
  petWindow = new BrowserWindow({
    width,
    height,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    title: 'DeepSeek Pet',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    webPreferences: {
      preload: PET_PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  // floating: above normal apps, but not screen-saver (which steals focus/clicks too aggressively)
  petWindow.setAlwaysOnTop(true, 'floating');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (typeof petWindow.setOpacity === 'function') {
    petWindow.setOpacity(petPrefs.opacity || 1);
  }
  petWindow.loadFile(PET_HTML, { query: { port: String(chosenPort) } });
  petWindow.webContents.on('did-finish-load', () => {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('pet-prefs', { ...petPrefs });
    }
  });
  petWindow.on('moved', () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    const [x, y] = petWindow.getPosition();
    savePetPrefs({ x, y });
  });
  petWindow.on('closed', () => {
    petWindow = null;
  });
  return petWindow;
}

function showPetWindow() {
  if (!petEnabled || shuttingDown) return;
  const win = createPetWindow();
  if (!win.isVisible()) win.showInactive();
  startAgentStatusWatch();
}

function hidePetWindow() {
  if (petWindow && !petWindow.isDestroyed() && petWindow.isVisible()) {
    petWindow.hide();
  }
}

function pushAgentStatus(status) {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.webContents.send('pet-agent-status', status);
}

function startAgentStatusWatch() {
  if (agentStatusTimer) return;
  agentStatusTimer = setInterval(() => {
    if (shuttingDown || !petWindow || petWindow.isDestroyed() || !petWindow.isVisible()) return;
    // Lightweight ambient probe: if main UI is hidden, treat as "companion idle"
    // unless we can infer activity from recent poke / future bridge.
    // Placeholder keeps the Codex ambient channel alive for renderer.
    if (lastAgentMode !== 'idle') return;
  }, 2000);
}

function stopAgentStatusWatch() {
  if (agentStatusTimer) {
    clearInterval(agentStatusTimer);
    agentStatusTimer = null;
  }
}

function createTray() {
  if (tray) return;
  let image = nativeImage.createEmpty();
  if (fs.existsSync(ICON_PATH)) {
    image = nativeImage.createFromPath(ICON_PATH);
    if (!image.isEmpty() && process.platform === 'win32') {
      image = image.resize({ width: 16, height: 16 });
    }
  }
  tray = new Tray(image);
  tray.setToolTip('DeepSeek Harness');
  const rebuild = () => {
    const inAppOn = petPrefs.inAppEnabled !== false;
    const inAppSize = normalizeInAppSize(petPrefs.inAppSize);
    const net = networkPrefs.mode || 'auto';
    const resolved = resolveOutboundProxy();
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: '打开主窗口', click: () => showMainWindow() },
        { type: 'separator' },
        {
          label: '应用内宠物',
          submenu: [
            {
              label: inAppOn ? '隐藏' : '显示',
              click: () => {
                savePetPrefs({ inAppEnabled: !inAppOn });
                applyInAppPetVisibility();
                rebuild();
              },
            },
            { type: 'separator' },
            ...IN_APP_PET_SIZES.map((opt) => ({
              label: opt.label,
              type: 'radio',
              checked: inAppSize === opt.px,
              click: () => {
                savePetPrefs({ inAppSize: opt.px, inAppEnabled: true });
                applyInAppPetVisibility();
                rebuild();
              },
            })),
          ],
        },
        {
          label: '应用外桌宠',
          submenu: [
            {
              label: petEnabled ? '隐藏' : '显示',
              toolTip: '关闭主界面后显示在系统桌面上的宠物',
              click: () => {
                petEnabled = !petEnabled;
                savePetPrefs({ enabled: petEnabled });
                if (petEnabled) {
                  if (!mainWindow || !mainWindow.isVisible()) showPetWindow();
                } else {
                  hidePetWindow();
                }
                rebuild();
              },
            },
            { type: 'separator' },
            {
              label: '更小',
              click: () => {
                applyPetSize({ width: 160, height: 180 });
                rebuild();
              },
            },
            {
              label: '小',
              click: () => {
                applyPetSize({ width: 200, height: 220 });
                rebuild();
              },
            },
            {
              label: '中',
              click: () => {
                applyPetSize({ width: 280, height: 300 });
                rebuild();
              },
            },
            {
              label: '大',
              click: () => {
                applyPetSize({ width: 360, height: 380 });
                rebuild();
              },
            },
          ],
        },
        {
          label: `网络（当前：${net}${resolved.proxyUrl ? ' → ' + resolved.proxyUrl : ' → 直连'}）`,
          submenu: [
            {
              label: '自动（仅跟随 Windows 系统代理）',
              type: 'radio',
              checked: net === 'auto',
              click: () => {
                saveNetworkPrefs({ mode: 'auto' });
                dialog.showMessageBox({
                  type: 'info',
                  title: '网络模式',
                  message:
                    '已设为自动：仅当 Windows「系统代理」开启时才走代理，否则直连。\n请退出后重新打开 DeepSeek Harness。',
                });
                rebuild();
              },
            },
            {
              label: '强制直连（推荐）',
              type: 'radio',
              checked: net === 'direct',
              click: () => {
                saveNetworkPrefs({ mode: 'direct' });
                dialog.showMessageBox({
                  type: 'info',
                  title: '网络模式',
                  message: '已强制直连。请退出后重新打开 DeepSeek Harness 使设置生效。',
                });
                rebuild();
              },
            },
            {
              label: `强制代理（${networkPrefs.proxyUrl || 'http://127.0.0.1:7897'}）`,
              type: 'radio',
              checked: net === 'proxy',
              click: () => {
                saveNetworkPrefs({
                  mode: 'proxy',
                  proxyUrl: networkPrefs.proxyUrl || 'http://127.0.0.1:7897',
                });
                dialog.showMessageBox({
                  type: 'info',
                  title: '网络模式',
                  message:
                    `已强制走代理：${networkPrefs.proxyUrl || 'http://127.0.0.1:7897'}\n请退出后重新打开使设置生效。\n端口不同时，用下方「设置代理地址…」。`,
                });
                rebuild();
              },
            },
            { type: 'separator' },
            {
              label: '设置代理地址…',
              click: () => openProxyPrefsWindow(),
            },
          ],
        },
        {
          label: '在浏览器打开',
          click: () => shell.openExternal(`http://${HOST}:${chosenPort}/`),
        },
        { type: 'separator' },
        { label: '退出', click: () => forceQuit('tray-quit') },
      ]),
    );
  };
  createTray._rebuild = rebuild;
  rebuild();
  tray.on('double-click', () => showMainWindow());
}

/** Raise in-app pet above Explorer; apply size; never force both videos opaque. */
function applyInAppPetVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const show = petPrefs.inAppEnabled !== false;
  const size = normalizeInAppSize(petPrefs.inAppSize);
  const css = show
    ? `
      .dsh-pet-root, #dsh-pet-root {
        z-index: 200 !important; /* Explorer panel=50, toggle=55 */
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        --dsh-pet-size: ${size}px !important;
      }
      .dsh-pet-root .dsh-pet-stage, #dsh-pet-root .dsh-pet-stage {
        width: ${size}px !important;
        height: ${size}px !important;
      }
      .dsh-pet-root .dsh-pet-video, #dsh-pet-root .dsh-pet-video,
      .dsh-pet-root video, #dsh-pet-root video {
        pointer-events: auto !important;
      }
      /* Only hide the back buffer once a front frame is marked — otherwise both stay invisible. */
      .dsh-pet-root:has(.is-front) .dsh-pet-video:not(.is-front),
      #dsh-pet-root:has(.is-front) .dsh-pet-video:not(.is-front),
      .dsh-pet-root:has(video.is-front) video:not(.is-front),
      #dsh-pet-root:has(video.is-front) video:not(.is-front) {
        opacity: 0 !important;
      }
      .dsh-pet-root .dsh-pet-video.is-front,
      #dsh-pet-root .dsh-pet-video.is-front,
      .dsh-pet-root video.is-front,
      #dsh-pet-root video.is-front {
        opacity: 1 !important;
      }
    `
    : `
      .dsh-pet-root, #dsh-pet-root {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
    `;
  try {
    mainWindow.webContents.insertCSS(css);
  } catch (err) {
    log(`applyInAppPetVisibility css failed: ${err.message}`);
  }
  // Also patch inline style so React's default --dsh-pet-size:260px loses.
  if (show) {
    mainWindow.webContents
      .executeJavaScript(
        `(() => {
          document.querySelectorAll('.dsh-pet-root, #dsh-pet-root').forEach((el) => {
            el.style.setProperty('--dsh-pet-size', '${size}px');
            const stage = el.querySelector('.dsh-pet-stage');
            if (stage) {
              stage.style.width = '${size}px';
              stage.style.height = '${size}px';
            }
          });
          return ${size};
        })();`,
        true,
      )
      .then((r) => log(`inAppPet=show size=${r}`))
      .catch((err) => log(`inAppPet size js failed: ${err.message}`));
  } else {
    log('inAppPet=hide');
  }
}

/** Quieter chrome + Codex-like refill-edit (safe, debounced — no freeze). */
function applyChatUxPolish() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  // Shell CSS backup; plugin owns the interactive edit button.
  const css = `
    .Md3f7G_flowItem:has([data-context-source="user-approval"]),
    .Md3f7G_flowItem:has([data-command-name="permission"]),
    [data-context-source="user-approval"],
    [data-command-name="permission"] { display: none !important; }
    .dshUxReedit{
      appearance:none;border:0;background:transparent;color:inherit;
      opacity:.7;cursor:pointer;padding:2px 8px;font-size:12px;line-height:1.2;
      border-radius:6px;
    }
    .dshUxReedit:hover{opacity:1;background:rgba(127,127,127,.12)}
  `;
  try {
    mainWindow.webContents.insertCSS(css);
    log('chatUx=css');
  } catch (err) {
    log(`chatUx css failed: ${err.message}`);
  }
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'DeepSeek Harness',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f7',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
    createTray();
    // Do not create overlay pet while main is open (avoids always-on-top click stealing).
    hidePetWindow();
    applyInAppPetVisibility();
    applyChatUxPolish();
  });

  // Close to tray; show outside-app desktop pet.
  mainWindow.on('close', (e) => {
    if (shuttingDown) return;
    e.preventDefault();
    hideMainToTray();
  });

  mainWindow.on('show', () => {
    hidePetWindow();
    applyInAppPetVisibility();
    applyChatUxPolish();
  });
  mainWindow.on('hide', () => showPetWindow());

  mainWindow.webContents.on('did-finish-load', () => {
    applyInAppPetVisibility();
    applyChatUxPolish();
  });
  mainWindow.webContents.on('dom-ready', () => {
    applyInAppPetVisibility();
    applyChatUxPolish();
  });
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, urlFailed) => {
    log(`did-fail-load code=${code} desc=${desc} url=${urlFailed}`);
    if (shuttingDown) return;
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(`http://${HOST}:${chosenPort}/`);
      }
    }, 1200);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow.loadURL(url);
}

async function boot() {
  cleanupStaleServer();
  await waitUntilPortFree(DEFAULT_PORT, 6000);
  createSplash();
  try {
    chosenPort = await pickPort();
    log(`using port ${chosenPort}`);
    try {
      await startDsh(chosenPort);
    } catch (spawnErr) {
      log(`first spawn failed: ${spawnErr.message}; reclaim and retry`);
      killDshTree();
      killStrayDshNodes();
      await waitUntilPortFree(chosenPort, 8000);
      await startDsh(chosenPort);
    }
    const url = `http://${HOST}:${chosenPort}/`;
    await waitForHttp(url, READY_TIMEOUT_MS);
    // Extra readiness: balance endpoint proves host plugins finished booting.
    try {
      await waitForHttp(`http://${HOST}:${chosenPort}/api/balance`, 15000);
      log('balance endpoint ready');
    } catch (_) {
      log('balance endpoint not ready yet — continuing');
    }
    log(`ready at ${url}`);
    await createWindow(url);
    const quitAfter = (() => {
      const fromEnv = Number(process.env.DSH_DESKTOP_QUIT_AFTER_MS || 0);
      if (fromEnv > 0) return fromEnv;
      const arg = process.argv.find((a) => a.startsWith('--quit-after-ms='));
      return arg ? Number(arg.split('=')[1] || 0) || 0 : 0;
    })();
    if (quitAfter > 0) {
      log(`test auto-quit in ${quitAfter}ms`);
      setTimeout(() => {
        forceQuit('test-auto-quit');
      }, quitAfter);
    }
  } catch (err) {
    log(`boot failed: ${err.stack || err.message}`);
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    dialog.showErrorBox(
      'DeepSeek Harness 启动失败',
      `${err.message}\n\n若反复卡住：先完全退出托盘图标，再重新打开。\n详情见：${LOG_FILE}`,
    );
    killDshTree();
    app.quit();
  }
}

function forceQuit(reason) {
  if (shuttingDown && reason !== 'test-auto-quit') return;
  shuttingDown = true;
  log(`forceQuit: ${reason}`);
  stopAgentStatusWatch();
  killDshTree();
  try {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  } catch (_) {}
  try {
    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.removeAllListeners('close');
      petWindow.destroy();
      petWindow = null;
    }
  } catch (_) {}
  try {
    for (const win of BrowserWindow.getAllWindows()) {
      try {
        win.removeAllListeners('close');
        win.destroy();
      } catch (_) {}
    }
  } catch (_) {}
  // Ensure the whole Electron tree exits on Windows (helpers can linger after app.exit).
  const selfPid = process.pid;
  if (process.platform === 'win32') {
    setTimeout(() => {
      try {
        execFileSync('taskkill', ['/PID', String(selfPid), '/T', '/F'], {
          windowsHide: true,
          stdio: 'ignore',
        });
      } catch (_) {}
    }, 300);
  }
  app.exit(0);
}

if (gotLock) {
  app.whenReady().then(boot);
}

ipcMain.handle('proxy-prefs-load', () => ({
  mode: networkPrefs.mode,
  proxyUrl: networkPrefs.proxyUrl || 'http://127.0.0.1:7897',
}));

ipcMain.handle('proxy-prefs-save', (_e, rawUrl) => {
  const normalized = normalizeProxyUrl(rawUrl);
  if (!normalized.ok) return normalized;
  saveNetworkPrefs({ proxyUrl: normalized.url });
  log(`proxy url set to ${normalized.url}`);
  if (typeof createTray._rebuild === 'function') createTray._rebuild();
  if (proxyPrefsWindow && !proxyPrefsWindow.isDestroyed()) proxyPrefsWindow.close();
  dialog.showMessageBox({
    type: 'info',
    title: '代理地址已保存',
    message:
      `当前代理：${normalized.url}\n` +
      (networkPrefs.mode === 'proxy'
        ? '已在「强制代理」模式。请退出后重新打开使设置生效。'
        : '已保存地址。请在托盘「网络」里选择「强制代理」，再退出并重新打开。'),
  });
  return { ok: true, url: normalized.url };
});

ipcMain.on('proxy-prefs-cancel', () => {
  if (proxyPrefsWindow && !proxyPrefsWindow.isDestroyed()) proxyPrefsWindow.close();
});

ipcMain.on('pet-open-main', () => {
  showMainWindow();
});

ipcMain.on('pet-poke', () => {
  // Ambient cue only — does not open main window.
  log('pet poke');
});

ipcMain.handle('pet-get-bounds', () => {
  if (!petWindow || petWindow.isDestroyed()) {
    return { x: 0, y: 0, width: DEFAULT_PET_SIZE.width, height: DEFAULT_PET_SIZE.height };
  }
  const [x, y] = petWindow.getPosition();
  const [width, height] = petWindow.getSize();
  return { x, y, width, height };
});

ipcMain.on('pet-set-position', (_e, payload) => {
  if (!petWindow || petWindow.isDestroyed() || !payload) return;
  const [width, height] = petWindow.getSize();
  const pos = clampPetPosition(Number(payload.x) || 0, Number(payload.y) || 0, width, height);
  petWindow.setPosition(pos.x, pos.y);
});

ipcMain.on('pet-save-position', (_e, payload) => {
  if (!payload) return;
  const width = petPrefs.width || DEFAULT_PET_SIZE.width;
  const height = petPrefs.height || DEFAULT_PET_SIZE.height;
  const pos = clampPetPosition(Number(payload.x) || 0, Number(payload.y) || 0, width, height);
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.setPosition(pos.x, pos.y);
  }
  savePetPrefs({ x: pos.x, y: pos.y });
});

ipcMain.handle('pet-load-prefs', () => ({ ...petPrefs }));

ipcMain.on('pet-set-opacity', (_e, opacity) => applyPetOpacity(opacity));
ipcMain.on('pet-set-size', (_e, size) => applyPetSize(size));

ipcMain.on('pet-context-menu', () => {
  const menu = Menu.buildFromTemplate([
    { label: '打开主窗口（也可双击宠物）', click: () => showMainWindow() },
    { type: 'separator' },
    {
      label: '不透明度',
      submenu: [
        { label: '100%', click: () => applyPetOpacity(1) },
        { label: '85%', click: () => applyPetOpacity(0.85) },
        { label: '70%', click: () => applyPetOpacity(0.7) },
        { label: '50%', click: () => applyPetOpacity(0.5) },
      ],
    },
    {
      label: '大小',
      submenu: [
        { label: '小', click: () => applyPetSize({ width: 200, height: 220 }) },
        { label: '中', click: () => applyPetSize({ width: 280, height: 300 }) },
        { label: '大', click: () => applyPetSize({ width: 360, height: 390 }) },
      ],
    },
    {
      label: '重置位置',
      click: () => {
        const width = petPrefs.width || DEFAULT_PET_SIZE.width;
        const height = petPrefs.height || DEFAULT_PET_SIZE.height;
        const pos = defaultPetPosition(width, height);
        if (petWindow && !petWindow.isDestroyed()) {
          petWindow.setPosition(pos.x, pos.y);
        }
        savePetPrefs({ x: pos.x, y: pos.y });
      },
    },
    { type: 'separator' },
    {
      label: '隐藏应用外桌宠',
      click: () => {
        petEnabled = false;
        savePetPrefs({ enabled: false });
        hidePetWindow();
      },
    },
    { type: 'separator' },
    { label: '退出 DeepSeek Harness', click: () => forceQuit('pet-menu-quit') },
  ]);
  if (petWindow && !petWindow.isDestroyed()) {
    menu.popup({ window: petWindow });
  } else {
    menu.popup();
  }
});

app.on('before-quit', (e) => {
  if (!shuttingDown) {
    e.preventDefault();
    forceQuit('before-quit');
  }
});

app.on('window-all-closed', () => {
  // Keep running if we only hid the main window and still have tray/pet intent.
  // Real exit goes through forceQuit / tray.
  if (!shuttingDown && tray) return;
  forceQuit('window-all-closed');
});

process.on('exit', () => {
  killDshTree();
});
