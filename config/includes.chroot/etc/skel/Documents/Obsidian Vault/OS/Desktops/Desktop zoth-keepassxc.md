---
title: "Zoth KeePassXC Vault"
tags: [os, desktop]
aliases: ["zoth-keepassxc", "Zoth KeePassXC Vault"]
---

# Zoth KeePassXC Vault

Sovereign Password and Credential Vault.

## Desktop Entry Details

- **Name:** `Zoth KeePassXC Vault`
- **Generic Name:** `Password Manager`
- **Comment:** `Sovereign Password and Credential Vault`
- **Exec:** `keepassxc %f`
- **Icon:** `keepassxc`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;ZothPentesting;ZothOpsec;Utility;`
- **Keywords:** `password;credentials;vault;security;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-keepassxc.desktop`

## Launch Configuration & Behavior

The desktop entry provides access to the KeePassXC credential manager under the Security, ZothPentesting, ZothOpsec, and Utility desktop categories. Executing this desktop shortcut launches `keepassxc %f` directly without a parent terminal, passing any selected database file path as an argument while enabling desktop startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Pkg keepassxc|keepassxc]]