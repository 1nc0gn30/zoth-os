---
title: "zoth-plasma-setup"
tags: [os, cli]
aliases: ["zoth-plasma-setup"]
---

# zoth-plasma-setup

`file`: Bourne-Again shell script.

`zoth-plasma-setup` is a startup configuration script that initializes and standardizes the KDE Plasma 6 desktop environment in ZothOS. Located at `/usr/local/bin/zoth-plasma-setup`.

## Initialization Sequence
1. **DBus Readiness**: Polls `qdbus6` (or `qdbus`) up to 20 seconds waiting for `org.kde.plasmashell /PlasmaShell` to register on the session bus.
2. **Default Panel**: Verifies that desktop panels exist; if none are found, loads the `org.kde.plasma.desktop.defaultPanel` template via DBus scripting.
3. **Wallpaper & Theme**:
   - Checks for the interactive 3D wallpaper plugin `org.zothos.interactive` in system or local user directories. If present, activates it across all containments via DBus and updates `plasma-org.kde.plasma.desktop-appletsrc`.
   - If the plugin is absent, applies the static fallback wallpaper `/usr/share/backgrounds/zothos/zoth-gold-master.jpg` using `plasma-apply-wallpaperimage` and sets the `org.kde.image` plugin.
   - Enforces the `BreezeDark` color palette with `plasma-apply-colorscheme`.
4. **Screen Locker Settings**: Uses `kwriteconfig6` to write `kscreenlockerrc`, disabling auto-lock on idle and resume (`Autolock=false`, `Timeout=0`, `LockOnResume=false`), while binding the greeter lockscreen background to `zoth-gold-master.jpg`.
5. **Workspace Layout**: Executes `/usr/local/bin/zoth-workspaces apply` to configure the 8 virtual desktop arrangement and multi-display geometry.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-workspaces|zoth-workspaces]]