---
title: "DeepSearch Research Agent & Studio"
tags: [studio, tool, verified, open-access, walkthrough]
aliases: ["deepsearch-research-agent", "DeepSearch Research Agent & Studio"]
pillar: "Pillar II: Epistemic Hermetics & Planning"
category: "AI & Knowledge"
runs: "browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-10-31"
test_status: "PASS (12-Step Gallery Verified)"
local_port: 8122
cli_binary: "deepsearch-research-agent"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/deepsearch-research-agent"
live_url: "http://127.0.0.1:8122"
studio_url: "http://127.0.0.1:3000/tools/deepsearch-research-agent"
workstation_shot: "Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_07_gui_standalone_studio.jpg"
studio_shot: "Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_10_gui_studio_godmode_dag.jpg"
braille_shape: "dag"
braille_archetype: "Vaelor PoUW Directed Acyclic Graph"
---

# DeepSearch Research Agent & Studio (`deepsearch-research-agent`)

> [!CHECK] 12-Step Developer & User Walkthrough Verified (Zero Errors · 100% Open-Access)
> **Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform**
> Every terminal command, unit test (`139 passed in 1.06s`), autonomous Tree-of-Thought query planner, evidence provenance DAG cycle checker, citation corroborator, Standalone Workstation tab (`:8122`), and Zoth Studio v2 God-Mode view (`:3000/tools/deepsearch-research-agent`) has been executed and visually verified.

---

## Tool Overview & Telemetry

| Parameter | Specification |
| :--- | :--- |
| **Tool Identifier** | `deepsearch-research-agent` |
| **Category** | `AI & Knowledge` |
| **Mathematical Pillar** | `Pillar II: Epistemic Hermetics & Planning` |
| **Runtime Engine** | Pure Python 3.13 Research Engine (`server.py` / `cli.py`) + Browser DAG Studio |
| **Local Port & URL** | `:8122` • [http://127.0.0.1:8122](http://127.0.0.1:8122) |
| **Studio God-Mode Route** | [http://127.0.0.1:3000/tools/deepsearch-research-agent](http://127.0.0.1:3000/tools/deepsearch-research-agent) |
| **CLI Binary** | `/usr/local/bin/deepsearch-research-agent` • `~/.local/bin/deepsearch-research-agent` |
| **Automated Test Suite** | `pytest -v tests` — **139 passed in 1.06s** |
| **License & Pricing** | **100% Free & Open-Access** ($0) • Zero Paywalls |
| **Support Rails** | [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) • Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK` |

---

## Part I — Developer Perspective (Architecture, Automated Tests & API Contracts)

### Step 1 — Inspecting Repository Architecture & Python Modules
Developers working on `deepsearch-research-agent` inspect `/home/zoth/NullAITech/deepsearch-research-agent/src/deepsearch_research_agent/`, containing `cli.py`, `contradiction_detector.py`, `corroborator.py`, `crawler.py`, `evidence_graph.py`, `mcp_server.py`, `models.py`, `planner.py`, `search_providers.py`, `synthesizer.py`, and `ui_server.py`:
```bash
cd ~/NullAITech/deepsearch-research-agent
ls -la src/deepsearch_research_agent/
sed -n "1,40p" pyproject.toml
```
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_01_dev_repo_architecture.jpg]]

---

### Step 2 — Running the Pytest Automated Test Suite (139 Passed)
Before deploying or modifying any Tree-of-Thought planner or citation corroboration logic, developers run the full `pytest` verification suite covering unit tests, evidence provenance graphs, contradiction detection, query planning, synthesis, MCP JSON-RPC, and HTTP UI server endpoints:
```bash
cd ~/NullAITech/deepsearch-research-agent
PYTHONPATH=src pytest -v tests
```
- **Result**: `139 passed in 1.06s` with zero warnings or errors.
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_02_dev_pytest_suite.jpg]]

---

### Step 3 — Verifying REST API Health (`/health`, `/api/stats`) & Internal Test Runner (`test`)
Developers verify the live HTTP daemon on port `:8122` and run the internal self-test subcommand:
```bash
curl -s http://127.0.0.1:8122/health | python3 -m json.tool
curl -s http://127.0.0.1:8122/api/stats | python3 -m json.tool
deepsearch-research-agent --no-color test
```
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_03_dev_api_health_and_selftest.jpg]]

---

## Part II — End-User CLI & TUI Perspective (Planner, Provenance DAG & Grounded Research)

### Step 4 — ZothOS Global CLI Discovery (`--help`) & Platform Diagnostics (`doctor`)
End-users invoke `deepsearch-research-agent` from any terminal via `/usr/local/bin/deepsearch-research-agent` and run `doctor` to inspect system environment, MCP protocol compatibility (`2024-11-05`), and zero-dependency stdlib readiness:
```bash
deepsearch-research-agent --help
deepsearch-research-agent --no-color doctor | head -n 18
```
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_04_cli_help_and_doctor.jpg]]

---

### Step 5 — Generating an Autonomous Tree-of-Thought Research Plan (`plan`)
Users decompose a complex scientific or engineering query into multi-perspective investigative sub-queries (`technical`, `architectural`, `empirical`, `skeptical`, `comparative`) using `plan`:
```bash
deepsearch-research-agent --no-color plan "Post-Quantum Lattice Cryptography ML-KEM-768" --depth deep
```
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_05_cli_query_planner.jpg]]

---

### Step 6 — Auditing Evidence Provenance DAG (`provenance`) & Running Grounded Research (`research`)
Users run `provenance` to verify the citation graph for circular references and domain diversity, and execute `research` to synthesize a grounded report with inline citations:
```bash
deepsearch-research-agent --no-color provenance
deepsearch-research-agent --no-color research "Byzantine Fault Tolerance in Autonomous Agent Swarms" --depth quick --max-sources 3
```
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_06_cli_provenance_and_research.jpg]]

---

## Part III — End-User GUI Perspective (Standalone Workstation & Zoth Studio v2 God-Mode)

### Step 7 — Standalone Web Workstation (`http://127.0.0.1:8122`) — Deep Research Studio & Autonomous Planner Stages
Opening `http://127.0.0.1:8122` launches the **Deep Research Studio** workstation. Users enter any research topic, choose depth (`Quick`, `Deep`, `Exhaustive`), inspect the 5-stage Autonomous Planner stepper on the left, and read the grounded synthesis dossier with copy/export controls (`100% UNLOCKED`):
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_07_gui_standalone_studio.jpg]]

