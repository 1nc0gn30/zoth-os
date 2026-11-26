/**
 * Sovereign Quickstart Tutorial Modal (Accessible & Opt-In)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function (config) {
    const {
      toolId,
      toolName,
      tagline,
      steps,
      accentColor = '#D4AF37',
    } = config;

    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    const modal = document.createElement('div');
    modal.id = `sovTutorial-${toolId}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `${toolName} Quickstart`);
    modal.style.cssText = 'display:none; position:fixed; inset:0; z-index:999999; background:rgba(4,6,12,0.85); backdrop-filter:blur(12px); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;';

    const stepsHtml = steps.map((s, idx) => `
      <div style="display:flex; gap:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:14px; align-items:flex-start;">
        <span style="font-size:22px; line-height:1;">${s.icon}</span>
        <div>
          <h4 style="margin:0 0 4px; color:${idx === 0 ? accentColor : '#38BDF8'}; font-size:14px; font-weight:700;">Step ${idx + 1}: ${s.title}</h4>
          <p style="margin:0; color:#CBD5E1; font-size:12px; line-height:1.5;">${s.desc}</p>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="background:#0D111E; border:2px solid ${accentColor}; border-radius:18px; max-width:620px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.8); padding:26px; color:#F8FAFC; position:relative; font-family:ui-monospace, SFMono-Regular, monospace; box-sizing:border-box;">
        <button type="button" id="sovCloseBtn-${toolId}" aria-label="Close quickstart modal" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#F8FAFC; width:44px; height:44px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">✕</button>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px; padding-right:48px;">
          <div>
            <h2 style="margin:0; font-size:19px; font-weight:800; color:${accentColor}; text-transform:uppercase; letter-spacing:0.04em;">${toolName}</h2>
            <p style="margin:3px 0 0; color:#94A3B8; font-size:11px;">${tagline}</p>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${stepsHtml}
        </div>
        <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid rgba(255,255,255,0.1); flex-wrap:wrap; gap:12px;">
          <label for="sovDontShow-${toolId}" style="display:flex; align-items:center; gap:8px; font-size:12px; color:#CBD5E1; cursor:pointer; min-height:44px;">
            <input type="checkbox" id="sovDontShow-${toolId}" aria-label="Do not show quickstart automatically on first visit" style="cursor:pointer; width:18px; height:18px;"> Don't show automatically
          </label>
          <button type="button" id="sovActionBtn-${toolId}" style="background:${accentColor}; color:#08080B; border:none; padding:10px 22px; min-height:44px; border-radius:999px; font-weight:800; font-size:12px; cursor:pointer;">Got It</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function openModal() {
      modal.style.display = 'flex';
    }

    function closeModal() {
      modal.style.display = 'none';
      const chk = document.getElementById(`sovDontShow-${toolId}`);
      if (chk && chk.checked) {
        try { localStorage.setItem(`sov_tutorial_seen_${toolId}`, 'true'); } catch (e) {}
      }
    }

    document.getElementById(`sovCloseBtn-${toolId}`).addEventListener('click', closeModal);
    document.getElementById(`sovActionBtn-${toolId}`).addEventListener('click', closeModal);

    return { open: openModal, close: closeModal };
  };
})();
