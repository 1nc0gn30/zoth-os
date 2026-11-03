---
title: "Zoth OS v3.4.0 — Complete Developer & End-User Walkthrough"
tool_id: "zoth-os"
category: "Swarm & Core"
local_port: 8137
studio_route: "http://127.0.0.1:3000/tools/zoth-os"
cli_binary: "/usr/local/bin/zoth-os"
repo_path: "/home/zoth/NullAITech/zoth-os"
status: "VERIFIED_12_STEP_GALLERY"
updated: "2026-10-31"
---

# Zoth OS v3.4.0 (`zoth-os`) — Complete Developer & End-User Walkthrough

> **100% Free & Open-Access Sovereign Linux Distribution** — Zero paywalls, zero blur locks, zero feature gates. Built by **1nc0gn30 • NullAI (`@1nc0gn30`) • NullAI Platform**. Support via [Stripe Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## Part 1: Developer Architecture & Verification Walkthrough

### Step 1: Repository Structure, Live-Build Config & Local Cockpit Server
Developers inspecting `/home/zoth/NullAITech/zoth-os` can review the Debian 13 (Trixie) Live-Build configuration (`config/`, `package-lists/`, `generate_zoth_cursors.py`, `generate_2026_launchers.py`) and the local web cockpit daemon (`server.py` on port `8137`).

![Step 1: Developer Repository Architecture](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_01_dev_repo_architecture.jpg)

### Step 2: Automated Pytest Verification Suite (`pytest -v`)
Running `pytest -v` in `/home/zoth/NullAITech/zoth-os` validates the live `:8137` daemon health/status endpoints, the 8 named KWin virtual desktops, and the reproducible Live-Build chroot audit (`2 passed in 0.21s`).

![Step 2: Developer Pytest Verification Suite](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_02_dev_pytest_suite.jpg)

### Step 3: REST API Telemetry Contracts (`/api/health` & `/api/status`)
Querying `GET http://127.0.0.1:8137/api/health` and `GET http://127.0.0.1:8137/api/status` returns live telemetry for Debian 13 Trixie, KDE Plasma 6.3, and Linux Kernel `6.12.111+deb13-amd64`.

![Step 3: Developer REST API Contracts](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_03_dev_api_mcp_contracts.jpg)

---

## Part 2: End-User ZothOS CLI & TUI Walkthrough

### Step 4: Global Binary Resolution & CLI Help (`zoth-os --help`)
Users can verify `/usr/local/bin/zoth-os` and `~/.local/bin/zoth-os` via `which -a zoth-os`, check `--version`, and inspect `--help` flags (`--status`, `--desktops`, `--audit-iso`, `--json`, `serve`).

![Step 4: End-User CLI Help & Installation](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_04_user_cli_help_install.jpg)

### Step 5: Querying Kernel Status & 8 Named KWin Virtual Desktops (`--status` & `--desktops`)
Running `zoth-os --status --json` and `zoth-os --desktops --json` outputs the live kernel status and the 8 pre-configured KDE Plasma 6.3 virtual desktops (`Meta+F1` through `Meta+F8`).

![Step 5: End-User CLI Status & 8 Virtual Desktops](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_05_user_cli_workflow_a.jpg)

### Step 6: Live-Build Chroot & ISO Hardening Audit (`zoth-os --audit-iso --json`)
Running `zoth-os --audit-iso --json` audits the chroot binaries (`272` executables/symlinks in `config/includes.chroot/usr/local/bin`), Xcursor binary magic (`Xcur`), `KWIN_FORCE_SW_CURSOR=1`, and Amnesic `toram` boot readiness.

![Step 6: End-User CLI ISO & Chroot Audit](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_06_user_cli_workflow_b.jpg)

---

## Part 3: Standalone Web Workstation & Zoth Studio v2 God-Mode GUI

### Step 7: Standalone Web Workstation (`http://127.0.0.1:8137`) — Dark Mode Cockpit
Opening `http://127.0.0.1:8137` launches the Zoth OS v3.4.0 Sovereign Linux Cockpit featuring the 8-Desktop KWin Workspace Matrix and Live-Build Chroot / Kernel Telemetry panel.

![Step 7: Standalone Workstation Dark Mode Home](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_07_gui_standalone_dark_home.jpg)

### Step 8: Standalone Web Workstation — Interactive Live ISO & Chroot Audit
Clicking **Audit ISO & Chroot** executes a full Live-Build chroot verification inside the workstation, inspecting boot modes (`toram noswap`, `persistence-encryption=luks`, `noautomount`), 72 `/usr/local/bin` tools, and 163 `/etc/zothos/mcp-servers.json` entries.

![Step 8: Standalone Workstation Interactive ISO Audit](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_08_gui_standalone_interactive_a.jpg)

### Step 9: Standalone Web Workstation — Editorial Light Mode & Amnesic `toram` GRUB Profile
Switching to **Light Mode** (`☀ Light / Dark`) and clicking **Generate Amnesic toram GRUB** displays the high-contrast warm alabaster theme alongside the deterministic `grub.cfg` entry for RAM-only amnesic boot.

![Step 9: Standalone Workstation Light Mode & GRUB Generator](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_09_gui_standalone_interactive_b.jpg)

### Step 10: Zoth Studio v2 God-Mode Route (`http://127.0.0.1:3000/tools/zoth-os`)
Navigating to `/tools/zoth-os` inside Zoth Studio v2 provides the unified God-Mode header, local `:8137` enclave badge, Web Mirror link, and embedded Ring-0 Kernel & Enclave Architect.

![Step 10: Zoth Studio v2 God-Mode Overview](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_10_gui_studio_godmode_overview.jpg)

### Step 11: Zoth Studio v2 God-Mode — Interactive 4-Ring Kernel & QEMU/KVM ISO Launcher
Scrolling into the Interactive Enclave Workstation inside Zoth Studio v2 exposes the 4-Ring Loopback Topology, hardened `systemd` unit synthesizer, `.desktop` launcher generator, and QEMU/KVM ISO boot command builder.

![Step 11: Zoth Studio v2 God-Mode Interactive Enclave](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_11_gui_studio_godmode_interactive.jpg)

### Step 12: Mobile Responsive Viewport (`390x844` — Zero Horizontal Overflow)
Verified on a `390x844` mobile viewport with `scrollWidth === 390` (`overflowPx === 0`), stacked KPI cards, touch-friendly KWin desktop selectors, and responsive terminal output.

![Step 12: Mobile 390px Responsive Verification](/home/zoth/Documents/Obsidian%20Vault/Studio/Tools/Artifacts/zoth-os/zoth-os_12_gui_mobile_390px.jpg)
