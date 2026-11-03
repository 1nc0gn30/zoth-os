---
title: "Aider AI Coding Agent"
tags: [os, desktop]
aliases: ["aider", "Aider AI Coding Agent"]
---

# Aider AI Coding Agent

Aider AI Pair Programming in the Terminal.

## Desktop Entry Details

- **Name:** `Aider AI Coding Agent`
- **Comment:** `Aider AI Pair Programming in the Terminal`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Aider AI" -- /usr/local/bin/aider`
- **Icon:** `/usr/share/pixmaps/zoth-agent.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;AI;`
- **Startup Notify:** `true`
- **Keywords:** `aider;chat;ai;pair;programming;cli;`
- **File:** `/usr/share/applications/aider.desktop`

## Launch Configuration & Behavior

The desktop entry registers Aider as a graphical menu application under the Development and AI categories. Rather than launching in a standard system shell or setting `Terminal=true`, it delegates execution directly to `/usr/local/bin/zoth-konsole` with `--title "Aider AI"`, wrapping the `/usr/local/bin/aider` command within the dedicated Zoth terminal interface with startup notifications enabled.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI aider|aider]] · [[Pkg aider|aider]]