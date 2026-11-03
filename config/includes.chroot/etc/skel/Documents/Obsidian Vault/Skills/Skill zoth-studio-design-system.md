---
title: "zoth-studio-design-system"
tags: [skill, grok]
aliases: ["zoth-studio-design-system"]
---

# zoth-studio-design-system

Design tokens, motion primitives, and route intro architecture for Zoth Studio v2 (`~/NullAITech/zoth-studio-v2`).

- **Origin:** Grok skill (`~/.grok/skills/zoth-studio-design-system`)
- **When to load:** When building or modifying UI components, layouts, or route transitions in `zoth-studio-v2` or adjacent NullAI properties.

### Design Tokens & Typography
- **Stack:** Vite + React 19 + MUI 5 + Framer Motion.
- **Typography:**
  - Display: `"Celtic Garamond", Georgia, serif` (weight 400 only, for `h1`–`h6`).
  - Body: `"Google Sans", "Inter", system-ui`.
  - Monospace: `"JetBrains Mono", "IBM Plex Mono"` (labels and eyebrows).
- **Color System:** Gold palette (`#D4AF37` dark, `#B8860B` light) over dark `#08080B` or light `#FFFFFF` surfaces. Product accents: emerald (Swarm), purple (Memory), cyan (Consensus/AX), crimson (HexStrike), sky (WebGen).
- **Anchor Shape:** Gold `GlowLine` serves as the unifying visual anchor across pages and transition seams.

### Motion Primitives & Intro Architecture
- **Motion Primitives (`MotionReveal.jsx`):** Provides `HeroReveal`, `StaggerChildren`, `RevealOnScroll`, `SplitText`, `GlowLine`, and `ParallaxGlow`.
- **Intro Gating:** All animations are synchronized with `IntroGate.js` (`useGatedInView`, `useIntroReleased()`) so content reveals only after the route intro handoff completes.
- **Route Intros (`src/motion/`):**
  - `routeIntros.js` maps route regexes to intro video assets in `public/intros/`.
  - `IntroDirector.jsx` manages first-visit video playback, skip controls, and the Aperture Seam transition, dropping to a brief 0.4s title card on repeat visits.

## See also

[[MOC Skills]] · [[Zoth OS]]