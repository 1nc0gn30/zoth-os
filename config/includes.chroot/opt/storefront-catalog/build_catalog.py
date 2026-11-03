#!/usr/bin/env python3
"""
YourDigitalSpace — 10 Master Launch Products Builder
Target Demographic: 55+ Women (Florals, Songbirds, Gardening, Grandchildren, Comfort Crafts)
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""

import os
import sys
import json
from pathlib import Path

# Sibling engines: default to repos next to this one; override with NULLAI_ROOT.
CATALOG_DIR = Path(__file__).resolve().parent
NULLAI_ROOT = Path(os.environ.get("NULLAI_ROOT", CATALOG_DIR.parent))
for _engine in ("etsy-pod-forge", "etsy-connector"):
    _src = NULLAI_ROOT / _engine / "src"
    if not _src.is_dir():
        sys.exit(f"[storefront-catalog] missing engine {_src} (set NULLAI_ROOT to the folder holding {_engine})")
    sys.path.insert(0, str(_src))

# Public base URL the POD provider fetches print canvases from.
ASSET_BASE_URL = os.environ.get(
    "STOREFRONT_ASSET_BASE_URL",
    "https://raw.githubusercontent.com/1nc0gn30/storefront-catalog/main/assets/canvases",
).rstrip("/")

from etsy_pod_forge.listing_synthesizer import synthesize_listing
from etsy_pod_forge.canvas_generator import CanvasGenerator, CanvasConfig
from etsy_pod_forge.mockup_engine import MockupEngine, MockupConfig
from etsy_connector.seo_engine import audit_listing
from etsy_connector.pod_bridge import generate_printify_product_payload, PRINTIFY_BLUEPRINTS

ASSETS_DIR = CATALOG_DIR / "assets"
CANVASES_DIR = ASSETS_DIR / "canvases"
MOCKUPS_DIR = ASSETS_DIR / "mockups"
PAYLOADS_DIR = CATALOG_DIR / "payloads"

PRODUCTS = [
    {
        "id": "prod-01-grandma-garden-sweatshirt",
        "cadre": "apparel",
        "title": "Grandma Garden Sweatshirt Custom Wildflower Crewneck Sweater",
        "subtitle": "Where Love Grows",
        "names": "Emma, Liam, Olivia, Noah",
        "color": "sand",
        "retail": 34.99,
        "cost": 12.50,
        "blueprint_key": "gildan_18000",
    },
    {
        "id": "prod-02-gardening-era-tee",
        "cadre": "apparel",
        "title": "In My Gardening Era Shirt Botanical Wildflower Plant Lover Tee",
        "subtitle": "Wildflower Meadow",
        "names": None,
        "color": "pepper",
        "retail": 28.99,
        "cost": 10.50,
        "blueprint_key": "comfort_colors_1717",
    },
    {
        "id": "prod-03-cozy-songbirds-mug",
        "cadre": "mugs",
        "title": "Cozy Backyard Songbirds Coffee Mug 15oz Bird Watcher Tea Cup",
        "subtitle": "Backyard Songbirds",
        "names": None,
        "color": "white",
        "retail": 21.99,
        "cost": 6.80,
        "blueprint_key": "ceramic_mug_15oz",
    },
    {
        "id": "prod-04-highland-cow-wreath-mug",
        "cadre": "mugs",
        "title": "Highland Cow Wildflower Mug Cute Farmhouse Animal Ceramic Cup",
        "subtitle": "Wildflower Meadow",
        "names": None,
        "color": "sage",
        "retail": 22.99,
        "cost": 7.20,
        "blueprint_key": "ceramic_mug_15oz",
    },
    {
        "id": "prod-05-french-lavender-tote",
        "cadre": "totes",
        "title": "Vintage French Lavender Canvas Tote Bag Botanical Market Bag",
        "subtitle": "Fleurs & Lavande",
        "names": None,
        "color": "natural",
        "retail": 24.99,
        "cost": 7.20,
        "blueprint_key": "canvas_tote_heavyweight",
    },
    {
        "id": "prod-06-reading-haven-tote",
        "cadre": "totes",
        "title": "Reading Is My Haven Book Club Tote Bag Cottagecore Library Tote",
        "subtitle": "Book Club Enthusiast",
        "names": None,
        "color": "natural",
        "retail": 24.99,
        "cost": 7.20,
        "blueprint_key": "canvas_tote_heavyweight",
    },
    {
        "id": "prod-07-botanical-gallery-wall-art",
        "cadre": "wall_art",
        "title": "English Countryside Botanical Prints Set of 12 Wall Art Pack",
        "subtitle": "Heritage Herbarium",
        "names": None,
        "color": "wood_frame",
        "retail": 14.99,
        "cost": 0.20,
        "blueprint_key": "digital_art_bundle",
    },
    {
        "id": "prod-08-songbird-field-guide-art",
        "cadre": "wall_art",
        "title": "Vintage Songbird Field Guide Art Prints Set Watercolor Posters",
        "subtitle": "Ornithology Field Guide",
        "names": None,
        "color": "wood_frame",
        "retail": 12.99,
        "cost": 0.20,
        "blueprint_key": "digital_art_bundle",
    },
    {
        "id": "prod-09-barn-star-quilt-pattern",
        "cadre": "crafting",
        "title": "Barn Star Quilt Pattern Blueprint Printable Template Vector Kit",
        "subtitle": "Traditional Star Quilt",
        "names": None,
        "color": "craft_paper",
        "retail": 8.50,
        "cost": 0.20,
        "blueprint_key": "digital_art_bundle",
    },
    {
        "id": "prod-10-wildflower-embroidery-pattern",
        "cadre": "crafting",
        "title": "Wildflower Meadow Embroidery Pattern Hand Stitching Transfer PDF",
        "subtitle": "Stitch Transfer Guide",
        "names": None,
        "color": "craft_paper",
        "retail": 7.99,
        "cost": 0.20,
        "blueprint_key": "digital_art_bundle",
    },
]


def build_catalog():
    print("=" * 72)
    print("  🌸 YOURDIGITALSPACE — DAY 7 ETSY STOREFRONT BUILDER")
    print("  Target Demographic: 55+ Women (Florals, Grandchildren, Crafts)")
    print("=" * 72)

    catalog_items = []
    total_retail = 0.0
    total_cost = 0.0
    total_fees = 0.0
    total_net_profit = 0.0

    for idx, p in enumerate(PRODUCTS, 1):
        print(f"\n[{idx}/10] Processing {p['id']} ({p['cadre'].upper()})...")

        # 1. Synthesize Listing Kit
        kit = synthesize_listing(
            cadre=p["cadre"],
            custom_title_hook=p["title"],
            custom_names=p["names"],
            retail_price=p["retail"],
            production_cost=p["cost"],
        )

        # 2. Run Comprehensive SEO Audit
        seo_audit = audit_listing(kit.title, kit.tags, kit.description)

        # 3. Generate Print Canvas
        canvas_path = CANVASES_DIR / f"{p['id']}_canvas.png"
        cfg = CanvasConfig.default_for_cadre(p["cadre"], preview=True)
        cfg.title_text = p["title"]
        if p["subtitle"]:
            cfg.subtitle_text = p["subtitle"]
        if p["names"]:
            cfg.custom_names = [n.strip() for n in p["names"].split(",")]

        c_gen = CanvasGenerator(cfg)
        canvas_img = c_gen.generate()
        canvas_img.save(canvas_path, dpi=(cfg.dpi, cfg.dpi), optimize=True)

        # 4. Generate Lifestyle Mockup
        mockup_path = MOCKUPS_DIR / f"{p['id']}_mockup.jpg"
        m_cfg = MockupConfig.default_for_cadre(p["cadre"])
        m_cfg.product_color = p["color"]
        m_engine = MockupEngine(m_cfg)
        mockup_img = m_engine.composite()
        mockup_img.save(mockup_path, quality=92, optimize=True)

        # 5. Generate POD Fulfillment Payload (Printify / Gelato)
        bp_key = p.get("blueprint_key", "comfort_colors_1717")
        pod_payload = generate_printify_product_payload(
            blueprint_key=bp_key,
            title=kit.title,
            description=kit.description[:500],
            tags=kit.tags,
            design_image_url=f"{ASSET_BASE_URL}/{p['id']}_canvas.png",
            retail_price_usd=p["retail"],
        )
        payload_file = PAYLOADS_DIR / f"{p['id']}_printify.json"
        with open(payload_file, "w") as f:
            json.dump(pod_payload, f, indent=2)

        # Financial tracking
        total_retail += kit.profit.retail_price
        total_cost += kit.profit.production_cost
        total_fees += kit.profit.total_fees
        total_net_profit += kit.profit.net_profit

        item_data = {
            "id": p["id"],
            "cadre": p["cadre"],
            "title": kit.title,
            "title_length": len(kit.title),
            "tags": kit.tags,
            "tag_count": len(kit.tags),
            "seo_score": seo_audit["overall_score"],
            "seo_grade": seo_audit["grade"],
            "financials": {
                "retail_price": kit.profit.retail_price,
                "production_cost": kit.profit.production_cost,
                "marketplace_fees": kit.profit.total_fees,
                "net_profit": kit.profit.net_profit,
                "margin_percent": kit.profit.margin_percent,
            },
            "canvas_file": str(canvas_path.relative_to(CATALOG_DIR)),
            "mockup_file": str(mockup_path.relative_to(CATALOG_DIR)),
            "pod_payload_file": f"payloads/{p['id']}_printify.json" if pod_payload else None,
            "description": kit.description,
        }
        catalog_items.append(item_data)
        print(f"  ✓ SEO: {seo_audit['overall_score']}/100 (Grade: {seo_audit['grade']}) | Profit: ${kit.profit.net_profit:.2f} ({kit.profit.margin_percent:.1f}%)")

    # Save manifest
    manifest = {
        "store_name": "YourDigitalSpace",
        "entity": "1nc0gn30 (@1nc0gn30)",
        "target_demographic": "55+ Women (Grandmothers, Gardeners, Cottagecore, Crafters)",
        "total_listings": len(catalog_items),
        "portfolio_financials": {
            "total_retail_value": round(total_retail, 2),
            "total_production_cost": round(total_cost, 2),
            "total_marketplace_fees": round(total_fees, 2),
            "total_net_profit": round(total_net_profit, 2),
            "blended_net_margin": round((total_net_profit / total_retail) * 100, 1),
        },
        "listings": catalog_items,
    }

    manifest_file = CATALOG_DIR / "catalog_manifest.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=2)

    # Generate Markdown Catalog Overview
    generate_markdown_catalog(manifest)

    print("\n" + "=" * 72)
    print("  🎉 CATALOG GENERATION COMPLETE!")
    print(f"  • Total Products:     {len(catalog_items)}")
    print(f"  • Portfolio Retail:   ${total_retail:.2f}")
    print(f"  • Blended Margin:     {(total_net_profit / total_retail) * 100:.1f}%")
    print(f"  • Net Profit / Basket: ${total_net_profit:.2f}")
    print(f"  • Manifest:           {manifest_file}")
    print("=" * 72)


def generate_markdown_catalog(manifest):
    fin = manifest["portfolio_financials"]
    lines = [
        f"# 🌸 {manifest['store_name']} — Day 7 Launch Portfolio",
        f"**Entity**: {manifest['entity']} • **Platform**: NullAI Commerce Suite  ",
        f"**Demographic Focus**: {manifest['target_demographic']}  ",
        f"**Target Milestone**: Accelerating Sovereign Treasury to **$100,000**",
        "",
        "---",
        "",
        "## 📊 Portfolio Economics & Blended Margins",
        "",
        "| Metric | Value |",
        "| :--- | :--- |",
        f"| **Active Listings** | **{manifest['total_listings']} Master Products** |",
        f"| **Combined Basket Retail** | **${fin['total_retail_value']:.2f}** |",
        f"| **Production Cost (COGS)** | ${fin['total_production_cost']:.2f} |",
        f"| **Etsy Fees (Listing + Trans + Proc)** | ${fin['total_marketplace_fees']:.2f} |",
        f"| **Net Profit / Complete Order** | **${fin['total_net_profit']:.2f}** |",
        f"| **Blended Net Profit Margin** | **{fin['blended_net_margin']}%** |",
        "",
        "---",
        "",
        "## 🛍️ Master Product Catalog",
        "",
        "| # | Product Name | Cadre | Retail | Net Profit | Margin | SEO Score | Mockup |",
        "| :-: | :--- | :--- | :-: | :-: | :-: | :-: | :--- |",
    ]

    for idx, item in enumerate(manifest["listings"], 1):
        f_info = item["financials"]
        lines.append(
            f"| {idx} | **{item['title'][:45]}...** | `{item['cadre']}` | ${f_info['retail_price']:.2f} | **${f_info['net_profit']:.2f}** | {f_info['margin_percent']:.1f}% | `{item['seo_score']}/100` ({item['seo_grade']}) | [`mockup`]({item['mockup_file']}) |"
        )

    lines.extend([
        "",
        "---",
        "",
        "## 🏷️ 13/13 High-Converting Long-Tail Tag Sets",
        "",
    ])

    for idx, item in enumerate(manifest["listings"], 1):
        lines.append(f"### {idx}. {item['title']}")
        lines.append(f"- **Cadre**: `{item['cadre']}` | **SEO**: `{item['seo_score']}/100` ({item['seo_grade']})")
        lines.append(f"- **Tags ({len(item['tags'])}/13)**:")
        lines.append("  ```text")
        lines.append("  " + ", ".join(item['tags']))
        lines.append("  ```")
        lines.append("")

    with open(CATALOG_DIR / "CATALOG.md", "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    build_catalog()
