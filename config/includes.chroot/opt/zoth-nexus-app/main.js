const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');

// Standard GPU compatibility flags for VMs / hardware accelerators
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

app.on('child-process-gone', (_event, details) => {
  if (details.type === 'GPU') {
    console.log('[Zoth Nexus] GPU process recovered in software compatibility mode');
  }
});

let mainWindow = null;

// Dynamic PATH resolution for current user
const userHome = process.env.HOME || os.homedir();
const extraPaths = [
  path.join(userHome, '.cargo/bin'),
  path.join(userHome, '.foundry/bin'),
  path.join(userHome, 'go/bin'),
  '/usr/local/go/bin',
  path.join(userHome, '.local/bin'),
  '/opt/zothos-ai-env/bin',
  '/opt/metasploit-framework/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin'
];
const fullPath = Array.from(new Set([...extraPaths, ...(process.env.PATH || '').split(':')])).join(':');

// Comprehensive Database of 175+ Tools across 10 Sovereign Domains
const TOOLS_DATABASE = [
  // ── 1. Flagships & Core Workstations ──
  { id: 'zoth-studio', name: 'Zoth Studio Pro v2', domain: 'flagship', desc: 'Sovereign 3D WebGL Alchemical Cockpit & Multi-Daemon Workspace', cmd: 'zoth-studio', pkg: 'zoth-studio', type: 'system' },
  { id: 'hexstrike', name: 'HexStrike AI Terminal', domain: 'flagship', desc: 'NullAI Autonomous Red-Teaming & Exploit Automation Terminal', cmd: 'hexstrike-ai', pkg: 'hexstrike', type: 'system' },
  { id: 'zoth-cockpit', name: 'ZothOS Cockpit', domain: 'flagship', desc: 'Unified Alchemical System Telemetry & 21-Agent Swarm Deck', cmd: 'zoth-cockpit', pkg: 'zoth-cockpit', type: 'system' },
  { id: 'zoth-vault', name: 'Zoth Sovereign Vault', domain: 'flagship', desc: 'Zero-Leak Secrets Manager (Argon2id Rust Vault & Bitwarden)', cmd: 'zoth-vault', pkg: 'zoth-vault', type: 'system' },
  { id: 'zoth-pet-hud', name: 'Zoth Pet HUD', domain: 'flagship', desc: 'Animated Celestial Griffin Companion & Alchemical Mascots', cmd: 'zoth-pet-hud', pkg: 'zoth-pet-hud', type: 'system' },
  { id: 'zoth-docs', name: 'ZothOS Codex Docs', domain: 'flagship', desc: 'Interactive Sovereign Architecture & Operations Codex', cmd: 'zoth-docs', pkg: 'zoth-docs', type: 'system' },
  { id: 'zoth-feedback', name: 'Zoth Feedback Dispatcher', domain: 'flagship', desc: 'Anonymous Encrypted Telemetry & Feedback Dispatcher', cmd: 'zoth-feedback', pkg: 'zoth-feedback', type: 'system' },
  { id: 'zoth-soundtrack', name: 'Zoth Hermetic Audio', domain: 'flagship', desc: 'Classical & Alchemical Focus Music Studio (Satie, Bach, Chopin)', cmd: 'zoth-soundtrack', pkg: 'zoth-soundtrack', type: 'system' },
  { id: 'zoth-mode', name: 'Reality Switcher', domain: 'flagship', desc: 'Transmute Desktop Reality (Matrix / Ghost / Gold / Cyber)', cmd: 'zoth-mode', pkg: 'zoth-mode', type: 'system' },
  { id: 'zoth-fastfetch', name: 'Alchemical Fastfetch', domain: 'flagship', desc: 'Kernel, Hardware & Cryptographic System Telemetry', cmd: 'zoth-fastfetch', pkg: 'zoth-fastfetch', type: 'system' },
  { id: 'zoth-netkill', name: 'Emergency Netkill', domain: 'flagship', desc: 'Instant Kernel-Level Network Killswitch & IPTables Flush', cmd: 'zoth-netkill', pkg: 'zoth-netkill', type: 'system' },
  { id: 'zoth-undercover', name: 'Windows 11 Undercover', domain: 'flagship', desc: 'Instant Windows 11 Desktop Chameleon Stealth Theme', cmd: 'zoth-undercover', pkg: 'zoth-undercover', type: 'system' },
  { id: 'zoth-agent-os', name: 'Zoth Agent OS', domain: 'flagship', desc: 'L0-L4 Ring-Gated Autonomous Agent Supervisor Daemon', cmd: 'zoth-agent-os', pkg: 'zoth-agent-os', type: 'system' },

  // ── 2. Frontier AI & Local Inference ──
  { id: 'ollama', name: 'Ollama LLM Daemon', domain: 'ai', desc: 'Zero-Cloud Local LLM Inference (Llama 3, DeepSeek, Qwen)', cmd: 'ollama', pkg: 'ollama', type: 'custom:ollama' },
  { id: 'hermes', name: 'Hermes Agent Swarm', domain: 'ai', desc: 'Nous Research Autonomous Multi-Agent Swarm Orchestrator', cmd: 'hermes', pkg: 'hermes-agent', type: 'custom:hermes' },
  { id: 'claude', name: 'Claude Code CLI', domain: 'ai', desc: 'Anthropic Autonomous Agentic Terminal Coding Harness', cmd: 'claude', pkg: '@anthropic-ai/claude-code', type: 'npm' },
  { id: 'codex', name: 'OpenAI Codex CLI', domain: 'ai', desc: 'OpenAI Autonomous Terminal Coding Companion', cmd: 'codex', pkg: '@openai/codex', type: 'npm' },
  { id: 'opencode', name: 'OpenCode AI', domain: 'ai', desc: 'Open Source Terminal AI Pair Programmer', cmd: 'opencode', pkg: 'opencode-ai', type: 'npm' },
  { id: 'aider', name: 'Aider AI Pair Programmer', domain: 'ai', desc: 'Terminal AI Pair Programmer with Git Integration', cmd: 'aider', pkg: 'aider-chat', type: 'pip' },
  { id: 'garak', name: 'Garak LLM Scanner', domain: 'ai', desc: 'Automated LLM Vulnerability & Hallucination Prober', cmd: 'garak', pkg: 'garak', type: 'pip' },
  { id: 'pyrit', name: 'Microsoft PyRIT', domain: 'ai', desc: 'Python Risk Identification Tool for Generative AI', cmd: 'pyrit', pkg: 'pyrit', type: 'pip' },
  { id: 'fastmcp', name: 'FastMCP SDK', domain: 'ai', desc: 'Fast Model Context Protocol Server & Client Framework', cmd: 'fastmcp', pkg: 'fastmcp', type: 'pip' },
  { id: 'maya', name: 'Maya Linux Studio', domain: 'ai', desc: 'Creator Playbooks & AI Automation Engine', cmd: 'maya', pkg: 'maya-linux', type: 'system' },
  { id: 'vllm', name: 'vLLM Engine', domain: 'ai', desc: 'Continuous Batching High-Throughput Model Server', cmd: 'vllm', pkg: 'vllm', type: 'pip' },
  { id: 'comfyui', name: 'ComfyUI Engine', domain: 'ai', desc: 'Node-Based Generative Image & FLUX Pipeline', cmd: 'comfyui', pkg: 'torch,torchvision', type: 'pip' },
  { id: 'open-webui', name: 'Open WebUI', domain: 'ai', desc: 'Self-Hosted ChatGPT/Claude UI Interface', cmd: 'open-webui', pkg: 'open-webui', type: 'pip' },
  { id: 'litellm', name: 'LiteLLM Proxy', domain: 'ai', desc: 'Universal Proxy Routing to 100+ LLM Endpoints', cmd: 'litellm', pkg: 'litellm', type: 'pip' },

  // ── 3. Offensive Security & Red Team ──
  { id: 'nmap', name: 'Nmap Port Scanner', domain: 'sec', desc: 'Network Exploration & Port Vulnerability Scanner', cmd: 'nmap', pkg: 'nmap', type: 'apt' },
  { id: 'masscan', name: 'Masscan IP Scanner', domain: 'sec', desc: 'Asynchronous Internet-Scale Port Scanner', cmd: 'masscan', pkg: 'masscan', type: 'apt' },
  { id: 'rustscan', name: 'RustScan', domain: 'sec', desc: 'Modern Ultra-Fast Port Scanner Powered by Rust', cmd: 'rustscan', pkg: 'rustscan', type: 'custom:rustscan' },
  { id: 'wireshark', name: 'Wireshark Analyzer', domain: 'sec', desc: 'Network Protocol Packet Dissection GUI', cmd: 'wireshark', pkg: 'wireshark', type: 'apt' },
  { id: 'tshark', name: 'TShark Sniffer', domain: 'sec', desc: 'Terminal Network Packet Sniffer & Capture Tool', cmd: 'tshark', pkg: 'tshark', type: 'apt' },
  { id: 'sqlmap', name: 'SQLmap Injector', domain: 'sec', desc: 'Automatic SQL Injection & Database Takeover Tool', cmd: 'sqlmap', pkg: 'sqlmap', type: 'apt' },
  { id: 'ffuf', name: 'FFUF Web Fuzzer', domain: 'sec', desc: 'Fast Web Path, Parameter & Content Fuzzer', cmd: 'ffuf', pkg: 'ffuf', type: 'apt' },
  { id: 'gobuster', name: 'Gobuster Fuzzer', domain: 'sec', desc: 'High-Speed URI, DNS & VHost Brute-Forcer', cmd: 'gobuster', pkg: 'gobuster', type: 'apt' },
  { id: 'nikto', name: 'Nikto Web Scanner', domain: 'sec', desc: 'Web Server Misconfiguration & Vulnerability Scanner', cmd: 'nikto', pkg: 'nikto', type: 'apt' },
  { id: 'nuclei', name: 'Nuclei Scanner', domain: 'sec', desc: 'Template-Driven Vulnerability & Exploit Scanner', cmd: 'nuclei', pkg: 'nuclei', type: 'apt' },
  { id: 'subfinder', name: 'Subfinder Discovery', domain: 'sec', desc: 'Fast Passive Subdomain Discovery Engine', cmd: 'subfinder', pkg: 'subfinder', type: 'apt' },
  { id: 'amass', name: 'OWASP Amass', domain: 'sec', desc: 'In-Depth Attack Surface Mapping & OSINT Tool', cmd: 'amass', pkg: 'amass', type: 'apt' },
  { id: 'httpx', name: 'HTTPX Probe', domain: 'sec', desc: 'Fast Multi-Purpose HTTP Probing Toolkit', cmd: 'httpx', pkg: 'httpx', type: 'apt' },
  { id: 'metasploit', name: 'Metasploit Framework', domain: 'sec', desc: 'World Leading Penetration Testing & Exploit Suite', cmd: 'msfconsole', pkg: 'metasploit-framework', type: 'custom:metasploit' },
  { id: 'hydra', name: 'THC Hydra', domain: 'sec', desc: 'Fast Network Logon & Credential Cracker', cmd: 'hydra', pkg: 'hydra', type: 'apt' },
  { id: 'john', name: 'John the Ripper', domain: 'sec', desc: 'Password Hash Security Auditor & Cracker', cmd: 'john', pkg: 'john', type: 'apt' },
  { id: 'hashcat', name: 'Hashcat Cracker', domain: 'sec', desc: 'GPU-Accelerated Password Recovery Engine', cmd: 'hashcat', pkg: 'hashcat', type: 'apt' },
  { id: 'radare2', name: 'Radare2 Reverse Eng', domain: 'sec', desc: 'UNIX-Like Reverse Engineering & Binary Forensics', cmd: 'r2', pkg: 'radare2', type: 'apt' },
  { id: 'ghidra', name: 'NSA Ghidra', domain: 'sec', desc: 'Software Reverse Engineering Suite & Decompiler', cmd: 'ghidra', pkg: 'ghidra', type: 'apt' },
  { id: 'binwalk', name: 'Binwalk Extractor', domain: 'sec', desc: 'Firmware Analysis & Embedded File Extraction', cmd: 'binwalk', pkg: 'binwalk', type: 'apt' },
  { id: 'caido', name: 'Caido Web Security', domain: 'sec', desc: 'Lightweight Rust-Based Web Intercepting Proxy', cmd: 'caido', pkg: 'caido', type: 'custom:caido' },
  { id: 'burpsuite', name: 'Burp Suite Community', domain: 'sec', desc: 'Web Application Security Scanner & Proxy', cmd: 'burpsuite', pkg: 'burpsuite', type: 'apt' },
  { id: 'aircrack-ng', name: 'Aircrack-ng Suite', domain: 'sec', desc: '802.11 Wireless Network Security Auditor', cmd: 'aircrack-ng', pkg: 'aircrack-ng', type: 'apt' },
  { id: 'ligolo-ng', name: 'Ligolo-ng Tunneling', domain: 'sec', desc: 'Advanced Pivoting & TUN Interface Tunneling', cmd: 'ligolo', pkg: 'ligolo', type: 'custom:ligolo' },
  { id: 'responder', name: 'Responder Poisoner', domain: 'sec', desc: 'LLMNR, NBT-NS and MDNS Poisoner & Sniffer', cmd: 'responder', pkg: 'responder', type: 'apt' },
  { id: 'evil-winrm', name: 'Evil-WinRM Shell', domain: 'sec', desc: 'Ultimate WinRM Remote Shell for Pentesting', cmd: 'evil-winrm', pkg: 'evil-winrm', type: 'apt' },
  { id: 'seclists', name: 'SecLists & Wordlists', domain: 'sec', desc: 'Security Wordlists, Payloads & Dictionaries', cmd: 'ls /usr/share/seclists', pkg: 'seclists,wordlists', type: 'apt' },

  // ── 4. Privacy & Defense ──
  { id: 'tor-browser', name: 'Tor Browser', domain: 'privacy', desc: 'Anonymous Onion Routing & Anti-Fingerprint Browser', cmd: 'tor-browser', pkg: 'torbrowser-launcher', type: 'apt' },
  { id: 'tor', name: 'Tor Anonymity Daemon', domain: 'privacy', desc: 'Onion Routing Daemon & SOCKS5 Anonymizer', cmd: 'tor', pkg: 'tor', type: 'apt' },
  { id: 'macchanger', name: 'GNU MAC Changer', domain: 'privacy', desc: 'Network Interface MAC Address Spoofer', cmd: 'macchanger', pkg: 'macchanger', type: 'apt' },
  { id: 'proxychains4', name: 'ProxyChains-NG', domain: 'privacy', desc: 'Force TCP Connections Through Tor/SOCKS5 Proxies', cmd: 'proxychains4', pkg: 'proxychains4', type: 'apt' },
  { id: 'signal', name: 'Signal Secure Messenger', domain: 'privacy', desc: 'End-to-End Encrypted Private Messaging App', cmd: 'signal-desktop', pkg: 'signal-desktop', type: 'system' },
  { id: 'simplex', name: 'SimpleX Chat', domain: 'privacy', desc: 'Decentralized Private Chat Without User Identifiers', cmd: 'simplex-desktop', pkg: 'simplex-desktop', type: 'system' },
  { id: 'element', name: 'Matrix Element Chat', domain: 'privacy', desc: 'Federated End-to-End Encrypted Matrix Messenger', cmd: 'element-desktop', pkg: 'element-desktop', type: 'system' },
  { id: 'bleachbit', name: 'BleachBit Cleaner', domain: 'privacy', desc: 'System Cleaner & Free Disk Space Wiper', cmd: 'bleachbit', pkg: 'bleachbit', type: 'apt' },
  { id: 'mat2', name: 'MAT2 Metadata Sanitizer', domain: 'privacy', desc: 'Metadata Anonymisation Toolkit for Files', cmd: 'mat2', pkg: 'mat2', type: 'apt' },
  { id: 'firejail', name: 'Firejail Sandbox', domain: 'privacy', desc: 'Linux Application Security Sandbox', cmd: 'firejail', pkg: 'firejail', type: 'apt' },

  // ── 5. Polyglot Dev & Core Toolchains ──
  { id: 'python3', name: 'Python 3 Runtime', domain: 'dev', desc: 'Python 3.11+ Core & VENV Environment', cmd: 'python3', pkg: 'python3,python3-pip,python3-venv', type: 'apt' },
  { id: 'uv', name: 'Astral UV', domain: 'dev', desc: 'Blazing Fast Python Package Manager & Resolver', cmd: 'uv', pkg: 'uv', type: 'custom:uv' },
  { id: 'nodejs', name: 'Node.js JavaScript Runtime', domain: 'dev', desc: 'High-Performance Server JavaScript Engine', cmd: 'node', pkg: 'nodejs', type: 'apt' },
  { id: 'npm', name: 'Node Package Manager', domain: 'dev', desc: 'Official Node.js Ecosystem Package Manager', cmd: 'npm', pkg: 'npm', type: 'apt' },
  { id: 'rustc', name: 'Rust Compiler', domain: 'dev', desc: 'Memory-Safe Systems Programming Compiler', cmd: 'rustc', pkg: 'rustc', type: 'apt' },
  { id: 'cargo', name: 'Cargo Package Manager', domain: 'dev', desc: 'Rust Build System & Package Manager', cmd: 'cargo', pkg: 'cargo', type: 'apt' },
  { id: 'go', name: 'Golang Toolchain', domain: 'dev', desc: 'Concurrent Systems Programming Language Runtime', cmd: 'go', pkg: 'golang', type: 'apt' },
  { id: 'gcc', name: 'GNU GCC Compiler', domain: 'dev', desc: 'C/C++ Compiler Collection & Build-Essential', cmd: 'gcc', pkg: 'gcc,build-essential', type: 'apt' },
  { id: 'clang', name: 'LLVM Clang Compiler', domain: 'dev', desc: 'Optimizing C/C++ Compiler Toolchain', cmd: 'clang', pkg: 'clang', type: 'apt' },
  { id: 'neovim', name: 'Neovim IDE', domain: 'dev', desc: 'Extensible Vim-Based Terminal Development Suite', cmd: 'nvim', pkg: 'neovim', type: 'apt' },
  { id: 'micro', name: 'Micro Terminal Editor', domain: 'dev', desc: 'Modern & Intuitive Terminal Text Editor', cmd: 'micro', pkg: 'micro', type: 'apt' },
  { id: 'tmux', name: 'Tmux Multiplexer', domain: 'dev', desc: 'Terminal Multiplexer with Split-Pane Support', cmd: 'tmux', pkg: 'tmux', type: 'apt' },
  { id: 'starship', name: 'Starship Prompt', domain: 'dev', desc: 'Cross-Shell Fast Customizable Prompt', cmd: 'starship', pkg: 'starship', type: 'custom:starship' },
  { id: 'fzf', name: 'FZF Fuzzy Finder', domain: 'dev', desc: 'Interactive Command-Line Fuzzy Finder', cmd: 'fzf', pkg: 'fzf', type: 'apt' },
  { id: 'bat', name: 'Batcat (bat)', domain: 'dev', desc: 'Cat Clone with Syntax Highlighting & Git Status', cmd: 'bat', pkg: 'bat', type: 'apt' },
  { id: 'fd', name: 'FD Directory Search', domain: 'dev', desc: 'Fast, User-Friendly Alternative to Find', cmd: 'fd', pkg: 'fd-find', type: 'apt' },
  { id: 'duf', name: 'Duf Disk Visualizer', domain: 'dev', desc: 'Disk Usage & Free Space Visualizer', cmd: 'duf', pkg: 'duf', type: 'apt' },
  { id: 'ripgrep', name: 'Ripgrep (rg)', domain: 'dev', desc: 'Ultra-Fast Line-Oriented Recursive Regex Search', cmd: 'rg', pkg: 'ripgrep', type: 'apt' },
  { id: 'jq', name: 'JQ JSON Processor', domain: 'dev', desc: 'Command-Line JSON Parser & Transformer', cmd: 'jq', pkg: 'jq', type: 'apt' },
  { id: 'btop', name: 'Btop++ Resource Monitor', domain: 'dev', desc: 'Process, Memory & GPU Telemetry Monitor', cmd: 'btop', pkg: 'btop', type: 'apt' },

  // ── 6. Web3 & Blockchain ──
  { id: 'solana', name: 'Solana CLI Suite', domain: 'web3', desc: 'Solana Blockchain Validator & Program Deployment CLI', cmd: 'solana', pkg: 'solana', type: 'custom:solana' },
  { id: 'foundry', name: 'Ethereum Foundry Suite', domain: 'web3', desc: 'Fast EVM Toolchain (forge, cast, anvil, chisel)', cmd: 'forge', pkg: 'foundry', type: 'custom:foundry' },
  { id: 'slither', name: 'Slither Smart Contract Auditor', domain: 'web3', desc: 'Solidity Static Analysis Vulnerability Framework', cmd: 'slither', pkg: 'slither', type: 'custom:slither' },
  { id: 'mythril', name: 'Mythril EVM Analyzer', domain: 'web3', desc: 'Security Analysis Tool for EVM Bytecode', cmd: 'myth', pkg: 'mythril', type: 'custom:mythril' },
  { id: 'ipfs', name: 'IPFS Kubo Node', domain: 'web3', desc: 'InterPlanetary File System P2P Node', cmd: 'ipfs', pkg: 'ipfs', type: 'custom:ipfs' },

  // ── 7. Media, 3D & Creative ──
  { id: 'blender', name: 'Blender 3D Suite', domain: 'media', desc: 'Complete 3D Modeling, VFX & Rendering Workstation', cmd: 'blender', pkg: 'blender', type: 'apt' },
  { id: 'ffmpeg', name: 'FFmpeg Audio/Video Engine', domain: 'media', desc: 'Accelerated Video, Audio & Stream Converter', cmd: 'ffmpeg', pkg: 'ffmpeg', type: 'apt' },
  { id: 'gimp', name: 'GIMP Image Editor', domain: 'media', desc: 'GNU Image Manipulation Program for Art & Retouching', cmd: 'gimp', pkg: 'gimp', type: 'apt' },
  { id: 'inkscape', name: 'Inkscape Vector Studio', domain: 'media', desc: 'Professional SVG Vector Graphics Editor', cmd: 'inkscape', pkg: 'inkscape', type: 'apt' },
  { id: 'obs-studio', name: 'OBS Studio', domain: 'media', desc: 'Live Video Streaming & Screen Recording Suite', cmd: 'obs', pkg: 'obs-studio', type: 'apt' },
  { id: 'imagemagick', name: 'ImageMagick', domain: 'media', desc: 'CLI Raster & Vector Manipulation Engine', cmd: 'convert', pkg: 'imagemagick', type: 'apt' },
  { id: 'mpv', name: 'MPV Player', domain: 'media', desc: 'Minimalist GPU-Accelerated Video Player', cmd: 'mpv', pkg: 'mpv', type: 'apt' },

  // ── 8. Sovereign Linux Infra & Mesh ──
  { id: 'tailscale', name: 'Tailscale Mesh VPN', domain: 'infra', desc: 'Zero-Config Encrypted WireGuard Mesh Network', cmd: 'tailscale', pkg: 'tailscale', type: 'custom:tailscale' },
  { id: 'wireguard', name: 'WireGuard Tools', domain: 'infra', desc: 'Fast, Modern Kernel-Level VPN Tunnel', cmd: 'wg', pkg: 'wireguard-tools', type: 'apt' },
  { id: 'docker', name: 'Docker / Podman Engine', domain: 'infra', desc: 'OCI Container Engine & Microservice Supervisor', cmd: 'docker', pkg: 'docker.io', type: 'apt' },
  { id: 'caddy', name: 'Caddy Web Server', domain: 'infra', desc: 'Enterprise HTTP/3 Server with Automatic HTTPS', cmd: 'caddy', pkg: 'caddy', type: 'apt' },
  { id: 'nginx', name: 'Nginx HTTP Server', domain: 'infra', desc: 'High-Performance Reverse Proxy & Load Balancer', cmd: 'nginx', pkg: 'nginx', type: 'apt' },
  { id: 'cloudflared', name: 'Cloudflare Zero-Trust', domain: 'infra', desc: 'Zero-Trust Secure Tunnel Client', cmd: 'cloudflared', pkg: 'cloudflared', type: 'custom:cloudflared' },
  { id: 'postgresql', name: 'PostgreSQL Server', domain: 'infra', desc: 'Relational SQL Database Engine', cmd: 'psql', pkg: 'postgresql', type: 'apt' },
  { id: 'sqlite3', name: 'SQLite3 Database', domain: 'infra', desc: 'Serverless Self-Contained SQL Database Engine', cmd: 'sqlite3', pkg: 'sqlite3', type: 'apt' },
  { id: 'rclone', name: 'Rclone Multi-Cloud', domain: 'infra', desc: 'Rsync for Cloud Storage (S3, B2, WebDAV, SFTP)', cmd: 'rclone', pkg: 'rclone', type: 'apt' },

  // ── 9. Vision, OCR & Document Intelligence ──
  { id: 'tesseract', name: 'Tesseract Neural OCR', domain: 'vision', desc: 'Neural Optical Character Recognition Engine', cmd: 'tesseract', pkg: 'tesseract-ocr', type: 'apt' },
  { id: 'pandoc', name: 'Pandoc Universal Converter', domain: 'vision', desc: 'Universal Document Converter (Markdown, PDF, LaTeX)', cmd: 'pandoc', pkg: 'pandoc', type: 'apt' },
  { id: 'typst', name: 'Typst Typesetting System', domain: 'vision', desc: 'Modern Markup-Based Typesetting System', cmd: 'typst', pkg: 'typst', type: 'custom:typst' },
  { id: 'opencv', name: 'OpenCV Vision Library', domain: 'vision', desc: 'Real-Time Computer Vision & Image Processing', cmd: 'python3 -c "import cv2"', pkg: 'opencv-python', type: 'pip' },
  { id: 'pymupdf', name: 'PyMuPDF Parser', domain: 'vision', desc: 'High-Performance PDF Extraction & Analysis', cmd: 'python3 -c "import fitz"', pkg: 'PyMuPDF', type: 'pip' },

  // ── 10. Knowledge Management & PKM ──
  { id: 'obsidian', name: 'Obsidian Knowledge Base', domain: 'docs', desc: 'Interlinked Markdown Second-Brain with Knowledge Graph', cmd: 'obsidian', pkg: 'obsidian', type: 'custom:obsidian' },
  { id: 'zathura', name: 'Zathura Document Viewer', domain: 'docs', desc: 'Keyboard-Centric Minimalist PDF Viewer', cmd: 'zathura', pkg: 'zathura', type: 'apt' },
  { id: 'graphviz', name: 'Graphviz DOT Engine', domain: 'docs', desc: 'Graph Visualization & Layout Engine', cmd: 'dot', pkg: 'graphviz', type: 'apt' },
  { id: 'flameshot', name: 'Flameshot Screen Capture', domain: 'docs', desc: 'Feature-Rich Screenshot & Annotation Tool', cmd: 'flameshot', pkg: 'flameshot', type: 'apt' },
  { id: 'tree', name: 'Tree Visualizer', domain: 'docs', desc: 'Recursive Directory Tree Visualizer', cmd: 'tree', pkg: 'tree', type: 'apt' }
];

