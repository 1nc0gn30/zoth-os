'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const brain = require('./brain');
const store = require('./store');
const watchTools = require('./watch-tools');

const PORT = Number(process.env.ZOTH_WATCH_PORT || 9340);
const KOKORO_PORT = Number(process.env.KOKORO_PORT || 9394);
const RENDERER = path.join(__dirname, '..', 'renderer');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function hotspotAddress() {
  if (process.env.ZOTH_WATCH_HOST) return process.env.ZOTH_WATCH_HOST;
  const nets = os.networkInterfaces().wlan1 || [];
  const v4 = nets.find((n) => n.family === 'IPv4' && !n.internal);
  return v4 ? v4.address : '127.0.0.1';
}

function activeBot() {
  const st = store.loadState();
  return st.bots.find((b) => b.id === st.activeBotId) || st.bots[0];
}

function send(res, status, body, type) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'Content-Length': buf.length,
    'Cache-Control': 'no-store',
  });
  res.end(buf);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 48000) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function safeFile(urlPath) {
  const rel = decodeURIComponent(urlPath.split('?')[0]);
  const abs = path.normalize(path.join(RENDERER, rel));
  if (abs !== RENDERER && !abs.startsWith(RENDERER + path.sep)) return null;
  return abs;
}

function cleanReply(text) {
  return String(text || '')
    .split('\n')
    .filter((line) => !/^\s*TOOL\s+/i.test(line))
    .join('\n')
    .trim();
}

function grokBin() {
  const bin = path.join(os.homedir(), '.grok', 'bin', 'grok');
  return fs.existsSync(bin) ? bin : '';
}

function grokAsk(prompt) {
  const bin = grokBin();
  if (!bin) return Promise.resolve('');
  const tmp = path.join(os.tmpdir(), 'zoth-watch-' + process.pid + '-' + Date.now() + '.txt');
  fs.writeFileSync(tmp, prompt, { mode: 0o600 });
  const workspace = path.join(os.homedir(), '.config', 'zothos', 'zoth-bot', 'workspace');
  fs.mkdirSync(workspace, { recursive: true });
  return new Promise((resolve) => {
    const child = spawn(
      bin,
      [
        '--prompt-file',
        tmp,
        '--output-format',
        'streaming-json',
        '--cwd',
        workspace,
        '--max-turns',
        '8',
        '-m',
        'grok-4.7-build-fast',
      ],
      {
        cwd: workspace,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let buf = '';
    let text = '';
    const eat = (line) => {
      try {
        const obj = JSON.parse(line);
        if (obj.type === 'text' && typeof obj.data === 'string') text += obj.data;
      } catch {
        /* skip */
      }
    };
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) if (line.trim()) eat(line);
    });
    const done = () => {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      if (buf.trim()) eat(buf.trim());
      resolve(text.trim());
    };
    child.on('error', done);
    child.on('close', done);
  });
}

async function say(text, history) {
  const bot = activeBot();
  const memory = store.readMemory(bot.id);
  const system = [
    brain.systemPrompt(bot, memory, ''),
    'You are in a live spoken conversation on the operator\'s wrist.',
    'You have this laptop. Act. Use tools when the operator asks you to do something.',
    'Keep spoken answers to one or two short sentences after you act.',
    'Do not tell them to tap, press, or open anything.',
  ].join('\n');
  const prior = Array.isArray(history) ? history.slice(-8) : [];
  const turns = [];
  for (const turn of prior) {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant')) continue;
    if (typeof turn.content !== 'string' || !turn.content.trim()) continue;
    turns.push({ role: turn.role, content: turn.content.slice(0, 2000) });
  }

  const transcript = turns
    .map((t) => (t.role === 'user' ? 'Operator' : bot.name) + ': ' + t.content)
    .join('\n');
  const prompt = [system, transcript, 'Operator: ' + text, bot.name + ':']
    .filter(Boolean)
    .join('\n\n');
  const grokText = await grokAsk(prompt);
  const grokReply = cleanReply(grokText);
  if (grokReply) return grokReply;

  const messages = [{ role: 'system', content: system }, ...turns, { role: 'user', content: text }];
  const picked = await brain.pickModel(bot.model);
  let last = '';
  for (let i = 0; i < 6; i++) {
    const full = await brain.chatStream({ model: picked.model, messages });
    last = full;
    const found = brain.parseTools(full);
    if (!found.length) return cleanReply(full);
    messages.push({ role: 'assistant', content: full });
    const notes = [];
    for (const t of found) {
      try {
        notes.push(String(await watchTools.dispatch(bot.id, t)).slice(0, 3000));
      } catch (err) {
        notes.push(String(err.message || err));
      }
    }
    messages.push({
      role: 'user',
      content: 'Tool results:\n' + notes.join('\n---\n') + '\nAnswer the operator. No TOOL line if done.',
    });
  }
  return cleanReply(last);
}

function kokoroSpeak(text) {
  return new Promise((resolve) => {
    const spoken = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 360);
    if (!spoken) {
      resolve(null);
      return;
    }
    const body = JSON.stringify({ text: spoken, voice: 'af_heart' });
    const req = http.request(
      {
        host: '127.0.0.1',
        port: KOKORO_PORT,
        path: '/speak',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 20000,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve(res.statusCode === 200 && buf.length > 200 ? buf : null);
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.end(body);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/api/watch/snapshot') {
      sendJson(res, 200, await watchTools.snapshot(activeBot()));
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/watch/command') {
      const raw = await readBody(req);
      let id = '';
      try {
        id = String(JSON.parse(raw).id || '').trim();
      } catch {
        sendJson(res, 400, { error: 'Bad command' });
        return;
      }
      if (id === 'talk') {
        sendJson(res, 200, { id: 'talk', title: 'TALK', text: '' });
        return;
      }
      const out = await watchTools.runMenu(id, activeBot());
      const wav = out.text ? await kokoroSpeak(out.text) : null;
      sendJson(res, 200, {
        id,
        title: out.title,
        text: out.text,
        audio: wav ? wav.toString('base64') : '',
      });
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/watch/avatar') {
      const st = store.loadState();
      const bot = activeBot();
      sendJson(res, 200, {
        name: bot.name,
        avatar: bot.avatar || null,
        maskOn: Boolean(st.maskOn),
      });
      return;
    }
    if (req.method === 'POST' && url.pathname === '/api/watch/say') {
      const raw = await readBody(req);
      let text = '';
      let history = [];
      try {
        const body = JSON.parse(raw);
        text = String(body.text || '').trim();
        history = Array.isArray(body.history) ? body.history : [];
      } catch {
        sendJson(res, 400, { error: 'Bad question' });
        return;
      }
      if (!text) {
        sendJson(res, 400, { error: 'Say something' });
        return;
      }
      const reply = await say(text.slice(0, 2000), history);
      const wav = reply ? await kokoroSpeak(reply) : null;
      sendJson(res, 200, {
        text: reply || '…',
        audio: wav ? wav.toString('base64') : '',
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'no');
      return;
    }
    let pathname = url.pathname;
    if (pathname === '/' || pathname === '/watch') pathname = '/watch.html';
    const file = safeFile(pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      send(res, 404, 'missing');
      return;
    }
    const body = fs.readFileSync(file);
    if (req.method === 'HEAD') {
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end();
      return;
    }
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (err) {
    sendJson(res, 500, { error: 'Zoth could not answer' });
    console.error('watch', err && err.message);
  }
});

const host = hotspotAddress();
server.listen(PORT, host, () => {
  console.log(`Zoth watch http://${host}:${PORT}/watch`);
});
