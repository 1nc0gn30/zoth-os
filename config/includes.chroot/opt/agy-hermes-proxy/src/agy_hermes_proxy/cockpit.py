"""Zero-egress dual-theme Operator Cockpit (`GET /`) and Offline API Explorer (`GET /docs`)."""

from __future__ import annotations

import html
import json
from typing import Any, Dict, List

STRIPE_COFFEE_URL = "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
SOLANA_TIP_ADDRESS = "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
REPO_URL = "https://github.com/1nc0gn30/agy-hermes-proxy"
NULLAI_URL = "https://nullai.tech"

INLINE_FAVICON_DATA_URI = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
    "%3Crect width='64' height='64' rx='14' fill='%2308080B'/%3E"
    "%3Crect x='4' y='4' width='56' height='56' rx='11' fill='none' stroke='%23D4AF37' stroke-width='2.5'/%3E"
    "%3Cpath d='M18 44L32 16L46 44M23.5 34H40.5' fill='none' stroke='%23FFD700' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E"
    "%3C/svg%3E"
)

BASE_SHARED_CSS = """
:root,
html[data-theme="light"] {
  --bg-canvas: #FAF7F0;
  --bg-card: #FFFFFF;
  --bg-subtle: #F3EFE6;
  --bg-code: #F3EFE6;
  --text-primary: #101828;
  --text-secondary: #475467;
  --text-muted: #667085;
  --accent-gold: #9A6F0B;
  --accent-gold-bg: rgba(154, 111, 11, 0.10);
  --accent-gold-border: rgba(154, 111, 11, 0.36);
  --accent-emerald: #047857;
  --accent-emerald-bg: rgba(4, 120, 87, 0.10);
  --accent-cyan: #0369A1;
  --accent-cyan-bg: rgba(3, 105, 161, 0.10);
  --accent-danger: #BE123C;
  --border-subtle: rgba(16, 24, 40, 0.12);
  --border-strong: rgba(16, 24, 40, 0.22);
  --shadow-card: 0 8px 28px rgba(16, 24, 40, 0.06);
  --btn-primary-bg: #101828;
  --btn-primary-fg: #FAF7F0;
  color-scheme: light;
}

html[data-theme="dark"] {
  --bg-canvas: #08080B;
  --bg-card: #0E1017;
  --bg-subtle: #131620;
  --bg-code: #11141D;
  --text-primary: #F5F5F7;
  --text-secondary: #A1A7B3;
  --text-muted: #7C8496;
  --accent-gold: #FFD700;
  --accent-gold-bg: rgba(255, 215, 0, 0.10);
  --accent-gold-border: rgba(255, 215, 0, 0.30);
  --accent-emerald: #34D399;
  --accent-emerald-bg: rgba(52, 211, 153, 0.12);
  --accent-cyan: #38BDF8;
  --accent-cyan-bg: rgba(56, 189, 248, 0.12);
  --accent-danger: #FB7185;
  --border-subtle: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.20);
  --shadow-card: 0 12px 32px rgba(0, 0, 0, 0.45);
  --btn-primary-bg: #FFD700;
  --btn-primary-fg: #08080B;
  color-scheme: dark;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg-canvas);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

.shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 18px 40px;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-subtle);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent-gold-bg);
  border: 1px solid var(--accent-gold-border);
  color: var(--accent-gold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.brand h1 {
  margin: 0;
  font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
  font-size: clamp(1.35rem, 2.8vw, 1.95rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.18;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.nav-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.btn, a.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  min-width: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
  white-space: nowrap;
}

.btn:hover, a.btn:hover {
  border-color: var(--accent-gold-border);
  background: var(--bg-subtle);
}

.btn-primary, a.btn-primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-fg);
  border-color: transparent;
}

.btn-primary:hover, a.btn-primary:hover {
  opacity: 0.92;
  background: var(--btn-primary-bg);
}

.btn-accent, a.btn-accent {
  background: var(--accent-gold-bg);
  color: var(--accent-gold);
  border-color: var(--accent-gold-border);
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.pill-live {
  background: var(--accent-emerald-bg);
  color: var(--accent-emerald);
  border-color: transparent;
}

.pill-gold {
  background: var(--accent-gold-bg);
  color: var(--accent-gold);
  border-color: var(--accent-gold-border);
}

.pill-cyan {
  background: var(--accent-cyan-bg);
  color: var(--accent-cyan);
  border-color: transparent;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: var(--shadow-card);
  min-width: 0;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.kpi-value {
  margin-top: 6px;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.kpi-sub {
  margin-top: 3px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.section {
  margin-top: 24px;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-head h2 {
  margin: 0;
  font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
  font-size: 1.25rem;
  font-weight: 700;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.search-input {
  flex: 1 1 240px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--border-strong);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.92rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-btn {
  min-height: 44px;
  padding: 0 13px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.filter-btn[aria-pressed="true"] {
  background: var(--accent-gold-bg);
  color: var(--accent-gold);
  border-color: var(--accent-gold-border);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.model-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  min-width: 0;
}

.model-meta {
  min-width: 0;
}

.model-id {
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.model-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.copy-mini {
  min-height: 44px;
  min-width: 68px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.copy-mini:hover {
  border-color: var(--accent-gold-border);
  color: var(--accent-gold);
}

.two-col {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.snippet-card h3 {
  margin: 0 0 8px;
  font-size: 0.96rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

pre.code {
  margin: 0;
  padding: 13px 14px;
  border-radius: 10px;
  background: var(--bg-code);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-family: "JetBrains Mono", "SFMono-Regular", Consolas, ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.endpoint-list {
  display: grid;
  gap: 10px;
}

.endpoint-item {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--bg-card);
}

.endpoint-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.method-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 3px 9px;
  border-radius: 7px;
  font-family: ui-monospace, monospace;
  font-size: 0.76rem;
  font-weight: 800;
  background: var(--accent-gold-bg);
  color: var(--accent-gold);
  border: 1px solid var(--accent-gold-border);
}

.method-GET {
  background: var(--accent-emerald-bg);
  color: var(--accent-emerald);
  border-color: transparent;
}

.method-HEAD {
  background: var(--accent-cyan-bg);
  color: var(--accent-cyan);
  border-color: transparent;
}

.endpoint-path {
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.endpoint-desc {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: var(--text-secondary);
}

.footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.support-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
}

.support-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.sol-code {
  font-family: ui-monospace, monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.attribution {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.84rem;
  color: var(--text-secondary);
}

.attribution-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.text-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 6px;
  color: var(--accent-gold);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 600px) {
  .shell {
    padding: 14px 12px 32px;
  }
  .two-col {
    grid-template-columns: 1fr;
  }
  .model-grid {
    grid-template-columns: 1fr;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
"""

