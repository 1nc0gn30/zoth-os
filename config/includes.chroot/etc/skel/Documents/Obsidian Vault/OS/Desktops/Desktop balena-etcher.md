---
title: "balenaEtcher"
tags: [os, desktop]
aliases: ["balena-etcher", "balenaEtcher"]
---

# balenaEtcher

Flash OS images to SD cards & USB drives, safely and easily.

## Desktop Entry Details

- **Name:** `balenaEtcher`
- **Comment:** `Flash OS images to SD cards & USB drives, safely and easily`
- **Exec:** `/usr/local/bin/balena-etcher %U`
- **Icon:** `drive-removable-media`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Utility;`
- **Startup WM Class:** `balenaEtcher`
- **File:** `/usr/share/applications/balena-etcher.desktop`

## Launch Configuration & Behavior

The desktop entry provides a launcher for flashing operating system images onto SD cards and USB drives. It executes `/usr/local/bin/balena-etcher` passing URL/file arguments via `%U`. Window management and docking under KDE Plasma are matched using the `StartupWMClass=balenaEtcher` attribute, and the application is cataloged under system utilities with the standard removable media drive icon.

## See also

[[Zoth OS]] · [[MOC Desktops]]