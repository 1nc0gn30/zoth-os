---
title: "uncommon-web"
tags: [skill, gemini, antigravity]
aliases: ["uncommon-web", "Uncommon Web", "Skill Uncommon Web"]
---

# uncommon-web

- **Origin:** Antigravity & Hermes Agent (`~/.gemini/config/skills/uncommon-web/SKILL.md`)
- **Path:** `/home/zoth/.gemini/config/skills/uncommon-web/SKILL.md`
- **Inspiration:** Curated by **@teknium** (Nous Research / Hermes Agent core lead) at `webdev.teknium.io`
- **When to load:** Load when designing or building visually distinctive, mathematically unusual, or zero-fake-work web experiences, shaders, ASCII art engines, or creative interfaces.

Catalogs **425+ stylistically unusual web libraries across 23 domains**—dither shaders, Unicode braille graphics, DOM-free text layout, retro CRT phosphors, liquid-metal SDFs, hand-drawn vector SVGs, WebGL motion, and WebAudio synthesis.

### Core Architectural Invariants
1. **No Canned Placeholders (Zero Fake Work)**: Every visual artifact, ASCII mesh, dither matrix, or synth must run live directly in the browser or terminal.
2. **Text & Character Cells as a First-Class Canvas**: Characters are not merely UI labels; they are 2D rendering primitives with density, directionality, and phosphor emission.
3. **Hardware Acceleration Without Dependency Bloat**: Minimal, zero-dependency fragment shaders (`@paper-design/shaders`, raw WebGL, or Canvas 2D) over multi-megabyte black-box engines.
4. **Accessible Hybrid Outputs**: Visual stylization (1-bit dithering, ASCII tables, Braille charts) must preserve accessible underlying DOM structures, semantic tables, and scalable SVG vectors.

### The 23 Uncommon Web Domains
1. **Dither, Pixel & ASCII**: `dithercn`, `paper-shaders-dithering`, `three-ascii-effect`, `pixi-filters-crt`, ordered Bayer 4x4/8x8 dithering, CRT phosphor bloom.
2. **Text-Mode & Braille**: `ratzilla` (Rust TUI in WASM), `dotmax`, `drawille-canvas`, `rot.js`, `@thi.ng/text-canvas`, 2×4 sub-pixel Unicode Braille mapping (`0x2800`).
3. **Paper Shaders**: `@paper-design/shaders-react`, `shadermount`, liquid-metal chrome logos, pulsing UI borders, god rays, generative SDF reflections.
4. **Typography & Text**: `@chenglou/pretext` (DOM-free multiline text reflow), `splitting.js`, `vara`, `blotter.ts`, `shiki-magic-move`, `three-slug`.
5. **Shaders & WebGL**: `cobe` (5KB WebGL dotted globe), `fluid-canvas`, `curtainsjs`, `ogl`.
6. **Materials & 3D**: `pmndrs/vanilla`, `three-subdivide`, `gaussian-splatting-web`.
7. **Retro OS & Skeuomorphism**: `98.css`, `7.css`, `xp.css`, `nes.css`, `rpg-ui`.
8. **Hand-Drawn & Rough**: `roughjs`, `wired-elements`, `rough-viz`.
9. **Audio & WebAudio**: `tone.js`, `bassoontracker` (Amiga MOD/XM tracker), `webaudio-tinysynth`, `bytebeat`.
10. **Simulation & Math**: `sandspiel` (falling sand in Rust/WASM), `matter-js`, `algebrite`, `mathjs`.
11. **Component Registries**: `8bitcn`, `reactbits`, `cult-ui`, `eldoraui`.
... and 12 additional specialized domains across game mechanics, generative geometry, and terminal aesthetics.

### Key Implementations in Zoth Ecosystem
- **Zoth ASCII Magic Studio** (`Studio zoth-ascii-magic`): Powered by Bayer 4x4 ordered dithering, sub-pixel Unicode Braille matrix (`0x2800`), Sobel edge contour kernel, Liquid Metal Chrome 2D SDF, and scalable standalone SVG export.

## See also

[[MOC Skills]] · [[Studio zoth-ascii-magic|Zoth ASCII Magic Studio]] · [[Skill avant-garde-ui]] · [[Skill sovereign-saas-design]] · [[Skill claude-motion-graphics]]
