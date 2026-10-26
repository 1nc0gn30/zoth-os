'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { execFileSync, spawn } = require('child_process');
const { clipboard } = require('electron');
const computer = require('./computer');
const store = require('./store');
const portalAuth = require('./portalAuth');

let PORTAL_TOKEN = null;
function portalToken() {
  if (!PORTAL_TOKEN) PORTAL_TOKEN = portalAuth.loadOrCreateToken(store.ROOT);
  return PORTAL_TOKEN;
}
let boundHost = null;

const PORTAL_PORT = Number(process.env.ZOTH_PORTAL_PORT || 9335);

let server = null;
const wsClients = new Set();
const sseClients = new Set();

let cachedPeer = null;
let cachedPeerTs = 0;

function detectTailscalePeer() {
  const now = Date.now();
  if (cachedPeer && now - cachedPeerTs < 30000) return cachedPeer;
  try {
    const raw = execFileSync('/usr/bin/tailscale', ['status', '--json'], {
      encoding: 'utf8',
      timeout: 1800,
    });
    const data = JSON.parse(raw);
    const peers = Object.values(data.Peer || {});
    const androidPeer =
      peers.find((p) => /pixel/i.test(p.HostName || p.DNSName || '')) ||
      peers.find((p) => p.OS === 'android' && (p.Online || p.Active)) ||
      peers.find((p) => p.OS === 'android');
    if (androidPeer) {
      const host = (androidPeer.DNSName || androidPeer.HostName || 'pixel-10-pro').split('.')[0];
      const ip = (androidPeer.TailscaleIPs && androidPeer.TailscaleIPs[0]) || '100.106.39.46';
      cachedPeer = {
        name: host,
        ip,
        os: androidPeer.OS || 'android',
        online: Boolean(androidPeer.Online || androidPeer.Active),
      };
      cachedPeerTs = now;
      return cachedPeer;
    }
  } catch {
    /* fallback */
  }
  cachedPeer = { name: 'pixel-10-pro', ip: '100.106.39.46', os: 'android', online: true };
  cachedPeerTs = now;
  return cachedPeer;
}

let portalState = {
  onPhone: false,
  edgeActive: false,
  direction: 'to-phone', // 'to-phone' | 'to-laptop'
  penetration: 0,
  yPct: 0.5,
  cargo: [], // [{ id, kind: 'text'|'file'|'image'|'url', title, text, fileName, mime, size, ts }]
  history: [],
  connectedClients: 0,
  lastTaildropStatus: 'READY · pixel-10-pro',
};

let callbacks = {
  getSnapshot: () => ({}),
  onRecallToLaptop: () => {},
  onBeamToPhone: () => {},
  onPhoneEdgeDrag: () => {},
  onPhoneChat: async () => ({ text: '' }),
  onPhoneCargoReceived: () => {},
  onStatusChange: () => {},
};

function getAddresses() {
  const nets = os.networkInterfaces();
  let lan = null;
  let tailscale = null;
  for (const [name, addrs] of Object.entries(nets)) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (name.startsWith('tailscale') || a.address.startsWith('100.106.') || a.address.startsWith('100.')) {
        if (name.startsWith('tailscale')) tailscale = a.address;
        else if (!lan) lan = a.address;
      } else if (!lan) {
        lan = a.address;
      }
    }
  }
  const primary = tailscale || lan || '127.0.0.1';
  const peer = detectTailscalePeer();
  return {
    port: PORTAL_PORT,
    lanIp: lan,
    tailscaleIp: tailscale,
    peerName: peer.name,
    peerIp: peer.ip,
    peerOnline: peer.online,
    lanUrl: lan ? `http://${lan}:${PORTAL_PORT}/pixel?t=${portalToken()}` : null,
    tailscaleUrl: tailscale ? `http://${tailscale}:${PORTAL_PORT}/pixel?t=${portalToken()}` : null,
    primaryUrl: `http://${primary}:${PORTAL_PORT}/pixel?t=${portalToken()}`,
  };
}

