---
title: "zoth-workspaces"
tags: [os, cli]
aliases: ["zoth-workspaces"]
---

# zoth-workspaces

`file`: Bourne-Again shell script.

`zoth-workspaces` manages multi-monitor display placement and KDE Plasma 6 virtual desktop environments, located at `/usr/local/bin/zoth-workspaces`.

### Display & Desktop Architecture

- **Multi-Monitor Layout**: Extends an external screen (Samsung or DP/HDMI display) to the right of the laptop eDP panel (`0,0`) as an independent workspace rather than a mirror.
- **8 Named Desktops**: Provisions an eight-workspace 2×4 grid via KWin DBus interfaces: `Forge`, `Studio`, `WebGen`, `Memory`, `Agents`, `Comms`, `Ops`, and `Sanctum`.
- **Pager Panel**: Adds a KDE Plasma desktop pager panel on external displays if missing.

### Subcommands

- `status`: Displays active output geometry (`kscreen-doctor`) and virtual desktop assignments.
- `extend`: Applies the right-hand extended monitor layout.
- `desktops`: Configures the 8 named virtual desktops and grid rows.
- `panel`: Ensures a desktop pager widget is present on external screens.
- `apply`: Executes `extend`, `desktops`, `panel`, and keyboard shortcut mappings.

### Shortcuts Configured

- `Ctrl+F1..F8`: Jump directly to a desktop.
- `Meta+Ctrl+Arrows`: Traverse the 2×4 desktop grid.
- `Meta+Shift+F1..F8`: Send active window to a desktop.
- `Meta+W`: Toggle KWin overview.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-workspaces|zoth-workspaces]] · [[Workspaces]]