# ARCHITECTURAL BLUEPRINT: MODEL CONTEXT PROTOCOL (MCP) & OPEN-SOURCE AI TOOLING FOR ZOTHOS v3.2.0

**Target System**: ZothOS v3.2.0 (Debian 13 Trixie / Kali Rolling / Parrot OS Security Base, KDE Plasma 6.3 Wayland, Linux 6.12 Kernel)  
**Security Architecture**: Tri-Ring Security Hierarchy (`RING_0_SOVEREIGN`, `RING_1_SYSADMIN`, `RING_2_TOOLMASTER`)  
**Core Purpose**: Seamless integration of frontier local LLM runtimes, multi-agent orchestration frameworks, offensive/defensive cybersecurity MCPs, and persistent knowledge substrates.

---

## 1. ESSENTIAL MCP SERVERS SPECIFICATION

### 1.1 Filesystem, Git & Bash/Terminal Execution
MCP servers in this tier bridge raw system access to agent runtimes, governed by ZothOS security rings.

1. **Official Filesystem Server (`@modelcontextprotocol/server-filesystem`)**
   - **Role**: Sandboxed workspace file operations (read, write, list, search, diff).
   - **Sandbox Scope**: Enforced multi-directory boundaries: `${ZOTH_HOME}`, `/opt`, `/etc/zothos`, `/tmp`, and `/usr/share/zothos`.
   - **Security Ring**: `RING_1_SYSADMIN` (ring level 1).
   - **Transport**: `stdio` via Node.js (`npx -y @modelcontextprotocol/server-filesystem@2026.8.31`).

2. **Official Git Server (`mcp-server-git`)**
   - **Role**: AST/VCS repository intelligence. Exposes git operations: status, diff, log, branch management, commit generation, blame analysis.
   - **Security Ring**: `RING_2_TOOLMASTER` (ring level 2).
   - **Transport**: `stdio` via Python (`uvx mcp-server-git`).

3. **Bash / Terminal Execution Server (`bash-mcp` & `tumf/mcp-shell-server`)**
   - **Role**: Secure terminal execution engine. Provides interactive PTY sessions, command timeout enforcement, exit code verification, and background process spawning.
   - **Security Safeguards**:
     - Strict execution sandbox anchored in `$HOME`.
     - Environment scrubbing: Strips sensitive shell tokens unless passed through Zoth Vault (`zoth-vault`).
     - Audit Trail: All commands, arguments, timestamps, and caller agent IDs are streamed to `/var/log/zothos/agent-exec.log`.
     - Dangerous command denylist (`rm -rf /`, `mkfs`, fork bombs, unauthorized raw disk writes).
   - **Security Ring**: `RING_1_SYSADMIN` (ring level 1).
   - **Transport**: `stdio` via Node.js (`npx -y bash-mcp`) or Python (`uvx mcp-server-shell-exec`).

---

### 1.2 Network & Offensive Security MCPs
Tailored for Kali and Parrot OS integration within ZothOS.

1. **Wireshark / PCAP Packet Sniffer (`wireshark-mcp` by bx33661 / `WireMCP`)**
   - **Role**: Deep packet inspection, pcap/pcapng forensic parsing, TCP stream following, protocol hierarchy aggregation, and DNS tunneling anomaly detection.
   - **Underlying Engine**: Local `tshark` / `dumpcap` binary with elevated `CAP_NET_RAW` / `CAP_NET_ADMIN` Linux capabilities.
   - **Features**: Dissects `.pcap` files, extracts HTTP/TLS handshakes, generates conversation matrices, and alerts on network anomalies directly to agent context.
   - **Security Ring**: `RING_1_SYSADMIN`.
   - **Transport**: `stdio` via Python (`uvx wireshark-mcp` or `/opt/zothos-ai-env/bin/wireshark-mcp`).

2. **Shodan OSINT Server (`@burtthecoder/mcp-shodan` & `vorotaai/shodan-mcp`)**
   - **Role**: Internet attack surface reconnaissance, CVE lookup, banner grab parsing, and exposed service discovery.
   - **Hybrid Capability**: Supports zero-key public queries via Shodan InternetDB API (free host, open port, tag, and CVE lookups) plus authenticated deep reconnaissance when `SHODAN_API_KEY` is provisioned.
   - **Security Ring**: `RING_2_TOOLMASTER`.
   - **Transport**: `stdio` via Node.js (`npx -y @burtthecoder/mcp-shodan`) or Python (`uvx shodan-mcp`).