function taildropToPhone(filePath, label = '') {
  if (!filePath || !fs.existsSync(filePath)) return;
  const peer = detectTailscalePeer();
  const target = `${peer.name}:`;
  portalState.lastTaildropStatus = `BEAMING → ${peer.name}…`;
  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
  try {
    const child = spawn('/usr/bin/tailscale', ['file', 'cp', filePath, target], {
      stdio: 'ignore',
      detached: true,
    });
    child.on('exit', (code) => {
      portalState.lastTaildropStatus =
        code === 0
          ? `DROPPED ON ${peer.name.toUpperCase()} ✓`
          : `QUEUED FOR ${peer.name.toUpperCase()}`;
      if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
    });
    child.unref();
  } catch {
    portalState.lastTaildropStatus = `PORTAL READY (${peer.name})`;
  }
}

function generateQrSvg(url) {
  try {
    const svg = execFileSync(
      '/usr/bin/qrencode',
      ['--foreground=F6D365', '--background=080B11', '-t', 'SVG', '-m', '1', '-o', '-', String(url)],
      { encoding: 'utf8', timeout: 2500 }
    );
    const idx = svg.indexOf('<svg');
    return idx >= 0 ? svg.slice(idx) : svg;
  } catch {
    return '';
  }
}

function encodeWsFrame(dataStr) {
  const payload = Buffer.from(dataStr, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWsFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let hdrLen = 2;
    if (len === 126) {
      if (offset + 4 > buffer.length) break;
      len = buffer.readUInt16BE(offset + 2);
      hdrLen = 4;
    } else if (len === 127) {
      if (offset + 10 > buffer.length) break;
      len = Number(buffer.readBigUInt64BE(offset + 2));
      hdrLen = 10;
    }
    const maskLen = masked ? 4 : 0;
    if (offset + hdrLen + maskLen + len > buffer.length) break;
    const payload = Buffer.alloc(len);
    if (masked) {
      const mask = buffer.slice(offset + hdrLen, offset + hdrLen + 4);
      const src = buffer.slice(offset + hdrLen + 4, offset + hdrLen + 4 + len);
      for (let i = 0; i < len; i++) payload[i] = src[i] ^ mask[i & 3];
    } else {
      buffer.copy(payload, 0, offset + hdrLen, offset + hdrLen + len);
    }
    offset += hdrLen + maskLen + len;
    if (opcode === 0x08) {
      messages.push({ type: 'close' });
    } else if (opcode === 0x09) {
      messages.push({ type: 'ping', data: payload });
    } else if (opcode === 0x01) {
      messages.push({ type: 'text', data: payload.toString('utf8') });
    }
  }
  return { messages, remaining: buffer.slice(offset) };
}

function broadcast(event, data) {
  const packet = JSON.stringify({ event, data, ts: Date.now() });
  const wsFrame = encodeWsFrame(packet);
  for (const sock of wsClients) {
    try {
      sock.write(wsFrame);
    } catch {
      wsClients.delete(sock);
    }
  }
  const sseChunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(sseChunk);
    } catch {
      sseClients.delete(res);
    }
  }
}

function updateClientCount() {
  portalState.connectedClients = wsClients.size + sseClients.size;
  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
}

function addCargoItem(item) {
  computer.ensureWorkspace();
  let fileName = item.fileName ? path.basename(String(item.fileName)) : null;
  const textContent = item.text ? String(item.text).slice(0, 64000) : '';
  const origin = item.origin || 'laptop';

  // If it's a text/url snippet from the laptop without a backing file, materialize a clean .txt drop file for Taildrop
  if (origin === 'laptop' && !fileName && textContent) {
    const slug =
      String(item.title || 'Zoth-Drop')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42) || 'Zoth-Drop';
    fileName = `${slug}-${Date.now().toString(36).slice(-4)}.txt`;
    try {
      fs.writeFileSync(path.join(computer.WORKSPACE, fileName), textContent, 'utf8');
    } catch {
      fileName = null;
    }
  }

  const entry = {
    id: 'cargo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
    kind: item.kind || 'text',
    title: String(item.title || fileName || 'Sovereign Cargo').slice(0, 120),
    text: textContent,
    fileName,
    mime: item.mime || 'text/plain',
    size: Number(item.size || (textContent ? Buffer.byteLength(textContent) : 0)),
    origin,
    ts: new Date().toISOString(),
  };
  portalState.cargo.unshift(entry);
  if (portalState.cargo.length > 24) portalState.cargo.length = 24;
  broadcast('cargo', { cargo: portalState.cargo, latest: entry });

  // Automatically push via native Tailscale Taildrop to Pixel 10 Pro when staged on laptop!
  if (origin === 'laptop' && fileName) {
    const fullPath = path.join(computer.WORKSPACE, fileName);
    taildropToPhone(fullPath, entry.title);
  }

  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
  return entry;
}

