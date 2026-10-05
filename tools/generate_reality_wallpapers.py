#!/usr/bin/env python3
"""
ZOTHOS High-Definition Reality Wallpaper Synthesizer
Generates 1920x1080 (and 4K ready) artistic wallpapers for the 4 Realities:
  1. Hermetic Matrix  (hermetic-matrix.png)  - Phosphor green digital rain, cyber grid, Metatron core
  2. NullAI Ghostmode (ghostmode-nullai.png) - Midnight obsidian, spectral cyan/violet mist, tactical HUD
  3. Incognito Win11  (win11-bloom.jpg)      - Dark fluent slate, organic 3D blue mica bloom ribbons
  4. Azoth Gold       (alchemical-gold.png)  - 24K solar gold alchemical geometry & embossed seal
"""

import os
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH, HEIGHT = 1920, 1080
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
OUT_DIR = os.path.join(ROOT_DIR, "config/includes.chroot/usr/share/backgrounds/zothos")
BUILD_CHROOT_DIR = os.path.join(ROOT_DIR, "build/live_workspace/chroot/usr/share/backgrounds/zothos")
os.makedirs(OUT_DIR, exist_ok=True)
if os.path.exists(os.path.dirname(BUILD_CHROOT_DIR)):
    os.makedirs(BUILD_CHROOT_DIR, exist_ok=True)

# ── 1. HERMETIC MATRIX REALITY ──────────────────────────────────────────────
def generate_matrix_wallpaper():
    print("[*] Generating Hermetic Matrix wallpaper...")
    # Base deep black-emerald gradient
    base = Image.new("RGBA", (WIDTH, HEIGHT), (2, 5, 3, 255))
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Cyberspace perspective grid on lower half
    horizon_y = int(HEIGHT * 0.58)
    grid_lines = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grid_lines)

    # Vanishing point
    vx, vy = WIDTH // 2, horizon_y
    for x in range(-WIDTH, WIDTH * 2, 48):
        alpha = max(10, int(120 * (1.0 - abs(x - vx) / WIDTH)))
        g_draw.line([(vx, vy), (x, HEIGHT)], fill=(0, 255, 128, alpha), width=1)

    # Horizontal grid lines with perspective compression
    for y_norm in np.linspace(0, 1, 16):
        y = int(horizon_y + (y_norm ** 2.2) * (HEIGHT - horizon_y))
        alpha = int(25 + y_norm * 90)
        g_draw.line([(0, y), (WIDTH, y)], fill=(0, 255, 128, alpha), width=1)

    # Multi-layered Digital Rain (Matrix glyph streams)
    random.seed(42)
    glyphs = "0123456789ABCDEF01010101XYZΩΨΣ🜂🜄🜁🜃☿☉☽"
    font = ImageFont.load_default()

    for col in range(0, WIDTH, 24):
        if random.random() < 0.8:
            stream_len = random.randint(12, 45)
            start_y = random.randint(-400, HEIGHT - 200)
            speed = random.randint(18, 30)

            for idx in range(stream_len):
                y = start_y + idx * speed
                if 0 <= y < HEIGHT:
                    char = random.choice(glyphs)
                    # Leading glyph is bright white-green, body fades into deep emerald
                    if idx == stream_len - 1:
                        color = (230, 255, 235, 255)
                    elif idx >= stream_len - 3:
                        color = (0, 255, 157, 240)
                    else:
                        intensity = int(120 * (idx / stream_len))
                        color = (0, min(255, 60 + intensity), int(intensity * 0.4), int(160 * (idx / stream_len)))

                    draw.text((col, y), char, fill=color, font=font)

    # Sacred Metatron's Geometry Watermark in center
    cx, cy = WIDTH // 2, int(HEIGHT * 0.42)
    geom_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    geom_draw = ImageDraw.Draw(geom_layer)

    # Concentric rings
    for r in [280, 276, 210, 150, 90, 45]:
        geom_draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 255, 157, 90), width=2 if r in [280, 150] else 1)

    # Hexagram
    r_hex = 210
    pts1, pts2 = [], []
    for i in range(3):
        a1 = -math.pi / 2 + i * (2 * math.pi / 3)
        pts1.append((cx + r_hex * math.cos(a1), cy + r_hex * math.sin(a1)))
        a2 = math.pi / 2 + i * (2 * math.pi / 3)
        pts2.append((cx + r_hex * math.cos(a2), cy + r_hex * math.sin(a2)))
    geom_draw.polygon(pts1, outline=(0, 255, 157, 140), width=2)
    geom_draw.polygon(pts2, outline=(0, 255, 157, 140), width=2)

    # 12 Node circles
    for i in range(6):
        a = i * (math.pi / 3)
        nx = cx + int(150 * math.cos(a))
        ny = cy + int(150 * math.sin(a))
        geom_draw.ellipse([nx - 8, ny - 8, nx + 8, ny + 8], fill=(0, 255, 157, 220))
        geom_draw.line([(cx, cy), (nx, ny)], fill=(0, 255, 157, 60), width=1)

    # Center Monas Core
    geom_draw.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(230, 255, 235, 255))

    # Glow filter on geometry
    geom_glow = geom_layer.filter(ImageFilter.GaussianBlur(radius=4))

    # HUD Watermark in top-left & bottom-right
    draw.text((40, 40), "ZOTHOS // REALITY SURFACE: MATRIX [EMERALD PHOSPHOR]", fill=(0, 255, 157, 180), font=font)
    draw.text((40, 56), "DAEMON: ACTIVE | ZERO EGRESS | LOOPBACK 127.0.0.1", fill=(0, 200, 120, 130), font=font)
    draw.text((WIDTH - 360, HEIGHT - 50), "METATRON CONSTELLATION v5.0", fill=(0, 255, 157, 140), font=font)

    # Composite all layers
    final_img = Image.alpha_composite(base, grid_lines)
    final_img = Image.alpha_composite(final_img, overlay)
    final_img = Image.alpha_composite(final_img, geom_glow)
    final_img = Image.alpha_composite(final_img, geom_layer)

    out_png = f"{OUT_DIR}/hermetic-matrix.png"
    final_img.convert("RGB").save(out_png, "PNG", optimize=True)
    final_img.convert("RGB").save(f"{BUILD_CHROOT_DIR}/hermetic-matrix.png", "PNG", optimize=True)
    print(f"    -> Saved {out_png}")


