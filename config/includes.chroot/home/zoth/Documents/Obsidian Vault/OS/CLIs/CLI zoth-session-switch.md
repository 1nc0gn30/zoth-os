---
title: "zoth-session-switch"
tags: [os, cli]
aliases: ["zoth-session-switch"]
---

# zoth-session-switch

`file`: Bourne-Again shell script.

`zoth-session-switch` is an administration utility located at `/usr/local/bin/zoth-session-switch` that switches the default graphical desktop session between Hyprland (Wayland) and XFCE4 (X11).

### Operational Behavior

The script configures the default desktop session managed by LightDM:

1. **Session Argument or Interactive Menu**:
   - Accepts an optional CLI parameter (`hyprland`, `wayland`, `apex`, `xfce`, `xfce4`, `x11`).
   - If invoked without arguments, it displays an interactive prompt:
     - `1) hyprland` — Apex Wayland Compositor (Bezier physics, custom shaders, glass aesthetics).
     - `2) xfce` — Classic 2D X11 Cyberpunk Desktop (low resource consumption).
2. **Display Manager Configuration**:
   - Updates the target session configuration file at `/etc/lightdm/lightdm.conf.d/99-zothos-default.conf`.
   - Modifies `user-session=hyprland` or `user-session=xfce` using `sed`.
3. **Activation**:
   - Session changes take effect upon the next graphical login or system reboot.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-session-switch`
- **Interpreter**: `/bin/bash` (`set -e`)
- **Target Config**: `/etc/lightdm/lightdm.conf.d/99-zothos-default.conf`

## See also

[[Zoth OS]] · [[MOC CLIs]]