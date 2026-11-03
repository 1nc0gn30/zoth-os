---
title: "zoth-gesture-map"
tags: [os, cli]
aliases: ["zoth-gesture-map"]
---

# zoth-gesture-map

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-gesture-map` is the command-line companion to [[Studio vision-gesture-control|Vision Gesture Control]] and [[Component VisionKinematicsGodModeTool|VisionKinematicsGodModeTool]]. It inspects and manages the 21-joint skeletal hand gesture and 68-point facial viseme action dispatchers across ZothOS v3.2 privilege rings.

## Usage & Options

```bash
zoth-gesture-map [-h] [--json]
```

- **`--json`**: Output active gesture kinematic bindings and system action mappings as structured JSON

## Gesture Bindings Matrix

| Privilege Ring | Trigger Gesture | Target System Command | Functional Purpose |
| :--- | :--- | :--- | :--- |
| **Ring 2** | `PINCH_INDEX_THUMB (< 0.045m)` | `zoth-mode --cycle-reality` | Rapid 5-Reality Switch cycling (`gold` $\to$ `matrix` $\to$ `ghost` $\to$ `cyan` $\to$ `incognito`) |
| **Ring 1** | `SWIPE_LEFT_TWO_FINGER` | `qdbus org.kde.KWin /KWin nextDesktop` | Touchless virtual desktop switching in KDE Plasma / KWin |
| **Ring 0** | `FIST_HOLD_800MS` | `zoth-amnesia --lock-vault` | Emergency volatile RAM zeroize and cryptographic vault lock |
| **Ring 2** | `OPEN_PALM_SPREAD` | `zoth-voice-call --ptt-toggle` | Push-to-talk microphone mute/unmute toggle |

## Implementation Details

- **Path**: `/usr/local/bin/zoth-gesture-map` (symlinked from `~/.local/bin/zoth-gesture-map`)
- **Runtime**: `/usr/bin/env python3`
- **Zero External Dependencies**: Pure Python standard library implementation (`argparse`, `json`)
- **System Integration**: Synchronized with WebGPU kinematics in [[Component VisionKinematicsGodModeTool|VisionKinematicsGodModeTool]]

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio vision-gesture-control|Vision Gesture Control]] · [[Studio likeness-desk|Likeness Desk (AI Video Double)]] · [[Component VisionKinematicsGodModeTool|VisionKinematicsGodModeTool]]
