"""Print-Ready High-Resolution Canvas Generator (300 DPI Transparent PNG).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Generates master print-ready assets and preview canvases across all 5 Etsy cadres:
- Apparel: 4500x5400 px at 300 DPI (Direct-to-Garment print standard)
- Mugs: 2000x2000 px / 2700x1200 px at 300 DPI (Ceramic sublimation standard)
- Totes: 3600x3600 px at 300 DPI (Heavy canvas screen-print standard)
- Wall Art: 4500x6000 px at 300 DPI (Archival 3:4 / 4:5 ratio standard)
- Crafting: 3600x3600 px at 300 DPI (Precision quilting & stitch blueprint)
"""

from __future__ import annotations

import base64
import io
import math
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageFont


# Font resolver helper with graceful fallbacks
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]

def load_font(size: int, bold: bool = False, italic: bool = False) -> ImageFont.ImageFont:
    """Load system TTF font with fallback to PIL default font."""
    pref = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
    if italic and bold:
        pref = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-BoldItalic.ttf"
    elif italic:
        pref = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"

    for path in [pref] + FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


# Curated Cottagecore & Vintage Color Palettes
PALETTE = {
    # Florals
    "sage": (138, 154, 134, 255),
    "deep_sage": (88, 110, 85, 255),
    "blush": (224, 172, 170, 255),
    "dusty_rose": (196, 128, 133, 255),
    "poppy_red": (212, 82, 70, 255),
    "lavender": (168, 153, 194, 255),
    "buttercup": (238, 204, 112, 255),
    "cornflower": (118, 152, 196, 255),
    "terracotta": (196, 112, 88, 255),
    "cream": (248, 245, 236, 255),
    "dark_bark": (58, 48, 40, 255),
    "sepia_ink": (74, 58, 48, 255),
    "gold_amber": (212, 160, 48, 255),
    # Birds
    "cardinal_red": (208, 46, 42, 255),
    "bluebird_cerulean": (72, 132, 198, 255),
    "chickadee_cap": (38, 38, 42, 255),
    "goldfinch_yellow": (244, 202, 38, 255),
}


@dataclass
class CanvasConfig:
    cadre: str
    width: int
    height: int
    dpi: int = 300
    title_text: str = ""
    subtitle_text: str = ""
    custom_names: List[str] = None
    color_scheme: str = "vintage_botanical"
    is_preview: bool = False

    @classmethod
    def default_for_cadre(cls, cadre: str, preview: bool = False) -> CanvasConfig:
        cadre_norm = cadre.lower()
        scale = 0.2 if preview else 1.0

        if cadre_norm == "apparel":
            return cls(
                cadre="apparel",
                width=int(4500 * scale),
                height=int(5400 * scale),
                title_text="GRANDMA'S GARDEN",
                subtitle_text="Where Love Blooms & Family Grows",
                custom_names=["Emma", "Liam", "Olivia", "Noah", "Harper"],
                is_preview=preview,
            )
        elif cadre_norm == "mugs":
            return cls(
                cadre="mugs",
                width=int(2000 * scale),
                height=int(2000 * scale),
                title_text="Tea & Tranquility",
                subtitle_text="Cozy Songbirds of the Hearth",
                custom_names=[],
                is_preview=preview,
            )
        elif cadre_norm == "totes":
            return cls(
                cadre="totes",
                width=int(3600 * scale),
                height=int(3600 * scale),
                title_text="FLEURS SAUVAGES",
                subtitle_text="Graines de Provence • Récolte 1894",
                custom_names=[],
                is_preview=preview,
            )
        elif cadre_norm == "wall_art":
            return cls(
                cadre="wall_art",
                width=int(4500 * scale),
                height=int(6000 * scale),
                title_text="BOTANICA VINTAGE",
                subtitle_text="English Countryside Wildflower Study • Plate No. 12",
                custom_names=[],
                is_preview=preview,
            )
        elif cadre_norm == "crafting":
            return cls(
                cadre="crafting",
                width=int(3600 * scale),
                height=int(3600 * scale),
                title_text="TRADITIONAL BARN STAR",
                subtitle_text="Heirloom Quilt Block Blueprint • 24\" Center Star",
                custom_names=[],
                is_preview=preview,
            )
        else:
            return cls.default_for_cadre("apparel", preview=preview)


