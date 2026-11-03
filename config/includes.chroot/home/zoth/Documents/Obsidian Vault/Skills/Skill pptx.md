---
title: "pptx"
tags: [skill, grok]
aliases: ["pptx"]
---

# pptx

End-to-end presentation engineering skill for reading, modifying, creating, and quality-assuring PowerPoint (`.pptx`) decks.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/pptx`)
- **When to load:** Tool-driven; triggers whenever a task involves `.pptx` files, presentations, slide decks, or speaker notes.

## Workflow Pathways

- **Editing & Template Modification:** When an existing presentation is referenced, unpack the deck XML directly (`scripts/office/unpack.py`), modify placeholders and layout shapes, and re-pack (`pack.py`).
- **Creation from Scratch:** When starting fresh with no base presentation, generate new slides using PptxGenJS templates (`creating.md`).
- **Content & Structural Extraction:**
  - Extract text and outlines quickly with `markitdown`.
  - Inspect structured slide elements (placeholders, shapes, themes, media) via `scripts/inspect_slide.py`.

## Mandatory QA Pipeline

- **Overlap Detection & Autofit:** Runs `scripts/check_overlaps.py unpacked/ --fix` before repacking to detect bounding-box collisions and auto-apply `<a:normAutofit/>`.
- **Placeholder & Content Checks:** Greps rendered text for leftover template artifacts (`lorem`, `xxxx`, generic layout strings).
- **Packaging Pipeline:** Runs font detection (`detect_fonts.py`), XML cleaning (`clean.py`), and packing (`pack.py`) against the original deck.
- **Visual Slide Verification:** Renders slide images to audit against typography wrapping, unaligned decorative lines, and clipped text containers.

## See also

[[MOC Skills]] · [[Zoth OS]]