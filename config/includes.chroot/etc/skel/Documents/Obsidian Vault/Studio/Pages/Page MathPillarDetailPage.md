---
title: "MathPillarDetailPage"
tags: [studio, page]
---

# MathPillarDetailPage

`MathPillarDetailPage` renders the per-pillar mathematical derivation, live deterministic simulator, and multi-language reference code mounted at `/docs/math/:pillarId` in Zoth Studio v2.

## What it renders

- **Per-Pillar `<SEO>` & Invalid-Pillar Guard**: Emits unique per-pillar title/description/FAQ JSON-LD and renders an explicit "Unknown Mathematical Pillar" recovery view with valid links when `:pillarId` is unrecognized.
- **Semantic `<h1>` Header & Wrapped Pillar Switcher**: Displays Roman numeral badge, title, subtitle, Workstation + Prev/Next navigation, and a responsive wrapped chip strip across all six mathematical pillars (**Linear Algebra**, **Multivariable Calculus**, **Probability & Info Theory**, **Hessian & Loss Manifolds**, **Lyapunov & Phase Dynamics**, and **Neuromorphic STDP**).
- **Tiered Formulations**: Responsive 3-tier breakdown (`1. Intuition`, `2. Closed-Form`, `3. Tensor Form`) with theme-aware Editorial Ivory Light / Obsidian Dark formula cards and copy support.
- **Interactive Math Simulator (`mathPillarsEngine.js`)**: Both sliders are live, labeled (`aria-label`), and backed directly by `src/utils/mathPillarsEngine.js` (including neutral STDP `Δw(0) = 0` and clamped Lyapunov divergence).
- **Reference Implementation Code**: High-contrast (`>= 6.1:1`) Python, Rust, and TypeScript tabs with Editorial Ivory Light / Obsidian Dark code blocks, Copy, and Download actions.
- **Sovereign Funnel**: Embeds `SovereignFunnel` (`showSupportStrip={false}`) with the real executable `npm run test:math-pillars` verification command.

- **Source:** `zoth-studio-v2/src/pages/MathPillarDetailPage.jsx`
- **Route:** `/docs/math/:pillarId`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route docs-math-pillarId|/docs/math/:pillarId]] · [[Page MathPillarsPage|Math Pillars Overview]] · [[Workstation math-pillars|Six Mathematical Pillars Academy]]