// Curated Bundles
const BUNDLES = {
  'kali': {
    id: 'kali',
    label: 'Kali Cyber Arsenal',
    tag: 'OFFENSIVE SECURITY',
    icon: '⚔',
    desc: 'Elite offensive toolkit: reconnaissance, exploitation, wireless auditing, forensics, and password cracking.',
    toolIds: ['nmap', 'masscan', 'sqlmap', 'nikto', 'gobuster', 'ffuf', 'nuclei', 'subfinder', 'amass', 'httpx', 'wireshark', 'tshark', 'john', 'hashcat', 'hydra', 'aircrack-ng', 'radare2', 'binwalk', 'metasploit', 'caido', 'burpsuite', 'responder', 'evil-winrm', 'seclists']
  },
  'parrot': {
    id: 'parrot',
    label: 'Parrot Privacy & Defense',
    tag: 'PRIVACY & DEFENSE',
    icon: '🛡',
    desc: 'Sovereign privacy and defense toolkit: anonymity networks, encrypted tunnels, traffic analysis, and metadata sanitation.',
    toolIds: ['tor-browser', 'tor', 'macchanger', 'proxychains4', 'signal', 'simplex', 'element', 'bleachbit', 'mat2', 'firejail']
  },
  'zoth': {
    id: 'zoth',
    label: 'Zoth Dev & Creator Suite',
    tag: 'POLYGLOT DEV & CREATOR',
    icon: '☿',
    desc: 'Polyglot developer toolchains, compilers, terminal power tools, container engines, and creative media suites.',
    toolIds: ['python3', 'uv', 'nodejs', 'npm', 'rustc', 'cargo', 'go', 'gcc', 'clang', 'neovim', 'micro', 'tmux', 'starship', 'fzf', 'bat', 'fd', 'duf', 'ripgrep', 'jq', 'btop', 'docker', 'blender', 'ffmpeg', 'gimp', 'inkscape', 'obs-studio', 'mpv']
  },
  'ai-stack': {
    id: 'ai-stack',
    label: 'Frontier AI & Autonomous Swarms',
    tag: 'FRONTIER AI',
    icon: '🧠',
    desc: 'Local zero-cloud LLM runtimes, autonomous coding agent swarms, red-team evaluators, and MCP protocols.',
    toolIds: ['ollama', 'hermes', 'claude', 'codex', 'opencode', 'aider', 'garak', 'pyrit', 'fastmcp', 'vllm', 'open-webui', 'litellm']
  },
  'web3-stack': {
    id: 'web3-stack',
    label: 'Web3 & Blockchain Security',
    tag: 'WEB3 & CRYPTO',
    icon: '⛓',
    desc: 'Smart contract development, auditing, bytecode verification, Solana runtime, and IPFS peer-to-peer storage.',
    toolIds: ['solana', 'foundry', 'slither', 'mythril', 'ipfs']
  }
};

