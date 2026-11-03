---
type: studio-tool
tool_id: agent-capsule-jail
title: Agent Capsule Jail
category: Security & Enclave
version: 2.5.0
port: 8105
local_url: "http://127.0.0.1:8105"
studio_url: "http://127.0.0.1:3000/tools/agent-capsule-jail"
live_url: "https://capsule.nullai.tech"
github_url: "https://github.com/1nc0gn30/agent-capsule-jail"
cli_bin: /usr/local/bin/agent-capsule-jail
repo_path: /home/zoth/NullAITech/agent-capsule-jail
license: "100% Free & Open Access"
stripe_coffee: "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
solana_tip: GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK
status: VERIFIED_5_LAYERS
overflow_px: 0
console_errors: 0
test_status: "PASS (12-Step Gallery Verified)"
last_audited: "2026-10-31T14:58:30Z"
tags:
  - sovereign-arsenal
  - zoth-studio
  - open-access
  - security-enclave
  - bubblewrap
  - kernel-sandbox
---

# Agent Capsule Jail (`agent-capsule-jail`)

> **Autonomous kernel enclave sandbox, resource quota manager, and secret stripping engine with dual Stripe + Solana support rails.**

---

## 1. Sovereign Invariants & Access Matrix

| Layer | Endpoint / Binary | Status | Verification |
| :--- | :--- | :--- | :--- |
| **Layer A — Standalone Workstation** | `http://127.0.0.1:8105` | `ONLINE` | Bubblewrap (`bwrap`) kernel enclave + RLIMIT quotas + SHA-256 FS delta diffing |
| **Layer B — Zoth Studio God-Mode** | `http://127.0.0.1:3000/tools/agent-capsule-jail` | `ONLINE` | `AgentCapsuleJailGodModeTool.jsx` isolated Web Worker + VFS delta verified |
| **Layer C — ZothOS CLI Binary** | `/usr/local/bin/agent-capsule-jail` & `~/.local/bin/agent-capsule-jail` | `ONLINE` | `exec`, `status`, `serve`, `token`, `--json` verified |
| **Layer D — Documentation Parity** | `README.md` + In-App Docs | `VERIFIED` | 100% Open-Access & Bubblewrap/rlimit architecture documented |
| **Layer E — Visual Verification** | `overflowPx: 0`, `consoleErrors: 0` | `VERIFIED` | 12 real step-by-step screenshots (Developer + User + CLI + GUI + Studio) |

---

## 2. Complete 12-Step Developer & User Walkthrough Gallery

### Part I — Developer Perspective: Repository Architecture & 40-Test Pytest Suite

#### Step 01: Repository Inspection & Automated Pytest Suite (`40/40 Passed`)
From a developer's perspective, we inspect `/home/zoth/NullAITech/agent-capsule-jail` (`src/agent_capsule_jail/capsule.py`, `cli.py`, `server.py`, `telemetry.py`) and run `pytest -v` across all 40 unit and security tests (`test_bind_host.py`, `test_capsule.py`, `test_origin_guard.py`, `test_sandbox_security.py`, `test_static_traversal.py`), verifying Bubblewrap namespace isolation, read-only host mounts, secret stripping, and path-traversal guards.

![[attachments/tools/agent-capsule-jail_01_dev_pytest_suite.jpg]]

---

### Part II — ZothOS Native User Perspective: CLI & Ephemeral Kernel Enclave

#### Step 02: Global CLI Discovery, Help & Kernel Enclave Health (`:8105`)
A ZothOS native user verifies that `/usr/local/bin/agent-capsule-jail` and `~/.local/bin/agent-capsule-jail` are aligned, inspects `agent-capsule-jail --help`, and probes `http://127.0.0.1:8105/health` (`"sandbox": "bwrap"`, `"status": "healthy"`).

![[attachments/tools/agent-capsule-jail_02_user_cli_discovery.jpg]]

#### Step 03: CLI Ephemeral Sandbox Execution & Filesystem Delta Diffing
Running `agent-capsule-jail exec --timeout 10 --memory 256 -- python3 -c "..."` executes the subprocess inside an isolated Bubblewrap (`bwrap`) scratch directory, reports `+2 created` files (`output/meta.json`, `output/capsule_report.txt`), and destroys the ephemeral scratch directory upon completion without touching the host directory.

![[attachments/tools/agent-capsule-jail_03_cli_exec_fs_delta.jpg]]

