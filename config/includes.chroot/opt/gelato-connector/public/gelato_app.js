/**
 * Gelato Connector v2.6.0 — Client Workstation Application
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 * Live :8116 API Integration + 100% In-Browser FX-Safe Fallback
 */

const FX_TO_USD = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.73,
  AUD: 0.65,
  JPY: 1.0 / 150.0,
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
};

let PRODUCTS = {
  acrylic_print_16x24: {
    id: "acrylic_print_16x24",
    product_uid: "acrylic_print_400x600-mm-16x24-inch_4mm-acrylic_4-0",
    title: "Acrylic Glass Print (16x24 in / 40x60 cm)",
    category: "Wall Art / Acrylic",
    base_cost_usd: 29.5,
    base_cost_eur: 27.2,
    base_cost_gbp: 23.4,
    print_width_px: 4800,
    print_height_px: 7200,
    recommended_dpi: 300,
    bleed_mm: 3.0,
    local_production_countries: ["US", "DE", "UK", "CA", "AU", "FR", "NL"],
  },
  aluminum_print_16x24: {
    id: "aluminum_print_16x24",
    product_uid: "aluminum_print_dibond_400x600-mm-16x24-inch_3mm-brushed_4-0",
    title: "Brushed Aluminum Dibond Print (16x24 in / 40x60 cm)",
    category: "Wall Art / Aluminum",
    base_cost_usd: 26.8,
    base_cost_eur: 24.9,
    base_cost_gbp: 21.2,
    print_width_px: 4800,
    print_height_px: 7200,
    recommended_dpi: 300,
    bleed_mm: 3.0,
    local_production_countries: ["US", "DE", "UK", "CA", "AU", "NO"],
  },
  wooden_framed_canvas_16x24: {
    id: "wooden_framed_canvas_16x24",
    product_uid: "framed_canvas_mounted_400x600-mm-16x24-inch_wood_oak_4-0",
    title: "Framed Wooden Canvas Wrap (16x24 in)",
    category: "Wall Art / Canvas",
    base_cost_usd: 24.2,
    base_cost_eur: 22.5,
    base_cost_gbp: 19.3,
    print_width_px: 5100,
    print_height_px: 7500,
    recommended_dpi: 300,
    bleed_mm: 5.0,
    local_production_countries: ["US", "UK", "DE", "FR", "ES", "IT", "CA", "AU", "JP"],
  },
  stanley_stella_organic_tee: {
    id: "stanley_stella_organic_tee",
    product_uid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_organic_gsi_l_gco_black_gpr_4-0",
    title: "Stanley/Stella Organic Creator Unisex T-Shirt",
    category: "Apparel / Organic T-Shirts",
    base_cost_usd: 12.4,
    base_cost_eur: 10.9,
    base_cost_gbp: 9.5,
    print_width_px: 4000,
    print_height_px: 4800,
    recommended_dpi: 300,
    bleed_mm: 0.0,
    local_production_countries: ["DE", "UK", "FR", "NL", "ES", "IT", "US"],
  },
  ceramic_mug_15oz: {
    id: "ceramic_mug_15oz",
    product_uid: "mug_product_msz_15-oz_mmat_ceramic-accent_cl_4-0",
    title: "Large Ceramic Accent Mug 15oz",
    category: "Home & Living / Mugs",
    base_cost_usd: 5.95,
    base_cost_eur: 5.4,
    base_cost_gbp: 4.6,
    print_width_px: 2850,
    print_height_px: 1200,
    recommended_dpi: 300,
    bleed_mm: 2.0,
    local_production_countries: ["US", "UK", "DE", "CA", "AU"],
  },
  enamel_campfire_mug: {
    id: "enamel_campfire_mug",
    product_uid: "mug_product_msz_12-oz_mmat_enamel-white_cl_4-0",
    title: "Vintage Stainless Steel Enamel Campfire Mug 12oz",
    category: "Home & Living / Outdoor",
    base_cost_usd: 7.4,
    base_cost_eur: 6.8,
    base_cost_gbp: 5.8,
    print_width_px: 2500,
    print_height_px: 950,
    recommended_dpi: 300,
    bleed_mm: 2.0,
    local_production_countries: ["US", "DE", "UK", "PL"],
  },
  hardcover_photo_journal: {
    id: "hardcover_photo_journal",
    product_uid: "notebook_hardcover_a5_90gsm-uncoated_128p_4-0",
    title: "Hardcover Matte Photo Journal (A5 / 128 Pages)",
    category: "Stationery / Journals",
    base_cost_usd: 8.9,
    base_cost_eur: 8.1,
    base_cost_gbp: 6.9,
    print_width_px: 3700,
    print_height_px: 2600,
    recommended_dpi: 300,
    bleed_mm: 4.0,
    local_production_countries: ["US", "DE", "UK", "NL", "AU"],
  },
};

