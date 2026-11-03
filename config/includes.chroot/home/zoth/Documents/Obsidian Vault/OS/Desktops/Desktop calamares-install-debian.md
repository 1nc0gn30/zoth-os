---
title: "Install Debian (Disabled)"
tags: [os, desktop]
aliases: ["calamares-install-debian", "Install Debian (Disabled)"]
---

# Install Debian (Disabled)

Disabled upstream Debian installer launcher entry.

## Desktop Entry Details

- **Name:** `Install Debian (Disabled)`
- **Exec:** `/bin/true`
- **Icon:** `install-debian`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;`
- **No Display:** `true`
- **Hidden:** `true`
- **File:** `/usr/share/applications/calamares-install-debian.desktop`

## Launch Configuration & Behavior

This desktop file explicitly neutralizes the stock Debian Calamares installer icon in the live desktop session. By directing execution to `/bin/true` and setting both `NoDisplay=true` and `Hidden=true`, it prevents upstream Debian installation prompts from showing in the application menus or dock, directing installation flow to the Zoth OS installer instead.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Desktop install-zothos|install-zothos]]