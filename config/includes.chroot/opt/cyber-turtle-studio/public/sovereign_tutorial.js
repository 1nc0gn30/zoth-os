/**
 * Sovereign Quickstart Tutorial Modal (Zero innerHTML — pure DOM API)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === 'style' && typeof v === 'object') {
          Object.assign(node.style, v);
        } else if (k === 'text') {
          node.textContent = v;
        } else {
          node.setAttribute(k, String(v));
        }
      });
    }
    if (children) {
      children.forEach((child) => {
        if (child) node.appendChild(child);
      });
    }
    return node;
  }

  window.createSovereignTutorial = function (config) {
    const {
      toolId,
      toolName,
      tagline,
      steps = [],
      accentColor = '#10B981',
    } = config;

    if (document.getElementById(`sovTutorial-${toolId}`)) return;

    const modal = el('div', {
      id: `sovTutorial-${toolId}`,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': `${toolName} Quickstart Guide`,
      style: {
        display: 'none',
        position: 'fixed',
        inset: '0',
        zIndex: '999999',
        background: 'rgba(4,6,12,0.84)',
        backdropFilter: 'blur(12px)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        boxSizing: 'border-box',
      },
    });

    const card = el('div', {
      style: {
        background: '#0D111E',
        border: `2px solid ${accentColor}`,
        borderRadius: '18px',
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.75)',
        padding: '26px',
        color: '#F8FAFC',
        position: 'relative',
        fontFamily: 'ui-monospace, "JetBrains Mono", SFMono-Regular, monospace',
        boxSizing: 'border-box',
      },
    });

    const closeBtn = el('button', {
      id: `sovCloseBtn-${toolId}`,
      type: 'button',
      'aria-label': 'Close quickstart dialog',
      text: '✕',
      style: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.28)',
        color: '#F8FAFC',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        fontSize: '16px',
        cursor: 'pointer',
        fontWeight: '700',
      },
    });

    const titleEl = el('h2', {
      text: toolName,
      style: {
        margin: '0',
        fontSize: '19px',
        fontWeight: '800',
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      },
    });
    const tagEl = el('p', {
      text: `${tagline} · Local workstation quickstart`,
      style: { margin: '4px 0 0', color: '#CBD5E1', fontSize: '12px' },
    });

    const headerRow = el(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingRight: '48px' } },
      [el('div', null, [titleEl, tagEl])]
    );

    const braillePre = el('pre', {
      id: `sovBrailleCanvas-${toolId}`,
      style: {
        fontSize: '10px',
        lineHeight: '10px',
        color: '#34D399',
        margin: '0',
        fontFamily: 'monospace',
        whiteSpace: 'pre',
      },
    });
    const brailleStage = el(
      'div',
      {
        style: {
          background: '#05070D',
          border: '1px solid rgba(52,211,153,0.35)',
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '18px',
          textAlign: 'center',
          overflow: 'hidden',
        },
      },
      [braillePre]
    );

    const stepsList = el('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
    steps.forEach((s, idx) => {
      const stepCard = el(
        'div',
        {
          style: {
            display: 'flex',
            gap: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px',
            alignItems: 'flex-start',
          },
        },
        [
          el('span', { text: s.icon || '•', style: { fontSize: '20px', lineHeight: '1.1' } }),
          el('div', null, [
            el('h4', {
              text: `Step ${idx + 1}: ${s.title}`,
              style: { margin: '0 0 4px', color: idx === 0 ? accentColor : '#67E8F9', fontSize: '13px', fontWeight: '700' },
            }),
            el('p', {
              text: s.desc,
              style: { margin: '0', color: '#E2E8F0', fontSize: '12px', lineHeight: '1.45' },
            }),
          ]),
        ]
      );
      stepsList.appendChild(stepCard);
    });

    const dontShowChk = el('input', {
      type: 'checkbox',
      id: `sovDontShow-${toolId}`,
      style: { cursor: 'pointer', width: '18px', height: '18px' },
    });
    const dontShowLabel = el(
      'label',
      {
        for: `sovDontShow-${toolId}`,
        style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#CBD5E1', cursor: 'pointer' },
      },
      [dontShowChk, document.createTextNode("Don't show automatically")]
    );

    const actionBtn = el('button', {
      id: `sovActionBtn-${toolId}`,
      type: 'button',
      text: 'Close Quickstart',
      style: {
        background: accentColor,
        color: '#04120B',
        border: 'none',
        padding: '11px 22px',
        minHeight: '44px',
        borderRadius: '999px',
        fontWeight: '800',
        fontSize: '12px',
        cursor: 'pointer',
      },
    });

    const footerRow = el(
      'div',
      {
        style: {
          marginTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          flexWrap: 'wrap',
          gap: '12px',
        },
      },
      [dontShowLabel, actionBtn]
    );

    card.appendChild(closeBtn);
    card.appendChild(headerRow);
    card.appendChild(brailleStage);
    card.appendChild(stepsList);
    card.appendChild(footerRow);
    modal.appendChild(card);
    document.body.appendChild(modal);

    let animInterval = null;
    let tick = 0;

    function renderBraillePreview() {
      tick += 0.14;
      const W = 34, H = 6;
      let out = '';
      const dots = [
        [0, 0, 0x01], [0, 1, 0x02], [0, 2, 0x04], [0, 3, 0x40],
        [1, 0, 0x08], [1, 1, 0x10], [1, 2, 0x20], [1, 3, 0x80],
      ];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let mask = 0;
          for (let d = 0; d < 8; d++) {
            const px = (x * 2 + dots[d][0] - W) / W;
            const py = (y * 4 + dots[d][1] - H * 2) / (H * 2);
            const r = Math.hypot(px, py);
            const a = Math.atan2(py, px);
            const star = 0.55 + 0.25 * Math.cos(6 * a + tick);
            if (Math.abs(r - star) < 0.12) mask |= dots[d][2];
          }
          out += String.fromCharCode(0x2800 | mask);
        }
        out += '\n';
      }
      braillePre.textContent = out;
    }

    function openModal() {
      modal.style.display = 'flex';
      renderBraillePreview();
      if (!animInterval) {
        animInterval = setInterval(renderBraillePreview, 80);
      }
    }

    function closeModal() {
      modal.style.display = 'none';
      if (animInterval) {
        clearInterval(animInterval);
        animInterval = null;
      }
      if (dontShowChk.checked) {
        localStorage.setItem(`sov_tutorial_seen_${toolId}`, 'true');
      }
    }

    closeBtn.addEventListener('click', closeModal);
    actionBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    return { open: openModal, close: closeModal };
  };
})();
