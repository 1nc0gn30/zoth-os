import { ProjectState } from '../types/project';
import {
  AudioTrack,
  TapEvent,
  TextOverlay,
  TypewriterOverlayItem,
  ZoomSegment,
} from '../types/models';

export interface MotionSynthPreset {
  id: 'zoth-core' | '1nc0gn30-ops' | 'arsenal-80' | 'vaelor-l1';
  title: string;
  subtitle: string;
  aspect: 'landscape16x9' | 'vertical9x16';
  width: number;
  height: number;
  durationSec: number;
  fps: number;
  bpm: number;
  accentHex: string;
  secondaryHex: string;
  badge: string;
}

export const SYNTH_PRESETS: MotionSynthPreset[] = [
  {
    id: 'zoth-core',
    title: 'Zoth Sovereign Core',
    subtitle: '3D Orbital Merkaba · Zero Still Frames · Alchemical Gold & Cyan',
    aspect: 'landscape16x9',
    width: 1280,
    height: 720,
    durationSec: 6,
    fps: 60,
    bpm: 138,
    accentHex: '#FBBF24',
    secondaryHex: '#22D3EE',
    badge: '16:9 · 60 FPS',
  },
  {
    id: '1nc0gn30-ops',
    title: '1nc0gn30 Cyber Perimeter',
    subtitle: 'Vertical 9:16 Tunnel Mesh · Braille Glitch Decode · 0 Leak Guard',
    aspect: 'vertical9x16',
    width: 720,
    height: 1280,
    durationSec: 6,
    fps: 60,
    bpm: 144,
    accentHex: '#EC4899',
    secondaryHex: '#00F0FF',
    badge: '9:16 · 60 FPS',
  },
  {
    id: 'arsenal-80',
    title: 'Zoth Studio 80-Tool Matrix',
    subtitle: 'Orbital 80-Node Sphere · Free Open-Access Utilities · Kinetic HUD',
    aspect: 'landscape16x9',
    width: 1280,
    height: 720,
    durationSec: 6,
    fps: 60,
    bpm: 132,
    accentHex: '#10B981',
    secondaryHex: '#6366F1',
    badge: '16:9 · 60 FPS',
  },
  {
    id: 'vaelor-l1',
    title: 'Vaelor L1 Gold Forge',
    subtitle: '3D Rotating Sovereign Medallion · Cryptographic Proof Flux',
    aspect: 'landscape16x9',
    width: 1280,
    height: 720,
    durationSec: 6,
    fps: 60,
    bpm: 126,
    accentHex: '#F59E0B',
    secondaryHex: '#A855F7',
    badge: '16:9 · 60 FPS',
  },
];

const BRAILLE_GLYPHS = '⣿⣷⣯⣟⡿⢿⣻⣽⣶⣦⣤⣄⣀⢀⠠⠐⠈⠁⠃⠇⠏⠟⠿';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

function rotatePoint(p: Point3D, rx: number, ry: number, rz: number): Point3D {
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;

  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;

  const cz = Math.cos(rz);
  const sz = Math.sin(rz);
  return {
    x: x1 * cz - y2 * sz,
    y: x1 * sz + y2 * cz,
    z: z2,
  };
}

function projectPoint(
  p: Point3D,
  cx: number,
  cy: number,
  fov: number,
  dist: number
): { x: number; y: number; depth: number } {
  const z = p.z + dist;
  const scale = fov / Math.max(0.25, z);
  return {
    x: cx + p.x * scale,
    y: cy + p.y * scale,
    depth: z,
  };
}