3. **Nmap Parser & Scanner (`0xPratikPatil/NmapMCP` / `mohdhaji87/Nmap-MCP-Server`)**
   - **Role**: Structured network scanning, service fingerprinter, NSE (Nmap Scripting Engine) vulnerability auditing, and XML-to-JSON report transpilation.
   - **Integration**: Converts complex Nmap raw output into structured JSON trees so agents can inspect open ports, SSL certificates, software banners, and script vulnerabilities.
   - **Security Ring**: `RING_1_SYSADMIN`.
   - **Transport**: `stdio` via Python (`uvx nmap-mcp-server` or `python3 /opt/zothos/tools/nmap_mcp.py`).

4. **Web Security Proxies: Caido & Burp Suite Bridges**
   - **Caido MCP Server (`c0tton-fluff/caido-mcp-server`)**:
     - Connects to local Caido daemon on `http://127.0.0.1:8080`.
     - Exposes HTTPQL query filters, request history, Replay buffer manipulation, Automate fuzzing workflows, and sitemap exploration.
     - Transport: `stdio` (compiled Go binary `/usr/local/bin/caido-mcp-server`).
   - **Burp Suite MCP Server (`PortSwigger/mcp-server` & `c0tton-fluff/burp-mcp-server`)**:
     - Connects to Burp Suite Pro/Community via PortSwigger's native BApp extension exposing a local Server-Sent Events (SSE) endpoint at `http://127.0.0.1:9876/sse` (or stdio bridge).
     - Allows agent to query proxy history, send requests to Repeater/Intruder, poll Collaborator out-of-band interactions, and execute automated scans within user-defined target scope.
   - **Security Ring**: `RING_1_SYSADMIN`.

---

### 1.3 Database MCPs
1. **SQLite MCP (`mcp-server-sqlite`)**:
   - Manages local SQLite databases (default: `~/.zothos/mcp/knowledge.db`). Supports full-text search (FTS5), schema reflection, and parameterized SQL queries.
   - Security Ring: `RING_1_SYSADMIN`. Command: `uvx mcp-server-sqlite --db-path ~/.zothos/mcp/knowledge.db`.
2. **DuckDB MCP (`@duckdb/mcp-server` / `duckdb_mcp`)**:
   - High-performance embedded OLAP engine. Designed for columnar querying of large Parquet, CSV, and Arrow files with zero server overhead.
   - Sandbox DB: `${ZOTH_HOME}/.zothos/mcp/analytics.duckdb`.
   - Security Ring: `RING_1_SYSADMIN`. Command: `npx -y @duckdb/mcp-server --db-path ${ZOTH_HOME}/.zothos/mcp/analytics.duckdb`.
3. **PostgreSQL MCP (`@modelcontextprotocol/server-postgres`)**:
   - Binds local or remote Postgres databases (`postgresql://postgres@localhost:5432/zothos`).
   - Read-only guard mode by default with schema inspection and parameterized query execution.
   - Security Ring: `RING_1_SYSADMIN`. Command: `npx -y @modelcontextprotocol/server-postgres@0.6.2 <connection-url>`.

---

### 1.4 Browser & Fetch MCPs
1. **Playwright MCP (`@playwright/mcp`)**: Multi-browser automation (Chromium, Firefox, WebKit), network traffic interception, screenshot comparison, and mobile viewport emulation. Command: `npx -y @playwright/mcp@0.0.83 --browser chrome`.
2. **Chrome DevTools Protocol MCP (`chrome-devtools-mcp`)**: Headless isolated Chrome instance (`/opt/google/chrome/chrome`) exposing CDP primitives with `--categoryExperimentalWebmcp`. Intercepts console logs, network waterfalls, performance profiles, and DOM trees without touching the user's active browsing session.
3. **Puppeteer MCP (`@modelcontextprotocol/server-puppeteer`)**: Lightweight headless Chromium scraping, form filling, and DOM evaluation.
4. **Fetch MCP (`mcp-server-fetch`)**: Fast HTTP/HTTPS content extraction with HTML-to-Markdown conversion and strict robots.txt adherence.