---

### Step 8 — Standalone Web Workstation — Autonomous Query Planner Tree-of-Thought Decomposition
Switching to the **📑 Autonomous Query Planner** tab visualizes the hierarchical Tree-of-Thought query decomposition with site restrictions (`site:nature.com`, `site:science.org`) and targeted sub-queries:
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_08_gui_standalone_planner_tree.jpg]]

---

### Step 9 — Standalone Web Workstation — Source & Consensus Matrix
Switching to the **⚖️ Source & Consensus Matrix** tab displays the harvested source inventory, domain authority scores (`98/100`, `97/100`), peer-reviewed credibility tiers, and corroborated empirical claims:
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_09_gui_standalone_consensus_matrix.jpg]]

---

### Step 10 — Zoth Studio v2 God-Mode (`http://127.0.0.1:3000/tools/deepsearch-research-agent`) — 5-Stage Verification DAG & Corpus Track
Navigating to `http://127.0.0.1:3000/tools/deepsearch-research-agent` opens the integrated Zoth Studio v2 enclave featuring the live WebGL particle orbit canvas, Research Corpus Track selector (`Biomorphic STDP & HNSW Memory`, `Vaelor L1 PoUW & BFT Consensus`, `Zero-Trust MicroVM Sandboxing`), Tree-of-Thought sub-query decomposition, and 5-Stage Verification DAG topology:
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_10_gui_studio_godmode_dag.jpg]]

---

