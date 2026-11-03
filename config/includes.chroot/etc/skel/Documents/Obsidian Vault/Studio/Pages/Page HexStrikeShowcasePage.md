---
title: "HexStrikeShowcasePage"
tags: [studio, page]
---

# HexStrikeShowcasePage

`HexStrikeShowcasePage` renders the high-level product showcase and introduction page for HexStrike mounted at route `/hexstrike` in Zoth Studio v2.

## What it renders

- **Hero Banner**: Features an animated crimson `GlowLine` and bold headline (*"Offensive Security, On Your Terms"*), introducing HexStrike as a zero-cloud, local offensive security platform for vulnerability scanning and attack simulation.
- **Core Feature Grid**: A 4-column responsive card grid highlighting primary capabilities:
  - *Vulnerability Scanning* (`RadarIcon`): Automated weak spot detection across local software stacks.
  - *CVE Database & Threat Analysis* (`BugReportIcon`): Cross-referencing known exploits to evaluate risk.
  - *Steganography Tools* (`VisibilityOffIcon`): Concealing and detecting hidden payloads in media.
  - *Local Hardware Execution* (`MemoryIcon`): Zero-cloud, 100% on-device processing.
- **"Built For" Persona List**: Highlights target operator groups: security researchers & pen-testers, red team operators, and security-focused developers.
- **Action CTAs**:
  - Direct router navigation button to the full interactive workbench and docs at `/hexstrike/docs`.
  - External GitHub repository link to `NullAITech/NullAI-HexStrike-AI-Terminal`.

- **Source:** `zoth-studio-v2/src/pages/HexStrikeShowcasePage.jsx`
- **Route:** `/hexstrike`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route hexstrike|/hexstrike]] · [[Page HexStrikePage|HexStrike Documentation Page]]