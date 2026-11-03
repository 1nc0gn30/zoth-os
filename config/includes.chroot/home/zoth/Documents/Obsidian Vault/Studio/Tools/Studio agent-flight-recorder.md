---
id: "agent-flight-recorder"
name: "Agent Flight Recorder"
category: "Forensics & Telemetry"
port: 8104
local_url: "http://127.0.0.1:8104"
studio_url: "http://127.0.0.1:3000/tools/agent-flight-recorder"
github: "https://github.com/1nc0gn30/agent-flight-recorder"
test_status: "PASS (12-Step Gallery Verified)"
overflow_px: 0
console_errors: 0
free_open_access: true
last_audited: "2026-10-31"
tags:
  - sovereign-arsenal
  - zoth-studio
  - verified
  - step-by-step-gallery
---

# ✦ Agent Flight Recorder (`agent-flight-recorder`)

> [!SUCCESS] 100% Free & Open-Access Sovereign Verification — Zero Paywalls
> Audited and verified end-to-end across **Developer Perspective** (`pytest -v` 23/23 passing, zero-dependency Python 3.10+ SQLite WAL time-series recorder) and **End-User Perspective** (ZothOS native CLI `agent-flight-recorder`, Standalone Black Box Forensics Deck `:8104`, self-contained offline HTML incident bundle replay, and Zoth Studio v2 `:3000/tools/agent-flight-recorder`).
> - **Stripe Buy Us a Coffee**: [https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
> - **Solana Tip Address**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## 1. Comprehensive 12-Step Developer & User Verification Gallery

### Part A — Developer & ZothOS CLI Verification (Steps 01–05)

#### Step 01: Developer Perspective — Package Architecture & Pytest Suite (`23/23 PASS`)
Inspecting `/home/zoth/NullAITech/agent-flight-recorder/src/agent_flight_recorder` (`storage.py`, `recorder.py`, `ingestion.py`, `exporter.py`, `server.py`, `cli.py`) and executing `pytest -v` (`23 passed in 1.61s`), covering SQLite time-series lifecycles, subprocess capture, single-file HTML bundle generation, CSRF Origin guards, and static traversal hardening.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_01_dev_pytest_suite.jpg]]

#### Step 02: ZothOS Native User — Global CLI Discovery, JSON Manifest & Daemon Health (`:8104`)
Verifying global binary parity across `/usr/local/bin/agent-flight-recorder` and `~/.local/bin/agent-flight-recorder`, inspecting `agent-flight-recorder --help` and `agent-flight-recorder --json`, and probing `GET http://127.0.0.1:8104/health`.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_02_user_cli_discovery.jpg]]

#### Step 03: CLI Black Box Session Recording (`agent-flight-recorder record`)
Wrapping a live subprocess (`agent-flight-recorder record --title "Sovereign Security Audit Run" --session flt-audit-2026 -- python3 -c ...`), capturing stdout/stderr lines with millisecond offsets into SQLite WAL storage, and inspecting the persisted session via `GET /api/session/flt-audit-2026`.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_03_cli_record_session.jpg]]

#### Step 04: Multi-Vector Telemetry Ingestion (`POST /api/ingest`) & Storage Summary (`status`)
Ingesting synchronized `prompt_scan` (`score=0.92, blocked=true`), `network_egress` (`api.anthropic.com`), `mock_replay` (`1420 tokens saved`), and `synaptic_engram` events into session `flt-audit-2026`, then running `agent-flight-recorder status` to verify the updated SQLite database footprint.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_04_cli_ingest_and_status.jpg]]

#### Step 05: CLI Offline Incident Bundle Export (`export`) & Kokoro TTS Briefing Synthesis (`/api/briefing`)
Running `agent-flight-recorder export --session flt-audit-2026 --output /tmp/incident-flt-audit-2026.html`, querying `GET /api/briefing/flt-audit-2026` for the synthesized Kokoro TTS mission report, and testing point-in-time state reconstruction via `GET /api/scrub/flt-audit-2026?offset_ms=500`.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_05_cli_export_and_briefing.jpg]]

