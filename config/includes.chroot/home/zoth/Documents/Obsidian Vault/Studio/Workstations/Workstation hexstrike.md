---
title: "HEXSTRIKE // Threat & Security Radar"
tags: [studio, workstation]
aliases: ["hexstrike"]
---

# HEXSTRIKE // Threat & Security Radar

The **HEXSTRIKE // Threat & Security Radar** is registered in the Zoth Studio v2 workstations directory (`src/data/workstations.js`) under Hardware Enclave Daemons.

### Core Functionality
Air-gapped security sentinel with Shannon entropy audit, CVE matrix, and exploit sandbox.

### Workstation Metadata
- **ID:** `hexstrike`
- **Name:** HEXSTRIKE // Threat & Security Radar
- **Type:** `enclave_daemon` (core hardware-anchored zero-egress daemon running on local loopback)
- **Functional Band:** Security
- **Static Entrypoint:** `/studio/hexstrike.html`
- **In-App Route:** `/hexstrike`

### Operational Role
Operates within the Security band as an air-gapped security sentinel and exploit sandbox. It performs Shannon entropy audits across binaries and payloads, correlates known vulnerabilities via the CVE matrix, and isolates untrusted processes in a local loopback enclave.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[Route hexstrike|/hexstrike]] · [[CLI hexstrike|hexstrike]] · [[Pkg hexstrike|hexstrike]]