---
title: "Zoth Edge Forge & Micro-Kernel Sandbox"
tags: [studio, workstation]
aliases: ["edge-forge"]
---

# Zoth Edge Forge & Micro-Kernel Sandbox

In-browser WebAssembly 1.0 binary assembler and live executor, multi-target Netlify/Cloudflare/WASI/OCI/KVM forge, and live `:3000` host toolchain probe.

## Specification & Taxonomy

- **ID:** `edge-forge`
- **Name:** Zoth Edge Forge & Micro-Kernel Sandbox
- **Version:** `2.3.0`
- **Execution Type:** `hybrid` (100% client-side WebAssembly 1.0 binary forge + optional loopback `127.0.0.1:3000` toolchain & `wat2wasm` compile API)
- **Type:** `cockpit` (Multi-pane developer IDE and visual operational cockpit for human-agent engineering)
- **Band:** Build
- **Canonical Route:** `/workstations/edge-forge` (alias: `/tools/edge-forge`)
- **CLI Launcher:** `zoth open edge-forge` (`zoth open edge-forge --json`)
- **Studio Loopback API:** `GET/HEAD /api/studio/edge-forge`, `POST /api/studio/edge-forge/compile`, `GET/HEAD /api/edge/telemetry`

## Operational Profile

Registered in the Zoth Studio v2 matrix under the **Build** functional band as a hybrid Studio workstation. Provides real in-browser WebAssembly 1.0 binary assembly, section inspection, and live `WebAssembly.instantiate()` execution, multi-target edge/container/KVM synthesis (`netlify-edge`, `cloudflare-worker`, `wasi-enclave`, `oci-scratch`, `kvm-microkernel`), deterministic request simulation, live local toolchain probing (`wat2wasm`, `rustc`, `cargo`, `docker`, `podman`, `qemu-system-x86_64`, `clang`, `gcc`, `/dev/kvm`), and sanitized JSON/Markdown/CSV exports.

## See also

[[Zoth Studio]] · [[MOC Workstations]]
