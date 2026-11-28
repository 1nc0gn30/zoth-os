---
title: "neuro-memory-daemon"
version: "2.9.0"
license: "Apache-2.0"
tags: [os, daemon, neuro-memory, stdp]
aliases: ["neuro_memory", "neuro-memory-daemon"]
port: 8094
subsystem: "Memory & STDP"
status: "active"
health_url: "http://127.0.0.1:8094/health"
repo: "https://github.com/1nc0gn30/neuro-memory-daemon"
author: "Neal Frazier Tech (@1nc0gn30) • NullAI Platform"
---

# neuro-memory-daemon (`v2.9.0`)

Zero-dependency Python SQLite WAL STDP Memory Substrate, Dual-Theme 3D WebGL Nebula Workstation, and 21-Tool MCP Server.

- **Name:** `neuro-memory-daemon` (`v2.9.0`, `Apache-2.0`)
- **Bind Address:** `127.0.0.1:8094` (loopback only, zero external egress)
- **Health:** `http://127.0.0.1:8094/health`
- **Stats:** `http://127.0.0.1:8094/api/stats`
- **MCP HTTP Endpoint:** `POST http://127.0.0.1:8094/api/mcp` (`21` tools)
- **Database Path:** `~/.neuro-memory/`
- **Local Repo:** `~/NullAITech/neuro-memory-daemon` (synced lean to `/opt/neuro-memory-daemon`)
- **Canonical GitHub:** [https://github.com/1nc0gn30/neuro-memory-daemon](https://github.com/1nc0gn30/neuro-memory-daemon)
- **Zoth Studio Route:** `http://127.0.0.1:3000/tools/neuro-memory-daemon`
- **Security Hardening:** Strict loopback `Host` & exact-port `Origin` `403` across all HTTP methods, non-wildcard reflected CORS (`Vary: Origin`), 4 HTTP security headers + strict loopback `CSP`, stripped `Server: Neuro-Memory`, `1 MiB` HTTP `413` cap, `400` / `-32700` validation, and realpath-confined Obsidian vault access.
- **Attribution:** Engineered by **Neal Frazier Tech** (`@1nc0gn30`) • [NullAI Platform](https://nullai.tech)

## See also

[[Zoth OS]] · [[MOC Daemons]] · [[MCP neuro-memory|neuro-memory]] · [[CLI neuro-memory|neuro-memory]] · [[Unit neuro-memory.service|neuro-memory.service]] · [[Studio neuro-memory-daemon|Neuro-Memory Daemon]]
