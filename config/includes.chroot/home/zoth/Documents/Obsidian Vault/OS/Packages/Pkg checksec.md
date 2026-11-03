---
title: "checksec"
tags: [os, package]
aliases: ["checksec"]
---
# checksec

Bash script to test executable properties. Modern Linux distributions offer some mitigation techniques to make it harder to exploit software vulnerabilities reliably. Mitigations such as RELRO, NoExecute (NX), Stack Canaries, Address Space Layout Randomization (ASLR) and Position Independent Executables (PIE) have made reliably exploiting any vulnerabilities that do exist far more challenging. The checksec.sh script is designed to test what standard Linux OS and PaX security features are being used.

Check binary security properties (ASLR, NX, PIE, Canary)

- **Homepage:** https://github.com/slimm609/checksec.sh
- **apt-cache:** `checksec` (this workstation)
- **Package:** `checksec`
- **Type:** `apt`
- **Arsenal group:** Kali Cyber Arsenal (`kali`)

From `usr/share/zothos/tool-lists/zoth-verified-tools.json`. Curated image list, not a guarantee the binary is on PATH on every boot.

## See also

[[Zoth OS]] · [[Arsenal kali|Kali Cyber Arsenal]] · [[MOC Arsenal]]
