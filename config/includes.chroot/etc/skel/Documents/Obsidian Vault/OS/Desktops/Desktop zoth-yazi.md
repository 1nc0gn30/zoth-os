---
title: "Zoth Yazi File Navigator"
tags: [os, desktop]
aliases: ["zoth-yazi", "Zoth Yazi File Navigator"]
---

# Zoth Yazi File Navigator

Blazing Fast Asynchronous Terminal File Manager with Image Preview

## Desktop Entry Details

- **Name:** `Zoth Yazi File Navigator`
- **Generic Name:** `Terminal File Manager`
- **Comment:** `Blazing Fast Asynchronous Terminal File Manager with Image Preview`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Yazi" -- yazi`
- **Icon:** `system-file-manager`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;Utility;ZothPentesting;`
- **Keywords:** `yazi;files;filemanager;terminal;rust;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-yazi.desktop`

## Launch Configuration & Behavior

The desktop entry registers the asynchronous terminal file manager under System, Utility, and ZothPentesting. When launched, it invokes `/usr/local/bin/zoth-konsole` configured with the window title `"Yazi"` to execute `yazi` inside a terminal emulator while providing desktop startup notifications.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Pkg yazi|yazi]] · [[CLI zoth-konsole|zoth-konsole]]