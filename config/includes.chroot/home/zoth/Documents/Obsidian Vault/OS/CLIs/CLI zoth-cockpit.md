---
title: "zoth-cockpit"
tags: [os, cli]
aliases: ["zoth-cockpit"]
---

# zoth-cockpit

`file`: ReStructuredText file.

`zoth-cockpit` is the sovereign interactive operations dashboard and system monitor located at `/usr/local/bin/zoth-cockpit`, engineered by 1nc0gn30 • NullAI.

It serves as the central operations bridge for ZOTHOS Linux, offering both an interactive `curses` terminal UI and headless CLI telemetry modes.

### Key Capabilities

- **Interactive TUI Tabs**:
  1. **Telemetry**: Real-time CPU load, memory/swap utilization, disk allocation, network routing, and Tor cloaking status.
  2. **AI Stack**: Monitors status and launches local neural engines and agent tools (Ollama, ComfyUI, vLLM, Hermes, Claude Code, OpenCode, Aider, FastMCP, LiteLLM, HexStrike).
  3. **Security Arsenal**: Access and execution checks for offensive/defensive tooling (Nmap, Caido, Nuclei, Ligolo-ng, NetExec, Metasploit, Wireshark, Burp Suite, Sentinel HUD).
  4. **Studio Daemons**: Live port and daemon health tracking for Swarm Multiplexer (`:8790`), Neuro Memory (`:8094`), Agent Bridge (`:8102`), Vault (`:8787`), and Web Studio (`:3000`/`:8088`).
  5. **Reality Profiles**: Fast switching between environment profiles (Gold Master, Ghostmode Stealth, Matrix Phosphor, Incognito Chameleon).
- **Execution Flags**:
  - `--status` / `--headless`: Dumps an ANSI-colored status report directly to standard output.
  - `--json`: Outputs structured telemetry and daemon states as JSON.
  - `--gui`: Spawns the Electron desktop dashboard located at `/opt/zoth-cockpit-app`.
  - `--tui`: Forces curses TUI interface in desktop environments.
  - `--tab <1-5>`: Launches the TUI directly focused on a specific tab.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-cockpit|zoth-cockpit]]