function drawProceduralFrame(
  ctx: CanvasRenderingContext2D,
  preset: MotionSynthPreset,
  t: number
): void {
  const { width, height, accentHex, secondaryHex, id, durationSec } = preset;
  const progress = (t % durationSec) / durationSec;
  const beatPhase = ((t * preset.bpm) / 60) % 1;
  const pulse = Math.pow(Math.max(0, 1 - beatPhase * 1.8), 2);

  // 1. Living Obsidian Gradient Background
  const bgGrad = ctx.createRadialGradient(
    width * (0.5 + 0.14 * Math.sin(t * 0.9)),
    height * (0.45 + 0.12 * Math.cos(t * 0.7)),
    20,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.85
  );
  bgGrad.addColorStop(0, '#111629');
  bgGrad.addColorStop(0.55, '#070912');
  bgGrad.addColorStop(1, '#030408');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Streaming Unicode Braille Matrix Rain (sub-pixel motion)
  ctx.save();
  ctx.font = `700 ${width > height ? 15 : 13}px "IBM Plex Mono", monospace`;
  const cols = width > height ? 26 : 16;
  const colStep = width / cols;
  for (let c = 0; c < cols; c++) {
    const speed = 65 + (c % 5) * 28;
    const baseOffset = ((t * speed + c * 47) % (height + 160)) - 80;
    const ch = BRAILLE_GLYPHS[(Math.floor(t * 14) + c * 3) % BRAILLE_GLYPHS.length];
    ctx.fillStyle = c % 2 === 0 ? `${secondaryHex}30` : `${accentHex}28`;
    ctx.fillText(`${ch}${BRAILLE_GLYPHS[(c + 5) % BRAILLE_GLYPHS.length]}`, c * colStep + 8, baseOffset);
  }
  ctx.restore();

  // 3. Perspective Moving Horizon Grid
  ctx.save();
  const horizonY = height * 0.62;
  ctx.strokeStyle = `${secondaryHex}38`;
  ctx.lineWidth = 1.25;
  const scrollZ = (t * 2.2) % 1;
  for (let i = 1; i <= 10; i++) {
    const depth = (i - scrollZ) / 10;
    const y = horizonY + Math.pow(depth, 2) * (height - horizonY);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  for (let ray = -8; ray <= 8; ray++) {
    ctx.beginPath();
    ctx.moveTo(width / 2 + ray * 18, horizonY);
    ctx.lineTo(width / 2 + ray * (width * 0.16), height);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Center 3D Projected Geometry (unique per preset, continuous 60fps rotation)
  const cx = width / 2;
  const cy = height * 0.45;
  const fov = Math.min(width, height) * 0.92;
  const rx = t * 0.85;
  const ry = t * 1.15;
  const rz = Math.sin(t * 0.7) * 0.35;

  if (id === 'zoth-core' || id === 'vaelor-l1') {
    // Rotating 3D Gimbal Rings + Octahedral Core
    const radii = [1.55, 1.22, 0.9];
    radii.forEach((rad, ri) => {
      ctx.save();
      ctx.strokeStyle = ri % 2 === 0 ? accentHex : secondaryHex;
      ctx.lineWidth = ri === 0 ? 3.0 + pulse * 1.5 : 2.0;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 14 + pulse * 10;
      ctx.beginPath();
      const segs = 48;
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        const raw: Point3D =
          ri === 0
            ? { x: Math.cos(a) * rad, y: Math.sin(a) * rad, z: 0 }
            : ri === 1
            ? { x: Math.cos(a) * rad, y: 0, z: Math.sin(a) * rad }
            : { x: 0, y: Math.cos(a) * rad, z: Math.sin(a) * rad };
        const rot = rotatePoint(raw, rx + ri * 0.6, ry * (ri % 2 === 0 ? 1 : -1), rz);
        const p2 = projectPoint(rot, cx, cy, fov, 4.3);
        if (s === 0) ctx.moveTo(p2.x, p2.y);
        else ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      ctx.restore();
    });

    // Inner Octahedron
    const octVerts: Point3D[] = [
      { x: 0, y: 0.78, z: 0 },
      { x: 0, y: -0.78, z: 0 },
      { x: 0.78, y: 0, z: 0 },
      { x: -0.78, y: 0, z: 0 },
      { x: 0, y: 0, z: 0.78 },
      { x: 0, y: 0, z: -0.78 },
    ].map((v) => rotatePoint(v, rx * 1.3, ry * 1.5, rz));
    const proj = octVerts.map((v) => projectPoint(v, cx, cy, fov, 4.2));
    const edges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2],
    ];
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = accentHex;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (const [a, b] of edges) {
      ctx.moveTo(proj[a].x, proj[a].y);
      ctx.lineTo(proj[b].x, proj[b].y);
    }
    ctx.stroke();
    ctx.restore();
  } else {
    // 80-Node Orbital Sphere / Cyber Fortress Lattice
    const nodes: { x: number; y: number; depth: number; idx: number }[] = [];
    const totalNodes = 48;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < totalNodes; i++) {
      const y = 1 - (i / (totalNodes - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = goldenAngle * i + t * 0.45;
      const p3 = rotatePoint(
        { x: Math.cos(theta) * r * 1.35, y: y * 1.35, z: Math.sin(theta) * r * 1.35 },
        rx * 0.65,
        ry * 0.9,
        0
      );
      const p2 = projectPoint(p3, cx, cy, fov, 4.1);
      nodes.push({ x: p2.x, y: p2.y, depth: p2.depth, idx: i });
    }
    nodes.sort((a, b) => b.depth - a.depth);
    ctx.save();
    ctx.strokeStyle = `${secondaryHex}44`;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i];
      const b = nodes[(i + 5) % nodes.length];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const nd of nodes) {
      const r = Math.max(2.5, (5.5 - nd.depth) * (2.6 + pulse * 1.2));
      ctx.fillStyle = nd.idx % 3 === 0 ? accentHex : secondaryHex;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Kinetic Typography + Live Telemetry HUD
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 19, 0.84)';
  ctx.strokeStyle = `${accentHex}AA`;
  ctx.lineWidth = 2;
  const pillW = Math.min(width - 64, 580);
  const pillH = 66;
  const pillX = (width - pillW) / 2;
  const pillY = height * 0.74;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 14);
  else ctx.rect(pillX, pillY, pillW, pillH);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${width > height ? 26 : 21}px "Syne", "IBM Plex Mono", sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(preset.title.toUpperCase(), width / 2, pillY + 24);

  ctx.font = `600 13px "IBM Plex Mono", monospace`;
  ctx.fillStyle = accentHex;
  const fpsTag = `1NC0GN30 · ZOTH STUDIO · T=${t.toFixed(2)}s · ZERO STILL IMAGES`;
  ctx.fillText(fpsTag, width / 2, pillY + 48);

  // Beat-reactive bottom scan bar
  const barW = (width - 120) * progress;
  ctx.fillStyle = `${secondaryHex}30`;
  ctx.fillRect(60, height - 28, width - 120, 4);
  ctx.fillStyle = accentHex;
  ctx.fillRect(60, height - 28, barW, 4);
  ctx.restore();
}

