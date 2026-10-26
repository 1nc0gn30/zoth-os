import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const GOLD = 0xd4af37;
const GOLD_BRIGHT = 0xf9e29c;
const CYAN_RIM = 0x5aa9e6;
const UP = new THREE.Vector3(0, 1, 0);
const PARENT_FORWARD = new THREE.Vector3(0, 0, -1);
const ASSET_FRONT = new THREE.Vector3(0, 0, -1);

const GLB = new URL('./assets/zoth-guy.glb', import.meta.url).href;
const MASK_GLB = new URL('./assets/azoth-mask.glb', import.meta.url).href;

// Guy is scaled to 1.6 tall, feet at y=0. Head center sits near y=1.18.
const MASK_ON = { y: 1.18, z: 0.23, x: 0.0, rx: 0.04, s: 0.23 };
const MASK_OFF = { y: 1.52, z: 0.34, x: 0.0, rx: -1.15, s: 0.09 };

const DEFAULT_AVATAR = {
  chassis: 'zoth-prime',
  gender: 'masculine',
  bodyType: 'balanced',
  skinColor: '#7c4b31',
  faceType: 'stoic',
  eyeColor: '#d4af37',
  hairStyle: 'locs',
  hairColor: '#141419',
  facialHair: 'none',
  maskStyle: 'azoth',
  accessory: 'cuffs',
  accentColor: '#d4af37',
};

let currentAvatar = { ...DEFAULT_AVATAR };

let renderer;
let scene;
let camera;
let root;
let guy; // Classic scanned zoth-guy.glb
let customRig; // Modular 3D custom character group
let customEyes = { leftPupil: null, rightPupil: null, leftLid: null, rightLid: null };
let maskRoot; // Container for all 3D masks
let azothMaskMesh; // Loaded azoth-mask.glb scene
let proceduralMasks = {}; // { oni, visor, anubis, kitsune, crown }
let maskWanted = true;
let maskT = 1;
let keyLight;
let rimLight;
let crownLight;
let hemi;
let haloGroup;
let outerRing;
let innerRing;
let dustPoints;
let clock;
let raf = 0;
let busy = false;
let compact = true;
let zoomMode = 'bust'; // 'bust' | 'face'
let userYaw = 0;
let targetUserYaw = 0;
let draggingTurntable = false;
let dragStartX = 0;
let dragStartYaw = 0;
let reduced = false;
let canvas;
let host;
let pointerX = 0;
let pointerY = 0;
let smoothPointerX = 0;
let smoothPointerY = 0;

function prefersReduced() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safeColor(hex, fallback = 0xd4af37) {
  try {
    return new THREE.Color(hex || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
}

function createStarDust() {
  const count = 42;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 5) * 0.37;
    const radius = 0.26 + (((i * 17) % 100) / 100) * 0.38;
    const y = 0.72 + (((i * 31) % 100) / 100) * 0.85;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * radius - 0.12;
    scales[i] = 0.5 + ((i * 13) % 10) / 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 32;
  spriteCanvas.height = 32;
  const ctx = spriteCanvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 240, 200, 0.8)');
    grad.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
  }
  const tex = new THREE.CanvasTexture(spriteCanvas);

  const mat = new THREE.PointsMaterial({
    color: GOLD_BRIGHT,
    size: 0.024,
    map: tex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

function createAstrolabeHalo() {
  const group = new THREE.Group();
  group.position.set(0, 1.17, -0.22);

  const ringMatOuter = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ringMatInner = new THREE.MeshBasicMaterial({
    color: GOLD_BRIGHT,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.0028, 12, 96), ringMatOuter);
  outerRing.rotation.x = 0.14;
  outerRing.rotation.y = -0.08;
  group.add(outerRing);

  innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.0022, 12, 80), ringMatInner);
  innerRing.rotation.x = -0.18;
  innerRing.rotation.y = 0.15;
  group.add(innerRing);

  const nodeGeo = new THREE.SphereGeometry(0.0085, 10, 10);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: GOLD_BRIGHT,
    transparent: true,
    opacity: 0.75,
  });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(Math.cos(a) * 0.41, Math.sin(a) * 0.41, 0);
    outerRing.add(node);
  }

  return group;
}

/* ============================================================================
   STUDIO PBR TEXTURE & ENVIRONMENT GENERATOR SUITE
   Generates high-res procedural Bump, Iris, Hair Strand, and Studio IBL maps
   ============================================================================ */
let cachedSkinBump = null;
let cachedHairBump = null;
const cachedIrisTextures = new Map();

function getSkinBumpMap() {
  if (cachedSkinBump) return cachedSkinBump;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(256, 256);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const p = i / 4;
      const x = p % 256;
      const y = (p / 256) | 0;
      const n1 = Math.sin(x * 0.65) * Math.cos(y * 0.65) * 18;
      const n2 = (((x * 73856093) ^ (y * 19349663)) & 31) - 16;
      const v = Math.max(0, Math.min(255, 128 + n1 + n2));
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  cachedSkinBump = tex;
  return tex;
}

function getHairBumpMap() {
  if (cachedHairBump) return cachedHairBump;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 2) {
      const lum = 90 + ((x * 37) % 75);
      ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      ctx.fillRect(x, 0, 1, 256);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  cachedHairBump = tex;
  return tex;
}

function getIrisTexture(eyeHex) {
  const key = String(eyeHex || '#d4af37').toLowerCase();
  if (cachedIrisTextures.has(key)) return cachedIrisTextures.get(key);

  const col = safeColor(key, GOLD);
  const r = Math.round(col.r * 255);
  const g = Math.round(col.g * 255);
  const b = Math.round(col.b * 255);
  const bright = col.clone().lerp(new THREE.Color(0xffffff), 0.45);
  const br = Math.round(bright.r * 255);
  const bg = Math.round(bright.g * 255);
  const bb = Math.round(bright.b * 255);

  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 128;
    const cy = 128;
    // Outer dark limbal ring -> rich iris stroma -> bright collarette -> pupil
    const baseGrad = ctx.createRadialGradient(cx, cy, 24, cx, cy, 126);
    baseGrad.addColorStop(0.0, '#05070b');
    baseGrad.addColorStop(0.26, '#05070b');
    baseGrad.addColorStop(0.32, `rgb(${br},${bg},${bb})`);
    baseGrad.addColorStop(0.62, `rgb(${r},${g},${b})`);
    baseGrad.addColorStop(0.88, `rgb(${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(b * 0.45)})`);
    baseGrad.addColorStop(1.0, '#090c14');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 126, 0, Math.PI * 2);
    ctx.fill();

    // 140 Radial Stromal Fibers & Crypts
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 140; i++) {
      const a = (i / 140) * Math.PI * 2;
      const len = 88 + ((i * 19) % 30);
      ctx.strokeStyle =
        i % 3 === 0
          ? `rgba(${br},${bg},${bb},0.42)`
          : `rgba(${Math.round(r * 0.3)},${Math.round(g * 0.3)},${Math.round(b * 0.3)},0.35)`;
      ctx.lineWidth = i % 4 === 0 ? 1.8 : 1.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34);
      ctx.lineTo(Math.cos(a + 0.03) * len, Math.sin(a + 0.03) * len);
      ctx.stroke();
    }
    ctx.restore();

    // Crisp Pupil Core
    const pupilGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 38);
    pupilGrad.addColorStop(0, '#020306');
    pupilGrad.addColorStop(0.82, '#04060c');
    pupilGrad.addColorStop(1, 'rgba(4,6,12,0)');
    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedIrisTextures.set(key, tex);
  return tex;
}

function createStudioEnvironment(rendererInstance) {
  try {
    const pmrem = new THREE.PMREMGenerator(rendererInstance);
    pmrem.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0b0f19);

    // Key Softbox Overhead Right (Warm Ivory Studio Panel)
    const keyBox = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfffaed, side: THREE.DoubleSide })
    );
    keyBox.position.set(4, 6, 6);
    keyBox.lookAt(0, 0, 0);
    envScene.add(keyBox);

    // Cool Cyber Rim Softbox Left
    const rimBox = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9),
      new THREE.MeshBasicMaterial({ color: 0x6ecbff, side: THREE.DoubleSide })
    );
    rimBox.position.set(-6, 3, -3);
    rimBox.lookAt(0, 0, 0);
    envScene.add(rimBox);

    // Warm 24K Gold Bounce Ring Below
    const bounceBox = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, side: THREE.DoubleSide })
    );
    bounceBox.position.set(0, -6, 3);
    bounceBox.lookAt(0, 0, 0);
    envScene.add(bounceBox);

    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  } catch {
    return null;
  }
}

/* ============================================================================
   CONTINUOUS 72x64 ANATOMICAL 3D HEAD SCULPTOR
   Sculpts a single seamless organic mesh (Brow Ridge, Eye Sockets, Nose Bridge,
   Nostrils, Zygomatic Cheekbones, Tapered Mandible, Cupid's Bow Lips & Chin)
   with exact 3D Per-Vertex Subsurface, Lip, and Orbital Shading!
   ============================================================================ */
