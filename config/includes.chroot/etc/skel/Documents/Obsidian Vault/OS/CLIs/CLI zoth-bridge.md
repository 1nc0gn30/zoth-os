---
title: "zoth-bridge"
tags: [os, cli]
aliases: ["zoth-bridge"]
---

# zoth-bridge

`file`: Python script.

`zoth-bridge` is the ZOTHOS local system bridge daemon located at `/usr/local/bin/zoth-bridge`, serving the web studio and desktop utilities over `http://127.0.0.1:8199`.

It exposes a hardened loopback API for system telemetry, application launching, agent routing, and layer configuration while serving static frontend assets from `/opt/zoth-studio/dist`.

### API Endpoints & Security Model

- **Security & Authentication**:
  - Bound strictly to loopback (`127.0.0.1`, `localhost`, `::1`) with origin checks preventing DNS rebinding and cross-site drive-by requests.
  - All modifying endpoints require authentication via the `X-Zoth-Token` header, matched against a high-entropy secret in `~/.config/zothos/bridge-token` (`0600` permissions).
  - Arbitrary command execution (`/api/exec`) is permanently disabled (returns HTTP 410).
- **Core Endpoints**:
  - `GET /api/metrics`: Unauthenticated endpoint reading `/proc/stat` and `/proc/meminfo` to serve real-time CPU percentage, RAM utilization, active security layer, and timestamp.
  - `GET /api/launch`: Launches verified binaries without shell invocation. Binaries must match allowlisted `Exec=` entries from system `.desktop` files or `/usr/local/bin/zoth-*` commands.
  - `GET /api/layer`: Sets the operational security layer (0–9), persisted to `~/.config/zothos/agent-layer.state`.
  - `GET /api/agent`: Dispatches prompts up to 4,000 characters to `zoth-agent-os`.

## See also

[[Zoth OS]] · [[MOC CLIs]]