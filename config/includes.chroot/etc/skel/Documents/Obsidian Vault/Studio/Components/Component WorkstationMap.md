---
title: "WorkstationMap"
tags: [studio, component]
---

# WorkstationMap

- **File:** `zoth-studio-v2/src/components/WorkstationMap.jsx`
- **Parent / Route:** [[Page DocsPage]] (`/docs`)

## Overview

`WorkstationMap` renders an interactive crosswalk grid that maps legacy HTML workstations from `public/studio` to their corresponding route implementations in Zoth Studio v2.

## What It Renders

- **Section Header:** When `embedded` is false, displays a `LEGACY STUDIO CROSSWALK` chip and section title "Workstations carried forward from core-app". (When embedded in documentation, the header is suppressed).
- **Crosswalk Grid:** Renders cards for each entry in `legacyWorkstations` (imported from `../data/zeroEgress`):
  - Legacy source filename (`station.file`) displayed in monospace gold type.
  - Job description (`station.job`) explaining the workflow carried over from core-app.
  - React Router link (`RouterLink`) navigating directly to the modern route (`station.to`).
- **Interactive Feedback:** Hover animations with gold border highlights and drop shadows indicating clickability.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page DocsPage]]