function stageFileCargo(filePath, origin = 'laptop') {
  computer.ensureWorkspace();
  const base = path.basename(filePath);
  const dest = path.join(computer.WORKSPACE, base);
  if (path.resolve(filePath) !== path.resolve(dest)) {
    fs.copyFileSync(filePath, dest);
  }
  const st = fs.statSync(dest);
  const ext = path.extname(base).toLowerCase();
  const isImg = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext);
  let textPreview = '';
  if (!isImg && st.size <= 64 * 1024) {
    try {
      textPreview = fs.readFileSync(dest, 'utf8').slice(0, 8000);
    } catch {
      textPreview = '';
    }
  }
  const mimeMap = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.py': 'text/x-python',
    '.txt': 'text/plain',
    '.html': 'text/html',
  };
  return addCargoItem({
    kind: isImg ? 'image' : 'file',
    title: base,
    fileName: base,
    text: textPreview,
    mime: mimeMap[ext] || 'application/octet-stream',
    size: st.size,
    origin,
  });
}

function stageClipboardCargo() {
  const text = (clipboard.readText() || '').trim();
  if (!text) return null;
  const isUrl = /^https?:\/\/\S+$/i.test(text);
  return addCargoItem({
    kind: isUrl ? 'url' : 'text',
    title: isUrl ? text.slice(0, 64) : 'Clipboard Snippet (' + text.slice(0, 36).replace(/\s+/g, ' ') + '…)',
    text,
    size: Buffer.byteLength(text),
    origin: 'laptop',
  });
}

function clearCargo() {
  portalState.cargo = [];
  broadcast('cargo', { cargo: [] });
  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
}

function updateLaptopEdgeDrag({ active, penetration, yPct }) {
  const wasActive = portalState.edgeActive;
  portalState.edgeActive = Boolean(active);
  portalState.direction = 'to-phone';
  portalState.penetration = Math.max(0, Math.min(1, Number(penetration) || 0));
  if (typeof yPct === 'number') {
    portalState.yPct = Math.max(0.08, Math.min(0.92, yPct));
  }
  if (portalState.edgeActive || wasActive) {
    const snap = callbacks.getSnapshot ? callbacks.getSnapshot() : {};
    broadcast('edge', {
      active: portalState.edgeActive,
      direction: 'to-phone',
      penetration: portalState.penetration,
      yPct: portalState.yPct,
      onPhone: portalState.onPhone,
      bot: snap.bot || { name: 'Zoth', job: 'Sovereign desk companion' },
      maskOn: snap.maskOn !== false,
      ring: snap.ring || { ring: 2, name: 'TOOLMASTER' },
      cargoCount: portalState.cargo.length,
      latestCargo: portalState.cargo[0] || null,
    });
  }
}

