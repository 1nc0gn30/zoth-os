const { app, BrowserWindow, dialog, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');
const { spawn, spawnSync } = require('child_process');

let mainWindow = null;

// Track user-approved export paths/dirs from native dialogs & active child processes
const approvedExportPaths = new Set();
const approvedExportDirs = new Set();
const activeChildProcesses = new Set();
let currentExportProcess = null;
let currentExportTempFiles = [];
let currentExportTempDirs = [];

const ALLOWED_YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
]);

const ALLOWED_EXTERNAL_PREFIXES = [
  'https://github.com/1nc0gn30/',
  'https://nullai.tech',
  'https://zoth.nullai.tech',
  'https://buy.stripe.com/',
  'https://1nc0gn30.si',
];

const NEURAL_VOICE_PRESETS = [
  { id: 'espeak-local', name: 'Local Offline Voice (espeak-ng - Zero Cloud)', gender: 'Neutral', lang: 'en-US', offline: true },
  { id: 'en-US-ChristopherNeural', name: 'Christopher (US Male - Deep / Authority) [Cloud]', gender: 'Male', lang: 'en-US', offline: false },
  { id: 'en-US-JennyNeural', name: 'Jenny (US Female - Natural / Friendly) [Cloud]', gender: 'Female', lang: 'en-US', offline: false },
  { id: 'en-US-GuyNeural', name: 'Guy (US Male - Casual / Podcaster) [Cloud]', gender: 'Male', lang: 'en-US', offline: false },
  { id: 'en-US-AriaNeural', name: 'Aria (US Female - Confident / Expressive) [Cloud]', gender: 'Female', lang: 'en-US', offline: false },
  { id: 'en-US-AndrewNeural', name: 'Andrew (US Male - Warm / Modern) [Cloud]', gender: 'Male', lang: 'en-US', offline: false },
  { id: 'en-US-AvaNeural', name: 'Ava (US Female - Playful / Upbeat) [Cloud]', gender: 'Female', lang: 'en-US', offline: false },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK Male - British Accent) [Cloud]', gender: 'Male', lang: 'en-GB', offline: false },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK Female - British Accent) [Cloud]', gender: 'Female', lang: 'en-GB', offline: false },
  { id: 'en-US-BrianNeural', name: 'Brian (US Male - Sincere) [Cloud]', gender: 'Male', lang: 'en-US', offline: false },
  { id: 'en-US-AnaNeural', name: 'Ana (US Female - Youth) [Cloud]', gender: 'Female', lang: 'en-US', offline: false },
];

const ALLOWED_VOICE_IDS = new Set(NEURAL_VOICE_PRESETS.map((v) => v.id));
const NEURAL_VOICE_REGEX = /^[a-z]{2}-[A-Z]{2}-[A-Za-z0-9]+Neural$/;

const ALLOWED_MOTION_PRESETS = new Set([
  'zoth-sovereign-core',
  'zoth-core',
  'zoth-80-tool-arsenal',
  'arsenal-80',
  '1nc0gn30-cyber-fortress',
  '1nc0gn30-ops',
  'pantheon-hermes-swarm',
  'pantheon',
  'vaelor-l1-gold-forge',
  'vaelor-l1',
  'world-of-zoth-citadel',
  'world-of-zoth',
]);

