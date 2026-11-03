---
title: "NetKill"
tags: [os, desktop]
aliases: ["zoth-netkill", "NetKill"]
---

# NetKill

Firewall Block & Network Neutralization.

## Desktop Entry Details

- **Name:** `NetKill`
- **Comment:** `Firewall Block & Network Neutralization`
- **Exec:** `/usr/local/bin/zoth-netkill`
- **Icon:** `zoth-netkill`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;Network;System;`
- **Keywords:** `netkill;firewall;block;neutralize;iptables;network;security;`
- **MimeType:** `application/x-zoth-netkill;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-netkill.desktop`

## Launch Configuration & Behavior

The entry registers NetKill under the Security, Network, and System categories. Executing the shortcut runs `/usr/local/bin/zoth-netkill` to enforce emergency firewall isolation and network neutralization rules via iptables. The entry associates with MIME type `application/x-zoth-netkill` and enables startup notifications with the `zoth-netkill` icon.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-netkill|zoth-netkill]]