function triggerHandoffToPhone(yPct) {
  if (typeof yPct === 'number') portalState.yPct = Math.max(0.08, Math.min(0.92, yPct));
  portalState.onPhone = true;
  portalState.edgeActive = false;
  portalState.penetration = 1;
  const snap = callbacks.getSnapshot ? callbacks.getSnapshot() : {};
  const addrs = getAddresses();
  broadcast('handoff', {
    onPhone: true,
    yPct: portalState.yPct,
    bot: snap.bot || { name: 'Zoth', job: 'Sovereign desk companion' },
    maskOn: snap.maskOn !== false,
    ring: snap.ring || { ring: 2, name: 'TOOLMASTER' },
    engine: snap.engine || 'grok',
    provider: snap.provider || 'grok',
    model: snap.model || 'grok-4.7',
    cargo: portalState.cargo,
    chat: snap.chat || [],
  });

  // Also push via native Tailscale Taildrop so it pops up on Pixel 10 Pro even with zero browser open!
  try {
    computer.ensureWorkspace();
    const latest = portalState.cargo[0];
    if (latest && latest.fileName && fs.existsSync(path.join(computer.WORKSPACE, latest.fileName))) {
      taildropToPhone(path.join(computer.WORKSPACE, latest.fileName), latest.title);
    } else {
      const targetUrl = addrs.tailscaleUrl || addrs.lanUrl || addrs.primaryUrl;
      const dropCardPath = path.join(computer.WORKSPACE, 'Zoth-Portal-Pixel10.html');
      const botName = (snap.bot && snap.bot.name) || 'Zoth';
      const lastChat = ((snap.chat || []).slice(-1)[0] && (snap.chat || []).slice(-1)[0].content) || 'Ready on Pixel 10 Pro.';
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${targetUrl}"><title>${botName} · Pixel 10 Portal</title><style>body{margin:0;background:#06080d;color:#f5f2eb;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center}.card{max-width:380px;padding:24px;border-radius:20px;background:#0e131f;border:1px solid rgba(212,175,55,0.45);box-shadow:0 18px 48px rgba(0,0,0,0.7)}h1{color:#f6d365;margin:0 0 8px}p{color:#9aa3b5;font-size:14px;line-height:1.5}a{display:inline-block;margin-top:16px;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#f6d365,#d4af37);color:#06080d;font-weight:700;text-decoration:none}</style></head><body><div class="card"><h1>⚡ ${botName} Beamed to Pixel 10 Pro</h1><p>${lastChat.slice(0, 240).replace(/</g, '&lt;')}</p><a href="${targetUrl}">OPEN LIVE PIXEL 10 PORTAL ⟶</a></div></body></html>`;
      fs.writeFileSync(dropCardPath, html, 'utf8');
      taildropToPhone(dropCardPath, `${botName} Portal Handoff`);
    }
  } catch {
    /* ignore */
  }

  if (callbacks.onBeamToPhone) callbacks.onBeamToPhone(getPortalSummary());
  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
}

function triggerRecallToLaptop(yPct) {
  if (typeof yPct === 'number') portalState.yPct = Math.max(0.08, Math.min(0.92, yPct));
  portalState.onPhone = false;
  portalState.edgeActive = false;
  portalState.penetration = 0;
  broadcast('handoff', {
    onPhone: false,
    yPct: portalState.yPct,
    cargo: portalState.cargo,
  });
  if (callbacks.onRecallToLaptop) callbacks.onRecallToLaptop(portalState.yPct);
  if (callbacks.onStatusChange) callbacks.onStatusChange(getPortalSummary());
}

function handleWsMessage(raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  if (!msg || !msg.type) return;
  if (msg.type === 'phone-edge') {
    portalState.direction = 'to-laptop';
    portalState.edgeActive = Boolean(msg.active);
    portalState.penetration = Math.max(0, Math.min(1, Number(msg.penetration) || 0));
    if (typeof msg.yPct === 'number') portalState.yPct = Math.max(0.08, Math.min(0.92, msg.yPct));
    if (callbacks.onPhoneEdgeDrag) {
      callbacks.onPhoneEdgeDrag({
        active: portalState.edgeActive,
        penetration: portalState.penetration,
        yPct: portalState.yPct,
      });
    }
  } else if (msg.type === 'recall-to-laptop') {
    triggerRecallToLaptop(msg.yPct);
  } else if (msg.type === 'summon-to-phone') {
    triggerHandoffToPhone(msg.yPct);
  }
}

function getPortalSummary() {
  const addrs = getAddresses();
  return {
    port: PORTAL_PORT,
    lanIp: addrs.lanIp,
    tailscaleIp: addrs.tailscaleIp,
    peerName: addrs.peerName,
    peerIp: addrs.peerIp,
    peerOnline: addrs.peerOnline,
    lastTaildropStatus: portalState.lastTaildropStatus,
    token: portalToken(),
    boundHost,
    lanUrl: addrs.lanUrl,
    tailscaleUrl: addrs.tailscaleUrl,
    primaryUrl: addrs.primaryUrl,
    qrLanSvg: addrs.lanUrl ? generateQrSvg(addrs.lanUrl) : '',
    qrTailscaleSvg: addrs.tailscaleUrl ? generateQrSvg(addrs.tailscaleUrl) : '',
    qrPrimarySvg: generateQrSvg(addrs.primaryUrl),
    onPhone: portalState.onPhone,
    dockedOnPhone: portalState.onPhone,
    edgeActive: portalState.edgeActive,
    penetration: portalState.penetration,
    yPct: portalState.yPct,
    connectedClients: portalState.connectedClients,
    cargo: portalState.cargo,
  };
}