function createWindow() {
  const iconPath = fs.existsSync('/usr/share/pixmaps/zoth-tool-nexus.png')
    ? '/usr/share/pixmaps/zoth-tool-nexus.png'
    : '/opt/zoth-studio/public/assets/brand/zoth-logo.png';

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workAreaSize || primaryDisplay.bounds;
  const targetWidth = Math.min(1320, Math.floor(workArea.width * 0.94));
  const targetHeight = Math.min(840, Math.floor(workArea.height * 0.90));

  mainWindow = new BrowserWindow({
    width: targetWidth,
    height: targetHeight,
    minWidth: 780,
    minHeight: 520,
    center: true,
    backgroundColor: '#04070c',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    title: 'ZOTH TOOL NEXUS // 175+ CYBER ARSENAL & SOVEREIGN RUNTIMES',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  if (mainWindow.removeMenu) mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helper: Check single tool availability
function checkToolInstalled(t) {
  const home = userHome;
  if (t.id === 'foundry') {
    return fs.existsSync('/usr/local/bin/forge') || fs.existsSync(path.join(home, '.foundry/bin/forge')) || fs.existsSync('/usr/local/bin/foundryup');
  }
  if (t.id === 'solana') {
    return fs.existsSync('/usr/local/bin/solana') || fs.existsSync(path.join(home, '.local/share/solana/install/active_release/bin/solana'));
  }
  if (t.id === 'docker') {
    return fs.existsSync('/usr/bin/docker') || fs.existsSync('/usr/local/bin/docker') || fs.existsSync('/usr/bin/podman');
  }
  if (t.id === 'rustc') {
    return fs.existsSync('/usr/bin/rustc') || fs.existsSync('/usr/local/bin/rustc') || fs.existsSync(path.join(home, '.cargo/bin/rustc'));
  }
  if (t.id === 'cargo') {
    return fs.existsSync('/usr/bin/cargo') || fs.existsSync('/usr/local/bin/cargo') || fs.existsSync(path.join(home, '.cargo/bin/cargo'));
  }
  if (t.id === 'go') {
    return fs.existsSync('/usr/bin/go') || fs.existsSync('/usr/local/go/bin/go') || fs.existsSync(path.join(home, 'go/bin/go')) || fs.existsSync('/usr/local/bin/go');
  }
  if (t.id === 'clang') {
    return fs.existsSync('/usr/bin/clang') || fs.existsSync('/usr/bin/clang-19') || fs.existsSync('/usr/bin/clang-16');
  }
  if (t.id === 'bat') {
    return fs.existsSync('/usr/local/bin/bat') || fs.existsSync('/usr/bin/bat') || fs.existsSync('/usr/bin/batcat');
  }
  if (t.id === 'fd') {
    return fs.existsSync('/usr/local/bin/fd') || fs.existsSync('/usr/bin/fd') || fs.existsSync('/usr/bin/fdfind');
  }
  if (t.id === 'signal') {
    return fs.existsSync('/opt/Signal/signal-desktop') || fs.existsSync('/usr/local/bin/signal-desktop');
  }
  if (t.id === 'simplex') {
    return fs.existsSync('/usr/local/bin/simplex-chat') || fs.existsSync('/usr/local/bin/simplex-desktop');
  }
  if (t.id === 'element') {
    return fs.existsSync('/opt/Element/element-desktop') || fs.existsSync('/usr/local/bin/element-desktop');
  }
  if (t.id === 'metasploit') {
    return fs.existsSync('/usr/bin/msfconsole') || fs.existsSync('/opt/metasploit-framework/bin/msfconsole');
  }

  // General binary check
  const firstWord = t.cmd.split(' ')[0];
  if (firstWord.startsWith('python3') || firstWord.startsWith('ls')) {
    // Treat python imports/files
    if (t.pkg && t.type === 'pip') {
      const mod = t.pkg.split(',')[0];
      return fs.existsSync(`/opt/zothos-ai-env/lib/python3.11/site-packages/${mod}`) ||
             fs.existsSync(`/usr/local/lib/python3.11/dist-packages/${mod}`);
    }
  }

  // Fast check across extraPaths and PATH
  const candidates = fullPath.split(':');
  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, firstWord))) {
      return true;
    }
  }
  return false;
}

