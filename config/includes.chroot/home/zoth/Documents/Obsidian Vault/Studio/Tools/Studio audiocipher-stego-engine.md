---
title: "AudioCipher Stego Studio"
tags: [studio, tool, verified, open-access, walkthrough-complete]
aliases: ["audiocipher-stego-engine", "AudioCipher Stego Studio"]
pillar: "Pillar I: Cryptography & Security Protocols"
category: "Security & OpSec"
runs: "daemon+browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-10-31"
test_status: "PASS (12-Step Gallery Verified)"
local_port: 8096
cli_binary: "audiocipher-stego-engine"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/audiocipher-stego-engine"
live_url: "http://127.0.0.1:8096"
studio_url: "http://127.0.0.1:3000/tools/audiocipher-stego-engine"
workstation_shot: "audiocipher-stego-engine_07_gui_pcm_lsb_steganography.jpg"
studio_shot: "audiocipher-stego-engine_11_studio_godmode_embed_seal.jpg"
braille_shape: "lissajous"
braille_archetype: "Harmonic Phase Oscilloscope (3:4)"
step1_install_shot: "audiocipher-stego-engine_01_dev_install_and_pytest.jpg"
step2_load_shot: "audiocipher-stego-engine_02_user_install_and_help.jpg"
step3_tui_shot: "audiocipher-stego-engine_03_tui_stego_embed_extract_and_steganalysis.jpg"
step5_gui_exec_shot: "audiocipher-stego-engine_08_gui_dtmf_goertzel_dialpad.jpg"
cli_shot: "audiocipher-stego-engine_04_tui_bfsk_modem_morse_and_json.jpg"
---

# AudioCipher Stego Studio (`audiocipher-stego-engine`)

> [!CHECK] Sovereign Verification Passed (12-Step Developer & User Gallery Verified)
> **Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform**
> Verified across Developer installation (`pytest -v` 66/66 passing in `2.98s`), Native ZothOS CLI (`audiocipher-stego-engine embed | extract | steganalysis | modem | morse | doctor | test-self | --json`), Standalone Acoustic Cryptography Workstation (`http://127.0.0.1:8096`), and Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/audiocipher-stego-engine`) with **`overflowPx: 0`** and **`consoleErrors: 0`**.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `audiocipher-stego-engine` |
| **Category** | `Security & OpSec` |
| **Mathematical Pillar** | `Pillar I: Cryptography & Security Protocols` |
| **Runtime Engine** | Zero-Dependency Python 3.12 DSP/REST Daemon (`:8096`) + Web Audio & Web Crypto API |
| **Local Port & URL** | `:8096` • [http://127.0.0.1:8096](http://127.0.0.1:8096) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/audiocipher-stego-engine](http://127.0.0.1:3000/tools/audiocipher-stego-engine) |
| **CLI Binary** | `/usr/local/bin/audiocipher-stego-engine` • `~/.local/bin/audiocipher-stego-engine` |
| **GitHub Repository** | [https://github.com/1nc0gn30/audiocipher-stego-engine](https://github.com/1nc0gn30/audiocipher-stego-engine) |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Complete 12-Step Developer & User Walkthrough Gallery

### Step 1/12 — Developer Perspective: DSP/Crypto Source Modules & Pytest Suite (`66 passed`)
- **Action**: Inspect `/home/zoth/NullAITech/audiocipher-stego-engine/src/audiocipher_stego_engine/` (`acoustic_modem.py`, `crypto_core.py`, `spectrogram.py`, `steganalysis.py`, `stego_engine.py`, `wav_codec.py`, `mcp_server.py`) and run `pytest -v tests` (66/66 tests passing).
![[audiocipher-stego-engine_01_dev_install_and_pytest.jpg]]

### Step 2/12 — End-User Perspective: Global Binary Resolution, Diagnostic Doctor, Self-Test & CLI Help
- **Action**: Verify global binary paths (`which -a audiocipher-stego-engine`), check live `:8096` daemon status (`--status`), run `audiocipher-stego-engine doctor` and `audiocipher-stego-engine test-self`, and inspect all 11 subcommands (`audiocipher-stego-engine --help`).
![[audiocipher-stego-engine_02_user_install_and_help.jpg]]

### Step 3/12 — TUI Execution Part 1: PCM WAV LSB Steganography (`embed` / `extract`) & PoV Chi-Square Forensic Steganalysis
- **Action**: Embed a secret payload into a WAV audio carrier (`audiocipher-stego-engine embed "SOVEREIGN_ENCLAVE_SECRET_KEY=757_OMEGA_VECTOR" -o /tmp/ac_stego.wav`), extract and verify it (`audiocipher-stego-engine extract`), and audit the carrier with `audiocipher-stego-engine steganalysis /tmp/ac_stego.wav` (`Verdict: TAMPERED_STEGO_DETECTED`, `Confidence Score: 99.5%`, `PoV Chi-Square: 10445.02`).
![[audiocipher-stego-engine_03_tui_stego_embed_extract_and_steganalysis.jpg]]

### Step 4/12 — TUI Execution Part 2: Acoustic BFSK Modem (`modulate` / `demodulate`), ITU Morse Synthesizer & JSON Telemetry
- **Action**: Modulate an air-gap directive into an acoustic BFSK WAV carrier (`audiocipher-stego-engine modem modulate`), demodulate and verify its CRC-16 (`VALID CRC-16 VERIFIED`, `Estimated SNR: 21.22 dB`), synthesize ITU Morse audio (`audiocipher-stego-engine morse "SOS ZOTH 757"`), and emit `--json` telemetry.
![[audiocipher-stego-engine_04_tui_bfsk_modem_morse_and_json.jpg]]

### Step 5/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 1: Acoustic-Keyed Payload Encryption (PBKDF2 + AES-GCM)
- **Action**: Open the standalone workstation on `:8096` and click `🔒 Encrypt with Acoustic Key` to derive a 256-bit AES-GCM key from the 440Hz PCM carrier spectrum (`116 bytes`, `PBKDF2 10,000 rounds + AES-GCM`) with live Oscilloscope and FFT Spectrum visualization.
![[audiocipher-stego-engine_05_gui_acoustic_keyed_cipher.jpg]]

### Step 6/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 1: Acoustic-Keyed Decryption & Authentication
- **Action**: Click `🔓 Decrypt & Verify` to authenticate the AES-GCM tag against the acoustic carrier key and recover `Top Secret Sovereign Agent Directive #757 -- Zero-Trust Channel Verified`.
![[audiocipher-stego-engine_06_gui_acoustic_keyed_decrypt.jpg]]