function gauss2(dx, dy, sx, sy) {
  const u = (dx * dx) / (sx * sx) + (dy * dy) / (sy * sy);
  return u > 9 ? 0 : Math.exp(-u);
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function createSculptedHeadGeometry(av, skinCol, lipCol) {
  const isFem = av.gender === 'feminine';
  const isAndro = av.gender === 'androgynous';
  const isConstruct = av.gender === 'construct';

  const faceMods = {
    stoic: { jawW: 1.0, cheekW: 1.0, chinH: 1.0, noseS: 1.0 },
    sharp: { jawW: 0.88, cheekW: 1.07, chinH: 1.04, noseS: 0.94 },
    serene: { jawW: 0.91, cheekW: 0.98, chinH: 0.96, noseS: 0.92 },
    cyber: { jawW: 0.98, cheekW: 1.04, chinH: 1.02, noseS: 0.98 },
    oracle: { jawW: 0.93, cheekW: 1.01, chinH: 0.98, noseS: 0.95 },
  };
  const fMod = faceMods[av.faceType] || faceMods.stoic;

  const geo = new THREE.SphereGeometry(0.118, 72, 64);
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  const subsurfaceCol = skinCol.clone().lerp(new THREE.Color(0xe85d56), isConstruct ? 0.05 : 0.22);
  const shadowCol = skinCol.clone().multiplyScalar(0.66);
  const highlightCol = skinCol.clone().lerp(new THREE.Color(0xfff4e4), 0.18);
  const linerCol = new THREE.Color(0x0d090e);

  const baseW = (isFem ? 0.91 : isAndro ? 0.95 : 1.0) * fMod.cheekW;

  for (let i = 0; i < count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const r = Math.hypot(x, y, z) || 0.118;
    const nx = x / r;
    const ny = y / r;
    const nz = z / r;

    // 1. Cranial & Mandible Proportions
    x *= baseW;
    y *= 1.22;
    z *= 1.04;

    // Smooth jawline & chin taper below cheekbones (ny < 0.05)
    if (ny < 0.05) {
      const jawT = smoothstep(0.05, -0.96, ny);
      const narrow = (isFem ? 0.47 : 0.36) / fMod.jawW;
      x *= 1.0 - jawT * narrow;
      // Tuck back of skull/neck cleanly
      if (nz < 0.0) {
        z *= 1.0 - smoothstep(-0.1, -0.9, ny) * (-nz) * 0.38;
      }
      // Project lower jaw & chin forward slightly on front face
      if (nz > 0.15) {
        const frontFace = smoothstep(0.15, 0.85, nz);
        z += smoothstep(-0.1, -0.82, ny) * frontFace * 0.015 * fMod.chinH;
      }
    }

    // Slight temple narrowing at forehead sides
    const temple = gauss2(Math.abs(x) - 0.088, y - 0.036, 0.032, 0.036) * Math.max(0, nz + 0.2);
    x -= Math.sign(x) * temple * 0.0055;

    const absX = Math.abs(x);

    // Front facial sculpting (only on anterior hemisphere z > 0)
    let eyeSocketWeight = 0;
    let lipWeight = 0;
    let stomionWeight = 0;
    let blushWeight = 0;

    if (z > 0.01) {
      const fMask = smoothstep(0.01, 0.05, z);

      // 2. Orbital Eye Sockets (Recessed at |x| = 0.041, y = 0.018)
      const gSocket = gauss2(absX - 0.041, y - 0.018, 0.025, 0.018);
      z -= gSocket * 0.021 * fMask;
      eyeSocketWeight = gSocket * fMask;

      // 3. Supraorbital Brow Ridge (Prominent arch above eyes at y = 0.045)
      const browCurveY = 0.044 + (absX - 0.035) * (isFem ? 0.08 : -0.04);
      const gBrow = gauss2(absX - 0.038, y - browCurveY, 0.034, 0.0115);
      z += gBrow * (isFem ? 0.0085 : 0.0125) * fMask;

      // Glabella (slight dip between brows above nasion)
      const gGlabella = gauss2(x, y - 0.042, 0.012, 0.010);
      z -= gGlabella * 0.003 * fMask;

      // 4. Zygomatic Arch (High Sculpted Cheekbones at |x| = 0.062, y = -0.006)
      const gCheek = gauss2(absX - 0.060, y + 0.006, 0.028, 0.024);
      z += gCheek * 0.0095 * fMod.cheekW * fMask;
      x += Math.sign(x) * gCheek * 0.0065 * fMod.cheekW * fMask;
      blushWeight += gCheek * 0.65 * fMask;

      // Buccal Cheek Hollow (Chiseled contour below cheekbone)
      const gHollow = gauss2(absX - 0.056, y + 0.048, 0.024, 0.022);
      z -= gHollow * (isFem ? 0.003 : 0.0055) * (2.0 - fMod.jawW) * fMask;
      x -= Math.sign(x) * gHollow * 0.0035 * fMask;

      // 5. Continuous Anatomical Nose (Bridge y: 0.032 -> Tip y: -0.024)
      if (y > -0.038 && y < 0.042) {
        const tNose = Math.max(0, Math.min(1, (0.032 - y) / 0.056));
        const bridgeW = (0.0095 + tNose * 0.0045) * (isFem ? 0.88 : 1.0) * fMod.noseS;
        const gBridge =
          Math.exp(-(x * x) / (bridgeW * bridgeW)) *
          smoothstep(0.040, 0.022, y) *
          smoothstep(-0.034, -0.020, y);
        const profileH = (0.007 + Math.pow(tNose, 1.15) * 0.021) * fMod.noseS;
        z += gBridge * profileH * fMask;
      }

      // Rounded Nasal Tip (Pronasale at x=0, y=-0.023)
      const gNoseTip = gauss2(x, y + 0.023, 0.0135 * fMod.noseS, 0.0115);
      z += gNoseTip * 0.0105 * fMask;
      blushWeight += gNoseTip * 0.45 * fMask;

      // Alar Nasal Wings (Nostrils at |x| = 0.0145, y = -0.027)
      const gAlar = gauss2(absX - 0.0145, y + 0.027, 0.0085, 0.0075);
      z += gAlar * 0.0095 * fMask;
      x += Math.sign(x) * gAlar * 0.0025 * fMask;

      // Philtrum groove under nose
      const gPhiltrum = gauss2(x, y + 0.042, 0.006, 0.008);
      z -= gPhiltrum * 0.003 * fMask;

      // 6. Sculpted Cupid's Bow Upper Lip & Plush Lower Lip
      const cupidsDip = Math.exp(-(x * x) / (0.005 * 0.005)) * 0.0022;
      const upperLipY = -0.054 + cupidsDip;
      const gUpperLip = gauss2(x, y - upperLipY, 0.022, 0.0068);
      z += gUpperLip * (isFem ? 0.012 : 0.010) * fMask;

      const lowerLipY = -0.068;
      const gLowerLip = gauss2(x, y - lowerLipY, 0.0195, 0.0075);
      z += gLowerLip * (isFem ? 0.0135 : 0.011) * fMask;

      // Oral Stomion Crease (Mouth parting line at y = -0.061)
      const gStomion = gauss2(x, y + 0.061, 0.023, 0.0024);
      z -= gStomion * 0.0055 * fMask;

      lipWeight = Math.min(1, (gUpperLip * 1.15 + gLowerLip * 1.2) * fMask);
      stomionWeight = Math.min(1, gStomion * 1.4 * fMask);

      // 7. Labiomental Groove & Sculpted Chin Protuberance
      const gChinGroove = gauss2(x, y + 0.081, 0.018, 0.0065);
      z -= gChinGroove * 0.0045 * fMask;

      const gChin = gauss2(x, y + 0.102, 0.024 * fMod.jawW, 0.016);
      z += gChin * 0.0095 * fMod.chinH * fMask;
    }

    pos.setXYZ(i, x, y, z);

    // 8. Studio Per-Vertex Subsurface, Lip, Orbital & Contour Pigmentation
    const vCol = skinCol.clone();
    // Forehead & nose bridge studio highlight
    if (y > 0.03 && z > 0.06) {
      vCol.lerp(highlightCol, smoothstep(0.03, 0.10, y) * 0.35);
    }
    // Warm subsurface blush on cheeks & nose tip
    if (blushWeight > 0.01) {
      vCol.lerp(subsurfaceCol, Math.min(0.55, blushWeight));
    }
    // Soft orbital ambient occlusion + upper lid lash line definition
    if (eyeSocketWeight > 0.01) {
      vCol.lerp(shadowCol, Math.min(0.65, eyeSocketWeight * 0.72));
      if (y > 0.024 && y < 0.035 && eyeSocketWeight > 0.45) {
        vCol.lerp(linerCol, isFem ? 0.55 : 0.28);
      }
    }
    // Under-jaw & neck contour shadow
    if (y < -0.075 && nz < 0.45) {
      vCol.lerp(shadowCol, smoothstep(-0.075, -0.13, y) * 0.45);
    }
    // Natural vermilion lip blend + dark stomion crease
    if (lipWeight > 0.02) {
      vCol.lerp(lipCol, Math.min(0.92, lipWeight));
    }
    if (stomionWeight > 0.05) {
      vCol.lerp(linerCol, Math.min(0.75, stomionWeight * 0.8));
    }

    colors[i * 3] = vCol.r;
    colors[i * 3 + 1] = vCol.g;
    colors[i * 3 + 2] = vCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/* ============================================================================
   PROCEDURAL 3D MASK & HEADGEAR FORGE (High-Craft Beveled & Filigreed)
   Mounts onto maskRoot so Alt+1 mask toggle smoothly equips/lifts any mask!
   ============================================================================ */
function buildProceduralMasks(accentHex) {
  const accent = safeColor(accentHex, GOLD);
  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x10141f,
    metalness: 0.86,
    roughness: 0.20,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });
  const goldMetal = new THREE.MeshPhysicalMaterial({
    color: accent,
    metalness: 0.92,
    roughness: 0.15,
    clearcoat: 0.4,
    emissive: accent.clone().multiplyScalar(0.16),
    side: THREE.DoubleSide,
  });
  const glowMat = new THREE.MeshBasicMaterial({
    color: accent.clone().lerp(new THREE.Color(0xffffff), 0.25),
    transparent: true,
    opacity: 0.95,
  });
  const porcelainMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7f3eb,
    metalness: 0.08,
    roughness: 0.16,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  });

  // 1. CYBER ONI HALF-MASK (Sculpted Menpo Jaw Armor + Gold Filigree + 4 Fangs + Neon Vents)
  const oni = new THREE.Group();
  oni.position.set(0, -0.06, -0.04);
  const jawGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.32, 0.40, 32, 4, false, -Math.PI * 0.44, Math.PI * 0.88),
    darkMetal
  );
  jawGuard.scale.set(1.0, 1.0, 0.88);
  oni.add(jawGuard);

  // Upper nose-bridge guard trim
  const noseGuard = new THREE.Mesh(
    new THREE.TorusGeometry(0.445, 0.018, 12, 36, Math.PI * 0.86),
    goldMetal
  );
  noseGuard.rotation.x = Math.PI / 2 + 0.1;
  noseGuard.rotation.z = Math.PI * 0.07;
  noseGuard.position.set(0, 0.17, 0.0);
  noseGuard.scale.set(1, 0.88, 1);
  oni.add(noseGuard);

  const chinPlate = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 18), goldMetal);
  chinPlate.position.set(0, -0.14, 0.30);
  chinPlate.scale.set(1.1, 0.65, 0.65);
  oni.add(chinPlate);

  // Oni Fangs (2 upper canines, 2 lower curved tusks)
  [-1, 1].forEach((side) => {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.044, 0.17, 16), goldMetal);
    tusk.position.set(side * 0.19, 0.02, 0.38);
    tusk.rotation.z = -side * 0.24;
    tusk.rotation.x = -0.22;
    oni.add(tusk);

    const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.12, 16), porcelainMat);
    upperFang.position.set(side * 0.105, 0.07, 0.41);
    upperFang.rotation.x = Math.PI - 0.15;
    oni.add(upperFang);

    // Dual Glowing Cheek Vent Slits
    [0.04, -0.02].forEach((vy, idx) => {
      const vent = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.13 - idx * 0.03, 6, 12), glowMat);
      vent.position.set(side * 0.31, vy, 0.28);
      vent.rotation.z = Math.PI / 2 - side * 0.2;
      vent.rotation.y = -side * 0.55;
      oni.add(vent);
    });
  });

  // 2. TACTICAL HOLO-VISOR (Curved Wrap-Around Glass Shield with Gold Frame & HUD Reticle)
  const visor = new THREE.Group();
  visor.position.set(0, 0.09, -0.16);
  const visorGlassMat = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.55,
    metalness: 0.2,
    roughness: 0.05,
    transmission: 0.45,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
  });
  const visorLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.50, 0.48, 0.21, 40, 1, true, -Math.PI * 0.43, Math.PI * 0.86),
    visorGlassMat
  );
  visorLens.scale.set(1, 1, 0.86);
  visor.add(visorLens);

  // Upper & lower gold visor rims
  [0.105, -0.105].forEach((ry, idx) => {
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(idx === 0 ? 0.495 : 0.478, idx === 0 ? 0.022 : 0.012, 12, 40, Math.PI * 0.86),
      goldMetal
    );
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = Math.PI * 0.07;
    rim.position.y = ry;
    rim.scale.set(1, 0.86, 1);
    visor.add(rim);
  });

  [-1, 1].forEach((side) => {
    const earPod = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.065, 20), darkMetal);
    earPod.rotation.z = Math.PI / 2;
    earPod.position.set(side * 0.48, 0.0, 0.04);
    visor.add(earPod);

    const podRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 10, 20), goldMetal);
    podRing.rotation.y = Math.PI / 2;
    podRing.position.set(side * 0.515, 0.0, 0.04);
    visor.add(podRing);
  });

  // 3. ANUBIS JACKAL PHARAONIC CREST MASK
  const anubis = new THREE.Group();
  anubis.position.set(0, 0.04, -0.18);
  const anubisHelm = new THREE.Mesh(new THREE.SphereGeometry(0.49, 32, 24), darkMetal);
  anubisHelm.scale.set(0.95, 1.08, 0.95);
  anubis.add(anubisHelm);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.50, 16), darkMetal);
  snout.rotation.x = Math.PI * 0.58;
  snout.position.set(0, -0.07, 0.45);
  snout.scale.set(0.88, 1.0, 1.0);
  anubis.add(snout);

  const snoutCrest = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.54, 0.14), goldMetal);
  snoutCrest.position.set(0, 0.09, 0.42);
  snoutCrest.rotation.x = -0.32;
  anubis.add(snoutCrest);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.125, 0.58, 12), darkMetal);
    ear.position.set(side * 0.28, 0.62, -0.02);
    ear.rotation.z = -side * 0.12;
    ear.rotation.x = 0.12;
    anubis.add(ear);

    const earInlay = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.45, 12), goldMetal);
    earInlay.position.set(side * 0.28, 0.60, 0.03);
    earInlay.rotation.z = -side * 0.12;
    earInlay.rotation.x = 0.12;
    anubis.add(earInlay);

    const eyeGlow = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.13, 8, 12), glowMat);
    eyeGlow.position.set(side * 0.20, 0.08, 0.44);
    eyeGlow.rotation.z = Math.PI / 2 - side * 0.24;
    eyeGlow.rotation.y = side * 0.35;
    anubis.add(eyeGlow);
  });

  // 4. PHANTOM KITSUNE SPIRIT MASK
  const kitsune = new THREE.Group();
  kitsune.position.set(0, 0.04, -0.14);
  const foxFace = new THREE.Mesh(new THREE.SphereGeometry(0.47, 32, 24), porcelainMat);
  foxFace.scale.set(0.96, 1.04, 0.72);
  kitsune.add(foxFace);

  const foxNose = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 24), porcelainMat);
  foxNose.rotation.x = Math.PI * 0.52;
  foxNose.position.set(0, -0.07, 0.36);
  kitsune.add(foxNose);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), darkMetal);
  noseTip.position.set(0, -0.08, 0.52);
  kitsune.add(noseTip);

  // Forehead solar mark
  const sunMark = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.015, 10, 24), goldMetal);
  sunMark.position.set(0, 0.24, 0.30);
  sunMark.rotation.x = -0.25;
  kitsune.add(sunMark);

  [-1, 1].forEach((side) => {
    const foxEar = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.44, 16), porcelainMat);
    foxEar.position.set(side * 0.32, 0.52, 0.02);
    foxEar.rotation.z = -side * 0.28;
    kitsune.add(foxEar);

    const foxEarInner = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.31, 16), goldMetal);
    foxEarInner.position.set(side * 0.31, 0.50, 0.07);
    foxEarInner.rotation.z = -side * 0.28;
    kitsune.add(foxEarInner);

    const slit = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.14, 8, 12), glowMat);
    slit.position.set(side * 0.20, 0.08, 0.34);
    slit.rotation.z = Math.PI / 2 + side * 0.22;
    slit.rotation.y = side * 0.28;
    kitsune.add(slit);
  });

  // 5. SERAPHIM HALO CROWN DIADEM (Floats at top of forehead; full sculpted face visible!)
  const crown = new THREE.Group();
  crown.position.set(0, 0.46, -0.42);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.50, 0.026, 16, 48), goldMetal);
  band.rotation.x = Math.PI / 2 - 0.12;
  crown.add(band);

  for (let i = -4; i <= 4; i++) {
    const a = i * 0.30;
    const h = 0.28 - Math.abs(i) * 0.042;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.032, h, 12), goldMetal);
    spire.position.set(Math.sin(a) * 0.50, h * 0.5 + 0.02, Math.cos(a) * 0.50);
    spire.rotation.z = -a * 0.32;
    crown.add(spire);
  }
  const centerGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), glowMat);
  centerGem.position.set(0, 0.12, 0.52);
  centerGem.scale.set(0.7, 1.35, 0.5);
  crown.add(centerGem);

  return { oni, visor, anubis, kitsune, crown };
}

