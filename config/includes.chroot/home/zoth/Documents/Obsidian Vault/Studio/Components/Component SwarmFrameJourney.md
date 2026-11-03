---
title: "SwarmFrameJourney"
tags: [studio, component]
---

# SwarmFrameJourney

The `SwarmFrameJourney` component (`zoth-studio-v2/src/components/SwarmFrameJourney.jsx`) is an interactive 6-frame animated presentation and onboarding journey for the Zoth Pantheon agent swarm.

## What It Renders

- **Top Journey HUD Controller:**
  - Sticky glassmorphic bar showing current frame indicator (`FRAME 01 / 06` through `06 / 06`), frame title, and subtitle.
  - Auto-play toggle with animated progress bar (8.5 seconds per frame).
  - Step navigation buttons and keyboard shortcuts (Left/Right arrows for frames, Space to toggle auto-play).
  - Quick jump buttons to return to overview or enter the live Cockpit (:8989).
- **Six Animated Frames (Framer Motion transitions):**
  1. **01 · The Whys:** Comparison between centralized cloud AI failures and sovereign local swarms.
  2. **02 · The Whats:** Interactive exploration of the 21 Pantheon agents filtered across 5 tactical cadres (Architects, Code, Security, Creative, Swarm).
  3. **03 · The Hows:** Architecture overview of the zero-egress tri-socket infrastructure (Lucy Oracle, STDP memory, and local sockets).
  4. **04 · The Whens:** Interactive 5-phase execution lifecycle scrubber (ingestion, triage, dispatch, synthesis, and consensus sealing).
  5. **05 · Using It:** Real-time swarm visualization embedding [[Component SwarmCanvasVisualizer|SwarmCanvasVisualizer]] alongside a simulated multi-agent query stepper.
  6. **06 · Take Flight:** Terminal launcher with copyable startup commands and quick actions to launch the swarm daemon.

## Parent & Integration

Rendered in [[Page SwarmPage|SwarmPage]] (`/swarm`) as the primary interactive educational and operational walkthrough for swarm architecture.

## See also

[[Zoth Studio]] · [[MOC Components]]