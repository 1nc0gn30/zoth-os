// AETHER-OBSERVATORY — Local Sovereign AI Anomaly Triage Gateway
// Zero plaintext keys, zero shell execution (execFile only), honest deterministic fallback.

import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SAFE_MODEL_RE = /^[A-Za-z0-9._:/-]{1,80}$/;

const CLI_CANDIDATES = {
  agy_cli: ['/home/zoth/.gemini/antigravity-cli/bin/agy', '/usr/local/bin/agy'],
  hermes_cli: ['/home/zoth/.local/bin/hermes', '/usr/local/bin/hermes'],
  codex_cli: ['/home/zoth/.local/bin/codex', '/usr/local/bin/codex'],
  claude_code: ['/home/zoth/.local/bin/claude', '/usr/local/bin/claude'],
  grok_cli: ['/home/zoth/.grok/grok', '/home/zoth/.grok/bin/grok', '/usr/local/bin/grok'],
};

function findBin(paths) {
  for (const p of paths) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      return p;
    } catch { /* next */ }
  }
  return null;
}

function inspectCliGuard(id, binPath) {
  if (!binPath) return { available: false, guarded: false, reason: 'binary not installed' };
  try {
    const head = fs.readFileSync(binPath, 'utf8').slice(0, 1024);
    if (id === 'codex_cli' && /sovereign[-_]agent[-_]bridge|8102/i.test(head)) {
      return { available: true, guarded: true, reason: 'recursive bridge loop guard active — use AGY Bridge or Ollama' };
    }
    if (id === 'claude_code' && /install|not installed|curl\s+-fsSL/i.test(head)) {
      return { available: true, guarded: true, reason: 'installer stub detected — use AGY Bridge or Ollama' };
    }
  } catch { /* binary ELF executable */ }
  return { available: true, guarded: false, reason: 'ready' };
}

async function probeHttpJson(url, timeoutMs = 1200) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

let providersCache = { expiresAt: 0, value: null };

export async function detectProviders(force = false) {
  if (!force && providersCache.value && Date.now() < providersCache.expiresAt) {
    return providersCache.value;
  }
  const [agyModels, ollamaTags, azothHealth] = await Promise.all([
    probeHttpJson('http://127.0.0.1:18000/v1/models', 800),
    probeHttpJson('http://127.0.0.1:11434/api/tags', 800),
    probeHttpJson('http://127.0.0.1:8136/health', 800),
  ]);

  const providers = [
    {
      id: 'agy_bridge',
      label: 'AGY Bridge (:18000)',
      kind: 'local_http',
      available: Array.isArray(agyModels?.data),
      models: Array.isArray(agyModels?.data) ? agyModels.data.map(m => m.id).slice(0, 12) : [],
      defaultModel: agyModels?.data?.[0]?.id || 'gemini-3.8-flash-high',
    },
    {
      id: 'ollama_local',
      label: 'Ollama Local (:11434)',
      kind: 'local_http',
      available: Array.isArray(ollamaTags?.models),
      models: Array.isArray(ollamaTags?.models) ? ollamaTags.models.map(m => m.name).slice(0, 12) : [],
      defaultModel: ollamaTags?.models?.[0]?.name || 'llama3.2:latest',
    },
    {
      id: 'azoth_local',
      label: 'AZOTH Local (:8136)',
      kind: 'local_http',
      available: Boolean(azothHealth),
      models: ['azoth-local'],
      defaultModel: 'azoth-local',
    },
  ];

  const cliLabels = {
    agy_cli: 'AGY CLI',
    hermes_cli: 'Hermes CLI',
    codex_cli: 'Codex CLI',
    claude_code: 'Claude Code CLI',
    grok_cli: 'Grok CLI',
  };

  for (const [id, paths] of Object.entries(CLI_CANDIDATES)) {
    const bin = findBin(paths);
    const guard = inspectCliGuard(id, bin);
    providers.push({
      id,
      label: cliLabels[id],
      kind: 'local_cli',
      bin: bin || null,
      available: guard.available,
      guarded: guard.guarded,
      reason: guard.reason,
      models: [],
      defaultModel: id,
    });
  }

  providers.push({
    id: 'deterministic',
    label: 'Deterministic Rules (Offline)',
    kind: 'builtin',
    available: true,
    guarded: false,
    models: ['rule-engine-v2'],
    defaultModel: 'rule-engine-v2',
  });

  providersCache = { expiresAt: Date.now() + 30000, value: providers };
  return providers;
}

