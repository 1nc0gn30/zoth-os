#!/usr/bin/env node
/**
 * City Desk static site compiler (v2.6.0).
 * Twenty trades × fifty cities = 1,000 finished pages, plus indexes and legal/support pages.
 * A page is the site. City Desk is one studio, not a local shop.
 */
const fs = require('fs');
const path = require('path');
const { SERVICES, CITIES } = require('./data');
const { replyTo, origin, studio } = require('./config');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'site');
const VERSION = '2.6.0';
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const STRIPE_COFFEE_URL = 'https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X';
const SOLANA_TIP_ADDR = 'GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK';

function hash(seed) {
  let n = 2166136261;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) n = Math.imul(n ^ s.charCodeAt(i), 16777619) >>> 0;
  return n;
}

function pick(seed, list) {
  return list[hash(seed) % list.length];
}

function rotate(list, seed) {
  const i = hash(seed) % list.length;
  return list.slice(i).concat(list.slice(0, i));
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function money(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

function href(to) {
  const target = String(to || '').replace(/^\/+/, '');
  return target ? '/' + target : '/';
}

function jsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function fill(text, city) {
  return String(text).replaceAll('{city}', city.name).replaceAll('{state}', city.state);
}

const SHOTS = {
  painters: {
    hero: { file: 'hero.jpg', alt: 'A living room mid-paint, tape on the trim and a roller on the drop cloth' },
    cards: {
      Exterior: { file: 'exterior.jpg', alt: 'Fresh siding on a craftsman house, a ladder beside the taped window' },
      Cabinets: { file: 'cabinets.jpg', alt: 'Warm-white cabinet doors with a brush and a plain can on the counter' },
      Interior: { file: 'interior.jpg', alt: 'A roller laying a smooth coat of paint in window light' }
    }
  }
};

function shotsFor(service) {
  const pack = SHOTS[service.slug];
  if (!pack) return null;
  const dir = path.join(ROOT, 'media', service.slug);
  if (!fs.existsSync(path.join(dir, pack.hero.file))) return null;
  return pack;
}

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyTree(from, to);
    else fs.copyFileSync(from, to);
  }
}

function emphCity(headline, cityName) {
  const at = headline.lastIndexOf(cityName);
  if (at < 0) return esc(headline);
  return esc(headline.slice(0, at)) + '<em>' + esc(cityName) + '</em>' + esc(headline.slice(at + cityName.length));
}

function painterBody({ service, city, pack, headline, lede, work, steps, points, faqs, slots, ask, other }) {
  const price = money(service.price);
  const src = (file) => esc(href('media/' + service.slug + '/' + file));
  const place = `${city.name}, ${city.state}`;
  const homeLines = points.filter((p) => !/first screen/i.test(p));
  const plates = work.map(([title, bodyText], i) => {
    const shot = pack.cards[title];
    const photo = shot ? `<img src="${src(shot.file)}" alt="${esc(shot.alt)}" loading="lazy">` : '';
    const num = String(i + 1).padStart(2, '0');
    return `  <article class="plate"${i === 0 ? ' id="work"' : ''}>
    <figure>${photo}</figure>
    <div class="plate-copy"><span class="num">${num}</span><h3>${esc(title)}</h3><p>${esc(bodyText)}</p></div>
  </article>`;
  }).join('\n');
  return `
<section class="front" id="top">
  <div class="front-copy">
    <p class="kicker"><span class="tape" aria-hidden="true"></span>House painting · ${esc(place)}</p>
    <h1>${emphCity(headline, city.name)}</h1>
    <p class="front-lede">${esc(lede)}</p>
    <div class="front-actions">
      <a class="btn-tape" href="#contact">Ask for a written price</a>
      <a class="btn-line" href="#work">See the work</a>
    </div>
    <dl class="facts">
      <div><dt>Written</dt><dd>Price before paint</dd></div>
      <div><dt>Listed</dt><dd>Prep in the price</dd></div>
      <div><dt>Walked</dt><dd>When it is dry</dd></div>
    </dl>
  </div>
  <figure class="front-photo">
    <img src="${src(pack.hero.file)}" alt="${esc(pack.hero.alt)}" fetchpriority="high">
  </figure>
</section>
<section class="sect" aria-label="Work">
  <header class="sect-head"><p class="kicker"><span class="tape" aria-hidden="true"></span>The work</p><h2>Three kinds of job, priced apart</h2></header>
  <div class="plates">
${plates}
  </div>
</section>
<section class="sect" id="job">
  <header class="sect-head"><p class="kicker"><span class="tape" aria-hidden="true"></span>How a job goes</p><h2>Three steps, all written down</h2></header>
  <ol class="steps-row">
${steps.map(([title, bodyText], i) => `    <li><span class="num">${String(i + 1).padStart(2, '0')}</span><strong>${esc(title)}</strong><p>${esc(bodyText)}</p></li>`).join('\n')}
  </ol>
</section>
<section class="sect sect-two" id="ask">
  <div>
    <header class="sect-head"><p class="kicker"><span class="tape" aria-hidden="true"></span>Before the visit</p><h2>What to expect</h2></header>
    <ul class="ticks">
${homeLines.map((item) => `      <li>${esc(item)}</li>`).join('\n')}
    </ul>
  </div>
  <div>
    <header class="sect-head"><p class="kicker"><span class="tape" aria-hidden="true"></span>Questions</p><h2>Asked before every job</h2></header>
    <div class="faqs">
${faqs.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>
<section class="sect" id="estimator" aria-label="Interactive Written Price Estimator">
  <header class="sect-head">
    <p class="kicker"><span class="tape" aria-hidden="true"></span>Interactive 60-Second Estimator</p>
    <h2>Preview a ballpark written estimate before calling</h2>
  </header>
  <div class="estimator-ledger">
    <div class="estimator-controls">
      <div class="field-group">
        <label class="field-label" for="estScopeSelect">01 · Select Service Scope</label>
        <select id="estScopeSelect" class="field-control" onchange="window.updateTradeEstimate && window.updateTradeEstimate()">
          ${work.map(([title], idx) => `<option value="${idx}">${esc(title)} (${esc(city.name)})</option>`).join('\n          ')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label" for="estUrgencySelect">02 · Project Size &amp; Dispatch Window</label>
        <select id="estUrgencySelect" class="field-control" onchange="window.updateTradeEstimate && window.updateTradeEstimate()">
          <option value="1">Standard Single Job / Scheduled Visit</option>
          <option value="1.8">Multi-Room / Full System Scope</option>
          <option value="1.35">Priority Same-Week Dispatch</option>
        </select>
      </div>
    </div>
    <div class="estimator-ticket">
      <div class="ticket-head">
        <span class="ticket-kicker">WRITTEN BALLPARK LEDGER · ${esc(place)}</span>
        <span class="ticket-tag">ZERO OBLIGATION</span>
      </div>
      <div id="estRangeOutput" class="ticket-range">$185 – $420</div>
      <p class="ticket-note">Final written price is confirmed before any work begins. Request a callback window below:</p>
      <form name="trade-lead-capture" method="POST" data-netlify="true" onsubmit="return window.submitNetlifyForm ? window.submitNetlifyForm(event, 'tradeEstStatus') : true" class="inline-lead-form">
        <input type="hidden" name="form-name" value="trade-lead-capture">
        <input type="hidden" name="city" value="${esc(place)}">
        <input type="hidden" name="trade" value="${esc(service.name)}">
        <div class="lead-field">
          <label class="sr-only" for="leadCustomerName">Your Name</label>
          <input id="leadCustomerName" type="text" name="customer_name" placeholder="Your Name" aria-label="Your Name" required class="field-control">
        </div>
        <div class="lead-field">
          <label class="sr-only" for="leadCustomerPhone">Your Phone Number</label>
          <input id="leadCustomerPhone" type="tel" name="customer_phone" placeholder="Your Phone #" aria-label="Your Phone Number" required class="field-control">
        </div>
        <button type="submit" class="btn-arch-copper">Request Written Price</button>
      </form>
      <div id="tradeEstStatus" class="form-status" role="status" aria-live="polite" style="display:none;"></div>
    </div>
  </div>
</section>
<section class="contact" id="contact">
  <div class="contact-copy">
    <p class="kicker"><span class="tape" aria-hidden="true"></span>Get a written price</p>
    <h2>Send the rooms and a few photos</h2>
    <p>The owner answers from these lines. Replace them with the real name, phone, and email.</p>
  </div>
  <div class="reach-lines">
${slots.map(([label, value]) => `    <p><span>${esc(label)}</span>${esc(value)}</p>`).join('\n')}
  </div>
</section>
<section class="offer-block" id="offer" aria-label="Offer to the owner">
  <div class="offer-inner">
    <div class="offer-head">
      <p class="kicker kicker-light">For the painting owner in ${esc(city.name)}</p>
      <h2>This page is finished. Put your name on it.</h2>
      <p>Add the business name, phone, and email to the contact lines and publish. Zero monthly agency retainer — export the standalone HTML bundle directly in your browser.</p>
    </div>
    <div class="offer-price">
      <strong>100% Free</strong>
      <span>(${esc(price)} Valuation) · Standalone HTML &amp; Schema.org Bundle · ${esc(place)}</span>
    </div>
  </div>
  ${ask.action}
  ${ask.rest}
</section>
<section class="sect sect-more">
  <h2>Other finished pages in ${esc(city.name)}</h2>
  <div class="trades">
${other.map((s) => `    <a href="${esc(href('cities/' + city.slug + '/' + s.slug + '/'))}">${esc(s.name)}</a>`).join('\n')}
  </div>
  <p class="note"><a href="${esc(href('cities/' + city.slug + '/'))}">All trades in ${esc(city.name)}</a> · <a href="${esc(href('services/' + service.slug + '/'))}">${esc(service.name)} in other cities</a></p>
</section>`;
}

