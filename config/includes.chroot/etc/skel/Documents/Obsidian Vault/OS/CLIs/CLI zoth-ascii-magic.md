---
title: "zoth-ascii-magic"
tags: [os, cli]
aliases: ["zoth-ascii-magic"]
---

# zoth-ascii-magic

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-ascii-magic` (v2.7.0) is the sovereign command-line companion to [[Studio zoth-ascii-magic|Zoth ASCII Magic Studio]]. It provides real-time procedural 3D SDF raymarching and image-to-ASCII synthesis with Sobel directional edge detection, Bayer 4×4 & 8×8 ordered dithering, sub-pixel Braille 2×4 dot matrix mapping, CRT phosphor tube palettes, scalable standalone SVG vector export, and a built-in web studio server.

## Usage & Options

```bash
zoth-ascii-magic [-h] [-i IMAGE]
                 [-p {cyberBust,liquidChrome,torus4d,merkaba,datamosh,radar,sigil}]
                 [-m {ascii,braille,bayer4,bayer8,blocks,katakana,newsprint,hex}]
                 [-t {gold,amber,emerald,cyan,crimson,neon}] [-c COLS]
                 [--no-edge] [--no-color] [--html] [--svg] [--json]
                 [--serve PORT]
```

- **`-i, --image IMAGE`**: Path to input bitmap image (PNG/JPG/WebP)
- **`-p, --preset PRESET`**: Procedural 3D SDF shader preset (`cyberBust`, `liquidChrome`, `torus4d`, `merkaba`, `datamosh`, `radar`, `sigil`)
- **`-m, --mode MODE`**: Glyph quantizer & dither ramp (`ascii`, `braille`, `bayer4`, `bayer8`, `blocks`, `katakana`, `newsprint`, `hex`)
- **`-t, --tube TUBE`**: CRT Phosphor tube palette (`gold`, `amber`, `emerald`, `cyan`, `crimson`, `neon`)
- **`-c, --cols COLS`**: Output matrix width in columns (default: 80)
- **`--no-edge`**: Disable Sobel directional edge contour glyphs (`/`, `\`, `|`, `-`)
- **`--no-color`**: Disable 24-bit TrueColor ANSI escape codes for monochrome output
- **`--html`**: Output standalone HTML `<pre>` block formatted for web embedding
- **`--svg`**: Output scalable vector `<svg>` markup
- **`--json`**: Output JSON descriptor payload
- **`--serve PORT`**: Launch local Zoth ASCII Magic Web Studio on `127.0.0.1:PORT` (e.g. port 8089)

## Implementation Details

- **Path**: `/usr/local/bin/zoth-ascii-magic` (symlinked from `~/.local/bin/zoth-ascii-magic`)
- **Version**: `2.7.0` (commit `5549a6c` in `zoth-os`)
- **Runtime**: `/usr/bin/env python3`
- **Zero External Dependencies**: Implemented using Python standard library (`math`, `argparse`, `http.server`, `socketserver`)
- **Web Studio Integration**: Serves the zero-egress browser-based ASCII Magic workspace directly to local browser sessions

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio zoth-ascii-magic|Studio zoth-ascii-magic]] · [[Skill uncommon-web|Skill uncommon-web]]