export function deterministicTriage({ live, nodes = [], diff = null }) {
  const anomalies = [];
  const recommendations = [];
  const pkgC = live?.thermals?.packageC;
  const load1 = live?.cpu?.load1 ?? 0;
  const coreCount = live?.cpu?.coreCount || 1;
  const loadRatio = load1 / coreCount;
  const busyPct = live?.cpu?.busyPct ?? 0;
  const memPct = live?.memory?.usedPct ?? 0;
  const swapPct = live?.memory?.swapPct ?? 0;
  const zothNodes = nodes.filter(n => n.zothTool);
  const slowNodes = nodes.filter(n => typeof n.latencyMs === 'number' && n.latencyMs > 200);

  if (typeof pkgC === 'number' && pkgC >= 80) {
    anomalies.push({ severity: 'high', signal: 'thermal', detail: `CPU package at ${pkgC}°C (>= 80°C threshold)` });
    recommendations.push('Inspect top CPU consumers and verify fan RPM / cooling headroom.');
  } else if (typeof pkgC === 'number' && pkgC >= 68) {
    anomalies.push({ severity: 'medium', signal: 'thermal', detail: `CPU package elevated at ${pkgC}°C` });
    recommendations.push('Monitor thermal trend in Time Machine over the next 5 minutes.');
  }

  if (loadRatio >= 0.85 || busyPct >= 85) {
    anomalies.push({ severity: 'high', signal: 'cpu', detail: `Sustained CPU saturation: load1 ${load1} across ${coreCount} threads (${busyPct}% busy)` });
    recommendations.push('Check runaway build/headless processes or increase sampling interval.');
  } else if (loadRatio >= 0.5) {
    anomalies.push({ severity: 'low', signal: 'cpu', detail: `Moderate CPU load: load1 ${load1} (${busyPct}% busy)` });
  }

  if (memPct >= 85) {
    anomalies.push({ severity: 'high', signal: 'memory', detail: `High RAM pressure: ${memPct}% used` });
    recommendations.push('Identify high-RSS daemons in the constellation or stop idle dev servers.');
  }
  if (swapPct >= 20) {
    anomalies.push({ severity: 'medium', signal: 'swap', detail: `Swap utilization at ${swapPct}%` });
  }
  if (slowNodes.length) {
    anomalies.push({
      severity: 'medium',
      signal: 'latency',
      detail: `${slowNodes.length} local daemon(s) exceeding 200ms probe latency (${slowNodes.slice(0, 3).map(n => `:${n.port} ${n.latencyMs}ms`).join(', ')})`,
    });
    recommendations.push(`Investigate slow local listener(s): ${slowNodes.slice(0, 3).map(n => `${n.name} :${n.port}`).join(', ')}.`);
  }

  if (diff) {
    if (diff.thermalSpike) {
      anomalies.push({ severity: 'high', signal: 'diff_thermal', detail: `Thermal spike of +${diff.thermalDeltaC}°C across ${diff.windowSec ?? 0}s window` });
    }
    if (diff.spawnedPorts?.length) {
      anomalies.push({ severity: 'info', signal: 'diff_ports', detail: `${diff.spawnedPorts.length} port(s) spawned: ${diff.spawnedPorts.slice(0, 6).map(p => ':' + p).join(', ')}` });
    }
    if (diff.terminatedPorts?.length) {
      anomalies.push({ severity: 'medium', signal: 'diff_ports', detail: `${diff.terminatedPorts.length} port(s) terminated: ${diff.terminatedPorts.slice(0, 6).map(p => ':' + p).join(', ')}` });
    }
  }

  if (!anomalies.length) {
    recommendations.push('System operating within nominal thermal, CPU, memory, and socket bounds.');
  }

  const summary = `Host ${live?.hostname || 'localhost'}: CPU ${busyPct}% busy (load1 ${load1}/${coreCount}c), package ${pkgC ?? 'n/a'}°C, RAM ${memPct}% used, ${nodes.length} listening sockets (${zothNodes.length} Zoth daemons). ${anomalies.length ? `${anomalies.length} signal(s) flagged.` : 'No anomalies detected.'}`;

  return { summary, anomalies, recommendations };
}

