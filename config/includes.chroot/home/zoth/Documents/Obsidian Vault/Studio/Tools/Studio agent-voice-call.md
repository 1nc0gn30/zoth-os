---
title: "Agent Voice Call"
tags: [studio, tool, verified, open-access]
aliases: ["agent-voice-call", "Agent Voice Call"]
pillar: "Pillar V: Swarm Intelligence & Core Daemons"
category: "Voice & Real-Time"
runs: "browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-10-31"
test_status: "PASS (12-Step Gallery Verified)"
local_port: 8114
cli_binary: "agent-voice-call"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/agent-voice-call"
live_url: "http://127.0.0.1:8114"
studio_url: "http://127.0.0.1:3000/tools/agent-voice-call"
workstation_shot: "Artifacts/agent-voice-call/agent-voice-call_06_gui_standalone_cockpit.jpg"
studio_shot: "Artifacts/agent-voice-call/agent-voice-call_12_studio_godmode_synthesize_live.jpg"
braille_shape: "lissajous"
braille_archetype: "Harmonic Phase Oscilloscope (3:4)"
gallery_count: 12
gallery_shots:
  - "Artifacts/agent-voice-call/agent-voice-call_01_dev_install_and_pytest.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_02_user_install_and_help.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_03_tui_call_links_signal_simplex.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_04_tui_voices_and_json_telemetry.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_05_dev_rest_api_speak_and_debrief.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_06_gui_standalone_cockpit.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_07_gui_utterance_turn_azoth.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_08_gui_persona_switch_athena.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_09_gui_end_call_debrief_modal.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_10_studio_godmode_dark.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_11_studio_godmode_light.jpg"
  - "Artifacts/agent-voice-call/agent-voice-call_12_studio_godmode_synthesize_live.jpg"
---

# Agent Voice Call