let HUBS = {
  US: { country: "United States", iso2: "US", currency: "USD", avg_lead_days: 2.2, local_ship_cost: 4.5, express_ship_cost: 9.8, carrier: "USPS / FedEx Ground" },
  CA: { country: "Canada", iso2: "CA", currency: "CAD", avg_lead_days: 2.5, local_ship_cost: 6.8, express_ship_cost: 12.5, carrier: "Canada Post / Purolator" },
  UK: { country: "United Kingdom", iso2: "GB", currency: "GBP", avg_lead_days: 2.0, local_ship_cost: 3.9, express_ship_cost: 7.5, carrier: "Royal Mail 48 / DPD" },
  DE: { country: "Germany", iso2: "DE", currency: "EUR", avg_lead_days: 2.1, local_ship_cost: 4.2, express_ship_cost: 8.5, carrier: "Deutsche Post / DHL" },
  FR: { country: "France", iso2: "FR", currency: "EUR", avg_lead_days: 2.4, local_ship_cost: 4.6, express_ship_cost: 8.9, carrier: "Colissimo / Chronopost" },
  IT: { country: "Italy", iso2: "IT", currency: "EUR", avg_lead_days: 2.6, local_ship_cost: 4.9, express_ship_cost: 9.2, carrier: "Poste Italiane / BRT" },
  ES: { country: "Spain", iso2: "ES", currency: "EUR", avg_lead_days: 2.5, local_ship_cost: 4.7, express_ship_cost: 8.9, carrier: "Correos / SEUR" },
  NL: { country: "Netherlands", iso2: "NL", currency: "EUR", avg_lead_days: 2.0, local_ship_cost: 4.1, express_ship_cost: 7.9, carrier: "PostNL / DPD" },
  AU: { country: "Australia", iso2: "AU", currency: "AUD", avg_lead_days: 2.3, local_ship_cost: 7.2, express_ship_cost: 13.9, carrier: "Australia Post / StarTrack" },
  JP: { country: "Japan", iso2: "JP", currency: "JPY", avg_lead_days: 2.5, local_ship_cost: 650.0, express_ship_cost: 1200.0, carrier: "Japan Post / Yamato" },
};

let MCP_TOOLS = [
  { name: "gelato_search_catalog", description: "Search the 7 bundled Gelato products with real Order API v4 productUid values." },
  { name: "gelato_get_shipping_quote", description: "Quote domestic or cross-border shipping with FX-converted freight savings across 10 local hubs." },
  { name: "gelato_calculate_margins", description: "Compute FX-safe COGS, channel fees, net profit, and break-even prices in USD, EUR, GBP, CAD, AUD, JPY." },
  { name: "gelato_audit_print_spec", description: "Verify 300-DPI effective resolution, aspect ratio, and bleed compliance (including 0mm DTG apparel)." },
  { name: "gelato_create_order_payload", description: "Synthesize safe draft Order API v4 JSON payloads with public HTTPS SSRF validation." },
  { name: "gelato_get_shop_info", description: "Verify GELATO_API_KEY live against Product API v3 or report honest offline mode." },
];

let daemonLive = false;

