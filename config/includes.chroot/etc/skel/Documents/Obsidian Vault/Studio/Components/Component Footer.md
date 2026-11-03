---
title: "Footer"
tags: [studio, component]
---

# Footer

`Footer` is the global layout footer rendered across all routes in `App.jsx`, providing navigation links, architectural manifest documentation, and system purity badges.

### What it renders

- **Brand & Manifest Column:**
  - Ghostbyte NullAI logo with gold glowing halo, title `Zoth Studio v2`, and subtitle `SOVEREIGN COMPILATION STRATUM`.
  - Architectural summary attributing development to NullAI Tech, highlighting air-gapped memory, Byzantine consensus, and zero-egress WebGPU/WASM execution.
  - Status chips for `SOVEREIGN RUNTIME SPEC` and `ZERO CLOUD EGRESS`, plus external links to `nullai.tech` and GitHub (`NullAITech`).
- **Structured Navigation Columns:**
  - **Workstations:** Routes to `/webgen`, `/memory`, `/consensus`, `/adytum`, `/hexstrike`, `/zoth-os`, `/swarm`, `/workstations`, and `/arsenal`.
  - **NullAI Tech Repos:** Routes to `/tools` and `/bridges`, plus external GitHub repositories for core sovereign engines.
  - **Theory & Math:** Deep-links to the Six Mathematical Pillars (`/docs/math/*`), architecture documentation, and whitepaper.
  - **Standards & Machine Contracts:** Links to `/ax`, `/llms.txt`, `/llms-full.txt`, `/ai.txt`, and crawler policies (`robots.txt`, `sitemap.xml`).
- **Interactive Mascot Strip:**
  - Embeds `<SovereignMascots />` within a frosted glassmorphic card.
- **Sub-Footer Bar:**
  - Displays copyright (2026 NullAI Tech & Zoth Studio), open-source licensing notices, and live hardware badges for `AIR-GAPPED ZERO-EGRESS HARDWARE` and `SYSTEM PURITY: 100%`.

## See also

[[Zoth Studio]] · [[MOC Components]]