#!/usr/bin/env python3
"""Build 100% Open-Access Web Showcase for YourDigitalSpace Master Catalog.

Reads catalog_manifest.json and writes public/index.html with zero paywalls,
zero third-party payment popups, interactive run-rate calculator, and Printify payload export.
Zero external dependencies.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "catalog_manifest.json"
PUBLIC_DIR = ROOT / "public"
OUTPUT_HTML = PUBLIC_DIR / "index.html"

TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YourDigitalSpace — Day 7 Master Print-on-Demand Catalog</title>
  <meta name="description" content="10 high-converting Etsy Print-on-Demand products optimized for 55+ women, grandmothers, gardeners, and crafters. __BLENDED_MARGIN__% blended profit margin with full Printify payloads.">
  <meta name="keywords" content="etsy, print on demand, printify, cottagecore, grandma gifts, wildflower, botanical, margins, seo tags">
  <meta name="author" content="1nc0gn30 (@1nc0gn30) • NullAI Platform">
  <link rel="canonical" href="https://yourdigitalspace.nullai.tech/">

  <!-- OpenGraph Meta -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://yourdigitalspace.nullai.tech/">
  <meta property="og:title" content="YourDigitalSpace — Day 7 Master Print-on-Demand Catalog">
  <meta property="og:description" content="10 Production-Ready Etsy POD Products. 100/100 SEO Score, __BLENDED_MARGIN__% Blended Margin, 300 DPI Canvases & Printify API Payloads.">
  <meta property="og:image" content="https://yourdigitalspace.nullai.tech/assets/mockups/prod-01-grandma-garden-sweatshirt_mockup.jpg">

  <!-- Twitter Meta -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@1nc0gn30">
  <meta name="twitter:creator" content="@1nc0gn30">
  <meta name="twitter:title" content="YourDigitalSpace — Day 7 Master Etsy POD Catalog">
  <meta name="twitter:description" content="10 Production-Ready Etsy POD Products. 100/100 SEO Score, __BLENDED_MARGIN__% Blended Margin.">
  <meta name="twitter:image" content="https://yourdigitalspace.nullai.tech/assets/mockups/prod-01-grandma-garden-sweatshirt_mockup.jpg">

  <!-- Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">

  <!-- Schema.org JSON-LD Graph -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "YourDigitalSpace Etsy POD Catalog Showcase",
        "url": "https://yourdigitalspace.nullai.tech/",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All modern web browsers",
        "creator": {
          "@type": "Person",
          "name": "1nc0gn30",
          "alternateName": "1nc0gn30 • NullAI",
          "sameAs": "https://github.com/1nc0gn30"
        },
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "priceValidUntil": "2027-12-31",
          "availability": "https://schema.org/InStock",
          "url": "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
        },
        "description": "Comprehensive 10-product Etsy Print-on-Demand catalog optimized for 55+ women demographic with __BLENDED_MARGIN__% blended profit margin, 13/13 tag sets, and Printify payloads."
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is included with each product in the YourDigitalSpace catalog?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Every product includes full 13/13 high-converting Etsy SEO tags (100/100 score), verified print canvas master artwork at 300 DPI, photorealistic mockups, optimized product description with sizing charts, and 1-click Printify API JSON fulfillment payloads."
            }
          },
          {
            "@type": "Question",
            "name": "Can I publish these directly to my Etsy shop or Printify store?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! The JSON payloads match the Printify v1 catalog schema and can be submitted directly via API or imported into the Etsy Connector MCP bridge for instant publishing."
            }
          },
          {
            "@type": "Question",
            "name": "How can I support YourDigitalSpace and ZothOS?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "YourDigitalSpace is 100% free and open access for everyone with zero paywalls. If our tools and print-on-demand assets help your business thrive, you can support us via Buy Us a Coffee (Stripe) or on-chain Solana tip."
            }
          }
        ]
      }
    ]
  }
  </script>
  <style>
    :root {
      --bg: #09090b;
      --bg-card: rgba(24, 24, 27, 0.7);
      --bg-card-hover: rgba(39, 39, 42, 0.85);
      --border: rgba(255, 255, 255, 0.08);
      --border-gold: rgba(212, 175, 55, 0.4);
      --gold: #d4af37;
      --gold-bright: #ffd700;
      --gold-dim: #a38520;
      --emerald: #10b981;
      --rose: #f43f5e;
      --cyan: #38bdf8;
      --purple: #a855f7;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --text-dim: #71717a;
      --font-display: 'Syne', sans-serif;
      --font-body: 'Plus Jakarta Sans', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font-body);
      min-height: 100vh;
      overflow-x: hidden;
      line-height: 1.5;
    }

    /* Conic mesh background glow */
    .bg-glow {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(circle at 15% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 20%, rgba(244, 63, 94, 0.06) 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
    }

    .container {
      width: 100%;
      max-width: 1380px;
      margin: 0 auto;
      padding: 0 1rem 5rem 1rem;
      position: relative;
      z-index: 1;
      overflow-x: hidden;
    }

    /* Header */
    header {
      padding: 2.5rem 0 1.5rem 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
      width: 100%;
    }

    .brand-title {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .brand-logo-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .brand-logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #18181b, #27272a);
      border: 1px solid var(--border-gold);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold-bright);
      font-size: 1.2rem;
    }

    h1 {
      font-family: var(--font-display);
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #ffffff 40%, var(--gold-bright) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid var(--border-gold);
      color: var(--gold-bright);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sub-tagline {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .pro-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      background: rgba(39, 39, 42, 0.8);
      border: 1px solid var(--border);
      color: var(--text-muted);
      transition: all 0.2s ease;
    }

    .pro-badge.active {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 215, 0, 0.1));
      border: 1px solid var(--gold);
      color: var(--gold-bright);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.25);
    }

    /* Sales Funnel Banner Above The Fold */
    .sales-funnel-banner {
      background: linear-gradient(135deg, rgba(28, 25, 23, 0.95), rgba(24, 24, 27, 0.95));
      border: 1px solid var(--border-gold);
      border-radius: 18px;
      padding: 1.5rem 2rem;
      margin-bottom: 2.5rem;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      align-items: center;
      gap: 2rem;
      box-shadow: 0 10px 40px -10px rgba(212, 175, 55, 0.15);
      position: relative;
      overflow: hidden;
    }

    .banner-beam {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: conic-gradient(from 0deg, transparent 0deg, rgba(212, 175, 55, 0.1) 60deg, transparent 120deg);
      animation: rotateBeam 12s linear infinite;
      pointer-events: none;
    }

    @keyframes rotateBeam {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .banner-content {
      position: relative;
      z-index: 1;
    }

    .banner-urgent-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }

    .banner-title {
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.5rem;
      line-height: 1.25;
    }

    .banner-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      line-height: 1.45;
    }

    .banner-perks {
      display: flex;
      flex-wrap: wrap;
      gap: 0.85rem;
      font-size: 0.8rem;
      color: #e4e4e7;
    }

    .banner-perks span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .banner-cta-card {
      position: relative;
      z-index: 1;
      background: rgba(9, 9, 11, 0.75);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      backdrop-filter: blur(12px);
    }

    .pricing-row {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin-bottom: 0.5rem;
    }

    .price-regular {
      font-size: 1.15rem;
      color: var(--text-dim);
      text-decoration: line-through;
    }

    .price-discounted {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--gold-bright);
    }

    .price-badge {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: var(--emerald);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
    }

    .checkout-rail-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: 100%;
      margin: 0.85rem 0;
    }

    .btn-stripe {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: linear-gradient(135deg, #d4af37, #f59e0b);
      color: #09090b;
      font-weight: 800;
      font-size: 0.9rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
    }

    .btn-stripe:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45);
    }

    .btn-solana {
      width: 100%;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      background: rgba(24, 24, 27, 0.9);
      color: #e4e4e7;
      font-weight: 700;
      font-size: 0.85rem;
      border: 1px solid rgba(168, 85, 247, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .btn-solana:hover {
      background: rgba(39, 39, 42, 0.95);
      border-color: var(--purple);
      color: #ffffff;
    }

    .activate-key-link {
      font-size: 0.78rem;
      color: var(--text-muted);
      text-decoration: underline;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .activate-key-link:hover {
      color: var(--gold-bright);
    }

    /* Bento Financial Grid */
    .bento-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .bento-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .bento-card:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: var(--bg-card-hover);
    }

    .bento-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .bento-value {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
    }

    .bento-sub {
      font-size: 0.75rem;
      color: var(--text-dim);
    }

    .bento-card.highlight {
      border-color: var(--border-gold);
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(24, 24, 27, 0.7));
    }

    .bento-card.highlight .bento-value {
      color: var(--gold-bright);
    }

    /* Interactive Profit Calculator Section */
    .calculator-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.75rem 2rem;
      margin-bottom: 2.5rem;
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 2rem;
      align-items: center;
      backdrop-filter: blur(12px);
    }

    .calc-controls {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .calc-title {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
    }

    .calc-slider-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .calc-slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .calc-slider-val {
      font-weight: 800;
      color: var(--gold-bright);
      font-family: var(--font-display);
    }

    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #27272a;
      outline: none;
    }

    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--gold-bright);
      cursor: pointer;
      box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
    }

    .calc-results {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .calc-result-box {
      background: rgba(9, 9, 11, 0.6);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .calc-result-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .calc-result-num {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--emerald);
    }

    .calc-result-num.treasury {
      color: var(--gold-bright);
    }

    /* Filter Tabs & Search Row */
    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .filter-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-tab {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-tab:hover {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .filter-tab.active {
      background: rgba(212, 175, 55, 0.15);
      border-color: var(--gold);
      color: var(--gold-bright);
    }

    .search-input {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.55rem 1rem;
      font-size: 0.85rem;
      color: #ffffff;
      outline: none;
      width: 100%;
      max-width: 320px;
      min-width: 0;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--gold);
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3.5rem;
    }

    .product-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.25s ease;
      backdrop-filter: blur(10px);
    }

    .product-card:hover {
      transform: translateY(-3px);
      border-color: rgba(212, 175, 55, 0.3);
      box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.5);
    }

    .card-media {
      position: relative;
      width: 100%;
      height: 280px;
      background: #141418;
      overflow: hidden;
      cursor: pointer;
    }

    .card-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .product-card:hover .card-media img {
      transform: scale(1.04);
    }

    .card-cadre-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(9, 9, 11, 0.8);
      backdrop-filter: none;
      border: 1px solid var(--border);
      color: #ffffff;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .card-seo-tag {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(16, 185, 129, 0.85);
      color: #09090b;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .card-body {
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.9rem;
    }

    .card-title {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7rem;
    }

    .card-financials {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      background: rgba(9, 9, 11, 0.5);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.65rem 0.8rem;
    }

    .fin-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .fin-label {
      font-size: 0.68rem;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .fin-val {
      font-size: 0.95rem;
      font-weight: 800;
      color: #ffffff;
    }

    .fin-val.profit {
      color: var(--emerald);
    }

    .fin-val.margin {
      color: var(--gold-bright);
    }

    .card-tags-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      max-height: 62px;
      overflow: hidden;
      position: relative;
    }

    .tag-pill {
      background: rgba(39, 39, 42, 0.6);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: auto;
    }

    .btn-action {
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      border: 1px solid var(--border);
      background: rgba(24, 24, 27, 0.8);
      color: #e4e4e7;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }

    .btn-action:hover {
      background: rgba(39, 39, 42, 1);
      border-color: rgba(255, 255, 255, 0.25);
    }

    .btn-export-payload {
      grid-column: span 2;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(24, 24, 27, 0.8));
      border-color: var(--border-gold);
      color: var(--gold-bright);
    }

    .btn-export-payload:hover {
      background: rgba(212, 175, 55, 0.25);
      border-color: var(--gold);
    }

    /* Master Production & Fulfillment Vault */
    .vault-section {
      background: var(--bg-card);
      border: 1px solid var(--border-gold);
      border-radius: 18px;
      padding: 2.5rem 2rem;
      margin-bottom: 4rem;
      position: relative;
      overflow: hidden;
    }

    .vault-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .vault-header h2 {
      font-family: var(--font-display);
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--text);
      margin-bottom: 0.5rem;
    }

    .vault-header p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }

    .vault-code-container {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .vault-code-pre {
      background: #09090b;
      padding: 2rem;
      font-family: monospace;
      font-size: 0.85rem;
      color: #a1a1aa;
      line-height: 1.6;
    }

    html[data-theme="light"] {
      --bg: #FBF9F5;
      --bg-card: #FFFFFF;
      --bg-card-hover: #F3EFE6;
      --border: rgba(17, 24, 39, 0.12);
      --border-gold: rgba(154, 107, 22, 0.45);
      --gold: #9A6B16;
      --gold-bright: #854D0E;
      --gold-dim: #713F12;
      --emerald: #047857;
      --rose: #E11D48;
      --cyan: #0369A1;
      --purple: #7E22CE;
      --text: #111827;
      --text-muted: #4B5563;
      --text-dim: #6B7280;
    }

    html[data-theme="light"] .sales-funnel-banner,
    html[data-theme="light"] .bento-card,
    html[data-theme="light"] .calculator-section,
    html[data-theme="light"] .product-card,
    html[data-theme="light"] .vault-section,
    html[data-theme="light"] .banner-cta-card,
    html[data-theme="light"] .calc-result-box {
      background: #FFFFFF !important;
      color: #111827 !important;
      border-color: rgba(17, 24, 39, 0.14) !important;
    }

    html[data-theme="light"] .banner-title,
    html[data-theme="light"] .brand-logo-row h1,
    html[data-theme="light"] .bento-value,
    html[data-theme="light"] .calc-title,
    html[data-theme="light"] .card-title,
    html[data-theme="light"] .fin-val,
    html[data-theme="light"] .banner-perks,
    html[data-theme="light"] .banner-perks span,
    html[data-theme="light"] .banner-cta-card div {
      color: #111827 !important;
      background: none !important;
      -webkit-text-fill-color: #111827 !important;
    }

    html[data-theme="light"] .vault-code-pre {
      background: #F3EFE6 !important;
      color: #1F2937 !important;
    }

    /* Modals */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-card {
      background: #121216;
      border: 1px solid var(--border-gold);
      border-radius: 18px;
      max-width: 720px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }

    .modal-close-btn {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      background: rgba(39, 39, 42, 0.6);
      border: 1px solid var(--border);
      color: var(--text-muted);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .modal-close-btn:hover {
      color: #ffffff;
      background: #27272a;
    }

    .modal-title {
      font-family: var(--font-display);
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1rem;
      padding-right: 2rem;
    }

    .modal-media-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .modal-media-box {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: #09090b;
    }

    .modal-media-box img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      display: block;
    }

    .modal-media-label {
      padding: 0.5rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(24, 24, 27, 0.9);
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .modal-copy-block {
      background: #09090b;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      font-size: 0.85rem;
      color: #d4d4d8;
      line-height: 1.6;
      white-space: pre-wrap;
      max-height: 240px;
      overflow-y: auto;
      margin-bottom: 1.25rem;
    }

    .modal-key-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #09090b;
      color: #ffffff;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      outline: none;
    }

    .modal-key-input:focus {
      border-color: var(--gold);
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 2.5rem 0 1rem 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    footer a {
      color: var(--gold);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    /* Responsiveness */
    @media (max-width: 1024px) {
      .sales-funnel-banner {
        grid-template-columns: 1fr;
      }
      .bento-grid {
        grid-template-columns: repeat(3, 1fr);
      }
      .calculator-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .bento-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .products-grid {
        grid-template-columns: 1fr;
      }
      .modal-media-grid {
        grid-template-columns: 1fr;
      }
      .calc-results {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0 0.75rem 3.5rem 0.75rem;
      }
      .brand-title {
        width: 100%;
      }
      .brand-logo-row {
        width: 100%;
      }
      h1 {
        font-size: 1.35rem;
      }
      .sales-funnel-banner {
        padding: 1.25rem 1rem;
      }
      .banner-title {
        font-size: 1.2rem;
      }
      .banner-perks {
        flex-direction: column;
        gap: 0.4rem;
      }
      .bento-grid {
        grid-template-columns: 1fr;
      }
      .calculator-section {
        padding: 1.25rem 1rem;
      }
      .search-input {
        max-width: 100%;
      }
      .products-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
  <link rel="stylesheet" href="wave.css">
  <link rel="stylesheet" href="wave-states.css">
</head>
<body>

<div id="zoth-coffee-support-bar" style="background: linear-gradient(90deg, rgba(16,185,129,0.12), rgba(212,175,55,0.14)); border-bottom: 1px solid rgba(212,175,55,0.35); padding: 8px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; z-index: 9999;">
  <span style="color: #10B981; font-weight: 800;">✦ 100% FREE &amp; OPEN ACCESS · ZERO PAYWALLS</span>
  <a href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X" target="_blank" rel="noopener noreferrer" style="background: #D4AF37; color: #08080B; padding: 4px 12px; border-radius: 6px; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">☕ Buy Us a Coffee (Stripe)</a>
</div>

  <div class="bg-glow"></div>

  <div class="container">
    <!-- Header -->
    <header>
      <div class="brand-title">
        <div class="brand-logo-row">
          <div class="brand-logo-icon">✦</div>
          <h1>YourDigitalSpace</h1>
          <span class="badge-tag">v2.5.0 • Day 7 Master</span>
        </div>
        <div class="sub-tagline">
          NullAI Commerce Suite • Demographic Focus: 55+ Women, Grandmothers, Cottagecore, Crafters
        </div>
      </div>

      <div class="header-actions">
        <div id="proBadge" class="pro-badge active">
          <span>✦ 100% FREE & OPEN ACCESS</span>
        </div>
        <button id="themeToggleBtn" type="button" class="btn-action" onclick="toggleTheme()" style="width: auto; padding: 0.45rem 0.9rem; cursor: pointer;">
          ☀️ Light Mode
        </button>
        <a href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X" target="_blank" rel="noopener" class="btn-action" style="background: rgba(212,175,55,0.15); border-color: var(--border-gold); color: var(--gold-bright); text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
          ☕ Buy Us a Coffee
        </a>
      </div>
    </header>

    <!-- Above-The-Fold Sovereign Showcase Banner -->
    <section class="sales-funnel-banner">
      <div class="banner-beam"></div>
      <div class="banner-content">
        <div class="banner-urgent-pill" style="border-color: rgba(52,211,153,0.4); color: #34d399; background: rgba(52,211,153,0.1);">
          ✦ 100% Free & Open-Access Sovereign Catalog
        </div>
        <h2 class="banner-title">
          10 Master Print-on-Demand Listings Built for __BLENDED_MARGIN__% Net Margins
        </h2>
        <p class="banner-desc">
          Engineered for Etsy's highest-converting demographic (55+ women, grandmothers, garden enthusiasts). Every product is paired with 300 DPI master canvases, lifestyle mockups, 13/13 long-tail SEO tag sets, and 1-click Printify API fulfillment payloads. Unlocked completely by default with zero paywalls.
        </p>
        <div class="banner-perks">
          <span>✓ 10 Master Etsy Listings</span>
          <span>✓ 100/100 A+ SEO Tag Sets</span>
          <span>✓ 10 Printify API JSONs</span>
          <span>✓ $__TOTAL_PROFIT__ Net Profit / Basket</span>
          <span>✓ Commercial Rights Included</span>
        </div>
      </div>

      <div class="banner-cta-card">
        <div style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-bottom: 0.35rem;">
          ☕ Support Autonomous Development
        </div>
        <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.8rem;">
          Free and open tools forever. If these listings help you build, consider buying us a coffee via Stripe.
        </div>

        <div class="checkout-rail-buttons">
          <a class="btn-stripe" href="https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X" target="_blank" rel="noopener" style="text-decoration: none; text-align: center;">
            <span>☕ Buy Us a Coffee (Stripe)</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Bento Portfolio Metrics -->
    <section class="bento-grid">
      <div class="bento-card highlight">
        <div class="bento-label">Active Master Products</div>
        <div class="bento-value">10 Items</div>
        <div class="bento-sub">Apparel, Mugs, Totes, Art, Patterns</div>
      </div>

      <div class="bento-card">
        <div class="bento-label">Combined Basket Retail</div>
        <div class="bento-value">$__TOTAL_RETAIL__</div>
        <div class="bento-sub">Average Order Value: $20.34</div>
      </div>

      <div class="bento-card">
        <div class="bento-label">Production COGS</div>
        <div class="bento-value">$__TOTAL_COST__</div>
        <div class="bento-sub">Printify tier 1 DTG fulfillment</div>
      </div>

      <div class="bento-card highlight">
        <div class="bento-label">Net Profit / Basket</div>
        <div class="bento-value">$__TOTAL_PROFIT__</div>
        <div class="bento-sub">After all Etsy & processing fees</div>
      </div>

      <div class="bento-card highlight">
        <div class="bento-label">Blended Net Margin</div>
        <div class="bento-value">__BLENDED_MARGIN__%</div>
        <div class="bento-sub">Etsy Top 1% Margin Tier</div>
      </div>
    </section>

    <!-- Interactive Profit & Treasury Engine -->
    <section class="calculator-section">
      <div class="calc-controls">
        <h3 class="calc-title">✦ Treasury Projection & Run-Rate Engine</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted);">
          Simulate store velocity to model monthly cash flow and progress toward the <strong>$100,000 Sovereign Treasury</strong> milestone.
        </p>

        <div class="calc-slider-wrapper">
          <div class="calc-slider-header">
            <span>Estimated Complete Basket Orders / Day:</span>
            <span id="sliderDisplay" class="calc-slider-val">5 Orders / Day</span>
          </div>
          <input type="range" id="orderSlider" min="1" max="50" value="5" oninput="updateCalculator()">
        </div>
      </div>

      <div class="calc-results">
        <div class="calc-result-box">
          <div class="calc-result-label">Monthly Gross Revenue</div>
          <div id="resMonthlyGross" class="calc-result-num">$30,511.50</div>
        </div>

        <div class="calc-result-box">
          <div class="calc-result-label">Monthly Net Profit</div>
          <div id="resMonthlyNet" class="calc-result-num">$19,112</div>
        </div>

        <div class="calc-result-box">
          <div class="calc-result-label">Annual Run Rate</div>
          <div id="resAnnualRate" class="calc-result-num">$229,338</div>
        </div>

        <div class="calc-result-box">
          <div class="calc-result-label">Days to $100K Treasury</div>
          <div id="resDaysTo100k" class="calc-result-num treasury">157 Days</div>
        </div>
      </div>
    </section>

    <!-- Search & Filter Controls -->
    <div class="controls-row">
      <div class="filter-tabs" id="filterTabs">
        <button class="filter-tab active" onclick="filterCadre('all')">All Products (10)</button>
        <button class="filter-tab" onclick="filterCadre('apparel')">Apparel (2)</button>
        <button class="filter-tab" onclick="filterCadre('mugs')">Mugs (2)</button>
        <button class="filter-tab" onclick="filterCadre('totes')">Totes (2)</button>
        <button class="filter-tab" onclick="filterCadre('wall_art')">Wall Art (2)</button>
        <button class="filter-tab" onclick="filterCadre('crafting')">Crafting (2)</button>
      </div>

      <input type="text" id="searchInput" class="search-input" placeholder="Search products, keywords, tags..." oninput="handleSearch()">
    </div>

    <!-- Product Cards Grid -->
    <div class="products-grid" id="productsGrid">
      <!-- Injected via JavaScript -->
    </div>

    <!-- Master Production & Fulfillment Vault (100% Unlocked) -->
    <section class="vault-section">
      <div class="vault-header">
        <h2>▣ Master Production & Fulfillment Vault</h2>
        <p>Complete 10-product Printify API payloads, raw vector print canvases, and automated Etsy listing CSVs — 100% free and unlocked.</p>
      </div>

      <div class="vault-code-container">
        <pre id="masterPayloadPreview" class="vault-code-pre" style="margin: 0; max-height: 400px; overflow-y: auto;">// MASTER PRINTIFY PRODUCTION PAYLOAD SCHEMA (100% UNLOCKED)
{
  "store": "YourDigitalSpace",
  "production_blueprint_id": 12,
  "print_provider_id": 99,
  "variants": [
    {"id": 41235, "price": 3499, "cost": 1250, "margin": "64.2%"},
    {"id": 41236, "price": 3499, "cost": 1250, "margin": "64.2%"}
  ],
  "print_areas": {
    "front": "https://storage.nullai.tech/canvases/prod-01-grandma-garden-sweatshirt.png",
    "dpi": 300,
    "color_profile": "sRGB IEC61966-2.1"
  },
  "tags_13_set": [
    "grandma sweatshirt", "gardener gift", "wildflower sweater",
    "grandmas garden", "grandma crewneck", "mom birthday gift"
  ]
}</pre>
      </div>
      <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap;">
        <button class="btn-action" style="max-width: 280px; padding: 0.65rem 1.25rem; font-weight: 600;" onclick="copyMasterPayload()">
          <span>📋 Copy Master Payload Schema</span>
        </button>
        <a class="btn-action" style="max-width: 280px; padding: 0.65rem 1.25rem; font-weight: 600; text-decoration: none; text-align: center;" href="/api/catalog" target="_blank">
          <span>▣ View Full Catalog JSON API</span>
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer>
      <div>
        Engineered by 1nc0gn30 • NullAI (<a href="https://github.com/1nc0gn30" target="_blank" rel="noopener">@1nc0gn30</a>) • <a href="https://nullai.tech" target="_blank" rel="noopener">NullAI Platform</a>
      </div>
      <div>
        Repository: <a href="https://github.com/1nc0gn30/storefront-catalog" target="_blank" rel="noopener">storefront-catalog</a> • Demographic: 55+ Women
      </div>
    </footer>
  </div>

  <!-- Inspection Modal (Canvas & Mockup) -->
  <div id="mediaModal" class="modal-overlay" onclick="closeMediaModal(event)">
    <div class="modal-card">
      <button class="modal-close-btn" onclick="closeMediaModal(null)">✕</button>
      <h3 id="modalMediaTitle" class="modal-title">Product Inspection</h3>

      <div class="modal-media-grid">
        <div class="modal-media-box">
          <img id="modalMockupImg" src="" alt="Product Mockup Preview">
          <div class="modal-media-label">Photorealistic Mockup Preview</div>
        </div>
        <div class="modal-media-box">
          <img id="modalCanvasImg" src="" alt="300 DPI Print Canvas Art">
          <div class="modal-media-label">300 DPI Master Print Canvas</div>
        </div>
      </div>

      <div class="card-actions">
        <button class="btn-action" onclick="downloadCanvasFromModal()">
          <span>✦ Download 300 DPI Canvas Art</span>
        </button>
        <button class="btn-action" onclick="downloadPayloadFromModal()">
          <span>▣ Download Printify JSON</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Copy & Details Modal -->
  <div id="copyModal" class="modal-overlay" onclick="closeCopyModal(event)">
    <div class="modal-card">
      <button class="modal-close-btn" onclick="closeCopyModal(null)">✕</button>
      <h3 id="modalCopyTitle" class="modal-title">Listing Details</h3>

      <div style="margin-bottom: 1rem;">
        <div style="font-size: 0.75rem; color: var(--gold-bright); font-weight: 700; text-transform: uppercase; margin-bottom: 0.35rem;">
          13/13 High-Converting SEO Tags (Etsy A+ Ranking)
        </div>
        <div id="modalTagsContainer" class="card-tags-cloud" style="max-height: none; margin-bottom: 0.75rem;"></div>
        <button class="btn-action" style="width: auto; padding: 0.35rem 0.75rem;" onclick="copyTagsToClipboard()">
          ✦ Copy All 13 Tags
        </button>
      </div>

      <div style="font-size: 0.75rem; color: var(--text-dim); font-weight: 700; text-transform: uppercase; margin-bottom: 0.35rem;">
        Etsy Optimized Description & Sizing Copy
      </div>
      <div id="modalDescriptionText" class="modal-copy-block"></div>

      <button class="btn-action" style="width: 100%;" onclick="copyDescriptionToClipboard()">
        ◆ Copy Full Description to Clipboard
      </button>
    </div>
  </div>

  <script>
    const PRODUCTS = __PRODUCTS_JSON__;
    let currentFilter = 'all';
    let currentSearch = '';
    let selectedProduct = null;
    let isProActive = true;

    // 100% Free & Open Access Initialization
    function initLicense() {
      isProActive = true;
      const proBadge = document.getElementById('proBadge');
      if (proBadge) {
        proBadge.classList.add('active');
        proBadge.innerHTML = '<span>✦ 100% FREE & OPEN ACCESS</span>';
      }
    }

    function renderProducts() {
      const grid = document.getElementById('productsGrid');
      grid.innerHTML = '';

      const filtered = PRODUCTS.filter(p => {
        const matchCadre = currentFilter === 'all' || p.cadre === currentFilter;
        const matchSearch = currentSearch === '' ||
          p.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
          p.tags.some(t => t.toLowerCase().includes(currentSearch.toLowerCase()));
        return matchCadre && matchSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-dim);">No matching products found. Try adjusting your search or category filter.</div>';
        return;
      }

      filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <div class="card-media" onclick="openMediaModal('${p.id}')">
            <img src="${p.mockup_file}" alt="${p.title} photorealistic mockup" loading="lazy">
            <span class="card-cadre-tag">${p.cadre.replace('_', ' ')}</span>
            <span class="card-seo-tag">SEO ${p.seo_score}/100 ${p.seo_grade}</span>
          </div>

          <div class="card-body">
            <div class="card-title" title="${p.title}">${p.title}</div>

            <div class="card-financials">
              <div class="fin-item">
                <span class="fin-label">Retail</span>
                <span class="fin-val">$${p.financials.retail_price.toFixed(2)}</span>
              </div>
              <div class="fin-item">
                <span class="fin-label">Net Profit</span>
                <span class="fin-val profit">+$${p.financials.net_profit.toFixed(2)}</span>
              </div>
              <div class="fin-item">
                <span class="fin-label">Margin</span>
                <span class="fin-val margin">${p.financials.margin_percent}%</span>
              </div>
            </div>

            <div class="card-tags-cloud">
              ${p.tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
            </div>

            <div class="card-actions">
              <button class="btn-action" onclick="openMediaModal('${p.id}')">
                <span>✦ Canvas & Art</span>
              </button>
              <button class="btn-action" onclick="openCopyModal('${p.id}')">
                <span>✎ Copy & SEO</span>
              </button>
              <button class="btn-action btn-export-payload" onclick="handleExportPayload('${p.id}')">
                <span>▣ Download Printify Payload</span>
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }

    function filterCadre(cadre) {
      currentFilter = cadre;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      renderProducts();
    }

    function handleSearch() {
      currentSearch = document.getElementById('searchInput').value;
      renderProducts();
    }

    function updateCalculator() {
      const orders = parseInt(document.getElementById('orderSlider').value);
      document.getElementById('sliderDisplay').textContent = `${orders} Orders / Day`;

      const basketRetail = 203.41;
      const basketNetProfit = 127.41;

      const monthlyOrders = orders * 30;
      const monthlyGross = monthlyOrders * basketRetail;
      const monthlyNet = monthlyOrders * basketNetProfit;
      const annualNet = monthlyNet * 12;
      const daysTo100k = Math.max(1, Math.round(100000 / (orders * basketNetProfit)));

      document.getElementById('resMonthlyGross').textContent = `$${monthlyGross.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      document.getElementById('resMonthlyNet').textContent = `$${monthlyNet.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      document.getElementById('resAnnualRate').textContent = `$${annualNet.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
      document.getElementById('resDaysTo100k').textContent = `${daysTo100k} Days`;
    }

    function openMediaModal(productId) {
      selectedProduct = PRODUCTS.find(p => p.id === productId);
      if (!selectedProduct) return;

      document.getElementById('modalMediaTitle').textContent = selectedProduct.title;
      document.getElementById('modalMockupImg').src = selectedProduct.mockup_file;
      document.getElementById('modalCanvasImg').src = selectedProduct.canvas_file;
      document.getElementById('mediaModal').classList.add('active');
    }

    function closeMediaModal(e) {
      if (!e || e.target.id === 'mediaModal' || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('mediaModal').classList.remove('active');
      }
    }

    function openCopyModal(productId) {
      selectedProduct = PRODUCTS.find(p => p.id === productId);
      if (!selectedProduct) return;

      document.getElementById('modalCopyTitle').textContent = selectedProduct.title;
      document.getElementById('modalDescriptionText').textContent = selectedProduct.description;

      const tagContainer = document.getElementById('modalTagsContainer');
      tagContainer.innerHTML = selectedProduct.tags.map(t => `<span class="tag-pill" style="color: #ffffff; background: #27272a;">${t}</span>`).join('');

      document.getElementById('copyModal').classList.add('active');
    }

    function closeCopyModal(e) {
      if (!e || e.target.id === 'copyModal' || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('copyModal').classList.remove('active');
      }
    }

    function copyTagsToClipboard() {
      if (!selectedProduct) return;
      navigator.clipboard.writeText(selectedProduct.tags.join(', '));
      alert('13/13 SEO Tags copied to clipboard!');
    }

    function copyDescriptionToClipboard() {
      if (!selectedProduct) return;
      navigator.clipboard.writeText(selectedProduct.description);
      alert('Full listing description copied to clipboard!');
    }

    function handleExportPayload(productId) {
      selectedProduct = PRODUCTS.find(p => p.id === productId);
      if (selectedProduct) {
        downloadPayloadFile(selectedProduct);
      }
    }

    function downloadCanvasFromModal() {
      if (!selectedProduct) return;
      const a = document.createElement('a');
      a.href = selectedProduct.canvas_file;
      a.download = selectedProduct.canvas_file.split('/').pop();
      a.click();
    }

    function downloadPayloadFromModal() {
      if (!selectedProduct) return;
      downloadPayloadFile(selectedProduct);
    }

    function downloadPayloadFile(prod) {
      const a = document.createElement('a');
      a.href = prod.pod_payload_file;
      a.download = prod.pod_payload_file.split('/').pop();
      a.click();
    }

    function copyMasterPayload() {
      const payloadSample = {
        "store": "YourDigitalSpace",
        "production_blueprint_id": 12,
        "print_provider_id": 99,
        "variants": [
          {"id": 41235, "price": 3499, "cost": 1250, "margin": "64.2%"},
          {"id": 41236, "price": 3499, "cost": 1250, "margin": "64.2%"}
        ],
        "print_areas": {
          "front": "https://storage.nullai.tech/canvases/prod-01-grandma-garden-sweatshirt.png",
          "dpi": 300,
          "color_profile": "sRGB IEC61966-2.1"
        },
        "tags_13_set": [
          "grandma sweatshirt", "gardener gift", "wildflower sweater",
          "grandmas garden", "grandma crewneck", "mom birthday gift"
        ]
      };
      navigator.clipboard.writeText(JSON.stringify(payloadSample, null, 2));
      alert('Master Printify Payload Schema copied to clipboard!');
    }

    function launchCheckout(rail) {
      if (rail === 'stripe') {
        window.open('https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X', '_blank');
      } 
    }

    function toggleTheme() {
      const root = document.documentElement;
      const btn = document.getElementById('themeToggleBtn');
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      if (btn) btn.textContent = next === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }

    // Initial setup
    renderProducts();
    updateCalculator();
  </script>
  

  <script src="/sovereign_tutorial.js"></script>
  <script>
    window.addEventListener("DOMContentLoaded", function() {
      if (window.createSovereignTutorial) {
        window.createSovereignTutorial({
          toolId: "storefront-catalog",
          toolName: "YourDigitalSpace POD Showcase",
          tagline: "Interactive live 3D showcase and catalog viewer for Print-on-Demand products!",
          accentColor: "#EC4899",
          steps: [{"icon": "\ud83c\udfea", "title": "Virtual Storefront Gallery", "desc": "Browse and interact with an avant-garde catalog of custom hoodies, posters, and accessories."}, {"icon": "\ud83e\uddca", "title": "Interactive 3D Product Views", "desc": "Spin and inspect products in full 3D to see how designs look from every angle."}, {"icon": "\ud83d\udcb3", "title": "Zero-Friction Checkout", "desc": "Connects directly to Stripe with 100% unlocked open access."}]
        });
      }
    });
  </script>

</body>
</html>
"""


def build():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    products_json = json.dumps(manifest["listings"])
    fin = manifest["portfolio_financials"]

    rendered = (
        TEMPLATE
        .replace("__PRODUCTS_JSON__", products_json)
        .replace("__TOTAL_RETAIL__", str(fin["total_retail_value"]))
        .replace("__TOTAL_COST__", str(fin["total_production_cost"]))
        .replace("__TOTAL_PROFIT__", str(fin["total_net_profit"]))
        .replace("__BLENDED_MARGIN__", str(fin["blended_net_margin"]))
    )
    OUTPUT_HTML.write_text(rendered, encoding="utf-8")
    print(f"Showcase built at {OUTPUT_HTML} ({len(rendered):,} bytes)")


if __name__ == "__main__":
    build()
