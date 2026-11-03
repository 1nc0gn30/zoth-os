---
title: "Nexus 3D Scene Studio"
tool_id: "nexus-3d-scene-studio"
category: "Media & 3D"
local_port: 8082
studio_route: "http://127.0.0.1:3000/tools/nexus-3d-scene-studio"
repo_path: "/home/zoth/NullAITech/nexus-3d-scene-studio"
cli_binary: "/usr/local/bin/nexus-3d-scene-studio"
test_status: "PASS (12-Step Gallery Verified)"
open_access: true
last_verified: "2026-10-31"
tags:
  - zoth-studio
  - sovereign-arsenal
  - media-3d
  - webgl-geometry
  - tesseract-4d
  - verified-gallery
---

# Nexus 3D Scene Studio (`nexus-3d-scene-studio`)

> **100% Free & Open-Access Procedural 3D/4D Mathematical Geometry Engine, Triply-Periodic Minimal Surface (TPMS) SDF Generator, Wavefront OBJ/STL/glTF Exporter & FastMCP Spatial Agent Server**
> - **Standalone Web Workstation**: `http://127.0.0.1:8082`
> - **Zoth Studio v2 God-Mode Route**: `http://127.0.0.1:3000/tools/nexus-3d-scene-studio`
> - **Global ZothOS CLI**: `nexus-3d-scene-studio` (`/usr/local/bin/nexus-3d-scene-studio` & `~/.local/bin/nexus-3d-scene-studio`)
> - **Support**: [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) · **Solana Tip**: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`

---

## Part I — Developer Perspective: Architecture, Automated Pytest Suite & REST API Contracts

### Step 01 — Repository Architecture & ZothOS Binary Parity
Inspecting `/home/zoth/NullAITech/nexus-3d-scene-studio` package layout (`src/nexus_3d_scene_studio/geometry_engine.py`, `sdf_engine.py`, `exporters.py`, `mcp_server.py`, `ui_server.py`, `cli.py`) and verifying global CLI binary parity across `/usr/local/bin/nexus-3d-scene-studio` and `~/.local/bin/nexus-3d-scene-studio`.

![Step 01 — Developer Perspective: Repository Architecture & ZothOS Binary Parity](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_01_dev_repo_architecture.jpg)

### Step 02 — Automated Pytest Verification Suite (`141 passed`)
Running `pytest -v` across the 141-test verification suite covering 4D Tesseract stereographic projection, `(p, q)` Torus Knot extrusion, Superquadric signed trigonometric powers, TPMS Gyroid/Schwarz-P Marching Cubes extraction, Wavefront OBJ / ASCII STL / glTF 2.0 exporters, and JSON-RPC 2.0 MCP tools.

![Step 02 — Developer Perspective: Automated Pytest Verification Suite](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_02_dev_pytest_suite.jpg)

### Step 03 — Live HTTP REST API & Procedural 3D/4D Mesh Contracts
Probing `/api/health`, `POST /api/generate` (`shape: "tesseract"`, `size: 2.0, angle_4d: 0.6`), and `POST /api/sdf/generate` (`surface: "gyroid"`, `resolution: 12`) to verify real-time vertex, normal, and face index arrays.

![Step 03 — Developer Perspective: REST API & Procedural 3D/4D Mesh Contracts](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_03_dev_api_contracts.jpg)

---

## Part II — End-User CLI Perspective: Procedural Mesh Generation, Polygon Budget Audit & MCP Server

### Step 04 — Global CLI Help Matrix & Platform Graphics Diagnostics
Executing `nexus-3d-scene-studio --help`, `nexus-3d-scene-studio --json`, and `nexus-3d-scene-studio platform --json` from the user's shell.

![Step 04 — User CLI Perspective: Global Help Matrix & Platform Graphics Diagnostics](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_04_user_cli_help_platform.jpg)

### Step 05 — Procedural 3D/4D Mesh Generation (OBJ/STL) & Polygon Budget Audit
Running `nexus-3d-scene-studio generate torus_knot -p "p=3,q=5" -o /tmp/nexus_torus_knot.obj`, `nexus-3d-scene-studio generate tesseract -p "size=2.2,angle_4d=0.7" -f stl -o /tmp/nexus_tesseract.stl`, and `nexus-3d-scene-studio audit /tmp/nexus_torus_knot.obj --json` (`1920 vertices, 3840 faces, WebGL Grade A+`).

![Step 05 — User CLI Perspective: Procedural 3D/4D Generation (OBJ/STL) & Polygon Budget Audit](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_05_user_cli_generate_audit.jpg)

### Step 06 — Model Context Protocol (MCP) Tools & Claude Desktop Config
Inspecting MCP JSON-RPC 2.0 tool schemas (`nexus-3d-scene-studio mcp --tools`) and generating the ready-to-paste Claude Desktop configuration (`nexus-3d-scene-studio mcp --config claude`).

![Step 06 — User CLI Perspective: Model Context Protocol (MCP) Tools & Claude Config](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_06_user_cli_mcp_tools.jpg)

---

## Part III — Standalone Web Workstation GUI (`:8082`)

### Step 07 — Standalone Workstation: Interactive 4D Hypercube Tesseract WebGL Stage
Opening the Standalone Nexus 3D Scene Studio Workstation showing the 7-shape procedural carousel, live $\mathbb{R}^4 \to \mathbb{R}^3$ stereographic rotation projection of the 4D Tesseract (`144 vertices, 48 faces, 1.7 KB VRAM`), and 100% unlocked Wavefront OBJ export.

![Step 07 — Standalone GUI: 4D Hypercube Tesseract WebGL Stage](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_07_standalone_gui_4d_tesseract.jpg)

### Step 08 — Standalone Workstation: Parametric Torus Knot `(p=3, q=5)` with Normals RGB Hybrid Wireframe
Switching to **Parametric Torus Knot**, enabling **Hybrid** wireframe overlay and **Normals RGB** shading (`3,381 vertices, 6,400 faces, 114.6 KB VRAM`).

![Step 08 — Standalone GUI: Parametric Torus Knot Hybrid Normals RGB](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_08_standalone_gui_torus_knot_hybrid.jpg)

---

## Part IV — Zoth Studio v2 God-Mode Workbench (`:3000/tools/nexus-3d-scene-studio`) & Mobile Viewport

### Step 09 — Zoth Studio v2 God-Mode: Interactive 3D / 4D Viewport (`SO(4)` Lie Projection)
Navigating to `http://127.0.0.1:3000/tools/nexus-3d-scene-studio` inside the unified Zoth Studio v2 application and inspecting the live **Interactive 3D / 4D Viewport** tab with `SO(4)` rotation sliders.

