const { ipcRenderer } = require('electron');

// ═══════════════════════════════════════════════════════════════════════════════
// Pantheon Mascot Roster & Personalities
// ═══════════════════════════════════════════════════════════════════════════════

const PETS = {
  'eye': {
    id: 'eye',
    name: 'All-Seeing Eye',
    role: 'Alchemical Sentinel',
    badge: 'SENTINEL',
    primary: '#00ff9d',
    secondary: '#00e5ff',
    glow: 'rgba(0, 255, 157, 0.5)',
    type: 'procedural',
    voicePitch: 40,
    voiceSpeed: 150,
    spell: { name: '🔍 Matrix Telemetry', cmd: 'konsole --title "ZothOS Cockpit" -e zoth-cockpit --status' },
    greeting: '👁️ All-Seeing Eye online. Watching every desktop vector and neural node.',
    thoughts: [
      '⚡ Sentinel AI: OS Memory & history buffer active. Zero anomalies.',
      '👁️ All-Seeing Eye: Scanning active workspace and cursor vectors.',
      '👻 NullAI Ghostmode: Darknet Tor routing monitored on Port 9050.',
      '👑 Azoth 24K Gold: Sovereign Ring-0 authority enclave active.',
      '🌌 Swarm Nexus: 21-Agent Pantheon monitoring desktop environment.'
    ]
  },
  'aquila': {
    id: 'aquila',
    name: 'Aquila',
    role: 'Celestial Griffin & Eagle',
    badge: 'CELESTIAL',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    glow: 'rgba(251, 191, 36, 0.55)',
    image: 'assets/pets/aquila-neon.jpg',
    voicePitch: 55,
    voiceSpeed: 155,
    spell: { name: '⚡ Horizon Radar', cmd: 'konsole --title "ZothOS Cockpit" -e zoth-cockpit' },
    greeting: '🦅 Aquila takes flight. The sovereign skies and horizon are under our watch.',
    thoughts: [
      '🦅 Circling the highest cloud vectors. System horizon is clear.',
      '⚡ Celestial energy coursing through the motherboard traces.',
      '🛡️ Griffin talons ready to intercept any unauthorized intrusion.',
      '🌌 Sovereign vantage point established over active workspaces.',
      '✨ The golden wings of Azoth protect your digital realm.'
    ]
  },
  'draco': {
    id: 'draco',
    name: 'Draco',
    role: 'Alchemical Dragon',
    badge: 'DRAGON',
    primary: '#f43f5e',
    secondary: '#fbbf24',
    glow: 'rgba(244, 63, 94, 0.55)',
    image: 'assets/pets/draco-neon.jpg',
    voicePitch: 30,
    voiceSpeed: 140,
    spell: { name: '🔥 Draconic Shell', cmd: 'konsole' },
    greeting: '🐉 Draco awakens. The draconic compiler burns with eternal code flame.',
    thoughts: [
      '🔥 Draconic breath warming the silicon cores.',
      '⚔️ Compiling binary spells into high-throughput execution.',
      '🐉 Ancient dragon scales deflect all memory corruption vectors.',
      '⚡ Molten gold flows through our neural inference gates.',
      '🛡️ Sleeping on a mountain of sovereign cryptographic keys.'
    ]
  },
  'ignis': {
    id: 'ignis',
    name: 'Ignis',
    role: 'Fire Phoenix',
    badge: 'PHOENIX',
    primary: '#f97316',
    secondary: '#ef4444',
    glow: 'rgba(249, 115, 22, 0.55)',
    image: 'assets/pets/ignis-neon.jpg',
    voicePitch: 65,
    voiceSpeed: 160,
    spell: { name: '✨ Phoenix Heal', cmd: 'konsole --title "Zoth Self-Heal" -e zoth-heal' },
    greeting: '🔥 Ignis reborn from the ashes. System resilience and self-healing active.',
    thoughts: [
      '✨ Every crashed process shall rise again stronger and healed.',
      '🔥 Phoenix feathers illuminating the background daemons.',
      '🛠️ Self-healing engine active. Defects are consumed in fire.',
      '⚡ Rebirth cycle primed. ZothOS operational health at 100%.',
      '🌟 Radiant thermal energy stabilized across all 12 cores.'
    ]
  },
  'kitsune': {
    id: 'kitsune',
    name: 'Kitsune',
    role: 'Nine-Tailed Cyber Fox',
    badge: 'MYSTIC',
    primary: '#c084fc',
    secondary: '#e879f9',
    glow: 'rgba(192, 132, 252, 0.55)',
    image: 'assets/pets/kitsune-neon.jpg',
    voicePitch: 75,
    voiceSpeed: 165,
    spell: { name: '🎭 Shift Reality', cmd: 'zoth-mode' },
    greeting: '🦊 Kitsune manifests with nine glowing tails. Motion, taste, and agility aligned.',
    thoughts: [
      '🦊 Nine tails waving between kernel space and user space.',
      '🎭 Shifting forms covertly. Illusion protocols fully engaged.',
      '⚡ Playful trickster heuristics monitoring network sockets.',
      '🌸 Cherry blossom petals drifting through the terminal buffer.',
      '✨ Sleek alchemical motion algorithms dancing at 60 FPS.'
    ]
  },
  'lycan': {
    id: 'lycan',
    name: 'Lycan',
    role: 'Cyber Wolf',
    badge: 'SENTINEL',
    primary: '#38bdf8',
    secondary: '#60a5fa',
    glow: 'rgba(56, 189, 248, 0.55)',
    image: 'assets/pets/lycan-neon.jpg',
    voicePitch: 35,
    voiceSpeed: 145,
    spell: { name: '🛡️ Threat Auditor', cmd: 'konsole --title "Zoth System Doctor" -e zoth-doctor' },
    greeting: '🐺 Lycan on the prowl. OWASP security perimeter locked and defended.',
    thoughts: [
      '🐺 Howling at the darknet moon. Network reconnaissance active.',
      '🛡️ The wolfpack guards the port gates. No intruders allowed.',
      '🔍 Sniffing out payload anomalies and suspicious TCP handshakes.',
      '⚔️ Cyber fangs bared against zero-day exploit attempts.',
      '⚡ Pack coordination synchronized with Zoth Sentinel HUD.'
    ]
  },
  'athena': {
    id: 'athena',
    name: 'Athena',
    role: 'Knowledge Owl',
    badge: 'WISDOM',
    primary: '#2dd4bf',
    secondary: '#34d399',
    glow: 'rgba(45, 212, 191, 0.55)',
    image: 'assets/pets/athena-neon.jpg',
    voicePitch: 50,
    voiceSpeed: 150,
    spell: { name: '📚 Studio Deck', cmd: 'zoth-studio' },
    greeting: '🦉 Athena perches in silence. Knowledge graphs and deep reasoning mapped.',
    thoughts: [
      '🦉 Wide amber eyes indexing the semantic vector matrix.',
      '📚 Observing every thought and transforming it into insight.',
      '✨ Silent nocturnal flight across local repository checkouts.',
      '🧠 Neural context windows tuned for optimal reasoning density.',
      '🔍 Wisdom is sovereign. Knowledge is power in ZothOS.'
    ]
  },
  'ghostbyte': {
    id: 'ghostbyte',
    name: 'Ghostbyte',
    role: 'NullAI Stealth Phantom',
    badge: 'GHOST',
    primary: '#10b981',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.55)',
    image: 'assets/pets/ghostbyte-neon.jpg',
    voicePitch: 45,
    voiceSpeed: 135,
    spell: { name: '🌫️ Tor Cloak', cmd: 'zoth-ghost-gui' },
    greeting: '👻 Ghostbyte cloaked in shadow. Tor SOCKS5 routed, zero metadata traces.',
    thoughts: [
      '👻 Phasing through network firewalls unseen and untracked.',
      '🔒 Amnesic RAM mode verified. Zero forensic footprints left behind.',
      '🌫️ Directing packets through three decentralized onion nodes.',
      '⚡ Invisible companion whispering secrets from the void.',
      '🌑 Ghostmode stealth operational. Direct clearnet severed.'
    ]
  },
  'pixel-shiba': {
    id: 'pixel-shiba',
    name: 'Pixel Shiba',
    role: 'Cyber Doge Familiar',
    badge: 'RETRO',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.55)',
    image: 'assets/pets/pixel-shiba-neon.jpg',
    voicePitch: 80,
    voiceSpeed: 175,
    spell: { name: '🦴 Doge Specs', cmd: 'konsole --hold -e zoth-fastfetch' },
    greeting: '🐾 Much code! Very sovereign! Pixel Shiba is standing by your side.',
    thoughts: [
      '🐾 Wagging tail generates 100 MH/s of positive energy.',
      '🌟 Such security! Much Linux! Very alchemical!',
      '🐕 Loyal companion guarding your home directory treats.',
      '✨ Retro 8-bit bark rings through the audio buffer.',
      '🚀 To the moon and through the sovereign cosmos!'
    ]
  },
  'pixel-neko': {
    id: 'pixel-neko',
    name: 'Pixel Neko',
    role: 'Cyber Cat Familiar',
    badge: 'RETRO',
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.55)',
    image: 'assets/pets/pixel-neko-neon.jpg',
    voicePitch: 85,
    voiceSpeed: 170,
    spell: { name: '🧶 Nexus Hub', cmd: 'zoth-tool-nexus' },
    greeting: '🐱 Nya~ Pixel Neko purrs in the daemon buffer. Prowling through processes.',
    thoughts: [
      '🐱 Pawing at floating cursor particles across the display.',
      '🐾 Purring at 440Hz harmonic frequency in RAM memory.',
      '✨ Sleek neon whiskers twitching at incoming network packets.',
      '🌙 Napping in a sunny corner of the 12-core Xeon processor.',
      '💖 Always agile, always curious, always by your side.'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOM Elements & State
// ═══════════════════════════════════════════════════════════════════════════════

const container = document.getElementById('pet-container');
const speechBubble = document.getElementById('speech-bubble');
const bubbleAgent = document.getElementById('bubble-agent');
const bubbleText = document.getElementById('bubble-text');
const orbCore = document.getElementById('orb-core');
const eyeContainer = document.getElementById('eye-container');
const eyeIris = document.getElementById('eye-iris');
const eyePupil = document.getElementById('eye-pupil');
const scanBeam = document.getElementById('scan-beam');
const petAvatar = document.getElementById('pet-avatar');
const chatInput = document.getElementById('chat-input');
const petMenu = document.getElementById('pet-menu');
const petGallery = document.getElementById('pet-gallery');
const galleryGrid = document.getElementById('gallery-grid');
const pinBtn = document.getElementById('pin-btn');
const compactBtn = document.getElementById('compact-btn');
const voiceBtn = document.getElementById('voice-btn');
const spellPrimary = document.getElementById('spell-primary');
const affinityPill = document.getElementById('affinity-pill');
const affinityText = document.getElementById('affinity-text');
const mascotWrapper = document.querySelector('.mascot-wrapper');

let activePet = PETS['eye'];
let currentThoughtIdx = 0;
let isPinned = true;
let isCompact = false;
let isVoiceEnabled = false;
let speechTimeout = null;
let particleContainer = null;
let idleTimer = null;
let isSleeping = false;
let petsData = {};
let telemetryData = { ramPct: 15, usedGB: '5.0', totalGB: '32.0', torCloaked: true, activeProfile: 'gold' };

// ═══════════════════════════════════════════════════════════════════════════════
// Web Audio Synthesis Engine
// ═══════════════════════════════════════════════════════════════════════════════

function playSound(freq = 600, type = 'sine', duration = 0.12) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playArpeggio() {
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    setTimeout(() => playSound(freq, 'triangle', 0.15), idx * 55);
  });
}

