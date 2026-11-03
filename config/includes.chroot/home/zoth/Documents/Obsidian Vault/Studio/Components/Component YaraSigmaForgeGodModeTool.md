---
title: "YaraSigmaForgeGodModeTool"
tags: [studio, component]
aliases: ["YaraSigmaForgeGodModeTool"]
---

# YaraSigmaForgeGodModeTool

The `YaraSigmaForgeGodModeTool` component (`zoth-studio-v2/src/components/tools/YaraSigmaForgeGodModeTool.jsx`) is the dedicated God-Mode interactive threat workstation powering [[Studio yara-sigma-forge|YARA-X & Sigma Threat Rule Forge]].

## What It Renders

- **Shannon Entropy Radar**: 60fps visual canvas rendering byte-by-byte entropy distributions (0.0 to 8.0 bits/byte) to spot packed or encrypted payload sections.
- **YARA-X Rule Compiler**: Client-side syntax compiler supporting hex strings, ascii/wide keywords, regex patterns, and boolean condition logic.
- **Sigma YAML Schema Generator**: Exports log analysis schemas mapped to Sysmon and Linux auditd log events.
- **Threat Signature Presets**: Built-in templates for CVE-2024-4577 (PHP-CGI RCE), ELF64 `memfd_create` reflective execution, and AI Agent credential harvesting.
- **Live In-Browser Matcher**: Scans arbitrary test payloads, highlights matched offset ranges, and maps detections to MITRE ATT&CK techniques.

## Parent & Integration

Mounted at `/tools/yara-sigma-forge` within `ToolWorkspace`, connected to `RealityContext` and paired with CLI [[CLI zoth-yara-forge|zoth-yara-forge]].

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Studio yara-sigma-forge|YARA-X & Sigma Threat Rule Forge]] · [[CLI zoth-yara-forge|zoth-yara-forge]]