### Step 11 — Zoth Studio v2 God-Mode — Corroborated Claims Table & Grounded Executive Markdown Dossier
Scrolling down inside the Zoth Studio v2 enclave exposes the Corroborated Empirical Claims table (`CLM-01`, `CLM-02`, `CLM-03` with `96%`, `94%`, `98%` confidence) alongside the Grounded Executive Markdown Dossier and one-click `Copy Markdown Dossier` button:
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_11_gui_studio_godmode_dossier.jpg]]

---

### Step 12 — Responsive Mobile Viewport (`390×844`) Verification
Verifying the Standalone Workstation at mobile viewport dimensions (`390×844`, `deviceScaleFactor: 2`) confirms stacked search controls, touch-friendly depth/preset chips, and zero horizontal overflow (`overflowPx: 0`):
![[Studio/Tools/Artifacts/deepsearch-research-agent/deepsearch-research-agent_12_gui_mobile_responsive.jpg]]

---

## Summary Verification Matrix

| Step | Perspective | Surface | Exact Command or Route | Artifact | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Developer | Repo Architecture | `ls -la src/deepsearch_research_agent/ && sed -n "1,40p" pyproject.toml` | `deepsearch-research-agent_01_dev_repo_architecture.jpg` | 🟢 **PASS** |
| **Step 2** | Developer | Pytest Test Suite | `PYTHONPATH=src pytest -v tests` (`139 passed`) | `deepsearch-research-agent_02_dev_pytest_suite.jpg` | 🟢 **PASS** |
| **Step 3** | Developer | API Health & Test | `curl -s http://127.0.0.1:8122/health` + `deepsearch-research-agent test` | `deepsearch-research-agent_03_dev_api_health_and_selftest.jpg` | 🟢 **PASS** |
| **Step 4** | End-User CLI | Help & Diagnostics | `deepsearch-research-agent --help && deepsearch-research-agent doctor` | `deepsearch-research-agent_04_cli_help_and_doctor.jpg` | 🟢 **PASS** |
| **Step 5** | End-User CLI | Query Planner | `deepsearch-research-agent plan "Post-Quantum Lattice..." --depth deep` | `deepsearch-research-agent_05_cli_query_planner.jpg` | 🟢 **PASS** |
| **Step 6** | End-User CLI | Provenance & Research | `deepsearch-research-agent provenance && deepsearch-research-agent research ...` | `deepsearch-research-agent_06_cli_provenance_and_research.jpg` | 🟢 **PASS** |
| **Step 7** | End-User GUI | Standalone Studio | `http://127.0.0.1:8122/` (Deep Research Studio) | `deepsearch-research-agent_07_gui_standalone_studio.jpg` | 🟢 **PASS** |
| **Step 8** | End-User GUI | Query Planner Tree | `http://127.0.0.1:8122/` (Autonomous Query Planner Tab) | `deepsearch-research-agent_08_gui_standalone_planner_tree.jpg` | 🟢 **PASS** |
| **Step 9** | End-User GUI | Consensus Matrix | `http://127.0.0.1:8122/` (Source & Consensus Matrix Tab) | `deepsearch-research-agent_09_gui_standalone_consensus_matrix.jpg` | 🟢 **PASS** |
| **Step 10** | End-User GUI | Studio v2 God-Mode | `http://127.0.0.1:3000/tools/deepsearch-research-agent` (5-Stage DAG) | `deepsearch-research-agent_10_gui_studio_godmode_dag.jpg` | 🟢 **PASS** |
| **Step 11** | End-User GUI | Studio v2 Dossier | `http://127.0.0.1:3000/tools/deepsearch-research-agent` (Claims & Markdown) | `deepsearch-research-agent_11_gui_studio_godmode_dossier.jpg` | 🟢 **PASS** |
| **Step 12** | End-User GUI | Mobile Viewport | `http://127.0.0.1:8122/` (`390×844` Responsive Check) | `deepsearch-research-agent_12_gui_mobile_responsive.jpg` | 🟢 **PASS** |

---

## Navigation & Cross-References

- [[Zoth Studio]]
- [[MOC Studio Tools]]
- [[Zoth 72 Sovereign Tools Tracker.base]]
- [[Studio/Verification/Arsenal Verification & Test Tracker|Arsenal Verification Tracker]]
