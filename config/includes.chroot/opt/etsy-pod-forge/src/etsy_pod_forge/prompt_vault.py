"""Prompt Vault: 50+ Battle-Tested AI Image Generation Recipes for Etsy POD.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Targeted specifically at the high-LTV 50-75+ women demographic on Etsy:
Grandma's garden, cozy songbirds, cottagecore, botanical watercolors, and quilting blueprints.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class PromptRecipe:
    id: str
    cadre: str
    title: str
    target_product: str
    subject: str
    style: str
    composition: str
    negative_prompt: str
    aspect_ratio: str
    model: str
    tags: List[str] = field(default_factory=list)

    def full_prompt(self) -> str:
        """Render complete ready-to-paste prompt string."""
        return (
            f"{self.subject}, {self.style}, {self.composition} "
            f"--ar {self.aspect_ratio} --no {self.negative_prompt} --v 6.1"
        )

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["full_prompt"] = self.full_prompt()
        return d


PROMPT_RECIPES: List[PromptRecipe] = [
    # -------------------------------------------------------------------------
    # Cadre 1: "Grandma's Garden" Floral & Family Apparel (12 recipes)
    # -------------------------------------------------------------------------
    PromptRecipe(
        id="apparel-01",
        cadre="apparel",
        title="Grandma's Garden Birth Month Bouquet",
        target_product="Comfort Colors 1717 Tee / Gildan 18000 Sweatshirt",
        subject="Delicate vintage watercolor bouquet of birth-month flowers: sweet peas, larkspur, wild poppies, forget-me-nots, and lavender sprigs tied with a soft sage ribbon",
        style="Delicate hand-painted botanical watercolor on cold-press textured paper, soft muted earth tones, sage green, blush pink, honey buttercup",
        composition="Centered vertical balanced floral arrangement, isolated on pure white background, crisp vector-clean silhouette, no background clutter, print-ready",
        negative_prompt="photorealistic, 3d render, dark heavy shadows, blurry, watermark, text, low resolution, noisy background",
        aspect_ratio="4:5",
        model="Midjourney v6.1 / Flux.1",
        tags=["grandma", "garden", "wildflower", "bouquet", "apparel", "birth flower"]
    ),
    PromptRecipe(
        id="apparel-02",
        cadre="apparel",
        title="In My Gardening Era Wildflower Meadow",
        target_product="Gildan 18000 Crewneck Sweatshirt (Moss/Sand)",
        subject="Whimsical watercolor gardening scene with vintage copper watering can overflowing with daisies, cosmos, and bumblebees hovering nearby",
        style="Cozy cottagecore watercolor illustration, soft gouache highlights, nostalgic warmth, English countryside aesthetic",
        composition="Centered arched floral arrangement, isolated on crisp clean transparent background, high definition 300 DPI suitable for direct-to-garment printing",
        negative_prompt="photo, harsh digital contrast, neon colors, gradient background, cutoff flowers, signature, border",
        aspect_ratio="4:5",
        model="Midjourney v6.1 / Flux.1",
        tags=["gardening era", "watering can", "bumblebees", "sweatshirt", "cottagecore"]
    ),
    PromptRecipe(
        id="apparel-03",
        cadre="apparel",
        title="Plant Smiles, Grow Laughter, Harvest Love Wreath",
        target_product="Comfort Colors 1717 (Pepper/Terracotta)",
        subject="Circular lush wreath of heirloom garden roses, eucalyptus leaves, baby's breath, and ripe blackberries with delicate botanical vines",
        style="Fine-line botanical ink engraving with soft pastel watercolor washes, Victorian herbarium botanical plate",
        composition="Perfect circular wreath design with open center for custom text, pure solid white background, high detail sharp edges",
        negative_prompt="photorealism, dark gradient, cropped edges, messy outlines, grain, saturated neon",
        aspect_ratio="1:1",
        model="Flux.1 / Midjourney v6.1",
        tags=["wreath", "roses", "botanical", "family", "grandma", "t-shirt"]
    ),
    PromptRecipe(
        id="apparel-04",
        cadre="apparel",
        title="Nana's Little Blossoms Wildflower Patch",
        target_product="Gildan 18000 Sweatshirt (Dusty Rose)",
        subject="Row of 5 distinct hand-painted watercolor wildflowers with stems and rootlets: violet, daisy, buttercup, bluebell, and poppy standing in meadow grass",
        style="Loose storybook watercolor illustration, whimsical and gentle, soft brush bleeding, Beatrix Potter heritage feel",
        composition="Horizontal linear botanical row, centered, pure white backdrop, cleanly separable stems, isolated for garment chest print",
        negative_prompt="harsh lighting, photography, messy splatters, solid black lines, low res, frame",
        aspect_ratio="16:9",
        model="Midjourney v6.1",
        tags=["nana", "blossoms", "grandkids", "meadow", "sweatshirt"]
    ),
    PromptRecipe(
        id="apparel-05",
        cadre="apparel",
        title="Honeybee & Lavender Garden Sprigs",
        target_product="Comfort Colors 1717 (Ivory/Sand)",
        subject="Two fluffy bumblebees collecting pollen from Provence lavender stalks and golden chamomile blossoms",
        style="Vintage French botanical watercolor wash, warm honey and lavender purple tones, fine hair detailing on bumblebees",
        composition="Graceful vertical spray, isolated on transparent white background, vector-clean edges for screen printing",
        negative_prompt="dark shadows, photograph, realistic insect horror, extra wings, muddy colors",
        aspect_ratio="4:5",
        model="Flux.1",
        tags=["honeybee", "lavender", "french garden", "chamomile", "comfort colors"]
    ),
    PromptRecipe(
        id="apparel-06",
        cadre="apparel",
        title="Raised on Sweet Tea & Sunshine Floral Banner",
        target_product="Gildan 18000 Crewneck (Sand/Terracotta)",
        subject="Vintage Mason jar bouquet filled with yellow sunflowers, white hydrangeas, and trailing sweet peas tied with rustic twine",
        style="Warm southern cottagecore watercolor, soft sunlit glow, nostalgic pastel hues",
        composition="Centered front-facing print, pure white canvas, high resolution 300 DPI apparel asset",
        negative_prompt="photo, table background, reflective room glare, digital artifacts, text",
        aspect_ratio="4:5",
        model="Midjourney v6.1",
        tags=["mason jar", "sunflowers", "sweet tea", "southern", "grandma gift"]
    ),
    PromptRecipe(
        id="apparel-07",
        cadre="apparel",
        title="Grandma: The Heart of Our Family Tree",
        target_product="Gildan 18000 Sweatshirt (Ivory/Pepper)",
        subject="Stately weeping willow and flowering dogwood branches forming an organic heart-shaped botanical canopy with miniature songbirds perched",
        style="Art Nouveau watercolor and sepia ink wash, elegant curving botanical lines, muted olive and dusty blush palette",
        composition="Heart-shaped botanical silhouette, centered, clean white ground, balanced symmetry",
        negative_prompt="cluttered, dark mud, photographic human faces, geometric harsh lines, watermark",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["heart", "family tree", "dogwood", "willow", "grandma sweater"]
    ),
    PromptRecipe(
        id="apparel-08",
        cadre="apparel",
        title="Just A Girl Who Loves Her Garden & Her Grandbabies",
        target_product="Comfort Colors 1717 Tee (Moss)",
        subject="Vintage wooden wheelbarrow overflowing with pastel garden blossoms, terracotta flower pots, and a pair of floral gardening gloves",
        style="Storybook watercolor wash with delicate pencil outline, charming English cottage garden vibe",
        composition="Centered isometric view, clean transparent isolation, crisp textile printing separation",
        negative_prompt="photo, grass background, blurred focus, modern plastic tools, cartoon eyes",
        aspect_ratio="4:5",
        model="Midjourney v6.1",
        tags=["wheelbarrow", "gardening gloves", "terracotta", "grandbabies", "tee"]
    ),
    PromptRecipe(
        id="apparel-09",
        cadre="apparel",
        title="Faith, Family, and Flowers Floral Cross",
        target_product="Gildan 18000 Sweatshirt (Dusty Rose/Ivory)",
        subject="An ornate rustic wooden cross intertwined with climbing white lilies, blush peonies, and olive branch vines",
        style="Reverent classical watercolor illustration, soft ethereal lighting, gentle muted botanicals",
        composition="Vertical centered motif, crisp pure white isolation, high print resolution",
        negative_prompt="flamboyant, neon, gothic, dark brooding, photographic, jagged lines",
        aspect_ratio="4:5",
        model="Flux.1",
        tags=["faith", "cross", "lilies", "peonies", "easter", "mothers day"]
    ),
    PromptRecipe(
        id="apparel-10",
        cadre="apparel",
        title="Mother’s Day Wildflower Field Horizon",
        target_product="Comfort Colors 1717 (Pepper/Sand)",
        subject="A dense horizontal border of spring meadow blooms including bluebells, buttercups, Queen Anne’s lace, and pink clover",
        style="Textured dry-brush watercolor on handmade rag paper, delicate botanical accuracy",
        composition="Continuous horizontal chest-width panoramic strip, bottom-anchored, clean isolated top",
        negative_prompt="sky background, mountains, fences, people, photo, digital gradient",
        aspect_ratio="16:9",
        model="Midjourney v6.1",
        tags=["meadow border", "wildflower strip", "spring blooms", "mothers day"]
    ),
    PromptRecipe(
        id="apparel-11",
        cadre="apparel",
        title="Life is Better in Grandma's Kitchen & Garden",
        target_product="Gildan 18000 Sweatshirt (Sand)",
        subject="Arrangement of vintage rolling pin, ceramic mixing bowl, fresh rosemary sprigs, and lemon blossom branches",
        style="Nostalgic farmhouse watercolor, warm dough, soft ceramic cream, and vibrant citrus greenery",
        composition="Harmonious centered flat-lay cluster, isolated on pure white backdrop",
        negative_prompt="modern appliances, dirty counter, dark vignetting, photographic glare",
        aspect_ratio="4:5",
        model="Flux.1",
        tags=["baking", "kitchen", "lemon blossoms", "rosemary", "grandma kitchen"]
    ),
    PromptRecipe(
        id="apparel-12",
        cadre="apparel",
        title="Gigi's Garden Club Floral Crest",
        target_product="Comfort Colors 1717 (Pepper)",
        subject="Heraldic botanical crest composed of intertwined heirloom peonies, goldenrod, hummingbirds, and vintage spade trowels",
        style="Colonial Williamsburg lithograph print with hand-tinted watercolor accents, sophisticated classic aesthetic",
        composition="Symmetrical heraldic shield arrangement, crisp outer bounds, pure white ground",
        negative_prompt="modern logo, neon vector, low resolution, clipped edges, blurry",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["gigi", "garden club", "crest", "hummingbird", "heirloom"]
    ),

    # -------------------------------------------------------------------------
    # Cadre 2: Whimsical Watercolor Animal & Bird Mugs (11 recipes)
    # -------------------------------------------------------------------------
    PromptRecipe(
        id="mug-01",
        cadre="mugs",
        title="Cozy Chickadees & Porcelain Teacup Still Life",
        target_product="15oz Ceramic Mug (White / Two-Tone Sage)",
        subject="Two fluffy black-capped chickadees perched on the rim of an antique rose-patterned porcelain teacup overflowing with forget-me-nots and red winter berries",
        style="Whimsical storybook watercolor illustration, soft gouache feather highlights, cozy nostalgic warmth, Beatrix Potter heritage aesthetic",
        composition="Centered vertical vignette, isolated on clean solid white background, fine brushstrokes, rich botanical details, vector-clean mug wrap silhouette",
        negative_prompt="photorealistic, dark room, harsh shadow, cutoff mug, messy splatters, 3d render, watermark",
        aspect_ratio="1:1",
        model="Midjourney v6.1 / Flux.1",
        tags=["chickadee", "songbirds", "teacup", "coffee mug", "nature lover"]
    ),
    PromptRecipe(
        id="mug-02",
        cadre="mugs",
        title="Northern Cardinal on Snow-Dusted Pine Branch",
        target_product="15oz Ceramic Mug (White / Red Handle)",
        subject="Vibrant scarlet male cardinal perched proudly on a snow-dusted eastern white pine bough with winter holly berries and golden winter light",
        style="Classic American naturalist watercolor, John James Audubon inspired with gentle soft storybook charm",
        composition="Centered balanced composition, pure white background for full mug wrap, crisp plumage edge definition",
        negative_prompt="harsh photo, blurry, dead branches, distorted beak, gray muddy snow",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["cardinal", "winter bird", "holly", "christmas gift", "mug"]
    ),
    PromptRecipe(
        id="mug-03",
        cadre="mugs",
        title="Eastern Bluebird with Apple Blossoms",
        target_product="15oz Ceramic Mug (White)",
        subject="Pair of serene eastern bluebirds nestled among blooming pink and white apple blossoms with fresh spring leaves",
        style="Delicate watercolor and colored pencil wash, pastel cerulean blue and blush petals",
        composition="Horizontal wraparound dual-sided layout, isolated on white ground, high resolution 300 DPI",
        negative_prompt="dark night background, cage, photographic depth of field blur, unnatural pose",
        aspect_ratio="2:1",
        model="Midjourney v6.1",
        tags=["bluebird", "apple blossoms", "spring birds", "mug wrap", "tea cup"]
    ),
    PromptRecipe(
        id="mug-04",
        cadre="mugs",
        title="American Goldfinch on Purple Coneflower",
        target_product="15oz Ceramic Mug (White / Yellow Handle)",
        subject="Bright yellow American goldfinch perched delicately on a purple coneflower (Echinacea) seed head in summer sunlight",
        style="Luminous botanical watercolor illustration, rich sunny yellows and deep purple petal tones",
        composition="Centered vertical vignette, clean white background, razor-sharp botanical and feather detail",
        negative_prompt="photo, weed garden, blurry background, pixelated, signature, text",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["goldfinch", "coneflower", "summer birds", "yellow bird", "ceramic mug"]
    ),
    PromptRecipe(
        id="mug-05",
        cadre="mugs",
        title="Ruby-Throated Hummingbird & Fuchsia Blossoms",
        target_product="15oz Ceramic Mug (Two-Tone Dusty Rose)",
        subject="Iridescent ruby-throated hummingbird hovering mid-flight sipping nectar from drooping fuchsia bells and morning glory vines",
        style="Gouache and watercolor botanical illustration, iridescent throat sheen, delicate wing motion blur",
        composition="Dynamic centered composition, pure white isolated background, crisp ceramic sublimation file",
        negative_prompt="flash photography, unnatural neon, messy brush drips, dark background",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["hummingbird", "fuchsia", "morning glory", "birdwatcher", "gift"]
    ),
    PromptRecipe(
        id="mug-06",
        cadre="mugs",
        title="Gentle Highland Cow with Wildflower Flower Crown",
        target_product="15oz Ceramic Mug (White)",
        subject="Adorable fluffy Scottish Highland calf with a lush bohemian crown of daisies, buttercups, and eucalyptus foliage",
        style="Soft watercolor portrait, warm caramel and honey fur tones, gentle compassionate eyes, storybook warmth",
        composition="Centered front-facing portrait, isolated on pure white background, balanced margins",
        negative_prompt="horns piercing frame, scary cow, photo, muddy field, flies, watermark",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["highland cow", "flower crown", "cottagecore", "calf", "farmhouse mug"]
    ),
    PromptRecipe(
        id="mug-07",
        cadre="mugs",
        title="Golden Retriever with Garden Basket & Roses",
        target_product="15oz Ceramic Mug (White / Sage Handle)",
        subject="Sweet smiling golden retriever holding a small wicker basket filled with fresh cut garden roses and daisies in its mouth",
        style="Heartwarming nostalgic watercolor portrait, golden amber highlights, expressive friendly expression",
        composition="Centered portrait, clean white ground, seamless print sublimation alignment",
        negative_prompt="aggressive dog, photorealism, red eyes, distorted snout, dirty grass",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["golden retriever", "dog lover", "garden basket", "grandma dog", "mug"]
    ),
    PromptRecipe(
        id="mug-08",
        cadre="mugs",
        title="Sleepy Calico Cat Among Lavender Pots",
        target_product="15oz Ceramic Mug (White)",
        subject="Cozy fluffy calico cat curled up asleep beside terracotta pots of fragrant blooming lavender and chamomile",
        style="Gentle watercolor and ink wash, cozy homebody cottage aesthetic, peaceful tranquil mood",
        composition="Horizontal mug wrap format, isolated on crisp white background, perfect panoramic ceramic wrap",
        negative_prompt="photo, scratching, distorted paws, messy litter, dark room",
        aspect_ratio="2:1",
        model="Flux.1",
        tags=["calico cat", "cat lover", "sleeping cat", "lavender", "tea mug"]
    ),
    PromptRecipe(
        id="mug-09",
        cadre="mugs",
        title="Cottagecore Bunny Rabbit in Cabbage Patch",
        target_product="15oz Ceramic Mug (White)",
        subject="Fluffy English cottontail bunny nibbling on wild clover beside heirloom savoy cabbage and baby carrots with floral wreath",
        style="Classic Beatrix Potter watercolor aesthetic, soft muted vintage pastels, charming whimsical character",
        composition="Centered circular vignette, pure white background, print-ready 300 DPI",
        negative_prompt="photo, rabbit cage, taxidermy, dark shadows, modern typography",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["bunny", "rabbit", "beatrix potter", "cottagecore", "easter mug"]
    ),
    PromptRecipe(
        id="mug-10",
        cadre="mugs",
        title="Coffee, Books, and Birds Trio Vignette",
        target_product="15oz Ceramic Mug (Two-Tone Sage)",
        subject="Stack of three antique leather-bound books topped with a steaming ceramic coffee mug, surrounded by a perched nuthatch and scattered autumn acorns",
        style="Warm rustic watercolor and sepia ink illustration, cozy autumn library ambience",
        composition="Vertical centered stack, isolated on pure white, ideal for book club and bird lovers",
        negative_prompt="modern paperback covers, steam blocking bird, photographic, dark table",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["books", "coffee", "birds", "book club", "reading mug", "autumn"]
    ),
    PromptRecipe(
        id="mug-11",
        cadre="mugs",
        title="Tea & Tranquility Chamomile Tea Set",
        target_product="15oz Ceramic Mug (White)",
        subject="Vintage porcelain teapot with delicate gold trim steaming beside fresh chamomile flowers, honey dipper, and miniature blue tit songbird",
        style="Delicate French country watercolor, tranquil pastel whites, warm gold accents, soft floral washes",
        composition="Centered vignette, pure white background, high-contrast sublimation print ready",
        negative_prompt="photo, cracked china, dirty spill, messy watercolor splatters, watermark",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["tea", "chamomile", "blue tit", "teapot", "tranquility", "mug"]
    ),

    # -------------------------------------------------------------------------
    # Cadre 3: Heavyweight Canvas Farmers Market & Library Totes (10 recipes)
    # -------------------------------------------------------------------------
    PromptRecipe(
        id="tote-01",
        cadre="totes",
        title="Vintage French Seed Packet Fleurs Sauvages",
        target_product="Liberty Bags OAD Heavyweight Canvas Tote",
        subject="Retro 19th-century French botanical seed catalog label for 'Fleurs Sauvages & Lavande de Provence', featuring wild poppies, cornflowers, and lavender sprigs",
        style="Lithograph engraving style with soft pastel watercolor washes, elegant serif typography, ornate floral filigree borders, antique aged parchment texture",
        composition="Square centered heritage label format, crisp decorative borders, high-definition vector-clean line art, isolated on clean background",
        negative_prompt="modern barcode, glossy plastic, low resolution, illegible distorted letters, blurry",
        aspect_ratio="1:1",
        model="Midjourney v6.1 / Flux.1",
        tags=["french seed packet", "tote bag", "lavender", "canvas tote", "farmers market"]
    ),
    PromptRecipe(
        id="tote-02",
        cadre="totes",
        title="Heirloom Tomato Varieties Botanical Poster",
        target_product="Canvas Market Tote (Natural/Black)",
        subject="Botanical watercolor study of six heirloom tomato varieties: Cherokee Purple, Brandywine, Green Zebra, Yellow Pear, and Roma on leafy vines",
        style="Scientific botanical illustration, rich appetizing heirloom colors, vintage gardener field guide aesthetic",
        composition="Balanced 2x3 grid with botanical banner, pure white background, crisp textile separation",
        negative_prompt="rotten tomatoes, supermarket stickers, photo, messy garden soil, dark vignette",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["heirloom tomato", "garden tote", "farmers market", "vegetable art"]
    ),
    PromptRecipe(
        id="tote-03",
        cadre="totes",
        title="Book Club Enthusiast / Reading is My Haven",
        target_product="Heavyweight Canvas Library Tote",
        subject="Whimsical watercolor pile of beloved classic novels entwined with trailing ivy, wild roses, spectacles, and a steaming teacup",
        style="Romantic cozy library watercolor, warm paper tones, soft pastel floral accents, literary charm",
        composition="Centered pyramid composition, pure white ground, bold silhouette visible across a library room",
        negative_prompt="modern Kindle, barcode, electronic devices, photographic glare, torn covers",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["book club", "library tote", "reading", "books", "canvas bag"]
    ),
    PromptRecipe(
        id="tote-04",
        cadre="totes",
        title="Local Honey & Wildflower Apiary Crest",
        target_product="Heavyweight Canvas Farmers Market Tote",
        subject="Victorian apiary crest with a golden beehive skep, buzzing bumblebees, clover blossoms, and honeycomb hexagons",
        style="Woodcut engraving with soft honey-gold and sage watercolor tinting, heritage artisanal farm branding",
        composition="Circular heraldic crest with floral border, isolated on clean white canvas ground",
        negative_prompt="chemical warning, modern plastic squeeze bottle, neon yellow, photographic",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["local honey", "apiary", "beehive", "bumblebee", "market tote"]
    ),
    PromptRecipe(
        id="tote-05",
        cadre="totes",
        title="Fresh Cut Flowers Daily Farmhouse Truck",
        target_product="Natural Canvas Market Tote",
        subject="Vintage 1950s turquoise pickup truck with wooden stake sides overflowing with galvanized buckets of sunflowers, hydrangeas, and peonies",
        style="Charming Americana watercolor illustration, gentle rustic patina, sunny feel-good mood",
        composition="Centered 3/4 angle vehicle view, clean white background, razor-sharp POD print quality",
        negative_prompt="modern sports car, rust decay, flat tire, photographic asphalt, smog",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["flower truck", "farmhouse", "fresh flowers", "sunflowers", "canvas tote"]
    ),
    PromptRecipe(
        id="tote-06",
        cadre="totes",
        title="Herb Garden Field Guide Botanical Study",
        target_product="Canvas Grocery & Market Tote",
        subject="Neat botanical study of culinary herbs: Rosemary, Thyme, Sage, Basil, Mint, and Oregano tied in rustic herb bundles",
        style="Vintage apothecary botanical watercolor, rich forest greens and earthy tones, elegant cursive labels",
        composition="Symmetrical botanical panel arrangement, pure white ground, high resolution 300 DPI",
        negative_prompt="dead brown herbs, plastic supermarket packaging, messy kitchen counter, blurry",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["herbs", "kitchen garden", "botanical study", "farmers market tote"]
    ),
    PromptRecipe(
        id="tote-07",
        cadre="totes",
        title="Wild Mushroom & Forest Forager Guide",
        target_product="Heavyweight Canvas Foraging Tote",
        subject="Enchanting watercolor array of woodland mushrooms: morels, chanterelles, porcini, and parasols surrounded by moss and fern fronds",
        style="Naturalist field journal watercolor, earthy ochre, moss green, and terracotta palette",
        composition="Clustered organic composition, pure white ground, ideal for nature lovers and mycophiles",
        negative_prompt="poisonous cartoon mushrooms with red eyes, photographic dark dirt, low resolution",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["mushrooms", "foraging", "botanical", "woodland", "nature tote"]
    ),
    PromptRecipe(
        id="tote-08",
        cadre="totes",
        title="Vintage Sourdough & Country Bakery Kitchen",
        target_product="Canvas Bread & Market Tote",
        subject="Rustic golden artisan sourdough boule with scored wheat sheaf pattern beside fresh wheat stalks, wooden bread peel, and flour dust",
        style="Warm heritage culinary watercolor, golden crust tones, cozy artisanal bakery feel",
        composition="Centered horizontal arrangement, clean white background for high-contrast textile screen printing",
        negative_prompt="moldy bread, modern plastic bag, sliced white sandwich loaf, photographic",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["sourdough", "artisan bread", "baking tote", "country kitchen", "farmers market"]
    ),
    PromptRecipe(
        id="tote-09",
        cadre="totes",
        title="Just One More Chapter Whimsical Cat Tote",
        target_product="Canvas Library & Book Tote",
        subject="Fluffy ginger tabby cat curled atop a massive stack of colorful vintage hardcover books with open bookmark ribbon",
        style="Cozy watercolor storybook illustration, warm autumn palette, charming character",
        composition="Centered vertical illustration, pure white ground, high clarity print file",
        negative_prompt="aggressive cat, scratched books, dark room, modern devices, blurry",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["cat", "books", "library tote", "reader gift", "book lover"]
    ),
    PromptRecipe(
        id="tote-10",
        cadre="totes",
        title="Peace, Love, & Gardening Botanical Shovel",
        target_product="Heavyweight Canvas Garden Tote",
        subject="Antique steel garden trowel surrounded by climbing sweet pea vines, butterflies, and miniature garden snails",
        style="Gentle English cottage watercolor wash, soft sage and lavender tones, nostalgic gardening peace",
        composition="Vertical centered tool motif, clean white backdrop, durable bold shapes",
        negative_prompt="rusty broken tool, muddy mess, dark shadows, photographic, watermark",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["trowel", "sweet peas", "gardening tote", "cottagecore", "grandma gift"]
    ),

    # -------------------------------------------------------------------------
    # Cadre 4: High-Res Digital Download Wall Art Packs (10 recipes)
    # -------------------------------------------------------------------------
    PromptRecipe(
        id="wallart-01",
        cadre="wall_art",
        title="English Countryside Botanical Wildflower Gallery",
        target_product="300 DPI 5-Ratio Wall Art Pack (2:3, 3:4, 4:5, 11:14, ISO A1)",
        subject="Museum-grade botanical portrait of English foxglove and wild meadow poppies on textured cold-press watercolor parchment",
        style="Authentic 19th-century Curtis’s Botanical Magazine style, delicate stippling, rich archival pigments",
        composition="Full bleed vertical art print, balanced margins, exquisite specimen plate with Latin nomenclature placeholder",
        negative_prompt="blurry, photographic, low resolution, digital banding, noisy background, neon",
        aspect_ratio="4:5",
        model="Midjourney v6.1 / Flux.1",
        tags=["wall art", "botanical print", "foxglove", "gallery wall", "digital download"]
    ),
    PromptRecipe(
        id="wallart-02",
        cadre="wall_art",
        title="Vintage Songbird Field Guide Plate",
        target_product="Printable Wall Art (Archival 300 DPI)",
        subject="Pair of Cedar Waxwings perched on an autumn mountain ash branch laden with orange berries",
        style="Audubon-style naturalist watercolor, feather-by-feather anatomical precision, soft parchment wash backdrop",
        composition="Vertical composition with generous framing margins, suitable for matting in 16x20 or 24x36 frames",
        negative_prompt="photorealistic flash, dead bird, unnatural plumage colors, pixelation",
        aspect_ratio="3:4",
        model="Flux.1",
        tags=["cedar waxwing", "bird print", "audubon", "field guide", "wall art"]
    ),
    PromptRecipe(
        id="wallart-03",
        cadre="wall_art",
        title="Cozy Kitchen Herb & Spice Infographic Art",
        target_product="Kitchen Gallery Wall Art Pack",
        subject="Artistic botanical study of 9 culinary herbs arranged in an elegant 3x3 grid: Rosemary, Sage, Thyme, Basil, Oregano, Mint, Tarragon, Dill, Chives",
        style="Fine pen-and-ink engraving with delicate watercolor washes on ivory archival paper",
        composition="Structured 3x3 grid layout with vintage typography titles under each specimen, elegant border frame",
        negative_prompt="misspelled words, modern sans-serif font, photographic, dirty background",
        aspect_ratio="4:5",
        model="Midjourney v6.1",
        tags=["kitchen art", "herb chart", "culinary print", "farmhouse kitchen", "wall decor"]
    ),
    PromptRecipe(
        id="wallart-04",
        cadre="wall_art",
        title="Moody Victorian Fern & Moss Study",
        target_product="Dark Botanical Living Room Wall Art",
        subject="Lush study of Maidenhair and Ostrich ferns with delicate fronds and forest moss spores",
        style="Dark botanical lithograph, deep forest green, antique sage, and rich bronze shadows on aged vellum",
        composition="Full vertical portrait, ornate filigree corner accents, high archival fidelity",
        negative_prompt="bright neon, flat vector, plastic plants, modern interior photo, low resolution",
        aspect_ratio="2:3",
        model="Flux.1",
        tags=["ferns", "dark botanical", "victorian print", "moss", "living room art"]
    ),
    PromptRecipe(
        id="wallart-05",
        cadre="wall_art",
        title="Wildflower Meadow Landscape at Sunset",
        target_product="Panoramic Living Room Canvas / Digital Download",
        subject="Endless rolling hills covered in summer wildflowers under a warm golden-hour sky with distant farmhouse silhouette",
        style="Impressionist watercolor with soft blended washes and loose expressive brushwork, Monet inspired",
        composition="Horizontal landscape with 1/3 foreground wildflower focus and 2/3 soft sunset sky",
        negative_prompt="wind turbines, modern telephone poles, highway, photographic, oversaturated",
        aspect_ratio="16:9",
        model="Midjourney v6.1",
        tags=["landscape", "wildflower meadow", "sunset", "impressionist", "large wall art"]
    ),
    PromptRecipe(
        id="wallart-06",
        cadre="wall_art",
        title="Antique French Rose Varieties Quadriptych",
        target_product="Bedroom Gallery Wall Set (4 Prints)",
        subject="Four heirloom French garden roses: Damask, Centifolia, Gallica, and Moss rose with botanical hips and thorns",
        style="Pierre-Joseph Redouté classical botanical watercolor, peerless floral elegance, velvety petal texture",
        composition="Clean vertical botanical specimen plate, soft cream paper ground, museum reproduction grade",
        negative_prompt="wilted flowers, brown spots, photographic camera artifacts, harsh digital glare",
        aspect_ratio="3:4",
        model="Flux.1",
        tags=["redoute roses", "french rose", "heirloom roses", "botanical set", "bedroom art"]
    ),
    PromptRecipe(
        id="wallart-07",
        cadre="wall_art",
        title="Coastal Shorebirds Watercolor Collection",
        target_product="Coastal Farmhouse Bathroom / Bedroom Wall Art",
        subject="Piping plovers and sandpipers scurrying along wet tidal sands with sea oats and weathered driftwood",
        style="Breezy coastal watercolor, muted seafoam green, soft dune sand, and ocean mist blues",
        composition="Wide horizontal art print, tranquil peaceful negative space, high resolution 300 DPI",
        negative_prompt="trash on beach, tourists, plastic, harsh midday sun, oversaturated blue",
        aspect_ratio="2:3",
        model="Midjourney v6.1",
        tags=["coastal art", "shorebirds", "sandpipers", "beach house decor", "wall print"]
    ),
    PromptRecipe(
        id="wallart-08",
        cadre="wall_art",
        title="Vintage Butterfly & Moth Natural History Chart",
        target_product="Study & Craft Room Art Print",
        subject="Twelve meticulously painted North American butterflies and moths: Monarch, Luna Moth, Swallowtail, and Cecropia on aged linen",
        style="Victorian entomology field guide illustration, delicate wing scale patterns, rich natural mineral pigments",
        composition="Balanced 3x4 taxonomy chart with specimen numbers and delicate decorative rule lines",
        negative_prompt="scary insects, spiders, distorted wings, cartoonish bugs, blurry text",
        aspect_ratio="4:5",
        model="Flux.1",
        tags=["butterflies", "luna moth", "entomology", "taxonomy chart", "nature wall art"]
    ),
    PromptRecipe(
        id="wallart-09",
        cadre="wall_art",
        title="Country Garden Vegetable Harvest Still Life",
        target_product="Farmhouse Dining Room Wall Decor",
        subject="Abundant wooden basket filled with freshly dug carrots, purple artichokes, radishes, and leafy greens beside an antique ceramic pitcher",
        style="Dutch Golden Age still life reimagined in soft warm watercolor, rich harvest earth tones",
        composition="Classic centered still life pyramid, dramatic soft natural side lighting, museum grade print",
        negative_prompt="plastic supermarket packaging, modern kitchen, rotten produce, flash glare",
        aspect_ratio="4:5",
        model="Midjourney v6.1",
        tags=["vegetable harvest", "still life", "dining room art", "farmhouse decor"]
    ),
    PromptRecipe(
        id="wallart-10",
        cadre="wall_art",
        title="Cozy Winter Pine & Cardinal Art Print",
        target_product="Holiday & Winter Seasonal Wall Art",
        subject="Pair of cardinals perched in a snow-covered cedar arbor with pinecones and winter berries under soft twilight snowfall",
        style="Nostalgic Currier & Ives style watercolor, serene hush of winter snowfall, festive warmth",
        composition="Framed vertical vignette, generous border margins, instant printable holiday decor",
        negative_prompt="santa claus, garish neon christmas lights, cartoon characters, blurry",
        aspect_ratio="3:4",
        model="Flux.1",
        tags=["winter art", "cardinal print", "snow scene", "seasonal decor", "holiday print"]
    ),

    # -------------------------------------------------------------------------
    # Cadre 5: Printable Quilting, Embroidery & Crafting Pattern Blueprints (10 recipes)
    # -------------------------------------------------------------------------
    PromptRecipe(
        id="craft-01",
        cadre="crafting",
        title="Traditional Barn Star Quilt Block Blueprint",
        target_product="Printable PDF Quilt Pattern & Cutting Guide",
        subject="Crisp geometric 8-point Lone Star patchwork quilt block pattern with intricate diamond sub-divisions and floral fabric texture fills",
        style="Technical architectural quilting blueprint with clean vector line work, soft watercolor calico fabric swatches",
        composition="Square 1:1 format, centered quilt block, accurate 1/4 inch seam allowance visual indicators, high contrast for home printing",
        negative_prompt="distorted geometry, crooked lines, blurry pattern, photorealistic messy bed, 3d shadows",
        aspect_ratio="1:1",
        model="Flux.1 / Midjourney v6.1",
        tags=["quilt pattern", "barn star", "lone star", "patchwork blueprint", "quilting printable"]
    ),
    PromptRecipe(
        id="craft-02",
        cadre="crafting",
        title="Wildflower Meadow Hand Embroidery Transfer Pattern",
        target_product="Printable Stick-and-Stitch Embroidery Sheet",
        subject="Delicate botanical line art pattern of lavender, chamomile, bees, and poppies with stitch guide annotations (French knot, satin stitch, stem stitch)",
        style="Crisp black and white line art transfer pattern with subtle pastel color reference key, vintage needlework guide",
        composition="Circular embroidery hoop layout (suitable for 6-inch and 8-inch hoops), pure white background, razor-sharp printable lines",
        negative_prompt="solid black fills, fuzzy lines, grayscale gradients, photo of finished cloth, low res",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["embroidery pattern", "hand embroidery", "wildflower transfer", "stick and stitch"]
    ),
    PromptRecipe(
        id="craft-03",
        cadre="crafting",
        title="Vintage Log Cabin Quilt Block Variations",
        target_product="Quilt Pattern Blueprint & Layout Guide",
        subject="Four classic Log Cabin quilt block variations (Furrow, Straight Furrow, Barn Raising, Chevron) displayed with rich cranberry and sage colorways",
        style="Precision technical pattern layout, clear piecing diagrams, vintage Americana quilting heritage aesthetic",
        composition="Balanced 2x2 multi-block diagram with step numbers and cutting dimensions indicators",
        negative_prompt="uneven strips, warped geometry, photographic bedding, blurry",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["log cabin quilt", "quilt pattern", "quilting blueprint", "craft printable"]
    ),
    PromptRecipe(
        id="craft-04",
        cadre="crafting",
        title="Heirloom Cross-Stitch Botanical Alphabet Sampler",
        target_product="Counted Cross-Stitch Pattern PDF Chart",
        subject="Complete cross-stitch alphabet sampler adorned with miniature botanical motifs: roses, acorns, strawberries, and bluebirds",
        style="Victorian schoolgirl needlework sampler, clear counted grid symbols, nostalgic heritage color palette (DMC floss codes compatible)",
        composition="Full vertical rectangular sampler layout with ornate cross-stitch border and decorative numbers",
        negative_prompt="blurry grid, unreadable symbols, modern vector clipart, photographic fabric",
        aspect_ratio="3:4",
        model="Flux.1",
        tags=["cross-stitch", "alphabet sampler", "counted cross stitch", "botanical sampler"]
    ),
    PromptRecipe(
        id="craft-05",
        cadre="crafting",
        title="Grandmother’s Flower Garden Hexagon Quilt Pattern",
        target_product="English Paper Piecing (EPP) Printable Templates",
        subject="Geometric English Paper Piecing layout of nested concentric 1-inch hexagons forming pastel floral rosettes with connecting path borders",
        style="Crisp geometric technical drawing with pastel vintage floral calico fabric fills, clear cutting lines",
        composition="Repeating honeycomb rosette pattern, pure white background, vector-accurate angles",
        negative_prompt="irregular hexagon sizes, crooked alignment, photographic wrinkling, low resolution",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["english paper piecing", "epp pattern", "grandmothers flower garden", "hexies"]
    ),
    PromptRecipe(
        id="craft-06",
        cadre="crafting",
        title="Botanical Wreath Redwork Embroidery Template",
        target_product="Redwork / Bluework Embroidery Transfer PDF",
        subject="Graceful circular wreath of rose hips, pine sprigs, and songbirds drawn in traditional redwork single-line style",
        style="Classic American redwork embroidery illustration, crisp crimson line art on pure white, elegant heirloom stitchery",
        composition="Circular centered pattern designed for an 8-inch round hoop, clear dashed stitch lines",
        negative_prompt="multicolor fills, solid block colors, fuzzy antialiasing, photographic",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["redwork", "embroidery pattern", "wreath", "needlework", "winter embroidery"]
    ),
    PromptRecipe(
        id="craft-07",
        cadre="crafting",
        title="Appliqué Folk Art Songbird & Tulip Pattern",
        target_product="Printable Fabric Appliqué Template & Placement Guide",
        subject="Pennsylvania Dutch inspired folk art design featuring two mirror-image distelfink songbirds, heart motif, and blooming tulip urn",
        style="Warm American folk art pattern with bold silhouette shapes for wool felt or cotton appliqué, soft earthy colorway",
        composition="Symmetrical centered medallion layout, clean contour outlines with seam allowance guides",
        negative_prompt="photorealistic bird, complex tiny pieces, gradient shading, photographic fabric texture",
        aspect_ratio="1:1",
        model="Midjourney v6.1",
        tags=["applique", "folk art", "wool felt", "pennsylvania dutch", "quilt pattern"]
    ),
    PromptRecipe(
        id="craft-08",
        cadre="crafting",
        title="Flying Geese & Feathered Star Modern Traditional Quilt",
        target_product="Modern Traditional Quilt Pattern Booklet",
        subject="Dynamic quilt block combining flying geese border rings with an intricate feathered star center in navy, mustard, and linen colorways",
        style="Modern traditional quilting blueprint, precision geometric layout with crisp graphic definition",
        composition="Square centerpiece block with assembly arrow indicators and fabric requirements key",
        negative_prompt="distorted points, misaligned corners, 3d shadows, blurry line work",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["flying geese", "feathered star", "modern quilt", "quilt pattern printable"]
    ),
    PromptRecipe(
        id="craft-09",
        cadre="crafting",
        title="Sashiko Japanese Mending & Stitching Grids",
        target_product="Printable Sashiko Transfer Grids (4 Pack)",
        subject="Four traditional Sashiko geometric stitch grids: Asanoha (Hemp Leaf), Seigaiha (Ocean Wave), Shippo Tsunagi (Seven Treasures), and Kaki no Hana (Persimmon)",
        style="Minimalist indigo and white Japanese embroidery grid, clean dotted guidelines for running stitches",
        composition="4-panel printable sheet, razor-sharp vector line precision, pure white backdrop",
        negative_prompt="irregular spacing, blurry dots, dirty paper, photographic denim, color gradients",
        aspect_ratio="1:1",
        model="Flux.1",
        tags=["sashiko", "japanese embroidery", "visible mending", "asanoha", "stitch pattern"]
    ),
    PromptRecipe(
        id="craft-10",
        cadre="crafting",
        title="Cottage Garden Felt Floral Brooch Templates",
        target_product="Printable Cut-and-Sew Felt Craft Pattern",
        subject="Individual petal and leaf template pieces for 5 dimensional felt flowers: English Rose, Anemone, Ranunculus, Hydrangea, and Eucalyptus spray",
        style="Clean technical cut-file layout with numbered assembly steps, stitch indicators, and color-coded piece guides",
        composition="Organized flat pattern layout, clear alignment notches, suitable for paper scissors or Cricut cutting",
        negative_prompt="messy hand sketch, photographic finished flowers, missing notches, low res",
        aspect_ratio="4:5",
        model="Midjourney v6.1",
        tags=["felt flowers", "craft pattern", "brooch template", "diy florals", "printable craft"]
    ),
]


def get_all_prompts() -> List[PromptRecipe]:
    """Return all prompt recipes."""
    return PROMPT_RECIPES


def get_prompts_by_cadre(cadre: str) -> List[PromptRecipe]:
    """Filter recipes by cadre name ('apparel', 'mugs', 'totes', 'wall_art', 'crafting')."""
    return [p for p in PROMPT_RECIPES if p.cadre.lower() == cadre.lower()]


def get_prompt_by_id(pid: str) -> Optional[PromptRecipe]:
    """Find a prompt recipe by unique ID."""
    for p in PROMPT_RECIPES:
        if p.id == pid:
            return p
    return None


def search_prompts(query: str) -> List[PromptRecipe]:
    """Search recipes by keywords across title, subject, tags, and cadre."""
    q = query.lower()
    return [
        p for p in PROMPT_RECIPES
        if q in p.title.lower() or q in p.subject.lower() or any(q in t.lower() for t in p.tags) or q in p.cadre.lower()
    ]
