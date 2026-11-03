---
title: "zoth-update-studio"
tags: [os, cli]
aliases: ["zoth-update-studio"]
---

# zoth-update-studio

`file`: Bourne-Again shell script.

`zoth-update-studio` is the automated updater and build pipeline for Zoth Studio v2, installed at `/usr/local/bin/zoth-update-studio`.

### Core Capabilities

- **Automatic Location Discovery**: Detects the Zoth Studio installation directory across standard paths (`/opt/zoth-studio`, chroot directories, or user-specified paths).
- **Git Synchronization**: Synchronizes against the remote repository (`https://github.com/NullAITech/zoth-studio-v2.git`, default branch `main`).
- **Build Pipeline**: Runs offline-preferring npm dependency installation (`npm install --prefer-offline`) and executes the static build pipeline (`npm run build`).
- **Asset Verification & Notification**: Validates production build artifacts (`dist/index.html`) and delivers desktop notifications via DBus and `notify-send`.

### Command Options

- `--check`: Inspect upstream GitHub commits without pulling or rebuilding.
- `--rebuild`: Skip Git pull and recompile the local working tree.
- `--force`: Discard local uncommitted changes and force pull latest origin.
- `--branch <name>`: Switch to and pull a specific target branch.
- `--target <path>`: Explicitly set the Zoth Studio root directory.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-update-studio|zoth-update-studio]] · [[Zoth Studio]]