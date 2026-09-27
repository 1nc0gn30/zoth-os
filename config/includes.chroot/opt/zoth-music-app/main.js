const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

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
