/**
 * City Desk — Interactive Trade Page Synthesizer, Dual-Theme Controller & Standalone HTML Exporter (v2.6.0)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'zoth-theme-mode';

  function escHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function safeJsonLd(obj) {
    return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
  }

  function safePhoneHref(phone) {
    return String(phone || '').replace(/[^0-9+]/g, '');
  }

  function resolveInitialTheme() {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = (params.get('theme') || '').trim().toLowerCase();
      if (q === 'dark' || q === 'light') return q;
      const stored = (localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('cd_theme') || '').trim().toLowerCase();
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (_e) {}
    return 'light';
  }

  function applyTheme(theme, persist) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', normalized);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', normalized === 'dark' ? '#08080B' : '#FAF8F3');
    }
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = normalized === 'dark' ? '☀ Light' : '☾ Dark';
      btn.setAttribute('aria-pressed', normalized === 'dark' ? 'true' : 'false');
      btn.setAttribute('title', normalized === 'dark' ? 'Switch to Editorial Ivory Light Mode' : 'Switch to Obsidian Gold Dark Mode');
    }
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
        localStorage.setItem('cd_theme', normalized);
      } catch (_e) {}
    }
  }

  window.toggleCityDeskTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark', true);
  };

  function setupThemeSync() {
    applyTheme(resolveInitialTheme(), false);

    window.addEventListener('message', function (ev) {
      try {
        const origin = ev.origin || '';
        const isLocal =
          origin === window.location.origin ||
          /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);
        if (!isLocal) return;
        const data = ev.data;
        if (data && data.type === 'zoth-theme' && (data.theme === 'dark' || data.theme === 'light')) {
          applyTheme(data.theme, true);
        }
      } catch (_e) {}
    });

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = function (e) {
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('theme')) return;
          if (localStorage.getItem(THEME_STORAGE_KEY)) return;
          applyTheme(e.matches ? 'dark' : 'light', false);
        } catch (_e) {}
      };
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange);
      }
    }
  }

  function loadEmbeddedTrades() {
    const el = document.getElementById('cityDeskTradesData');
    if (!el) return {};
    try {
      const list = JSON.parse(el.textContent || '[]');
      const map = {};
      if (Array.isArray(list)) {
        list.forEach(function (t) {
          if (t && t.slug) map[t.slug] = t;
        });
      }
      return map;
    } catch (_e) {
      return {};
    }
  }

  function init() {
    setupThemeSync();
    applyProspectPersonalization();
    setupEventListeners();
    if (document.getElementById('synthTradeSelect')) {
      window.generateLivePreview(true);
    }
  }

  function applyProspectPersonalization() {
    try {
      const params = new URLSearchParams(window.location.search);
      const biz = (params.get('biz') || localStorage.getItem('cd_last_biz') || '').trim();
      const phone = (params.get('phone') || localStorage.getItem('cd_last_phone') || '').trim();
      const email = (params.get('email') || localStorage.getItem('cd_last_email') || '').trim();
      let customCity = (params.get('city') || '').trim();
      const siteUrl = (params.get('site') || '').trim();

      if (!customCity) {
        const pathMatch = window.location.pathname.match(/\/cities\/([a-z0-9-]+)-([a-z]{2})\//i);
        if (pathMatch) {
          const derivedCity = pathMatch[1]
            .split('-')
            .map(function (w) {
              return w.charAt(0).toUpperCase() + w.slice(1);
            })
            .join(' ');
          const derivedState = pathMatch[2].toUpperCase();
          if (derivedCity.toLowerCase() !== 'boise') {
            customCity = derivedCity + ', ' + derivedState;
          }
        }
      }

      if (params.get('biz')) localStorage.setItem('cd_last_biz', params.get('biz').trim());
      if (params.get('phone')) localStorage.setItem('cd_last_phone', params.get('phone').trim());
      if (params.get('email')) localStorage.setItem('cd_last_email', params.get('email').trim());

      const vipBiz = document.getElementById('vipBizName');
      const vipPhone = document.getElementById('vipOwnerPhone');
      const vipEmail = document.getElementById('vipOwnerEmail');
      const vipQuickBiz = document.getElementById('vipQuickBiz');
      const vipQuickPhone = document.getElementById('vipQuickPhone');
      if (biz && vipBiz && !vipBiz.value) vipBiz.value = biz;
      if (phone && vipPhone && !vipPhone.value) vipPhone.value = phone;
      if (email && vipEmail && !vipEmail.value) vipEmail.value = email;
      if (biz && vipQuickBiz && !vipQuickBiz.value) vipQuickBiz.value = biz;
      if (phone && vipQuickPhone && !vipQuickPhone.value) vipQuickPhone.value = phone;

      const pageUrlInput = document.querySelector('form[name="owner-question"] input[name="page_url"]');
      if (pageUrlInput) pageUrlInput.value = window.location.href;

      if (!params.get('biz') && !params.get('phone') && !params.get('email') && !customCity) return;

      const bizIn = document.getElementById('synthBizInput');
      const phoneIn = document.getElementById('synthPhoneInput');
      if (biz && bizIn) bizIn.value = biz;
      if (phone && phoneIn) phoneIn.value = phone;

      document.querySelectorAll('.trade-lines p, .reach-lines p').forEach(function (p) {
        const span = p.querySelector('span');
        if (!span) return;
        const label = span.textContent.trim().toLowerCase();
        if (label === 'business' && biz) {
          p.textContent = '';
          p.appendChild(span);
          p.appendChild(document.createTextNode(biz));
        } else if (label === 'phone' && phone) {
          p.textContent = '';
          p.appendChild(span);
          p.appendChild(document.createTextNode(phone));
        } else if (label === 'email' && email) {
          p.textContent = '';
          p.appendChild(span);
          p.appendChild(document.createTextNode(email));
        }
      });

      if (customCity) {
        const cityOnly = customCity.split(',')[0].trim();
        const h1Em = document.querySelector('h1 em');
        if (h1Em && cityOnly) h1Em.textContent = cityOnly;
        const markSpan = document.querySelector('.bar .mark .mark-city, .bar .mark span');
        if (markSpan && window.location.pathname.indexOf('/cities/') === 0) {
          markSpan.textContent = customCity;
        }
      }

      if (biz && window.location.pathname.indexOf('/cities/') === 0) {
        document.title = biz + (customCity ? ' (' + customCity + ')' : '') + ' — ' + document.title;
        const mark = document.querySelector('.bar .mark');
        if (mark) {
          mark.setAttribute('title', biz + (customCity ? ' — ' + customCity : ''));
          const bizEl = mark.querySelector('.mark-biz');
          if (bizEl) bizEl.textContent = biz;
        }
        const kicker = document.querySelector('.trade-kicker, .front-copy .kicker');
        if (kicker && kicker.textContent.indexOf(biz) === -1) {
          const tape = kicker.querySelector('.tape');
          kicker.textContent = biz + ' · ' + (customCity || kicker.textContent.trim());
          if (tape) kicker.insertBefore(tape, kicker.firstChild);
        }
        const offerH2 = document.querySelector('#offer h2');
        if (offerH2) {
          offerH2.textContent = 'Prepared for ' + biz + '. Put it on your domain today.';
        }

        const offerSect = document.getElementById('offer') || document.getElementById('estimator');
        if (offerSect && !document.getElementById('personalizedOwnerBanner')) {
          const banner = document.createElement('div');
          banner.id = 'personalizedOwnerBanner';
          banner.className = 'owner-preview-wrap';

          const bar = document.createElement('div');
          bar.className = 'owner-preview-bar';

          const copy = document.createElement('div');
          copy.className = 'owner-preview-copy';

          const kickerDiv = document.createElement('div');
          kickerDiv.className = 'owner-preview-kicker';
          const dot = document.createElement('span');
          dot.className = 'dot';
          kickerDiv.appendChild(dot);
          const siteLabel = siteUrl ? ' · ' + siteUrl.replace(/^https?:\/\//i, '') : '';
          kickerDiv.appendChild(document.createTextNode('LIVE PREVIEW & SCHEMA GRAPH · ' + biz + siteLabel));

          const desc = document.createElement('p');
          desc.className = 'owner-preview-desc';
          desc.appendChild(document.createTextNode('Pre-configured for '));
          const strongBiz = document.createElement('strong');
          strongBiz.textContent = biz;
          desc.appendChild(strongBiz);
          const detailParts = [];
          if (phone) detailParts.push(phone);
          if (customCity) detailParts.push(customCity);
          if (detailParts.length) {
            desc.appendChild(document.createTextNode(' (' + detailParts.join(' · ') + ')'));
          }
          desc.appendChild(
            document.createTextNode(
              '. Export the standalone HTML + Schema.org JSON-LD pack for free, or open deployment specs.'
            )
          );

          copy.appendChild(kickerDiv);
          copy.appendChild(desc);

          const actions = document.createElement('div');
          actions.className = 'owner-preview-actions';

          const dlBtn = document.createElement('button');
          dlBtn.type = 'button';
          dlBtn.className = 'btn-arch-primary';
          dlBtn.textContent = '↓ Download Standalone HTML';
          dlBtn.addEventListener('click', function () {
            window.downloadCurrentPageBundle();
          });

          const modalBtn = document.createElement('button');
          modalBtn.type = 'button';
          modalBtn.className = 'btn-arch-ghost';
          modalBtn.textContent = 'Deployment Specs';
          modalBtn.addEventListener('click', function () {
            window.openVipModal();
          });

          actions.appendChild(dlBtn);
          actions.appendChild(modalBtn);
          bar.appendChild(copy);
          bar.appendChild(actions);
          banner.appendChild(bar);
          offerSect.parentNode.insertBefore(banner, offerSect);
        }
      }
    } catch (_e) {}
  }

  window.openVipModal = function () {
    const modal = document.getElementById('vipModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  };

  window.closeVipModal = function () {
    const modal = document.getElementById('vipModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  window.buildStandaloneHtmlString = function (opts) {
    const biz = String((opts && opts.biz) || 'Your Business Name').trim();
    const phone = String((opts && opts.phone) || '').trim();
    const email = String((opts && opts.email) || '').trim();
    const pageH1 = String((opts && opts.headline) || (biz + ' — Written Estimate Before Work Begins')).trim();
    const pageLede = String((opts && opts.lede) || 'You see the written price with full scope, materials, and schedule before work begins.').trim();
    const pageKicker = String((opts && opts.kicker) || 'Local Service & Written Estimates').trim();
    const workItems = Array.isArray(opts && opts.workItems) && opts.workItems.length
      ? opts.workItems
      : [
          { title: 'Written Scope & Upfront Price', body: 'Every job starts with a clear written scope listing prep, materials, and final total before work begins.' },
          { title: 'Direct Owner Scheduling', body: 'Speak directly with the owner/operator. Clear arrival windows and daily progress updates.' },
          { title: 'Final Walkthrough & Warranty', body: 'We walk the finished job together before final sign-off.' }
        ];

    const phoneClean = safePhoneHref(phone);
    const schemaObj = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: biz,
      description: pageLede
    };
    if (phone) schemaObj.telephone = phone;
    if (email) schemaObj.email = email;

    const callBtnHtml = phoneClean
      ? '<a class="call-btn" href="tel:' + escHtml(phoneClean) + '">Call ' + escHtml(phone) + '</a>'
      : '<a class="call-btn" href="#contact">Request Written Estimate</a>';

    const contactPhoneHtml = phoneClean
      ? '<a href="tel:' + escHtml(phoneClean) + '" style="color:#fdba74;text-decoration:none;font-weight:700;">' + escHtml(phone) + '</a>'
      : '<span>Add your phone number</span>';

    const contactEmailHtml = email
      ? '<a href="mailto:' + escHtml(email) + '" style="color:#fdba74;text-decoration:none;">' + escHtml(email) + '</a>'
      : '<span>Add your email address</span>';

    const workCardsHtml = workItems
      .map(function (w) {
        return '<article class="card"><h3>' + escHtml(w.title) + '</h3><p>' + escHtml(w.body) + '</p></article>';
      })
      .join('\n        ');

    return '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + escHtml(biz) + ' — ' + escHtml(pageKicker) + '</title>\n' +
      '<meta name="description" content="' + escHtml(biz + ': ' + pageLede + (phone ? ' Call ' + phone + '.' : '')) + '">\n' +
      '<style>\n' +
      '  :root { --bg: #f6f2eb; --ink: #171614; --muted: #5c564c; --accent: #9a3412; --card: #ffffff; --line: #ddd4c7; }\n' +
      '  * { box-sizing: border-box; }\n' +
      '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Georgia, serif; margin: 0; background: var(--bg); color: var(--ink); line-height: 1.6; }\n' +
      '  .wrap { max-width: 980px; margin: 0 auto; padding: 28px 20px 64px; }\n' +
      '  header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid var(--line); margin-bottom: 36px; }\n' +
      '  .brand { font-weight: 800; font-size: 20px; letter-spacing: -0.02em; }\n' +
      '  .call-btn { display: inline-block; background: var(--accent); color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 999px; font-weight: 700; font-size: 14px; }\n' +
      '  .kicker { color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; margin-bottom: 10px; }\n' +
      '  h1 { font-size: clamp(32px, 5vw, 52px); line-height: 1.08; margin: 0 0 16px; letter-spacing: -0.02em; }\n' +
      '  .lede { font-size: 19px; color: var(--muted); max-width: 680px; margin: 0 0 28px; }\n' +
      '  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin: 36px 0; }\n' +
      '  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 24px; }\n' +
      '  .card h3 { margin: 0 0 8px; font-size: 18px; }\n' +
      '  .card p { margin: 0; color: var(--muted); font-size: 15px; }\n' +
      '  .contact-box { background: #171614; color: #f7f3ec; border-radius: 16px; padding: 32px; margin-top: 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; align-items: center; }\n' +
      '  .contact-box h2 { margin: 0 0 8px; font-size: 28px; }\n' +
      '  .contact-lines p { margin: 8px 0; font-size: 16px; }\n' +
      '  .contact-lines span { display: inline-block; width: 90px; color: #a8a29e; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }\n' +
      '</style>\n' +
      '<script type="application/ld+json">\n' +
      safeJsonLd(schemaObj) + '\n' +
      '</script>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="wrap">\n' +
      '    <header>\n' +
      '      <div class="brand">' + escHtml(biz) + '</div>\n' +
      '      ' + callBtnHtml + '\n' +
      '    </header>\n' +
      '    <main>\n' +
      '      <div class="kicker">' + escHtml(pageKicker) + '</div>\n' +
      '      <h1>' + escHtml(pageH1) + '</h1>\n' +
      '      <p class="lede">' + escHtml(pageLede) + '</p>\n' +
      '      ' + callBtnHtml + '\n' +
      '      <section class="grid">\n' +
      '        ' + workCardsHtml + '\n' +
      '      </section>\n' +
      '      <section class="contact-box" id="contact">\n' +
      '        <div>\n' +
      '          <h2>Direct Owner Contact</h2>\n' +
      '          <p style="color:#d6d3d1;margin:0;">Call or email directly for a written estimate before work begins.</p>\n' +
      '        </div>\n' +
      '        <div class="contact-lines">\n' +
      '          <p><span>Business</span> <strong>' + escHtml(biz) + '</strong></p>\n' +
      '          <p><span>Phone</span> ' + contactPhoneHtml + '</p>\n' +
      '          <p><span>Email</span> ' + contactEmailHtml + '</p>\n' +
      '        </div>\n' +
      '      </section>\n' +
      '    </main>\n' +
      '  </div>\n' +
      '</body>\n' +
      '</html>\n';
  };

  window.downloadCurrentPageBundle = function () {
    const bizEl = document.getElementById('vipQuickBiz') || document.getElementById('vipBizName') || document.getElementById('synthBizInput');
    const phoneEl = document.getElementById('vipQuickPhone') || document.getElementById('vipOwnerPhone') || document.getElementById('synthPhoneInput');
    const emailEl = document.getElementById('vipOwnerEmail');

    const params = new URLSearchParams(window.location.search);
    const biz = (bizEl && bizEl.value.trim()) || params.get('biz') || localStorage.getItem('cd_last_biz') || 'Your Business Name';
    const phone = (phoneEl && phoneEl.value.trim()) || params.get('phone') || localStorage.getItem('cd_last_phone') || '';
    const email = (emailEl && emailEl.value.trim()) || params.get('email') || localStorage.getItem('cd_last_email') || '';

    const previewH = document.getElementById('previewHeadline');
    const previewL = document.getElementById('previewLede');
    const tradeEl = document.getElementById('synthTradeSelect');
    const cityEl = document.getElementById('synthCitySelect');

    let pageH1 = '';
    let pageLede = '';
    let pageKicker = '';
    if (previewH && tradeEl && cityEl) {
      const tradeName = tradeEl.options[tradeEl.selectedIndex].text.split('(')[0].trim();
      const cityName = cityEl.options[cityEl.selectedIndex].text.trim();
      pageH1 = previewH.textContent.trim();
      pageLede = previewL ? previewL.textContent.trim() : '';
      pageKicker = tradeName + ' · ' + cityName;
    } else {
      pageH1 = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : (biz + ' — Written Estimate Before Work Begins');
      pageLede = document.querySelector('.trade-lede, .front-lede, .lede')
        ? document.querySelector('.trade-lede, .front-lede, .lede').textContent.trim()
        : 'You see the written price with full scope, materials, and schedule before work begins.';
      pageKicker = document.querySelector('.trade-kicker, .front-copy .kicker, .eyebrow')
        ? document.querySelector('.trade-kicker, .front-copy .kicker, .eyebrow').textContent.trim()
        : 'Local Service & Written Estimates';
    }

    const workItems = [];
    document.querySelectorAll('#work article, .plates article').forEach(function (el) {
      const h = el.querySelector('h3, strong');
      const p = el.querySelector('p');
      if (h && p) {
        workItems.push({ title: h.textContent.trim(), body: p.textContent.trim() });
      }
    });

    const standaloneHtml = window.buildStandaloneHtmlString({
      biz: biz,
      phone: phone,
      email: email,
      headline: pageH1,
      lede: pageLede,
      kicker: pageKicker,
      workItems: workItems
    });

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (biz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'city-desk-page') + '-site.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded standalone HTML bundle for ' + biz + '.');
  };

  window.handleExportBundle = function () {
    window.downloadCurrentPageBundle();
  };

  window.updateTradeEstimate = function () {
    const scopeEl = document.getElementById('estScopeSelect');
    const urgEl = document.getElementById('estUrgencySelect');
    const outEl = document.getElementById('estRangeOutput');
    if (!outEl) return;
    const scopeIdx = scopeEl ? parseInt(scopeEl.value || '0', 10) : 0;
    const mult = urgEl ? parseFloat(urgEl.value || '1') : 1;
    const basePairs = [
      [185, 420],
      [340, 780],
      [650, 1450],
      [1200, 2900]
    ];
    const pair = basePairs[Math.abs(scopeIdx) % basePairs.length];
    const low = Math.round((pair[0] * mult) / 5) * 5;
    const high = Math.round((pair[1] * mult) / 5) * 5;
    outEl.textContent = '$' + low.toLocaleString('en-US') + ' – $' + high.toLocaleString('en-US');
  };

  function postLeadForm(form) {
    const formData = new FormData(form);
    const payload = {};
    formData.forEach(function (v, k) {
      payload[k] = typeof v === 'string' ? v.trim() : '';
    });
    const isLocalHost =
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'localhost';
    const endpoint = isLocalHost ? '/api/lead' : '/';
    const headers = isLocalHost
      ? { 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/x-www-form-urlencoded' };
    const body = isLocalHost
      ? JSON.stringify(payload)
      : new URLSearchParams(formData).toString();

    return fetch(endpoint, { method: 'POST', headers: headers, body: body }).then(function (res) {
      return res
        .json()
        .catch(function () {
          return {};
        })
        .then(function (data) {
          if (!res.ok) {
            throw new Error((data && data.message) || 'HTTP ' + res.status);
          }
          return data;
        });
    });
  }

  window.submitNetlifyForm = function (event, statusId) {
    if (event) event.preventDefault();
    const form = event && event.target;
    const statusEl = document.getElementById(statusId);
    if (!form) return false;

    postLeadForm(form)
      .then(function (data) {
        if (statusEl) {
          statusEl.className = 'form-status form-status-ok';
          statusEl.textContent =
            'Request logged' +
            (data && data.receipt_id ? ' (receipt ' + data.receipt_id + ')' : '') +
            '.';
          statusEl.style.display = 'block';
        }
        showToast('Request logged cleanly.');
        form.reset();
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.className = 'form-status form-status-err';
          statusEl.textContent = 'Submission failed: ' + (err && err.message ? err.message : 'Unable to submit form.');
          statusEl.style.display = 'block';
        }
        showToast('Submission failed: ' + (err && err.message ? err.message : 'Server rejected request'));
      });
    return false;
  };

  window.submitVipOnboarding = function (event) {
    if (event) event.preventDefault();
    const form = document.getElementById('vipOnboardingForm') || (event && event.target);
    const statusEl = document.getElementById('vipOnboardingConfirm');
    const btn = form ? form.querySelector('button[type="submit"]') : null;
    if (!form) return false;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Saving Launch Specs...';
    }

    postLeadForm(form)
      .then(function (data) {
        if (statusEl) {
          statusEl.className = 'form-status form-status-ok';
          statusEl.textContent =
            'Deployment specs saved' +
            (data && data.receipt_id ? ' (receipt ' + data.receipt_id + ')' : '') +
            '. Download your standalone HTML bundle above at any time.';
          statusEl.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Specs Saved';
        }
        showToast('Deployment specs saved.');
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.className = 'form-status form-status-err';
          statusEl.textContent =
            'Could not save specs: ' + (err && err.message ? err.message : 'Server rejected submission.');
          statusEl.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Save Launch Specs →';
        }
        showToast('Save failed: ' + (err && err.message ? err.message : 'Error'));
      });
    return false;
  };

  window.generateLivePreview = function (silent) {
    const tradeEl = document.getElementById('synthTradeSelect');
    const cityEl = document.getElementById('synthCitySelect');
    const bizEl = document.getElementById('synthBizInput');
    const phoneEl = document.getElementById('synthPhoneInput');
    if (!tradeEl || !cityEl) return;

    const tradesMap = loadEmbeddedTrades();
    const tradeSlug = tradeEl.value || 'painters';
    const citySlug = cityEl.value || 'boise-id';
    const tradeInfo = tradesMap[tradeSlug] || {
      slug: tradeSlug,
      name: tradeEl.options[tradeEl.selectedIndex].text.split('(')[0].trim(),
      price: 800,
      line: 'Written price before work begins.'
    };
    const cityName = cityEl.options[cityEl.selectedIndex].text.trim();
    const biz = bizEl && bizEl.value.trim() ? bizEl.value.trim() : 'Your Business Name';
    const phone = phoneEl && phoneEl.value.trim() ? phoneEl.value.trim() : '';

    const headline = cityName + ' ' + tradeInfo.name + ' — Written price before work begins';
    const lede =
      'Serving ' +
      cityName +
      '. ' +
      biz +
      ' — ' +
      tradeInfo.line;
    const priceLabel = '$' + Number(tradeInfo.price || 800).toLocaleString('en-US') + ' · Page Reference Valuation ($0 Free Export)';

    const h = document.getElementById('previewHeadline');
    const l = document.getElementById('previewLede');
    const b = document.getElementById('previewBiz');
    const p = document.getElementById('previewPhone');
    const c = document.getElementById('previewCity');
    const priceEl = document.getElementById('previewPrice');
    const stat = document.getElementById('previewStatus');
    const liveLink = document.getElementById('previewLivePageLink');
    const codeEl = document.getElementById('bundlePreviewCode');

    if (h) h.textContent = headline;
    if (l) l.textContent = lede;
    if (b) b.textContent = biz;
    if (p) p.textContent = phone || 'Your business phone';
    if (c) c.textContent = cityName;
    if (priceEl) priceEl.textContent = priceLabel;
    if (stat) stat.textContent = 'Synthesized · ' + tradeInfo.name + ' in ' + cityName;

    const q = new URLSearchParams();
    if (biz && biz !== 'Your Business Name') q.set('biz', biz);
    if (phone) q.set('phone', phone);
    const liveUrl = '/cities/' + encodeURIComponent(citySlug) + '/' + encodeURIComponent(tradeSlug) + '/' + (q.toString() ? '?' + q.toString() : '');
    if (liveLink) {
      liveLink.setAttribute('href', liveUrl);
    }

    if (codeEl) {
      const schemaSnippet = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: biz,
        areaServed: cityName,
        serviceType: tradeInfo.name
      };
      if (phone) schemaSnippet.telephone = phone;

      const previewSnippet =
        '<!DOCTYPE html>\n' +
        '<html lang="en"><head><meta charset="utf-8">\n' +
        '<title>' + escHtml(biz) + ' — ' + escHtml(tradeInfo.name) + ' in ' + escHtml(cityName) + '</title>\n' +
        '<meta name="description" content="' + escHtml(tradeInfo.line + (phone ? ' Call ' + phone + '.' : '')) + '">\n' +
        '<link rel="canonical" href="https://city-desk.netlify.app/cities/' + escHtml(citySlug) + '/' + escHtml(tradeSlug) + '/">\n' +
        '<script type="application/ld+json">' + JSON.stringify(schemaSnippet).replace(/</g, '\\u003c') + '</script>\n' +
        '</head><body><!-- Self-contained HTML bundle ready for static hosting --></body></html>';
      codeEl.textContent = previewSnippet;
    }

    if (silent !== true) {
      showToast('Assembled live preview for ' + biz + ' (' + tradeInfo.name + ' in ' + cityName + ').');
    }
  };

  function setupEventListeners() {
    const tradeSelect = document.getElementById('synthTradeSelect');
    const citySelect = document.getElementById('synthCitySelect');
    const bizInput = document.getElementById('synthBizInput');
    const phoneInput = document.getElementById('synthPhoneInput');
    if (tradeSelect) tradeSelect.addEventListener('change', function () { window.generateLivePreview(true); });
    if (citySelect) citySelect.addEventListener('change', function () { window.generateLivePreview(true); });
    if (bizInput) bizInput.addEventListener('input', function () { window.generateLivePreview(true); });
    if (phoneInput) phoneInput.addEventListener('input', function () { window.generateLivePreview(true); });
  }

  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    const msgEl = document.getElementById('toast-message') || t;
    msgEl.textContent = msg;
    t.classList.add('show');
    t.style.display = 'block';
    setTimeout(function () {
      t.classList.remove('show');
      t.style.display = 'none';
    }, 3500);
  }
  window.showToast = showToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
