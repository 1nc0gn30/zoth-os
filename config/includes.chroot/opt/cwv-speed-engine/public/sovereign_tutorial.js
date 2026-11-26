/**
 * Sovereign Quickstart Tutorial Modal (Zero innerHTML XSS Sinks)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function (config) {
    const {
      toolId = 'cwv-speed-engine',
      toolName = 'CWV Speed Engine',
      tagline = 'Core Web Vitals Diagnostics & HTML Optimizer',
      steps = [],
      accentColor = '#047857',
    } = config || {};

    if (document.getElementById('sovTutorial-' + toolId)) return;

    const modal = document.createElement('div');
    modal.id = 'sovTutorial-' + toolId;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', toolName + ' Quickstart');
    modal.style.cssText =
      'display:none;position:fixed;inset:0;z-index:99999;background:rgba(8,8,11,0.78);backdrop-filter:blur(10px);align-items:center;justify-content:center;padding:18px;';

    const card = document.createElement('div');
    card.style.cssText =
      'background:var(--surface,#FFFFFF);color:var(--text-primary,#101828);border:2px solid var(--border-accent,' +
      accentColor +
      ');border-radius:16px;max-width:580px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;position:relative;font-family:var(--font-sans,system-ui,sans-serif);box-shadow:0 20px 50px rgba(0,0,0,0.35);';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close quickstart modal');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'position:absolute;top:14px;right:14px;min-width:44px;min-height:44px;border-radius:9999px;border:1px solid var(--border,rgba(16,24,40,0.2));background:var(--surface-alt,#F3EFE6);color:var(--text-primary,#101828);font-weight:700;cursor:pointer;';

    const titleEl = document.createElement('h2');
    titleEl.textContent = toolName;
    titleEl.style.cssText = 'margin:0 48px 4px 0;font-size:20px;font-weight:800;color:var(--text-primary,#101828);';

    const subEl = document.createElement('p');
    subEl.textContent = tagline;
    subEl.style.cssText = 'margin:0 0 16px;font-size:13px;color:var(--text-secondary,#475467);';

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    steps.forEach((step, idx) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;gap:12px;padding:12px;border-radius:10px;background:var(--surface-alt,#F3EFE6);border:1px solid var(--border,rgba(16,24,40,0.12));align-items:flex-start;';
      const iconSpan = document.createElement('span');
      iconSpan.textContent = step.icon || '⚡';
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.style.fontSize = '20px';

      const body = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = 'Step ' + (idx + 1) + ': ' + (step.title || '');
      h.style.cssText = 'margin:0 0 4px;font-size:14px;font-weight:700;color:var(--text-primary,#101828);';

      const p = document.createElement('p');
      p.textContent = step.desc || '';
      p.style.cssText = 'margin:0;font-size:12.5px;line-height:1.5;color:var(--text-secondary,#475467);';

      body.appendChild(h);
      body.appendChild(p);
      row.appendChild(iconSpan);
      row.appendChild(body);
      list.appendChild(row);
    });

    const footer = document.createElement('div');
    footer.style.cssText = 'margin-top:18px;display:flex;justify-content:flex-end;';
    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.textContent = 'Start Auditing';
    okBtn.style.cssText =
      'min-height:44px;padding:10px 22px;border-radius:9999px;border:none;background:var(--accent,#1557B0);color:var(--on-accent,#FFFFFF);font-weight:700;cursor:pointer;';

    const close = () => {
      modal.style.display = 'none';
    };
    closeBtn.addEventListener('click', close);
    okBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    footer.appendChild(okBtn);
    card.appendChild(closeBtn);
    card.appendChild(titleEl);
    card.appendChild(subEl);
    card.appendChild(list);
    card.appendChild(footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    window.openSovereignTutorial = function () {
      modal.style.display = 'flex';
    };
  };
})();