// ── IPC: Get Tools & Status ──────────────────────────────────────────
ipcMain.on('get-tools', (event) => {
  const results = TOOLS_DATABASE.map(t => ({
    ...t,
    installed: checkToolInstalled(t)
  }));
  event.reply('tools-list', results);
});

// ── IPC: Get Bundles ──────────────────────────────────────────────────
ipcMain.on('get-bundles', (event) => {
  const snap = {};
  for (const [id, b] of Object.entries(BUNDLES)) {
    const bundleTools = TOOLS_DATABASE.filter(t => b.toolIds.includes(t.id));
    const installedCount = bundleTools.filter(t => checkToolInstalled(t)).length;
    snap[id] = {
      id,
      label: b.label,
      tag: b.tag,
      icon: b.icon,
      desc: b.desc,
      count: bundleTools.length,
      installedCount,
      installed: installedCount === bundleTools.length,
      tools: bundleTools.map(t => t.name)
    };
  }
  event.reply('bundles-list', snap);
});

// ── IPC: Launch Tool ──────────────────────────────────────────────────
ipcMain.on('launch-tool', (_event, toolCmd) => {
  const isGui = [
    'zoth-studio', 'zoth-agent-hud', 'zoth-ghost-gui', 'zoth-mode', 'zoth-mcp',
    'burpsuite', 'caido', 'wireshark', 'ghidra', 'obsidian', 'blender',
    'zoth-docs', 'zoth-feedback', 'zoth-soundtrack', 'signal-desktop',
    'simplex-desktop', 'element-desktop', 'tor-browser', 'gimp', 'inkscape',
    'obs', 'obs-studio', 'open-webui', 'comfyui'
  ].some(g => toolCmd.includes(g));

  if (isGui) {
    exec(`nohup ${toolCmd} >/dev/null 2>&1 &`, { env: { ...process.env, PATH: fullPath } });
  } else {
    exec(`konsole --title '${toolCmd.toUpperCase()} // ZOTHOS' -e bash -c '${toolCmd}; exec bash'`, { env: { ...process.env, PATH: fullPath } });
  }
});

