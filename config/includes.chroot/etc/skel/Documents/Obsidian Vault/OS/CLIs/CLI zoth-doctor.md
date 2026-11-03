---
title: "zoth-doctor"
tags: [os, cli]
aliases: ["zoth-doctor"]
---

# zoth-doctor

`file`: Bourne-Again shell script.

`zoth-doctor` is the ZOTHOS System Doctor & Environment Diagnostic Engine v3.0. It executes a comprehensive 7-stage health audit across security tools, AI agents, core CLIs, hardware acceleration, network connectivity, MCP server registries, and systemd watchdog services.

### Diagnostic Stages
1. **Security Arsenal**: Audits installed security binaries (`nmap`, `wireshark`, `tshark`, `msfconsole`, `sqlmap`, `hydra`, `john`, `r2`, `gobuster`, `ffuf`, `nuclei`, `amass`, `subfinder`, `httpx`, `binwalk`, `masscan`, `aircrack-ng`).
2. **Frontier AI & Autonomous Agents**: Checks `hermes`, `ollama`, `uv`, `aider`, `garak`, `pyrit`, and `docker`.
3. **Core CLIs & Utilities**: Verifies ZothOS tools (`zoth`, `zoth-ai`, `zoth-sec`, `zoth-mcp`, `zoth-update-studio`, `zoth-session-switch`, `zoth-ghost`, `zoth-agent-os`, `zoth-sentinel`, `zoth-heal`, `hexstrike`, `maya`, `zoth-live-wallpaper`).
4. **Power Tools & Vaults**: Validates `bw`, `keepassxc`, `btop`, `micro`, `fzf`, `bat`, `fd`, and `duf`.
5. **Hardware & Rendering**: Checks OpenGL direct rendering (`glxinfo` / `/dev/dri`), root filesystem read-write permissions, and disk space (>500MB free).
6. **Network & DNS**: Tests DNS host resolution (`debian.org` / `1.1.1.1`) and ICMP internet gateway reachability.
7. **Hub & Services**: Validates Zoth Studio (`/opt/zoth-studio`), MCP registry (`/etc/zothos/mcp-servers.json`), agent permissions (`/etc/zothos/agent-permissions.json`), and `zoth-watchdog.timer`.

### Self-Healing Mode
Invoking `zoth-doctor --fix` (or `-f`) activates autonomous auto-heal mode, running `zoth-heal --all` and automatically triggering package and dependency installation commands for missing audited components.

## See also

[[Zoth OS]] · [[MOC CLIs]]