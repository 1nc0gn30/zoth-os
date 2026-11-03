---
title: "Bitwarden Vault"
tags: [os, desktop]
aliases: ["bitwarden", "Bitwarden Vault"]
---

# Bitwarden Vault

Access and manage your Bitwarden vault CLI.

## Desktop Entry Details

- **Name:** `Bitwarden Vault`
- **Generic Name:** `Password & Secrets Manager`
- **Comment:** `Access and manage your Bitwarden vault CLI`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Bitwarden Vault" -- /usr/local/bin/zoth-vault bw`
- **Icon:** `/usr/share/pixmaps/bitwarden.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Utility;Security;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/bitwarden.desktop`

## Launch Configuration & Behavior

The entry classifies Bitwarden as a Password & Secrets Manager under the Utility and Security desktop categories. Execution is handled through `/usr/local/bin/zoth-konsole` with window title `"Bitwarden Vault"`, invoking the OS vault helper `/usr/local/bin/zoth-vault bw` for CLI-based vault unlocking and secret retrieval inside the terminal.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI bitwarden|bitwarden]] · [[Pkg bitwarden|bitwarden]] · [[CLI zoth-vault|zoth-vault]]