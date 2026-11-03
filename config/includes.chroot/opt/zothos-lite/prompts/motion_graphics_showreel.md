# ZothOS-Lite v1.1 — Motion Graphics Showreel Suite Blueprint

## Overview
Deterministic 60fps HTML5 Canvas + Headless Chromium CDP + Procedural `-14.0 LUFS` Audio Suite (`sfx` 48kHz stereo) for **ZothOS-Lite v1.1 (Amnesic Monotone Edition)**.

- **Aesthetic**: High-Contrast 1-Bit Monotone & Holographic Gold (`#040407` void, `#FFFFFF` pure phosphor, `#F5D061` sovereign gold, Ordered Bayer 8×8 dithering, and `U+2800` 2×4 sub-pixel Braille matrices).
- **Hero Anchor Shape**: Rotating 3D Perspective Merkle Octagon (`◈`) with triple orbital telemetry rings synced to the beat decay (`kick = exp(-beatPhase * 4.4)`).

---

## Reel 1: Flagship Launch Showreel (`zothos-lite-hero-showreel.mp4`)
- **Format**: `1920×1080` (16:9 Widescreen) @ `60fps` • `18.0s` • `128 BPM` • `-14.0 LUFS` (`-2.74 dBTP`)
- **Scene Breakdown**:
  1. `0.0s – 3.2s` (`01_3d_braille_cathedral`): **100% RAM-ONLY. 3D BRAILLE DEPTH.** (`zoth-lite-boot --toram --noswap --scene cathedral --bayer-8x8`)
  2. `3.2s – 6.8s` (`02_direct_konsole_pty`): **TYPE DIRECTLY IN THE TERMINAL.** (`konsole --direct-pty --split-dual --profile ZothMonotone.profile`)
  3. `6.8s – 10.8s` (`03_vaelor_zoth_node`): **ZERO GAS. 80°C THERMAL GUARD.** (`zoth-node status --quorum 5/5 --pouw-guardrail 80C/85C`)
  4. `10.8s – 14.5s` (`04_azoth_cot_dag`): **EMBODIED VOICE. MERKLE MEMORY.** (`azoth-agent --voice af_bella --cot-merkle-dag active`)
  5. `14.5s – 18.0s` (`05_sovereign_resolve`): **ZOTHOS-LITE v1.1 SOVEREIGN OS** (`git clone https://github.com/1nc0gn30/zothos-lite && npm start`)

---

## Reel 2: Vaelor (`VLR`) L1 & Zoth-Node Validator Edit (`zothos-lite-vaelor-node-edit.mp4`)
- **Format**: `1920×1080` (16:9 Widescreen) @ `60fps` • `15.0s` • `132 BPM` • `-14.0 LUFS` (`-2.93 dBTP`)
- **Scene Breakdown**:
  1. `0.0s – 3.5s` (`01_vaelor_genesis`): **INSTANT BFT. ZERO GAS FEES.** (`vaelor-cli dag --genesis VLR_GENESIS_2026 --quorum 5/5`)
  2. `3.5s – 7.2s` (`02_ed25519_argon2id`): **REAL CRYPTO. ZERO PLACEHOLDERS.** (`vaelor-cli tx --sign-ed25519 --kdf argon2id-64mb --multisig 2-of-3`)
  3. `7.2s – 11.2s` (`03_thermal_pouw_guardrail`): **MINES SAFELY. WATCHES CPU TEMPS.** (`curl -s http://127.0.0.1:8145/api/thermals | jq .pouwGuardrail`)
  4. `11.2s – 15.0s` (`04_vaelor_resolve`): **SOVEREIGN L1 BUILT INTO THE OS.** (`vaelor-cli status --node http://127.0.0.1:8140 --verify-all`)

---

## Reel 3: Vertical 9:16 Social Hype Edit (`zothos-lite-vertical-hype-edit.mp4`)
- **Format**: `1080×1920` (9:16 Vertical) @ `60fps` • `15.0s` • `136 BPM` • `-14.0 LUFS` (`-3.38 dBTP`)
- **Scene Breakdown**:
  1. `0.0s – 3.0s` (`v01_boot`): **100% RAM-ONLY. 3D BRAILLE OS.**
  2. `3.0s – 6.0s` (`v02_konsole`): **TYPE DIRECTLY IN TERMINAL.**
  3. `6.0s – 9.0s` (`v03_vaelor`): **$0.00 GAS BFT. 80°C GUARDRAIL.**
  4. `9.0s – 12.0s` (`v04_azoth`): **IT SPEAKS. NEVER FORGETS.**
  5. `12.0s – 15.0s` (`v05_resolve`): **ZOTHOS-LITE v1.1 LIVE NOW.**

---

## Reproducible Build Commands
```bash
python3 motion-edit/build_audio_suite.py
node motion-edit/render_suite.js
```
