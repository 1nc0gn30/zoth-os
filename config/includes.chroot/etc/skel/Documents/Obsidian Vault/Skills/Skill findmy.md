---
title: "findmy"
tags: [skill, hermes]
aliases: ["findmy"]
---

# Find My (Apple)

A workstation skill from Hermes for tracking Apple devices and AirTags via FindMy.app on macOS.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/skills/apple/findmy/SKILL.md`

## When to load
Load this skill when an agent needs to locate Apple hardware or tracked personal items on macOS:
- Answering user queries about device or AirTag locations ("where is my phone / keys / bag?").
- Tracking AirTag locations and plotting movement routes over time.
- Verifying device coordinates for iPhone, iPad, Mac, or AirPods.

## Key capabilities & workflows
- **UI automation pipeline:** Because Apple provides no CLI or API for FindMy, the skill activates FindMy via AppleScript (`osascript`) and captures window screenshots for vision model extraction (`vision_analyze`).
- **Peekaboo integration:** Supports `peekaboo` for element-level UI annotation and clicks when installed via Homebrew.
- **Continuous tracking:** Periodically snaps foreground window captures to log movement paths, noting that AirTags only refresh while their specific item view is actively displayed.
- **Platform requirements:** Requires macOS with active iCloud credentials, registered Apple devices, and macOS Screen Recording terminal permissions.

## See also

[[MOC Skills]] · [[Zoth OS]]