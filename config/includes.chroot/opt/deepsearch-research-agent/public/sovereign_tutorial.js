/**
 * Safe DOM-Built Tutorial Helper (Zero innerHTML sinks)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  function el(tag, attrs, text) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'style') {
          node.style.cssText = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (text !== undefined && text !== null) {
      node.textContent = String(text);
    }
    return node;
  }

  window.createSovereignTutorial = function (config) {
    const toolId = String(config.toolId || 'deepsearch');
    const toolName = String(config.toolName || 'DeepSearch Research Studio');
    const tagline = String(config.tagline || '5-Stage Tree-of-Thought Research Pipeline');
    const steps = Array.isArray(config.steps) ? config.steps : [];

    if (document.getElementById('sovTutorial-' + toolId)) return null;

    const modal = el('div', {
      id: 'sovTutorial-' + toolId,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': toolName + ' Quickstart Guide',
      style:
        'display:none;position:fixed;inset:0;z-index:9999;background:rgba(8,10,16,0.78);align-items:center;justify-content:center;padding:16px;box-sizing:border-box;',
    });

    const card = el('div', {
      style:
        'background:var(--surface-card,#12121A);color:var(--ink-primary,#F5F1E6);border:1px solid var(--border-strong,#D4AF37);border-radius:16px;max-width:580px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;box-sizing:border-box;position:relative;',
    });

    const closeBtn = el(
      'button',
      {
        type: 'button',
        'aria-label': 'Close quickstart guide',
        style:
          'position:absolute;top:14px;right:14px;min-width:44px;min-height:44px;border-radius:10px;border:1px solid var(--border-subtle,#334155);background:transparent;color:inherit;cursor:pointer;font-size:16px;font-weight:700;',
      },
      '✕'
    );

    const title = el('h2', { style: 'margin:0 48px 4px 0;font-size:1.15rem;' }, toolName);
    const sub = el('p', { style: 'margin:0 0 16px 0;font-size:0.85rem;color:var(--ink-secondary,#94A3B8);' }, tagline);

    const list = el('div', { style: 'display:flex;flex-direction:column;gap:10px;' });
    steps.forEach((s, idx) => {
      const row = el('div', {
        style:
          'display:flex;gap:12px;padding:12px;border-radius:10px;border:1px solid var(--border-subtle,#334155);background:var(--surface-subtle,#0D0F16);',
      });
      const stepNum = el(
        'span',
        {
          style:
            'font-family:ui-monospace,monospace;font-weight:700;font-size:0.85rem;color:var(--accent-primary,#D4AF37);min-width:24px;',
        },
        String(idx + 1).padStart(2, '0')
      );
      const body = el('div');
      body.appendChild(el('div', { style: 'font-weight:700;font-size:0.9rem;margin-bottom:3px;' }, s.title || ''));
      body.appendChild(
        el('div', { style: 'font-size:0.82rem;color:var(--ink-secondary,#94A3B8);line-height:1.45;' }, s.desc || '')
      );
      row.appendChild(stepNum);
      row.appendChild(body);
      list.appendChild(row);
    });

    const footer = el('div', { style: 'margin-top:18px;display:flex;justify-content:flex-end;' });
    const doneBtn = el(
      'button',
      {
        type: 'button',
        style:
          'min-height:44px;padding:0 20px;border-radius:10px;border:none;background:var(--accent-cta-bg,#7A5808);color:var(--accent-cta-fg,#FFFFFF);font-weight:700;cursor:pointer;',
      },
      'Close Guide'
    );
    footer.appendChild(doneBtn);

    card.appendChild(closeBtn);
    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(list);
    card.appendChild(footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    function open() {
      modal.style.display = 'flex';
    }
    function close() {
      modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', close);
    doneBtn.addEventListener('click', close);
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) close();
    });

    return { open: open, close: close };
  };
})();
