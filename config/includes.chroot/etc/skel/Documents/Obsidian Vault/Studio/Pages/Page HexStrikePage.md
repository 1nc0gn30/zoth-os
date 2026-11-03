---
title: "HexStrikePage"
tags: [studio, page]
---

# HexStrikePage

`HexStrikePage` is the documentation and interactive security sentinel workstation mounted at route `/hexstrike/docs` in Zoth Studio v2.

## What it renders

- **Hero & Security Posture Gauge**: Displays the HexStrike offensive security status badge, an interactive security posture score (98/100), and a one-click re-verification trigger.
- **64-Port Loopback Attack Surface Scanner**: Sweeps and audits 64 local ports across loopback interfaces (`127.0.0.1` and `::1`), displaying daemon bindings, zero-WAN egress status, protocol types, and latency metrics.
- **Interactive Sentinel Terminal**: Provides an in-browser security command-line interface with history navigation supporting commands like `cve audit`, `entropy probe` (Shannon entropy CSPRNG testing), `tpm seal` (TPM 2.0 PCR-7 quote simulation), `ports scan`, `status`, and `export`.
- **Signed CVE Audit Report Exporter**: Generates and downloads signed JSON CVE vulnerability assessment reports verified with deterministic client-side SHA-256 hashing.
- **Security Micro-Tools Grid**: Filters and renders published security tools from `microTools` (e.g. EnvGuard, AudioCipher, Sentinel scanners) with WebGPU/CLI enclave badges, launch links, and GitHub repository links.
- **Sovereign Funnel**: Integrates `SovereignFunnel` for local deployment commands targeting the EnvGuard Secrets Vault and HexStrike tooling.

- **Source:** `zoth-studio-v2/src/pages/HexStrikePage.jsx`
- **Route:** `/hexstrike/docs`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route hexstrike-docs|/hexstrike/docs]] · [[Route hexstrike|/hexstrike]] · [[Workstation hexstrike|HEXSTRIKE // Threat & Security Radar]] · [[CLI hexstrike|hexstrike]] · [[Pkg hexstrike|hexstrike]]