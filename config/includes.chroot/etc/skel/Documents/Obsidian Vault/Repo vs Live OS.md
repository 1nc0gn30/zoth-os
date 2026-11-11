---
title: "Repo vs Live OS — Bidirectional Chroot Sync Map"
date: 2026-11-06
author: "1nc0gn30 (@1nc0gn30)"
status: verified
tags:
  - canon
  - zothos
  - sync
  - chroot
  - squashfs
aliases:
  - "Live vs Repo Diff"
  - "Chroot Sync Map"
  - "Repo vs Live OS"
cluster: OS
stdp_weight: 0.99
---

# 🔄 Repo vs Live OS — Bidirectional Chroot Sync Map (`2026-11-06`)

Bidirectional synchronization reference between the **Live ZothOS v3.4 Desktop Workstation** (`/`) and the **`NullAITech/zoth-os` GitHub Repository** (`~/NullAITech/zoth-os/config/includes.chroot/`).

---

## 1. Synchronization Rules & Hardening Invariants

1. **Zero-PII & Portable Paths**:
   - All CLI launchers in `/usr/local/bin/`, `~/.local/bin/`, and `config/includes.chroot/usr/local/bin/` use `os.path.expanduser('~/NullAITech/...')` instead of hardcoded machine paths and attribute `1nc0gn30 (@1nc0gn30) • NullAI Platform`.
2. **Deterministic Desktop Folder Sync (`pack-iso.sh` & `zoth-plasma-setup`)**:
   - `pack-iso.sh` wipes `chroot/etc/skel/Desktop` and `chroot/home/*/Desktop` before copying `config/includes.chroot/etc/skel/Desktop` so zero loose `.desktop` icons ever regress onto the Live ISO desktop.
   - `zoth-plasma-setup` enforces the 4 canonical folders (`01-AI-Agents-and-Dev`, `02-Security-and-Privacy`, `03-ZothOS-Daemons`, `04-Media-and-Utilities`) prior to Plasma/XFCE startup.
3. **Xcursor Binary Integrity & `SWCursor` Parity**:
   - Multi-size (`16×16` to `48×48`) ARGB Xcursor binaries in `/usr/share/icons/Zoth-Gold-Cursors/cursors/`, `/etc/environment` (`KWIN_FORCE_SW_CURSOR=1`), `/etc/profile.d/zoth-cursor.sh`, and `/etc/X11/xorg.conf.d/20-zoth-cursor.conf` (`Option "SWCursor" "true"`) are mirrored 1:1 in `config/includes.chroot/`.
4. **Obsidian Second Brain Chroot Skeleton Parity**:
   - All root canon `.md` notes, `06-Wiki/*.md` deep architecture articles, `.canvas` JSON Canvas 1.0 boards, and `.base` databases in `/home/zoth/Documents/Obsidian Vault/` are synchronized directly into `/home/zoth/NullAITech/zoth-os/config/includes.chroot/etc/skel/Documents/Obsidian Vault/`.
5. **Host-Only Exclusions**:
   - Never commit `build/cosign.key`, `.iso` images, `/opt/zoth-relay/venv`, or `.tar.gz` archives into the git repository.

---

## 2. Subsystem Parity Matrix (Nov 6, 2026 Audit)

| Subsystem | Live Workstation Path | Repo Chroot Path | Status |
| :--- | :--- | :--- | :--- |
| **Sovereign Arsenal CLIs & TUIs** | `/usr/local/bin/*` & `~/.local/bin/*` | `config/includes.chroot/usr/local/bin/*` | **Synced** (295+ portable launchers + 72 `<tool>-tui` Braille TUIs + `zothnet` + `zoth-cursorz`) |
| **ZothNet v1.2.2 Mesh & ZML** | `~/NullAITech/zothnet` (`/usr/local/bin/zothnet`) | `config/includes.chroot/usr/local/bin/zothnet` | **Synced** (`v1.2.2` Sphinx 1,280B Mixnet, Vaelor DAG, ZML compiler, `:9900` / `:42069`) |
| **Zoth Cursorz Engine** | `~/NullAITech/zoth-cursorz` (`/usr/local/bin/zoth-cursorz`) | `config/includes.chroot/usr/local/bin/zoth-cursorz` | **Synced** (16 virtual agent pointers, 3D Braille trails, `:9990`) |
| **Core Electron Cockpits** | `/opt/zoth-{os,cockpit,desktop-pet,mcp,swarm-multiplexer}` | `config/includes.chroot/opt/zoth-*` | **Synced** (NullAI / `1nc0gn30` attribution, `&amp;` HTML escape verified) |
| **Ring-0 Daemons** | `/opt/neuro-memory-daemon`, `/opt/vaelor-network`, `/opt/zoth-civilization` | `config/includes.chroot/opt/{neuro-memory-daemon,vaelor-network,zoth-civilization}` | **Synced** (`:8094`, `:8140`, `:8120` / `:9393`) |
| **Xcursor & Display Config** | `/usr/share/icons/Zoth-Gold-Cursors`, `/etc/X11/xorg.conf.d/20-zoth-cursor.conf` | `config/includes.chroot/usr/share/icons/Zoth-Gold-Cursors`, `.../etc/X11/xorg.conf.d/` | **Synced** (`SWCursor` + `KWIN_FORCE_SW_CURSOR=1` + valid hotspots) |
| **Desktop Folder Hierarchy** | `~/Desktop/{01..04}-*` & `/usr/share/applications/*.desktop` | `config/includes.chroot/etc/skel/Desktop/` & `.../usr/share/applications/` | **Synced** (Deterministic 4-folder layout + 95+ `.desktop` launchers) |
| **3D Live Wallpaper** | `/usr/share/zothos/live-wallpaper/index.html` | `config/includes.chroot/usr/share/zothos/live-wallpaper/index.html` | **Synced** (`ZothOS 3D Interactive Reality Wallpaper`) |
| **Systemd Units** | `/etc/systemd/system/zoth-*.service` | `config/includes.chroot/etc/systemd/system/zoth-*.service` | **Synced** (`zoth-arsenal-daemons`, `zoth-auth-init`, `zoth-bootstrap`, `zoth-ghost`, `zoth-ghost-amnesic`, `zoth-sentinel`, `zoth-thermal-guard`, `zoth-watchdog`) |
| **Obsidian Second Brain** | `/home/zoth/Documents/Obsidian Vault` | `config/includes.chroot/etc/skel/Documents/Obsidian Vault` | **Synced** (`2026-11-06` Canon notes, `06-Wiki/`, `.canvas` boards, `.base` views) |

---

## Related Notes

- [[00 Home]] · [[Zoth OS]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Studio]] · [[ZothNet Sovereign Mesh]] · [[Zoth Trust & Supply Chain]]
- [[06-Wiki/ZothOS v3.4 & ZothOS-Lite A100 Desktop Hardening Architecture]]
