---
title: "zoth-tool-nexus"
tags: [os, cli]
aliases: ["zoth-tool-nexus"]
---

# zoth-tool-nexus

`file`: Python script.

`zoth-tool-nexus` is the sovereign dispatcher, health auditor, and package installer orchestrating 10 operational tool domains in ZothOS.

## What it does

The utility manages runtime PATH configuration (injecting `/opt/zothos-ai-env/bin`, cargo, go, and foundry paths), tool verification, interactive execution, and package provisioning across APT, Python virtual environments, NPM, and vendor scripts.

### 10 Tool Domains

1. **[CORE] Zoth Studio Flagships:** HUDs, Cockpit, WebGen, Ghostmode, MCP, session switchers.
2. **[AI] Local AI Runtimes:** Ollama, llama.cpp, vLLM, ComfyUI, Open-WebUI, LiteLLM.
3. **[AGENT] Autonomous Multi-Agent Systems:** Hermes, Bolt.diy, Claude Code, OpenCode, Aider, Garak, PyRIT.
4. **[DEV] Dev Toolchains & Compilers:** Python 3, uv, Node.js, Rust/Cargo, Go, GCC, Clang, Neovim, Tmux.
5. **[MEDIA] 3D Graphics & Media:** Blender, FFmpeg, ImageMagick, MPV, GIMP, Inkscape, OBS Studio.
6. **[SEC] Penetration Testing & Red Team:** Nmap, Masscan, RustScan, Wireshark, FFUF, SQLMap, Nuclei, Caido, Ghidra, Hashcat.
7. **Web3 & Blockchain Security:** Solana CLI, Foundry (forge/cast/anvil), Slither, Mythril, IPFS.
8. **[VISION] Computer Vision & Documents:** Tesseract OCR, OpenCV, PyMuPDF, Pandoc, Typst.
9. **[NET] Sovereign Infrastructure:** Tailscale, WireGuard, Docker, Podman, Caddy, Nginx, Cloudflared.
10. **[DOCS] Knowledge Management & PKM:** Obsidian, Zathura, Graphviz, Flameshot, Tree.

## CLI Options

- `--gui`: Launches the Electron desktop app (`/opt/zoth-nexus-app`).
- `--tui`: Launches the interactive terminal browser and runner.
- `--list`: Prints all registered tools across all 10 domains.
- `--doctor`: Executes diagnostic availability checks for every tool.
- `--search <kw>`: Searches tools by name or description.
- `--run <id>`: Directly launches a tool by its identifier.
- `--install-modules <id|all>` / `--install-all`: Installs missing tool dependencies via APT, PIP, NPM, or shell recipes.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-tool-nexus|zoth-tool-nexus]]