---
title: "AirGapToolLockout"
tags: [studio, component]
---

# AirGapToolLockout

`AirGapToolLockout` is a security lockout overlay rendered inside `RealToolWorkspacePage` whenever a sovereign developer tool is accessed from an untrusted remote host rather than a verified local runtime.

### What it renders

- **Enclave Lockout Card (Default Locked State):**
  - Displays status chips for `AIR-GAP HARDWARE ENCLAVE // SEALED`, `ZERO-EGRESS INVARIANT`, and the detected remote hostname.
  - Details that bare-metal execution requires local CPU/GPU registers, memory page-locking (`mlock`), and Unix IPC loopback sockets (`127.0.0.1`), blocking remote execution to preserve cryptographic isolation.
  - **Deployment Path 1 (Deploy Bare-Metal Zoth OS):** Direct link button routing to `/zoth-os` for downloads and boot scripts.
  - **Deployment Path 2 (Clone Repo & Run Locally):** Displays a copyable `git clone` command for the tool's repository, linking to `/arsenal` and external GitHub repositories.
  - **Read-Only Escape Hatch:** Allows users to acknowledge the invariant via `onUnlockPreview` to inspect interface contracts and MCP schemas.
- **Specification Preview HUD (Unlocked State):**
  - Renders a persistent warning banner marked `READ-ONLY SPECIFICATION PREVIEW` and `LIVE EXECUTION BLOCKED`.
  - Provides navigation buttons to `/zoth-os`, `/arsenal`, and an optional `Re-Seal Enclave` trigger (`onReseal`).

### Exports

- Re-exports `isLocalRuntime` from `../utils/sovereignRuntime` for use across tool workspaces, `MemoryPage`, and `WebMCPConsole`.

## See also

[[Zoth Studio]] · [[MOC Components]]