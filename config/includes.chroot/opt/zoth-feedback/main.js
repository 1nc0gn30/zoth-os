const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth Feedback] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(900, Math.floor(workArea.width * 0.85));
  const targetHeight = Math.min(680, Math.floor(workArea.height * 0.85));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 500,
    minHeight: 400,
    center: true,
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreenable: true,
    title: 'ZOTHOS // ANONYMOUS SOVEREIGN FEEDBACK',
    backgroundColor: '#05070a',
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.show();
  mainWindow.focus();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to save and relay anonymous feedback
ipcMain.handle('send-feedback', async (event, payload) => {
  const homeDir = os.homedir();
  const feedbackDir = path.join(homeDir, '.zoth', 'feedback');
  
  try {
    fs.mkdirSync(feedbackDir, { recursive: true });
    const filename = `feedback_${Date.now()}.json`;
    const filepath = path.join(feedbackDir, filename);
    
    const record = {
      timestamp: new Date().toISOString(),
      type: payload.type || 'General',
      subject: payload.subject || 'No Subject',
      message: payload.message || '',
      telemetry: payload.includeTelemetry ? {
        os: 'ZothOS 1.0 (Debian 13)',
        kernel: os.release(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        totalRamGb: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10
      } : null
    };

    fs.writeFileSync(filepath, JSON.stringify(record, null, 2));

    // Also attempt Tor-routed or HTTP relay if an endpoint is configured in ~/.zoth/feedback_webhook
    const webhookFile = path.join(homeDir, '.zoth', 'feedback_webhook');
    if (fs.existsSync(webhookFile)) {
      const url = fs.readFileSync(webhookFile, 'utf8').trim();
      if (url.startsWith('http')) {
        const curlCmd = `curl -s -X POST -H "Content-Type: application/json" -d '${JSON.stringify(record).replace(/'/g, "'\\''")}' "${url}" >/dev/null 2>&1 &`;
        exec(curlCmd);
      }
    }

    return { ok: true, file: filepath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