// ── IPC: Fix Permissions & Environment ────────────────────────────────
ipcMain.on('fix-permissions', (event) => {
  event.reply('install-log', { text: '[*] Running ZothOS Permissions & Symlink Repair Subsystem...\n' });
  
  const fixScript = `
    sudo chown -R ${os.userInfo().username}:${os.userInfo().username} /opt/zothos-ai-env 2>/dev/null || true
    sudo ln -sf /usr/bin/batcat /usr/local/bin/bat 2>/dev/null || true
    sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd 2>/dev/null || true
    sudo chmod 777 /tmp 2>/dev/null || true
    sudo chmod +x /usr/local/bin/zoth* 2>/dev/null || true
    echo "[✓] Environment permissions and system symlinks successfully repaired!"
  `;

  const proc = spawn('bash', ['-c', fixScript], { env: { ...process.env, PATH: fullPath } });
  proc.stdout.on('data', d => event.reply('install-log', { text: d.toString() }));
  proc.stderr.on('data', d => event.reply('install-log', { text: d.toString() }));
  proc.on('close', code => {
    event.reply('install-log', { text: '\n[✓] Repair complete.\n' });
    event.reply('fix-complete', { success: code === 0 });
  });
});

// Helper: Build resilient recipe commands
function getRecipeScript(tool) {
  const p = tool.pkg;
  if (tool.type === 'apt') {
    return `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" ${p.replace(/,/g, ' ')}`;
  }
  if (tool.type === 'pip') {
    const pkgs = p.replace(/,/g, ' ');
    return `/opt/zothos-ai-env/bin/pip install ${pkgs} 2>/dev/null || sudo pip3 install --break-system-packages ${pkgs}`;
  }
  if (tool.type === 'npm') {
    return `sudo npm install -g --unsafe-perm=true ${p}`;
  }
  if (tool.type.startsWith('custom:')) {
    const target = tool.type.substring(7);
    if (target === 'solana') {
      return `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)" && if [ -d "$HOME/.local/share/solana/install/active_release/bin" ]; then sudo ln -sf "$HOME/.local/share/solana/install/active_release/bin/"* /usr/local/bin/ 2>/dev/null || true; fi`;
    }
    if (target === 'foundry') {
      return `curl -L https://foundry.paradigm.xyz | bash && if [ -x "$HOME/.foundry/bin/foundryup" ]; then "$HOME/.foundry/bin/foundryup"; fi && if [ -d "$HOME/.foundry/bin" ]; then sudo ln -sf "$HOME/.foundry/bin/"* /usr/local/bin/ 2>/dev/null || true; fi`;
    }
    if (target === 'caido') {
      return `curl -fsSL -L -o /tmp/caido.tar.gz https://caido.download/releases/v0.45.1/caido-cli-v0.45.1-linux-x86_64.tar.gz && sudo tar -xzf /tmp/caido.tar.gz -C /usr/local/bin/ caido 2>/dev/null && rm -f /tmp/caido.tar.gz`;
    }
    if (target === 'metasploit') {
      return `curl -fsSL https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > /tmp/msfinstall && chmod +x /tmp/msfinstall && sudo /tmp/msfinstall && rm -f /tmp/msfinstall`;
    }
    if (target === 'starship') {
      return `curl -sS https://starship.rs/install.sh | sh -s -- -y`;
    }
    if (target === 'uv') {
      return `curl -LsSf https://astral.sh/uv/install.sh | sh || sudo pip3 install --break-system-packages uv`;
    }
    if (target === 'tailscale') {
      return `curl -fsSL https://tailscale.com/install.sh | sh`;
    }
    if (target === 'obsidian') {
      return `curl -fsSL -L -o /tmp/obsidian.deb "https://github.com/obsidianmd/obsidian-releases/releases/download/v1.6.7/obsidian_1.6.7_amd64.deb" && sudo dpkg -i /tmp/obsidian.deb 2>/dev/null || sudo apt-get -f install -y && rm -f /tmp/obsidian.deb`;
    }
    if (target === 'ipfs') {
      return `curl -fsSL https://dist.ipfs.tech/kubo/v0.26.0/kubo_v0.26.0_linux-amd64.tar.gz -o /tmp/kubo.tar.gz && tar -xzf /tmp/kubo.tar.gz -C /tmp && sudo /tmp/kubo/install.sh 2>/dev/null && rm -rf /tmp/kubo*`;
    }
    if (target === 'slither') {
      return `/opt/zothos-ai-env/bin/pip install slither-analyzer solc-select && if [ -f /opt/zothos-ai-env/bin/slither ]; then sudo ln -sf /opt/zothos-ai-env/bin/slither /usr/local/bin/slither; fi`;
    }
    if (target === 'mythril') {
      return `/opt/zothos-ai-env/bin/pip install mythril && if [ -f /opt/zothos-ai-env/bin/myth ]; then sudo ln -sf /opt/zothos-ai-env/bin/myth /usr/local/bin/myth; fi`;
    }
    if (target === 'rustscan') {
      return `sudo apt-get install -y rustscan 2>/dev/null || cargo install rustscan`;
    }
    if (target === 'cloudflared') {
      return `curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i /tmp/cloudflared.deb && rm -f /tmp/cloudflared.deb`;
    }
  }
  return `sudo apt-get install -y ${tool.pkg} 2>/dev/null || true`;
}

