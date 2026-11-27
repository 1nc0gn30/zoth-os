"""Digital Asset Forge - Etsy Listing Copywriter & SEO Generator.

Generates high-converting Etsy listing titles, exactly 13 ranking tags
(all strictly <= 20 chars), and accurate fee margin calculations.
100% Python Standard Library.
"""

from typing import Dict, List, Any

# Popular high-converting art niche keywords
NICHE_TAGS = {
    "abstract": [
        "abstract wall art", "digital download", "printable wall art",
        "modern art print", "large wall decor", "gallery wall art",
        "minimalist poster", "neutral home decor", "aesthetic wall art",
        "living room decor", "digital art prints", "300 dpi print", "instant download"
    ],
    "botanical": [
        "botanical wall art", "plant lover gift", "printable wall art",
        "greenery poster", "floral art print", "vintage botanical",
        "cottagecore decor", "earthy wall decor", "digital download",
        "nature art print", "bedroom wall art", "300 dpi print", "instant download"
    ],
    "landscape": [
        "mountain wall art", "landscape print", "nature photography",
        "panoramic poster", "large canvas art", "scenic wall decor",
        "minimal landscape", "moody landscape", "printable wall art",
        "travel poster", "digital download", "300 dpi print", "instant download"
    ],
    "geometric": [
        "geometric wall art", "bauhaus print", "mid century modern",
        "retro wall decor", "abstract shapes", "modern canvas art",
        "colorful poster", "contemporary print", "digital download",
        "studio apartment", "gallery wall print", "300 dpi print", "instant download"
    ]
}

class EtsyCopywriter:
    """Generates optimized listing titles, tags, and profit margin analysis."""

    @classmethod
    def generate_listing(
        cls,
        artwork_title: str = "Celestial Obsidian",
        niche: str = "abstract",
        retail_price_usd: float = 6.99
    ) -> Dict[str, Any]:
        niche_key = niche.lower() if niche.lower() in NICHE_TAGS else "abstract"
        raw_tags = NICHE_TAGS[niche_key]

        # Enforce Etsy constraint: exactly 13 tags, each <= 20 chars
        valid_tags: List[str] = []
        for t in raw_tags[:13]:
            trimmed = t.strip()[:20]
            valid_tags.append(trimmed)

        # Title: High-impact search phrase < 140 chars
        title = f"{artwork_title} Digital Download, Printable Wall Art, Modern {niche_key.title()} Poster, 300 DPI High Res Art Pack"
        if len(title) > 135:
            title = title[:132] + "..."

        # Fee & Profit Margin Analysis
        # Etsy: $0.20 listing fee + 6.5% transaction fee + 3% + $0.25 payment processing
        listing_fee = 0.20
        tx_fee = round(retail_price_usd * 0.065, 2)
        proc_fee = round(retail_price_usd * 0.03 + 0.25, 2)
        total_fees = round(listing_fee + tx_fee + proc_fee, 2)
        net_profit = round(retail_price_usd - total_fees, 2)
        margin_pct = round((net_profit / retail_price_usd) * 100.0, 1) if retail_price_usd > 0 else 0.0

        description = f"""✦ INSTANT DIGITAL DOWNLOAD — NO PHYSICAL ITEM WILL BE SHIPPED ✦

Elevate your living space with '{artwork_title}'. This listing includes ultra-high-resolution 300 DPI files precisely calibrated for crisp, gallery-quality printing at any scale.

Included in your download:
✓ 5 High-Resolution Master JPG Files (300 DPI)
✓ Covers over 25+ standard frame dimensions (2:3, 3:4, 4:5, 11:14, and ISO A1–A5)
✓ Comprehensive Printing & Paper Recommendation Guide (PDF)

HOW IT WORKS:
1. Complete your purchase.
2. Download your files immediately from your receipt or account downloads.
3. Print at home, at your local print shop (Walgreens, Staples, Boots, Officeworks), or through an online fine art lab (Gelato, Mpix, Printify).
4. Frame and enjoy your sovereign wall art!

NOTE: Colors may vary slightly due to monitor calibration settings."""

        return {
            "title": title,
            "title_character_count": len(title),
            "niche": niche_key,
            "tags_count": len(valid_tags),
            "tags": valid_tags,
            "description": description,
            "economics": {
                "retail_price_usd": retail_price_usd,
                "etsy_listing_fee_usd": listing_fee,
                "etsy_transaction_fee_usd": tx_fee,
                "payment_processing_fee_usd": proc_fee,
                "total_platform_fees_usd": total_fees,
                "net_profit_per_sale_usd": net_profit,
                "profit_margin_percentage": margin_pct,
                "monthly_net_at_100_sales_usd": round(net_profit * 100, 2),
                "monthly_net_at_500_sales_usd": round(net_profit * 500, 2)
            }
        }
