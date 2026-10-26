"""Product Mockup Compositing Engine.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Composites transparent design artwork onto realistic lifestyle backgrounds:
- Apparel: Folded crewneck on rustic wooden table with dried lavender sprigs.
- Mugs: 15oz glossy ceramic mug with morning light and steam.
- Totes: Heavyweight cotton canvas tote hanging from farmhouse iron hook.
- Wall Art: Matted oak gallery frame in sunlit living room with natural wall shadows.
- Crafting: Blueprint flat-lay with cutting mat, rotary ruler, and brass scissors.

100% Python standard library and Pillow.
"""

from __future__ import annotations

import base64
import io
import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from PIL import Image, ImageColor, ImageDraw, ImageFilter, ImageFont

from .canvas_generator import CanvasGenerator, CanvasConfig, load_font, PALETTE


@dataclass
class MockupConfig:
    cadre: str
    width: int = 1600
    height: int = 1200
    product_color: str = "sand"   # sand, moss, dusty_rose, pepper, white, natural
    show_props: bool = True
    lighting_style: str = "morning_sun"

    @classmethod
    def default_for_cadre(cls, cadre: str) -> MockupConfig:
        cadre_norm = cadre.lower()
        if cadre_norm == "apparel":
            return cls(cadre="apparel", width=1600, height=1200, product_color="sand")
        elif cadre_norm == "mugs":
            return cls(cadre="mugs", width=1400, height=1400, product_color="white")
        elif cadre_norm == "totes":
            return cls(cadre="totes", width=1400, height=1400, product_color="natural")
        elif cadre_norm == "wall_art":
            return cls(cadre="wall_art", width=1600, height=1200, product_color="oak_frame")
        elif cadre_norm == "crafting":
            return cls(cadre="crafting", width=1600, height=1200, product_color="blueprint")
        else:
            return cls(cadre="apparel", width=1600, height=1200)