// ── IPC: Install Single Tool ──────────────────────────────────────────
ipcMain.on('install-tool', (event, toolId) => {
  const tool = TOOLS_DATABASE.find(t => t.id === toolId);
  if (!tool) {
    event.reply('install-error', { msg: `Tool ${toolId} not found in registry.` });
    return;
  }

  event.reply('install-start', {
    label: tool.name,
    total: 1
  });

  const recipe = getRecipeScript(tool);
  const scriptContent = `#!/usr/bin/env bash
set -u
echo -e "\\e[1;36m[+] Initiating installation for ${tool.name}...\\e[0m"
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do
    echo -e "\\e[1;33m[*] Waiting for package manager lock to clear...\\e[0m"
    sleep 2
done
${recipe}
echo -e "\\e[1;32m[✓] Finished recipe for ${tool.name}.\\e[0m"
sudo ln -sf /usr/bin/batcat /usr/local/bin/bat 2>/dev/null || true
sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd 2>/dev/null || true
`;

  const tmpScript = `/tmp/zoth_inst_${tool.id}_${Date.now()}.sh`;
  fs.writeFileSync(tmpScript, scriptContent, { mode: 0o755 });

  const proc = spawn('bash', [tmpScript], { env: { ...process.env, PATH: fullPath } });
  proc.stdout.on('data', d => event.reply('install-log', { text: d.toString() }));
  proc.stderr.on('data', d => event.reply('install-log', { text: d.toString() }));
  proc.on('close', code => {
    try { fs.unlinkSync(tmpScript); } catch (_) {}
    event.reply('install-done', {
      toolId: tool.id,
      success: code === 0
    });
  });
});

