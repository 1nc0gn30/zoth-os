---
title: "Zoth Netlify AX & Serverless Edge Console"
tags: [studio, workstation]
aliases: ["netlify-ax"]
---

# Zoth Netlify AX & Serverless Edge Console

The **Zoth Netlify AX & Serverless Edge Console** (`v2.4.0`) is registered in Zoth Studio v2 (`src/data/workstations.js` and `public/api/workstations.json`) under the **Build** band.

### Core Functionality
Hybrid local-first Netlify configuration, Edge Function, and pre-deployment guardrail workstation. Unites strictly read-only loopback inspection of `netlify.toml`, `netlify/edge-functions/*`, `netlify/functions/*`, `public/` AEO discovery manifests, `dist/` route counts, and `netlify --version` (`GET/HEAD /api/studio/netlify-ax`, `POST /api/studio/netlify-ax/audit`, `GET/HEAD /api/studio/netlify-spec`) with a 100% offline browser TOML/`_redirects`/`_headers` parser, redirect loop & splat-shadow detector, Edge & Serverless request router simulator, 14-point pre-deploy guardrail auditor, copy-only safe `netlify` CLI playbooks, and formula-safe JSON/Markdown/CSV/TOML exports with FIPS 180-4 SHA-256 receipts.

### Security & Read-Only Invariants
- Never reads `~/.config/netlify/config.json`, `.env*`, or `NETLIFY_AUTH_TOKEN`.
- Never executes live remote Netlify deploys or API mutations; CLI commands are strictly copy-only.
- Enforces loopback `Host` and `Origin` `HTTP 403` validation and a `64 KB` POST body cap (`HTTP 413`).
- Redacts home paths to `~/` and strips token shapes across all responses and exports.

### Workstation Metadata
- **ID:** `netlify-ax`
- **Name:** Zoth Netlify AX & Serverless Edge Console
- **Version:** `2.4.0`
- **Execution Type:** `hybrid` (browser deterministic engine + optional loopback `:3000` read-only repo inspector)
- **Type:** `cockpit`
- **Functional Band:** Build
- **Canonical Route:** `/workstations/netlify-ax` (alias `/tools/netlify-ax`)
- **CLI Entry:** `zoth open netlify-ax` (`zoth open netlify-ax --json`)
- **Loopback APIs:** `GET/HEAD /api/studio/netlify-ax`, `POST /api/studio/netlify-ax/audit`, `GET/HEAD /api/studio/netlify-spec`
- **Test Suite:** `npm run test:netlify-ax`
- **Attribution:** Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform

## See also

[[Zoth Studio]] · [[MOC Workstations]]
