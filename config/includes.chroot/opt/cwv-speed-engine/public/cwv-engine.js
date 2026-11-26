/**
 * CWV Speed Engine v2.6.0 — Pure Client-Side Core Web Vitals Analysis,
 * HTML AST Transformer, Diff Comparator, Speculation Rules, Budget & LoAF Simulator,
 * Strategy-Accurate PWA Builder, and Uncompressed ZIP Archive Compiler.
 *
 * Works identically in browser (window.CWVSpeedEngine) and Node.js (module.exports).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CWVSpeedEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = '2.6.0';

  const REAL_MCP_TOOLS = [
    { name: 'cwv_audit_site', signature: 'cwv_audit_site(target, device, min_score)', desc: 'Audit a validated public URL or HTML document for LCP, CLS, INP, FCP, TTFB, and TBT.' },
    { name: 'cwv_optimize_html', signature: 'cwv_optimize_html(html, preconnect_fonts, lazy_load_images, defer_scripts)', desc: 'Transform HTML with explicit CLS dimensions, hero fetchpriority, lazy loading, and <head> script deferral.' },
    { name: 'cwv_generate_cache_config', signature: 'cwv_generate_cache_config(framework, static_asset_ttl_days)', desc: 'Export immutable edge Cache-Control and security headers for Netlify, Vercel, Nginx, Next.js, Cloudflare, or Apache.' },
    { name: 'cwv_generate_pwa', signature: 'cwv_generate_pwa(name, short_name, theme_color, strategy)', desc: 'Compile W3C site.webmanifest, strategy-specific Service Worker sw.js, and offline fallback.' },
    { name: 'cwv_generate_og_card', signature: 'cwv_generate_og_card(title, description, url, image)', desc: 'Generate HTML-escaped OpenGraph, Twitter Card, and Schema.org JSON-LD metadata.' },
    { name: 'cwv_diff_performance', signature: 'cwv_diff_performance(target_a, target_b)', desc: 'Compute exact baseline vs. candidate CWV score and metric deltas with resolved issue tracking.' },
    { name: 'cwv_generate_speculation_rules', signature: 'cwv_generate_speculation_rules(html_or_urls, base_url, aggressiveness)', desc: 'Synthesize W3C <script type="speculationrules"> and 103 Early Hints while excluding side-effect routes.' },
    { name: 'cwv_audit_performance_budget', signature: 'cwv_audit_performance_budget(html_or_path, custom_budgets)', desc: 'Audit JS/CSS/image/font byte budgets across 3G/4G/5G profiles and emit Lighthouse budget.json.' },
  ];

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeImageUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return '/assets/banner.png';
    if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
    if (/^data:image\/(png|jpeg|webp|svg\+xml|gif);base64,[a-zA-Z0-9+/=]+$/i.test(raw)) return raw;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch (_) {
      // reject invalid URL
    }
    return '/assets/banner.png';
  }

  function sanitizeHexColor(value, fallback) {
    const v = String(value || '').trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fallback;
  }

  function rateMetric(metric, value) {
    const v = Number(value);
    if (metric === 'lcp') return v <= 2.5 ? 'GOOD' : v <= 4.0 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    if (metric === 'cls') return v <= 0.1 ? 'GOOD' : v <= 0.25 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    if (metric === 'inp') return v <= 200 ? 'GOOD' : v <= 500 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    if (metric === 'fcp') return v <= 1.8 ? 'GOOD' : v <= 3.0 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    if (metric === 'ttfb') return v <= 800 ? 'GOOD' : v <= 1800 ? 'NEEDS_IMPROVEMENT' : 'POOR';
    return 'GOOD';
  }

  function extractHead(html) {
    const m = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html || '');
    return m ? m[1] : '';
  }

  function auditHtml(html, device) {
    const dev = String(device || 'mobile').toLowerCase() === 'desktop' ? 'desktop' : 'mobile';
    const raw = String(html || '');
    if (!raw.trim()) {
      return {
        score: 0,
        rating: 'POOR',
        device: dev,
        metrics: {
          lcp: { value: 5.0, unit: 's', rating: 'POOR', target: '< 2.5s' },
          cls: { value: 0.35, unit: '', rating: 'POOR', target: '< 0.10' },
          inp: { value: 450, unit: 'ms', rating: 'POOR', target: '< 200ms' },
          fcp: { value: 3.2, unit: 's', rating: 'POOR', target: '< 1.8s' },
          ttfb: { value: 1200, unit: 'ms', rating: 'POOR', target: '< 800ms' },
        },
        diagnostics: [
          {
            rule_id: 'EMPTY-DOC',
            severity: 'CRITICAL',
            passed: false,
            title: 'Empty HTML input',
            description: 'Provide HTML markup or a public URL to run Core Web Vitals diagnostics.',
            impact: 'No DOM parsed',
            recommendation: 'Paste an HTML document or load the sample markup.',
          },
        ],
      };
    }

    const head = extractHead(raw);
    const imgMatches = [...raw.matchAll(/<img\b([^>]*)>/gi)];
    const headScripts = [...head.matchAll(/<script\b([^>]*)>/gi)];
    const allStylesheets = [...raw.matchAll(/<link\b([^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*)>/gi)];
    const preconnects = [...raw.matchAll(/<link\b([^>]*rel=["'][^"']*preconnect[^"']*["'][^>]*)>/gi)];

    const unsizedImgs = imgMatches.filter((m) => !/\bwidth\s*=/i.test(m[1]) || !/\bheight\s*=/i.test(m[1]));
    const unlazyImgs = imgMatches.slice(1).filter((m) => !/\bloading\s*=\s*["']?lazy/i.test(m[1]));
    const heroMissingPriority = imgMatches.length > 0 && !/\bfetchpriority\s*=\s*["']?high/i.test(imgMatches[0][1]);
    const blockingScripts = headScripts.filter(
      (m) => /\bsrc\s*=/i.test(m[1]) && !/\b(defer|async)\b/i.test(m[1]) && !/type\s*=\s*["']?module/i.test(m[1])
    );
    const hasViewport = /<meta\b[^>]*name\s*=\s*["']?viewport/i.test(raw);
    const hasFonts = /fonts\.(googleapis|gstatic)\.com|@font-face/i.test(raw);
    const hasFontSwap = /display=swap|font-display\s*:\s*swap/i.test(raw);
    const hasFontPreconnect = preconnects.some((m) => /fonts\./i.test(m[1]));
    const hasManifest = /<link\b[^>]*rel\s*=\s*["']?manifest/i.test(raw);
    const hasOg = /property\s*=\s*["']og:title["']/i.test(raw) && /property\s*=\s*["']og:image["']/i.test(raw);

    const diagnostics = [];

    if (unsizedImgs.length > 0) {
      diagnostics.push({
        rule_id: 'unsized-images',
        severity: unsizedImgs.length > 2 ? 'CRITICAL' : 'WARNING',
        passed: false,
        title: `Images missing explicit width and height (${unsizedImgs.length})`,
        description: `${unsizedImgs.length} <img> element(s) lack width/height attributes, causing layout reflows during load.`,
        impact: `+${Math.min(0.35, unsizedImgs.length * 0.06).toFixed(2)} CLS`,
        recommendation: 'Add explicit width and height attributes or CSS aspect-ratio to every <img> tag.',
      });
    }

    if (blockingScripts.length > 0) {
      diagnostics.push({
        rule_id: 'render-blocking-scripts',
        severity: blockingScripts.length > 1 ? 'CRITICAL' : 'WARNING',
        passed: false,
        title: `Render-blocking <script> tags in <head> (${blockingScripts.length})`,
        description: `Synchronous scripts in <head> block HTML parsing and delay First Contentful Paint.`,
        impact: `+${blockingScripts.length * 250}ms FCP / LCP`,
        recommendation: 'Add defer or async attributes to external <head> scripts, or use type="module".',
      });
    }

    if (heroMissingPriority) {
      diagnostics.push({
        rule_id: 'hero-fetchpriority',
        severity: 'WARNING',
        passed: false,
        title: 'LCP hero image missing fetchpriority="high"',
        description: 'The primary above-the-fold hero image is not prioritized by the browser preload scanner.',
        impact: '+0.35s LCP',
        recommendation: 'Add fetchpriority="high" and loading="eager" to the hero image plus <link rel="preload" as="image"> in <head>.',
      });
    }

    if (unlazyImgs.length > 0) {
      diagnostics.push({
        rule_id: 'unlazy-images',
        severity: 'WARNING',
        passed: false,
        title: `Offscreen images eagerly loaded (${unlazyImgs.length})`,
        description: `${unlazyImgs.length} below-the-fold image(s) compete with critical LCP assets for bandwidth.`,
        impact: `~${unlazyImgs.length * 150} KB contention`,
        recommendation: 'Add loading="lazy" and decoding="async" to below-the-fold images.',
      });
    }

    if (hasFonts && !hasFontSwap) {
      diagnostics.push({
        rule_id: 'font-display-swap',
        severity: 'WARNING',
        passed: false,
        title: 'Web fonts missing font-display: swap',
        description: 'Custom fonts without display=swap hide text (FOIT) until download completes.',
        impact: '+0.04 CLS / FOIT',
        recommendation: 'Append &display=swap to Google Fonts stylesheet URLs or set font-display: swap in @font-face.',
      });
    }

    if (hasFonts && !hasFontPreconnect) {
      diagnostics.push({
        rule_id: 'missing-font-preconnect',
        severity: 'WARNING',
        passed: false,
        title: 'External font origin missing <link rel="preconnect">',
        description: 'DNS and TLS handshakes for font CDNs are delayed until stylesheet parsing completes.',
        impact: '+180ms FCP / LCP',
        recommendation: 'Add <link rel="preconnect" href="https://fonts.googleapis.com"> and <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin> in <head>.',
      });
    }

    if (!hasViewport) {
      diagnostics.push({
        rule_id: 'missing-viewport',
        severity: 'WARNING',
        passed: false,
        title: 'Missing responsive <meta name="viewport"> tag',
        description: 'Without a viewport meta tag, mobile browsers trigger 300ms tap delays and desktop zoom scaling.',
        impact: '+0.03 CLS / mobile INP',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> inside <head>.',
      });
    }

    if (!hasManifest) {
      diagnostics.push({
        rule_id: 'pwa-no-manifest',
        severity: 'INFO',
        passed: false,
        title: 'Web App Manifest not linked',
        description: 'No <link rel="manifest"> found for installable PWA metadata.',
        impact: 'PWA installability',
        recommendation: 'Generate and link <link rel="manifest" href="/site.webmanifest"> in <head>.',
      });
    }

    if (!hasOg) {
      diagnostics.push({
        rule_id: 'og-incomplete',
        severity: 'INFO',
        passed: false,
        title: 'Incomplete OpenGraph social metadata',
        description: 'Missing og:title or og:image limits rich social and search snippet previews.',
        impact: 'Social CTR',
        recommendation: 'Add og:title, og:description, og:image, and twitter:card meta tags.',
      });
    }

    if (diagnostics.length === 0) {
      diagnostics.push({
        rule_id: 'all-clear',
        severity: 'PASS',
        passed: true,
        title: 'All Core Web Vitals checks passed',
        description: 'Dimensions, non-blocking scripts, hero priority, and resource hints satisfy CWV thresholds.',
        impact: 'Optimal baseline',
        recommendation: 'Monitor field telemetry via CrUX / web-vitals and maintain asset budgets.',
      });
    }

    const isMobile = dev === 'mobile';
    const mult = isMobile ? 1.35 : 0.95;
    const ttfbMs = Math.round((isMobile ? 220 : 120) + (hasFonts && !hasFontPreconnect ? 45 : 0));

    let baseLcp = ttfbMs / 1000 + 0.55;
    baseLcp += blockingScripts.length * 0.42;
    if (heroMissingPriority) baseLcp += 0.35;
    baseLcp += Math.min(1.0, unlazyImgs.length * 0.12);
    if (allStylesheets.length > 2) baseLcp += (allStylesheets.length - 2) * 0.15;
    const lcpVal = Number((baseLcp * mult).toFixed(2));

    let baseCls = 0.01;
    baseCls += Math.min(0.35, unsizedImgs.length * 0.06);
    if (!hasViewport) baseCls += 0.03;
    if (hasFonts && !hasFontSwap) baseCls += 0.04;
    const clsVal = Number(baseCls.toFixed(3));

    let baseInp = isMobile ? 65 : 35;
    baseInp += blockingScripts.length * 55;
    const totalElements = (raw.match(/<[a-z][a-z0-9-]*\b/gi) || []).length;
    if (totalElements > 800) baseInp += (totalElements - 800) / 18;
    const inpVal = Math.round(baseInp * (isMobile ? 1.2 : 0.9));

    const baseFcp = ttfbMs / 1000 + 0.32 + blockingScripts.length * 0.28 + allStylesheets.length * 0.08;
    const fcpVal = Number((baseFcp * mult).toFixed(2));

    // Weighted CWV score (aligned with Python core)
    const scoreCurve = (val, good, poor, maxBad) => {
      if (val <= good) return 100 - (val / good) * 10;
      if (val <= poor) return 90 - ((val - good) / (poor - good)) * 40;
      return Math.max(0, 50 - ((val - poor) / (maxBad - poor)) * 50);
    };

    const lcpScore = scoreCurve(lcpVal, 2.5, 4.0, 6.0);
    const clsScore = scoreCurve(clsVal, 0.1, 0.25, 0.5);
    const inpScore = scoreCurve(inpVal, 200, 500, 1000);
    const fcpScore = scoreCurve(fcpVal, 1.8, 3.0, 5.0);
    const ttfbScore = scoreCurve(ttfbMs, 800, 1800, 3000);

    let weighted = lcpScore * 0.3 + clsScore * 0.25 + inpScore * 0.2 + fcpScore * 0.15 + ttfbScore * 0.1;
    const critCount = diagnostics.filter((d) => d.severity === 'CRITICAL').length;
    const warnCount = diagnostics.filter((d) => d.severity === 'WARNING').length;
    weighted -= critCount * 5 + warnCount * 2;

    const score = Math.max(5, Math.min(100, Math.round(weighted)));
    const rating = score >= 90 ? 'GOOD' : score >= 50 ? 'NEEDS_IMPROVEMENT' : 'POOR';

    return {
      score,
      rating,
      device: dev,
      metrics: {
        lcp: { value: lcpVal, unit: 's', rating: rateMetric('lcp', lcpVal), target: '< 2.5s' },
        cls: { value: clsVal, unit: '', rating: rateMetric('cls', clsVal), target: '< 0.10' },
        inp: { value: inpVal, unit: 'ms', rating: rateMetric('inp', inpVal), target: '< 200ms' },
        fcp: { value: fcpVal, unit: 's', rating: rateMetric('fcp', fcpVal), target: '< 1.8s' },
        ttfb: { value: ttfbMs, unit: 'ms', rating: rateMetric('ttfb', ttfbMs), target: '< 800ms' },
      },
      diagnostics,
      summary: {
        passed: diagnostics.filter((d) => d.passed).length,
        critical: critCount,
        warning: warnCount,
        info: diagnostics.filter((d) => d.severity === 'INFO').length,
        total: diagnostics.length,
      },
    };
  }

  function transformHtml(html, options) {
    const opts = Object.assign(
      {
        dimensions: true,
        lazy_loading: true,
        font_preconnect: true,
        defer_scripts: true,
        preload_hero: true,
        critical_css: true,
      },
      options || {}
    );

    let out = String(html || '');
    const changes = [];
    if (!out.trim()) return { optimized_html: '', changes: ['Empty input HTML'] };

    // 1. Viewport meta if missing
    if (/<head\b[^>]*>/i.test(out) && !/<meta\b[^>]*name\s*=\s*["']?viewport/i.test(out)) {
      out = out.replace(/(<head\b[^>]*>)/i, '$1\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
      changes.push('Injected responsive <meta name="viewport"> tag in <head>');
    }

    // 2. Font preconnect & display=swap
    if (opts.font_preconnect) {
      if (/fonts\.googleapis\.com/i.test(out) && !/display=swap/i.test(out)) {
        out = out.replace(/(fonts\.googleapis\.com\/css2?\?[^"'\s>]+)/gi, (m) =>
          m + (m.includes('&amp;') ? '&amp;display=swap' : '&display=swap')
        );
        changes.push('Appended &display=swap to Google Fonts stylesheet URL');
      }
      if (/fonts\.googleapis\.com/i.test(out) && !/rel=["']preconnect["']/i.test(out) && /<head\b[^>]*>/i.test(out)) {
        out = out.replace(
          /(<head\b[^>]*>)/i,
          '$1\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        );
        changes.push('Injected <link rel="preconnect"> hints for Google Fonts origins');
      }
    }

    // 3. Defer blocking scripts strictly inside <head>
    if (opts.defer_scripts) {
      let deferredCount = 0;
      out = out.replace(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i, (full, open, body, close) => {
        const nextBody = body.replace(/<script\b([^>]*)>/gi, (sFull, attrs) => {
          if (/\bsrc\s*=/i.test(attrs) && !/\b(defer|async)\b/i.test(attrs) && !/type\s*=\s*["']?module/i.test(attrs)) {
            deferredCount += 1;
            return `<script defer${attrs}>`;
          }
          return sFull;
        });
        return open + nextBody + close;
      });
      if (deferredCount > 0) {
        changes.push(`Added defer attribute to ${deferredCount} render-blocking <head> script(s)`);
      }
    }

    // 4. Image dimensions, hero fetchpriority, below-fold lazy loading
    let imgIdx = 0;
    let firstImgSrc = '';
    out = out.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
      imgIdx += 1;
      let nextAttrs = attrs;
      const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs);
      if (imgIdx === 1 && srcMatch) firstImgSrc = srcMatch[1];

      if (opts.dimensions) {
        if (!/\bwidth\s*=/i.test(nextAttrs)) nextAttrs += imgIdx === 1 ? ' width="1200"' : ' width="800"';
        if (!/\bheight\s*=/i.test(nextAttrs)) nextAttrs += imgIdx === 1 ? ' height="630"' : ' height="500"';
      }
      if (imgIdx === 1 && opts.preload_hero) {
        if (!/\bfetchpriority\s*=/i.test(nextAttrs)) nextAttrs += ' fetchpriority="high"';
        if (!/\bloading\s*=/i.test(nextAttrs)) nextAttrs += ' loading="eager"';
      } else if (imgIdx > 1 && opts.lazy_loading) {
        if (!/\bloading\s*=/i.test(nextAttrs)) nextAttrs += ' loading="lazy"';
        if (!/\bdecoding\s*=/i.test(nextAttrs)) nextAttrs += ' decoding="async"';
      }
      return `<img${nextAttrs}>`;
    });
    if (imgIdx > 0) {
      changes.push(`Optimized ${imgIdx} <img> tag(s): CLS dimensions, hero priority, and lazy loading`);
    }

    // 5. Hero preload hint (safely escaped, zero querySelector crash on quotes)
    if (opts.preload_hero && firstImgSrc && !firstImgSrc.startsWith('data:') && /<head\b[^>]*>/i.test(out)) {
      const escapedHref = escapeHtml(firstImgSrc);
      if (!out.includes(`rel="preload" as="image" href="${escapedHref}"`)) {
        out = out.replace(
          /(<head\b[^>]*>)/i,
          `$1\n  <link rel="preload" as="image" href="${escapedHref}" fetchpriority="high">`
        );
        changes.push(`Injected <link rel="preload" as="image"> for LCP hero asset: ${firstImgSrc}`);
      }
    }

    // 6. Critical CSS containment reset
    if (opts.critical_css && !out.includes('cwv-critical-reset') && /<head\b[^>]*>/i.test(out)) {
      const cssBlock =
        '  <style id="cwv-critical-reset">img,video{max-width:100%;height:auto;display:block}.below-fold{content-visibility:auto;contain-intrinsic-size:1px 600px}</style>';
      out = out.replace(/(<head\b[^>]*>)/i, `$1\n${cssBlock}`);
      changes.push('Injected critical CSS containment reset (content-visibility: auto)');
    }

    return { optimized_html: out, changes };
  }

  function compareHtmlDiff(baselineHtml, candidateHtml, device) {
    const dev = String(device || 'mobile').toLowerCase() === 'desktop' ? 'desktop' : 'mobile';
    const base = auditHtml(baselineHtml, dev);
    const cand = auditHtml(candidateHtml, dev);

    const scoreDelta = cand.score - base.score;
    const calcDelta = (key, digits) => {
      const bVal = base.metrics[key].value;
      const cVal = cand.metrics[key].value;
      const raw = cVal - bVal;
      const delta = digits > 0 ? Number(raw.toFixed(digits)) : Math.round(raw);
      return {
        baseline: bVal,
        candidate: cVal,
        delta: Object.is(delta, -0) ? 0 : delta,
        improved: delta < 0,
        unit: base.metrics[key].unit,
      };
    };

    const metric_deltas = {
      lcp: calcDelta('lcp', 2),
      cls: calcDelta('cls', 3),
      inp: calcDelta('inp', 0),
      fcp: calcDelta('fcp', 2),
      ttfb: calcDelta('ttfb', 0),
    };

    const candFailIds = new Set(cand.diagnostics.filter((d) => !d.passed).map((d) => d.rule_id));
    const resolved_issues = base.diagnostics
      .filter((d) => !d.passed && !candFailIds.has(d.rule_id))
      .map((d) => ({ rule_id: d.rule_id, title: d.title, resolved: true }));

    let summary;
    if (scoreDelta > 0) {
      summary = `Score improved from ${base.score} to ${cand.score} (+${scoreDelta} pts) with ${resolved_issues.length} issue(s) resolved.`;
    } else if (scoreDelta < 0) {
      summary = `Score regressed from ${base.score} to ${cand.score} (${scoreDelta} pts).`;
    } else {
      summary = `Identical CWV score (${base.score} → ${cand.score}, 0 pts delta).`;
    }

    return {
      baseline_score: base.score,
      candidate_score: cand.score,
      score_delta: scoreDelta,
      improved: scoreDelta > 0,
      metric_deltas,
      resolved_issues,
      resolved_count: resolved_issues.length,
      summary,
    };
  }

  function generatePwa(config) {
    const cfg = Object.assign(
      {
        name: 'CWV Speed App',
        short_name: 'SpeedApp',
        theme_color: '#047857',
        background_color: '#FAF8F3',
        strategy: 'stale-while-revalidate',
      },
      config || {}
    );

    const strategy = ['stale-while-revalidate', 'cache-first', 'network-first'].includes(cfg.strategy)
      ? cfg.strategy
      : 'stale-while-revalidate';
    const themeColor = sanitizeHexColor(cfg.theme_color, '#047857');
    const bgColor = sanitizeHexColor(cfg.background_color, '#FAF8F3');
    const safeName = escapeHtml(cfg.name);

    const manifest = {
      name: cfg.name,
      short_name: cfg.short_name,
      start_url: '/',
      display: 'standalone',
      theme_color: themeColor,
      background_color: bgColor,
      icons: [
        { src: '/assets/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/assets/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    };

    let fetchHandler;
    if (strategy === 'cache-first') {
      fetchHandler = `  // Strategy: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        }
        return resp;
      }).catch(() => caches.match('/offline.html'));
    })
  );`;
    } else if (strategy === 'network-first') {
      fetchHandler = `  // Strategy: network-first
  event.respondWith(
    fetch(event.request).then((resp) => {
      if (resp && resp.status === 200) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
      }
      return resp;
    }).catch(() => caches.match(event.request).then((c) => c || caches.match('/offline.html')))
  );`;
    } else {
      fetchHandler = `  // Strategy: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const netFetch = fetch(event.request).then((resp) => {
        if (resp && resp.status === 200) cache.put(event.request, resp.clone());
        return resp;
      }).catch(() => cached || caches.match('/offline.html'));
      return cached || netFetch;
    })
  );`;
    }

    const service_worker = `// CWV Speed Engine v${VERSION} Service Worker (${strategy})
const CACHE_NAME = 'cwv-speed-v${VERSION}';
const ASSETS = ['/', '/index.html', '/offline.html', '/site.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
${fetchHandler}
});
`;

    const offline_html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline | ${safeName}</title>
  <meta name="theme-color" content="${themeColor}">
</head>
<body style="font-family:system-ui,sans-serif;background:#FAF8F3;color:#101828;padding:40px;text-align:center;">
  <h1>Offline Mode</h1>
  <p>${safeName} is currently offline. Cached assets will reload automatically when connectivity returns.</p>
</body>
</html>`;

    return {
      strategy,
      manifest,
      manifest_json: JSON.stringify(manifest, null, 2),
      service_worker,
      offline_html,
    };
  }

  function generateSpeculationRules(html, baseUrl, aggressiveness) {
    const raw = String(html || '');
    const mode = ['conservative', 'balanced', 'aggressive'].includes(aggressiveness) ? aggressiveness : 'balanced';
    const unsafePatterns = /(\/logout|\/signout|\/cart|\/checkout|\/admin|\/api\/|\/delete|\?action=)/i;

    const hrefs = new Set();
    for (const m of raw.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)["']/gi)) {
      const h = m[1].trim();
      if (!h || h.startsWith('mailto:') || h.startsWith('tel:') || h.startsWith('javascript:')) continue;
      if (h.startsWith('http://') || h.startsWith('https://')) {
        try {
          const parsed = new URL(h);
          const base = new URL(baseUrl || 'https://example.com');
          if (parsed.origin === base.origin) hrefs.add(parsed.pathname + parsed.search);
        } catch (_) {}
      } else if (h.startsWith('/')) {
        hrefs.add(h);
      }
    }

    if (hrefs.size === 0) {
      hrefs.add('/docs');
      hrefs.add('/pricing');
      hrefs.add('/features');
    }

    const prerender = [];
    const prefetch = [];
    const excluded = [];
    for (const path of hrefs) {
      if (unsafePatterns.test(path)) {
        excluded.push(path);
      } else if (prerender.length < (mode === 'aggressive' ? 5 : mode === 'balanced' ? 3 : 1)) {
        prerender.push(path);
      } else {
        prefetch.push(path);
      }
    }

    const eagerness = mode === 'aggressive' ? 'eager' : mode === 'balanced' ? 'moderate' : 'conservative';
    const rulesObj = {
      prerender: [{ source: 'list', urls: prerender, eagerness }],
      prefetch: prefetch.length ? [{ source: 'list', urls: prefetch, eagerness: 'conservative' }] : [],
    };
    const jsonStr = JSON.stringify(rulesObj, null, 2);
    const scriptTag = `<script type="speculationrules">\n${jsonStr}\n</script>`;
    const earlyHints = prerender.slice(0, 2).map((u) => `Link: <${u}>; rel=prefetch`);

    return {
      aggressiveness: mode,
      prerender_urls: prerender,
      prefetch_urls: prefetch,
      excluded_urls: excluded,
      rules: rulesObj,
      script_tag: scriptTag,
      early_hints: earlyHints,
    };
  }

  function auditPerformanceBudget(html, customBudgets) {
    const raw = String(html || '');
    const budgets = Object.assign({ script: 170, stylesheet: 50, image: 300, font: 100, total: 650 }, customBudgets || {});

    const extScripts = [...raw.matchAll(/<script\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi)];
    const inlineScripts = [...raw.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    const stylesheets = [...raw.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)];
    const images = [...raw.matchAll(/<img\b([^>]*)>/gi)];
    const fonts = [...raw.matchAll(/fonts\.googleapis\.com|@font-face|\.woff2/gi)];

    const inlineJsKb = inlineScripts.reduce((acc, m) => acc + new TextEncoder().encode(m[1] || '').length / 1024, 0);
    const scriptKb = Number((extScripts.length * 48 + inlineJsKb).toFixed(1));
    const cssKb = Number((stylesheets.length * 24).toFixed(1));
    const imgKb = Number((images.length * 85).toFixed(1));
    const fontKb = Number((Math.min(4, fonts.length) * 32).toFixed(1));
    const docKb = Number((new TextEncoder().encode(raw).length / 1024).toFixed(1));
    const totalKb = Number((scriptKb + cssKb + imgKb + fontKb + docKb).toFixed(1));

    const checks = [
      { resourceType: 'script', actualKb: scriptKb, budgetKb: budgets.script, status: scriptKb <= budgets.script ? 'PASS' : 'OVER' },
      { resourceType: 'stylesheet', actualKb: cssKb, budgetKb: budgets.stylesheet, status: cssKb <= budgets.stylesheet ? 'PASS' : 'OVER' },
      { resourceType: 'image', actualKb: imgKb, budgetKb: budgets.image, status: imgKb <= budgets.image ? 'PASS' : 'OVER' },
      { resourceType: 'font', actualKb: fontKb, budgetKb: budgets.font, status: fontKb <= budgets.font ? 'PASS' : 'OVER' },
      { resourceType: 'total', actualKb: totalKb, budgetKb: budgets.total, status: totalKb <= budgets.total ? 'PASS' : 'OVER' },
    ];

    // LoAF (Long Animation Frame) risk estimation
    const loafRisks = [];
    for (const s of extScripts) {
      if (!/\b(defer|async)\b/i.test(s[0])) {
        loafRisks.push({ script: s[1], estimatedBlockingMs: 115, reason: 'Synchronous parser-blocking external script' });
      }
    }
    if (inlineJsKb > 20) {
      loafRisks.push({ script: 'inline <script>', estimatedBlockingMs: Math.round(inlineJsKb * 3.5), reason: 'Large inline script execution block' });
    }

    const networks = [
      { profile: 'Fast 3G (1.6 Mbps, 150ms RTT)', downloadMs: Math.round((totalKb * 8) / 1.6 + 150) },
      { profile: 'Regular 4G (9 Mbps, 60ms RTT)', downloadMs: Math.round((totalKb * 8) / 9 + 60) },
      { profile: '5G / Broadband (50 Mbps, 20ms RTT)', downloadMs: Math.round((totalKb * 8) / 50 + 20) },
    ];

    const lighthouse_budget_json = [
      {
        path: '/*',
        resourceSizes: checks.map((c) => ({ resourceType: c.resourceType, budget: c.budgetKb })),
      },
    ];

    return {
      is_passing: checks.every((c) => c.status === 'PASS'),
      total_kb: totalKb,
      checks,
      loaf_risks: loafRisks,
      networks,
      lighthouse_budget_json,
    };
  }

  // Genuine pure-JS uncompressed ZIP binary builder (CRC32 + local headers + central dir + EOCD)
  const CRC_TABLE = (function () {
    const tbl = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tbl[i] = c >>> 0;
    }
    return tbl;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createStoredZip(filesMap) {
    const enc = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const entries = Object.entries(filesMap || {});

    for (const [filename, content] of entries) {
      const nameBytes = enc.encode(filename);
      const dataBytes = content instanceof Uint8Array ? content : enc.encode(String(content));
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true); // stored (uncompressed)
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);

      const central = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      central.set(nameBytes, 46);

      localParts.push(local, dataBytes);
      centralParts.push(central);
      offset += local.length + dataBytes.length;
    }

    const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
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
    for (const part of localParts) {
      out.set(part, pos);
      pos += part.length;
    }
    for (const part of centralParts) {
      out.set(part, pos);
      pos += part.length;
    }
    out.set(eocd, pos);
    return out;
  }

  return {
    VERSION,
    REAL_MCP_TOOLS,
    escapeHtml,
    sanitizeImageUrl,
    sanitizeHexColor,
    rateMetric,
    auditHtml,
    transformHtml,
    compareHtmlDiff,
    generatePwa,
    generateSpeculationRules,
    auditPerformanceBudget,
    createStoredZip,
  };
});
