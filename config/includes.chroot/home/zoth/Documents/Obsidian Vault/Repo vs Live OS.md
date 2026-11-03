---
title: "Repo vs Live OS"
date: 2026-11-02
tags:
  - canon
  - zothos
  - sync
  - chroot
aliases:
  - "Live vs Repo Diff"
  - "Chroot Sync Map"
cluster: OS
stdp_weight: 0.98
---

# 🔄 Repo vs Live OS — Bidirectional Chroot Sync Map

Bidirectional synchronization reference between the **Live ZothOS Desktop Workstation** (`/`) and the **`NullAITech/zoth-os` GitHub Repository** (`/home/zoth/NullAITech/zoth-os/config/includes.chroot/`).

---

## 1. Synchronization Rules & Invariants

1. **Zero-PII & Portable Paths**:
   - All CLI launchers in `/usr/local/bin/` and `config/includes.chroot/usr/local/bin/` use `os.path.expanduser('~/NullAITech/...')` instead of hardcoded machine paths and attribute `1nc0gn30 (@1nc0gn30) • NullAI Platform`.
2. **HTML Escape Integrity in Electron Cockpits**:
   - Both `/opt/zoth-os/desk.js` and `/opt/zoth-cockpit/app.js` preserve proper `"&": "&amp;"` HTML entity escaping.
3. **Obsidian Second Brain Parity**:
   - Core canon notes, `.canvas` boards, and `.base` databases in `/home/zoth/Documents/Obsidian Vault/` are mirrored into `config/includes.chroot/home/zoth/Documents/Obsidian Vault/` (excluding heavy binary `.mp4` recordings so the git repo stays fast and lean).
4. **Host-Only Exclusions**:
   - Never commit `build/cosign.key`, `.iso` images, `/opt/zoth-relay/venv`, or `.tar.gz` archives into the git repository.

---

## 2. Subsystem Parity Matrix (Nov 2026 Audit)

| Subsystem | Live Workstation Path | Repo Chroot Path | Status |
| :--- | :--- | :--- | :--- |
| **Sovereign Arsenal CLIs** | `/usr/local/bin/*` & `~/.local/bin/*` | `config/includes.chroot/usr/local/bin/*` | **Synced** (290+ portable, PII-free launchers including `zoth-bot-launch`, `zoth-bounty-launch`, `zoth-comm`, `zoth-cot`, `zoth-dualboot`, `zoth-node`, `zoth-run-repo`, `zoth-second-brain`, `zoth-obsidian-tracker`) |
| **Core Electron Cockpits** | `/opt/zoth-{os,cockpit,desktop-pet,mcp,swarm-multiplexer}` | `config/includes.chroot/opt/zoth-*` | **Synced** (NullAI / `1nc0gn30` attribution, portable `~` sandbox defaults, `&amp;` escape verified) |
| **Ring-0 Daemons** | `/opt/neuro-memory-daemon`, `/opt/vaelor-network` | `config/includes.chroot/opt/{neuro-memory-daemon,vaelor-network}` | **Synced** |
| **3D Live Wallpaper** | `/usr/share/zothos/live-wallpaper/index.html` | `config/includes.chroot/usr/share/zothos/live-wallpaper/index.html` | **Synced** (`ZothOS 3D Interactive Reality Wallpaper`) |
| **Systemd Units** | `/etc/systemd/system/zoth-*.service` | `config/includes.chroot/etc/systemd/system/zoth-*.service` | **Synced** (`zoth-auth-init`, `zoth-bootstrap`, `zoth-ghost`, `zoth-ghost-amnesic`, `zoth-live-logger`, `zoth-sentinel`, `zoth-tailscale`, `zoth-thermal-guard`, `zoth-watchdog`) |
| **Desktop Launchers** | `/usr/share/applications/*.desktop` | `config/includes.chroot/usr/share/applications/*.desktop` | **Synced** (93 `.desktop` launchers + categorized `01`–`04` Desktop folders) |
| **Obsidian Second Brain** | `/home/zoth/Documents/Obsidian Vault` | `config/includes.chroot/home/zoth/Documents/Obsidian Vault` | **Synced** (Canon notes, 20 Canvases, 22 Bases, Karpathy LLM Wiki) |

---

## Related Notes

- [[00 Home]] · [[Zoth OS]] · [[Zoth Studio]] · [[Zoth Trust & Supply Chain]]