function convertCurrency(amount, fromCurr, toCurr) {
  const src = String(fromCurr || "USD").toUpperCase();
  const dst = String(toCurr || "USD").toUpperCase();
  if (src === dst) return Number(amount);
  const srcRate = FX_TO_USD[src] || 1.0;
  const dstRate = FX_TO_USD[dst] || 1.0;
  return (Number(amount) * srcRate) / dstRate;
}

function fmtMoney(val, curr) {
  const sym = CURRENCY_SYMBOLS[curr] || "$";
  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const formatted = curr === "JPY" ? Math.round(abs).toLocaleString() : abs.toFixed(2);
  return `${num < 0 ? "-" : ""}${sym}${formatted}`;
}

function showToast(msg) {
  let toast = document.getElementById("gelatoToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gelatoToast";
    toast.setAttribute("role", "status");
    toast.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:10000;background:var(--bg-card);border:1px solid var(--azure);color:var(--text-strong);padding:0.65rem 1.1rem;border-radius:10px;font-family:var(--font-mono);font-size:0.8rem;box-shadow:var(--shadow-card);transition:opacity 0.2s ease,transform 0.2s ease;opacity:0;transform:translateY(8px);pointer-events:none;";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 2600);
}

function applyTheme(theme, persist = false) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  if (persist) {
    try {
      localStorage.setItem("gelato-connector-theme", next);
    } catch (_) {}
  }
  const icon = document.getElementById("themeToggleIcon");
  const label = document.getElementById("themeToggleLabel");
  if (icon && label) {
    if (next === "light") {
      icon.textContent = "☾";
      label.textContent = "Dark Mode";
    } else {
      icon.textContent = "☀";
      label.textContent = "Light Mode";
    }
  }
}

function initTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(current, false);
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const now = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(now, true);
    });
  }
}

async function apiGet(path) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function hydrateFromLiveDaemon() {
  try {
    const [health, productsResp, hubsResp, mcpResp, shopResp] = await Promise.all([
      apiGet("/api/health"),
      apiGet("/api/products"),
      apiGet("/api/hubs"),
      apiGet("/api/mcp/tools"),
      apiGet("/api/shop"),
    ]);

    daemonLive = true;
    const statusText = document.getElementById("daemonStatusText");
    if (statusText) {
      statusText.textContent = `LIVE :${health.port} · ${Object.keys(hubsResp.hubs || HUBS).length} BUNDLED HUBS`;
    }

    if (Array.isArray(productsResp.products) && productsResp.products.length > 0) {
      const map = {};
      productsResp.products.forEach((p) => { map[p.id] = p; });
      PRODUCTS = map;
      const mp = document.getElementById("metricProducts");
      if (mp) mp.textContent = `${productsResp.products.length} Products`;
    }

    if (hubsResp && hubsResp.hubs) {
      HUBS = hubsResp.hubs;
      const mh = document.getElementById("metricHubs");
      if (mh) mh.textContent = `${Object.keys(HUBS).length} Local Hubs`;
    }

    if (mcpResp && Array.isArray(mcpResp.tools)) {
      MCP_TOOLS = mcpResp.tools;
      const mm = document.getElementById("metricMcp");
      if (mm) mm.textContent = `${MCP_TOOLS.length} Tools`;
    }

    if (shopResp && shopResp.shop) {
      updateShopBanner(shopResp.shop);
    }

    renderHubsTable();
    renderMcpTools();
  } catch (_) {
    daemonLive = false;
    renderHubsTable();
    renderMcpTools();
  }
}

function updateShopBanner(shop) {
  const el = document.getElementById("shopModeValue");
  const sub = document.getElementById("metricApiMode");
  if (!el) return;
  if (shop.api_connected) {
    el.textContent = `LIVE (${shop.catalogs_count ?? 0} live Gelato Product v3 catalogs verified)`;
    if (sub) sub.textContent = "Live GELATO_API_KEY Verified";
  } else {
    el.textContent = "OFFLINE (Bundled Reference Data — Export GELATO_API_KEY for Live /v3/catalogs)";
    if (sub) sub.textContent = "Offline Reference Mode (Set GELATO_API_KEY)";
  }
}

