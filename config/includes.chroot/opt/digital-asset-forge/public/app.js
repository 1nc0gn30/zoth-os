/**
 * Digital Asset Forge v2.6.0 — Standalone Interactive Workstation Client
 * Wires live :8118/api/* endpoints with full client-side parity fallback,
 * FileReader artwork upload, 5-ratio Canvas synthesizer & PNG export,
 * real ZIP bundle download, buyer printing guide, Etsy 13-tag SEO, and DPI audit.
 * Zero innerHTML sinks. Zero external network egress.
 */
(function () {
  "use strict";

  const Engine = window.DigitalAssetForgeEngine;
  if (!Engine) return;

  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get("embed") === "1";
  if (isEmbed) {
    document.body.classList.add("is-embedded");
  }

  // State
  let activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
  let activeTab = "manifest";
  let activeRatioKey = "2x3";
  let activePreset = "terracotta";
  let activeFitMode = "crop";
  let uploadedImage = null;
  let uploadedMeta = null;
  let daemonOnline = false;

  let currentManifest = null;
  let currentGuide = null;
  let currentListing = null;
  let currentDpiReport = null;

  // DOM References
  const themeToggleBtn = document.getElementById("btn-theme-toggle");
  const daemonBadge = document.getElementById("daemonBadge");
  const titleInput = document.getElementById("artwork-title-input");
  const artistInput = document.getElementById("artist-name-input");
  const nicheSelect = document.getElementById("niche-select");
  const priceInput = document.getElementById("price-input");
  const fileInput = document.getElementById("artwork-file-input");
  const clearUploadBtn = document.getElementById("btn-clear-upload");
  const uploadMetaNote = document.getElementById("upload-meta-note");
  const previewCanvas = document.getElementById("artwork-preview-canvas");
  const downloadPngBtn = document.getElementById("btn-download-png");

  const manifestTableBody = document.getElementById("manifest-table-body");
  const totalFilesEl = document.getElementById("stat-total-files");
  const totalSizeEl = document.getElementById("stat-total-size");
  const zipCountEl = document.getElementById("stat-zip-count");
  const netMarginEl = document.getElementById("stat-net-margin");

  const codePreview = document.getElementById("code-preview");
  const guidePreview = document.getElementById("guide-preview");
  const etsyTitleLen = document.getElementById("etsy-title-len");
  const etsyTitlePreview = document.getElementById("etsy-title-preview");
  const etsyTagsContainer = document.getElementById("etsy-tags-container");
  const etsyDescPreview = document.getElementById("etsy-desc-preview");

  const dpiSrcW = document.getElementById("dpi-src-w");
  const dpiSrcH = document.getElementById("dpi-src-h");
  const dpiTargetW = document.getElementById("dpi-target-w");
  const dpiTargetH = document.getElementById("dpi-target-h");
  const dpiAuditResult = document.getElementById("dpi-audit-result");
  const dpiRatingTitle = document.getElementById("dpi-rating-title");
  const dpiRatingDesc = document.getElementById("dpi-rating-desc");
  const dpiRatingBadge = document.getElementById("dpi-rating-badge");

  // Toast helper (DOM-safe)
  function showToast(msg) {
    let toast = document.getElementById("forgeToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "forgeToast";
      toast.setAttribute("role", "status");
      toast.style.cssText =
        "position:fixed; bottom:20px; right:20px; z-index:10000; background:var(--bg-surface); border:1px solid var(--accent-gold); color:var(--text-main); padding:10px 16px; border-radius:8px; font-family:var(--font-mono); font-size:0.82rem; box-shadow:0 8px 24px rgba(0,0,0,0.4); opacity:0; transition:opacity 180ms ease; pointer-events:none;";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = "0";
    }, 2400);
  }

  // Dual-theme controller
  function applyTheme(nextTheme, persist) {
    activeTheme = nextTheme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", activeTheme);
    if (persist) {
      try {
        localStorage.setItem("daf_theme", activeTheme);
      } catch (e) {}
    }
    if (themeToggleBtn) {
      themeToggleBtn.textContent = activeTheme === "dark" ? "Light Mode" : "Dark Mode";
    }
    window.dispatchEvent(new CustomEvent("daf-theme-change", { detail: { theme: activeTheme } }));
    renderArtworkPreview();
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function () {
      applyTheme(activeTheme === "dark" ? "light" : "dark", true);
    });
  }

  window.addEventListener("message", function (ev) {
    if (!ev || !ev.data || typeof ev.data !== "object") return;
    const t = ev.data.theme || (ev.data.type === "zoth-theme" ? ev.data.mode : null);
    if (t === "light" || t === "dark") {
      applyTheme(t, false);
    }
  });

  // Procedural Fine-Art Presets on Canvas
  function drawFineArtPreset(ctx, x, y, w, h, preset) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    if (preset === "terracotta") {
      const bg = ctx.createLinearGradient(x, y, x, y + h);
      bg.addColorStop(0, "#F6F0E6");
      bg.addColorStop(1, "#EADFD0");
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = "#D9A441";
      ctx.beginPath();
      ctx.arc(x + w * 0.66, y + h * 0.24, Math.min(w, h) * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#C55A38";
      const r1 = w * 0.31;
      ctx.beginPath();
      ctx.arc(x + w * 0.46, y + h * 0.54, r1, Math.PI, 0, false);
      ctx.lineTo(x + w * 0.46 + r1, y + h * 0.87);
      ctx.lineTo(x + w * 0.46 - r1, y + h * 0.87);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1B1D22";
      const r2 = w * 0.135;
      ctx.beginPath();
      ctx.arc(x + w * 0.54, y + h * 0.63, r2, Math.PI, 0, false);
      ctx.lineTo(x + w * 0.54 + r2, y + h * 0.87);
      ctx.lineTo(x + w * 0.54 - r2, y + h * 0.87);
      ctx.closePath();
      ctx.fill();
    } else if (preset === "horizon") {
      const bg = ctx.createLinearGradient(x, y, x, y + h);
      bg.addColorStop(0, "#F3F0E8");
      bg.addColorStop(1, "#DCD5C6");
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = "#B89456";
      ctx.beginPath();
      ctx.arc(x + w * 0.32, y + h * 0.26, Math.min(w, h) * 0.11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(42, 47, 56, 0.36)";
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.6);
      ctx.bezierCurveTo(x + w * 0.25, y + h * 0.45, x + w * 0.6, y + h * 0.52, x + w, y + h * 0.44);
      ctx.lineTo(x + w, y + h * 0.72);
      ctx.lineTo(x, y + h * 0.72);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#1E2228";
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.68);
      ctx.bezierCurveTo(x + w * 0.28, y + h * 0.56, x + w * 0.64, y + h * 0.65, x + w, y + h * 0.55);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
    } else {
      const bg = ctx.createLinearGradient(x, y, x + w, y + h);
      bg.addColorStop(0, "#0E121B");
      bg.addColorStop(1, "#19222C");
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);

      const cx = x + w * 0.5;
      const cy = y + h * 0.5;
      const rad = Math.min(w, h) * 0.33;
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = Math.max(1.5, w * 0.005);
      ctx.strokeRect(x + w * 0.08, y + h * 0.07, w * 0.84, h * 0.86);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#F2DF9B";
      ctx.beginPath();
      ctx.moveTo(cx, y + h * 0.82);
      ctx.lineTo(cx, y + h * 0.2);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        const ly = y + h * (0.34 + i * 0.12);
        const lw = rad * (0.32 + i * 0.05);
        ctx.fillStyle = i % 2 === 0 ? "#2E4F46" : "#D4AF37";
        ctx.beginPath();
        ctx.ellipse(cx - lw * 0.55, ly, lw * 0.48, rad * 0.11, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + lw * 0.55, ly, lw * 0.48, rad * 0.11, 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function renderFramedArtwork(ctx, targetW, targetH) {
    ctx.fillStyle = "#FAF7F0";
    ctx.fillRect(0, 0, targetW, targetH);

    const matPx = activeFitMode === "mat" ? Math.round(Math.min(targetW, targetH) * 0.09) : 0;
    const bx = matPx;
    const by = matPx;
    const bw = Math.max(16, targetW - matPx * 2);
    const bh = Math.max(16, targetH - matPx * 2);

    if (uploadedImage && uploadedImage.naturalWidth > 0 && uploadedImage.naturalHeight > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.clip();
      const imgAspect = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
      const boxAspect = bw / bh;
      let dw = bw;
      let dh = bh;
      let dx = bx;
      let dy = by;

      if (activeFitMode === "crop") {
        if (imgAspect > boxAspect) {
          dh = bh;
          dw = bh * imgAspect;
          dx = bx - (dw - bw) * 0.5;
        } else {
          dw = bw;
          dh = bw / imgAspect;
          dy = by - (dh - bh) * 0.5;
        }
      } else {
        if (imgAspect > boxAspect) {
          dw = bw;
          dh = bw / imgAspect;
          dy = by + (bh - dh) * 0.5;
        } else {
          dh = bh;
          dw = bh * imgAspect;
          dx = bx + (bw - dw) * 0.5;
        }
      }
      ctx.drawImage(uploadedImage, dx, dy, dw, dh);
      ctx.restore();
    } else {
      drawFineArtPreset(ctx, bx, by, bw, bh, activePreset);
    }

    if (activeFitMode === "mat" && matPx > 2) {
      ctx.strokeStyle = "rgba(15, 23, 42, 0.16)";
      ctx.lineWidth = Math.max(1, targetW * 0.002);
      ctx.strokeRect(bx, by, bw, bh);
    }
  }

  function renderArtworkPreview() {
    if (!previewCanvas) return;
    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    const spec = Engine.RATIO_FAMILIES[activeRatioKey] || Engine.RATIO_FAMILIES["2x3"];
    const rect = previewCanvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(260, Math.round(rect.width));
    const cssH = Math.max(240, Math.round(rect.height || 310));
    previewCanvas.width = Math.round(cssW * dpr);
    previewCanvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const light = activeTheme === "light";
    ctx.fillStyle = light ? "#EDE7DB" : "#0A0E17";
    ctx.fillRect(0, 0, cssW, cssH);

    const padTop = 34;
    const padBot = 18;
    const availH = cssH - padTop - padBot;
    const availW = cssW - 40;
    let fh = availH;
    let fw = fh * spec.ratioDecimal;
    if (fw > availW) {
      fw = availW;
      fh = fw / spec.ratioDecimal;
    }
    const fx = (cssW - fw) * 0.5;
    const fy = padTop + (availH - fh) * 0.5;

    ctx.save();
    ctx.shadowColor = light ? "rgba(15,23,42,0.22)" : "rgba(0,0,0,0.65)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#FAF7F0";
    ctx.fillRect(fx, fy, fw, fh);
    ctx.restore();

    ctx.save();
    ctx.translate(fx, fy);
    renderFramedArtwork(ctx, fw, fh);
    ctx.restore();

    ctx.strokeStyle = light ? "rgba(15,23,42,0.28)" : "rgba(245,208,97,0.5)";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(fx, fy, fw, fh);

    ctx.fillStyle = light ? "#0F172A" : "#F8FAFC";
    ctx.font = '700 11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = "left";
    ctx.fillText(
      `${spec.label} · ${spec.pixelWidth}x${spec.pixelHeight} px @ 300 DPI · ${activeFitMode === "crop" ? "CROP-TO-FILL" : "MAT BORDER"}`,
      14,
      21
    );
  }

  function exportHighResPng() {
    const spec = Engine.RATIO_FAMILIES[activeRatioKey] || Engine.RATIO_FAMILIES["2x3"];
    const maxEdge = 3600;
    const scale = Math.min(1, maxEdge / Math.max(spec.pixelWidth, spec.pixelHeight));
    const outW = Math.round(spec.pixelWidth * scale);
    const outH = Math.round(spec.pixelHeight * scale);
    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    renderFramedArtwork(ctx, outW, outH);

    const slug = Engine.sanitizeFilenameSlug(titleInput ? titleInput.value : "wall-art");
    const filename = `${slug}-${spec.id}-${outW}x${outH}px-300dpi.png`;
    if (c.toBlob) {
      c.toBlob(function (blob) {
        if (!blob) return;
        triggerBlobDownload(blob, filename);
        showToast("Exported " + spec.shortCode + " PNG (" + outW + "x" + outH + " px)");
      }, "image/png");
    } else {
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = filename;
      a.click();
      showToast("Exported " + spec.shortCode + " PNG");
    }
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  // DOM-safe table population
  function renderManifestTable(manifest) {
    if (!manifestTableBody) return;
    while (manifestTableBody.firstChild) {
      manifestTableBody.removeChild(manifestTableBody.firstChild);
    }

    manifest.files.forEach(function (f) {
      const tr = document.createElement("tr");

      const tdRatio = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "ratio-badge";
      badge.textContent = String(f.ratio || "").toUpperCase();
      tdRatio.appendChild(badge);

      const tdName = document.createElement("td");
      tdName.className = "filename-cell";
      tdName.textContent = f.filename;

      const tdPrint = document.createElement("td");
      const strong = document.createElement("strong");
      strong.textContent = f.max_print_size;
      tdPrint.appendChild(strong);

      const tdRes = document.createElement("td");
      tdRes.textContent = f.resolution;

      const tdSize = document.createElement("td");
      tdSize.textContent = Number(f.estimated_mb).toFixed(1) + " MB";

      tr.appendChild(tdRatio);
      tr.appendChild(tdName);
      tr.appendChild(tdPrint);
      tr.appendChild(tdRes);
      tr.appendChild(tdSize);
      manifestTableBody.appendChild(tr);
    });

    // Printing guide row
    const guide = manifest.printing_guide;
    if (guide) {
      const tr = document.createElement("tr");
      const tdRatio = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "ratio-badge is-guide";
      badge.textContent = "GUIDE";
      tdRatio.appendChild(badge);

      const tdName = document.createElement("td");
      tdName.className = "filename-cell";
      tdName.textContent = guide.filename;

      const tdPrint = document.createElement("td");
      tdPrint.textContent = "Buyer Manual";

      const tdRes = document.createElement("td");
      tdRes.textContent = "Vector / MD";

      const tdSize = document.createElement("td");
      tdSize.textContent = Number(guide.estimated_mb).toFixed(1) + " MB";

      tr.appendChild(tdRatio);
      tr.appendChild(tdName);
      tr.appendChild(tdPrint);
      tr.appendChild(tdRes);
      tr.appendChild(tdSize);
      manifestTableBody.appendChild(tr);
    }
  }

  function renderEtsyPanel(listing) {
    if (!listing) return;
    if (etsyTitleLen) etsyTitleLen.textContent = String(listing.title_character_count || listing.title.length);
    if (etsyTitlePreview) etsyTitlePreview.textContent = listing.title;
    if (etsyDescPreview) etsyDescPreview.textContent = listing.description;

    if (etsyTagsContainer) {
      while (etsyTagsContainer.firstChild) {
        etsyTagsContainer.removeChild(etsyTagsContainer.firstChild);
      }
      (listing.tags || []).forEach(function (tag) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "etsy-tag-pill";

        const label = document.createElement("span");
        label.textContent = tag;
        const lenSpan = document.createElement("span");
        lenSpan.className = "etsy-tag-len";
        lenSpan.textContent = "(" + tag.length + "/20)";

        btn.appendChild(label);
        btn.appendChild(lenSpan);
        btn.addEventListener("click", function () {
          copyText(tag, 'Copied tag "' + tag + '"');
        });
        etsyTagsContainer.appendChild(btn);
      });
    }
  }

  function renderDpiResult(report) {
    if (!report) return;
    currentDpiReport = report;
    if (dpiAuditResult) {
      dpiAuditResult.className = "dpi-result-box status-" + (report.status || "pass");
    }
    if (dpiRatingTitle) {
      dpiRatingTitle.textContent = report.rating + " · " + report.effective_dpi + " DPI";
    }
    if (dpiRatingDesc) {
      dpiRatingDesc.textContent =
        report.label + " — " + report.pixel_dimensions + " at " + report.physical_dimensions;
    }
    if (dpiRatingBadge) {
      dpiRatingBadge.textContent = String(report.status || "pass").toUpperCase();
    }
  }

  function renderAllOutputs() {
    if (!currentManifest || !currentListing || !currentGuide) return;

    renderManifestTable(currentManifest);

    if (totalFilesEl) totalFilesEl.textContent = currentManifest.total_files + " Files";
    if (totalSizeEl) totalSizeEl.textContent = Number(currentManifest.total_estimated_size_mb).toFixed(1) + " MB";

    const plan = currentManifest.etsy_delivery_plan;
    if (zipCountEl && plan) {
      zipCountEl.textContent =
        plan.total_zip_archives + " ZIPs · " + (plan.etsy_direct_upload_viable ? "PASS" : "SPLIT");
    }

    const eco = currentListing.economics;
    if (netMarginEl && eco) {
      netMarginEl.textContent =
        "$" + Number(eco.net_profit_per_sale_usd).toFixed(2) + " (" + Number(eco.profit_margin_percentage).toFixed(1) + "%)";
    }

    if (codePreview) {
      codePreview.textContent = JSON.stringify(
        {
          manifest: currentManifest,
          etsy_seo: currentListing
        },
        null,
        2
      );
    }

    if (guidePreview) {
      guidePreview.textContent = currentGuide.content;
    }

    renderEtsyPanel(currentListing);
  }

  async function postJson(path, body) {
    const resp = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return resp.json();
  }

  function getFormValues() {
    const title = (titleInput && titleInput.value.trim()) || "Celestial Obsidian Horizon";
    const artist = (artistInput && artistInput.value.trim()) || "1nc0gn30";
    const niche = (nicheSelect && nicheSelect.value) || "abstract";
    const rawPrice = priceInput ? parseFloat(priceInput.value) : 6.99;
    const price = Number.isFinite(rawPrice) && rawPrice >= 0.5 ? rawPrice : 6.99;
    return { title, artist, niche, price };
  }

  let syncTimer = null;
  function scheduleSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncWithBackendOrLocal, 140);
  }

  async function syncWithBackendOrLocal() {
    const vals = getFormValues();

    // Instant deterministic render first so UI never lags
    currentManifest = Engine.generateManifest(vals.title, vals.artist);
    currentGuide = Engine.generatePrintingGuide(vals.title, vals.artist);
    currentListing = Engine.generateEtsyListing(vals.title, vals.niche, vals.price);
    renderAllOutputs();

    if (!daemonOnline) return;
    try {
      const [packRes, guideRes, etsyRes] = await Promise.all([
        postJson("/api/generate_pack", { artwork_title: vals.title, artist_name: vals.artist }),
        postJson("/api/printing_guide", { artwork_title: vals.title, shop_name: vals.artist }),
        postJson("/api/etsy_copy", { artwork_title: vals.title, niche: vals.niche, retail_price_usd: vals.price })
      ]);
      if (packRes && packRes.manifest) currentManifest = packRes.manifest;
      if (guideRes && guideRes.printing_guide) currentGuide = guideRes.printing_guide;
      if (etsyRes && etsyRes.listing) currentListing = etsyRes.listing;
      renderAllOutputs();
    } catch (e) {
      // Retain deterministic local output silently
    }
  }

  async function runDpiAudit() {
    const pw = parseInt(dpiSrcW && dpiSrcW.value, 10) || 7200;
    const ph = parseInt(dpiSrcH && dpiSrcH.value, 10) || 10800;
    const tw = parseFloat(dpiTargetW && dpiTargetW.value) || 24;
    const th = parseFloat(dpiTargetH && dpiTargetH.value) || 36;

    renderDpiResult(Engine.validateDpiQuality(pw, ph, tw, th));

    if (!daemonOnline) return;
    try {
      const res = await postJson("/api/validate_dpi", {
        pixel_width: pw,
        pixel_height: ph,
        target_width_inches: tw,
        target_height_inches: th
      });
      if (res && res.dpi_report) {
        renderDpiResult(res.dpi_report);
      }
    } catch (e) {}
  }

  async function downloadZipBundle() {
    const vals = getFormValues();
    const slug = Engine.sanitizeFilenameSlug(vals.title);
    const fallbackName = slug + "-digital-asset-forge-pack.zip";

    if (daemonOnline) {
      try {
        const resp = await fetch("/api/export_bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artwork_title: vals.title,
            artist_name: vals.artist,
            shop_name: vals.artist,
            niche: vals.niche,
            retail_price_usd: vals.price
          })
        });
        if (resp.ok) {
          const blob = await resp.blob();
          const disp = resp.headers.get("Content-Disposition") || "";
          const match = disp.match(/filename="([^"]+)"/);
          triggerBlobDownload(blob, match ? match[1] : fallbackName);
          showToast("Downloaded ZIP bundle from :8118 API");
          return;
        }
      } catch (e) {}
    }

    // Pure-JS stored PKZIP fallback
    const zipBytes = Engine.buildStoredZipBytes([
      { name: "manifest.json", data: JSON.stringify(currentManifest, null, 2) },
      { name: "PRINTING_GUIDE.md", data: currentGuide.content },
      { name: "etsy_listing.json", data: JSON.stringify(currentListing, null, 2) }
    ]);
    triggerBlobDownload(new Blob([zipBytes], { type: "application/zip" }), fallbackName);
    showToast("Downloaded client-side ZIP bundle");
  }

  function copyText(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(successMsg);
      }).catch(function () {
        showToast(successMsg);
      });
    } else {
      showToast(successMsg);
    }
  }

  async function probeDaemonHealth() {
    try {
      const [hResp, rResp] = await Promise.all([
        fetch("/health", { cache: "no-store" }),
        fetch("/api/ratios", { cache: "no-store" })
      ]);
      if (hResp.ok && rResp.ok) {
        const health = await hResp.json();
        daemonOnline = health && health.status === "healthy";
        if (daemonBadge) {
          daemonBadge.textContent = "DAEMON :8118 v" + (health.version || Engine.VERSION);
        }
        await syncWithBackendOrLocal();
        await runDpiAudit();
        return;
      }
    } catch (e) {}
    daemonOnline = false;
    if (daemonBadge) {
      daemonBadge.textContent = "CLIENT ENGINE v" + Engine.VERSION;
    }
  }

  // Event Wiring
  if (titleInput) titleInput.addEventListener("input", scheduleSync);
  if (artistInput) artistInput.addEventListener("input", scheduleSync);
  if (nicheSelect) nicheSelect.addEventListener("change", scheduleSync);
  if (priceInput) priceInput.addEventListener("input", scheduleSync);

  if (fileInput) {
    fileInput.addEventListener("change", function (ev) {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          uploadedImage = img;
          uploadedMeta = { name: file.name, w: img.naturalWidth, h: img.naturalHeight };
          if (uploadMetaNote) {
            uploadMetaNote.textContent =
              "Loaded locally: " + file.name + " (" + img.naturalWidth + "x" + img.naturalHeight + " px)";
          }
          if (dpiSrcW) dpiSrcW.value = String(img.naturalWidth);
          if (dpiSrcH) dpiSrcH.value = String(img.naturalHeight);
          renderArtworkPreview();
          runDpiAudit();
          showToast("Loaded local artwork: " + file.name);
        };
        img.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  if (clearUploadBtn) {
    clearUploadBtn.addEventListener("click", function () {
      uploadedImage = null;
      uploadedMeta = null;
      if (fileInput) fileInput.value = "";
      if (uploadMetaNote) uploadMetaNote.textContent = "Active source: Procedural Fine-Art Preset (" + activePreset + ")";
      renderArtworkPreview();
    });
  }

  document.querySelectorAll("#preset-buttons .btn-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activePreset = btn.getAttribute("data-preset") || "terracotta";
      uploadedImage = null;
      uploadedMeta = null;
      document.querySelectorAll("#preset-buttons .btn-chip").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      if (uploadMetaNote) uploadMetaNote.textContent = "Active source: Procedural Fine-Art Preset (" + btn.textContent + ")";
      renderArtworkPreview();
    });
  });

  document.querySelectorAll("#fit-mode-buttons .btn-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeFitMode = btn.getAttribute("data-fit") || "crop";
      document.querySelectorAll("#fit-mode-buttons .btn-chip").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderArtworkPreview();
    });
  });

  document.querySelectorAll("#ratio-selector-buttons .btn-chip").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeRatioKey = btn.getAttribute("data-ratio") || "2x3";
      document.querySelectorAll("#ratio-selector-buttons .btn-chip").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      const spec = Engine.RATIO_FAMILIES[activeRatioKey];
      if (downloadPngBtn && spec) {
        downloadPngBtn.textContent = "Download " + spec.shortCode + " PNG";
      }
      renderArtworkPreview();
    });
  });

  document.querySelectorAll(".tabs-bar .tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      activeTab = btn.getAttribute("data-tab") || "manifest";
      document.querySelectorAll(".tabs-bar .tab-btn").forEach(function (b) {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.id === "tab-" + activeTab);
      });
    });
  });

  if (downloadPngBtn) downloadPngBtn.addEventListener("click", exportHighResPng);

  const copyActiveBtn = document.getElementById("btn-copy-active");
  if (copyActiveBtn) {
    copyActiveBtn.addEventListener("click", function () {
      if (activeTab === "guide" && guidePreview) {
        copyText(guidePreview.textContent, "Copied PRINTING_GUIDE.md");
      } else if (activeTab === "etsy" && currentListing) {
        copyText(JSON.stringify(currentListing, null, 2), "Copied Etsy 13-Tag SEO JSON");
      } else if (activeTab === "dpi" && currentDpiReport) {
        copyText(JSON.stringify(currentDpiReport, null, 2), "Copied 300 DPI Audit Report");
      } else if (codePreview) {
        copyText(codePreview.textContent, "Copied Pack Manifest JSON");
      }
    });
  }

  const dlManifestBtn = document.getElementById("btn-download-manifest");
  if (dlManifestBtn) {
    dlManifestBtn.addEventListener("click", function () {
      if (!codePreview) return;
      const slug = Engine.sanitizeFilenameSlug(getFormValues().title);
      triggerBlobDownload(new Blob([codePreview.textContent], { type: "application/json" }), slug + "-manifest.json");
      showToast("Downloaded manifest JSON");
    });
  }

  const dlGuideBtn = document.getElementById("btn-download-guide");
  if (dlGuideBtn) {
    dlGuideBtn.addEventListener("click", function () {
      if (!currentGuide) return;
      triggerBlobDownload(new Blob([currentGuide.content], { type: "text/markdown;charset=utf-8" }), "PRINTING_GUIDE.md");
      showToast("Downloaded PRINTING_GUIDE.md");
    });
  }

  const dlZipBtn = document.getElementById("btn-download-zip");
  const dlZipTopBtn = document.getElementById("btn-export-zip-top");
  if (dlZipBtn) dlZipBtn.addEventListener("click", downloadZipBundle);
  if (dlZipTopBtn) dlZipTopBtn.addEventListener("click", downloadZipBundle);

  const runDpiBtn = document.getElementById("btn-run-dpi");
  if (runDpiBtn) runDpiBtn.addEventListener("click", runDpiAudit);

  // Accurate 300 DPI Wall-Art Pack Quickstart Modal
  const tutorialHandle = window.createSovereignTutorial
    ? window.createSovereignTutorial({
        toolId: "digital-asset-forge",
        toolName: "Digital Asset Forge",
        tagline: "300 DPI 5-ratio wall art packs, <=20 MB Etsy ZIP bundles, and 13-tag SEO.",
        steps: [
          {
            title: "Upload Artwork or Pick a Fine-Art Preset",
            desc: "Load any local PNG/JPG/WebP file via FileReader (zero cloud uploads) or test one of the 3 procedural fine-art starters."
          },
          {
            title: "Frame 5 Standard Print Ratios & Audit 300 DPI",
            desc: "Switch between 2:3, 3:4, 4:5, 11:14, and ISO A-Series, toggle Crop-to-Fill vs Mat Border, export high-res PNGs, and verify source DPI."
          },
          {
            title: "Download <=20 MB ZIP Bundle, Printing Guide & Etsy SEO",
            desc: "Export a ready-to-deliver .zip bundle containing manifest.json, PRINTING_GUIDE.md, and etsy_listing.json with 13 tags (<=20 chars each)."
          }
        ]
      })
    : null;

  const quickstartBtn = document.getElementById("btn-quickstart");
  if (quickstartBtn && tutorialHandle) {
    quickstartBtn.addEventListener("click", tutorialHandle.open);
  }

  window.addEventListener("resize", renderArtworkPreview);

  applyTheme(activeTheme, false);
  syncWithBackendOrLocal();
  runDpiAudit();
  renderArtworkPreview();
  probeDaemonHealth();
})();