function page({ from, title, description, json, body, shop, foot, theme }) {
  const canonical = origin
    ? `\n<link rel="canonical" href="${esc(origin.replace(/\/$/, '') + (from ? '/' + from + '/' : '/'))}">`
    : '';
  const ogBase = (origin || 'https://city-desk.netlify.app').replace(/\/$/, '');
  const ogUrl = esc(ogBase + (from ? '/' + from + '/' : '/'));
  const ogImage = esc(ogBase + '/media/og-banner.jpg');
  const header = shop
    ? `<header class="bar">
  <div class="wrap bar-row">
    <a class="mark" href="#top" title="${esc(shop.name)} — ${esc(shop.city)}">
      <img src="/media/icon.png" alt="City Desk emblem" class="logo-img">
      <strong class="mark-biz">${esc(shop.name)}</strong>
      <span class="mark-city">${esc(shop.city)}</span>
    </a>
    <nav class="bar-nav" aria-label="Page navigation">
      <a class="nav-link" href="#work">Scope</a>
      <a class="nav-link" href="#estimator">Estimator</a>
      <a class="nav-link" href="#ask">FAQ</a>
      <button type="button" id="themeToggleBtn" class="theme-toggle-btn" aria-label="Toggle color theme" onclick="window.toggleCityDeskTheme && window.toggleCityDeskTheme()">☾ Dark</button>
      <a class="nav-cta" href="#offer">Claim Site</a>
    </nav>
  </div>
</header>`
    : `<header class="bar">
  <div class="wrap bar-row">
    <a class="mark" href="/">
      <img src="/media/icon.png" alt="City Desk emblem" class="logo-img">
      <strong class="mark-biz">${esc(studio)}</strong>
      <span class="mark-city">1,000 PAGES</span>
    </a>
    <nav class="bar-nav" aria-label="Studio navigation">
      <a class="nav-link" href="/">Synthesizer</a>
      <a class="nav-link" href="/services/">20 Trades</a>
      <button type="button" id="themeToggleBtn" class="theme-toggle-btn" aria-label="Toggle color theme" onclick="window.toggleCityDeskTheme && window.toggleCityDeskTheme()">☾ Dark</button>
      <button type="button" class="nav-cta" onclick="window.openVipModal()">Deploy Specs</button>
    </nav>
  </div>
</header>`;
  const footer = foot || `<p>${esc(studio)} is one studio. These pages are finished sites for owners. They are not local offices, and they are not a count of who else is selling in town.</p>`;
  const primaryNode = Object.assign({}, json);
  delete primaryNode['@context'];
  const fullGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      primaryNode,
      {
        '@type': 'WebApplication',
        name: title,
        url: ogBase + (from ? '/' + from + '/' : '/'),
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        softwareVersion: VERSION,
        description,
        creator: {
          '@type': 'Person',
          name: 'Neal Frazier',
          alternateName: '@1nc0gn30',
          jobTitle: 'Principal Systems Architect',
          url: 'https://nullai.tech',
          worksFor: { '@type': 'Organization', name: 'Neal Frazier Tech' }
        },
        offers: {
          '@type': 'Offer',
          name: '100% Free & Open-Access Standalone HTML Bundle',
          price: '0',
          priceCurrency: 'USD',
          url: STRIPE_COFFEE_URL
        }
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is City Desk 100% free and open-access?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. All 1,000 localized trade pages across 20 trades and 50 US cities, live synthesizers, and standalone HTML + Schema.org bundle downloads are 100% free and unlocked by default with zero paywalls.'
            }
          },
          {
            '@type': 'Question',
            name: 'How does City Desk protect local privacy and data?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'City Desk compiles static HTML locally with self-hosted fonts and zero third-party tracking scripts. The loopback daemon binds strictly to 127.0.0.1:8087 with path containment and Host/Origin allowlists.'
            }
          },
          {
            '@type': 'Question',
            name: 'How can I support City Desk development?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Support is completely optional via Buy Us a Coffee on Stripe (https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or a Solana tip to GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK.'
            }
          }
        ]
      }
    ]
  };
  const themeInitScript = `<script>(function(){try{var p=new URLSearchParams(location.search).get('theme');var t=(p==='dark'||p==='light')?p:(localStorage.getItem('zoth-theme-mode')||localStorage.getItem('cd_theme')||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();</script>`;
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="${theme || '#FAF8F3'}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">${canonical}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${ogUrl}">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@1nc0gn30">
<meta name="twitter:creator" content="@1nc0gn30">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs Index">
<link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLMs Full Corpus">
<link rel="alternate" type="application/json" href="/api/index.json" title="AI Agent Discovery API">
<link rel="alternate" type="application/json" href="/api/services.json" title="20 Service Trade Blueprints">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/media/icon.png">
<link rel="apple-touch-icon" href="/media/icon.png">
${themeInitScript}
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">${jsonLd(fullGraph)}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header}
<main id="main"${shop ? '' : ' class="wrap"'}>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    ${footer}
    <nav class="footer-links" aria-label="Footer links">
      <span class="footer-attr">Engineered by Neal Frazier Tech (<a href="https://github.com/1nc0gn30" target="_blank" rel="noopener noreferrer">@1nc0gn30</a>) • <a href="https://nullai.tech" target="_blank" rel="noopener noreferrer">NullAI Platform</a></span>
      <a href="https://github.com/1nc0gn30/city-desk" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="/terms/">Terms</a>
      <a href="/privacy/">Privacy</a>
      <a href="/support/">Support</a>
      <a href="${STRIPE_COFFEE_URL}" target="_blank" rel="noopener noreferrer">☕ Buy Us a Coffee</a>
      <a href="solana:${SOLANA_TIP_ADDR}" title="${SOLANA_TIP_ADDR}">◎ Solana Tip: GG2e...dXoK</a>
    </nav>
  </div>