async function refreshMcpAndShop() {
  await hydrateFromLiveDaemon();
  showToast(daemonLive ? "Synced live :8116 daemon telemetry." : "Running in-browser fallback (daemon offline).");
}

function computeMarginsLocal(prodId, retail, curr, country, qty) {
  const prod = PRODUCTS[prodId] || PRODUCTS.acrylic_print_16x24;
  const hub = HUBS[country] || null;
  const isLocal = Boolean(hub && Array.isArray(prod.local_production_countries) && prod.local_production_countries.includes(country));

  let baseUnit;
  if (curr === "EUR") baseUnit = prod.base_cost_eur;
  else if (curr === "GBP") baseUnit = prod.base_cost_gbp;
  else if (curr === "USD") baseUnit = prod.base_cost_usd;
  else baseUnit = convertCurrency(prod.base_cost_usd, "USD", curr);

  const baseProd = baseUnit * qty;

  let shipNative;
  let shipNativeCurr;
  let carrier;
  let transit;
  let hubName;
  if (isLocal) {
    const first = Number(hub.local_ship_cost);
    const add = first * 0.4;
    shipNative = first + add * Math.max(0, qty - 1);
    shipNativeCurr = hub.currency;
    carrier = hub.carrier;
    transit = "2-4 business days";
    hubName = `Domestic ${hub.country} Print Facility`;
  } else {
    shipNative = 11.8 + 4.5 * Math.max(0, qty - 1);
    shipNativeCurr = "USD";
    carrier = "DHL Express / Asendia Cross-Border";
    transit = "7-14 business days";
    hubName = "Nearest Regional Hub (Cross-Border Transit)";
  }

  const shipConverted = convertCurrency(shipNative, shipNativeCurr, curr);
  const tradUsd = 16.5 + 5.0 * Math.max(0, qty - 1);
  const tradInCurr = convertCurrency(tradUsd, "USD", curr);
  const freightSavings = Math.max(0, tradInCurr - shipConverted);

  const cogs = baseProd + shipConverted;
  const revenue = retail * qty;

  const etsyFixed = convertCurrency(0.45, "USD", curr);
  const cardFixed = convertCurrency(0.3, "USD", curr);
  const etsyFee = revenue * 0.095 + etsyFixed;
  const shopifyFee = revenue * 0.029 + cardFixed;
  const directFee = revenue * 0.029 + cardFixed;

  const etsyProfit = revenue - cogs - etsyFee;
  const shopifyProfit = revenue - cogs - shopifyFee;
  const directProfit = revenue - cogs - directFee;

  const breakEven = ((cogs + cardFixed) / 0.971) / qty;

  return {
    currency: curr,
    is_local_production: isLocal,
    production_hub: hubName,
    carrier,
    transit,
    base_production_cost: baseProd,
    shipping_cost: shipConverted,
    shipping_cost_native: shipNative,
    shipping_currency_native: shipNativeCurr,
    total_cogs: cogs,
    freight_savings: freightSavings,
    break_even_price: breakEven,
    channels: {
      etsy: { net_profit: etsyProfit, profit_margin_pct: revenue > 0 ? (etsyProfit / revenue) * 100 : 0 },
      shopify: { net_profit: shopifyProfit, profit_margin_pct: revenue > 0 ? (shopifyProfit / revenue) * 100 : 0 },
      direct: { net_profit: directProfit, profit_margin_pct: revenue > 0 ? (directProfit / revenue) * 100 : 0 },
    },
  };
}

