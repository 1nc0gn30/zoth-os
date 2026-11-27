/**
 * Digital Asset Forge - Quickstart Guide Modal (DOM-safe, zero innerHTML sinks)
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */
(function () {
  "use strict";
  if (window.__SOVEREIGN_TUTORIAL_ATTACHED__) return;
  window.__SOVEREIGN_TUTORIAL_ATTACHED__ = true;

  window.createSovereignTutorial = function (config) {
    const toolId = String(config.toolId || "digital-asset-forge");
    const toolName = String(config.toolName || "Digital Asset Forge");
    const tagline = String(config.tagline || "");
    const steps = Array.isArray(config.steps) ? config.steps : [];

    const existing = document.getElementById("sovTutorial-" + toolId);
    if (existing) existing.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "sovTutorial-" + toolId;
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", toolName + " Quickstart");
    backdrop.style.cssText =
      "display:none; position:fixed; inset:0; z-index:99999; background:rgba(7,9,14,0.78); align-items:center; justify-content:center; padding:18px;";

    const card = document.createElement("div");
    card.style.cssText =
      "background:var(--bg-surface); color:var(--text-main); border:2px solid var(--accent-gold); border-radius:16px; max-width:580px; width:100%; max-height:90vh; overflow-y:auto; padding:24px; position:relative; box-shadow:0 20px 50px rgba(0,0,0,0.5);";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.className = "btn btn-secondary";
    closeBtn.style.cssText = "position:absolute; top:16px; right:16px;";

    const heading = document.createElement("h2");
    heading.textContent = toolName + " Quickstart";
    heading.style.cssText = "font-family:var(--font-display); font-size:1.3rem; color:var(--accent-gold); margin-bottom:4px; padding-right:84px;";

    const sub = document.createElement("p");
    sub.textContent = tagline;
    sub.style.cssText = "color:var(--text-secondary); font-size:0.88rem; margin-bottom:18px;";

    const list = document.createElement("div");
    list.style.cssText = "display:flex; flex-direction:column; gap:12px;";

    steps.forEach(function (step, idx) {
      const row = document.createElement("div");
      row.style.cssText =
        "background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:10px; padding:14px;";

      const title = document.createElement("h3");
      title.textContent = "Step " + (idx + 1) + ": " + String(step.title || "");
      title.style.cssText = "font-size:0.95rem; font-weight:700; color:var(--text-main); margin-bottom:4px;";

      const desc = document.createElement("p");
      desc.textContent = String(step.desc || "");
      desc.style.cssText = "font-size:0.86rem; color:var(--text-secondary); line-height:1.5;";

      row.appendChild(title);
      row.appendChild(desc);
      list.appendChild(row);
    });

    const footer = document.createElement("div");
    footer.style.cssText = "margin-top:18px; display:flex; justify-content:flex-end;";

    const doneBtn = document.createElement("button");
    doneBtn.type = "button";
    doneBtn.className = "btn btn-primary";
    doneBtn.textContent = "Start Forging Packs";

    footer.appendChild(doneBtn);
    card.appendChild(closeBtn);
    card.appendChild(heading);
    card.appendChild(sub);
    card.appendChild(list);
    card.appendChild(footer);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    function openModal() {
      backdrop.style.display = "flex";
    }
    function closeModal() {
      backdrop.style.display = "none";
    }

    closeBtn.addEventListener("click", closeModal);
    doneBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", function (ev) {
      if (ev.target === backdrop) closeModal();
    });

    return { open: openModal, close: closeModal };
  };
})();