</footer>

<!-- Hidden Netlify Form Detection Shells -->
<form name="vip-onboarding" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="hidden" name="form-name" value="vip-onboarding">
  <input type="text" name="business_name">
  <input type="email" name="owner_email">
  <input type="tel" name="owner_phone">
  <input type="text" name="target_domain">
  <input type="text" name="package_purchased">
  <textarea name="custom_notes"></textarea>
  <input type="text" name="bot-field">
</form>
<form name="owner-question" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="hidden" name="form-name" value="owner-question">
  <input type="text" name="business_name">
  <input type="email" name="owner_email">
  <input type="tel" name="owner_phone">
  <input type="text" name="page_url">
  <textarea name="question"></textarea>
  <input type="text" name="bot-field">
</form>
<form name="trade-lead-capture" data-netlify="true" netlify-honeypot="bot-field" hidden>
  <input type="hidden" name="form-name" value="trade-lead-capture">
  <input type="text" name="city">
  <input type="text" name="trade">
  <input type="text" name="customer_name">
  <input type="tel" name="customer_phone">
  <input type="text" name="bot-field">
</form>

<!-- Standalone Export & Deployment Specs Modal -->
<div id="vipModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="vipModalTitle">
  <div class="modal-content modal-wide">
    <button type="button" onclick="window.closeVipModal()" class="modal-close" aria-label="Close deployment specs modal">✕</button>
    <div class="modal-head">
      <div class="modal-pill">100% OPEN ACCESS · STANDALONE BUNDLE</div>
      <h3 id="vipModalTitle">Download Page Bundle &amp; Save Launch Specs</h3>
      <p>Export a self-contained HTML + Schema.org JSON-LD file directly in your browser, or save local deployment notes below.</p>
    </div>

    <div class="modal-section">
      <div class="modal-step-title">STEP 1 · INSTANT SELF-CONTAINED FILE DOWNLOAD</div>
      <p class="modal-step-desc">Generate and download the complete standalone HTML + Schema.org JSON-LD file with your business name and phone wired in:</p>
      <div class="modal-grid-2">
        <div>
          <label class="sr-only" for="vipQuickBiz">Business Name</label>
          <input type="text" id="vipQuickBiz" placeholder="Your Business Name" aria-label="Business Name" class="field-control">
        </div>
        <div>
          <label class="sr-only" for="vipQuickPhone">Business Phone</label>
          <input type="tel" id="vipQuickPhone" placeholder="Your business phone" aria-label="Business Phone" class="field-control">
        </div>
      </div>
      <button type="button" onclick="window.downloadCurrentPageBundle()" class="btn-gold btn-block">
        &darr; Download Ready-to-Host Website HTML Bundle (.html)
      </button>
    </div>

    <div class="modal-section">
      <div class="modal-step-title">STEP 2 · DEPLOYMENT &amp; DOMAIN SPECS</div>
      <p class="modal-step-desc">Save your business name, phone, email, and domain configuration to the local lead log:</p>
      <form id="vipOnboardingForm" name="vip-onboarding" method="POST" data-netlify="true" onsubmit="return window.submitVipOnboarding(event)" class="modal-form">
        <input type="hidden" name="form-name" value="vip-onboarding">
        <div class="modal-grid-2">
          <div>
            <label class="sr-only" for="vipBizName">Business Name</label>
            <input type="text" id="vipBizName" name="business_name" placeholder="Business Name *" aria-label="Business Name" required class="field-control">
          </div>
          <div>
            <label class="sr-only" for="vipOwnerEmail">Owner Email</label>
            <input type="email" id="vipOwnerEmail" name="owner_email" placeholder="Your Email *" aria-label="Owner Email" required class="field-control">
          </div>
        </div>
        <div class="modal-grid-2">
          <div>
            <label class="sr-only" for="vipOwnerPhone">Owner Phone</label>
            <input type="tel" id="vipOwnerPhone" name="owner_phone" placeholder="Your business phone *" aria-label="Owner Phone" required class="field-control">
          </div>
          <div>
            <label class="sr-only" for="vipTargetDomain">Target Domain</label>
            <input type="text" id="vipTargetDomain" name="target_domain" placeholder="Your Domain (e.g. myshop.com)" aria-label="Target Domain" class="field-control">
          </div>
        </div>
        <div>
          <label class="sr-only" for="vipPackageSelect">Bundle Format</label>
          <select id="vipPackageSelect" name="package_purchased" aria-label="Bundle Format" class="field-control">
            <option value="100% Free Standalone HTML Bundle">100% Free Standalone HTML Bundle</option>
            <option value="Custom Multi-City Trade Site">Custom Multi-City Trade Site</option>
            <option value="LocalBusiness Schema.org + AEO Pack">LocalBusiness Schema.org + AEO Pack</option>
          </select>
        </div>
        <div>
          <label class="sr-only" for="vipCustomNotes">Custom Notes</label>
          <textarea id="vipCustomNotes" name="custom_notes" rows="2" placeholder="Service areas, hours, or custom scope notes..." aria-label="Custom Notes" class="field-control"></textarea>
        </div>
        <button type="submit" class="btn-arch-copper btn-block">Save Launch Specs &rarr;</button>
      </form>
      <div id="vipOnboardingConfirm" class="form-status" role="status" aria-live="polite" style="display:none;"></div>
    </div>
  </div>
</div>

<!-- Toast Notification Container -->
<div id="toast" class="toast" role="status" aria-live="polite">
  <span id="toast-message"></span>
</div>

<script src="/city_engine.js"></script>
</body>
</html>
`;
}

function sendNote(service, city) {
  const place = `${city.name}, ${city.state}`;
  return [
    `${studio} — finished page`,
    `${service.name} in ${place}`,
    `${money(service.price)}`,
    '',
    'The page is finished. Put the business name, phone, and email on the contact lines and publish it.',
    `${studio} is one studio. This is not a local office in ${city.name}.`,
    'No reviews were written for this page. There is no promise of a ranking.'
  ].join('\n');
}

function cta() {
  const inlineOwnerForm = `<div class="owner-desk-wrap">
  <div class="owner-desk-card">
    <div class="owner-desk-kicker">DIRECT DESK · REQUEST CUSTOM SCOPE OR SAVE DEPLOYMENT NOTES</div>
    <p class="owner-desk-desc">Submit your business name, phone, email, and domain notes directly to the local intake endpoint:</p>
    <form name="owner-question" method="POST" data-netlify="true" onsubmit="return window.submitNetlifyForm ? window.submitNetlifyForm(event, 'ownerQuestionStatus') : true" class="owner-desk-form">
      <input type="hidden" name="form-name" value="owner-question">
      <input type="hidden" name="page_url" value="">
      <div class="lead-field">
        <label class="sr-only" for="ownerBizName">Your Business Name</label>
        <input id="ownerBizName" type="text" name="business_name" placeholder="Your Business Name *" aria-label="Your Business Name" required class="desk-input">
      </div>
      <div class="lead-field">
        <label class="sr-only" for="ownerPhoneInput">Your Phone Number</label>
        <input id="ownerPhoneInput" type="tel" name="owner_phone" placeholder="Your business phone *" aria-label="Your Phone Number" required class="desk-input">
      </div>
      <div class="lead-field">
        <label class="sr-only" for="ownerEmailInput">Your Email Address</label>
        <input id="ownerEmailInput" type="email" name="owner_email" placeholder="Your Email Address *" aria-label="Your Email Address" required class="desk-input">
      </div>
      <div class="lead-field">
        <label class="sr-only" for="ownerQuestionInput">Domain name or question</label>
        <input id="ownerQuestionInput" type="text" name="question" placeholder="Domain name or question..." aria-label="Domain name or question" required class="desk-input">
      </div>
      <button type="submit" class="btn-arch-copper">Send Note to Desk</button>
    </form>
    <div id="ownerQuestionStatus" class="form-status" role="status" aria-live="polite" style="display:none;"></div>
  </div>
