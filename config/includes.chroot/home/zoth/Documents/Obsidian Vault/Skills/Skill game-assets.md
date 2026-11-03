---
title: "game-assets"
tags: [skill, grok]
aliases: ["game-assets"]
---

# game-assets

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/game-assets/SKILL.md`)
- **When to load:** Load for 2D or 3D game art requests, generating 3D models/meshes/GLB files from images, "make this 3D", or when `/game-assets` is invoked.

## Overview & Reference Structure

`game-assets` provides technical specifications and workflows for generating engine-ready 2D sprites and 3D models using Imagine generation tools. Every task begins with `assets.md` (engine defaults, checklists, and style anchoring), followed by dedicated references:

- **Animation (`animation.md`):** Sprite sheets, walk/run cycles, attack frames, idle loops, and procedural visual FX.
- **Characters (`characters.md`):** Multi-angle turnarounds, character poses, costume variations, palette swaps, and consistent visual identity.
- **Tilesets (`tilesets.md`):** Seamless ground textures, modular autotiles, and environment grids.
- **UI & HUD (`ui-icons.md`):** Inventory icons, button states, HUD gauges, logos, and title screens.
- **3D Modeling (`3d.md`):** Generating textured 3D models (`.glb`) from 2D images via `scripts/three_d.py` for Three.js, Unity, Godot, or Unreal.

## Associated Skills & Invariants

- **Skill Pairings:** Pairs with `imagine` for generative prompt crafting and tool routing, and `threejs-frame-conventions` for y-up coordinate and camera alignment in Three.js.
- **Engine-Ready Standards:** Enforces strict pixel dimensions, transparent alpha channels, indexed file nomenclature, and uniform lighting across asset packs.
- **Read-Back Verification:** Requires inspecting generated media to identify defects (incorrect frame counts, baked shadows, color drift) before finalizing.

## See also

[[MOC Skills]] · [[Zoth OS]]