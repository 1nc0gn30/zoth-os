---
title: "zoth-theme-forge"
tags: [os, cli]
aliases: ["zoth-theme-forge"]
---

# zoth-theme-forge

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-theme-forge` is the command-line companion to [[Studio reality-shader-forge|Zoth Reality Shader & Theme Forge]]. It compiles theme definitions across the 5 Zoth Realities (`gold`, `matrix`, `ghost`, `cyan`, `incognito`) into KDE Plasma 6 `.colors`, Alacritty `.toml`, and JSON formats.

## Usage & Options

```bash
zoth-theme-forge [-h] [--reality {gold,matrix,ghost,cyan,incognito}]
                 [--format {kde,alacritty,json}] [--list]
```

- **`--reality ID`**: Target reality profile (`gold`, `matrix`, `ghost`, `cyan`, `incognito`)
- **`--format FORMAT`**: Export format specification (`kde`, `alacritty`, `json`)
- **`--list`**: List all 5 Reality themes, companion bots, and color parameters

## Implementation Details

- **Path**: `/usr/local/bin/zoth-theme-forge` (symlinked from `/home/zoth/.local/bin/zoth-theme-forge`)
- **Runtime**: `/usr/bin/env python3`
- **Output Targets**:
  - `kde`: Formats native KDE Plasma color scheme INI blocks (`[General]`, `[Colors:Window]`, `[Colors:View]`, `[Colors:Button]`, `[Colors:Selection]`)
  - `alacritty`: Generates TOML configuration blocks with primary and bright color tables
  - `json`: Structured reality theme tokens for programmatic consumption

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[MOC Themes]] · [[Studio reality-shader-forge|Studio reality-shader-forge]] · [[Component RealityShaderForgeGodModeTool|RealityShaderForgeGodModeTool]]
