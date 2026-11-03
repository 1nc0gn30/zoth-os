---
title: "QuickLock"
tags: [os, desktop]
aliases: ["zoth-quicklock", "QuickLock"]
---

# QuickLock

Panic Lock & Instant Screen Freeze.

## Desktop Entry Details

- **Name:** `QuickLock`
- **Comment:** `Panic Lock & Instant Screen Freeze`
- **Exec:** `/usr/local/bin/zoth-quicklock`
- **Icon:** `zoth-quicklock`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `System;Security;`
- **Keywords:** `quicklock;panic;lock;freeze;screen;security;emergency;`
- **MimeType:** `application/x-zoth-quicklock;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-quicklock.desktop`

## Launch Configuration & Behavior

Registers QuickLock under the `System` and `Security` application categories. Launching the desktop entry executes `/usr/local/bin/zoth-quicklock` immediately without opening a terminal window. It handles the `application/x-zoth-quicklock` MIME type, references the `zoth-quicklock` icon, and sends startup notification signals.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-quicklock|zoth-quicklock]]