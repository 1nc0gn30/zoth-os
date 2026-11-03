---
title: "zoth-matrix-rain"
tags: [os, cli]
aliases: ["zoth-matrix-rain"]
---

# zoth-matrix-rain

`file`: Bourne-Again shell script.

`zoth-matrix-rain` is a terminal visualizer that renders a phosphor green digital rain cascade.

## Execution Flow

1. **Dependency Check**: Verifies if `cmatrix` exists in `PATH` or at `/opt/zothos-ai-env/bin/cmatrix`. If missing, attempts to install it via `apt-get install -y cmatrix`.
2. **Native Execution**: Runs `cmatrix` with the following parameters:
   - `-o 8`: Old-style scrolling mode
   - `-l`: Linux mode (uses console font)
   - `-u 4`: Screen update delay (speed)
   - `-C green`: Phosphor green color scheme
   - `-b`: Bold characters enabled
   - Passes any user flags (`"$@"`) to the process.
3. **Python Fallback**: If `cmatrix` cannot be run, launches an embedded Python script that calculates terminal dimensions (`shutil.get_terminal_size()`) and renders an animated ANSI rain loop using glyphs (`01+-*/$#%%@&`) with green and bright-green highlights.

## Paths

- **Script Path**: `/usr/local/bin/zoth-matrix-rain`
- **Optional Binary**: `/opt/zothos-ai-env/bin/cmatrix`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-matrix-rain|zoth-matrix-rain]]