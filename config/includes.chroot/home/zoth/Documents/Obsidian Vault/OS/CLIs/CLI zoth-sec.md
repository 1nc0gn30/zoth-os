---
title: "zoth-sec"
tags: [os, cli]
aliases: ["zoth-sec"]
---

# zoth-sec

`file`: Bourne-Again shell script.

`zoth-sec` is the central CLI controller for the ZOTHOS Security Arsenal, unifying Kali Linux and Parrot OS security utilities under an interactive terminal interface, direct execution wrapper, and Model Context Protocol (MCP) bridge.

### Core Commands & Modes

- **`zoth-sec check`**: Performs an integrity audit across 9 security categories, inspecting whether standard tools are installed locally or available via configured repositories.
- **`zoth-sec list`**: Lists all supported security tool categories and binary targets.
- **`zoth-sec run <tool> [args...]`**: Executes an authorized security arsenal utility with passed parameters.
- **`zoth-sec interactive`**: Launches an interactive numbered terminal menu to browse categories and dispatch tools interactively.
- **`zoth-sec mcp`**: Spawns an embedded Python stdio MCP server (`kali-parrot-sectools` v2.0.0) exposing standardized JSON-RPC security tools (`sec_nmap`, `sec_masscan`, `sec_nuclei`, `sec_sqlmap`, `sec_nikto`, `sec_ffuf`, `sec_gobuster`, `sec_hashcat`, `sec_john`, `sec_searchsploit`) with configurable target arguments and a 180-second execution timeout.

### Tool Categories

1. **01 - Information Gathering**: `nmap`, `masscan`, `amass`, `nuclei`, `sublist3r`, `theHarvester`, `recon-ng`, `maltego`
2. **02 - Vulnerability Analysis**: `sqlmap`, `nikto`, `wpscan`, `commix`, `testssl.sh`, `gobuster`, `ffuf`, `feroxbuster`
3. **03 - Exploitation Frameworks**: `msfconsole`, `searchsploit`, `beef-xss`, `sliver`, `routerploit`
4. **04 - Wireless & RF Warfare**: `aircrack-ng`, `airgeddon`, `kismet`, `wifite`, `bully`, `reaver`, `gqrx`, `hackrf`
5. **05 - Password & Hashes**: `hashcat`, `john`, `hydra`, `medusa`, `crunch`, `ophcrack`, `cewl`
6. **06 - Reverse Engineering**: `ghidra`, `radare2`, `cutter`, `binwalk`, `gdb`, `rasm2`
7. **07 - Sniffing & Spoofing**: `wireshark`, `tshark`, `bettercap`, `mitmproxy`, `responder`, `impacket-smbexec`
8. **08 - Post-Exploitation & Forensics**: `autopsy`, `volatility`, `lynis`, `chkrootkit`, `bloodhound`
9. **09 - Anonymity & Anti-Forensics**: `tor`, `anonsurf`, `macchanger`, `bleachbit`, `mat2`, `firejail`, `proxychains4`

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-sec`
- **Interpreter**: `/usr/bin/env bash`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-sec|zoth-sec]]