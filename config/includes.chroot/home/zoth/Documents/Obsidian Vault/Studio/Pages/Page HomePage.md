---
title: "HomePage"
tags: [studio, page]
---

# HomePage

`HomePage` serves as the primary landing page and workstation cockpit mounted at root route `/` in Zoth Studio v2.

## What it renders

- **Hero & Golden Z 3D Emblem**: Renders the 3D alchemical crest (`GoldenZLogo3D`) within multi-tiered ambient radial gold glow rings, accompanied by headline copy, architecture pills, and CTAs (`/arsenal`, `/webgen`, `/zoth-os`, and replay cinema intro `/?intro=1`).
- **Live Local Service Status (`ServiceRow`)**: Uses `useStudioStatus` hook to poll loopback ports and render real-time status chips for local daemons (Swarm `:8989`, Memory `:8094`, Bridge `:8102`, Azoth `:8790`, Ollama `:11434`).
- **Core Value Highlights**: 4-column feature banner covering local privacy, high-speed neural execution, long-term synaptic memory, and multi-agent Pantheon orchestration.
- **Interactive CLI Terminal Simulator (`CliTerminalSimulator`)**: In-browser CRT-styled terminal demonstrating `zoth` CLI workflows (`zoth up`, `zoth pull`, `zoth status`) with syntax highlighting and copy-to-clipboard functionality.
- **Mathematical Pillars Showcase**: Integrates `MathPillarsGrid` and interactive pillar inspector cards linking directly into deep math pillar routes (`/docs/math/:pillarId`).
- **Tools Grid & Consoles**: Showcases published micro-tools from `microTools` with direct workspace launches, alongside lazy-loaded consoles:
  - `WebGPUAIConsole`: In-browser hardware-accelerated WebGPU inference testing.
  - `WebMCPConsole`: Model Context Protocol tool inspection.
  - `SovereignFunnel`: Local repository cloning and deployment instructions.
  - `CompanyTicker`: Architectural telemetry and ecosystem ticker.

- **Source:** `zoth-studio-v2/src/pages/HomePage.jsx`
- **Route:** `/`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route home|/]] · [[Page MathPillarsPage|Math Pillars]] · [[Page ArsenalPage|Arsenal Page]]