---
title: "zoth-arsenal-sync"
tags: [os, cli]
aliases: ["zoth-arsenal-sync"]
---

# zoth-arsenal-sync

`file`: Bourne-Again shell script.

`zoth-arsenal-sync` is the ZOTHOS Master Arsenal Synchronizer and full toolchain installer (2026 Edition), located at `/usr/local/bin/zoth-arsenal-sync`.

## Purpose & Scope

The root script ensures complete system parity across developer runtimes, Kali/Parrot security tooling, and sovereign AI environments. It requires root permissions to run.

## Five-Stage Synchronization Pipeline

1. **Repository Refresh**: Runs `apt-get update -y` against configured Debian, Kali, and Parrot package mirrors.
2. **Dev Toolchains & Modern Runtimes**: Installs core compilers (GCC, Clang, CMake), development runtimes (Node.js, Rust, Go, Python), database utilities, Podman, and terminal tools (`neovim`, `ripgrep`, `eza`, `starship`, `zellij`, `lazygit`).
3. **Security Arsenal Parity**: Provisions offensive security tools including `nmap`, `rustscan`, `sqlmap`, `impacket-scripts`, `responder`, `evil-winrm`, `wireshark`, `bettercap`, `john`, `hashcat`, `radare2`, `sliver`, `caido`, `burpsuite`, `bloodhound`, and anonymous network utilities (`tor`, `torsocks`, `proxychains4`, `macchanger`).
4. **Package Tooling**: Bootstraps Astral's `uv` installer.
5. **Dedicated AI Environment**:
   - Deploys a dedicated Python virtualenv at `/opt/zothos-ai-env`.
   - Installs AI agent and LLM security tools (`aider-chat`, `fastmcp`, `mcp`, `litellm`, `garak`, `pyrit`, `scapy`).
   - Exports environment binaries to system `PATH` via `/etc/profile.d/zothos-ai-path.sh`.

## Paths & Artifacts

- **Script Location**: `/usr/local/bin/zoth-arsenal-sync`
- **AI Environment**: `/opt/zothos-ai-env`
- **System Profile Hook**: `/etc/profile.d/zothos-ai-path.sh`

## See also

[[Zoth OS]] · [[MOC CLIs]]