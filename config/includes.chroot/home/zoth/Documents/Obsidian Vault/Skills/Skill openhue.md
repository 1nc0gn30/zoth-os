---
title: "openhue"
tags: [skill, hermes]
aliases: ["openhue"]
---

# openhue

Controls Philips Hue smart lighting fixtures, zones, scenes, and rooms via the `openhue` CLI connected to a local Philips Hue Bridge.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/smart-home/openhue/SKILL.md`
- **Homepage:** `https://www.openhue.io/cli`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When turning Philips Hue lights, rooms, or zones on or off.
- When adjusting bulb brightness, color temperature (mirek), or RGB/named colors.
- When activating preset lighting scenes (e.g., Relax, Concentrate, Movie mode).
- When automating smart lighting routines or scheduled lighting scripts.

## Key Commands & Operations
- **Query inventory:** Inspect lights, rooms, and scenes using `openhue get light`, `openhue get room`, and `openhue get scene`.
- **Light control:** Toggle power and adjust parameters using `openhue set light "<Name>" --on/--off`, `--brightness <0-100>`, `--temperature <153-500>`, or `--rgb "<hex>"`.
- **Room and scene control:** Manage grouped spaces via `openhue set room "<Room>" --on --brightness <value>` or apply scenes with `openhue set scene "<Scene>" --room "<Room>"`.
- **Prerequisites:** Requires the bridge on the same local network and initial physical button pairing.

## See also

[[MOC Skills]] · [[Zoth OS]]