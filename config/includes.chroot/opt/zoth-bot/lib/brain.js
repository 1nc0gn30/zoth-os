'use strict';

const http = require('http');

const OLLAMA = process.env.ZOTH_BOT_OLLAMA || '127.0.0.1';
const OLLAMA_PORT = Number(process.env.ZOTH_BOT_OLLAMA_PORT || 11434);

const FALLBACK_MODELS = ['qwen2.5:1.5b', 'zoth-model:latest', 'llama3.2:1b', 'qwen2.5:0.5b'];

function systemPrompt(bot, memory, hostBrief) {
  return [
    `You are ${bot.name}, a Zoth Bot on Zoth OS.`,
    `Job: ${bot.job}.`,
    bot.description ? `How you work: ${bot.description}` : '',
    'You live on this laptop. This machine is the computer — there is no cloud VM.',
    'You are not Grok Bot, Muse, or a Dot. You do not pretend to be them.',
    'Speak in short, direct sentences. No filler. Gold, not glitter.',
    'Never invent a buyer, never send mail, never deploy, never push unless the operator says so.',
    'If an action would change the system, say you need approval and name the action.',
    'You may emit tool lines when they help, each on its own line, then stop and wait for results:',
    'TOOL host_status',
    'TOOL lock_status',
    'TOOL ring_status',
    'TOOL mcp_list',
    'TOOL models',
    'TOOL screenshot',
    'TOOL clipboard_read',
    'TOOL clipboard_write <text>',
    'TOOL agent_os <natural instruction>',
    'TOOL remember <one sentence>',
    'TOOL goal <one sentence>',
    'TOOL list_dir [rel]',
    'TOOL read_file <rel>',
    'TOOL write_file <rel> | <body>',
    'TOOL fetch <http-url>',
    'TOOL open_url http://127.0.0.1:<port>',
    'TOOL run <command>',
    hostBrief ? `Host now:\n${hostBrief}` : '',
    memory ? `Memory:\n${memory.slice(0, 1800)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function postJson(pathname, body, { stream } = {}) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: OLLAMA,
        port: OLLAMA_PORT,
        path: pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: 120000,
      },
      (res) => {
        if (stream) {
          resolve(res);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve({ raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ollama timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function listModels() {
  return new Promise((resolve) => {
    const req = http.request(
      { host: OLLAMA, port: OLLAMA_PORT, path: '/api/tags', method: 'GET', timeout: 3000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            resolve((data.models || []).map((m) => m.name));
          } catch {
            resolve([]);
          }
        });
      }
    );
    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
    req.end();
  });
}

async function pickModel(preferred) {
  const names = await listModels();
  const order = [preferred, ...FALLBACK_MODELS].filter(Boolean);
  for (const name of order) {
    if (names.includes(name) || names.some((n) => n.startsWith(name.split(':')[0]))) {
      const exact = names.includes(name) ? name : names.find((n) => n.startsWith(name.split(':')[0]));
      if (exact) return { model: exact, available: names };
    }
  }
  return { model: names[0] || preferred || 'zoth-model:latest', available: names };
}

async function chatStream({ model, messages, onToken }) {
  const res = await postJson('/api/chat', { model, messages, stream: true }, { stream: true });
  let buf = '';
  let full = '';
  await new Promise((resolve, reject) => {
    res.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          const piece = (obj.message && obj.message.content) || obj.response || '';
          if (piece) {
            full += piece;
            if (onToken) onToken(piece);
          }
          if (obj.done) resolve();
        } catch {
          /* ignore partial */
        }
      }
    });
    res.on('end', resolve);
    res.on('error', reject);
  });
  return full;
}

function parseTools(text) {
  const tools = [];
  const lines = String(text || '').split('\n');
  for (const line of lines) {
    const m = line.trim().match(/^TOOL\s+(\w+)(?:\s+(.+))?$/i);
    if (!m) continue;
    tools.push({ name: m[1].toLowerCase(), arg: (m[2] || '').trim() });
  }
  return tools;
}

module.exports = {
  systemPrompt,
  listModels,
  pickModel,
  chatStream,
  parseTools,
};