---

### 1.5 Memory & Knowledge Graph MCPs
1. **Official Memory MCP (`@modelcontextprotocol/server-memory`)**: Local entity-relation-observation knowledge graph persisted as JSON.
2. **Neuro-Memory Daemon (`neuro-memory`)**: ZothOS native biological-fidelity memory substrate implementing STDP (Spike-Timing-Dependent Plasticity), 3-factor neuromodulation (dopamine, serotonin, noradrenaline), and spreading activation.
3. **Graphiti MCP (`getzep/graphiti` / `graphiti-memory`)**: Temporal knowledge graph engine for long-term agent memory. Operates with Neo4j/FalkorDB backends to maintain temporal entity state changes over time.
4. **Mem0 MCP (`mem0ai/mem0-mcp`)**: Multi-tier memory layer (user, session, agent) with local vector embeddings via Qdrant/Chroma and fast semantic recall.

---

## 2. TOP OPEN-SOURCE AI CLI & AGENT TOOLS

### 2.1 Local LLM Runners & Routers
| Tool | Core Technology | Primary Role in ZothOS | Daemon / Port |
| :--- | :--- | :--- | :--- |
| **Ollama** | Go / llama.cpp | Primary offline LLM engine for GGUF models (`qwen2.5-coder`, `deepseek-r1`, `llama3.3`). Auto-detects NVIDIA CUDA and Intel Arc. | `ollama.service` on `127.0.0.1:11434` |
| **vLLM** | Python / C++ PagedAttention | High-throughput, low-latency concurrent inference server for continuous batching of agent swarms. Ideal for GPU workstations. | CLI wrapper `/usr/local/bin/vllm` (`127.0.0.1:8000`) |
| **llama.cpp** | Pure C/C++ | Ultra-efficient native runtime. Ships `llama-server` and `llama-cli` for CPU-only systems and low-VRAM appliances. | Port `8080` / CLI |
| **LiteLLM Proxy** | Python / FastAPI | Universal AI gateway. Unified OpenAI-compatible reverse proxy multiplexing local runtimes (Ollama/vLLM) and cloud APIs (Anthropic, OpenAI, xAI). Features load-balancing, fallbacks, rate-limiting, and cost tracking. | `litellm` wrapper on `127.0.0.1:4000` |

---

### 2.2 Agent Orchestration Frameworks
1. **Aider (`aider-chat`)**:
   - Terminal-first pair programming agent with git auto-commit, AST repo-mapping, and architect dual-reasoning mode.
   - CLI: `/usr/local/bin/aider` (auto-bootstraps via `/opt/zothos-ai-env`).
2. **Claude Code (`@anthropic-ai/claude-code`)**:
   - Anthropic's agentic terminal CLI. Native subagent orchestration, tool routing, and automated MCP config ingestion.
   - CLI: `/usr/local/bin/claude` (auto-bootstraps via npm).
3. **Goose (`aaif-goose/goose` - Linux Foundation AAIF / Block)**:
   - Extensible developer agent built specifically around Model Context Protocol. Supports autonomous tool execution, shell interaction, and multi-LLM configuration.
   - CLI: `/usr/local/bin/goose` (native binary or curl installer).
4. **OpenCode (`opencode-ai`)**:
   - Sovereign open-source terminal coding assistant with multi-file reasoning and AST refactoring.
   - CLI: `/usr/local/bin/opencode`.
5. **FastMCP (`PrefectHQ/fastmcp`)**:
   - The modern Python framework for authoring MCP servers. Fast decorators (`@mcp.tool`, `@mcp.resource`, `@mcp.prompt`), automatic Pydantic input validation, SSE and stdio server generation.
   - CLI: `/usr/local/bin/fastmcp`.

---

### 2.3 AI Security & Auditing Tools
1. **Garak (`garak`)**:
   - The "Nmap for LLMs". Automated vulnerability scanner and red-teaming tool testing prompt injection, hallucination, data leakage, jailbreaks, and toxic generation.
   - CLI: `/usr/local/bin/garak`.
