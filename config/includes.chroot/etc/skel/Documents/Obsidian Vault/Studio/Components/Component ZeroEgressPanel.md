---
title: "ZeroEgressPanel"
tags: [studio, component]
---

# ZeroEgressPanel

- **File:** `zoth-studio-v2/src/components/ZeroEgressPanel.jsx`
- **Parent / Route:** [[Page DocsPage]] (`/docs`)

## Overview

`ZeroEgressPanel` presents the security posture, verified static audit invariants, and live local port probe status for Zoth Studio services and daemons.

## What It Renders

- **Audit Status Badges:** Chips displaying `OWASP ZERO-EGRESS · 2026-09-15` and `67 ASSETS · 0 VIOLATIONS`.
- **Policy Heading:** "Hardware enclave and zero-egress policy" (rendered when `embedded` is false).
- **Verified Invariants Card:** A bulleted checklist rendering static audit invariants imported from `zeroEgressInvariants` (`../data/zeroEgress`), marked with green indicator dots.
- **Live Local Service Probe Table:** Consumes `useStudioStatus()` to probe local daemons on the host machine:
  - **Service:** Name of the daemon/service.
  - **Loopback:** Local socket address (e.g. `127.0.0.1:<port>`).
  - **Probe:** Real-time connectivity status (`answering` or `not answering`).
  - Fallback message when awaiting the probe response.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page DocsPage]]