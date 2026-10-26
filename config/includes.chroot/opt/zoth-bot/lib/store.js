'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.ZOTH_BOT_ROOT || path.join(os.homedir(), '.config', 'zothos', 'zoth-bot');
const STATE_PATH = path.join(ROOT, 'state.json');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    /* ignore */
  }
}

function defaultAvatarFor(id) {
  if (id === 'foundry') {
    return {
      chassis: 'custom',
      gender: 'feminine',
      bodyType: 'athletic',
      skinColor: '#8d5534',
      faceType: 'sharp',
      eyeColor: '#38bdf8',
      hairStyle: 'buns',
      hairColor: '#e2e8f0',
      facialHair: 'none',
      accessory: 'scouter',
      maskStyle: 'visor',
      accentColor: '#38bdf8',
    };
  }
  if (id === 'sentinel') {
    return {
      chassis: 'custom',
      gender: 'construct',
      bodyType: 'titan',
      skinColor: '#222733',
      faceType: 'cyber',
      eyeColor: '#ef4444',
      hairStyle: 'mohawk',
      hairColor: '#dc2626',
      facialHair: 'none',
      accessory: 'wings',
      maskStyle: 'oni',
      accentColor: '#ef4444',
    };
  }
  return {
    chassis: 'zoth-prime',
    gender: 'masculine',
    bodyType: 'balanced',
    skinColor: '#7c4b31',
    faceType: 'stoic',
    eyeColor: '#d4af37',
    hairStyle: 'locs',
    hairColor: '#141419',
    facialHair: 'goatee',
    accessory: 'cuffs',
    maskStyle: 'azoth',
    accentColor: '#d4af37',
  };
}

function normalizeAvatar(raw, botId = 'zoth') {
  const base = defaultAvatarFor(botId);
  if (!raw || typeof raw !== 'object') return { ...base };
  return {
    chassis: ['custom', 'zoth-prime'].includes(raw.chassis) ? raw.chassis : base.chassis,
    gender: ['masculine', 'feminine', 'androgynous', 'construct'].includes(raw.gender)
      ? raw.gender
      : base.gender,
    bodyType: ['balanced', 'athletic', 'slender', 'titan', 'compact'].includes(raw.bodyType)
      ? raw.bodyType
      : base.bodyType,
    skinColor: typeof raw.skinColor === 'string' && raw.skinColor.startsWith('#') ? raw.skinColor : base.skinColor,
    faceType: ['stoic', 'sharp', 'serene', 'cyber', 'oracle'].includes(raw.faceType)
      ? raw.faceType
      : base.faceType,
    eyeColor: typeof raw.eyeColor === 'string' && raw.eyeColor.startsWith('#') ? raw.eyeColor : base.eyeColor,
    hairStyle: ['locs', 'fade', 'slick', 'long', 'buns', 'mohawk', 'afro', 'bald'].includes(raw.hairStyle)
      ? raw.hairStyle
      : base.hairStyle,
    hairColor: typeof raw.hairColor === 'string' && raw.hairColor.startsWith('#') ? raw.hairColor : base.hairColor,
    facialHair: ['none', 'goatee', 'beard', 'stache', 'stubble'].includes(raw.facialHair)
      ? raw.facialHair
      : base.facialHair,
    accessory: ['cuffs', 'scouter', 'wings', 'horns', 'none'].includes(raw.accessory)
      ? raw.accessory
      : base.accessory,
    maskStyle: ['azoth', 'oni', 'visor', 'anubis', 'kitsune', 'crown', 'none'].includes(raw.maskStyle)
      ? raw.maskStyle
      : base.maskStyle,
    accentColor:
      typeof raw.accentColor === 'string' && raw.accentColor.startsWith('#') ? raw.accentColor : base.accentColor,
  };
}

function defaultBot() {
  return {
    id: 'zoth',
    name: 'Zoth',
    job: 'Sovereign desk companion',
    description:
      'Keep this machine, its agents, and the operator moving. Local first. Ask before anything that changes the system.',
    model: 'qwen2.5:1.5b',
    avatar: defaultAvatarFor('zoth'),
    created: new Date().toISOString(),
  };
}

function extraTeammates(model) {
  const m = model || 'qwen2.5:1.5b';
  const created = new Date().toISOString();
  return [
    {
      id: 'foundry',
      name: 'Foundry',
      job: 'WebGen watcher',
      description:
        'Watch 127.0.0.1:5173, help the operator prompt and recover builds. Never deploy WebGen.',
      model: m,
      avatar: defaultAvatarFor('foundry'),
      created,
    },
    {
      id: 'sentinel',
      name: 'Sentinel',
      job: 'Host pulse',
      description:
        'Watch Ollama 11434, Studio 3000, Civilization 9393, and zoth-lock status. Ask before any command.',
      model: m,
      avatar: defaultAvatarFor('sentinel'),
      created,
    },
  ];
}

function hasTeammate(st, extra) {
  const name = String(extra.name || '').toLowerCase();
  return (st.bots || []).some(
    (b) => b.id === extra.id || String(b.name || '').toLowerCase() === name
  );
}

function seedDefaultTeammates(st) {
  let dirty = false;
  for (const extra of extraTeammates(st.model)) {
    if (hasTeammate(st, extra)) continue;
    st.bots.push(extra);
    ensureBotFiles(extra);
    dirty = true;
  }
  for (const b of st.bots || []) {
    const norm = normalizeAvatar(b.avatar, b.id);
    if (!b.avatar || JSON.stringify(b.avatar) !== JSON.stringify(norm)) {
      b.avatar = norm;
      dirty = true;
    }
  }
  if (dirty) saveState(st);
  return st;
}

