(() => {
  const state = {
    catalog: null,
    category: "all",
    status: "all",
    query: "",
    activeItem: null,
  };

  const els = {
    statTotal: document.getElementById("statTotal"),
    statRunning: document.getElementById("statRunning"),
    statInstalled: document.getElementById("statInstalled"),
    statBrowser: document.getElementById("statBrowser"),
    statProbeMeta: document.getElementById("statProbeMeta"),
    categoryTabs: document.getElementById("categoryTabs"),
    searchInput: document.getElementById("searchInput"),
    clearSearch: document.getElementById("clearSearch"),
    activeHeading: document.getElementById("activeHeading"),
    resultsCount: document.getElementById("resultsCount"),
    toolGrid: document.getElementById("toolGrid"),
    emptyState: document.getElementById("emptyState"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    themeLabel: document.getElementById("themeLabel"),
    detailModal: document.getElementById("detailModal"),
    modalClose: document.getElementById("modalClose"),
    modalCategory: document.getElementById("modalCategory"),
    modalTitle: document.getElementById("modalTitle"),
    modalStatusRow: document.getElementById("modalStatusRow"),
    modalDesc: document.getElementById("modalDesc"),
    modalSpecs: document.getElementById("modalSpecs"),
    modalPull: document.getElementById("modalPull"),
    modalActions: document.getElementById("modalActions"),
    copyCmdBtn: document.getElementById("copyCmdBtn"),
    copySolanaBtn: document.getElementById("copySolanaBtn"),
    toast: document.getElementById("toast"),
  };

  let toastTimer = null;

  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, 3200);
  }

  function applyTheme(theme) {
    const t = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("zoth-hub-theme", t);
    } catch (_) {}
    if (els.themeIcon && els.themeLabel) {
      els.themeIcon.textContent = t === "dark" ? "☀" : "☾";
      els.themeLabel.textContent = t === "dark" ? "Ivory" : "Obsidian";
    }
  }

  function initTheme() {
    let saved = "dark";
    try {
      saved = localStorage.getItem("zoth-hub-theme") || "dark";
    } catch (_) {}
    applyTheme(saved);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function dotClassFor(status) {
    if (status === "running") return "dot-running";
    if (status === "installed_cli") return "dot-installed";
    if (status === "browser_ready") return "dot-browser";
    return "dot-missing";
  }

  async function fetchCatalog() {
    if (els.refreshBtn) els.refreshBtn.disabled = true;
    try {
      const res = await fetch("/api/catalog", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      state.catalog = await res.json();
      renderAll();
    } catch (err) {
      showToast(`Catalog probe error: ${err.message}`);
    } finally {
      if (els.refreshBtn) els.refreshBtn.disabled = false;
    }
  }

  function renderStats() {
    const data = state.catalog;
    if (!data) return;
    const s = data.summary || {};
    els.statTotal.textContent = String(s.total ?? 0);
    els.statRunning.textContent = String(s.running ?? 0);
    els.statInstalled.textContent = String(s.installed_cli ?? 0);
    els.statBrowser.textContent = String(s.browser_ready ?? 0);
    els.statProbeMeta.textContent = `Probed in ${data.probe_ms ?? 0}ms · ${data.host || "localhost"}`;
  }

  function renderCategoryTabs() {
    const data = state.catalog;
    if (!data) return;
    const tabs = [
      {
        id: "all",
        icon: "❖",
        name: "All Categories",
        short: "All",
        count: data.summary?.total ?? 0,
      },
      ...(data.categories || []).map((c) => ({
        id: c.id,
        icon: c.icon,
        name: c.name,
        short: c.short || c.name,
        count: c.counts?.total ?? 0,
      })),
    ];

    els.categoryTabs.innerHTML = tabs
      .map(
        (t) => `
        <button
          type="button"
          class="cat-tab${state.category === t.id ? " active" : ""}"
          data-cat="${escapeHtml(t.id)}"
        >
          <span aria-hidden="true">${escapeHtml(t.icon)}</span>
          <span>${escapeHtml(t.name)}</span>
          <span class="cat-count">${t.count}</span>
        </button>`
      )
      .join("");

    els.categoryTabs.querySelectorAll(".cat-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.category = btn.getAttribute("data-cat") || "all";
        renderCategoryTabs();
        renderGrid();
      });
    });
  }

  function getFilteredItems() {
    if (!state.catalog) return [];
    const q = state.query.trim().toLowerCase();
    return (state.catalog.items || []).filter((it) => {
      if (state.category !== "all" && it.category_id !== state.category) return false;
      if (state.status !== "all" && it.status !== state.status) return false;
      if (q) {
        const hay = `${it.name} ${it.id} ${it.description} ${it.category} ${it.original_category} ${it.local_port || ""} ${(it.cli_bins || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async function triggerLaunch(item, mode) {
    if (mode === "local" && item.local_url) {
      window.open(item.local_url, "_blank", "noopener,noreferrer");
      showToast(`Opened ${item.name} (${item.local_url})`);
      return;
    }
    if (mode === "browser") {
      const target = item.live_url || item.studio_url;
      if (target) {
        window.open(target, "_blank", "noopener,noreferrer");
        showToast(`Opened ${item.name} in browser`);
        return;
      }
    }
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || `Could not launch ${item.name}`);
        return;
      }
      showToast(`Launched ${item.name} (${data.mode})`);
    } catch (err) {
      showToast(`Launch failed: ${err.message}`);
    }
  }

  function primaryActionFor(item) {
    const caps = item.capabilities || {};
    if (caps.can_open_local) {
      return { label: `Open :${item.local_port}`, mode: "local", primary: true };
    }
    if (caps.can_launch_cli) {
      return { label: item.core_app && item.execution_type === "desktop_app" ? "Launch App" : "Launch CLI", mode: "cli", primary: true };
    }
    if (caps.can_open_browser) {
      return { label: "Open Web App", mode: "browser", primary: true };
    }
    return { label: "Install Info", mode: "details", primary: false };
  }

  function renderGrid() {
    const items = getFilteredItems();
    const catObj = (state.catalog?.categories || []).find((c) => c.id === state.category);
    els.activeHeading.textContent = catObj ? `${catObj.icon} ${catObj.name}` : "All Tools & Core Apps";
    els.resultsCount.textContent = `Showing ${items.length} of ${state.catalog?.summary?.total ?? 0}`;

    if (items.length === 0) {
      els.toolGrid.innerHTML = "";
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;

    els.toolGrid.innerHTML = items
      .map((it) => {
        const primary = primaryActionFor(it);
        const portTag = it.local_port ? `<span class="tag">:${it.local_port}</span>` : "";
        const coreTag = it.core_app ? `<span class="tag tag-core">Core OS</span>` : "";
        return `
        <article class="tool-card" data-id="${escapeHtml(it.id)}">
          <div class="card-top">
            <div class="card-title-wrap">
              <h3 class="card-title">${escapeHtml(it.name)}</h3>
              <div class="card-cat-row">
                ${coreTag}
                <span class="tag">${escapeHtml(it.category)}</span>
                ${portTag}
              </div>
            </div>
            <span class="status-badge status-${escapeHtml(it.status)}">
              <span class="dot ${dotClassFor(it.status)}"></span>
              ${escapeHtml(it.status_label)}
            </span>
          </div>
          <p class="card-desc">${escapeHtml(it.description)}</p>
          <div class="runtime-line" title="${escapeHtml(it.runtime_summary)}">${escapeHtml(it.runtime_summary)}</div>
          <div class="card-actions">
            <button
              type="button"
              class="btn ${primary.primary ? "btn-primary" : ""}"
              data-action="${escapeHtml(primary.mode)}"
              data-id="${escapeHtml(it.id)}"
            >${escapeHtml(primary.label)}</button>
            <button
              type="button"
              class="btn btn-details"
              data-action="details"
              data-id="${escapeHtml(it.id)}"
            >Details</button>
          </div>
        </article>`;
      })
      .join("");

    els.toolGrid.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const action = btn.getAttribute("data-action");
        const item = (state.catalog?.items || []).find((x) => x.id === id);
        if (!item) return;
        if (action === "details") {
          openModal(item);
        } else {
          triggerLaunch(item, action);
        }
      });
    });
  }

  function openModal(item) {
    state.activeItem = item;
    els.modalCategory.textContent = `${item.category} · ${item.original_category}`;
    els.modalTitle.textContent = item.name;
    els.modalStatusRow.innerHTML = `
      <span class="status-badge status-${escapeHtml(item.status)}">
        <span class="dot ${dotClassFor(item.status)}"></span>
        ${escapeHtml(item.status_label)}
      </span>
      <span class="tag">v${escapeHtml(item.version)}</span>
      <span class="tag">${escapeHtml(item.execution_type)}</span>
    `;
    els.modalDesc.textContent = item.description;

    const specs = [
      ["Runtime Truth", item.runtime_summary],
      ["Local Endpoint", item.local_url || "None"],
      ["Detected Binary", item.detected_bin || "Not found on PATH"],
      ["Web / Studio URL", item.live_url || item.studio_url || "Local only"],
    ];
    els.modalSpecs.innerHTML = specs
      .map(
        ([k, v]) => `
        <div class="spec-item">
          <dt>${escapeHtml(k)}</dt>
          <dd>${escapeHtml(v)}</dd>
        </div>`
      )
      .join("");

    els.modalPull.textContent = item.pull || `${item.id} --help`;

    const actions = [];
    const caps = item.capabilities || {};
    if (caps.can_open_local) {
      actions.push(`<button type="button" class="btn btn-primary" data-modal-act="local">Open Local (:${item.local_port})</button>`);
    }
    if (caps.can_launch_cli) {
      actions.push(`<button type="button" class="btn ${caps.can_open_local ? "" : "btn-primary"}" data-modal-act="cli">Launch Installed Binary</button>`);
    }
    if (caps.can_open_browser) {
      actions.push(`<button type="button" class="btn" data-modal-act="browser">Open Web Workbench ↗</button>`);
    }
    if (item.github) {
      actions.push(`<a class="btn" href="${escapeHtml(item.github)}" target="_blank" rel="noopener noreferrer">GitHub Source ↗</a>`);
    }
    els.modalActions.innerHTML = actions.join("");
    els.modalActions.querySelectorAll("button[data-modal-act]").forEach((b) => {
      b.addEventListener("click", () => triggerLaunch(item, b.getAttribute("data-modal-act")));
    });

    els.detailModal.hidden = false;
  }

  function closeModal() {
    els.detailModal.hidden = true;
    state.activeItem = null;
  }

  function renderAll() {
    renderStats();
    renderCategoryTabs();
    renderGrid();
  }

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`Copied ${label}`),
        () => showToast(`Copy failed — select text manually`)
      );
    } else {
      showToast(`Clipboard unavailable — copy manually`);
    }
  }

  function wireEvents() {
    els.themeToggle.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });

    els.refreshBtn.addEventListener("click", () => {
      fetchCatalog().then(() => showToast("Live port & binary probe refreshed"));
    });

    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value;
      els.clearSearch.hidden = state.query.length === 0;
      renderGrid();
    });

    els.clearSearch.addEventListener("click", () => {
      state.query = "";
      els.searchInput.value = "";
      els.clearSearch.hidden = true;
      renderGrid();
      els.searchInput.focus();
    });

    document.querySelectorAll(".status-pills .pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        state.status = pill.getAttribute("data-status") || "all";
        document.querySelectorAll(".status-pills .pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        renderGrid();
      });
    });

    els.resetFiltersBtn.addEventListener("click", () => {
      state.category = "all";
      state.status = "all";
      state.query = "";
      els.searchInput.value = "";
      els.clearSearch.hidden = true;
      document.querySelectorAll(".status-pills .pill").forEach((p) => {
        p.classList.toggle("active", p.getAttribute("data-status") === "all");
      });
      renderCategoryTabs();
      renderGrid();
    });

    els.modalClose.addEventListener("click", closeModal);
    els.detailModal.addEventListener("click", (e) => {
      if (e.target === els.detailModal) closeModal();
    });

    els.copyCmdBtn.addEventListener("click", () => {
      if (state.activeItem) {
        copyText(els.modalPull.textContent, "CLI command");
      }
    });

    els.copySolanaBtn.addEventListener("click", () => {
      const addr = els.copySolanaBtn.getAttribute("data-address");
      if (addr) copyText(addr, "Solana tip address");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.detailModal.hidden) {
        closeModal();
      } else if (e.key === "/" && document.activeElement !== els.searchInput && els.detailModal.hidden) {
        e.preventDefault();
        els.searchInput.focus();
      }
    });
  }

  initTheme();
  wireEvents();
  fetchCatalog();
})();