function renderMarginResult(m, curr) {
  const etsy = m.channels.etsy;
  const shopify = m.channels.shopify;
  const direct = m.channels.direct;

  document.getElementById("heroMargin").textContent = `${Number(shopify.profit_margin_pct).toFixed(1)}%`;
  document.getElementById("heroProfit").textContent = fmtMoney(shopify.net_profit, curr);
  document.getElementById("heroBaseCost").textContent = fmtMoney(m.base_production_cost, curr);

  const shipEl = document.getElementById("heroShipCost");
  if (shipEl) {
    const nativeNote =
      m.shipping_currency_native && m.shipping_currency_native !== curr
        ? ` (${fmtMoney(m.shipping_cost_native, m.shipping_currency_native)})`
        : "";
    shipEl.textContent = `${fmtMoney(m.shipping_cost, curr)}${nativeNote}`;
  }

  document.getElementById("heroCogs").textContent = fmtMoney(m.total_cogs, curr);
  const beEl = document.getElementById("heroBreakEven");
  if (beEl) beEl.textContent = fmtMoney(m.break_even_price, curr);

  document.getElementById("outEtsyProfit").textContent = fmtMoney(etsy.net_profit, curr);
  document.getElementById("outEtsyMargin").textContent = `${Number(etsy.profit_margin_pct).toFixed(1)}%`;
  document.getElementById("outShopifyProfit").textContent = fmtMoney(shopify.net_profit, curr);
  document.getElementById("outShopifyMargin").textContent = `${Number(shopify.profit_margin_pct).toFixed(1)}%`;
  document.getElementById("outDirectProfit").textContent = fmtMoney(direct.net_profit, curr);
  document.getElementById("outDirectMargin").textContent = `${Number(direct.profit_margin_pct).toFixed(1)}%`;

  document.getElementById("routingHubName").textContent = m.production_hub;
  document.getElementById("routingCarrier").textContent = m.carrier;
  document.getElementById("routingLead").textContent = m.transit || (m.is_local_production ? "2-4 business days" : "7-14 business days");
  document.getElementById("customsSavings").textContent = m.is_local_production
    ? `${fmtMoney(m.freight_savings, curr)} Saved (0 Customs Delay)`
    : `${fmtMoney(m.freight_savings, curr)} (Cross-Border Duties May Apply)`;
}

let marginReqSeq = 0;

async function recalculateMargins() {
  const prodId = document.getElementById("prodSelect").value;
  const retail = Math.max(0, parseFloat(document.getElementById("retailPrice").value) || 0);
  const curr = document.getElementById("currencySelect").value;
  const country = document.getElementById("countrySelect").value;
  const qty = Math.max(1, parseInt(document.getElementById("orderQuantity").value, 10) || 1);

  const localRes = computeMarginsLocal(prodId, retail, curr, country, qty);
  renderMarginResult(localRes, curr);

  const seq = ++marginReqSeq;
  try {
    const [mResp, sResp] = await Promise.all([
      apiPost("/api/margins", {
        productId: prodId,
        retailPrice: retail,
        currency: curr,
        destinationCountry: country,
        quantity: qty,
      }),
      apiPost("/api/shipping", {
        productId: prodId,
        destinationCountry: country,
        isExpress: false,
        quantity: qty,
      }),
    ]);
    if (seq !== marginReqSeq) return;
    const ch = mResp.margins.channels;
    const sh = sResp.shipping;
    renderMarginResult(
      {
        currency: curr,
        is_local_production: ch.shopify.is_local_production,
        production_hub: sh.production_hub,
        carrier: sh.carrier,
        transit: sh.estimated_transit,
        base_production_cost: ch.shopify.base_production_cost,
        shipping_cost: ch.shopify.shipping_cost,
        shipping_cost_native: ch.shopify.shipping_cost_native,
        shipping_currency_native: ch.shopify.shipping_currency_native,
        total_cogs: ch.shopify.total_cogs,
        freight_savings: ch.shopify.freight_savings,
        break_even_price: ch.shopify.break_even_price,
        channels: ch,
      },
      curr
    );
    const tag = document.getElementById("marginSourceTag");
    if (tag) tag.textContent = "Live :8116 API Verified";
  } catch (_) {
    const tag = document.getElementById("marginSourceTag");
    if (tag) tag.textContent = "In-Browser FX Engine";
  }
}