function syncActiveMaskMesh() {
  if (!maskRoot) return;
  const style = (currentAvatar && currentAvatar.maskStyle) || 'azoth';

  Object.values(proceduralMasks).forEach((g) => {
    if (g && g.parent === maskRoot) maskRoot.remove(g);
  });
  proceduralMasks = buildProceduralMasks(currentAvatar.accentColor || '#d4af37');
  Object.values(proceduralMasks).forEach((g) => {
    g.visible = false;
    maskRoot.add(g);
  });

  if (azothMaskMesh) {
    azothMaskMesh.visible = style === 'azoth';
  }
  if (style !== 'azoth' && style !== 'none' && proceduralMasks[style]) {
    proceduralMasks[style].visible = true;
  }
}

/* ============================================================================
   BESPOKE STUDIO 3D CHARACTER FORGE (Skin, Face, Gender, Body, Hair, Eyes)
   ============================================================================ */
function makeCurvedStrand(points, radius, mat, radialSegs = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, 18, radius, radialSegs, false);
  return new THREE.Mesh(geo, mat);
}

function buildCustomCharacterRig(av) {
  const group = new THREE.Group();
  customEyes = { leftPupil: null, rightPupil: null, leftLid: null, rightLid: null };

  const skinCol = safeColor(av.skinColor, '#7c4b31');
  const hairCol = safeColor(av.hairColor, '#141419');
  const eyeCol = safeColor(av.eyeColor, '#d4af37');
  const accentCol = safeColor(av.accentColor, '#d4af37');

  const isFem = av.gender === 'feminine';
  const isAndro = av.gender === 'androgynous';
  const isConstruct = av.gender === 'construct';

  const warmSheen = skinCol.clone().lerp(new THREE.Color(0xffb499), 0.38);

  // Studio Physical Skin Material (with Per-Vertex Subsurface & Lip Shading + Micro-Pore Bump)
  const headSkinMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    bumpMap: getSkinBumpMap(),
    bumpScale: isConstruct ? 0.0004 : 0.0011,
    roughness: isConstruct ? 0.24 : 0.42,
    metalness: isConstruct ? 0.65 : 0.04,
    clearcoat: isConstruct ? 0.65 : 0.14,
    clearcoatRoughness: 0.36,
    sheen: isConstruct ? 0.1 : 0.45,
    sheenRoughness: 0.52,
    sheenColor: warmSheen,
    emissive: skinCol.clone().multiplyScalar(0.04),
  });

  // Neck & Ear Skin Material (matches base skinCol)
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinCol,
    bumpMap: getSkinBumpMap(),
    bumpScale: 0.0009,
    roughness: isConstruct ? 0.24 : 0.44,
    metalness: isConstruct ? 0.65 : 0.04,
    clearcoat: 0.12,
    clearcoatRoughness: 0.38,
    sheen: 0.4,
    sheenRoughness: 0.55,
    sheenColor: warmSheen,
    emissive: skinCol.clone().multiplyScalar(0.04),
  });

  const lipColor = isFem
    ? skinCol.clone().lerp(new THREE.Color(0xb8334a), 0.52)
    : skinCol.clone().multiplyScalar(0.72).lerp(new THREE.Color(0x7a2e38), 0.28);

  const hairMat = new THREE.MeshPhysicalMaterial({
    color: hairCol,
    bumpMap: getHairBumpMap(),
    bumpScale: 0.0025,
    roughness: 0.38,
    metalness: 0.16,
    clearcoat: 0.22,
    clearcoatRoughness: 0.45,
    sheen: 0.55,
    sheenRoughness: 0.35,
    sheenColor: hairCol.clone().lerp(new THREE.Color(0xffffff), 0.25),
  });

  const suitMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0f19,
    roughness: 0.36,
    metalness: 0.42,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
  });

  const armorPlateMat = new THREE.MeshPhysicalMaterial({
    color: 0x131926,
    roughness: 0.24,
    metalness: 0.72,
    clearcoat: 0.45,
  });

  const trimMat = new THREE.MeshPhysicalMaterial({
    color: accentCol,
    roughness: 0.16,
    metalness: 0.92,
    clearcoat: 0.5,
    emissive: accentCol.clone().multiplyScalar(0.18),
  });

  const irisMat = new THREE.MeshBasicMaterial({
    map: getIrisTexture(av.eyeColor),
  });

  // ── 1. BODY TYPE PROPORTION SCALES ─────────────────────────────────────────
  const bodyScales = {
    balanced: { sx: 1.0, sy: 1.0, sz: 1.0, shoulderW: 0.22 },
    athletic: { sx: 1.12, sy: 1.02, sz: 1.08, shoulderW: 0.25 },
    slender: { sx: 0.86, sy: 1.03, sz: 0.88, shoulderW: 0.19 },
    titan: { sx: 1.25, sy: 1.04, sz: 1.18, shoulderW: 0.28 },
    compact: { sx: 0.94, sy: 0.92, sz: 0.95, shoulderW: 0.21 },
  };
  const bScale = bodyScales[av.bodyType] || bodyScales.balanced;
  const genderShoulderMod = isFem ? 0.86 : isAndro ? 0.93 : 1.0;

  // ── 2. TORSO, SHOULDERS & SOVEREIGN COAT (y = 0.0 .. 1.02) ─────────────────
  const torsoGroup = new THREE.Group();
  torsoGroup.scale.set(bScale.sx * genderShoulderMod, 1.0, bScale.sz);

  const chestTopR = isFem ? 0.145 : 0.165;
  const waistR = isFem ? 0.102 : 0.132;
  const torsoMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(chestTopR, waistR, 0.64, 32),
    suitMat
  );
  torsoMesh.position.set(0, 0.68, -0.02);
  torsoMesh.scale.set(1.22, 1.0, 0.78);
  torsoGroup.add(torsoMesh);

  // Sculpted Chest Armor / Tailored Coat Panels
  if (isFem) {
    [-1, 1].forEach((side) => {
      const bust = new THREE.Mesh(new THREE.SphereGeometry(0.074, 24, 20), armorPlateMat);
      bust.position.set(side * 0.066, 0.82, 0.072);
      bust.scale.set(1.02, 0.94, 0.88);
      torsoGroup.add(bust);
    });
  } else {
    [-1, 1].forEach((side) => {
      const pec = new THREE.Mesh(new THREE.SphereGeometry(0.082, 24, 18), armorPlateMat);
      pec.position.set(side * 0.068, 0.84, 0.056);
      pec.scale.set(1.08, 0.86, 0.68);
      torsoGroup.add(pec);
    });
  }

  // High Sovereign Mandarin Collar & Gold Filigree Rim
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.158, 0.145, 32, 1, true, Math.PI * 0.20, Math.PI * 1.60),
    armorPlateMat
  );
  collar.position.set(0, 0.99, -0.02);
  collar.rotation.y = Math.PI;
  torsoGroup.add(collar);

  const collarRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.140, 0.0075, 12, 40, Math.PI * 1.56),
    trimMat
  );
  collarRim.position.set(0, 1.055, -0.02);
  collarRim.rotation.x = Math.PI / 2;
  collarRim.rotation.z = Math.PI * 0.72;
  torsoGroup.add(collarRim);

  // Sculpted Shoulder Pauldrons, Gold Epaulettes & Tailored Lapels
  [-1, 1].forEach((side) => {
    const shX = side * bScale.shoulderW;
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.090, 24, 20), armorPlateMat);
    pauldron.position.set(shX, 0.92, -0.01);
    pauldron.scale.set(1.08, 0.84, 0.96);
    torsoGroup.add(pauldron);

    const pauldronTrim = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.0065, 12, 32), trimMat);
    pauldronTrim.position.set(shX, 0.92, -0.01);
    pauldronTrim.rotation.y = side * 0.45;
    pauldronTrim.rotation.x = 0.85;
    torsoGroup.add(pauldronTrim);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.052, 0.56, 24), suitMat);
    arm.position.set(shX * 1.06, 0.66, -0.01);
    arm.rotation.z = -side * 0.08;
    torsoGroup.add(arm);

    // Curved Coat Lapel Gold Piping
    const lapelCurve = makeCurvedStrand(
      [
        [side * 0.092, 1.01, 0.085],
        [side * 0.082, 0.84, 0.114],
        [side * 0.055, 0.64, 0.106],
      ],
      0.0085,
      trimMat,
      10
    );
    torsoGroup.add(lapelCurve);
  });

  // Glowing Multi-Ring Azoth Chest Core Reactor
  const coreOuter = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.0055, 12, 32), trimMat);
  coreOuter.position.set(0, 0.86, 0.118);
  torsoGroup.add(coreOuter);

  const coreGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.025, 1),
    new THREE.MeshBasicMaterial({ color: accentCol.clone().lerp(new THREE.Color(0xffffff), 0.3) })
  );
  coreGem.position.set(0, 0.86, 0.122);
  torsoGroup.add(coreGem);

  // Anatomical Neck Column & Clavicle Base
  const neckRadius = isFem ? 0.050 : 0.061;
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(neckRadius, neckRadius * 1.15, 0.19, 28),
    skinMat
  );
  neck.position.set(0, 1.035, 0.012);
  group.add(neck);

  // Sovereign Gold Collar Chain
  const neckChain = new THREE.Mesh(
    new THREE.TorusGeometry(neckRadius * 1.18, 0.0045, 10, 32, Math.PI * 1.1),
    trimMat
  );
  neckChain.position.set(0, 0.99, 0.022);
  neckChain.rotation.x = Math.PI / 2 + 0.28;
  neckChain.rotation.z = -Math.PI * 0.05;
  group.add(neckChain);

  if (isConstruct) {
    [1.015, 1.055].forEach((ny) => {
      const nRing = new THREE.Mesh(new THREE.TorusGeometry(neckRadius * 1.06, 0.004, 10, 28), trimMat);
      nRing.position.set(0, ny, 0.012);
      nRing.rotation.x = Math.PI / 2;
      group.add(nRing);
    });
  }

  group.add(torsoGroup);

  // ── 3. CONTINUOUS ANATOMICAL HEAD & FACE SCULPT (y = 1.18, z = 0.04) ───────
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0.04);

  const faceMods = {
    stoic: { jawW: 1.0, cheekW: 1.0, browTilt: -0.04 },
    sharp: { jawW: 0.88, cheekW: 1.07, browTilt: -0.18 },
    serene: { jawW: 0.91, cheekW: 0.98, browTilt: 0.06 },
    cyber: { jawW: 0.98, cheekW: 1.04, browTilt: -0.10 },
    oracle: { jawW: 0.93, cheekW: 1.01, browTilt: 0.04 },
  };
  const fMod = faceMods[av.faceType] || faceMods.stoic;
  const jawTopW = (isFem ? 0.086 : 0.098) * fMod.jawW;
  const jawBotW = (isFem ? 0.046 : 0.064) * fMod.jawW;

  const sculptedHeadGeo = createSculptedHeadGeometry(av, skinCol, lipColor);
  const headMesh = new THREE.Mesh(sculptedHeadGeo, headSkinMat);
  headGroup.add(headMesh);

  // Sculpted Anatomical Ears & Optional Sovereign Gold Ear Cuffs
  const acc = av.accessory || 'cuffs';
  [-1, 1].forEach((side) => {
    const earX = side * (isFem ? 0.105 : 0.114) * fMod.cheekW;
    const earGroup = new THREE.Group();
    earGroup.position.set(earX, 0.004, -0.006);
    earGroup.rotation.y = -side * 0.22;
    earGroup.rotation.z = -side * 0.08;

    const earOuter = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 14), skinMat);
    earOuter.scale.set(0.42, 1.28, 0.76);
    earGroup.add(earOuter);

    const earHelix = new THREE.Mesh(
      new THREE.TorusGeometry(0.017, 0.0045, 8, 18, Math.PI * 1.25),
      skinMat
    );
    earHelix.rotation.y = Math.PI / 2;
    earHelix.rotation.z = -Math.PI * 0.25;
    earHelix.scale.set(1.0, 1.35, 1.0);
    earGroup.add(earHelix);

    headGroup.add(earGroup);

    if (acc === 'cuffs') {
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.0115, 0.0036, 10, 20), trimMat);
      cuff.position.set(earX * 1.03, -0.025, 0.002);
      cuff.rotation.y = Math.PI / 2;
      headGroup.add(cuff);

      const helixCuff = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.003, 10, 18), trimMat);
      helixCuff.position.set(earX * 1.04, 0.016, -0.006);
      helixCuff.rotation.y = Math.PI / 2;
      helixCuff.rotation.x = 0.35;
      headGroup.add(helixCuff);
    }
  });

  // ── 3B. SCULPTED 3D FACIAL HAIR (`facialHair`: 'none' | 'goatee' | 'beard' | 'stache' | 'stubble')
  const fh = av.facialHair || 'none';
  if (fh !== 'none') {
    const beardMat = new THREE.MeshStandardMaterial({
      color: hairCol,
      bumpMap: getHairBumpMap(),
      bumpScale: 0.0035,
      roughness: 0.78,
      metalness: 0.05,
    });
    const fhGroup = new THREE.Group();
    if (fh === 'stache' || fh === 'goatee' || fh === 'beard') {
      [-1, 1].forEach((side) => {
        const stache = makeCurvedStrand(
          [
            [0, -0.044, 0.122],
            [side * 0.014, -0.046, 0.120],
            [side * 0.027, -0.055, 0.111],
          ],
          0.0052,
          beardMat,
          10
        );
        fhGroup.add(stache);
      });
    }
    if (fh === 'goatee') {
      const soulPatch = new THREE.Mesh(new THREE.ConeGeometry(0.0058, 0.016, 10), beardMat);
      soulPatch.position.set(0, -0.075, 0.116);
      soulPatch.rotation.x = Math.PI;
      fhGroup.add(soulPatch);

      // Tapered anatomical chin goatee tuft & side connectors (no shiny round sphere)
      [-1, 0, 1].forEach((col) => {
        const tuft = makeCurvedStrand(
          [
            [col * 0.011, -0.088, 0.110 - Math.abs(col) * 0.003],
            [col * 0.012, -0.104, 0.106 - Math.abs(col) * 0.003],
            [col * 0.008, -0.118, 0.094],
          ],
          col === 0 ? 0.0105 : 0.0085,
          beardMat,
          10
        );
        fhGroup.add(tuft);
      });
    } else if (fh === 'beard') {
      // Sculpted Multi-Contour Jaw Beard hugging the mandible
      [-1, 1].forEach((side) => {
        const jawStrap = makeCurvedStrand(
          [
            [side * 0.090 * fMod.jawW, -0.018, 0.028],
            [side * 0.072 * fMod.jawW, -0.068, 0.072],
            [side * 0.035 * fMod.jawW, -0.104, 0.102],
            [0, -0.112, 0.106],
          ],
          0.016,
          beardMat,
          12
        );
        fhGroup.add(jawStrap);
      });
      [-1, 0, 1].forEach((col) => {
        const chinTuft = makeCurvedStrand(
          [
            [col * 0.014, -0.084, 0.111 - Math.abs(col) * 0.003],
            [col * 0.014, -0.106, 0.106 - Math.abs(col) * 0.003],
            [col * 0.010, -0.122, 0.092],
          ],
          0.012,
          beardMat,
          10
        );
        fhGroup.add(chinTuft);
      });
    } else if (fh === 'stubble') {
      const stubbleMat = new THREE.MeshStandardMaterial({
        color: hairCol,
        bumpMap: getSkinBumpMap(),
        bumpScale: 0.003,
        roughness: 0.90,
        transparent: true,
        opacity: 0.36,
      });
      const stubbleJaw = new THREE.Mesh(
        new THREE.SphereGeometry(0.088 * fMod.jawW, 24, 18),
        stubbleMat
      );
      stubbleJaw.position.set(0, -0.076, 0.056);
      stubbleJaw.scale.set(0.95, 0.76, 0.86);
      fhGroup.add(stubbleJaw);
    }
    headGroup.add(fhGroup);
  }

  // ── 3C. SOVEREIGN & CYBER ACCESSORIES (`accessory`: 'scouter' | 'horns' | 'wings')
  if (acc === 'scouter') {
    const scouterGroup = new THREE.Group();
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: eyeCol,
      emissive: eyeCol,
      emissiveIntensity: 0.58,
      transparent: true,
      opacity: 0.72,
      roughness: 0.06,
      metalness: 0.15,
      clearcoat: 1.0,
    });
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.004, 6), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0.042, 0.018, 0.132);
    scouterGroup.add(lens);

    const lensRim = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.0028, 8, 6), trimMat);
    lensRim.position.set(0.042, 0.018, 0.133);
    scouterGroup.add(lensRim);

    const templeArm = new THREE.Mesh(new THREE.BoxGeometry(0.0055, 0.011, 0.11), trimMat);
    templeArm.position.set(0.104, 0.018, 0.066);
    templeArm.rotation.y = -0.25;
    scouterGroup.add(templeArm);
    headGroup.add(scouterGroup);
  } else if (acc === 'horns') {
    const hornBaseMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e1118,
      metalness: 0.72,
      roughness: 0.20,
      clearcoat: 0.6,
    });
    [-1, 1].forEach((side) => {
      // Swept-up curved Oni/Dragon horn via CatmullRom spline + tapered cone tip
      const hornCurve = makeCurvedStrand(
        [
          [side * 0.068, 0.095, 0.062],
          [side * 0.088, 0.135, 0.052],
          [side * 0.098, 0.185, 0.028],
        ],
        0.016,
        hornBaseMat,
        12
      );
      headGroup.add(hornCurve);

      const hornTip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.065, 14), trimMat);
      hornTip.position.set(side * 0.101, 0.212, 0.016);
      hornTip.rotation.z = -side * 0.18;
      hornTip.rotation.x = -0.35;
      headGroup.add(hornTip);

      const hornRing = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0038, 10, 20), trimMat);
      hornRing.position.set(side * 0.072, 0.102, 0.060);
      hornRing.rotation.x = Math.PI / 2 - 0.35;
      hornRing.rotation.y = -side * 0.42;
      headGroup.add(hornRing);
    });
  } else if (acc === 'wings') {
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: accentCol,
      emissive: accentCol,
      emissiveIntensity: 0.38,
      metalness: 0.88,
      roughness: 0.14,
      clearcoat: 0.8,
      transparent: true,
      opacity: 0.90,
    });
    [-1, 1].forEach((side) => {
      for (let w = 0; w < 4; w++) {
        const blade = new THREE.Mesh(
          new THREE.ConeGeometry(0.028 - w * 0.004, 0.28 - w * 0.038, 4),
          wingMat
        );
        blade.position.set(
          side * (0.21 + w * 0.048),
          0.99 - w * 0.058,
          -0.11 - w * 0.012
        );
        blade.rotation.z = -side * (0.68 + w * 0.20);
        blade.rotation.y = -side * 0.24;
        blade.scale.set(0.55, 1.0, 0.22);
        torsoGroup.add(blade);
      }
    });
  }

  // ── 4. HYPER-DETAILED ALMOND 3D EYES (Radial Iris Texture + Eyelid Framing + Eyelashes)
  const scleraMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f5fa,
    roughness: 0.14,
    metalness: 0.0,
    clearcoat: 0.9,
  });
  const specMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lashMat = new THREE.MeshStandardMaterial({ color: 0x07060a, roughness: 0.35 });

  [-1, 1].forEach((side) => {
    const eyeX = side * 0.040;
    const eyeY = 0.018;
    const eyeZ = 0.105;

    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(eyeX, eyeY, eyeZ);
    eyeSocket.rotation.y = side * 0.09;
    eyeSocket.rotation.z = side * (isFem ? 0.05 : 0.02);

    // Almond-proportioned Sclera nestled inside sculpted orbital socket
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 24, 20), scleraMat);
    sclera.scale.set(1.16, isFem ? 0.78 : 0.72, 0.76);
    eyeSocket.add(sclera);

    // Moving Gaze Group (256x256 Radial Stromal Iris + Limbal Glow + Dual Catchlights)
    const gazeGroup = new THREE.Group();
    const irisDisc = new THREE.Mesh(new THREE.CircleGeometry(0.0098, 32), irisMat);
    irisDisc.position.z = 0.0138;
    gazeGroup.add(irisDisc);

    // Subtle emissive limbal ring glow
    const irisGlowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.0062, 0.0094, 32),
      new THREE.MeshBasicMaterial({
        color: eyeCol.clone().lerp(new THREE.Color(0xffffff), 0.35),
        transparent: true,
        opacity: 0.58,
      })
    );
    irisGlowRing.position.z = 0.0140;
    gazeGroup.add(irisGlowRing);

    // Primary & secondary studio catchlights
    const catchPrimary = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 12), specMat);
    catchPrimary.position.set(0.0030, 0.0028, 0.0144);
    gazeGroup.add(catchPrimary);

    const catchSecondary = new THREE.Mesh(new THREE.CircleGeometry(0.0011, 10), specMat);
    catchSecondary.position.set(-0.0028, -0.0022, 0.0144);
    gazeGroup.add(catchSecondary);

    eyeSocket.add(gazeGroup);
    if (side < 0) customEyes.leftPupil = gazeGroup;
    else customEyes.rightPupil = gazeGroup;

    // Sculpted Upper Eyelid + Thick Dark Eyelash Line resting across the top 22% of the iris
    const upperLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0192, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
      skinMat
    );
    upperLid.scale.set(1.22, 0.84, 0.88);
    upperLid.rotation.x = -0.22;
    eyeSocket.add(upperLid);

    // Sculpted Dark Upper Eyelash Band along the lower rim of upperLid
    const lashBand = makeCurvedStrand(
      [
        [-0.019, 0.002, 0.012],
        [0, 0.0045, 0.0172],
        [0.019, 0.002, 0.012],
      ],
      isFem ? 0.0024 : 0.0018,
      lashMat,
      8
    );
    eyeSocket.add(lashBand);

    // Subtle Lower Eyelid Fold framing bottom of eye (eliminates "round surprised eyeball" look)
    const lowerLid = makeCurvedStrand(
      [
        [-0.018, -0.0055, 0.010],
        [0, -0.0082, 0.0152],
        [0.018, -0.0055, 0.010],
      ],
      0.0026,
      skinMat,
      8
    );
    eyeSocket.add(lowerLid);

    if (side < 0) customEyes.leftLid = upperLid;
    else customEyes.rightLid = upperLid;

    // Sculpted Arched Eyebrow (CatmullRom 3D brow volume)
    const browTilt = fMod.browTilt;
    const browMesh = makeCurvedStrand(
      [
        [side * 0.017, eyeY + 0.022 - browTilt * 0.02, eyeZ + 0.013],
        [side * 0.041, eyeY + 0.026, eyeZ + 0.011],
        [side * 0.063, eyeY + 0.019 + browTilt * 0.025, eyeZ - 0.001],
      ],
      isFem ? 0.0040 : 0.0052,
      hairMat,
      10
    );
    headGroup.add(browMesh);

    headGroup.add(eyeSocket);
  });

  // Special Face Sculpt Inlays (Cybernetic Gold Seams or Mystic Oracle Third-Eye)
  if (av.faceType === 'cyber' || isConstruct) {
    [-1, 1].forEach((side) => {
      const seam = makeCurvedStrand(
        [
          [side * 0.028, -0.004, 0.114],
          [side * 0.058, -0.014, 0.100],
          [side * 0.082, -0.006, 0.070],
        ],
        0.0022,
        trimMat,
        8
      );
      headGroup.add(seam);
    });
  }
  if (av.faceType === 'oracle') {
    const thirdEyeRim = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0022, 8, 20), trimMat);
    thirdEyeRim.position.set(0, 0.068, 0.116);
    thirdEyeRim.scale.set(0.68, 1.25, 0.5);
    headGroup.add(thirdEyeRim);

    const thirdEye = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.010, 1),
      new THREE.MeshBasicMaterial({ color: eyeCol.clone().lerp(new THREE.Color(0xffffff), 0.35) })
    );
    thirdEye.position.set(0, 0.068, 0.117);
    thirdEye.scale.set(0.65, 1.25, 0.45);
    headGroup.add(thirdEye);
  }

  // ── 5. 8 ORGANIC CATMULL-ROM 3D HAIRSTYLES (`hairStyle` + `hairColor`) ─────
  const hairGroup = new THREE.Group();
  const hs = av.hairStyle || 'locs';

  if (hs !== 'bald') {
    // Cranial Hair Cap tilted backward so hairline sits cleanly at top of forehead (y ≈ 0.095)
    const scalp = new THREE.Mesh(
      new THREE.SphereGeometry(0.120, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    scalp.position.set(0, 0.042, -0.018);
    scalp.rotation.x = -0.54;
    scalp.scale.set((isFem ? 0.92 : 0.99) * fMod.cheekW, 1.14, 1.05);
    hairGroup.add(scalp);
  }

  if (hs === 'locs') {
    // 22 S-Curved Sovereign Dreadlocks framing the temples, sides & back with 24K Gold Filigree Cuffs
    for (let i = 0; i < 22; i++) {
      const a = (i / 21) * Math.PI * 1.16 + Math.PI * 0.42;
      const sinA = Math.sin(a);
      const cosA = Math.cos(a);
      const lenDrop = 0.14 + (i % 3) * 0.025;
      const loc = makeCurvedStrand(
        [
          [sinA * 0.082, 0.128, cosA * 0.082 - 0.014],
          [sinA * 0.118, 0.068, cosA * 0.112 - 0.014],
          [sinA * 0.130, -0.015, cosA * 0.118 - 0.016],
          [sinA * 0.122, -lenDrop, cosA * 0.110 - 0.022],
        ],
        0.0135,
        hairMat,
        10
      );
      hairGroup.add(loc);

      if (i % 3 === 0) {
        const locCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.018, 14), trimMat);
        locCuff.position.set(sinA * 0.128, -0.025 - (i % 2) * 0.03, cosA * 0.115 - 0.016);
        hairGroup.add(locCuff);
      }
    }
    // Swept-Back Crown Dreadlocks from upper hairline
    for (let j = -3; j <= 3; j++) {
      const topLoc = makeCurvedStrand(
        [
          [j * 0.016, 0.136, 0.052],
          [j * 0.022, 0.164, -0.005],
          [j * 0.025, 0.138, -0.085],
        ],
        0.0145,
        hairMat,
        10
      );
      hairGroup.add(topLoc);
    }
  } else if (hs === 'fade') {
    // High-Density Sculpted Taper Crop with Clean Forehead Lineup
    for (let row = 0; row < 5; row++) {
      for (let col = -3; col <= 3; col++) {
        const xOff = col * 0.022 * (1 - row * 0.05);
        const zOff = 0.056 - row * 0.034;
        const yOff = 0.140 + Math.cos(col * 0.35) * 0.014 - row * 0.008;
        const curl = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 12), hairMat);
        curl.position.set(xOff, yOff, zOff);
        curl.scale.set(1.15, 0.82, 1.15);
        hairGroup.add(curl);
      }
    }
  } else if (hs === 'slick') {
    // Swept-Back Cyber Pompadour Strands
    for (let i = -4; i <= 4; i++) {
      const x = i * 0.019;
      const hLift = 0.164 - Math.abs(i) * 0.007;
      const strand = makeCurvedStrand(
        [
          [x * 0.85, 0.122, 0.074],
          [x, hLift, 0.032],
          [x * 1.04, hLift - 0.012, -0.045],
          [x * 0.92, 0.085, -0.112],
        ],
        0.016,
        hairMat,
        10
      );
      hairGroup.add(strand);
    }
  } else if (hs === 'long') {
    // Flowing S-Wave Shoulder-Length Locks framing behind the temples & cascading over shoulders
    [-1, 1].forEach((side) => {
      for (let k = 0; k < 8; k++) {
        const t = k / 7;
        const angle = (0.44 + t * 0.52) * Math.PI;
        const sx = side * Math.sin(angle) * 0.112;
        const sz = Math.cos(angle) * 0.106;
        const wave = makeCurvedStrand(
          [
            [sx * 0.72, 0.142, sz * 0.65],
            [sx * 1.06, 0.062, sz - 0.008],
            [sx * 1.16, -0.045, sz + 0.012],
            [sx * 1.05, -0.145, sz - 0.014],
            [sx * 1.15, -0.235, sz + 0.012],
          ],
          0.0185,
          hairMat,
          10
        );
        hairGroup.add(wave);
      }
      // Subtle swept side-part crown wave at the top hairline
      const crownWave = makeCurvedStrand(
        [
          [side * 0.015, 0.142, 0.062],
          [side * 0.068, 0.128, 0.048],
          [side * 0.112, 0.065, 0.005],
        ],
        0.016,
        hairMat,
        10
      );
      hairGroup.add(crownWave);
    });
  } else if (hs === 'buns') {
    // Twin Sculpted Cyber Space-Buns with Gold Orbital Rings & Temple Tendrils
    [-1, 1].forEach((side) => {
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.050, 24, 20), hairMat);
      bun.position.set(side * 0.095, 0.138, -0.018);
      hairGroup.add(bun);

      const bunRing = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.0055, 12, 28), trimMat);
      bunRing.position.set(side * 0.078, 0.124, -0.014);
      bunRing.rotation.y = side * 0.65;
      bunRing.rotation.x = 0.55;
      hairGroup.add(bunRing);

      const tendril = makeCurvedStrand(
        [
          [side * 0.092, 0.098, 0.048],
          [side * 0.112, 0.025, 0.045],
          [side * 0.104, -0.055, 0.038],
          [side * 0.112, -0.115, 0.028],
        ],
        0.009,
        hairMat,
        10
      );
      hairGroup.add(tendril);
    });
  } else if (hs === 'mohawk') {
    // Swept Braided Cyber Mohawk Crest
    for (let i = 0; i < 9; i++) {
      const a = -0.32 + i * 0.18;
      const rBase = 0.132;
      const rTip = 0.215 - Math.abs(i - 3) * 0.008;
      const crestLock = makeCurvedStrand(
        [
          [0, Math.cos(a) * rBase + 0.02, -Math.sin(a) * rBase],
          [0, Math.cos(a - 0.08) * ((rBase + rTip) * 0.5) + 0.025, -Math.sin(a - 0.08) * ((rBase + rTip) * 0.5)],
          [0, Math.cos(a - 0.18) * rTip + 0.025, -Math.sin(a - 0.18) * rTip],
        ],
        0.016,
        hairMat,
        10
      );
      hairGroup.add(crestLock);
    }
  } else if (hs === 'afro') {
    // Sculpted Volumetric Crown Afro Cluster
    const afroMain = new THREE.Mesh(new THREE.SphereGeometry(0.162, 36, 30), hairMat);
    afroMain.position.set(0, 0.086, -0.024);
    afroMain.scale.set(1.06, 0.96, 1.02);
    hairGroup.add(afroMain);

    for (let i = 0; i < 16; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 16) * 0.65;
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.148;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 14), hairMat);
      puff.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        0.086 + r * Math.cos(phi) * 0.9,
        -0.024 + r * Math.sin(phi) * Math.sin(theta)
      );
      hairGroup.add(puff);
    }
  }

  headGroup.add(hairGroup);
  group.add(headGroup);

  return group;
}

