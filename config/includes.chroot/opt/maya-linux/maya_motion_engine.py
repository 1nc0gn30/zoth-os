#!/usr/bin/env python3
"""
Maya for Linux — 60 FPS Procedural Motion Edit Engine (Zoth & 1nc0gn30 Edition)
================================================================================
Generates 100% procedural 60fps MP4 motion edits with ZERO still images:
  - Continuous NumPy procedural background shaders (plasma, aurora, tunnel, ember)
  - Full 3D perspective wireframe & solid-ribbon projections per frame:
      * 3D Merkaba + gimbal torus rings ('zoth-sovereign-core')
      * 3D 80-node Fibonacci constellation ('zoth-80-tool-arsenal')
      * 3D rotating firewall shields + hexagonal perimeter ('1nc0gn30-cyber-fortress')
      * 3D multi-agent double helix + animated packet arcs ('pantheon-hermes-swarm')
      * 3D spinning beveled sovereign medallion + specular sweep ('vaelor-l1-gold-forge')
      * 3D infinite perspective avenue flight to Null Core ('world-of-zoth-citadel')
  - Animated Maya Browser/Terminal device card with spline cursor + click ripples
  - Real-time procedural 2x4 sub-pixel Braille streams & kinetic Typewriter overlays
  - Azure Neural HD character voices (edge_tts via voice_engine) + -14 LUFS mastering

Can be invoked standalone or via `maya --render <preset|all> [--out <dir>]`.
"""

import argparse
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

VOICE_SCRIPTS_DIR = os.environ.get("MAYA_VOICE_SCRIPTS_DIR", "").strip()
if VOICE_SCRIPTS_DIR and os.path.isdir(VOICE_SCRIPTS_DIR) and VOICE_SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, VOICE_SCRIPTS_DIR)

try:
    if not VOICE_SCRIPTS_DIR:
        raise ImportError("Using self-contained Maya fallback engine")
    from voice_engine import (
        BOLD,
        MONO,
        SR,
        clean_glyph_text,
        fit_font,
        font,
        precompute_caption_layout,
        draw_karaoke_captions_fast,
        draw_mic_icon,
        synthesize_character_line,
        build_background_music,
        save_wav,
        smooth,
    )
    HAS_VOICE_ENGINE = True
