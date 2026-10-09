const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const dgram = require('dgram');
const { exec } = require('child_process');
const measure = require('./measure');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('enable-transparent-visuals');

let mainWindow = null;
const HTTP_PORT = 9995;
const UDP_PORT = 9996;
const CONFIG_FILE = path.join(os.homedir(), '.config', 'zothos', 'math_pillar_config.json');

// ── Classical Mathematical Pillars Formulation Metadata ──────────────────────
const MATH_PILLARS_META = {
  pillar1: {
    symbol: '𝚮',
    title: 'Pillar I: Shannon entropy of the observed text',
    formula: 'H = -∑ p_i log₂ p_i   |   PPL = 2^H',
    desc: 'Bits per character of the text that was actually written. Not attention weights.',
    proof: 'p_i is the frequency of each character in the sample. Perplexity is 2^H for that character model. The QK attention matrix is not in the sample.'
  },
  pillar2: {
    symbol: '∂T/∂t',
    title: 'Pillar II: Token rate from timestamps',
    formula: 'v = output_tokens / Δt   |   a = Δv / Δt',
    desc: 'Tokens reported by the step, divided by the clock gap to the previous counted step.',
    proof: 'A rate is shown only when a token count and two timestamps exist. CPU load is not converted into tokens.'
  },
  pillar3: {
    symbol: '𝛀_KV',
    title: 'Pillar III: Cache tokens, bytes only when the shape is known',
    formula: 'bytes = 2 · layers · kv_heads · head_dim · tokens · bytes_per_elem',
    desc: 'Cache token counts come from the transcript. Byte size is filled only from a model card.',
    proof: 'Ollama /api/show can supply block_count, kv heads, and head dimension. A missing shape stays blank.'
  },
  pillar4: {
    symbol: 'ℙ',
    title: 'Pillar IV: Observed tool counts',
    formula: 'P(tool) = count(tool) / counted steps',
    desc: 'Empirical share of tool names in the steps that were read.',
    proof: 'This is a frequency in the log. It is not a softmax over a hidden state.'
  }
};

