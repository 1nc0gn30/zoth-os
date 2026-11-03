---
title: "Zoth LazyDocker TUI"
tags: [os, desktop]
aliases: ["zoth-lazydocker", "Zoth LazyDocker TUI"]
---

# Zoth LazyDocker TUI

Interactive Terminal UI for Docker and Podman Containers.

## Desktop Entry Details

- **Name:** `Zoth LazyDocker TUI`
- **Generic Name:** `Docker Terminal Manager`
- **Comment:** `Interactive Terminal UI for Docker and Podman Containers`
- **Exec:** `/usr/local/bin/zoth-konsole --title "LazyDocker" -- lazydocker`
- **Icon:** `docker`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;System;ZothPentesting;`
- **Keywords:** `docker;podman;containers;tui;terminal;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-lazydocker.desktop`

## Launch Configuration & Behavior

The entry registers the LazyDocker terminal UI under Development, System, and ZothPentesting categories. It invokes `/usr/local/bin/zoth-konsole` with window title `"LazyDocker"` to run `lazydocker`, providing an interactive curses interface for managing local Docker and Podman containers, images, and volumes.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[Pkg lazydocker|lazydocker]] · [[CLI zoth-konsole|zoth-konsole]]