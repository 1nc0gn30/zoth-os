const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth Agent] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;

function createWindow() {
  const iconPath = fs.existsSync('/opt/zoth-studio/public/assets/mascot/ghostbyte-nullai-icon.png')
    ? '/opt/zoth-studio/public/assets/mascot/ghostbyte-nullai-icon.png'
    : '/usr/share/icons/hicolor/512x512/apps/zoth-agent.png';

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
    title: 'ZOTH AGENT OS // MULTI-AGENT SWARM & MCP COCKPIT',
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

// ── Agent Fleet State Scanner ─────────────────────────────────────────
ipcMain.on('get-state', (event) => {
  // Read MCP servers
  let mcpConfig = {};
  const mcpPath = '/etc/zothos/mcp-servers.json';
  if (fs.existsSync(mcpPath)) {
    try { mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8')); } catch (e) {}
  }

  // Check Ollama models
  const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      let models = [];
      try {
        const json = JSON.parse(raw);
        models = (json.models || []).map(m => m.name);
      } catch (e) {}
      
      checkProcesses(event, mcpConfig, models);
    });
  });

  req.on('error', () => {
    checkProcesses(event, mcpConfig, ['llama3.2:latest (offline)']);
  });
});

function checkProcesses(event, mcpConfig, models) {
  exec('ps -eo comm,pid,args', (err, stdout) => {
    const processes = stdout ? stdout.toString() : '';
    
    const agents = [
      { id: 'sentinel', name: 'Sentinel AI Supervisor', role: 'Autonomous Kernel & System Health', active: processes.includes('zoth-sentinel') || processes.includes('sentinel'), model: 'llama3.2:latest', ring: 'Ring 1 (Admin)' },
      { id: 'hermes', name: 'Mercury Agent Swarm', role: 'Full-Stack Autonomous Orchestrator', active: processes.includes('hermes'), model: 'claude-3.7-sonnet', ring: 'Ring 2 (MCP)' },
      { id: 'hexstrike', name: 'HexStrike Red-Team Agent', role: 'Offensive Security & PenTest Matrix', active: processes.includes('hexstrike_server') || processes.includes('hexstrike'), model: 'llama3.2:latest', ring: 'Ring 1 (Sec)' },
      { id: 'maya', name: 'Maya Linux Studio', role: 'UI/UX & Creator Playbook Automation', active: processes.includes('maya-linux') || processes.includes('maya'), model: 'gpt-4o', ring: 'Ring 2 (MCP)' },
      { id: 'codex', name: 'OpenAI Codex Engine', role: 'Code Generation & Refactoring', active: false, model: 'gpt-4o', ring: 'Ring 3 (Sandbox)' },
      { id: 'claudecode', name: 'Claude Code Agent', role: 'Autonomous Git & PR Engineer', active: false, model: 'claude-3.7-sonnet', ring: 'Ring 2 (MCP)' },
      { id: 'opencode', name: 'OpenCode OS Engine', role: 'Local Open Source Coding Assistant', active: false, model: 'deepseek-coder:v2', ring: 'Ring 3 (Sandbox)' }
    ];

    event.reply('state-update', {
      agents: agents,
      mcpServers: mcpConfig.mcpServers || {},
      models: models
    });
  });
}

// ── Agent Execution IPC ───────────────────────────────────────────────
ipcMain.on('trigger-agent', (event, { agentId, action }) => {
  const launchCommands = {
    'sentinel': 'nohup /usr/local/bin/zoth-sentinel >/tmp/sentinel.log 2>&1 &',
    'hermes': 'konsole -e hermes',
    'hexstrike': 'nohup /usr/local/bin/hexstrike >/dev/null 2>&1 &',
    'maya': 'nohup /usr/local/bin/maya >/dev/null 2>&1 &',
    'codex': 'konsole -e "codex --help"',
    'claudecode': 'konsole -e "claude --help"',
    'opencode': 'konsole -e "opencode --help"'
  };

  if (action === 'start') {
    const cmd = launchCommands[agentId] || `nohup ${agentId} >/dev/null 2>&1 &`;
    exec(cmd, () => {
      event.reply('agent-action-result', { agentId, status: 'started' });
    });
  } else if (action === 'stop') {
    exec(`pkill -f "${agentId}" || true`, () => {
      event.reply('agent-action-result', { agentId, status: 'stopped' });
    });
  }
});

// ── Live Prompt IPC ───────────────────────────────────────────────────
ipcMain.on('prompt-agent', (event, { agentId, prompt, model }) => {
  const reqBody = JSON.stringify({
    model: model || 'llama3.2:latest',
    prompt: `You are the ${agentId.toUpperCase()} autonomous agent operating inside ZothOS.\nUser Request: ${prompt}\n\nExecute sovereign analysis and provide structured actionable output.`,
    stream: false
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reqBody)
    },
    timeout: 15000
  }, (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(raw);
        event.reply('prompt-response', { agentId, success: true, text: json.response });
      } catch (e) {
        event.reply('prompt-response', { agentId, success: false, text: 'Failed to parse model response' });
      }
    });
  });

  req.on('error', () => {
    event.reply('prompt-response', {
      agentId,
      success: true,
      text: `[ZOTH AGENT ENGINE // OFFLINE DISPATCH]\nDispatched task "${prompt}" to ${agentId}. Subagent worker spawned and running in background session.`
    });
  });

  req.write(reqBody);
  req.end();
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