function buildTelemetryPrompt({ live, nodes = [], diff = null }) {
  const topNodes = nodes.slice(0, 12).map(n => `:${n.port} ${n.name} (${n.latencyMs ?? 'n/a'}ms)`).join(', ');
  const diffTxt = diff
    ? `Diff (${diff.windowSec ?? 0}s): loadDelta=${diff.loadDelta}, thermalDeltaC=${diff.thermalDeltaC}, memDeltaPct=${diff.memDeltaPct}, spawned=[${(diff.spawnedPorts || []).join(',')}], terminated=[${(diff.terminatedPorts || []).join(',')}].`
    : 'No historical diff selected.';
  return [
    'You are a concise Linux systems reliability engineer analyzing live localhost telemetry.',
    'Respond in 3 short plain-text sentences: (1) current health assessment, (2) highest-priority anomaly or bottleneck if any, (3) one concrete operator action. No markdown hype.',
    `Telemetry: host=${live?.hostname}, cpu_busy=${live?.cpu?.busyPct}%, load1=${live?.cpu?.load1}/${live?.cpu?.coreCount} threads, packageC=${live?.thermals?.packageC}C, fanRpm=${live?.thermals?.fanRpm ?? 'n/a'}, memUsedPct=${live?.memory?.usedPct}%, swapPct=${live?.memory?.swapPct}%, listeners=${live?.listening?.count}, procs=${live?.processCount}.`,
    `Top listeners: ${topNodes || 'none'}.`,
    diffTxt,
  ].join('\n');
}

export async function analyzeTelemetry({ provider = 'auto', model = '', live, nodes = [], diff = null }) {
  const t0 = Date.now();
  const base = deterministicTriage({ live, nodes, diff });

  if (provider === 'deterministic') {
    return {
      mode: 'deterministic_rules',
      provider: 'deterministic',
      model: 'rule-engine-v2',
      latencyMs: Date.now() - t0,
      notice: 'Deterministic rule engine selected.',
      ...base,
    };
  }

  const providers = await detectProviders();

  let chosen = provider;
  if (chosen === 'auto') {
    const firstLive = providers.find(p => p.kind === 'local_http' && p.available && p.id !== 'azoth_local');
    chosen = firstLive ? firstLive.id : 'deterministic';
  }

  const pMeta = providers.find(p => p.id === chosen);
  if (!pMeta || !pMeta.available || chosen === 'deterministic') {
    return {
      mode: 'deterministic_rules',
      provider: 'deterministic',
      model: 'rule-engine-v2',
      latencyMs: Date.now() - t0,
      notice: chosen === 'deterministic' ? 'Deterministic rule engine selected.' : `Provider '${chosen}' unavailable; returned deterministic rule triage.`,
      ...base,
    };
  }

  if (pMeta.guarded) {
    return {
      mode: 'deterministic_rules',
      provider: chosen,
      model: 'rule-engine-v2',
      latencyMs: Date.now() - t0,
      notice: `Guarded CLI (${pMeta.reason}); returned deterministic rule triage.`,
      ...base,
    };
  }

  const safeModel = model && SAFE_MODEL_RE.test(model) ? model : pMeta.defaultModel;
  const prompt = buildTelemetryPrompt({ live, nodes, diff });

  try {
    if (chosen === 'agy_bridge') {
      const res = await fetch('http://127.0.0.1:18000/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: safeModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 220,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`AGY Bridge HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('empty completion');
      return {
        mode: 'live_ai',
        provider: chosen,
        model: data.model || safeModel,
        latencyMs: Date.now() - t0,
        summary: text,
        anomalies: base.anomalies,
        recommendations: base.recommendations,
      };
    }

    if (chosen === 'ollama_local') {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: safeModel, prompt, stream: false }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = await res.json();
      const text = data?.response?.trim();
      if (!text) throw new Error('empty ollama response');
      return {
        mode: 'live_ai',
        provider: chosen,
        model: safeModel,
        latencyMs: Date.now() - t0,
        summary: text,
        anomalies: base.anomalies,
        recommendations: base.recommendations,
      };
    }

    if (chosen === 'agy_cli' || chosen === 'hermes_cli') {
      const args = chosen === 'agy_cli' ? ['chat', '-p', prompt] : ['chat', '-q', prompt];
      const { stdout } = await execFileAsync(pMeta.bin, args, {
        encoding: 'utf8',
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });
      const text = (stdout || '').trim().slice(0, 1200);
      if (!text) throw new Error('empty CLI output');
      return {
        mode: 'live_ai',
        provider: chosen,
        model: chosen,
        latencyMs: Date.now() - t0,
        summary: text,
        anomalies: base.anomalies,
        recommendations: base.recommendations,
      };
    }
  } catch (err) {
    return {
      mode: 'deterministic_rules',
      provider: chosen,
      model: safeModel,
      latencyMs: Date.now() - t0,
      notice: `Live provider '${chosen}' failed (${err.message}); returned honest deterministic rule triage.`,
      ...base,
    };
  }

  return {
    mode: 'deterministic_rules',
    provider: chosen,
    model: 'rule-engine-v2',
    latencyMs: Date.now() - t0,
    notice: `Provider '${chosen}' does not expose direct chat triage; returned deterministic rule triage.`,
    ...base,
  };
}