2. **Vigil (`deadbits/vigil-llm`)**:
   - Prompt injection and jailbreak detector. Multi-stage analysis pipeline using YARA rule heuristics, vector similarity scanning against known attack vectors, and transformer-based classifiers.
   - Can run as a local daemon or pre-execution filter in front of MCP commands.
3. **NeMo Guardrails (`nemoguardrails`)**:
   - NVIDIA open-source programmable safety framework using Colang rules. Intercepts input, dialog, and output streams to enforce strict business logic, topic constraints, and PII redaction.
4. **PyRIT (Python Risk Identification Tool by Microsoft)**:
   - Red-teaming framework for automating attack loops against AI systems.

---

## 3. ZOTHOS INTEGRATION SPECIFICATIONS

### 3.1 Registry Entries for `/etc/zothos/mcp-servers.json`
Below are the exact production-ready JSON definitions to append to `/etc/zothos/mcp-servers.json`:

```json
{
  "mcpServers": {
    "bash": {
      "command": "npx",
      "args": ["-y", "bash-mcp"],
      "description": "ZothOS Interactive Bash Execution Engine. Sandboxed shell execution with audit logging.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_1_SYSADMIN",
      "ring_level": 1,
      "sandbox": "${ZOTH_HOME}",
      "fallbackHandler": "/bin/bash",
      "timeout": 120,
      "alwaysAllow": []
    },
    "wireshark": {
      "command": "uvx",
      "args": ["wireshark-mcp"],
      "description": "Wireshark & TShark Network Packet Analysis MCP. PCAP dissection, stream analysis, and DNS tunneling detection.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_1_SYSADMIN",
      "ring_level": 1,
      "sandbox": "/tmp",
      "fallbackHandler": "tshark -r",
      "timeout": 180,
      "alwaysAllow": []
    },
    "shodan": {
      "command": "npx",
      "args": ["-y", "@burtthecoder/mcp-shodan"],
      "env": {
        "SHODAN_API_KEY": ""
      },
      "description": "Shodan Internet Intelligence & OSINT MCP. IP lookups, open ports, CVE correlation, and DNS queries.",
      "offline": false,
      "enabled": false,
      "securityRing": "RING_2_TOOLMASTER",
      "ring_level": 2,
      "sandbox": "/tmp",
      "fallbackHandler": "shodan info",
      "timeout": 60,
      "alwaysAllow": []
    },
    "nmap": {
      "command": "python3",
      "args": ["-m", "nmap_mcp"],
      "description": "Nmap Network Scanner & XML Parser MCP. Service fingerprinter and NSE vulnerability auditor.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_1_SYSADMIN",
      "ring_level": 1,
      "sandbox": "/tmp",
      "fallbackHandler": "nmap",
      "timeout": 300,
      "alwaysAllow": []
    },
    "caido": {
      "command": "caido-mcp-server",
      "args": ["--url", "http://127.0.0.1:8080"],
      "description": "Caido Web Security Proxy MCP. HTTPQL search, replay history, sitemap exploration, and tamper testing.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_1_SYSADMIN",
      "ring_level": 1,
      "sandbox": "${ZOTH_HOME}/.local/share/caido",
      "fallbackHandler": "curl -s http://127.0.0.1:8080",
      "timeout": 120,
      "alwaysAllow": []
    },
    "burp-suite": {
      "command": "npx",
      "args": ["-y", "mcp-remote@0.14.3", "http://127.0.0.1:9876/sse"],
      "description": "PortSwigger Burp Suite Pro/Community MCP Bridge. Live proxy history, repeater triggers, and collaborator analysis.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_1_SYSADMIN",
      "ring_level": 1,
      "sandbox": "/tmp",
      "fallbackHandler": "curl -s http://127.0.0.1:9876",
      "timeout": 120,
      "alwaysAllow": []
    },
    "graphiti-memory": {
      "command": "uvx",
      "args": ["graphiti-memory"],
      "env": {
        "NEO4J_URI": "bolt://127.0.0.1:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": ""
      },
      "description": "Graphiti Temporal Knowledge Graph MCP. Episodic memory, entity resolution, and temporal graph traversals.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_0_SOVEREIGN",
      "ring_level": 0,
      "sandbox": "${ZOTH_HOME}/.zothos/mcp",
      "fallbackHandler": "true",
      "timeout": 90,
      "alwaysAllow": []
    },
    "mem0": {
      "command": "uvx",
      "args": ["mem0-mcp"],
      "env": {
        "MEM0_DIR": "${ZOTH_HOME}/.zothos/data/mem0"
      },
      "description": "Mem0 Scalable Multi-Tier Memory Layer MCP. User, session, and agent persistent memory indexing.",
      "offline": true,
      "enabled": false,
      "securityRing": "RING_0_SOVEREIGN",
      "ring_level": 0,
      "sandbox": "${ZOTH_HOME}/.zothos/data/mem0",
      "fallbackHandler": "true",
      "timeout": 60,
      "alwaysAllow": []
    }
  }
}
```

