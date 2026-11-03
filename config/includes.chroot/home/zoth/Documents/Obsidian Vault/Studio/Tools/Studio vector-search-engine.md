---
title: Vector Search Engine & Studio
category: studio-tool
tags: [tool, studio, vector-search-engine, verified, 12-step-walkthrough]
port: 8121
domain: vector-search.nullai.tech
repo: /home/zoth/NullAITech/vector-search-engine
updated: 2026-10-31
---

# Vector Search Engine & Studio (`vector-search-engine`)

> **Pure Python & In-Browser HNSW Skip-Graph Vector Database, IVF Clustering, Okapi BM25 Lexical Engine & RRF Hybrid Search Studio** — Zero-dependency in-memory and persistent vector database featuring Hierarchical Navigable Small World (HNSW) multi-layer routing, Inverted File (IVF) K-Means++ clustering, Scalar/Product Quantization (SQ8/PQ), Maximal Marginal Relevance (MMR) diversity ranking, and Reciprocal Rank Fusion (RRF) hybrid search.

---

## Architecture & Verification Summary

- **Repository**: `/home/zoth/NullAITech/vector-search-engine`
- **Standalone Workstation**: `http://127.0.0.1:8121` (`vector-search.nullai.tech`)
- **Zoth Studio v2 God-Mode Route**: `http://127.0.0.1:3000/tools/vector-search-engine`
- **Global CLI Binaries**: `/usr/local/bin/vector-search-engine` & `/home/zoth/.local/bin/vector-search-engine`
- **Automated Test Suite**: `110 passed in 3.14s` (`pytest -v`) + `8 passed` built-in self-verification runner (`vector-search-engine test`)
- **Open-Access Guarantee**: 100% unlocked similarity search rankings, Reciprocal Rank Fusion (RRF) hybrid blending lab, HNSW skip-graph inspector, and benchmark JSON exports — zero paywall blur filters, zero license modals, zero Solana Tip scripts; includes optional Stripe Coffee (`https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X`) and Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## Step-by-Step Developer & End-User Walkthrough (12 Verified Screenshots)

### Step 1: Developer Repository Architecture & Entrypoints
Inspecting `/home/zoth/NullAITech/vector-search-engine` directory tree, `pyproject.toml`, `server.py`, and `src/vector_search_engine/` (`cli.py`, `clustering.py`, `collection.py`, `hybrid_engine.py`, `indexes/`, `mcp_server.py`, `metrics.py`, `models.py`, `quantization.py`, `ui_server.py`).

![Step 1: Developer Repository Structure](Artifacts/vector-search-engine/vector-search-engine_01_dev_repo_structure.jpg)

---

### Step 2: Developer Automated Test Suite (`pytest -v`)
Running the full 110-test `pytest` suite verifying K-Means++ and Hierarchical clustering, Silhouette cohesion, Maximal Marginal Relevance (MMR), Okapi BM25 + RRF hybrid fusion, HNSW vs Flat recall, Product Quantization (PQ), JSONL/Binary VDB persistence, static path-traversal guards, and MCP JSON-RPC 2.0 endpoints.

![Step 2: Developer Pytest Verification](Artifacts/vector-search-engine/vector-search-engine_02_dev_pytest.jpg)

---

### Step 3: Developer REST API & MCP Protocol Contract
Querying `GET http://127.0.0.1:8121/health`, `GET http://127.0.0.1:8121/api/stats`, and piping a JSON-RPC 2.0 `tools/list` request into `vector-search-engine mcp` to verify all 8 MCP agent tools (`vector_create_collection`, `vector_upsert`, `vector_query`, `vector_hybrid_search`, `vector_embed_text`, `vector_collection_stats`, `vector_list_collections`, `vector_cluster_analysis`).

![Step 3: Developer API & MCP Verification](Artifacts/vector-search-engine/vector-search-engine_03_dev_api_verify.jpg)

---

### Step 4: End-User CLI Installation & Help Matrix
Verifying global ZothOS binary resolution (`which -a vector-search-engine`), `--version`, and full CLI command documentation (`create`, `insert`, `query`, `hybrid`, `embed`, `benchmark`, `stats`, `list`, `cluster`, `serve`, `mcp`, `doctor`, `test`).

![Step 4: End-User CLI Install & Help](Artifacts/vector-search-engine/vector-search-engine_04_user_cli_install_help.jpg)

