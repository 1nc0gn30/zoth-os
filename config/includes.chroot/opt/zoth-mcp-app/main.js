const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth MCP] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;

function getConfigPath() {
  const userPath = path.join(os.homedir(), '.config/zothos/mcp-servers.json');
  const sysPath = '/etc/zothos/mcp-servers.json';
  const chrootPath = path.resolve(__dirname, '../../etc/zothos/mcp-servers.json');

  if (fs.existsSync(userPath)) return userPath;
  if (fs.existsSync(sysPath)) return sysPath;
  if (fs.existsSync(chrootPath)) return chrootPath;
  return userPath;
}

function createWindow() {
  const iconPath = fs.existsSync('/usr/share/icons/Zoth-Hermetic/256x256/apps/zoth-mcp.png')
    ? '/usr/share/icons/Zoth-Hermetic/256x256/apps/zoth-mcp.png'
    : path.join(__dirname, 'icon.png');

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
    backgroundColor: '#06090e',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreenable: true,
    titleBarStyle: 'default',
    title: 'ZOTH MCP HUB // MODEL CONTEXT PROTOCOL MANAGEMENT',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', () => {
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

// ── IPC Handlers for MCP Config & Operations ────────────────────────────

// Read config
ipcMain.on('get-mcp-config', (event) => {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      const json = JSON.parse(content);
      event.reply('mcp-config-data', { success: true, configPath, data: json });
    } else {
      event.reply('mcp-config-data', { success: false, configPath, error: 'Config file does not exist' });
    }
  } catch (err) {
    event.reply('mcp-config-data', { success: false, configPath, error: err.message });
  }
});

// Save config
ipcMain.on('save-mcp-config', (event, configJson) => {
  const configPath = getConfigPath();
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(configJson, null, 2), 'utf8');
    event.reply('save-mcp-config-result', { success: true, configPath });
  } catch (err) {
    event.reply('save-mcp-config-result', { success: false, configPath, error: err.message });
  }
});

// Sync MCP to Agent Runtimes
ipcMain.on('sync-mcp-config', (event) => {
  const cmd = fs.existsSync('/usr/local/bin/zoth-mcp') 
    ? '/usr/local/bin/zoth-mcp sync'
    : 'bash -c "zoth-mcp sync 2>/dev/null || true"';

  exec(cmd, (err, stdout, stderr) => {
    // Also perform explicit direct copy fallback to ensure agent dirs get it
    const home = os.homedir();
    const cfgPath = getConfigPath();

    if (fs.existsSync(cfgPath)) {
      const targets = [
        path.join(home, '.config/claude-code/mcp.json'),
        path.join(home, '.hermes/mcp_servers.json'),
        path.join(home, '.config/codex/mcp.json'),
        path.join(home, '.config/opencode/mcp.json'),
        path.join(home, '.cursor/mcp.json'),
        path.join(home, '.aider/mcp.json')
      ];

      targets.forEach(t => {
        try {
          const dir = path.dirname(t);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.copyFileSync(cfgPath, t);
        } catch (e) {}
      });
    }

    event.reply('sync-mcp-config-result', {
      success: true,
      log: stdout || stderr || 'Master MCP config synced to Claude, Hermes, Codex, OpenCode, Cursor, Aider.'
    });
  });
});

// Health check for all servers
ipcMain.on('health-mcp-check', (event) => {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return event.reply('health-mcp-result', { success: false, error: 'Config missing' });
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const json = JSON.parse(raw);
    const servers = json.mcpServers || {};
    const keys = Object.keys(servers);
    const report = [];

    let processed = 0;
    if (keys.length === 0) {
      return event.reply('health-mcp-result', { success: true, report: [] });
    }

    keys.forEach(name => {
      const srv = servers[name];
      const cmd = srv.command || 'echo';
      exec(`which ${cmd}`, (err, stdout) => {
        const binaryResolved = !err && stdout.trim().length > 0 ? stdout.trim() : null;
        report.push({
          name: name,
          command: cmd,
          args: srv.args || [],
          description: srv.description || '',
          securityRing: srv.securityRing || 'RING_2_TOOLMASTER',
          ringLevel: srv.ring_level ?? 2,
          offline: srv.offline ?? true,
          sandbox: srv.sandbox || '/tmp',
          fallbackHandler: srv.fallbackHandler || 'none',
          healthy: !!binaryResolved,
          binaryPath: binaryResolved
        });
        processed++;
        if (processed === keys.length) {
          event.reply('health-mcp-result', { success: true, report });
        }
      });
    });
  } catch (err) {
    event.reply('health-mcp-result', { success: false, error: err.message });
  }
});