---

### 3.2 CLI Wrappers in `/usr/local/bin/`

#### 1. Goose CLI Wrapper (`/usr/local/bin/goose`)
Follows standard ZothOS self-bootstrapping pattern:
```bash
#!/usr/bin/env bash
# ==============================================================================
#  Goose - AAIF / Block Autonomous AI Agent CLI Harness
# ==============================================================================
set -euo pipefail

if ! command -v goose >/dev/null 2>&1 && [[ ! -f "${HOME}/.local/bin/goose" ]]; then
    echo -e "\e[38;2;255;215;0m[*] Provisioning AAIF Goose AI Agent CLI...\e[0m"
    mkdir -p "${HOME}/.local/bin"
    curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | bash
fi

if [[ -f "${HOME}/.local/bin/goose" ]]; then
    exec "${HOME}/.local/bin/goose" "$@"
elif command -v goose >/dev/null 2>&1; then
    exec goose "$@"
else
    echo -e "\e[38;2;255;51;85m[!] Error: Goose installation failed.\e[0m"
    exit 1
fi
```

#### 2. Vigil Prompt Injection Scanner Wrapper (`/usr/local/bin/vigil`)
```bash
#!/usr/bin/env bash
# ==============================================================================
#  Vigil - LLM Prompt Injection & Jailbreak Scanner
# ==============================================================================
set -euo pipefail

if ! command -v vigil >/dev/null 2>&1 && [[ ! -f /opt/zothos-ai-env/bin/vigil ]]; then
    echo -e "\e[38;2;0;255;157m[*] Provisioning Vigil Prompt Injection Scanner...\e[0m"
    mkdir -p /opt/zothos-ai-env
    python3 -m venv /opt/zothos-ai-env --system-site-packages 2>/dev/null || true
    /opt/zothos-ai-env/bin/pip install --upgrade vigil-llm
fi

if [[ -f /opt/zothos-ai-env/bin/vigil ]]; then
    exec /opt/zothos-ai-env/bin/vigil "$@"
elif command -v vigil >/dev/null 2>&1; then
    exec vigil "$@"
else
    echo -e "\e[38;2;255;51;85m[!] Error: Vigil launch failed.\e[0m"
    exit 1
fi
```

#### 3. Zoth AI Stack Supervisor (`/usr/local/bin/zoth-ai-stack`)
Unifies Ollama, vLLM, and LiteLLM:
```bash
#!/usr/bin/env bash
# ==============================================================================
#  Zoth AI Stack Supervisor: Ollama + LiteLLM + vLLM
# ==============================================================================
set -euo pipefail

case "${1:-status}" in
    start)
        echo -e "\e[1;32m[+] Starting ZothOS AI Runtimes...\e[0m"
        sudo systemctl start ollama.service 2>/dev/null || ollama serve >/dev/null 2>&1 &
        if [[ -x /usr/local/bin/litellm ]]; then
            nohup /usr/local/bin/litellm --port 4000 --config /etc/zothos/litellm.yaml >/var/log/zothos/litellm.log 2>&1 &
        fi
        echo -e "\e[1;32m[✓] Ollama (:11434) and LiteLLM Gateway (:4000) active.\e[0m"
        ;;
    stop)
        echo -e "\e[1;31m[-] Halting AI Stack...\e[0m"
        sudo systemctl stop ollama.service 2>/dev/null || pkill -f "ollama serve" || true
        pkill -f "litellm" || true
        echo -e "\e[1;32m[✓] AI services terminated.\e[0m"
        ;;
    status)
        echo -e "\e[1;36m[i] ZothOS AI Stack Status:\e[0m"
        curl -s http://127.0.0.1:11434/api/tags >/dev/null && echo "  Ollama (11434):   ONLINE" || echo "  Ollama (11434):   OFFLINE"
        curl -s http://127.0.0.1:4000/health >/dev/null && echo "  LiteLLM (4000):   ONLINE" || echo "  LiteLLM (4000):   OFFLINE"
        ;;
    *)
        echo "Usage: zoth-ai-stack {start|stop|status}"
        exit 1
        ;;
esac
```

