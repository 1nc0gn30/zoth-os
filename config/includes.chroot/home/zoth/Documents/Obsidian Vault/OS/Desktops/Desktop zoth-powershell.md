---
title: "PowerShell"
tags: [os, desktop]
aliases: ["zoth-powershell", "PowerShell"]
---

# PowerShell

Windows PowerShell & Azure Automation Shell.

## Desktop Entry Details

- **Name:** `PowerShell`
- **Comment:** `Windows PowerShell & Azure Automation Shell`
- **Exec:** `/usr/local/bin/zoth-powershell`
- **Icon:** `zoth-powershell`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;System;Shell;`
- **Keywords:** `powershell;windows;azure;shell;automation;cli;ps;`
- **MimeType:** `application/x-zoth-powershell;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/zoth-powershell.desktop`

## Launch Configuration & Behavior

Registers PowerShell under `Development`, `System`, and `Shell` desktop menu categories. Launching this entry executes `/usr/local/bin/zoth-powershell` directly (`Terminal=false`) with startup notifications enabled. It associates with the MIME type `application/x-zoth-powershell` and uses the `zoth-powershell` icon asset.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-powershell|zoth-powershell]]