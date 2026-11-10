# 🛡️ ZothOS-Lite v1.2 (`zothos-lite`)

> **Tails-Style Amnesic Monotone Linux Operating System (`toram noswap`) — Featuring 56 Curated AI Models Across 8 Providers, Volatile RAM Key Enclave, First-Boot Onboarding (`zoth-lite-welcome`), ZothNet Encrypted P2P Mesh, External USB/Cloud Persistence (`zoth-lite-storage`), and Zero-Bloat Browser Workstation (`:8145`)**

[![License: MIT](https://img.shields.io/badge/License-MIT-000000.svg)](https://opensource.org/licenses/MIT)
[![Palette: Paper Ivory & Black Ink](https://img.shields.io/badge/Design-Paper_Ivory_%23F7F7F4_%2B_Black_Ink_%23000000-F7F7F4?labelColor=000000)](https://zothos-lite.nullai.tech)
[![AI Models: 56 Across 8 Providers](https://img.shields.io/badge/AI_Models-56_Models_%E2%80%A2_8_Providers-000000)](https://zothos-lite.nullai.tech)
[![Boot Mode: toram noswap](https://img.shields.io/badge/Boot_Mode-toram_noswap_(Zero_Disk_Trace)-000000)](https://github.com/1nc0gn30/zothos-lite)

**ZothOS-Lite v1.2** (`https://zothos-lite.nullai.tech`) is an ultra-lightweight, Tails-inspired **Amnesic Monotone (`#F7F7F4` Paper Ivory + `#000000` Black Ink + 2px Solid Borders + Ordered Bayer Dither + Unicode `U+2800` Braille)** Debian 13 Live operating system. It boots entirely into volatile system RAM (`toram noswap`), runs autonomous AI agents locally over LAN or across 8 cloud providers, and leaves **zero forensic trace** on host drives when powered off.

---

## ⣿ What's Inside ZothOS-Lite v1.2 (OS + ISO + Website 1:1 Parity)

### 1. ⚡ 56 Curated AI Models Across 8 Providers (`zoth-lite-models`)
- **8 Native Provider Backends**:
  1. **OpenRouter** (12 flagships + optional live catalog fetch)
  2. **OpenAI** (`gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, `o3`, `o4-mini`, `o3-mini`)
  3. **Anthropic Claude** (`claude-sonnet-4`, `claude-opus-4`, `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`)
  4. **Google Gemini** (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`, `gemini-1.5-flash`)
  5. **DeepSeek** (`deepseek-chat` V3, `deepseek-reasoner` R1, `deepseek-coder`)
  6. **xAI Grok** (`grok-3`, `grok-3-mini`, `grok-3-fast`, `grok-2-1212`, `grok-2-vision-1212`)
  7. **Groq LPU** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `deepseek-r1-distill-llama-70b`, `qwen-qwq-32b`, `qwen-2.5-coder-32b`, `gemma2-9b-it`, `mixtral-8x7b-32768`)
  8. **Ollama / LAN Local Agents** (`hermes3:8b`, `hermes3:70b`, `qwen2.5-coder:32b`, `qwen2.5-coder:7b`, `deepseek-r1:14b`, `deepseek-r1:8b`, `llama3.3:70b`, `llama3.2:3b`, `mistral-small:24b`, `phi4:14b`) — configurable to any `127.0.0.1` or LAN IP (`http://192.168.x.x:11434/v1/chat/completions`).
- **Volatile RAM Key Enclave**: `zoth-lite-models --set-key <provider>` writes keys with `0600` permissions strictly to `/run/user/$UID/zoth-keys.env` or `/dev/shm` so keys vanish automatically on shutdown unless explicitly exported via `--export-keys`.

### 2. 📖 First-Boot Interactive Onboarding (`zoth-lite-welcome`)
- Autostarts on first desktop login (`zoth-lite-welcome.desktop`) and runs anytime in the terminal (`zoth-lite-welcome --interactive` or `zoth-lite-welcome --all`).
- Walks operators step-by-step through:
  1. **56+ Model & LAN Agent Setup**
  2. **Power-Off / Shutdown Behavior** (`toram noswap` physical RAM discharge — unplug USB after boot, zero internal disk mounts, zero logs left behind)
  3. **Modular On-Demand Tool Installation** (`zoth-lite-pkg install <tool>` & `apt`)
  4. **Encrypted Peer-to-Peer ZothNet Messaging** (`zothnet status`, `zothnet peers`, `zothnet chat <peer>`)
  5. **External USB/NVMe & Cloud Persistence** (`zoth-lite-storage mount` & `rclone` cloud sync)

### 3. 💾 Intentional Persistence Outside RAM (`zoth-lite-storage`)
- Safely enumerates external USB/SSD/NVMe partitions without auto-mounting internal host drives.
- Syncs agent builds and repositories with deterministic `SHA256SUMS.manifest.json` verification to external drives (`/mnt/zoth-ext/...`) or cloud remotes (`rclone` S3, Google Drive, Dropbox, WebDAV).

### 4. 🛠️ Zero-Bloat Browser & Local Workstation (`:8145` & `zothos-lite.nullai.tech`)
- **56-Model AI Agent Swarm Runner** (all 56 models selectable immediately in `<select id="modelSelect">` grouped across all 8 providers + custom LAN endpoint input)
- **Interactive ZothNet P2P Mesh & Cold Signer**
- **Precision Video & Audio Player** (frame-step, playback rate, 26-band WebAudio spectrum, PNG frame capture)
- **Precision Image Inspector** (pan/zoom, rotate, grayscale/invert, uncompressed RAM footprint calculator)
- **External Storage & Cloud PKZIP Packager** (zero-dependency client-side CRC-32 ZIP builder)
- **Zoth-CoT Merkle Thought DAG Explorer**

---

## 🚀 Quick Start & CLI Reference

```bash
git clone https://github.com/1nc0gn30/zothos-lite.git
cd zothos-lite

# 1. Launch the ZothOS-Lite v1.2 Web Workstation & Telemetry Daemon (:8145)
node server.js

# 2. Explore the OS CLI & TUI Suite
./bin/zoth-lite-welcome --all
./bin/zoth-lite-models --providers
./bin/zoth-lite-models --list
./bin/zoth-lite-storage status
./bin/zoth-lite-pkg list
./bin/zothos-lite-tui

# 3. Stage / Build the Bootable Debian 13 Live ISO or QEMU RAM Image
./build/build-zothos-lite-iso.sh --dry-run
./vm/build-vm-image.sh
./vm/launch-vm.sh

# 4. Run Automated E2E + Thermal Guardrail + Triple-Viewport Verification
npm test
```

---

## ☕ 100% Open-Access & Support

Every OS utility, ISO builder, and workstation tool in **ZothOS-Lite v1.2** is **100% free, open, and unlocked by default** with zero paywalls.

- **☕ Buy Us a Coffee (Stripe)**: [https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- **◎ Solana Tip Address**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

**Engineered by 1nc0gn30 ([@1nc0gn30](https://github.com/1nc0gn30)) • [NullAI Platform](https://nullai.tech) • [ZothOS-Lite](https://zothos-lite.nullai.tech)**
