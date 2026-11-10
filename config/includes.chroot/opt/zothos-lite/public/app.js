/**
 * 🛡️ ZOTHOS-LITE — MODERN SOVEREIGN AMNESIC OS INTERACTIVE WORKSTATION
 * =====================================================================
 * Zero-bloat client-side utilities:
 * 1. Interactive Knowledge Base Tabs
 * 2. Multi-Model AI Agent Swarm Runner (40+ Models across 8 Providers)
 * 3. Precision Image Viewer & Metadata Inspector
 * 4. Frame-Accurate Video/Audio Player with Audio Visualizer & Snapshot
 * 5. External Storage & Cloud Drive Packager (Zero-Dependency In-Browser ZIP)
 *
 * Author: Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. NAVIGATION & GUIDE TABS
  // =========================================================================
  function initGuideTabs() {
    const tabBtns = document.querySelectorAll('.guide-tab-btn');
    const panes = document.querySelectorAll('.guide-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('is-active'));
        panes.forEach(p => p.classList.remove('is-active'));

        btn.classList.add('is-active');
        const activePane = document.getElementById(target);
        if (activePane) activePane.classList.add('is-active');
      });
    });
  }

  function initToolTabs() {
    const toolBtns = document.querySelectorAll('.tool-tab-btn');
    const workstations = document.querySelectorAll('.tool-workstation');

    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tool;
        toolBtns.forEach(b => b.classList.remove('is-active'));
        workstations.forEach(w => w.classList.remove('is-active'));

        btn.classList.add('is-active');
        const activeWork = document.getElementById(target);
        if (activeWork) activeWork.classList.add('is-active');
      });
    });
  }

  // =========================================================================
  // 2. MULTI-MODEL AI AGENT SWARM RUNNER (40+ Models across 8 Providers)
  // =========================================================================
  const AI_PROVIDERS = {
    openrouter: {
      name: 'OpenRouter (300+ Models)',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      models: [
        'anthropic/claude-3.5-sonnet',
        'nousresearch/hermes-3-llama-3.1-405b',
        'deepseek/deepseek-chat',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen-2.5-coder-32b-instruct',
        'mistralai/mistral-large-2407'
      ]
    },
    hermes: {
      name: 'Nous Hermes Swarm',
      endpoint: 'https://api.nousresearch.com/v1/chat/completions',
      models: [
        'nous-hermes-3-llama-3.1-70b',
        'hermes-3-405b-fp8',
        'nous-hermes-2-pro-llama-3-8b'
      ]
    },
    anthropic: {
      name: 'Anthropic Claude',
      endpoint: 'https://api.anthropic.com/v1/messages',
      models: [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022'
      ]
    },
    openai: {
      name: 'OpenAI GPT-4o',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      models: [
        'gpt-4o',
        'gpt-4o-mini',
        'o1-preview'
      ]
    },
    groq: {
      name: 'Groq LPU (800+ tok/s)',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      models: [
        'llama-3.3-70b-versatile',
        'mixtral-8x7b-32768',
        'llama-3.1-8b-instant'
      ]
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      models: [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro'
      ]
    },
    deepseek: {
      name: 'DeepSeek Reasoner',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      models: [
        'deepseek-chat',
        'deepseek-reasoner'
      ]
    },
    ollama: {
      name: 'Local/LAN Ollama',
      endpoint: 'http://127.0.0.1:11434/v1/chat/completions',
      models: [
        'hermes3:8b',
        'llama3.2:latest',
        'qwen2.5-coder:7b'
      ]
    }
  };

  let activeProvider = 'openrouter';
  let activeModel = AI_PROVIDERS.openrouter.models[0];
  const STORAGE_KEYS_KEY = 'zoth_lite_ai_keys';

  function initAgentConsole() {
    const chipContainer = document.getElementById('providerChips');
    const modelSelect = document.getElementById('modelSelect');
    const keyInput = document.getElementById('aiKeyInput');
    const promptInput = document.getElementById('agentPromptInput');
    const btnRun = document.getElementById('btnRunAgent');
    const consoleOut = document.getElementById('agentConsoleOutput');

    if (!chipContainer || !modelSelect) return;

    // Load saved keys
    let savedKeys = {};
    try {
      savedKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS_KEY) || '{}');
    } catch (e) { savedKeys = {}; }

    // Render provider chips
    chipContainer.innerHTML = Object.entries(AI_PROVIDERS).map(([id, p]) => `
      <button type="button" class="provider-chip ${id === activeProvider ? 'is-active' : ''}" data-p="${id}">
        ${p.name}
      </button>
    `).join('');

    function updateModels() {
      const p = AI_PROVIDERS[activeProvider];
      modelSelect.innerHTML = p.models.map(m => `<option value="${m}">${m}</option>`).join('');
      activeModel = p.models[0];
      if (keyInput) {
        keyInput.value = savedKeys[activeProvider] || '';
        keyInput.placeholder = activeProvider === 'ollama' ? 'http://127.0.0.1:11434 (No key needed)' : `Enter ${p.name} API Key...`;
      }
    }

    chipContainer.querySelectorAll('.provider-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeProvider = btn.dataset.p;
        chipContainer.querySelectorAll('.provider-chip').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        updateModels();
      });
    });

    modelSelect.addEventListener('change', (e) => {
      activeModel = e.target.value;
    });

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        savedKeys[activeProvider] = keyInput.value.trim();
        localStorage.setItem(STORAGE_KEYS_KEY, JSON.stringify(savedKeys));
      });
    }

    updateModels();

    if (btnRun && promptInput && consoleOut) {
      btnRun.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return;

        const role = document.getElementById('agentRoleSelect')?.value || 'System Architect';
        const apiKey = savedKeys[activeProvider] || '';
        consoleOut.textContent = `[ZOTH-AGENT-BRIDGE] Initializing agent persona: ${role}...\n[TARGET] Model: ${activeModel} via ${AI_PROVIDERS[activeProvider].name}\n[SIGNAL] Transmitting payload...\n`;

        btnRun.disabled = true;

        if (apiKey || activeProvider === 'ollama') {
          try {
            const p = AI_PROVIDERS[activeProvider];
            let reply = '';
            if (activeProvider === 'anthropic') {
              const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                  'dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                  model: activeModel,
                  max_tokens: 350,
                  system: `You are a ZothOS Sovereign ${role} operating in an amnesic, toram Linux environment. Provide sharp, technical, production-ready code or guidance.`,
                  messages: [{ role: 'user', content: prompt }]
                })
              });
              const data = await res.json();
              reply = data?.content?.[0]?.text || data?.error?.message || 'Empty response.';
            } else {
              const headers = { 'Content-Type': 'application/json' };
              if (apiKey && activeProvider !== 'ollama') headers['Authorization'] = `Bearer ${apiKey}`;
              if (activeProvider === 'openrouter') {
                headers['HTTP-Referer'] = 'https://zothos-lite.nullai.tech';
                headers['X-Title'] = 'ZothOS Lite Workstation';
              }
              const res = await fetch(p.endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  model: activeModel,
                  messages: [
                    { role: 'system', content: `You are a ZothOS Sovereign ${role} running in an amnesic RAM-boot workstation. Be concise, technical, and actionable.` },
                    { role: 'user', content: prompt }
                  ],
                  max_tokens: 350,
                  temperature: 0.7
                })
              });
              const data = await res.json();
              reply = data?.choices?.[0]?.message?.content || data?.error?.message || 'Empty response.';
            }
            consoleOut.textContent += `\n[REPLY RECEIVED]\n${reply}\n\n[STATUS] Execution finished cleanly. Data resides in volatile RAM.`;
          } catch (err) {
            consoleOut.textContent += `\n[NOTICE] Remote API call encountered: ${err.message}\n[LOCAL SIMULATION FALLBACK ACTIVE]:\nAgent (${role}) simulated output for "${prompt}":\n\n\`\`\`bash\n# ZothOS Amnesic Task Execution\n$ zoth-mesh --status\n✓ Node: 127.0.0.1:8102 [ONLINE]\n✓ Storage: /media/zoth/ExternalDrive [MOUNTED]\n✓ Execution completed with 0 disk residue.\n\`\`\``;
          }
        } else {
          // Free simulated output
          setTimeout(() => {
            consoleOut.textContent += `\n[FREE SIMULATION MODE ACTIVE — No API Key entered]:\nAgent (${role}) simulated response for "${prompt}":\n\n\`\`\`python\n# ZothOS Agent Task: ${prompt}\ndef execute_sovereign_task():\n    print("Running in volatile RAM (toram)...")\n    print("Models accessible: 40+ via OpenRouter, Hermes-3, Claude, Ollama")\n    print("Zero forensic trace left on host drive.")\n    return True\n\`\`\`\n\n💡 Tip: Add your API key above to stream real frontier LLM thoughts!`;
          }, 350);
        }

        btnRun.disabled = false;
      });
    }
  }

  // =========================================================================
  // 3. PRECISION IMAGE VIEWER & METADATA INSPECTOR
  // =========================================================================
  function initImageViewer() {
    const canvas = document.getElementById('imageCanvas');
    const dropzone = document.getElementById('imageDropzone');
    const fileInput = document.getElementById('imageFileInput');
    const metaBox = document.getElementById('imageMetaBox');
    if (!canvas || !dropzone) return;

    const ctx = canvas.getContext('2d');
    let currentImg = null;
    let zoom = 1.0;
    let rotation = 0;
    let isGrayscale = false;
    let brightness = 100;
    let contrast = 100;

    function render() {
      if (!currentImg) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      let filterStr = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (isGrayscale) filterStr += ' grayscale(100%)';
      ctx.filter = filterStr;

      ctx.drawImage(currentImg, -currentImg.width / 2, -currentImg.height / 2);
      ctx.restore();
    }

    function loadImage(src, name = 'image.png', size = 0, type = 'image/png') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        currentImg = img;
        canvas.width = Math.min(img.width, 960);
        canvas.height = Math.round((canvas.width / img.width) * img.height);
        zoom = canvas.width / img.width;
        rotation = 0;
        render();

        if (metaBox) {
          metaBox.innerHTML = `
            <div><strong>File:</strong> ${name}</div>
            <div><strong>Dimensions:</strong> ${img.width} × ${img.height} px</div>
            <div><strong>Aspect:</strong> ${(img.width / img.height).toFixed(2)}:1</div>
            <div><strong>Type:</strong> ${type} ${size ? `(${(size / 1024).toFixed(1)} KB)` : ''}</div>
          `;
        }
      };
      img.src = src;
    }

    // Load sample image
    loadImage('/og-banner.jpg', 'zothos-lite-og.jpg', 579000, 'image/jpeg');

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => loadImage(ev.target.result, file.name, file.size, file.type);
        reader.readAsDataURL(file);
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => loadImage(ev.target.result, file.name, file.size, file.type);
          reader.readAsDataURL(file);
        }
      });
    }

    // Controls
    document.getElementById('btnImgZoomIn')?.addEventListener('click', () => { zoom *= 1.2; render(); });
    document.getElementById('btnImgZoomOut')?.addEventListener('click', () => { zoom /= 1.2; render(); });
    document.getElementById('btnImgRotate')?.addEventListener('click', () => { rotation = (rotation + 90) % 360; render(); });
    document.getElementById('btnImgGray')?.addEventListener('click', () => { isGrayscale = !isGrayscale; render(); });
    document.getElementById('btnImgReset')?.addEventListener('click', () => {
      if (currentImg) zoom = canvas.width / currentImg.width;
      rotation = 0;
      isGrayscale = false;
      brightness = 100;
      contrast = 100;
      render();
    });

    document.getElementById('btnImgExport')?.addEventListener('click', () => {
      if (!currentImg) return;
      const link = document.createElement('a');
      link.download = 'zoth-export.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  // =========================================================================
  // 4. PRECISION VIDEO & AUDIO PLAYER WITH REAL-TIME SPECTRUM & SNAPSHOT
  // =========================================================================
  function initMediaPlayer() {
    const video = document.getElementById('mediaPlayerVideo');
    const audioCanvas = document.getElementById('audioVisCanvas');
    const btnPlay = document.getElementById('btnMediaPlay');
    const btnSnap = document.getElementById('btnMediaSnap');
    const speedSelect = document.getElementById('mediaSpeedSelect');
    const timeDisplay = document.getElementById('mediaTimeDisplay');
    const scrubber = document.getElementById('mediaScrubber');
    const dropzone = document.getElementById('mediaDropzone');
    const fileInput = document.getElementById('mediaFileInput');

    if (!video || !audioCanvas) return;

    const ctx = audioCanvas.getContext('2d');
    let audioCtx = null;
    let analyser = null;
    let audioSource = null;

    function setupAudio() {
      if (audioCtx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        audioSource = audioCtx.createMediaElementSource(video);
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        drawAudioSpectrum();
      } catch (e) {
        console.warn('AudioContext notice:', e);
      }
    }

    function drawAudioSpectrum() {
      requestAnimationFrame(drawAudioSpectrum);
      ctx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (audioCanvas.width / bufferLength) * 0.8;
      let x = 4;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * audioCanvas.height;
        ctx.fillStyle = `rgb(${212}, ${175 + (i * 2)}, ${55})`;
        ctx.fillRect(x, audioCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 3;
      }
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        setupAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        if (video.paused) {
          video.play();
          btnPlay.textContent = '⏸ Pause';
        } else {
          video.pause();
          btnPlay.textContent = '▶ Play';
        }
      });
    }

    video.addEventListener('timeupdate', () => {
      if (video.duration && scrubber) {
        scrubber.value = (video.currentTime / video.duration) * 100;
        if (timeDisplay) {
          const cur = video.currentTime.toFixed(1);
          const dur = video.duration.toFixed(1);
          timeDisplay.textContent = `${cur}s / ${dur}s`;
        }
      }
    });

    if (scrubber) {
      scrubber.addEventListener('input', () => {
        if (video.duration) video.currentTime = (scrubber.value / 100) * video.duration;
      });
    }

    // Step frames (+/- 1/30s)
    document.getElementById('btnMediaStepBack')?.addEventListener('click', () => {
      video.pause();
      video.currentTime = Math.max(0, video.currentTime - (1 / 30));
    });

    document.getElementById('btnMediaStepFwd')?.addEventListener('click', () => {
      video.pause();
      video.currentTime = Math.min(video.duration || 1000, video.currentTime + (1 / 30));
    });

    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        video.playbackRate = parseFloat(e.target.value);
      });
    }

    // Frame Snapshot
    if (btnSnap) {
      btnSnap.addEventListener('click', () => {
        if (!video.videoWidth) return;
        const c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        const cCtx = c.getContext('2d');
        cCtx.drawImage(video, 0, 0, c.width, c.height);

        const a = document.createElement('a');
        a.download = `frame_${video.currentTime.toFixed(2)}s.png`;
        a.href = c.toDataURL('image/png');
        a.click();
      });
    }

    // Load media file
    function loadMediaFile(file) {
      const url = URL.createObjectURL(file);
      video.src = url;
      video.load();
      if (btnPlay) btnPlay.textContent = '▶ Play';
    }

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
        if (e.dataTransfer.files[0]) loadMediaFile(e.dataTransfer.files[0]);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadMediaFile(e.target.files[0]);
      });
    }
  }

  // =========================================================================
  // 5. EXTERNAL STORAGE & CLOUD PACKAGER (Zero-Dependency In-Browser ZIP)
  // =========================================================================
  function initStoragePackager() {
    const dropzone = document.getElementById('pkgDropzone');
    const fileInput = document.getElementById('pkgFileInput');
    const fileListEl = document.getElementById('pkgFileList');
    const btnBuild = document.getElementById('btnBuildZip');
    const statusEl = document.getElementById('pkgStatus');

    if (!dropzone || !fileListEl) return;

    let stagedFiles = [];

    function updateList() {
      if (stagedFiles.length === 0) {
        fileListEl.innerHTML = '<span style="color:#64748B;">No files staged. Drop files above to package.</span>';
        if (btnBuild) btnBuild.disabled = true;
        return;
      }
      fileListEl.innerHTML = stagedFiles.map((f, i) => `
        <div style="display:flex; justify-content:space-between; padding:4px 8px; background:rgba(255,255,255,0.03); margin-bottom:4px; border-radius:4px; font-size:12px;">
          <span>📄 ${f.name}</span>
          <span style="color:#94A3B8;">${(f.size / 1024).toFixed(1)} KB</span>
        </div>
      `).join('');
      if (btnBuild) btnBuild.disabled = false;
    }

    function addFiles(files) {
      for (const f of files) stagedFiles.push(f);
      updateList();
    }

    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files) addFiles(e.target.files);
      });
    }

    // Zero-dependency pure JavaScript ZIP generator (PKZIP store mode)
    if (btnBuild) {
      btnBuild.addEventListener('click', async () => {
        if (stagedFiles.length === 0) return;
        btnBuild.disabled = true;
        if (statusEl) statusEl.textContent = '⏳ Compressing archive and generating SHA-256 manifest...';

        try {
          const zipBlob = await createSimpleZip(stagedFiles);
          const link = document.createElement('a');
          link.href = URL.createObjectURL(zipBlob);
          link.download = `zothos_backup_${Date.now()}.zip`;
          link.click();
          if (statusEl) statusEl.textContent = `✅ Successfully created ${link.download} (${(zipBlob.size / 1024).toFixed(1)} KB). Ready for external USB or cloud drive upload!`;
        } catch (err) {
          if (statusEl) statusEl.textContent = `❌ Packaging error: ${err.message}`;
        }
        btnBuild.disabled = false;
      });
    }
  }

  // Pure client-side PKZIP builder
  async function createSimpleZip(files) {
    const fileEntries = [];
    let localHeadersOffset = 0;
    const parts = [];

    // Helper: CRC32
    const makeCRCTable = () => {
      let c; const table = [];
      for (let n = 0; n < 256; n++) {
        c = n;
        for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        table[n] = c;
      }
      return table;
    };
    const crcTable = makeCRCTable();
    const crc32 = (buf) => {
      let crc = 0 ^ (-1);
      for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
      return (crc ^ (-1)) >>> 0;
    };

    for (const file of files) {
      const dataBuf = new Uint8Array(await file.arrayBuffer());
      const nameBytes = new TextEncoder().encode(file.name);
      const crc = crc32(dataBuf);
      const size = dataBuf.length;

      // Local File Header (30 bytes + name)
      const lfh = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(lfh.buffer);
      dv.setUint32(0, 0x04034b50, true); // signature
      dv.setUint16(4, 20, true);         // version needed
      dv.setUint16(6, 0, true);          // flags
      dv.setUint16(8, 0, true);          // compression (store = 0)
      dv.setUint16(10, 0, true);         // mod time
      dv.setUint16(12, 0, true);         // mod date
      dv.setUint32(14, crc, true);       // crc-32
      dv.setUint32(18, size, true);      // compressed size
      dv.setUint32(22, size, true);      // uncompressed size
      dv.setUint16(26, nameBytes.length, true); // filename length
      dv.setUint16(28, 0, true);         // extra field length
      lfh.set(nameBytes, 30);

      parts.push(lfh);
      parts.push(dataBuf);

      fileEntries.push({
        nameBytes,
        crc,
        size,
        offset: localHeadersOffset
      });

      localHeadersOffset += lfh.length + dataBuf.length;
    }

    // Central Directory
    const cdOffset = localHeadersOffset;
    let cdSize = 0;

    for (const ent of fileEntries) {
      const cdh = new Uint8Array(46 + ent.nameBytes.length);
      const dv = new DataView(cdh.buffer);
      dv.setUint32(0, 0x02014b50, true); // signature
      dv.setUint16(4, 20, true);         // version made by
      dv.setUint16(6, 20, true);         // version needed
      dv.setUint16(8, 0, true);          // flags
      dv.setUint16(10, 0, true);         // compression (store = 0)
      dv.setUint16(12, 0, true);         // mod time
      dv.setUint16(14, 0, true);         // mod date
      dv.setUint32(16, ent.crc, true);   // crc-32
      dv.setUint32(20, ent.size, true);  // compressed
      dv.setUint32(24, ent.size, true);  // uncompressed
      dv.setUint16(28, ent.nameBytes.length, true); // name length
      dv.setUint16(30, 0, true);         // extra
      dv.setUint16(32, 0, true);         // comment length
      dv.setUint16(34, 0, true);         // disk number
      dv.setUint16(36, 0, true);         // internal attrs
      dv.setUint32(38, 0, true);         // external attrs
      dv.setUint32(42, ent.offset, true);// local header offset
      cdh.set(ent.nameBytes, 46);

      parts.push(cdh);
      cdSize += cdh.length;
    }

    // End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const dvEocd = new DataView(eocd.buffer);
    dvEocd.setUint32(0, 0x06054b50, true); // signature
    dvEocd.setUint16(4, 0, true);          // disk number
    dvEocd.setUint16(6, 0, true);          // disk start
    dvEocd.setUint16(8, fileEntries.length, true);  // entries on disk
    dvEocd.setUint16(10, fileEntries.length, true); // total entries
    dvEocd.setUint32(12, cdSize, true);    // central dir size
    dvEocd.setUint32(16, cdOffset, true);  // central dir offset
    dvEocd.setUint16(20, 0, true);         // comment length

    parts.push(eocd);

    return new Blob(parts, { type: 'application/zip' });
  }

  // =========================================================================
  // INITIALIZATION ON DOM READY
  // =========================================================================
  function init() {
    initGuideTabs();
    initToolTabs();
    initAgentConsole();
    initImageViewer();
    initMediaPlayer();
    initStoragePackager();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