THEME_INIT_SCRIPT = """
(function () {
  var params = new URLSearchParams(window.location.search);
  var q = params.get("theme");
  var saved = null;
  try { saved = localStorage.getItem("agy-proxy-theme"); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = (q === "light" || q === "dark") ? q : ((saved === "light" || saved === "dark") ? saved : (prefersDark ? "dark" : "light"));
  document.documentElement.setAttribute("data-theme", theme);
})();
"""


def render_cockpit_html(
    *,
    version: str,
    host_bind: str,
    agy_available: bool,
    agy_version: str,
    models: List[Dict[str, Any]],
    active_requests: int,
    max_concurrency: int,
    total_requests: int,
    uptime_seconds: float,
) -> str:
    safe_host = html.escape(host_bind)
    safe_ver = html.escape(version)
    safe_agy_ver = html.escape(agy_version)
    status_label = "AGY ONLINE" if agy_available else "AGY MISSING"
    models_json = json.dumps(models).replace("</", "<\\/")
    base_url = f"http://{host_bind}"

    curl_chat = (
        f"curl -sS {base_url}/v1/chat/completions \\\n"
        f"  -H 'Content-Type: application/json' \\\n"
        f"  -d '{{\"model\":\"gemini-3.8-flash-high\",\"messages\":[{{\"role\":\"user\",\"content\":\"Ping\"}}]}}'"
    )
    hermes_yaml = (
        "model:\n"
        "  provider: openai\n"
        f"  base_url: {base_url}/v1\n"
        "  default: gemini-3.8-flash-high\n"
        "  api_key: local-loopback"
    )

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AGY-Hermes OpenAI Bridge v{safe_ver} — Operator Cockpit</title>
  <link rel="icon" href="{INLINE_FAVICON_DATA_URI}" />
  <script>{THEME_INIT_SCRIPT}</script>
  <style>{BASE_SHARED_CSS}</style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">AGY</div>
        <div>
          <h1>AGY-Hermes OpenAI Bridge</h1>
          <p class="subtitle">Hardened Loopback OpenAI-Compatible Runtime &amp; Operator Cockpit</p>
        </div>
      </div>
      <nav class="nav-actions" aria-label="Primary actions">
        <a class="btn btn-primary" href="/docs">Offline API Docs</a>
        <a class="btn" href="/v1/models">Models JSON</a>
        <a class="btn" href="/metrics">Metrics JSON</a>
        <button id="refreshBtn" class="btn" type="button">Refresh Live</button>
        <button id="themeToggle" class="btn btn-accent" type="button" aria-label="Toggle color theme">Theme</button>
      </nav>
    </header>

    <div class="badge-row" aria-label="Runtime status badges">
      <span class="pill pill-live" id="statusPill">● {status_label}</span>
      <span class="pill pill-gold">v{safe_ver}</span>
      <span class="pill pill-cyan">{safe_host}</span>
      <span class="pill">Zero-Egress Local UI</span>
      <span class="pill">Loopback CORS + Host Guard</span>
    </div>

    <section class="kpi-grid" aria-label="Live runtime metrics">
      <article class="card">
        <div class="kpi-label">AGY CLI Runtime</div>
        <div class="kpi-value" id="kpiAgy">{safe_agy_ver}</div>
        <div class="kpi-sub">Dynamic PATH / AGY_BIN resolution</div>
      </article>
      <article class="card">
        <div class="kpi-label">Live Model Catalog</div>
        <div class="kpi-value" id="kpiModels">{len(models)}</div>
        <div class="kpi-sub">TTL-cached <code>agy models</code> discovery</div>
      </article>
      <article class="card">
        <div class="kpi-label">Concurrency Slots</div>
        <div class="kpi-value" id="kpiSlots">{active_requests} / {max_concurrency}</div>
        <div class="kpi-sub">Semaphore-bounded (<code>429</code> backpressure)</div>
      </article>
      <article class="card">
        <div class="kpi-label">Total Requests</div>
        <div class="kpi-value" id="kpiReqs">{total_requests}</div>
        <div class="kpi-sub">Uptime: <span id="kpiUptime">{uptime_seconds:.1f}s</span></div>
      </article>
    </section>

    <section class="section" aria-labelledby="catalogHeading">
      <div class="section-head">
        <h2 id="catalogHeading">Live Model Catalog (<span id="visibleCount">{len(models)}</span> / <span id="totalCount">{len(models)}</span>)</h2>
        <span class="pill">Strict 404 on unknown IDs</span>
      </div>
      <div class="controls">
        <input id="modelSearch" class="search-input" type="search" placeholder="Filter models (neon, claude, flash)..." aria-label="Filter models" />
        <div class="filter-bar" role="group" aria-label="Model family filters">
          <button class="filter-btn" type="button" data-family="all" aria-pressed="true">All</button>
          <button class="filter-btn" type="button" data-family="gemini-4" aria-pressed="false">Gemini 4</button>
          <button class="filter-btn" type="button" data-family="orchestrator" aria-pressed="false">Orchestrator</button>
          <button class="filter-btn" type="button" data-family="flash" aria-pressed="false">Flash 3.8</button>
          <button class="filter-btn" type="button" data-family="claude" aria-pressed="false">Claude 5.5</button>
          <button class="filter-btn" type="button" data-family="gpt" aria-pressed="false">GPT-OSS</button>
        </div>
      </div>
      <div id="modelGrid" class="model-grid"></div>
    </section>

    <section class="section" aria-labelledby="snippetsHeading">
      <div class="section-head">
        <h2 id="snippetsHeading">Endpoint Explorer &amp; Integration Snippets</h2>
        <a class="btn" href="/openapi.json">OpenAPI 3.1 JSON</a>
      </div>
      <div class="two-col">
        <article class="card snippet-card">
          <h3>
            <span>OpenAI Chat Completion (<code>curl</code>)</span>
            <button class="copy-mini" type="button" data-copy-target="curlSnippet">Copy</button>
          </h3>
          <pre id="curlSnippet" class="code">{html.escape(curl_chat)}</pre>
        </article>
        <article class="card snippet-card">
          <h3>
            <span>Hermes Config (<code>~/.hermes/config.yaml</code>)</span>
            <button class="copy-mini" type="button" data-copy-target="hermesSnippet">Copy</button>
          </h3>
          <pre id="hermesSnippet" class="code">{html.escape(hermes_yaml)}</pre>
        </article>
      </div>
    </section>

    <footer class="footer">
      <div class="support-bar">
        <div>
          <strong>100% Open-Access Local Bridge</strong>
          <div class="sol-code">Solana Tip: {SOLANA_TIP_ADDRESS}</div>
        </div>
        <div class="support-actions">
          <a class="btn btn-accent" href="{STRIPE_COFFEE_URL}" target="_blank" rel="noopener noreferrer">☕ Buy Us a Coffee</a>
          <a class="btn" href="solana:{SOLANA_TIP_ADDRESS}">Solana Tip</a>
          <button class="copy-mini" type="button" data-copy-text="{SOLANA_TIP_ADDRESS}">Copy SOL</button>
        </div>
      </div>
      <div class="attribution">
        <span>Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform</span>
        <div class="attribution-links">
          <a class="text-link" href="{REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
          <a class="text-link" href="{NULLAI_URL}" target="_blank" rel="noopener noreferrer">nullai.tech</a>
        </div>
      </div>
    </footer>
  </div>

  <script>
  (function () {{
    var models = {models_json};
    var activeFamily = "all";
    var grid = document.getElementById("modelGrid");
    var searchEl = document.getElementById("modelSearch");
    var visibleCountEl = document.getElementById("visibleCount");
    var totalCountEl = document.getElementById("totalCount");

    function copyText(text, btn) {{
      if (navigator.clipboard && navigator.clipboard.writeText) {{
        navigator.clipboard.writeText(text).catch(function () {{}});
      }}
      if (btn) {{
        var prev = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(function () {{ btn.textContent = prev; }}, 1200);
      }}
    }}

    function matchesFamily(id, fam) {{
      if (fam === "all") return true;
      var low = id.toLowerCase();
      if (fam === "gemini-4") return low.indexOf("gemini-4-") === 0;
      if (fam === "orchestrator") return low.indexOf("orchestrator") !== -1;
      if (fam === "flash") return low.indexOf("flash") !== -1;
      if (fam === "claude") return low.indexOf("claude-") === 0;
      if (fam === "gpt") return low.indexOf("gpt-") === 0;
      return true;
    }}

    function renderModels() {{
      var q = (searchEl.value || "").trim().toLowerCase();
      var filtered = models.filter(function (m) {{
        var id = String(m.id || "");
        var label = String(m.display_name || "");
        return matchesFamily(id, activeFamily) && (!q || id.toLowerCase().indexOf(q) !== -1 || label.toLowerCase().indexOf(q) !== -1);
      }});
      visibleCountEl.textContent = String(filtered.length);
      totalCountEl.textContent = String(models.length);
      grid.innerHTML = "";
      filtered.forEach(function (m) {{
        var card = document.createElement("div");
        card.className = "model-card";
        var meta = document.createElement("div");
        meta.className = "model-meta";
        var idEl = document.createElement("div");
        idEl.className = "model-id";
        idEl.textContent = m.id;
        var labelEl = document.createElement("div");
        labelEl.className = "model-label";
        labelEl.textContent = (m.display_name || m.id) + " · " + (m.owned_by || "antigravity");
        meta.appendChild(idEl);
        meta.appendChild(labelEl);
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "copy-mini";
        btn.textContent = "Copy ID";
        btn.addEventListener("click", function () {{ copyText(m.id, btn); }});
        card.appendChild(meta);
        card.appendChild(btn);
        grid.appendChild(card);
      }});
    }}

    document.querySelectorAll(".filter-btn").forEach(function (btn) {{
      btn.addEventListener("click", function () {{
        activeFamily = btn.getAttribute("data-family") || "all";
        document.querySelectorAll(".filter-btn").forEach(function (b) {{
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        }});
        renderModels();
      }});
    }});

    searchEl.addEventListener("input", renderModels);

    document.querySelectorAll("[data-copy-target]").forEach(function (btn) {{
      btn.addEventListener("click", function () {{
        var target = document.getElementById(btn.getAttribute("data-copy-target"));
        if (target) copyText(target.textContent || "", btn);
      }});
    }});

    document.querySelectorAll("[data-copy-text]").forEach(function (btn) {{
      btn.addEventListener("click", function () {{
        copyText(btn.getAttribute("data-copy-text") || "", btn);
      }});
    }});

    var themeBtn = document.getElementById("themeToggle");
    function syncThemeLabel() {{
      var cur = document.documentElement.getAttribute("data-theme") || "light";
      themeBtn.textContent = cur === "dark" ? "Light Mode" : "Dark Mode";
    }}
    syncThemeLabel();
    themeBtn.addEventListener("click", function () {{
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {{ localStorage.setItem("agy-proxy-theme", next); }} catch (e) {{}}
      syncThemeLabel();
    }});

    async function refreshLive() {{
      try {{
        var res = await Promise.all([
          fetch("/health").then(function (r) {{ return r.json(); }}),
          fetch("/metrics").then(function (r) {{ return r.json(); }}),
          fetch("/v1/models").then(function (r) {{ return r.json(); }})
        ]);
        var h = res[0], m = res[1], list = res[2];
        if (h && typeof h.agy_available === "boolean") {{
          document.getElementById("statusPill").textContent = h.agy_available ? "● AGY ONLINE" : "● AGY MISSING";
          document.getElementById("kpiAgy").textContent = h.agy_version || (h.agy_available ? "available" : "unavailable");
        }}
        if (m) {{
          document.getElementById("kpiSlots").textContent = m.active_concurrency + " / " + m.max_concurrency;
          document.getElementById("kpiReqs").textContent = String(m.total_requests);
          document.getElementById("kpiUptime").textContent = Number(m.uptime_seconds || 0).toFixed(1) + "s";
        }}
        if (list && Array.isArray(list.data)) {{
          models = list.data;
          document.getElementById("kpiModels").textContent = String(models.length);
          renderModels();
        }}
      }} catch (e) {{}}
    }}

    document.getElementById("refreshBtn").addEventListener("click", refreshLive);
    renderModels();
  }})();
  </script>
