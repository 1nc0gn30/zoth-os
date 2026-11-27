"""Etsy Listing Synthesizer: 140-Char Titles, 13 Tags, Descriptions & 2026 Fee Economics.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Strict Etsy Invariants:
- Title strictly <= 140 characters.
- Exactly 13 tags, each strictly <= 20 characters.
- Accurate 2026 Etsy fee & margin engine supporting 0%, 12% (>=$10k/yr), and 15% (<$10k/yr)
  Offsite Ads tiers, buyer/POD shipping, ROI %, and exact break-even price.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional


VALID_OFFSITE_RATES = (0.0, 0.12, 0.15)


@dataclass
class ProfitMetrics:
    retail_price: float
    production_cost: float
    shipping_charged: float = 0.0
    shipping_cost: float = 0.0
    gross_revenue: float = 0.0
    etsy_listing_fee: float = 0.20
    etsy_transaction_fee: float = 0.0      # 6.5% of gross revenue (item + shipping)
    etsy_payment_processing: float = 0.0   # 3% + $0.25 of gross revenue
    offsite_ads_rate: float = 0.0          # 0.0, 0.12, or 0.15
    etsy_offsite_ads_fee: float = 0.0
    total_fees: float = 0.0
    total_cogs: float = 0.0
    net_profit: float = 0.0
    margin_percent: float = 0.0
    roi_percent: float = 0.0
    break_even_price: float = 0.0

    @classmethod
    def calculate(
        cls,
        retail: float,
        production: float,
        shipping_charged: float = 0.0,
        shipping_cost: float = 0.0,
        offsite_ads_rate: float = 0.0,
    ) -> ProfitMetrics:
        """Calculate exact 2026 net profit after Etsy marketplace fees & Offsite Ads."""
        retail_f = round(max(0.0, float(retail)), 2)
        prod_f = round(max(0.0, float(production)), 2)
        ship_in = round(max(0.0, float(shipping_charged)), 2)
        ship_out = round(max(0.0, float(shipping_cost)), 2)
        ads_rate = float(offsite_ads_rate)
        if ads_rate not in VALID_OFFSITE_RATES:
            ads_rate = min(VALID_OFFSITE_RATES, key=lambda r: abs(r - ads_rate))

        gross = round(retail_f + ship_in, 2)
        listing_fee = 0.20
        tx_fee = round(gross * 0.065, 2)
        proc_fee = round(gross * 0.03 + 0.25, 2) if gross > 0 else 0.0
        offsite_fee = round(gross * ads_rate, 2)
        total_fees = round(listing_fee + tx_fee + proc_fee + offsite_fee, 2)
        total_cogs = round(prod_f + ship_out, 2)

        net = round(gross - total_cogs - total_fees, 2)
        margin = round((net / gross) * 100.0, 1) if gross > 0 else 0.0
        roi = round((net / total_cogs) * 100.0, 1) if total_cogs > 0 else (100.0 if net > 0 else 0.0)

        # Solve gross * (1 - 0.065 - 0.03 - ads_rate) - 0.45 - total_cogs = 0
        keep_rate = 1.0 - 0.095 - ads_rate
        break_even_gross = round((total_cogs + 0.45) / keep_rate, 2) if keep_rate > 0 else 0.0
        break_even_item = round(max(0.0, break_even_gross - ship_in), 2)

        return cls(
            retail_price=retail_f,
            production_cost=prod_f,
            shipping_charged=ship_in,
            shipping_cost=ship_out,
            gross_revenue=gross,
            etsy_listing_fee=listing_fee,
            etsy_transaction_fee=tx_fee,
            etsy_payment_processing=proc_fee,
            offsite_ads_rate=ads_rate,
            etsy_offsite_ads_fee=offsite_fee,
            total_fees=total_fees,
            total_cogs=total_cogs,
            net_profit=net,
            margin_percent=margin,
            roi_percent=roi,
            break_even_price=break_even_item,
        )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ListingKit:
    cadre: str
    theme_id: str
    product_type: str
    title: str
    tags: List[str]
    description: str
    sizing_chart: Optional[str]
    care_instructions: str
    profit: ProfitMetrics
    seo_score: int = 100

    def validate_invariants(self) -> List[str]:
        """Validate strict Etsy compliance invariants."""
        errors: List[str] = []
        if len(self.title) > 140:
            errors.append(f"Title exceeds 140 chars ({len(self.title)} chars): '{self.title}'")
        if len(self.tags) != 13:
            errors.append(f"Tags count is {len(self.tags)}, must be exactly 13")
        for i, tag in enumerate(self.tags):
            if len(tag) > 20:
                errors.append(f"Tag #{i+1} exceeds 20 chars ({len(tag)} chars): '{tag}'")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["profit"] = self.profit.to_dict()
        d["title_length"] = len(self.title)
        d["tags_count"] = len(self.tags)
        return d


# Canonical 5-Cadre POD Catalog with Real Printify Blueprint/Provider IDs & Gelato v4 UIDs
CADRE_SPECS: Dict[str, Dict[str, Any]] = {
    "apparel": {
        "name": "Grandma's Garden Floral & Family Apparel",
        "product_type": "Comfort Colors 1717 Garment-Dyed Tee / Gildan 18000 Sweatshirt",
        "default_retail": 34.99,
        "default_production": 12.50,
        "default_shipping_cost": 4.75,
        "default_theme": "Grandma's Garden: Where Love Grows",
        "print_dimensions": "4500 x 5400 px (300 DPI)",
        "canvas_width": 4500,
        "canvas_height": 5400,
        "dpi": 300,
        "printify_blueprint_id": 638,
        "printify_provider_id": 29,
        "gelato_product_uid": "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_heavyweight",
    },
    "mugs": {
        "name": "Whimsical Watercolor Animal & Bird Mugs",
        "product_type": "15oz Ceramic Coffee & Tea Mug (Dishwasher & Microwave Safe)",
        "default_retail": 21.99,
        "default_production": 6.80,
        "default_shipping_cost": 4.50,
        "default_theme": "Cozy Chickadees & Porcelain Teacup Still Life",
        "print_dimensions": "2000 x 2000 px / 2700 x 1200 px wrap (300 DPI)",
        "canvas_width": 2000,
        "canvas_height": 2000,
        "dpi": 300,
        "printify_blueprint_id": 68,
        "printify_provider_id": 26,
        "gelato_product_uid": "mug_product_msz_15-oz_mmat_ceramic-white_cl_4-0",
    },
    "totes": {
        "name": "Heavyweight Canvas Farmers Market & Library Totes",
        "product_type": "Liberty Bags OAD 12oz Heavyweight Cotton Canvas Tote",
        "default_retail": 24.99,
        "default_production": 7.20,
        "default_shipping_cost": 4.25,
        "default_theme": "Vintage French Seed Packet Fleurs Sauvages",
        "print_dimensions": "3600 x 3600 px (300 DPI)",
        "canvas_width": 3600,
        "canvas_height": 3600,
        "dpi": 300,
        "printify_blueprint_id": 1090,
        "printify_provider_id": 3,
        "gelato_product_uid": "bag_product_bt_tote-bag_bmat_heavyweight-cotton",
    },
    "wall_art": {
        "name": "High-Res Archival Wall Art & Printable Gallery Packs",
        "product_type": "300 DPI 5-Ratio Archival Print & Printable Bundle (2:3, 3:4, 4:5, 11:14, ISO)",
        "default_retail": 29.99,
        "default_production": 8.50,
        "default_shipping_cost": 4.95,
        "default_theme": "English Countryside Botanical Wildflower Gallery Set",
        "print_dimensions": "4500 x 6000 px (300 DPI Archival Files)",
        "canvas_width": 4500,
        "canvas_height": 6000,
        "dpi": 300,
        "printify_blueprint_id": 49,
        "printify_provider_id": 29,
        "gelato_product_uid": "flat_18x24-inch_200gsm-uncoated",
    },
    "crafting": {
        "name": "Printable Quilting, Embroidery & Crafting Pattern Blueprints",
        "product_type": "Printable Multi-Page Pattern Book, Cutting Diagram & Stitch Guide",
        "default_retail": 18.99,
        "default_production": 4.20,
        "default_shipping_cost": 3.50,
        "default_theme": "Traditional Barn Star Quilt Block Blueprint",
        "print_dimensions": "3600 x 3600 px (300 DPI Vector & PDF Templates)",
        "canvas_width": 3600,
        "canvas_height": 3600,
        "dpi": 300,
        "printify_blueprint_id": 554,
        "printify_provider_id": 29,
        "gelato_product_uid": "notebook_product_nsz_a5_nmat_spiral-matte",
    },
}

VALID_CADRES = frozenset(CADRE_SPECS.keys())


def sanitize_tags(candidate_tags: List[str]) -> List[str]:
    """Ensure exactly 13 unique tags, each strictly <= 20 characters."""
    clean: List[str] = []
    seen = set()

    for t in candidate_tags:
        t_clean = str(t).strip().lower()
        if len(t_clean) > 20:
            t_clean = t_clean[:20].strip()
        if t_clean and t_clean not in seen:
            clean.append(t_clean)
            seen.add(t_clean)
        if len(clean) == 13:
            break

    fallbacks = [
        "grandma gift", "mothers day", "cottagecore", "botanical gift",
        "garden lover", "handmade gift", "nature lover", "personalized gift",
        "gift for mom", "cozy home gift", "floral decor", "vintage garden",
        "family keepsake",
    ]
    for fb in fallbacks:
        if len(clean) >= 13:
            break
        if fb not in seen:
            clean.append(fb)
            seen.add(fb)

    return clean[:13]


def clamp_title(raw_title: str, max_len: int = 140) -> str:
    """Clamp title to Etsy's strict 140 character limit without breaking mid-word."""
    if len(raw_title) <= max_len:
        return raw_title
    truncated = raw_title[:max_len]
    if "," in truncated:
        last_comma = truncated.rfind(",")
        if last_comma > 80:
            return truncated[:last_comma].strip()
    last_space = truncated.rfind(" ")
    if last_space > 80:
        return truncated[:last_space].strip()
    return truncated.strip()