function defaultState() {
  const zoth = defaultBot();
  return {
    v: 1,
    activeBotId: 'zoth',
    alwaysOnTop: true,
    compact: true,
    x: null,
    y: null,
    model: 'qwen2.5:1.5b',
    bots: [zoth, ...extraTeammates(zoth.model)],
    jobs: [],
    goals: [],
    engine: 'hermes',
    provider: 'nous',
    maskOn: true,
  };
}

function loadState() {
  ensureDir(ROOT);
  const raw = readJson(STATE_PATH, null);
  if (!raw || !Array.isArray(raw.bots) || raw.bots.length === 0) {
    const st = defaultState();
    writeJson(STATE_PATH, st);
    for (const bot of st.bots) ensureBotFiles(bot);
    return st;
  }
  if (!raw.bots.some((b) => b.id === raw.activeBotId)) {
    raw.activeBotId = raw.bots[0].id;
  }
  if (!raw.engine) raw.engine = 'hermes';
  if (!raw.provider) raw.provider = raw.engine === 'ollama' ? 'native' : 'nous';
  if (typeof raw.maskOn !== 'boolean') raw.maskOn = true;
  if (!Array.isArray(raw.goals)) raw.goals = [];
  seedDefaultTeammates(raw);
  return raw;
}

function saveState(st) {
  writeJson(STATE_PATH, st);
}

function botDir(id) {
  return path.join(ROOT, 'bots', id.replace(/[^a-z0-9_-]/gi, '_'));
}

function ensureBotFiles(bot) {
  const dir = botDir(bot.id);
  ensureDir(dir);
  const mem = path.join(dir, 'memory.md');
  if (!fs.existsSync(mem)) {
    fs.writeFileSync(
      mem,
      `# ${bot.name}\n\nJob: ${bot.job}\n\n## Memory\n\n(empty)\n`,
      { mode: 0o600 }
    );
  }
  const chat = path.join(dir, 'chat.jsonl');
  if (!fs.existsSync(chat)) fs.writeFileSync(chat, '', { mode: 0o600 });
}

function memoryPath(id) {
  return path.join(botDir(id), 'memory.md');
}

function chatPath(id) {
  return path.join(botDir(id), 'chat.jsonl');
}

function readMemory(id) {
  try {
    return fs.readFileSync(memoryPath(id), 'utf8');
  } catch {
    return '';
  }
}

function appendMemory(id, line) {
  ensureDir(botDir(id));
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  fs.appendFileSync(memoryPath(id), `- ${stamp} ${line.trim()}\n`);
}

function appendChat(id, role, content) {
  ensureDir(botDir(id));
  fs.appendFileSync(
    chatPath(id),
    JSON.stringify({ t: new Date().toISOString(), role, content }) + '\n'
  );
}

function recentChat(id, limit = 16) {
  try {
    const lines = fs.readFileSync(chatPath(id), 'utf8').trim().split('\n').filter(Boolean);
    return lines.slice(-limit).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function clearChat(id) {
  ensureDir(botDir(id));
  fs.writeFileSync(chatPath(id), '', { mode: 0o600 });
}

function addGoal(botId, text) {
  const st = loadState();
  st.goals = st.goals || [];
  st.goals.push({
    id: 'goal-' + Date.now().toString(36),
    botId,
    text: String(text || '').trim().slice(0, 240),
    status: 'active',
    created: new Date().toISOString(),
  });
  saveState(st);
  return st.goals[st.goals.length - 1];
}

function completeGoal(goalId) {
  const st = loadState();
  st.goals = (st.goals || []).map((g) => (g.id === goalId ? { ...g, status: 'done' } : g));
  saveState(st);
}

function createBot({ name, job, description, model, avatar }) {
  const st = loadState();
  const id = (name || 'bot')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24) + '-' + crypto.randomBytes(2).toString('hex');
  const bot = {
    id,
    name: (name || 'Teammate').trim().slice(0, 40),
    job: (job || 'Generalist').trim().slice(0, 80),
    description: (description || '').trim().slice(0, 600),
    model: model || st.model,
    avatar: normalizeAvatar({ chassis: 'custom', ...(avatar || {}) }, id),
    created: new Date().toISOString(),
  };
  st.bots.push(bot);
  st.activeBotId = bot.id;
  ensureBotFiles(bot);
  saveState(st);
  return { state: st, bot };
}

function updateBot(id, patch = {}) {
  const st = loadState();
  const targetId = id || st.activeBotId;
  const bot = (st.bots || []).find((b) => b.id === targetId);
  if (!bot) return { state: st, bot: st.bots[0] };
  if (typeof patch.name === 'string' && patch.name.trim()) {
    bot.name = patch.name.trim().slice(0, 40);
  }
  if (typeof patch.job === 'string' && patch.job.trim()) {
    bot.job = patch.job.trim().slice(0, 80);
  }
  if (typeof patch.description === 'string') {
    bot.description = patch.description.trim().slice(0, 600);
  }
  if (typeof patch.model === 'string' && patch.model.trim()) {
    bot.model = patch.model.trim();
  }
  if (patch.avatar && typeof patch.avatar === 'object') {
    bot.avatar = normalizeAvatar({ ...(bot.avatar || {}), ...patch.avatar }, bot.id);
  }
  saveState(st);
  return { state: st, bot };
}

module.exports = {
  ROOT,
  loadState,
  saveState,
  ensureBotFiles,
  readMemory,
  appendMemory,
  appendChat,
  recentChat,
  clearChat,
  createBot,
  updateBot,
  normalizeAvatar,
  defaultAvatarFor,
  addGoal,
  completeGoal,
  memoryPath,
};
