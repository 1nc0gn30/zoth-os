---
title: "pinggy-tunnel"
tags: [skill, hermes]
aliases: ["pinggy-tunnel"]
---

# Pinggy Tunnel

A workstation skill from Hermes for creating zero-install public HTTP, HTTPS, TCP, or TLS tunnels to local services over SSH via Pinggy.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/devops/pinggy-tunnel/SKILL.md`

## When to load
Load this skill when exposing a local port or service to the internet without installing standalone daemons:
- Exposing local development servers, web apps, or dashboards to external parties or mobile devices.
- Receiving webhook callbacks during local development (e.g., Stripe, GitHub, Discord, AgentMail).
- Sharing temporary HTTP-based MCP server endpoints or local LLM APIs (Ollama, vLLM, llama.cpp).
- Running on machines with standard OpenSSH installed where installing `ngrok` or `cloudflared` is unnecessary or restricted.
- *Note:* Free tier provides 60-minute tunnels with random subdomains; Pro mode accepts `PINGGY_TOKEN` for persistent domains and unlimited duration.

## Key capabilities & syntax
- **SSH reverse tunnel invocation:** Runs standard SSH reverse port forwarding to `a.pinggy.io` on port 443:
  ```bash
  ssh -p 443 -o StrictHostKeyChecking=no -R0:localhost:<PORT> free@a.pinggy.io
  ```
- **Stacked username modifiers:** Access controls and header options are configured by prefixing the SSH username separated by `+`:
  - `b:user:pass` — HTTP Basic authentication.
  - `k:token` — Bearer token validation (`Authorization: Bearer <token>`).
  - `w:CIDR` — Source IP whitelist.
  - `co` — Injects `Access-Control-Allow-Origin: *` (CORS).
  - `x:https` — Enforces HTTPS redirect.
  - `qr` — Displays a terminal QR code for quick mobile access.
- **Protocol support:** Tunnels HTTP/HTTPS, raw TCP (e.g., databases on port 5432), and TLS passthrough.
- **Traffic inspector:** Adding `-L4300:localhost:4300` opens a local web debugger at `http://localhost:4300` to monitor live requests.

## See also

[[MOC Skills]] · [[Zoth OS]]