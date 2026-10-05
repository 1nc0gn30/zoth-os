#!/usr/bin/env python3
"""
⚡ ZothOS Cinematic Intro & Boot Animation Generator
Renders a 60 FPS ultra-high-definition cinematic intro video from the ZothOS wallpaper.
Features:
- Individual letter extraction and micro-scaled fade-in (Z - O - T - H - O - S)
- Additive golden & platinum specular blooms
- Cinematic caustic specular sheen sweeping across the metallic bevels
- Floating golden ambient dust/ember particles
- Alchemical subtitle materialization
- Direct FFmpeg streaming (zero intermediate frame disk bloat)
"""

import os
import sys
import math
import subprocess
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
WALLPAPER_PATH = os.path.join(ROOT_DIR, "config/includes.chroot/usr/share/backgrounds/zothos/zoth-gold-master.jpg")
OUTPUT_DIR = os.path.join(ROOT_DIR, "assets/video")

def create_background_plate(orig):
    """Inpaint text region from original wallpaper to create pristine obsidian vignette."""
    h, w, _ = orig.shape
    gray = cv2.cvtColor(orig, cv2.COLOR_BGR2GRAY)
    
    # Mask text region (x=280..2480, y=500..1040 where gray > 18)
    text_roi = (gray > 18).astype(np.uint8) * 255
    roi_mask = np.zeros_like(text_roi)
    roi_mask[480:1060, 260:2500] = 255
    text_roi = cv2.bitwise_and(text_roi, roi_mask)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
    text_roi_dilated = cv2.dilate(text_roi, kernel, iterations=2)
    
    inpainted = cv2.inpaint(orig, text_roi_dilated, inpaintRadius=29, flags=cv2.INPAINT_TELEA)
    # Smooth the inpaint area
    blur = cv2.GaussianBlur(inpainted, (55, 55), 0)
    bg = inpainted.copy()
    bg[text_roi_dilated > 0] = blur[text_roi_dilated > 0]
    return bg

def extract_letters(orig, bg):
    """Extract individual letters with antialiased alpha channels."""
    diff = cv2.absdiff(orig, bg)
    gray_diff = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
    
    boxes = [
        ("Z", 295, 530, 645, 1015, "gold"),
        ("O1", 645, 520, 1035, 1015, "gold"),
        ("T", 1035, 530, 1365, 1015, "gold"),
        ("H", 1365, 530, 1755, 1015, "gold"),
        ("O2", 1755, 520, 2155, 1015, "silver"),
        ("S", 2155, 520, 2465, 1015, "silver")
    ]
    
    letters = []
    for name, x1, y1, x2, y2, metal in boxes:
        sub_orig = orig[y1:y2, x1:x2]
        sub_diff = gray_diff[y1:y2, x1:x2]
        
        # Smooth alpha
        alpha = np.clip((sub_diff.astype(np.float32) - 5) / 20.0, 0.0, 1.0)
        alpha = np.where(sub_diff > 25, 1.0, alpha)
        alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
        
        # Precompute bloom layer
        # Blur the letter color weighted by alpha
        color_bgr = sub_orig.astype(np.float32)
        bloom_small = cv2.GaussianBlur(color_bgr * alpha[:, :, None], (35, 35), 0)
        bloom_large = cv2.GaussianBlur(color_bgr * alpha[:, :, None], (85, 85), 0)
        
        if metal == "gold":
            tint = np.array([0.2, 0.75, 1.0], dtype=np.float32) # BGR gold
        else:
            tint = np.array([1.0, 0.95, 0.9], dtype=np.float32) # BGR silver/platinum
            
        bloom = (bloom_small * 0.7 + bloom_large * 0.5) * tint
        
        letters.append({
            "name": name,
            "x1": x1, "y1": y1, "x2": x2, "y2": y2,
            "w": x2 - x1, "h": y2 - y1,
            "orig_bgr": sub_orig.astype(np.float32),
            "alpha": alpha[:, :, None],
            "bloom": bloom,
            "metal": metal
        })
    return letters

