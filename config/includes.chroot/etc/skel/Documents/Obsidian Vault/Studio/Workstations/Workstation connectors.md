---
title: "Connectors Hub // AI Providers, CLI Harnesses & MCP Bridges"
tags: [studio, workstation]
aliases: ["connectors"]
---

# Connectors Hub // AI Providers, CLI Harnesses & MCP Bridges

The **Connectors Hub** is a hybrid Studio-native cockpit registered in Zoth Studio v2 (`src/data/workstations.js`) for probing local AI inference providers, CLI agent harnesses, core Zoth loopback bridges, and secret-redacted local MCP servers across the 85-tool ecosystem.

### Core Functionality
Aggregates live loopback telemetry (`GET /api/studio/connectors`) and SSRF-guarded port health checks (`POST /api/studio/connectors/probe` restricted to `127.0.0.1` ports `1024..65535`), paired with interactive `${ENV_VAR}`-only config generators (MCP `mcpServers` JSON, OpenAI-compatible `.env`, Hermes `config.yaml`, Codex `config.toml`) and sanitized JSON/Markdown/CSV diagnostics.

### Workstation Metadata
- **ID:** `connectors`
- **Name:** Connectors Hub // AI Providers, CLI Harnesses & MCP Bridges
- **Type:** `cockpit` (hybrid browser + hardened Studio loopback API `v2.3.0`)
- **Functional Band:** Observe
- **Canonical Route:** `/workstations/connectors`
- **Alias Route:** `/tools/connectors`
- **Pull / Launch Command:** `zoth open connectors`

### Operational Role
Functions within the Observe band to monitor AGY-Hermes Proxy (`:18000`), Ollama (`:11434`), LM Studio (`:1234`), vLLM (`:8000`), CLI harnesses (`hermes`, `agy`, `claude`, `codex`, `gemini`, `opencode`), core Zoth daemons (`:8094`, `:8102`, `:8787`, `:8161`, `:5173`, `:8136`, `:8109`, FieldKit stdio), and local MCP registries with zero plaintext key leakage and an honest offline browser fallback.

## See also

[[Zoth Studio]] · [[MOC Workstations]]
