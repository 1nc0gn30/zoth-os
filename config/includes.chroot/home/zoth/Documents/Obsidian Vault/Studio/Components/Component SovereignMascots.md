---
title: "SovereignMascots"
tags: [studio, component]
---

# SovereignMascots

The `SovereignMascots` component (`zoth-studio-v2/src/components/SovereignMascots.jsx`) renders the visual roster of the 21 Sovereign Pantheon familiars.

## What It Renders

- **Pantheon Header:** Celtic Garamond title "✦ The 21 Sovereign Companions ✦" with gold accenting and explanatory subtitle.
- **Companion Avatar Grid:** A centered, flex-wrapped ring displaying avatar portraits from `pantheonAgents` (`../data/pantheon`):
  - 44px circular gold-bordered badge containers.
  - 30px circular mascot images (`agent.img`).
  - Native browser tooltip (`title`) showing agent name and role (`${agent.id} — ${agent.role}`).
  - Micro-interactions on hover (elevation lift, golden border highlight, and box shadow).

## Parent & Integration

Rendered inside [[Component Footer|Footer]] (`Footer.jsx`) above the copyright and bottom attribution links, appearing across all pages of Zoth Studio.

## See also

[[Zoth Studio]] · [[MOC Components]]