def render_subtitle(target_w, target_h, scale_factor):
    """Render high-res subtitle image."""
    sub_canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sub_canvas)
    
    font_size = int(28 * scale_factor)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", font_size)
    except:
        font = ImageFont.load_default()
        
    text = "S O V E R E I G N   I N T E L L I G E N C E   O S"
    
    # Text bounding
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    tx = (target_w - tw) // 2
    ty = int(target_h * 0.72)
    
    # Golden glow
    glow_color = (255, 215, 0, 80)
    for ox in [-2, 0, 2]:
        for oy in [-2, 0, 2]:
            draw.text((tx + ox, ty + oy), text, font=font, fill=glow_color)
            
    # Sharp gold foreground
    draw.text((tx, ty), text, font=font, fill=(250, 225, 150, 240))

    # Vector 4-pointed celestial diamond stars
    star_y = ty + th // 2
    r_out = int(12 * scale_factor)
    r_in = int(3.8 * scale_factor)
    wing = int(40 * scale_factor)
    gap = int(60 * scale_factor)

    def draw_star(cx, cy):
        pts = []
        for i in range(8):
            ang = i * (math.pi / 4)
            r = r_out if i % 2 == 0 else r_in
            pts.append((cx + r * math.sin(ang), cy - r * math.cos(ang)))
        for ox in [-2, 0, 2]:
            for oy in [-2, 0, 2]:
                gpts = [(px + ox, py + oy) for px, py in pts]
                draw.polygon(gpts, fill=(255, 215, 0, 80))
        draw.polygon(pts, fill=(250, 225, 150, 255))
        draw.line([(cx - wing, cy), (cx - r_out - 4, cy)], fill=(255, 215, 0, 160), width=1)
        draw.line([(cx + r_out + 4, cy), (cx + wing, cy)], fill=(255, 215, 0, 160), width=1)

    draw_star(tx - gap, star_y)
    draw_star(tx + tw + gap, star_y)
    
    # Sub-tagline
    sub_font_size = int(14 * scale_factor)
    try:
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", sub_font_size)
    except:
        sub_font = ImageFont.load_default()
        
    sub_text = "ALCHEMICAL INTELLIGENCE · CRYPTOGRAPHIC VAULT · OFFENSIVE SECURITY"
    sbbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    stx = (target_w - (sbbox[2] - sbbox[0])) // 2
    sty = ty + th + int(16 * scale_factor)
    draw.text((stx, sty), sub_text, font=sub_font, fill=(180, 200, 210, 180))
    
    # Convert PIL RGBA to OpenCV BGRA
    sub_np = np.array(sub_canvas)
    sub_bgr = cv2.cvtColor(sub_np, cv2.COLOR_RGBA2BGR).astype(np.float32)
    sub_a = (sub_np[:, :, 3].astype(np.float32) / 255.0)[:, :, None]
    return sub_bgr, sub_a

def ease_out_cubic(t):
    return 1.0 - math.pow(1.0 - t, 3)

