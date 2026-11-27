/**
 * Hardened HexStrike Desktop Shell (Electron) — v3.2.0
 * Enforces webSecurity: true, contextIsolation: true, nodeIntegration: false,
 * zero arbitrary shell execution (no bash -c / exec nohup), and strict allowlisted IPC.
 */
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

app.commandLine.appendSwitch('disable-dev-shm-usage');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[HexStrike] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;
let activeProcess = null;

// Strictly allowlisted non-shell invocations routed through hexstrike-arsenal CLI
const ALLOWED_SUBCOMMANDS = new Set(['list', 'tools', 'status', 'headers', 'entropy', 'audit', 'scan']);
const ALLOWED_EXTERNAL_TOOLS = Object.freeze({
  burp: ['burpsuite', []],
  caido: ['caido', []],
  wireshark: ['wireshark', []],
  ghidra: ['ghidra', []],
  msfconsole: ['/usr/local/bin/zoth-konsole', ['--title', 'Metasploit', '--', 'msfconsole']],
  nmap: ['/usr/local/bin/zoth-konsole', ['--title', 'Nmap Help', '--', 'nmap', '-h']],
  john: ['/usr/local/bin/zoth-konsole', ['--title', 'John Help', '--', 'john', '--help']],
  aircrack: ['/usr/local/bin/zoth-konsole', ['--title', 'Aircrack-ng Help', '--', 'aircrack-ng', '--help']],
});

function createWindow() {
  const iconPath = fs.existsSync('/opt/zoth-studio/public/assets/mascot/hexstrike_logo.png')
    ? '/opt/zoth-studio/public/assets/mascot/hexstrike_logo.png'
    : '/usr/share/icons/hicolor/512x512/apps/hexstrike.png';

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(1240, Math.floor(workArea.width * 0.92));
  const targetHeight = Math.min(780, Math.floor(workArea.height * 0.88));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 640,
    minHeight: 480,
    center: true,
    backgroundColor: '#070a0f',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    resizable: true,
    title: 'HexStrike Security Arsenal // Local Enclave Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
    if (activeProcess) {
      try {
        activeProcess.kill('SIGTERM');
      } catch (e) {}
    }
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Strict allowlisted CLI runner (never invokes bash -c or shell=true)
ipcMain.on('run-cmd', (event, payload) => {
  if (activeProcess) {
    try {
      activeProcess.kill('SIGTERM');
    } catch (e) {}
    activeProcess = null;
  }

  const tokens =
    typeof payload === 'string'
      ? payload.trim().split(/\s+/).filter(Boolean)
      : Array.isArray(payload)
      ? payload.map(String)
      : [];

  const subcmd = tokens[0] === 'hexstrike' || tokens[0] === 'hexstrike-arsenal' ? tokens[1] : tokens[0];
  if (!subcmd || !ALLOWED_SUBCOMMANDS.has(subcmd)) {
    event.reply('cmd-output', {
      type: 'error',
      text: `Rejected by HexStrike IPC allowlist. Allowed subcommands: ${Array.from(ALLOWED_SUBCOMMANDS).join(', ')}`,
    });
    return;
  }

  const safeArgs = [subcmd, '--json'];
  event.reply('cmd-output', { type: 'start', cmd: `hexstrike-arsenal ${safeArgs.join(' ')}` });

  const proc = spawn('/usr/local/bin/hexstrike-arsenal', safeArgs, {
    shell: false,
    env: { ...process.env, TERM: 'xterm-256color' },
  });
  activeProcess = proc;

  proc.stdout.on('data', (data) => {
    event.reply('cmd-output', { type: 'stdout', text: data.toString() });
  });

  proc.stderr.on('data', (data) => {
    event.reply('cmd-output', { type: 'stderr', text: data.toString() });
  });

  proc.on('close', (code) => {
    activeProcess = null;
    event.reply('cmd-output', { type: 'exit', code });
  });

  proc.on('error', (err) => {
    activeProcess = null;
    event.reply('cmd-output', { type: 'error', text: err.message });
  });
});

ipcMain.on('stop-cmd', () => {
  if (activeProcess) {
    try {
      activeProcess.kill('SIGTERM');
    } catch (e) {}
    activeProcess = null;
  }
});

// Local loopback Ollama IPC (127.0.0.1:11434 only)
ipcMain.on('query-ai', (event, { prompt, context }) => {
  const reqBody = JSON.stringify({
    model: 'llama3.2:latest',
    prompt: `You are HexStrike Security Arsenal local copilot on ZothOS.\nContext:\n${String(context || '').slice(0, 4000)}\n\nTask: ${String(prompt || '').slice(0, 1000)}\n\nProvide concise defensive remediation steps in markdown.`,
    stream: false,
  });

  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(reqBody),
      },
      timeout: 10000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        if (data.length < 131072) data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          event.reply('ai-response', { success: true, response: parsed.response });
        } catch (e) {
          event.reply('ai-response', { success: false, error: 'Failed to parse local AI response' });
        }
      });
    }
  );

  req.on('error', () => {
    event.reply('ai-response', {
      success: false,
      error: 'Local Ollama daemon on 127.0.0.1:11434 is unreachable.',
    });
  });

  req.write(reqBody);
  req.end();
});

// Strictly allowlisted external launcher (no shell interpolation, no arbitrary fallback)
ipcMain.on('launch-external', (event, tool) => {
  const entry = ALLOWED_EXTERNAL_TOOLS[String(tool || '').toLowerCase()];
  if (!entry) {
    event.reply('cmd-output', { type: 'error', text: `Unknown external launcher: ${String(tool)}` });
    return;
  }
  const [bin, args] = entry;
  try {
    const child = spawn(bin, args, { detached: true, stdio: 'ignore', shell: false });
    child.unref();
  } catch (err) {
    event.reply('cmd-output', { type: 'error', text: err.message });
  }
});
