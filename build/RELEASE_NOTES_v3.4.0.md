# 🜂 ZOTHOS v3.4.0 — 72-Tool Sovereign Arsenal, Universal AI Cockpit & ZothOS-Lite v1.2 Release

Debian 13 (Trixie, Kernel `6.12.111-amd64`) + KDE Plasma 6.3 Wayland live/installable hybrid UEFI/BIOS distribution (`x86_64`) featuring the complete **72-Tool Zero-Paywall Sovereign Arsenal** (`53` in-browser WebGPU + `19` local CLI/daemon enclaves across `18` Tactical Cadres), **83 deterministic `.desktop` launchers** (`7` Root Flagships + `4` Consolidated Folders), **163 air-gapped MCP server definitions** (all off by default), **ZothOS-Lite v1.2** (`:8145`), and **Zoth Studio v2.2.0** (`:3000`).

---

## ✨ Highlights in ZothOS v3.4.0

### 1. Complete 72-Tool Sovereign Arsenal & Triple-Path CLI Parity (`72/72 PASS`)
- **72/72 Sovereign CLI Binaries**: Installed and verified across `/usr/local/bin/<id>`, `~/.local/bin/<id>`, and `config/includes.chroot/usr/local/bin/<id>` with `--help`, `--json`, and 60fps Unicode `U+2800` Braille TUI subcommands.
- **Zero Port Collisions**: All 72 tools mapped to unique loopback ports (`127.0.0.1`) across `ZOTHOS_TOOLS_CATALOG.md`, `zoth-studio-v2`, `zoth-os-website`, and `zoth-npm`.
- **100% Free & Open-Access (`$0`)**: Zero paywalls or license gates across all 72 tools and OS daemons. Optional community support via **☕ Buy Us a Coffee (Stripe)** (`https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X`) and **Solana Tip** (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

### 2. Universal Hardware AI Cockpit (`:8137`) + ZothOS-Lite v1.2 (`:8145`)
- **ZothOS v3.4.0 Live Cockpit (`:8137`)**: Interactive Multi-Model Swarm Cockpit supporting 42+ frontier models across 8 providers (OpenRouter, Nous Hermes, Anthropic, OpenAI, Groq, Google Gemini, DeepSeek, Ollama) on universal x86_64 hardware (Intel, AMD, NVIDIA, Mesa DRM/KMS).
- **ZothOS-Lite v1.2 (`~/NullAITech/zothos-lite` · `:8145`)**: Universal Amnesic Edition (`toram noswap`) with 4 in-browser dev utilities (Swarm Console, Image Inspector, AV Player & Spectrum, Storage Packager), ZothNet encrypted mesh communication, and comprehensive onboard interactive guide (`zoth-welcome`).

### 3. Deterministic 4-Folder KDE Plasma 6.3 Desktop (`83` Launchers) & Xcursor Hardening
- **7 Root Flagship Desktop Icons**: `zoth-os`, `zoth-studio`, `zoth-civilization`, `zoth-tool-nexus`, `zoth-control-center`, `google-chrome`, and `install-zothos`.
- **4 Consolidated Desktop Folders (`76` Categorized Launchers)**:
  - `01-AI-Agents-and-Dev/` (`20` launchers)
  - `02-Security-and-Privacy/` (`19` launchers)
  - `03-ZothOS-Daemons/` (`18` launchers)
  - `04-Media-and-Utilities/` (`19` launchers)
- **Multi-Size Xcursor Binary Suite & `SWCursor` Hardening**: 166,688-byte `Zoth-Gold-Cursors` (`Xcur` magic verified, `16×16` to `48×48`, 90+ X11/Wayland/GTK/Qt symlinks) with `Option "SWCursor" "true"` and `KWIN_FORCE_SW_CURSOR=1`.

---

## ⚡ One-Command In-Place Upgrade to ZothOS v3.4.0

Upgrade any existing ZothOS installation directly to **v3.4.0** without reflashing USB media:

```bash
git clone https://github.com/NullAITech/zoth-os.git ~/NullAITech/zoth-os 2>/dev/null || git -C ~/NullAITech/zoth-os pull
bash ~/NullAITech/zoth-os/tools/upgrade-to-v3.4.sh
```

## ⬇️ Hybrid UEFI/BIOS ISO Reassembly & USB Flash

To reassemble the split `<2 GiB` ISO parts (`part00` .. `part04`) and verify SHA-256 checksums:

```bash
bash zothos-join-iso.sh
sudo dd if=zothos-3.4-amd64.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

Engineered by **1nc0gn30 (@1nc0gn30) • NullAI Platform** (`https://zothos.nullai.tech` · `https://zoth.nullai.tech` · `https://nullai.tech`).
