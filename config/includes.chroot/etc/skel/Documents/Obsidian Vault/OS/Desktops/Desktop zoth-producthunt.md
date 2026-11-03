---
title: "Save developer token"
tags: [os, desktop]
aliases: ["zoth-producthunt", "Save developer token", "Zoth Product Hunt"]
---

# Zoth Product Hunt

Read the ZOTHOS Product Hunt listing and show website/GitHub drift.

## Desktop Entry Details

- **Name:** `Zoth Product Hunt`
- **Generic Name:** `Product Hunt listing watchdog`
- **Comment:** `Read the ZOTHOS Product Hunt listing and show website/GitHub drift`
- **Exec:** `xdg-open "http://127.0.0.1:8121/"`
- **TryExec:** `/usr/local/bin/zoth-ph`
- **Icon:** `applications-internet`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Network;X-ZothOS-AI;`
- **Keywords:** `producthunt;zothos;launch;review;badge;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-producthunt.desktop`

## Actions

- **Listing status (`Status`):** `/usr/local/bin/zoth-konsole --pause --title "Zoth Product Hunt" -- /usr/local/bin/zoth-ph status`
- **Start cockpit (`Cockpit`):** `/usr/local/bin/zoth-konsole --title "Zoth Product Hunt" -- /usr/local/bin/zoth-ph serve`
- **Save developer token (`Login`):** `/usr/local/bin/zoth-konsole --pause --title "Zoth Product Hunt login" -- /usr/local/bin/zoth-ph login`

## Launch Configuration & Behavior

The main launcher opens the Product Hunt cockpit dashboard in the default browser at `http://127.0.0.1:8121/` via `xdg-open` under `Network` and `X-ZothOS-AI`. Quick actions expose three terminal workflows using `zoth-konsole` and `/usr/local/bin/zoth-ph`: checking listing status, starting the cockpit server, and saving developer tokens.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-ph|zoth-ph]] · [[CLI zoth-konsole|zoth-konsole]]