---

### Part B — Standalone Black Box Forensics Deck (`:8104`) & Offline Bundle Replay (Steps 06–10)

#### Step 06: Standalone Workstation (`:8104`) — Chrono-Prism Oscilloscope Hero & Session Selector
Loading `http://127.0.0.1:8104/` with the 100Hz Chrono-Prism Oscilloscope canvas (`#flightWaveformCanvas`), 100% Free & Open Access support bar, and live session selector populated from SQLite (`flt-audit-2026 • Sovereign Security Audit Run`).
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_06_gui_cockpit_initial.jpg]]

#### Step 07: Standalone GUI — Time-Scrubbing Forensics Deck (`T+00:00.550`)
Scrubbing the timeline slider to `00:00.550 / 00:01.000` and observing synchronized stdout/stderr replay (`[WARN] Intercepted suspicious prompt header (score=0.92)`), active network egress topology (`api.anthropic.com`), neural memory engrams (`Lucy :8094`), Peak Threat Vector (`0.92`), and Mock Replay Token Savings (`1420 tokens`).
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_07_gui_time_scrubber_mid.jpg]]

#### Step 08: Standalone GUI — Full 4-Pane Telemetry Matrix & Mission End (`T+00:01.000`)
Scrubbing to `100%` mission completion (`00:01.000 / 00:01.000`) with the complete terminal stream, egress topology, synaptic engrams, and automated natural-language Voice Incident Briefing card.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_08_gui_quad_telemetry_matrix.jpg]]

#### Step 09: Standalone GUI — Voice Incident Briefing (`Kokoro TTS :9394`) & 100% Unlocked Forensic Bundles
Triggering the audio briefing (`Speaking... 🔊 (Kokoro TTS :9394)`) and verifying that the **Deep-Dive Forensic Root Cause & Single-File Bundles** section (`Zero-Server Bundles`, `Sub-Millisecond Diffs`, `Post-Mortem Root Cause`) and `Export Standalone Incident Bundle` button are 100% unlocked with zero paywall blurs.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_09_gui_briefing_and_forensics.jpg]]

#### Step 10: Self-Contained Offline HTML Bundle Replay (`file:///tmp/incident-flt-audit-2026.html`)
Opening the exported single-file HTML bundle directly from disk (`file:///tmp/incident-flt-audit-2026.html`) with no web server required, scrubbing to `00:00.511 / 00:00.511`, and verifying embedded JSON event playback (`OFFLINE VERIFIED`).
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_10_gui_exported_offline_bundle.jpg]]

---

### Part C — Zoth Studio v2 God-Mode Enclave (`:3000/tools/agent-flight-recorder`) (Steps 11–12)

#### Step 11: Zoth Studio v2 God-Mode — Tamper-Evident Merkle DAG Trajectory & Replay Debugger
Opening `http://127.0.0.1:3000/tools/agent-flight-recorder` to inspect the 60fps U+2800 Braille Orbit banner, Cryptographic Merkle Chain Topology canvas (`#1 -> #2 -> #3 -> #4`, `CHAIN HEAD: 0x9601903846739002`), and sealed block #1 inspector.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_11_studio_godmode_merkle.jpg]]

#### Step 12: Zoth Studio v2 God-Mode — Sealing New Trajectory Frame (`STEP #5`) & Verifying Chain Head
Appending a new signed trajectory frame (`grok-cli -> TOOL_CALL_VERIFY`) via **Seal Frame**, updating the Merkle DAG chain (`#5`, `hash: 0xa1a91eb0efa47b04`, `prevHash: 0x9601903846739002`), and verifying `overflowPx === 0` and `consoleErrors === 0`.
![[Studio/Assets/Screenshots/Gallery/agent-flight-recorder/agent-flight-recorder_12_studio_godmode_seal_frame.jpg]]
