---
title: "RealityShaderForgeGodModeTool"
tags: [studio, component]
aliases: ["RealityShaderForgeGodModeTool"]
---

# RealityShaderForgeGodModeTool

The `RealityShaderForgeGodModeTool` component (`zoth-studio-v2/src/components/tools/RealityShaderForgeGodModeTool.jsx`) is the dedicated God-Mode interactive theme and shader studio powering [[Studio reality-shader-forge|Zoth Reality Shader & Theme Forge]].

## What It Renders

- **Interactive Shader Canvas**: 60fps WebGL/Canvas viewport rendering live particle networks, digital rain, sonar sweeps, and 4D tesseract matrices.
- **Theme Parameter Controls**: Real-time sliders for particle speed, node density, container corner radius, void background hex, and dual accent color pickers.
- **Companion Bot Character Canvas**: Interactive SVG preview of the active reality's bot persona (AURUM-IX, CIPHER-0x9D, SPECTER-V, KITSUNE-Q9, CORTEX-PRO).
- **Multi-Target Exporter**: Compiles active settings directly into KDE Plasma `.colors`, Alacritty `.toml`, and CSS root custom properties.
- **Global Theme Injection**: Allows pushing customized shader parameters immediately into the active `RealityContext` session.

## Parent & Integration

Mounted at `/tools/reality-shader-forge` within `ToolWorkspace`, connected to `RealityContext` and paired with CLI [[CLI zoth-theme-forge|zoth-theme-forge]].

## See also

[[Zoth Studio]] · [[MOC Components]] · [[MOC Themes]] · [[Studio reality-shader-forge|Zoth Reality Shader & Theme Forge]] · [[CLI zoth-theme-forge|zoth-theme-forge]]
