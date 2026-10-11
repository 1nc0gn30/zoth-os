const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

app.on('child-process-gone', (event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth Music] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(840, Math.floor(workArea.width * 0.8));
  const targetHeight = Math.min(580, Math.floor(workArea.height * 0.8));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 500,
    minHeight: 400,
    center: true,
    backgroundColor: '#05070c',
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreenable: true,
    titleBarStyle: 'default',
    title: 'ZOTH MUSIC // HERMETIC AUDIO STUDIO',
    icon: '/usr/share/pixmaps/zoth-soundtrack.png',
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('get-tracks', (event) => {
  const audioDir = '/usr/share/zothos/audio';
  let tracks = [];
  if (fs.existsSync(audioDir)) {
    const files = fs.readdirSync(audioDir);
    tracks = files.filter(f => f.endsWith('.mp3') || f.endsWith('.ogg') || f.endsWith('.wav')).map(f => {
      let title = f.replace(/^[0-9]+_/, '').replace(/\.(mp3|ogg|wav)$/, '').replace(/_/g, ' ');
      return {
        filename: f,
        title: title,
        path: path.join(audioDir, f)
      };
    });
  }
  event.reply('tracks-list', tracks);
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