</div>`;

  return {
    action: `<div class="offer-tiers-wrap">
  <div class="offer-utility-bar">
    <span>100% Free &amp; Open-Access — Download standalone HTML directly in your browser:</span>
    <div class="offer-utility-links">
      <button type="button" onclick="window.downloadCurrentPageBundle && window.downloadCurrentPageBundle()" class="btn-export-emerald">&darr; Download Standalone HTML</button>
      <a href="/support/" class="offer-link-light">Open-Access &amp; Support Info &rarr;</a>
    </div>
  </div>
</div>`,
    rest: inlineOwnerForm
  };
}

function pairs(list, city) {
  return list.map(([title, body]) => [fill(title, city), fill(body, city)]);
}

function tradeBody({ service, city, headline, lede, work, steps, points, faqs, slots, ask, other }) {
  const price = money(service.price);
  const place = `${city.name}, ${city.state}`;
  const homeLines = points.filter((item) => !/first screen/i.test(item));
  return `
<section class="trade" id="top">
  <div class="trade-copy">
    <p class="trade-kicker">${esc(service.name)} · ${esc(place)}</p>
    <h1>${emphCity(headline, city.name)}</h1>
    <p class="trade-lede">${esc(lede)}</p>
    <div class="trade-actions">
      <a class="t-btn" href="#estimator">60-Second Price Estimator</a>
      <a class="t-line" href="#offer">Export Standalone HTML (100% Free)</a>
    </div>
  </div>
  <div class="trade-right-col">
    <div class="trade-spec-card">
      <div class="spec-head">
        <span>LOCAL DISPATCH SPECIFICATION · ${esc(place)}</span>
        <span class="spec-status">READY FOR DOMAIN</span>
      </div>
      <div class="spec-grid">
        <div>
          <span class="spec-label">Static Output</span>
          <span class="spec-val">Zero-Framework HTML</span>
        </div>
        <div>
          <span class="spec-label">Structured Graph</span>
          <span class="spec-val">Schema.org JSON-LD</span>
        </div>
        <div>
          <span class="spec-label">Quote Intake</span>
          <span class="spec-val">60s Written Ledger</span>
        </div>
        <div>
          <span class="spec-label">Platform Retainer</span>
          <span class="spec-val">$0 / Month Forever</span>
        </div>
      </div>
    </div>
    <dl class="trade-facts">
${steps.map(([title], i) => `      <div><dt>${String(i + 1).padStart(2, '0')}</dt><dd>${esc(title)}</dd></div>`).join('\n')}
    </dl>
  </div>
</section>
<section class="trade-sect" id="work">
  <h2>The work</h2>
  <div class="trade-grid">
${work.map(([title, bodyText]) => `    <article><h3>${esc(title)}</h3><p>${esc(bodyText)}</p></article>`).join('\n')}
  </div>
</section>
<section class="trade-sect" id="job">
  <h2>How a job goes</h2>
  <ol class="trade-steps">
${steps.map(([title, bodyText], i) => `    <li><span>${String(i + 1).padStart(2, '0')}</span><strong>${esc(title)}</strong><p>${esc(bodyText)}</p></li>`).join('\n')}
  </ol>
</section>
<section class="trade-sect trade-split" id="ask">
  <div>
    <h2>Before the visit</h2>
    <ul class="trade-list">
${homeLines.map((item) => `      <li>${esc(item)}</li>`).join('\n')}
    </ul>
  </div>
  <div>
    <h2>Questions</h2>
    <div class="trade-faqs">
