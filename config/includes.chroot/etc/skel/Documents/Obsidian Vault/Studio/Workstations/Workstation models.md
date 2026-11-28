---
title: "Local Models Console"
tags: [studio, workstation]
aliases: ["models", "Zoth AI Model Foundry & Spirit Matrix Pro"]
---

# Local Models Console

The **Local Models Console** (`v2.4.0`) is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js` and `public/api/workstations.json`) under the Observe band.

### Core Functionality
Hybrid strictly read-only Local Models Console unifying live Ollama (`127.0.0.1:11434` `/api/tags` & `/api/ps` VRAM residency), AGY-Hermes Proxy (`127.0.0.1:18000` `/v1/models`), optional LM Studio (`:1234`), vLLM (`:8000`), and llama.cpp (`:8080`) probes, read-only host GPU VRAM telemetry (`nvidia-smi` — e.g., Quadro P1000 `4096 MiB`), a deterministic GGUF weight + GQA/MHA KV-cache VRAM fit calculator (`Q4_K_M`, `Q5_K_M`, `Q6_K`, `Q8_0`, `FP16`), safe copy-only CLI/`Modelfile`/`curl` snippet synthesis, and formula-safe JSON/Markdown/CSV exports with synchronous FIPS 180-4 SHA-256 receipts and honest `BROWSER_OFFLINE_FALLBACK`.

### Workstation Metadata
- **ID:** `models`
- **Name:** Local Models Console
- **Version:** `2.4.0`
- **Type:** `cockpit`
- **Execution Type:** `hybrid` (browser deterministic engine + read-only loopback `:3000` API)
- **Functional Band:** Observe
- **Canonical Route:** `/workstations/models` (alias `/tools/models`)
- **CLI Entrypoint:** `zoth open models` (`zoth open models --json`)
- **Attribution:** Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform (`https://nullai.tech`)

### Loopback API Contracts (Read-Only)
- `GET` / `HEAD /api/studio/models` — Strictly read-only aggregator probing Ollama `/api/tags` & `/api/ps`, AGY-Hermes `/v1/models`, optional local servers, and `nvidia-smi`; enforces loopback `Host`/`Origin` `403` and `~/` path redaction; never triggers model loads or pulls.
- `POST /api/studio/models/estimate` — Deterministic server-side GGUF weight + KV-cache VRAM fit estimator (`64 KB` body cap → `413`, invalid payload → `400`, cross-origin/untrusted host → `403`).

### Pure Engine & Verification
- Pure ESM engine mirrored byte-identically between `src/utils/modelsConsoleEngine.js` and `server/models-console-engine.mjs`.
- Automated verification: `npm run test:models-console` (`scripts/test-models-console-engine.mjs`).

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Legacy models]]