function encodeFloat32ToWavBase64(samples: Float32Array, sampleRate: number): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(bytes.length, i + chunkSize));
    binary += String.fromCharCode(...slice);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function synthesizeProceduralWav(durationSec: number, bpm: number): {
  dataUrl: string;
  beatTimestamps: number[];
} {
  const sampleRate = 22050;
  const totalSamples = Math.floor(durationSec * sampleRate);
  const data = new Float32Array(totalSamples);
  const beatDur = 60 / bpm;
  const beatTimestamps: number[] = [];

  for (let b = 0; b < durationSec; b += beatDur) {
    beatTimestamps.push(Number(b.toFixed(3)));
    const startIdx = Math.floor(b * sampleRate);
    const kickLen = Math.floor(0.18 * sampleRate);
    for (let k = 0; k < kickLen && startIdx + k < totalSamples; k++) {
      const tk = k / sampleRate;
      const freq = 58 * Math.exp(-tk * 18) + 42;
      data[startIdx + k] += 0.62 * Math.sin(2 * Math.PI * freq * tk) * Math.exp(-tk * 12);
    }
  }

  // Synthwave bass & arpeggio notes
  const scale = [110, 130.81, 146.83, 164.81, 196.0, 220.0];
  const stepDur = beatDur / 2;
  let stepIndex = 0;
  for (let t0 = 0; t0 < durationSec; t0 += stepDur) {
    const startIdx = Math.floor(t0 * sampleRate);
    const noteLen = Math.floor(stepDur * 0.85 * sampleRate);
    const freq = scale[(stepIndex * 3 + 1) % scale.length];
    for (let k = 0; k < noteLen && startIdx + k < totalSamples; k++) {
      const tk = k / sampleRate;
      const harmonic =
        Math.sin(2 * Math.PI * freq * tk) +
        0.35 * Math.sin(2 * Math.PI * freq * 2.004 * tk);
      data[startIdx + k] += 0.18 * harmonic * Math.exp(-tk * 4.5);
    }
    stepIndex++;
  }

  return {
    dataUrl: encodeFloat32ToWavBase64(data, sampleRate),
    beatTimestamps,
  };
}

