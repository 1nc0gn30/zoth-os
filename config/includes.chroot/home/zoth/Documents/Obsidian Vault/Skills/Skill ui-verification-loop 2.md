---
title: "ui-verification-loop"
tags: [skill, agy]
aliases: ["ui-verification-loop"]
---

# ui-verification-loop

Automated visual verification framework using a zero-dependency Chrome DevTools Protocol (CDP) screenshot runner.

- **Origin:** AGY skill (`~/.gemini/config/skills/ui-verification-loop`)
- **When to load:** Whenever making visual changes to interfaces, components, layouts, or page transitions to verify rendering against real images.

### Architecture & Harness
- **CDP Runner (`scripts/capture.mjs`):** Connects to system Chrome via Node's native `WebSocket` (Node >= 22) without external dependencies like Puppeteer or Playwright.
- **Capture Modes:**
  - **Multi-Viewport Stills:** Standard captures across 375px (mobile), 768px (tablet), and 1440px (desktop).
  - **Timed Transition Frames:** Captures sequence frames at explicit millisecond timestamps (e.g. 0, 300, 1500, 5300ms) to inspect motion staging and reveals.
- **Automated Telemetry:** Emits JSON reporting console errors, uncaught exceptions, horizontal overflow (`overflowPx`), and button/text counts.
- **Production Build Testing:** Designed to run against local preview servers (`vite preview`) with resource limits (`--renderer-process-limit=2`).

### Visual Inspection Checklist
- **Layout & Responsiveness:** Clean focal point above the fold, zero horizontal scroll (`overflowPx === 0`), touch targets >= 44px, and no overlapping text.
- **Motion & Transitions:** No white flash or sudden cuts, intermediate motion states render properly, intro gating prevents early settle, and wrapper transforms clear on completion.
- **Hygiene:** Zero console errors (`errors.length === 0`) and full alt text coverage.

## See also

[[MOC Skills]] · [[Zoth OS]]