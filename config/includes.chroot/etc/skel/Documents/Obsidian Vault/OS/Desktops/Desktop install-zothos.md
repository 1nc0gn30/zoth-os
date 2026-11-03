---
title: "Install ZothOS 3.0"
tags: [os, desktop]
aliases: ["install-zothos", "Install ZothOS 3.0"]
---

# Install ZothOS 3.0

Install ZothOS Sovereign AI & Cyber Linux to Disk.

## Desktop Entry Details

- **Name:** `Install ZothOS 3.0`
- **Generic Name:** `Live System Installer`
- **Comment:** `Install ZothOS Sovereign AI & Cyber Linux to Disk`
- **Exec:** `/usr/local/bin/launch-calamares`
- **Icon:** `zoth-os`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;`
- **Startup Notify:** `true`
- **Startup WM Class:** `calamares`
- **File:** `/usr/share/applications/install-zothos.desktop`

## Launch Configuration & Behavior

The desktop entry serves as the live system installer launcher for installing ZothOS to disk. Categorized under System, it executes `/usr/local/bin/launch-calamares` to initiate the Calamares installer framework. Window matching and taskbar integration are governed by `StartupWMClass=calamares`, and the launcher displays the `zoth-os` system icon.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI install-zothos|install-zothos]] · [[CLI launch-calamares|launch-calamares]]