---
title: "Security Suite"
tags: [os, desktop]
aliases: ["zoth-security-suite", "Security Suite"]
---

# Security Suite

Shield Crosshair — Full Security Arsenal.

## Desktop Entry Details

- **Name:** `Security Suite`
- **Comment:** `Shield Crosshair — Full Security Arsenal`
- **Exec:** `/usr/local/bin/zoth-sec`
- **Icon:** `zoth-security-suite`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Security;System;`
- **Keywords:** `security;suite;shield;crosshair;arsenal;pentest;defense;`
- **MimeType:** `application/x-zoth-security-suite;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-security-suite.desktop`

## Launch Configuration & Behavior

Registers Security Suite under `Security` and `System` desktop menu categories. Invoking this launcher runs `/usr/local/bin/zoth-sec` directly without a standalone terminal wrapper. It associates with the MIME type `application/x-zoth-security-suite`, uses the `zoth-security-suite` icon asset, and supports startup notification.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-sec|zoth-sec]]