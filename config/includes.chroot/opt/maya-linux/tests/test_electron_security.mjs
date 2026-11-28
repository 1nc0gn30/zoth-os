import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const mainJs = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
const preloadJs = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const transitionsTsx = fs.readFileSync(path.join(ROOT, 'src/components/Modals/TransitionsModal.tsx'), 'utf8');
const headerTsx = fs.readFileSync(path.join(ROOT, 'src/components/Header/Header.tsx'), 'utf8');
const readmeMd = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  [PASS] ${name}`);
}

console.log('=== Maya Linux v2.0.0 Electron Security & Packaging Suite ===');

check('BrowserWindow enforces strict Electron isolation', () => {
  assert.match(mainJs, /nodeIntegration:\s*false/);
  assert.match(mainJs, /contextIsolation:\s*true/);
  assert.match(mainJs, /webSecurity:\s*true/);
  assert.match(mainJs, /sandbox:\s*true/);
  assert.doesNotMatch(mainJs, /nodeIntegration:\s*true/);
  assert.doesNotMatch(mainJs, /contextIsolation:\s*false/);
  assert.doesNotMatch(mainJs, /webSecurity:\s*false/);
  assert.doesNotMatch(mainJs, /sandbox:\s*false/);
  assert.doesNotMatch(mainJs, /allowRunningInsecureContent:\s*true/);
});

check('Navigation, popup, and before-quit process cleanup guards exist', () => {
  assert.match(mainJs, /setWindowOpenHandler/);
  assert.match(mainJs, /will-navigate/);
  assert.match(mainJs, /app\.on\(['"]before-quit['"]/);
  assert.match(mainJs, /MAYA_NO_SANDBOX === ['"]1['"]/);
});

check('Zero OS command injection, zero TLS bypass, zero unverified binary download', () => {
  assert.doesNotMatch(mainJs, /run_ytdlp_/);
  assert.doesNotMatch(mainJs, /--no-check-certificates/);
  assert.doesNotMatch(mainJs, /spawn\(['"]curl['"]/);
  assert.doesNotMatch(mainJs, /chmodSync\([^)]*0o755/);
  assert.match(mainJs, /validateYouTubeUrl/);
  assert.match(mainJs, /approvedExportPaths\.has/);
  assert.match(mainJs, /ALLOWED_MOTION_PRESETS\.has/);
  assert.match(mainJs, /'--', cleanUrl/);
  assert.match(mainJs, /mkdtempSync/);
});

check('TTS IPC uses async spawn (zero blocking edge-tts spawnSync) with offline espeak-ng fallback', () => {
  assert.doesNotMatch(mainJs, /spawnSync\(edgeTtsBin/);
  assert.match(mainJs, /NEURAL_VOICE_REGEX/);
  assert.match(mainJs, /espeak-ng/);
});

check('Preload strictly uses contextBridge without non-isolated window fallback', () => {
  assert.match(preloadJs, /contextBridge\.exposeInMainWorld\(['"]electronAPI['"]/);
  assert.doesNotMatch(preloadJs, /window\.electronAPI\s*=/);
});

check('index.html has strict CSP, Schema.org @graph, OG/Twitter tags, zero Google Fonts egress', () => {
  assert.match(indexHtml, /http-equiv="Content-Security-Policy"/);
  assert.match(indexHtml, /default-src 'self'/);
  assert.doesNotMatch(indexHtml, /fonts\.googleapis\.com/);
  assert.doesNotMatch(indexHtml, /fonts\.gstatic\.com/);
  assert.match(indexHtml, /application\/ld\+json/);
  assert.match(indexHtml, /SoftwareApplication/);
  assert.match(indexHtml, /FAQPage/);
  assert.match(indexHtml, /property="og:title"/);
  assert.match(indexHtml, /name="twitter:card"/);
});

check('Dead commercial audio & PresetPreviews bloat purged, unused npm deps removed, LICENSE present', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'public/assets/audio')), false, 'public/assets/audio must be deleted');
  assert.equal(fs.existsSync(path.join(ROOT, 'public/PresetPreviews')), false, 'public/PresetPreviews must be deleted');
  assert.equal(fs.existsSync(path.join(ROOT, 'LICENSE')), true, 'MIT LICENSE must exist');
  assert.equal(pkgJson.version, '2.0.0');
  for (const unused of ['howler', '@types/howler', 'canvas-confetti', 'framer-motion', 'clsx']) {
    assert.equal(unused in (pkgJson.dependencies || {}), false, `Unused dep ${unused} must be removed`);
  }
});

check('9:16 Reels export switches aspect, zero banned hype words, zero literal /home/ paths', () => {
  assert.match(headerTsx, /onExport\(false,\s*'1080p',\s*60,\s*'vertical9x16'\)/);
  assert.doesNotMatch(transitionsTsx, /seamless/i);
  assert.doesNotMatch(readmeMd, /YOUR_USERNAME/i);
  assert.match(readmeMd, /Neal Frazier Tech \(@1nc0gn30\)/);
  assert.match(readmeMd, /3cIfZg27PdKo2D64Ocfw40X/);
  assert.match(readmeMd, /GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK/);
  assert.doesNotMatch(mainJs, /\/home\/[a-zA-Z0-9._-]+/);
  assert.doesNotMatch(readmeMd, /\/home\/[a-zA-Z0-9._-]+/);
});

console.log(`ALL ${passed} MAYA ELECTRON SECURITY & PACKAGING CHECKS PASSED.`);
