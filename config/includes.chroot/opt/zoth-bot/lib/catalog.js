'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const brain = require('./brain');

const HERMES_HOME = path.join(os.homedir(), '.hermes');
const AUTH = path.join(HERMES_HOME, 'auth.json');
const CACHE = path.join(HERMES_HOME, 'provider_models_cache.json');
const DISK = path.join(os.homedir(), '.config', 'zothos', 'zoth-bot', 'catalog.json');
const TTL_MS = 10 * 60 * 1000;

const grok = require('./grok');

const PROVIDERS = [
  { id: 'grok', label: 'Grok', hermes: null, engine: 'grok' },
  { id: 'nous', label: 'Nous', hermes: 'nous', engine: 'hermes' },
  { id: 'copilot', label: 'Copilot', hermes: 'copilot', engine: 'hermes' },
  { id: 'ollama', label: 'Ollama', hermes: 'custom', engine: 'hermes' },
  { id: 'native', label: 'Native', hermes: null, engine: 'ollama' },
];

let mem = null;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function tokenFrom(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of ['access_token', 'api_key', 'token', 'key', 'bearer', 'agent_key']) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 8) return v;
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const t = tokenFrom(v);
      if (t) return t;
    }
  }
  return null;
}

function nousAuth() {
  const auth = readJson(AUTH, {});
  const providers = auth.providers || {};
  const pool = auth.credential_pool || {};
  const nous = providers.nous || {};
  const pooled = pool.nous;
  const token = tokenFrom(nous) || tokenFrom(pooled);
  const base =
    (typeof nous.inference_base_url === 'string' && nous.inference_base_url) ||
    'https://inference-api.nousresearch.com/v1';
  return { token, base: String(base).replace(/\/$/, '') };
}

function getJson(url, headers) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(
      url,
      { method: 'GET', headers: headers || {}, timeout: 12000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode >= 400) {
            reject(new Error('models http ' + res.statusCode));
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error('models parse'));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('models timeout'));
    });
    req.end();
  });
}

function idsFrom(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const m of list) {
    if (typeof m === 'string') out.push(m);
    else if (m && typeof m === 'object') out.push(m.id || m.name || '');
  }
  return out.filter(Boolean);
}

function cleanNous(ids) {
  return ids.filter((id) => {
    const s = String(id).toLowerCase();
    if (s.endsWith(':batch')) return false;
    if (s.includes('embed')) return false;
    if (s.includes('nano-banana')) return false;
    if (s.includes('voyage')) return false;
    if (s.includes('sentence-transformers')) return false;
    if (s.includes('/gte-') || s.includes('/e5-') || s.includes('/bge-')) return false;
    return true;
  });
}

function cleanCopilot(ids) {
  return ids.filter((id) => {
    const s = String(id).toLowerCase();
    if (s.startsWith('copilot-search')) return false;
    if (s.startsWith('exec-agent')) return false;
    if (s.includes('trajectory-compaction')) return false;
    return true;
  });
}

const FEATURED = {
  grok: ['grok-4.7', 'grok-4.7-build-fast', 'grok-4.6', 'grok-4.5'],
  nous: [
    'stepfun/step-3.7-flash:free',
    'stepfun/step-3.7-flash',
    'google/gemini-4-argon',
    'x-ai/grok-4.6',
    'anthropic/claude-sonnet-4.5',
    'openai/gpt-5',
    'moonshotai/kimi-k2.5',
  ],
  copilot: ['gemini-4-argon', 'claude-sonnet-5.5', 'gpt-5.4', 'kimi-k3'],
  ollama: ['qwen2.5:1.5b', 'qwen2.5-coder:1.5b', 'zoth-model:latest', 'llama3.2:1b'],
  native: ['qwen2.5:1.5b', 'qwen2.5-coder:1.5b', 'zoth-model:latest', 'llama3.2:1b'],
};

function hermesModelDefault() {
  try {
    const raw = fs.readFileSync(path.join(HERMES_HOME, 'config.yaml'), 'utf8');
    const m = raw.match(/^\s*default:\s*["']?([^\s"']+)/m);
    const p = raw.match(/^\s*provider:\s*["']?([^\s"']+)/m);
    return {
      model: m ? String(m[1]).trim() : null,
      provider: p ? String(p[1]).trim() : null,
    };
  } catch {
    return { model: null, provider: null };
  }
}

function featuredFor(provider, list, extra) {
  const want = [...(Array.isArray(extra) ? extra : extra ? [extra] : []), ...(FEATURED[provider] || [])];
  const set = new Set(list);
  const out = [];
  const seen = new Set();
  for (const id of want) {
    if (!id || seen.has(id) || !set.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function hermesCacheModels() {
  const cache = readJson(CACHE, {});
  const out = { copilot: [], ollama: [] };
  for (const [key, val] of Object.entries(cache)) {
    const models = idsFrom(val && val.models);
    if (key === 'copilot') out.copilot = cleanCopilot(models);
    else if (key.startsWith('custom:')) out.ollama = models;
  }
  return out;
}

async function fetchNous() {
  const { token, base } = nousAuth();
  if (!token) return [];
  const data = await getJson(base + '/models', {
    Authorization: 'Bearer ' + token,
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) ZothBot/0.2',
  });
  const list = data.data || data.models || [];
  return cleanNous(idsFrom(list));
}

function attachHermesFeatured(catalog) {
  const h = hermesModelDefault();
  catalog.hermesDefault = h.model || null;
  catalog.hermesProvider = h.provider || null;
  catalog.grok = catalog.grok && catalog.grok.length ? catalog.grok : grok.GROK_MODELS;
  const nousExtra = h.provider === 'nous' && h.model ? [h.model] : [];
  catalog.featured = {
    grok: featuredFor('grok', catalog.grok || []),
    nous: featuredFor('nous', catalog.nous || [], nousExtra),
    copilot: featuredFor('copilot', catalog.copilot || []),
    ollama: featuredFor('ollama', catalog.ollama || []),
    native: featuredFor('native', catalog.ollama || []),
  };
  return catalog;
}

async function build(force) {
  const now = Date.now();
  if (!force && mem && now - mem.at < TTL_MS) return attachHermesFeatured(mem.catalog);
  const disk = readJson(DISK, null);
  if (!force && disk && now - (disk.at || 0) < TTL_MS && disk.providers) {
    mem = { at: disk.at, catalog: attachHermesFeatured(disk) };
    return mem.catalog;
  }
  const cached = hermesCacheModels();
  let ollama = [];
  try {
    ollama = await brain.listModels();
  } catch {
    ollama = cached.ollama || [];
  }
  let nous = (disk && disk.nous) || [];
  let nousErr = null;
  try {
    const live = await fetchNous();
    if (live.length) nous = live;
  } catch (err) {
    nousErr = String(err.message || err).slice(0, 120);
  }
  const catalog = attachHermesFeatured({
    at: now,
    grok: grok.GROK_MODELS,
    nous,
    nousErr,
    copilot: cached.copilot || [],
    ollama,
    providers: PROVIDERS,
  });
  try {
    fs.mkdirSync(path.dirname(DISK), { recursive: true });
    fs.writeFileSync(DISK, JSON.stringify(catalog) + '\n', { mode: 0o600 });
  } catch {
    /* ignore */
  }
  mem = { at: now, catalog };
  return catalog;
}

function shortModel(id) {
  const s = String(id || '');
  const tail = s.includes('/') ? s.split('/').pop() : s;
  return tail.length > 22 ? tail.slice(0, 20) + '…' : tail;
}

module.exports = { PROVIDERS, FEATURED, build, shortModel, featuredFor, hermesModelDefault };
