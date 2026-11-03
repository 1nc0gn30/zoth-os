---
title: "zoth-pkg"
tags: [os, cli]
aliases: ["zoth-pkg"]
---

# zoth-pkg

`file`: Python script.

`zoth-pkg` is a Python-based sovereign package and tool provisioner for ZothOS. Located at `/usr/local/bin/zoth-pkg`.

It indexes and provisions 186+ curated security, development, and AI tools across Debian Trixie, Kali Rolling, Parrot Security, and native Zoth toolchains using the manifest at `/usr/share/zothos/tool-lists/zoth-verified-tools.json`.

## Commands & Usage
- **`zoth-pkg list [query]`**: Filters and lists tools by category, displaying `[INSTALLED]` or `[AVAILABLE]` status.
- **`zoth-pkg install <target>`**: Requires root privileges (`sudo`). Installs an individual tool by ID, a full category (e.g. `kali`, `parrot`, `nexus_ai`), or `all`.
- **`zoth-pkg verify`**: Audits all tools in the manifest, reporting whether each binary is installed, available as an APT candidate, or unresolved.
- **`zoth-pkg update [args]`**: Dispatches to `/usr/local/bin/zoth-update-studio`.

## Provisioning Backends & Detection
- **Multi-Method Provisioning**: Supports installation via APT (`apt-get`), Python packages (via `/opt/zothos-ai-env` or `pip3`), global Node modules (`npm install -g`), and custom binary installers (such as Ollama, Solana, Foundry, Starship, Cloudflared, Tailscale, Obsidian, and TruffleHog).
- **Tool Detection**: Evaluates system state across PATH binaries, alternate aliases (e.g. `msfconsole`, `forge`, `r2`), DPKG package status, Python module imports, and the `/opt/zothos-ai-env/bin/` environment.

## See also

[[Zoth OS]] · [[MOC CLIs]]