---
title: "MathPillarsPage"
tags: [studio, page]
---

# MathPillarsPage

`MathPillarsPage` renders the Six Mathematical Pillars Theory Academy mounted at `/docs/math` in Zoth Studio v2.

## What it renders

- **Breadcrumbs & Theoretical Badges**: Accessible `>= 44 px` navigation links alongside badges for *"Theoretical Foundations & Closed-Form Proofs"* and *"Zero-Egress Numerical Invariants"*.
- **Semantic `<h1>` Hero & Workstation CTA**: Introduces the six foundational mathematical disciplines paired with Byzantine BFT quorum verification and links directly to `/workstations/math-pillars`.
- **Pillar Quick Directory**: Responsive 6-card quick-jump directory linking to `/docs/math/:pillarId`.
- **Interactive Mathematical Proofs Matrix**: Renders `MathPillarsGrid` in `"full"` mode with Editorial Ivory Light (`#F4F1EA` / `#101828`) and Obsidian Dark (`#101828` / `#F5E6AB`) formula cards, tier toggles (`Beginner`, `Intermediate`, `Advanced`), copy proof, and Web Speech readout.
- **Sovereign Funnel**: Embeds `SovereignFunnel` (`showSupportStrip={false}` so the single Coffee/Solana support bar resides in the Footer) referencing the real executable `npm run test:math-pillars` test command.

- **Source:** `zoth-studio-v2/src/pages/MathPillarsPage.jsx`
- **Route:** `/docs/math`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route docs-math|/docs/math]] · [[Workstation math-pillars|Six Mathematical Pillars Academy]] · [[Page MathPillarDetailPage|Math Pillar Detail Page]]