def ease_in_out_quad(t):
    return 2 * t * t if t < 0.5 else 1 - math.pow(-2 * t + 2, 2) / 2

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("[-] Reading master wallpaper...")
    orig = cv2.imread(WALLPAPER_PATH)
    if orig is None:
        print(f"[!] Error: cannot load {WALLPAPER_PATH}")
        sys.exit(1)
        
    orig_h, orig_w, _ = orig.shape
    print(f"[-] Native resolution: {orig_w}x{orig_h}")
    
    print("[-] Generating clean obsidian background plate...")
    bg_orig = create_background_plate(orig)
    
    print("[-] Extracting isolated letters with 24K gold & silver alphas...")
    letters = extract_letters(orig, bg_orig)
    
    # Render specifications
    # 1080p @ 60fps
    W, H = 1920, 1080
    FPS = 60
    DURATION_SEC = 6.8
    TOTAL_FRAMES = int(FPS * DURATION_SEC)
    
    print(f"[-] Target video: {W}x{H} @ {FPS}fps, total {TOTAL_FRAMES} frames ({DURATION_SEC:.1f}s)")
    
    # Scale base background and letters to 1080p
    scale = W / orig_w  # ~0.6976
    bg = cv2.resize(bg_orig, (W, H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    
    scaled_letters = []
    for l in letters:
        sw = int(l["w"] * scale)
        sh = int(l["h"] * scale)
        sx1 = int(l["x1"] * scale)
        sy1 = int(l["y1"] * scale)
        
        l_bgr = cv2.resize(l["orig_bgr"], (sw, sh), interpolation=cv2.INTER_LANCZOS4)
        l_a = cv2.resize(l["alpha"], (sw, sh), interpolation=cv2.INTER_LANCZOS4)[:, :, None]
        l_bloom = cv2.resize(l["bloom"], (sw, sh), interpolation=cv2.INTER_LANCZOS4)
        
        scaled_letters.append({
            "name": l["name"],
            "x": sx1, "y": sy1, "w": sw, "h": sh,
            "bgr": l_bgr, "alpha": l_a, "bloom": l_bloom,
            "metal": l["metal"]
        })
        
    sub_bgr, sub_a = render_subtitle(W, H, scale)
    
    # Ambient floating particles
    np.random.seed(42)
    NUM_PARTICLES = 45
    particles = []
    for i in range(NUM_PARTICLES):
        particles.append({
            "x": np.random.uniform(0.1 * W, 0.9 * W),
            "y": np.random.uniform(0.2 * H, 0.95 * H),
            "vy": np.random.uniform(0.3, 0.9), # drifting upwards
            "vx": np.random.uniform(-0.15, 0.15),
            "size": np.random.uniform(1.2, 3.2),
            "alpha": np.random.uniform(0.2, 0.6),
            "seed": np.random.uniform(0, 2 * math.pi)
        })
        
    # Letter entrance timings (frame indices at 60fps)
    # Staggered entrances
    LETTER_DUR = 32 # frames each letter takes to fade in (~0.53s)
    # Starts: Z at 35, O1 at 55, T at 75, H at 95, O2 at 115, S at 135
    start_frames = [35, 56, 77, 98, 119, 140]
    
    # Specular sweep timing: frame 190 to 260
    SWEEP_START = 185
    SWEEP_END = 265
    
    # Subtitle fade timing: frame 230 to 285
    SUB_START = 225
    SUB_END = 280
    
    output_mp4 = os.path.join(OUTPUT_DIR, "zothos-intro-1080p60.mp4")
    
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{W}x{H}",
        "-pix_fmt", "bgr24",
        "-r", str(FPS),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "16",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output_mp4
    ]
    
    print("[-] Launching FFmpeg encoder process...")
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)
    
    print("[-] Rendering cinematic frames...")
    
    # Pre-render sheen gradient mask
    sheen_w = int(220 * scale)
    sheen_profile = np.zeros((1, sheen_w), dtype=np.float32)
    for sx in range(sheen_w):
        # Bell curve with sharp leading peak
        p = sx / sheen_w
        sheen_profile[0, sx] = math.exp(-pow((p - 0.5) / 0.22, 2))
        
    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS
        canvas = bg.copy()
        
        # 1. Ambient breathing center glow
        pulse = math.sin(t * 1.8) * 0.08
        if pulse > 0:
            canvas = np.clip(canvas * (1.0 + pulse * 0.15), 0, 255)
            
        # 2. Render floating particles
        for p in particles:
            py = (p["y"] - frame_idx * p["vy"]) % (H * 0.85) + H * 0.1
            px = p["x"] + math.sin(t * 1.5 + p["seed"]) * 18
            p_twinkle = p["alpha"] * (0.6 + 0.4 * math.sin(t * 3.0 + p["seed"]))
            
            # Draw small gold particle
            ix, iy = int(px), int(py)
            ir = max(1, int(p["size"]))
            if 0 <= ix < W and 0 <= iy < H:
                # Additive gold dot
                cv2.circle(canvas, (ix, iy), ir, (40, 160, 240), -1, cv2.LINE_AA)
                
        # 3. Composite each letter based on its animation phase
        for idx, l in enumerate(scaled_letters):
            sf = start_frames[idx]
            if frame_idx < sf:
                continue
            
            # Progress 0.0 to 1.0
            lp = min(1.0, (frame_idx - sf) / LETTER_DUR)
            e_lp = ease_out_cubic(lp)
            
            # Letter alpha
            cur_alpha = e_lp * l["alpha"]
            
            # Soft bloom during entrance
            bloom_peak = math.sin(e_lp * math.pi) # peaks at 50%
            
            x1, y1 = l["x"], l["y"]
            w, h = l["w"], l["h"]
            x2, y2 = x1 + w, y1 + h
            
            # Destination slice
            target_slice = canvas[y1:y2, x1:x2]
            
            # Blend letter over background
            blended = target_slice * (1.0 - cur_alpha) + l["bgr"] * cur_alpha
            
            # Additive bloom flash during entrance
            if bloom_peak > 0.01:
                blended += l["bloom"] * (bloom_peak * 0.45)
                
            canvas[y1:y2, x1:x2] = blended
            
        # 4. Specular caustic gleam sweep across the letters
        if SWEEP_START <= frame_idx <= SWEEP_END:
            sweep_p = (frame_idx - SWEEP_START) / (SWEEP_END - SWEEP_START)
            # Travel from left of Z to right of S
            sweep_x = int(scaled_letters[0]["x"] - 100 + sweep_p * (scaled_letters[-1]["x"] + scaled_letters[-1]["w"] - scaled_letters[0]["x"] + 200))
            
            # Apply sheen across all letters where they are active
            for l in scaled_letters:
                x1, y1 = l["x"], l["y"]
                w, h = l["w"], l["h"]
                x2, y2 = x1 + w, y1 + h
                
                # Check overlap of sweep_x with [x1, x2]
                # Light beam is tilted by 25 degrees (dy/dx ~ -0.45)
                for row in range(h):
                    row_y = y1 + row
                    offset_x = int((row - h / 2) * -0.45)
                    beam_center = sweep_x + offset_x
                    
                    col_start = max(x1, beam_center - sheen_w // 2)
                    col_end = min(x2, beam_center + sheen_w // 2)
                    if col_start < col_end:
                        sub_w = col_end - col_start
                        profile_start = col_start - (beam_center - sheen_w // 2)
                        sub_prof = sheen_profile[0, profile_start:profile_start + sub_w]
                        
                        # Add sheen weighted by letter alpha
                        letter_a_row = l["alpha"][row, (col_start - x1):(col_end - x1), 0]
                        sheen_intensity = sub_prof * letter_a_row * 140.0
                        
                        if l["metal"] == "gold":
                            sheen_color = np.array([0.3, 0.85, 1.0], dtype=np.float32)
                        else:
                            sheen_color = np.array([1.0, 1.0, 1.0], dtype=np.float32)
                            
                        canvas[row_y, col_start:col_end] += sheen_intensity[:, None] * sheen_color
                        
        # 5. Subtitle fade in
        if frame_idx >= SUB_START:
            sub_p = min(1.0, (frame_idx - SUB_START) / (SUB_END - SUB_START))
            e_sub = ease_in_out_quad(sub_p)
            cur_sub_a = sub_a * e_sub
            canvas = canvas * (1.0 - cur_sub_a) + sub_bgr * cur_sub_a
            
        # Final clip and write to ffmpeg
        frame_bgr = np.clip(canvas, 0, 255).astype(np.uint8)
        proc.stdin.write(frame_bgr.tobytes())
        
        if frame_idx % 60 == 0:
            print(f"[-] Rendered frame {frame_idx}/{TOTAL_FRAMES} ({(frame_idx/TOTAL_FRAMES)*100:.1f}%)")
            
    proc.stdin.close()
    proc.wait()
    print(f"[✓] Successfully generated video: {output_mp4}")
    
    # Also generate a high-res GIF preview and WebM
    gif_preview = os.path.join(OUTPUT_DIR, "zothos-intro-preview.gif")
    webm_preview = os.path.join(OUTPUT_DIR, "zothos-intro-1080p.webm")
    print(f"[-] Generating WebM and GIF previews...")
    
    # 30fps optimized preview gif (scale to 640x360)
    subprocess.run([
        "ffmpeg", "-y", "-i", output_mp4,
        "-vf", "fps=24,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
        "-t", "6.8",
        gif_preview
    ], check=True)
    
    subprocess.run([
        "ffmpeg", "-y", "-i", output_mp4,
        "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "28",
        webm_preview
    ], check=True)
    
    print("[✓] All formats rendered successfully!")

if __name__ == "__main__":
    main()
