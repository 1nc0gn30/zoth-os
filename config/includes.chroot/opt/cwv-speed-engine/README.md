# CWV Speed Engine (`v2.6.0`)

Core Web Vitals diagnostic engine, HTML AST speed transformer, W3C Speculation Rules & 103 Early Hints generator, performance budget & LoAF simulator, PWA builder, immutable edge cache exporter, Unicode Braille TUI, and 8-tool JSON-RPC 2.0 MCP server — built with zero external Python runtime dependencies (Python 3.8+ standard library + browser DOM).

100% Free & Open-Access (MIT License, zero paywalls, zero external egress).

## What It Does

- **Core Web Vitals Auditor**: Audits HTML markup and SSRF-validated public `http(s)` URLs across Mobile and Desktop profiles for **LCP**, **CLS**, **INP**, **FCP**, **TTFB**, and **Speed Index**.
- **HTML Speed Transformer**: Injects explicit `width`/`height` dimensions, `fetchpriority="high"` + `<link rel="preload" as="image">` on hero LCP media, `loading="lazy" decoding="async"` on offscreen images, `&display=swap` + `<link rel="preconnect">` for Google Fonts, critical CSS containment, and `<head>`-scoped `defer` on render-blocking scripts.
- **Performance Diff Comparator**: Computes exact score and metric deltas between baseline and candidate HTML documents (identical inputs return `0` delta).
- **W3C Speculation Rules & Budget Simulator**: Generates `<script type="speculationrules">` (automatically excluding `/logout`, `/cart`, `/checkout`, `/admin`, `/api/`), audits JS/CSS/Image/Font byte budgets across Fast 3G/4G/5G networks, flags LoAF main-thread blockers, and exports Lighthouse `budget.json`.
- **PWA, OpenGraph & Edge Cache Exporters**: Builds strategy-differentiated Service Workers (`stale-while-revalidate`, `cache-first`, `network-first`), `site.webmanifest`, `offline.html`, HTML-escaped OpenGraph tags, real `.zip` bundles, and cache headers for Netlify, Vercel, Nginx, Cloudflare, Next.js, and Apache.
- **SSRF Defense-in-Depth (`url_guard.py`) & Hardened `:8128` Server**:
  - Strict `http`/`https` scheme allowlist (blocks `file://`, `ftp://`, `gopher://`, `data:`, `javascript:` with `400 JSON`).
  - DNS resolution & global IP verification via `socket.getaddrinfo()` + `ipaddress` (blocks `127.0.0.0/8`, `::1`, `169.254.169.254`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`, `fe80::/10`, `0.0.0.0/8`, `localhost` with `403 JSON`).
  - Redirect-hop validation (`SafeRedirectHandler`, max 3 hops, re-validates every hop), `2 MiB` bounded read cap, and `5s` timeout.
  - Loopback `Host` header allowlist (`403 JSON` on DNS rebinding), exact-port CORS allowlist (`:8128` & `:3000` only, `Vary: Origin`, zero `*` wildcard), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, loopback `CSP`, disabled directory listing (`403 JSON`), canonical path-traversal protection (`403 JSON`), `1 MiB` POST cap (`413 JSON`), and strict JSON object validation (`400 JSON`).

## Quickstart

```bash
git clone https://github.com/1nc0gn30/cwv-speed-engine.git
cd cwv-speed-engine

# Launch the hardened Speed Studio UI and REST API on 127.0.0.1:8128
python3 server.py --host 127.0.0.1 --port 8128
```

Open `http://127.0.0.1:8128` in any browser (Editorial Ivory Light & Obsidian Gold Dark themes). Always use `python3 server.py` (never `python3 -m http.server`, which disables all `/api/*` endpoints).

## ZothOS CLI & Braille TUI Commands

Both `cwv-speed-engine` and symlink alias `cwv-speed` plus `cwv-speed-engine-tui` are installed on `$PATH`:

```bash
# Version, status, and portable JSON telemetry
cwv-speed-engine --version
cwv-speed-engine --status
cwv-speed-engine --json

# Audit a local HTML file (mobile or desktop)
cwv-speed-engine audit ./public/index.html --device mobile --json
cwv-speed-engine check ./public/index.html --min-score 85 --json

# Transform HTML, compare diffs, generate Speculation Rules, and audit budgets
cwv-speed-engine optimize ./public/index.html --output ./optimized.html
cwv-speed-engine diff ./baseline.html ./optimized.html --json
cwv-speed-engine speculation ./public/index.html --aggressiveness balanced --format json
cwv-speed-engine budget ./public/index.html --script-budget 170 --lighthouse

# Export cache configs, PWA bundles, and OpenGraph snippets
cwv-speed-engine cache --framework netlify --days 365 --json
cwv-speed-engine pwa --name "NullAI App" --theme-color "#047857" --json
cwv-speed-engine og --title "NullAI App" --desc "Core Web Vitals workstation" --json

# Launch local :8128 workstation or Unicode U+2800 Braille TUI
cwv-speed-engine serve --host 127.0.0.1 --port 8128
cwv-speed-engine-tui --once
cwv-speed-engine-tui --file ./public/index.html --json
```

## MCP Server Integration (8 Registered Tools)

Start the JSON-RPC 2.0 stdio MCP server or print client configs:

```bash
cwv-speed-engine mcp
cwv-speed-engine mcp --tools
cwv-speed-engine mcp --config claude
```

Registered tools in `src/cwv_speed_engine/mcp_server.py`:
1. `cwv_audit_site` — Audit a validated public URL or HTML document for LCP, CLS, INP, FCP, TTFB, and TBT.
2. `cwv_optimize_html` — Rewrite HTML with explicit dimensions, hero priority, lazy loading, and `<head>` script deferral.
3. `cwv_generate_cache_config` — Export immutable caching configs for Netlify, Vercel, Nginx, Next.js, Cloudflare, or Apache.
4. `cwv_generate_pwa` — Compile W3C `site.webmanifest` and strategy-specific Service Worker `sw.js`.
5. `cwv_generate_og_card` — Generate HTML-escaped OpenGraph, Twitter Card, and Schema.org JSON-LD snippets.
6. `cwv_diff_performance` — Compare baseline vs. candidate performance scores and metric deltas.
7. `cwv_generate_speculation_rules` — Generate W3C Speculation Rules and `103 Early Hints` headers.
8. `cwv_audit_performance_budget` — Evaluate payload budgets across 3G/4G/5G and emit Lighthouse `budget.json`.

## Verified REST API Endpoints (`127.0.0.1:8128`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `HEAD` | `/health`, `/api/health` | Service health & version (`2.6.0`) |
| `GET` | `/api/platform`, `/api/tools` | Runtime diagnostics & 8 registered MCP tool schemas |
| `GET` / `POST` | `/api/mcp/config` | Client MCP configs (`claude`, `cursor`, `cline`, `windsurf`, `zed`) |
| `POST` | `/api/audit` | SSRF-guarded URL or HTML Core Web Vitals audit |
| `POST` | `/api/optimize`, `/api/transform` | HTML AST speed transformation |
| `POST` | `/api/diff`, `/api/compare` | Baseline vs. candidate CWV diff comparator |
| `POST` | `/api/speculation` | W3C Speculation Rules & `103 Early Hints` |
| `GET` / `POST` | `/api/budget` | Performance budget & network transfer simulation |
| `GET` / `POST` | `/api/cache`, `/api/cache/export` | Immutable edge cache & security headers |
| `POST` | `/api/pwa`, `/api/pwa/generate` | Strategy-accurate PWA manifest, `sw.js`, and `offline.html` |
| `POST` | `/api/og`, `/api/og/generate` | HTML-escaped OpenGraph & Twitter Card metadata |
| `POST` | `/api/export-zip` | Real ZIP export (`pwa`, `optimized_html`, `starter`, `cwv_kit`) |

## Testing & Verification

```bash
# Python unit & SSRF/security test suite
PYTHONPATH=src python3 -m pytest -q

# Client-side JS engine unit tests
node --test tests/test_frontend_engine.mjs

# Built-in CLI verification suite
PYTHONPATH=src python3 -m cwv_speed_engine.cli --test
```

## Support & Attribution

CWV Speed Engine is **100% free and open access**. Optional community support:
- **Stripe**: [Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **Solana Tip**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

Engineered by Neal Frazier Tech ([@1nc0gn30](https://github.com/1nc0gn30/cwv-speed-engine)) • [NullAI Platform](https://nullai.tech)
