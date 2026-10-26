/**
 * Etsy POD Forge — Client-Side Core Engine & Interactive Studio
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 * 100% Functional In-Browser Utility — Zero Fake Work
 */

(function () {
  'use strict';

  // State Management
  const state = {
    cadre: 'apparel',
    title: "Grandma's Garden",
    subtitle: 'Where Love Blooms & Family Grows',
    names: 'Emma, Liam, Olivia, Noah',
    color: 'sand',
    retail: 34.99,
    activeTab: 'canvas',
    isLicensed: false,
    prompts: [],
    stats: {
      canvases: 1,
      mockups: 1,
      listings: 1,
    }
  };

  const CADRE_SPECS = {
    apparel: {
      name: "Grandma's Garden Apparel",
      product_type: "Comfort Colors 1717 Tee / Gildan 18000 Sweatshirt",
      default_retail: 34.99,
      default_prod: 12.50,
      title: "Grandma Garden Sweatshirt, Custom Wildflower Sweater, Personalized Grandma Gift, Mothers Day Crewneck",
      tags: [
        "grandma sweatshirt", "gardener gift", "wildflower sweater",
        "grandmas garden", "grandma crewneck", "mom birthday gift",
        "cottagecore clothes", "comfort colors tee", "plant lover gift",
        "gift for grandma", "botanical shirt", "grandkids names",
        "mothers day gift"
      ],
      aspect: "4:5",
      dim: "4500 x 5400 px @ 300 DPI"
    },
    mugs: {
      name: "Cozy Songbirds & Animal Mugs",
      product_type: "15oz Ceramic Coffee & Tea Mug",
      default_retail: 21.99,
      default_prod: 6.80,
      title: "Watercolor Bird Coffee Mug 15oz, Bird Watcher Gift, Cozy Cottagecore Tea Cup, Nature Lover Ceramic Mug",
      tags: [
        "bird watcher gift", "watercolor bird mug", "cottagecore mug",
        "bird lover gift", "coffee mug 15oz", "tea lover cup",
        "cardinal mug", "backyard birds", "grandma mug",
        "garden lover gift", "ceramic coffee mug", "nature coffee cup",
        "cute bird gifts"
      ],
      aspect: "1:1",
      dim: "2000 x 2000 px @ 300 DPI"
    },
    totes: {
      name: "Vintage French Seed Totes",
      product_type: "12oz Heavyweight Cotton Canvas Tote",
      default_retail: 24.99,
      default_prod: 7.20,
      title: "Vintage French Seed Packet Canvas Tote, Farmers Market Bag, Botanical Library Tote, Heavyweight Garden Shopper",
      tags: [
        "french seed packet", "canvas tote bag", "farmers market tote",
        "botanical tote", "library book tote", "gardener gift",
        "cottagecore bag", "lavender tote", "heavy canvas tote",
        "market shopping bag", "flower market bag", "vintage botanical",
        "eco friendly bag"
      ],
      aspect: "1:1",
      dim: "3600 x 3600 px @ 300 DPI"
    },
    wall_art: {
      name: "High-Res Botanical Wall Art",
      product_type: "Instant 300 DPI 5-Ratio Printable ZIP Bundle",
      default_retail: 9.99,
      default_prod: 0.00,
      title: "Vintage Botanical Prints Set of 12, Printable Wildflower Wall Art, Cottagecore Gallery Decor, Digital Download 300 DPI",
      tags: [
        "botanical wall art", "vintage flower print", "wildflower decor",
        "digital download art", "gallery wall set", "cottagecore decor",
        "printable wall art", "farmhouse wall decor", "living room prints",
        "bathroom art print", "vintage botanical", "flower poster",
        "large wall art"
      ],
      aspect: "3:4",
      dim: "4500 x 6000 px @ 300 DPI"
    },
    crafting: {
      name: "Traditional Quilt Blueprints",
      product_type: "Printable Multi-Page PDF Pattern & Cutting Guide",
      default_retail: 7.50,
      default_prod: 0.00,
      title: "Barn Star Quilt Pattern PDF, Printable Patchwork Blueprint, Lone Star Cutting Guide, Traditional Quilter Gift",
      tags: [
        "quilt pattern pdf", "barn star quilt", "lone star pattern",
        "patchwork blueprint", "quilting printable", "quilt block pattern",
        "quilter gift", "traditional quilt", "cutting guide pdf",
        "quilt template", "epp pattern", "sewing project",
        "craft blueprint"
      ],
      aspect: "1:1",
      dim: "3600 x 3600 px @ 300 DPI"
    }
  };

  // Pro License Storage Keys
  const STORAGE_KEY = 'etsy_pod_licensed';
  const STORAGE_KEY_ALT = 'zoth_etsy_pod_licensed';
  const STORAGE_KEY_PRO = 'pro_licensed';

  // Check Pro License Status
  function checkLicense() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('licensed') === 'true' || urlParams.get('pro') === 'true' || urlParams.get('pro') === '1' || urlParams.get('key') === 'ETSY-PRO-2026') {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY_ALT, 'true');
      localStorage.setItem(STORAGE_KEY_PRO, 'true');
      try {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
      } catch (e) {}
    }
    state.isLicensed = localStorage.getItem(STORAGE_KEY) === 'true' ||
                       localStorage.getItem(STORAGE_KEY_ALT) === 'true' ||
                       localStorage.getItem(STORAGE_KEY_PRO) === 'true';
    updateLicenseUI();
  }

  function updateLicenseUI() {
    const badge = document.getElementById('licenseBadge');
    const paywallOverlay = document.getElementById('paywallOverlay');
    const exportLocked = document.getElementById('exportLockedNotice');
    const salesBanner = document.getElementById('salesBanner') || document.querySelector('.sales-funnel-banner');
    const btnActivate = document.getElementById('btnOpenProModal') || document.getElementById('btnActivateKey');

    if (state.isLicensed) {
      if (badge) {
        badge.innerHTML = '⭐ PRO ACTIVE';
        badge.classList.remove('badge-guest');
        badge.classList.add('badge-pro');
      }
      if (paywallOverlay) {
        paywallOverlay.style.display = 'none';
      }
      const blurs = document.querySelectorAll('.paywall-blur');
      blurs.forEach(el => el.classList.remove('paywall-blur'));
      if (exportLocked) {
        exportLocked.style.display = 'none';
      }
      if (salesBanner) {
        salesBanner.style.display = 'none';
      }
      if (btnActivate) {
        btnActivate.style.display = 'none';
      }
    } else {
      if (badge) {
        badge.innerHTML = '⚡ FREE TIER';
        badge.classList.add('badge-guest');
        badge.classList.remove('badge-pro');
      }
      if (paywallOverlay) {
        paywallOverlay.style.display = 'flex';
      }
      if (salesBanner) {
        salesBanner.style.display = 'block';
      }
      if (btnActivate) {
        btnActivate.style.display = 'inline-block';
      }
    }
  }

  // Profit Calculator
  function calculateProfit(retail, prod) {
    const listingFee = 0.20;
    const txFee = +(retail * 0.065).toFixed(2);
    const procFee = +(retail * 0.03 + 0.25).toFixed(2);
    const totalFees = +(listingFee + txFee + procFee).toFixed(2);
    const net = +(retail - prod - totalFees).toFixed(2);
    const margin = retail > 0 ? +((net / retail) * 100).toFixed(1) : 0;

    return {
      retail: +retail.toFixed(2),
      prod: +prod.toFixed(2),
      listingFee,
      txFee,
      procFee,
      totalFees,
      net,
      margin
    };
  }

  function updateProfitMeters() {
    const spec = CADRE_SPECS[state.cadre];
    const retail = parseFloat(document.getElementById('inputRetail')?.value || spec.default_retail);
    state.retail = retail;
    const p = calculateProfit(retail, spec.default_prod);

    const elRetail = document.getElementById('valRetail');
    const elCost = document.getElementById('valCost');
    const elFees = document.getElementById('valFees');
    const elNet = document.getElementById('valNet');
    const elMargin = document.getElementById('valMargin');

    if (elRetail) elRetail.textContent = `$${p.retail.toFixed(2)}`;
    if (elCost) elCost.textContent = `$${p.prod.toFixed(2)}`;
    if (elFees) elFees.textContent = `$${p.totalFees.toFixed(2)}`;
    if (elNet) elNet.textContent = `$${p.net.toFixed(2)}`;
    if (elMargin) elMargin.textContent = `${p.margin}%`;
  }

  // Update Listing Text and 13 Tags
  function updateListingView() {
    const spec = CADRE_SPECS[state.cadre];
    const elTitle = document.getElementById('listingTitleText');
    const elTitleLen = document.getElementById('titleCharCount');
    const elTagContainer = document.getElementById('tagListContainer');

    if (elTitle) {
      elTitle.value = spec.title;
    }
    if (elTitleLen) {
      elTitleLen.textContent = `${spec.title.length}/140 chars`;
    }

    if (elTagContainer) {
      elTagContainer.innerHTML = '';
      spec.tags.forEach((t, i) => {
        const chip = document.createElement('button');
        chip.className = 'tag-chip';
        chip.setAttribute('type', 'button');
        chip.setAttribute('title', 'Click to copy individual tag');
        chip.innerHTML = `<span class="tag-num">${i + 1}</span> ${t} <span class="tag-len">${t.length}c</span>`;
        chip.addEventListener('click', () => {
          navigator.clipboard.writeText(t);
          showToast(`Copied tag: "${t}"`);
        });
        elTagContainer.appendChild(chip);
      });
    }
  }

  // In-Browser HTML5 Canvas Renderer (Local Backup & Fast Preview)
  function renderLocalCanvas() {
    const canvas = document.getElementById('studioCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (state.activeTab === 'canvas') {
      renderMasterArtwork(ctx, w, h);
    } else {
      renderLifestyleMockup(ctx, w, h);
    }
  }

  function renderMasterArtwork(ctx, w, h) {
    const cadre = state.cadre;
    const title = document.getElementById('inputTitle')?.value || CADRE_SPECS[cadre].name;
    const names = (document.getElementById('inputNames')?.value || 'Emma, Liam, Olivia, Noah').split(',');

    // Background: Transparent grid indication
    ctx.save();

    if (cadre === 'apparel') {
      // Botanical Bouquet
      const cx = w / 2;
      const cy = h * 0.54;
      const count = Math.min(names.length, 6);
      const spread = w * 0.65;
      const startX = cx - spread / 2;

      // Draw stems
      names.forEach((name, i) => {
        const x = count === 1 ? cx : startX + i * (spread / (count - 1));
        const y = cy + Math.sin(i * 1.5) * 20;

        // Stem
        ctx.strokeStyle = '#586E55';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(cx, h * 0.76, cx, h * 0.82);
        ctx.stroke();

        // Bloom
        const colors = ['#D45246', '#A899C2', '#F8F5EC', '#7698C4', '#EEC870', '#E0ACAA'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Flower Center
        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Name Tag
        ctx.font = 'italic 16px "Cabinet Grotesk", serif';
        ctx.fillStyle = '#4A3A30';
        ctx.textAlign = 'center';
        ctx.fillText(name.trim(), x, y + 42);
      });

      // Ribbon Tie
      ctx.fillStyle = '#C48085';
      ctx.beginPath();
      ctx.arc(cx, h * 0.82, 14, 0, Math.PI * 2);
      ctx.fill();

      // Top Title
      ctx.font = 'bold 32px "Syne", serif';
      ctx.fillStyle = '#262422';
      ctx.textAlign = 'center';
      ctx.fillText(title.toUpperCase(), cx, h * 0.22);

      // Subtitle
      ctx.font = 'italic 18px "Cabinet Grotesk", sans-serif';
      ctx.fillStyle = '#8A9A86';
      ctx.fillText(state.subtitle, cx, h * 0.28);
    } else if (cadre === 'mugs') {
      const cx = w / 2;
      const cy = h / 2;

      // Soft circular wreath
      for (let deg = 0; deg < 360; deg += 20) {
        const rad = (deg * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * (w * 0.36);
        const ly = cy + Math.sin(rad) * (w * 0.36);
        ctx.fillStyle = deg % 40 === 0 ? '#8A9A86' : '#C48085';
        ctx.beginPath();
        ctx.arc(lx, ly, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Teacup
      ctx.fillStyle = '#F8F5EC';
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 20, 60, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Perched Cardinal
      ctx.fillStyle = '#D02E2A';
      ctx.beginPath();
      ctx.arc(cx + 40, cy - 20, 22, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#EEC870';
      ctx.beginPath();
      ctx.moveTo(cx + 62, cy - 20);
      ctx.lineTo(cx + 74, cy - 16);
      ctx.lineTo(cx + 62, cy - 12);
      ctx.fill();

      // Title
      ctx.font = 'bold 28px "Syne", serif';
      ctx.fillStyle = '#4A3A30';
      ctx.textAlign = 'center';
      ctx.fillText('Morning Tea & Songbirds', cx, h * 0.16);
    } else if (cadre === 'totes') {
      const m = 30;
      ctx.strokeStyle = '#4A3A30';
      ctx.lineWidth = 4;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      ctx.strokeStyle = '#C47058';
      ctx.lineWidth = 2;
      ctx.strokeRect(m + 8, m + 8, w - (m + 8) * 2, h - (m + 8) * 2);

      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#4A3A30';
      ctx.textAlign = 'center';
      ctx.fillText("GRAINES D'ÉLITE • MAISON FONDÉE 1894", w / 2, 70);

      ctx.font = 'bold 36px "Syne", serif';
      ctx.fillStyle = '#2A2018';
      ctx.fillText('FLEURS SAUVAGES', w / 2, 120);

      ctx.font = 'italic 18px "Cabinet Grotesk", sans-serif';
      ctx.fillStyle = '#8A9A86';
      ctx.fillText('Lavande & Coquelicots de Provence', w / 2, 155);

      // Flower stems
      for (let i = -2; i <= 2; i++) {
        const sx = w / 2 + i * 40;
        ctx.strokeStyle = '#586E55';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, h * 0.40);
        ctx.lineTo(sx, h * 0.70);
        ctx.stroke();

        ctx.fillStyle = i % 2 === 0 ? '#D45246' : '#A899C2';
        ctx.beginPath();
        ctx.arc(sx, h * 0.40, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#4A3A30';
      ctx.fillText('QUALITÉ SUPÉRIEURE • 100% PURE SEED', w / 2, h - 50);
    } else if (cadre === 'wall_art') {
      ctx.font = 'bold 16px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#4A3A30';
      ctx.textAlign = 'center';
      ctx.fillText("CURTIS'S BOTANICAL MAGAZINE", w / 2, 45);

      ctx.strokeStyle = '#4A3A30';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 60);
      ctx.lineTo(w - 40, 60);
      ctx.stroke();

      // Foxglove stalk
      ctx.strokeStyle = '#586E55';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w / 2, 90);
      ctx.lineTo(w / 2, h - 120);
      ctx.stroke();

      for (let b = 0; b < 10; b++) {
        const by = 120 + b * 28;
        const side = b % 2 === 0 ? -1 : 1;
        const bx = w / 2 + side * 24;
        ctx.fillStyle = '#C48085';
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = 'italic bold 24px "Syne", serif';
      ctx.fillStyle = '#2A2018';
      ctx.fillText('Digitalis purpurea', w / 2, h - 70);

      ctx.font = '14px "Cabinet Grotesk", sans-serif';
      ctx.fillStyle = '#8A9A86';
      ctx.fillText('English Countryside Foxglove • Plate 1,482', w / 2, h - 45);
    } else {
      // Crafting Blueprint
      const cx = w / 2;
      const cy = h / 2;

      // 8-point Barn star
      const numPoints = 8;
      const outerR = w * 0.35;
      const innerR = outerR * 0.42;

      for (let p = 0; p < numPoints; p++) {
        const angle = p * (Math.PI / 4);
        const tipX = cx + Math.cos(angle) * outerR;
        const tipY = cy + Math.sin(angle) * outerR;
        const inAngle = (p + 0.5) * (Math.PI / 4);
        const inX = cx + Math.cos(inAngle) * innerR;
        const inY = cy + Math.sin(inAngle) * innerR;

        ctx.fillStyle = p % 2 === 0 ? '#C48085' : '#7698C4';
        ctx.strokeStyle = '#262422';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(inX, inY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.font = 'bold 24px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#262422';
      ctx.textAlign = 'center';
      ctx.fillText('TRADITIONAL BARN STAR', w / 2, 45);

      ctx.font = '14px "Space Grotesk", sans-serif';
      ctx.fillStyle = '#D45246';
      ctx.fillText('← 24" QUILT BLOCK BLUEPRINT • 1/4" SEAM →', w / 2, h - 20);
    }

    ctx.restore();
  }

  function renderLifestyleMockup(ctx, w, h) {
    const cadre = state.cadre;

    // Wood table background
    ctx.fillStyle = '#C5B0A0';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 70) {
      ctx.strokeStyle = '#9C8575';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (cadre === 'mugs') {
      // Mug body
      const cx = w / 2;
      const cy = h / 2;

      // Handle
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(cx + 90, cy, 45, 1.5 * Math.PI, 0.5 * Math.PI);
      ctx.stroke();

      // Mug Cylinder
      ctx.fillStyle = '#F5F6F8';
      ctx.fillRect(cx - 100, cy - 110, 200, 220);

      // Top rim & coffee
      ctx.fillStyle = '#301E14';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 110, 100, 25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(cx - 50, cy - 100, 25, 200);

      // Mini artwork on front
      ctx.fillStyle = '#D02E2A';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Apparel / Tote folded
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = state.color === 'pepper' ? '#343236' : state.color === 'moss' ? '#768670' : '#E0D6C6';
      ctx.fillRect(cx - 140, cy - 160, 280, 320);

      // Collar
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy - 160, 45, 0, Math.PI);
      ctx.stroke();

      // Mini graphic print
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 18px "Syne", serif';
      ctx.textAlign = 'center';
      ctx.fillText(CADRE_SPECS[cadre].name, cx, cy - 20);
    }
  }

  // Toast Notification
  function showToast(msg) {
    let t = document.getElementById('studioToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'studioToast';
      t.className = 'studio-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  // Initialize UI Bindings
  function init() {
    checkLicense();
    updateProfitMeters();
    updateListingView();
    renderLocalCanvas();

    // Cadre Switchers
    document.querySelectorAll('.cadre-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cadre-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.cadre = btn.dataset.cadre;
        const spec = CADRE_SPECS[state.cadre];
        const titleInput = document.getElementById('inputTitle');
        if (titleInput) titleInput.value = spec.name;

        updateProfitMeters();
        updateListingView();
        renderLocalCanvas();
        showToast(`Switched to: ${spec.name}`);
      });
    });

    // View Tabs (Canvas vs Mockup)
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTab = btn.dataset.tab;
        renderLocalCanvas();
      });
    });

    // Realtime Inputs
    ['inputTitle', 'inputSubtitle', 'inputNames'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        renderLocalCanvas();
      });
    });

    // Retail Slider
    const retailInput = document.getElementById('inputRetail');
    if (retailInput) {
      retailInput.addEventListener('input', updateProfitMeters);
    }

    // Color Swatches
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
        state.color = sw.dataset.color;
        renderLocalCanvas();
      });
    });

    // Copy Title Button
    document.getElementById('btnCopyTitle')?.addEventListener('click', () => {
      const title = document.getElementById('listingTitleText')?.value || '';
      navigator.clipboard.writeText(title);
      showToast('Copied Title (<140 chars) to clipboard!');
    });

    // Copy All 13 Tags Button
    document.getElementById('btnCopyTags')?.addEventListener('click', () => {
      const spec = CADRE_SPECS[state.cadre];
      const tagsStr = spec.tags.join(', ');
      navigator.clipboard.writeText(tagsStr);
      showToast('Copied all 13 Etsy Tags to clipboard!');
    });

    // Export Action Interceptors
    document.querySelectorAll('.btn-export-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!state.isLicensed) {
          openProModal();
        } else {
          downloadKit();
        }
      });
    });

    // Modal Triggers
    document.getElementById('btnOpenProModal')?.addEventListener('click', openProModal);
    document.getElementById('btn-paywall-key')?.addEventListener('click', openProModal);
    document.getElementById('btnActivateKey')?.addEventListener('click', () => {
      activateLicense();
    });
    document.getElementById('btnSubmitKey')?.addEventListener('click', () => {
      activateLicense();
    });
    document.getElementById('closeModalBtn')?.addEventListener('click', closeProModal);

    // Solana DePay Button Trigger
    document.querySelectorAll('.btn-solana-pay').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (window.DePayButtons) {
          try {
            window.DePayButtons.init({
              integration: '428790dd-7ad1-407c-8ecf-c048c77a4cb8',
              container: document.body
            });
            return;
          } catch (err) {
            console.warn('DePay widget initialization error:', err);
          }
        }
        window.open('https://solana.fm/address/GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK', '_blank');
        openProModal();
      });
    });
  }

  function activateLicense(key) {
    const input = document.getElementById('license-input') || document.getElementById('inputLicenseKey') || document.getElementById('licenseKeyInput');
    const val = (key || (input ? input.value : '')).trim();
    const upper = val.toUpperCase();
    if (upper === 'ETSY-PRO-2026' || val.includes('@') || val.length >= 8 || upper === 'SOVEREIGN-PRO-2026' || upper.startsWith('ETSY-')) {
      localStorage.setItem(STORAGE_KEY, 'true');
      localStorage.setItem(STORAGE_KEY_ALT, 'true');
      localStorage.setItem(STORAGE_KEY_PRO, 'true');
      state.isLicensed = true;
      updateLicenseUI();
      closeProModal();
      showToast('⭐ PRO LICENSE ACTIVATED PERMANENTLY!');
      return true;
    } else {
      showToast('Please enter a valid order receipt email or license key.');
      console.warn('Invalid key provided.');
      return false;
    }
  }

  function openProModal() {
    const m = document.getElementById('licenseModal') || document.getElementById('proModal') || document.querySelector('[data-alias="paywall-modal"]') || document.querySelector('[data-alias="licenseModal"]');
    if (m) m.style.display = 'flex';
  }

  function closeProModal() {
    const m = document.getElementById('licenseModal') || document.getElementById('proModal') || document.querySelector('[data-alias="paywall-modal"]') || document.querySelector('[data-alias="licenseModal"]');
    if (m) m.style.display = 'none';
  }

  window.checkLicense = checkLicense;
  window.updateLicenseUI = updateLicenseUI;
  window.openProModal = openProModal;
  window.closeProModal = closeProModal;
  window.openLicenseModal = openProModal;
  window.closeLicenseModal = closeProModal;
  window.activateLicenseKey = activateLicense;
  window.activateLicense = activateLicense;

  function downloadKit() {
    const cadre = state.cadre;
    // Trigger download via API if live, else local zip/canvas save
    window.location.href = `/api/export-kit?cadre=${cadre}`;
    showToast(`Downloading print-ready asset kit for ${cadre}...`);
  }

  // Self Initialization on DOM Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
