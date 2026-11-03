---
title: "Likeness Desk"
tags: [studio, tool, verified, open-access]
aliases: ["likeness-desk", "Likeness Desk", "Likeness Desk (AI Video Double)"]
pillar: "Pillar IV: Real-Time Audio-Visual & Generative Synthesis"
category: "Voice & Real-Time"
runs: "daemon"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-10-31"
test_status: "PASS (12-Step Gallery Verified)"
local_port: 9395
cli_binary: "likeness-desk"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/likeness-desk"
live_url: "http://127.0.0.1:9395"
studio_url: "http://127.0.0.1:3000/tools/likeness-desk"
workstation_shot: "Artifacts/likeness-desk/likeness-desk_07_gui_standalone_video_double_stage.jpg"
studio_shot: "Artifacts/likeness-desk/likeness-desk_09_gui_studio_godmode_video_double.jpg"
braille_shape: "orbit"
braille_archetype: "Elliptical N-Body Particle Orbit"
---

# Likeness Desk (AI Video Double)

> [!CHECK] Sovereign Verification Passed (100% Free & Operational)
> **Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform**
> Verified across Developer & End-User perspectives with a **12-Step Real Verification Screenshot Gallery** (`8 passed in 0.40s` pytest suite, Chatterbox Turbo 24kHz voice cloning, Wav2Lip GAN mouth ROI lip-sync on NVIDIA Quadro P1000, Standalone `:9395` Video Double Stage, Zoth Studio v2 `:3000` God-Mode Workstation, and Mobile `390px` viewport with **`overflowPx: 0`** and **`consoleErrors: 0`**). Zero paywalls, zero license modals, zero cloud egress.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `likeness-desk` |
| **Category** | `Voice & Real-Time` |
| **Mathematical Pillar** | `Pillar IV: Real-Time Audio-Visual & Generative Synthesis` |
| **Runtime Engine** | `Node.js HTTP Server (:9395) + Python Chatterbox Voice (:9396) + Wav2Lip GPU (:9397)` |
| **Local Port & URL** | `:9395` • [http://127.0.0.1:9395](http://127.0.0.1:9395) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/likeness-desk](http://127.0.0.1:3000/tools/likeness-desk) |
| **CLI Binary** | `/usr/local/bin/likeness-desk` • `~/.local/bin/likeness-desk` • `/usr/local/bin/likeness` |
| **GitHub Repository** | [https://github.com/1nc0gn30/likeness-desk](https://github.com/1nc0gn30/likeness-desk) |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## 12-Step Developer & End-User Verification Gallery

### Part I — Developer Perspective (Architecture, Pytest Suite & REST API Contracts)

#### Step 1/12 — Developer Repository Architecture, Engine Workers & Biometric Profile
- **Action**: Inspect `server.js`, `engine/voice_worker.py`, `engine/face_worker.py`, `models/wav2lip_gan.pth`, `data/face/portrait.jpg`, `data/voice/reference.wav` (16.7s), and `data/profile.json`.
![[Artifacts/likeness-desk/likeness-desk_01_dev_repo_architecture.jpg]]

#### Step 2/12 — Developer Automated Test Suite (`pytest -v` — 8 Passed)
- **Action**: Run `pytest -v` verifying biometric assets, `/health`, `/api/status`, `/api/portrait`, `/api/mouth` ROI updates, `/api/speak` WAV/JSON synthesis, `/api/face/render` MP4 generation, and the ZothOS CLI (`8 passed in 0.40s`).
![[Artifacts/likeness-desk/likeness-desk_02_dev_pytest_suite.jpg]]

#### Step 3/12 — Developer REST API & Wav2Lip Mouth ROI Contract (`/health`, `/api/status`, `POST /api/mouth`)
- **Action**: Test `GET /health`, `GET /api/status`, and `POST /api/mouth` on `http://127.0.0.1:9395`.
![[Artifacts/likeness-desk/likeness-desk_03_dev_api_contracts.jpg]]

---

### Part II — End-User CLI / TUI Perspective (Installation, Pipeline Status & Neural Speech Synthesis)

#### Step 4/12 — End-User CLI Installation & Subcommand Discovery (`which -a` & `--help`)
- **Action**: Verify global ZothOS binaries (`/usr/local/bin/likeness-desk`, `~/.local/bin/likeness-desk`, `likeness`) and inspect `likeness-desk --help`.
![[Artifacts/likeness-desk/likeness-desk_04_user_cli_installation_and_help.jpg]]

#### Step 5/12 — End-User CLI Live GPU Pipeline Status & JSON Telemetry (`status` & `--json`)
- **Action**: Execute `likeness-desk status` and `likeness-desk --json` to inspect live NVIDIA Quadro P1000 GPU readiness and the 16.7s Chatterbox reference profile.
![[Artifacts/likeness-desk/likeness-desk_05_user_cli_status_and_telemetry.jpg]]

#### Step 6/12 — End-User CLI Neural Speech & Lip-Sync Synthesis (`speak` & `ffprobe`)
- **Action**: Run `likeness-desk speak "Deploying sovereign AI video double on NVIDIA Quadro P1000 with zero cloud egress."` and verify the generated `preview.wav` (24kHz mono WAV, 698 KB) and `preview.mp4` (Wav2Lip MP4, 286 KB) streams via `ffprobe`.
![[Artifacts/likeness-desk/likeness-desk_06_user_cli_neural_speech_synthesis.jpg]]

---

### Part III — End-User GUI Perspective (Standalone `:9395`, Studio `:3000` & Mobile `390px`)

#### Step 7/12 — Standalone GUI (`:9395`): Video Double Portrait Stage & Mouth ROI Bounding Box
- **Action**: Open `http://127.0.0.1:9395/` and inspect the live portrait stage with the interactive mouth ROI bounding box, Voice cloning script card, and Face motion capture card.
![[Artifacts/likeness-desk/likeness-desk_07_gui_standalone_video_double_stage.jpg]]

#### Step 8/12 — Standalone GUI (`:9395`): Interactive Dialogue Transcript & Speech Synthesis
- **Action**: Enter a custom spoken response in `#talkInput`, trigger speech playback (`Speaking on NVIDIA Quadro P1000`), and verify the live dialogue transcript (`Them:` / `Me:`).
![[Artifacts/likeness-desk/likeness-desk_08_gui_standalone_talk_and_transcript.jpg]]

#### Step 9/12 — Zoth Studio v2 God-Mode (`:3000/tools/likeness-desk`): Video Double Studio & GPU Synthesis
- **Action**: Open the Zoth Studio v2 God-Mode route (`DAEMON :9395 ONLINE`), inspect the `Wav2Lip ROI [Quadro P1000]` facial mesh and 24kHz audio spectrum canvas, and click `Speak & Animate Double`.
![[Artifacts/likeness-desk/likeness-desk_09_gui_studio_godmode_video_double.jpg]]

#### Step 10/12 — Zoth Studio v2 God-Mode (`:3000/tools/likeness-desk`): Lip-Sync Kinematics & Voice Tuning
- **Action**: Switch to Tab 2 (`Neural Voice & Lip-Sync`) to tune Mouth Aperture Sensitivity (`1.20x`), Speech Cadence (`1.00x`), and Pitch Variance (`1.00x`).
![[Artifacts/likeness-desk/likeness-desk_10_gui_studio_godmode_lipsync_kinematics.jpg]]

#### Step 11/12 — Zoth Studio v2 God-Mode (`:3000/tools/likeness-desk`): Hardware Enclave & ZothOS CLI
- **Action**: Switch to Tab 3 (`Hardware Enclave & CLI`) to inspect ZothOS terminal commands (`likeness --status`, `likeness speak`, `likeness --json`).
![[Artifacts/likeness-desk/likeness-desk_11_gui_studio_godmode_hardware_cli.jpg]]

#### Step 12/12 — Mobile Responsive Viewport (`390px × 844px`) Verification
- **Action**: Verify zero horizontal scroll overflow (`scrollWidth <= clientWidth`, `overflowPx: 0`) on a `390×844` mobile viewport.
![[Artifacts/likeness-desk/likeness-desk_12_gui_mobile_390px.jpg]]

---

## Test & Verification Matrix

| Verification Check | Target Standard | Result | Status |
| :--- | :--- | :--- | :--- |
| **Developer Pytest Suite** | `pytest -v` | `8 passed in 0.40s` | 🟢 **PASS** |
| **CLI Execution** | `--help` / `status` / `speak` / `--json` | Returncode 0 | 🟢 **PASS** |
| **Daemon & API Health** | `http://127.0.0.1:9395/health` & `/api/status` | HTTP 200 OK | 🟢 **PASS** |
| **Mobile Viewport (390px)** | Zero horizontal overflow | `overflowPx: 0` | 🟢 **PASS** |
| **Desktop Viewport (1440px)** | Responsive multi-pane | `overflowPx: 0` | 🟢 **PASS** |
| **Browser Console Cleanliness** | Zero uncaught runtime errors | `consoleErrors: 0` | 🟢 **PASS** |
| **Paywall Audit** | No blur gates, license modals, or Solana Tip locks | 100% Open Access | 🟢 **PASS** |
