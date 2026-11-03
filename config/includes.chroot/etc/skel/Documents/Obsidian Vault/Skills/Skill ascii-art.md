---
title: "ascii-art"
tags: [skill, hermes]
aliases: ["ascii-art"]
---

# ascii-art

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/ascii-art/SKILL.md`

## Overview
The `ascii-art` skill provides a toolkit of local command-line tools and zero-key REST APIs for generating ASCII banners, decorated borders, character art, and image-to-text conversions.

## When to Load
Load this skill when:
- Generating large text banners or headers for CLI output, code comments, or splash screens.
- Wrapping messages in speech bubbles with character art (e.g., `cowsay`, `cowthink`).
- Enclosing text or code snippets in decorative borders using `boxes`.
- Converting image files (PNG, JPEG, GIF, WEBP) to ASCII art or braille matrices.
- Fetching curated subject ASCII art, weather forecasts, or ASCII QR codes.
- Designing custom monospace diagram elements or banners using a Unicode character palette.

## Tooling & Decision Flow
- **Text Banners**: Uses `pyfiglet` locally (571 fonts) or the `asciified` REST API via `curl` (250+ FIGlet fonts).
- **Speech & Borders**: Uses `cowsay` for character speech bubbles and `boxes` for decorative frames (70+ designs).
- **Color Art**: Leverages `toilet` with visual filters (`gay` rainbow, `metal`, `border`) and ANSI color codes.
- **Image Conversion**: Converts images via `ascii-image-converter` (supports color and braille) or `jp2a`.
- **Pre-Made Art & Utilities**: Scrapes curated art from `ascii.co.uk`, fetches ASCII weather from `wttr.in`, and generates QR codes from `qrenco.de`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill excalidraw|excalidraw]]