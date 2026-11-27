/**
 * Sovereign Reusable Tutorial & Braille Quickstart Engine (DOM-Safe, Zero innerHTML)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  function el(tag, styles, text) {
    const node = document.createElement(tag);
    if (styles) node.style.cssText = styles;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  window.createSovereignTutorial = function (config) {
    const {
      toolId = 'hexstrike-arsenal',
      toolName = 'HexStrike Security Arsenal',
      tagline = 'Local-first defensive & penetration audit workstation',
      steps = [],
      accentColor = '#B91C1C',
    } = config || {};

    if (document.getElementById('sovTutorial-' + toolId)) return;

    const modal = el(
      'div',
      'display:none; position:fixed; inset:0; z-index:999999; background:rgba(4,6,12,0.82); backdrop-filter:blur(10px); align-items:center; justify-content:center; padding:18px; box-sizing:border-box;'
    );
    modal.id = 'sovTutorial-' + toolId;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', toolName + ' Quickstart');

    const card = el(
      'div',
      'background:#0D111E; border:2px solid ' +
        accentColor +
        '; border-radius:18px; max-width:620px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.75); padding:26px; color:#F8FAFC; position:relative; font-family:ui-monospace,"JetBrains Mono",SFMono-Regular,monospace; box-sizing:border-box;'
    );

    const closeBtn = el(
      'button',
      'position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.22); color:#F8FAFC; min-width:44px; min-height:44px; border-radius:50%; font-size:16px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;',
      '✕'
    );
    closeBtn.id = 'sovCloseBtn-' + toolId;
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close quickstart');

    const header = el('div', 'display:flex; align-items:center; gap:12px; margin-bottom:14px; padding-right:48px;');
    const titleWrap = el('div', '');
    titleWrap.appendChild(
      el(
        'h2',
        'margin:0; font-size:19px; font-weight:800; color:#F8FAFC; text-transform:uppercase; letter-spacing:0.04em;',
        toolName
      )
    );
    titleWrap.appendChild(
      el(
        'p',
        'margin:4px 0 0; color:#CBD5E1; font-size:11.5px;',
        tagline + ' • Neal Frazier Tech (@1nc0gn30) • NullAI Platform'
      )
    );
    header.appendChild(titleWrap);

    const stage = el(
      'div',
      'background:#05070D; border:1px solid rgba(212,175,55,0.35); border-radius:10px; padding:10px; margin-bottom:18px; text-align:center; overflow:hidden;'
    );
    const canvasPre = el(
      'pre',
      'font-size:9.5px; line-height:9.5px; color:#38BDF8; margin:0; font-family:monospace; white-space:pre;',
      ''
    );
    canvasPre.id = 'sovBrailleCanvas-' + toolId;
    stage.appendChild(canvasPre);

    const stepsList = el('div', 'display:flex; flex-direction:column; gap:10px;');
    (Array.isArray(steps) ? steps : []).forEach(function (s, idx) {
      const row = el(
        'div',
        'display:flex; gap:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.09); border-radius:10px; padding:12px; align-items:flex-start;'
      );
      row.appendChild(el('span', 'font-size:22px; line-height:1;', s && s.icon ? s.icon : '•'));
      const copy = el('div', '');
      copy.appendChild(
        el(
          'h4',
          'margin:0 0 4px; color:' + (idx === 0 ? '#F5E6AB' : '#7DD3FC') + '; font-size:13.5px; font-weight:700;',
          'Step ' + (idx + 1) + ': ' + (s && s.title ? s.title : '')
        )
      );
      copy.appendChild(el('p', 'margin:0; color:#CBD5E1; font-size:12px; line-height:1.5;', s && s.desc ? s.desc : ''));
      row.appendChild(copy);
      stepsList.appendChild(row);
    });

    const footer = el(
      'div',
      'margin-top:18px; display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px solid rgba(255,255,255,0.12); flex-wrap:wrap; gap:12px;'
    );
    const chkLabel = el('label', 'display:flex; align-items:center; gap:8px; font-size:11.5px; color:#CBD5E1; cursor:pointer;');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = 'sovDontShow-' + toolId;
    chk.style.cursor = 'pointer';
    chkLabel.appendChild(chk);
    chkLabel.appendChild(document.createTextNode("Don't show automatically"));

    const actionBtn = el(
      'button',
      'background:' + accentColor + '; color:#FFFFFF; border:none; padding:10px 20px; min-height:44px; border-radius:999px; font-weight:800; font-size:12px; cursor:pointer; letter-spacing:0.04em;',
      'Continue to Workstation'
    );
    actionBtn.id = 'sovActionBtn-' + toolId;
    actionBtn.type = 'button';

    footer.appendChild(chkLabel);
    footer.appendChild(actionBtn);

    card.appendChild(closeBtn);
    card.appendChild(header);
    card.appendChild(stage);
    card.appendChild(stepsList);
    card.appendChild(footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    let animInterval = null;
    let tick = 0;

    function renderBrailleWave() {
      tick += 0.16;
      const W = 34;
      const H = 6;
      let out = '';
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
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let mask = 0;
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
      canvasPre.textContent = out;
    }

    function openModal() {
      modal.style.display = 'flex';
      if (!animInterval) {
        renderBrailleWave();
        animInterval = setInterval(renderBrailleWave, 60);
      }
    }

    function closeModal() {
      modal.style.display = 'none';
      if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
      }
      if (chk.checked) {
        try {
          localStorage.setItem('sov_tutorial_seen_' + toolId, 'true');
        } catch (e) {}
      }
    }

    closeBtn.addEventListener('click', closeModal);
    actionBtn.addEventListener('click', closeModal);

    return { open: openModal, close: closeModal };
  };
})();
