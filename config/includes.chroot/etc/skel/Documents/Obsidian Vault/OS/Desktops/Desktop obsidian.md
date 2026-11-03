---
title: "Obsidian"
tags: [os, desktop]
aliases: ["obsidian", "Obsidian"]
---

# Obsidian

Markdown knowledge base and personal notebook application.

## Desktop Entry Details

- **Name:** `Obsidian`
- **Comment:** `Obsidian`
- **Exec:** `/opt/Obsidian/obsidian %U`
- **Icon:** `obsidian`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Office;`
- **Startup WM Class:** `obsidian`
- **MIME Type:** `x-scheme-handler/obsidian;`
- **File:** `/usr/share/applications/obsidian.desktop`

## Launch Configuration & Behavior

The desktop entry registers Obsidian within the desktop application menu under the Office category. It executes the installed binary at `/opt/Obsidian/obsidian` with `%U` parameter handling for URL schemas. It registers URI handling for the `x-scheme-handler/obsidian;` protocol and binds window management to `StartupWMClass=obsidian`.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI obsidian|obsidian]] · [[Pkg obsidian|obsidian]]