function readBody(req, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let len = 0;
    req.on('data', (c) => {
      len += c.length;
      if (len > maxBytes) {
        req.destroy();
        reject(new Error('payload too large'));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function start(customCallbacks = {}) {
  callbacks = { ...callbacks, ...customCallbacks };
  if (server) return getPortalSummary();

  const rendererDir = path.join(__dirname, '..', 'renderer');

  server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }
      const auth = portalAuth.checkRequest(req, portalToken());
      if (!auth.ok) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'text/plain');
        res.end('zoth portal: token required (open the link/QR from the Zoth Bot portal drawer)');
        return;
      }
      if (auth.via === 'query') res.setHeader('Set-Cookie', portalAuth.cookieHeader(portalToken()));

      const url = new URL(req.url, 'http://127.0.0.1');
      const p = url.pathname;

      if (p === '/' || p === '/pixel' || p === '/index.html') {
        const htmlPath = path.join(rendererDir, 'pixel.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(html);
        return;
      }

      if (p === '/manifest.json') {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(
          JSON.stringify({
            name: 'Zoth Portal · Pixel 10 Sovereign Companion',
            short_name: 'Zoth Portal',
            start_url: '/',
            display: 'standalone',
            background_color: '#06080d',
            theme_color: '#d4af37',
            icons: [{ src: '/assets/zoth-guy.jpg', sizes: '512x512', type: 'image/jpeg' }],
          })
        );
        return;
      }

      if (p === '/stage.js' || p.startsWith('/assets/') || p.startsWith('/fonts/') || p.startsWith('/vendor/')) {
        const safeRel = path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, '');
        const abs = path.join(rendererDir, safeRel);
        if (abs.startsWith(rendererDir) && fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          const ext = path.extname(abs).toLowerCase();
          const types = {
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.glb': 'model/gltf-binary',
            '.woff2': 'font/woff2',
            '.js': 'text/javascript',
            '.css': 'text/css',
          };
          res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
          res.end(fs.readFileSync(abs));
          return;
        }
      }

      if (p === '/events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });
        res.write(`event: init\ndata: ${JSON.stringify(getFullPhoneState())}\n\n`);
        sseClients.add(res);
        updateClientCount();
        req.on('close', () => {
          sseClients.delete(res);
          updateClientCount();
        });
        return;
      }

      if (p === '/api/state') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(getFullPhoneState()));
        return;
      }

      if (p.startsWith('/api/cargo/file/')) {
        const name = path.basename(decodeURIComponent(p.slice('/api/cargo/file/'.length)));
        const fileAbs = path.join(computer.ensureWorkspace(), name);
        if (!fs.existsSync(fileAbs)) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(name).toLowerCase();
        const isImg = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext);
        if (!isImg || url.searchParams.get('download') === '1') {
          res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
        }
        res.end(fs.readFileSync(fileAbs));
        return;
      }

      if (p === '/api/beam' && req.method === 'POST') {
        triggerHandoffToPhone();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, onPhone: true }));
        return;
      }

      if (p === '/api/return' && req.method === 'POST') {
        const body = await readBody(req);
        let parsed = {};
        try {
          parsed = JSON.parse(body.toString('utf8'));
        } catch {
          /* ignore */
        }
        triggerRecallToLaptop(parsed.yPct);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, onPhone: false }));
        return;
      }

      if (p === '/api/upload' && req.method === 'POST') {
        const body = await readBody(req);
        const payload = JSON.parse(body.toString('utf8'));
        let item;
        if (payload.base64 && payload.fileName) {
          const safeName = path.basename(String(payload.fileName));
          const dest = path.join(computer.ensureWorkspace(), safeName);
          const buf = Buffer.from(payload.base64, 'base64');
          fs.writeFileSync(dest, buf, { mode: 0o600 });
          item = stageFileCargo(dest, 'pixel10');
        } else if (payload.text) {
          const text = String(payload.text).trim();
          clipboard.writeText(text);
          const stampName = `pixel10-note-${Date.now().toString(36)}.md`;
          computer.writeFile(stampName, text + '\n');
          item = addCargoItem({
            kind: /^https?:\/\/\S+$/i.test(text) ? 'url' : 'text',
            title: payload.title || 'From Pixel 10 (' + text.slice(0, 32) + ')',
            text,
            fileName: stampName,
            size: Buffer.byteLength(text),
            origin: 'pixel10',
          });
        }
        if (item && callbacks.onPhoneCargoReceived) {
          callbacks.onPhoneCargoReceived(item);
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, item, cargo: portalState.cargo }));
        return;
      }

      if (p === '/api/chat' && req.method === 'POST') {
        const body = await readBody(req);
        const payload = JSON.parse(body.toString('utf8'));
        const text = String(payload.text || '').trim();
        if (!text) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: 'empty prompt' }));
          return;
        }
        const reply = await callbacks.onPhoneChat(text);
        broadcast('chat-sync', getFullPhoneState());
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, reply, state: getFullPhoneState() }));
        return;
      }

      if (p === '/api/avatar' && req.method === 'POST') {
        const body = await readBody(req);
        const payload = JSON.parse(body.toString('utf8'));
        if (callbacks.onPhoneAvatarUpdate && payload.avatar) {
          callbacks.onPhoneAvatarUpdate(payload);
        }
        broadcast('state-sync', getFullPhoneState());
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, state: getFullPhoneState() }));
        return;
      }

      res.statusCode = 404;
      res.end('Not found');
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(err.message || err) }));
    }
  });

  server.on('upgrade', (req, socket) => {
    if (!portalAuth.checkRequest(req, portalToken()).ok) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = crypto
      .createHash('sha1')
      .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
      .digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n')
    );

    wsClients.add(socket);
    updateClientCount();

    const initPacket = JSON.stringify({ event: 'init', data: getFullPhoneState(), ts: Date.now() });
    socket.write(encodeWsFrame(initPacket));

    let rxBuf = Buffer.alloc(0);
    socket.on('data', (chunk) => {
      rxBuf = Buffer.concat([rxBuf, chunk]);
      const { messages, remaining } = decodeWsFrames(rxBuf);
      rxBuf = remaining;
      for (const m of messages) {
        if (m.type === 'close') {
          socket.end();
          wsClients.delete(socket);
          updateClientCount();
        } else if (m.type === 'text') {
          handleWsMessage(m.data);
        }
      }
    });

    const cleanup = () => {
      if (wsClients.delete(socket)) updateClientCount();
    };
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });

  server.on('error', (err) => {
    console.error('portal server error', err.message);
  });

  boundHost = portalAuth.pickBindHost(getAddresses());
  server.listen(PORTAL_PORT, boundHost, () => {
    console.log(`portal server listening on ${boundHost}:${PORTAL_PORT} (token required)`);
  });

  return getPortalSummary();
}

function getFullPhoneState() {
  const snap = callbacks.getSnapshot ? callbacks.getSnapshot() : {};
  return {
    onPhone: portalState.onPhone,
    edgeActive: portalState.edgeActive,
    penetration: portalState.penetration,
    yPct: portalState.yPct,
    cargo: portalState.cargo,
    bot: snap.bot || { name: 'Zoth', job: 'Sovereign desk companion' },
    maskOn: snap.maskOn !== false,
    ring: snap.ring || { ring: 2, name: 'TOOLMASTER' },
    vitals: snap.vitals || {},
    engine: snap.engine || 'grok',
    provider: snap.provider || 'grok',
    model: snap.model || 'grok-4.7',
    chat: snap.chat || [],
  };
}

function notifyStateSync() {
  broadcast('state', getFullPhoneState());
}

module.exports = {
  PORTAL_PORT,
  start,
  getAddresses,
  getPortalSummary,
  addCargoItem,
  stageFileCargo,
  stageClipboardCargo,
  clearCargo,
  updateLaptopEdgeDrag,
  triggerHandoffToPhone,
  triggerRecallToLaptop,
  notifyStateSync,
};