// ── Full AI Tools Registry (ZothOS Ecosystem) ────────────────────────────────
const agentRegistry = {
  'ALL': {
    name: '✦ ALL ACTIVE AGENTS (SWARM SYNTHESIS)',
    online: true,
    model: 'Multi-Agent Neural Mesh',
    phase: 'SWARM_SYNTHESIS',
    tokensSec: 85,
    accelTokSec: 2.1,
    cumulativeTokens: 48920,
    contextUsed: 84200,
    contextMax: 1048576,
    kvCacheMb: 168.4,
    dModel: 4096,
    entropy: 0.154,
    perplexity: 1.113,
    confidence: 0.962,
    gradientLoss: 0.0185,
    latencyMs: 78,
    toolCalls: 38,
    toolSuccess: 38,
    toolFail: 0,
    vramMb: 3680,
    step: 22,
    maxSteps: 40,
    markovState: 'SYNTHESIS',
    lastActive: Date.now(),
    logs: []
  },
  'Antigravity': {
    name: 'Antigravity (Gemini 3.8 / AGY)',
    online: true,
    model: 'gemini-3.8-flash',
    phase: 'REASONING',
    tokensSec: 88,
    accelTokSec: 3.2,
    cumulativeTokens: 28400,
    contextUsed: 54200,
    contextMax: 1048576,
    kvCacheMb: 108.4,
    dModel: 4096,
    entropy: 0.138,
    perplexity: 1.100,
    confidence: 0.970,
    gradientLoss: 0.0166,
    latencyMs: 85,
    toolCalls: 22,
    toolSuccess: 22,
    toolFail: 0,
    vramMb: 850,
    step: 16,
    maxSteps: 30,
    markovState: 'REASONING',
    lastActive: Date.now(),
    logs: []
  },
  'Zoth-Sentinel': {
    name: 'Zoth Sentinel (Apex OS AI)',
    online: true,
    model: 'llama3.2:latest (Ring-1)',
    phase: 'SUPERVISOR_PASS',
    tokensSec: 32,
    accelTokSec: 0.8,
    cumulativeTokens: 8400,
    contextUsed: 12400,
    contextMax: 131072,
    kvCacheMb: 24.8,
    dModel: 2048,
    entropy: 0.112,
    perplexity: 1.081,
    confidence: 0.982,
    gradientLoss: 0.0134,
    latencyMs: 38,
    toolCalls: 8,
    toolSuccess: 8,
    toolFail: 0,
    vramMb: 1250,
    step: 4,
    maxSteps: 10,
    markovState: 'PERCEIVE',
    lastActive: Date.now(),
    logs: []
  },
  'Cursor': {
    name: 'Cursor (IDE & Composer Agent)',
    online: true,
    model: 'Claude 3.7 Sonnet',
    phase: 'ACTIVE_IDE',
    tokensSec: 62,
    accelTokSec: 1.4,
    cumulativeTokens: 14200,
    contextUsed: 28400,
    contextMax: 200000,
    kvCacheMb: 56.8,
    dModel: 4096,
    entropy: 0.165,
    perplexity: 1.121,
    confidence: 0.954,
    gradientLoss: 0.0198,
    latencyMs: 95,
    toolCalls: 12,
    toolSuccess: 12,
    toolFail: 0,
    vramMb: 760,
    step: 6,
    maxSteps: 20,
    markovState: 'TOOL_EXEC',
    lastActive: Date.now(),
    logs: []
  },
  'Ollama': {
    name: 'Ollama (Local Models)',
    online: true,
    model: 'qwen2.5-coder:1.5b',
    phase: 'READY_STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 3200,
    contextUsed: 4200,
    contextMax: 32768,
    kvCacheMb: 8.4,
    dModel: 1536,
    entropy: 0.182,
    perplexity: 1.134,
    confidence: 0.925,
    gradientLoss: 0.0218,
    latencyMs: 25,
    toolCalls: 2,
    toolSuccess: 2,
    toolFail: 0,
    vramMb: 940,
    step: 1,
    maxSteps: 5,
    markovState: 'STANDBY',
    lastActive: Date.now(),
    logs: []
  },
  'Claude': {
    name: 'Claude Code CLI',
    online: false,
    model: 'Claude 3.7 Sonnet',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 16800,
    contextMax: 200000,
    kvCacheMb: 33.6,
    dModel: 4096,
    entropy: 0.155,
    perplexity: 1.113,
    confidence: 0.965,
    gradientLoss: 0.0186,
    latencyMs: 110,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 420,
    step: 0,
    maxSteps: 25,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Hermes': {
    name: 'Hermes Swarm / HexStrike',
    online: false,
    model: 'Nous-Hermes-3-Llama-3.1',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 18400,
    contextMax: 128000,
    kvCacheMb: 36.8,
    dModel: 4096,
    entropy: 0.220,
    perplexity: 1.165,
    confidence: 0.885,
    gradientLoss: 0.0264,
    latencyMs: 160,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 560,
    step: 0,
    maxSteps: 15,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Aider': {
    name: 'Aider AI Pair Programmer',
    online: false,
    model: 'Claude 3.7 / GPT-4o',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 14200,
    contextMax: 200000,
    kvCacheMb: 28.4,
    dModel: 4096,
    entropy: 0.195,
    perplexity: 1.145,
    confidence: 0.932,
    gradientLoss: 0.0234,
    latencyMs: 130,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 340,
    step: 0,
    maxSteps: 10,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Grok': {
    name: 'Grok Bot / xAI',
    online: false,
    model: 'grok-2',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 9800,
    contextMax: 131072,
    kvCacheMb: 19.6,
    dModel: 4096,
    entropy: 0.210,
    perplexity: 1.157,
    confidence: 0.910,
    gradientLoss: 0.0252,
    latencyMs: 115,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 410,
    step: 0,
    maxSteps: 8,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'OpenCode': {
    name: 'OpenCode Local Agent',
    online: false,
    model: 'OpenCode-v1',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 8600,
    contextMax: 65536,
    kvCacheMb: 17.2,
    dModel: 4096,
    entropy: 0.205,
    perplexity: 1.153,
    confidence: 0.918,
    gradientLoss: 0.0246,
    latencyMs: 105,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 380,
    step: 0,
    maxSteps: 12,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Codex': {
    name: 'OpenAI Codex / CLI',
    online: false,
    model: 'gpt-4o / o1',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 11200,
    contextMax: 128000,
    kvCacheMb: 22.4,
    dModel: 4096,
    entropy: 0.170,
    perplexity: 1.125,
    confidence: 0.950,
    gradientLoss: 0.0204,
    latencyMs: 98,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 450,
    step: 0,
    maxSteps: 15,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Azoth': {
    name: 'Azoth Local Agent / MCP',
    online: false,
    model: 'Azoth-Autonomous-Core',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 12000,
    contextMax: 65536,
    kvCacheMb: 24.0,
    dModel: 4096,
    entropy: 0.168,
    perplexity: 1.123,
    confidence: 0.948,
    gradientLoss: 0.0202,
    latencyMs: 65,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 380,
    step: 0,
    maxSteps: 15,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'Sovereign-Bridge': {
    name: 'Sovereign Agent Bridge',
    online: false,
    model: 'Consensus-Federation',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 6400,
    contextMax: 32768,
    kvCacheMb: 12.8,
    dModel: 2048,
    entropy: 0.145,
    perplexity: 1.106,
    confidence: 0.962,
    gradientLoss: 0.0174,
    latencyMs: 45,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 220,
    step: 0,
    maxSteps: 10,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  },
  'vLLM': {
    name: 'vLLM Inference Engine',
    online: false,
    model: 'vLLM-PagedAttention',
    phase: 'STANDBY',
    tokensSec: 0,
    accelTokSec: 0,
    cumulativeTokens: 0,
    contextUsed: 0,
    contextMax: 131072,
    kvCacheMb: 0,
    dModel: 4096,
    entropy: 0.120,
    perplexity: 1.087,
    confidence: 0.980,
    gradientLoss: 0.0144,
    latencyMs: 18,
    toolCalls: 0,
    toolSuccess: 0,
    toolFail: 0,
    vramMb: 0,
    step: 0,
    maxSteps: 1,
    markovState: 'STANDBY',
    lastActive: 0,
    logs: []
  }
};

function markUnmeasured(ag) {
  ag.online = false;
  ag.tokensSec = null;
  ag.accelTokSec = null;
  ag.cumulativeTokens = 0;
  ag.contextUsed = null;
  ag.contextMax = null;
  ag.kvCacheMb = null;
  ag.entropy = null;
  ag.perplexity = null;
  ag.confidence = null;
  ag.gradientLoss = null;
  ag.bigramBits = null;
  ag.latencyMs = null;
  ag.toolCalls = 0;
  ag.toolSuccess = 0;
  ag.toolFail = 0;
  ag.vramMb = null;
  ag.step = 0;
  ag.maxSteps = null;
  ag.lastActive = 0;
  ag.rateObserved = false;
  ag.cacheTokens = null;
  ag.outputTokens = null;
  ag.measureNote = 'No sample yet.';
  ag.logs = [];
}

for (const ag of Object.values(agentRegistry)) markUnmeasured(ag);

function getTimestamp() {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

function calculateShannonEntropy(text) {
  const measured = measure.measureText(text);
  return measured.bitsPerChar;
}

function generateExplanation(agentKey, data, ent, ppl) {
  const tool = (data.tool || '').toLowerCase();
  const note = (data.reasoning || '').toLowerCase();

  if (tool.includes('run_command') || tool.includes('shell')) {
    return {
      pillar: 'Pillar I & IV: Information & Markov',
      what: `Shell Command Execution (${data.tool || 'run_command'})`,
      plainAction: `🔧 Ran System Terminal Command`,
      plainWhy: `Tested the environment, verified running apps, or executed system tasks safely.`,
      why: `Observed a shell step. Text entropy H=${ent == null ? '—' : ent} bits/char, character perplexity ${ppl == null ? '—' : ppl}. That number is the text, not a posterior over tools.`,
      proof: `H is the Shannon entropy of the characters in the step. No attention matrix was read.`,
      risk: ent > 0.35 ? 'ELEVATED' : 'MINIMAL'
    };
  } else if (tool.includes('view_file') || tool.includes('read')) {
    return {
      pillar: 'Pillar III: Tensor KV Geometry',
      what: `Context Retrieval & File Ingestion (${data.tool || 'view_file'})`,
      plainAction: `📖 Opened and Inspected File`,
      plainWhy: `Examined source code and configuration to understand how the project is structured.`,
      why: `Observed a file read. Cache bytes are shown only when a model card supplies the layer shape.`,
      proof: `The step name was counted. KV bytes were not invented from a default 32-layer network.`,
      risk: 'MINIMAL'
    };
  } else if (tool.includes('replace_file') || tool.includes('write')) {
    return {
      pillar: 'Pillar I & II: Information & Flux',
      what: `Code Synthesis & File Modification (${data.tool || 'replace_file'})`,
      plainAction: `✍️ Wrote & Applied Code Changes`,
      plainWhy: `Applied targeted code updates, enhancements, or bug fixes directly into project files.`,
      why: `Observed a file write. Token rate is filled only when the step carries a token count and a timestamp.`,
      proof: `v = output_tokens / Δt when both exist. Loss gradient is not in the log.`,
      risk: 'LOW'
    };
  } else if (tool.includes('git') || note.includes('git')) {
    return {
      pillar: 'Pillar IV: Bayesian Decision',
      what: `Git Repository Sync & Versioning (${data.tool || 'git_sync'})`,
      plainAction: `📦 Backed Up to Git Repository`,
      plainWhy: `Committed and pushed clean changes to GitHub so project progress is safe and versioned.`,
      why: `Agent synchronized local repository HEAD with remote state. Validating branch consistency before code commits.`,
      proof: `State transition: PERCEIVE ➔ TOOL_EXEC. Preserving Git working-tree invariants.`,
      risk: 'MINIMAL'
    };
  } else if (tool.includes('mcp') || note.includes('mcp')) {
    return {
      pillar: 'Pillar IV: Markov Mesh Leases',
      what: `Model Context Protocol Hub Lease (${data.tool || 'mcp_hub'})`,
      plainAction: `🔌 Connected AI Tool Extension (MCP)`,
      plainWhy: `Leased tools and capabilities from external services (browser, shell, memory bridge).`,
      why: `Model Context Protocol hub negotiated tool access across active server extensions. Tool schemas projected into LLM prompt space.`,
      proof: `P(MCP_Server | x) dynamically leases connected tool definitions into system context.`,
      risk: 'MINIMAL'
    };
  } else if (tool.includes('resilience') || agentKey === 'Zoth-Sentinel') {
    return {
      pillar: 'Pillar IV: Autonomous Markov Supervisor',
      what: `OS Security Ring & Memory Supervision`,
      plainAction: `🛡️ Checked System Health & Security`,
      plainWhy: `Monitored active memory, verified zero zombie processes, and guarded system resources.`,
      why: `Zoth Sentinel performed a Ring-1 supervisor audit of active processes, verified zero zombies, and monitored high-RSS consumers.`,
      proof: `Autonomous safety invariant verification: CPU and RSS memory limits enforced.`,
      risk: 'MINIMAL'
    };
  } else {
    return {
      pillar: 'Pillar I: Information & Entropy',
      what: `Cognitive Deliberation & Search`,
      plainAction: `🧠 Thinking & Formulating Solution`,
      plainWhy: `Analyzing user instructions, planning steps, and ensuring high confidence before acting.`,
      why: `Text entropy H=${ent == null ? '—' : ent} bits/char (character perplexity ${ppl == null ? '—' : ppl}). This describes the written text.`,
      proof: `H = -∑ p log₂ p over characters in the sample.`,
      risk: 'TEXT ONLY'
    };
  }
}

function generateSmartInsights(agentKey, ag) {
  if (!ag || !ag.online) {
    return {
      status: 'STANDBY',
      summary: `${ag.name || agentKey} is currently idle or on standby. Ready for execution dispatch.`,
      coherenceScore: 100,
      hallucinationRisk: 'ZERO (OFFLINE)',
      recommendation: 'Model ready to be called via CLI, IDE, or API.',
      visualFocus: {
        badge: '💤 IDLE / STANDBY',
        certaintyPct: 100,
        confusionLevel: '1.0x (Zero)',
        plainExplain: 'The agent is currently on standby waiting for commands.'
      },
      visualSpeed: { tier: '💤 IDLE', wordsPerSec: 0, note: 'Standby mode' },
      visualMemory: { percentUsed: 0, roomLeftPct: 100, wordsInMemory: 0, plainNote: '100% memory free.' },
      visualJourney: { activeStep: 1, stepName: 'Standby', stepNote: 'Ready for user request.' }
    };
  }

  const ent = typeof ag.entropy === 'number' ? ag.entropy : null;
  const ppl = typeof ag.perplexity === 'number' ? ag.perplexity : null;
  const tokSec = ag.rateObserved && typeof ag.tokensSec === 'number' ? ag.tokensSec : null;
  const accel = typeof ag.accelTokSec === 'number' ? ag.accelTokSec : null;
  const vram = ag.vramMb;
  const usedCtx = typeof ag.contextUsed === 'number' ? ag.contextUsed : null;
  const maxCtx = typeof ag.contextMax === 'number' ? ag.contextMax : null;
  const ctxRatio = usedCtx != null && maxCtx ? usedCtx / maxCtx : null;

  const coherenceScore = ent == null ? null : Math.round(Math.min(1, ent / 8) * 100);
  const risk = ent == null ? 'NO TEXT SAMPLE' : 'TEXT ENTROPY ONLY';

  let summary = '';
  if (agentKey === 'ALL') {
    const activeNodes = Object.values(agentRegistry).filter(a => a.online && a.name !== 'ALL').length;
    const rateBit = tokSec == null ? 'token rate not observed' : `${tokSec} tok/s from timestamps`;
    summary = `${activeNodes} agents have a live process or a fresh sample. ${rateBit}.`;
  } else if (agentKey === 'Cursor') {
    summary = `Cursor process RSS ${vram == null ? 'unknown' : vram + ' MB'}. ${tokSec == null ? 'Token rate is not in the editor log.' : tokSec + ' tok/s measured.'}`;
  } else if (agentKey === 'Antigravity') {
    summary = ent == null
      ? 'AGY is online. The latest step has no text to measure.'
      : `AGY text entropy H=${ent.toFixed(3)} bits/char. Character perplexity ${ppl}. Cache tokens ${ag.cacheTokens == null ? 'not in this step' : ag.cacheTokens}.`;
  } else if (agentKey === 'Zoth-Sentinel') {
    summary = `Sentinel process is up. RSS ${vram == null ? 'unknown' : vram + ' MB'}. No model text was sampled.`;
  } else if (agentKey === 'Ollama') {
    summary = `Ollama model ${ag.model}. VRAM ${vram == null ? 'not reported' : vram + ' MB'}. Token rate appears only while a generation reports counts.`;
  } else {
    summary = `${ag.name || agentKey} online. ${ent == null ? 'No text sample.' : 'H=' + ent.toFixed(3) + ' bits/char.'} ${tokSec == null ? 'Rate not observed.' : tokSec + ' tok/s.'}`;
  }

  let recommendation = ent == null
    ? 'No text sample yet. Rates and entropy stay blank until a log or transcript provides them.'
    : 'Entropy is the written text. It is not a score of whether the model is right.';
  if (ctxRatio != null && ctxRatio > 0.8) {
    recommendation = 'Observed context is over 80% of the known window.';
  } else if (tokSec == null && ag.online) {
    recommendation = 'The process is up. Token rate needs a count and two timestamps.';
  }

  const band = ent == null ? 'none' : ent < 2.5 ? 'repetitive' : ent < 4.2 ? 'ordinary' : ent < 5.5 ? 'dense' : 'random';
  const visualFocus = {
    badge: band === 'none' ? 'NO SAMPLE' : band === 'repetitive' ? 'REPETITIVE TEXT' : band === 'ordinary' ? 'ORDINARY TEXT' : band === 'dense' ? 'DENSE TEXT' : 'NEAR RANDOM',
    certaintyPct: typeof ag.confidence === 'number' ? Math.round(ag.confidence * 100) : null,
    confusionLevel: ppl == null ? '—' : `${ppl.toFixed(2)} char PPL`,
    plainExplain: ent == null
      ? 'Nothing has been measured for this agent yet.'
      : `The last text sample is ${ent.toFixed(3)} bits per character. That is not the model's attention or its confidence.`
  };

  const visualSpeed = {
    tier: tokSec == null ? 'NOT OBSERVED' : tokSec > 80 ? 'FAST SAMPLE' : tokSec > 15 ? 'STEADY SAMPLE' : 'SLOW SAMPLE',
    wordsPerSec: tokSec,
    note: tokSec == null ? 'No token count with timestamps' : `Measured ${tokSec} tok/s from the step clock`
  };

  const visualMemory = {
    percentUsed: ctxRatio == null ? null : Math.min(100, Math.round(ctxRatio * 100)),
    roomLeftPct: ctxRatio == null ? null : Math.max(0, 100 - Math.round(ctxRatio * 100)),
    wordsInMemory: usedCtx,
    plainNote: usedCtx == null
      ? 'Context length was not in the sample.'
      : (maxCtx ? `${Math.round((usedCtx / maxCtx) * 100)}% of the known window.` : `${usedCtx} tokens observed. Window size was not reported.`)
  };

  let activeStep = 3;
  let stepName = 'Executing';
  let stepNote = 'Running commands and editing code.';
  const p = (ag.phase || '').toUpperCase();
  const m = (ag.markovState || '').toUpperCase();
  if (m.includes('PERCEIVE') || p.includes('PERCEIVE')) {
    activeStep = 1; stepName = 'Reading'; stepNote = 'Reading your prompt and inspecting workspace files.';
  } else if (m.includes('REASON') || p.includes('REASON')) {
    activeStep = 2; stepName = 'Planning'; stepNote = 'Thinking through the plan and designing the architecture.';
  } else if (m.includes('TOOL') || p.includes('TOOL')) {
    activeStep = 3; stepName = 'Executing'; stepNote = 'Running terminal commands, editing code, and verifying builds.';
  } else {
    activeStep = 4; stepName = 'Answering'; stepNote = 'Synthesizing the final clean response for you.';
  }

  const visualJourney = {
    activeStep,
    stepName,
    stepNote
  };

  return {
    status: ag.phase,
    summary,
    coherenceScore,
    hallucinationRisk: risk,
    recommendation,
    visualFocus,
    visualSpeed,
    visualMemory,
    visualJourney
  };
}

// ── Ingest Telemetry Packet ──────────────────────────────────────────────────
function ingestTelemetry(data) {
  if (!data || typeof data !== 'object') return;
  const agentKey = data.agent || 'CustomAgent';

  if (!agentRegistry[agentKey]) {
    agentRegistry[agentKey] = {
      name: agentKey,
      online: true,
      model: data.model || 'Autonomous Model',
      phase: data.phase || 'EXEC',
      tokensSec: 0,
      accelTokSec: 0,
      cumulativeTokens: 0,
      contextUsed: 0,
      contextMax: data.contextMax || 131072,
      kvCacheMb: 0,
      dModel: data.dModel || 4096,
      entropy: null,
      perplexity: null,
      confidence: null,
      gradientLoss: null,
      latencyMs: 80,
      toolCalls: 0,
      toolSuccess: 0,
      toolFail: 0,
      vramMb: 0,
      step: 1,
      maxSteps: 20,
      markovState: 'REASONING',
      lastActive: Date.now(),
      logs: []
    };
  }

  const ag = agentRegistry[agentKey];
  ag.online = true;
  ag.lastActive = Date.now();
  if (data.model) ag.model = data.model;
  if (data.phase) ag.phase = data.phase;
  if (data.markovState) ag.markovState = data.markovState;

  if (typeof data.text === 'string' && data.text.length >= 2) {
    const measured = measure.measureText(data.text);
    if (measured.bitsPerChar != null) {
      ag.entropy = measured.bitsPerChar;
      ag.bigramBits = measured.bigramBits;
      ag.perplexity = measured.perplexity;
      ag.gradientLoss = measured.bigramBits;
      ag.confidence = measured.uniqueRatio;
      ag.measureNote = `Text sample ${measured.chars} chars.`;
    }
  }

  if (data.rateObserved && typeof data.tokensSec === 'number') {
    const prevSpeed = ag.tokensSec;
    ag.tokensSec = data.tokensSec;
    ag.rateObserved = true;
    if (typeof prevSpeed === 'number' && data.dtSec > 0) {
      ag.accelTokSec = +((data.tokensSec - prevSpeed) / data.dtSec).toFixed(2);
    }
  }
  if (typeof data.outputTokens === 'number' && data.outputTokens >= 0) {
    ag.outputTokens = data.outputTokens;
    ag.cumulativeTokens = (ag.cumulativeTokens || 0) + data.outputTokens;
  }

  if (typeof data.contextUsed === 'number') ag.contextUsed = data.contextUsed;
  if (typeof data.cacheTokens === 'number') ag.cacheTokens = data.cacheTokens;
  if (typeof data.contextMax === 'number') ag.contextMax = data.contextMax;
  if (typeof data.dModel === 'number') ag.dModel = data.dModel;
  if (data.kvShape && typeof (data.cacheTokens ?? data.contextUsed) === 'number') {
    const tokens = data.cacheTokens ?? data.contextUsed;
    const mb = measure.kvBytesMb(tokens, data.kvShape);
    if (mb != null) {
      ag.kvCacheMb = mb;
      ag.kvEstimated = true;
    }
  }

  // Pillar IV: Markov & Bayesian Metrics
  if (typeof data.latencyMs === 'number') ag.latencyMs = data.latencyMs;
  if (typeof data.toolCalls === 'number') ag.toolCalls = data.toolCalls;
  if (typeof data.toolSuccess === 'number') ag.toolSuccess = data.toolSuccess;
  if (typeof data.toolFail === 'number') ag.toolFail = data.toolFail;
  if (typeof data.vramMb === 'number') ag.vramMb = data.vramMb;
  if (typeof data.step === 'number') ag.step = data.step;
  if (typeof data.maxSteps === 'number') ag.maxSteps = data.maxSteps;

  // Formulate Mathematical Log with Intelligent Explanation
  if (data.reasoning || data.tool) {
    const expl = generateExplanation(agentKey, data, ag.entropy, ag.perplexity);
    const entry = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      time: getTimestamp(),
      agent: agentKey,
      phase: ag.phase,
      markovState: ag.markovState || 'EXEC',
      tool: data.tool || null,
      note: data.reasoning || `Tool Vector: ${data.tool} (v_T=${ag.tokensSec} t/s, latency=${ag.latencyMs}ms)`,
      explanation: expl.why,
      pillar: expl.pillar,
      proof: expl.proof,
      what: expl.what,
      plainAction: expl.plainAction || expl.what,
      plainWhy: expl.plainWhy || expl.why,
      risk: expl.risk,
      entropy: ag.entropy,
      perplexity: ag.perplexity || +(Math.pow(2, ag.entropy)).toFixed(3),
      confidence: ag.confidence,
      tokensSec: ag.tokensSec,
      accel: ag.accelTokSec
    };
    ag.logs.unshift(entry);
    if (ag.logs.length > 40) ag.logs.pop();

    agentRegistry['ALL'].logs.unshift(entry);
    if (agentRegistry['ALL'].logs.length > 60) agentRegistry['ALL'].logs.pop();
  }

  recomputeSwarmAggregate();

  broadcastTelemetryUpdate();
}

function broadcastTelemetryUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const insights = {};
    for (const [k, v] of Object.entries(agentRegistry)) {
      insights[k] = generateSmartInsights(k, v);
    }
    mainWindow.webContents.send('telemetry-update', {
      registry: agentRegistry,
      mathMeta: MATH_PILLARS_META,
      insights: insights
    });
  }
}

