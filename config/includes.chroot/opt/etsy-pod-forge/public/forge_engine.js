/**
 * Etsy POD Forge v2.6.0 — Live :8107 Client & 100%-In-Browser Offline Fallback Engine
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
 * Zero external CDN dependencies, zero innerHTML XSS sinks, full Dual-Theme support.
 */
(function () {
  'use strict';

  const SOLANA_ADDRESS = 'GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK';

  const FALLBACK_CADRES = {
    apparel: {
      name: "Grandma's Garden Floral & Family Apparel",
      product_type: 'Comfort Colors 1717 Tee / Gildan 18000 Sweatshirt',
      default_retail: 34.99,
      default_production: 12.50,
      default_shipping_cost: 0.00,
      default_title: "GRANDMA'S GARDEN",
      default_subtitle: 'Where Love Blooms & Family Grows',
      print_dimensions: '4500 x 5400 px (300 DPI)',
      printify_blueprint_id: 638,
      printify_provider_id: 29,
      gelato_product_uid: 'apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_heavyweight',
      title_suffix: 'Custom Wildflower Sweater, Personalized Grandma Gift, Mothers Day Crewneck',
      tags: [
        'grandma sweatshirt', 'gardener gift', 'wildflower sweater', 'grandmas garden',
        'grandma crewneck', 'mom birthday gift', 'cottagecore clothes', 'comfort colors tee',
        'plant lover gift', 'gift for grandma', 'botanical shirt', 'grandkids names', 'mothers day gift'
      ]
    },
    mugs: {
      name: 'Whimsical Watercolor Animal & Bird Mugs',
      product_type: '15oz Ceramic Coffee & Tea Mug',
      default_retail: 21.99,
      default_production: 6.80,
      default_shipping_cost: 0.00,
      default_title: 'Tea & Tranquility',
      default_subtitle: 'Cozy Songbirds of the Hearth',
      print_dimensions: '2000 x 2000 px (300 DPI)',
      printify_blueprint_id: 68,
      printify_provider_id: 26,
      gelato_product_uid: 'mug_product_msz_15-oz_mmat_ceramic-white_cl_4-0',
      title_suffix: 'Bird Watcher Gift, Cozy Cottagecore Tea Cup, Nature Lover Ceramic Mug',
      tags: [
        'bird watcher gift', 'watercolor bird mug', 'cottagecore mug', 'bird lover gift',
        'coffee mug 15oz', 'tea lover cup', 'cardinal mug', 'backyard birds',
        'grandma mug', 'garden lover gift', 'ceramic coffee mug', 'nature coffee cup', 'cute bird gifts'
      ]
    },
    totes: {
      name: 'Heavyweight Canvas Farmers Market & Library Totes',
      product_type: 'Liberty Bags OAD 12oz Cotton Canvas Tote',
      default_retail: 24.99,
      default_production: 7.20,
      default_shipping_cost: 0.00,
      default_title: 'FLEURS SAUVAGES',
      default_subtitle: 'Graines de Provence · Recolte 1894',
      print_dimensions: '3600 x 3600 px (300 DPI)',
      printify_blueprint_id: 1090,
      printify_provider_id: 3,
      gelato_product_uid: 'bag_product_bt_tote-bag_bmat_heavyweight-cotton',
      title_suffix: 'Farmers Market Bag, Botanical Library Tote, Heavyweight Garden Shopper',
      tags: [
        'french seed packet', 'canvas tote bag', 'farmers market tote', 'botanical tote',
        'library book tote', 'gardener gift', 'cottagecore bag', 'lavender tote',
        'heavy canvas tote', 'market shopping bag', 'flower market bag', 'vintage botanical', 'eco friendly bag'
      ]
    },
    wall_art: {
      name: 'High-Res Archival Wall Art & Printable Gallery Packs',
      product_type: '300 DPI 5-Ratio Archival Print Bundle',
      default_retail: 29.99,
      default_production: 8.50,
      default_shipping_cost: 0.00,
      default_title: 'BOTANICA VINTAGE',
      default_subtitle: 'English Countryside Wildflower Study · Plate 12',
      print_dimensions: '4500 x 6000 px (300 DPI)',
      printify_blueprint_id: 49,
      printify_provider_id: 29,
      gelato_product_uid: 'flat_18x24-inch_200gsm-uncoated',
      title_suffix: 'Printable Wildflower Wall Art, Cottagecore Gallery Decor, Archival 300 DPI Print',
      tags: [
        'botanical wall art', 'vintage flower prints', 'wildflower decor', 'digital download art',
        'gallery wall set', 'cottagecore decor', 'printable wall art', 'farmhouse wall decor',
        'living room prints', 'bathroom art print', 'vintage botanical', 'flower poster', 'large wall art'
      ]
    },
    crafting: {
      name: 'Printable Quilting, Embroidery & Crafting Pattern Blueprints',
      product_type: 'Printable Pattern Blueprint & Stitch Guide',
      default_retail: 18.99,
      default_production: 4.20,
      default_shipping_cost: 0.00,
      default_title: 'TRADITIONAL BARN STAR',
      default_subtitle: 'Heirloom Quilt Block Blueprint · 24" Center Star',
      print_dimensions: '3600 x 3600 px (300 DPI)',
      printify_blueprint_id: 554,
      printify_provider_id: 29,
      gelato_product_uid: 'notebook_product_nsz_a5_nmat_spiral-matte',
      title_suffix: 'Printable Patchwork Guide, Lone Star Cutting Chart, Traditional Quilter Gift',
      tags: [
        'quilt pattern pdf', 'barn star quilt', 'lone star pattern', 'patchwork blueprint',
        'quilting printable', 'quilt block pattern', 'quilter gift', 'traditional quilt',
        'cutting guide pdf', 'quilt template', 'epp pattern', 'sewing project', 'craft blueprint'
      ]
    }
  };

  const FALLBACK_MCP_TOOLS = [
    { name: 'pod_list_cadres', description: 'List all 5 POD cadres with 300-DPI specs, Printify blueprint/provider IDs, and Gelato v4 UIDs.' },
    { name: 'pod_generate_canvas', description: 'Synthesize 300-DPI RGBA print-ready PNG metadata and base64 preview via CanvasGenerator.' },
    { name: 'pod_generate_mockup', description: 'Render 1400x1400 / 1600x1200 lifestyle mockup scene via MockupEngine.' },
    { name: 'pod_synthesize_listing', description: 'Generate <=140-char Etsy title, 13 unique <=20-char tags, SEO score, and 2026 fee breakdown.' },
    { name: 'pod_calculate_margins', description: 'Calculate exact 2026 Etsy fees across 0%/12%/15% Offsite Ads tiers and break-even price.' },
    { name: 'pod_search_prompts', description: 'Search or filter the 53-recipe curated POD Prompt Vault by cadre and keyword.' }
  ];

  const FALLBACK_PROMPTS = [
    { id: 'apparel-01', cadre: 'apparel', title: "Grandma's Garden Birth Month Bouquet", target_product: 'Comfort Colors 1717 Tee', aspect_ratio: '4:5', model: 'Midjourney v6.1 / Flux.1', full_prompt: 'Delicate vintage watercolor bouquet of birth-month flowers tied with a sage ribbon, isolated on pure white background --ar 4:5 --v 6.1' },
    { id: 'mug-01', cadre: 'mugs', title: 'Cozy Chickadees & Porcelain Teacup', target_product: '15oz Ceramic Mug', aspect_ratio: '1:1', model: 'Midjourney v6.1 / Flux.1', full_prompt: 'Two fluffy black-capped chickadees perched on an antique rose-patterned porcelain teacup with winter berries, isolated white background --ar 1:1 --v 6.1' },
    { id: 'tote-01', cadre: 'totes', title: 'Vintage French Seed Packet Fleurs Sauvages', target_product: '12oz Heavy Canvas Tote', aspect_ratio: '1:1', model: 'Midjourney v6.1 / Flux.1', full_prompt: '19th-century French botanical seed catalog label featuring wild poppies and Provence lavender, crisp border, clean ground --ar 1:1 --v 6.1' },
    { id: 'wallart-01', cadre: 'wall_art', title: 'English Countryside Botanical Wildflower Gallery', target_product: '300 DPI 5-Ratio Pack', aspect_ratio: '4:5', model: 'Midjourney v6.1 / Flux.1', full_prompt: 'Museum-grade botanical plate of English foxglove and meadow poppies on cold-press parchment, balanced margins --ar 4:5 --v 6.1' },
    { id: 'craft-01', cadre: 'crafting', title: 'Traditional Barn Star Quilt Block Blueprint', target_product: 'Printable Quilt Pattern', aspect_ratio: '1:1', model: 'Flux.1 / Midjourney v6.1', full_prompt: 'Crisp geometric 8-point Lone Star patchwork quilt block blueprint with 1/4 inch seam indicators, pure white background --ar 1:1 --v 6.1' }
  ];

  const state = {
    cadre: 'apparel',
    view: 'canvas',
    color: 'sand',
    offsiteAdsRate: 0,
    backendOnline: false,
    cadres: Object.assign({}, FALLBACK_CADRES),
    prompts: FALLBACK_PROMPTS.slice(),
    promptFilterCadre: 'all',
    promptQuery: '',
    mcpTools: FALLBACK_MCP_TOOLS.slice(),
    lastListing: null,
    renderSeq: 0,
    debounceTimer: null
  };

  function $(id) { return document.getElementById(id); }

  function showToast(msg) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast('Copied ' + label)).catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied ' + label); } catch (e) {}
    document.body.removeChild(ta);
  }

  function calcProfitLocal(retail, prod, shipCharged, shipCost, adsRate) {
    const r = Math.max(0, Number(retail) || 0);
    const p = Math.max(0, Number(prod) || 0);
    const si = Math.max(0, Number(shipCharged) || 0);
    const so = Math.max(0, Number(shipCost) || 0);
    const ads = Number(adsRate) || 0;
    const gross = Number((r + si).toFixed(2));
    const listing = 0.20;
    const tx = Number((gross * 0.065).toFixed(2));
    const proc = gross > 0 ? Number((gross * 0.03 + 0.25).toFixed(2)) : 0;
    const offsite = Number((gross * ads).toFixed(2));
    const totalFees = Number((listing + tx + proc + offsite).toFixed(2));
    const totalCogs = Number((p + so).toFixed(2));
    const net = Number((gross - totalCogs - totalFees).toFixed(2));
    const margin = gross > 0 ? Number(((net / gross) * 100).toFixed(1)) : 0;
    const roi = totalCogs > 0 ? Number(((net / totalCogs) * 100).toFixed(1)) : (net > 0 ? 100.0 : 0.0);
    const keep = 1 - 0.095 - ads;
    const beGross = keep > 0 ? (totalCogs + 0.45) / keep : 0;
    const breakEven = Number(Math.max(0, beGross - si).toFixed(2));
    return {
      retail_price: r,
      production_cost: p,
      shipping_charged: si,
      shipping_cost: so,
      gross_revenue: gross,
      etsy_listing_fee: listing,
      etsy_transaction_fee: tx,
      etsy_payment_processing: proc,
      offsite_ads_rate: ads,
      etsy_offsite_ads_fee: offsite,
      total_fees: totalFees,
      total_cogs: totalCogs,
      net_profit: net,
      margin_percent: margin,
      roi_percent: roi,
      break_even_price: breakEven
    };
  }

  function clampTitle(raw) {
    const s = String(raw || '').trim();
    if (s.length <= 140) return s;
    const cut = s.slice(0, 140);
    const idx = Math.max(cut.lastIndexOf(','), cut.lastIndexOf(' '));
    return (idx > 80 ? cut.slice(0, idx) : cut).trim();
  }

  function updateEconomicsUI(profit) {
    const netEl = $('valNet');
    netEl.textContent = (profit.net_profit < 0 ? '-' : '') + '$' + Math.abs(profit.net_profit).toFixed(2);
    netEl.className = 'kpi-value ' + (profit.net_profit >= 0 ? 'good' : 'bad');
    $('valMargin').textContent = profit.margin_percent.toFixed(1) + '% Net Margin · ' + profit.roi_percent.toFixed(1) + '% ROI';
    $('valMarginBadge').textContent = profit.margin_percent.toFixed(1) + '% Margin';
    $('valFees').textContent = '$' + profit.total_fees.toFixed(2);
    const adsPct = Math.round((profit.offsite_ads_rate || 0) * 100);
    $('valFeeDetail').textContent = '$0.20 + 6.5% + 3%+$0.25' + (adsPct ? ' + ' + adsPct + '% Ads' : '');
    $('valBreakEven').textContent = '$' + profit.break_even_price.toFixed(2);
    $('valGross').textContent = '$' + profit.gross_revenue.toFixed(2);
    $('valCogs').textContent = 'COGS: $' + profit.total_cogs.toFixed(2);
  }

  function updateListingUI(listing) {
    state.lastListing = listing;
    $('listingTitleText').textContent = listing.title;
    $('titleCharCount').textContent = String(listing.title.length);
    $('seoScoreBadge').textContent = 'SEO ' + (listing.seo_score || 100) + '/100';

    const tagContainer = $('tagList');
    tagContainer.textContent = '';
    (listing.tags || []).forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag-chip';
      span.textContent = tag + ' (' + tag.length + '/20)';
      tagContainer.appendChild(span);
    });
  }

  function drawOfflineCanvas() {
    const canvas = $('studioCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cadre = state.cadre;
    const title = ($('inputTitle').value || FALLBACK_CADRES[cadre].default_title).trim();
    const subtitle = ($('inputSubtitle').value || FALLBACK_CADRES[cadre].default_subtitle).trim();
    const names = ($('inputNames').value || 'Emma, Liam, Olivia, Noah')
      .split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);

    const w = cadre === 'mugs' || cadre === 'totes' || cadre === 'crafting' ? 840 : 840;
    const h = cadre === 'mugs' || cadre === 'totes' || cadre === 'crafting' ? 840 : 1008;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (cadre === 'apparel') {
      ctx.fillStyle = '#3A3028';
      ctx.font = '700 54px Georgia, serif';
      ctx.fillText(title.slice(0, 32), cx, h * 0.20);
      ctx.fillStyle = '#9A4A4F';
      ctx.font = 'italic 28px Georgia, serif';
      ctx.fillText(subtitle.slice(0, 44), cx, h * 0.27);
      const cols = ['#D45246', '#A899C2', '#E8C46A', '#7698C4', '#E0ACAA', '#8A9A86'];
      const count = Math.max(3, names.length || 4);
      const spread = w * 0.64;
      const startX = cx - spread / 2;
      const tieY = h * 0.74;
      for (let i = 0; i < count; i++) {
        const fx = startX + (count > 1 ? (i * spread) / (count - 1) : 0);
        const fy = h * 0.52 + Math.sin(i * 1.2) * 32;
        ctx.strokeStyle = '#586E55';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(cx + (fx - cx) * 0.35, (fy + tieY) / 2, cx, tieY);
        ctx.stroke();
        ctx.fillStyle = cols[i % cols.length];
        for (let p = 0; p < 6; p++) {
          const ang = (p * Math.PI) / 3;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(ang) * 18, fy + Math.sin(ang) * 18, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#D4A030';
        ctx.beginPath();
        ctx.arc(fx, fy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3A3028';
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText(names[i % names.length] || 'Blossom', fx, fy + 56);
      }
    } else if (cadre === 'mugs') {
      ctx.strokeStyle = '#8A9A86';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, h * 0.52, w * 0.33, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#4A3A30';
      ctx.font = '700 48px Georgia, serif';
      ctx.fillText(title.slice(0, 30), cx, h * 0.14);
      ctx.fillStyle = '#C47058';
      ctx.beginPath();
      ctx.arc(cx, h * 0.52, 84, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#586E55';
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillText(subtitle.slice(0, 42), cx, h * 0.88);
    } else if (cadre === 'totes') {
      ctx.strokeStyle = '#4A3A30';
      ctx.lineWidth = 6;
      ctx.strokeRect(64, 64, w - 128, h - 128);
      ctx.strokeStyle = '#C47058';
      ctx.lineWidth = 2;
      ctx.strokeRect(82, 82, w - 164, h - 164);
      ctx.fillStyle = '#3A3028';
      ctx.font = '700 54px Georgia, serif';
      ctx.fillText(title.slice(0, 26), cx, h * 0.28);
      ctx.fillStyle = '#9A4A4F';
      ctx.font = 'italic 26px Georgia, serif';
      ctx.fillText(subtitle.slice(0, 40), cx, h * 0.36);
      ctx.fillStyle = '#586E55';
      ctx.font = '700 22px monospace';
      ctx.fillText('12OZ COTTON CANVAS · 3600 x 3600 @ 300 DPI', cx, h * 0.78);
    } else if (cadre === 'wall_art') {
      ctx.strokeStyle = '#4A3A30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(96, 110);
      ctx.lineTo(w - 96, 110);
      ctx.stroke();
      ctx.fillStyle = '#4A3A30';
      ctx.font = '700 22px Georgia, serif';
      ctx.fillText("CURTIS'S BOTANICAL PLATE", cx, 82);
      ctx.strokeStyle = '#586E55';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, 180);
      ctx.lineTo(cx, 690);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#C48085' : '#D45246';
        ctx.beginPath();
        ctx.arc(cx + (i % 2 === 0 ? -42 : 42), 230 + i * 52, 24, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3A3028';
      ctx.font = 'italic 700 44px Georgia, serif';
      ctx.fillText(title.slice(0, 28), cx, 810);
      ctx.font = '24px Georgia, serif';
      ctx.fillText(subtitle.slice(0, 44), cx, 868);
    } else {
      ctx.strokeStyle = 'rgba(100,130,170,0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 42) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.fillStyle = '#3A3028';
      ctx.font = '700 42px Georgia, serif';
      ctx.fillText(title.slice(0, 28), cx, 96);
      const R = 210, r = 90, cy = h * 0.50;
      for (let i = 0; i < 8; i++) {
        const a0 = (i * Math.PI) / 4;
        const a1 = a0 - Math.PI / 8;
        const a2 = a0 + Math.PI / 8;
        ctx.fillStyle = i % 2 === 0 ? '#C48085' : '#7698C4';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
        ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = i % 2 === 0 ? '#EECC70' : '#8A9A86';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
        ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#4A3A30';
      ctx.font = 'italic 22px Georgia, serif';
      ctx.fillText(subtitle.slice(0, 48), cx, h * 0.88);
    }
  }

  function drawBase64ToCanvas(dataUri) {
    const canvas = $('studioCanvas');
    const img = new Image();
    img.onload = function () {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUri;
  }

  function applyLocalFallbackListing() {
    const spec = state.cadres[state.cadre] || FALLBACK_CADRES[state.cadre];
    const fb = FALLBACK_CADRES[state.cadre];
    const hook = ($('inputTitle').value || fb.default_title).trim();
    const retail = Number($('inputRetail').value) || 0;
    const prod = Number($('inputProd').value) || 0;
    const shipIn = Number($('inputShipCharged').value) || 0;
    const shipOut = Number($('inputShipCost').value) || 0;
    const profit = calcProfitLocal(retail, prod, shipIn, shipOut, state.offsiteAdsRate);
    const title = clampTitle(hook + ', ' + fb.title_suffix);
    updateEconomicsUI(profit);
    updateListingUI({
      cadre: state.cadre,
      product_type: spec.product_type,
      title: title,
      tags: fb.tags.slice(0, 13),
      seo_score: title.length >= 70 && title.length <= 140 ? 100 : 90,
      profit: profit
    });
  }

  async function syncWithBackend() {
    const seq = ++state.renderSeq;
    const title = ($('inputTitle').value || '').trim();
    const subtitle = ($('inputSubtitle').value || '').trim();
    const names = ($('inputNames').value || '').trim();
    const retail = Number($('inputRetail').value);
    const prod = Number($('inputProd').value);
    const shipIn = Number($('inputShipCharged').value) || 0;
    const shipOut = Number($('inputShipCost').value) || 0;

    // Immediate snappy local calculation so UI never lags
    applyLocalFallbackListing();

    const canvasEl = $('studioCanvas');
    const mockupImg = $('mockupPreviewImg');

    if (state.view === 'canvas') {
      canvasEl.style.display = 'block';
      mockupImg.style.display = 'none';
      if (!state.backendOnline) {
        drawOfflineCanvas();
        $('stageRenderSource').textContent = 'Renderer: In-Browser Fallback Canvas';
      }
    } else {
      if (!state.backendOnline) {
        canvasEl.style.display = 'block';
        mockupImg.style.display = 'none';
        drawOfflineCanvas();
        $('stageRenderSource').textContent = 'Renderer: Offline Mockup Fallback';
      }
    }

    if (!state.backendOnline) return;

    try {
      const listingPromise = fetch('/api/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadre: state.cadre,
          title_hook: title,
          custom_names: names,
          retail_price: isFinite(retail) ? retail : undefined,
          production_cost: isFinite(prod) ? prod : undefined,
          shipping_charged: shipIn,
          shipping_cost: shipOut,
          offsite_ads_rate: state.offsiteAdsRate
        })
      }).then((r) => (r.ok ? r.json() : null));

      const visualPromise = state.view === 'canvas'
        ? fetch('/api/generate-canvas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cadre: state.cadre, preview: true, title: title, subtitle: subtitle, names: names })
          }).then((r) => (r.ok ? r.json() : null))
        : fetch('/api/generate-mockup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cadre: state.cadre, color: state.color, title: title, subtitle: subtitle, names: names })
          }).then((r) => (r.ok ? r.json() : null));

      const [listingResp, visualResp] = await Promise.all([listingPromise, visualPromise]);
      if (seq !== state.renderSeq) return;

      if (listingResp && listingResp.listing) {
        updateEconomicsUI(listingResp.listing.profit);
        updateListingUI(listingResp.listing);
      }

      if (state.view === 'canvas' && visualResp && visualResp.image_b64) {
        canvasEl.style.display = 'block';
        mockupImg.style.display = 'none';
        drawBase64ToCanvas(visualResp.image_b64);
        $('stageRenderSource').textContent = 'Renderer: Live :8107 Pillow RGBA (' + visualResp.width + 'x' + visualResp.height + ' @ ' + visualResp.dpi + ' DPI)';
      } else if (state.view === 'mockup' && visualResp && visualResp.mockup_b64) {
        canvasEl.style.display = 'none';
        mockupImg.style.display = 'block';
        mockupImg.src = visualResp.mockup_b64;
        $('stageRenderSource').textContent = 'Renderer: Live :8107 MockupEngine (' + visualResp.width + 'x' + visualResp.height + ' · ' + visualResp.color + ')';
      }
    } catch (err) {
      drawOfflineCanvas();
      $('stageRenderSource').textContent = 'Renderer: In-Browser Fallback';
    }
  }

  function scheduleSync() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(syncWithBackend, 160);
  }

  function selectCadre(cadreKey) {
    if (!FALLBACK_CADRES[cadreKey]) return;
    state.cadre = cadreKey;
    const spec = state.cadres[cadreKey] || FALLBACK_CADRES[cadreKey];
    const fb = FALLBACK_CADRES[cadreKey];

    document.querySelectorAll('#cadreTabs [data-cadre]').forEach((btn) => {
      const active = btn.getAttribute('data-cadre') === cadreKey;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    $('cadreHeading').textContent = spec.name || fb.name;
    $('specDimsBadge').textContent = spec.print_dimensions || fb.print_dimensions;
    $('fulfillmentIds').textContent =
      'Printify BP #' + (spec.printify_blueprint_id || fb.printify_blueprint_id) +
      ' / Provider #' + (spec.printify_provider_id || fb.printify_provider_id) +
      ' · Gelato v4';

    // Immediately reset retail, production, and title/subtitle defaults for the selected cadre
    $('inputRetail').value = Number(spec.default_retail != null ? spec.default_retail : fb.default_retail).toFixed(2);
    $('inputProd').value = Number(spec.default_production != null ? spec.default_production : fb.default_production).toFixed(2);
    $('inputTitle').value = fb.default_title;
    $('inputSubtitle').value = fb.default_subtitle;

    syncWithBackend();
  }

  function renderPromptVault() {
    const grid = $('promptGrid');
    if (!grid) return;
    const q = state.promptQuery.trim().toLowerCase();
    const filtered = state.prompts.filter((p) => {
      if (state.promptFilterCadre !== 'all' && p.cadre !== state.promptFilterCadre) return false;
      if (!q) return true;
      const hay = (p.title + ' ' + (p.subject || '') + ' ' + (p.style || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    $('promptCountBadge').textContent = filtered.length + ' / ' + state.prompts.length + ' Recipes';
    grid.textContent = '';

    filtered.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'prompt-card';

      const top = document.createElement('div');
      top.style.display = 'flex';
      top.style.justifyContent = 'space-between';
      top.style.gap = '8px';
      top.style.flexWrap = 'wrap';

      const idBadge = document.createElement('span');
      idBadge.className = 'badge';
      idBadge.textContent = p.id + ' · ' + p.cadre;

      const metaBadge = document.createElement('span');
      metaBadge.className = 'badge';
      metaBadge.textContent = '--ar ' + (p.aspect_ratio || '1:1');

      top.appendChild(idBadge);
      top.appendChild(metaBadge);

      const h3 = document.createElement('h3');
      h3.textContent = p.title;

      const body = document.createElement('div');
      body.className = 'prompt-body';
      body.textContent = p.full_prompt || p.subject || '';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm';
      btn.textContent = 'Copy Prompt Recipe';
      btn.addEventListener('click', () => copyText(p.full_prompt || p.subject || p.title, p.id));

      card.appendChild(top);
      card.appendChild(h3);
      card.appendChild(body);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  function renderMcpTools() {
    const grid = $('mcpToolsGrid');
    if (!grid) return;
    grid.textContent = '';
    state.mcpTools.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'prompt-card';
      const h3 = document.createElement('h3');
      h3.textContent = t.name;
      const desc = document.createElement('div');
      desc.className = 'prompt-body';
      desc.textContent = t.description || '';
      card.appendChild(h3);
      card.appendChild(desc);
      grid.appendChild(card);
    });
  }

  async function handleExportZip() {
    const payload = {
      cadre: state.cadre,
      title: ($('inputTitle').value || '').trim(),
      names: ($('inputNames').value || '').trim(),
      retail_price: Number($('inputRetail').value) || undefined,
      production_cost: Number($('inputProd').value) || undefined,
      shipping_charged: Number($('inputShipCharged').value) || 0,
      shipping_cost: Number($('inputShipCost').value) || 0,
      offsite_ads_rate: state.offsiteAdsRate,
      color: state.color
    };

    if (state.backendOnline) {
      try {
        showToast('Building Master ZIP Kit...');
        const resp = await fetch('/api/export-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (resp.ok) {
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'etsy_kit_' + state.cadre + '.zip';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          showToast('Downloaded etsy_kit_' + state.cadre + '.zip');
          return;
        }
      } catch (e) {
        // Fallback to GET endpoint
        const qs = new URLSearchParams({
          cadre: state.cadre,
          title: payload.title,
          retail: String(payload.retail_price || '')
        });
        window.location.href = '/api/export-kit?' + qs.toString();
        return;
      }
    }

    // Offline fallback: export JSON listing kit
    const blob = new Blob([JSON.stringify(state.lastListing || {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'etsy_kit_' + state.cadre + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Downloaded offline listing kit JSON');
  }

  function handleDownloadPng() {
    const canvas = $('studioCanvas');
    const mockup = $('mockupPreviewImg');
    const a = document.createElement('a');
    if (state.view === 'mockup' && mockup.src && mockup.style.display !== 'none') {
      a.href = mockup.src;
      a.download = 'etsy_pod_' + state.cadre + '_mockup.jpg';
    } else {
      a.href = canvas.toDataURL('image/png');
      a.download = 'etsy_pod_' + state.cadre + '_canvas.png';
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Saved preview image');
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { window.localStorage.setItem('etsy-pod-forge-theme', next); } catch (e) {}
    updateThemeBtnLabel();
  }

  function updateThemeBtnLabel() {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const btn = $('themeToggleBtn');
    if (btn) btn.textContent = cur === 'light' ? 'Dark Mode' : 'Light Mode';
  }

  function bindEvents() {
    // Section navigation
    document.querySelectorAll('[data-section]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-section');
        document.querySelectorAll('[data-section]').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + target));
      });
    });

    // Cadre switching
    document.querySelectorAll('#cadreTabs [data-cadre]').forEach((btn) => {
      btn.addEventListener('click', () => selectCadre(btn.getAttribute('data-cadre')));
    });

    // View mode switching
    $('btnViewCanvas').addEventListener('click', () => {
      state.view = 'canvas';
      $('btnViewCanvas').classList.add('active');
      $('btnViewCanvas').setAttribute('aria-selected', 'true');
      $('btnViewMockup').classList.remove('active');
      $('btnViewMockup').setAttribute('aria-selected', 'false');
      syncWithBackend();
    });
    $('btnViewMockup').addEventListener('click', () => {
      state.view = 'mockup';
      $('btnViewMockup').classList.add('active');
      $('btnViewMockup').setAttribute('aria-selected', 'true');
      $('btnViewCanvas').classList.remove('active');
      $('btnViewCanvas').setAttribute('aria-selected', 'false');
      syncWithBackend();
    });

    // Color swatches
    document.querySelectorAll('#swatchBar [data-color]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.color = btn.getAttribute('data-color');
        document.querySelectorAll('#swatchBar [data-color]').forEach((b) => b.classList.toggle('active', b === btn));
        if (state.view === 'mockup') syncWithBackend();
      });
    });

    // Offsite Ads tier pills
    document.querySelectorAll('#offsiteAdsGroup [data-ads]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.offsiteAdsRate = Number(btn.getAttribute('data-ads')) || 0;
        document.querySelectorAll('#offsiteAdsGroup [data-ads]').forEach((b) => b.classList.toggle('active', b === btn));
        syncWithBackend();
      });
    });

    // Inputs
    ['inputTitle', 'inputSubtitle', 'inputNames', 'inputRetail', 'inputProd', 'inputShipCharged', 'inputShipCost'].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener('input', scheduleSync);
    });

    // Actions
    $('btnExportZip').addEventListener('click', handleExportZip);
    $('btnDownloadPng').addEventListener('click', handleDownloadPng);
    $('btnRefreshRender').addEventListener('click', syncWithBackend);
    $('themeToggleBtn').addEventListener('click', toggleTheme);

    $('btnCopyTitle').addEventListener('click', () => {
      copyText($('listingTitleText').textContent || '', 'Listing Title');
    });
    $('btnCopyTags').addEventListener('click', () => {
      const tags = (state.lastListing && state.lastListing.tags) ? state.lastListing.tags.join(', ') : '';
      copyText(tags, '13 Etsy Search Tags');
    });
    $('btnCopyListingJson').addEventListener('click', () => {
      copyText(JSON.stringify(state.lastListing || {}, null, 2), 'Listing JSON');
    });
    $('btnCopySolana').addEventListener('click', () => copyText(SOLANA_ADDRESS, 'Solana Tip Address'));

    // Prompt vault filters
    document.querySelectorAll('#promptCadreFilters [data-pcadre]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.promptFilterCadre = btn.getAttribute('data-pcadre');
        document.querySelectorAll('#promptCadreFilters [data-pcadre]').forEach((b) => b.classList.toggle('active', b === btn));
        renderPromptVault();
      });
    });
    $('promptSearchInput').addEventListener('input', (e) => {
      state.promptQuery = e.target.value || '';
      renderPromptVault();
    });
  }

  async function bootstrap() {
    updateThemeBtnLabel();
    bindEvents();
    renderPromptVault();
    renderMcpTools();

    try {
      const healthResp = await fetch('/api/health');
      if (healthResp.ok) {
        const h = await healthResp.json();
        state.backendOnline = true;
        $('daemonStatusBadge').textContent = ':' + (h.port || 8107) + ' LIVE';

        const [cadresResp, promptsResp, mcpResp] = await Promise.all([
          fetch('/api/cadres').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/prompts').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/mcp/tools').then((r) => (r.ok ? r.json() : null))
        ]);

        if (cadresResp && cadresResp.cadres) {
          Object.keys(cadresResp.cadres).forEach((k) => {
            state.cadres[k] = Object.assign({}, FALLBACK_CADRES[k] || {}, cadresResp.cadres[k]);
          });
        }
        if (promptsResp && Array.isArray(promptsResp.prompts)) {
          state.prompts = promptsResp.prompts;
          $('navPrompts').textContent = 'Prompt Vault (' + state.prompts.length + ')';
          renderPromptVault();
        }
        if (mcpResp && Array.isArray(mcpResp.tools)) {
          state.mcpTools = mcpResp.tools;
          $('navMcp').textContent = 'MCP (' + state.mcpTools.length + ') & CLI';
          renderMcpTools();
        }
      }
    } catch (e) {
      state.backendOnline = false;
      $('daemonStatusBadge').textContent = 'OFFLINE FALLBACK';
    }

    selectCadre('apparel');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