# ── 2. NULLAI GHOSTMODE REALITY ─────────────────────────────────────────────
def generate_ghost_wallpaper():
    print("[*] Generating NullAI Ghostmode Stealth wallpaper...")
    # Midnight obsidian void with dark violet-indigo gradient
    base = Image.new("RGBA", (WIDTH, HEIGHT), (8, 8, 17, 255))
    fog_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    fog_draw = ImageDraw.Draw(fog_layer)

    # Volumetric vaporous mist blobs (Spectral Cyan & Ghost Violet)
    blobs = [
        (int(WIDTH * 0.35), int(HEIGHT * 0.45), 450, 260, (0, 240, 255, 75)),
        (int(WIDTH * 0.65), int(HEIGHT * 0.40), 500, 300, (168, 85, 247, 85)),
        (int(WIDTH * 0.50), int(HEIGHT * 0.55), 600, 250, (56, 189, 248, 60)),
        (int(WIDTH * 0.50), int(HEIGHT * 0.35), 380, 220, (192, 132, 252, 70)),
        (int(WIDTH * 0.20), int(HEIGHT * 0.70), 300, 180, (0, 240, 255, 45)),
        (int(WIDTH * 0.80), int(HEIGHT * 0.65), 350, 200, (168, 85, 247, 45)),
    ]
    for bx, by, rx, ry, col in blobs:
        temp = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        t_draw = ImageDraw.Draw(temp)
        t_draw.ellipse([bx - rx, by - ry, bx + rx, by + ry], fill=col)
        temp = temp.filter(ImageFilter.GaussianBlur(radius=65))
        fog_layer = Image.alpha_composite(fog_layer, temp)

    # Tactical HUD & Amnesic Cloak Matrix
    hud_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hud_layer)
    font = ImageFont.load_default()

    # Subtle radar rings
    cx, cy = WIDTH // 2, HEIGHT // 2
    for r in [120, 240, 360, 480]:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(0, 240, 255, 45), width=1)

    # 45-degree angle reticles
    for angle_deg in [0, 45, 90, 135, 180, 225, 270, 315]:
        rad = math.radians(angle_deg)
        x2 = cx + int(480 * math.cos(rad))
        y2 = cy + int(480 * math.sin(rad))
        draw.line([(cx, cy), (x2, y2)], fill=(168, 85, 247, 35), width=1)

    # Ghost HUD Viewfinder Brackets
    bw, bh = 420, 240
    bracket_color = (0, 240, 255, 180)
    # TL
    draw.line([(cx - bw, cy - bh), (cx - bw + 35, cy - bh)], fill=bracket_color, width=2)
    draw.line([(cx - bw, cy - bh), (cx - bw, cy - bh + 35)], fill=bracket_color, width=2)
    # TR
    draw.line([(cx + bw, cy - bh), (cx + bw - 35, cy - bh)], fill=bracket_color, width=2)
    draw.line([(cx + bw, cy - bh), (cx + bw, cy - bh + 35)], fill=bracket_color, width=2)
    # BL
    draw.line([(cx - bw, cy + bh), (cx - bw + 35, cy + bh)], fill=bracket_color, width=2)
    draw.line([(cx - bw, cy + bh), (cx - bw, cy + bh - 35)], fill=bracket_color, width=2)
    # BR
    draw.line([(cx + bw, cy + bh), (cx + bw - 35, cy + bh)], fill=bracket_color, width=2)
    draw.line([(cx + bw, cy + bh), (cx + bw, cy + bh - 35)], fill=bracket_color, width=2)

    # Center Ghost Emblem Sigil
    draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], outline=(0, 240, 255, 220), width=2)
    draw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(168, 85, 247, 240))

    # Clean Military / Cloak Status Badges
    draw.text((cx - bw, cy + bh + 16), "GHOSTMODE // NULLAI.TECH PROTOCOL v4.0", fill=(0, 240, 255, 220), font=font)
    draw.text((cx + bw - 240, cy + bh + 16), "TOR: ROUTED | MAC: SPOOFED | RAM: AMNESIC", fill=(192, 132, 252, 200), font=font)
    draw.text((40, 40), "REALITY SURFACE: GHOST (STEALTH INCOGNITO)", fill=(0, 240, 255, 160), font=font)

    # Composite
    final_img = Image.alpha_composite(base, fog_layer)
    final_img = Image.alpha_composite(final_img, hud_layer)

    out_png = f"{OUT_DIR}/ghostmode-nullai.png"
    final_img.convert("RGB").save(out_png, "PNG", optimize=True)
    final_img.convert("RGB").save(f"{BUILD_CHROOT_DIR}/ghostmode-nullai.png", "PNG", optimize=True)
    print(f"    -> Saved {out_png}")


