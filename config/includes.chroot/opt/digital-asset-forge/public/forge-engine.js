/**
 * Digital Asset Forge - Deterministic 300 DPI Wall-Art & Etsy Pack Engine (v2.6.0)
 * 100% aligned with src/digital_asset_forge/ Python backend.
 * Runs in both Browser (window.DigitalAssetForgeEngine) and Node.js (CommonJS).
 */
(function (root) {
  "use strict";

  const VERSION = "2.6.0";

  const RATIO_FAMILIES = {
    "2x3": {
      id: "2x3",
      label: "2:3 Ratio",
      shortCode: "2:3",
      ratioDecimal: 2 / 3,
      maxPrintSizeInches: '24"x36"',
      inchesW: 24,
      inchesH: 36,
      pixelWidth: 7200,
      pixelHeight: 10800,
      sizesInches: ['4"x6"', '6"x9"', '8"x12"', '10"x15"', '12"x18"', '16"x24"', '20"x30"', '24"x36"'],
      sizesCm: ["10x15cm", "20x30cm", "30x45cm", "40x60cm", "50x75cm", "60x90cm"],
      description: "Universal standard photo ratio scaling cleanly up to 24x36 poster frames."
    },
    "3x4": {
      id: "3x4",
      label: "3:4 Ratio",
      shortCode: "3:4",
      ratioDecimal: 3 / 4,
      maxPrintSizeInches: '18"x24"',
      inchesW: 18,
      inchesH: 24,
      pixelWidth: 5400,
      pixelHeight: 7200,
      sizesInches: ['6"x8"', '9"x12"', '12"x16"', '15"x20"', '18"x24"'],
      sizesCm: ["15x20cm", "30x40cm", "45x60cm"],
      description: "Standard gallery and medium poster frame ratio for gallery wall groupings."
    },
    "4x5": {
      id: "4x5",
      label: "4:5 Ratio",
      shortCode: "4:5",
      ratioDecimal: 4 / 5,
      maxPrintSizeInches: '16"x20"',
      inchesW: 16,
      inchesH: 20,
      pixelWidth: 4800,
      pixelHeight: 6000,
      sizesInches: ['4"x5"', '8"x10"', '12"x15"', '16"x20"'],
      sizesCm: ["10x12cm", "20x25cm", "28x35cm", "40x50cm"],
      description: "Classic American framing standard including 8x10 tabletop and portrait frames."
    },
    "11x14": {
      id: "11x14",
      label: "11:14 Ratio",
      shortCode: "11:14",
      ratioDecimal: 11 / 14,
      maxPrintSizeInches: '11"x14"',
      inchesW: 11,
      inchesH: 14,
      pixelWidth: 3300,
      pixelHeight: 4200,
      sizesInches: ['11"x14"', '22"x28"'],
      sizesCm: ["28x35cm"],
      description: "Dedicated statement art format popular in North American matted frames."
    },
    "iso": {
      id: "iso",
      label: "ISO International Paper",
      shortCode: "ISO",
      ratioDecimal: 1 / 1.4142,
      maxPrintSizeInches: 'A1 (23.4"x33.1")',
      inchesW: 23.39,
      inchesH: 33.11,
      pixelWidth: 7016,
      pixelHeight: 9933,
      sizesInches: ["A1", "A2", "A3", "A4", "A5", '5"x7"'],
      sizesCm: ["59.4x84.1cm (A1)", "42x59.4cm (A2)", "29.7x42cm (A3)", "21x29.7cm (A4)", "14.8x21cm (A5)"],
      description: "International standard paper sizing across Europe, UK, Australia, and Asia."
    }
  };

  const NICHE_TAGS = {
    abstract: [
      "abstract wall art", "digital download", "printable wall art",
      "modern art print", "large wall decor", "gallery wall art",
      "minimalist poster", "neutral home decor", "aesthetic wall art",
      "living room decor", "digital art prints", "300 dpi print", "instant download"
    ],
    botanical: [
      "botanical wall art", "plant lover gift", "printable wall art",
      "greenery poster", "floral art print", "vintage botanical",
      "cottagecore decor", "earthy wall decor", "digital download",
      "nature art print", "bedroom wall art", "300 dpi print", "instant download"
    ],
    landscape: [
      "mountain wall art", "landscape print", "nature photography",
      "panoramic poster", "large canvas art", "scenic wall decor",
      "minimal landscape", "moody landscape", "printable wall art",
      "travel poster", "digital download", "300 dpi print", "instant download"
    ],
    geometric: [
      "geometric wall art", "bauhaus print", "mid century modern",
      "retro wall decor", "abstract shapes", "modern canvas art",
      "colorful poster", "contemporary print", "digital download",
      "studio apartment", "gallery wall print", "300 dpi print", "instant download"
    ]
  };

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function sanitizeTitle(title) {
    const clean = String(title || "Celestial Obsidian Horizon").replace(/[^a-zA-Z0-9\s_-]/g, "");
    return clean.trim().split(/\s+/).filter(Boolean).join("_") || "Artwork_Pack";
  }

  function sanitizeFilenameSlug(title) {
    const cleaned = String(title || "digital-art-pack")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-_]+|[-_]+$/g, "");
    return cleaned.slice(0, 60) || "digital-art-pack";
  }

  function estimateJpegMb(pixelW, pixelH) {
    return round1(((pixelW * pixelH) / (1024 * 1024)) * 0.16);
  }

  function planZipBundles(slug, files, guideFile, maxPackCapMb) {
    const cap = typeof maxPackCapMb === "number" ? maxPackCapMb : 18.0;
    const bundles = [];
    let currentFiles = [];
    let currentSize = 0.0;
    let idx = 1;

    for (const f of files) {
      if (currentSize + f.estimated_mb > cap && currentFiles.length > 0) {
        bundles.push({
          zip_filename: `${slug}_Part_${idx}.zip`,
          contained_files: currentFiles,
          bundle_size_mb: round1(currentSize),
          fits_etsy_limit: currentSize <= 20.0
        });
        idx += 1;
        currentFiles = [];
        currentSize = 0.0;
      }
      currentFiles.push(f.filename);
      currentSize += f.estimated_mb;
    }

    currentFiles.push(guideFile);
    currentSize += 1.2;
    bundles.push({
      zip_filename: `${slug}_Part_${idx}.zip`,
      contained_files: currentFiles,
      bundle_size_mb: round1(currentSize),
      fits_etsy_limit: currentSize <= 20.0
    });

    return {
      etsy_direct_upload_viable: bundles.length <= 5 && bundles.every((b) => b.bundle_size_mb <= 20.0),
      total_zip_archives: bundles.length,
      bundles: bundles,
      alternate_delivery: {
        strategy: "Instant Cloud Access PDF",
        pdf_filename: `${slug}_Direct_Download_Access_Link.pdf`,
        recommended_for: "Collections exceeding 100MB or multi-art bundles"
      }
    };
  }

  function generateManifest(artworkTitle, artistName) {
    const title = String(artworkTitle || "Celestial Obsidian Horizon").trim() || "Celestial Obsidian Horizon";
    const artist = String(artistName || "1nc0gn30").trim() || "1nc0gn30";
    const slug = sanitizeTitle(title);
    const files = [];
    let totalMb = 0.0;

    for (const key of Object.keys(RATIO_FAMILIES)) {
      const spec = RATIO_FAMILIES[key];
      const estMb = estimateJpegMb(spec.pixelWidth, spec.pixelHeight);
      totalMb += estMb;
      const filename =
        key === "iso"
          ? `${slug}_ISO_Paper_300DPI_A1.jpg`
          : `${slug}_${spec.id}_Ratio_300DPI_${spec.maxPrintSizeInches.replace(/"/g, "")}in.jpg`;
      const dimStr = key === "iso" ? "A1 (594x841mm)" : spec.maxPrintSizeInches;

      files.push({
        filename: filename,
        ratio: spec.id,
        label: spec.label,
        max_print_size: dimStr,
        resolution: `${spec.pixelWidth}x${spec.pixelHeight}px`,
        estimated_mb: estMb,
        description: `Master 300 DPI high-resolution file for ${spec.label}. Scales down to all supported sizes in this ratio family.`
      });
    }

    const guideFilename = `${slug}_Customer_Printing_Guide.pdf`;
    totalMb += 1.2;

    return {
      artwork_title: title,
      artist: artist,
      total_files: files.length + 1,
      total_estimated_size_mb: round1(totalMb),
      files: files,
      printing_guide: {
        filename: guideFilename,
        estimated_mb: 1.2,
        type: "PDF Instruction Manual"
      },
      etsy_delivery_plan: planZipBundles(slug, files, guideFilename, 18.0)
    };
  }

  function generatePrintingGuide(artworkTitle, shopName) {
    const title = String(artworkTitle || "Celestial Obsidian Horizon").trim() || "Celestial Obsidian Horizon";
    const shop = String(shopName || "NullAI Studio").trim() || "NullAI Studio";
    const content = [
      `# ${title.toUpperCase()} — PRINTING & FRAMING GUIDE`,
      `Thank you for supporting ${shop}! Below is your complete guide to museum-grade prints from your digital download files.`,
      "",
      "---",
      "",
      "## 1. WHAT FILES ARE INCLUDED?",
      "Your download includes 5 high-resolution (300 DPI) master files calibrated to standard frame aspect ratios:",
      "",
      "| Ratio File | Max Print Size (300 DPI) | Supported Frame Sizes |",
      "| :--- | :--- | :--- |",
      '| **2:3 Ratio** | 24" x 36" (60x90 cm) | 4x6, 6x9, 8x12, 10x15, 12x18, 16x24, 20x30, 24x36 inches |',
      '| **3:4 Ratio** | 18" x 24" (45x60 cm) | 6x8, 9x12, 12x16, 15x20, 18x24 inches |',
      '| **4:5 Ratio** | 16" x 20" (40x50 cm) | 4x5, 8x10, 12x15, 16x20 inches |',
      '| **11:14 Ratio** | 11" x 14" (28x35 cm) | 11x14, 22x28 inches |',
      "| **ISO Series** | A1 (59.4 x 84.1 cm) | A1, A2, A3, A4, A5, 5x7 inches |",
      "",
      "## 2. WHERE TO PRINT",
      "- **Online Fine-Art Labs:** Mpix, FinerWorks, Gelato, theprintspace, Whitewall, Nations Photo Lab",
      "- **Local Print Shops:** FedEx Office, Staples, Office Depot, Walgreens, Boots Photo, Officeworks",
      '- **Home Printing:** Select "Best / High Photo" and "100% Actual Size" (do not use Fit to Page).',
      "",
      "## 3. RECOMMENDED PAPER & FINISH",
      "- **Heavyweight Matte Paper (200-300 gsm):** Zero glare, velvety finish, and deep contrast.",
      "- **Archival Cotton Rag / Giclee:** Gallery-grade acid-free cotton stock.",
      "- **Semi-Gloss / Lustre:** Rich photographic blacks for high-contrast artwork.",
      "",
      "---",
      `© ${shop} • For personal display use only.`
    ].join("\n");

    return {
      title: `${title} Printing Guide`,
      shop_name: shop,
      format: "markdown",
      character_count: content.length,
      content: content
    };
  }

  function generateEtsyListing(artworkTitle, niche, retailPriceUsd) {
    const titleBase = String(artworkTitle || "Celestial Obsidian Horizon").trim() || "Celestial Obsidian Horizon";
    const key = String(niche || "abstract").toLowerCase();
    const nicheKey = Object.prototype.hasOwnProperty.call(NICHE_TAGS, key) ? key : "abstract";
    const tags = NICHE_TAGS[nicheKey].slice(0, 13).map((t) => t.trim().slice(0, 20));
    const price = Number.isFinite(Number(retailPriceUsd)) && Number(retailPriceUsd) > 0 ? Number(retailPriceUsd) : 6.99;

    const nicheLabel = nicheKey.charAt(0).toUpperCase() + nicheKey.slice(1);
    let title = `${titleBase} Digital Download, Printable Wall Art, Modern ${nicheLabel} Poster, 300 DPI High Res Art Pack`;
    if (title.length > 135) {
      title = title.slice(0, 132) + "...";
    }

    const listingFee = 0.2;
    const txFee = round2(price * 0.065);
    const procFee = round2(price * 0.03 + 0.25);
    const totalFees = round2(listingFee + txFee + procFee);
    const netProfit = round2(Math.max(0, price - totalFees));
    const marginPct = price > 0 ? round1((netProfit / price) * 100) : 0.0;

    const description = [
      "INSTANT DIGITAL DOWNLOAD — NO PHYSICAL ITEM WILL BE SHIPPED",
      "",
      `Elevate your space with '${titleBase}'. Includes 5 high-resolution 300 DPI master files calibrated for crisp framing at any scale.`,
      "",
      "Included in your download:",
      "- 5 High-Resolution Master JPG Files (300 DPI)",
      "- Covers 25+ standard frame sizes (2:3, 3:4, 4:5, 11:14, ISO A1-A5)",
      "- Buyer Printing & Paper Recommendation Guide (PRINTING_GUIDE.md / PDF)"
    ].join("\n");

    return {
      title: title,
      title_character_count: title.length,
      niche: nicheKey,
      tags_count: tags.length,
      tags: tags,
      description: description,
      economics: {
        retail_price_usd: round2(price),
        etsy_listing_fee_usd: listingFee,
        etsy_transaction_fee_usd: txFee,
        payment_processing_fee_usd: procFee,
        total_platform_fees_usd: totalFees,
        net_profit_per_sale_usd: netProfit,
        profit_margin_percentage: marginPct,
        monthly_net_at_100_sales_usd: round2(netProfit * 100),
        monthly_net_at_500_sales_usd: round2(netProfit * 500)
      }
    };
  }

  function validateDpiQuality(pixelW, pixelH, targetWIn, targetHIn) {
    const pw = Number(pixelW);
    const ph = Number(pixelH);
    const tw = Number(targetWIn);
    const th = Number(targetHIn);
    const dpiW = tw > 0 ? pw / tw : 0;
    const dpiH = th > 0 ? ph / th : 0;
    const minDpi = Math.min(dpiW, dpiH);

    let rating = "DEFICIENT";
    let label = "Deficient Low Resolution (<150 DPI - Pixelation Risk)";
    let status = "fail";

    if (minDpi >= 300) {
      rating = "MUSEUM_GRADE";
      label = "Museum Archival Quality (300+ DPI)";
      status = "pass";
    } else if (minDpi >= 240) {
      rating = "COMMERCIAL_EXCELLENT";
      label = "Excellent Print Quality (240-299 DPI)";
      status = "pass";
    } else if (minDpi >= 150) {
      rating = "ACCEPTABLE";
      label = "Acceptable Standard Quality (150-239 DPI)";
      status = "warning";
    }

    return {
      effective_dpi: round1(minDpi),
      rating: rating,
      label: label,
      status: status,
      pixel_dimensions: `${pw}x${ph}px`,
      physical_dimensions: `${tw}"x${th}"`
    };
  }

  // Pure-JS CRC32 + Stored PKZIP Builder (for offline/static Netlify fallback)
  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function buildStoredZipBytes(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.name);
      const dataBytes = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
      const crc = crc32(dataBytes);

      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, dataBytes.length, true);
      lv.setUint32(22, dataBytes.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, dataBytes.length, true);
      cv.setUint32(24, dataBytes.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);
      centralParts.push(centralHeader);

      offset += localHeader.length + dataBytes.length;
    }

    let centralSize = 0;
    for (const c of centralParts) centralSize += c.length;

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    const totalLen = offset + centralSize + eocd.length;
    const out = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of localParts) { out.set(p, pos); pos += p.length; }
    for (const c of centralParts) { out.set(c, pos); pos += c.length; }
    out.set(eocd, pos);
    return out;
  }

  const api = {
    VERSION,
    RATIO_FAMILIES,
    NICHE_TAGS,
    sanitizeTitle,
    sanitizeFilenameSlug,
    estimateJpegMb,
    planZipBundles,
    generateManifest,
    generatePrintingGuide,
    generateEtsyListing,
    validateDpiQuality,
    buildStoredZipBytes
  };

  if (typeof root !== "undefined") {
    root.DigitalAssetForgeEngine = api;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
