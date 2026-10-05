#!/usr/bin/env python3
"""
⚡ Export ZothOS Intro Assets for Plymouth Boot Splash Theme
Extracts high-resolution assets from zoth-gold-master.jpg and generates:
- bg.png: Inpainted obsidian vignette background plate
- letter_z.png, letter_o1.png, letter_t.png, letter_h.png, letter_o2.png, letter_s.png
- sheen.png: Caustic specular light sweep beam
- subtitle.png: 24K Gold & Alchemical subtitle
- glow.png: Ambient warm golden bloom
"""

import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
WALLPAPER_PATH = os.path.join(ROOT_DIR, "config/includes.chroot/usr/share/backgrounds/zothos/zoth-gold-master.jpg")
THEME_DESTS = [
    os.path.join(ROOT_DIR, "config/includes.chroot/usr/share/plymouth/themes/zothos")
]

def main():
    print("[-] Loading wallpaper...")
    orig = cv2.imread(WALLPAPER_PATH)
    h, w, _ = orig.shape
    gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
    
    # 1. Background plate
    print("[-] Generating clean background plate...")
    text_roi = (gray > 18).astype(np.uint8) * 255
    roi_mask = np.zeros_like(text_roi)
    roi_mask[480:1060, 260:2500] = 255
    text_roi = cv2.bitwise_and(text_roi, roi_mask)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
    text_roi_dilated = cv2.dilate(text_roi, kernel, iterations=2)
    inpainted = cv2.inpaint(orig, text_roi_dilated, inpaintRadius=29, flags=cv2.INPAINT_TELEA)
    blur = cv2.GaussianBlur(inpainted, (55, 55), 0)
    bg = inpainted.copy()
    bg[text_roi_dilated > 0] = blur[text_roi_dilated > 0]
    
    # Resize bg to 1920x1080 for Plymouth
    bg_1080 = cv2.resize(bg, (1920, 1080), interpolation=cv2.INTER_LANCZOS4)
    
    # 2. Extract Letters
    print("[-] Extracting letters...")
    diff = cv2.absdiff(orig, bg)
    gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    boxes = [
        ("letter_z.png", 295, 530, 645, 1015),
        ("letter_o1.png", 645, 520, 1035, 1015),
        ("letter_t.png", 1035, 530, 1365, 1015),
        ("letter_h.png", 1365, 530, 1755, 1015),
        ("letter_o2.png", 1755, 520, 2155, 1015),
        ("letter_s.png", 2155, 520, 2465, 1015)
    ]
    
    letter_images = {}
    for filename, x1, y1, x2, y2 in boxes:
        sub_orig = orig[y1:y2, x1:x2]
        sub_diff = gray_diff[y1:y2, x1:x2]
        
        alpha = np.clip((sub_diff.astype(np.float32) - 5) / 20.0, 0.0, 1.0)
        alpha = np.where(sub_diff > 25, 1.0, alpha)
        alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
        
        rgba = cv2.cvtColor(sub_orig, cv2.COLOR_BGR2BGRA)
        rgba[:, :, 3] = (alpha * 255).astype(np.uint8)
        
        # Scale to match ~1080p reference width (scale factor ~0.7)
        tw = int((x2 - x1) * 0.70)
        th = int((y2 - y1) * 0.70)
        rgba_scaled = cv2.resize(rgba, (tw, th), interpolation=cv2.INTER_LANCZOS4)
        letter_images[filename] = rgba_scaled
        
    # 3. Sheen beam (tilted 25 deg specular gradient)
    print("[-] Generating specular sheen beam...")
    sw, sh = 200, 360
    sheen_rgba = np.zeros((sh, sw, 4), dtype=np.uint8)
    for y in range(sh):
        for x in range(sw):
            # slanted coordinate
            diag_x = x - (y - sh/2) * -0.45
            p = (diag_x - sw/2) / (sw * 0.35)
            if -3.0 < p < 3.0:
                intensity = math.exp(-p * p)
                a = int(255 * intensity * 0.85)
                # Gold-white beam
                sheen_rgba[y, x] = [255, 235, 180, a]
                
    # 4. Golden Subtitle Plate
    print("[-] Generating subtitle plate...")
    sub_canvas = Image.new("RGBA", (1000, 140), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sub_canvas)
    try:
        font_main = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", 26)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 14)
    except:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    main_text = "S O V E R E I G N   I N T E L L I G E N C E   O S"
    mbound = draw.textbbox((0, 0), main_text, font=font_main)
    tw = mbound[2] - mbound[0]
    th = mbound[3] - mbound[1]
    mx = (1000 - tw) // 2
    my = 22
    
    # Golden glow shadow
    for ox in [-1, 0, 1]:
        for oy in [-1, 0, 1]:
            draw.text((mx + ox, my + oy), main_text, font=font_main, fill=(255, 215, 0, 90))
    draw.text((mx, my), main_text, font=font_main, fill=(255, 230, 160, 245))

    # Vector 4-pointed stars with celestial wings
    def draw_star(cx, cy, r_out, r_in):
        pts = []
        for i in range(8):
            ang = i * (math.pi / 4)
            r = r_out if i % 2 == 0 else r_in
            pts.append((cx + r * math.sin(ang), cy - r * math.cos(ang)))
        for ox in [-1, 0, 1]:
            for oy in [-1, 0, 1]:
                gpts = [(px + ox, py + oy) for px, py in pts]
                draw.polygon(gpts, fill=(255, 215, 0, 80))
        draw.polygon(pts, fill=(255, 230, 160, 255))
        draw.line([(cx - 38, cy), (cx - 16, cy)], fill=(255, 215, 0, 160), width=1)
        draw.line([(cx + 16, cy), (cx + 38, cy)], fill=(255, 215, 0, 160), width=1)

    star_y = my + th // 2
    draw_star(mx - 65, star_y, 11, 3.5)
    draw_star(mx + tw + 65, star_y, 11, 3.5)
    
    sub_text = "ALCHEMICAL INTELLIGENCE · CRYPTOGRAPHIC VAULT · OFFENSIVE SECURITY"
    sbound = draw.textbbox((0, 0), sub_text, font=font_sub)
    sx = (1000 - (sbound[2] - sbound[0])) // 2
    sy = my + (mbound[3] - mbound[1]) + 20
    draw.text((sx, sy), sub_text, font=font_sub, fill=(180, 210, 220, 190))
    
    sub_rgba = cv2.cvtColor(np.array(sub_canvas), cv2.COLOR_RGBA2BGRA)
    
    # 5. Ambient Gold Bloom
    print("[-] Generating ambient golden bloom...")
    gw = 600
    glow_rgba = np.zeros((gw, gw, 4), dtype=np.uint8)
    for y in range(gw):
        for x in range(gw):
            dist = math.sqrt((x - gw/2)**2 + (y - gw/2)**2) / (gw * 0.45)
            if dist < 1.0:
                val = math.cos(dist * math.pi / 2)**2
                a = int(val * 90)
                glow_rgba[y, x] = [50, 180, 255, a] # BGR gold
                
    # Save to all target theme directories
    for d in THEME_DESTS:
        print(f"[-] Writing assets to {d}...")
        os.makedirs(d, exist_ok=True)
        cv2.imwrite(os.path.join(d, "bg.png"), bg_1080)
        cv2.imwrite(os.path.join(d, "sheen.png"), sheen_rgba)
        cv2.imwrite(os.path.join(d, "subtitle.png"), sub_rgba)
        cv2.imwrite(os.path.join(d, "glow.png"), glow_rgba)
        for fname, img in letter_images.items():
            cv2.imwrite(os.path.join(d, fname), img)
            
    print("[✓] All Plymouth intro assets exported successfully!")

if __name__ == "__main__":
    main()