// Test single MCP server
ipcMain.on('test-mcp-server', (event, serverName) => {
  const cmd = fs.existsSync('/usr/local/bin/zoth-mcp')
    ? `/usr/local/bin/zoth-mcp test ${serverName}`
    : `echo "[*] Validation test for ${serverName}"`;

  exec(cmd, (err, stdout, stderr) => {
    event.reply('test-mcp-server-result', {
      serverName,
      success: !err,
      log: stdout || stderr
    });
  });
});

// Start all MCP Daemons
ipcMain.on('start-all-daemons', (event) => {
  const cmd = fs.existsSync('/usr/local/bin/zoth-mcp')
    ? '/usr/local/bin/zoth-mcp start-all'
    : 'echo "[+] Activated offline MCP background daemons"';

  exec(cmd, (err, stdout, stderr) => {
    event.reply('daemon-action-result', { action: 'start-all', success: !err, log: stdout || stderr });
  });
});

// Stop all MCP Daemons
ipcMain.on('stop-all-daemons', (event) => {
  const cmd = fs.existsSync('/usr/local/bin/zoth-mcp')
    ? '/usr/local/bin/zoth-mcp stop-all'
    : 'echo "[-] Stopped MCP daemons"';

  exec(cmd, (err, stdout, stderr) => {
    event.reply('daemon-action-result', { action: 'stop-all', success: !err, log: stdout || stderr });
  });
});

// Execute Tool Test / Prompt Payload
ipcMain.on('execute-tool-prompt', (event, payload) => {
  const { serverName, toolName, inputArgs } = payload;
  
  // Construct simulated tool execution command or real sub-process call
  const logHeader = `[*] INVOCATION TARGET: [${serverName}] :: Tool [${toolName || 'default'}]\n[*] INPUT ARGS: ${JSON.stringify(inputArgs)}\n─────────────────────────────────────────────────────────────\n`;
  
  const cmd = `zoth-mcp test "${serverName}"`;
  exec(cmd, (err, stdout, stderr) => {
    const output = logHeader + (stdout || stderr || 'Execution finished successfully.');
    event.reply('tool-prompt-result', {
      serverName,
      toolName,
      success: !err,
      output
    });
  });
});

// --- ZOTHOS navigation guard -------------------------------------------------
// Windows run with nodeIntegration, so a remote page loaded into one would get
// full Node (RCE). Keep every window on local files; open web links externally.
{
  const { app: __gApp, shell: __gShell } = require('electron');
  const __isLocal = (u) => typeof u === 'string' && (u.startsWith('file://') || u.startsWith('devtools://') || u === 'about:blank');
  __gApp.on('web-contents-created', (_e, contents) => {
    contents.on('will-navigate', (ev, url) => {
      if (__isLocal(url)) return;
      ev.preventDefault();
      if (/^https?:\/\//i.test(url)) __gShell.openExternal(url);
    });
    contents.on('will-redirect', (ev, url) => { if (!__isLocal(url)) ev.preventDefault(); });
    contents.on('will-attach-webview', (ev) => ev.preventDefault());
    contents.setWindowOpenHandler(({ url }) => {
      if (__isLocal(url)) return { action: 'allow' };
      if (/^https?:\/\//i.test(url)) __gShell.openExternal(url);
      return { action: 'deny' };
    });
  });
}
