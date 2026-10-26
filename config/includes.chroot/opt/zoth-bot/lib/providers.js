'use strict';

// Provider registry. "cli" backends are the original harnesses (Grok CLI,
// Hermes Agent, native Ollama loop); "sdk" backends call APIs directly via
// the Vercel AI SDK.
const PROVIDERS = {
  grok: { kind: 'cli', engine: 'grok', label: 'xAI Grok CLI', defaultModel: 'grok-4.7' },
  nous: { kind: 'cli', engine: 'hermes', label: 'Hermes · Nous', defaultModel: null },
  copilot: { kind: 'cli', engine: 'hermes', label: 'Hermes · Copilot', defaultModel: null },
  ollama: { kind: 'cli', engine: 'hermes', label: 'Hermes · Ollama', defaultModel: null },
  native: { kind: 'cli', engine: 'ollama', label: 'Native Ollama loop', defaultModel: 'zoth-model:latest' },
  xai: { kind: 'sdk', label: 'xAI API', env: ['XAI_API_KEY'], defaultModel: 'grok-4', pkg: '@ai-sdk/xai', factory: 'createXai' },
  openai: { kind: 'sdk', label: 'OpenAI API', env: ['OPENAI_API_KEY'], defaultModel: 'gpt-5', pkg: '@ai-sdk/openai', factory: 'createOpenAI' },
  anthropic: { kind: 'sdk', label: 'Anthropic API', env: ['ANTHROPIC_API_KEY'], defaultModel: 'claude-sonnet-4-5', pkg: '@ai-sdk/anthropic', factory: 'createAnthropic' },
  google: { kind: 'sdk', label: 'Google Gemini API', env: ['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY'], defaultModel: 'gemini-2.5-flash', pkg: '@ai-sdk/google', factory: 'createGoogleGenerativeAI' },
  'ollama-sdk': { kind: 'sdk', label: 'Ollama (AI SDK, local)', env: [], keyless: true, defaultModel: 'qwen2.5:1.5b', pkg: 'ollama-ai-provider-v2', factory: 'createOllama' },
};

const ALIASES = {
  'grok-cli': 'grok', hermes: 'nous', local: 'native', claude: 'anthropic', gemini: 'google',
  gpt: 'openai', 'xai-api': 'xai', 'grok-api': 'xai', 'ollama-api': 'ollama-sdk',
};

function normalize(name) {
  const n = String(name || '').trim().toLowerCase();
  if (PROVIDERS[n]) return n;
  if (ALIASES[n]) return ALIASES[n];
  return null;
}

function get(name) {
  const id = normalize(name);
  return id ? { id, ...PROVIDERS[id] } : null;
}

function list() {
  return Object.keys(PROVIDERS).map((id) => ({ id, ...PROVIDERS[id] }));
}

// keyLookup(id, envNames) -> string|null. Returns the resolved selection.
function select(state, keyLookup = () => null) {
  const p = get(state && state.provider) || get('nous');
  const out = { id: p.id, kind: p.kind, engine: p.engine || 'sdk', label: p.label };
  out.model = (state && state.model && modelFits(p.id, state.model)) ? state.model : p.defaultModel;
  if (p.kind === 'sdk') {
    const hasKey = p.keyless || !!keyLookup(p.id, p.env);
    out.ready = hasKey;
    if (!hasKey) out.reason = `no API key for ${p.id} (set ${p.env.join(' or ')} or /key ${p.id} <key>)`;
  } else {
    out.ready = true;
  }
  return out;
}

function modelFits(id, model) {
  const m = String(model || '');
  if (!m) return false;
  switch (id) {
    case 'grok': case 'xai': return m.startsWith('grok');
    case 'nous': return m.includes('/');
    case 'openai': return /^(gpt|o\d|chatgpt)/.test(m);
    case 'anthropic': return m.startsWith('claude');
    case 'google': return m.startsWith('gemini');
    case 'copilot': return !m.includes('/');
    default: return !m.includes('/');
  }
}

async function createModel(id, model, apiKey, opts = {}) {
  const p = get(id);
  if (!p || p.kind !== 'sdk') throw new Error('not an SDK provider: ' + id);
  const mod = await import(p.pkg);
  const factory = mod[p.factory];
  const settings = {};
  if (apiKey) settings.apiKey = apiKey;
  if (p.id === 'ollama-sdk') settings.baseURL = opts.ollamaBaseURL || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
  return factory(settings)(model || p.defaultModel);
}

module.exports = { PROVIDERS, list, get, normalize, select, modelFits, createModel };
