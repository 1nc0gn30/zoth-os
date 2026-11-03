---
title: "motion-choreography"
tags: [skill, agy]
aliases: ["motion-choreography"]
---

# motion-choreography

Animation engineering and timing design system governing transitions, hero reveals, video-to-page handoffs, and UI choreography.

- **Origin:** Gemini/AGY skill (`~/.gemini/config/skills/motion-choreography`)
- **When to load:** Load for any animation, page transition, intro video, loading screen, hover/entrance effect, or visual polish task.

## Core Tokens & Timings

- **Standard Easings:** `EASE_OUT_EXPO` (`[0.16, 1, 0.3, 1]`) for reveals; `EASE_OUT_QUINT` (`[0.22, 1, 0.36, 1]`) for fades; `EASE_IN_OUT` (`[0.76, 0, 0.24, 1]`) for shutters and aperture masks.
- **Duration Scale:** Hover/press (120–180ms), menus/tooltips (220–320ms), element entrances (450–600ms), full-screen transitions (650–950ms). Lists stagger 40–90ms (capped at ~500ms total).

## Choreography & Architecture

- **Hierarchy & Overlap:** One lead element moves first, followers stagger behind. Overlap incoming entrances while exits are ~70% complete.
- **Aperture Seam Handoff:** Bridges full-bleed intro videos into underlying pages via dynamic split-mask gradients and accent seams (`zoth-studio-v2` IntroDirector / IntroGate pattern).
- **Gated In-View Triggers:** Prevents `whileInView` and count-up animations from running invisibly behind intro overlays using `useGatedInView`.
- **Performance Rules:** Animate only `transform`, `opacity`, and `mask`. Always clear transforms at `transitionEnd` (`transform: 'none'`) so containing blocks don't trap `position: fixed` overlays or modals.
- **Accessibility & Escape Hatches:** Strictly supports `prefers-reduced-motion`, crawler bypass (`navigator.webdriver`), stall watchdogs (2.5s), and accessible skip controls (≥44px, Esc, Space, Enter).

## See also

[[MOC Skills]] · [[Zoth OS]]