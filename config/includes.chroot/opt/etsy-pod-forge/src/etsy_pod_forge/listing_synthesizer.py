"""Etsy Listing Synthesizer: High-Converting SEO Titles, 13 Tags, Descriptions & Profit Economics.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Strict Etsy Invariants:
- Title strictly <= 140 characters.
- Exactly 13 tags, each strictly <= 20 characters.
- Comprehensive customer-focused description with gift hooks, sizing, and care.
- Accurate multi-tier profit margin analytics accounting for Etsy transaction and payment fees.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ProfitMetrics:
    retail_price: float
    production_cost: float
    etsy_listing_fee: float = 0.20
    etsy_transaction_fee: float = 0.0      # 6.5% of retail price
    etsy_payment_processing: float = 0.0   # 3% + $0.25
    total_fees: float = 0.0
    net_profit: float = 0.0
    margin_percent: float = 0.0

    @classmethod
    def calculate(cls, retail: float, production: float) -> ProfitMetrics:
        """Calculate accurate net profit after all Etsy marketplace fees."""
        listing_fee = 0.20
        tx_fee = round(retail * 0.065, 2)
        proc_fee = round(retail * 0.03 + 0.25, 2)
        total_costs = production + listing_fee + tx_fee + proc_fee
        net = round(retail - total_costs, 2)
        margin = round((net / retail) * 100.0, 1) if retail > 0 else 0.0

        return cls(
            retail_price=retail,
            production_cost=production,
            etsy_listing_fee=listing_fee,
            etsy_transaction_fee=tx_fee,
            etsy_payment_processing=proc_fee,
            total_fees=round(listing_fee + tx_fee + proc_fee, 2),
            net_profit=net,
            margin_percent=margin,
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


# Cadre catalog definitions
CADRE_SPECS: Dict[str, Dict[str, Any]] = {
    "apparel": {
        "name": "Grandma's Garden Floral & Family Apparel",
        "product_type": "Comfort Colors 1717 Garment-Dyed Tee / Gildan 18000 Sweatshirt",
        "default_retail": 34.99,
        "default_production": 12.50,
        "default_theme": "Grandma's Garden: Where Love Grows",
        "print_dimensions": "4500 x 5400 px (300 DPI)",
    },
    "mugs": {
        "name": "Whimsical Watercolor Animal & Bird Mugs",
        "product_type": "15oz Ceramic Coffee & Tea Mug (Dishwasher & Microwave Safe)",
        "default_retail": 21.99,
        "default_production": 6.80,
        "default_theme": "Cozy Chickadees & Porcelain Teacup Still Life",
        "print_dimensions": "2000 x 2000 px / 2700 x 1200 px wrap (300 DPI)",
    },
    "totes": {
        "name": "Heavyweight Canvas Farmers Market & Library Totes",
        "product_type": "Liberty Bags OAD 12oz Heavyweight Cotton Canvas Tote",
        "default_retail": 24.99,
        "default_production": 7.20,
        "default_theme": "Vintage French Seed Packet Fleurs Sauvages",
        "print_dimensions": "3600 x 3600 px (300 DPI)",
    },
    "wall_art": {
        "name": "High-Res Digital Download Wall Art Packs",
        "product_type": "Instant 300 DPI 5-Ratio Printable ZIP Bundle (2:3, 3:4, 4:5, 11:14, ISO)",
        "default_retail": 9.99,
        "default_production": 0.00,  # Zero production cost (digital)
        "default_theme": "English Countryside Botanical Wildflower Gallery Set",
        "print_dimensions": "4500 x 6000 px (300 DPI Archival Files)",
    },
    "crafting": {
        "name": "Printable Quilting, Embroidery & Crafting Pattern Blueprints",
        "product_type": "Printable Multi-Page PDF Pattern, Cutting Diagram & Stitch Guide",
        "default_retail": 7.50,
        "default_production": 0.00,  # Zero production cost (digital)
        "default_theme": "Traditional Barn Star Quilt Block Blueprint",
        "print_dimensions": "3600 x 3600 px (300 DPI Vector & PDF Templates)",
    },
}


def sanitize_tags(candidate_tags: List[str]) -> List[str]:
    """Ensure exactly 13 unique tags, each strictly <= 20 characters."""
    clean: List[str] = []
    seen = set()

    for t in candidate_tags:
        t_clean = t.strip().lower()
        if len(t_clean) > 20:
            t_clean = t_clean[:20].strip()
        if t_clean and t_clean not in seen:
            clean.append(t_clean)
            seen.add(t_clean)
        if len(clean) == 13:
            break

    # Fallback padding if fewer than 13 tags were supplied
    fallbacks = [
        "grandma gift", "mothers day", "cottagecore", "botanical gift",
        "garden lover", "handmade gift", "nature lover", "personalized gift",
        "gift for mom", "cozy home gift", "floral decor", "vintage garden",
        "family keepsake"
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


def synthesize_listing(
    cadre: str,
    custom_title_hook: Optional[str] = None,
    custom_names: Optional[str] = None,
    retail_price: Optional[float] = None,
    production_cost: Optional[float] = None,
) -> ListingKit:
    """Synthesize complete Etsy listing metadata for a given cadre."""
    cadre_key = cadre.lower()
    if cadre_key not in CADRE_SPECS:
        cadre_key = "apparel"

    spec = CADRE_SPECS[cadre_key]
    retail = retail_price if retail_price is not None else spec["default_retail"]
    prod = production_cost if production_cost is not None else spec["default_production"]
    profit = ProfitMetrics.calculate(retail, prod)

    # 1. Apparel Cadre
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
            "mothers day gift"
        ])
        names_str = custom_names or "Emma, Liam, Olivia, Noah"
        sizing = (
            "📏 SIZING CHART (Unisex Relaxed Fit - True to Size):\n"
            "• S:  Width 20\" | Length 27\"\n"
            "• M:  Width 22\" | Length 28\"\n"
            "• L:  Width 24\" | Length 29\"\n"
            "• XL: Width 26\" | Length 30\"\n"
            "• 2XL: Width 28\" | Length 31\"\n"
            "• 3XL: Width 30\" | Length 32\"\n"
            "💡 Tip: For that trendy oversized cozy aesthetic, size up 1 to 2 sizes!"
        )
        care = (
            "🧺 CARE & WASHING INSTRUCTIONS:\n"
            "• Machine wash cold, inside out, with like colors.\n"
            "• Use mild detergent; avoid bleach and fabric softeners.\n"
            "• Tumble dry on low or hang dry for longest graphic vibrancy.\n"
            "• Do not iron directly on the print."
        )
        desc = (
            f"🌸 WELCOME TO GRANDMA'S GARDEN — WHERE LOVE BLOOMS!\n\n"
            f"Celebrate the most cherished woman in your family with our handcrafted "
            f"Grandma's Garden crewneck sweatshirt or garment-dyed tee. Each wildflower represents "
            f"a grandchild's birth month, creating a deeply sentimental keepsake she will wear with pride.\n\n"
            f"✨ WHY SHE WILL CHERISH THIS:\n"
            f"• Ultra-soft Comfort Colors 1717 / Gildan 18000 heavy blend fleece (50% cotton / 50% polyester).\n"
            f"• Premium direct-to-garment (DTG) print with eco-friendly water-based inks that won't crack or peel.\n"
            f"• The ultimate gift for Mother's Day, Grandma's Birthday, Christmas, or pregnancy reveals!\n\n"
            f"🌿 PERSONALIZATION OPTIONS:\n"
            f"Names included: {names_str}\n"
            f"Simply enter each child's name and birth month in the personalization box, and our studio "
            f"will hand-arrange each coordinating flower into her custom bouquet.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"🚚 FAST US PRODUCTION & SHIPPING:\n"
            f"• Handcrafted and printed in the USA in 2–4 business days.\n"
            f"• Standard tracked shipping: 3–5 business days to your doorstep.\n\n"
            f"💖 100% HAPPINESS GUARANTEE: If she doesn't absolutely tear up with joy, message us for a free replacement!"
        )

    # 2. Mugs Cadre
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
            "cute bird gifts"
        ])
        sizing = "☕ SPECIFICATIONS:\n• Capacity: 15 fluid ounces (0.44 L)\n• Height: 4.7\" | Diameter: 3.4\"\n• Material: 100% High-Grade White Ceramic"
        care = "✨ CARE: 100% Dishwasher & Microwave Safe! Printed with lead-free, non-toxic sublimation inks."
        desc = (
            f"🐦 BRING THE SERENITY OF NATURE TO HER MORNING COFFEE\n\n"
            f"Start every peaceful morning with our whimsical watercolor songbirds ceramic mug. "
            f"Featuring fluffy chickadees, eastern bluebirds, and sweet backyard companions perched beside vintage tea porcelain, "
            f"this mug brings nostalgic warmth to every sip of coffee, tea, or cocoa.\n\n"
            f"🌿 PRODUCT HIGHLIGHTS:\n"
            f"• Large 15oz size with ergonomic C-handle for cozy two-handed holding.\n"
            f"• Vibrant dual-sided wraparound printing so the artwork is visible whether left- or right-handed.\n"
            f"• Microwave and top-rack dishwasher safe for easy everyday enjoyment.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"🎁 PERFECT GIFT FOR:\n"
            f"• Birdwatchers, garden club members, nature lovers, and morning tea enthusiasts.\n"
            f"• Thoughtful Christmas, Mother's Day, or retirement present for Mom or Grandma.\n\n"
            f"📦 SAFELY PACKAGED: Shipped in custom molded crush-proof styrofoam-free mailers to guarantee safe arrival!"
        )

    # 3. Totes Cadre
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
            "eco friendly bag"
        ])
        sizing = "👜 DIMENSIONS:\n• Bag Size: 15\" Width x 16\" Height with 3\" Bottom Gusset\n• Handle Length: 22\" reinforced fabric straps (11\" drop for comfortable shoulder carry)"
        care = "🧼 CARE INSTRUCTIONS:\n• Spot clean with cold water and mild soap.\n• Air dry flat to preserve crisp shape and fabric sizing."
        desc = (
            f"🌻 YOUR TIMELESS COMPANION FOR THE FARMERS MARKET & LIBRARY\n\n"
            f"Step out in effortless French country style with our 12oz heavyweight cotton canvas tote bag. "
            f"Featuring authentic 19th-century botanical seed catalog artwork with heirloom wildflowers and French lavender, "
            f"this bag seamlessly balances vintage charm with everyday durability.\n\n"
            f"✨ WHY YOU'LL REACH FOR THIS DAILY:\n"
            f"• Heavy 12oz 100% natural cotton canvas holds heavy produce, books, and yarn without sagging.\n"
            f"• Reinforced stitching on all stress points and durable 22\" shoulder straps.\n"
            f"• Wide bottom gusset allows tote to stand upright while loading fresh sourdough, flowers, or library novels.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"🌾 SUSTAINABLE & REUSABLE: Replace plastic bags with a durable, heirloom-quality tote you will enjoy for years."
        )

    # 4. Wall Art Cadre
    elif cadre_key == "wall_art":
        title_base = (
            f"{custom_title_hook or 'Vintage Botanical Prints Set of 12'}, Printable Wildflower Wall Art, "
            f"Cottagecore Gallery Decor, Digital Download 300 DPI"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "botanical wall art", "vintage flower prints", "wildflower decor",
            "digital download art", "gallery wall set", "cottagecore decor",
            "printable wall art", "farmhouse wall decor", "living room prints",
            "bathroom art print", "vintage botanical", "flower poster",
            "large wall art"
        ])
        sizing = (
            "🖼️ INCLUDED ASPECT RATIO FILES (Instant 300 DPI High-Res JPG/PDF):\n"
            "• 2:3 Ratio: 4x6\", 8x12\", 12x18\", 16x24\", 20x30\", 24x36\"\n"
            "• 3:4 Ratio: 6x8\", 9x12\", 12x16\", 18x24\"\n"
            "• 4:5 Ratio: 4x5\", 8x10\", 12x15\", 16x20\"\n"
            "• 11:14 Ratio: 11x14\", 22x28\"\n"
            "• ISO International: A5, A4, A3, A2, A1"
        )
        care = "🖨️ PRINTING RECOMMENDATIONS:\n• Print at home on matte photo paper or archival cotton cardstock (200-300 GSM).\n• Or upload directly to Staples, Walgreens, Shutterfly, or Mpix for museum-quality framed prints."
        desc = (
            f"🌿 INSTANT COTTAGECORE CHARM: ENGLISH COUNTRYSIDE BOTANICAL GALLERY\n\n"
            f"Transform your home into a tranquil English countryside cottage with this curated gallery set. "
            f"Scanned from authentic antique naturalist herbarium plates and restored to pristine 300 DPI clarity, "
            f"these botanical wildflowers add timeless elegance to living rooms, bedrooms, entryways, and powder baths.\n\n"
            f"⚡ WHAT YOU RECEIVE IMMEDIATELY:\n"
            f"• Instant access ZIP containing 5 ratio files per artwork (30+ total files).\n"
            f"• Master Printing Guide PDF with paper recommendations and local print shop instructions.\n"
            f"• Zero shipping fees and zero waiting — download and print within minutes!\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"💡 PLEASE NOTE: This is an instant DIGITAL DOWNLOAD product. No physical prints or frames will be mailed."
        )

    # 5. Crafting Cadre
    else:
        title_base = (
            f"{custom_title_hook or 'Barn Star Quilt Pattern PDF'}, Printable Patchwork Blueprint, "
            f"Lone Star Cutting Guide, Traditional Quilter Gift"
        )
        title = clamp_title(title_base)
        tags = sanitize_tags([
            "quilt pattern pdf", "barn star quilt", "lone star pattern",
            "patchwork blueprint", "quilting printable", "quilt block pattern",
            "quilter gift", "traditional quilt", "cutting guide pdf",
            "quilt template", "epp pattern", "sewing project",
            "craft blueprint"
        ])
        sizing = "📐 PATTERN SPECIFICATIONS:\n• Finished Quilt Size: 64\" x 64\" Throw / Wall Hanging\n• Block Size: 24\" x 24\" Center Star Medallion\n• Skill Level: Confident Beginner to Intermediate"
        care = "📄 FORMAT: 12-Page Illustrated PDF Guide with 1/4\" Seam Allowance Diagrams, Fabric Yardage Chart, and Rotary Cutting Cheat Sheets."
        desc = (
            f"🧵 MASTER THE TIMELESS TRADITIONAL BARN STAR QUILT\n\n"
            f"Create an heirloom quilt that will be cherished across generations with our step-by-step Barn Star Blueprint. "
            f"Engineered with clear vector diagrams, precision rotary cutting charts, and visual pressing arrows, "
            f"this pattern takes all the frustration out of matching 8-point diamond seams.\n\n"
            f"✨ WHAT'S INSIDE THE BLUEPRINT:\n"
            f"• Complete fabric yardage requirements for Baby, Throw, and Queen sizes.\n"
            f"• Color-coded strip piecing charts that save hours of hand cutting.\n"
            f"• Full-size printable paper templates (100% scale - no enlargement needed).\n"
            f"• Master Pressing Roadmap to ensure your center points nest flat without bulk.\n\n"
            f"{sizing}\n\n"
            f"{care}\n\n"
            f"✂️ INSTANT PDF ACCESS: Download immediately after purchase and start sewing tonight!"
        )

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
    )