function renderAuditResult(a) {
  const dpiBadge = document.getElementById("effectiveDpiBadge");
  const gradeText = document.getElementById("qualityGradeText");
  const feedbackList = document.getElementById("auditFeedback");
  const targetEl = document.getElementById("targetAreaDisplay");

  const t = a.target_dimensions;
  targetEl.textContent = `${t.width_px} × ${t.height_px} px @ ${t.recommended_dpi} DPI (${t.bleed_mm}mm Bleed)`;
  dpiBadge.textContent = `${a.effective_dpi} DPI`;

  const grade = a.print_quality_grade;
  if (grade === "EXCELLENT") {
    dpiBadge.className = "metric-val val-azure";
    gradeText.className = "audit-grade val-azure";
    gradeText.textContent = "EXCELLENT — Gallery Print Standard";
  } else if (grade === "ACCEPTABLE") {
    dpiBadge.className = "metric-val val-cyan";
    gradeText.className = "audit-grade val-cyan";
    gradeText.textContent = "ACCEPTABLE — Standard Retail Print Quality";
  } else if (grade === "WARNING") {
    dpiBadge.className = "metric-val val-gold";
    gradeText.className = "audit-grade val-gold";
    gradeText.textContent = "WARNING — Soft Detail Risk";
  } else {
    dpiBadge.className = "metric-val val-ruby";
    gradeText.className = "audit-grade val-ruby";
    gradeText.textContent = "CRITICAL LOW-RES — Upscale Artwork";
  }

  feedbackList.textContent = "";
  (a.feedback || []).forEach((line) => {
    const li = document.createElement("li");
    li.textContent = `• ${line}`;
    feedbackList.appendChild(li);
  });
}

let auditReqSeq = 0;

async function auditArtwork() {
  const prodId = document.getElementById("auditProdSelect").value;
  const w = Math.max(1, parseInt(document.getElementById("artWidth").value, 10) || 4800);
  const h = Math.max(1, parseInt(document.getElementById("artHeight").value, 10) || 7200);
  const prod = PRODUCTS[prodId] || PRODUCTS.acrylic_print_16x24;

  const scale = Math.min(w / prod.print_width_px, h / prod.print_height_px);
  const dpi = Math.round(prod.recommended_dpi * scale);
  let grade = "CRITICAL_LOW_RES";
  const fb = [];
  if (dpi >= 300) {
    grade = "EXCELLENT";
    fb.push("Artwork satisfies Gelato 300+ DPI gallery print benchmark.");
  } else if (dpi >= 200) {
    grade = "ACCEPTABLE";
    fb.push(`Effective DPI is ${dpi}. Meets retail printing standards; 300 DPI recommended for wall art.`);
  } else if (dpi >= 150) {
    grade = "WARNING";
    fb.push(`Effective DPI is ${dpi}. May exhibit grain on large wall decor.`);
  } else {
    fb.push(`Effective DPI is ${dpi}. High pixelation risk; upscale artwork before publishing.`);
  }
  fb.push(
    prod.bleed_mm > 0
      ? `Product requires ${prod.bleed_mm}mm perimeter bleed zone. Keep typography inside the safe area.`
      : "No bleed required for DTG apparel."
  );

  renderAuditResult({
    effective_dpi: dpi,
    print_quality_grade: grade,
    target_dimensions: {
      width_px: prod.print_width_px,
      height_px: prod.print_height_px,
      recommended_dpi: prod.recommended_dpi,
      bleed_mm: prod.bleed_mm,
    },
    feedback: fb,
  });

  const seq = ++auditReqSeq;
  try {
    const resp = await apiPost("/api/audit", {
      productId: prodId,
      widthPx: w,
      heightPx: h,
      fileName: "artwork.png",
    });
    if (seq === auditReqSeq && resp.audit) {
      renderAuditResult(resp.audit);
    }
  } catch (_) {}
}

