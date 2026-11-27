---
title: "Etsy Connector"
tags: [studio, tool, verified, open-access, walkthrough-complete]
aliases: ["etsy-connector", "Etsy Connector"]
pillar: "Pillar III: Autonomous Commerce & Storefront Engines"
category: "Commerce & MCP"
runs: "server+browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
version: "2.6.0"
tested_at: "2026-11-26"
test_status: "PASS (v2.6.0 Whiteboard Remediation Verified)"
local_port: 8108
cli_binary: "etsy-connector"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/etsy-connector"
live_url: "http://127.0.0.1:8108"
studio_url: "http://127.0.0.1:3000/tools/etsy-connector"
braille_shape: "lotus"
braille_archetype: "13-Tag SEO Matrix & Printify/Gelato POD Bridge"
---

# Etsy Connector (`v2.6.0`) — Complete Developer & End-User Reference

> [!CHECK] Sovereign Verification Passed (`v2.6.0` · 100% Free & Open-Access)
> **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform**
> Hardened pure-Python standard-library loopback server (`127.0.0.1:8108`), dual-theme 5-tab Web Cockpit, Studio God-Mode Deck (`/tools/etsy-connector`), 8 JSON-RPC 2.0 stdio MCP tools, and live Unicode `U+2800` Braille TUI.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `etsy-connector` (`v2.6.0`) |
| **Category** | `Commerce & MCP` |
| **Runtime Engine** | Pure Python 3.10+ Standard Library HTTP/MCP Daemon + Dual-Theme Browser Cockpit |
| **Local Port & URL** | `:8108` (on-demand) • [http://127.0.0.1:8108](http://127.0.0.1:8108) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/etsy-connector](http://127.0.0.1:3000/tools/etsy-connector) |
| **CLI & TUI Binaries** | `/usr/local/bin/etsy-connector` · `/usr/local/bin/etsy-connector-tui` |
| **Staging Path** | `/opt/etsy-connector/` (lean `< 1 MiB` chroot & host staging) |
| **GitHub Repository** | [https://github.com/1nc0gn30/etsy-connector](https://github.com/1nc0gn30/etsy-connector) |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Core Capabilities (`v2.6.0`)

### 1. 5-Tab Dual-Theme Standalone Workstation (`http://127.0.0.1:8108`)
- **Tab 1 — 13-Tag SEO Auditor**: Audits 140-character title compliance, mobile first-40-character front-loading, separator count, all-caps checks, 13×20-character tags, duplicates, single-word ratios, and description length via `POST /api/audit` (with exact offline fallback).
- **Tab 2 — Fee & Margin Calculator**: Computes exact Etsy fee schedules (`$0.20` listing, `6.5%` transaction, `3.0% + $0.25` US payment processing, and **`0%` / `12%` (`>= $10k/yr`) / `15%` (`< $10k/yr`)** Offsite Ads) plus break-even retail price and CSV export. Example (`$38.99` retail, `$15.50` POD cost):
  - **0% Organic**: `$4.15` total Etsy fees → **`$19.34` net profit** (`49.6%` margin, `124.8%` ROI, `$17.62` break-even).
  - **12% Offsite Ads (`>= $10k/yr`)**: `$8.83` total Etsy fees → **`$14.66` net profit** (`37.6%` margin, `$20.32` break-even).
  - **15% Offsite Ads (`< $10k/yr`)**: `$10.00` total Etsy fees → **`$13.49` net profit** (`34.6%` margin, `$21.13` break-even).
- **Tab 3 — Printify & Gelato POD**: Generates Printify REST API v1 payloads (accurate provider IDs `29`, `26`, `3`, `0`) and Gelato Ecommerce API v4 payloads (`productUid` + regional routing).
- **Tab 4 — Search, Drafts & PKCE**: Competitor search (`/api/search`), dry-run-safe draft previews (`/api/create-draft`, `confirm=false` default), RFC 7636 OAuth 2.0 PKCE S256 generation, and canonical 8-node Etsy seller taxonomy lookup.
- **Tab 5 — 8 MCP Tools & CLI**: Live inspection of all 8 registered stdio MCP tools and ZothOS CLI/MCP configs.
- Supports **Editorial Ivory Light** and **Obsidian Gold Dark** via `?theme=light|dark`, `?embed=1`, `prefers-color-scheme`, and header toggle with zero external CDN requests.

### 2. Zoth Studio v2 God-Mode Deck (`http://127.0.0.1:3000/tools/etsy-connector`)
- Built on pure-JS `src/utils/etsyConnectorEngine.js` with full parity across 13-Tag SEO Auditor, `0%/12%/15%` Fee & Break-Even Calculator, Printify & Gelato POD Builder, RFC 7636 PKCE S256, Open API v3 REST curl builder, all 8 MCP tools (`python3 -m etsy_connector.cli mcp`), canonical 8-node taxonomy (`1099/1098/1085/1095/1089/1077/1065/1092`), and 10 QPS / 10,000 QPD quota planner.

### 3. CLI, Braille TUI & 8 Stdio MCP Tools
```bash
etsy-connector --status
etsy-connector --json
etsy-connector audit --title "Botanical Wildflower Crewneck Sweatshirt..." --tags "wildflower crewneck,botanical gift" --json
etsy-connector profit --retail 38.99 --pod 15.50 --offsite-ads-rate 0.12 --json
etsy-connector pod --provider gelato --blueprint fine_art_poster_18x24 --title "Botanical Poster"
etsy-connector mcp
etsy-connector-tui --once --json
```

**8 Registered MCP Tools**: `etsy_search_listings`, `etsy_audit_listing_seo`, `etsy_calculate_profit_margins`, `etsy_get_taxonomy_categories`, `etsy_create_draft_listing`, `etsy_upload_listing_image`, `etsy_get_shop_details`, `etsy_generate_pod_payload`.

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
- [[00 Home]] · [[Zoth OS]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Memory]] · [[Public Surfaces]]
