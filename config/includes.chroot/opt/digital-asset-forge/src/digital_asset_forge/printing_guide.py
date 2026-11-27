"""Digital Asset Forge - Customer Printing Guide Generator.

Produces ready-to-deliver customer instructions sheets, paper recommendations,
and framing sizing charts for Etsy and Shopify digital download buyers.
100% Python Standard Library.
"""

from typing import Dict, Any

class PrintingGuideGenerator:
    """Generates professional markdown and formatted text printing manuals for buyers."""

    @staticmethod
    def generate_guide_markdown(artwork_title: str = "Artwork Collection", shop_name: str = "NullAI Art Studio") -> str:
        return f"""# {artwork_title.upper()} — PRINTING & FRAMING GUIDE
Thank you for supporting {shop_name}! Below is your comprehensive guide to getting museum-quality prints from your digital download files.

---

## 1. WHAT FILES ARE INCLUDED?
Your download includes 5 ultra-high-resolution (300 DPI) JPEG files, each precisely cropped to standard aspect ratio families:

| Ratio File | Max Print Size (300 DPI) | Supported Frame Sizes |
| :--- | :--- | :--- |
| **2:3 Ratio** | 24" x 36" (60x90 cm) | 4x6, 6x9, 8x12, 10x15, 12x18, 16x24, 20x30, 24x36 inches |
| **3:4 Ratio** | 18" x 24" (45x60 cm) | 6x8, 9x12, 12x16, 15x20, 18x24 inches |
| **4:5 Ratio** | 16" x 20" (40x50 cm) | 4x5, 8x10, 12x15, 16x20 inches (Standard Tabletop & Wall) |
| **11:14 Ratio**| 11" x 14" (28x35 cm) | 11x14, 22x28 inches |
| **ISO Series** | A1 (59.4 x 84.1 cm) | A1, A2, A3, A4, A5, 5x7 inches |

> **Pro Tip:** You do not need a separate file for every size. The largest file in each ratio folder can be scaled down to any smaller size within that ratio with ZERO loss of clarity.

---

## 2. WHERE TO PRINT

### Option A: Online Fine Art Print Labs (Recommended for Best Quality)
- **United States & Canada:** Mpix, FinerWorks, Gelato, Shutterfly, Nations Photo Lab
- **United Kingdom & Europe:** Gelato, theprintspace, Whitewall, Photobox
- **Australia & New Zealand:** Gelato, RGB Digital, Canvas Factory

### Option B: Local In-Store Print Providers (Fast Same-Day Pickup)
- **US:** Walgreens, CVS, Staples, Office Depot, FedEx Office
- **UK:** Boots Photo, Snappy Snaps, Ryman
- **Australia:** Officeworks, Kmart Photo

### Option C: Home Printing
- Set your printer quality setting to **"High / Best Photo"**.
- Ensure scaling is set to **"100% / Actual Size"** (do NOT select "Fit to Page").

---

## 3. RECOMMENDED PAPER & FINISH
For fine art prints, paper selection defines 80% of the perceived quality:
- **Heavyweight Matte Paper (200–300 gsm):** Best overall choice. Zero glare, smooth velvety texture, and rich deep contrast.
- **Fine Art Cotton Rag / Giclée Paper:** Premium archival finish for luxury gallery aesthetics.
- **Semi-Gloss / Lustre:** Ideal if your art features high-contrast neon or deep photographic blacks.
- *Avoid:* Standard copy paper (too thin, buckles under ink) or ultra-glossy plastic paper (catches glare under glass frames).

---

## 4. FRAMING & DISPLAY
- Standard frames matching these dimensions are readily available at IKEA, Target, Amazon, West Elm, and CB2.
- For a high-end designer look, choose a frame with a white bevel-cut mat board (e.g. framing an 8x10 print inside an 11x14 matted frame).

---
© {shop_name} • For personal display use only.
"""

    @classmethod
    def generate_guide_payload(cls, artwork_title: str = "Celestial Geometry", shop_name: str = "NullAI Studio") -> Dict[str, Any]:
        md = cls.generate_guide_markdown(artwork_title, shop_name)
        return {
            "title": f"{artwork_title} Printing Guide",
            "shop_name": shop_name,
            "format": "markdown",
            "character_count": len(md),
            "content": md,
            "sections": [
                "File Ratio Taxonomy & Size Matrix",
                "Online & Local Print Service Recommendations",
                "Home Printer Settings & Scaling Rules",
                "Paper Stock & Giclée Recommendations",
                "Framing & Matting Best Practices"
            ]
        }
