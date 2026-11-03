const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'assets');
const ARTIFACT_DIR = '/home/zoth/.gemini/antigravity-cli/brain/5e2f4196-8ec1-4cf2-8d92-bad9291e3aa7';

const REELS = [
  {
    key: 'hero',
    name: 'zothos-lite-hero-showreel',
    width: 1920,
    height: 1080,
    duration: 18.0,
    audioWav: path.join(__dirname, 'audio_hero.wav'),
    sheetTimestamps: [0.8, 4.2, 8.0, 12.0, 15.6, 17.2],
    sheetGrid: '3x2',
    sheetScale: '640:360'
  },
  {
    key: 'vaelor',
    name: 'zothos-lite-vaelor-node-edit',
    width: 1920,
    height: 1080,
    duration: 15.0,
    audioWav: path.join(__dirname, 'audio_vaelor.wav'),
    sheetTimestamps: [0.8, 4.5, 8.2, 12.2, 13.8, 14.5],
    sheetGrid: '3x2',
    sheetScale: '640:360'
  },
  {
    key: 'vertical',
    name: 'zothos-lite-vertical-hype-edit',
    width: 1080,
    height: 1920,
    duration: 15.0,
    audioWav: path.join(__dirname, 'audio_vertical.wav'),
    sheetTimestamps: [0.8, 4.0, 7.0, 10.0, 13.0, 14.4],
    sheetGrid: '3x2',
    sheetScale: '360:640'
  }
];

const CAPTURE_FPS = 30;
const OUT_FPS = 60;

function startStaticServer(port) {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.ttf': 'font/ttf'
  };
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const cleanUrl = req.url.split('?')[0];
      let filePath = path.join(ROOT_DIR, cleanUrl);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(ROOT_DIR, 'public', cleanUrl);
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function renderSingleReel(reel, send, httpPort) {
  const outMp4 = path.join(OUT_DIR, `${reel.name}.mp4`);
  const outPoster = path.join(OUT_DIR, `${reel.name}-poster.jpg`);
  const outSheet = path.join(OUT_DIR, `${reel.name}-sheet.png`);
  const totalFrames = Math.round(CAPTURE_FPS * reel.duration);

  await send('Emulation.setDeviceMetricsOverride', {
    width: reel.width,
    height: reel.height,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log(`\n=== Loading [${reel.name}] (${reel.width}x${reel.height} @ ${OUT_FPS}fps, ${reel.duration}s) ===`);
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/motion-edit/suite.html?reel=${reel.key}` });

  for (let w = 0; w < 100; w++) {
    await sleep(100);
    const res = await send('Runtime.evaluate', { expression: 'Boolean(window.__IMAGES_READY)' });
    if (res && res.result && res.result.value === true) break;
  }

  const ffArgs = [
    '-y',
    '-threads', '3',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-framerate', String(CAPTURE_FPS),
    '-i', '-',
    '-i', reel.audioWav,
    '-vf', `scale=${reel.width}:${reel.height}`,
    '-r', String(OUT_FPS),
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '256k',
    '-shortest',
    '-movflags', '+faststart',
    outMp4
  ];

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d.toString(); });
  ff.stdin.on('error', () => {});

  const tmpDir = path.join(__dirname, `tmp_${reel.key}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const sheetSet = new Set(reel.sheetTimestamps.map(ts => Math.round(ts * CAPTURE_FPS)));
  const savedSheetFiles = [];

  for (let f = 0; f < totalFrames; f++) {
    const t = f / CAPTURE_FPS;
    await send('Runtime.evaluate', { expression: `window.renderFrame(${t.toFixed(5)})` });
    const shot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 94,
      clip: { x: 0, y: 0, width: reel.width, height: reel.height, scale: 1 }
    });
    const buf = Buffer.from(shot.data, 'base64');
    if (f === 12) {
      fs.writeFileSync(outPoster, buf);
    }
    if (sheetSet.has(f)) {
      const sf = path.join(tmpDir, `frame_${String(savedSheetFiles.length).padStart(2, '0')}.jpg`);
      fs.writeFileSync(sf, buf);
      savedSheetFiles.push(sf);
    }
    const ok = ff.stdin.write(buf);
    if (!ok) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 90 === 0 || f === totalFrames - 1) {
      console.log(`  [${reel.key}] Frame ${f + 1}/${totalFrames} (${t.toFixed(1)}s / ${reel.duration}s)`);
    }
  }

  ff.stdin.end();
  const code = await new Promise(r => ff.on('close', r));
  if (code !== 0) {
    console.error(ffErr);
    throw new Error(`ffmpeg exited with ${code}`);
  }
  console.log(`  -> MP4 rendered: ${outMp4}`);

  // Build 3x2 settled-frame contact sheet
  await new Promise((resolve, reject) => {
    const sff = spawn('ffmpeg', [
      '-y',
      '-pattern_type', 'glob',
      '-i', path.join(tmpDir, 'frame_*.jpg'),
      '-vf', `scale=${reel.sheetScale},tile=${reel.sheetGrid}:padding=8:margin=8:color=0x09090F`,
      '-frames:v', '1',
      outSheet
    ], { stdio: 'ignore' });
    sff.on('close', c => c === 0 ? resolve() : reject(new Error(`sheet exit ${c}`)));
  });
  console.log(`  -> Contact sheet rendered: ${outSheet}`);

  // Copy to artifact directory
  fs.copyFileSync(outMp4, path.join(ARTIFACT_DIR, `${reel.name}.mp4`));
  fs.copyFileSync(outSheet, path.join(ARTIFACT_DIR, `${reel.name}-sheet.png`));
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const HTTP_PORT = 9378;
  const CDP_PORT = 9379;
  const srv = await startStaticServer(HTTP_PORT);

  const chrome = spawn('google-chrome', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--window-size=1920,1920',
    'about:blank'
  ]);

  await sleep(1300);
  const listRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then(r => r.json());
  const page = listRes.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = msgId++;
    const timer = setTimeout(() => {
      ws.removeEventListener('message', handler);
      reject(new Error(`Timeout on ${method}`));
    }, 15000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        clearTimeout(timer);
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  await send('Page.enable');

  for (const reel of REELS) {
    await renderSingleReel(reel, send, HTTP_PORT);
  }

  ws.close();
  chrome.kill();
  srv.close();
  console.log('\nAll 3 ZothOS-Lite Motion Edit Reels + Contact Sheets complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
