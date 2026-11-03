---
title: "draw-your-font"
tags: [skill, hermes]
aliases: ["draw-your-font"]
---

# draw-your-font

Converts photographs of handwriting into installable TrueType (`.ttf`) and web (`.woff`, `.woff2`) font files through automated glyph segmentation, visual labeling, and font compilation.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/draw-your-font/SKILL.md`
- **Author:** Danilo Znamerovszkij, ported by Hermes Agent

## When to Load
Load this skill when an operator provides handwritten text samples or wants to generate printable letter templates to construct custom fonts, adjust glyph stroke weights/smoothing, or produce web typography assets locally.

## Architecture & Tooling
- Utilizes `npx -y draw-your-font@0.1.0` (requires Node.js ≥ 18); all image processing, tracing, and metric generation run strictly locally.
- Uses `vision_analyze` to visually inspect contact sheets (`contact-1.png`), preview sheets (`preview.png`), and glyph assemblies (`glyphs.png`).

## Operational Workflow
1. **Template Generation (Optional):** Generates structured printable sheets via `$DYF template -o template.pdf --charset minimal` (or `spanish`).
2. **Segmentation:** Detects ink blobs from photos into a work directory (`$DYF segment photo.jpg -d work`).
3. **Blob Labeling:** Inspects numbered contact sheets using computer vision and builds `work/labels.json` mapping blob IDs to glyphs, dropping artifacts or smudges.
4. **Font Compilation:** Builds the font binary via `$DYF build -d work --labels work/labels.json --name "<FontName>"`.
5. **Critique & Refinement:** Evaluates rendered output; refines glyph weight (`--weight 1` / `--weight=-1`), edge curvature (`--smooth 1.5`), or web font bundles (`--formats ttf,woff,woff2,css`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pixel-art|pixel-art]]