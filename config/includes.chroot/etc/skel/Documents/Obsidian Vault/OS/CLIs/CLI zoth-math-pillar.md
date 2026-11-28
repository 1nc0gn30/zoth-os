---
title: "zoth-math-pillar"
tags: [os, cli]
aliases: ["zoth-math-pillar"]
---

# zoth-math-pillar

`file`: Python 3 script (`#!/usr/bin/env python3`).

`zoth-math-pillar` (`v2.3.0`) launches and inspects the ZothOS 4-Pillar Mathematical Telemetry & Compact Pill HUD (`:9995`, UDP `:9996`), engineered by **Neal Frazier Tech (@1nc0gn30) • NullAI Platform**.

## Supported CLI Flags

- `zoth-math-pillar --help` — Prints usage and attribution.
- `zoth-math-pillar --status` / `--json` — Queries `http://127.0.0.1:9995/active` and outputs JSON telemetry status (`live: true|false`, 4-pillar summary, port metadata).
- `zoth-math-pillar --agent <ALL|Antigravity|Ollama>` — Filters/launches the HUD for a specific agent (falling back cleanly to JSON status when run without `$DISPLAY`/`$WAYLAND_DISPLAY`).
- `zoth-math-pillar --pill` / `--compact` / `desktop` — Launches the Electron overlay from `/opt/zoth-math-pillar` with `--no-sandbox --disable-dev-shm-usage --disable-gpu-sandbox --enable-transparent-visuals`.
- `zoth-math-pillar tui` — Execs `/usr/local/bin/zoth-math-pillar-tui`, which queries `http://127.0.0.1:9995/active` (with `/api/status` fallback).

## Paths

- **CLI Binary:** `/usr/local/bin/zoth-math-pillar` (symlinked at `~/.local/bin/zoth-math-pillar`)
- **TUI Binary:** `/usr/local/bin/zoth-math-pillar-tui` (symlinked at `~/.local/bin/zoth-math-pillar-tui`)
- **Application Directory:** `/opt/zoth-math-pillar`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-math-pillar|zoth-math-pillar]] · [[Studio zoth-math-pillar|Zoth Math Pillar HUD]]
