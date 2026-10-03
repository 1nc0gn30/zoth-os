# ✦ ZOTHOS v3.1 Master Release — Sovereign AI Telemetry & Cognitive Cockpit

ZOTHOS v3.1 introduces a groundbreaking cognitive telemetry pipeline, the zero-math **Visual Cockpit**, an interactive 3D particle desktop canvas, cinematic boot splash transitions, and hardened system authentication.

---

### 🌟 Key Highlights & Major Additions

#### 🔬 1. Mathematical AI Pillar HUD & Grounded Telemetry Engine
- **Kernel-Grounded Process Metrics**: Eliminates synthetic heuristics in favor of live `/proc/<pid>/statm` RSS readings for Ollama, Python, Cursor, and Antigravity processes.
- **Empirical Attention Entropy & Perplexity**: Real-time computation of Shannon entropy $H(A) = -\sum p_i \log_2 p_i$ and Bigram Perplexity $PPL = 2^{H(A)}$ over live model reasoning traces.
- **Timestamp-Grounded Velocity**: Measures true instantaneous token generation rates ($v_T = \Delta \text{tokens} / \Delta t$) by parsing consecutive ISO timestamps.
- **Multi-Agent Neural Mesh Support**: Native scraping and live UDP/HTTP telemetry ingestion for Google Antigravity, Cursor IDE, Ollama, and Zoth-Sentinel.

#### 💡 2. "Visual Cockpit" Mode (Intuitive Non-Math Interface)
- **🎯 AI Brain Focus & Clarity Dial**: Segmented 4-stage color spectrum (`Confused` ➔ `Searching` ➔ `Focused` ➔ `Laser Sharp`) showing instant certainty percentages (e.g. `98% Sure`) and plain-English clarity status.
- **🚀 Thought Speedometer & 🔋 Memory Fuel Tank**: Speedometer reading in simple words/sec with turbo badges, plus an automotive-style conversation fuel gauge showing memory saturation.
- **🪜 4-Stage Thinking Journey Stepper**: Animated visual pipeline tracking what the AI is doing in real-time (`1. 👁️ Reading` ➔ `2. 🧠 Planning` ➔ `3. 🔧 Executing` ➔ `4. ✨ Answering`).
- **💬 Plain-English Activity Feed**: Human-readable action cards explaining *what* happened and *why*, with click-to-expand mathematical proof drawers.

#### 🌌 3. Celestial 3D Interactive Wallpaper & UI Polish
- **Dynamic Gold Mouse Trails**: Interactive celestial particle engine tracking cursor motion across the Sovereign Intelligence background canvas.
- **Reboot Persistence**: Autostart hooks guaranteeing the interactive canvas persists across user sessions and reboots.
- **Cinematic 60fps Boot Splash**: High-definition Plymouth theme with vector star glyphs and matrix transitions.

#### 🛡️ 4. Security & System Hardening
- **PAM Lock Screen Resolution**: Enforced `root:shadow 2755` SGID permissions on `unix_chkpwd` across live and installed environments.
- **SUID Sandbox Hardening**: Guaranteed permissions for Electron and Chromium sandbox helpers.
- **Sovereign Vault & Secret Injection**: Argon2id + ChaCha20-Poly1305 encrypted secret manager (`zoth-vault`).

---

### 💿 ISO Image & Verification

- **Filename**: `zothos-3.1-amd64.iso`
- **Architecture**: `x86_64` (AMD64)
- **Format**: Hybrid ISO (UEFI Secure Boot + Legacy BIOS MBR)
- **Kernel**: Linux `6.12.111+deb13-amd64`
- **Default Live Credentials**: User `zoth` | Password `zoth` (Root: `zoth`)
- **Secondary User**: User `azoth` | Password `zoth`

#### SHA256 Verification Checksum:
```text
44ab8e7bf2e50e1096ebea16b258133ed57aecd910a6b2178c3f3f65736ba1fc  zothos-3.1-amd64.iso
```

---

### 📦 Download & Reassembly Instructions

Due to GitHub's 2 GiB per-asset release limit, the 8.5 GB hybrid ISO is packaged in GitHub-compliant split chunks:
1. Download all files:
   - `zothos-3.1-amd64.iso.part00`
   - `zothos-3.1-amd64.iso.part01`
   - `zothos-3.1-amd64.iso.part02`
   - `zothos-3.1-amd64.iso.part03`
   - `zothos-3.1-amd64.iso.part04`
   - `zothos-3.1-amd64.iso.sha256`
   - `zothos-join-iso.sh`
2. Run the automated reassembly helper:
   ```bash
   bash zothos-join-iso.sh
   ```
   *Or combine manually:*
   ```bash
   cat zothos-3.1-amd64.iso.part* > zothos-3.1-amd64.iso
   sha256sum -c zothos-3.1-amd64.iso.sha256
   ```
3. Flash to USB drive using Balena Etcher, Rufus, or `dd`:
   ```bash
   sudo dd if=zothos-3.1-amd64.iso of=/dev/sdX bs=4M status=progress conv=fsync
   ```

---
✦ *Sovereign Mind. Sovereign Code. Sovereign Silicon.* ✦
