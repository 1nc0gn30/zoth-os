---
type: studio-tool
tool_id: zoth-x-connector
name: Zoth X Connector
category: Swarm & Core
version: 1.0.0
local_port: 8152
local_url: http://127.0.0.1:8152
studio_url: http://127.0.0.1:3000/tools/zoth-x-connector
github_url: https://github.com/1nc0gn30/zoth-x-connector
repo_path: ~/NullAITech/zoth-x-connector
status: verified
access: 100% Free & Open Access
stripe_coffee: https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X
solana_tip: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK
updated: '2026-11-13'
tags:
- zoth-studio
- sovereign-tool
- swarm-core
- zoth-x-connector
- x-api
- systemd-timer
- tool
---

# Zoth X Connector (`zoth-x-connector`)

> **Sovereign Local X (Twitter) Multi-Account API Controller & Configurator** — Local-first Express/Node workstation on `:8152`, Zoth Vault OAuth 1.0a/2.0 credential configurator (`~/.config/zoth-vault/`), persistent `systemd --user` campaign timer (`x-multi-hub.timer` firing `09,12,15,18,21:00:00`), 4-step screenshot walkthrough & 16s MP4 showreel, and zero-secret GitHub repository (`https://github.com/1nc0gn30/zoth-x-connector`).
> **100% Free & Open-Access** • **Zero Paywalls** • [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Architecture & Operational Overview

1. **Developer Architecture (`~/NullAITech/zoth-x-connector`)**:
   - `server.mjs`: Local loopback server on port `8152` exposing `GET /health`, `GET /api/status`, `GET /api/accounts`, `POST /api/accounts`, `POST /api/run`, and `POST /api/timer`.
   - `public/`: Sovereign workstation UI with multi-account OAuth status, live campaign runner, systemd timer controls, 4-step visual guide, and embedded 16s MP4 video walkthrough.
   - Zero-secret repository hygiene enforced via `.gitignore` and Gitleaks (`~/.config/zoth-vault/` stays strictly local).
2. **End-User ZothOS CLI (`zoth-x-connector`)**:
   - Installed at `/usr/local/bin/zoth-x-connector` and `~/.local/bin/zoth-x-connector`.
   - Supports `--help`, `--status`, `--json`, `run`, `timer start`, `timer stop`, and `serve`.
3. **Interactive GUI Workstations**:
   - **Standalone Workstation (`http://127.0.0.1:8152`)**: Live multi-account controller, Zoth Vault OAuth configurator, systemd timer toggle, and step-by-step video/screenshot guide.
   - **Zoth Studio Showcase (`https://zoth.nullai.tech/tools/zoth-x-connector`)**: Canonical architectural dossier, CLI reference, and repository index.
