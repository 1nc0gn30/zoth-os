---
tool_id: "agent-policy-auditor"
name: "Agent Policy Auditor"
category: "Security & Enclave"
local_port: 8106
studio_route: "http://127.0.0.1:3000/tools/agent-policy-auditor"
web_url: "https://agent-policy-auditor.nullai.tech"
repo: "https://github.com/1nc0gn30/agent-policy-auditor"
cli_binary: "/usr/local/bin/agent-policy-auditor"
test_status: "PASS (12-Step Gallery Verified)"
access_tier: "100% Free & Open Access (Zero Paywalls)"
stripe_coffee: "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X"
solana_tip: "GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK"
last_verified: "2026-10-31"
---

# Agent Policy Auditor (`agent-policy-auditor`)

> **100% Free & Open Access Sovereign Tool** — Zero paywalls, zero blur locks, zero license keys.
> - **Standalone Workstation**: `http://127.0.0.1:8106`
> - **Zoth Studio v2 God-Mode**: `http://127.0.0.1:3000/tools/agent-policy-auditor`
> - **ZothOS Global CLI**: `agent-policy-auditor` (`/usr/local/bin/agent-policy-auditor` & `~/.local/bin/agent-policy-auditor`)
> - **Support Rails**: [Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · Solana: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Architecture & Engineering Fixes Applied

1. **Persistent Enclave HMAC Secret Key (`src/agent_policy_auditor/broker.py`)**:
   - Replaced the ephemeral per-process `secrets.token_hex(32)` default with `_get_secret_key()`, which persists a 32-byte key in `~/.local/share/zoth/policy_secret.key` (`0600`) when `AGENT_POLICY_SECRET` is not set. This guarantees that capability leases granted in one CLI invocation (`agent-policy-auditor lease grant`) verify deterministically in subsequent CLI calls (`agent-policy-auditor lease verify`) and in the HTTP cockpit (`:8106`).
2. **Uppercase Capability Normalization Before Signing (`src/agent_policy_auditor/broker.py`)**:
   - Normalized `cap_upper = capability.upper()` prior to calling `_generate_signature(...)` in `grant_lease()` so case-insensitive CLI capability arguments never trigger signature mismatches.
3. **Cross-Process SQLite Lease & Violation Synchronization (`src/agent_policy_auditor/broker.py`)**:
   - Added SQLite `broker_metrics` persistence for `violations_blocked`, persisted `used_budget_usd` updates inside `verify_action()`, and synchronized `self._load_from_db()` across `verify_action()`, `revoke_lease()`, `get_active_leases()`, and `get_stats()`.

---

## Complete 12-Step Developer & User Verification Gallery

### Part I — Developer Perspective: Package Architecture & Automated Pytest Suite

#### Step 01 — Package Architecture & Pytest Suite (`27/27 Passed`)
Inspecting `src/agent_policy_auditor` (`auditor.py`, `broker.py`, `cli.py`, `web_cockpit.py`) and `tests/`, and executing `pytest -v` (`27 passed in 0.72s` covering REST cockpit API endpoints, static OWASP LLM manifest auditing, HMAC-SHA256 lease granting/verification/revocation, budget quota enforcement, emergency kill-switch, origin guards, and path traversal protection).

![Step 01 — Developer Pytest Suite](Artifacts/agent-policy-auditor/agent-policy-auditor_01_dev_pytest_suite.jpg)

---

### Part II — ZothOS Native User Perspective: CLI Capability Leasing & Static Manifest Auditing

#### Step 02 — Global Binary Discovery, CLI Help & Health Check
Verifying `which -a agent-policy-auditor | uniq`, inspecting `agent-policy-auditor --help`, and querying `agent-policy-auditor --json` alongside `http://127.0.0.1:8106/health`.

![Step 02 — User CLI Discovery & Health Check](Artifacts/agent-policy-auditor/agent-policy-auditor_02_user_cli_discovery.jpg)

#### Step 03 — CLI HMAC-SHA256 Capability Leasing & Action Verification (`lease grant` & `lease verify`)
Issuing two signed capability leases (`FS_READ` for `azoth-recon-01` and `NET_EGRESS` for `hermes-sync-02`), verifying an authorized `FS_READ` action (`Result: ✓ AUTHORIZED`), and testing an unauthorized `SHELL_EXEC` escalation on `/etc/shadow` (`Result: ✗ DENIED — CapabilityMismatch`).

![Step 03 — CLI Capability Leasing & Action Verification](Artifacts/agent-policy-auditor/agent-policy-auditor_03_cli_lease_grant_and_verify.jpg)

#### Step 04 — CLI Static Manifest & MCP Schema Security Auditor (`agent-policy-auditor audit`)
Auditing `/tmp/sample_risky_manifest.json` via `agent-policy-auditor audit --file /tmp/sample_risky_manifest.json`, producing `Security Score: 45/100 [CRITICAL]` with `EXEC-002-UNSANDBOXED-SHELL` and `DEST-004-IRREVERSIBLE-ACTION` remediations and NIST AI RMF / OWASP LLM compliance ratings.

![Step 04 — CLI Static Manifest Security Audit](Artifacts/agent-policy-auditor/agent-policy-auditor_04_cli_manifest_audit.jpg)

#### Step 05 — CLI Broker Telemetry Status & Live REST API Lease Registry (`agent-policy-auditor status`)
Running `agent-policy-auditor status` (`Total Leases Granted: 2`, `Active Leases: 2`, `Violations Blocked: 1`, `Budget Allocated: $7.50`) and querying `GET http://127.0.0.1:8106/api/leases`.

![Step 05 — CLI Broker Status & REST API](Artifacts/agent-policy-auditor/agent-policy-auditor_05_cli_status_and_rest_api.jpg)

---

### Part III — Standalone Web Workstation Perspective (`http://127.0.0.1:8106`)

#### Step 06 — Standalone Cockpit KPI Summary Cards & Cryptographic Lease Issuance
Opening `http://127.0.0.1:8106` showing live SQLite-backed KPI cards (`4 Active Capability Leases`, `5 Total Leases Granted`, `1 Policy Violation Blocked`, `$10.50 Budget Protected`) and issuing a new `FS_WRITE` lease (`✓ Cryptographic Lease Issued: lease_f86cf8 for pantheon_01`).

![Step 06 — Standalone GUI Cockpit & Lease Issue](Artifacts/agent-policy-auditor/agent-policy-auditor_06_gui_cockpit_and_lease_issue.jpg)

#### Step 07 — Standalone GUI: Risky MCP Schema Static Security Audit
Selecting **⚠️ Risky MCP Schema** and clicking **Audit Security Invariants**, flagging `SECURITY SCORE: 0 / 100 [CRITICAL RISK]` across `OWASP-LLM-02` (unsandboxed shell & sudo privilege escalation), `OWASP-LLM-06` (unchecked network egress), and `OWASP-LLM-08` (destructive file modification).

![Step 07 — Standalone GUI Risky Manifest Audit](Artifacts/agent-policy-auditor/agent-policy-auditor_07_gui_risky_manifest_audit.jpg)

#### Step 08 — Standalone GUI: Active Time-Bound Leases Table & Cryptographic Audit Certificate Export
Inspecting the **Active Time-Bound Leases** table with live TTL countdowns (`pantheon_01`, `azoth-recon-01`, `hermes-sync-02`) and exporting both the **Signed Policy Certificate (`.json`)** and **SIEM / CEF Audit Log (`.log`)** from the unlocked **Cryptographic Audit Certificate & Policy Enclave** panel.

![Step 08 — Standalone GUI Active Leases & Certificate Export](Artifacts/agent-policy-auditor/agent-policy-auditor_08_gui_active_leases_and_cert.jpg)

#### Step 09 — Standalone GUI: Emergency Kill-Switch Execution
Clicking **⚡ Kill-Switch All** in the header, immediately revoking all active capability leases (`Active Capability Leases: 0`, `Policy Violations Blocked: 2`) with toast confirmation (`⚡ Kill-switch triggered: All active capability leases revoked with zero residual egress.`).

![Step 09 — Standalone GUI Emergency Kill-Switch](Artifacts/agent-policy-auditor/agent-policy-auditor_09_gui_emergency_killswitch.jpg)

---

### Part IV — Zoth Studio v2 God-Mode Workstation (`http://127.0.0.1:3000/tools/agent-policy-auditor`)

#### Step 10 — Studio God-Mode: Static MCP / Agent Tool Manifest Security Auditor
Opening `/tools/agent-policy-auditor` inside Zoth Studio v2 (`:3000`) and running **EXECUTE REAL STATIC SECURITY AUDIT** on `pantheon_enterprise_worker`, identifying 4 vulnerabilities (`EXEC-001`, `FS-001`, `NET-001`, `CRED-001`) with `SECURITY COMPLIANCE SCORE: 0/100 [CRITICAL]`.

![Step 10 — Studio God-Mode Manifest Security Auditor](Artifacts/agent-policy-auditor/agent-policy-auditor_10_studio_godmode_manifest_auditor.jpg)

#### Step 11 — Studio God-Mode: Web Crypto HMAC-SHA256 Capability Leaser
Switching to the **HMAC CAPABILITY LEASER** tab and clicking **SIGN & GRANT HMAC LEASE** to mint real Web Crypto HMAC-SHA256 capability leases (`lease_jxuyya5p`, `lease_d7k9qi79`) with live TTL countdowns.

![Step 11 — Studio God-Mode HMAC Capability Leaser](Artifacts/agent-policy-auditor/agent-policy-auditor_11_studio_godmode_hmac_leaser.jpg)

#### Step 12 — Studio God-Mode: Cryptographic Lease Token Verifier
Switching to the **LEASE TOKEN VERIFIER** tab, pasting the `[Base64Payload].[HMACSignature]` token, and clicking **VERIFY CRYPTOGRAPHIC SIGNATURE & TTL** (`SIGNATURE VALID & ACTIVE`, `Subject: pantheon_archon_01`, `Signature Match: YES (HMAC-SHA256)`, `Remaining TTL: 299s`, `overflowPx: 0`).

![Step 12 — Studio God-Mode Lease Token Verifier](Artifacts/agent-policy-auditor/agent-policy-auditor_12_studio_godmode_token_verifier.jpg)