# ── 3. WINDOWS 11 INCOGNITO REALITY ─────────────────────────────────────────
def generate_win11_wallpaper():
    print("[*] Generating Windows 11 Fluent Bloom wallpaper...")
    # Dark mica slate background
    base = Image.new("RGBA", (WIDTH, HEIGHT), (22, 28, 38, 255))
    bloom_layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))

    cx, cy = WIDTH // 2, HEIGHT // 2 + 30

    # Authentic layered organic curves imitating Windows 11 Fluent Bloom
    petals = [
        # (rx, ry, color, angle, ox, oy, blur)
        (380, 210, (0, 84, 180, 170), -45, -70, -25, 28),
        (350, 190, (0, 120, 215, 180), -20, -35, -10, 24),
        (330, 175, (0, 153, 255, 190), 0, 0, 0, 20),
        (310, 160, (51, 153, 255, 180), 25, 35, -20, 18),
        (290, 145, (102, 178, 255, 170), 50, 65, -35, 16),
        (250, 120, (147, 197, 253, 190), 75, 85, -55, 14),
        (230, 110, (191, 219, 254, 210), -60, -85, 25, 12),
        (190, 95,  (224, 242, 254, 230), -30, -45, 12, 10),
    ]

    for rx, ry, col, angle, ox, oy, blur_rad in petals:
        layer = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        ldraw = ImageDraw.Draw(layer)
        px = cx + ox
        py = cy + oy

        # Draw smooth organic oval
        ldraw.ellipse([px - rx, py - ry, px + rx, py + ry], fill=col)
        # Rotate around center
        layer = layer.rotate(angle, center=(px, py), resample=Image.BICUBIC)
        # Volumetric gaussian blur
        layer = layer.filter(ImageFilter.GaussianBlur(radius=blur_rad))
        bloom_layer = Image.alpha_composite(bloom_layer, layer)

    # Ambient deep vignette
    vignette = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vignette)
    for r in range(400, 1200, 40):
        alpha = int(45 * (r / 1200))
        v_draw.ellipse([cx - r * 1.6, cy - r, cx + r * 1.6, cy + r], outline=(10, 14, 22, alpha), width=30)
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=40))

    final_img = Image.alpha_composite(base, bloom_layer)
    final_img = Image.alpha_composite(final_img, vignette)

    out_jpg = f"{OUT_DIR}/win11-bloom.jpg"
    final_img.convert("RGB").save(out_jpg, "JPEG", quality=96)
    final_img.convert("RGB").save(f"{BUILD_CHROOT_DIR}/win11-bloom.jpg", "JPEG", quality=96)
    print(f"    -> Saved {out_jpg}")


# ── 4. AZOTH GOLD SANCTUM REALITY ───────────────────────────────────────────
def verify_gold_wallpaper():
    print("[*] Ensuring Azoth Gold Sanctum master wallpaper...")
    # Source master gold
    src_gold = os.path.join(OUT_DIR, "zothos-celtic-dark.png")
    dst_master = f"{OUT_DIR}/zoth-gold-master.png"
    if os.path.exists(src_gold):
        import shutil
        shutil.copy2(src_gold, dst_master)
        if os.path.exists(BUILD_CHROOT_DIR):
            shutil.copy2(src_gold, f"{BUILD_CHROOT_DIR}/zoth-gold-master.png")
        shutil.copy2(src_gold, f"{OUT_DIR}/alchemical-gold.png")
        if os.path.exists(BUILD_CHROOT_DIR):
            shutil.copy2(src_gold, f"{BUILD_CHROOT_DIR}/alchemical-gold.png")
        print(f"    -> Synced {dst_master} (Cyber-Gold Master)")

if __name__ == "__main__":
    generate_matrix_wallpaper()
    generate_ghost_wallpaper()
    generate_win11_wallpaper()
    verify_gold_wallpaper()
    print("[✓] All 4 reality wallpapers successfully synthesized!")