### Step 7/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 2: 16-Bit PCM WAV LSB Steganography & CRC-32 Verification
- **Action**: Switch to `🛡️ PCM LSB Steganography`, click `🛡️ Embed into Audio Carrier` (`41 bytes into 2.00s WAV`, `CRC-32 Checksum: 0xE9ECC1CC`), and click `🔍 Extract from Carrier` (`Checksum: 0xE9ECC1CC (VALID)`).
![[audiocipher-stego-engine_07_gui_pcm_lsb_steganography.jpg]]

### Step 8/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 3: DTMF Dual-Tone Dialpad & Goertzel Algorithm Decoder
- **Action**: Switch to `☎️ DTMF Dual-Tone Dialpad`, synthesize `18005550199#` (`1.80s WAV`), and execute `🔍 Goertzel Decode` (`✓ GOERTZEL DECODED DIGITS: [ 18005550199# ] | Detected 12 tones`).
![[audiocipher-stego-engine_08_gui_dtmf_goertzel_dialpad.jpg]]

### Step 9/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 4: ITU Standard Acoustic Morse Code Synthesizer
- **Action**: Switch to `📻 Morse Code Synthesizer` and synthesize `SOS SOVEREIGN AGENT 757` at 20 WPM (`Duration: 12.84s @ 20 WPM (800 Hz Tone)`) with cosine-ramped envelope visible on the Web Audio Oscilloscope.
![[audiocipher-stego-engine_09_gui_itu_morse_synthesizer.jpg]]

### Step 10/12 — Standalone GUI (`http://127.0.0.1:8096`) Mode 5: Continuous-Phase BFSK Acoustic Air-Gap Modem
- **Action**: Switch to `📡 BFSK Acoustic Modem`, modulate `CONFIDENTIAL AGENT DIRECTIVE // AIR-GAP TRANSMISSION #9` (`1.86s Audio, 300 Baud`, `Mark: 1200 Hz | Space: 2200 Hz`), and demodulate the UART 8-N-1 bitstream (`Decoded 55 bytes over 300 baud BFSK`).
![[audiocipher-stego-engine_10_gui_bfsk_acoustic_modem.jpg]]

### Step 11/12 — Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/audiocipher-stego-engine`): Mil-Spec LSB Bitstream Injection
- **Action**: Open the Zoth Studio v2 God-Mode route, inspect the 432Hz harmonic carrier (`220,500 PCM Samples • Capacity: 27,550 bytes`), and click `INJECT & SEAL AUDIO` (`960 bits / 120 bytes sealed with LSB modulation`).
![[audiocipher-stego-engine_11_studio_godmode_embed_seal.jpg]]

### Step 12/12 — Zoth Studio v2 God-Mode: Covert LSB Payload Extraction & Verification
- **Action**: Switch to the `EXTRACT SECRET (LSB RECOVERY)` tab and click `EXTRACT & RECOVER SECRET` to verify the `ZOTHSTEG` magic header and recover the covert enclave credentials.
![[audiocipher-stego-engine_12_studio_godmode_extract_recover.jpg]]

---

## Verification & Command Reference

```bash
# 1. Developer Pytest Suite (66 tests)
pytest -v /home/zoth/NullAITech/audiocipher-stego-engine/tests

# 2. Diagnostics & Internal Self-Verification
audiocipher-stego-engine doctor
audiocipher-stego-engine test-self

# 3. PCM WAV LSB Steganography & Forensic Steganalysis
audiocipher-stego-engine embed "SOVEREIGN_ENCLAVE_SECRET_KEY=757_OMEGA_VECTOR" -o /tmp/ac_stego.wav
audiocipher-stego-engine extract /tmp/ac_stego.wav -o /tmp/ac_out.txt
audiocipher-stego-engine steganalysis /tmp/ac_stego.wav

# 4. Acoustic BFSK Air-Gap Modem & ITU Morse Synthesizer
audiocipher-stego-engine modem modulate "AIRGAP_DIRECTIVE_757_VERIFIED" -o /tmp/ac_modem.wav --baud 300
audiocipher-stego-engine modem demodulate /tmp/ac_modem.wav
audiocipher-stego-engine morse "SOS ZOTH 757" -o /tmp/ac_morse.wav
```

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