function applyAvatarToScene() {
  if (!root) return;
  const av = currentAvatar || DEFAULT_AVATAR;
  const accent = safeColor(av.accentColor, GOLD);

  // 1. Update Halo, Stardust, and Rim Lighting to match bot's Accent Color
  if (outerRing && outerRing.material) outerRing.material.color.copy(accent);
  if (innerRing && innerRing.material) {
    innerRing.material.color.copy(accent.clone().lerp(new THREE.Color(0xffffff), 0.35));
  }
  if (dustPoints && dustPoints.material) {
    dustPoints.material.color.copy(accent.clone().lerp(new THREE.Color(0xffffff), 0.25));
  }
  if (rimLight) rimLight.color.copy(accent);
  if (crownLight) crownLight.color.copy(accent.clone().lerp(new THREE.Color(0xffffff), 0.3));

  // 2. Rebuild / Toggle between Custom Modular 3D Rig vs Classic Zoth GLB
  if (customRig && customRig.parent === root) {
    root.remove(customRig);
  }
  customRig = buildCustomCharacterRig(av);
  root.add(customRig);

  const useClassic = av.chassis === 'zoth-prime';
  if (guy) {
    guy.visible = useClassic;
    // Apply body-type proportions even to Classic Zoth Scan
    const bScales = {
      balanced: [1.0, 1.0, 1.0],
      athletic: [1.08, 1.02, 1.06],
      slender: [0.90, 1.03, 0.92],
      titan: [1.18, 1.04, 1.14],
      compact: [0.95, 0.94, 0.95],
    }[av.bodyType] || [1, 1, 1];
    const baseS = guy.userData.baseScale || 1;
    guy.scale.set(baseS * bScales[0], baseS * bScales[1], baseS * bScales[2]);
  }
  if (customRig) {
    customRig.visible = !useClassic;
  }

  // 3. Sync 3D Mask Style (Azoth 24K GLB, Cyber Oni, Holo-Visor, Anubis, Kitsune, Crown, or None)
  syncActiveMaskMesh();
  frameCamera();
  markActive();
}

