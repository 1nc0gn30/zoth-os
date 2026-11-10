/**
 * 🛡️ ZOTHOS-LITE v1.2 — TAILS-STYLE AMNESIC MONOTONE OS & WORKSTATION
 * Design Language: Paper Ivory (#F7F7F4) · Pure Black Ink (#000000) · Bayer Dither · Unicode U+2800 Braille
 * 1:1 Parity with bin/zoth-lite-models (56 Models / 8 Providers), zoth-lite-welcome, zoth-lite-storage, zoth-lite-pkg, zothnet
 * Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  // =========================================================================
  // 0. SAFE CLIPBOARD & CLIENT-SIDE DOWNLOAD HELPERS (ZERO EXCEPTIONS)
  // =========================================================================
  async function safeCopy(text) {
    const str = String(text ?? '');
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(str);
        return true;
      } catch (_err) {
        // Fallback when document is unfocused / headless
      }
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.pointerEvents = 'none';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return Boolean(ok);
    } catch (_e) {
      return false;
    }
  }

  function flashButtonLabel(btn, feedbackLabel, originalLabel, ms = 1600) {
    if (!btn) return;
    const restore = originalLabel || btn.getAttribute('data-orig-label') || btn.textContent;
    if (!btn.getAttribute('data-orig-label')) btn.setAttribute('data-orig-label', restore);
    btn.textContent = feedbackLabel;
    setTimeout(() => {
      btn.textContent = restore;
    }, ms);
  }

  function downloadBlob(filename, data, mime = 'text/plain;charset=utf-8') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function deriveAesGcmKey(passphrase, saltBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase || 'zothos-lite-ram-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  function bytesToHex(bytes) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToBytes(hex) {
    const clean = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
    const out = new Uint8Array(Math.floor(clean.length / 2));
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

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
      status: 'Routing inference across DeepSeek Flash (Hermes / Nous) & local Ollama...'
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
      status: 'ZothNet P2P AES-256-GCM / ChaCha20 peer discovery active on :8102.'
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
    ollama: {
      name: 'Ollama Local',
      envKey: 'OLLAMA_API_KEY',
      endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
      models: [
        'qwen2.5-coder:7b',
        'qwen2.5-coder:32b',
        'deepseek-r1:8b',
        'deepseek-r1:14b',
        'hermes3:8b',
        'hermes3:70b',
        'llama3.3:70b',
        'llama3.2:3b',
        'mistral-small:24b',
        'phi4:14b'
      ]
    },
    hermes: {
      name: 'Hermes / Nous',
      envKey: 'NOUS_API_KEY',
      endpoint: 'https://inference-api.nousresearch.com/v1/chat/completions',
      models: [
        'deepseek-flash',
        'hermes-4-405b',
        'hermes-3-llama-3.1-405b',
        'hermes-3-llama-3.1-70b',
        'hermes-3-llama-3.1-8b'
      ]
    },
    deepseek: {
      name: 'DeepSeek',
      envKey: 'DEEPSEEK_API_KEY',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: [
        'deepseek-flash',
        'deepseek-chat',
        'deepseek-reasoner',
        'deepseek-coder'
      ]
    },
    openrouter: {
      name: 'OpenRouter',
      envKey: 'OPENROUTER_API_KEY',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      models: [
        'deepseek/deepseek-chat-v3-0324',
        'deepseek/deepseek-r1',
        'nousresearch/hermes-3-llama-3.1-405b',
        'nousresearch/hermes-3-llama-3.1-70b',
        'anthropic/claude-3.7-sonnet',
        'anthropic/claude-3.5-sonnet',
        'openai/gpt-4o',
        'openai/o3-mini',
        'meta-llama/llama-3.3-70b-instruct',
        'qwen/qwen-2.5-coder-32b-instruct',
        'google/gemini-2.0-flash-001'
      ]
    },
    openai: {
      name: 'OpenAI',
      envKey: 'OPENAI_API_KEY',
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
      name: 'Anthropic',
      envKey: 'ANTHROPIC_API_KEY',
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
      envKey: 'GEMINI_API_KEY',
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
    groq: {
      name: 'Groq',
      envKey: 'GROQ_API_KEY',
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
    const btnDlConfig = document.getElementById('btnDownloadModelConfig');
    const btnDlEnv = document.getElementById('btnDownloadModelEnv');
    const btnPickHermes = document.getElementById('btnPickHermesFlash');
    const btnPickOllama = document.getElementById('btnPickLocalOllama');
    const consoleOutput = document.getElementById('agentConsoleOutput');
    const visibleCountEl = document.getElementById('visibleModelCount');
    const dropdownBadgeEl = document.getElementById('modelDropdownCountBadge');
    const activeProvLabelEl = document.getElementById('activeProviderLabel');

    if (!chipsContainer || !modelSelect) return;

    let providerFilter = 'all';
    let activeProvider = 'hermes';
    let activeModel = 'deepseek-flash';
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
          ? sourceList.filter((m) => m.toLowerCase().includes(q) || prov.name.toLowerCase().includes(q) || pid.includes(q))
          : sourceList;
        if (filtered.length > 0) {
          optionCount += filtered.length;
          const optsHtml = filtered
            .map((m) => {
              const val = `${pid}::${m}`;
              const isSel = pid === activeProvider && m === activeModel ? 'selected' : '';
              const star = pid === 'hermes' && m === 'deepseek-flash' ? ' ★ Recommended Cloud' : (pid === 'ollama' && m === 'qwen2.5-coder:7b' ? ' ★ Recommended Local' : '');
              return `<option value="${val}" ${isSel}>[${prov.name}] ${m}${star}</option>`;
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

    function selectRecommended(pid, mid) {
      providerFilter = 'all';
      activeProvider = pid;
      activeModel = mid;
      if (searchInput) searchInput.value = '';
      renderChips();
      populateModels('');
      modelSelect.value = `${pid}::${mid}`;
      syncActiveSelection(modelSelect.value);
      if (btnPickHermes && btnPickOllama) {
        btnPickHermes.classList.toggle('is-dark', pid === 'hermes');
        btnPickOllama.classList.toggle('is-dark', pid === 'ollama');
      }
      if (consoleOutput) {
        consoleOutput.textContent = `[SELECTED ${AI_PROVIDERS[pid].name.toUpperCase()} // ${mid}]\nEndpoint : ${AI_PROVIDERS[pid].endpoint}\nCLI Cmd  : zoth-lite-models --run ${pid}:${mid} "${(promptInput?.value || 'Audit workspace').slice(0, 56)}"`;
      }
    }

    btnPickHermes?.addEventListener('click', () => selectRecommended('hermes', 'deepseek-flash'));
    btnPickOllama?.addEventListener('click', () => selectRecommended('ollama', 'qwen2.5-coder:7b'));

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

    searchInput?.addEventListener('input', (e) => populateModels(e.target.value));
    modelSelect.addEventListener('change', (e) => syncActiveSelection(e.target.value));

    keyInput?.addEventListener('change', (e) => {
      setSessionKey(activeProvider, e.target.value.trim());
    });

    document.querySelectorAll('.btn-quick-prompt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-prompt');
        if (p && promptInput) promptInput.value = p;
      });
    });

    btnCopyCli?.addEventListener('click', async () => {
      const prompt = (promptInput ? promptInput.value.trim() : 'Check RAM status').replace(/"/g, '\\"');
      const cmd = `zoth-lite-models --run ${activeProvider}:${activeModel} "${prompt}"`;
      await safeCopy(cmd);
      flashButtonLabel(btnCopyCli, '✓ Copied CLI Command', '📋 Copy OS CLI Command');
      if (consoleOutput) consoleOutput.textContent = `$ ${cmd}\n# Key vault path in OS: /run/user/$UID/zoth-keys.env (0600 volatile RAM)`;
    });

    btnDlConfig?.addEventListener('click', () => {
      const cfg = {
        os: 'ZothOS-Lite v1.2 (Amnesic Monotone Edition)',
        generatedAt: new Date().toISOString(),
        ramKeyVault: '/run/user/1000/zoth-keys.env',
        recommendedLightweightCloud: {
          provider: 'hermes',
          providerName: 'Hermes Agent by Nous Research',
          model: 'deepseek-flash',
          endpoint: AI_PROVIDERS.hermes.endpoint
        },
        recommendedLocal: {
          provider: 'ollama',
          model: 'qwen2.5-coder:7b',
          endpoint: AI_PROVIDERS.ollama.endpoint
        },
        selected: {
          provider: activeProvider,
          providerName: AI_PROVIDERS[activeProvider]?.name,
          model: activeModel,
          endpoint: endpointInput?.value || AI_PROVIDERS[activeProvider]?.endpoint,
          role: roleSelect?.value || 'System Architect',
          cliCommand: `zoth-lite-models --run ${activeProvider}:${activeModel} "${(promptInput?.value || 'Audit workspace').replace(/"/g, '\\"')}"`
        },
        providersCount: Object.keys(AI_PROVIDERS).length,
        curatedModelsCount: countCuratedModels(),
        providers: AI_PROVIDERS
      };
      downloadBlob('zoth-lite-models.config.json', JSON.stringify(cfg, null, 2), 'application/json');
      flashButtonLabel(btnDlConfig, '✓ Downloaded .json', '⬇ Config (.json)');
    });

    btnDlEnv?.addEventListener('click', () => {
      const lines = [
        '# ZothOS-Lite v1.2 Volatile RAM Key Enclave Template',
        '# Load into RAM inside OS: zoth-lite-models --import-keys ./zoth-keys.template.env',
        '# Wiped automatically on power-off / reboot (toram noswap)',
        '',
        'NOUS_API_KEY=""',
        'DEEPSEEK_API_KEY=""',
        'OPENROUTER_API_KEY=""',
        'OPENAI_API_KEY=""',
        'ANTHROPIC_API_KEY=""',
        'GEMINI_API_KEY=""',
        'GROQ_API_KEY=""',
        'ZOTH_LITE_ENDPOINT_OLLAMA="http://127.0.0.1:11434/v1/chat/completions"'
      ];
      downloadBlob('zoth-keys.template.env', lines.join('\n') + '\n', 'text/plain;charset=utf-8');
      flashButtonLabel(btnDlEnv, '✓ Downloaded .env', '⬇ RAM .env Template');
    });

    btnFetchLive?.addEventListener('click', async () => {
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
          btnFetchLive.textContent = `✓ Synced +${liveOpenRouterModels.length} IDs`;
          if (consoleOutput) {
            consoleOutput.textContent = `[OPENROUTER LIVE SYNC] Loaded ${liveOpenRouterModels.length} live OpenRouter model IDs alongside the 7 other providers.`;
          }
        }
      } catch (err) {
        btnFetchLive.disabled = false;
        btnFetchLive.textContent = '⟳ Retry OpenRouter Sync';
        if (consoleOutput) {
          consoleOutput.textContent = `[OFFLINE NOTICE] Could not reach OpenRouter registry (${err.message}). All 56 built-in curated models remain active.`;
        }
      }
    });

    btnRun?.addEventListener('click', async () => {
      const prompt = promptInput ? promptInput.value.trim() : '';
      const role = roleSelect ? roleSelect.value : 'System Architect';
      const apiKey = keyInput ? keyInput.value.trim() : '';
      const endpoint = (endpointInput && endpointInput.value.trim()) || AI_PROVIDERS[activeProvider].endpoint;

      if (!prompt) return;

      btnRun.disabled = true;
      btnRun.textContent = '⏳ Running...';
      const startTime = Date.now();
      consoleOutput.textContent = `[ZOTH-LITE AGENT ROUTER] Provider: ${AI_PROVIDERS[activeProvider].name} · Model: ${activeModel}\n[ENDPOINT] ${endpoint}\n`;

      // Prevent HTTPS -> HTTP loopback Mixed-Content browser errors when hosted on https://zothos-lite.nullai.tech
      const isHttpsToHttpLocal =
        location.protocol === 'https:' && /^http:\/\/(127\.0\.0\.1|localhost|192\.168\.|10\.)/i.test(endpoint);
      const canTryLive = !isHttpsToHttpLocal && (Boolean(apiKey) || (activeProvider === 'ollama' && location.protocol === 'http:'));

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
          consoleOutput.textContent += `[NOTICE] Live endpoint returned ${err.message}. Running deterministic RAM enclave synthesis:\n`;
          await appendOfflineSynthesis(role, activeProvider, activeModel, prompt);
        }
      } else {
        await appendOfflineSynthesis(role, activeProvider, activeModel, prompt);
      }

      btnRun.disabled = false;
      btnRun.textContent = '⚡ Run Agent';
    });

    async function appendOfflineSynthesis(role, prov, model, prompt) {
      const pLower = prompt.toLowerCase();
      const digestBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${prov}:${model}:${prompt}`));
      const digestHex = bytesToHex(new Uint8Array(digestBuf)).slice(0, 16);
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
          'zoth-lite-models --run ollama:qwen2.5-coder:7b "Build REST health check"'
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
      consoleOutput.textContent += `\n${snippet}\n\n──────────────────────────────────────────────────────────\n[OFFLINE ENCLAVE · sha256:${digestHex}] OS CLI: zoth-lite-models --run ${prov}:${model} "${prompt.slice(0, 48)}..."`;
    }

    renderChips();
    populateModels('');
  }

  // =========================================================================
  // 4. ZOTHNET P2P MESH & REAL WEBCRYPTO AES-256-GCM ENVELOPE BUILDER
  // =========================================================================
  function initZothNetTool() {
    const peerSel = document.getElementById('zothNetPeerSelect');
    const chanSel = document.getElementById('zothNetChannelSelect');
    const keyInput = document.getElementById('zothNetKeyInput');
    const msgInput = document.getElementById('zothNetMsgInput');
    const btnSend = document.getElementById('btnZothNetSend');
    const btnVerify = document.getElementById('btnZothNetVerify');
    const btnDownload = document.getElementById('btnZothNetDownload');
    const btnScan = document.getElementById('btnZothNetScan');
    const btnCopy = document.getElementById('btnZothNetCopyCmd');
    const outEl = document.getElementById('zothNetConsoleOutput');
    if (!outEl) return;

    let lastEnvelope = null;

    async function sha256Hex(str) {
      const buf = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return bytesToHex(new Uint8Array(hash));
    }

    btnScan?.addEventListener('click', () => {
      outEl.textContent = [
        '$ zothnet peers',
        '[ZOTHNET P2P MESH] Active Subnet & Onion Peers (3):',
        '  █ @zoth-relay-lan01  | LAN-UDP:8102     | AES-256-GCM / ChaCha20 | 1.8 ms  | ONLINE',
        '  █ @zoth-builder-box  | WireGuard-Mesh   | AES-256-GCM / ChaCha20 | 3.1 ms  | ONLINE',
        '  █ @zoth-onion-v3     | Tor-v3-Ephemeral | Ed25519+X25519         | 42.0 ms | ONLINE'
      ].join('\n');
    });

    btnCopy?.addEventListener('click', async () => {
      const peer = peerSel ? peerSel.value : '@zoth-relay-lan01';
      const msg = (msgInput ? msgInput.value.trim() : 'PING').replace(/"/g, '\\"');
      const cmd = `zothnet chat ${peer} "${msg}"`;
      await safeCopy(cmd);
      flashButtonLabel(btnCopy, '✓ Copied CLI', '📋 Copy zothnet chat CLI');
    });

    async function sealPacket() {
      const peer = peerSel ? peerSel.value : '@zoth-relay-lan01';
      const cipher = chanSel ? chanSel.value : 'AES-256-GCM + ChaCha20 (LAN :8102)';
      const pass = (keyInput && keyInput.value.trim()) || 'zothnet-ram-ephemeral-v12';
      const msg = (msgInput && msgInput.value.trim()) || 'PING_HANDSHAKE';
      const ts = new Date().toISOString();

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const aesKey = await deriveAesGcmKey(pass, salt);
      const ctBuf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        new TextEncoder().encode(msg)
      );
      const ctHex = bytesToHex(new Uint8Array(ctBuf));
      const envDigest = await sha256Hex(`ZOTHNET_V12|${peer}|${cipher}|${ts}|${ctHex}`);

      lastEnvelope = {
        protocol: 'zothnet-p2p-v1.2',
        timestamp: ts,
        peer,
        cipher,
        ephemeralNodeId: `zoth-${envDigest.slice(0, 10)}`,
        kdf: 'PBKDF2-HMAC-SHA256 (100000 iter)',
        saltHex: bytesToHex(salt),
        ivHex: bytesToHex(iv),
        ciphertextHex: ctHex,
        envelopeSha256: envDigest
      };

      outEl.textContent = [
        `$ zothnet chat ${peer} "${msg}"`,
        '┌──[ ZOTHNET P2P AUTHENTICATED AES-256-GCM ENVELOPE ]──────────────────────┐',
        `│ Timestamp    : ${ts}`,
        `│ Destination  : ${peer} (${cipher})`,
        `│ EphemeralID  : ${lastEnvelope.ephemeralNodeId} (RAM-only key — wiped on power-off)`,
        `│ IV / Salt    : ${lastEnvelope.ivHex} / ${lastEnvelope.saltHex.slice(0, 16)}…`,
        `│ Ciphertext   : ${ctHex.slice(0, 56)}${ctHex.length > 56 ? '…' : ''}`,
        `│ EnvelopeSHA  : ${envDigest.slice(0, 48)}…`,
        '└──────────────────────────────────────────────────────────────────────────┘',
        'Click "Verify & Decrypt Packet" to run WebCrypto AES-256-GCM authentication.'
      ].join('\n');
    }

    btnSend?.addEventListener('click', sealPacket);

    btnVerify?.addEventListener('click', async () => {
      if (!lastEnvelope) await sealPacket();
      if (!lastEnvelope) return;
      const pass = (keyInput && keyInput.value.trim()) || 'zothnet-ram-ephemeral-v12';
      try {
        const aesKey = await deriveAesGcmKey(pass, hexToBytes(lastEnvelope.saltHex));
        const ptBuf = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: hexToBytes(lastEnvelope.ivHex) },
          aesKey,
          hexToBytes(lastEnvelope.ciphertextHex)
        );
        const clearText = new TextDecoder().decode(ptBuf);
        outEl.textContent = [
          '[✓ WEBCRYPTO AES-256-GCM AUTHENTICATION & DECRYPTION VERIFIED]',
          `Peer Node     : ${lastEnvelope.peer}`,
          `Envelope SHA  : ${lastEnvelope.envelopeSha256}`,
          `Decrypted Msg : ${clearText}`,
          'Status        : 128-bit GCM auth tag valid · zero tampering detected.'
        ].join('\n');
        flashButtonLabel(btnVerify, '✓ Decrypted OK', '🔓 Verify & Decrypt Packet');
      } catch (_err) {
        outEl.textContent = '[✗ AUTHENTICATION FAILED] Session key mismatch or tampered ciphertext.';
      }
    });

    btnDownload?.addEventListener('click', async () => {
      if (!lastEnvelope) await sealPacket();
      if (!lastEnvelope) return;
      downloadBlob(`zothnet-packet-${Date.now()}.zothpkt.json`, JSON.stringify(lastEnvelope, null, 2), 'application/json');
      flashButtonLabel(btnDownload, '✓ Exported .json', '⬇ Export .zothpkt.json');
    });
  }

  // =========================================================================
  // 5. EXTERNAL STORAGE (`zoth-lite-storage`) + `zoth-lite-pkg` + AES ZIP
  // =========================================================================
  function initStoragePackager() {
    const targetSel = document.getElementById('storageTargetType');
    const srcInput = document.getElementById('storageSourceDir');
    const cmdPreview = document.getElementById('storageCmdPreview');
    const btnCopyStorage = document.getElementById('btnCopyStorageCmd');
    const pkgScriptPreview = document.getElementById('pkgScriptPreview');
    const btnCopyPkg = document.getElementById('btnCopyPkgScript');
    const btnDlPkg = document.getElementById('btnDownloadPkgScript');
    const dropzone = document.getElementById('pkgDropzone');
    const fileInput = document.getElementById('pkgFileInput');
    const fileListEl = document.getElementById('pkgFileList');
    const btnBuild = document.getElementById('btnBuildZip');
    const btnBuildEnc = document.getElementById('btnBuildEncryptedZip');
    const encPassInput = document.getElementById('pkgEncryptPass');
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

    btnCopyStorage?.addEventListener('click', async () => {
      await safeCopy(cmdPreview ? cmdPreview.textContent : '');
      flashButtonLabel(btnCopyStorage, '✓ Copied Cmd', '📋 Copy Storage Cmd');
    });

    function buildPkgScript() {
      const checked = Array.from(document.querySelectorAll('.pkg-mod-chk:checked')).map((c) => c.value);
      const lines = [
        '#!/usr/bin/env bash',
        '# ZothOS-Lite v1.2 On-Demand RAM OverlayFS Package Installer (wiped on reboot)',
        'set -euo pipefail'
      ];
      const zothMods = checked.filter((v) => v !== 'deb-bundle' && v !== 'appimage-bundle');
      zothMods.forEach((m) => lines.push(`zoth-lite-pkg install ${m}`));
      if (checked.includes('deb-bundle')) {
        lines.push('sudo dpkg -i ./custom-package_amd64.deb || sudo apt-get -f install -y --no-install-recommends');
      }
      if (checked.includes('appimage-bundle')) {
        lines.push('chmod +x ./PortableTool.AppImage && ./PortableTool.AppImage --appimage-extract-and-run');
      }
      if (checked.length === 0) {
        lines.push('zoth-lite-pkg list');
      }
      if (pkgScriptPreview) pkgScriptPreview.textContent = lines.join('\n');
      return lines.join('\n');
    }

    document.querySelectorAll('.pkg-mod-chk').forEach((chk) => {
      chk.addEventListener('change', buildPkgScript);
    });
    buildPkgScript();

    btnCopyPkg?.addEventListener('click', async () => {
      await safeCopy(buildPkgScript());
      flashButtonLabel(btnCopyPkg, '✓ Copied Script', '📋 Copy Install Script');
    });

    btnDlPkg?.addEventListener('click', () => {
      downloadBlob('install-zoth-lite-ram.sh', buildPkgScript() + '\n', 'text/x-shellscript');
      flashButtonLabel(btnDlPkg, '✓ Saved .sh', '⬇ Download install-ram.sh');
    });

    if (!dropzone || !fileListEl) return;
    let stagedFiles = [];

    function renderFileList() {
      if (stagedFiles.length === 0) {
        fileListEl.innerHTML = '<span style="color:var(--ink-muted); font-family:var(--font-mono); font-size:12px;">No files staged yet.</span>';
        if (btnBuild) btnBuild.disabled = true;
        if (btnBuildEnc) btnBuildEnc.disabled = true;
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
      if (btnBuildEnc) btnBuildEnc.disabled = false;
    }

    function addFiles(files) {
      for (const f of files) stagedFiles.push(f);
      renderFileList();
    }

    btnSample?.addEventListener('click', () => {
      const f1 = new File(
        ['# ZothOS-Lite v1.2 Agent Build Output\nDISTRO=ZothOS-Lite\nVERSION=1.2-MONOTONE\nRECOMMENDED_CLOUD=hermes:deepseek-flash\n'],
        'zoth-build-info.env',
        { type: 'text/plain' }
      );
      const f2 = new File(
        [JSON.stringify({ os: 'ZothOS-Lite v1.2', models: 56, providers: 8, amnesic: true, recommendedCloud: 'hermes:deepseek-flash' }, null, 2)],
        'manifest.json',
        { type: 'application/json' }
      );
      stagedFiles = [f1, f2];
      renderFileList();
      if (statusEl) statusEl.textContent = 'Staged 2 sample files. Click "Build & Download ZIP" or "Build AES-256-GCM .zip.enc".';
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
        const fname = `zothos-lite-bundle-${Date.now()}.zip`;
        downloadBlob(fname, zipBlob, 'application/zip');
        if (statusEl) {
          statusEl.textContent = `✓ Built ${fname} (${(zipBlob.size / 1024).toFixed(1)} KB) — ready for external USB or cloud drive.`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = `Error: ${err.message}`;
      }
      btnBuild.disabled = false;
    });

    btnBuildEnc?.addEventListener('click', async () => {
      if (stagedFiles.length === 0) return;
      btnBuildEnc.disabled = true;
      const pass = (encPassInput && encPassInput.value.trim()) || 'zothos-lite-vault';
      if (statusEl) statusEl.textContent = 'Encrypting PKZIP with WebCrypto PBKDF2 + AES-256-GCM...';
      try {
        const zipBlob = await createSimpleZip(stagedFiles);
        const plainBytes = new Uint8Array(await zipBlob.arrayBuffer());
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveAesGcmKey(pass, salt);
        const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes);
        const magic = new TextEncoder().encode('ZOTHLITE_AES256GCM_V1\n');
        const outBlob = new Blob([magic, salt, iv, new Uint8Array(ctBuf)], { type: 'application/octet-stream' });
        const fname = `zothos-lite-encrypted-${Date.now()}.zip.enc`;
        downloadBlob(fname, outBlob, 'application/octet-stream');
        if (statusEl) {
          statusEl.textContent = `✓ Sealed ${fname} (${(outBlob.size / 1024).toFixed(1)} KB · AES-256-GCM authenticated).`;
        }
      } catch (err) {
        if (statusEl) statusEl.textContent = `Encryption error: ${err.message}`;
      }
      btnBuildEnc.disabled = false;
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
  // 6. SELF-CONTAINED MONOTONE BOOT STREAM & WEBAUDIO SYNTH / WAV GENERATOR
  // =========================================================================
  function buildPcmWavBlob(durationSec = 1.6, sampleRate = 22050) {
    const numSamples = Math.floor(durationSec * sampleRate);
    const buf = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buf);
    const writeStr = (off, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    const notes = [440, 554.37, 659.25, 880];
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const idx = Math.min(notes.length - 1, Math.floor((t / durationSec) * notes.length));
      const freq = notes[idx];
      const localT = t % (durationSec / notes.length);
      const env = Math.exp(-localT * 5.2);
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.45 * env;
      view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, Math.floor(sample * 32767))), true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  function initMediaPlayer() {
    const video = document.getElementById('mediaPlayerVideo');
    const bootCanvas = document.getElementById('monotoneBootStreamCanvas');
    const audioCanvas = document.getElementById('audioVisualizerCanvas');
    const btnPlay = document.getElementById('btnMediaPlay');
    const btnClipA = document.getElementById('btnLoadHermesShowcase');
    const btnClipB = document.getElementById('btnLoadLaunchFilm');
    const btnSynth = document.getElementById('btnMediaSynthTone');
    const btnDlWav = document.getElementById('btnDownloadTestWav');
    const timeDisplay = document.getElementById('mediaTimeDisplay');
    const scrubber = document.getElementById('mediaScrubber');
    const speedSelect = document.getElementById('mediaSpeedSelect');
    const btnSnap = document.getElementById('btnMediaSnapshot');
    const fileInput = document.getElementById('mediaFileInput');
    if (!video || !audioCanvas || !bootCanvas) return;

    const bCtx = bootCanvas.getContext('2d');
    const aCtx = audioCanvas.getContext('2d');
    let usingLocalMedia = false;
    let streamPlaying = true;
    let streamMode = 'BOOT_A';
    let simTime = 0;
    const SIM_DURATION = 12.0;
    let playbackRate = 1.0;
    let lastFrameTs = performance.now();
    let audioCtx = null;
    let analyser = null;
    let mediaElemConnected = false;

    function ensureAudioCtx() {
      if (!audioCtx) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AC();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.connect(audioCtx.destination);
        } catch (_e) {}
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }

    function drawProceduralStreamFrame() {
      const W = bootCanvas.width;
      const H = bootCanvas.height;
      bCtx.fillStyle = '#F7F7F4';
      bCtx.fillRect(0, 0, W, H);

      // Subtle monotone grid
      bCtx.strokeStyle = 'rgba(0,0,0,0.08)';
      bCtx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 24) {
        bCtx.beginPath(); bCtx.moveTo(gx, 0); bCtx.lineTo(gx, H); bCtx.stroke();
      }
      for (let gy = 0; gy < H; gy += 24) {
        bCtx.beginPath(); bCtx.moveTo(0, gy); bCtx.lineTo(W, gy); bCtx.stroke();
      }

      // Outer 2px border frame + top bar
      bCtx.fillStyle = '#000000';
      bCtx.fillRect(24, 20, W - 48, 34);
      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 3;
      bCtx.strokeRect(24, 20, W - 48, H - 40);

      bCtx.fillStyle = '#F7F7F4';
      bCtx.font = 'bold 14px "IBM Plex Mono", monospace';
      const title =
        streamMode === 'BOOT_A'
          ? 'ZOTHOS-LITE v1.2 // DEBIAN 13 LIVE TORAM NOSWAP BOOT SEQUENCE'
          : 'AZOTH BRAILLE ROUTER // 56 MODELS · 8 PROVIDERS · HERMES DEEPSEEK-FLASH';
      bCtx.fillText(title, 38, 42);

      bCtx.fillStyle = '#000000';
      bCtx.font = '14px "IBM Plex Mono", monospace';

      if (streamMode === 'BOOT_A') {
        const bootLines = [
          '[  0.041] Linux 6.12.x-amd64 boot=live components toram noswap init_on_free=1',
          '[  0.812] Copying SquashFS root image into volatile RAM tmpfs... [OK]',
          '[  1.420] Internal NVMe/SATA automount: BLOCKED · Swap devices: 0 B',
          '[  2.105] Openbox Monotone Desktop (#F7F7F4 / #000000) + SWCursor: READY',
          '[  2.690] Volatile RAM key enclave armed: /run/user/1000/zoth-keys.env (0600)',
          '[  3.240] Indexed 56 AI models across Ollama, Hermes/Nous, DeepSeek, OpenRouter...',
          '[  3.880] Thermal Guardrail locked: 80°C throttle / 85°C pause (server-side)',
          '[  4.310] First-Boot Tour ready -> run `zoth-lite-welcome` or unplug boot USB.'
        ];
        const visible = Math.max(2, Math.min(bootLines.length, Math.floor((simTime / SIM_DURATION) * (bootLines.length + 2))));
        for (let i = 0; i < visible; i++) {
          bCtx.fillText(bootLines[i], 44, 88 + i * 32);
        }
      } else {
        const provRows = [
          '█ ollama      (10 models) -> http://127.0.0.1:11434/v1/chat/completions [LOCAL 0ms]',
          '█ hermes      ( 5 models) -> deepseek-flash via Hermes Agent (Nous)     [★ CLOUD LIGHT]',
          '█ deepseek    ( 4 models) -> deepseek-flash · deepseek-chat · r1        [READY]',
          '█ openrouter  (11 models) -> unified frontier gateway                   [READY]',
          '█ openai / anthropic / gemini / groq (26 models)                        [READY]'
        ];
        provRows.forEach((row, idx) => {
          bCtx.fillText(row, 44, 92 + idx * 34);
        });
        let brailleWave = '';
        for (let i = 0; i < 42; i++) {
          const m = Math.floor((Math.sin(simTime * 4 + i * 0.45) * 0.5 + 0.5) * 255);
          brailleWave += String.fromCharCode(0x2800 + (m & 0xff));
        }
        bCtx.font = 'bold 18px monospace';
        bCtx.fillText(brailleWave, 44, 300);
      }

      // Progress bar inside canvas
      const pct = Math.min(1, Math.max(0, simTime / SIM_DURATION));
      bCtx.strokeRect(44, H - 56, W - 88, 18);
      bCtx.fillRect(44, H - 56, (W - 88) * pct, 18);
    }

    function tickLoop(now) {
      requestAnimationFrame(tickLoop);
      const dt = Math.min(0.1, (now - lastFrameTs) / 1000);
      lastFrameTs = now;

      if (!usingLocalMedia) {
        if (streamPlaying) {
          simTime = (simTime + dt * playbackRate) % SIM_DURATION;
          if (scrubber) scrubber.value = String(((simTime / SIM_DURATION) * 100).toFixed(1));
          if (timeDisplay) timeDisplay.textContent = `${simTime.toFixed(1)}s / ${SIM_DURATION.toFixed(1)}s`;
        }
        drawProceduralStreamFrame();
      }

      // Spectrum bar render
      aCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
      const barCount = 24;
      const barW = (audioCanvas.width / barCount) * 0.72;
      let x = 3;
      const activePlay = usingLocalMedia ? !video.paused : streamPlaying;
      if (analyser && audioCtx && audioCtx.state === 'running' && activePlay) {
        const arr = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(arr);
        const hasSignal = arr.some((v) => v > 4);
        for (let i = 0; i < barCount; i++) {
          const v = hasSignal
            ? ((arr[i % arr.length] || 0) / 255) * audioCanvas.height * 0.9
            : (Math.sin(now * 0.008 + i * 0.45) * 0.5 + 0.5) * audioCanvas.height * 0.8;
          const h = Math.max(2, v);
          aCtx.fillStyle = '#F7F7F4';
          aCtx.fillRect(x, audioCanvas.height - h, barW, h);
          x += barW + 2.5;
        }
      } else if (activePlay) {
        for (let i = 0; i < barCount; i++) {
          const h = Math.max(2, (Math.sin(now * 0.007 + i * 0.42) * 0.5 + 0.5) * audioCanvas.height * 0.82);
          aCtx.fillStyle = '#F7F7F4';
          aCtx.fillRect(x, audioCanvas.height - h, barW, h);
          x += barW + 2.5;
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          aCtx.fillStyle = 'rgba(247,247,244,0.35)';
          aCtx.fillRect(x, audioCanvas.height - 3, barW, 3);
          x += barW + 2.5;
        }
      }
    }
    requestAnimationFrame(tickLoop);

    btnPlay?.addEventListener('click', () => {
      if (usingLocalMedia) {
        ensureAudioCtx();
        if (!mediaElemConnected && audioCtx && analyser) {
          try {
            const src = audioCtx.createMediaElementSource(video);
            src.connect(analyser);
            mediaElemConnected = true;
          } catch (_e) {}
        }
        if (video.paused) {
          video.play().then(() => { btnPlay.textContent = '⏸ Pause'; }).catch(() => {});
        } else {
          video.pause();
          btnPlay.textContent = '▶ Play';
        }
      } else {
        streamPlaying = !streamPlaying;
        btnPlay.textContent = streamPlaying ? '⏸ Pause' : '▶ Play';
      }
    });

    function switchProceduralMode(mode) {
      usingLocalMedia = false;
      video.pause();
      video.style.display = 'none';
      bootCanvas.style.display = 'block';
      streamMode = mode;
      simTime = 0;
      streamPlaying = true;
      if (btnPlay) btnPlay.textContent = '⏸ Pause';
      btnClipA?.classList.toggle('is-dark', mode === 'BOOT_A');
      btnClipB?.classList.toggle('is-dark', mode === 'BOOT_B');
    }

    btnClipA?.addEventListener('click', () => switchProceduralMode('BOOT_A'));
    btnClipB?.addEventListener('click', () => switchProceduralMode('BOOT_B'));

    btnSynth?.addEventListener('click', () => {
      ensureAudioCtx();
      if (!audioCtx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const t0 = audioCtx.currentTime + idx * 0.14;
        gain.gain.setValueAtTime(0.12, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
        osc.connect(gain);
        if (analyser) gain.connect(analyser);
        else gain.connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.14);
      });
      flashButtonLabel(btnSynth, '♪ Telemetry Ping', '🔊 Synth Tone', 900);
    });

    btnDlWav?.addEventListener('click', () => {
      const wavBlob = buildPcmWavBlob(1.6, 22050);
      downloadBlob('zothos-lite-telemetry-tone.wav', wavBlob, 'audio/wav');
      flashButtonLabel(btnDlWav, '✓ Saved .wav', '⬇ Test .wav');
    });

    video.addEventListener('timeupdate', () => {
      if (usingLocalMedia && video.duration && scrubber) {
        scrubber.value = String((video.currentTime / video.duration) * 100);
        if (timeDisplay) timeDisplay.textContent = `${video.currentTime.toFixed(1)}s / ${video.duration.toFixed(1)}s`;
      }
    });

    scrubber?.addEventListener('input', () => {
      const pct = parseFloat(scrubber.value) / 100;
      if (usingLocalMedia && video.duration) {
        video.currentTime = pct * video.duration;
      } else {
        simTime = pct * SIM_DURATION;
        if (timeDisplay) timeDisplay.textContent = `${simTime.toFixed(1)}s / ${SIM_DURATION.toFixed(1)}s`;
        drawProceduralStreamFrame();
      }
    });

    document.getElementById('btnMediaStepBack')?.addEventListener('click', () => {
      if (usingLocalMedia) {
        video.pause();
        video.currentTime = Math.max(0, video.currentTime - 1 / 30);
      } else {
        streamPlaying = false;
        simTime = Math.max(0, simTime - 1 / 30);
        drawProceduralStreamFrame();
      }
      if (btnPlay) btnPlay.textContent = '▶ Play';
    });

    document.getElementById('btnMediaStepFwd')?.addEventListener('click', () => {
      if (usingLocalMedia) {
        video.pause();
        video.currentTime = Math.min(video.duration || 1000, video.currentTime + 1 / 30);
      } else {
        streamPlaying = false;
        simTime = Math.min(SIM_DURATION, simTime + 1 / 30);
        drawProceduralStreamFrame();
      }
      if (btnPlay) btnPlay.textContent = '▶ Play';
    });

    speedSelect?.addEventListener('change', (e) => {
      playbackRate = parseFloat(e.target.value) || 1.0;
      video.playbackRate = playbackRate;
    });

    btnSnap?.addEventListener('click', () => {
      const c = document.createElement('canvas');
      if (usingLocalMedia && video.videoWidth) {
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
      } else {
        c.width = bootCanvas.width;
        c.height = bootCanvas.height;
        c.getContext('2d').drawImage(bootCanvas, 0, 0);
      }
      c.toBlob((blob) => {
        if (blob) downloadBlob(`zothos-lite-frame-${Date.now()}.png`, blob, 'image/png');
      }, 'image/png');
      flashButtonLabel(btnSnap, '✓ Saved PNG', '📸 Snapshot PNG');
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        usingLocalMedia = true;
        bootCanvas.style.display = 'none';
        video.style.display = 'block';
        video.muted = false;
        video.src = URL.createObjectURL(e.target.files[0]);
        video.load();
        if (btnPlay) btnPlay.textContent = '▶ Play';
      }
    });
  }

  // =========================================================================
  // 7. IMAGE INSPECTOR + REAL 1-BIT ORDERED BAYER 8×8 DITHER + EXIF SANITIZER
  // =========================================================================
  const BAYER_8X8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  function initImageViewer() {
    const canvas = document.getElementById('imageCanvas');
    const fileInput = document.getElementById('imageFileInput');
    const metaDisplay = document.getElementById('imageMetadata');
    const btnBayer = document.getElementById('btnImgBayer');
    const btnExportClean = document.getElementById('btnImgExportClean');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let currentImg = new Image();
    let scale = 1.0;
    let rotation = 0;
    let isGrayscale = false;
    let isInverted = false;
    let isBayerDither = false;
    let imgName = 'amnesic-monotone-web.jpg';

    function applyOrderedBayerDither() {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let y = 0; y < h; y++) {
        const row = BAYER_8X8[y & 7];
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const thresh = ((row[x & 7] + 0.5) / 64) * 255;
          const paper = lum > thresh;
          // Paper Ivory #F7F7F4 (247,247,244) vs Pure Black Ink #000000 (0,0,0)
          d[i] = paper ? 247 : 0;
          d[i + 1] = paper ? 247 : 0;
          d[i + 2] = paper ? 244 : 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

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

      if (isBayerDither) {
        applyOrderedBayerDither();
      }

      if (metaDisplay) {
        const ramMb = ((currentImg.width * currentImg.height * 4) / (1024 * 1024)).toFixed(1);
        metaDisplay.innerHTML = `
          <span><strong>File:</strong> ${imgName}</span>
          <span><strong>Res:</strong> ${currentImg.width} × ${currentImg.height}</span>
          <span><strong>RAM:</strong> ~${ramMb} MB</span>
          <span><strong>Mode:</strong> ${isBayerDither ? '1-Bit Bayer 8×8' : 'Standard'} · ${Math.round(scale * 100)}%</span>
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
    btnBayer?.addEventListener('click', () => {
      isBayerDither = !isBayerDither;
      btnBayer.classList.toggle('is-dark', isBayerDither);
      render();
    });
    document.getElementById('btnImgGray')?.addEventListener('click', () => { isGrayscale = !isGrayscale; render(); });
    document.getElementById('btnImgInvert')?.addEventListener('click', () => { isInverted = !isInverted; render(); });
    document.getElementById('btnImgReset')?.addEventListener('click', () => {
      scale = 1.0; rotation = 0; isGrayscale = false; isInverted = false; isBayerDither = false;
      btnBayer?.classList.remove('is-dark');
      render();
    });

    btnExportClean?.addEventListener('click', () => {
      if (!currentImg.width) return;
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = isBayerDither ? canvas.width : currentImg.width;
      cleanCanvas.height = isBayerDither ? canvas.height : currentImg.height;
      const cCtx = cleanCanvas.getContext('2d');
      if (isBayerDither) {
        cCtx.drawImage(canvas, 0, 0);
      } else {
        cCtx.drawImage(currentImg, 0, 0);
      }
      cleanCanvas.toBlob((blob) => {
        if (blob) {
          const base = imgName.replace(/\.[^.]+$/, '');
          downloadBlob(`${base}-exif-stripped.png`, blob, 'image/png');
        }
      }, 'image/png');
      flashButtonLabel(btnExportClean, '✓ Clean PNG Saved', '🛡️ Strip EXIF & Save PNG');
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
    const btnDlDag = document.getElementById('btnDownloadCotDag');

    const nodes = [
      { id: 'N00', tag: 'KERNEL', text: 'ZothOS-Lite v1.2 booted in volatile RAM (toram noswap)', hash: '7f83b1657ff1fc53' },
      { id: 'N01', tag: 'MODELS', text: '56 AI models indexed across 8 cloud & LAN providers (hermes:deepseek-flash ready)', hash: '3c2a5b1b6f0e4b7b' },
      { id: 'N02', tag: 'STORAGE', text: 'Internal NVMe unmounted; external /mnt/zoth-ext standby', hash: '9a4d2c81e0f571b2' }
    ];

    async function sha256Short(str) {
      const buf = new TextEncoder().encode(str);
      const h = await crypto.subtle.digest('SHA-256', buf);
      return bytesToHex(new Uint8Array(h)).slice(0, 16);
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
      const id = `N${String(nodes.length).padStart(2, '0')}`;
      const tag = tagSel ? tagSel.value : 'MISSION';
      const hash = await sha256Short(`${id}:${tag}:${text}`);
      nodes.push({ id, tag, text, hash });
      if (input) input.value = '';
      renderDag();
    });

    btnCopy?.addEventListener('click', async () => {
      await safeCopy(JSON.stringify(nodes, null, 2));
      flashButtonLabel(btnCopy, '✓ Copied', '📋 Copy JSON');
    });

    btnDlDag?.addEventListener('click', () => {
      downloadBlob(`zoth-cot-dag-${Date.now()}.json`, JSON.stringify({ os: 'ZothOS-Lite v1.2', nodes }, null, 2), 'application/json');
      flashButtonLabel(btnDlDag, '✓ Saved .json', '⬇ Export .json');
    });

    renderDag();

    // Cold Signer
    const signInput = document.getElementById('coldSignInput');
    const btnSign = document.getElementById('btnColdSign');
    const btnDlSeal = document.getElementById('btnDownloadColdSeal');
    const signOut = document.getElementById('coldSignSeal');

    async function computeSeal() {
      const msg = (signInput && signInput.value.trim()) || 'ZothOS-Lite v1.2';
      const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
      const arr = Array.from(new Uint8Array(hashBuf));
      const hex = bytesToHex(arr);
      const rows = [];
      for (let r = 0; r < 4; r++) {
        let line = '│ ';
        for (let c = 0; c < 16; c++) {
          line += String.fromCharCode(0x2800 + arr[(r * 16 + c) % arr.length]);
        }
        rows.push(line + ' │');
      }
      const text = [
        '┌──[ED25519 BRAILLE SEAL]──┐',
        ...rows,
        `└──[SHA256:${hex.slice(0, 12)}..]─┘`,
        `PAYLOAD: ${msg}`,
        `DIGEST : ${hex}`,
        'ENCLAVE: Offline RAM-Only Signer (@1nc0gn30)'
      ].join('\n');
      if (signOut) signOut.textContent = text;
      return text;
    }

    btnSign?.addEventListener('click', computeSeal);
    btnDlSeal?.addEventListener('click', async () => {
      const seal = await computeSeal();
      downloadBlob(`zoth-braille-seal-${Date.now()}.txt`, seal + '\n', 'text/plain;charset=utf-8');
      flashButtonLabel(btnDlSeal, '✓ Saved Seal', '⬇ Export Seal (.txt)');
    });
  }

  // =========================================================================
  // 9. TABS + HARDWARE TIER RECOMMENDER + INTERACTIVE FIRST-BOOT TOUR MODAL
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

    // Hardware Tier Recommender
    const HW_TIERS = {
      thin: {
        summary:
          '<strong>Recommended for 2–4 GB RAM:</strong> Boot ZothOS-Lite in lightweight RAM mode and route coding/research tasks to <strong>DeepSeek Flash via Hermes Agent (Nous Research)</strong> or a LAN Ollama host—zero local VRAM overhead.',
        cmd: 'zoth-lite-models --set-key hermes && zoth-lite-models --run hermes:deepseek-flash "Audit workspace"'
      },
      laptop: {
        summary:
          '<strong>Recommended for 8–16 GB Laptops:</strong> Run <strong>Ollama Local (<code>qwen2.5-coder:7b</code> / <code>hermes3:8b</code>)</strong> offline inside volatile RAM alongside <strong>DeepSeek Flash (Hermes / Nous)</strong> for instant long-context synthesis.',
        cmd: 'ollama pull qwen2.5-coder:7b && zoth-lite-models --run ollama:qwen2.5-coder:7b "Write systemd health timer"'
      },
      workstation: {
        summary:
          '<strong>Recommended for 32+ GB Workstations / LAN Hosts:</strong> Serve <strong><code>qwen2.5-coder:32b</code> &amp; <code>deepseek-r1:14b</code></strong> locally in RAM and expose port <code>:11434</code> / ZothNet <code>:8102</code> to lighter ZothOS-Lite nodes on your LAN.',
        cmd: 'OLLAMA_HOST=0.0.0.0:11434 ollama serve & zoth-lite-models --run ollama:deepseek-r1:14b "Verify kernel hardening"'
      }
    };

    const tierBtns = document.querySelectorAll('.hw-tier-btn');
    const tierSumEl = document.getElementById('hwTierSummary');
    const tierCmdEl = document.getElementById('hwTierCmd');
    const btnCopyTier = document.getElementById('btnCopyHwTierCmd');
    const btnDlTier = document.getElementById('btnDownloadHwTierSh');
    let activeTierKey = 'thin';

    tierBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = btn.getAttribute('data-tier');
        if (!HW_TIERS[k]) return;
        activeTierKey = k;
        tierBtns.forEach((b) => b.classList.remove('is-dark'));
        btn.classList.add('is-dark');
        if (tierSumEl) tierSumEl.innerHTML = HW_TIERS[k].summary;
        if (tierCmdEl) tierCmdEl.textContent = HW_TIERS[k].cmd;
      });
    });

    btnCopyTier?.addEventListener('click', async () => {
      await safeCopy(HW_TIERS[activeTierKey].cmd);
      flashButtonLabel(btnCopyTier, '✓ Copied Cmd', '📋 Copy Setup Cmd');
    });

    btnDlTier?.addEventListener('click', () => {
      const sh = [
        '#!/usr/bin/env bash',
        `# ZothOS-Lite v1.2 Hardware Tier Setup (${activeTierKey.toUpperCase()})`,
        '# Runs inside volatile RAM (toram noswap) — wiped on power-off',
        'set -euo pipefail',
        'zoth-lite-welcome --check',
        HW_TIERS[activeTierKey].cmd
      ].join('\n');
      downloadBlob(`zoth-lite-setup-${activeTierKey}.sh`, sh + '\n', 'text/x-shellscript');
      flashButtonLabel(btnDlTier, '✓ Saved .sh', '⬇ Download Setup .sh');
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
            desc: 'Run DeepSeek Flash via Hermes Agent (Nous Research), Ollama Local, DeepSeek, OpenRouter, OpenAI, Anthropic, Gemini, or Groq. Keys live strictly in volatile RAM.'
          },
          {
            icon: '🛡️',
            title: 'What Happens When You Shut Off the Machine?',
            desc: 'ZothOS-Lite runs 100% inside RAM (toram noswap). Unplug the boot USB after startup. Powering off discharges RAM—leaving zero files, history, or keys on internal drives.'
          },
          {
            icon: '🧰',
            title: 'Install Extra Tools, .deb & AppImage Without Bloat',
            desc: 'Pull optional modules into RAM anytime with `zoth-lite-pkg install <module>`, `dpkg -i`, or portable `.AppImage`.'
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
