---
title: "Cursor AI"
tags: [os, desktop]
aliases: ["zoth-cursor", "New Window", "Cursor AI"]
---

# Cursor AI

Sovereign AI-Powered Code Editor & Pair Programmer.

## Desktop Entry Details

- **Name:** `Cursor AI`
- **Generic Name:** `AI Code Editor`
- **Comment:** `Sovereign AI-Powered Code Editor & Pair Programmer`
- **Exec:** `cursor %F`
- **Icon:** `zoth-cursor`
- **Terminal:** `false`
- **Type:** `Application`
- **Startup WM Class:** `Cursor`
- **Startup Notify:** `true`
- **Categories:** `Development;IDE;TextEditor;ArtificialIntelligence;`
- **MIME Types:** `application/x-cursor-workspace;text/plain;inode/directory;`
- **Keywords:** `cursor;ai;code;editor;developer;ide;`
- **Actions:** `new-window` (`cursor --new-window %F`)
- **File:** `/usr/share/applications/zoth-cursor.desktop`

## Launch Configuration & Behavior

The desktop entry registers Cursor AI as the system code editor and development environment across text files, directories, and workspace files. It associates window management with the `Cursor` WM class, supports multi-file opening via `%F`, and provides a dedicated `new-window` desktop action to spawn clean editor windows.

## See also

[[Zoth OS]] · [[MOC Desktops]]