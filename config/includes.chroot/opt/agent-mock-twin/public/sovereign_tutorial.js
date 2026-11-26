/**
 * Sovereign Reusable Quickstart Tutorial Modal (Light & Dark Theme Aware)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.createSovereignTutorial = function (config) {
    const {
      toolId,
      toolName,
      tagline,
      steps = [],
      accentColor = '#10B981',
    } = config || {};

    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    const modal = document.createElement('div');
    modal.id = `sovTutorial-${toolId}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `${toolName} Quickstart`);
    modal.style.cssText =
      'display:none; position:fixed; inset:0; z-index:999999; background:rgba(8,10,16,0.75); backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;';

    const stepsHtml = steps
      .map(
        (s, idx) => `
      <div style="display:flex; gap:12px; background:var(--surface-elevated, rgba(255,255,255,0.04)); border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:10px; padding:12px 14px; align-items:flex-start;">
        <span style="font-size:22px; line-height:1;" aria-hidden="true">${esc(s.icon)}</span>
        <div>
          <h4 style="margin:0 0 4px; color:var(--text-primary, #F8FAFC); font-size:13px; font-weight:700;">Step ${idx + 1}: ${esc(s.title)}</h4>
          <p style="margin:0; color:var(--text-secondary, #CBD5E1); font-size:12px; line-height:1.5;">${esc(s.desc)}</p>
        </div>
      </div>`
      )
      .join('');

    modal.innerHTML = `
      <div style="background:var(--surface-card, #0E1017); border:1px solid var(--border-accent, ${esc(accentColor)}); border-radius:16px; max-width:580px; width:100%; max-height:88vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.45); padding:24px; color:var(--text-primary, #F8FAFC); position:relative; font-family:var(--font-sans, system-ui, sans-serif); box-sizing:border-box;">
        <button type="button" id="sovCloseBtn-${esc(toolId)}" aria-label="Close quickstart modal" style="position:absolute; top:14px; right:14px; background:var(--surface-elevated, rgba(255,255,255,0.08)); border:1px solid var(--border-subtle, rgba(255,255,255,0.2)); color:var(--text-primary, #F8FAFC); min-width:44px; min-height:44px; border-radius:10px; font-size:16px; cursor:pointer; font-weight:700; display:flex; align-items:center; justify-content:center;">✕</button>
        <div style="margin-bottom:14px; padding-right:52px;">
          <h2 style="margin:0; font-size:18px; font-weight:800; color:var(--accent-gold, ${esc(accentColor)}); letter-spacing:0.02em;">${esc(toolName)}</h2>
          <p style="margin:4px 0 0; color:var(--text-secondary, #94A3B8); font-size:12px;">${esc(tagline)}</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">${stepsHtml}</div>
        <div style="margin-top:18px; display:flex; justify-content:flex-end;">
          <button type="button" id="sovActionBtn-${esc(toolId)}" style="background:var(--accent-gold, ${esc(accentColor)}); color:var(--btn-gold-ink, #08080B); border:none; min-height:44px; padding:10px 20px; border-radius:8px; font-weight:800; font-size:13px; cursor:pointer;">Close Quickstart</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function openModal() {
      modal.style.display = 'flex';
    }
    function closeModal() {
      modal.style.display = 'none';
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.getElementById(`sovCloseBtn-${toolId}`).addEventListener('click', closeModal);
    document.getElementById(`sovActionBtn-${toolId}`).addEventListener('click', closeModal);

    return { open: openModal, close: closeModal };
  };
})();
