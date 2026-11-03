---
title: "Zoth VeraCrypt Vault"
tags: [os, desktop]
aliases: ["zoth-veracrypt", "Zoth VeraCrypt Vault"]
---

# Zoth VeraCrypt Vault

Plausibly Deniable Encrypted Volumes and Drives

## Desktop Entry Details

- **Name:** `Zoth VeraCrypt Vault`
- **Generic Name:** `Disk Encryption`
- **Comment:** `Plausibly Deniable Encrypted Volumes and Drives`
- **Try Exec:** `veracrypt`
- **Exec:** `veracrypt`
- **Icon:** `veracrypt`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;ZothPentesting;ZothOpsec;Utility;`
- **Keywords:** `encryption;crypto;vault;disk;volume;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-veracrypt.desktop`

## Launch Configuration & Behavior

The launcher integrates VeraCrypt disk encryption and encrypted volume management into the desktop menus under Security, ZothPentesting, ZothOpsec, and Utility. It verifies the presence of `veracrypt` via `TryExec`, launches the graphical application directly (`Terminal=false`), and enables startup notification feedback.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Pkg veracrypt|veracrypt]]