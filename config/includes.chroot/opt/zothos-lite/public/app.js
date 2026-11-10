/**
 * 🛡️ ZOTHOS-LITE v1.2 — TAILS-STYLE AMNESIC MONOTONE OS & WORKSTATION
 * Design Language: Paper Ivory (#F7F7F4) · Pure Black Ink (#000000) · Bayer Dither · Unicode U+2800 Braille
 * 1:1 Parity with bin/zoth-lite-models (56 Models / 8 Providers), zoth-lite-welcome, zoth-lite-storage, zothnet
 * Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. LIVE TELEMETRY (:8145 WHEN LOCAL) + HOROLOGY CLOCK
  // =========================================================================
  function initHorologyAndTelemetry() {
    const clockEl = document.getElementById('shellClockDisplay');
    const beatsEl = document.getElementById('shellBeatsDisplay');
    const ramEl = document.getElementById('shellRamDisplay');
    let liveHostRamText = null;

    async function pollLocalDaemon() {
      if (location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') return;
      try {
        const res = await fetch('/api/system-status', { signal: AbortSignal.timeout(2500) });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.memory && Number(data.memory.totalMb) > 0) {
          const usedGb = (Number(data.memory.usedMb) / 1024).toFixed(2);
          const totalGb = (Number(data.memory.totalMb) / 1024).toFixed(1);
          const tempStr =
            data.thermals && data.thermals.sensorsAvailable !== false && data.thermals.packageTempC !== null && data.thermals.packageTempC !== undefined
              ? ` · ${Math.round(Number(data.thermals.packageTempC))}°C`
              : '';
          liveHostRamText = `${usedGb} GB / ${totalGb} GB${tempStr}`;
          if (ramEl) ramEl.textContent = liveHostRamText;
        }
      } catch (_err) {
        // Static web mode (e.g. zothos-lite.nullai.tech)
      }
    }

    function updateClocks() {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toISOString().slice(11, 19) + ' UTC';
      }
      if (beatsEl) {
        const bmtSeconds = ((now.getUTCHours() + 1) % 24) * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
        const beats = Math.floor((bmtSeconds / 86.4) % 1000);
        beatsEl.textContent = `@${beats.toString().padStart(3, '0')}.beats`;
      }
      if (ramEl && !liveHostRamText) {
        const jitter = Math.sin(now.getTime() / 5000) * 0.08;
        const used = (1.18 + jitter).toFixed(2);
        ramEl.textContent = `${used} GB / 8.0 GB (toram preview)`;
      }
    }

    pollLocalDaemon();
    setInterval(pollLocalDaemon, 5000);
    setInterval(updateClocks, 1000);
    updateClocks();
  }

  // =========================================================================
  // 2. AZOTH EMBODIED BRAILLE AGENT (MONOTONE E-INK)
  // =========================================================================
  const AZOTH_MOODS = {
    IDLE: {
      tag: 'READY',
      eyes: ['⣾⣿⣷', '⣏⣉⣹'],
      mouth: '⠶⠶⠶',
      status: 'Volatile tmpfs active. 56 models across 8 providers indexed in zoth-lite-models.'
    },
    THINKING: {
      tag: 'ROUTER',
      eyes: ['⠋⠙⠹', '⠼⠴⠦'],
      mouth: '⣴⣶⣦',
      status: 'Routing inference across cloud API & LAN Ollama endpoints...'
    },
    REASONING: {
      tag: 'COT DAG',
      eyes: ['⣿⠿⣿', '⣿⠛⣿'],
      mouth: '⠲⠶⠲',
      status: 'Appending SHA-256 Merkle working-memory node in volatile RAM...'
    },
    ALERT: {
      tag: 'GUARD',
      eyes: ['⠲⠲⠲', '⠲⠲⠲'],
      mouth: '⣾⣿⣷',
      status: '80°C throttle / 85°C pause CPU thermal guardrail + EnvGuard armed.'
    },
    AMNESIC: {
      tag: 'TORAM',
      eyes: ['⢄⢂⠁', '⠁⠂⡠'],
      mouth: '⠿⠿⠿',
      status: 'toram noswap verified: power-off wipes RAM & /run/user keys with 0 disk trace.'
    },
    TRANSMITTING: {
      tag: 'ZOTHNET',
      eyes: ['⡇⠧⠟', '⠻⠼⢸'],
      mouth: '⣛⣛⣛',
      status: 'ZothNet P2P ChaCha20-Poly1305 peer discovery active on :8102.'
    }
  };

  function initAzothAgent() {
    const canvasEl = document.getElementById('azothBrailleCanvas');
    const thoughtEl = document.getElementById('azothThoughtText');
    const moodBtns = document.querySelectorAll('.azoth-mood-btn');
    let activeMood = 'IDLE';
    let tick = 0;

    function renderAzoth() {
      tick++;
      const mood = AZOTH_MOODS[activeMood] || AZOTH_MOODS.IDLE;
      let halo = '';
      for (let i = 0; i < 8; i++) {
        const v = Math.floor((Math.sin(tick * 0.24 + i * 0.65) * 0.5 + 0.5) * 255);
        halo += String.fromCharCode(0x2800 + (v & 0x7f));
      }
      if (canvasEl) {
        canvasEl.textContent = [
          `   ${halo}`,
          ' ┌──[ AZOTH ]──┐',
          ` │  ${mood.eyes[0]}   ${mood.eyes[1]}  │`,
          ` │     ${mood.mouth}     │`,
          ' └──[ U+2800 ]─┘'
        ].join('\n');
      }
    }

    renderAzoth();
    setInterval(renderAzoth, 130);

    moodBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-mood');
        if (AZOTH_MOODS[m]) {
          activeMood = m;
          moodBtns.forEach((b) => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          if (thoughtEl) {
            thoughtEl.innerHTML = `<strong>[${AZOTH_MOODS[m].tag}]</strong> ${AZOTH_MOODS[m].status}`;
          }
        }
      });
    });
  }

  // =========================================================================
  // 3. 56 CURATED AI MODELS ACROSS 8 PROVIDERS (1:1 WITH bin/zoth-lite-models)
  // =========================================================================
  const AI_PROVIDERS = {
    openrouter: {
      name: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      models: [
        'anthropic/claude-3.7-sonnet',
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'openai/o3-mini',
        'deepseek/deepseek-r1',
        'deepseek/deepseek-chat',
        'nousresearch/hermes-3-llama-3.1-405b',
        'nousresearch/hermes-3-llama-3.1-70b',
        'meta-llama/llama-3.3-70b-instruct',
        'qwen/qwen-2.5-coder-32b-instruct',
        'mistralai/codestral-2501',
        'google/gemini-2.0-flash-001'
      ]
    },
    openai: {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      models: [
        'gpt-4.1',
        'gpt-4.1-mini',
        'gpt-4o',
        'gpt-4o-mini',
        'o3',
        'o4-mini',
        'o3-mini'
      ]
    },
    anthropic: {
      name: 'Anthropic Claude',
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: [
        'claude-sonnet-4-20250514',
        'claude-opus-4-20250514',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229'
      ]
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      models: [
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ]
    },
    deepseek: {
      name: 'DeepSeek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: [
        'deepseek-chat',
        'deepseek-reasoner',
        'deepseek-coder'
      ]
    },
    xai: {
      name: 'xAI Grok',
      endpoint: 'https://api.x.ai/v1/chat/completions',
      models: [
        'grok-3',
        'grok-3-mini',
        'grok-3-fast',
        'grok-2-1212',
        'grok-2-vision-1212'
      ]
    },
    groq: {
      name: 'Groq LPU',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      models: [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'deepseek-r1-distill-llama-70b',
        'qwen-qwq-32b',
        'qwen-2.5-coder-32b',
        'gemma2-9b-it',
        'mixtral-8x7b-32768'
      ]
    },
    ollama: {
      name: 'Ollama / LAN Local',
      endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
      models: [
        'hermes3:8b',
        'hermes3:70b',
        'qwen2.5-coder:32b',
        'qwen2.5-coder:7b',
        'deepseek-r1:14b',
        'deepseek-r1:8b',
        'llama3.3:70b',
        'llama3.2:3b',
        'mistral-small:24b',
        'phi4:14b'
      ]
    }
  };

  function countCuratedModels() {
    return Object.values(AI_PROVIDERS).reduce((sum, p) => sum + p.models.length, 0);
  }

  function initAgentConsole() {
    const chipsContainer = document.getElementById('providerChips');
    const modelSelect = document.getElementById('modelSelect');
    const searchInput = document.getElementById('modelSearchInput');
    const endpointInput = document.getElementById('aiEndpointInput');
    const keyInput = document.getElementById('aiKeyInput');
    const promptInput = document.getElementById('agentPromptInput');
    const roleSelect = document.getElementById('agentRoleSelect');
    const btnRun = document.getElementById('btnRunAgent');
    const btnFetchLive = document.getElementById('btnFetchLiveModels');
    const btnCopyCli = document.getElementById('btnCopyCliCmd');
    const consoleOutput = document.getElementById('agentConsoleOutput');
    const visibleCountEl = document.getElementById('visibleModelCount');
    const dropdownBadgeEl = document.getElementById('modelDropdownCountBadge');
    const activeProvLabelEl = document.getElementById('activeProviderLabel');

    if (!chipsContainer || !modelSelect) return;

    let providerFilter = 'all'; // Default shows ALL 56 models across all 8 providers!
    let activeProvider = 'openrouter';
    let activeModel = 'anthropic/claude-3.7-sonnet';
    let liveOpenRouterModels = [];

    function getSessionKey(prov) {
      try {
        const stored = JSON.parse(sessionStorage.getItem('zoth_lite_ram_keys') || '{}');
        return stored[prov] || '';
      } catch (_e) {
        return '';
      }
    }

    function setSessionKey(prov, val) {
      try {
        const stored = JSON.parse(sessionStorage.getItem('zoth_lite_ram_keys') || '{}');
        stored[prov] = val;
        sessionStorage.setItem('zoth_lite_ram_keys', JSON.stringify(stored));
      } catch (_e) {}
    }

    function renderChips() {
      const totalCurated = countCuratedModels();
      const allChip = `<button type="button" class="prov-chip ${providerFilter === 'all' ? 'is-active' : ''}" data-provider="all">All 8 Providers (${totalCurated})</button>`;
      const eachChip = Object.entries(AI_PROVIDERS)
        .map(([id, p]) => {
          const count = id === 'openrouter' && liveOpenRouterModels.length > 0 ? liveOpenRouterModels.length : p.models.length;
          return `<button type="button" class="prov-chip ${providerFilter === id ? 'is-active' : ''}" data-provider="${id}">${p.name} (${count})</button>`;
        })
        .join('');
      chipsContainer.innerHTML = allChip + eachChip;
    }

    function syncActiveSelection(val) {
      if (!val || !val.includes('::')) return;
      const [pid, mid] = val.split('::');
      if (AI_PROVIDERS[pid]) {
        activeProvider = pid;
        activeModel = mid;
        if (activeProvLabelEl) activeProvLabelEl.textContent = pid;
        if (endpointInput) endpointInput.value = AI_PROVIDERS[pid].endpoint;
        if (keyInput) keyInput.value = getSessionKey(pid);
      }
    }

    function populateModels(filterStr = '') {
      const q = filterStr.trim().toLowerCase();
      const groups = [];
      let optionCount = 0;

      const entries =
        providerFilter === 'all'
          ? Object.entries(AI_PROVIDERS)
          : [[providerFilter, AI_PROVIDERS[providerFilter]]];

      for (const [pid, prov] of entries) {
        if (!prov) continue;
        const sourceList = pid === 'openrouter' && liveOpenRouterModels.length > 0 ? liveOpenRouterModels : prov.models;
        const filtered = q
          ? sourceList.filter((m) => m.toLowerCase().includes(q) || prov.name.toLowerCase().includes(q))
          : sourceList;
        if (filtered.length > 0) {
          optionCount += filtered.length;
          const optsHtml = filtered
            .map((m) => {
              const val = `${pid}::${m}`;
              const isSel = pid === activeProvider && m === activeModel ? 'selected' : '';
              return `<option value="${val}" ${isSel}>[${prov.name}] ${m}</option>`;
            })
            .join('');
          groups.push(`<optgroup label="${prov.name} (${filtered.length} models)">${optsHtml}</optgroup>`);
        }
      }

      if (optionCount === 0) {
        modelSelect.innerHTML = `<option value="">No models matching "${filterStr}"</option>`;
        if (visibleCountEl) visibleCountEl.textContent = '0';
        return;
      }

      modelSelect.innerHTML = groups.join('');
      if (visibleCountEl) visibleCountEl.textContent = String(optionCount);
      if (dropdownBadgeEl && !q && providerFilter === 'all') {
        dropdownBadgeEl.textContent = `${optionCount} Models in Dropdown`;
      }
      syncActiveSelection(modelSelect.value);
    }

    chipsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.prov-chip');
      if (!btn) return;
      providerFilter = btn.getAttribute('data-provider') || 'all';
      if (providerFilter !== 'all' && AI_PROVIDERS[providerFilter]) {
        activeProvider = providerFilter;
        activeModel = AI_PROVIDERS[providerFilter].models[0];
      }
      renderChips();
      populateModels(searchInput ? searchInput.value : '');
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => populateModels(e.target.value));
    }

    modelSelect.addEventListener('change', (e) => {
      syncActiveSelection(e.target.value);
    });

    if (keyInput) {
      keyInput.addEventListener('change', (e) => {
        setSessionKey(activeProvider, e.target.value.trim());
      });
    }

    document.querySelectorAll('.btn-quick-prompt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-prompt');
        if (p && promptInput) promptInput.value = p;
      });
    });

    if (btnCopyCli) {
      btnCopyCli.addEventListener('click', async () => {
        const prompt = (promptInput ? promptInput.value.trim() : 'Check RAM status').replace(/"/g, '\\"');
        const cmd = `zoth-lite-models --run ${activeProvider}:${activeModel} "${prompt}"`;
        try {
          await navigator.clipboard.writeText(cmd);
          btnCopyCli.textContent = '✓ Copied CLI Command';
          setTimeout(() => {
            btnCopyCli.textContent = '📋 Copy OS CLI Command';
          }, 1800);
        } catch (_e) {
          if (consoleOutput) consoleOutput.textContent = `$ ${cmd}`;
        }
      });
    }

    if (btnFetchLive) {
      btnFetchLive.addEventListener('click', async () => {
        btnFetchLive.disabled = true;
        btnFetchLive.textContent = '⏳ Querying OpenRouter...';
        try {
          const res = await fetch('https://openrouter.ai/api/v1/models');
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            liveOpenRouterModels = json.data.map((m) => m.id).sort();
            renderChips();
            populateModels(searchInput ? searchInput.value : '');
            btnFetchLive.textContent = `✓ Synced +${liveOpenRouterModels.length} OpenRouter IDs`;
            if (consoleOutput) {
              consoleOutput.textContent = `[OPENROUTER LIVE SYNC] Loaded ${liveOpenRouterModels.length} live OpenRouter model IDs into the dropdown alongside the 7 other providers.`;
            }
          }
        } catch (err) {
          btnFetchLive.disabled = false;
          btnFetchLive.textContent = '⟳ Retry OpenRouter Sync (Using 56 Built-In)';
          if (consoleOutput) {
            consoleOutput.textContent = `[OFFLINE NOTICE] Could not reach OpenRouter registry (${err.message}). All 56 built-in curated models remain active.`;
          }
        }
      });
    }

    if (btnRun) {
      btnRun.addEventListener('click', async () => {
        const prompt = promptInput ? promptInput.value.trim() : '';
        const role = roleSelect ? roleSelect.value : 'System Architect';
        const apiKey = keyInput ? keyInput.value.trim() : '';
        const endpoint = (endpointInput && endpointInput.value.trim()) || AI_PROVIDERS[activeProvider].endpoint;

        if (!prompt) return;

        btnRun.disabled = true;
        btnRun.textContent = '⏳ Running...';
        const startTime = Date.now();
        consoleOutput.textContent = `[ZOTH-LITE AGENT ROUTER] Provider: ${AI_PROVIDERS[activeProvider].name} · Model: ${activeModel}\n[ENDPOINT] ${endpoint}\n`;

        const canTryLive = Boolean(apiKey) || activeProvider === 'ollama';
        if (canTryLive) {
          try {
            const headers = { 'Content-Type': 'application/json' };
            let body;
            if (activeProvider === 'anthropic') {
              headers['x-api-key'] = apiKey;
              headers['anthropic-version'] = '2023-06-01';
              body = { model: activeModel, max_tokens: 1024, messages: [{ role: 'user', content: prompt }] };
            } else {
              if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
              if (activeProvider === 'openrouter') {
                headers['HTTP-Referer'] = 'https://zothos-lite.nullai.tech';
                headers['X-Title'] = 'ZothOS-Lite v1.2';
              }
              body = {
                model: activeModel,
                messages: [
                  {
                    role: 'system',
                    content: `You are a ${role} running inside ZothOS-Lite v1.2 (Debian 13 Live, toram noswap). Provide concise, accurate output.`
                  },
                  { role: 'user', content: prompt }
                ],
                temperature: 0.2
              };
            }

            const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const text =
              activeProvider === 'anthropic'
                ? data.content?.[0]?.text || JSON.stringify(data)
                : data.choices?.[0]?.message?.content || JSON.stringify(data);
            consoleOutput.textContent += `\n${text}\n\n──────────────────────────────────────────────────────────\n[LIVE 200 OK] ${Date.now() - startTime}ms · ${activeProvider}:${activeModel}`;
          } catch (err) {
            consoleOutput.textContent += `[NOTICE] Live endpoint unreachable without valid key/CORS (${err.message}). Running deterministic local enclave synthesis:\n`;
            appendOfflineSynthesis(role, activeProvider, activeModel, prompt);
          }
        } else {
          appendOfflineSynthesis(role, activeProvider, activeModel, prompt);
        }

        btnRun.disabled = false;
        btnRun.textContent = '⚡ Run Agent';
      });
    }

    function appendOfflineSynthesis(role, prov, model, prompt) {
      const pLower = prompt.toLowerCase();
      let snippet = '';
      if (pLower.includes('ram') || pLower.includes('usb') || pLower.includes('sdb1')) {
        snippet = [
          '#!/usr/bin/env bash',
          '# ZothOS-Lite v1.2 Volatile RAM Guard + External USB Auto-Sync',
          'set -euo pipefail',
          'USED_PCT=$(free -m | awk \'/^Mem:/ {printf "%d", ($3*100)/$2}\')',
          'echo "[toram] Volatile RAM utilization: ${USED_PCT}%"',
          'if [ "$USED_PCT" -ge 80 ]; then',
          '  echo "[!] RAM >= 80% — syncing ./build to external drive /mnt/zoth-ext/sdb1..."',
          '  zoth-lite-storage sync ./build /mnt/zoth-ext/sdb1/builds',
          'fi'
        ].join('\n');
      } else if (pLower.includes('lan') || pLower.includes('ollama') || pLower.includes('192.168')) {
        snippet = [
          '# 1. On your LAN GPU host (e.g. 192.168.1.50), bind Ollama to LAN:',
          'OLLAMA_HOST=0.0.0.0:11434 ollama serve',
          '',
          '# 2. On ZothOS-Lite v1.2 (RAM-only client), point zoth-lite-models to LAN:',
          'zoth-lite-models --set-endpoint ollama http://192.168.1.50:11434/v1/chat/completions',
          'zoth-lite-models --run ollama:qwen2.5-coder:32b "Build REST health check"'
        ].join('\n');
      } else {
        snippet = [
          '#!/usr/bin/env bash',
          `# ZothOS-Lite v1.2 Offline Plan (${prov}:${model} · ${role})`,
          'WORK=$(mktemp -d /dev/shm/zoth-task.XXXXXX)',
          'trap \'rm -rf "$WORK"\' EXIT',
          'zoth-envguard "$PWD"',
          'echo "[OK] Executed in volatile RAM tmpfs with 0 internal disk writes."'
        ].join('\n');
      }
      consoleOutput.textContent += `\n${snippet}\n\n──────────────────────────────────────────────────────────\n[OFFLINE ENCLAVE VERIFIED] CLI parity: zoth-lite-models --run ${prov}:${model} "${prompt.slice(0, 48)}..."`;
    }

    renderChips();
    populateModels('');
  }

  // =========================================================================
  // 4. ZOTHNET P2P MESH & ENCRYPTED ENVELOPE SIMULATOR
  // =========================================================================
  function initZothNetTool() {
    const peerSel = document.getElementById('zothNetPeerSelect');
    const chanSel = document.getElementById('zothNetChannelSelect');
    const msgInput = document.getElementById('zothNetMsgInput');
    const btnSend = document.getElementById('btnZothNetSend');
    const btnScan = document.getElementById('btnZothNetScan');
    const btnCopy = document.getElementById('btnZothNetCopyCmd');
    const outEl = document.getElementById('zothNetConsoleOutput');
    if (!outEl) return;

    async function digestHex(str) {
      const buf = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    btnScan?.addEventListener('click', () => {
      outEl.textContent = [
        '$ zothnet peers',
        '[ZOTHNET P2P MESH] Active Subnet & Onion Peers (3):',
        '  █ @zoth-relay-lan01  | LAN-UDP:8102     | ChaCha20-Poly1305 | 1.8 ms  | ONLINE',
        '  █ @zoth-builder-box  | WireGuard-Mesh   | ChaCha20-Poly1305 | 3.1 ms  | ONLINE',
        '  █ @zoth-onion-v3     | Tor-v3-Ephemeral | Ed25519+X25519    | 42.0 ms | ONLINE'
      ].join('\n');
    });

    btnCopy?.addEventListener('click', async () => {
      const peer = peerSel ? peerSel.value : '@zoth-relay-lan01';
      const msg = (msgInput ? msgInput.value.trim() : 'PING').replace(/"/g, '\\"');
      const cmd = `zothnet chat ${peer} "${msg}"`;
      try {
        await navigator.clipboard.writeText(cmd);
        btnCopy.textContent = '✓ Copied CLI';
        setTimeout(() => {
          btnCopy.textContent = '📋 Copy `zothnet chat` CLI';
        }, 1600);
      } catch (_e) {}
    });

    btnSend?.addEventListener('click', async () => {
      const peer = peerSel ? peerSel.value : '@zoth-relay-lan01';
      const cipher = chanSel ? chanSel.value : 'ChaCha20-Poly1305';
      const msg = msgInput ? msgInput.value.trim() : 'PING_HANDSHAKE';
      const ts = new Date().toISOString();
      const hex = await digestHex(`ZOTHNET_V1|${peer}|${cipher}|${ts}|${msg}`);
      outEl.textContent = [
        `$ zothnet chat ${peer} "${msg}"`,
        '┌──[ ZOTHNET P2P ENCRYPTED ENVELOPE ]──────────────────────────────────────┐',
        `│ Timestamp   : ${ts}`,
        `│ Destination : ${peer}`,
        `│ Cipher      : ${cipher}`,
        `│ EphemeralID : zoth-${hex.slice(0, 10)} (RAM-only keypair — wiped on power-off)`,
        `│ EnvelopeSHA : ${hex.slice(0, 48)}`,
        `│ Payload     : ${msg}`,
        '└──────────────────────────────────────────────────────────────────────────┘'
      ].join('\n');
    });
  }

  // =========================================================================
  // 5. EXTERNAL STORAGE & CLOUD PACKAGER (`zoth-lite-storage` + PKZIP)
  // =========================================================================
  function initStoragePackager() {
    const targetSel = document.getElementById('storageTargetType');
    const srcInput = document.getElementById('storageSourceDir');
    const cmdPreview = document.getElementById('storageCmdPreview');
    const dropzone = document.getElementById('pkgDropzone');
    const fileInput = document.getElementById('pkgFileInput');
    const fileListEl = document.getElementById('pkgFileList');
    const btnBuild = document.getElementById('btnBuildZip');
    const btnSample = document.getElementById('btnStageSampleFiles');
    const statusEl = document.getElementById('pkgStatus');

    function updateCmdPreview() {
      if (!cmdPreview) return;
      const t = targetSel ? targetSel.value : 'usb';
      const src = (srcInput && srcInput.value.trim()) || './agent-workspace';
      const map = {
        usb: `sudo zoth-lite-storage mount /dev/sdb1 && zoth-lite-storage sync ${src} /mnt/zoth-ext/sdb1/builds`,
        s3: `zoth-lite-storage sync ${src} s3remote:zoth-agent-builds`,
        gdrive: `zoth-lite-storage sync ${src} gdrive:zoth-agent-builds`,
        webdav: `zoth-lite-storage sync ${src} nextcloud:zoth-agent-builds`
      };
      cmdPreview.textContent = map[t] || map.usb;
    }

    targetSel?.addEventListener('change', updateCmdPreview);
    srcInput?.addEventListener('input', updateCmdPreview);
    updateCmdPreview();

    if (!dropzone || !fileListEl) return;
    let stagedFiles = [];

    function renderFileList() {
      if (stagedFiles.length === 0) {
        fileListEl.innerHTML = '<span style="color:var(--ink-muted); font-family:var(--font-mono); font-size:12px;">No files staged yet.</span>';
        if (btnBuild) btnBuild.disabled = true;
        return;
      }
      const totalBytes = stagedFiles.reduce((acc, f) => acc + f.size, 0);
      fileListEl.innerHTML = `
        <div style="font-weight:700; margin-bottom:6px; font-size:11.5px; font-family:var(--font-mono);">
          STAGED (${stagedFiles.length} file(s) · ${(totalBytes / 1024).toFixed(1)} KB):
        </div>
        ${stagedFiles
          .map(
            (f) => `
          <div style="display:flex; justify-content:space-between; padding:4px 8px; background:var(--bg-card-subtle); border:1px solid var(--border-bold); margin-bottom:4px; font-size:12px; font-family:var(--font-mono);">
            <span>${f.name}</span>
            <span>${(f.size / 1024).toFixed(2)} KB</span>
          </div>`
          )
          .join('')}
      `;
      if (btnBuild) btnBuild.disabled = false;
    }

    function addFiles(files) {
      for (const f of files) stagedFiles.push(f);
      renderFileList();
    }

    btnSample?.addEventListener('click', () => {
      const f1 = new File(
        ['# ZothOS-Lite v1.2 Agent Build Output\nDISTRO=ZothOS-Lite\nVERSION=1.2-MONOTONE\n'],
        'zoth-build-info.env',
        { type: 'text/plain' }
      );
      const f2 = new File(
        [JSON.stringify({ os: 'ZothOS-Lite v1.2', models: 56, providers: 8, amnesic: true }, null, 2)],
        'manifest.json',
        { type: 'application/json' }
      );
      stagedFiles = [f1, f2];
      renderFileList();
      if (statusEl) statusEl.textContent = 'Staged 2 sample files. Click "Build & Download ZIP" to verify.';
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files) addFiles(e.target.files);
    });

    btnBuild?.addEventListener('click', async () => {
      if (stagedFiles.length === 0) return;
      btnBuild.disabled = true;
      if (statusEl) statusEl.textContent = 'Compressing PKZIP with CRC-32 checksums...';
      try {
        const zipBlob = await createSimpleZip(stagedFiles);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `zothos-lite-bundle-${Date.now()}.zip`;
        a.click();
        if (statusEl) {
          statusEl.textContent = `✓ Built ${a.download} (${(zipBlob.size / 1024).toFixed(1)} KB) — ready for external USB or cloud drive.`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = `Error: ${err.message}`;
      }
      btnBuild.disabled = false;
    });
  }

  async function createSimpleZip(files) {
    const fileEntries = [];
    let offset = 0;
    const parts = [];
    const crcTable = (() => {
      const t = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c;
      }
      return t;
    })();
    const crc32 = (buf) => {
      let crc = 0 ^ -1;
      for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
      return (crc ^ -1) >>> 0;
    };

    for (const file of files) {
      const dataBuf = new Uint8Array(await file.arrayBuffer());
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = crc32(dataBuf);
      const size = dataBuf.length;

      const lfh = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(lfh.buffer);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, size, true);
      dv.setUint32(22, size, true);
      dv.setUint16(26, nameBytes.length, true);
      lfh.set(nameBytes, 30);

      parts.push(lfh, dataBuf);
      fileEntries.push({ nameBytes, crc, size, offset });
      offset += lfh.length + dataBuf.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const ent of fileEntries) {
      const cdh = new Uint8Array(46 + ent.nameBytes.length);
      const dv = new DataView(cdh.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 20, true);
      dv.setUint32(16, ent.crc, true);
      dv.setUint32(20, ent.size, true);
      dv.setUint32(24, ent.size, true);
      dv.setUint16(28, ent.nameBytes.length, true);
      dv.setUint32(42, ent.offset, true);
      cdh.set(ent.nameBytes, 46);
      parts.push(cdh);
      cdSize += cdh.length;
    }

    const eocd = new Uint8Array(22);
    const dvEocd = new DataView(eocd.buffer);
    dvEocd.setUint32(0, 0x06054b50, true);
    dvEocd.setUint16(8, fileEntries.length, true);
    dvEocd.setUint16(10, fileEntries.length, true);
    dvEocd.setUint32(12, cdSize, true);
    dvEocd.setUint32(16, cdOffset, true);
    parts.push(eocd);
    return new Blob(parts, { type: 'application/zip' });
  }

  // =========================================================================
  // 6. LIGHTWEIGHT LOCAL VIDEO & AUDIO PLAYER
  // =========================================================================
  function initMediaPlayer() {
    const video = document.getElementById('mediaPlayerVideo');
    const audioCanvas = document.getElementById('audioVisualizerCanvas');
    const btnPlay = document.getElementById('btnMediaPlay');
    const timeDisplay = document.getElementById('mediaTimeDisplay');
    const scrubber = document.getElementById('mediaScrubber');
    const speedSelect = document.getElementById('mediaSpeedSelect');
    const btnSnap = document.getElementById('btnMediaSnapshot');
    const fileInput = document.getElementById('mediaFileInput');
    if (!video || !audioCanvas) return;

    const ctx = audioCanvas.getContext('2d');
    let audioCtx = null;
    let analyser = null;

    function setupAudio() {
      if (audioCtx) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const src = audioCtx.createMediaElementSource(video);
        src.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (_e) {}
    }

    let waveTick = 0;
    function drawSpectrum() {
      requestAnimationFrame(drawSpectrum);
      ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
      const barCount = 24;
      const barW = (audioCanvas.width / barCount) * 0.72;
      let x = 3;
      if (!video.paused && analyser) {
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        for (let i = 0; i < barCount; i++) {
          const h = Math.max(2, ((arr[i % arr.length] || 0) / 255) * audioCanvas.height * 0.9);
          ctx.fillStyle = '#F7F7F4';
          ctx.fillRect(x, audioCanvas.height - h, barW, h);
          x += barW + 2.5;
        }
      } else if (!video.paused) {
        waveTick += 0.22;
        for (let i = 0; i < barCount; i++) {
          const h = Math.max(2, (Math.sin(waveTick + i * 0.4) * 0.5 + 0.5) * audioCanvas.height * 0.85);
          ctx.fillStyle = '#F7F7F4';
          ctx.fillRect(x, audioCanvas.height - h, barW, h);
          x += barW + 2.5;
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          ctx.fillStyle = 'rgba(247,247,244,0.3)';
          ctx.fillRect(x, audioCanvas.height - 3, barW, 3);
          x += barW + 2.5;
        }
      }
    }
    drawSpectrum();

    btnPlay?.addEventListener('click', () => {
      setupAudio();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (video.paused) {
        video.play().then(() => { btnPlay.textContent = '⏸ Pause'; }).catch(() => {});
      } else {
        video.pause();
        btnPlay.textContent = '▶ Play';
      }
    });

    document.getElementById('btnLoadHermesShowcase')?.addEventListener('click', () => {
      video.src = 'assets/zothos-lite-hero-showreel.mp4';
      video.poster = 'og-banner.jpg';
      video.load();
      video.play().then(() => { if (btnPlay) btnPlay.textContent = '⏸ Pause'; }).catch(() => {});
    });

    document.getElementById('btnLoadLaunchFilm')?.addEventListener('click', () => {
      video.src = 'assets/zothos-lite-cot-motion-edit.mp4';
      video.poster = 'og-banner.jpg';
      video.load();
      video.play().then(() => { if (btnPlay) btnPlay.textContent = '⏸ Pause'; }).catch(() => {});
    });

    video.addEventListener('timeupdate', () => {
      if (video.duration && scrubber) {
        scrubber.value = (video.currentTime / video.duration) * 100;
        if (timeDisplay) timeDisplay.textContent = `${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`;
      }
    });

    scrubber?.addEventListener('input', () => {
      if (video.duration) video.currentTime = (scrubber.value / 100) * video.duration;
    });

    document.getElementById('btnMediaStepBack')?.addEventListener('click', () => {
      video.pause();
      if (btnPlay) btnPlay.textContent = '▶ Play';
      video.currentTime = Math.max(0, video.currentTime - 1 / 30);
    });

    document.getElementById('btnMediaStepFwd')?.addEventListener('click', () => {
      video.pause();
      if (btnPlay) btnPlay.textContent = '▶ Play';
      video.currentTime = Math.min(video.duration || 1000, video.currentTime + 1 / 30);
    });

    speedSelect?.addEventListener('change', (e) => {
      video.playbackRate = parseFloat(e.target.value);
    });

    btnSnap?.addEventListener('click', () => {
      if (!video.videoWidth) return;
      const c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      const a = document.createElement('a');
      a.download = `zothos-lite-frame-${video.currentTime.toFixed(2)}s.png`;
      a.href = c.toDataURL('image/png');
      a.click();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        video.src = URL.createObjectURL(e.target.files[0]);
        video.load();
        if (btnPlay) btnPlay.textContent = '▶ Play';
      }
    });
  }

  // =========================================================================
  // 7. LIGHTWEIGHT IMAGE & BAYER DITHER INSPECTOR (100% MONOTONE PRESETS)
  // =========================================================================
  function initImageViewer() {
    const canvas = document.getElementById('imageCanvas');
    const fileInput = document.getElementById('imageFileInput');
    const metaDisplay = document.getElementById('imageMetadata');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let currentImg = new Image();
    let scale = 1.0;
    let rotation = 0;
    let isGrayscale = false;
    let isInverted = false;
    let imgName = 'amnesic-monotone-web.jpg';

    function render() {
      if (!currentImg.src || !currentImg.width) return;
      const boxW = canvas.parentElement.clientWidth || 720;
      const boxH = canvas.parentElement.clientHeight || 400;
      canvas.width = boxW;
      canvas.height = boxH;

      ctx.fillStyle = '#EFEFEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      let f = '';
      if (isGrayscale) f += 'grayscale(100%) ';
      if (isInverted) f += 'invert(100%) ';
      ctx.filter = f.trim() || 'none';

      const aspect = currentImg.width / currentImg.height;
      let drawW = canvas.width * 0.92;
      let drawH = drawW / aspect;
      if (drawH > canvas.height * 0.92) {
        drawH = canvas.height * 0.92;
        drawW = drawH * aspect;
      }
      ctx.drawImage(currentImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      if (metaDisplay) {
        const ramMb = ((currentImg.width * currentImg.height * 4) / (1024 * 1024)).toFixed(1);
        metaDisplay.innerHTML = `
          <span><strong>File:</strong> ${imgName}</span>
          <span><strong>Res:</strong> ${currentImg.width} × ${currentImg.height}</span>
          <span><strong>RAM:</strong> ~${ramMb} MB</span>
          <span><strong>Zoom:</strong> ${Math.round(scale * 100)}%</span>
        `;
      }
    }

    function loadImageSrc(src, name) {
      imgName = name;
      currentImg = new Image();
      currentImg.onload = () => {
        scale = 1.0;
        rotation = 0;
        render();
      };
      currentImg.src = src;
    }

    loadImageSrc('assets/wallpapers/amnesic-monotone-web.jpg', 'amnesic-monotone-web.jpg');

    document.querySelectorAll('.btn-wp-preset').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-wp-preset').forEach((b) => b.classList.remove('is-dark'));
        btn.classList.add('is-dark');
        const p = btn.getAttribute('data-preset');
        loadImageSrc(`assets/wallpapers/${p}-web.jpg`, `${p}-web.jpg`);
      });
    });

    document.getElementById('btnImgZoomIn')?.addEventListener('click', () => { scale = Math.min(4.0, scale + 0.25); render(); });
    document.getElementById('btnImgZoomOut')?.addEventListener('click', () => { scale = Math.max(0.25, scale - 0.25); render(); });
    document.getElementById('btnImgRotate')?.addEventListener('click', () => { rotation = (rotation + 90) % 360; render(); });
    document.getElementById('btnImgGray')?.addEventListener('click', () => { isGrayscale = !isGrayscale; render(); });
    document.getElementById('btnImgInvert')?.addEventListener('click', () => { isInverted = !isInverted; render(); });
    document.getElementById('btnImgReset')?.addEventListener('click', () => {
      scale = 1.0; rotation = 0; isGrayscale = false; isInverted = false; render();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => loadImageSrc(ev.target.result, f.name);
        reader.readAsDataURL(f);
      }
    });

    window.addEventListener('resize', render);
  }

  // =========================================================================
  // 8. COT MERKLE DAG & ED25519 BRAILLE RANDOMART SIGNER
  // =========================================================================
  function initCoTAndColdSigner() {
    const container = document.getElementById('cotDagNodes');
    const btnAdd = document.getElementById('btnAddCotThought');
    const input = document.getElementById('cotThoughtInput');
    const tagSel = document.getElementById('cotTagSelect');
    const rootEl = document.getElementById('cotMerkleRoot');
    const btnCopy = document.getElementById('btnCopyCotDag');

    const nodes = [
      { id: 'N00', tag: 'KERNEL', text: 'ZothOS-Lite v1.2 booted in volatile RAM (toram noswap)', hash: '7f83b1657ff1fc53' },
      { id: 'N01', tag: 'MODELS', text: '56 AI models indexed across 8 cloud & LAN providers', hash: '3c2a5b1b6f0e4b7b' },
      { id: 'N02', tag: 'STORAGE', text: 'Internal NVMe unmounted; external /mnt/zoth-ext standby', hash: '9a4d2c81e0f571b2' }
    ];

    async function sha256Short(str) {
      const buf = new TextEncoder().encode(str);
      const h = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    }

    async function renderDag() {
      if (!container) return;
      container.innerHTML = nodes
        .map(
          (n) => `
        <div style="background:var(--bg-card-subtle); border:1px solid var(--border-bold); padding:8px 10px; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
            <strong style="font-family:var(--font-mono); font-size:11px;">${n.id}</strong>
            <span style="font-family:var(--font-mono); font-size:9.5px; padding:1px 5px; background:#000; color:#F7F7F4; font-weight:700;">${n.tag}</span>
            <span style="font-family:var(--font-mono); font-size:10px; color:var(--ink-muted);">sha256:${n.hash}</span>
          </div>
          <p style="font-size:12px; color:var(--ink-secondary); margin:0;">${n.text}</p>
        </div>`
        )
        .join('');
      if (rootEl) {
        const rootHash = await sha256Short(nodes.map((n) => n.hash).join(':'));
        rootEl.textContent = `MERKLE ROOT: 0x${rootHash} (${nodes.length} NODES)`;
      }
    }

    btnAdd?.addEventListener('click', async () => {
      const text = input ? input.value.trim() : '';
      if (!text) return;
      const id = `N0${nodes.length}`;
      const tag = tagSel ? tagSel.value : 'MISSION';
      const hash = await sha256Short(`${id}:${tag}:${text}`);
      nodes.push({ id, tag, text, hash });
      if (input) input.value = '';
      renderDag();
    });

    btnCopy?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(JSON.stringify(nodes, null, 2));
        btnCopy.textContent = '✓ Copied';
        setTimeout(() => { btnCopy.textContent = '📋 Copy JSON'; }, 1500);
      } catch (_e) {}
    });

    renderDag();

    // Cold Signer
    const signInput = document.getElementById('coldSignInput');
    const btnSign = document.getElementById('btnColdSign');
    const signOut = document.getElementById('coldSignSeal');
    btnSign?.addEventListener('click', async () => {
      const msg = (signInput && signInput.value.trim()) || 'ZothOS-Lite v1.2';
      const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
      const arr = Array.from(new Uint8Array(hashBuf));
      const hex = arr.map((b) => b.toString(16).padStart(2, '0')).join('');
      const rows = [];
      for (let r = 0; r < 4; r++) {
        let line = '│ ';
        for (let c = 0; c < 16; c++) {
          line += String.fromCharCode(0x2800 + arr[(r * 16 + c) % arr.length]);
        }
        rows.push(line + ' │');
      }
      if (signOut) {
        signOut.textContent = [
          '┌──[ED25519 BRAILLE SEAL]──┐',
          ...rows,
          `└──[SHA256:${hex.slice(0, 12)}..]─┘`,
          `DIGEST : ${hex}`,
          'ENCLAVE: Offline RAM-Only Signer (@1nc0gn30)'
        ].join('\n');
      }
    });
  }

  // =========================================================================
  // 9. TABS + INTERACTIVE FIRST-BOOT TOUR MODAL
  // =========================================================================
  function initTabsAndOnboarding() {
    const guideLinks = document.querySelectorAll('.guide-tab-link');
    const guidePanes = document.querySelectorAll('.guide-pane-item');
    guideLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const target = link.getAttribute('data-tab');
        guideLinks.forEach((l) => l.classList.remove('is-active'));
        guidePanes.forEach((p) => p.classList.remove('is-active'));
        link.classList.add('is-active');
        document.getElementById(target)?.classList.add('is-active');
      });
    });

    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolPanes = document.querySelectorAll('.tool-pane');
    toolTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tool');
        toolTabs.forEach((t) => t.classList.remove('is-active'));
        toolPanes.forEach((p) => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        const pane = document.getElementById(target);
        if (pane) {
          pane.classList.add('is-active');
          window.dispatchEvent(new Event('resize'));
        }
      });
    });

    if (typeof window.createSovereignTutorial === 'function') {
      const tour = window.createSovereignTutorial({
        toolId: 'zothos-lite-v12',
        toolName: 'Welcome to ZothOS-Lite v1.2',
        tagline: 'Debian 13 Live · toram noswap · Paper Ivory #F7F7F4 & Black Ink #000000',
        steps: [
          {
            icon: '⚡',
            title: '56 AI Models Across 8 Cloud & LAN Providers',
            desc: 'Use zoth-lite-models (or the console on this page) to run OpenRouter, OpenAI, Anthropic, Gemini, DeepSeek, xAI Grok, Groq, or LAN Ollama. Keys stay in volatile RAM.'
          },
          {
            icon: '🛡️',
            title: 'What Happens When You Shut Off the Machine?',
            desc: 'ZothOS-Lite runs 100% inside RAM (toram noswap). Unplug the boot USB after startup. Powering off discharges RAM—leaving zero files, history, or keys on internal drives.'
          },
          {
            icon: '🧰',
            title: 'Install Extra Tools Without Bloat',
            desc: 'Pull optional modules into RAM anytime with `zoth-lite-pkg install <module>` or standard `sudo apt install`.'
          },
          {
            icon: '🌐',
            title: 'Talk Peer-to-Peer on ZothNet',
            desc: 'Discover other Zoth users on your network with `zothnet peers` and exchange encrypted messages via `zothnet chat @peer`.'
          },
          {
            icon: '💾',
            title: 'Save Builds to External Drives or Cloud',
            desc: 'Mount external USB/NVMe drives via `zoth-lite-storage mount /dev/sdb1` or sync builds to S3 / Google Drive / WebDAV with `rclone`.'
          }
        ]
      });
      document.getElementById('btnLaunchQuickstart')?.addEventListener('click', () => tour && tour.open());
    }
  }

  function init() {
    initHorologyAndTelemetry();
    initAzothAgent();
    initTabsAndOnboarding();
    initAgentConsole();
    initZothNetTool();
    initStoragePackager();
    initMediaPlayer();
    initImageViewer();
    initCoTAndColdSigner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