#### Step 04: CLI Host Credential Sanitization & CPU Watchdog SIGKILL
Passing sensitive host environment variables (`OPENAI_API_KEY`, `STRIPE_KEY`, `AWS_SECRET_ACCESS_KEY`) into `agent-capsule-jail exec` proves 100% credential stripping (`None` inside the capsule), while `--timeout 1.5` terminates a runaway loop with `Exit Code: -9` (`Timed Out: True`) at `1511.32 ms`.

![[attachments/tools/agent-capsule-jail_04_cli_secret_strip_and_timeout.jpg]]

#### Step 05: CLI Deterministic JSON Audit Telemetry (`--json`) & Live Server Status
Running `agent-capsule-jail exec --json` outputs the full machine-readable Bubblewrap command line, resource usage (`max_rss_kb`, `duration_ms`), and `fs_diff` manifest, followed by `agent-capsule-jail status` querying the live `:8105` daemon telemetry.

![[attachments/tools/agent-capsule-jail_05_cli_json_and_status.jpg]]

---

### Part III — End-User Perspective: Standalone Web Cockpit (`:8105`)

#### Step 06: Standalone Web Cockpit Initial Load (`http://127.0.0.1:8105`)
Opening `http://127.0.0.1:8105` loads the Agent Capsule Jail cockpit with the 100% Free & Open Access banner, live Enclave Telemetry counters, Sandbox Execution Chamber, and Security Probe presets.

![[attachments/tools/agent-capsule-jail_06_gui_cockpit_initial.jpg]]

#### Step 07: Executing the File Writer Diff Probe in the Standalone Cockpit
Clicking **File Writer Diff** and **⚡ Run in Capsule Jail** dispatches the command to `/api/exec`, executing inside Bubblewrap (`66.29 ms`, `20 MB Peak RSS`, `Exit Code 0`) and populating the **Filesystem Delta Tree** with `CREATED output/meta.json (47 B)` and `CREATED output/capsule_report.txt (21 B)` along with their SHA-256 digests.

![[attachments/tools/agent-capsule-jail_07_gui_file_writer_delta.jpg]]

#### Step 08: Executing the Host Secret Strip Probe (`ZERO SECRETS DETECTED`)
Selecting **Env Secret Strip** and running the capsule verifies in real time that `OPENAI_API_KEY`, `STRIPE_KEY`, `AWS_SECRET`, and `GITHUB_TOKEN` all evaluate to `None` inside the kernel enclave (`STATUS: ZERO SECRETS DETECTED`).

![[attachments/tools/agent-capsule-jail_08_gui_env_secret_probe.jpg]]

#### Step 09: Enforcing the CPU Timeout Quota (`2s` Watchdog SIGKILL)
Selecting **Timeout Quota** (`2s` limit) and running an infinite Python `while True: pass` loop triggers the kernel enclave watchdog at `2010.51 ms` (`Exit Code -9`, status badge `TIMEOUT`, Neutralized Timeouts counter incremented to `1`).

![[attachments/tools/agent-capsule-jail_09_gui_cpu_timeout_kill.jpg]]

#### Step 10: Deep Kernel Forensics & Cryptographic Audit Seal
Scrolling down to **✦ Deep Kernel Forensics & Audit Seal** displays the structured JSON audit receipt (`capsule_id`, `kernel_enclave` CPU/RSS telemetry, `bwrap` command line, `sha256_audit_seal`, and `isolation_grade: SOVEREIGN_L3_EPHEMERAL`) with one-click JSON Log and Manifest export buttons.

![[attachments/tools/agent-capsule-jail_10_gui_forensic_audit_seal.jpg]]

---

### Part IV — Zoth Studio v2 God-Mode Integration (`:3000`)

#### Step 11: Zoth Studio v2 God-Mode — Egress Violation Intercept (`fetch` Blocked)
Navigating to `http://127.0.0.1:3000/tools/agent-capsule-jail`, selecting **Egress Violation Intercept (fetch attempt)**, and clicking **EXECUTE INSIDE CAPSULE JAIL** spawns an isolated Web Worker that blocks outbound network calls (`CAPSULE_SECURITY_VIOLATION: Egress primitive 'fetch' is strictly blocked by sandbox boundary`).

![[attachments/tools/agent-capsule-jail_11_studio_godmode_worker.jpg]]

#### Step 12: Zoth Studio v2 God-Mode — Virtual Filesystem Scratch Delta Inspector
Running the **Virtual Filesystem Scratch Delta** preset and switching to the **VIRTUAL FS DELTA (2)** tab displays the newly created in-memory scratch files (`enclave_receipt.json` and `manifest.lock`) with zero horizontal overflow (`overflowPx: 0`) and zero console errors (`consoleErrors: 0`).

![[attachments/tools/agent-capsule-jail_12_studio_godmode_virtual_fs.jpg]]