${faqs.map(([q, a]) => `      <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
    </div>
  </div>
</section>
<section class="trade-sect" id="estimator" aria-label="Interactive Written Price Estimator">
  <h2>Interactive 60-Second Written Estimate &amp; Callback Request</h2>
  <div class="estimator-ledger">
    <div class="estimator-controls">
      <div class="field-group">
        <label class="field-label" for="estScopeSelect">01 · Select Service Needed</label>
        <select id="estScopeSelect" class="field-control" onchange="window.updateTradeEstimate && window.updateTradeEstimate()">
          ${work.map(([title], idx) => `<option value="${idx}">${esc(title)} (${esc(city.name)})</option>`).join('\n          ')}
        </select>
      </div>
      <div class="field-group">
        <label class="field-label" for="estUrgencySelect">02 · Visit Type &amp; Dispatch Window</label>
        <select id="estUrgencySelect" class="field-control" onchange="window.updateTradeEstimate && window.updateTradeEstimate()">
          <option value="1">Standard Scheduled Visit</option>
          <option value="1.75">Full System / Multi-Area Scope</option>
          <option value="1.35">Same-Day / Priority Dispatch</option>
        </select>
      </div>
    </div>
    <div class="estimator-ticket">
      <div class="ticket-head">
        <span class="ticket-kicker">WRITTEN BALLPARK LEDGER · ${esc(place)}</span>
        <span class="ticket-tag">ZERO OBLIGATION</span>
      </div>
      <div id="estRangeOutput" class="ticket-range">$165 – $380</div>
      <p class="ticket-note">Exact written price is provided before work begins. Request a written estimate below:</p>
      <form name="trade-lead-capture" method="POST" data-netlify="true" onsubmit="return window.submitNetlifyForm ? window.submitNetlifyForm(event, 'tradeEstStatus') : true" class="inline-lead-form">
        <input type="hidden" name="form-name" value="trade-lead-capture">
        <input type="hidden" name="city" value="${esc(place)}">
        <input type="hidden" name="trade" value="${esc(service.name)}">
        <div class="lead-field">
          <label class="sr-only" for="leadCustomerName">Your Name</label>
          <input id="leadCustomerName" type="text" name="customer_name" placeholder="Your Name" aria-label="Your Name" required class="field-control">
        </div>
        <div class="lead-field">
          <label class="sr-only" for="leadCustomerPhone">Your Phone Number</label>
          <input id="leadCustomerPhone" type="tel" name="customer_phone" placeholder="Your Phone #" aria-label="Your Phone Number" required class="field-control">
        </div>
        <button type="submit" class="btn-arch-copper">Request Written Quote</button>
      </form>
      <div id="tradeEstStatus" class="form-status" role="status" aria-live="polite" style="display:none;"></div>
    </div>
  </div>
</section>
<section class="trade-contact" id="contact">
  <div>
    <h2>The owner answers here</h2>
    <p>Replace these lines with the real name, phone, and email.</p>
  </div>
  <div class="trade-lines">
${slots.map(([label, value]) => `    <p><span>${esc(label)}</span>${esc(value)}</p>`).join('\n')}
  </div>
</section>
<section class="trade-offer" id="offer" aria-label="Offer to the owner">
  <div class="trade-offer-inner">
    <div>
      <p class="trade-kicker trade-kicker-light">For the owner in ${esc(city.name)}</p>
      <h2>This page is finished. Put your name on it.</h2>
      <p>Add the business name, phone, and email to the contact lines and publish. Zero monthly agency retainer — download the standalone HTML bundle directly in your browser.</p>
    </div>
    <div class="trade-price">
      <strong>100% Free</strong>
      <span>(${esc(price)} Valuation) · Standalone HTML &amp; Schema.org Bundle · ${esc(place)}</span>
    </div>
  </div>
  ${ask.action}
  ${ask.rest}
</section>
<section class="trade-sect trade-more">
  <h2>Other finished pages in ${esc(city.name)}</h2>
  <div class="trades">
${other.map((s) => `    <a href="${esc(href('cities/' + city.slug + '/' + s.slug + '/'))}">${esc(s.name)}</a>`).join('\n')}
  </div>
  <p class="note"><a href="${esc(href('cities/' + city.slug + '/'))}">All trades in ${esc(city.name)}</a> · <a href="${esc(href('services/' + service.slug + '/'))}">${esc(service.name)} in other cities</a></p>
</section>`;
}

function offerPage(service, city) {
  const place = `${city.name}, ${city.state}`;
  const from = `cities/${city.slug}/${service.slug}`;
  const seed = service.slug + ':' + city.slug;
  const headline = fill(pick(seed + ':h1', service.headlines), city);
  const lede = fill(pick(seed + ':lede', service.ledes), city);
  const work = rotate(pairs(service.work, city), seed + ':work');
  const steps = pairs(service.steps, city);
  const points = rotate(service.points.map((item) => fill(item, city)), seed + ':points');
  const faqs = rotate(pairs(service.faqs, city), seed + ':faq');
  const slots = [['Business', 'Your name'], ['Phone', 'Your phone'], ['Email', 'Your email']].concat(service.slots || []);
  const description = `${service.name} in ${place}. A finished page. The owner adds a name and a phone.`;
  const ask = cta();
  const other = SERVICES.filter((s) => s.slug !== service.slug);
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} in ${place}`,
    serviceType: `Finished one-page site for ${service.buyer}`,
    description: service.line,
    areaServed: {
      '@type': 'City',
      name: city.name,
      address: { '@type': 'PostalAddress', addressRegion: city.state, addressCountry: 'US' }
    },
    provider: { '@type': 'Organization', name: studio },
    offers: { '@type': 'Offer', price: String(service.price), priceCurrency: 'USD' }
  };
  const pack = shotsFor(service);
  if (pack) {
    return page({
      from,
      title: `${service.name} in ${place} | ${studio}`,
      description,
      json,
      shop: { name: service.name, city: city.name },
      theme: '#FAF8F3',
      body: painterBody({ service, city, pack, headline, lede, work, steps, points, faqs, slots, ask, other }),
      foot: `<p>This is not a local office in ${esc(city.name)}. ${esc(studio)} finished the page. The owner who publishes it puts their own name, phone, and email on the contact lines. No reviews were written here.</p>`
    });
  }
  return page({
    from,
    title: `${service.name} in ${place} | ${studio}`,
    description,
    json,
    shop: { name: service.name, city: city.name },
    theme: '#FAF8F3',
    body: tradeBody({ service, city, headline, lede, work, steps, points, faqs, slots, ask, other }),
    foot: `<p>This is not a local office in ${esc(city.name)}. ${esc(studio)} finished the page. The owner who publishes it puts their own name, phone, and email on the contact lines. No reviews were written here.</p>`
  });
}

function cityPage(city) {
  const place = `${city.name}, ${city.state}`;
  const from = `cities/${city.slug}`;
  const body = `
<p class="eyebrow">${esc(studio)} · ${esc(place)}</p>
<h1>Finished pages for ${esc(city.name)}</h1>
<hr class="rule">
<p class="lede">Twenty finished pages for owners in ${esc(place)}. Open one. The owner adds their name, phone, and email. You send the page.</p>
<div class="grid">
${SERVICES.map((s) => `  <a class="card" href="${esc(href('cities/' + city.slug + '/' + s.slug + '/'))}"><h2>${esc(s.name)}</h2><p>${esc(money(s.price))} · ${esc(s.line)}</p></a>`).join('\n')}
</div>
<p class="note">This is not a local office in ${esc(city.name)}.</p>
`;
  return page({
    from,
    title: `Finished pages in ${place} | ${studio}`,
    description: `Twenty finished trade pages for owners in ${place}. One studio. A set price.`,
    json: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Finished pages in ${place}`,
      isPartOf: { '@type': 'WebSite', name: studio },
      about: { '@type': 'City', name: city.name }
    },
    body
  });
}

function servicePage(service) {
  const from = `services/${service.slug}`;
  const body = `
<p class="eyebrow">${esc(studio)} · ${esc(service.name)}</p>
<h1>${esc(service.name)}</h1>
<hr class="rule">
<p class="lede">${esc(service.line)} ${esc(money(service.price))} for the finished page. The city is on the first screen. Fifty cities. One studio.</p>
<div class="grid">
  <article class="card"><h2>Who publishes it</h2><p>${esc(service.buyer[0].toUpperCase() + service.buyer.slice(1))} who already does the work. They add their name, phone, and email on the contact lines.</p></article>
  <article class="card"><h2>Reference price</h2><p>${esc(money(service.price))} page valuation anchor. Exported standalone HTML bundles are 100% free and open-access.</p></article>
  <article class="card"><h2>What stays blank</h2><p>Owner business name, phone, and email stay blank until personalized via the synthesizer or URL parameters.</p></article>
</div>
<h2>Fifty US Cities</h2>
<div class="cities">
${CITIES.map((c) => `  <a href="${esc(href('cities/' + c.slug + '/' + service.slug + '/'))}">${esc(c.name)}, ${esc(c.state)}</a>`).join('\n')}
</div>
`;
  return page({
    from,
    title: `${service.name} | ${studio}`,
    description: `${service.name} across fifty US cities. One studio. Finished local offer pages.`,
    json: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: service.name,
      isPartOf: { '@type': 'WebSite', name: studio }
    },
    body
  });
}

function legalPage(slug, heading, subtitle, sections) {
  const body = `
<section class="legal-page">
  <p class="eyebrow">${esc(studio)} · v${esc(VERSION)}</p>
  <h1>${esc(heading)}</h1>
  <hr class="rule">
  <p class="lede">${esc(subtitle)}</p>
  <div class="legal-grid">
${sections.map(([title, copy]) => `    <article class="card"><h2>${esc(title)}</h2><p>${esc(copy)}</p></article>`).join('\n')}
  </div>
  <p class="note"><a href="/">Return to City Desk Synthesizer</a> · <a href="/services/">Browse 20 Trades</a></p>
</section>`;
  return page({
    from: slug,
    title: `${heading} | ${studio}`,
    description: subtitle,
    json: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: heading,
      description: subtitle
    },
    body
  });
}