def score_listing_seo(title: str, tags: List[str], description: str = "") -> int:
    """Compute a deterministic 0-100 Etsy SEO score."""
    score = 0
    tlen = len(title.strip())
    if 70 <= tlen <= 140:
        score += 30
    elif 40 <= tlen < 70:
        score += 20
    elif 0 < tlen <= 140:
        score += 10

    if len(tags) == 13:
        score += 25
    else:
        score += int(round((min(len(tags), 13) / 13.0) * 20))

    over_20 = sum(1 for t in tags if len(t) > 20)
    if over_20 == 0 and len(tags) > 0:
        score += 20
    else:
        score += max(0, 20 - over_20 * 5)

    multi_word = sum(1 for t in tags if len(t.split()) >= 2)
    if len(tags) > 0:
        score += int(round((multi_word / len(tags)) * 15))

    if len(description.strip()) >= 120:
        score += 10
    elif len(description.strip()) > 0:
        score += 5

    return max(0, min(100, score))


def synthesize_listing(
    cadre: str,
    custom_title_hook: Optional[str] = None,
    custom_names: Optional[str] = None,
    retail_price: Optional[float] = None,
    production_cost: Optional[float] = None,
    shipping_charged: float = 0.0,
    shipping_cost: float = 0.0,
    offsite_ads_rate: float = 0.0,
) -> ListingKit:
    """Synthesize complete Etsy listing metadata for a given cadre."""
    cadre_key = str(cadre).lower()
    if cadre_key not in CADRE_SPECS:
        cadre_key = "apparel"

    spec = CADRE_SPECS[cadre_key]
    retail = retail_price if retail_price is not None else spec["default_retail"]
    prod = production_cost if production_cost is not None else spec["default_production"]
    profit = ProfitMetrics.calculate(
        retail=retail,
        production=prod,
        shipping_charged=shipping_charged,
        shipping_cost=shipping_cost,
        offsite_ads_rate=offsite_ads_rate,
    )

    if cadre_key == "apparel":
        title_base = (
            f"{custom_title_hook or 'Grandma Garden Sweatshirt'}, Custom Wildflower Sweater, "
            f"Personalized Grandma Gift, Mothers Day Crewneck"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "grandma sweatshirt", "gardener gift", "wildflower sweater",
            "grandmas garden", "grandma crewneck", "mom birthday gift",
            "cottagecore clothes", "comfort colors tee", "plant lover gift",
            "gift for grandma", "botanical shirt", "grandkids names",
            "mothers day gift",
        ])
        names_str = custom_names or "Emma, Liam, Olivia, Noah"
        sizing = (
            "SIZING CHART (Unisex Relaxed Fit - True to Size):\n"
            "- S:   Width 20\" | Length 27\"\n"
            "- M:   Width 22\" | Length 28\"\n"
            "- L:   Width 24\" | Length 29\"\n"
            "- XL:  Width 26\" | Length 30\"\n"
            "- 2XL: Width 28\" | Length 31\"\n"
            "- 3XL: Width 30\" | Length 32\"\n"
            "Tip: For an oversized relaxed fit, size up 1 to 2 sizes."
        )
        care = (
            "CARE & WASHING INSTRUCTIONS:\n"
            "- Machine wash cold, inside out, with like colors.\n"
            "- Use mild detergent; avoid bleach and fabric softeners.\n"
            "- Tumble dry on low or hang dry for lasting graphic clarity.\n"
            "- Do not iron directly on the print."
        )
        desc = (
            f"WELCOME TO GRANDMA'S GARDEN — WHERE LOVE BLOOMS\n\n"
            f"Celebrate family milestones with our Comfort Colors 1717 tee or Gildan 18000 crewneck "
            f"sweatshirt. Each wildflower represents a grandchild's birth month, forming a personalized "
            f"botanical keepsake printed at 300 DPI.\n\n"
            f"PRODUCT DETAILS:\n"
            f"- Comfort Colors 1717 / Gildan 18000 heavy blend fabric (50% cotton / 50% polyester).\n"
            f"- Direct-to-garment (DTG) print with water-based inks built to resist cracking.\n"
            f"- Ideal for Mother's Day, birthdays, holidays, or family announcements.\n\n"
            f"PERSONALIZATION:\n"
            f"Names included: {names_str}\n"
            f"Enter each child's name and birth month in the personalization box.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"PRODUCTION & SHIPPING:\n"
            f"- Printed in the USA in 2-4 business days; tracked standard delivery in 3-5 business days."
        )

    elif cadre_key == "mugs":
        title_base = (
            f"{custom_title_hook or 'Watercolor Bird Coffee Mug 15oz'}, Bird Watcher Gift, "
            f"Cozy Cottagecore Tea Cup, Nature Lover Ceramic Mug"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "bird watcher gift", "watercolor bird mug", "cottagecore mug",
            "bird lover gift", "coffee mug 15oz", "tea lover cup",
            "cardinal mug", "backyard birds", "grandma mug",
            "garden lover gift", "ceramic coffee mug", "nature coffee cup",
            "cute bird gifts",
        ])
        sizing = (
            "SPECIFICATIONS:\n"
            "- Capacity: 15 fluid ounces (0.44 L)\n"
            "- Height: 4.7\" | Diameter: 3.4\"\n"
            "- Material: High-Grade White Ceramic"
        )
        care = "CARE: Dishwasher and microwave safe. Printed with lead-free sublimation inks."
        desc = (
            f"WATERCOLOR SONGBIRDS CERAMIC COFFEE & TEA MUG\n\n"
            f"Start every morning with our watercolor songbirds ceramic mug featuring chickadees, "
            f"eastern bluebirds, and backyard companions beside vintage porcelain tea accents.\n\n"
            f"PRODUCT HIGHLIGHTS:\n"
            f"- Generous 15oz capacity with ergonomic C-handle.\n"
            f"- Dual-sided 300-DPI wraparound print visible in either hand.\n"
            f"- Microwave and top-rack dishwasher safe for daily use.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"PACKAGING: Shipped in crush-resistant protective mailers."
        )

    elif cadre_key == "totes":
        title_base = (
            f"{custom_title_hook or 'Vintage French Seed Packet Canvas Tote'}, Farmers Market Bag, "
            f"Botanical Library Tote, Heavyweight Garden Shopper"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "french seed packet", "canvas tote bag", "farmers market tote",
            "botanical tote", "library book tote", "gardener gift",
            "cottagecore bag", "lavender tote", "heavy canvas tote",
            "market shopping bag", "flower market bag", "vintage botanical",
            "eco friendly bag",
        ])
        sizing = (
            "DIMENSIONS:\n"
            "- Bag Size: 15\" Width x 16\" Height with 3\" Bottom Gusset\n"
            "- Handles: 22\" reinforced straps (11\" shoulder drop)"
        )
        care = "CARE INSTRUCTIONS: Spot clean with cold water and mild soap; air dry flat."
        desc = (
            f"FARMERS MARKET & LIBRARY HEAVYWEIGHT CANVAS TOTE\n\n"
            f"Carry produce, books, and craft supplies in our 12oz natural cotton canvas tote bag. "
            f"Featuring 19th-century botanical seed catalog artwork with heirloom wildflowers and "
            f"French lavender, this bag cleanly balances vintage charm with everyday durability.\n\n"
            f"PRODUCT HIGHLIGHTS:\n"
            f"- Heavy 12oz 100% natural cotton canvas resists sagging under load.\n"
            f"- Reinforced stitching on stress points and 22\" shoulder straps.\n"
            f"- Wide bottom gusset stands upright while loading market finds or hardcover books.\n\n"
            f"{sizing}\n\n"
            f"{care}"
        )

    elif cadre_key == "wall_art":
        title_base = (
            f"{custom_title_hook or 'Vintage Botanical Prints Set of 12'}, Printable Wildflower Wall Art, "
            f"Cottagecore Gallery Decor, Archival 300 DPI Print"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "botanical wall art", "vintage flower prints", "wildflower decor",
            "digital download art", "gallery wall set", "cottagecore decor",
            "printable wall art", "farmhouse wall decor", "living room prints",
            "bathroom art print", "vintage botanical", "flower poster",
            "large wall art",
        ])
        sizing = (
            "INCLUDED ASPECT RATIOS (300 DPI Archival Files):\n"
            "- 2:3 Ratio: 4x6\", 8x12\", 12x18\", 16x24\", 20x30\", 24x36\"\n"
            "- 3:4 Ratio: 6x8\", 9x12\", 12x16\", 18x24\"\n"
            "- 4:5 Ratio: 4x5\", 8x10\", 12x15\", 16x20\"\n"
            "- 11:14 Ratio: 11x14\", 22x28\"\n"
            "- ISO International: A5, A4, A3, A2, A1"
        )
        care = (
            "PRINTING RECOMMENDATIONS:\n"
            "- Print on 200-300 GSM matte archival cotton paper or fulfill via Printify / Gelato gallery frames."
        )
        desc = (
            f"ENGLISH COUNTRYSIDE BOTANICAL GALLERY PRINT SET\n\n"
            f"Restored from antique naturalist herbarium plates at 300 DPI clarity, these botanical "
            f"wildflower plates pair well with oak or walnut frames in living rooms, bedrooms, and studies.\n\n"
            f"WHAT IS INCLUDED:\n"
            f"- High-resolution 5-ratio archival files formatted for US and ISO standard frames.\n"
            f"- Ready for both instant digital delivery and Printify/Gelato framed poster fulfillment.\n\n"
            f"{sizing}\n\n"
            f"{care}"
        )

    else:
        title_base = (
            f"{custom_title_hook or 'Barn Star Quilt Pattern Blueprint'}, Printable Patchwork Guide, "
            f"Lone Star Cutting Chart, Traditional Quilter Gift"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "quilt pattern pdf", "barn star quilt", "lone star pattern",
            "patchwork blueprint", "quilting printable", "quilt block pattern",
            "quilter gift", "traditional quilt", "cutting guide pdf",
            "quilt template", "epp pattern", "sewing project",
            "craft blueprint",
        ])
        sizing = (
            "PATTERN SPECIFICATIONS:\n"
            "- Finished Quilt Size: 64\" x 64\" Throw / Wall Hanging\n"
            "- Block Size: 24\" x 24\" Center Star Medallion\n"
            "- Skill Level: Confident Beginner to Intermediate"
        )
        care = (
            "FORMAT: Illustrated 12-page guide with 1/4\" seam allowance diagrams, "
            "fabric yardage tables, and rotary cutting charts."
        )
        desc = (
            f"TRADITIONAL BARN STAR QUILT PATTERN BLUEPRINT\n\n"
            f"Construct an 8-point Barn Star quilt medallion with clear vector diagrams, "
            f"rotary cutting tables, and pressing arrows designed for accurate diamond seam nesting.\n\n"
            f"WHAT IS INSIDE:\n"
            f"- Fabric yardage charts for Baby, Throw, and Queen layouts.\n"
            f"- Color-coded strip piecing tables and 100%-scale printable templates.\n"
            f"- Step-by-step pressing order so center intersections lie flat.\n\n"
            f"{sizing}\n\n"
            f"{care}"
        )

    seo_score = score_listing_seo(title, tags, desc)

    return ListingKit(
        cadre=cadre_key,
        theme_id=spec["default_theme"],
        product_type=spec["product_type"],
        title=title,
        tags=tags,
        description=desc,
        sizing_chart=sizing,
        care_instructions=care,
        profit=profit,
        seo_score=seo_score,
    )