</body>
</html>"""


def render_offline_docs_html(*, version: str, host_bind: str) -> str:
    safe_ver = html.escape(version)
    safe_host = html.escape(host_bind)

    return f"""<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AGY-Hermes OpenAI Bridge v{safe_ver} — Offline API Explorer</title>
  <link rel="icon" href="{INLINE_FAVICON_DATA_URI}" />
  <script>{THEME_INIT_SCRIPT}</script>
  <style>{BASE_SHARED_CSS}</style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">OAS</div>
        <div>
          <h1>Offline OpenAPI Explorer</h1>
          <p class="subtitle">Zero-CDN local specification viewer for AGY-Hermes Bridge v{safe_ver} ({safe_host})</p>
        </div>
      </div>
      <nav class="nav-actions" aria-label="Explorer navigation">
        <a class="btn btn-primary" href="/">← Operator Cockpit</a>
        <a class="btn" href="/openapi.json">Raw OpenAPI 3.1</a>
        <button id="themeToggle" class="btn btn-accent" type="button">Theme</button>
      </nav>
    </header>

    <div class="badge-row">
      <span class="pill pill-live">● Zero External CDN Requests</span>
      <span class="pill pill-gold">v{safe_ver}</span>
      <span class="pill">Strict Pydantic Schemas</span>
      <span class="pill">OpenAI Error Envelopes</span>
    </div>

    <section class="section" aria-labelledby="routesHeading">
      <div class="section-head">
        <h2 id="routesHeading">HTTP Endpoints</h2>
        <span class="pill" id="routeCount">Loading /openapi.json...</span>
      </div>
      <div id="endpointList" class="endpoint-list"></div>
    </section>

    <section class="section" aria-labelledby="schemasHeading">
      <div class="section-head">
        <h2 id="schemasHeading">Pydantic Component Schemas</h2>
      </div>
      <div id="schemaList" class="two-col"></div>
    </section>

    <footer class="footer">
      <div class="support-bar">
        <div>
          <strong>100% Air-Gapped Local Documentation</strong>
          <div class="sol-code">Solana Tip: {SOLANA_TIP_ADDRESS}</div>
        </div>
        <div class="support-actions">
          <a class="btn btn-accent" href="{STRIPE_COFFEE_URL}" target="_blank" rel="noopener noreferrer">☕ Buy Us a Coffee</a>
          <a class="btn" href="solana:{SOLANA_TIP_ADDRESS}">Solana Tip</a>
        </div>
      </div>
      <div class="attribution">
        <span>Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform</span>
        <div class="attribution-links">
          <a class="text-link" href="{REPO_URL}" target="_blank" rel="noopener noreferrer">GitHub Repo</a>
          <a class="text-link" href="{NULLAI_URL}" target="_blank" rel="noopener noreferrer">nullai.tech</a>
        </div>
      </div>
    </footer>
  </div>

  <script>
  (function () {{
    var themeBtn = document.getElementById("themeToggle");
    function syncTheme() {{
      var cur = document.documentElement.getAttribute("data-theme") || "light";
      themeBtn.textContent = cur === "dark" ? "Light Mode" : "Dark Mode";
    }}
    syncTheme();
    themeBtn.addEventListener("click", function () {{
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {{ localStorage.setItem("agy-proxy-theme", next); }} catch (e) {{}}
      syncTheme();
    }});

    fetch("/openapi.json")
      .then(function (r) {{ return r.json(); }})
      .then(function (spec) {{
        var epRoot = document.getElementById("endpointList");
        var paths = spec.paths || {{}};
        var count = 0;
        Object.keys(paths).forEach(function (path) {{
          var methods = paths[path];
          Object.keys(methods).forEach(function (method) {{
            count += 1;
            var op = methods[method] || {{}};
            var item = document.createElement("article");
            item.className = "endpoint-item";
            var top = document.createElement("div");
            top.className = "endpoint-top";
            var tag = document.createElement("span");
            tag.className = "method-tag method-" + method.toUpperCase();
            tag.textContent = method.toUpperCase();
            var pathEl = document.createElement("span");
            pathEl.className = "endpoint-path";
            pathEl.textContent = path;
            top.appendChild(tag);
            top.appendChild(pathEl);
            if (Array.isArray(op.tags) && op.tags.length) {{
              var pill = document.createElement("span");
              pill.className = "pill";
              pill.textContent = op.tags[0];
              top.appendChild(pill);
            }}
            var desc = document.createElement("p");
            desc.className = "endpoint-desc";
            desc.textContent = op.summary || op.operationId || "";
            item.appendChild(top);
            item.appendChild(desc);
            epRoot.appendChild(item);
          }});
        }});
        document.getElementById("routeCount").textContent = count + " OpenAPI routes";

        var schemaRoot = document.getElementById("schemaList");
        var schemas = (spec.components && spec.components.schemas) || {{}};
        Object.keys(schemas).forEach(function (name) {{
          var card = document.createElement("article");
          card.className = "card snippet-card";
          var h3 = document.createElement("h3");
          h3.textContent = name;
          var pre = document.createElement("pre");
          pre.className = "code";
          pre.textContent = JSON.stringify(schemas[name], null, 2);
          card.appendChild(h3);
          card.appendChild(pre);
          schemaRoot.appendChild(card);
        }});
      }})
      .catch(function (err) {{
        document.getElementById("routeCount").textContent = "Failed to load spec: " + err;
      }});
  }})();
  </script>
</body>
</html>"""
