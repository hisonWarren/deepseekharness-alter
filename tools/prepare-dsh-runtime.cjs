#!/usr/bin/env node
'use strict';

/**
 * Install a portable @deepseek-ai/dsh runtime into ./dsh-runtime
 * so Electron can spawn it (dev + packaged extraResources).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const runtime = path.join(root, 'dsh-runtime');
fs.mkdirSync(runtime, { recursive: true });

const pkgPath = path.join(runtime, 'package.json');
if (!fs.existsSync(pkgPath)) {
  fs.writeFileSync(
    pkgPath,
    JSON.stringify(
      {
        name: 'dsh-runtime',
        private: true,
        dependencies: {
          '@deepseek-ai/dsh': '^0.1.0-rc.6',
        },
      },
      null,
      2,
    ),
  );
}

console.log('[prepare:dsh] npm install in', runtime);
const r = spawnSync('npm', ['install', '--omit=dev', '--no-fund', '--no-audit'], {
  cwd: runtime,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (r.status !== 0) process.exit(r.status || 1);

// Convenience launcher for Windows
const dshCmd = path.join(runtime, 'dsh.cmd');
if (!fs.existsSync(dshCmd)) {
  fs.writeFileSync(
    dshCmd,
    `@echo off\r\nsetlocal\r\nset "DSH_HOME=%~dp0"\r\n"%DSH_HOME%node_modules\\.bin\\dsh.cmd" %*\r\n`,
  );
}

const bin = path.join(runtime, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
if (!fs.existsSync(bin)) {
  console.error('[prepare:dsh] missing', bin);
  process.exit(1);
}
console.log('[prepare:dsh] ok');
