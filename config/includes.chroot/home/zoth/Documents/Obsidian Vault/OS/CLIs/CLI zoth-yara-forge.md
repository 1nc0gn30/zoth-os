---
title: "zoth-yara-forge"
tags: [os, cli]
aliases: ["zoth-yara-forge"]
---

# zoth-yara-forge

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-yara-forge` is the command-line companion to [[Studio yara-sigma-forge|YARA-X & Sigma Threat Rule Forge]]. It compiles defensive detection rulesets and scans files or stdin against threat signatures (CVE-2024-4577 PHP-CGI, AI Agent token exfiltration, and Linux ELF64 memfd execution) with Shannon entropy analysis.

## Usage & Options

```bash
zoth-yara-forge [-h] [--scan PATH] [--emit-yara] [--json]
```

- **`--scan PATH`**: Scan a file or `-` for stdin against compiled rulesets
- **`--emit-yara`**: Output compiled YARA ruleset specification to stdout
- **`--json`**: Format threat detection scan output as structured JSON

## Implementation Details

- **Path**: `/usr/local/bin/zoth-yara-forge` (symlinked from `/home/zoth/.local/bin/zoth-yara-forge`)
- **Runtime**: `/usr/bin/env python3`
- **Zero External Dependencies**: Pure Python standard library implementation (`re`, `math`, `argparse`, `json`)
- **Detection Capabilities**: Evaluates byte-offset Shannon entropy radar (0.0 to 8.0 bits/byte), regex pattern matches, and MITRE ATT&CK technique tags

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio yara-sigma-forge|Studio yara-sigma-forge]] · [[Component YaraSigmaForgeGodModeTool|YaraSigmaForgeGodModeTool]]