except Exception:
    HAS_VOICE_ENGINE = False
    SR = 44100

    def _find_system_font(candidates):
        for candidate in candidates:
            if os.path.isfile(candidate):
                return candidate
        return ""

    BOLD = _find_system_font([
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ])
    MONO = _find_system_font([
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeMonoBold.ttf",
        BOLD,
    ])
    _FONT_CACHE = {}

    def clean_glyph_text(text: str) -> str:
        replacements = {
            "\u2014": "-",
            "\u2013": "-",
            "\u2018": "'",
            "\u2019": "'",
            "\u201c": '"',
            "\u201d": '"',
            "\u2026": "...",
            "\u2022": "·",
        }
        out = str(text or "")
        for src, dst in replacements.items():
            out = out.replace(src, dst)
        return out

    def font(font_path: str, size: int):
        sz = max(8, int(size))
        key = (font_path or "", sz)
        if key in _FONT_CACHE:
            return _FONT_CACHE[key]
        resolved = font_path if (font_path and os.path.isfile(font_path)) else BOLD
        try:
            fnt = ImageFont.truetype(resolved, sz) if resolved else ImageFont.load_default()
        except Exception:
            fnt = ImageFont.load_default()
        _FONT_CACHE[key] = fnt
        return fnt

    def fit_font(draw, text: str, font_path: str, max_size: int, min_size: int, max_width: int):
        cleaned = clean_glyph_text(text)
        for sz in range(int(max_size), int(min_size) - 1, -1):
            fnt = font(font_path, sz)
            if draw.textlength(cleaned, font=fnt) <= max_width:
                return fnt
        return font(font_path, int(min_size))

    def precompute_caption_layout(draw, text: str, fnt, max_width: int, max_lines_per_page: int = 2):
        words = clean_glyph_text(text).split()
        if not words:
            return {"pages": [], "total_words": 0}
        lines = []
        current_words = []
        word_idx = 0
        for w in words:
            trial = " ".join([cw[0] for cw in current_words] + [w])
            if current_words and draw.textlength(trial, font=fnt) > max_width:
                lines.append(current_words)
                current_words = [(w, word_idx)]
            else:
                current_words.append((w, word_idx))
            word_idx += 1
        if current_words:
            lines.append(current_words)

        per_page = max(1, int(max_lines_per_page))
        pages = [lines[i:i + per_page] for i in range(0, len(lines), per_page)]
        return {"pages": pages, "total_words": len(words)}

    def draw_karaoke_captions_fast(
        d,
        layout,
        speech_progress: float,
        box_x0: int,
        box_y0: int,
        box_w: int,
        box_h: int,
        fnt,
        accent_col,
        center_align: bool = False,
    ):
        pages = layout.get("pages", []) if isinstance(layout, dict) else []
        total_words = layout.get("total_words", 0) if isinstance(layout, dict) else 0
        if not pages or total_words <= 0:
            return
        prog = max(0.0, min(1.0, float(speech_progress)))
        active_word_idx = min(total_words - 1, int(prog * total_words))
        active_page = pages[-1]
        for page in pages:
            page_indices = [idx for line in page for _, idx in line]
            if page_indices and page_indices[0] <= active_word_idx <= page_indices[-1]:
                active_page = page
                break

        line_count = len(active_page)
        line_h = max(24, min(36, box_h // max(1, line_count)))
        start_y = box_y0 + max(0, (box_h - line_count * line_h) // 2)
        space_w = d.textlength(" ", font=fnt)

        for li, line in enumerate(active_page):
            full_line = " ".join(w for w, _ in line)
            lw = d.textlength(full_line, font=fnt)
            cx = box_x0 + ((box_w - lw) / 2.0 if center_align else 0.0)
            cy = start_y + li * line_h
            for word, idx in line:
                if idx == active_word_idx:
                    fill = accent_col
                elif idx < active_word_idx:
                    fill = (248, 250, 252)
                else:
                    fill = (160, 174, 196)
                d.text((cx, cy), word, font=fnt, fill=fill)
                cx += d.textlength(word, font=fnt) + space_w

    def draw_mic_icon(d, cx: int, cy: int, col, scale: float = 1.0):
        r = max(4, int(6 * scale))
        h = max(8, int(12 * scale))
        d.rounded_rectangle([cx - r, cy - h, cx + r, cy + int(2 * scale)], radius=r, fill=col)
        arc_r = max(6, int(9 * scale))
        d.arc([cx - arc_r, cy - int(4 * scale), cx + arc_r, cy + arc_r], start=0, end=180, fill=col, width=max(1, int(2 * scale)))
        d.line([(cx, cy + arc_r), (cx, cy + arc_r + int(4 * scale))], fill=col, width=max(1, int(2 * scale)))
        d.line([(cx - int(5 * scale), cy + arc_r + int(4 * scale)), (cx + int(5 * scale), cy + arc_r + int(4 * scale))], fill=col, width=max(1, int(2 * scale)))

    def build_background_music(duration_sec: float, root: float = 138.59, seed: int = 0, bpm: int = 138, funky: bool = True) -> np.ndarray:
        n = max(1, int(float(duration_sec) * SR))
        t = np.arange(n, dtype=np.float32) / float(SR)
        beat_hz = max(1.0, float(bpm)) / 60.0
        beat_phase = (t * beat_hz) % 1.0
        step_idx = ((t * beat_hz * 2.0).astype(np.int32) + int(seed)) % 4
        scale_mult = np.array([1.0, 1.1892, 1.4983, 1.7818], dtype=np.float32)
        arp_freq = float(root) * scale_mult[step_idx]
        pad = 0.18 * np.sin(2.0 * math.pi * float(root) * t) + 0.10 * np.sin(2.0 * math.pi * float(root) * 1.5 * t)
        arp_env = np.exp(-beat_phase * 5.0).astype(np.float32)
        arp = 0.14 * np.sin(2.0 * math.pi * arp_freq * t) * arp_env
        kick_env = np.exp(-beat_phase * 14.0).astype(np.float32)
        kick = 0.22 * np.sin(2.0 * math.pi * (55.0 + 95.0 * kick_env) * beat_phase / beat_hz) * kick_env
        mix = pad + arp + (kick if funky else 0.5 * kick)
        peak = float(np.max(np.abs(mix))) if n > 0 else 1.0
        if peak > 1e-6:
            mix = (mix / peak) * 0.35
        return mix.astype(np.float32)

    def save_wav(wav_path: str, samples: np.ndarray, sr: int = SR):
        parent = os.path.dirname(wav_path)
        if parent:
            os.makedirs(parent, exist_ok=True)
        clipped = np.clip(np.asarray(samples, dtype=np.float32), -1.0, 1.0)
        pcm = (clipped * 32767.0).astype(np.int16)
        with wave.open(wav_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(int(sr))
            wf.writeframes(pcm.tobytes())

    def smooth(x: float) -> float:
        u = max(0.0, min(1.0, float(x)))
        return u * u * (3.0 - 2.0 * u)


_XDG_VIDEOS = os.environ.get("XDG_VIDEOS_DIR", os.path.join(os.path.expanduser("~"), "Videos"))
DEFAULT_OUT_DIR = os.path.join(_XDG_VIDEOS, "maya-zoth-edits")

GOLD = (251, 191, 36)
CYAN = (0, 240, 255)
GREEN = (16, 185, 129)
PINK = (236, 72, 153)
PURPLE = (168, 85, 247)
ORANGE = (249, 115, 22)
RED = (244, 63, 94)
WHITE = (248, 250, 252)


PRESETS = {
    "zoth-sovereign-core": {
        "alias": ["zoth-core"],
        "filename": "1nc0gn30_MAYA-SOVEREIGN-CORE-60FPS.mp4",
        "title": "ZOTHOS v3.4 // SOVEREIGN CORE",
        "aspect": "16:9",
        "W": 1280,
        "H": 720,
        "fps": 60,
        "bpm": 138,
        "root_hz": 138.59,
        "scene_mode": "merkaba",
        "accent": GOLD,
        "secondary": CYAN,
        "window_title": "1nc0gn30@zothos:~$ sovereign-core --verify",
        "scenes": [
            (
                "onyx",
                "SOVEREIGN DESKTOP ARCHITECTURE",
                "ZothOS v3.4 + Maya Pro Engine 2.0 · Zero Still Frames",
                GOLD,
                "Welcome inside the ZothOS sovereign core, engineered by incognito with sixty frames per second of pure procedural motion.",
            ),
            (
                "athena",
                "3D MERKABA & TIMELINE CHOREOGRAPHY",
                "Alchemical Gold Shader · Spline Cursor · Telemetry HUD",
                CYAN,
                "Every transition, perspective ring, and laser cursor path computes live on CPU and GPU shaders with zero static templates.",
            ),
            (
                "ghostbyte",
                "LOCAL-FIRST ZERO LEAK PERIMETER",
                "Open-Access Linux Tooling · Offline Vault · Instant Export",
                GREEN,
                "No telemetry trackers, no paywalls, and native sixty FPS video mastering built right into Maya for Linux.",
            ),
        ],
    },
    "zoth-80-tool-arsenal": {
        "alias": ["arsenal-80"],
        "filename": "1nc0gn30_MAYA-80-TOOL-ARSENAL-60FPS.mp4",
        "title": "ZOTH STUDIO v2 // 80 SOVEREIGN TOOLS",
        "aspect": "16:9",
        "W": 1280,
        "H": 720,
        "fps": 60,
        "bpm": 134,
        "root_hz": 146.83,
        "scene_mode": "sphere80",
        "accent": CYAN,
        "secondary": GREEN,
        "window_title": "https://zoth.nullai.tech/tools — 80/80 Unlocked",
        "scenes": [
            (
                "kitsune",
                "EIGHTY SOVEREIGN TOOLS UNLOCKED",
                "56 In-Browser Workstations + 24 ZothOS Native CLIs",
                CYAN,
                "Zoth Studio version two packs eighty real working utilities covering AI bridges, SEO graphs, cryptography, and motion video.",
            ),
            (
                "mercury",
                "ZERO PAYWALLS. ZERO FAKE TIMERS.",
                "Real Client-Side AST, Crypto, & Live Node Services",
                GREEN,
                "Forget blurred paywalls and fake spinners. Every tool runs natively in your browser and synchronizes straight to the ZothOS CLI.",
            ),
            (
                "onyx",
                "ALL 80 NODES VERIFIED GREEN",
                "Automated Browser Verification · Neal Frazier Tech (@1nc0gn30)",
                GOLD,
                "Explore the full open-access arsenal anytime at zoth dot nullai dot tech, engineered by incognito.",
            ),
        ],
    },
    "1nc0gn30-cyber-fortress": {
        "alias": ["1nc0gn30-ops"],
        "filename": "1nc0gn30_CYBER-FORTRESS-ZERO-LEAK-VERTICAL.mp4",
        "title": "1NC0GN30 // ZERO-LEAK CYBER FORTRESS",
        "aspect": "9:16",
        "W": 720,
        "H": 1280,
        "fps": 60,
        "bpm": 144,
        "root_hz": 130.81,
        "scene_mode": "fortress",
        "accent": PINK,
        "secondary": CYAN,
        "window_title": "sentinel-firewall --strict --zero-leak",
        "scenes": [
            (
                "athena",
                "HARDENED LOCAL PERIMETER",
                "UFW Interface Locking · Zero Exposed WAN Ports",
                CYAN,
                "Every workstation socket locks strictly to private tunnel and loopback interfaces before a single packet moves.",
            ),
            (
                "kai",
                "AUTOMATED SECRET & PII SCRUBBER",
                "Repository Guardrails · EnvGuard Vault · Clean Diffs",
                PINK,
                "Automated leak scanners strip sensitive tokens, private addresses, and internal host metadata across every commit.",
            ),
            (
                "vigil",
                "1NC0GN30 SOVEREIGN OPSEC",
                "Privacy First · Open Source Defense · Always Verified",
                GOLD,
                "Build faster without leaking your footprint. Zero still images, pure cryptographic motion.",
            ),
        ],
    },
    "pantheon-hermes-swarm": {
        "alias": ["pantheon"],
        "filename": "1nc0gn30_PANTHEON-HERMES-SWARM-VERTICAL.mp4",
        "title": "PANTHEON & HERMES // SWARM BUS",
        "aspect": "9:16",
        "W": 720,
        "H": 1280,
        "fps": 60,
        "bpm": 140,
        "root_hz": 164.81,
        "scene_mode": "swarm",
        "accent": GREEN,
        "secondary": PURPLE,
        "window_title": "sovereign-agent-bridge --mesh live",
        "scenes": [
            (
                "ghostbyte",
                "LIVE MULTI-AGENT SIGNAL BRIDGE",
                "Hermes · Pantheon · Antigravity · Parallel Workers",
                GREEN,
                "Watch multiple AI specialists coordinate in parallel across a local signal bus without overwriting each other.",
            ),
            (
                "kitsune",
                "DOUBLE-HELIX TASK DISPATCH",
                "Scoped Worktrees · Live Verification · Zero Collisions",
                PURPLE,
                "Each worker owns its isolated slice, verifies builds and tests automatically, and posts structured handoffs back to the swarm.",
            ),
            (
                "onyx",
                "ENGINEERED BY @1NC0GN30",
                "NullAI Platform · Autonomous Engineering Motion",
                CYAN,
                "From agent orchestration to sixty FPS motion rendering, the entire stack runs sovereign on Linux.",
            ),
        ],
    },
    "vaelor-l1-gold-forge": {
        "alias": ["vaelor-l1"],
        "filename": "1nc0gn30_VAELOR-L1-GOLD-FORGE-60FPS.mp4",
        "title": "VAELOR L1 // SOVEREIGN GOLD FORGE",
        "aspect": "16:9",
        "W": 1280,
        "H": 720,
        "fps": 60,
        "bpm": 126,
        "root_hz": 110.0,
        "scene_mode": "medallion",
        "accent": GOLD,
        "secondary": PURPLE,
        "window_title": "vaelor-l1-forge --mint-medallion --60fps",
        "scenes": [
            (
                "onyx",
                "VAELOR LAYER-ONE ARCHITECTURE",
                "3D Procedural Sovereign Medallion · Live Hash Stream",
                GOLD,
                "Forged in pure math and kinetic light, Vaelor L1 pairs deterministic ledger finality with crisp 3D sovereign visuals.",
            ),
            (
                "chronos",
                "REAL-TIME SPECULAR RELIEF SHADER",
                "Continuous 60 FPS Rotation · Orbital Precision Ticks",
                ORANGE,
                "Notice the specular glints sweeping across every beveled edge as all one hundred and eighty rotational ticks stay locked.",
            ),
            (
                "pixel-shiba",
                "MINTED WITH MAYA STUDIO PRO",
                "Zero Static Assets · Broadcast -14 LUFS Soundtrack",
                PURPLE,
                "One hundred percent procedural geometry, sound synthesis, and karaoke typography, forged cleanly at sixty frames per second.",
            ),
        ],
    },
    "world-of-zoth-citadel": {
        "alias": ["citadel"],
        "filename": "1nc0gn30_WORLD-OF-ZOTH-CITADEL-RUN-VERTICAL.mp4",
        "title": "WORLD OF ZOTH // 3D CITADEL FLIGHT",
        "aspect": "9:16",
        "W": 720,
        "H": 1280,
        "fps": 60,
        "bpm": 148,
        "root_hz": 146.83,
        "scene_mode": "citadel",
        "accent": GOLD,
        "secondary": ORANGE,
        "window_title": "world-of-zoth --citadel-run --60fps",
        "scenes": [
            (
                "mercury",
                "AVENUE FLIGHT TO NULL CORE",
                "Infinite 3D Extruded Skylines · Sixty FPS Flight",
                GOLD,
                "Speed down the neon gold avenue of the Zoth Citadel as towering wireframe spires rush past at sixty frames per second.",
            ),
            (
                "ignis",
                "ORBITAL BOSS TELEMETRY LOCKED",
                "Gyro Torus Rings · Dynamic Tracking Cursor",
                ORANGE,
                "Target locks snap onto the spinning Null Core monument while energy waves pulse across the reflective avenue grid.",
            ),
            (
                "onyx",
                "ENTER THE CITADEL AT 1NC0GN30",
                "Procedural 3D Worlds · Zero Pre-Baked Stills",
                CYAN,
                "No pre-rendered slide shows. Pure procedural 3D cinema forged by incognito and Zoth Studio.",
            ),
        ],
    },
}


class MotionShaderContext:
    """Precomputed normalized coordinate grid for ultra-fast procedural 60fps backgrounds."""

    def __init__(self, W: int, H: int):
        self.W = W
        self.H = H
        # Compute plasma shader at 1/4 scale (e.g., 320x180) and upscale BILINEAR cleanly
        self.sw = max(160, W // 4)
        self.sh = max(160, H // 4)
        xs = np.linspace(-1.0, 1.0, self.sw, dtype=np.float32)
        ys = np.linspace(-1.0, 1.0, self.sh, dtype=np.float32)
        self.gx, self.gy = np.meshgrid(xs, ys)
        self.r = np.sqrt(self.gx * self.gx + self.gy * self.gy)
        self.theta = np.arctan2(self.gy, self.gx)

    def render_bg(self, t: float, mode: str, accent: tuple, secondary: tuple, energy: float) -> Image.Image:
        gx, gy, r, th = self.gx, self.gy, self.r, self.theta
        pulse = 0.08 * energy

        if mode in ("fortress", "citadel"):
            # Deep radial tunnel / speed-warp wave
            tunnel = 0.5 + 0.5 * np.sin(9.0 / (r + 0.18) - t * 4.2 + np.cos(th * 4.0 + t))
            horizon = np.clip((gy + 0.15) * 1.4, 0.0, 1.0)
            v1 = np.clip(tunnel * 0.45 + pulse, 0.0, 1.0)
            v2 = np.clip((1.0 - horizon) * (0.35 + 0.35 * np.sin(gx * 3.0 + t * 1.3)), 0.0, 1.0)
        elif mode in ("sphere80", "swarm"):
            # Aurora wave curtains
            wave1 = 0.5 + 0.5 * np.sin(gx * 3.2 + np.sin(gy * 2.4 + t * 1.1) + t * 1.4)
            wave2 = 0.5 + 0.5 * np.cos(gy * 3.6 - gx * 1.8 - t * 1.0)
            v1 = np.clip((wave1 * wave2) * (0.65 + pulse), 0.0, 1.0)
            v2 = np.clip((1.0 - r * 0.65) * 0.45, 0.0, 1.0)
        else:
            # Obsidian + Molten Gold/Cyan Plasma
            orb1 = np.exp(-((gx - 0.36 * np.sin(t * 0.8)) ** 2 + (gy + 0.18 * np.cos(t * 0.65)) ** 2) * 3.2)
            orb2 = np.exp(-((gx + 0.38 * np.cos(t * 0.7)) ** 2 + (gy - 0.22 * np.sin(t * 0.85)) ** 2) * 3.8)
            v1 = np.clip(orb1 * (0.6 + pulse), 0.0, 1.0)
            v2 = np.clip(orb2 * (0.55 + pulse), 0.0, 1.0)

        ar, ag, ab = accent[0] / 255.0, accent[1] / 255.0, accent[2] / 255.0
        sr_, sg_, sb_ = secondary[0] / 255.0, secondary[1] / 255.0, secondary[2] / 255.0

        vignette = np.clip(1.08 - r * 0.42, 0.22, 1.0)
        rr = (0.025 + 0.26 * v1 * ar + 0.22 * v2 * sr_) * vignette
        gg = (0.032 + 0.26 * v1 * ag + 0.22 * v2 * sg_) * vignette
        bb = (0.055 + 0.26 * v1 * ab + 0.22 * v2 * sb_) * vignette

        rgb = np.stack([rr, gg, bb], axis=-1)
        arr = np.clip(rgb * 255.0, 0, 255).astype(np.uint8)
        small = Image.fromarray(arr, mode="RGB")
        return small.resize((self.W, self.H), Image.BILINEAR)


def rot3d(x: float, y: float, z: float, rx: float, ry: float, rz: float):
    cy, sy = math.cos(ry), math.sin(ry)
    x1 = x * cy - z * sy
    z1 = x * sy + z * cy

    cx, sx = math.cos(rx), math.sin(rx)
    y2 = y * cx - z1 * sx
    z2 = y * sx + z1 * cx

    cz, sz = math.cos(rz), math.sin(rz)
    return (x1 * cz - y2 * sz, x1 * sz + y2 * cz, z2)


def proj3d(x: float, y: float, z: float, cx: float, cy: float, fov: float, dist: float):
    zz = max(0.35, z + dist)
    sc = fov / zz
    return (cx + x * sc, cy + y * sc, zz)


def draw_perspective_floor(d: ImageDraw.ImageDraw, vx0: int, vx1: int, vy: int, horizon_y: int, t: float, col: tuple):
    """Animated infinite floor grid scrolling cleanly inside viewport bounds."""
    scroll = (t * 2.4) % 1.0
    line_col = (*col, 72)
    vw = vx1 - vx0
    cx = (vx0 + vx1) // 2
    for i in range(1, 14):
        depth = (i - scroll) / 13.0
        y = int(horizon_y + (depth * depth) * (vy - horizon_y))
        if horizon_y <= y <= vy:
            d.line([(vx0 + 6, y), (vx1 - 6, y)], fill=line_col, width=1)
    for ray in range(-10, 11):
        top_x = cx + ray * 18
        bot_x = max(vx0 + 6, min(vx1 - 6, cx + int(ray * (vw * 0.14))))
        d.line([(top_x, horizon_y), (bot_x, vy)], fill=line_col, width=1)


def draw_braille_matrix(d: ImageDraw.ImageDraw, W: int, H: int, t: float, cols: int, accent: tuple, secondary: tuple):
    """Procedural 2x4 dot-matrix Unicode Braille columns (zero font glyph dependency)."""
    step_x = W // cols
    for c in range(cols):
        speed = 110 + (c % 5) * 38
        y_head = int((t * speed + c * 97) % (H + 180)) - 90
        px = c * step_x + step_x // 2 - 4
        col = secondary if (c % 2 == 0) else accent
        for row_idx in range(4):
            cy = y_head - row_idx * 22
            if cy < 64 or cy > H - 64:
                continue
            alpha = max(25, 110 - row_idx * 25)
            seed_bits = (int(t * 9) + c * 7 + row_idx * 13) & 0xFF
            for br in range(4):
                for bc in range(2):
                    if (seed_bits >> (br * 2 + bc)) & 1:
                        bx = px + bc * 4
                        by = cy + br * 4
                        d.rectangle([bx, by, bx + 2, by + 2], fill=(*col, alpha))


def draw_maya_cursor_and_ripples(
    d: ImageDraw.ImageDraw,
    vx0: int,
    vy0: int,
    vw: int,
    vh: int,
    t: float,
    accent: tuple,
    secondary: tuple,
):
    """Animated Screen-Studio-style spline cursor + beat click ripples."""
    phase = t % 2.4
    u = phase / 2.4
    nx = 0.50 + 0.24 * math.sin(t * 1.45) + 0.08 * math.cos(t * 2.9)
    ny = 0.48 + 0.16 * math.cos(t * 1.15) - 0.06 * math.sin(t * 2.3)
    cx = int(vx0 + nx * vw)
    cy = int(vy0 + ny * vh)

    # Expanding click ripple near phase peaks
    if u < 0.35:
        rp = u / 0.35
        rad = int(10 + 48 * rp)
        alp = int(210 * (1.0 - rp))
        d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=(*secondary, alp), width=3)
        rad2 = int(6 + 26 * rp)
        d.ellipse([cx - rad2, cy - rad2, cx + rad2, cy + rad2], outline=(*accent, alp), width=2)

    # Clean vector macOS-style pointer + neon aura
    pts = [
        (cx, cy),
        (cx, cy + 24),
        (cx + 6, cy + 19),
        (cx + 12, cy + 28),
        (cx + 16, cy + 26),
        (cx + 10, cy + 17),
        (cx + 18, cy + 16),
    ]
    d.polygon([(px + 2, py + 2) for px, py in pts], fill=(0, 0, 0, 170))
    d.polygon(pts, fill=(255, 255, 255, 248), outline=accent)


def draw_scene_3d_geometry(
    d: ImageDraw.ImageDraw,
    mode: str,
    vx0: int,
    vy0: int,
    vx1: int,
    vy1: int,
    t: float,
    accent: tuple,
    secondary: tuple,
    energy: float,
):
    """Render full-motion 3D perspective geometry inside the Maya viewport bounds."""
    vw = vx1 - vx0
    vh = vy1 - vy0
    cx = (vx0 + vx1) // 2
    cy = vy0 + int(vh * 0.48)
    fov = min(vw, vh) * 0.92

    if mode == "merkaba":
        draw_perspective_floor(d, vx0=vx0, vx1=vx1, vy=vy1 - 12, horizon_y=vy0 + int(vh * 0.62), t=t, col=secondary)
        # 3 orbital gimbal rings
        for ri, rad in enumerate([1.65, 1.32, 0.98]):
            col = accent if ri % 2 == 0 else secondary
            pts = []
            for s in range(49):
                a = (s / 48.0) * math.pi * 2.0
                if ri == 0:
                    p = (math.cos(a) * rad, math.sin(a) * rad, 0.0)
                elif ri == 1:
                    p = (math.cos(a) * rad, 0.0, math.sin(a) * rad)
                else:
                    p = (0.0, math.cos(a) * rad, math.sin(a) * rad)
                rx = t * (0.7 + ri * 0.25)
                ry = t * (1.05 if ri % 2 == 0 else -0.9)
                x3, y3, z3 = rot3d(p[0], p[1], p[2], rx, ry, math.sin(t * 0.6) * 0.4)
                px, py, _ = proj3d(x3, y3, z3, cx, cy, fov, 4.4)
                pts.append((px, py))
            d.line(pts, fill=(*col, 230), width=3 if ri == 0 else 2)

        # Interlocked dual tetrahedra (Merkaba)
        s = 0.88 + 0.08 * energy
        tet1 = [(s, s, s), (s, -s, -s), (-s, s, -s), (-s, -s, s)]
        tet2 = [(-p[0], -p[1], -p[2]) for p in tet1]
        for ti, tet in enumerate((tet1, tet2)):
            c_line = accent if ti == 0 else secondary
            pt2 = []
            for v in tet:
                x3, y3, z3 = rot3d(v[0], v[1], v[2], t * 1.15, t * 1.45, t * 0.35)
                px, py, _ = proj3d(x3, y3, z3, cx, cy, fov, 4.4)
                pt2.append((px, py))
            for i in range(4):
                for j in range(i + 1, 4):
                    d.line([pt2[i], pt2[j]], fill=(*c_line, 245), width=3)
            for px, py in pt2:
                d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(255, 255, 255, 255), outline=c_line)

    elif mode == "sphere80":
        # 80-Node Fibonacci Constellation Sphere representing all 80 Zoth Studio tools
        golden = math.pi * (3.0 - math.sqrt(5.0))
        pts = []
        for i in range(80):
            y = 1.0 - (i / 79.0) * 2.0
            r = math.sqrt(max(0.0, 1.0 - y * y))
            th = golden * i + t * 0.55
            p = (math.cos(th) * r * 1.48, y * 1.48, math.sin(th) * r * 1.48)
            x3, y3, z3 = rot3d(p[0], p[1], p[2], t * 0.5, t * 0.9, math.sin(t * 0.4) * 0.25)
            px, py, depth = proj3d(x3, y3, z3, cx, cy, fov, 4.1)
            pts.append((depth, i, px, py))
        pts.sort(reverse=True)
        for idx in range(len(pts) - 1):
            _, i0, x0, y0 = pts[idx]
            _, _, x1, y1 = pts[(idx + 7) % len(pts)]
            d.line([(x0, y0), (x1, y1)], fill=(*secondary, 65), width=1)
        for depth, i, px, py in pts:
            rad = max(3, int((6.0 - depth) * (2.6 + 1.2 * energy)))
            col = GOLD if i % 7 == 0 else (accent if i % 2 == 0 else secondary)
            d.ellipse([px - rad, py - rad, px + rad, py + rad], fill=(*col, 235))

    elif mode == "fortress":
        # Rotating nested 3D octagonal firewall shields + orbiting guardian satellites
        for layer, rad in enumerate([1.62, 1.24, 0.86]):
            col = secondary if layer % 2 == 0 else accent
            ring = []
            for k in range(9):
                a = (k % 8) * (math.pi / 4.0) + t * (0.9 if layer % 2 == 0 else -1.2)
                p = (math.cos(a) * rad, math.sin(a) * rad, math.sin(t * 1.8 + layer) * 0.25)
                x3, y3, z3 = rot3d(p[0], p[1], p[2], 0.45 * math.sin(t), 0.55 * math.cos(t * 0.8), 0.0)
                px, py, _ = proj3d(x3, y3, z3, cx, cy, fov, 4.0)
                ring.append((px, py))
            d.line(ring, fill=(*col, 235), width=4 if layer == 0 else 2)
        # Deflected hostile pings spiraling inward then bouncing away
        for p_idx in range(14):
            phase = ((t * 0.9 + p_idx * 0.14) % 1.0)
            dist_p = 1.6 + 1.2 * abs(phase - 0.5) * 2.0
            ang = p_idx * 0.45 + t * 1.6
            x3, y3, z3 = rot3d(math.cos(ang) * dist_p, math.sin(ang) * dist_p, 0.0, 0.45, 0.35, 0.0)
            px, py, _ = proj3d(x3, y3, z3, cx, cy, fov, 4.1)
            d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(*GOLD, 230))

    elif mode == "swarm":
        # 3D Double Helix Pantheon Swarm with flying bezier message sparks
        helix_a, helix_b = [], []
        for i in range(28):
            y_norm = -1.4 + (i / 27.0) * 2.8
            ang = i * 0.45 + t * 1.9
            r = 0.85
            for target_list, offset in ((helix_a, 0.0), (helix_b, math.pi)):
                x3, y3, z3 = rot3d(math.cos(ang + offset) * r, y_norm, math.sin(ang + offset) * r, 0.25, t * 0.4, 0.12)
                px, py, depth = proj3d(x3, y3, z3, cx, cy, fov, 4.0)
                target_list.append((px, py, depth))
        for i in range(len(helix_a)):
            ax, ay, ad = helix_a[i]
            bx, by, bd = helix_b[i]
            d.line([(ax, ay), (bx, by)], fill=(*secondary, 115), width=2)
            # Moving message pulse across rung
            u = ((t * 2.4 + i * 0.2) % 1.0)
            mx = ax + (bx - ax) * u
            my = ay + (by - ay) * u
            d.ellipse([mx - 3, my - 3, mx + 3, my + 3], fill=(255, 255, 255, 240))
        d.line([(p[0], p[1]) for p in helix_a], fill=(*accent, 230), width=3)
        d.line([(p[0], p[1]) for p in helix_b], fill=(*GOLD, 230), width=3)
        for px, py, _ in helix_a + helix_b:
            d.ellipse([px - 5, py - 5, px + 5, py + 5], fill=(255, 255, 255, 245), outline=accent)

    elif mode == "medallion":
        # 3D Spinning Sovereign Vaelor L1 Gold Medallion with rim relief & specular glint
        yaw = t * 1.35
        pitch = 0.28 * math.sin(t * 0.9)
        for z_off, radius, rim_col, fill_col in (
            (-0.14, 1.48, (180, 120, 20), (110, 75, 16)),
            (0.0, 1.48, GOLD, (40, 28, 12)),
            (0.14, 1.36, (254, 240, 138), (22, 16, 10)),
        ):
            poly = []
            for k in range(48):
                a = (k / 48.0) * math.pi * 2.0
                x3, y3, z3 = rot3d(math.cos(a) * radius, math.sin(a) * radius, z_off, pitch, yaw, 0.0)
                px, py, _ = proj3d(x3, y3, z3, cx, cy, fov, 4.1)
                poly.append((px, py))
            d.polygon(poly, fill=(*fill_col, 225), outline=(*rim_col, 255))

        # Inner Rotating Compass / Insignia engraved on coin face
        for spoke in range(12):
            a = (spoke / 12.0) * math.pi * 2.0 + t * 0.45
            p0 = rot3d(math.cos(a) * 0.55, math.sin(a) * 0.55, 0.16, pitch, yaw, 0.0)
            p1 = rot3d(math.cos(a) * 1.18, math.sin(a) * 1.18, 0.16, pitch, yaw, 0.0)
            s0 = proj3d(*p0, cx, cy, fov, 4.1)
            s1 = proj3d(*p1, cx, cy, fov, 4.1)
            d.line([(s0[0], s0[1]), (s1[0], s1[1])], fill=(*GOLD, 245), width=3)

        # Specular light sweep bar across medallion face
        sweep_x = math.sin(t * 2.2) * 1.1
        p_top = rot3d(sweep_x - 0.18, -1.15, 0.18, pitch, yaw, 0.0)
        p_bot = rot3d(sweep_x + 0.18, 1.15, 0.18, pitch, yaw, 0.0)
        st0 = proj3d(*p_top, cx, cy, fov, 4.1)
        st1 = proj3d(*p_bot, cx, cy, fov, 4.1)
        d.line([(st0[0], st0[1]), (st1[0], st1[1])], fill=(255, 255, 235, 160), width=12)

    elif mode == "citadel":
        # Continuous 3D Avenue Flight toward Spinning Null Core Monument
        hy = vy0 + int(vh * 0.46)
        draw_perspective_floor(d, vx0=vx0, vx1=vx1, vy=vy1 - 10, horizon_y=hy, t=t * 1.6, col=GOLD)
        # Moving 3D side avenue towers
        for slot in range(9):
            z_loop = 11.5 - ((t * 3.8 + slot * 1.25) % 11.5)
            z_dist = max(0.9, z_loop)
            for side in (-1, 1):
                tx = side * 2.15
                tw = 0.65
                th = 1.6 + ((slot * 7) % 5) * 0.35
                # Front bottom & top corners
                b1 = proj3d(tx - side * tw, 1.25, z_dist, cx, hy + 20, fov, 0.5)
                b2 = proj3d(tx + side * tw, 1.25, z_dist, cx, hy + 20, fov, 0.5)
                t1 = proj3d(tx - side * tw, 1.25 - th, z_dist, cx, hy + 20, fov, 0.5)
                t2 = proj3d(tx + side * tw, 1.25 - th, z_dist, cx, hy + 20, fov, 0.5)
                fade = max(45, min(230, int(255 * (1.0 - z_dist / 12.0))))
                d.polygon([(b1[0], b1[1]), (b2[0], b2[1]), (t2[0], t2[1]), (t1[0], t1[1])], fill=(12, 16, 26, 210), outline=(*GOLD, fade))
        # Distant Null Core Sphere + Rings hovering above horizon
        core_cy = hy - int(vh * 0.14)
        cr = int(min(vw, vh) * (0.11 + 0.015 * math.sin(t * 4.0)))
        d.ellipse([cx - cr, core_cy - cr, cx + cr, core_cy + cr], fill=(0, 210, 240, 175), outline=(255, 255, 255, 230), width=2)
        for ri in range(3):
            ring = []
            for k in range(37):
                a = (k / 36.0) * math.pi * 2.0
                x3, y3, z3 = rot3d(math.cos(a) * (0.65 + ri * 0.16), math.sin(a) * (0.65 + ri * 0.16), 0.0, t * (1.1 + ri * 0.3), t * (-0.9 if ri % 2 else 1.2), ri * 0.6)
                px, py, _ = proj3d(x3, y3, z3, cx, core_cy, fov * 0.72, 3.6)
                ring.append((px, py))
            d.line(ring, fill=(*GOLD, 235), width=2)


def draw_viewport_flanking_hud_and_stars(
    d: ImageDraw.ImageDraw,
    vx0: int,
    vy0: int,
    vx1: int,
    vy1: int,
    t: float,
    accent: tuple,
    secondary: tuple,
    energy: float,
    is_vertical: bool,
):
    """Draw drifting starfield particles and (in 16:9) live flanking telemetry HUD panels."""
    iw = max(1, (vx1 - 14) - (vx0 + 14))
    ih = max(1, (vy1 - 14) - (vy0 + 14))

    # 28 deterministic drifting starfield particles modulated by continuous time t
    for i in range(28):
        vx_speed = 18.0 + ((i * 19) % 37)
        vy_speed = 6.0 + ((i * 11) % 17)
        sx = (vx0 + 14) + ((i * 173.3 + t * vx_speed) % iw)
        sy = (vy0 + 14) + ((i * 97.7 + math.sin(t * 0.9 + i) * 14.0 + t * vy_speed) % ih)
        twinkle = 0.45 + 0.55 * abs(math.sin(t * (2.4 + (i % 5) * 0.45) + i * 1.3))
        alpha = int(75 + 165 * twinkle * (0.7 + 0.3 * energy))
        star_col = secondary if i % 4 == 0 else (240, 248, 255)
        r = 2 if (i % 7 == 0) else 1
        d.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(*star_col, min(255, alpha)))

    if is_vertical or (vx1 - vx0) < 1100:
        return

    f_hud = font(MONO, 11)

    # Left Telemetry Widget: Rotating Radar Sweep + 4 Animated Metric Bars
    lx0, ly0, lw, lh = vx0 + 22, vy0 + 20, 210, 250
    d.rounded_rectangle([lx0, ly0, lx0 + lw, ly0 + lh], radius=12, fill=(8, 12, 22, 180), outline=(*accent, 115), width=2)
    d.text((lx0 + 12, ly0 + 10), "PERIMETER RADAR", font=f_hud, fill=accent)

    rcx, rcy, rr = lx0 + lw // 2, ly0 + 70, 38
    for ring_r in (rr, 25, 13):
        d.ellipse([rcx - ring_r, rcy - ring_r, rcx + ring_r, rcy + ring_r], outline=(*accent, 90), width=1)
    d.line([(rcx - rr, rcy), (rcx + rr, rcy)], fill=(*accent, 70), width=1)
    d.line([(rcx, rcy - rr), (rcx, rcy + rr)], fill=(*accent, 70), width=1)

    sweep_ang = t * 2.8
    for trail in range(6):
        ta = sweep_ang - trail * 0.14
        alpha_t = max(30, 225 - trail * 35)
        tx = rcx + math.cos(ta) * rr
        ty = rcy + math.sin(ta) * rr
        d.line([(rcx, rcy), (tx, ty)], fill=(*accent, alpha_t), width=2 if trail == 0 else 1)

    for b_idx, (b_ang_base, b_dist) in enumerate(((0.45, 0.72), (2.15, 0.56), (4.35, 0.80))):
        b_ang = b_ang_base + 0.15 * math.sin(t * 0.8 + b_idx)
        bx = rcx + math.cos(b_ang) * (rr * b_dist)
        by = rcy + math.sin(b_ang) * (rr * b_dist)
        diff = abs(((sweep_ang - b_ang + math.pi) % (2.0 * math.pi)) - math.pi)
        ping = max(0.35, 1.0 - min(1.0, diff / 1.4))
        d.ellipse([bx - 3, by - 3, bx + 3, by + 3], fill=(*secondary, int(90 + 165 * ping)))

    metrics = [
        ("60 FPS LOCK", 0.96 + 0.04 * math.sin(t * 3.1)),
        ("3D SHADER", 0.72 + 0.24 * (0.5 + 0.5 * math.sin(t * 2.1))),
        ("ZERO LEAK", 0.99),
        ("AUDIO LUFS", 0.55 + 0.42 * min(1.0, 0.25 + energy * 0.85)),
    ]
    bar_x0, bar_w = lx0 + 14, lw - 28
    for mi, (label, ratio) in enumerate(metrics):
        my = ly0 + 122 + mi * 30
        pct = max(0.08, min(1.0, ratio))
        d.text((bar_x0, my), label, font=f_hud, fill=(203, 213, 225))
        pct_txt = f"{int(pct * 100)}%"
        tw = d.textlength(pct_txt, font=f_hud)
        d.text((bar_x0 + bar_w - tw, my), pct_txt, font=f_hud, fill=accent)
        track_y = my + 15
        d.rounded_rectangle([bar_x0, track_y, bar_x0 + bar_w, track_y + 6], radius=3, fill=(22, 30, 48, 220))
        d.rounded_rectangle(
            [bar_x0, track_y, bar_x0 + max(8, int(bar_w * pct)), track_y + 6],
            radius=3,
            fill=(*accent, 235),
        )

    # Right Telemetry Widget: Dual-Sine Phase Oscilloscope + 8 Animated Telemetry Bars
    rx0, ry0, rw, rh = vx1 - 232, vy0 + 20, 210, 250
    d.rounded_rectangle([rx0, ry0, rx0 + rw, ry0 + rh], radius=12, fill=(8, 12, 22, 180), outline=(*secondary, 115), width=2)
    d.text((rx0 + 12, ry0 + 10), "PHASE OSCILLOSCOPE", font=f_hud, fill=secondary)

    sx0, sx1 = rx0 + 14, rx0 + rw - 14
    s_mid_y = ry0 + 78
    s_amp = 22.0 * (0.65 + 0.35 * energy)
    d.rounded_rectangle([sx0 - 2, s_mid_y - 34, sx1 + 2, s_mid_y + 34], radius=6, fill=(10, 16, 30, 210), outline=(*secondary, 70), width=1)
    d.line([(sx0, s_mid_y), (sx1, s_mid_y)], fill=(255, 255, 255, 40), width=1)

    pts_a = []
    pts_b = []
    for k in range(36):
        u = k / 35.0
        px = sx0 + (sx1 - sx0) * u
        ya = s_mid_y + math.sin(u * math.pi * 4.0 - t * 6.5) * s_amp * math.cos(u * math.pi * 0.5)
        yb = s_mid_y + math.sin(u * math.pi * 6.0 + t * 4.8 + 1.2) * (s_amp * 0.65)
        pts_a.append((px, ya))
        pts_b.append((px, yb))
    d.line(pts_b, fill=(*accent, 185), width=2)
    d.line(pts_a, fill=(*secondary, 240), width=2)

    d.text((rx0 + 14, ry0 + 126), "TELEMETRY SPECTRUM", font=f_hud, fill=(203, 213, 225))
    spec_x0 = rx0 + 16
    spec_base_y = ry0 + 230
    spec_max_h = 80
    bar_slot = (rw - 32) // 8
    for bi in range(8):
        wave = 0.25 + 0.75 * abs(math.sin(t * (3.6 + bi * 0.55) + bi * 0.9))
        bh = max(8, int(spec_max_h * wave * (0.55 + 0.45 * energy)))
        bx0 = spec_x0 + bi * bar_slot + 3
        bx1 = bx0 + max(8, bar_slot - 6)
        b_col = accent if bi % 2 == 0 else secondary
        d.rounded_rectangle([bx0, spec_base_y - bh, bx1, spec_base_y], radius=3, fill=(*b_col, 215))
        d.line([(bx0, spec_base_y - bh - 3), (bx1, spec_base_y - bh - 3)], fill=(255, 255, 255, 220), width=2)


def draw_maya_chrome_frame(
    d: ImageDraw.ImageDraw,
    vx0: int,
    vy0: int,
    vx1: int,
    vy1: int,
    window_title: str,
    accent: tuple,
    secondary: tuple,
    t: float,
):
    """Wrap the live 3D procedural scene inside a crisp Maya Browser/Terminal chassis."""
    d.rounded_rectangle([vx0 - 2, vy0 - 2, vx1 + 2, vy1 + 2], radius=18, outline=(*accent, 190), width=3)
    # Animated glowing light bead traveling perimeter (Meta Edits flowing outline)
    perim_u = (t * 0.35) % 1.0
    if perim_u < 0.25:
        bx = vx0 + (vx1 - vx0) * (perim_u / 0.25)
        by = vy0
    elif perim_u < 0.50:
        bx = vx1
        by = vy0 + (vy1 - vy0) * ((perim_u - 0.25) / 0.25)
    elif perim_u < 0.75:
        bx = vx1 - (vx1 - vx0) * ((perim_u - 0.50) / 0.25)
        by = vy1
    else:
        bx = vx0
        by = vy1 - (vy1 - vy0) * ((perim_u - 0.75) / 0.25)
    d.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=(255, 255, 255, 240), outline=secondary)

    # Top title bar of Maya Device Frame
    bar_h = 34
    d.rounded_rectangle([vx0, vy0, vx1, vy0 + bar_h], radius=14, fill=(10, 14, 24, 235))
    d.rectangle([vx0, vy0 + 18, vx1, vy0 + bar_h], fill=(10, 14, 24, 235))
    for i, c in enumerate(((255, 95, 86), (255, 189, 46), (39, 201, 63))):
        d.ellipse([vx0 + 14 + i * 16, vy0 + 11, vx0 + 24 + i * 16, vy0 + 21], fill=c)
    f_url = font(MONO, 14)
    d.text((vx0 + 72, vy0 + 9), clean_glyph_text(window_title), font=f_url, fill=(203, 213, 225))

    # Right side animated telemetry pill
    fps_tag = f"60 FPS · {t:04.2f}s"
    tw = d.textlength(fps_tag, font=f_url)
    d.text((vx1 - tw - 16, vy0 + 9), fps_tag, font=f_url, fill=accent)


def open_ffmpeg_60fps_pipe(W: int, H: int, wav_path: str, out_mp4: str, fps: int = 60):
    out_parent = os.path.dirname(out_mp4)
    if out_parent:
        os.makedirs(out_parent, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"
    cmd = [
        ffmpeg_bin,
        "-y",
        "-f",
        "rawvideo",
        "-vcodec",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-s",
        f"{W}x{H}",
        "-r",
        str(fps),
        "-i",
        "-",
        "-i",
        wav_path,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-af",
        "loudnorm=I=-14:TP=-1:LRA=11",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-shortest",
        "-movflags",
        "+faststart",
        out_mp4,
    ]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def _synth_voice_or_fallback(agent: str, spoken_text: str, tmp_dir: str = None) -> np.ndarray:
    if HAS_VOICE_ENGINE:
        return synthesize_character_line(agent, spoken_text)
    espeak_bin = shutil.which("espeak-ng") or "/usr/bin/espeak-ng"
    if not os.path.exists(espeak_bin):
        return np.zeros(int(SR * 2.5), dtype=np.float32)

    own_tmp = None
    try:
        work_dir = tmp_dir
        if not work_dir:
            own_tmp = tempfile.TemporaryDirectory(prefix="maya_voice_")
            work_dir = own_tmp.name
        key = hashlib.sha256(spoken_text.encode("utf-8")).hexdigest()[:12]
        wav_p = os.path.join(work_dir, f"espeak_{key}.wav")
        subprocess.run(
            [espeak_bin, "-w", wav_p, "-s", "175", "--", spoken_text],
            check=False,
            timeout=30,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if os.path.exists(wav_p):
            with wave.open(wav_p, "rb") as wf:
                raw = wf.readframes(wf.getnframes())
            arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
            return arr if len(arr) > 0 else np.zeros(int(SR * 2.5), dtype=np.float32)
    except Exception:
        pass
    finally:
        if own_tmp is not None:
            own_tmp.cleanup()
    return np.zeros(int(SR * 2.5), dtype=np.float32)


def render_preset(preset_key: str, out_dir: str = DEFAULT_OUT_DIR, mirror_dir: str = None) -> str:
    if preset_key not in PRESETS:
        raise ValueError(f"Unknown Maya motion preset: {preset_key}")

    cfg = PRESETS[preset_key]
    W, H, FPS = cfg["W"], cfg["H"], cfg["fps"]
    is_vertical = H > W
    accent = cfg["accent"]
    secondary = cfg["secondary"]
    os.makedirs(out_dir, exist_ok=True)
    if mirror_dir:
        os.makedirs(mirror_dir, exist_ok=True)

    print(f"=== Maya Procedural 60fps Engine :: Rendering [{preset_key}] ({W}x{H} @ {FPS}fps) ===")

    dummy_im = Image.new("RGB", (W, H))
    dummy_d = ImageDraw.Draw(dummy_im)
    clean_hdr = clean_glyph_text(cfg["title"])
    f_hdr = fit_font(dummy_d, clean_hdr, BOLD, 26 if is_vertical else 28, 16, W - (210 if is_vertical else 380))
    f_cap = font(BOLD, 24 if is_vertical else 22)
    f_tag = font(MONO, 15 if is_vertical else 14)

    if is_vertical:
        vx0, vy0, vx1, vy1 = 28, 96, W - 28, 744
        card_x0, card_y0, card_x1, card_y1 = 28, 764, W - 28, H - 104
    else:
        vx0, vy0, vx1, vy1 = 36, 70, W - 36, 452
        card_x0, card_y0, card_x1, card_y1 = 36, 468, W - 36, H - 22
    card_inner_w = (card_x1 - card_x0) - 44

    lead_pad = 0.14
    tail_pad = 0.28
    seg_infos = []
    cur_t = 0.0

    with tempfile.TemporaryDirectory(prefix="maya_motion_") as tmp_wav_dir:
        for sc in cfg["scenes"]:
            agent, title, sub, col, vo_line = sc
            voice_pcm = _synth_voice_or_fallback(agent, vo_line, tmp_dir=tmp_wav_dir)
            voice_dur = max(0.5, len(voice_pcm) / SR)
            seg_dur = max(3.2, lead_pad + voice_dur + tail_pad)
            clean_t = clean_glyph_text(title)
            clean_s = clean_glyph_text(sub)
            clean_vo = clean_glyph_text(vo_line)
            f_title = fit_font(dummy_d, clean_t, BOLD, 32 if is_vertical else 36, 20, card_inner_w)
            f_sub = fit_font(dummy_d, clean_s, MONO, 18, 13, card_inner_w)
            cap_layout = precompute_caption_layout(
                dummy_d, clean_vo, f_cap, card_inner_w - 16, max_lines_per_page=3 if is_vertical else 2
            )
            seg_infos.append({
                "agent": agent,
                "title": clean_t,
                "f_title": f_title,
                "sub": clean_s,
                "f_sub": f_sub,
                "col": col,
                "cap_layout": cap_layout,
                "voice_pcm": voice_pcm,
                "voice_dur": voice_dur,
                "start_t": cur_t,
                "seg_dur": seg_dur,
            })
            cur_t += seg_dur

        total_dur = cur_t
        total_samples = int(total_dur * SR) + SR // 4
        voice_track = np.zeros(total_samples, dtype=np.float32)
        duck_env = np.ones(total_samples, dtype=np.float32) * 0.42

        for seg in seg_infos:
            st = int((seg["start_t"] + lead_pad) * SR)
            vp = seg["voice_pcm"]
            end = min(total_samples, st + len(vp))
            ln = max(0, end - st)
            if ln > 0:
                voice_track[st:end] += vp[:ln]
                duck_env[max(0, st - int(0.08 * SR)):min(total_samples, end + int(0.12 * SR))] = 0.14

        seed = int(hashlib.md5(preset_key.encode("utf-8")).hexdigest()[:6], 16)
        music_bed = build_background_music((total_samples + SR) / SR, root=cfg["root_hz"], seed=seed, bpm=cfg["bpm"], funky=True)
        if len(music_bed) < total_samples:
            music_bed = np.pad(music_bed, (0, total_samples - len(music_bed)))
        master_mix = voice_track * 1.06 + music_bed[:total_samples] * duck_env

        wav_path = os.path.join(tmp_wav_dir, f"{preset_key}.wav")
        save_wav(wav_path, master_mix[:int(total_dur * SR)])

        total_frames = int(total_dur * FPS)
        frame_energy = np.zeros(total_frames, dtype=np.float32)
        spf = SR // FPS
        for f in range(total_frames):
            s0 = f * spf
            s1 = min(len(voice_track), s0 + spf)
            if s1 > s0:
                frame_energy[f] = min(1.0, float(np.sqrt(np.mean(voice_track[s0:s1] ** 2))) * 4.2)

        shader = MotionShaderContext(W, H)
        out_mp4 = os.path.join(out_dir, cfg["filename"])
        proc = open_ffmpeg_60fps_pipe(W, H, wav_path, out_mp4, fps=FPS)
        stderr_out = ""
        ret = -1
        try:
            for f in range(total_frames):
                tt = f / FPS
                seg = seg_infos[-1]
                for s in seg_infos:
                    if s["start_t"] <= tt < s["start_t"] + s["seg_dur"]:
                        seg = s
                        break
                local_t = tt - seg["start_t"]
                speech_prog = (local_t - lead_pad) / seg["voice_dur"]
                col = seg["col"]
                energy = float(frame_energy[f])

                # 1. Procedural NumPy Plasma / Aurora / Tunnel Shader (Zero Still Images)
                im = shader.render_bg(tt, cfg["scene_mode"], col, secondary, energy)
                d = ImageDraw.Draw(im, "RGBA")

                # 2. Continuous Sub-Pixel Braille Cipher Rain
                draw_braille_matrix(d, W, H, tt, cols=14 if is_vertical else 24, accent=col, secondary=secondary)

                # 3. Dark viewport backing + Flanking HUD & Stars + 3D Geometry + Maya Browser Frame + Animated Cursor
                d.rounded_rectangle([vx0, vy0, vx1, vy1], radius=16, fill=(5, 8, 16, 200))
                draw_viewport_flanking_hud_and_stars(d, vx0, vy0 + 36, vx1, vy1, tt, col, secondary, energy, is_vertical)
                draw_scene_3d_geometry(d, cfg["scene_mode"], vx0, vy0 + 36, vx1, vy1, tt, col, secondary, energy)
                draw_maya_cursor_and_ripples(d, vx0, vy0 + 36, vx1 - vx0, vy1 - vy0 - 36, tt, col, secondary)
                draw_maya_chrome_frame(d, vx0, vy0, vx1, vy1, cfg["window_title"], col, secondary, tt)

                # 4. Top Header Bar + Live Voice Equalizer Bars
                hdr_h = 80 if is_vertical else 58
                d.rectangle([0, 0, W, hdr_h], fill=(4, 6, 12, 232))
                d.line([(0, hdr_h), (W, hdr_h)], fill=(*col, 140), width=2)
                draw_mic_icon(d, 34, hdr_h // 2, col, scale=1.15)
                d.text((54, (hdr_h - 26) // 2), clean_hdr, font=f_hdr, fill=WHITE)

                eq_bars = 12 if is_vertical else 18
                eq_x0 = (W - eq_bars * 12 - 20) if not is_vertical else (W - eq_bars * 10 - 20)
                eq_mid = hdr_h // 2
                for bi in range(eq_bars):
                    wm = abs(math.sin(bi * 0.65 + tt * 22.0))
                    bh = max(3, int(16 * (0.25 + 0.75 * energy) * wm))
                    step = 10 if is_vertical else 12
                    bx = eq_x0 + bi * step
                    d.rounded_rectangle([bx, eq_mid - bh, bx + 6, eq_mid + bh], radius=2, fill=col)

                # 5. Lower-Third Kinetic Typewriter Title & Karaoke Card (Safe Margin & High Contrast)
                d.rounded_rectangle(
                    [card_x0, card_y0, card_x1, card_y1],
                    radius=16,
                    fill=(6, 9, 18, 240),
                    outline=col,
                    width=3,
                )
                vis_chars = max(1, int(len(seg["title"]) * min(1.0, local_t / 0.55)))
                typed_heading = seg["title"][:vis_chars] + ("_" if local_t < 0.65 and int(tt * 8) % 2 == 0 else "")
                d.text((card_x0 + 22, card_y0 + 16), typed_heading, font=seg["f_title"], fill=col)
                d.text((card_x0 + 22, card_y0 + (54 if is_vertical else 54)), seg["sub"], font=seg["f_sub"], fill=(210, 222, 238))

                cap_top = card_y0 + (86 if is_vertical else 82)
                cap_bot = card_y1 - 12
                d.rounded_rectangle(
                    [card_x0 + 16, cap_top, card_x1 - 16, cap_bot],
                    radius=12,
                    fill=(11, 16, 28, 248),
                    outline=(*secondary, 120),
                    width=2,
                )
                draw_karaoke_captions_fast(
                    d=d,
                    layout=seg["cap_layout"],
                    speech_progress=speech_prog,
                    box_x0=card_x0 + 28,
                    box_y0=cap_top + 8,
                    box_w=card_inner_w - 16,
                    box_h=(cap_bot - cap_top) - 16,
                    fnt=f_cap,
                    accent_col=col,
                    center_align=is_vertical,
                )

                # 6. Attribution + Live Timeline Progress Footer (Clean Non-Intrusive Attribution)
                if is_vertical:
                    bar_y = H - 82
                    d.rectangle([28, bar_y, W - 28, bar_y + 8], fill=(30, 38, 56))
                    d.rectangle([28, bar_y, 28 + int((W - 56) * (f / max(1, total_frames))), bar_y + 8], fill=col)
                    attr = "Engineered by Neal Frazier Tech (@1nc0gn30) - NullAI Platform"
                    aw = d.textlength(attr, font=f_tag)
                    d.text(((W - aw) // 2, H - 56), attr, font=f_tag, fill=(195, 208, 226))
                else:
                    d.rectangle([36, H - 14, W - 36, H - 8], fill=(30, 38, 56))
                    d.rectangle([36, H - 14, 36 + int((W - 72) * (f / max(1, total_frames))), H - 8], fill=col)

                proc.stdin.write(im.tobytes())

            proc.stdin.close()
            stderr_out = proc.stderr.read().decode("utf-8", errors="replace")
            ret = proc.wait()
        finally:
            if proc.poll() is None:
                try:
                    if proc.stdin and not proc.stdin.closed:
                        proc.stdin.close()
                except Exception:
                    pass
                try:
                    proc.terminate()
                    proc.wait(timeout=5)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass

        if ret != 0:
            raise RuntimeError(f"FFmpeg encode failed ({ret}): {stderr_out[-400:]}")

    if mirror_dir and os.path.abspath(mirror_dir) != os.path.abspath(out_dir):
        shutil.copy2(out_mp4, os.path.join(mirror_dir, cfg["filename"]))

    mb = os.path.getsize(out_mp4) / (1024 * 1024)
    print(f"  ✓ Mastered 60fps [-14 LUFS] {out_mp4} ({mb:.2f} MB, {total_dur:.2f}s)")
    return out_mp4


def resolve_preset_names(name: str) -> list:
    if name == "all":
        return list(PRESETS.keys())
    if name in PRESETS:
        return [name]
    for k, v in PRESETS.items():
        if name in v.get("alias", []):
            return [k]
    raise ValueError(f"Unknown preset '{name}'. Run --list-presets to see valid keys.")


def main():
    parser = argparse.ArgumentParser(description="Maya Linux 60fps Procedural Motion Edit Engine v2.0.0")
    parser.add_argument("--list-presets", action="store_true", help="List available motion presets")
    parser.add_argument("--json", action="store_true", help="Output preset list as JSON")
    parser.add_argument("--render", type=str, help="Preset name or 'all'")
    parser.add_argument("--out", type=str, default=DEFAULT_OUT_DIR, help="Output directory")
    parser.add_argument("--mirror", type=str, default=None, help="Optional secondary mirror output directory")
    args = parser.parse_args()

    if args.list_presets:
        if args.json:
            payload = [
                {
                    "id": k,
                    "aliases": v.get("alias", []),
                    "aspect": v["aspect"],
                    "width": v["W"],
                    "height": v["H"],
                    "fps": v["fps"],
                    "filename": v["filename"],
                }
                for k, v in PRESETS.items()
            ]
            print(json.dumps({"version": "2.0.0", "presets": payload}, indent=2))
            return 0
        for k, v in PRESETS.items():
            aliases = ",".join(v.get("alias", []))
            print(f"{k:28s}  [{v['aspect']:4s} @ {v['fps']}fps]  aliases=({aliases})  -> {v['filename']}")
        return 0

    if not args.render:
        parser.print_help()
        return 1

    keys = resolve_preset_names(args.render)
    for k in keys:
        render_preset(k, out_dir=args.out, mirror_dir=args.mirror)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
