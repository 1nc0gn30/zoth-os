---
title: "Zoth Maya Video Studio"
tags: [os, desktop, video]
aliases: ["maya-linux", "Zoth Maya Video Studio"]
version: "2.0.0"
---

# Zoth Maya Video Studio

Wrap Screen Recording, Motion Timeline & Video Production (`v2.0.0`).

## Desktop Entry Details

- **Name:** `Zoth Maya Video Studio`
- **Generic Name:** `Device Mockup & Video Studio`
- **Comment:** `Wrap Screen Recording, Motion Timeline & Video Production`
- **Exec:** `maya`
- **Icon:** `/usr/share/pixmaps/maya-linux.png` (unified across `pixmaps`, `hicolor`, `Zoth-Hermetic`, and `/opt/maya-linux/public/app/icon_*.png`)
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `AudioVideo;Video;AudioVideoEditing;`
- **Startup Notify:** `true`
- **Files (3-Way Parity):** `/usr/share/applications/maya-linux.desktop`, `~/.local/share/applications/maya-linux.desktop`, and chroot `usr/share/applications/maya-linux.desktop`

## Launch Configuration & Behavior

Registers Maya for Linux Studio Pro (`v2.0.0`) under AudioVideo, Video, and AudioVideoEditing menus. Invokes `/usr/local/bin/maya` directly without a terminal wrapper, launching the hardened Electron desktop workstation (Editorial Ivory Light + Obsidian Dark dual theme, 3D device frames, multi-track timeline, 60 FPS procedural motion synth, CapCut draft export, and native FFmpeg export). Engineered by **Neal Frazier Tech (`@1nc0gn30`) • NullAI Platform**.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI maya|maya]]