// ── IPC: Batch Install All Missing (Unattended One-Click) ─────────────
ipcMain.on('install-all', (event, filter) => {
  // Determine which tools to install
  let targetTools = TOOLS_DATABASE;
  let targetLabel = 'ALL MISSING ARSENAL';

  if (filter && filter.startsWith('domain:')) {
    const d = filter.substring(7);
    targetTools = TOOLS_DATABASE.filter(t => t.domain === d);
    targetLabel = `DOMAIN: ${d.toUpperCase()}`;
  } else if (filter && filter.startsWith('bundle:')) {
    const bId = filter.substring(7);
    const bundle = BUNDLES[bId];
    if (bundle) {
      targetTools = TOOLS_DATABASE.filter(t => bundle.toolIds.includes(t.id));
      targetLabel = `BUNDLE: ${bundle.label}`;
    }
  }

  // Filter only those not currently installed
  const missing = targetTools.filter(t => !checkToolInstalled(t));

  if (missing.length === 0) {
    event.reply('install-start', { label: targetLabel, total: 0 });
    event.reply('install-log', { text: '[✓] All tools in this selection are already installed and fully operational!\n' });
    event.reply('install-done', { success: true, count: 0 });
    return;
  }

  event.reply('install-start', {
    label: targetLabel,
    total: missing.length
  });

  // Construct batch script
  const scriptLines = [
    '#!/usr/bin/env bash',
    'set -u',
    `echo -e "\\e[1;36m[+] ZOTHOS UNATTENDED BATCH PROVISIONER: ${targetLabel} (${missing.length} tools)...\\e[0m"`,
    'echo -e "\\e[1;33m[*] Checking package manager lock...\\e[0m"',
    'while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || sudo fuser /var/lib/apt/lists/lock >/dev/null 2>&1; do',
    '    echo -e "\\e[1;33m[*] Waiting for package lock...\\e[0m"',
    '    sleep 2',
    'done',
    'echo -e "\\e[1;33m[*] Ensuring AI Virtualenv and directory permissions...\\e[0m"',
    `sudo chown -R ${os.userInfo().username}:${os.userInfo().username} /opt/zothos-ai-env 2>/dev/null || true`,
    'echo -e "\\e[1;36m[*] Synchronizing package index once up-front...\\e[0m"',
    'sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq || true',
    'echo -e "\\e[1;32m[✓] Package index ready. Beginning sequential provisioning...\\e[0m\\n"',
    `TOTAL=${missing.length}`,
    'SUCCESS=0',
    'SKIPPED=0'
  ];

  missing.forEach((tool, idx) => {
    const num = idx + 1;
    const recipe = getRecipeScript(tool);
    scriptLines.push(
      `NUM=${num}`,
      `PCT=$((NUM * 100 / TOTAL))`,
      `echo -e "PROGRESS:$NUM:$TOTAL:$PCT:${tool.id}"`,
      `echo -e "\\e[1;33m---> [$NUM/$TOTAL] Provisioning ${tool.name} (${tool.pkg})...\\e[0m"`,
      `if ${recipe} 2>&1; then`,
      `    echo -e "\\e[1;32m[✓] Successfully provisioned ${tool.name}\\e[0m\\n"`,
      '    SUCCESS=$((SUCCESS + 1))',
      'else',
      `    echo -e "\\e[1;31m[!] Warning: ${tool.name} encountered errors\\e[0m\\n"`,
      '    SKIPPED=$((SKIPPED + 1))',
      'fi'
    );
  });

  scriptLines.push(
    'echo -e "PROGRESS_FINAL:$SUCCESS:$SKIPPED:$TOTAL"',
    'sudo ln -sf /usr/bin/batcat /usr/local/bin/bat 2>/dev/null || true',
    'sudo ln -sf /usr/bin/fdfind /usr/local/bin/fd 2>/dev/null || true',
    'sudo update-desktop-database 2>/dev/null || true',
    'echo -e "\\e[1;32m==== ✦ BATCH PROVISIONING COMPLETE: $SUCCESS installed, $SKIPPED skipped ✦ ====\\e[0m"'
  );

  const scriptContent = scriptLines.join('\n');
  const tmpScript = `/tmp/zoth_batch_${Date.now()}.sh`;
  fs.writeFileSync(tmpScript, scriptContent, { mode: 0o755 });

  const proc = spawn('bash', [tmpScript], { env: { ...process.env, PATH: fullPath } });

  proc.stdout.on('data', d => event.reply('install-log', { text: d.toString() }));
  proc.stderr.on('data', d => event.reply('install-log', { text: d.toString() }));

  proc.on('close', (code) => {
    try { fs.unlinkSync(tmpScript); } catch (_) {}
    event.reply('install-done', {
      success: true,
      code
    });
  });
});
