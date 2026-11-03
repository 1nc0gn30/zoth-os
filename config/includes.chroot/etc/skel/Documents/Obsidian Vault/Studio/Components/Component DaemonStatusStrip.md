---
title: "DaemonStatusStrip"
tags: [studio, component]
---

# DaemonStatusStrip

`DaemonStatusStrip` is a real-time status bar rendered across multiple Studio pages (including `MemoryPage`, `WebGenPage`, `ConsensusPage`, `BridgesPage`, `HexStrikePage`, and `ZothOSPage`) to communicate the state of local loopback daemons versus remote public web mirrors.

### What it renders

- **Public Web Mirror State (`!isLocal`):**
  - Renders informational chips when hosted remotely (e.g., on `zoth.nullai.tech`).
  - Displays `PUBLIC WEB SHOWCASE · CLIENT WASM & WEBGPU ACTIVE` alongside a security chip indicating `BARE-METAL DAEMONS REQUIRE LOCAL NODE / ZOTHOS ISO`.
  - Informs users that browser-based WebGPU/WASM utilities execute client-side, while bare-metal daemons require local deployment.
- **Local Sovereign Host State (`isLocal`):**
  - Hooks into `useStudioStatus()` to monitor loopback services registered in `status.services`.
  - Displays a warning chip when daemons are dormant, allowing one-click auto-booting via `/api/studio/supervisor/boot`.
  - Renders individual service chips with short names, loopback ports, active model counts, and Adytum cycle counts.
  - Highlights whether each service is `UP` or `OFFLINE`, enabling direct auto-boot triggers for offline services (`civilization`, `webgen`, `swarm`, `memory`, `bridge`).
  - Tooltips surface recent Adytum agent reflections or service offline details.

## See also

[[Zoth Studio]] · [[MOC Components]]