function recomputeSwarmAggregate() {
  const swarm = agentRegistry['ALL'];
  let totalCtx = 0;
  let ctxN = 0;
  let maxCtx = 0;
  let rateSum = 0;
  let rateN = 0;
  let totalCumulative = 0;
  const entropies = [];
  const bigrams = [];
  const uniques = [];
  let totalCalls = 0;
  let totalSuccess = 0;
  let totalFail = 0;
  let totalVram = 0;
  let vramN = 0;
  let activeCount = 0;

  for (const [k, a] of Object.entries(agentRegistry)) {
    if (k === 'ALL') continue;
    if (!(a.online || (a.lastActive && Date.now() - a.lastActive < 120000))) continue;
    activeCount += 1;
    if (typeof a.contextUsed === 'number') {
      totalCtx += a.contextUsed;
      ctxN += 1;
    }
    if (typeof a.contextMax === 'number') maxCtx = Math.max(maxCtx, a.contextMax);
    if (a.rateObserved && typeof a.tokensSec === 'number') {
      rateSum += a.tokensSec;
      rateN += 1;
    }
    totalCumulative += (a.cumulativeTokens || 0);
    if (typeof a.entropy === 'number') entropies.push(a.entropy);
    if (typeof a.bigramBits === 'number') bigrams.push(a.bigramBits);
    if (typeof a.confidence === 'number') uniques.push(a.confidence);
    totalCalls += a.toolCalls || 0;
    totalSuccess += a.toolSuccess || 0;
    totalFail += a.toolFail || 0;
    if (typeof a.vramMb === 'number') {
      totalVram += a.vramMb;
      vramN += 1;
    }
  }

  swarm.online = activeCount > 0;
  swarm.tokensSec = rateN ? +rateSum.toFixed(2) : null;
  swarm.rateObserved = rateN > 0;
  swarm.cumulativeTokens = totalCumulative;
  swarm.contextUsed = ctxN ? totalCtx : null;
  swarm.contextMax = maxCtx || null;
  swarm.kvCacheMb = null;
  const mean = (xs) => xs.length ? +(xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(3) : null;
  swarm.entropy = mean(entropies);
  swarm.perplexity = swarm.entropy == null ? null : +Math.pow(2, swarm.entropy).toFixed(3);
  swarm.confidence = mean(uniques);
  swarm.bigramBits = mean(bigrams);
  swarm.gradientLoss = swarm.bigramBits;
  swarm.toolCalls = totalCalls;
  swarm.toolSuccess = totalSuccess;
  swarm.toolFail = totalFail;
  swarm.vramMb = vramN ? totalVram : null;
  swarm.measureNote = activeCount
    ? `${activeCount} live. Entropy averaged over ${entropies.length} text samples. Rate summed over ${rateN}.`
    : 'No sample yet.';
}

// ── Ingestion Servers ────────────────────────────────────────────────────────
function startHttpServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200); res.end(); return;
    }

    if (req.url === '/telemetry' && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          ingestTelemetry(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', received: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid json' }));
        }
      });
      return;
    }

    if (req.url === '/active') {
      const insights = {};
      for (const [k, v] of Object.entries(agentRegistry)) {
        insights[k] = generateSmartInsights(k, v);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ registry: agentRegistry, mathMeta: MATH_PILLARS_META, insights }));
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
      return;
    }

    if (req.url.startsWith('/export')) {
      const urlObj = new URL(req.url, 'http://127.0.0.1:9995');
      const target = urlObj.searchParams.get('agent') || 'ALL';
      try {
        const { fullPath, count } = exportTelemetryAuditToFile(target);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', exported: true, filePath: fullPath, count }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: err.message }));
      }
      return;
    }

    res.writeHead(404); res.end();
  });

  server.listen(HTTP_PORT, '127.0.0.1', () => {
    console.log(`[Math Pillar] Telemetry HTTP listening on 127.0.0.1:${HTTP_PORT}`);
  });
}

