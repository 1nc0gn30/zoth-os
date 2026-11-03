---
title: "zoth-bootstrap"
tags: [os, cli]
aliases: ["zoth-bootstrap"]
---

# zoth-bootstrap

`file`: Bourne-Again shell script.

`zoth-bootstrap` is the ZOTHOS first-boot auto-installer and environment provisioner located at `/usr/local/bin/zoth-bootstrap`, triggered via [[Unit zoth-bootstrap.service|zoth-bootstrap.service]].

It runs once on initial boot (guarded by `/var/lib/zothos/.bootstrap-done`) and logs its execution to `/var/log/zothos-bootstrap.log`.

### Key Provisioning Steps

- **Repository Activation**: Uncomments and enables official Kali Linux and Parrot OS rolling repository mirrors under `/etc/apt/sources.list.d/`.
- **Sudo Privilege Grant**: Configures passwordless sudo for users `zoth` and `azoth` via `/etc/sudoers.d/99-zoth-users`.
- **Security & Tool Arsenal (Online Mode)**:
  - Updates APT indices and installs packages defined in `/usr/share/zothos/tool-lists/*.list.chroot`.
  - Sets up the Python AI virtual environment at `/opt/zothos-ai-env` with packages like `aider-chat`, `fastmcp`, `litellm`, `fastapi`, and `uvicorn`.
  - Installs global developer tools: `@anthropic-ai/claude-code` via npm, the Rust toolchain via rustup, ProjectDiscovery `nuclei` via Go, and Ollama for local LLM inference.
  - Updates Zoth git repos and studio template submodules.
- **Desktop & Font Environment**: Trusts skel desktop shortcuts, refreshes `hicolor` and `Zoth-Hermetic` icon caches, and copies JetBrains Mono fonts into `/usr/local/share/fonts/zothos/`.
- **Firewall Baseline**: Enforces UFW defaults (deny incoming, allow outgoing), permitting loopback, `tailscale0`, Tailscale WireGuard (UDP 41641), and the Anderson Sentinel camera feed (TCP 7890).
- **Completion Marker**: Writes `/var/lib/zothos/.bootstrap-done` (read-only `0444`) to prevent subsequent re-execution.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Unit zoth-bootstrap.service|zoth-bootstrap.service]]