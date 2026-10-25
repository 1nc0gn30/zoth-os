# ZOTHOS v3.3.0 — Sovereign Interactive Desktop, One-Shot WebGen Foundry & Mobile Bridge Release

Debian 13 (Trixie) + KDE Plasma 6.3 Wayland live/installable hybrid UEFI/BIOS ISO (`x86_64`) featuring the native 3D interactive OS wallpaper & cursor trail, SimpleX-Matrix & Signal mobile bridges, One-Shot WebGen Netlify Foundry, and Zoth Studio v2.1.0.

## ✨ Highlights in v3.3.0

### 1. Native KDE Plasma 6.3 Interactive 3D Wallpaper (`org.zothos.interactive`) & Cursor Trail
- Restored and hardened the native QML desktop wallpaper plugin (`org.zothos.interactive`) with 3D mouse-tilt metallic `Z O T H O S` lettering, parallax sacred geometry, and real-time golden spark/comet cursor trails powered by `zoth-cursor-daemon` (`127.0.0.1:9989`) and KWin cursor tracking.
- `zoth-mode` (Reality Switcher) and `zoth-wallpaper` now preserve `org.zothos.interactive` across all reality themes (`gold`, `matrix`, `cyber`, `redteam`, `void`) without overwriting the desktop with a flat static image.

### 2. SimpleX-Matrix & Signal Mobile Bridges (`:8767`, `:8768`, `:8102`)
- **Signal Bridge Dispatcher (`zoth-signal-bridge.service` on `:8768`)**: Bidirectional `signal-cli` JSON-RPC + CLI polling with instant mobile command execution.
- **SimpleX Chat & Matrix Sovereign Bridge (`zoth-simplex-bridge.service` on `:8767`)**: Connects SimpleX CLI WebSocket (`:5225`) and Matrix Homeserver rooms to ZothOS.
- **Unified Sovereign Agent Bridge (`sovereign-agent-bridge.service` on `:8102`)**: Phone-to-OS commands (`!status`, `!temps`, `!exec`, `!ask`, `!webgen`, `!bridge`).

### 3. `zoth-webgen` One-Shot Idea → Template Remix → Live Netlify Deploy (`:8092`)
- One-shot synthesis from plain-English idea to live `https://*.netlify.app` deployment in seconds.
- Remixes **56 Sovereign Production Web Apps** and **182 100-Websites-in-30-Days presets** with 60fps **@teknium Uncommon Web** interactive canvas shaders (`braille`, `dither`, `ascii`, `constellation`).

### 4. CLI & Workstation Arsenal Upgrades
- **`zoth-tool-nexus`**: `--doctor` diagnostic optimized from >6.6s to **109ms** (`93/93 tools ready — 100.0% operational`).
- **`zoth-mcp`**: `zoth-mcp status` optimized from >6s to **64ms** across 152+ MCP servers.
- **New Sovereign CLI Tools**: `zoth-ascii-magic` v2.7.0 (Bayer dither, liquid chrome SDF & SVG generator), `zoth-city-desk`, `zoth-swarm-quorum` (21-agent Pantheon BFT verifier), `zoth-gesture-map`, `zoth-surface-sentinel`, `zoth-fleet`, `zoth-relay`, `zoth-bot`.
- **Zoth Studio v2.1.0**: Updated desktop & CLI suite with native binaries for Linux, macOS, and Windows.

---

## ⬇️ Download & Reassemble the ISO

The bootable ISO (`zothos-3.3-amd64.iso`) is split into `<2 GiB` parts (`zothos-3.3-amd64.iso.part00` .. `part04`) to fit GitHub Release asset limits. Download all `zothos-3.3-amd64.iso.part*` files plus `zothos-join-iso.sh` and `SHA256SUMS` into one directory, then run:

```bash
bash zothos-join-iso.sh   # reassembles zothos-3.3-amd64.iso and verifies SHA-256
```

 Flash to USB with:
```bash
sudo dd if=zothos-3.3-amd64.iso of=/dev/sdX bs=4M status=progress oflag=sync
```