function homePage() {
  const embeddedTrades = SERVICES.map((s) => ({
    slug: s.slug,
    name: s.name,
    price: s.price,
    line: s.line
  }));
  const defaultTrade = SERVICES[0];
  const defaultCity = CITIES[0];
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Apex Craftsman',
    areaServed: `${defaultCity.name}, ${defaultCity.state}`,
    serviceType: defaultTrade.name
  };
  const initialSnippet = [
    '<!DOCTYPE html>',
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>Apex Craftsman — ${defaultTrade.name} in ${defaultCity.name}, ${defaultCity.state}</title>`,
    `<meta name="description" content="${defaultTrade.line}">`,
    `<link rel="canonical" href="https://city-desk.netlify.app/cities/${defaultCity.slug}/${defaultTrade.slug}/">`,
    `<script type="application/ld+json">${JSON.stringify(defaultSchema).replace(/</g, '\\u003c')}</script>`,
    '</head><body><!-- Self-contained HTML bundle ready for static hosting --></body></html>'
  ].join('\n');

  const body = `
<section class="claude-hero">
  <div class="claude-hero-copy">
    <p class="eyebrow"><span class="pulse-dot" aria-hidden="true"></span>One studio · ${SERVICES.length} trades · ${CITIES.length} cities</p>
    <h1>Finished pages for one trade in one city</h1>
    <p class="lede">${esc(studio)} compiles 1,000 localized trade offer pages with deterministic copy rotation, interactive 60-second price estimators, and standalone HTML export.</p>
    <div class="claude-hero-actions">
      <a href="#studioWorkspace" class="btn-arch-copper">Open Live Synthesizer &darr;</a>
      <a href="/services/" class="btn-line">Browse 20 Trades</a>
      <span id="licenseBadge" class="license-badge">100% FREE &amp; OPEN ACCESS</span>
    </div>
  </div>
  <div class="claude-hero-card">
    <div class="spec-head">
      <span>ARCHITECTURAL STUDIO LEDGER</span>
      <span class="spec-status">1,000 LIVE PAGES</span>
    </div>
    <div class="hero-price-panel">
      <strong class="hero-price-main">100% Free</strong>
      <span class="hero-price-sub">Zero Paywalls · All 1,000 Multi-City Pages Unlocked</span>
      <p class="hero-price-note">Self-contained HTML + Schema.org JSON-LD. Zero ads. Zero rank claims.</p>
    </div>
    <div class="spec-grid">
      <div><span class="spec-label">Standalone HTML</span><span class="spec-val">100% Free</span></div>
      <div><span class="spec-label">Multi-City Forge</span><span class="spec-val">20 × 50 Matrix</span></div>
      <div><span class="spec-label">Quote Intake</span><span class="spec-val">60s Written</span></div>
      <div><span class="spec-label">Monthly Retainer</span><span class="spec-val">$0 / Forever</span></div>
    </div>
  </div>
</section>

<!-- Interactive Studio Workspace -->
<section id="studioWorkspace" class="sect studio-workspace">
  <div class="workspace-head">
    <div>
      <h2>Live Lead Page Synthesizer</h2>
      <p class="workspace-sub">Select a trade and city, inject owner contact lines, preview escaped HTML + JSON-LD live, and export a standalone bundle.</p>
    </div>
    <div class="workspace-actions">
      <button type="button" id="btnExportBundleLive" onclick="window.handleExportBundle()" class="btn-gold">
        &darr; Export Standalone HTML Bundle
      </button>
      <button type="button" onclick="window.openVipModal()" class="btn-dark-pill">
        Deployment Specs
      </button>
    </div>
  </div>

  <div class="synthesizer-controls">
    <div class="field-group">
      <label class="field-label" for="synthTradeSelect">Trade Service</label>
      <select id="synthTradeSelect" class="field-control">
        ${SERVICES.map((s) => `<option value="${esc(s.slug)}">${esc(s.name)} (${esc(money(s.price))})</option>`).join('\n        ')}
      </select>
    </div>
    <div class="field-group">
      <label class="field-label" for="synthCitySelect">Target City</label>
      <select id="synthCitySelect" class="field-control">
        ${CITIES.map((c) => `<option value="${esc(c.slug)}">${esc(c.name)}, ${esc(c.state)}</option>`).join('\n        ')}
      </select>
    </div>
    <div class="field-group">
      <label class="field-label" for="synthBizInput">Owner Company Name</label>
      <input type="text" id="synthBizInput" value="Apex Craftsman" placeholder="Your business name" class="field-control">
    </div>
    <div class="field-group">
      <label class="field-label" for="synthPhoneInput">Business Phone</label>
      <input type="tel" id="synthPhoneInput" value="" placeholder="Your business phone" class="field-control">
    </div>
  </div>

  <div class="synth-bar">
    <div class="synth-bar-actions">
      <button type="button" id="btnGeneratePreview" onclick="window.generateLivePreview()" class="btn-arch-copper">
        Live Assemble Page Preview &rarr;
      </button>
      <a id="previewLivePageLink" class="btn-line" href="/cities/${esc(defaultCity.slug)}/${esc(defaultTrade.slug)}/?biz=Apex+Craftsman">
        Open Live Page &#8599;
      </a>
    </div>
    <span id="previewStatus" class="preview-status">Ready to assemble</span>
  </div>

  <!-- Live Assembled Preview Box -->
  <div id="synthPreviewCard" class="synth-preview-card">
    <div class="synth-preview-head">
      <span class="synth-preview-badge" id="previewBadge">ASSEMBLED LEAD PAGE SPEC</span>
      <span class="synth-preview-price" id="previewPrice">${esc(money(defaultTrade.price))} · Page Reference Valuation ($0 Free Export)</span>
    </div>
    <h3 class="synth-preview-title" id="previewHeadline">${esc(defaultCity.name)}, ${esc(defaultCity.state)} ${esc(defaultTrade.name)} — Written price before work begins</h3>
    <p class="synth-preview-lede" id="previewLede">Serving ${esc(defaultCity.name)}, ${esc(defaultCity.state)}. Apex Craftsman — ${esc(defaultTrade.line)}</p>
    <div class="synth-preview-meta">
      <div><strong>Company:</strong> <span id="previewBiz">Apex Craftsman</span></div>
      <div><strong>Phone:</strong> <span id="previewPhone">Your business phone</span></div>
      <div><strong>Target Market:</strong> <span id="previewCity">${esc(defaultCity.name)}, ${esc(defaultCity.state)}</span></div>
    </div>
  </div>

  <!-- Standalone Output Preview Section -->
  <div id="bundlePreviewSection" class="bundle-preview-section">
    <div id="bundlePreviewContent" class="bundle-preview-content">
      <pre><code id="bundlePreviewCode">${esc(initialSnippet)}</code></pre>
    </div>
  </div>
  <script id="cityDeskTradesData" type="application/json">${jsonLd(embeddedTrades)}</script>
</section>

<h2>Trades</h2>
<div class="grid">
${SERVICES.map((s) => `  <a class="card" href="${esc(href('services/' + s.slug + '/'))}"><h2>${esc(s.name)}</h2><p>${esc(money(s.price))} · ${esc(s.line)}</p></a>`).join('\n')}
</div>
<h2>Cities</h2>
<p class="note">Fifty mid-size cities. This is not a survey of who else is selling there. A page does not become a local company because the city is in the headline.</p>
<div class="cities">
${CITIES.map((c) => `  <a href="${esc(href('cities/' + c.slug + '/'))}">${esc(c.name)}, ${esc(c.state)}</a>`).join('\n')}
</div>
`;
  return page({
    from: '',
    title: `${studio} — finished pages for one trade in one city`,
    description: 'One studio finishes one page for one trade in one city. Twenty trades, fifty mid-size cities, standalone HTML & Schema.org export.',
    json: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: studio,
      description: 'A finished page for one trade in one city, from one studio.'
    },
    body
  });
}

function servicesIndex() {
  const from = 'services';
  const body = `
<p class="eyebrow">${esc(studio)}</p>
<h1>Trades</h1>
<hr class="rule">
<p class="lede">Twenty finished pages a solo studio can send. Each one is the site for an owner who already does the work.</p>
<div class="grid">
${SERVICES.map((s) => `  <a class="card" href="${esc(href('services/' + s.slug + '/'))}"><h2>${esc(s.name)}</h2><p>${esc(money(s.price))} · ${esc(s.buyer)}</p></a>`).join('\n')}
</div>
`;
  return page({
    from,
    title: `Trades | ${studio}`,
    description: 'Twenty finished trade pages. One studio. Standalone HTML export.',
    json: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Trades', isPartOf: { '@type': 'WebSite', name: studio } },
    body
  });
}

function write(rel, contents) {
  const file = path.join(SITE, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function build() {
  if (fs.existsSync(SITE)) fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'style.css'), path.join(SITE, 'style.css'));
  copyTree(path.join(ROOT, 'media'), path.join(SITE, 'media'));
  if (fs.existsSync(path.join(ROOT, 'media', 'favicon.ico'))) {
    fs.copyFileSync(path.join(ROOT, 'media', 'favicon.ico'), path.join(SITE, 'favicon.ico'));
  }
  if (fs.existsSync(path.join(ROOT, 'city_engine.js'))) {
    fs.copyFileSync(path.join(ROOT, 'city_engine.js'), path.join(SITE, 'city_engine.js'));
  }

  const slugs = new Set();
  for (const city of CITIES) {
    if (slugs.has(city.slug)) throw new Error('Duplicate city slug ' + city.slug);
    slugs.add(city.slug);
  }
  const serviceSlugs = new Set();
  for (const service of SERVICES) {
    if (serviceSlugs.has(service.slug)) throw new Error('Duplicate service slug ' + service.slug);
    serviceSlugs.add(service.slug);
    if (!service.headlines || service.headlines.length < 3) throw new Error('Need 3 headlines for ' + service.slug);
    if (!service.ledes || service.ledes.length < 3) throw new Error('Need 3 ledes for ' + service.slug);
    if (!service.work || service.work.length < 3) throw new Error('Need 3 work blocks for ' + service.slug);
    if (!service.line) throw new Error('Need a line for ' + service.slug);
  }
  if (SERVICES.length !== 20) throw new Error('Expected 20 services, got ' + SERVICES.length);
  if (CITIES.length !== 50) throw new Error('Expected 50 cities, got ' + CITIES.length);

  write('index.html', homePage());
  write('services/index.html', servicesIndex());
  write('terms/index.html', legalPage(
    'terms',
    'Terms of Use',
    'City Desk v2.6.0 is released under the MIT License for local compilation and static web publishing.',
    [
      ['Open-Access License', 'All 1,000 compiled HTML templates, standalone exports, and local workstation APIs are 100% free and unlocked under the MIT License.'],
      ['Owner Accuracy', 'Each exported page starts with blank business name, phone, and email fields. Publishers are responsible for verifying their own license numbers, prices, and local compliance.'],
      ['No Ranking Guarantees', 'City Desk generates clean semantic HTML and Schema.org JSON-LD. It makes no claim or guarantee regarding third-party search engine placement.']
    ]
  ));
  write('privacy/index.html', legalPage(
    'privacy',
    'Privacy & Local-First Hygiene',
    'City Desk executes locally with zero third-party analytics, zero CDN font egress, and strict loopback isolation.',
    [
      ['Zero External Egress', 'Fonts (Newsreader and Outfit) and styles are self-hosted in /media/fonts/. No requests are sent to Google Fonts, ad networks, or external telemetry endpoints.'],
      ['Loopback Security', 'The local workstation server binds to 127.0.0.1:8087 with strict path containment, Host/Origin allowlists, and a 1 MiB body limit.'],
      ['Local Lead Receipts', 'Submissions to POST /api/lead store anonymized receipt metadata locally in XDG state storage with owner-only permissions (0600).']
    ]
  ));
  write('support/index.html', legalPage(
    'support',
    'Support & Voluntary Tips',
    'City Desk is engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform with zero paywalls.',
    [
      ['Source & Issue Tracker', 'Source code, documentation, and issue tracking live on GitHub at github.com/1nc0gn30/city-desk.'],
      ['Optional Voluntary Support', 'If City Desk saves you engineering time, you can leave a voluntary tip via the Buy Us a Coffee (Stripe) or Solana tip links in the footer below.'],
      ['Local CLI & Workstation', 'Run `city-desk --status --json`, `city-desk --serve`, or `city-desk-tui --json` from any terminal on ZothOS.']
    ]
  ));
  write('404.html', page({
    from: '',
    title: `Not on this desk | ${studio}`,
    description: 'That page is not on this desk.',
    json: { '@context': 'https://schema.org', '@type': 'WebSite', name: studio },
    body: `<h1>That page is not on this desk.</h1><p><a href="/">Back to ${esc(studio)}</a></p>`
  }));

  const offers = [];
  for (const service of SERVICES) write(`services/${service.slug}/index.html`, servicePage(service));
  for (const city of CITIES) {
    write(`cities/${city.slug}/index.html`, cityPage(city));
    for (const service of SERVICES) {
      const rel = `cities/${city.slug}/${service.slug}/index.html`;
      write(rel, offerPage(service, city));
      offers.push({
        city: city.name,
        state: city.state,
        service: service.slug,
        price: service.price,
        path: `/cities/${city.slug}/${service.slug}/`
      });
    }
  }
  write('offers.json', JSON.stringify(offers, null, 2) + '\n');

  const paths = [
    '/',
    '/services/',
    '/terms/',
    '/privacy/',
    '/support/',
    ...SERVICES.map((s) => `/services/${s.slug}/`),
    ...CITIES.map((c) => `/cities/${c.slug}/`),
    ...offers.map((o) => o.path)
  ];
  const base = (origin || '').replace(/\/$/, '');
  const locs = paths.map((p) => `  <url><loc>${esc(base + p)}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs}\n</urlset>\n`);

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    'User-agent: ClaudeBot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    'User-agent: PerplexityBot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    'User-agent: Applebot',
    'Allow: /',
    'Crawl-delay: 0',
    '',
    base ? `Sitemap: ${base}/sitemap.xml` : 'Sitemap: https://city-desk.netlify.app/sitemap.xml'
  ];
  write('robots.txt', robots.join('\n') + '\n');

  write('llms.txt', `# City Desk v${VERSION} (Neal Frazier Tech • NullAI Platform)
