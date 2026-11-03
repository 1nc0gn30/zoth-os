---
title: "Pet HUD"
tags: [os, desktop]
aliases: ["zoth-pet-hud", "Pet HUD"]
---

# Pet HUD

All-Seeing Eye Desktop Companion Overlay.

## Desktop Entry Details

- **Name:** `Pet HUD`
- **Comment:** `All-Seeing Eye Desktop Companion Overlay`
- **Exec:** `/usr/local/bin/zoth-pet-hud`
- **Icon:** `zoth-pet-hud`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Utility;Graphics;ArtificialIntelligence;`
- **Keywords:** `pet;hud;companion;eye;overlay;desktop;ai;`
- **MimeType:** `application/x-zoth-pet-hud;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-pet-hud.desktop`

## Launch Configuration & Behavior

Registers Pet HUD across `Utility`, `Graphics`, and `ArtificialIntelligence` desktop application menus. When invoked, it executes `/usr/local/bin/zoth-pet-hud` to launch the All-Seeing Eye companion overlay without a terminal window. It handles the `application/x-zoth-pet-hud` MIME type, references the `zoth-pet-hud` icon theme asset, and provides startup notification upon launch.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-pet-hud|zoth-pet-hud]]