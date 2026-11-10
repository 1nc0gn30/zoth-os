/**
 * ZothOS-Lite v1.2 — Tails-Style Amnesic Monotone Quickstart Modal
 * Palette: Paper Ivory (#F7F7F4) & Pure Black Ink (#000000) • 2px Borders • Hard Shadows
 * Author: 1nc0gn30 (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function (config) {
    const {
      toolId = 'zothos-lite',
      toolName = 'ZothOS-Lite v1.2 Onboarding',
      tagline = 'Tails-Style Amnesic Monotone OS • toram noswap',
      steps = [],
    } = config || {};

    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    const modal = document.createElement('div');
    modal.id = `sovTutorial-${toolId}`;
    modal.style.cssText =
      'display:none; position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.62); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;';

    const stepsHtml = steps
      .map(
        (s, idx) => `
      <div style="display:flex; gap:14px; background:#EFEFEB; border:2px solid #000000; border-radius:3px; padding:12px; align-items:flex-start;">
        <span style="font-size:22px; line-height:1;">${s.icon || '▪'}</span>
        <div>
          <h4 style="margin:0 0 4px; color:#000000; font-size:13.5px; font-weight:800;">Step ${idx + 1}: ${s.title}</h4>
          <p style="margin:0; color:#262624; font-size:12px; line-height:1.5;">${s.desc}</p>
        </div>
      </div>
    `
      )
      .join('');

    modal.innerHTML = `
      <div style="background:#F7F7F4; border:2px solid #000000; border-radius:4px; max-width:640px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:6px 6px 0px #000000; padding:24px; color:#000000; position:relative; font-family:'IBM Plex Mono', 'JetBrains Mono', monospace; box-sizing:border-box;">
        <button id="sovCloseBtn-${toolId}" type="button" aria-label="Close onboarding modal" style="position:absolute; top:16px; right:16px; background:#FFFFFF; border:2px solid #000000; color:#000000; width:34px; height:34px; border-radius:3px; font-size:15px; cursor:pointer; font-weight:800; box-shadow:2px 2px 0px #000000;">✕</button>

        <div style="margin-bottom:14px; padding-right:42px;">
          <div style="display:inline-block; background:#000000; color:#F7F7F4; font-size:10px; font-weight:700; padding:2px 6px; margin-bottom:6px;">AMNESIC MONOTONE QUICKSTART</div>
          <h2 style="margin:0; font-size:19px; font-weight:800; color:#000000;">${toolName}</h2>
          <p style="margin:3px 0 0; color:#5A5A54; font-size:11.5px;">${tagline}</p>
        </div>

        <div style="background:#FFFFFF; border:2px solid #000000; border-radius:3px; padding:10px; margin-bottom:16px; text-align:center; overflow:hidden;">
          <pre id="sovBrailleCanvas-${toolId}" style="font-size:10px; line-height:10px; color:#000000; margin:0; font-family:monospace; white-space:pre;"></pre>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${stepsHtml}
        </div>

        <div style="margin-top:18px; display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:2px solid #000000; flex-wrap:wrap; gap:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-size:11px; color:#262624; cursor:pointer;">
            <input type="checkbox" id="sovDontShow-${toolId}" style="cursor:pointer; accent-color:#000000;"> Don't show automatically on first visit
          </label>
          <button id="sovActionBtn-${toolId}" type="button" style="background:#000000; color:#F7F7F4; border:2px solid #000000; padding:8px 20px; border-radius:3px; font-weight:800; font-size:12px; cursor:pointer; box-shadow:3px 3px 0px #000000;">Enter Workstation →</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let animInterval = null;
    let tick = 0;

    function renderBrailleWave() {
      const el = document.getElementById(`sovBrailleCanvas-${toolId}`);
      if (!el) return;
      tick += 0.16;
      const W = 34,
        H = 6;
      let out = '';
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let mask = 0;
          const dots = [
            [0, 0, 0x01],
            [0, 1, 0x02],
            [0, 2, 0x04],
            [0, 3, 0x40],
            [1, 0, 0x08],
            [1, 1, 0x10],
            [1, 2, 0x20],
            [1, 3, 0x80],
          ];
          for (let d = 0; d < 8; d++) {
            const px = x * 2 + dots[d][0];
            const py = y * 4 + dots[d][1];
            const v = Math.sin(px * 0.2 + tick) * Math.cos(py * 0.35 + tick);
            if (v > 0.08) mask |= dots[d][2];
          }
          out += String.fromCharCode(0x2800 | mask);
        }
        out += '\n';
      }
      el.textContent = out;
    }

    function openModal() {
      modal.style.display = 'flex';
      if (!animInterval) {
        animInterval = setInterval(renderBrailleWave, 60);
      }
    }

    function closeModal() {
      modal.style.display = 'none';
      if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
      }
      const chk = document.getElementById(`sovDontShow-${toolId}`);
      if (chk && chk.checked) {
        localStorage.setItem(`sov_tutorial_seen_${toolId}`, 'true');
      }
    }

    document.getElementById(`sovCloseBtn-${toolId}`).addEventListener('click', closeModal);
    document.getElementById(`sovActionBtn-${toolId}`).addEventListener('click', closeModal);

    return { open: openModal, close: closeModal };
  };
})();
