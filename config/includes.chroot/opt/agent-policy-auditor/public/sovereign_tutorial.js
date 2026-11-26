/**
 * Sovereign Interactive Quickstart Guide (Zero Raw HTML Injection, Bound Labels)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function (config) {
    const toolId = String(config.toolId || 'tool');
    const toolName = String(config.toolName || 'Tool');
    const tagline = String(config.tagline || '');
    const steps = Array.isArray(config.steps) ? config.steps : [];
    const accentColor = String(config.accentColor || '#D4AF37');

    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    const modal = document.createElement('div');
    modal.id = `sovTutorial-${toolId}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `sovTitle-${toolId}`);
    modal.style.cssText =
      'display:none; position:fixed; inset:0; z-index:999999; background:rgba(8,10,16,0.82); backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;';

    const card = document.createElement('div');
    card.style.cssText =
      'background:var(--bg-surface, #0F1118); border:2px solid ' +
      accentColor +
      '; border-radius:18px; max-width:620px; width:100%; max-height:90vh; overflow-y:auto; padding:24px; color:var(--text-main, #F8FAFC); position:relative; font-family:var(--mono, ui-monospace, monospace); box-sizing:border-box;';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = `sovCloseBtn-${toolId}`;
    closeBtn.setAttribute('aria-label', 'Close Quickstart Guide');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText =
      'position:absolute; top:14px; right:14px; background:transparent; border:1px solid var(--border-subtle, rgba(255,255,255,0.2)); color:var(--text-main, #F8FAFC); min-width:44px; min-height:44px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:700; display:flex; align-items:center; justify-content:center;';
    card.appendChild(closeBtn);

    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom:16px; padding-right:48px;';
    const h2 = document.createElement('h2');
    h2.id = `sovTitle-${toolId}`;
    h2.textContent = toolName;
    h2.style.cssText = `margin:0; font-size:18px; font-weight:800; color:${accentColor}; letter-spacing:0.04em; text-transform:uppercase;`;
    const sub = document.createElement('p');
    sub.textContent = tagline;
    sub.style.cssText = 'margin:4px 0 0; color:var(--text-muted, #94A3B8); font-size:12px;';
    header.appendChild(h2);
    header.appendChild(sub);
    card.appendChild(header);

    const stepsWrap = document.createElement('div');
    stepsWrap.style.cssText = 'display:flex; flex-direction:column; gap:10px;';
    steps.forEach((s, idx) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex; gap:12px; background:var(--bg-subtle, rgba(255,255,255,0.03)); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:10px; padding:12px; align-items:flex-start;';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = String(s.icon || '✦');
      icon.style.cssText = 'font-size:22px; line-height:1;';
      const body = document.createElement('div');
      const h4 = document.createElement('h3');
      h4.textContent = `Step ${idx + 1}: ${String(s.title || '')}`;
      h4.style.cssText = `margin:0 0 4px; color:${idx === 0 ? accentColor : 'var(--cyan-accent, #38BDF8)'}; font-size:13px; font-weight:700;`;
      const p = document.createElement('p');
      p.textContent = String(s.desc || '');
      p.style.cssText = 'margin:0; color:var(--text-muted, #CBD5E1); font-size:12px; line-height:1.5;';
      body.appendChild(h4);
      body.appendChild(p);
      row.appendChild(icon);
      row.appendChild(body);
      stepsWrap.appendChild(row);
    });
    card.appendChild(stepsWrap);

    const foot = document.createElement('div');
    foot.style.cssText =
      'margin-top:18px; display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid var(--border-subtle, rgba(255,255,255,0.12)); flex-wrap:wrap; gap:12px;';

    const chkId = `sovDontShow-${toolId}`;
    const lbl = document.createElement('label');
    lbl.setAttribute('for', chkId);
    lbl.style.cssText =
      'display:inline-flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted, #94A3B8); cursor:pointer; min-height:44px;';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = chkId;
    chk.style.cssText = 'width:18px; height:18px; cursor:pointer;';
    lbl.appendChild(chk);
    lbl.appendChild(document.createTextNode("Don't show automatically"));
    foot.appendChild(lbl);

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.id = `sovActionBtn-${toolId}`;
    okBtn.textContent = 'Close Guide';
    okBtn.style.cssText = `background:${accentColor}; color:#08080B; border:none; min-height:44px; padding:10px 20px; border-radius:999px; font-weight:800; font-size:12px; cursor:pointer;`;
    foot.appendChild(okBtn);

    card.appendChild(foot);
    modal.appendChild(card);
    document.body.appendChild(modal);

    function openModal() {
      modal.style.display = 'flex';
    }

    function closeModal() {
      modal.style.display = 'none';
      if (chk.checked) {
        try {
          localStorage.setItem(`sov_tutorial_seen_${toolId}`, 'true');
        } catch (_e) {}
      }
    }

    closeBtn.addEventListener('click', closeModal);
    okBtn.addEventListener('click', closeModal);

    return { open: openModal, close: closeModal };
  };
})();
