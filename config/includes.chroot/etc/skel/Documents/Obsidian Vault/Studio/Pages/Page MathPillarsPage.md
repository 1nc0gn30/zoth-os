---
title: "MathPillarsPage"
tags: [studio, page]
---

# MathPillarsPage

`MathPillarsPage` renders the central academy and theoretical overview mounted at route `/docs/math` in Zoth Studio v2.

## What it renders

- **Breadcrumbs & Theoretical Badges**: Displays navigational breadcrumbs alongside badges for *"Theoretical Foundations & Closed-Form Proofs"* and *"Zero-Egress Numerical Invariants"*.
- **Hero Header**: Introduces the six foundational mathematical disciplines underlying Zoth Studio v2 (tensor projections, multivariable calculus, Shannon probability, Hessian curvature, Lyapunov phase dynamics, and neuromorphic STDP).
- **Pillar Quick Directory**: A 6-card responsive grid of quick-jump buttons linking to each detailed pillar specification route (`/docs/math/:pillarId`).
- **Interactive Mathematical Proofs Matrix**: Renders `MathPillarsGrid` in `"full"` variant mode, allowing operators to explore multi-tier formulas (Beginner, Intermediate, Advanced), closed-form derivations, audio narration, and LaTeX proofs across all six pillars.
- **Sovereign Funnel**: Integrates `SovereignFunnel` configuring local deployment commands (`npm run test:math`) for the Zoth mathematical core micro-engine.

- **Source:** `zoth-studio-v2/src/pages/MathPillarsPage.jsx`
- **Route:** `/docs/math`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route docs-math|/docs/math]] · [[Workstation math-pillars|Six Mathematical Pillars Academy]] · [[Page MathPillarDetailPage|Math Pillar Detail Page]]