> 1,000 Finished Local Trade Websites & Interactive Lead Synthesizers Across 50 US Cities and 20 Service Trades — Engineered by Neal Frazier Tech (@1nc0gn30).

- **Canonical URL**: https://city-desk.netlify.app
- **Creator**: Neal Frazier Tech (@1nc0gn30) — https://nullai.tech
- **Contact**: ${replyTo || 'https://nullai.tech'}
- **Machine-Readable Web APIs**:
  - \`https://city-desk.netlify.app/api/index.json\`
  - \`https://city-desk.netlify.app/api/services.json\`
  - \`https://city-desk.netlify.app/api/faq.json\`
  - \`https://city-desk.netlify.app/offers.json\`
  - \`https://city-desk.netlify.app/.well-known/agent.json\`
  - \`https://city-desk.netlify.app/.well-known/mcp.json\`

## Open-Access Fulfillment
- **Standalone HTML + Schema.org Bundle ($0 / Open-Access)**: 100% free and unlocked across all 1,000 localized trade pages.
- **Optional Support**: ${STRIPE_COFFEE_URL}
`);

  write('llms-full.txt', `# City Desk v${VERSION} — Complete 1,000-Page Local Trade Directory Specification
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform (https://nullai.tech).

## 20 Covered Service Trades
${SERVICES.map((s) => `- **${s.name}** (\`/services/${s.slug}/\`): ${s.line}`).join('\n')}