class MockupEngine:
    """Composites print-ready artwork onto photorealistic lifestyle mockup scenes."""

    def __init__(self, config: Optional[MockupConfig] = None):
        self.config = config or MockupConfig.default_for_cadre("apparel")

    def composite(self, artwork: Optional[Image.Image] = None) -> Image.Image:
        """Render product mockup scene with artwork composited into place."""
        cadre = self.config.cadre.lower()

        # If no artwork provided, generate matching default canvas
        if artwork is None:
            canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
            artwork = CanvasGenerator(canvas_cfg).generate()

        if cadre == "apparel":
            return self._composite_apparel(artwork)
        elif cadre == "mugs":
            return self._composite_mug(artwork)
        elif cadre == "totes":
            return self._composite_tote(artwork)
        elif cadre == "wall_art":
            return self._composite_wall_art(artwork)
        elif cadre == "crafting":
            return self._composite_crafting(artwork)
        else:
            return self._composite_apparel(artwork)

    def composite_bytes(self, artwork: Optional[Image.Image] = None, format: str = "JPEG") -> bytes:
        """Render mockup and return compressed image bytes."""
        img = self.composite(artwork)
        if img.mode == "RGBA" and format.upper() in ("JPEG", "JPG"):
            img = img.convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format=format, quality=92, optimize=True)
        return buf.getvalue()

    def composite_base64(self, artwork: Optional[Image.Image] = None) -> str:
        """Render mockup and return Base64 data URI."""
        raw = self.composite_bytes(artwork, format="JPEG")
        b64 = base64.b64encode(raw).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    # -------------------------------------------------------------------------
    # 1. Apparel Mockup (Sweatshirt on Rustic Wood Table)
    # -------------------------------------------------------------------------
    def _composite_apparel(self, artwork: Image.Image) -> Image.Image:
        w, h = self.config.width, self.config.height
        scene = self._generate_wood_table_background(w, h)
        draw = ImageDraw.Draw(scene)

        # Sweatshirt colors
        color_map = {
            "sand": (224, 214, 198),
            "pepper": (52, 50, 54),
            "moss": (118, 134, 112),
            "dusty_rose": (198, 154, 158),
            "ivory": (244, 240, 230),
        }
        fabric_color = color_map.get(self.config.product_color.lower(), color_map["sand"])

        cx = w // 2
        cy = int(h * 0.52)
        shirt_w = int(w * 0.62)
        shirt_h = int(h * 0.74)
        top_y = cy - shirt_h // 2
        bottom_y = cy + shirt_h // 2
        left_x = cx - shirt_w // 2
        right_x = cx + shirt_w // 2

        # 1. Soft Drop Shadow under garment
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.ellipse([left_x - 10, top_y + 10, right_x + 10, bottom_y + 25], fill=(0, 0, 0, 100))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=24))
        scene = Image.alpha_composite(scene.convert("RGBA"), shadow).convert("RGB")
        draw = ImageDraw.Draw(scene)

        # 2. Garment Body Polygon (Folded Crewneck Sweatshirt)
        collar_w = int(shirt_w * 0.28)
        collar_h = int(shirt_h * 0.10)
        shoulder_drop = int(shirt_h * 0.14)

        poly = [
            (cx - collar_w // 2, top_y + collar_h // 2),
            (left_x + int(shirt_w * 0.08), top_y + shoulder_drop),
            (left_x, top_y + int(shirt_h * 0.32)),
            (left_x + int(shirt_w * 0.05), bottom_y),
            (right_x - int(shirt_w * 0.05), bottom_y),
            (right_x, top_y + int(shirt_h * 0.32)),
            (right_x - int(shirt_w * 0.08), top_y + shoulder_drop),
            (cx + collar_w // 2, top_y + collar_h // 2),
        ]
        draw.polygon(poly, fill=fabric_color)

        # Ribbed collar band
        draw.ellipse([cx - collar_w // 2, top_y, cx + collar_w // 2, top_y + collar_h], outline=tuple(max(0, c - 25) for c in fabric_color), width=6)
        # Inside collar hole
        draw.ellipse([cx - collar_w // 2 + 6, top_y + 4, cx + collar_w // 2 - 6, top_y + collar_h - 4], fill=tuple(max(0, c - 45) for c in fabric_color))

        # Bottom ribbed hem
        hem_y = bottom_y - int(shirt_h * 0.05)
        draw.line([left_x + int(shirt_w * 0.05), hem_y, right_x - int(shirt_w * 0.05), hem_y], fill=tuple(max(0, c - 20) for c in fabric_color), width=3)

        # 3. Composite Artwork on Chest Area
        chest_cx = cx
        chest_cy = top_y + int(shirt_h * 0.44)
        target_art_w = int(shirt_w * 0.52)
        target_art_h = int(shirt_h * 0.55)

        art_copy = artwork.copy()
        art_copy.thumbnail((target_art_w, target_art_h), Image.Resampling.LANCZOS)

        # Alpha composite artwork onto garment
        art_x = chest_cx - art_copy.width // 2
        art_y = chest_cy - art_copy.height // 2

        scene_rgba = scene.convert("RGBA")
        scene_rgba.paste(art_copy, (art_x, art_y), art_copy)

        # 4. Optional Styling Props: Dried Lavender & Wooden beads
        if self.config.show_props:
            prop_draw = ImageDraw.Draw(scene_rgba)
            # Lavender stem on left table corner
            lx = int(w * 0.12)
            ly = int(h * 0.65)
            prop_draw.line([lx, ly, lx + int(w * 0.08), ly - int(h * 0.28)], fill=PALETTE["deep_sage"], width=4)
            for lv in range(6):
                py = ly - int(h * 0.04) * lv
                px = lx + int(w * 0.012) * lv
                prop_draw.ellipse([px - 10, py - 6, px + 10, py + 6], fill=PALETTE["lavender"])

        return scene_rgba.convert("RGB")

    # -------------------------------------------------------------------------
    # 2. Mug Mockup (15oz Ceramic Mug on Morning Table)
    # -------------------------------------------------------------------------
    def _composite_mug(self, artwork: Image.Image) -> Image.Image:
        w, h = self.config.width, self.config.height
        scene = self._generate_wood_table_background(w, h, light_from_left=True)

        cx = w // 2
        cy = int(h * 0.52)
        mug_w = int(w * 0.44)
        mug_h = int(h * 0.52)

        # 1. Soft Oval Drop Shadow on Table
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.ellipse([cx - mug_w // 2 - 20, cy + mug_h // 2 - 20, cx + mug_w // 2 + 50, cy + mug_h // 2 + 60], fill=(20, 15, 10, 140))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=28))
        scene = Image.alpha_composite(scene.convert("RGBA"), shadow).convert("RGB")
        draw = ImageDraw.Draw(scene)

        # 2. Ceramic C-Handle on Right Side
        handle_x = cx + mug_w // 2 - 10
        handle_y = cy - int(mug_h * 0.20)
        handle_w = int(mug_w * 0.30)
        handle_h = int(mug_h * 0.44)
        # Handle shadow
        draw.arc([handle_x - 5, handle_y - 5, handle_x + handle_w + 5, handle_y + handle_h + 5], 270, 90, fill=(180, 180, 180), width=32)
        # Handle highlight
        draw.arc([handle_x, handle_y, handle_x + handle_w, handle_y + handle_h], 270, 90, fill=(250, 250, 252), width=24)

        # 3. Glossy Ceramic Cylinder Body
        mug_rect = [cx - mug_w // 2, cy - mug_h // 2, cx + mug_w // 2, cy + mug_h // 2]
        # Base cylinder shape
        draw.rectangle(mug_rect, fill=(245, 246, 248))
        # Rounded bottom rim
        draw.chord([mug_rect[0], mug_rect[3] - int(mug_h * 0.12), mug_rect[2], mug_rect[3] + int(mug_h * 0.12)], 0, 180, fill=(240, 242, 245))

        # 4. Top Rim & Steaming Coffee Surface
        rim_h = int(mug_h * 0.18)
        rim_rect = [mug_rect[0], mug_rect[1] - rim_h // 2, mug_rect[2], mug_rect[1] + rim_h // 2]
        # Outer rim
        draw.ellipse(rim_rect, fill=(245, 246, 248), outline=(225, 228, 232), width=3)
        # Inner dark coffee surface
        coffee_rect = [rim_rect[0] + 12, rim_rect[1] + 6, rim_rect[2] - 12, rim_rect[3] - 6]
        draw.ellipse(coffee_rect, fill=(48, 30, 20))
        # Coffee highlight reflection
        draw.arc(coffee_rect, 190, 310, fill=(120, 85, 60), width=4)

        # 5. Composite Artwork Wrapped on Mug Face
        target_art_w = int(mug_w * 0.68)
        target_art_h = int(mug_h * 0.65)
        art_copy = artwork.copy()
        art_copy.thumbnail((target_art_w, target_art_h), Image.Resampling.LANCZOS)

        art_x = cx - art_copy.width // 2 - 8
        art_y = cy - art_copy.height // 2 + 10

        scene_rgba = scene.convert("RGBA")
        scene_rgba.paste(art_copy, (art_x, art_y), art_copy)

        # 6. Cylindrical Highlight Sheen Overlay (Glossy ceramic reflection)
        gloss = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        g_draw = ImageDraw.Draw(gloss)
        # Vertical morning sunlight highlight streak
        streak_x = cx - int(mug_w * 0.22)
        g_draw.rectangle([streak_x, mug_rect[1] + 10, streak_x + int(mug_w * 0.08), mug_rect[3] - 10], fill=(255, 255, 255, 65))
        gloss = gloss.filter(ImageFilter.GaussianBlur(radius=12))
        scene_rgba = Image.alpha_composite(scene_rgba, gloss)

        return scene_rgba.convert("RGB")

    # -------------------------------------------------------------------------
    # 3. Tote Bag Mockup (Hanging on Farmhouse Hook)
    # -------------------------------------------------------------------------
    def _composite_tote(self, artwork: Image.Image) -> Image.Image:
        w, h = self.config.width, self.config.height
        # Shiplap Farmhouse wall background
        scene = Image.new("RGB", (w, h), (242, 238, 230))
        draw = ImageDraw.Draw(scene)

        # Horizontal Shiplap lines
        plank_h = int(h * 0.12)
        for y in range(0, h, plank_h):
            draw.line([0, y, w, y], fill=(215, 208, 198), width=2)
            draw.line([0, y + 1, w, y + 1], fill=(255, 255, 255), width=1)

        cx = w // 2
        hook_y = int(h * 0.16)

        # 1. Vintage Cast Iron Coat Hook
        draw.ellipse([cx - 16, hook_y - 16, cx + 16, hook_y + 16], fill=(42, 40, 42))
        draw.arc([cx - 18, hook_y - 12, cx + 18, hook_y + 36], 270, 90, fill=(35, 32, 35), width=10)

        # 2. Hanging Handles
        tote_top_y = int(h * 0.36)
        tote_w = int(w * 0.55)
        tote_h = int(h * 0.54)
        tote_bottom_y = tote_top_y + tote_h
        tote_left_x = cx - tote_w // 2
        tote_right_x = cx + tote_w // 2

        strap_color = (220, 210, 195)
        # Left strap
        draw.line([cx - 4, hook_y + 14, tote_left_x + int(tote_w * 0.24), tote_top_y], fill=strap_color, width=16)
        # Right strap
        draw.line([cx + 4, hook_y + 14, tote_right_x - int(tote_w * 0.24), tote_top_y], fill=strap_color, width=16)

        # 3. Tote Bag Body (Natural heavy canvas texture)
        bag_shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(bag_shadow)
        b_draw.rectangle([tote_left_x - 10, tote_top_y + 10, tote_right_x + 10, tote_bottom_y + 30], fill=(0, 0, 0, 90))
        bag_shadow = bag_shadow.filter(ImageFilter.GaussianBlur(radius=20))
        scene = Image.alpha_composite(scene.convert("RGBA"), bag_shadow).convert("RGB")
        draw = ImageDraw.Draw(scene)

        # Bag rectangle with bottom corners slightly rounded
        bag_color = (235, 226, 212)
        draw.rectangle([tote_left_x, tote_top_y, tote_right_x, tote_bottom_y], fill=bag_color)

        # Top hem seam
        draw.line([tote_left_x, tote_top_y + 24, tote_right_x, tote_top_y + 24], fill=(200, 190, 175), width=3)
        # Bottom gusset fold line
        draw.line([tote_left_x + 30, tote_bottom_y - 20, tote_right_x - 30, tote_bottom_y - 20], fill=(210, 200, 185), width=2)

        # 4. Composite Artwork on Canvas Tote Center
        target_art_w = int(tote_w * 0.65)
        target_art_h = int(tote_h * 0.65)
        art_copy = artwork.copy()
        art_copy.thumbnail((target_art_w, target_art_h), Image.Resampling.LANCZOS)

        art_x = cx - art_copy.width // 2
        art_y = tote_top_y + int(tote_h * 0.48) - art_copy.height // 2

        scene_rgba = scene.convert("RGBA")
        scene_rgba.paste(art_copy, (art_x, art_y), art_copy)

        return scene_rgba.convert("RGB")

    # -------------------------------------------------------------------------
    # 4. Wall Art Mockup (Oak Framed Gallery Print in Living Room)
    # -------------------------------------------------------------------------
    def _composite_wall_art(self, artwork: Image.Image) -> Image.Image:
        w, h = self.config.width, self.config.height
        # Warm interior wall paint
        scene = Image.new("RGB", (w, h), (236, 232, 225))

        cx = w // 2
        cy = int(h * 0.48)
        frame_w = int(w * 0.48)
        frame_h = int(h * 0.72)

        left_x = cx - frame_w // 2
        top_y = cy - frame_h // 2
        right_x = cx + frame_w // 2
        bottom_y = cy + frame_h // 2

        # 1. Soft Natural Wall Drop Shadow
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.rectangle([left_x + 18, top_y + 24, right_x + 28, bottom_y + 36], fill=(40, 35, 30, 110))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=28))
        scene = Image.alpha_composite(scene.convert("RGBA"), shadow).convert("RGB")
        draw = ImageDraw.Draw(scene)

        # 2. Natural Oak Wooden Frame Border
        oak_border = 36
        draw.rectangle([left_x, top_y, right_x, bottom_y], fill=(188, 150, 110), outline=(160, 125, 88), width=3)

        # 3. Museum Archival White Mat (Passe-partout)
        mat_left = left_x + oak_border
        mat_top = top_y + oak_border
        mat_right = right_x - oak_border
        mat_bottom = bottom_y - oak_border
        draw.rectangle([mat_left, mat_top, mat_right, mat_bottom], fill=(252, 250, 246))

        # Mat bevel inner line
        mat_margin = int(frame_w * 0.10)
        art_box_l = mat_left + mat_margin
        art_box_t = mat_top + mat_margin
        art_box_r = mat_right - mat_margin
        art_box_b = mat_bottom - mat_margin
        draw.rectangle([art_box_l, art_box_t, art_box_r, art_box_b], outline=(220, 218, 212), width=2)

        # 4. Fit and Paste Artwork inside Mat Opening
        target_w = art_box_r - art_box_l
        target_h = art_box_b - art_box_t
        art_copy = artwork.copy()
        art_copy.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)

        art_x = art_box_l + (target_w - art_copy.width) // 2
        art_y = art_box_t + (target_h - art_copy.height) // 2

        scene_rgba = scene.convert("RGBA")
        scene_rgba.paste(art_copy, (art_x, art_y), art_copy)

        # 5. Subtle Glass Reflection Sheen
        sheen = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(sheen)
        # Angled light reflection across frame glass
        sh_draw.polygon([
            (left_x, top_y),
            (left_x + int(frame_w * 0.35), top_y),
            (left_x, top_y + int(frame_h * 0.45)),
        ], fill=(255, 255, 255, 40))
        sheen = sheen.filter(ImageFilter.GaussianBlur(radius=8))
        scene_rgba = Image.alpha_composite(scene_rgba, sheen)

        return scene_rgba.convert("RGB")

    # -------------------------------------------------------------------------
    # 5. Crafting Mockup (Blueprint on Cutting Mat with Ruler & Scissors)
    # -------------------------------------------------------------------------
    def _composite_crafting(self, artwork: Image.Image) -> Image.Image:
        w, h = self.config.width, self.config.height
        # Dark forest green self-healing cutting mat background
        scene = Image.new("RGB", (w, h), (38, 72, 60))
        draw = ImageDraw.Draw(scene)

        # Cutting mat 1-inch and 1/2-inch grid lines
        grid_step = 60
        for gx in range(0, w, grid_step):
            draw.line([gx, 0, gx, h], fill=(50, 92, 78), width=1)
        for gy in range(0, h, grid_step):
            draw.line([0, gy, w, gy], fill=(50, 92, 78), width=1)

        # Mat edge ruler numbers
        font_num = load_font(size=14, bold=True)
        for i, gx in enumerate(range(grid_step, w, grid_step)):
            draw.text((gx + 4, 8), str(i + 1), fill=(180, 210, 195), font=font_num)

        cx = w // 2
        cy = h // 2
        sheet_w = int(w * 0.62)
        sheet_h = int(h * 0.74)

        # 1. Blueprint Paper Drop Shadow
        shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow)
        s_draw.rectangle([cx - sheet_w // 2 + 12, cy - sheet_h // 2 + 16, cx + sheet_w // 2 + 20, cy + sheet_h // 2 + 24], fill=(0, 0, 0, 130))
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))
        scene = Image.alpha_composite(scene.convert("RGBA"), shadow).convert("RGB")
        draw = ImageDraw.Draw(scene)

        # 2. Crisp Blueprint Sheet Base
        sheet_box = [cx - sheet_w // 2, cy - sheet_h // 2, cx + sheet_w // 2, cy + sheet_h // 2]
        draw.rectangle(sheet_box, fill=(248, 250, 252))

        # 3. Paste Blueprint Artwork
        target_w = int(sheet_w * 0.90)
        target_h = int(sheet_h * 0.90)
        art_copy = artwork.copy()
        art_copy.thumbnail((target_w, target_h), Image.Resampling.LANCZOS)

        art_x = cx - art_copy.width // 2
        art_y = cy - art_copy.height // 2

        scene_rgba = scene.convert("RGBA")
        scene_rgba.paste(art_copy, (art_x, art_y), art_copy)
        draw_rgba = ImageDraw.Draw(scene_rgba)

        # 4. Vintage Brass Stork Embroidery Scissors on side
        if self.config.show_props:
            sx = int(w * 0.86)
            sy = int(h * 0.68)
            draw_rgba.ellipse([sx - 18, sy - 18, sx + 18, sy + 18], outline=(198, 154, 60), width=6)
            draw_rgba.ellipse([sx + 24, sy - 18, sx + 60, sy + 18], outline=(198, 154, 60), width=6)
            draw_rgba.line([sx + 3, sy + 12, sx + 12, sy + 90], fill=(210, 168, 70), width=8)
            draw_rgba.line([sx + 39, sy + 12, sx + 18, sy + 90], fill=(210, 168, 70), width=8)

        return scene_rgba.convert("RGB")

    # -------------------------------------------------------------------------
    # Helper: Realistic Rustic Wooden Table Generator
    # -------------------------------------------------------------------------
    def _generate_wood_table_background(self, w: int, h: int, light_from_left: bool = False) -> Image.Image:
        """Create warm rustic wood plank background with soft lighting vignette."""
        img = Image.new("RGB", (w, h), (188, 168, 148))
        draw = ImageDraw.Draw(img)

        # Wood Planks horizontal strips
        plank_h = int(h * 0.16)
        for p, y in enumerate(range(0, h, plank_h)):
            # Alternating subtle wood tone
            base_col = (195, 175, 152) if p % 2 == 0 else (180, 160, 140)
            draw.rectangle([0, y, w, y + plank_h], fill=base_col)
            # Plank seam
            draw.line([0, y, w, y], fill=(130, 110, 92), width=3)
            draw.line([0, y + 1, w, y + 1], fill=(225, 210, 192), width=1)

        # Soft vignette gradient
        vignette = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        v_draw = ImageDraw.Draw(vignette)
        v_draw.ellipse([-int(w * 0.1), -int(h * 0.1), int(w * 1.1), int(h * 1.1)], fill=(255, 255, 255, 30))
        # Outer border darkening
        v_draw.rectangle([0, 0, w, 40], fill=(0, 0, 0, 50))
        v_draw.rectangle([0, h - 40, w, h], fill=(0, 0, 0, 60))
        vignette = vignette.filter(ImageFilter.GaussianBlur(radius=36))

        return Image.alpha_composite(img.convert("RGBA"), vignette).convert("RGB")
