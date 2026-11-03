---
title: "ZothOSPage"
tags: [studio, page]
---

# ZothOSPage

React telemetry cockpit and documentation page for **Zoth OS** (Debian Trixie / KDE Plasma 6 sovereign AI distribution).

- **File:** `zoth-studio-v2/src/pages/ZothOSPage.jsx`
- **Route:** [[Route zoth-os-docs|/zoth-os/docs]]

## What It Renders

`ZothOSPage` provides live host telemetry monitoring, architecture documentation, and deployment guides for running Zoth OS on bare metal or virtualized via KVM.

Key features and components rendered:
- **Telemetry Dials:** Custom SVG radial dials (`RadialResourceDial`) visualizing real-time host CPU load, RAM usage, storage consumption, and TRNG entropy from `useHostInfo` and `useStudioStatus`.
- **System Badges:** Kernel, compositor, and security status indicators (Debian Trixie, KDE Plasma 6, Kali/Parrot tool suite integration, zero-telemetry air gap).
- **Deployment Terminal Commands:** One-click copy commands for:
  - QEMU KVM virtualization boot.
  - Direct raw disk image burning (`dd` command).
  - CLI micro-runner status check (`npx @nullaitech/zoth status`).
  - GitHub repository clone.
- **Daemon Status Strip:** `DaemonStatusStrip` component reflecting local background daemons.
- **Architecture & Build Specs:** Detailed documentation on live-build recipes, chroot overlays, and KVM testing harnesses.
- **Sovereign Funnel:** Bottom deployment card (`SovereignFunnel`).

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route zoth-os-docs|/zoth-os/docs]] · [[Studio zoth-os|Zoth OS v3.2]] · [[Route zothos|/zothos]] · [[Route zoth-os|/zoth-os]] · [[CLI zoth-os|zoth-os]] · [[Desktop zoth-os|zoth-os]]