class CanvasGenerator:
    """Generates print-ready high-resolution transparent PNG canvases."""

    def __init__(self, config: Optional[CanvasConfig] = None):
        self.config = config or CanvasConfig.default_for_cadre("apparel", preview=True)

    def generate(self) -> Image.Image:
        """Render the complete canvas based on cadre configuration."""
        cfg = self.config
        cadre = cfg.cadre.lower()

        if cadre == "apparel":
            return self._render_apparel_canvas()
        elif cadre == "mugs":
            return self._render_mug_canvas()
        elif cadre == "totes":
            return self._render_tote_canvas()
        elif cadre == "wall_art":
            return self._render_wall_art_canvas()
        elif cadre == "crafting":
            return self._render_crafting_canvas()
        else:
            return self._render_apparel_canvas()

    def generate_bytes(self, format: str = "PNG") -> bytes:
        """Render canvas and return raw file bytes with DPI metadata."""
        img = self.generate()
        buf = io.BytesIO()
        img.save(buf, format=format, dpi=(self.config.dpi, self.config.dpi), optimize=True)
        return buf.getvalue()

    def generate_base64(self) -> str:
        """Render canvas and return Base64 data URI string."""
        raw = self.generate_bytes()
        b64 = base64.b64encode(raw).decode("utf-8")
        return f"data:image/png;base64,{b64}"

    # -------------------------------------------------------------------------
    # Cadre 1: "Grandma's Garden" Floral Apparel Canvas
    # -------------------------------------------------------------------------
    def _render_apparel_canvas(self) -> Image.Image:
        w, h = self.config.width, self.config.height
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)

        center_x = w // 2
        names = self.config.custom_names or ["Emma", "Liam", "Olivia", "Noah"]

        # 1. Botanical Stems & Wildflower Bouquet
        num_flowers = max(3, min(len(names), 7))
        stem_start_y = int(h * 0.76)
        flower_center_y = int(h * 0.54)
        spread_x = int(w * 0.68)
        left_x = center_x - spread_x // 2

        # Draw decorative tied ribbon at base
        ribbon_color = PALETTE["dusty_rose"]
        tie_y = stem_start_y - int(h * 0.04)
        draw.ellipse([center_x - int(w*0.04), tie_y - int(h*0.015), center_x + int(w*0.04), tie_y + int(h*0.015)], fill=ribbon_color)
        draw.line([center_x, tie_y, center_x - int(w*0.05), tie_y + int(h*0.06)], fill=ribbon_color, width=max(4, int(w*0.005)))
        draw.line([center_x, tie_y, center_x + int(w*0.05), tie_y + int(h*0.06)], fill=ribbon_color, width=max(4, int(w*0.005)))

        flower_types = [
            ("Poppy", PALETTE["poppy_red"]),
            ("Sweet Pea", PALETTE["lavender"]),
            ("Daisy", PALETTE["cream"]),
            ("Larkspur", PALETTE["cornflower"]),
            ("Buttercup", PALETTE["buttercup"]),
            ("Rose", PALETTE["blush"]),
            ("Bluebell", PALETTE["cornflower"]),
        ]

        # Draw stems gathering at tie point
        for i in range(num_flowers):
            fx = left_x + int(i * (spread_x / (num_flowers - 1 if num_flowers > 1 else 1)))
            fy = flower_center_y + int(math.sin(i * 1.3) * (h * 0.05))

            # Curved stem
            stem_color = PALETTE["deep_sage"]
            ctrl_x = center_x + int((fx - center_x) * 0.4)
            ctrl_y = (fy + tie_y) // 2

            # Approximate curve with segments
            points = []
            for t_step in range(16):
                t = t_step / 15.0
                px = (1-t)**2 * fx + 2*(1-t)*t * ctrl_x + t**2 * center_x
                py = (1-t)**2 * fy + 2*(1-t)*t * ctrl_y + t**2 * tie_y
                points.append((px, py))
            draw.line(points, fill=stem_color, width=max(3, int(w * 0.003)))

            # Draw gentle sage leaves along stem
            mid_idx = 7
            lx, ly = points[mid_idx]
            leaf_w = int(w * 0.025)
            leaf_h = int(h * 0.018)
            draw.ellipse([lx - leaf_w, ly - leaf_h, lx + leaf_w, ly + leaf_h], fill=PALETTE["sage"])

            # Draw flower bloom
            ftype, fcolor = flower_types[i % len(flower_types)]
            bloom_radius = int(w * 0.048)
            self._draw_watercolor_bloom(draw, fx, fy, bloom_radius, fcolor)

            # Name tag under or above stem
            name = names[i % len(names)]
            font_name = load_font(size=max(18, int(w * 0.024)), italic=True)
            self._draw_centered_text(draw, name, fx, fy + bloom_radius + int(h * 0.018), font_name, PALETTE["sepia_ink"])

        # 2. Arching Top Headline: "GRANDMA'S GARDEN"
        title_font = load_font(size=max(32, int(w * 0.065)), bold=True)
        title_text = self.config.title_text or "GRANDMA'S GARDEN"
        self._draw_centered_text(draw, title_text, center_x, int(h * 0.22), title_font, PALETTE["dark_bark"])

        # 3. Delicate Subtitle Script: "Where Love Blooms"
        sub_font = load_font(size=max(20, int(w * 0.032)), italic=True)
        sub_text = self.config.subtitle_text or "Where Love Blooms & Family Grows"
        self._draw_centered_text(draw, sub_text, center_x, int(h * 0.29), sub_font, PALETTE["dusty_rose"])

        # 4. Subtle decorative flourish lines
        flourish_y = int(h * 0.32)
        flourish_w = int(w * 0.28)
        draw.line([center_x - flourish_w, flourish_y, center_x - int(w*0.04), flourish_y], fill=PALETTE["sage"], width=max(2, int(w * 0.002)))
        draw.line([center_x + int(w*0.04), flourish_y, center_x + flourish_w, flourish_y], fill=PALETTE["sage"], width=max(2, int(w * 0.002)))
        draw.ellipse([center_x - int(w*0.015), flourish_y - int(w*0.015), center_x + int(w*0.015), flourish_y + int(w*0.015)], fill=PALETTE["gold_amber"])

        return canvas

    # -------------------------------------------------------------------------
    # Cadre 2: Whimsical Watercolor Animal & Bird Mugs Canvas
    # -------------------------------------------------------------------------
    def _render_mug_canvas(self) -> Image.Image:
        w, h = self.config.width, self.config.height
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)

        center_x = w // 2
        center_y = int(h * 0.50)

        # 1. Soft Circular Botanical Wreath
        wreath_radius = int(w * 0.36)
        for deg in range(0, 360, 18):
            rad = math.radians(deg)
            leaf_cx = center_x + int(wreath_radius * math.cos(rad))
            leaf_cy = center_y + int(wreath_radius * math.sin(rad))
            col = PALETTE["sage"] if deg % 36 == 0 else PALETTE["dusty_rose"]
            rad_l = int(w * 0.028)
            draw.ellipse([leaf_cx - rad_l, leaf_cy - rad_l, leaf_cx + rad_l, leaf_cy + rad_l], fill=col)

        # 2. Porcelain Teacup & Saucer in Center
        cup_y = center_y + int(h * 0.06)
        cup_w = int(w * 0.24)
        cup_h = int(h * 0.16)

        # Saucer
        saucer_w = int(cup_w * 1.5)
        saucer_h = int(cup_h * 0.28)
        draw.ellipse([center_x - saucer_w // 2, cup_y + cup_h - saucer_h // 2, center_x + saucer_w // 2, cup_y + cup_h + saucer_h // 2], fill=PALETTE["cream"])
        draw.ellipse([center_x - saucer_w // 2, cup_y + cup_h - saucer_h // 2, center_x + saucer_w // 2, cup_y + cup_h + saucer_h // 2], outline=PALETTE["gold_amber"], width=max(2, int(w*0.004)))

        # Teacup Body
        draw.chord([center_x - cup_w // 2, cup_y, center_x + cup_w // 2, cup_y + cup_h * 2], 0, 180, fill=PALETTE["cream"], outline=PALETTE["gold_amber"], width=max(2, int(w*0.004)))

        # Teacup Rim
        draw.ellipse([center_x - cup_w // 2, cup_y - int(cup_h * 0.2), center_x + cup_w // 2, cup_y + int(cup_h * 0.2)], fill=PALETTE["cream"], outline=PALETTE["gold_amber"], width=max(2, int(w*0.004)))

        # Tea Liquid inside rim
        draw.ellipse([center_x - int(cup_w*0.42), cup_y - int(cup_h*0.14), center_x + int(cup_w*0.42), cup_y + int(cup_h*0.14)], fill=PALETTE["terracotta"])

        # Teacup Handle
        handle_w = int(cup_w * 0.32)
        draw.arc([center_x + cup_w // 2 - int(handle_w*0.2), cup_y + int(cup_h*0.2), center_x + cup_w // 2 + handle_w, cup_y + int(cup_h*0.8)], 270, 90, fill=PALETTE["gold_amber"], width=max(3, int(w*0.005)))

        # 3. Fluffy Songbird (Chickadee/Cardinal) perched on rim
        bird_x = center_x - int(cup_w * 0.35)
        bird_y = cup_y - int(cup_h * 0.32)
        # Bird Body
        draw.ellipse([bird_x - int(w*0.05), bird_y - int(h*0.06), bird_x + int(w*0.05), bird_y + int(h*0.06)], fill=PALETTE["chickadee_cap"])
        # White Cheek
        draw.ellipse([bird_x - int(w*0.02), bird_y - int(h*0.04), bird_x + int(w*0.04), bird_y - int(h*0.01)], fill=PALETTE["cream"])
        # Beak
        draw.polygon([(bird_x - int(w*0.05), bird_y - int(h*0.03)), (bird_x - int(w*0.075), bird_y - int(h*0.025)), (bird_x - int(w*0.05), bird_y - int(h*0.02))], fill=PALETTE["gold_amber"])
        # Red Cardinal Companion on right rim
        bird2_x = center_x + int(cup_w * 0.36)
        bird2_y = cup_y - int(cup_h * 0.38)
        draw.ellipse([bird2_x - int(w*0.055), bird2_y - int(h*0.07), bird2_x + int(w*0.055), bird2_y + int(h*0.07)], fill=PALETTE["cardinal_red"])
        draw.polygon([(bird2_x, bird2_y - int(h*0.07)), (bird2_x + int(w*0.01), bird2_y - int(h*0.11)), (bird2_x + int(w*0.03), bird2_y - int(h*0.07))], fill=PALETTE["cardinal_red"])
        draw.polygon([(bird2_x + int(w*0.055), bird2_y - int(h*0.04)), (bird2_x + int(w*0.08), bird2_y - int(h*0.035)), (bird2_x + int(w*0.055), bird2_y - int(h*0.03))], fill=PALETTE["gold_amber"])

        # 4. Typography Header & Subtitle
        title_font = load_font(size=max(26, int(w * 0.068)), bold=True)
        title_text = self.config.title_text or "Coffee, Books & Birds"
        self._draw_centered_text(draw, title_text, center_x, int(h * 0.12), title_font, PALETTE["sepia_ink"])

        sub_font = load_font(size=max(18, int(w * 0.035)), italic=True)
        sub_text = self.config.subtitle_text or "A Cozy Hearth Collection"
        self._draw_centered_text(draw, sub_text, center_x, int(h * 0.88), sub_font, PALETTE["sage"])

        return canvas

    # -------------------------------------------------------------------------
    # Cadre 3: Vintage French Seed Packet Totes Canvas
    # -------------------------------------------------------------------------
    def _render_tote_canvas(self) -> Image.Image:
        w, h = self.config.width, self.config.height
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)

        center_x = w // 2
        center_y = h // 2

        # 1. Ornate Double Victorian Border
        margin = int(w * 0.08)
        border_box = [margin, margin, w - margin, h - margin]
        draw.rectangle(border_box, outline=PALETTE["sepia_ink"], width=max(4, int(w * 0.006)))

        inner_margin = margin + int(w * 0.02)
        draw.rectangle([inner_margin, inner_margin, w - inner_margin, h - inner_margin], outline=PALETTE["terracotta"], width=max(2, int(w * 0.003)))

        # Corner Rosettes
        corner_r = int(w * 0.022)
        corners = [
            (margin, margin),
            (w - margin, margin),
            (margin, h - margin),
            (w - margin, h - margin),
        ]
        for cx, cy in corners:
            draw.ellipse([cx - corner_r, cy - corner_r, cx + corner_r, cy + corner_r], fill=PALETTE["gold_amber"], outline=PALETTE["sepia_ink"])

        # 2. French Botanical Seed Header
        font_header_top = load_font(size=max(18, int(w * 0.032)), bold=False)
        self._draw_centered_text(draw, "GRAINES D'ÉLITE • MAISON FONDÉE EN 1894", center_x, int(h * 0.16), font_header_top, PALETTE["sepia_ink"])

        font_main = load_font(size=max(36, int(w * 0.082)), bold=True)
        title_text = self.config.title_text or "FLEURS SAUVAGES"
        self._draw_centered_text(draw, title_text, center_x, int(h * 0.24), font_main, PALETTE["dark_bark"])

        font_sub = load_font(size=max(20, int(w * 0.038)), italic=True)
        self._draw_centered_text(draw, "Lavande de Provence & Coquelicots", center_x, int(h * 0.31), font_sub, PALETTE["dusty_rose"])

        # 3. Centerpiece Botanical Engraving: Wild Poppies & Lavender
        plant_center_y = int(h * 0.54)
        for i in range(-2, 3):
            stem_x = center_x + int(i * (w * 0.08))
            draw.line([stem_x, plant_center_y - int(h * 0.14), stem_x, plant_center_y + int(h * 0.16)], fill=PALETTE["deep_sage"], width=max(3, int(w * 0.004)))
            # Bloom on top
            bloom_col = PALETTE["poppy_red"] if i % 2 == 0 else PALETTE["lavender"]
            self._draw_watercolor_bloom(draw, stem_x, plant_center_y - int(h * 0.14), int(w * 0.045), bloom_col)

        # 4. Bottom Seed Packet Stamp & Seal
        font_bottom = load_font(size=max(16, int(w * 0.028)), bold=True)
        self._draw_centered_text(draw, "QUALITÉ SUPÉRIEURE • 100% PURE SEED", center_x, int(h * 0.77), font_bottom, PALETTE["sepia_ink"])

        font_guarantee = load_font(size=max(14, int(w * 0.022)), italic=True)
        self._draw_centered_text(draw, "Récoltée aux Jardins de Provence • Poids Net 250g", center_x, int(h * 0.82), font_guarantee, PALETTE["sage"])

        return canvas

    # -------------------------------------------------------------------------
    # Cadre 4: High-Res Digital Download Wall Art Canvas
    # -------------------------------------------------------------------------
    def _render_wall_art_canvas(self) -> Image.Image:
        w, h = self.config.width, self.config.height
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)

        center_x = w // 2

        # 1. Classical Curtis's Botanical Header
        font_pub = load_font(size=max(16, int(w * 0.024)), bold=True)
        self._draw_centered_text(draw, "CURTIS'S BOTANICAL MAGAZINE", center_x, int(h * 0.08), font_pub, PALETTE["sepia_ink"])

        # Plate Number in top right
        font_plate = load_font(size=max(14, int(w * 0.020)), italic=True)
        draw.text((w - int(w * 0.22), int(h * 0.08)), "Plate No. 1,482", fill=PALETTE["sepia_ink"], font=font_plate)

        # Thin rule under header
        draw.line([int(w * 0.12), int(h * 0.11), int(w * 0.88), int(h * 0.11)], fill=PALETTE["sepia_ink"], width=max(1, int(w * 0.002)))

        # 2. Specimen Centerpiece: Detailed English Foxglove / Poppy Plant
        root_y = int(h * 0.72)
        top_y = int(h * 0.18)

        # Central tall stem
        draw.line([center_x, top_y, center_x, root_y], fill=PALETTE["deep_sage"], width=max(4, int(w * 0.005)))

        # Bell-shaped blossoms along stem (Foxglove bells)
        num_bells = 12
        for b in range(num_bells):
            prog = b / float(num_bells)
            by = top_y + int((root_y - top_y) * (0.15 + prog * 0.65))
            side = -1 if b % 2 == 0 else 1
            bx = center_x + side * int(w * (0.05 + prog * 0.04))

            bell_r = int(w * (0.025 + prog * 0.02))
            draw.ellipse([bx - bell_r, by - bell_r, bx + bell_r, by + bell_r], fill=PALETTE["dusty_rose"])
            # Tiny dots inside bell throat
            draw.point((bx, by), fill=PALETTE["poppy_red"])

        # Basal rosette leaves
        for lx in [-1, 1]:
            leaf_tip_x = center_x + lx * int(w * 0.24)
            draw.polygon([
                (center_x, root_y),
                (center_x + lx * int(w * 0.12), root_y - int(h * 0.06)),
                (leaf_tip_x, root_y - int(h * 0.02)),
                (center_x + lx * int(w * 0.14), root_y + int(h * 0.02)),
            ], fill=PALETTE["sage"])

        # 3. Botanical Binomial Title & Nomenclature
        font_latin = load_font(size=max(26, int(w * 0.048)), bold=True, italic=True)
        title_text = self.config.title_text or "Digitalis purpurea"
        self._draw_centered_text(draw, title_text, center_x, int(h * 0.82), font_latin, PALETTE["dark_bark"])

        font_common = load_font(size=max(18, int(w * 0.030)), italic=False)
        sub_text = self.config.subtitle_text or "Common English Foxglove • Scrophulariaceae"
        self._draw_centered_text(draw, sub_text, center_x, int(h * 0.87), font_common, PALETTE["sepia_ink"])

        font_bottom = load_font(size=max(13, int(w * 0.018)), italic=True)
        self._draw_centered_text(draw, "Drawn from Nature • Published by Royal Botanic Gardens", center_x, int(h * 0.92), font_bottom, PALETTE["sage"])

        return canvas

    # -------------------------------------------------------------------------
    # Cadre 5: Printable Quilting & Crafting Blueprint Canvas
    # -------------------------------------------------------------------------
    def _render_crafting_canvas(self) -> Image.Image:
        w, h = self.config.width, self.config.height
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(canvas)

        center_x = w // 2
        center_y = int(h * 0.48)

        # 1. Blueprint Grid Background
        grid_step = int(w * 0.05)
        for gx in range(0, w, grid_step):
            draw.line([gx, 0, gx, h], fill=(210, 220, 235, 120), width=1)
        for gy in range(0, h, grid_step):
            draw.line([0, gy, w, gy], fill=(210, 220, 235, 120), width=1)

        # 2. Geometric 8-Point Barn Star Centerpiece
        star_radius = int(w * 0.32)
        inner_radius = int(star_radius * 0.42)
        num_points = 8

        star_points = []
        for i in range(num_points * 2):
            angle = i * (math.pi / num_points)
            r = star_radius if i % 2 == 0 else inner_radius
            px = center_x + int(r * math.cos(angle))
            py = center_y + int(r * math.sin(angle))
            star_points.append((px, py))

        # Fill Star Diamonds with alternating calico tones
        for p in range(num_points):
            tip = star_points[p * 2]
            inner1 = star_points[(p * 2 - 1) % len(star_points)]
            inner2 = star_points[(p * 2 + 1) % len(star_points)]
            center = (center_x, center_y)

            col1 = PALETTE["dusty_rose"] if p % 2 == 0 else PALETTE["cornflower"]
            col2 = PALETTE["buttercup"] if p % 2 == 0 else PALETTE["sage"]

            draw.polygon([center, inner1, tip], fill=col1, outline=PALETTE["dark_bark"], width=max(2, int(w*0.003)))
            draw.polygon([center, tip, inner2], fill=col2, outline=PALETTE["dark_bark"], width=max(2, int(w*0.003)))

        # Center octagonal medallion
        draw.ellipse([center_x - int(w*0.035), center_y - int(w*0.035), center_x + int(w*0.035), center_y + int(w*0.035)], fill=PALETTE["cream"], outline=PALETTE["dark_bark"], width=max(2, int(w*0.003)))

        # 3. Outer Seam Allowance & Measurement Annotation Frame
        box_pad = star_radius + int(w * 0.04)
        box = [center_x - box_pad, center_y - box_pad, center_x + box_pad, center_y + box_pad]
        draw.rectangle(box, outline=PALETTE["poppy_red"], width=max(2, int(w*0.003)))

        # Dimension text markers
        font_dim = load_font(size=max(14, int(w * 0.022)), bold=True)
        draw.text((center_x - int(w*0.08), box[1] - int(h*0.035)), "← 24\" FINISHED BLOCK →", fill=PALETTE["poppy_red"], font=font_dim)
        draw.text((box[0] - int(w*0.08), center_y), "1/4\" SEAM", fill=PALETTE["sepia_ink"], font=font_dim)

        # 4. Blueprint Header & Title Block
        font_title = load_font(size=max(28, int(w * 0.062)), bold=True)
        title_text = self.config.title_text or "TRADITIONAL BARN STAR"
        self._draw_centered_text(draw, title_text, center_x, int(h * 0.10), font_title, PALETTE["dark_bark"])

        font_sub = load_font(size=max(18, int(w * 0.030)), italic=True)
        sub_text = self.config.subtitle_text or "Heirloom Quilt Pattern • Center Medallion Blueprint"
        self._draw_centered_text(draw, sub_text, center_x, int(h * 0.15), font_sub, PALETTE["sepia_ink"])

        # Technical specification box at bottom
        spec_box = [int(w * 0.10), int(h * 0.85), int(w * 0.90), int(h * 0.94)]
        draw.rectangle(spec_box, fill=PALETTE["cream"], outline=PALETTE["sepia_ink"], width=max(2, int(w*0.003)))
        font_spec = load_font(size=max(13, int(w * 0.020)), bold=False)
        self._draw_centered_text(draw, "BLOCK SIZE: 24\" x 24\"  •  PIECES: 32 DIAMONDS  •  SKILL: CONFIDENT BEGINNER", center_x, int(h * 0.88), font_spec, PALETTE["dark_bark"])
        self._draw_centered_text(draw, "NEAL FRAZIER TECH • NULLAI COMMERCE SUITE • 300 DPI VECTOR TEMPLATE", center_x, int(h * 0.91), font_spec, PALETTE["sage"])

        return canvas

    # -------------------------------------------------------------------------
    # Internal Drawing Utilities
    # -------------------------------------------------------------------------
    def _draw_centered_text(
        self,
        draw: ImageDraw.ImageDraw,
        text: str,
        x: int,
        y: int,
        font: ImageFont.ImageFont,
        fill: Tuple[int, int, int, int],
    ) -> None:
        """Render horizontally and vertically centered text."""
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        draw.text((x - text_w // 2, y - text_h // 2), text, fill=fill, font=font)

    def _draw_watercolor_bloom(
        self,
        draw: ImageDraw.ImageDraw,
        cx: int,
        cy: int,
        radius: int,
        base_color: Tuple[int, int, int, int],
    ) -> None:
        """Render soft translucent multi-petal watercolor flower."""
        num_petals = 6
        for p in range(num_petals):
            angle = p * (2 * math.pi / num_petals)
            px = cx + int((radius * 0.55) * math.cos(angle))
            py = cy + int((radius * 0.55) * math.sin(angle))
            pr = int(radius * 0.50)
            # Translucent petal
            r, g, b, _ = base_color
            petal_color = (r, g, b, 180)
            draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=petal_color)

        # Flower Center
        center_r = max(4, int(radius * 0.28))
        draw.ellipse([cx - center_r, cy - center_r, cx + center_r, cy + center_r], fill=PALETTE["gold_amber"])
        draw.ellipse([cx - center_r // 2, cy - center_r // 2, cx + center_r // 2, cy + center_r // 2], fill=PALETTE["dark_bark"])
