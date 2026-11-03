---
title: "WebMCPConsole"
tags: [studio, component]
---

# WebMCPConsole

- **File:** `zoth-studio-v2/src/components/WebMCPConsole.jsx`
- **Parent / Routes:** [[Page HomePage]] (`/`), [[Page RealToolWorkspacePage]] (`/tools/:slug`)

## Overview

`WebMCPConsole` is an interactive demonstration and inspection suite for the Anthropic Model Context Protocol (MCP v2024-11-05 specification). It pairs JSON-RPC 2.0 tool schema testing with a video showcase and host loopback bridge configuration.

## What It Renders

- **Three Main Tabs:**
  - **Zoth OS Video Showcase:** Plays recorded demo footage (`/assets/videos/webmcp-zoth-os.mp4`) or runs a 4-chapter interactive simulation reel (covering microkernel boot, SSE handshake, WebGPU tensor dispatch, and zero-egress tool execution).
  - **Live MCP Tool Schemas:** Displays selectable tool definitions (`adytum_validate_plan`, `entropy_calculate`, `jwt_audit_token`, `neuro_memory_recall`). Provides a "Dispatch In-Browser WebMCP Call" button that validates inputs, hashes parameters with SHA-256, and outputs sealed JSON-RPC 2.0 response frames.
  - **Loopback SSE Bridge & Lockout:** Uses `isLocalRuntime()` to present either local launch guidance or static-deployment air-gap notices, alongside a copyable `claude_desktop_config.json` snippet for local agent integration.
- **Specification Badges:** Header chips declaring compliance with the MCP v2024-11-05 spec and interactive demo status.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page HomePage]] · [[Page RealToolWorkspacePage]]