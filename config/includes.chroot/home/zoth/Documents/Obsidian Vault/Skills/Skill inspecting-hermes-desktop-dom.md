---
title: "inspecting-hermes-desktop-dom"
tags: [skill, hermes]
aliases: ["inspecting-hermes-desktop-dom"]
---

# inspecting-hermes-desktop-dom

`inspecting-hermes-desktop-dom` is a Hermes workstation skill for querying the live rendered Chromium DOM, computed CSS properties, element geometry, and renderer console output of the Hermes desktop application (`apps/desktop`) via the Chrome DevTools Protocol (CDP).

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Source Path:** `/home/zoth/.hermes/hermes-agent/skills/software-development/inspecting-hermes-desktop-dom/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Verifying whether UI modifications actually took effect in a running `apps/desktop` dev instance (`hgui` / `npm run dev`).
- Investigating CSS precedence issues (identifying the winning rule or inheritance chain on a node before modifying code).
- Locating stable component selectors (`data-slot` hooks) or checking design token computed values.
- Inspecting renderer console errors when troubleshooting desktop UI issues.
- *Note:* Do not use for perf profiling or visual aesthetic judgments.

## Key Capabilities & Workflow

- **Dev CDP Port:** Targets the CDP port on `127.0.0.1:9222` (or configured via `HERMES_DESKTOP_CDP_PORT`). Packaged builds disable this port.
- **CLI Evaluation:** Executes quick one-liners with `node scripts/eval.mjs "<expression>"`.
- **Programmatic Client:** Connects via `CDP.connect({ port: 9222, match: '5174' })` using stable hooks from `SELECTORS` in `scripts/perf/lib/cdp.mjs`.
- **Isolated Probing:** Allows launching an isolated test instance with a custom `--user-data-dir` and port to avoid disrupting an active user session.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill node-inspect-debugger|node-inspect-debugger]] · [[Skill systematic-debugging|systematic-debugging]] · [[Skill dogfood|dogfood]]