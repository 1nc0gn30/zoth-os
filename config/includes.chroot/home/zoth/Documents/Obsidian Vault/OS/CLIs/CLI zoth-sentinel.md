---
title: "zoth-sentinel"
tags: [os, cli]
aliases: ["zoth-sentinel"]
---

# zoth-sentinel

`file`: Python script.

`zoth-sentinel` is the ZOTHOS AI Sentinel Daemon and Autonomous Resilience Executor (v3.5) located at `/usr/local/bin/zoth-sentinel`. It serves as the primary system-level AI supervisor, background telemetry auditor, and self-healing orchestration engine.

### Core Capabilities

- **Autonomous OS Supervision**: Continuously tracks telemetry thresholds (CPU, RAM, disk usage, failed systemd units, zombie processes) and triggers automated remediation through `/usr/local/bin/zoth-heal`.
- **Multi-Model Provider Support**: Integrates with local and cloud model providers, including Ollama, OpenAI, Anthropic, DeepSeek, Groq, Grok/xAI, Google Gemini, and OpenRouter.
- **IPC Architecture**: Serves an asynchronous Unix domain socket at `/tmp/zoth-sentinel.sock` or `/run/zoth-sentinel.sock` to handle queries and execution tasks from HUD overlays and client scripts.

### CLI Subcommands

- **`daemon`**: Starts the persistent background supervisor, IPC socket server, and auto-healing loop.
- **`status`**: Reports real-time telemetry metrics, memory consumption, active AI configuration, and zombie process counts.
- **`diagnose`**: Performs a comprehensive diagnostic scan across core system subsystems.
- **`monitor`**: Streams a live terminal status line updating CPU, RAM, disk, zombies, Tor status, and failed units.
- **`purge-zombies`**: Sweeps and cleans defunct child processes.
- **`reset-desktop`**: Resets the compositor, desktop environment panels, and window manager.
- **`heal [target]`**: Triggers targeted self-healing actions (`all`, `quick`, `packages`, `display`, `network`, `disk`, `desktop`, `audio`, `python`).
- **`ask <prompt>`**: Submits a prompt to the configured AI model with contextual system state.
- **`exec <task>`**: Executes tasks or shell commands (`!command`) through the autonomous execution engine.
- **`set-model <model> [provider]`**: Dynamically changes the active LLM and provider.

### Configuration & State

- **System Config**: `/etc/zothos/sentinel.json`
- **User Config**: `~/.config/zothos/sentinel.json`
- **State & Logs**: `~/.config/zothos/sentinel_state.json` and `~/.local/share/zothos/sentinel.log`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-sentinel|zoth-sentinel]] · [[Unit zoth-sentinel.service|zoth-sentinel.service]] · [[CLI zoth-sentinel-hud|zoth-sentinel-hud]]