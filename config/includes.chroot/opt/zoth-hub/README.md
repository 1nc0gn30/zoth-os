# Zoth Hub

Unified, categorized desktop launcher and live status center for ZothOS 3.4.0.

## What It Does
- Organizes all **85 Zoth Studio tools** plus **12 core ZothOS desktop applications** into **6 clear categories**:
  1. `AI Agents & Swarms`
  2. `Security & Privacy`
  3. `Web & Dev Foundry`
  4. `Media, 3D & Creative`
  5. `Commerce & Automation`
  6. `System & Hardware`
- Replaces cluttered multi-folder desktop shortcuts with one clean, searchable Obsidian Dark / Editorial Ivory Light control surface.

## How Live Detection Works (100% Honest Statuses)
Every request to `GET /api/catalog` probes the host machine in parallel (~60ms timeout per loopback port):
- **`running`**: Fast TCP connect probe succeeded on `127.0.0.1:<local_port>`.
- **`installed_cli`**: Executable binary verified on `PATH` (or `/usr/local/bin`, `~/.local/bin`).
- **`browser_ready`**: Client-side browser tool or Zoth Studio web workbench requiring no local daemon.
- **`not_installed`**: Neither running nor installed locally; exact install/run command is displayed in Details.

## HTTP API (`127.0.0.1:8195`)
- `GET /health` — Service health, version, total catalog items, category count.
- `GET /api/categories` — The 6 categories with per-status live counts.
- `GET /api/catalog` — Full live-probed catalog (optional `?category=`, `?status=`, `?q=` filters).
- `POST /api/launch` — Allowlisted safe launcher (`{"id": "<tool_id>", "mode": "auto|local|cli|browser"}`) using direct `subprocess.Popen` argv lists with zero shell execution.

## ZothOS CLI Commands
```bash
zoth-hub                  # Start on 127.0.0.1:8195 and open in browser
zoth-hub --no-browser     # Start daemon without launching browser
zoth-hub --port 8195      # Bind custom loopback port
zoth-hub --status         # Print live server + catalog probe summary
zoth-hub --status --json  # Machine-readable JSON status
zoth-hub --list           # List all categorized tools with live status
zoth-hub --list --json    # Full JSON catalog dump
```

Engineered by Neal Frazier Tech ([@1nc0gn30](https://github.com/1nc0gn30/zoth-os)) • [NullAI Platform](https://nullai.tech)