---

### Step 5: End-User CLI Diagnostic Doctor & Deterministic Vector Embedder
Running `vector-search-engine doctor --no-color` to benchmark Cosine Similarity QPS (`138,188 ops/sec`) and Euclidean Distance QPS (`215,640 ops/sec`), followed by `vector-search-engine embed` to compute an L2-normalized 8-dimensional dense embedding in `0.14 ms`.

![Step 5: End-User CLI Doctor & Embed](Artifacts/vector-search-engine/vector-search-engine_05_user_cli_doctor_embed.jpg)

---

### Step 6: End-User CLI HNSW Benchmark & Self-Verification Suite
Running `vector-search-engine benchmark -d 16 -n 120 -c 25 -k 5 --no-color` (`100.00% Recall@5`, `1894.1 ops/s`, `0.505 ms p50 latency`) and executing `vector-search-engine test --no-color` (`All 8 test suites passed cleanly in 0.094 s`).

![Step 6: End-User CLI Benchmark & Test](Artifacts/vector-search-engine/vector-search-engine_06_user_cli_benchmark_test.jpg)

---

### Step 7: Standalone Web Workstation (`:8121`) — Dark Mode Vector Space Explorer
Loading `http://127.0.0.1:8121` into the Vector Space Explorer showing the `Sovereign-Directives` collection (`12 items, 8D`), interactive 2D/3D Random Projection canvas, category color legend, and 6-tab navigation bar.

![Step 7: Standalone Dark Mode Workstation](Artifacts/vector-search-engine/vector-search-engine_07_gui_standalone_dark.jpg)

---

### Step 8: Standalone Web Workstation (`:8121`) — Hybrid & RRF Blending Lab (100% Unlocked)
Switching to the **⚖️ Hybrid & RRF Blending Lab** tab and running Reciprocal Rank Fusion (`k=60`, $\alpha = 0.50$) across **1. Dense HNSW Rank**, **2. Sparse BM25 Rank**, and **3. Blended Fusion Rank** with zero paywall blur filters.

![Step 8: Standalone Interactive Hybrid RRF Lab](Artifacts/vector-search-engine/vector-search-engine_08_gui_standalone_interact.jpg)

---

### Step 9: Standalone Web Workstation (`:8121`) — Editorial Light Mode & Live Search Simulator
Switching to the **⌕ Live Search Simulator** tab, executing a live similarity search (`"HNSW multi-layer graph indexing"` — `5 results in 0.30 ms`), and toggling **☀️ Light Mode** (`html[data-theme="light"]`) to verify crisp dark-ink typography and unblurred similarity scores.

![Step 9: Standalone Light Mode Search Simulator](Artifacts/vector-search-engine/vector-search-engine_09_gui_standalone_light.jpg)

---

### Step 10: Zoth Studio v2 (`:3000`) — God-Mode Overview & Local Enclave Header
Opening `http://127.0.0.1:3000/tools/vector-search-engine` inside Zoth Studio v2 God-Mode showing local node status (`:8121`), repository clone recipe, and open-access support badges.

![Step 10: Zoth Studio v2 God-Mode View](Artifacts/vector-search-engine/vector-search-engine_10_gui_studio_godmode.jpg)

---

### Step 11: Zoth Studio v2 (`:3000`) — Interactive HNSW Skip-Graph & RRF Studio
Scrolling into the embedded **Interactive Enclave Workstation** inside Zoth Studio v2 (`:3000/tools/vector-search-engine`) featuring live Semantic + Lexical Hybrid Search, `efSearch` / `RRF Constant (k)` sliders, ranked document table, and HNSW Multi-Layer Skip-Graph Projection (`0.68ms`).

![Step 11: Zoth Studio v2 Interactive Enclave](Artifacts/vector-search-engine/vector-search-engine_11_gui_studio_action.jpg)

---

### Step 12: Mobile 390px Responsive Workstation Verification (`overflowPx: 0`)
Verifying `http://127.0.0.1:8121` at `390x844` mobile viewport with responsive stacked cards, touch-friendly controls, and zero horizontal scroll overflow (`overflowPx === 0`).

![Step 12: Mobile 390px Responsive View](Artifacts/vector-search-engine/vector-search-engine_12_gui_mobile_390px.jpg)