## 50 Covered US Cities
${CITIES.map((c) => `- **${c.name}, ${c.state}** (\`/cities/${c.slug}/\`)`).join('\n')}
`);

  write('api/index.json', JSON.stringify({
    status: 'ok',
    version: VERSION,
    name: 'City Desk Local Trade Web API',
    creator: 'Neal Frazier Tech (@1nc0gn30) • NullAI Platform',
    url: 'https://city-desk.netlify.app',
    totalPages: offers.length,
    citiesCount: CITIES.length,
    servicesCount: SERVICES.length,
    endpoints: {
      offers: 'https://city-desk.netlify.app/offers.json',
      services: 'https://city-desk.netlify.app/api/services.json',
      faq: 'https://city-desk.netlify.app/api/faq.json',
      agentCard: 'https://city-desk.netlify.app/.well-known/agent.json'
    }
  }, null, 2) + '\n');

  write('api/services.json', JSON.stringify({
    version: VERSION,
    provider: 'Neal Frazier Tech (@1nc0gn30) • NullAI Platform',
    license: '100% Free & Open Access',
    supportUrl: STRIPE_COFFEE_URL,
    trades: SERVICES.map((s) => ({ slug: s.slug, name: s.name, line: s.line, agencyValueUSD: s.price }))
  }, null, 2) + '\n');

  write('api/faq.json', JSON.stringify({
    faqs: [
      { question: 'Is City Desk 100% free and open-access?', answer: 'Yes. All 1,000 localized trade pages, live customizers, and standalone HTML + Schema.org bundle downloads are 100% free and unlocked by default.' },
      { question: 'Are there any monthly agency retainers?', answer: 'No. Standalone HTML exports run statically on any host without recurring retainers.' }
    ]
  }, null, 2) + '\n');

  write('.well-known/agent.json', JSON.stringify({
    schema_version: '1.0',
    version: VERSION,
    name: 'City Desk — Local Trade Offer Page Compiler',
    provider: 'Neal Frazier Tech (@1nc0gn30) • NullAI Platform',
    url: 'https://city-desk.netlify.app',
    contact: { email: replyTo || 'contact@nullai.tech', web: 'https://nullai.tech' },
    apis: {
      index: 'https://city-desk.netlify.app/api/index.json',
      services: 'https://city-desk.netlify.app/api/services.json',
      offers: 'https://city-desk.netlify.app/offers.json',
      llmsTxt: 'https://city-desk.netlify.app/llms.txt'
    }
  }, null, 2) + '\n');

  write('.well-known/mcp.json', JSON.stringify({
    mcpVersion: '2025-01-01',
    name: 'city-desk-discovery',
    version: VERSION,
    provider: 'Neal Frazier Tech (@1nc0gn30) • NullAI Platform',
    resources: [
      { uri: 'https://city-desk.netlify.app/api/services.json', name: '20 Service Trade Blueprints', mimeType: 'application/json' },
      { uri: 'https://city-desk.netlify.app/offers.json', name: '1,000 City x Trade Pages', mimeType: 'application/json' }
    ]
  }, null, 2) + '\n');

  write('_headers', [
    '/*',
    '  X-Frame-Options: SAMEORIGIN',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
    '',
    '/api/*',
    '  Content-Type: application/json; charset=utf-8',
    '',
    '/.well-known/*',
    '  Content-Type: application/json; charset=utf-8',
    '',
    '/llms.txt',
    '  Content-Type: text/plain; charset=utf-8',
    '',
    '/llms-full.txt',
    '  Content-Type: text/plain; charset=utf-8',
    ''
  ].join('\n'));

  write('_redirects', [
    '/cities/:city/:trade/* /cities/boise-id/:trade/index.html 200',
    '/cities/:city/:trade /cities/boise-id/:trade/index.html 200',
    '/cities/:city/* /cities/boise-id/index.html 200',
    ''
  ].join('\n'));

  check(offers);
  console.log(`Built ${offers.length} finished pages (v${VERSION}) in ${SITE}`);
}

const BANNED = [
  /only 2/i,
  /only two/i,
  /lorem ipsum/i,
  /#1\s/,
  /page one of google/i,
  /will rank/i,
  /guaranteed/i,
  /unsaturated/i,
  /limited time/i,
  /act now/i,
  /five stars/i,
  /our crew in/i,
  /we are based in/i,
  /draft outline/i,
  /specimen only/i,
  /handoff sheet/i,
  /948[^0-9]?204/
];

function check(offers) {
  if (offers.length !== 1000) throw new Error('Expected 1000 offers, got ' + offers.length);
  const titles = new Set();
  const painterBodies = new Set();
  for (const offer of offers) {
    const rel = offer.path.slice(1) + 'index.html';
    const html = fs.readFileSync(path.join(SITE, rel), 'utf8');
    if (!html.includes(offer.city)) throw new Error('Missing city in ' + rel);
    if (!html.includes(offer.state)) throw new Error('Missing state in ' + rel);
    if (!html.includes('<h1')) throw new Error('Missing h1 in ' + rel);
    if (!html.includes('id="work"')) throw new Error('Missing work in ' + rel);
    if (!html.includes('id="contact"')) throw new Error('Missing contact in ' + rel);
    if (!html.includes('Your phone')) throw new Error('Missing phone line in ' + rel);
    if (!html.includes('application/ld+json')) throw new Error('Missing json-ld in ' + rel);
    if (!html.includes('not a local office')) throw new Error('Missing office line in ' + rel);
    if (!html.includes('$' + offer.price.toLocaleString('en-US'))) throw new Error('Missing price in ' + rel);
    if (!html.includes('style.css')) throw new Error('Missing css in ' + rel);
    if (html.includes('aggregateRating')) throw new Error('Unexpected rating in ' + rel);
    for (const rule of BANNED) {
      if (rule.test(html)) throw new Error('Banned ' + rule + ' in ' + rel);
    }
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    if (titles.has(title)) throw new Error('Duplicate title ' + title);
    titles.add(title);
    if (offer.service === 'painters') {
      const stripped = html.replaceAll(offer.city, '').replaceAll(offer.state, '');
      painterBodies.add(stripped);
    }
  }
  if (painterBodies.size < 3) throw new Error('Painter pages are the same text with the city swapped');
  const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  if (!home.includes('not a survey')) throw new Error('Home page is missing the city-list limit');
  if (!home.includes('Finished pages')) throw new Error('Home page is still a pitch');
  if (/948[^0-9]?204/.test(home)) throw new Error('Phone PII leaked in home page');
  if (!fs.existsSync(path.join(SITE, 'robots.txt'))) throw new Error('Missing robots.txt');
  if (!fs.existsSync(path.join(SITE, 'sitemap.xml'))) throw new Error('Missing sitemap.xml');
  if (!fs.existsSync(path.join(SITE, 'style.css'))) throw new Error('Missing style.css');
  if (!fs.existsSync(path.join(SITE, 'terms/index.html'))) throw new Error('Missing terms page');
  if (!fs.existsSync(path.join(SITE, 'privacy/index.html'))) throw new Error('Missing privacy page');
  if (!fs.existsSync(path.join(SITE, 'support/index.html'))) throw new Error('Missing support page');
  const med = fs.readFileSync(path.join(SITE, 'cities/corpus-christi-tx/med-spas/index.html'), 'utf8');
  if (!med.includes('clinician decides')) throw new Error('Med spa page lost the clinician line');
  const painted = fs.readFileSync(path.join(SITE, 'cities/boise-id/painters/index.html'), 'utf8');
  if (!painted.includes('/media/painters/hero.jpg')) throw new Error('Painter hero image missing');
  if (!painted.includes('alt="')) throw new Error('Painter page is missing alt text');
  if (!painted.includes('class="front"')) throw new Error('Painter page lost the front');
  if (painted.includes('class="trade"')) throw new Error('Painter page picked up the trade layout');
  const plumber = fs.readFileSync(path.join(SITE, 'cities/boise-id/plumbers/index.html'), 'utf8');
  if (!plumber.includes('class="trade"')) throw new Error('Plumber page lost the trade layout');
  if (!plumber.includes('id="offer"')) throw new Error('Plumber page lost the offer block');
  if (plumber.includes('class="front"')) throw new Error('Plumber page picked up the painter layout');
  if (plumber.includes('The city is on the first screen')) throw new Error('Owner pitch is still on the plumber page');
  if (!painted.includes('/media/painters/exterior.jpg')) throw new Error('Painter exterior still missing');
  if (!fs.existsSync(path.join(SITE, 'media/painters/hero.jpg'))) throw new Error('Hero file was not copied');
}

build();