> [!CHECK] Sovereign Verification Passed (100% Free & Operational — 12-Step Developer & User Gallery)
> **Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform**
> Verified across Developer (`pytest -v` 26 passed, REST `/api/call/create`, `/api/call/speak`, `/api/call/end`, and Kokoro ONNX WAV synthesis) and End-User (`agent-voice-call` CLI/TUI, `:8114` Live Voice Call Cockpit, and `:3000` Zoth Studio God-Mode) with **`overflowPx: 0`** and **`consoleErrors: 0`**.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `agent-voice-call` |
| **Category** | `Voice & Real-Time` |
| **Mathematical Pillar** | `Pillar V: Swarm Intelligence & Core Daemons` |
| **Runtime Engine** | `python3` Full-Duplex Voice Call Daemon (`:8114`) + Kokoro ONNX Neural TTS (`:9394`) + Web Audio API |
| **Local Port & URL** | `:8114` • [http://127.0.0.1:8114](http://127.0.0.1:8114) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/agent-voice-call](http://127.0.0.1:3000/tools/agent-voice-call) |
| **CLI Binary** | `/usr/local/bin/agent-voice-call` • `~/.local/bin/agent-voice-call` |
| **GitHub Repository** | [https://github.com/1nc0gn30/agent-voice-call](https://github.com/1nc0gn30/agent-voice-call) |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Complete 12-Step Developer & End-User Verification Gallery

### Step 1/12 — [Developer Perspective] Source Architecture & Automated Pytest Suite (`26 passed`)
- **Action**: Inspect `/home/zoth/NullAITech/agent-voice-call` package layout (`call_engine.py`, `tts_bridge.py`, `server.py`, `cli.py`) and run the complete automated test suite (`pytest -v tests`) verifying Kokoro TTS synthesis, WAV-to-Opus conversion fallback, session token validation, CSRF origin guard, static traversal protection, and REST API endpoints.
![[Artifacts/agent-voice-call/agent-voice-call_01_dev_install_and_pytest.jpg]]

### Step 2/12 — [End-User Perspective] ZothOS Binary Verification, CLI Discovery & Live Daemon Status
- **Action**: Verify global CLI symlinks (`which -a agent-voice-call`), inspect subcommand syntax (`status`, `serve`, `call`), and check live daemon and Kokoro Neural Engine status on `:8114`.
![[Artifacts/agent-voice-call/agent-voice-call_02_user_install_and_help.jpg]]

### Step 3/12 — [End-User TUI Perspective] Provisioning Tokenized 1-Click Voice Call Sessions (`signal` · `simplex` · `web`)
- **Action**: Generate cryptographic single-use call session links bound to Pantheon neural voice personas via `agent-voice-call call --channel signal --voice azoth`, `--channel simplex --voice athena`, and `--channel web --voice ghostbyte`.
![[Artifacts/agent-voice-call/agent-voice-call_03_tui_call_links_signal_simplex.jpg]]

### Step 4/12 — [End-User TUI Perspective] Pantheon Neural Voices Registry (`/api/voices`) & Deterministic JSON Telemetry (`--json`)
- **Action**: Query `/api/voices` to inspect all 6 Pantheon neural personas (`azoth`, `ghostbyte`, `athena`, `mercury`, `kitsune`, `chronos`) and run `agent-voice-call --json`.
![[Artifacts/agent-voice-call/agent-voice-call_04_tui_voices_and_json_telemetry.jpg]]

### Step 5/12 — [Developer Perspective] Full-Duplex REST API Lifecycle (`/api/call/create` → `/api/call/speak` → `/api/call/end`)
- **Action**: Programmatically create a voice call session, send a spoken utterance (`"Hello Azoth, report system status and thermal telemetry."`) to synthesize a 338 KB RIFF WAVE PCM audio payload, and terminate the call to generate the structured executive debrief summary.
![[Artifacts/agent-voice-call/agent-voice-call_05_dev_rest_api_speak_and_debrief.jpg]]

### Step 6/12 — [Standalone GUI `:8114`] Active Live Voice Call Cockpit & 60fps Pantheon Golden Orb
- **Action**: Load `http://127.0.0.1:8114/call` directly into the active Live Voice Call Cockpit showing the 60fps Pantheon Orb, active call timer, `SIGNAL BRIDGE` badge, `AZOTH` persona card, and initial welcome turn.
![[Artifacts/agent-voice-call/agent-voice-call_06_gui_standalone_cockpit.jpg]]

### Step 7/12 — [Standalone GUI `:8114`] Full-Duplex Utterance Turn & Live Kokoro WAV Playback (`AZOTH`)
- **Action**: Send `"Report system status and thermal telemetry."` to Azoth, verifying live Kokoro WAV synthesis (`AZOTH ⚡ 3188.2MS · WAV`) and spoken thermal status response (`"Systems are running cool at 42 degrees Celsius..."`).
![[Artifacts/agent-voice-call/agent-voice-call_07_gui_utterance_turn_azoth.jpg]]

### Step 8/12 — [Standalone GUI `:8114`] Live Persona Switching (`ATHENA — Classical Logic & Systems Architect`) & Multi-Turn Dialogue
- **Action**: Cycle the active voice persona to `ATHENA` (`Classical Logic & Systems Architect`) and send a second conversational turn (`"Who are you and what is our current objective?"`).
![[Artifacts/agent-voice-call/agent-voice-call_08_gui_persona_switch_athena.jpg]]

### Step 9/12 — [Standalone GUI `:8114`] Call Termination & Multi-Channel Executive Debrief Modal
- **Action**: Click `End` (`#btnEndCall`) to conclude the session and display the `Voice Call Completed` debrief modal showing the session ID, turn count, full conversation transcript, and Neuro-Memory (`:8094`) / Flight Recorder (`:8104`) / Signal sync confirmation.
![[Artifacts/agent-voice-call/agent-voice-call_09_gui_end_call_debrief_modal.jpg]]

### Step 10/12 — [Zoth Studio v2 God-Mode `:3000`] Archon Sovereign Profile & 60fps Braille Acoustic Spectrogram
- **Action**: Open `http://127.0.0.1:3000/tools/agent-voice-call`, inspecting the 60fps Braille acoustic spectrogram (`VOICE_DUPLEX // ARCHON SOVEREIGN`), Silero VAD sensitivity threshold, and SIP/Voice JSON configuration.
![[Artifacts/agent-voice-call/agent-voice-call_10_studio_godmode_dark.jpg]]

### Step 11/12 — [Zoth Studio v2 God-Mode `:3000`] Switching to Nyx Tactical Ops (`Whisper + Kokoro 82M`)
- **Action**: Select the `Nyx Tactical Ops (Whisper + Kokoro 82M)` voice profile (`#38BDF8` cyan harmonic waveform) and verify dynamic spectrogram frequency modulation and updated JSON config.
![[Artifacts/agent-voice-call/agent-voice-call_11_studio_godmode_light.jpg]]

### Step 12/12 — [Zoth Studio v2 God-Mode `:3000`] Hermes Executive Dispatch + Live Kokoro WAV Synthesis (`444.5 KB`) & Config Copy
- **Action**: Select `Hermes Executive Dispatch (24kHz Neural)`, click `Synthesize Audio Now` to trigger live Kokoro WAV synthesis via `:8114/api/call/speak` (`✓ KOKORO WAV SYNTHESIZED (MERCURY · 3634.2ms · 444.5 KB)`), and copy the SIP/Voice configuration.
![[Artifacts/agent-voice-call/agent-voice-call_12_studio_godmode_synthesize_live.jpg]]

---

## Verification & Quality Matrix

| Verification Check | Target Standard | Result | Status |
| :--- | :--- | :--- | :--- |
| **Developer Pytest Suite** | `pytest -v tests` | `26 passed in 2.71s` | 🟢 **PASS** |
| **CLI & TUI Subcommands** | `status`, `call`, `--status`, `--json` | Returncode 0 (Zero broken flags) | 🟢 **PASS** |
| **Kokoro Neural TTS Bridge** | Live WAV synthesis via `/api/call/speak` | `RIFF WAVE PCM` (`338–444 KB` audio) | 🟢 **PASS** |
| **Standalone Workstation (`:8114`)** | Centered column layout, Orb, Persona switch & Debrief modal | `overflowPx: 0`, `consoleErrors: 0` | 🟢 **PASS** |
| **Zoth Studio God-Mode (`:3000`)** | 60fps Braille spectrogram + Live `:8114` synthesis | `overflowPx: 0`, `consoleErrors: 0` | 🟢 **PASS** |
| **Open-Access Invariant** | Zero paywall modals, blur gates, or Solana Tip locks | 100% Free & Open-Access | 🟢 **PASS** |

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
