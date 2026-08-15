#!/usr/bin/env node
'use strict';

/** Optional Windows taskbar icon patch for unpackaged electron.exe */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

if (process.platform !== 'win32') process.exit(0);
const script = path.join(__dirname, 'apply-win-icon.ps1');
if (!fs.existsSync(script)) process.exit(0);
spawnSync(
  'powershell.exe',
  ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script],
  { stdio: 'ignore', windowsHide: true },
);