---

### 3.3 System Dependencies & Package Recommendations

#### A. Debian 13 (Trixie) / Kali / Parrot Native APT Packages
Add to `/etc/zothos/manifests/40-security.list.chroot` & `00-core.list.chroot`:
```bash
# Network forensics & packet capture
tshark
wireshark-common
libcap2-bin

# Network reconnaissance & scanning
nmap
ncat
socat
tcpdump

# Embedded & analytical databases
sqlite3
libsqlite3-dev
duckdb

# Web security & proxy essentials
ca-certificates
curl
wget
jq

# Runtimes & compilation
python3-pip
python3-venv
pipx
golang-go
nodejs
npm
```

#### B. Linux Permissions & Capabilities Configuration
To permit non-root packet sniffing via `wireshark-mcp`:
```bash
# Setcap on dumpcap during chroot build or first boot:
sudo groupadd -r wireshark || true
sudo usermod -aG wireshark zoth
sudo chgrp wireshark /usr/bin/dumpcap
sudo chmod 750 /usr/bin/dumpcap
sudo setcap 'CAP_NET_RAW+eip CAP_NET_ADMIN+eip' /usr/bin/dumpcap
```

#### C. Python Ecosystem Packages (`/opt/zothos-ai-env`)
Provisioned via `zoth-arsenal-sync`:
```bash
# MCP Core & Tooling
fastmcp
mcp
mcp-server-git
mcp-server-sqlite
mcp-server-fetch
wireshark-mcp
graphiti-core
mem0ai

# Local Inference & Routing
litellm[proxy]
llama-cpp-python
vllm

# AI Security, Red-Teaming & Guardrails
garak
vigil-llm
nemoguardrails
pyrit
promptfoo

# Agent Orchestrators
aider-chat
crewai
langgraph
```

#### D. Global Node.js Packages (`npm install -g`)
```bash
@modelcontextprotocol/server-filesystem
@modelcontextprotocol/server-memory
@modelcontextprotocol/server-puppeteer
@modelcontextprotocol/server-postgres
@playwright/mcp
chrome-devtools-mcp
@duckdb/mcp-server
bash-mcp
@burtthecoder/mcp-shodan
@anthropic-ai/claude-code
```

---

### 3.4 Operational Port & Security Matrix for ZothOS
- **Port 11434**: Ollama LLM Runner (Loopback only `127.0.0.1`)
- **Port 4000**: LiteLLM Proxy Gateway (`127.0.0.1`)
- **Port 8000**: vLLM Batch Inference Server / HexStrike AI (`127.0.0.1`)
- **Port 8080**: Caido Security Proxy Web UI & API (`127.0.0.1`)
- **Port 9876**: Burp Suite MCP SSE Server (`127.0.0.1`)
- **Port 8787**: Zoth Sovereign Secrets Vault Daemon (`127.0.0.1`)
- **Port 7687**: Neo4j Bolt Gateway for Graphiti (`127.0.0.1`)

All MCP servers and daemons communicate strictly over `127.0.0.1` and are locked down by UFW rules (`ufw default deny incoming`), preventing any external network exposure while giving local autonomous agents instant, low-latency superpowers.

---
*Blueprint completed for ZothOS v3.2.0 integration.*