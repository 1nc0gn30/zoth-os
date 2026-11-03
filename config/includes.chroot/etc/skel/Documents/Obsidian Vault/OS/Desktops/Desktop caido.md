---
title: "Zoth Caido Web Security Suite"
tags: [os, desktop]
aliases: ["caido", "Zoth Caido Web Security Suite"]
---

# Zoth Caido Web Security Suite

Modern Rust-based Web Application Security & Auditing Proxy.

## Desktop Entry Details

- **Name:** `Zoth Caido Web Security Suite`
- **Generic Name:** `Web Application Security Proxy`
- **Comment:** `Modern Rust-based Web Application Security & Auditing Proxy`
- **TryExec:** `caido`
- **Exec:** `/usr/bin/caido %U`
- **Icon:** `caido`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;Development;Network;`
- **Startup Notify:** `true`
- **Keywords:** `Caido;Proxy;Security;Web;Audit;Vulnerability;`
- **File:** `/usr/share/applications/caido.desktop`

## Launch Configuration & Behavior

Configures the desktop environment launcher for the Caido web security and auditing proxy. It tests for the binary presence via `TryExec=caido` and launches `/usr/bin/caido %U` directly without spawning an auxiliary terminal. It is organized under the Security, Development, and Network categories with indexing keywords for proxy and vulnerability auditing.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI caido|caido]] · [[Pkg caido|caido]]