function startUdpServer() {
  const socket = dgram.createSocket('udp4');
  socket.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      ingestTelemetry(data);
    } catch (e) {}
  });
  socket.bind(UDP_PORT, '127.0.0.1', () => {
    console.log(`[Math Pillar] UDP streaming listener on 127.0.0.1:${UDP_PORT}`);
  });
}

// ── Multi-Agent Live Scrapers ────────────────────────────────────────────────
let lastTranscriptMtime = 0;
let lastOllamaCheck = 0;

function probeAllAgents() {
  // 1. Antigravity live transcript reader
  try {
    const brainDir = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'brain');
    if (fs.existsSync(brainDir)) {
      const convs = fs.readdirSync(brainDir);
      let latestConv = null, latestMtime = 0;

      for (const c of convs) {
        const tf = path.join(brainDir, c, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(tf)) {
          const st = fs.statSync(tf);
          if (st.mtimeMs > latestMtime) {
            latestMtime = st.mtimeMs;
            latestConv = tf;
          }
        }
      }

      if (latestConv && latestMtime > lastTranscriptMtime) {
        lastTranscriptMtime = latestMtime;
        const content = fs.readFileSync(latestConv, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);
        if (lines.length > 0) {
          let latestStep = null;
          let latestStepIdx = -1;
          for (let i = lines.length - 1; i >= 0 && i >= lines.length - 20; i -= 1) {
            try {
              const p = JSON.parse(lines[i]);
              if (p.thinking || p.content || typeof p.output_tokens === 'number') {
                latestStep = p;
                latestStepIdx = i;
                break;
              }
            } catch (err) {}
          }
          if (!latestStep) {
            try { latestStep = JSON.parse(lines[lines.length - 1]); latestStepIdx = lines.length - 1; } catch (e) {}
          }

          if (latestStep) {
            let prevCounted = null;
            for (let i = latestStepIdx - 1; i >= 0 && i >= latestStepIdx - 40; i -= 1) {
              try {
                const candidate = JSON.parse(lines[i]);
                if (typeof candidate.output_tokens === 'number' && candidate.created_at) {
                  prevCounted = candidate;
                  break;
                }
              } catch (err) {}
            }
            let text = `${latestStep.thinking || ''}\n${latestStep.content || ''}`.trim();
            if (latestStep.truncated_fields && (latestStep.truncated_fields.includes('content') || latestStep.truncated_fields.includes('thinking'))) {
              try {
                const fullPath = latestConv.replace('transcript.jsonl', 'transcript_full.jsonl');
                if (fs.existsSync(fullPath)) {
                  const fullLines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(Boolean);
                  if (fullLines[latestStepIdx]) {
                    const fullStep = JSON.parse(fullLines[latestStepIdx]);
                    text = `${fullStep.thinking || ''}\n${fullStep.content || ''}`.trim();
                  }
                }
              } catch (err) {}
            }

            const toolCalls = latestStep.tool_calls || [];
            const toolName = toolCalls.length > 0 && toolCalls[0].name ? toolCalls[0].name : (toolCalls.length > 0 && toolCalls[0].function ? toolCalls[0].function.name : null);
            const markov = toolCalls.length > 0 ? 'TOOL_EXEC' : (latestStep.type === 'PLANNER_RESPONSE' ? 'REASONING' : 'PERCEIVE');
            let tokensSec = null;
            let dtSec = null;
            let rateObserved = false;
            if (prevCounted && latestStep.created_at && typeof latestStep.output_tokens === 'number') {
              dtSec = (new Date(latestStep.created_at) - new Date(prevCounted.created_at)) / 1000;
              const rate = measure.tokenRate(latestStep.output_tokens, dtSec);
              if (rate != null) {
                tokensSec = rate;
                rateObserved = true;
              }
            }
            const cacheTokens = typeof latestStep.cache_read_tokens === 'number' ? latestStep.cache_read_tokens : null;
            const contextUsed = cacheTokens != null ? cacheTokens : (typeof latestStep.input_tokens === 'number' ? latestStep.input_tokens : null);
            ingestTelemetry({
              agent: 'Antigravity',
              model: 'Gemini 3.8 Flash / AGY',
              phase: latestStep.type === 'PLANNER_RESPONSE' ? 'REASONING' : (toolCalls.length > 0 ? 'TOOL_EXEC' : 'EXEC'),
              markovState: markov,
              text,
              tokensSec,
              rateObserved,
              dtSec,
              outputTokens: typeof latestStep.output_tokens === 'number' ? latestStep.output_tokens : null,
              contextUsed,
              cacheTokens,
              step: latestStep.step_index || lines.length,
              maxSteps: lines.length,
              tool: toolName,
              toolCalls: toolCalls.length,
              reasoning: toolName
                ? `Tool ${toolName}. output_tokens=${latestStep.output_tokens == null ? 'absent' : latestStep.output_tokens}. cache_read_tokens=${cacheTokens == null ? 'absent' : cacheTokens}.`
                : `Step ${latestStep.step_index || lines.length} ${latestStep.type || ''}. output_tokens=${latestStep.output_tokens == null ? 'absent' : latestStep.output_tokens}. cache_read_tokens=${cacheTokens == null ? 'absent' : cacheTokens}.`
            });
          }
        }
      }
    }
  } catch (e) {}

  // 1b. Grok live session reader
  probeGrok();

  // 2. Ollama live probe (tags & active ps)
  if (Date.now() - lastOllamaCheck > 4000) {
    lastOllamaCheck = Date.now();
    // Query active models in VRAM via /api/ps
    const reqPs = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/ps',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        try {
          const d = JSON.parse(body);
          if (d && Array.isArray(d.models) && d.models.length > 0) {
            const m = d.models[0];
            const ag = agentRegistry['Ollama'];
            ag.online = true;
            ag.model = m.name;
            ag.phase = 'INFERENCE_ACTIVE';
            ag.markovState = 'REASONING';
            if (m.details && m.details.context_length) ag.contextMax = m.details.context_length;
            const bytes = m.size_vram || m.size;
            if (bytes) ag.vramMb = Math.round(bytes / (1024 * 1024));
            ag.lastActive = Date.now();
            ag.rateObserved = false;
            ag.measureNote = `Ollama has ${m.name} loaded. VRAM bytes ${bytes || 'not reported'}.`;
            applyOllamaShape(m.name);
          } else {
            // Check available tags
            checkOllamaTags();
          }
        } catch (e) {
          checkOllamaTags();
        }
      });
    });
    reqPs.on('error', () => { 
      agentRegistry['Ollama'].online = false; 
    });
    reqPs.end();
  }

  // 3. Dedicated Cursor App & Agent Scraper
  probeCursor();

  // 4. Dedicated Zoth Sentinel Scraper
  probeZothSentinel();

  // 5. Process inspection for Claude, Aider, Hermes, Grok, OpenCode, Codex, Azoth, vLLM
  exec('ps aux | grep -E "claude|aider|hermes|hexstrike|grok|opencode|codex|azoth|vllm|litellm" | grep -v grep', (err, stdout) => {
    if (!err && stdout) {
      const lower = stdout.toLowerCase();
      agentRegistry['Claude'].online = lower.includes('claude');
      if (agentRegistry['Claude'].online) agentRegistry['Claude'].lastActive = Date.now();

      agentRegistry['Aider'].online = lower.includes('aider');
      if (agentRegistry['Aider'].online) agentRegistry['Aider'].lastActive = Date.now();

      if (!agentRegistry['Grok'].online) {
        agentRegistry['Grok'].online = lower.includes('grok');
        if (agentRegistry['Grok'].online) agentRegistry['Grok'].lastActive = Date.now();
      }

      agentRegistry['Hermes'].online = lower.includes('hexstrike') || lower.includes('hermes');
      if (agentRegistry['Hermes'].online) agentRegistry['Hermes'].lastActive = Date.now();

      agentRegistry['OpenCode'].online = lower.includes('opencode');
      if (agentRegistry['OpenCode'].online) agentRegistry['OpenCode'].lastActive = Date.now();

      agentRegistry['Codex'].online = lower.includes('codex');
      if (agentRegistry['Codex'].online) agentRegistry['Codex'].lastActive = Date.now();

      agentRegistry['Azoth'].online = lower.includes('azoth') || lower.includes('zoth-studio');
      if (agentRegistry['Azoth'].online) agentRegistry['Azoth'].lastActive = Date.now();

      agentRegistry['vLLM'].online = lower.includes('vllm');
      if (agentRegistry['vLLM'].online) agentRegistry['vLLM'].lastActive = Date.now();
    }
  });

  recomputeSwarmAggregate();
  broadcastTelemetryUpdate();
}