export function setAvatar(nextAvatar) {
  if (!nextAvatar || typeof nextAvatar !== 'object') return currentAvatar;
  currentAvatar = { ...DEFAULT_AVATAR, ...currentAvatar, ...nextAvatar };
  applyAvatarToScene();
  return { ...currentAvatar };
}

export function getAvatar() {
  return { ...currentAvatar };
}

export function setZoom(mode) {
  zoomMode = mode === 'face' ? 'face' : 'bust';
  frameCamera();
  markActive();
  return zoomMode;
}

export function getZoom() {
  return zoomMode;
}

export function resetTurn() {
  targetUserYaw = 0;
  markActive();
}

function frameCamera() {
  if (!camera) return;
  const target = (customRig && customRig.visible ? customRig : guy) || root;
  if (!target) return;
  const height = 1.6;
  const isFace = zoomMode === 'face';
  const lookY = isFace ? 1.20 : height * (compact ? 0.72 : 0.73);
  const dist = isFace ? 1.06 : height * (compact ? 0.96 : 1.02);
  camera.position.set(isFace ? 0.0 : 0.04, lookY + (isFace ? 0.01 : 0.03), dist);
  camera.up.copy(UP);
  camera.lookAt(0, lookY, 0);
  camera.near = Math.max(0.05, dist * 0.2);
  camera.far = dist * 8;
  camera.fov = isFace ? 21.5 : compact ? 29 : 26.5;
  camera.updateProjectionMatrix();
}

