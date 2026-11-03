---
title: "zoth-desktop-init"
tags: [os, cli]
aliases: ["zoth-desktop-init"]
---

# zoth-desktop-init

`file`: Bourne-Again shell script.

`zoth-desktop-init` is the ZOTHOS Apex Desktop Initialization Engine v4. It orchestrates the graphical desktop environment during session login, configuring themes, shortcuts, background services, and window compositing.

### Initialization Sequence
1. **Icon Caches**: Updates GTK icon caches for `hicolor` and `Zoth-Hermetic`.
2. **Desktop Launchers**: Sets executable permissions and marks all `.desktop` files in `~/Desktop` as trusted via `gio`.
3. **Theme & Typography**: Applies `Zoth-Hermetic-Matrix` window/widget themes, `JetBrains Mono` fonts, and `Adwaita` cursor settings via `xfconf-query`.
4. **Sovereign Keybindings**: Configures global `<Super>` hotkeys for core tools:
   - `<Super>h` (`hermes`), `<Super>n` (`zoth-tool-nexus`), `<Super>g` (`zoth-ghost`), `<Super>o` (`opencode`)
   - `<Super>m` (`zoth-mode`), `<Super>s` (`zoth-sec`), `<Super>d` (`zoth-desk-toggle`), `<Super>k` (`zoth-keys`)
   - `<Super>Return` (`konsole`), `<Super>c` (`zoth-cockpit`), `<Super>y` (`maya`)
5. **Wallpaper & Compositing**: Applies `/usr/share/backgrounds/zothos/zoth-gold-master.jpg`. Under non-KDE sessions, launches `picom` (with `/etc/xdg/picom/picom-matrix.conf`) supervised by an auto-restart watchdog loop.
6. **Daemons & Notifications**: Spawns `zoth-desktop-hud` and `zoth-vault-daemon --port 8787`, reloads `xfdesktop`, and sends a desktop readiness notification via `notify-send`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-desk-toggle]] · [[CLI zoth-desktop-hud]]