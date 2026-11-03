---
title: "zoth-powershell"
tags: [os, cli]
aliases: ["zoth-powershell"]
---

# zoth-powershell

`file`: Bourne-Again shell script.

`zoth-powershell` is a shell wrapper located at `/usr/local/bin/zoth-powershell` designed to provide a cross-platform Windows PowerShell / PowerShell Core (`pwsh`) environment for Azure and Windows administrative automation on ZothOS.

### Startup & Resolution Logic

When invoked, the script resolves available PowerShell runtimes through the following order:

1. **System `powershell`**: If the `powershell` command is found on `$PATH`, it runs `powershell -NoLogo -NoExit -Command "Write-Host 'ZOTHOS PowerShell — Azure & Windows Automation' -ForegroundColor Cyan" "$@"`.
2. **PowerShell Core (`pwsh`)**: If `powershell` is absent but `pwsh` is available, it runs `pwsh` with the same banner and interactive arguments.
3. **Dedicated Environment**: If neither binary is in `$PATH`, it checks for `/opt/zothos-ai-env/bin/powershell`, executing it or falling back to `bash`.
4. **On-Demand Package Provisioning**: If no runtime is found, it attempts installation via `apt-get install -y powershell`. If `pwsh` becomes available it executes it; otherwise it outputs a failure notification and drops to `bash`.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-powershell`
- **Interpreter**: `/usr/bin/env bash`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-powershell|zoth-powershell]]