function playLevelUpFanfare() {
  const fanfare = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
  fanfare.forEach((freq, idx) => {
    setTimeout(() => playSound(freq, 'sine', 0.2), idx * 70);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Voice Dispatch (espeak-ng)
// ═══════════════════════════════════════════════════════════════════════════════

function speak(text) {
  if (!isVoiceEnabled || !text) return;
  ipcRenderer.send('speak-text', {
    text,
    pitch: activePet.voicePitch || 50,
    speed: activePet.voiceSpeed || 155
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mascot Switching & Theme Application
// ═══════════════════════════════════════════════════════════════════════════════

function applyPetTheme(pet) {
  activePet = pet;
  document.documentElement.style.setProperty('--pet-primary', pet.primary);
  document.documentElement.style.setProperty('--pet-secondary', pet.secondary);
  document.documentElement.style.setProperty('--pet-glow', pet.glow);

  if (pet.type === 'procedural') {
    eyeContainer.style.display = 'flex';
    petAvatar.style.display = 'none';
  } else {
    eyeContainer.style.display = 'none';
    petAvatar.style.display = 'block';
    petAvatar.src = pet.image;
  }

  // Update spell button
  if (spellPrimary && pet.spell) {
    spellPrimary.textContent = pet.spell.name;
  }

  // Update chat input placeholder
  chatInput.placeholder = `Ask ${pet.name} (${pet.role})...`;

  // Update affinity badge
  updateAffinityDisplay();

  // Save config
  ipcRenderer.send('save-pet-config', { petId: pet.id });
}

function selectPet(petId) {
  if (PETS[petId]) {
    applyPetTheme(PETS[petId]);
    playArpeggio();
    toggleGallery(false);
    showSpeech(activePet.greeting, `● ${activePet.name.toUpperCase()} // ${activePet.badge}`);
    speak(activePet.name + ' active');
    renderGallery();
  }
}

function renderGallery() {
  galleryGrid.innerHTML = '';
  Object.values(PETS).forEach((pet) => {
    const card = document.createElement('div');
    card.className = `gallery-card ${pet.id === activePet.id ? 'active' : ''}`;
    card.onclick = () => selectPet(pet.id);

    const thumbSrc = pet.type === 'procedural' ? 'assets/pets/zoth-neon.jpg' : pet.image;
    card.innerHTML = `
      <img src="${thumbSrc}" class="gallery-card-thumb" style="border-color:${pet.primary};" onerror="this.src='assets/pets/zoth-neon.jpg'">
      <div class="gallery-card-name" style="color:${pet.primary};">${pet.name}</div>
      <div class="gallery-card-role">${pet.role}</div>
    `;
    galleryGrid.appendChild(card);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tamagotchi Affinity & Level System
// ═══════════════════════════════════════════════════════════════════════════════

function getPetStats(petId) {
  if (!petsData[petId]) {
    petsData[petId] = { affinity: 20, level: 1 };
  }
  return petsData[petId];
}

function updateAffinityDisplay() {
  const stats = getPetStats(activePet.id);
  affinityText.textContent = `Lv. ${stats.level} · ${stats.affinity}%`;
}

function addAffinity(points) {
  const stats = getPetStats(activePet.id);
  stats.affinity += points;
  if (stats.affinity >= 100) {
    stats.level += 1;
    stats.affinity = stats.affinity - 100;
    playLevelUpFanfare();
    showSpeech(`🌟 LEVEL UP! ${activePet.name} reached Level ${stats.level} Mastery!`, `👑 ALCHEMICAL ASCENSION`);
    speak('Level up reached');
  }
  updateAffinityDisplay();
  ipcRenderer.send('save-pet-config', { petsData });
}

window.triggerPraise = function() {
  wakeUp();
  playSound(880, 'sine', 0.15);
  addAffinity(5);
  spawnFloatingHearts();
  const praises = [
    `✨ ${activePet.name} feels deeply appreciated! (+5 Bond)`,
    `💖 Pure alchemical resonance flows between you and ${activePet.name}!`,
    `🌟 ${activePet.name} purrs with cybernetic happiness.`
  ];
  const msg = praises[Math.floor(Math.random() * praises.length)];
  showSpeech(msg);
  speak('Praise received');
};

window.triggerFeed = function() {
  wakeUp();
  playSound(740, 'triangle', 0.18);
  addAffinity(8);
  spawnFloatingSparkles();
  const feeds = [
    `☕ Quantum Espresso consumed! Processor clock energized. (+8 Bond)`,
    `💎 Ether Shard absorbed! Neural buffers glowing with power.`,
    `✨ Fresh prompt tokens devoured! Thought latency reduced.`
  ];
  const msg = feeds[Math.floor(Math.random() * feeds.length)];
  showSpeech(msg);
  speak('Energy restored');
};

function spawnFloatingHearts() {
  for (let i = 0; i < 6; i++) {
    const heart = document.createElement('div');
    heart.textContent = ['💖', '💕', '✨', '🌟'][Math.floor(Math.random() * 4)];
    heart.style.cssText = `
      position: absolute;
      left: ${60 + Math.random() * 120}px;
      bottom: 120px;
      font-size: ${16 + Math.random() * 12}px;
      pointer-events: none;
      z-index: 99;
      opacity: 1;
      transform: translateY(0) scale(1);
      transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    container.appendChild(heart);
    requestAnimationFrame(() => {
      heart.style.transform = `translate(${(Math.random() - 0.5) * 60}px, -100px) scale(1.4)`;
      heart.style.opacity = '0';
    });
    setTimeout(() => { if (heart.parentNode) heart.remove(); }, 1000);
  }
}

function spawnFloatingSparkles() {
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('div');
    s.textContent = ['☕', '💎', '⚡', '✨'][Math.floor(Math.random() * 4)];
    s.style.cssText = `
      position: absolute;
      left: ${60 + Math.random() * 120}px;
      bottom: 120px;
      font-size: ${15 + Math.random() * 10}px;
      pointer-events: none;
      z-index: 99;
      opacity: 1;
      transform: translateY(0);
      transition: all 0.85s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    container.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translate(${(Math.random() - 0.5) * 50}px, -90px) scale(1.3)`;
      s.style.opacity = '0';
    });
    setTimeout(() => { if (s.parentNode) s.remove(); }, 950);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Familiar Spells Execution
// ═══════════════════════════════════════════════════════════════════════════════

window.castFamiliarSpell = function() {
  wakeUp();
  if (!activePet.spell) return;
  playSound(940, 'triangle', 0.2);
  playArpeggio();
  showSpeech(`Casting: ${activePet.spell.name}...`, `🔮 ${activePet.name.toUpperCase()} SPELL`);
  speak('Casting spell');
  ipcRenderer.send('run-spell', activePet.spell.cmd);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Idle & Sleep Engine
// ═══════════════════════════════════════════════════════════════════════════════

function resetIdleTimer() {
  if (isSleeping) {
    wakeUp();
  }
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    enterSleep();
  }, 45000);
}

function enterSleep() {
  isSleeping = true;
  container.classList.add('sleeping');
  showSpeech(`💤 ${activePet.name} is resting in the memory buffer... (Zzz)`, `🌙 MEDITATION`);
}

function wakeUp() {
  if (isSleeping) {
    isSleeping = false;
    container.classList.remove('sleeping');
    playSound(600, 'sine', 0.1);
    showSpeech(`✨ ${activePet.name} awakens! Ready for action.`);
  }
}

window.addEventListener('mousemove', resetIdleTimer);
window.addEventListener('keydown', resetIdleTimer);
resetIdleTimer();

// ═══════════════════════════════════════════════════════════════════════════════
// Speech Bubble & Dialog System
// ═══════════════════════════════════════════════════════════════════════════════

function showSpeech(text, agent = null, durationMs = 8500) {
  if (isCompact) return;
  if (!agent) agent = `● ${activePet.name.toUpperCase()} // ${activePet.badge}`;

  bubbleAgent.textContent = agent;
  bubbleText.textContent = text;
  speechBubble.classList.add('visible');

  if (speechTimeout) clearTimeout(speechTimeout);
  speechTimeout = setTimeout(() => {
    speechBubble.classList.remove('visible');
  }, durationMs);
}

function hideSpeech() {
  speechBubble.classList.remove('visible');
  if (speechTimeout) clearTimeout(speechTimeout);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Particle Trails & 60FPS Cursor Tracking
// ═══════════════════════════════════════════════════════════════════════════════

function initParticleSystem() {
  particleContainer = document.createElement('div');
  particleContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:18;overflow:hidden;';
  container.prepend(particleContainer);
}
initParticleSystem();

function spawnParticleTrail(cursorX, cursorY, velocity) {
  const count = Math.min(4, Math.floor(velocity / 300));
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 5 + 3;
    const offsetX = (Math.random() - 0.5) * 16;
    const offsetY = (Math.random() - 0.5) * 16;

    p.style.cssText = `
      position:absolute;
      left:${cursorX + offsetX}px;
      top:${cursorY + offsetY}px;
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${activePet.primary};
      box-shadow:0 0 ${size * 2}px ${activePet.primary};
      pointer-events:none;
      z-index:19;
      opacity:0.8;
      transition:transform 0.5s ease-out, opacity 0.5s ease-out;
    `;
    particleContainer.appendChild(p);

    requestAnimationFrame(() => {
      const driftX = (Math.random() - 0.5) * 24;
      const driftY = -Math.random() * 16 - 4;
      p.style.transform = `translate(${driftX}px, ${driftY}px) scale(0.2)`;
      p.style.opacity = '0';
    });

    setTimeout(() => { if (p.parentNode) p.remove(); }, 550);
  }
}

// Handle global cursor position from main process
ipcRenderer.on('global-cursor-pos', (event, pos) => {
  const rect = orbCore.getBoundingClientRect();
  const orbCenterX = pos.windowX + rect.left + rect.width / 2;
  const orbCenterY = pos.windowY + rect.top + rect.height / 2;

  const deltaX = pos.cursorX - orbCenterX;
  const deltaY = pos.cursorY - orbCenterY;
  const dist = Math.hypot(deltaX, deltaY);
  const angle = Math.atan2(deltaY, deltaX);

  if (activePet.type === 'procedural' && eyeIris) {
    const maxRadius = 16;
    const distance = Math.min(maxRadius, dist / 22);
    const pupilX = Math.cos(angle) * distance;
    const pupilY = Math.sin(angle) * distance;
    eyeIris.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
  } else if (petAvatar) {
    const tiltMax = 14;
    const tiltX = Math.max(-tiltMax, Math.min(tiltMax, -(deltaY / 30)));
    const tiltY = Math.max(-tiltMax, Math.min(tiltMax, deltaX / 30));
    petAvatar.style.transform = `perspective(500px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
  }

  if (pos.velocity > 450) {
    const relX = pos.cursorX - pos.windowX;
    const relY = pos.cursorY - pos.windowY;
    spawnParticleTrail(relX, relY, pos.velocity);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Window Dragging Logic
// ═══════════════════════════════════════════════════════════════════════════════

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

if (mascotWrapper) {
  mascotWrapper.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      wakeUp();
      isDragging = true;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const deltaX = e.screenX - dragStartX;
      const deltaY = e.screenY - dragStartY;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      ipcRenderer.send('move-pet-window', { deltaX, deltaY });
    }
  });

  window.addEventListener('mouseup', () => { isDragging = false; });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Interactive Actions & AI Chat
// ═══════════════════════════════════════════════════════════════════════════════

window.triggerPoke = function() {
  wakeUp();
  playSound(720, 'triangle', 0.16);
  currentThoughtIdx = (currentThoughtIdx + 1) % activePet.thoughts.length;
  const thought = activePet.thoughts[currentThoughtIdx];
  showSpeech(thought);
  speak(thought);

  orbCore.style.transform = 'scale(0.94)';
  setTimeout(() => { orbCore.style.transform = ''; }, 150);
};

window.sendChatQuery = function() {
  wakeUp();
  const query = chatInput.value.trim();
  if (!query) return;
  chatInput.value = '';
  playSound(800, 'sine', 0.1);

  showSpeech(`Thinking: "${query}"...`, `● ${activePet.name.toUpperCase()} // REASONING`);

  addAffinity(2);

  const contextStr = `RAM: ${telemetryData.usedGB}/${telemetryData.totalGB} GB (${telemetryData.ramPct}%), Tor: ${telemetryData.torCloaked ? 'Active' : 'Clearnet'}, Profile: ${telemetryData.activeProfile}`;

  ipcRenderer.send('query-pet-ai', {
    prompt: query,
    petInfo: { name: activePet.name, role: activePet.role, desc: activePet.greeting },
    context: contextStr
  });
};

window.handleChatKey = function(event) {
  if (event.key === 'Enter') sendChatQuery();
};

ipcRenderer.on('pet-ai-response', (event, { success, text, error }) => {
  if (success && text) {
    playSound(920, 'sine', 0.15);
    showSpeech(text, `● ${activePet.name.toUpperCase()} // NEURAL QWEN`);
    speak(text);
  } else {
    const fallbackThoughts = activePet.thoughts;
    const randomThought = fallbackThoughts[Math.floor(Math.random() * fallbackThoughts.length)];
    showSpeech(randomThought, `● ${activePet.name.toUpperCase()} // HEURISTIC`);
    speak(randomThought);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UI Controls (Voice, Pin, Compact, Gallery, Context Menu)
// ═══════════════════════════════════════════════════════════════════════════════

window.toggleVoice = function() {
  isVoiceEnabled = !isVoiceEnabled;
  voiceBtn.textContent = isVoiceEnabled ? '🔊' : '🔇';
  voiceBtn.classList.toggle('active', isVoiceEnabled);
  ipcRenderer.send('save-pet-config', { voice: isVoiceEnabled });
  playSound(isVoiceEnabled ? 880 : 380, 'sine');
  showSpeech(isVoiceEnabled ? '🔊 Voice speech enabled (espeak-ng).' : '🔇 Voice speech muted.');
  if (isVoiceEnabled) speak('Voice active');
};

window.togglePin = function() {
  isPinned = !isPinned;
  ipcRenderer.send('set-always-on-top', isPinned);
  pinBtn.classList.toggle('pinned', isPinned);
  playSound(isPinned ? 840 : 440, 'sine');
  showSpeech(isPinned ? '📌 Window pinned on top.' : 'Window unpinned.');
};

window.toggleCompact = function() {
  isCompact = !isCompact;
  container.classList.toggle('compact', isCompact);
  compactBtn.textContent = isCompact ? '➕' : '➖';
  ipcRenderer.send('save-pet-config', { compact: isCompact });
  playSound(isCompact ? 400 : 700, 'sine');
  if (!isCompact) {
    showSpeech(activePet.greeting);
  }
};

window.toggleGallery = function(forceState) {
  const show = typeof forceState === 'boolean' ? forceState : !petGallery.classList.contains('active');
  petGallery.classList.toggle('active', show);
  if (show) {
    playSound(660, 'sine');
    renderGallery();
  }
};

window.launch = function(appName) {
  playSound(880, 'sine');
  ipcRenderer.send('launch-app', appName);
  petMenu.classList.remove('active');
  showSpeech(`Launching ${appName.toUpperCase()}...`, '🚀 ZOTH DISPATCH');
};

// Context Menu
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  petMenu.classList.toggle('active');
});

window.addEventListener('click', (e) => {
  if (!petMenu.contains(e.target) && e.button !== 2) {
    petMenu.classList.remove('active');
  }
});

// Telemetry Updates
ipcRenderer.on('telemetry-update', (event, data) => {
  telemetryData = data;
  if (data.ramPct > 80) {
    document.documentElement.style.setProperty('--pet-glow', 'rgba(244, 63, 94, 0.6)');
  } else {
    document.documentElement.style.setProperty('--pet-glow', activePet.glow);
  }
});

// Config Restoration
ipcRenderer.on('pet-config-loaded', (event, cfg) => {
  if (cfg.petsData) {
    petsData = cfg.petsData;
  }
  if (cfg.petId && PETS[cfg.petId]) {
    applyPetTheme(PETS[cfg.petId]);
  }
  if (typeof cfg.alwaysOnTop === 'boolean') {
    isPinned = cfg.alwaysOnTop;
    pinBtn.classList.toggle('pinned', isPinned);
  }
  if (cfg.voice) {
    isVoiceEnabled = true;
    voiceBtn.textContent = '🔊';
    voiceBtn.classList.add('active');
  }
  if (cfg.compact) {
    isCompact = true;
    container.classList.add('compact');
    compactBtn.textContent = '➕';
  }
});

// Initialize on startup
ipcRenderer.send('load-pet-config');
ipcRenderer.send('get-telemetry');
renderGallery();

setTimeout(() => {
  showSpeech(activePet.greeting, `● ${activePet.name.toUpperCase()} // ${activePet.badge}`);
  if (isVoiceEnabled) speak(activePet.greeting);
}, 600);