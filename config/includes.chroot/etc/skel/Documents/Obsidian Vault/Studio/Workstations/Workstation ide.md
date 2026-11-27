---
title: "Sovereign Operator IDE & Code Foundry"
tags: [studio, workstation]
aliases: ["ide"]
---

# Sovereign Operator IDE & Code Foundry

The **Sovereign Operator IDE & Code Foundry** (`v2.3.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under Studio Cockpits & Developer IDEs.

### Core Functionality
Hybrid zero-egress code workstation combining a multi-file browser editor, multi-language AST/symbol outline extractor (JS/JSX/TS, Python, Rust, JSON, YAML, Markdown), deterministic static security and hygiene linter, LCS unified diff/patch generator, pure recursive-descent expression evaluator (zero `eval()`), and read-only loopback `:3000` host toolchain and `~/NullAITech/` file inspection.

### Workstation Metadata
- **ID:** `ide`
- **Name:** Sovereign Operator IDE & Code Foundry
- **Version:** `2.3.0`
- **Type:** `cockpit` (`hybrid`)
- **Functional Band:** Build
- **Canonical Route:** `/workstations/ide`
- **Tool Alias Route:** `/tools/ide`
- **Loopback Studio APIs:** `GET /api/studio/ide`, `GET /api/studio/ide/status`, `POST /api/studio/ide/inspect`
- **CLI Command:** `zoth open ide --json`

### Security & Zero-Egress Invariants
- Strictly read-only on host loopback (`127.0.0.1:3000`); enforces `Host`/`Origin` `403` guards, `64 KB` body/read caps (`413`), `fs.realpathSync` containment blocking `..` traversal and symlink escapes, secret-file denylist (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `id_ed25519*`, `hosts.yml`, `.git-credentials`, `*.db`), and `~/` home-path redaction.
- Zero external CDN requests and zero `eval()`/`new Function()`; degrades honestly to `BROWSER_OFFLINE_FALLBACK` on static deployments.

## See also

[[Zoth Studio]] · [[MOC Workstations]]