/**
 * Synthesizes a 100% procedural 60fps video + WAV soundtrack + animated Maya timeline
 * directly in the browser with zero still images.
 */
export async function generateProceduralMotionProject(
  presetId: MotionSynthPreset['id'],
  onProgress?: (progress: number) => void
): Promise<Partial<ProjectState>> {
  const preset = SYNTH_PRESETS.find((p) => p.id === presetId) || SYNTH_PRESETS[0];
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable for procedural synth');

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
    ? 'video/webm;codecs=vp8'
    : 'video/webm';

  const stream = canvas.captureStream(preset.fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalFrames = Math.round(preset.durationSec * preset.fps);
  const frameIntervalMs = 1000 / preset.fps;

  const videoBlob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('MediaRecorder error during procedural capture'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));

    recorder.start();
    let frame = 0;

    const tick = () => {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }
      const t = frame / preset.fps;
      drawProceduralFrame(ctx, preset, t);
      frame++;
      onProgress?.(frame / totalFrames);
      window.setTimeout(tick, frameIntervalMs);
    };

    tick();
  });

  const videoURL = URL.createObjectURL(videoBlob);
  const { dataUrl: wavUrl, beatTimestamps } = synthesizeProceduralWav(
    preset.durationSec,
    preset.bpm
  );

  const audioTrack: AudioTrack = {
    id: crypto.randomUUID(),
    url: wavUrl,
    name: `${preset.title} (${preset.bpm} BPM Synth)`,
    volume: 0.78,
    startTime: 0,
    duration: preset.durationSec,
    fadeIn: 0.15,
    fadeOut: 0.35,
    duckingEnabled: false,
    bpm: preset.bpm,
    beatTimestamps,
  };

  const zoomSegments: ZoomSegment[] = [
    {
      id: crypto.randomUUID(),
      startTime: 0.6,
      duration: 2.0,
      scale: 1.24,
      focus: 'center',
      panX: 0,
      panY: -0.08,
      transitionIn: 0.35,
      transitionOut: 0.45,
      curve: 'spring',
    },
    {
      id: crypto.randomUUID(),
      startTime: 3.4,
      duration: 1.9,
      scale: 1.18,
      focus: 'top-right',
      panX: 0.12,
      panY: -0.06,
      transitionIn: 0.3,
      transitionOut: 0.4,
      curve: 'snappy',
    },
  ];

  const tapEvents: TapEvent[] = [
    {
      id: crypto.randomUUID(),
      startTime: 1.2,
      duration: 0.7,
      position: { x: 0.5, y: 0.45 },
      style: 'ripple',
      diameterFraction: 0.18,
      colorHex: preset.accentHex,
      playSound: false,
    },
    {
      id: crypto.randomUUID(),
      startTime: 3.8,
      duration: 0.7,
      position: { x: 0.58, y: 0.42 },
      style: 'pulse',
      diameterFraction: 0.16,
      colorHex: preset.secondaryHex,
      playSound: false,
    },
  ];

  const typewriters: TypewriterOverlayItem[] = [
    {
      id: crypto.randomUUID(),
      startTime: 0.25,
      duration: 5.5,
      tag: `1NC0GN30 // MAYA MOTION SYNTH (${preset.badge})`,
      text: preset.title.toUpperCase(),
      subtitle: preset.subtitle,
      position: { x: 0.5, y: 0.14 },
      style: 'stroke-typewriter',
      fontSize: preset.aspect === 'vertical9x16' ? 28 : 34,
      textColor: '#FFFFFF',
      accentColor: preset.accentHex,
      strokeColor: '#000000',
      typingSpeedCps: 28,
      showCursor: true,
      cursorChar: '█',
      align: 'center',
    },
  ];

  const overlays: TextOverlay[] = [
    {
      id: crypto.randomUUID(),
      startTime: 2.2,
      duration: 3.6,
      text: 'ZothOS & Zoth Studio v2',
      subtitle: '100% Free Open-Access · Zero Still Images',
      position: { x: 0.5, y: 0.88 },
      style: 'tech-badge',
      lowerThirdPreset: 'tech-badge',
      bgColor: '#0B1020',
      textColor: '#FFFFFF',
      accentColor: preset.secondaryHex,
      fontSize: 20,
      animationStyle: 'slide-up',
      tag: 'SOVEREIGN RUNTIME',
    },
  ];

  return {
    videoURL,
    displayName: `${preset.id}-60fps-procedural.webm`,
    videoNaturalWidth: preset.width,
    videoNaturalHeight: preset.height,
    videoDuration: preset.durationSec,
    currentSeconds: 0,
    isPlaying: false,
    isMuted: false,
    canvasAspect: preset.aspect,
    deviceModelID: preset.aspect === 'vertical9x16' ? 'no-frame' : 'browser-window',
    deviceColorID: 'dark',
    scale: preset.aspect === 'vertical9x16' ? 0.96 : 0.86,
    offset: { width: 0, height: 0 },
    background: {
      type: 'meshGradient',
      theme: preset.id === '1nc0gn30-ops' ? 'cyberpunk' : 'aurora',
      pattern: {
        enabled: true,
        type: 'circuit',
        opacity: 0.28,
        colorHex: preset.accentHex,
        scale: 34,
      },
    },
    transform3D: {
      enabled: preset.aspect !== 'vertical9x16',
      rotateX: 8,
      rotateY: -10,
      rotateZ: 1.5,
      perspective: 1100,
      autoDrift: true,
      depthExtrusion: 12,
      specularGlare: true,
    },
    effects: {
      colorGrade: 'studioBoost',
      vignette: 0.22,
      filmGrain: 0.04,
      chromaticAberration: 0.06,
      bloom: 0.18,
      scanlines: preset.id === '1nc0gn30-ops',
      cameraShake: 0,
      rgbGlitch: 0,
      deviceGlow: {
        enabled: true,
        colorHex: preset.accentHex,
        radius: 26,
      },
    },
    metaEdits: {
      outline: {
        enabled: true,
        colorHex: preset.secondaryHex,
        width: 3,
        pulseSpeed: 2.2,
        glowIntensity: 0.85,
        style: 'flowing',
      },
    },
    progressBar: {
      enabled: true,
      style: 'neonGlow',
      position: 'bottom-thin',
      height: 5,
      colorStart: preset.accentHex,
      colorEnd: preset.secondaryHex,
    },
    animations: zoomSegments,
    tapEvents,
    typewriters,
    overlays,
    audioTracks: [audioTrack],
    trimStartTime: 0,
    trimEndTime: preset.durationSec,
    desktopFrame: {
      title: `1nc0gn30 · ${preset.title}`,
      url: 'https://zoth.nullai.tech',
      theme: 'dark',
      trafficLights: 'macos',
      showUrlBar: true,
    },
  };
}