function resize() {
  if (!renderer || !canvas || !host) return;
  const w = Math.max(1, host.clientWidth);
  const h = Math.max(1, host.clientHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

let idleTimer = 0;
let lastActiveAt = performance.now();

function markActive() {
  lastActiveAt = performance.now();
  if (!raf && !idleTimer && !document.hidden) {
    raf = requestAnimationFrame(tick);
  }
}

function scheduleNextFrame() {
  if (raf || idleTimer) return;
  if (document.hidden || !host || host.clientHeight < 4) return;
  const maskSettled = Math.abs((maskWanted ? 1 : 0) - maskT) < 0.008;
  const yawSettled = Math.abs(targetUserYaw - userYaw) < 0.003;
  const pointerAlive = performance.now() - lastActiveAt < 2500;
  if (busy || draggingTurntable || pointerAlive || !maskSettled || !yawSettled) {
    raf = requestAnimationFrame(tick);
  } else {
    idleTimer = window.setTimeout(() => {
      idleTimer = 0;
      raf = requestAnimationFrame(tick);
    }, 68);
  }
}

function tick() {
  raf = 0;
  if (!renderer || !scene || !camera) return;
  if (document.hidden || !host || host.clientHeight < 4) return;
  const t = clock.getElapsedTime();

  smoothPointerX += (pointerX - smoothPointerX) * 0.08;
  smoothPointerY += (pointerY - smoothPointerY) * 0.08;
  userYaw += (targetUserYaw - userYaw) * 0.16;

  if (root && !reduced) {
    const baseYaw = busy ? Math.sin(t * 1.35) * 0.19 : Math.sin(t * 0.42) * 0.11;
    const baseBob = busy ? Math.sin(t * 2.4) * 0.009 : Math.sin(t * 1.1) * 0.005;
    root.rotation.y = userYaw + baseYaw + smoothPointerX * 0.24;
    root.rotation.x = smoothPointerY * 0.09;
    root.position.y = baseBob;
  } else if (root) {
    root.rotation.y = userYaw;
  }

  // Animate Custom 3D Eyes (cursor gaze tracking + natural blink every ~4.2s)
  if (customEyes.leftPupil && customEyes.rightPupil) {
    const gx = Math.max(-0.0045, Math.min(0.0045, smoothPointerX * 0.0045));
    const gy = Math.max(-0.0035, Math.min(0.0035, -smoothPointerY * 0.0035));
    customEyes.leftPupil.position.x = gx;
    customEyes.leftPupil.position.y = gy;
    customEyes.rightPupil.position.x = gx;
    customEyes.rightPupil.position.y = gy;
  }
  if (customEyes.leftLid && customEyes.rightLid && !reduced) {
    const blinkCycle = t % 4.2;
    const blink = blinkCycle > 4.02 ? Math.sin(((blinkCycle - 4.02) / 0.18) * Math.PI) : 0;
    const lidRot = -0.22 + blink * 0.65;
    customEyes.leftLid.rotation.x = lidRot;
    customEyes.rightLid.rotation.x = lidRot;
  }

  if (outerRing && innerRing && !reduced) {
    const speed = busy ? 2.6 : 0.55;
    outerRing.rotation.z = t * 0.28 * speed;
    innerRing.rotation.z = -t * 0.42 * speed;
    outerRing.material.opacity = busy ? 0.44 + Math.sin(t * 5) * 0.12 : 0.22;
    innerRing.material.opacity = busy ? 0.58 + Math.cos(t * 4) * 0.14 : 0.30;
  }

  if (dustPoints && !reduced) {
    dustPoints.rotation.y = t * (busy ? 0.35 : 0.08);
    dustPoints.position.y = Math.sin(t * 0.9) * 0.015;
    dustPoints.material.opacity = busy ? 0.85 : 0.52;
  }

  if (rimLight) rimLight.intensity = busy ? 1.85 + Math.sin(t * 6) * 0.45 : 1.25;
  if (crownLight) crownLight.intensity = busy ? 1.6 + Math.cos(t * 4.5) * 0.35 : 1.05;
  if (keyLight) keyLight.intensity = busy ? 1.75 : 1.4;
  if (hemi) hemi.intensity = busy ? 0.82 : 0.62;

  const hasMask = currentAvatar && currentAvatar.maskStyle !== 'none';
  const goal = maskWanted && hasMask ? 1 : 0;
  maskT += (goal - maskT) * (reduced ? 1 : 0.14);
  if (maskRoot) {
    const m = Math.max(0, Math.min(1, maskT));
    maskRoot.visible = hasMask && m > 0.02;
    maskRoot.position.set(
      MASK_ON.x,
      MASK_OFF.y + (MASK_ON.y - MASK_OFF.y) * m,
      MASK_OFF.z + (MASK_ON.z - MASK_OFF.z) * m
    );
    maskRoot.rotation.x = MASK_OFF.rx + (MASK_ON.rx - MASK_OFF.rx) * m;
    const s = MASK_OFF.s + (MASK_ON.s - MASK_OFF.s) * m;
    maskRoot.scale.setScalar(s);
  }
  renderer.render(scene, camera);
  scheduleNextFrame();
}

function failOver(err) {
  const msg = err && (err.message || String(err));
  console.error('zoth-stage fail', msg);
  const img = document.getElementById('stageFallback');
  if (img) img.hidden = false;
  if (canvas) canvas.hidden = true;
  document.getElementById('stageHost')?.classList.add('fallback');
}

function polishMat(mat) {
  if (!mat) return;
  mat.side = THREE.DoubleSide;
  if ('roughness' in mat && mat.roughness > 0.8) mat.roughness = 0.62;
  if ('metalness' in mat) mat.metalness = Math.min(0.34, Math.max(0.14, mat.metalness || 0.16));
  mat.needsUpdate = true;
}

function mountModel(gltf) {
  guy = gltf.scene;
  guy.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(guy);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  guy.position.x -= center.x;
  guy.position.z -= center.z;
  guy.position.y -= box.min.y;
  const tall = Math.max(size.y, 0.01);
  const baseScale = 1.6 / tall;
  guy.userData.baseScale = baseScale;
  guy.scale.setScalar(baseScale);
  guy.quaternion.setFromUnitVectors(ASSET_FRONT, PARENT_FORWARD);
  guy.traverse((n) => {
    if (!n.isMesh) return;
    n.castShadow = false;
    n.receiveShadow = false;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    mats.forEach(polishMat);
  });
  root.add(guy);
}

function mountMask(gltf) {
  const mesh = gltf.scene;
  mesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  mesh.position.x -= center.x;
  mesh.position.y -= center.y;
  mesh.position.z -= center.z;
  const wide = Math.max(size.x, 0.01);
  mesh.scale.setScalar(1 / wide);
  mesh.quaternion.setFromUnitVectors(ASSET_FRONT, PARENT_FORWARD);
  mesh.traverse((n) => {
    if (!n.isMesh) return;
    const mats = Array.isArray(n.material) ? n.material : [n.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.side = THREE.DoubleSide;
      if ('metalness' in mat) mat.metalness = Math.max(0.76, mat.metalness || 0.8);
      if ('roughness' in mat) mat.roughness = Math.min(0.26, mat.roughness || 0.22);
      if ('emissive' in mat && mat.emissive) {
        mat.emissive.setHex(0x2a1f06);
        mat.emissiveIntensity = 0.22;
      }
      mat.needsUpdate = true;
    });
  });
  azothMaskMesh = mesh;
  if (!maskRoot) {
    maskRoot = new THREE.Group();
    root.add(maskRoot);
  }
  maskRoot.add(azothMaskMesh);
  maskT = maskWanted ? 1 : 0;
}

export function setBusy(on) {
  busy = Boolean(on);
  markActive();
}

export function setMask(on) {
  maskWanted = Boolean(on);
  markActive();
}

export function setMaskPose(pose) {
  if (!pose || typeof pose !== 'object') return MASK_ON;
  if (Number.isFinite(pose.y)) MASK_ON.y = pose.y;
  if (Number.isFinite(pose.z)) MASK_ON.z = pose.z;
  if (Number.isFinite(pose.x)) MASK_ON.x = pose.x;
  if (Number.isFinite(pose.rx)) MASK_ON.rx = pose.rx;
  if (Number.isFinite(pose.s)) MASK_ON.s = pose.s;
  maskT = maskWanted ? 1 : maskT;
  markActive();
  return { ...MASK_ON };
}

function boxOf(obj) {
  if (!obj) return null;
  const b = new THREE.Box3().setFromObject(obj);
  const s = b.getSize(new THREE.Vector3());
  const c = b.getCenter(new THREE.Vector3());
  return {
    min: b.min.toArray().map((n) => +n.toFixed(3)),
    max: b.max.toArray().map((n) => +n.toFixed(3)),
    size: s.toArray().map((n) => +n.toFixed(3)),
    center: c.toArray().map((n) => +n.toFixed(3)),
  };
}

export function debugStage() {
  return {
    maskWanted,
    maskT: +maskT.toFixed(3),
    avatar: { ...currentAvatar },
    MASK_ON: { ...MASK_ON },
    MASK_OFF: { ...MASK_OFF },
    maskRoot: maskRoot
      ? {
          pos: maskRoot.position.toArray().map((n) => +n.toFixed(3)),
          rotX: +maskRoot.rotation.x.toFixed(3),
          scale: +maskRoot.scale.x.toFixed(3),
        }
      : null,
    guy: boxOf(guy),
    customRig: boxOf(customRig),
    mask: boxOf(maskRoot),
    root: boxOf(root),
    camera: camera ? { pos: camera.position.toArray().map((n) => +n.toFixed(3)) } : null,
  };
}

export function setMode(nextCompact) {
  compact = Boolean(nextCompact);
  frameCamera();
  resize();
  markActive();
}

export function resizeStage() {
  resize();
  frameCamera();
  markActive();
}

async function init() {
  host = document.getElementById('stageHost');
  canvas = document.getElementById('stage');
  if (!host || !canvas) return;
  compact = document.getElementById('root')?.classList.contains('mode-compact') !== false;
  busy = document.getElementById('root')?.classList.contains('busy') === true;
  reduced = prefersReduced();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) markActive();
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      pointerX = (e.clientX / w - 0.5) * 2;
      pointerY = (e.clientY / h - 0.5) * 2;
      if (draggingTurntable) {
        const dx = e.clientX - dragStartX;
        targetUserYaw = dragStartYaw + dx * 0.015;
      }
      markActive();
    },
    { passive: true }
  );
  window.addEventListener(
    'pointerup',
    () => {
      draggingTurntable = false;
    },
    { passive: true }
  );
  window.addEventListener(
    'pointerleave',
    () => {
      pointerX = 0;
      pointerY = 0;
      draggingTurntable = false;
    },
    { passive: true }
  );

  canvas.addEventListener('pointerdown', (e) => {
    draggingTurntable = true;
    dragStartX = e.clientX;
    dragStartYaw = targetUserYaw;
    markActive();
  });
  canvas.addEventListener('dblclick', () => {
    targetUserYaw = 0;
    markActive();
  });

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      powerPreference: 'low-power',
    });
  } catch (err) {
    failOver(err);
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.42;

  scene = new THREE.Scene();
  const studioEnv = createStudioEnvironment(renderer);
  if (studioEnv) scene.environment = studioEnv;
  camera = new THREE.PerspectiveCamera(27, 1, 0.05, 20);
  root = new THREE.Group();
  scene.add(root);

  maskRoot = new THREE.Group();
  root.add(maskRoot);

  haloGroup = createAstrolabeHalo();
  scene.add(haloGroup);

  dustPoints = createStarDust();
  scene.add(dustPoints);

  scene.add(new THREE.AmbientLight(0xd4af37, 0.42));
  hemi = new THREE.HemisphereLight(0xffe9b0, 0x090d16, 0.95);
  scene.add(hemi);
  keyLight = new THREE.DirectionalLight(0xfff5d6, 2.15);
  keyLight.position.set(0.42, 1.95, 2.4);
  scene.add(keyLight);
  const fill = new THREE.DirectionalLight(CYAN_RIM, 0.82);
  fill.position.set(-1.5, 1.15, 1.5);
  scene.add(fill);
  const face = new THREE.DirectionalLight(0xfff4dc, 1.25);
  face.position.set(0.08, 1.38, 3.1);
  scene.add(face);
  rimLight = new THREE.DirectionalLight(GOLD, 1.55);
  rimLight.position.set(-0.45, 1.55, -1.8);
  scene.add(rimLight);
  crownLight = new THREE.PointLight(GOLD_BRIGHT, 1.1, 2.5);
  crownLight.position.set(0, 1.58, 0.45);
  scene.add(crownLight);

  clock = new THREE.Clock();
  resize();

  const ro = new ResizeObserver(() => {
    resize();
    markActive();
  });
  ro.observe(host);

  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(GLB);
    mountModel(gltf);
    try {
      const maskGltf = await loader.loadAsync(MASK_GLB);
      mountMask(maskGltf);
    } catch (maskErr) {
      console.error('zoth-stage mask', maskErr && maskErr.message);
    }
    applyAvatarToScene();
  } catch (err) {
    failOver(err);
    return;
  }

  window.ZothStage = {
    setBusy,
    setMode,
    setMask,
    setMaskPose,
    setAvatar,
    getAvatar,
    setZoom,
    getZoom,
    resetTurn,
    debug: debugStage,
    resize: resizeStage,
  };
  window.dispatchEvent(new Event('zoth-stage-ready'));
  tick();
}

init();
