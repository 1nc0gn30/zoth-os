---
title: "CivicProcurementGodModeTool"
tags: [studio, component]
aliases: ["CivicProcurementGodModeTool"]
---

# CivicProcurementGodModeTool

The `CivicProcurementGodModeTool` component (`zoth-studio-v2/src/components/tools/CivicProcurementGodModeTool.jsx`) is the dedicated God-Mode municipal RFP, GovTech procurement, and public records workstation powering [[Studio city-desk|City Desk]].

## What It Renders

- **60fps Firm-Fixed-Price (FFP) Bid vs Ceiling Analyzer**: Interactive pricing model calculating labor hours, direct costs, net margins, and margin percentage against municipal procurement ceilings (e.g. Hampton Roads 757 Cyber, Virginia eVA Quick-Quote, Navy NSWC Norfolk SBIR).
- **GovTech Compliance Matrix**: Evaluates strict statutory and cybersecurity standards:
  - NIST SP 800-171 (Protecting Controlled Unclassified Information)
  - Commonwealth of Virginia VITA SEC530 Information Security Standard
  - DoD Cybersecurity Maturity Model Certification (CMMC v2.0 Level 2)
  - CJIS Security Policy v5.9 & SWaM Small Business Set-Aside criteria
- **Capability Statement Generator**: Synthesizes structured Markdown capability briefs for 1nc0gn30 • NullAI / 757 Tech Pro, detailing core competencies, NAICS codes (541512, 541511, 541715), and past performance.
- **Virginia FOIA § 2.2-3700 Synthesizer**: Generates formal public-records request letters for municipal IT contracts, competitor bid evaluations, and procurement histories under the Virginia Freedom of Information Act.

## Parent & Integration

Mounted at `/tools/city-desk`, styled with active `RealityContext` design tokens, and paired with the [[CLI zoth-city-desk|zoth-city-desk]] command-line utility.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Studio city-desk|City Desk]] · [[CLI zoth-city-desk|zoth-city-desk]]