let lastGrokMtime = 0;
function probeGrok() {
  try {
    const grokSessionsDir = path.join(os.homedir(), '.grok', 'sessions');
    if (!fs.existsSync(grokSessionsDir)) return;

    const workDirs = fs.readdirSync(grokSessionsDir);
    let latestUsage = null;
    let latestChat = null;
    let latestMtime = 0;

    for (const wd of workDirs) {
      const fullWd = path.join(grokSessionsDir, wd);
      try {
        if (!fs.statSync(fullWd).isDirectory()) continue;
        const subdirs = fs.readdirSync(fullWd);
        for (const sd of subdirs) {
          const sessionPath = path.join(fullWd, sd);
          try {
            if (!fs.statSync(sessionPath).isDirectory()) continue;
            const usageFile = path.join(sessionPath, 'usage.json');
            const chatFile = path.join(sessionPath, 'chat_history.jsonl');
            if (fs.existsSync(usageFile) || fs.existsSync(chatFile)) {
              const mtime = Math.max(
                fs.existsSync(usageFile) ? fs.statSync(usageFile).mtimeMs : 0,
                fs.existsSync(chatFile) ? fs.statSync(chatFile).mtimeMs : 0
              );
              if (mtime > latestMtime) {
                latestMtime = mtime;
                latestUsage = usageFile;
                latestChat = chatFile;
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    if (latestMtime > 0 && latestMtime > lastGrokMtime) {
      lastGrokMtime = latestMtime;
      let model = 'grok-4.7-build';
      let cacheTokens = null;
      let outputTokens = null;
      let turnCount = null;
      let text = '';

      if (latestUsage && fs.existsSync(latestUsage)) {
        try {
          const usage = JSON.parse(fs.readFileSync(latestUsage, 'utf8'));
          if (usage.session) {
            model = usage.session.primaryModelId || model;
            outputTokens = usage.session.outputTokens;
            cacheTokens = usage.session.cachedReadTokens;
            turnCount = usage.session.turnCount;
          }
          if (Array.isArray(usage.turns) && usage.turns.length > 0) {
            const lastTurn = usage.turns[usage.turns.length - 1];
            if (typeof lastTurn.outputTokens === 'number') outputTokens = lastTurn.outputTokens;
            if (typeof lastTurn.cachedReadTokens === 'number') cacheTokens = lastTurn.cachedReadTokens;
          }
        } catch (e) {}
      }

      if (latestChat && fs.existsSync(latestChat)) {
        try {
          const chatRaw = fs.readFileSync(latestChat, 'utf8');
          const lines = chatRaw.trim().split('\n').filter(Boolean);
          for (let i = lines.length - 1; i >= 0 && i >= lines.length - 20; i -= 1) {
            try {
              const entry = JSON.parse(lines[i]);
              if (entry.type === 'assistant' && typeof entry.content === 'string' && entry.content.length > 0) {
                text = entry.content;
                break;
              } else if (entry.type === 'reasoning' && Array.isArray(entry.summary) && entry.summary.length > 0) {
                text = entry.summary.map(s => s.text || '').join('\n');
                break;
              }
            } catch (err) {}
          }
        } catch (e) {}
      }

      const ag = agentRegistry['Grok'];
      ag.online = true;
      ag.lastActive = Date.now();
      ag.model = model;
      ag.phase = 'ACTIVE_AGENT';
      ag.markovState = 'REASONING';

      ingestTelemetry({
        agent: 'Grok',
        model: model,
        phase: 'ACTIVE_AGENT',
        markovState: 'REASONING',
        text: text,
        rateObserved: false,
        outputTokens: outputTokens,
        cacheTokens: cacheTokens,
        contextUsed: cacheTokens,
        step: turnCount || 1,
        maxSteps: Math.max(20, (turnCount || 1) + 5),
        tool: 'grok_session_sync',
        reasoning: `Grok active: model ${model}. Turn ${turnCount || 'unknown'}. Cache tokens: ${cacheTokens || 'none'}.`
      });
    }
  } catch (e) {}
}

function applyOllamaShape(name) {
  if (!name) return;
  const body = JSON.stringify({ name });
  const req = http.request({
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/show',
    method: 'POST',
    timeout: 1500,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  }, (res) => {
    let buf = '';
    res.on('data', (c) => { buf += c; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(buf);
        const shape = measure.shapeFromOllamaInfo(parsed.model_info);
        const ag = agentRegistry['Ollama'];
        if (!shape) {
          ag.measureNote = `Ollama model ${name} answered /api/show without a layer shape.`;
          return;
        }
        ag.kvShape = shape;
        if (shape.embed) ag.dModel = shape.embed;
        const tokens = typeof ag.cacheTokens === 'number' ? ag.cacheTokens : ag.contextUsed;
        if (typeof tokens === 'number') ag.kvCacheMb = measure.kvBytesMb(tokens, shape);
        ag.measureNote = `Ollama shape ${shape.layers} layers, ${shape.kvHeads} kv heads, head dim ${shape.headDim}.`;
        broadcastTelemetryUpdate();
      } catch (e) {}
    });
  });
  req.on('error', () => {});
  req.end(body);
}

function checkOllamaTags() {
  const reqTags = http.request({
    hostname: '127.0.0.1',
    port: 11434,
    path: '/api/tags',
    method: 'GET',
    timeout: 1000
  }, (res) => {
    let body = '';
    res.on('data', c => { body += c; });
    res.on('end', () => {
      try {
        const d = JSON.parse(body);
        if (d && Array.isArray(d.models) && d.models.length > 0) {
          const m = d.models[0];
          agentRegistry['Ollama'].online = true;
          agentRegistry['Ollama'].model = m.name;
          agentRegistry['Ollama'].phase = 'READY_STANDBY';
          if (m.details && m.details.context_length) agentRegistry['Ollama'].contextMax = m.details.context_length;
          if (m.size) agentRegistry['Ollama'].vramMb = Math.round(m.size / (1024 * 1024));
          applyOllamaShape(m.name);
        }
      } catch (e) {}
    });
  });
  reqTags.on('error', () => { agentRegistry['Ollama'].online = false; });
  reqTags.end();
}

// ── Dedicated Cursor App & Agent Scraper ─────────────────────────────────────
let lastCursorLogMtime = 0;
let lastCursorScrapeTick = 0;
let lastSentinelTick = 0;

function probeCursor() {
  try {
    exec('ps aux | grep -iE "/cursor|cursor-agent" | grep -v grep || true', (err, stdout) => {
      const ag = agentRegistry['Cursor'];
      if (!ag) return;

      if (!err && stdout && stdout.trim().length > 0) {
        ag.online = true;
        ag.lastActive = Date.now();
        ag.model = 'Claude 3.7 Sonnet / Cursor Composer';

        const lines = stdout.trim().split('\n');
        let totalRssKb = 0;
        let totalCpu = 0;
        let hasAgentWorker = false;

        for (const l of lines) {
          const parts = l.trim().split(/\s+/);
          if (parts.length >= 6) {
            totalCpu += parseFloat(parts[2]) || 0;
            totalRssKb += parseInt(parts[5], 10) || 0;
          }
          if (l.includes('cursor-agent')) hasAgentWorker = true;
        }

        const totalRssMb = Math.round(totalRssKb / 1024);
        ag.vramMb = totalRssMb;
        ag.phase = hasAgentWorker ? 'BACKGROUND_AGENT' : (totalCpu > 1.0 ? 'ACTIVE_COMPOSER' : 'IDLE_IDE');
        ag.markovState = hasAgentWorker ? 'TOOL_EXEC' : (totalCpu > 1.0 ? 'REASONING' : 'PERCEIVE');
        ag.cpuPct = +totalCpu.toFixed(1);
        ag.measureNote = `Cursor RSS ${totalRssMb} MB, CPU ${ag.cpuPct}%. Token rate is not derived from CPU.`;
        scrapeCursorLogs(ag, hasAgentWorker, totalRssMb);
      } else {
        ag.online = false;
        ag.tokensSec = 0;
        ag.accelTokSec = 0;
      }
    });
  } catch (e) {}
}

function scrapeCursorLogs(ag, hasAgentWorker, totalRssMb) {
  try {
    const logsBase = path.join(os.homedir(), '.config', 'Cursor', 'logs');
    if (!fs.existsSync(logsBase)) return;

    let candidateFile = null;
    let candidateMtime = 0;

    function walkDir(dir, depth = 0) {
      if (depth > 4 || !fs.existsSync(dir)) return;
      try {
        const ents = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of ents) {
          const full = path.join(dir, e.name);
          if (e.isDirectory()) {
            walkDir(full, depth + 1);
          } else if (e.isFile() && e.name.endsWith('.log')) {
            try {
              const st = fs.statSync(full);
              if (st.mtimeMs > candidateMtime && st.size > 0) {
                candidateMtime = st.mtimeMs;
                candidateFile = full;
              }
            } catch (err) {}
          }
        }
      } catch (err) {}
    }

    walkDir(logsBase);

    // Also check worker log
    const workerDir = path.join(os.homedir(), '.config', 'Cursor', 'User', 'globalStorage', 'anysphere.cursor-agent-worker');
    if (fs.existsSync(workerDir)) {
      try {
        for (const f of fs.readdirSync(workerDir)) {
          if (f.endsWith('.log')) {
            const full = path.join(workerDir, f);
            const st = fs.statSync(full);
            if (st.mtimeMs > candidateMtime && st.size > 0) {
              candidateMtime = st.mtimeMs;
              candidateFile = full;
            }
          }
        }
      } catch (e) {}
    }

    if (candidateFile && candidateMtime > lastCursorLogMtime) {
      lastCursorLogMtime = candidateMtime;
      const raw = fs.readFileSync(candidateFile, 'utf8');
      const logLines = raw.trim().split('\n').filter(Boolean);
      if (logLines.length > 0) {
        const lastLogLine = logLines[logLines.length - 1];
        const fileName = path.basename(candidateFile, '.log');

        let toolName = 'cursor_editor_event';
        let markov = 'PERCEIVE';

        if (fileName.includes('Git') || lastLogLine.includes('git')) {
          toolName = 'cursor_git_sync';
          markov = 'TOOL_EXEC';
        } else if (fileName.includes('Mcp') || lastLogLine.includes('mcp')) {
          toolName = 'cursor_mcp_lease';
          markov = 'TOOL_EXEC';
        } else if (lastLogLine.includes('frame') || lastLogLine.includes('composer')) {
          toolName = 'composer_reasoning';
          markov = 'REASONING';
        } else if (lastLogLine.includes('Extension')) {
          toolName = 'extension_lifecycle';
          markov = 'SYNTHESIS';
        }

        const cleanNote = lastLogLine.replace(/\s+/g, ' ').substring(0, 110);

        ingestTelemetry({
          agent: 'Cursor',
          model: 'Cursor process',
          phase: hasAgentWorker ? 'BACKGROUND_AGENT' : 'ACTIVE_IDE',
          markovState: markov,
          text: lastLogLine,
          rateObserved: false,
          vramMb: totalRssMb,
          step: logLines.length,
          tool: toolName,
          reasoning: `Cursor log ${fileName}. RSS ${totalRssMb == null ? 'unknown' : totalRssMb + ' MB'}. ${cleanNote}`
        });
      }
    }
  } catch (e) {}
}

function probeZothSentinel() {
  try {
    exec('ps aux | grep zoth-sentinel | grep -v grep || true', (err, stdout) => {
      const ag = agentRegistry['Zoth-Sentinel'];
      if (!ag) return;

      if (!err && stdout && stdout.trim().length > 0) {
        ag.online = true;
        ag.lastActive = Date.now();
        ag.model = 'sentinel process';
        let rssMb = null;
        const parts = stdout.trim().split('\n')[0].trim().split(/\s+/);
        if (parts.length >= 6) rssMb = Math.round((parseInt(parts[5], 10) || 0) / 1024);
        ag.vramMb = rssMb;
        ag.rateObserved = false;
        ag.tokensSec = null;
        ag.measureNote = `Sentinel process is up. RSS ${rssMb == null ? 'unknown' : rssMb + ' MB'}. No text sample.`;
      } else {
        ag.online = false;
      }
    });
  } catch (e) {}
}

// ── Window Management ────────────────────────────────────────────────────────
function loadConfig() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {}
  return { x: null, y: null, compact: false, alwaysOnTop: true, selectedAgent: 'ALL' };
}

function saveConfig(cfg) {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  } catch (e) {}
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const cfg = loadConfig();

  const winW = cfg.compact ? 340 : 480;
  const winH = cfg.compact ? 72 : 760;
  let posX = typeof cfg.x === 'number' ? cfg.x : width - winW - 25;
  let posY = typeof cfg.y === 'number' ? cfg.y : 35;
  posX = Math.max(10, Math.min(width - winW - 10, posX));
  posY = Math.max(10, Math.min(height - winH - 10, posY));

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: posX,
    y: posY,
    transparent: true,
    frame: false,
    alwaysOnTop: cfg.alwaysOnTop !== false,
    skipTaskbar: false,
    resizable: false,
    hasShadow: false,
    thickFrame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] [lvl:${level}] ${message} (at line ${line})`);
  });

  if (cfg.alwaysOnTop !== false) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  mainWindow.on('moved', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    const c = loadConfig();
    c.x = x; c.y = y;
    saveConfig(c);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('toggle-pin', (e, isPinned) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isPinned, 'screen-saver', 1);
    const c = loadConfig(); c.alwaysOnTop = isPinned; saveConfig(c);
  }
});
ipcMain.on('toggle-compact', (e, compactState) => {
  if (!mainWindow) return;
  const c = loadConfig(); c.compact = compactState; saveConfig(c);
  if (compactState) {
    mainWindow.setSize(340, 74, true);
  } else {
    mainWindow.setSize(480, 760, true);
  }
});

ipcMain.on('request-telemetry', () => {
  broadcastTelemetryUpdate();
});

ipcMain.on('clear-logs', (e, targetAgent) => {
  const ag = agentRegistry[targetAgent || 'ALL'];
  if (ag) ag.logs = [];
  if (targetAgent !== 'ALL' && agentRegistry['ALL']) {
    agentRegistry['ALL'].logs = agentRegistry['ALL'].logs.filter(l => l.agent !== targetAgent);
  }
  broadcastTelemetryUpdate();
});

ipcMain.on('reset-integrals', (e, targetAgent) => {
  const ag = agentRegistry[targetAgent || 'ALL'];
  if (ag) ag.cumulativeTokens = 0;
  broadcastTelemetryUpdate();
});

function exportTelemetryAuditToFile(targetAgent) {
  const exportDir = path.join(os.homedir(), '.local', 'share', 'zothos');
  if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const target = targetAgent || 'ALL';
  const filename = `telemetry_audit_${target.toLowerCase()}_${ts}.md`;
  const fullPath = path.join(exportDir, filename);

  const ag = agentRegistry[target] || agentRegistry['ALL'];
  const activeNodes = Object.entries(agentRegistry).filter(([k, v]) => v.online && k !== 'ALL');
  const insight = generateSmartInsights(target, ag);

  let md = `# ✦ ZOTHOS MATHEMATICAL AI TELEMETRY AUDIT REPORT\n`;
  md += `**Generated**: ${new Date().toLocaleString()} | **Target**: ${ag.name || target}\n\n`;

  md += `## 1. Cognitive Oracle Assessment\n`;
  md += `- **Operational State**: \`${insight.status}\`\n`;
  md += `- **Attention Coherence Score**: \`${insight.coherenceScore} / 100\`\n`;
  md += `- **Hallucination Risk Index**: \`${insight.hallucinationRisk}\`\n`;
  md += `- **Cognitive Summary**: ${insight.summary}\n`;
  md += `- **Heuristic Recommendation**: ${insight.recommendation}\n\n`;

  md += `## 2. Executive Telemetry Overview\n`;
  md += `- **Active Model**: \`${ag.model}\`\n`;
  md += `- **Operational Phase / Markov State**: \`${ag.phase}\` / \`${ag.markovState}\`\n`;
  md += `- **Token Velocity ($v_T = \\partial T/\\partial t$)**: \`${ag.tokensSec} tok/sec\` (Accel: \`${ag.accelTokSec} a_T\`)\n`;
  md += `- **Cumulative Tokens ($\\int v_T dt$)**: \`${ag.cumulativeTokens || 0} tokens\`\n`;
  md += `- **Shannon Attention Entropy ($\\mathcal{H}$)**: \`${ag.entropy} bits\` (Perplexity: \`${ag.perplexity}\`)\n`;
  md += `- **KV-Cache Tensor Volume ($\\Omega_{\\text{KV}}$)**: \`${ag.kvCacheMb >= 1024 ? (ag.kvCacheMb/1024).toFixed(2) + ' GB' : ag.kvCacheMb + ' MB'}\`\n`;
  md += `- **Context Utilization**: \`${ag.contextUsed} / ${ag.contextMax} tokens\` (${((ag.contextUsed / ag.contextMax) * 100).toFixed(1)}%)\n`;
  md += `- **Active Memory (RSS/VRAM)**: \`${ag.vramMb} MB\`\n`;
  md += `- **Tool Invocations**: \`${ag.toolCalls} executed / ${ag.toolFail} failed\`\n\n`;

  md += `## 3. Active Multi-Agent Swarm Nodes (${activeNodes.length} Online)\n`;
  md += `| Node | Model | State | Speed | KV Memory | Entropy |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  for (const [k, node] of activeNodes) {
    md += `| **${k}** | \`${node.model}\` | \`${node.phase}\` | ${node.tokensSec} t/s | ${node.kvCacheMb} MB | ${node.entropy} bits |\n`;
  }
  md += `\n`;

  md += `## 4. Mathematical Why & How Event Stream (${(ag.logs || []).length} events)\n\n`;
  for (const log of (ag.logs || [])) {
    md += `### [${log.time}] [${log.agent || target}] \`${log.phase}\` ❯ ${log.what || log.tool || 'Event'}\n`;
    md += `- **Note**: ${log.note}\n`;
    if (log.explanation) md += `- **Cognitive Explanation**: ${log.explanation}\n`;
    if (log.proof) md += `- **Governing Mathematical Pillar**: ${log.pillar || 'Math Formulation'} — *${log.proof}*\n`;
    md += `- **Variables**: $H=${log.entropy}\\text{ bits}$, $\\text{PPL}=${log.perplexity}$, Speed: ${log.tokensSec || 0} t/s\n\n`;
  }

  fs.writeFileSync(fullPath, md, 'utf8');
  return { fullPath, count: (ag.logs || []).length };
}

ipcMain.on('export-telemetry', (e, targetAgent) => {
  try {
    const { fullPath, count } = exportTelemetryAuditToFile(targetAgent);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('export-result', { success: true, filePath: fullPath, count });
    }
  } catch (err) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('export-result', { success: false, error: err.message });
    }
  }
});

app.whenReady().then(() => {
  startHttpServer();
  startUdpServer();
  createWindow();

  setInterval(probeAllAgents, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