function renderHubsTable() {
  const tbody = document.getElementById("hubsTbody");
  if (!tbody) return;
  tbody.textContent = "";

  Object.entries(HUBS).forEach(([code, h]) => {
    const tr = document.createElement("tr");

    const tdCountry = document.createElement("td");
    const strong = document.createElement("strong");
    strong.textContent = `${h.country} (${code})`;
    tdCountry.appendChild(strong);

    const tdStatus = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "hub-pill";
    pill.textContent = "Domestic Hub";
    tdStatus.appendChild(pill);

    const tdLead = document.createElement("td");
    tdLead.className = "text-mono val-emerald";
    tdLead.textContent = `${h.avg_lead_days} Days`;

    const tdCarrier = document.createElement("td");
    tdCarrier.className = "text-mono";
    tdCarrier.textContent = h.carrier;

    const tdCost = document.createElement("td");
    tdCost.className = "text-mono";
    tdCost.textContent = `${fmtMoney(h.local_ship_cost, h.currency)} (${h.currency})`;

    tr.append(tdCountry, tdStatus, tdLead, tdCarrier, tdCost);
    tbody.appendChild(tr);
  });
}

function renderMcpTools() {
  const grid = document.getElementById("mcpToolsGrid");
  if (!grid) return;
  grid.textContent = "";
  MCP_TOOLS.forEach((tool) => {
    const card = document.createElement("div");
    card.className = "mcp-card";
    const name = document.createElement("div");
    name.className = "mcp-name";
    name.textContent = tool.name;
    const desc = document.createElement("div");
    desc.className = "mcp-desc";
    desc.textContent = tool.description;
    card.append(name, desc);
    grid.appendChild(card);
  });
}

function validatePublicHttpsClient(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (u.protocol !== "https:") return "imageUrl must use https:// (http:// and file:// are blocked).";
    const host = u.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) {
      return "imageUrl host must be a public domain (local/intranet hosts are blocked).";
    }
    if (/^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/.test(host) || host === "::1") {
      return "imageUrl IP is blocked (loopback, RFC1918 private, or IMDS link-local).";
    }
    return null;
  } catch (_) {
    return "Enter a valid public https:// artwork URL.";
  }
}

let payloadReqSeq = 0;

async function generateOrderPayload() {
  const prodId = document.getElementById("prodSelect").value;
  const prod = PRODUCTS[prodId] || PRODUCTS.acrylic_print_16x24;
  const country = document.getElementById("countrySelect").value;
  const curr = document.getElementById("currencySelect").value;
  const qty = Math.max(1, parseInt(document.getElementById("orderQuantity").value, 10) || 1);
  const title = (document.getElementById("payloadTitle")?.value || "Archival Artwork").trim();
  const artUrl = (document.getElementById("payloadArtworkUrl")?.value || "").trim();
  const orderType = document.getElementById("payloadOrderType")?.value || "draft";

  const errEl = document.getElementById("payloadErrorBanner");
  const outEl = document.getElementById("payloadOutput");

  const clientErr = validatePublicHttpsClient(artUrl);
  if (clientErr) {
    if (errEl) {
      errEl.textContent = `Blocked URL: ${clientErr}`;
      errEl.hidden = false;
    }
    return;
  }
  if (errEl) errEl.hidden = true;

  const iso2 = country === "UK" ? "GB" : country;
  const sampleCities = {
    US: ["New York", "10001"],
    DE: ["Berlin", "10115"],
    UK: ["London", "EC1A 1BB"],
    FR: ["Paris", "75001"],
    IT: ["Milan", "20121"],
    ES: ["Madrid", "28013"],
    NL: ["Amsterdam", "1012 JS"],
    CA: ["Toronto", "M5V 2T6"],
    AU: ["Sydney", "2000"],
    JP: ["Tokyo", "100-0001"],
  };
  const [city, postCode] = sampleCities[country] || ["Berlin", "10115"];

  const fallbackPayload = {
    orderType,
    orderReferenceId: "ORDER-GELATO-8116",
    customerReferenceId: "CUST-ORDER-GELATO-8116",
    currency: curr,
    shipmentMethodUid: "standard",
    shippingAddress: {
      firstName: "Jane",
      lastName: "Doe",
      addressLine1: "Example Street 1",
      city,
      country: iso2,
      postCode,
      email: "customer@example.com",
    },
    items: [
      {
        itemReferenceId: `ITEM-${prod.id}-01`,
        productUid: prod.product_uid,
        title,
        files: [{ type: "default", url: artUrl }],
        quantity: qty,
      },
    ],
    metadata: {
      artworkTitle: title,
      productId: prod.id,
      apiEndpoint: "https://order.gelatoapis.com/v4/orders",
    },
  };
  if (outEl) outEl.textContent = JSON.stringify(fallbackPayload, null, 2);

  const seq = ++payloadReqSeq;
  try {
    const resp = await apiPost("/api/create-payload", {
      productId: prodId,
      imageUrl: artUrl,
      recipientName: "Jane Doe",
      addressLine: "Example Street 1",
      city,
      country,
      postalCode: postCode,
      orderType,
      orderReferenceId: "ORDER-GELATO-8116",
      quantity: qty,
      artworkTitle: title,
      currency: curr,
    });
    if (seq === payloadReqSeq && resp.gelato_order_payload && outEl) {
      outEl.textContent = JSON.stringify(resp.gelato_order_payload, null, 2);
      if (errEl) errEl.hidden = true;
    }
  } catch (err) {
    if (seq === payloadReqSeq && errEl && err && err.message && !String(err.message).startsWith("Failed to fetch")) {
      errEl.textContent = `Server validation: ${err.message}`;
      errEl.hidden = false;
    }
  }
}

function handleImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showToast("Please select a valid image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      document.getElementById("artWidth").value = img.naturalWidth;
      document.getElementById("artHeight").value = img.naturalHeight;
      document.getElementById("dropzoneText").textContent = `Loaded: ${file.name} (${img.naturalWidth} × ${img.naturalHeight} px)`;
      auditArtwork();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function runAction(actionName) {
  if (actionName === "copy_payload") {
    const output = document.getElementById("payloadOutput")?.textContent || "";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(output).then(() => {
        showToast("Gelato Order API v4 payload copied to clipboard.");
      }).catch(() => {
        showToast("Clipboard permission denied — copy from the JSON box.");
      });
    } else {
      showToast("Clipboard unavailable — copy from the JSON box.");
    }
  } else if (actionName === "export_hubs") {
    let csv = "Country Code,Country Name,Currency,Avg Lead Days,Local Carrier,Base Domestic Shipping\n";
    Object.entries(HUBS).forEach(([code, h]) => {
      csv += `"${code}","${h.country}","${h.currency}",${h.avg_lead_days},"${h.carrier}",${h.local_ship_cost}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gelato_10_local_hubs.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported 10-hub CSV.");
  } else if (actionName === "global_router") {
    const bundle = {
      name: "Gelato Connector Local Dispatch Bundle",
      version: "2.6.0",
      author: "Neal Frazier Tech (@1nc0gn30)",
      api: {
        products: "https://product.gelatoapis.com/v3",
        orders: "https://order.gelatoapis.com/v4/orders",
      },
      hubs_count: Object.keys(HUBS).length,
      fx_to_usd: FX_TO_USD,
      hubs: HUBS,
      mcp_tools: MCP_TOOLS.map((t) => t.name),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gelato_dispatch_bundle_v2.6.0.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Exported Gelato dispatch bundle JSON.");
  }
}

function setupEventListeners() {
  ["prodSelect", "retailPrice", "currencySelect", "countrySelect", "orderQuantity"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => {
        recalculateMargins();
        generateOrderPayload();
      });
    }
  });

  ["auditProdSelect", "artWidth", "artHeight"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", auditArtwork);
  });

  ["payloadTitle", "payloadArtworkUrl", "payloadOrderType"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", generateOrderPayload);
  });

  const payloadForm = document.getElementById("payloadForm");
  if (payloadForm) {
    payloadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      generateOrderPayload();
    });
  }

  const dropzone = document.getElementById("artworkDropzone");
  const fileInput = document.getElementById("artworkFileInput");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files.length) handleImageFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length) handleImageFile(e.target.files[0]);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  renderHubsTable();
  renderMcpTools();
  recalculateMargins();
  auditArtwork();
  generateOrderPayload();
  hydrateFromLiveDaemon();
});