function validateYouTubeUrl(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed || trimmed.length > 512 || /[\r\n\0]/.test(trimmed)) {
    throw new Error('Please enter a valid YouTube HTTPS URL.');
  }
  const normalized = /^https:\/\//i.test(trimmed)
    ? trimmed
    : (/^http:\/\//i.test(trimmed) ? trimmed.replace(/^http:\/\//i, 'https://') : `https://${trimmed}`);
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (_) {
    throw new Error('Invalid URL syntax. Provide a valid https://youtube.com or https://youtu.be URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS YouTube URLs are allowed.');
  }
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    throw new Error(`Host "${host}" is not allowed. Only youtube.com and youtu.be URLs are accepted.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials are not allowed.');
  }
  return parsed.toString();
}

function isAllowedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ''));
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_EXTERNAL_PREFIXES.some((prefix) => parsed.href.startsWith(prefix));
  } catch (_) {
    return false;
  }
}

function isPathWithinDir(candidatePath, baseDir) {
  if (!candidatePath || !baseDir) return false;
  const resolvedCandidate = path.resolve(candidatePath);
  const resolvedBase = path.resolve(baseDir);
  return resolvedCandidate === resolvedBase || resolvedCandidate.startsWith(resolvedBase + path.sep);
}

function getSafeUserMediaDirs() {
  const dirs = [];
  for (const key of ['videos', 'downloads', 'desktop']) {
    try {
      const p = app.getPath(key);
      if (p) dirs.push(path.resolve(p));
    } catch (_) {}
  }
  for (const d of approvedExportDirs) {
    dirs.push(path.resolve(d));
  }
  return dirs;
}

function isAllowedRevealPath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const resolved = path.resolve(targetPath);
  if (approvedExportPaths.has(resolved)) return true;
  return getSafeUserMediaDirs().some((dir) => isPathWithinDir(resolved, dir));
}

function validateOutDir(outDir) {
  const defaultVideos = path.join(app.getPath('videos') || path.join(os.homedir(), 'Videos'), 'maya-zoth-edits');
  if (!outDir) return path.resolve(defaultVideos);
  const resolved = path.resolve(String(outDir));
  const allowedDirs = [path.resolve(defaultVideos), ...getSafeUserMediaDirs()];
  if (!allowedDirs.some((dir) => isPathWithinDir(resolved, dir))) {
    throw new Error('Output directory must reside inside an approved export folder or user Videos/Downloads/Desktop directory.');
  }
  return resolved;
}

function validateVoiceId(voice) {
  const selected = String(voice || 'espeak-local').trim();
  if (selected === 'espeak-local') return selected;
  if (ALLOWED_VOICE_IDS.has(selected) && NEURAL_VOICE_REGEX.test(selected)) {
    return selected;
  }
  throw new Error(`Unsupported or invalid voice ID: ${selected}`);
}

function findExecutable(name) {
  const home = os.homedir();
  const commonPaths = [
    path.join(home, `.local/bin/${name}`),
    path.join(app.getPath('userData'), `bin/${name}`),
    path.join(home, `bin/${name}`),
    `/opt/zothos-ai-env/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/bin/${name}`,
    path.join(home, `.nvm/versions/node/${process.version}/bin/${name}`),
  ];
  for (const p of commonPaths) {
    if (!p) continue;
    try {
      if (fs.existsSync(p)) {
        return p;
      }
    } catch (_) {}
  }
  try {
    const res = spawnSync('which', [name], { timeout: 3000 });
    if (res.status === 0 && res.stdout.toString().trim()) {
      return res.stdout.toString().trim();
    }
  } catch (_) {}
  return name;
}

function getEnrichedPath() {
  const home = os.homedir();
  return [
    path.join(home, '.local/bin'),
    path.join(app.getPath('userData'), 'bin'),
    path.join(home, 'bin'),
    '/opt/zothos-ai-env/bin',
    '/usr/local/bin',
    '/usr/bin',
    process.env.PATH || '',
  ].filter(Boolean).join(':');
}

function runCommandAsync(bin, args, { timeoutMs = 30000, env = process.env } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { env, shell: false });
    activeChildProcesses.add(proc);
    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { proc.kill('SIGTERM'); } catch (_) {}
        setTimeout(() => {
          try { if (!proc.killed) proc.kill('SIGKILL'); } catch (_) {}
        }, 1500);
        reject(new Error(`Command timed out after ${Math.round(timeoutMs / 1000)}s`));
      }
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      activeChildProcesses.delete(proc);
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      activeChildProcesses.delete(proc);
      if (!settled) {
        settled = true;
        resolve({ code, stdout, stderr });
      }
    });
  });
}

function cleanupExportResources() {
  if (currentExportProcess) {
    try {
      if (currentExportProcess.stdin && !currentExportProcess.stdin.destroyed) {
        currentExportProcess.stdin.end();
      }
      currentExportProcess.kill('SIGTERM');
    } catch (_) {}
    currentExportProcess = null;
  }
  for (const f of currentExportTempFiles) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (_) {}
  }
  currentExportTempFiles = [];
  for (const d of currentExportTempDirs) {
    try { if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true }); } catch (_) {}
  }
  currentExportTempDirs = [];
}

function cleanupAllProcesses() {
  cleanupExportResources();
  for (const proc of activeChildProcesses) {
    try {
      if (!proc.killed) proc.kill('SIGTERM');
    } catch (_) {}
  }
  activeChildProcesses.clear();
}

// Linux display & optional container sandbox opt-in (sandbox remains ON by default)
if (process.platform === 'linux') {
  if (process.env.MAYA_NO_SANDBOX === '1') {
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-gpu-sandbox');
  }
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
  app.disableHardwareAcceleration();
}

function resolveLocalFile(win, paths) {
  let foundPath = null;
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (foundPath) {
    win.loadFile(foundPath).catch((err) => {
      console.warn('loadFile failed, attempting file:// URL fallback:', err);
      const fileUrl = url.pathToFileURL(foundPath).href;
      win.loadURL(fileUrl);
    });
  } else {
    console.error('Maya UI: index.html not found in any expected location.');
  }
}

function loadAppWindow(win) {
  const possiblePaths = [
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'index.html'),
    path.join(process.resourcesPath || __dirname, 'app.asar', 'dist', 'index.html'),
    path.join(process.resourcesPath || __dirname, 'app', 'dist', 'index.html'),
    path.join(app.getAppPath(), 'dist', 'index.html'),
    path.join(app.getAppPath(), 'index.html'),
  ];

  if (process.env.NODE_ENV === 'development' && process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    try {
      const parsed = new URL(devUrl);
      if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
        win.loadURL(devUrl).catch(() => resolveLocalFile(win, possiblePaths));
        return;
      }
    } catch (_) {}
  }

  resolveLocalFile(win, possiblePaths);
}

function createWindow() {
  const iconPath = path.join(__dirname, 'public/app/icon_512.png');
  const distIconPath = path.join(__dirname, 'dist/app/icon_512.png');
  const iconFile = fs.existsSync(iconPath) ? iconPath : (fs.existsSync(distIconPath) ? distIconPath : undefined);

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(1360, Math.floor(workArea.width * 0.92));
  const targetHeight = Math.min(840, Math.floor(workArea.height * 0.88));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 360,
    minHeight: 480,
    center: true,
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    fullscreenable: true,
    title: 'Maya Pro Studio — Video & Motion Editor',
    backgroundColor: '#0b0d14',
    icon: iconFile,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      sandbox: true,
    },
  });

  // Strict popup & navigation guards
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (isAllowedExternalUrl(targetUrl)) {
      shell.openExternal(targetUrl).catch(() => {});
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol === 'file:') {
        const localPath = url.fileURLToPath(parsed);
        if (isPathWithinDir(localPath, __dirname) || isPathWithinDir(localPath, app.getAppPath())) {
          return;
        }
      }
      if (
        process.env.NODE_ENV === 'development' &&
        (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
      ) {
        return;
      }
    } catch (_) {}
    event.preventDefault();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load Maya UI:', errorCode, errorDescription, validatedURL);
  });
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
  });

  loadAppWindow(mainWindow);
}

// IPC Handler: Check System Dependencies (yt-dlp, ffmpeg, espeak-ng)
ipcMain.handle('check-system-deps', async () => {
  const ytdlpPath = findExecutable('yt-dlp');
  const ffmpegPath = findExecutable('ffmpeg');
  const espeakPath = findExecutable('espeak-ng');
  const env = { ...process.env, PATH: getEnrichedPath() };

  let hasYtdlp = false;
  let hasFfmpeg = false;
  let hasEspeak = false;
  let ytdlpVersion = '';
  let ffmpegVersion = '';

  try {
    const r1 = await runCommandAsync(ytdlpPath, ['--version'], { timeoutMs: 5000, env });
    if (r1.code === 0) {
      hasYtdlp = true;
      ytdlpVersion = r1.stdout.trim();
    }
  } catch (_) {}

  try {
    const r2 = await runCommandAsync(ffmpegPath, ['-version'], { timeoutMs: 5000, env });
    if (r2.code === 0) {
      hasFfmpeg = true;
      ffmpegVersion = r2.stdout.split('\n')[0] || '';
    }
  } catch (_) {}

  try {
    const r3 = await runCommandAsync(espeakPath, ['--version'], { timeoutMs: 5000, env });
    if (r3.code === 0) {
      hasEspeak = true;
    }
  } catch (_) {}

  return {
    isDesktop: true,
    ytdlp: hasYtdlp,
    ytdlpVersion,
    ytdlpPath,
    ffmpeg: hasFfmpeg,
    ffmpegVersion,
    espeak: hasEspeak,
    platform: process.platform,
  };
});

// IPC Handler: Safe yt-dlp Update Guidance (zero unverified binary downloads)
ipcMain.handle('update-ytdlp', async () => {
  return {
    success: false,
    manualUpdateRequired: true,
    error:
      'Automatic unverified binary downloads are disabled for security. Update yt-dlp via your system package manager (`sudo apt update && sudo apt install yt-dlp`) or `pipx upgrade yt-dlp` (with SHA2-256SUMS verification).',
  };
});

// IPC Handler: Download YouTube Audio via yt-dlp (hardened: strict URL, TLS verified, `--`, isolated mkdtemp)
ipcMain.handle('download-youtube-audio', async (event, rawUrl) => {
  const cleanUrl = validateYouTubeUrl(rawUrl);
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maya-audio-'));

  try {
    const ytdlpPath = findExecutable('yt-dlp');
    const ffmpegPath = findExecutable('ffmpeg');
    const nodePath = findExecutable('node');
    const outputFileTemplate = path.join(runDir, 'audio_%(id)s.%(ext)s');

    const args = [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--ffmpeg-location', ffmpegPath,
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=mweb,android,ios,web',
    ];

    if (nodePath && fs.existsSync(nodePath)) {
      args.push('--js-runtimes', `node:${nodePath}`);
    } else {
      args.push('--js-runtimes', 'node');
    }

    args.push('-o', outputFileTemplate, '--', cleanUrl);

    const env = { ...process.env, PATH: getEnrichedPath() };
    const result = await runCommandAsync(ytdlpPath, args, { timeoutMs: 120000, env });

    if (result.code !== 0) {
      let formattedError = result.stderr || result.stdout;
      if (formattedError.includes('The page needs to be reloaded') || formattedError.includes('SABR streaming')) {
        formattedError = 'YouTube requires updated yt-dlp extractor rules. Update yt-dlp via your package manager or `pipx upgrade yt-dlp`, then try again.';
      } else {
        const errLines = formattedError
          .split('\n')
          .filter((l) => l.includes('ERROR:') || l.includes('Error:'))
          .map((l) => l.replace(/^ERROR:\s*/i, ''));
        if (errLines.length > 0) {
          formattedError = errLines.join('. ');
        }
      }
      throw new Error(formattedError || `yt-dlp extraction failed with code ${result.code}`);
    }

    const mp3File = fs.readdirSync(runDir).find((f) => f.endsWith('.mp3'));
    if (!mp3File) {
      throw new Error('Audio file was not found after conversion.');
    }

    const filePath = path.join(runDir, mp3File);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Audio = `data:audio/mp3;base64,${fileBuffer.toString('base64')}`;
    return { success: true, audioDataUrl: base64Audio, fileName: mp3File };
  } finally {
    try { fs.rmSync(runDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// IPC Handler: Download YouTube Audio via Interactive Desktop Terminal (zero bash interpolation, direct argv)
ipcMain.handle('download-youtube-audio-terminal', async (event, rawUrl) => {
  const cleanUrl = validateYouTubeUrl(rawUrl);
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maya-audio-term-'));

  try {
    const ytdlpPath = findExecutable('yt-dlp');
    const ffmpegPath = findExecutable('ffmpeg');
    const nodePath = findExecutable('node');
    const outputFileTemplate = path.join(runDir, 'audio_%(id)s.%(ext)s');

    const ytdlpArgs = [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--ffmpeg-location', ffmpegPath,
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=mweb,android,ios,web',
    ];
    if (nodePath && fs.existsSync(nodePath)) {
      ytdlpArgs.push('--js-runtimes', `node:${nodePath}`);
    } else {
      ytdlpArgs.push('--js-runtimes', 'node');
    }
    ytdlpArgs.push('-o', outputFileTemplate, '--', cleanUrl);

    const terminalBins = ['konsole', 'gnome-terminal', 'x-terminal-emulator', 'xterm', 'kitty', 'alacritty'];
    let termBin = null;
    for (const t of terminalBins) {
      const found = findExecutable(t);
      if (found && found !== t && fs.existsSync(found)) {
        termBin = { name: t, path: found };
        break;
      }
    }

    if (!termBin) {
      throw new Error('No desktop terminal emulator (konsole, gnome-terminal, xterm) found on system.');
    }

    let termArgs = [];
    if (termBin.name === 'konsole') {
      termArgs = ['--title', 'Maya YouTube Download', '-e', ytdlpPath, ...ytdlpArgs];
    } else if (termBin.name === 'gnome-terminal') {
      termArgs = ['--', ytdlpPath, ...ytdlpArgs];
    } else if (termBin.name === 'xterm') {
      termArgs = ['-title', 'Maya YouTube Download', '-e', ytdlpPath, ...ytdlpArgs];
    } else {
      termArgs = ['-e', ytdlpPath, ...ytdlpArgs];
    }

    const env = { ...process.env, PATH: getEnrichedPath() };
    await runCommandAsync(termBin.path, termArgs, { timeoutMs: 180000, env });

    const mp3File = fs.readdirSync(runDir).find((f) => f.endsWith('.mp3'));
    if (!mp3File) {
      throw new Error('No audio file was produced from the terminal download.');
    }

    const filePath = path.join(runDir, mp3File);
    const fileBuffer = fs.readFileSync(filePath);
    const base64Audio = `data:audio/mp3;base64,${fileBuffer.toString('base64')}`;
    return { success: true, audioDataUrl: base64Audio, fileName: mp3File };
  } finally {
    try { fs.rmSync(runDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// IPC Handler: File Dialog & Explorer (tracks approved paths)
ipcMain.handle('show-save-dialog', async (event, options) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const videosDir = app.getPath('videos') || app.getPath('downloads') || app.getPath('home');
  const safeDefaultName = path.basename(String(options?.defaultName || 'Maya-Video.mp4')).replace(/[^a-zA-Z0-9._ -]/g, '_');
  const result = await dialog.showSaveDialog(win, {
    title: String(options?.title || 'Export Video').slice(0, 120),
    defaultPath: path.join(videosDir, safeDefaultName),
    filters: options?.filters || [
      { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
      { name: 'WebM Video (*.webm)', extensions: ['webm'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePath) {
    const resolved = path.resolve(result.filePath);
    approvedExportPaths.add(resolved);
    approvedExportDirs.add(path.dirname(resolved));
  }
  return result;
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  if (!isAllowedRevealPath(filePath)) {
    throw new Error('Access denied: path is outside approved export and user media directories.');
  }
  const resolved = path.resolve(filePath);
  if (fs.existsSync(resolved)) {
    shell.showItemInFolder(resolved);
    return true;
  }
  return false;
});

// IPC Native Video Export Engine (FFmpeg Stdin Stream — hardened)
ipcMain.handle('start-native-export', async (event, config) => {
  cleanupExportResources();

  if (!config || typeof config !== 'object') {
    throw new Error('Invalid export configuration.');
  }

  const resolvedOutput = path.resolve(String(config.outputPath || ''));
  if (!approvedExportPaths.has(resolvedOutput)) {
    throw new Error('Export outputPath must be selected via the native Save Dialog.');
  }

  const width = Math.round(Number(config.width));
  const height = Math.round(Number(config.height));
  const fps = Math.round(Number(config.fps ?? 60));
  const transparent = Boolean(config.transparent);

  if (!Number.isFinite(width) || width < 160 || width > 3840) {
    throw new Error('Export width must be between 160 and 3840 pixels.');
  }
  if (!Number.isFinite(height) || height < 160 || height > 2160) {
    throw new Error('Export height must be between 160 and 2160 pixels.');
  }
  if (!Number.isFinite(fps) || fps < 1 || fps > 60) {
    throw new Error('Export FPS must be between 1 and 60.');
  }

  const rawVol = Number(config.bgAudioVolume ?? 0.8);
  const safeVolume = Number.isFinite(rawVol) ? Math.min(2.0, Math.max(0.0, rawVol)).toFixed(3) : '0.800';

  const ffmpegPath = findExecutable('ffmpeg');
  const args = [
    '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', `${width}x${height}`,
    '-pix_fmt', 'rgba',
    '-r', `${fps}`,
    '-i', 'pipe:0',
  ];

  let audioInputIndex = -1;
  if (config.bgAudioBase64 && typeof config.bgAudioBase64 === 'string') {
    try {
      const exportTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maya-export-'));
      currentExportTempDirs.push(exportTmpDir);
      const tempAudioPath = path.join(exportTmpDir, 'bg_audio.mp3');
      const cleanBase64 = config.bgAudioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
      fs.writeFileSync(tempAudioPath, Buffer.from(cleanBase64, 'base64'));
      currentExportTempFiles.push(tempAudioPath);
      args.push('-stream_loop', '-1', '-i', tempAudioPath);
      audioInputIndex = 1;
    } catch (e) {
      console.warn('Could not write temp audio file for export:', e);
    }
  }

  if (transparent) {
    args.push(
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuva420p',
      '-b:v', '0',
      '-crf', '20',
      '-deadline', 'realtime',
      '-cpu-used', '4'
    );
    if (audioInputIndex !== -1) {
      args.push(
        '-filter_complex', `[${audioInputIndex}:a]volume=${safeVolume}[a]`,
        '-map', '0:v',
        '-map', '[a]',
        '-c:a', 'libopus',
        '-shortest'
      );
    }
  } else {
    args.push(
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart'
    );
    if (audioInputIndex !== -1) {
      args.push(
        '-filter_complex', `[${audioInputIndex}:a]volume=${safeVolume}[a]`,
        '-map', '0:v',
        '-map', '[a]',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest'
      );
    }
  }

  args.push(resolvedOutput);

  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(ffmpegPath, args, {
        env: { ...process.env, PATH: getEnrichedPath() },
        shell: false,
      });
      currentExportProcess = proc;

      let errLogs = '';
      let settled = false;

      proc.stderr.on('data', (d) => {
        errLogs += d.toString();
      });

      proc.once('error', (err) => {
        if (!settled) {
          settled = true;
          cleanupExportResources();
          reject(new Error(`Failed to start FFmpeg: ${err.message}`));
        }
      });

      proc.once('exit', (code) => {
        if (!settled) {
          settled = true;
          cleanupExportResources();
          reject(new Error(`FFmpeg exited immediately with code ${code}: ${errLogs.slice(-300)}`));
        }
      });

      proc.once('spawn', () => {
        if (!settled) {
          settled = true;
          resolve({ success: true, outputPath: resolvedOutput });
        }
      });
    } catch (err) {
      cleanupExportResources();
      reject(err);
    }
  });
});

ipcMain.handle('feed-native-export-frame', async (event, buffer) => {
  if (!currentExportProcess || !currentExportProcess.stdin || currentExportProcess.killed) {
    throw new Error('Native export process is not active');
  }

  return new Promise((resolve, reject) => {
    const nodeBuf = Buffer.from(buffer);
    const onErr = (err) => reject(err);
    currentExportProcess.stdin.once('error', onErr);
    const canAcceptMore = currentExportProcess.stdin.write(nodeBuf);
    if (!canAcceptMore) {
      currentExportProcess.stdin.once('drain', () => {
        currentExportProcess?.stdin?.removeListener('error', onErr);
        resolve(true);
      });
    } else {
      currentExportProcess.stdin.removeListener('error', onErr);
      resolve(true);
    }
  });
});

ipcMain.handle('finish-native-export', async () => {
  if (!currentExportProcess) {
    return { success: true };
  }

  return new Promise((resolve, reject) => {
    const proc = currentExportProcess;
    currentExportProcess = null;

    let errorOutput = '';
    proc.stderr.on('data', (d) => {
      errorOutput += d.toString();
    });

    proc.on('close', (code) => {
      cleanupExportResources();
      if (code === 0) {
        resolve({ success: true });
      } else {
        reject(new Error(`FFmpeg export failed with exit code ${code}: ${errorOutput}`));
      }
    });

    proc.stdin.end();
  });
});

ipcMain.handle('cancel-native-export', async () => {
  cleanupExportResources();
  return { success: true };
});

ipcMain.handle('export-capcut-draft', async (event, { contentJson, metaJson, projectName }) => {
  try {
    const safeProject = path.basename(String(projectName || 'Maya_Project')).replace(/[^a-zA-Z0-9._ -]/g, '_');
    const defaultName = `${safeProject}_CapCut_Draft`;
    const result = await dialog.showSaveDialog({
      title: 'Export CapCut Project Draft Folder',
      defaultPath: path.join(app.getPath('downloads'), defaultName),
      buttonLabel: 'Export Draft Folder',
    });

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true };
    }

    const targetDir = path.resolve(result.filePath);
    approvedExportDirs.add(targetDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const draftContentPath = path.join(targetDir, 'draft_content.json');
    fs.writeFileSync(draftContentPath, String(contentJson || '{}'), 'utf8');
    fs.writeFileSync(path.join(targetDir, 'draft_meta_info.json'), String(metaJson || '{}'), 'utf8');
    approvedExportPaths.add(draftContentPath);

    shell.showItemInFolder(draftContentPath);

    return {
      success: true,
      folderPath: targetDir,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
});

// IPC Handler: List Neural & Local Offline Voices
ipcMain.handle('list-neural-voices', async () => {
  return NEURAL_VOICE_PRESETS;
});

// IPC Handler: Generate Voice (async spawn with 30s timeout, offline espeak-ng fallback, strict voice allowlist)
ipcMain.handle('generate-neural-tts', async (event, { text, voice, rate, style, startTime = 0, offline = false } = {}) => {
  const cleanText = String(text || '').trim();
  if (!cleanText) {
    return { success: false, error: 'Text cannot be empty' };
  }
  if (cleanText.length > 4000) {
    return { success: false, error: 'Text exceeds maximum 4000 characters.' };
  }

  let selectedVoice;
  try {
    selectedVoice = validateVoiceId(voice);
  } catch (err) {
    return { success: false, error: err.message };
  }

  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maya-tts-'));
  const env = { ...process.env, PATH: getEnrichedPath() };

  try {
    const numericRate = Number(rate);
    const clampedRate = Number.isFinite(numericRate) ? Math.min(2.0, Math.max(0.5, numericRate)) : 1.0;

    // 1. Offline local espeak-ng path (zero cloud egress)
    if (offline || selectedVoice === 'espeak-local') {
      const espeakBin = findExecutable('espeak-ng');
      const outWav = path.join(runDir, 'speech.wav');
      const wpm = Math.round(160 * clampedRate);
      const res = await runCommandAsync(
        espeakBin,
        ['-w', outWav, '-s', String(wpm), '--', cleanText],
        { timeoutMs: 30000, env }
      );
      if (res.code !== 0 || !fs.existsSync(outWav)) {
        return { success: false, error: res.stderr || 'Local offline espeak-ng synthesis failed.' };
      }
      const wavBuf = fs.readFileSync(outWav);
      const audioDataUrl = `data:audio/wav;base64,${wavBuf.toString('base64')}`;
      const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
      const estDuration = Math.max(1.0, (wordCount / wpm) * 60);
      return {
        success: true,
        audioDataUrl,
        duration: estDuration,
        subtitles: [],
        voice: 'espeak-local',
        engine: 'espeak-ng (local offline)',
      };
    }

    // 2. Optional cloud edge-tts path (async spawn, 30s timeout)
    const edgeTtsBin = findExecutable('edge-tts');
    const outMp3 = path.join(runDir, 'speech.mp3');
    const outVtt = path.join(runDir, 'speech.vtt');
    const pct = Math.round((clampedRate - 1.0) * 100);
    const rateArg = pct >= 0 ? `+${pct}%` : `${pct}%`;

    const args = [
      '--text', cleanText,
      '--voice', selectedVoice,
      '--rate', rateArg,
      '--write-media', outMp3,
      '--write-subtitles', outVtt,
    ];

    const result = await runCommandAsync(edgeTtsBin, args, { timeoutMs: 30000, env });
    if (result.code !== 0 || !fs.existsSync(outMp3)) {
      return { success: false, error: result.stderr || 'TTS process failed' };
    }

    const audioBuffer = fs.readFileSync(outMp3);
    const audioDataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;

    let audioDuration = 3.0;
    try {
      const ffmpegBin = findExecutable('ffmpeg');
      const probeRes = await runCommandAsync(ffmpegBin, ['-i', outMp3], { timeoutMs: 10000, env });
      const durMatch = probeRes.stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durMatch) {
        audioDuration = parseFloat(durMatch[1]) * 3600 + parseFloat(durMatch[2]) * 60 + parseFloat(durMatch[3]);
      }
    } catch (_) {}

    const subtitles = [];
    if (fs.existsSync(outVtt)) {
      const vttContent = fs.readFileSync(outVtt, 'utf8');
      const lines = vttContent.split('\n');
      const parseTime = (timeStr) => {
        const parts = timeStr.replace(',', '.').split(':');
        if (parts.length === 3) {
          return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        }
        return 0;
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
        if (timeMatch) {
          const currentStart = parseTime(timeMatch[1]);
          const currentEnd = parseTime(timeMatch[2]);
          const textLines = [];
          while (i + 1 < lines.length && lines[i + 1].trim() !== '' && !lines[i + 1].includes('-->')) {
            i++;
            textLines.push(lines[i].trim());
          }
          const subText = textLines.join(' ');
          if (subText) {
            const dur = Math.max(0.5, currentEnd - currentStart);
            subtitles.push({
              id: `sub_${Date.now()}_${subtitles.length}`,
              startTime: Number(startTime || 0) + currentStart,
              duration: dur,
              text: subText,
              style: style || 'hormozi',
              fontSize: 38,
              colorHex: '#FDE047',
              strokeHex: '#000000',
              uppercase: true,
              positionY: 0.82,
            });
          }
        }
      }
    }

    return {
      success: true,
      audioDataUrl,
      duration: audioDuration,
      subtitles,
      voice: selectedVoice,
      engine: 'edge-tts (cloud)',
    };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    try { fs.rmSync(runDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// IPC Handler: CLI Video Path Resolution
ipcMain.handle('get-cli-video-path', async () => {
  const args = process.argv.slice(1);
  const callerCwd = process.env.MAYA_CALLER_PWD || process.cwd();
  for (const raw of args) {
    if (!raw || raw.startsWith('-') || raw === '.') continue;
    const candidate = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(callerCwd, raw);
    if (fs.existsSync(candidate) && /\.(mp4|mov|webm|mkv)$/i.test(candidate)) {
      return candidate;
    }
  }
  return null;
});

// IPC Handler: Headless 60fps Procedural Motion Engine Invocation (strictly allowlisted)
ipcMain.handle('render-maya-motion-preset', async (event, { preset = 'zoth-sovereign-core', outDir } = {}) => {
  const cleanPreset = String(preset || '').trim();
  if (!ALLOWED_MOTION_PRESETS.has(cleanPreset)) {
    throw new Error(`Invalid motion preset "${cleanPreset}".`);
  }

  const engineScript = path.join(__dirname, 'maya_motion_engine.py');
  if (!fs.existsSync(engineScript)) {
    throw new Error('maya_motion_engine.py not found in Maya installation directory.');
  }

  const targetOut = validateOutDir(outDir);
  approvedExportDirs.add(targetOut);
  const pythonBin = findExecutable('python3');
  const env = { ...process.env, PATH: getEnrichedPath() };

  const res = await runCommandAsync(
    pythonBin,
    [engineScript, '--render', cleanPreset, '--out', targetOut],
    { timeoutMs: 180000, env }
  );

  if (res.code === 0) {
    return { success: true, outDir: targetOut, stdout: res.stdout };
  }
  throw new Error(res.stderr || res.stdout || `Motion engine exited with code ${res.code}`);
});

app.on('before-quit', () => {
  cleanupAllProcesses();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  cleanupAllProcesses();
  if (process.platform !== 'darwin') app.quit();
});