![Step 09 — Zoth Studio v2 God-Mode: Interactive 3D / 4D Viewport](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_09_studio_gui_4d_viewport.jpg)

### Step 10 — Zoth Studio v2 God-Mode: Non-Orientable 4D Immersion (Klein Bottle)
Selecting **Klein Bottle (`Non-Orientable 4D Immersion`)** inside the Zoth Studio v2 God-Mode 3D canvas.

![Step 10 — Zoth Studio v2 God-Mode: Non-Orientable 4D Immersion (Klein Bottle)](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_10_studio_gui_klein_bottle.jpg)

### Step 11 — Zoth Studio v2 God-Mode: Procedural Primitives & Mathematical Pipeline
Switching to the **Procedural Primitives & Math** tab to inspect vertex/edge counts and manifold watertightness across all 5 mathematical geometry primitives.

![Step 11 — Zoth Studio v2 God-Mode: Procedural Primitives & Math](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_11_studio_gui_math_primitives.jpg)

### Step 12 — Mobile 390×844 Responsive Verification
Verifying zero horizontal scroll overflow (`overflowPx === 0`), stacked responsive shape selector and parameter sliders, and 44px touch targets at `390×844`.

![Step 12 — Mobile 390px Responsive Layout](Artifacts/nexus-3d-scene-studio/nexus-3d-scene-studio_12_mobile_390px_responsive.jpg)
