---
title: "Gelato Connector"
tags: [studio, tool, verified, open-access, walkthrough-complete]
aliases: ["gelato-connector", "Gelato Connector"]
pillar: "Pillar III: Autonomous Commerce & Storefront Engines"
category: "Commerce & POD"
runs: "server+browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-27"
test_status: "PASS (v2.6.0 Whiteboard Re-Audit Verified)"
local_port: 8116
cli_binary: "gelato-connector"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/gelato-connector"
live_url: "http://127.0.0.1:8116"
studio_url: "http://127.0.0.1:3000/tools/gelato-connector"
workstation_shot: "Studio/Tools/Artifacts/gelato-connector/gelato-connector_07_gui_standalone_margin_router.jpg"
studio_shot: "Studio/Tools/Artifacts/gelato-connector/gelato-connector_10_gui_studio_godmode_router.jpg"
cli_shot: "Studio/Tools/Artifacts/gelato-connector/gelato-connector_05_cli_shipping_and_audit.jpg"
braille_shape: "astrolabe"
braille_archetype: "Planetary Geo-Routing Astrolabe"
---

# Gelato Connector (`v2.6.0`) — Developer & Operator Guide

> [!CHECK] Whiteboard Remediation Verified (`v2.6.0` · 100% Free & Open-Access)
> **Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform**
> Hardened Python 3 standard-library loopback daemon (`127.0.0.1:8116`, user systemd unit `gelato-connector.service` staged in `/opt/gelato-connector`), Dual-Theme Editorial Ivory Light + Obsidian Gold Dark standalone UI (zero external CDN requests), Zoth Studio v2 God-Mode route (`/tools/gelato-connector`), 4-way synced ZothOS CLI/TUI, and 6 JSON-RPC 2.0 stdio MCP tools.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `gelato-connector` (`v2.6.0`) |
| **Category** | `Commerce & MCP` |
| **Mathematical Pillar** | `Pillar III: Autonomous Commerce & Storefront Engines` |
| **Runtime Engine** | Pure Python 3.10+ Standard Library HTTP/MCP Daemon (`gelato-connector.service`) + Pure-JS Studio Engine |
| **API Targets** | Gelato Product API v3 (`product.gelatoapis.com/v3`) & Order API v4 (`order.gelatoapis.com/v4/orders`) |
| **Catalog & Hubs** | `7` Curated Print Products (real Gelato v4 `product_uid`s) · `10` Bundled Local Hubs (`US, CA, UK/GB, DE, FR, IT, ES, NL, AU, JP`) |
| **Local Port & URL** | `:8116` • [http://127.0.0.1:8116](http://127.0.0.1:8116) |
| **Studio Route** | [http://127.0.0.1:3000/tools/gelato-connector](http://127.0.0.1:3000/tools/gelato-connector) |
| **CLI & TUI Binaries** | `/usr/local/bin/gelato-connector` • `/usr/local/bin/gelato-connector-tui` • `/opt/gelato-connector/bin/` |
| **Automated Test Suite** | `42 passed` (`PYTHONPATH=src /opt/zothos-ai-env/bin/pytest -q`) + `5 passed` Studio engine tests |
| **License & Pricing** | **100% Free & Open-Access** (MIT) • Zero Paywalls |
| **Support Rails** | [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Key `v2.6.0` Capabilities & Security Controls

1. **Loopback Security Hardening (`127.0.0.1:8116`)**:
   - Strict loopback `Host` header check (`403` on DNS-rebinding hosts) and exact-port loopback `Origin` allowlist (`:8116` and Studio `:3000`; `403` on spoofed port-suffix `:81160` and external origins across `GET`, `HEAD`, `OPTIONS`, `POST`, emitting `Vary: Origin` and zero `*`).
   - All 4 HTTP security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy` with loopback `frame-ancestors`), disabled `/assets/` directory indexing (`403`), `HEAD` support on `/health` & `/api/*`, `1 MiB` `413` body cap, and `400` validation for invalid JSON/types/zero dimensions.
2. **FX-Safe Multi-Currency Margins & 10-Hub Routing**:
   - Converts destination hub shipping costs (e.g., Japan `650 JPY` ≈ `$4.33 USD`) into the chosen calculation currency before computing COGS, net profit, break-even, and cross-border freight savings (`+1,825 JPY` for JP).
3. **Order API v4 Safe Drafts & SSRF Protection**:
   - Emits real Gelato v4 `productUid` strings, defaults `orderType` to `"draft"`, and enforces `validate_public_https_url()` across both REST and MCP (blocking `file://`, `http://`, loopback, RFC1918, and `169.254.169.254` IMDS URLs).
4. **300-DPI & DTG Apparel Bleed Auditor**:
   - Guards `width <= 0` / `height <= 0` cleanly and marks `0 mm` bleed DTG apparel (`stanley_stella_organic_tee`) as `bleed_compliance: true`.

---

## ZothOS CLI, TUI & 6-Tool MCP Commands

```bash
# Daemon health & status
systemctl --user status gelato-connector.service
gelato-connector --version
gelato-connector status --json
gelato-connector desktop --dry-run --json

# Catalog, 10-hub shipping, FX-safe JP margin & 300-DPI audit
gelato-connector catalog
gelato-connector shipping --product wooden_framed_canvas_16x24 --country JP
gelato-connector margins --product wooden_framed_canvas_16x24 --price 68 --currency USD --country JP
gelato-connector audit --product stanley_stella_organic_tee --width 4000 --height 4800

# Braille TUI benchmark & 6-tool JSON-RPC 2.0 stdio MCP server
gelato-connector-tui --status --json
gelato-connector-tui --once --json
gelato-connector mcp
```

### 6 Registered Stdio MCP Tools (`GET /api/mcp/tools`)
- `gelato_search_catalog`
- `gelato_get_shipping_quote`
- `gelato_calculate_margins`
- `gelato_audit_print_spec`
- `gelato_create_order_payload`
- `gelato_get_shop_info`

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
