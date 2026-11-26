/**
 * Agent Voice Call v2.6.0 — Local-First Voice Cockpit Client
 * - Zero DOM XSS (strict createElement + textContent rendering)
 * - Lazy Web Speech API initialization on #btnMic click (works without join overlay)
 * - Dual-Theme Editorial Ivory Light + Obsidian Dark canvas synchronization
 * - Explicit POST /api/call/create lifecycle (no GET mutation) + live debrief history
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
 */

(function () {
  'use strict';

  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get('token') || '';
  const channel = urlParams.get('channel') || 'web';

  // DOM References
  const elStatus = document.getElementById('connectionStatus');
  const elTimer = document.getElementById('callTimer');
  const elChannel = document.getElementById('channelBadge');
  const elEngineBadge = document.getElementById('ttsEngineBadge');
  const elSessionBadge = document.getElementById('sessionIdBadge');
  const elPersonaName = document.getElementById('personaName');
  const elPersonaRole = document.getElementById('personaRole');
  const elPersonaGrid = document.getElementById('personaGrid');
  const elLiveAgentText = document.getElementById('liveAgentText');
  const elLiveUserText = document.getElementById('liveUserText');
  const elUserLiveBubble = document.getElementById('userLiveBubble');
  const elUserSpeechIndicator = document.getElementById('userSpeechIndicator');
  const elTranscriptViewport = document.getElementById('transcriptViewport');
  const elBtnMic = document.getElementById('btnMic');
  const elBtnVoice = document.getElementById('btnVoiceSelector');
  const elLblVoice = document.getElementById('lblVoice');
  const elBtnEndCall = document.getElementById('btnEndCall');
  const elBtnTestSpeaker = document.getElementById('btnTestSpeaker');
  const elBtnThemeToggle = document.getElementById('btnThemeToggle');
  const elLblTheme = document.getElementById('lblTheme');
  const elUnmuteBanner = document.getElementById('unmuteBanner');
  const elBtnUnmuteTap = document.getElementById('btnUnmuteTap');
  const elInputFallBackText = document.getElementById('inputFallBackText');
  const elBtnSendFallBack = document.getElementById('btnSendFallBack');
  const elBtnReplayInitial = document.getElementById('btnReplayInitial');
  const elModal = document.getElementById('endModal');
  const elModalDuration = document.getElementById('modalDuration');
  const elModalDebrief = document.getElementById('modalDebriefText');
  const elBtnNewSession = document.getElementById('btnNewSession');
  const elDebriefList = document.getElementById('debriefList');
  const elDebriefCountTag = document.getElementById('debriefCountTag');
  const elMicHelperNote = document.getElementById('micHelperNote');
  const elBtnSolanaTip = document.getElementById('btnSolanaTip');
  const canvas = document.getElementById('orbCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  let currentVoice = 'azoth';
  const voicesList = ['azoth', 'ghostbyte', 'athena', 'mercury', 'kitsune', 'chronos'];
  const voiceRoles = {
    azoth: 'Deep, Strategic, Resonant Baritone',
    ghostbyte: 'Cybernetic, Decisive, Imperator',
    athena: 'Articulate, Sharp, British Classical',
    mercury: 'Fast, Agile, Inquisitive',
    kitsune: 'Warm, Natural, Conversational',
    chronos: 'Measured, Deep, Stoic Architect',
  };

  let recognition = null;
  let micInitialized = false;
  let speechApiSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  let isListening = false;
  let isAgentSpeaking = false;
  let isProcessingUtterance = false;
  let isRecognitionStarting = false;
  let recognitionRestartTimer = null;
  let callStartTime = null;
  let timerInterval = null;
  let audioUnlocked = false;
  let pendingAudio = null;

  let activeUserSpeech = '';
  let speechSilenceTimer = null;
  let countdownTimer = null;
  let countdownSecondsLeft = 8;
  const SILENCE_TIMEOUT_MS = 8000;

  const turnAudioMap = new Map();

  let audioCtx = null;
  let gainNode = null;
  let analyserNode = null;
  let currentSourceNode = null;
  const fallbackAudioPlayer = new Audio();
  const freqData = new Uint8Array(64);

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function updateThemeButtonLabel() {
    if (elLblTheme) {
      elLblTheme.textContent = isLightTheme() ? 'Dark' : 'Light';
    }
  }

  function setTheme(nextTheme) {
    const t = nextTheme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('avc-theme', t);
    } catch (_e) {}
    updateThemeButtonLabel();
  }

  updateThemeButtonLabel();
  if (elBtnThemeToggle) {
    elBtnThemeToggle.addEventListener('click', () => {
      setTheme(isLightTheme() ? 'dark' : 'light');
    });
  }

  if (elBtnSolanaTip) {
    elBtnSolanaTip.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK').catch(() => {});
        const orig = elBtnSolanaTip.textContent;
        elBtnSolanaTip.textContent = '✓ Copied Solana Tip';
        setTimeout(() => {
          elBtnSolanaTip.textContent = orig;
        }, 2000);
      }
    });
  }

  function setActiveVoiceUI(voiceId) {
    if (!voicesList.includes(voiceId)) return;
    currentVoice = voiceId;
    const vLabel = currentVoice.charAt(0).toUpperCase() + currentVoice.slice(1);
    if (elLblVoice) elLblVoice.textContent = `Voice: ${vLabel}`;
    if (elPersonaName) elPersonaName.textContent = currentVoice.toUpperCase();
    if (elPersonaRole) elPersonaRole.textContent = voiceRoles[currentVoice] || 'Local AI Voice Persona';
    if (elPersonaGrid) {
      elPersonaGrid.querySelectorAll('.persona-pill').forEach((btn) => {
        const isMatch = btn.getAttribute('data-voice') === currentVoice;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });
    }
  }

  if (elPersonaGrid) {
    elPersonaGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.persona-pill');
      if (!btn) return;
      const v = btn.getAttribute('data-voice');
      if (v) {
        setActiveVoiceUI(v);
        const vLabel = v.charAt(0).toUpperCase() + v.slice(1);
        if (elLiveAgentText) {
          elLiveAgentText.textContent = `"Switched voice persona to ${vLabel}. Ready."`;
        }
      }
    });
  }

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 1.1;
        try {
          const compressor = audioCtx.createDynamicsCompressor();
          analyserNode = audioCtx.createAnalyser();
          analyserNode.fftSize = 128;
          analyserNode.smoothingTimeConstant = 0.75;
          gainNode.connect(compressor);
          compressor.connect(analyserNode);
          analyserNode.connect(audioCtx.destination);
        } catch (_e) {
          gainNode.connect(audioCtx.destination);
        }
      }
    }
    return audioCtx;
  }

  function unlockAudio() {
    if (audioUnlocked) return Promise.resolve();
    const c = getAudioContext();
    audioUnlocked = true;
    hideUnmuteBanner();
    if (c && c.state === 'suspended') {
      try {
        // Non-blocking resume with short timeout so headless/muted browsers never stall mic init
        return Promise.race([
          c.resume().catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 120)),
        ]);
      } catch (_e) {}
    }
    return Promise.resolve();
  }

  // Dual-Theme 60fps Audio Orb
  let orbPhase = 0;
  let orbIntensity = 0.2;

  function renderOrb() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const light = isLightTheme();

    if (isAgentSpeaking && analyserNode) {
      try {
        analyserNode.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        orbIntensity = Math.min(1.0, 0.25 + (sum / freqData.length / 128) * 0.75);
      } catch (_e) {}
      orbPhase += 0.065;
    } else if (isProcessingUtterance) {
      orbPhase += 0.075;
      orbIntensity = 0.5 + Math.sin(orbPhase * 3) * 0.22;
    } else {
      orbPhase += isListening ? 0.03 : 0.015;
      if (orbIntensity > 0.2) orbIntensity -= 0.015;
    }

    const baseRadius = 56 + Math.sin(orbPhase * 2) * 4;
    const pulseBoost = orbIntensity * 22;

    const grad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius + pulseBoost + 38);
    if (isAgentSpeaking) {
      grad.addColorStop(0, light ? 'rgba(140, 106, 46, 0.85)' : 'rgba(212, 175, 55, 0.9)');
      grad.addColorStop(0.55, light ? 'rgba(140, 106, 46, 0.28)' : 'rgba(212, 175, 55, 0.32)');
      grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    } else if (isListening) {
      grad.addColorStop(0, light ? 'rgba(4, 120, 87, 0.85)' : 'rgba(16, 185, 129, 0.85)');
      grad.addColorStop(0.55, light ? 'rgba(4, 120, 87, 0.28)' : 'rgba(16, 185, 129, 0.32)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    } else {
      grad.addColorStop(0, light ? 'rgba(140, 106, 46, 0.38)' : 'rgba(212, 175, 55, 0.35)');
      grad.addColorStop(1, light ? 'rgba(250, 247, 240, 0)' : 'rgba(8, 8, 11, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + pulseBoost + 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius + pulseBoost, 0, Math.PI * 2);
    if (isAgentSpeaking) {
      ctx.fillStyle = light ? '#8C6A2E' : '#D4AF37';
    } else if (isListening) {
      ctx.fillStyle = light ? '#047857' : '#10B981';
    } else {
      ctx.fillStyle = light ? '#EAE2D0' : '#1B1F30';
    }
    ctx.fill();
    ctx.strokeStyle = light ? 'rgba(140, 106, 46, 0.55)' : 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      const r = baseRadius + 15 * (i + 1) + Math.sin(orbPhase + i * 1.4) * 5;
      ctx.arc(cx, cy, Math.max(10, r), 0, Math.PI * 2);
      ctx.strokeStyle = isAgentSpeaking
        ? (light ? 'rgba(140, 106, 46, 0.55)' : 'rgba(255, 235, 150, 0.55)')
        : isListening
          ? (light ? 'rgba(4, 120, 87, 0.5)' : 'rgba(16, 185, 129, 0.45)')
          : (light ? 'rgba(140, 106, 46, 0.28)' : 'rgba(212, 175, 55, 0.22)');
      ctx.lineWidth = 1.5;
      ctx.setLineDash([7 + i * 3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    requestAnimationFrame(renderOrb);
  }

  function startCallTimer() {
    if (timerInterval) clearInterval(timerInterval);
    callStartTime = Date.now();
    if (elTimer) elTimer.textContent = '00:00';
    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      if (elTimer) elTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  // Repaired Web Speech API Recognition (initialized lazily on #btnMic click)
  function setupSpeechRecognition() {
    micInitialized = true;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speechApiSupported = false;
      elBtnMic.setAttribute('data-mic-initialized', 'true');
      elBtnMic.setAttribute('data-mic-status', 'unsupported');
      elStatus.textContent = 'TEXT MODE (SPEECH API UNAVAILABLE)';
      if (elMicHelperNote) {
        elMicHelperNote.textContent = 'This browser does not expose Web Speech API speech recognition. Type your prompt below — audio replies still synthesize and play locally.';
      }
      return false;
    }

    speechApiSupported = true;
    try {
      if (recognition) recognition.abort();
    } catch (_e) {}

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    elBtnMic.setAttribute('data-mic-initialized', 'true');
    elBtnMic.setAttribute('data-mic-status', 'ready');

    recognition.onstart = () => {
      isRecognitionStarting = false;
      isListening = true;
      elBtnMic.classList.add('active');
      elBtnMic.classList.remove('muted');
      elBtnMic.setAttribute('data-mic-status', 'listening');
      if (!isAgentSpeaking && !isProcessingUtterance) {
        elStatus.textContent = activeUserSpeech ? 'LISTENING (SPEAKING)' : 'LISTENING';
      }
    };

    recognition.onspeechstart = () => {
      orbIntensity = 0.9;
      if (elUserSpeechIndicator) {
        elUserSpeechIndicator.textContent = '● SPEAKING';
      }
      resetSilenceCountdown();
    };

    recognition.onresult = (event) => {
      if (isAgentSpeaking || isProcessingUtterance) return;
      let currentFinal = '';
      let currentInterim = '';
      for (let i = 0; i < event.results.length; ++i) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) currentFinal += piece + ' ';
        else currentInterim += piece;
      }
      const fullSpokenText = (currentFinal + currentInterim).trim();
      if (fullSpokenText) {
        activeUserSpeech = fullSpokenText;
        if (elInputFallBackText) {
          elInputFallBackText.value = fullSpokenText;
        }
        if (elUserLiveBubble && elLiveUserText) {
          elUserLiveBubble.style.display = 'block';
          elLiveUserText.textContent = `"${fullSpokenText}"`;
        }
        orbIntensity = 0.85;
        resetSilenceCountdown();
      }
    };

    recognition.onerror = (e) => {
      isRecognitionStarting = false;
      if (e.error === 'not-allowed') {
        isListening = false;
        elBtnMic.classList.remove('active');
        elBtnMic.classList.add('muted');
        elBtnMic.setAttribute('data-mic-status', 'permission-denied');
        elStatus.textContent = 'MIC PERMISSION DENIED';
      }
    };

    recognition.onend = () => {
      isRecognitionStarting = false;
      clearTimeout(recognitionRestartTimer);
      if (isListening && !isAgentSpeaking && !isProcessingUtterance) {
        recognitionRestartTimer = setTimeout(safeStartRecognition, 250);
      }
    };

    return true;
  }

  function resetSilenceCountdown() {
    clearTimeout(speechSilenceTimer);
    clearInterval(countdownTimer);
    countdownSecondsLeft = 8;

    if (elUserSpeechIndicator) {
      elUserSpeechIndicator.textContent = `● AUTO-SEND (${countdownSecondsLeft}s)`;
    }

    countdownTimer = setInterval(() => {
      countdownSecondsLeft -= 1;
      if (countdownSecondsLeft > 0) {
        if (elUserSpeechIndicator && activeUserSpeech) {
          elUserSpeechIndicator.textContent = `● AUTO-SEND (${countdownSecondsLeft}s)`;
        }
      } else {
        clearInterval(countdownTimer);
      }
    }, 1000);

    speechSilenceTimer = setTimeout(() => {
      clearInterval(countdownTimer);
      finalizeAndSendUtterance();
    }, SILENCE_TIMEOUT_MS);
  }

  function safeStartRecognition() {
    if (!recognition || isRecognitionStarting || isAgentSpeaking || isProcessingUtterance) return;
    try {
      isRecognitionStarting = true;
      recognition.start();
    } catch (_e) {
      isRecognitionStarting = false;
    }
  }

  function safeStopRecognition() {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch (_e) {}
  }

  function finalizeAndSendUtterance() {
    clearTimeout(speechSilenceTimer);
    clearInterval(countdownTimer);
    const textToSend = (elInputFallBackText ? elInputFallBackText.value : activeUserSpeech).trim();
    if (!textToSend || isProcessingUtterance || isAgentSpeaking) return;
    activeUserSpeech = '';
    if (elInputFallBackText) elInputFallBackText.value = '';
    isProcessingUtterance = true;
    safeStopRecognition();
    sendUtteranceToAgent(textToSend);
  }

  async function ensureActiveSession() {
    if (token) {
      try {
        const res = await fetch(`/api/call/session?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (elSessionBadge) elSessionBadge.textContent = `SESSION: ${data.session_id}`;
          setActiveVoiceUI(data.voice || currentVoice);
          return true;
        }
      } catch (_e) {}
    }

    const createRes = await fetch('/api/call/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, voice: currentVoice }),
    });
    if (!createRes.ok) {
      throw new Error(`Session create failed: ${createRes.status}`);
    }
    const created = await createRes.json();
    token = created.token;
    if (elSessionBadge) elSessionBadge.textContent = `SESSION: ${created.session_id}`;
    setActiveVoiceUI(created.voice || currentVoice);
    return true;
  }

  async function sendUtteranceToAgent(text) {
    clearTimeout(speechSilenceTimer);
    clearInterval(countdownTimer);
    isProcessingUtterance = true;
    safeStopRecognition();

    elStatus.textContent = 'AGENT THINKING';
    if (elUserLiveBubble && elLiveUserText) {
      elUserLiveBubble.style.display = 'block';
      elLiveUserText.textContent = `"${text}"`;
    }
    if (elUserSpeechIndicator) {
      elUserSpeechIndicator.textContent = '● SENT';
    }

    try {
      if (!token) {
        await ensureActiveSession();
      }
      const res = await fetch('/api/call/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, text, voice: currentVoice }),
      });

      if (res.status === 401) {
        token = '';
        await ensureActiveSession();
        const retry = await fetch('/api/call/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, text, voice: currentVoice }),
        });
        if (!retry.ok) throw new Error(`Server error: ${retry.status}`);
        return await handleSpeakResponse(await retry.json());
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      await handleSpeakResponse(await res.json());
    } catch (err) {
      console.error('Failed sending utterance:', err);
      isProcessingUtterance = false;
      elStatus.textContent = 'ERROR • RETRY';
      resumeListening();
    }
  }

  async function handleSpeakResponse(data) {
    isProcessingUtterance = false;
    if (elEngineBadge && data.tts_engine) {
      elEngineBadge.textContent = `TTS: ${String(data.tts_engine).toUpperCase()}`;
    }
    elStatus.textContent = `${currentVoice.toUpperCase()} SPEAKING (${data.latency_ms || 0}ms)`;
    if (elLiveAgentText) {
      elLiveAgentText.textContent = `"${data.reply_text || ''}"`;
    }
    appendAgentBubble(
      data.reply_text || '',
      data.audio_base64 || null,
      data.audio_mime || 'audio/wav',
      data.latency_ms,
      data.tts_engine || 'local'
    );

    if (data.audio_base64) {
      await playAgentAudio(data.audio_base64, data.audio_mime || 'audio/wav', data.reply_text || '');
    } else {
      fallbackBrowserTTS(data.reply_text || '');
    }
  }

  async function playAgentAudio(b64Data, mime = 'audio/wav', replyText = '') {
    isAgentSpeaking = true;
    isProcessingUtterance = false;
    safeStopRecognition();
    orbIntensity = 0.92;
    elBtnMic.classList.add('speaking');
    elStatus.textContent = 'AGENT SPEAKING';

    const c = getAudioContext();
    if (c && c.state === 'suspended') {
      try { await c.resume(); } catch (_e) {}
    }

    const onAudioPlaybackComplete = () => {
      isAgentSpeaking = false;
      currentSourceNode = null;
      elBtnMic.classList.remove('speaking');
      elStatus.textContent = isListening ? 'LISTENING' : 'READY';
      if (elUserSpeechIndicator) elUserSpeechIndicator.textContent = '● READY';
      setTimeout(resumeListening, 250);
    };

    try {
      const binaryStr = atob(b64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      if (c) {
        try {
          const audioBuffer = await c.decodeAudioData(bytes.buffer.slice(0));
          if (currentSourceNode) {
            try { currentSourceNode.stop(); } catch (_e) {}
          }
          const source = c.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(gainNode || c.destination);
          currentSourceNode = source;
          source.onended = onAudioPlaybackComplete;
          source.start(0);
          hideUnmuteBanner();
          return;
        } catch (_webAudioErr) {}
      }

      const blob = new Blob([bytes], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      fallbackAudioPlayer.src = blobUrl;
      fallbackAudioPlayer.onended = () => {
        URL.revokeObjectURL(blobUrl);
        onAudioPlaybackComplete();
      };
      fallbackAudioPlayer.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        onAudioPlaybackComplete();
      };
      const p = fallbackAudioPlayer.play();
      if (p !== undefined) {
        p.then(hideUnmuteBanner).catch(() => {
          showUnmuteBanner(b64Data, mime, replyText, blobUrl);
        });
      }
    } catch (_fatal) {
      onAudioPlaybackComplete();
    }
  }

  function fallbackBrowserTTS(text) {
    if ('speechSynthesis' in window && text) {
      try { window.speechSynthesis.cancel(); } catch (_e) {}
      isAgentSpeaking = true;
      safeStopRecognition();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.onend = () => {
        isAgentSpeaking = false;
        elStatus.textContent = isListening ? 'LISTENING' : 'READY';
        setTimeout(resumeListening, 250);
      };
      u.onerror = () => {
        isAgentSpeaking = false;
        elStatus.textContent = 'READY';
        resumeListening();
      };
      window.speechSynthesis.speak(u);
    } else {
      isAgentSpeaking = false;
      elStatus.textContent = 'READY';
      resumeListening();
    }
  }

  function showUnmuteBanner(b64Data, mime, replyText, blobUrl) {
    pendingAudio = { b64Data, mime, replyText, blobUrl };
    if (elUnmuteBanner) elUnmuteBanner.style.display = 'flex';
    elStatus.textContent = 'AUDIO PAUSED • UNMUTE';
  }

  function hideUnmuteBanner() {
    if (elUnmuteBanner) elUnmuteBanner.style.display = 'none';
    pendingAudio = null;
  }

  async function handleUnmuteGesture() {
    await unlockAudio();
    if (pendingAudio) {
      const { b64Data, mime, replyText } = pendingAudio;
      pendingAudio = null;
      hideUnmuteBanner();
      playAgentAudio(b64Data, mime, replyText);
    }
  }

  function resumeListening() {
    if (isListening && !isAgentSpeaking && !isProcessingUtterance) {
      clearTimeout(recognitionRestartTimer);
      recognitionRestartTimer = setTimeout(safeStartRecognition, 250);
    }
  }

  // Strictly XSS-Safe DOM Bubble Construction (ZERO innerHTML!)
  function appendAgentBubble(text, b64Data, mime, latencyMs, engineName) {
    const turnId = `turn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (b64Data) {
      turnAudioMap.set(turnId, { b64Data, mime, text });
    }

    const bubble = document.createElement('div');
    bubble.className = 'turn-bubble agent-turn';

    const headerRow = document.createElement('div');
    headerRow.className = 'turn-header-row';

    const speakerWrap = document.createElement('span');
    speakerWrap.className = 'turn-speaker';
    speakerWrap.textContent = currentVoice.toUpperCase();

    if (latencyMs !== undefined && latencyMs !== null) {
      const latSpan = document.createElement('span');
      latSpan.className = 'turn-latency';
      const eng = engineName ? ` · ${String(engineName).toUpperCase()}` : '';
      latSpan.textContent = `${latencyMs}ms${eng}`;
      speakerWrap.appendChild(latSpan);
    }
    headerRow.appendChild(speakerWrap);

    if (b64Data) {
      const btnReplay = document.createElement('button');
      btnReplay.type = 'button';
      btnReplay.className = 'turn-replay-btn';
      btnReplay.setAttribute('data-turn-id', turnId);
      btnReplay.setAttribute('aria-label', 'Replay synthesized turn audio');
      btnReplay.textContent = 'Replay';
      btnReplay.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockAudio();
        const t = turnAudioMap.get(turnId);
        if (t) playAgentAudio(t.b64Data, t.mime, t.text);
      });
      headerRow.appendChild(btnReplay);
    }

    const pText = document.createElement('p');
    pText.className = 'turn-text';
    pText.textContent = `"${String(text)}"`;

    bubble.appendChild(headerRow);
    bubble.appendChild(pText);

    if (elTranscriptViewport) {
      elTranscriptViewport.appendChild(bubble);
      elTranscriptViewport.scrollTop = elTranscriptViewport.scrollHeight;
    }
  }

  async function refreshDebriefHistory() {
    if (!elDebriefList) return;
    try {
      const res = await fetch('/api/call/history?limit=6');
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data.debriefs) ? data.debriefs : [];
      if (elDebriefCountTag) {
        elDebriefCountTag.textContent = `${items.length} saved`;
      }
      elDebriefList.textContent = '';
      if (items.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.className = 'debrief-empty';
        emptyP.textContent = 'No completed calls persisted yet. Click End Call to save a local 0600 debrief.';
        elDebriefList.appendChild(emptyP);
        return;
      }
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'debrief-item';
        const left = document.createElement('strong');
        left.textContent = `${item.session_id || 'call'} · ${String(item.voice || 'azoth').toUpperCase()}`;
        const right = document.createElement('span');
        right.textContent = `${item.total_turns || 0} turns · ${item.duration_sec || 0}s · ${item.ended_at || ''}`;
        row.appendChild(left);
        row.appendChild(right);
        elDebriefList.appendChild(row);
      });
    } catch (_e) {}
  }

  async function refreshHealthMeta() {
    try {
      const res = await fetch('/health');
      if (!res.ok) return;
      const h = await res.json();
      if (elEngineBadge && h.tts_engine) {
        elEngineBadge.textContent = `TTS: ${String(h.tts_engine).toUpperCase()}`;
      }
    } catch (_e) {}
  }

  // Event Listeners
  if (elBtnUnmuteTap) elBtnUnmuteTap.addEventListener('click', handleUnmuteGesture);
  if (elUnmuteBanner) elUnmuteBanner.addEventListener('click', handleUnmuteGesture);

  window.addEventListener('pointerdown', () => {
    if (!audioUnlocked) unlockAudio();
  }, { passive: true });

  if (elBtnTestSpeaker) {
    elBtnTestSpeaker.addEventListener('click', async (e) => {
      e.stopPropagation();
      await unlockAudio();
      elStatus.textContent = 'TESTING AUDIO';
      try {
        const res = await fetch(`/api/call/welcome?voice=${encodeURIComponent(currentVoice)}`);
        if (res.ok) {
          const data = await res.json();
          if (elEngineBadge && data.tts_engine) {
            elEngineBadge.textContent = `TTS: ${String(data.tts_engine).toUpperCase()}`;
          }
          if (data.audio_base64) {
            await playAgentAudio(data.audio_base64, data.audio_mime || 'audio/wav', data.text);
            return;
          }
        }
      } catch (_err) {}
      fallbackBrowserTTS(`Audio bridge operational on ${currentVoice}.`);
    });
  }

  if (elBtnVoice) {
    elBtnVoice.addEventListener('click', () => {
      const idx = voicesList.indexOf(currentVoice);
      const next = voicesList[(idx + 1) % voicesList.length];
      setActiveVoiceUI(next);
      const vLabel = next.charAt(0).toUpperCase() + next.slice(1);
      if (elLiveAgentText) elLiveAgentText.textContent = `"Switched voice persona to ${vLabel}. Ready."`;
    });
  }

  if (elBtnMic) {
    elBtnMic.addEventListener('click', async () => {
      await unlockAudio();

      const pendingText = (elInputFallBackText ? elInputFallBackText.value : activeUserSpeech).trim();
      if (pendingText.length > 0) {
        finalizeAndSendUtterance();
        return;
      }

      if (!micInitialized) {
        const ok = setupSpeechRecognition();
        if (!ok) return;
      }

      if (!speechApiSupported) {
        elStatus.textContent = 'TEXT MODE (SPEECH API UNAVAILABLE)';
        return;
      }

      if (isListening) {
        isListening = false;
        safeStopRecognition();
        elBtnMic.classList.remove('active');
        elBtnMic.classList.add('muted');
        elBtnMic.setAttribute('data-mic-status', 'muted');
        elStatus.textContent = 'MIC MUTED';
      } else {
        isListening = true;
        elBtnMic.classList.add('active');
        elBtnMic.classList.remove('muted');
        elBtnMic.setAttribute('data-mic-status', 'listening');
        elStatus.textContent = 'LISTENING';
        safeStartRecognition();
      }
    });
  }

  function handleSendText() {
    clearTimeout(speechSilenceTimer);
    clearInterval(countdownTimer);
    const text = (elInputFallBackText ? elInputFallBackText.value : '').trim() || activeUserSpeech.trim();
    if (!text || isProcessingUtterance) return;

    if (isAgentSpeaking) {
      if (currentSourceNode) {
        try { currentSourceNode.onended = null; currentSourceNode.stop(); } catch (_e) {}
        currentSourceNode = null;
      }
      fallbackAudioPlayer.pause();
      isAgentSpeaking = false;
    }

    if (elInputFallBackText) elInputFallBackText.value = '';
    activeUserSpeech = '';
    if (elUserLiveBubble && elLiveUserText) {
      elUserLiveBubble.style.display = 'block';
      elLiveUserText.textContent = text;
    }
    sendUtteranceToAgent(text);
  }

  if (elBtnSendFallBack) elBtnSendFallBack.addEventListener('click', handleSendText);
  if (elInputFallBackText) {
    elInputFallBackText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendText();
      }
    });
  }

  if (elBtnReplayInitial) {
    elBtnReplayInitial.addEventListener('click', async (e) => {
      e.stopPropagation();
      await unlockAudio();
      try {
        const res = await fetch(`/api/call/welcome?voice=${encodeURIComponent(currentVoice)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.audio_base64) {
            playAgentAudio(data.audio_base64, data.audio_mime || 'audio/wav', data.text);
            return;
          }
        }
      } catch (_err) {}
      fallbackBrowserTTS('I am on the line. Tap the microphone or type a message below to begin.');
    });
  }

  if (elBtnEndCall) {
    elBtnEndCall.addEventListener('click', async () => {
      clearInterval(timerInterval);
      clearInterval(countdownTimer);
      clearTimeout(speechSilenceTimer);
      isListening = false;
      safeStopRecognition();
      if (currentSourceNode) {
        try { currentSourceNode.stop(); } catch (_e) {}
      }
      fallbackAudioPlayer.pause();

      elStatus.textContent = 'CALL ENDED';
      const durationStr = elTimer ? elTimer.textContent : '00:00';

      try {
        if (token) {
          const res = await fetch('/api/call/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          if (res.ok) {
            const endData = await res.json();
            const s = endData.summary || {};
            token = '';
            if (elModalDuration) {
              elModalDuration.textContent = `Session: ${s.session_id || 'completed'} • Duration: ${durationStr} • Turns: ${s.total_turns ?? 0} • Voice: ${(s.voice || currentVoice).toUpperCase()}`;
            }
            if (elModalDebrief) {
              elModalDebrief.textContent = s.dialogue
                ? `${s.dialogue}\n\nPersisted locally (0600) to ~/.local/share/zoth/voice_calls/debriefs.jsonl.`
                : 'No spoken turns recorded. Empty session summary persisted locally.';
            }
            await refreshDebriefHistory();
            if (elModal) elModal.style.display = 'flex';
            return;
          }
        }
      } catch (_err) {}

      if (elModalDuration) elModalDuration.textContent = `Duration: ${durationStr}`;
      if (elModal) elModal.style.display = 'flex';
    });
  }

  if (elBtnNewSession) {
    elBtnNewSession.addEventListener('click', async () => {
      if (elModal) elModal.style.display = 'none';
      token = '';
      try {
        await ensureActiveSession();
        startCallTimer();
        elStatus.textContent = 'READY';
      } catch (_e) {
        elStatus.textContent = 'RECONNECTING';
      }
    });
  }

  // Initialization
  const isEmbedMode = urlParams.get('embed') === '1';

  async function initSession() {
    if (elChannel) elChannel.textContent = `${channel.toUpperCase()} BRIDGE`;
    setActiveVoiceUI(currentVoice);
    await refreshHealthMeta();
    if (isEmbedMode && !token) {
      // Lazy session creation in embed mode so viewing a Studio iframe never leaks idle sessions
      if (elSessionBadge) elSessionBadge.textContent = 'SESSION: READY';
    } else {
      try {
        await ensureActiveSession();
      } catch (e) {
        console.warn('Session init warning:', e);
        if (elSessionBadge) elSessionBadge.textContent = 'SESSION: STANDBY';
      }
    }
    await refreshDebriefHistory();
    startCallTimer();
    renderOrb();
  }

  initSession();
})();
