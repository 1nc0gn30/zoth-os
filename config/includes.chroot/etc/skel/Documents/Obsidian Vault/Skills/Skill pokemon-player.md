---
title: "pokemon-player"
tags: [skill, hermes]
aliases: ["pokemon-player"]
---

# Pokemon Player (Headless Emulation)

A workstation skill from Hermes for playing Game Boy Pokemon titles autonomously using headless emulation (`pokemon-agent` / PyBoy), RAM inspection, visual verification, and live browser streaming.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/gaming/pokemon-player/SKILL.md`

## When to load
Load this skill when an agent or user initiates autonomous Pokemon gameplay:
- Running headless Game Boy emulation of Pokemon games (Red, Blue, Yellow).
- Playing through story milestones, navigating routes, managing party rosters, and resolving gym battles.
- Providing a live public browser dashboard via SSH reverse tunneling (`localhost.run`) for users to watch real-time gameplay.
- *Note:* Agents never download or supply game ROMs; users must supply their own legal ROM files.

## Architecture & gameplay loop
- **Headless server (`pokemon-agent`):** Starts a background server hosting the PyBoy emulator on port 9876 with REST endpoints for state (`/state`), visual frames (`/screenshot`), actions (`/action`), and state saves (`/save`, `/load`).
- **Live web dashboard:** Forwards port 9876 via SSH reverse tunnel to `localhost.run` to provide a remote `/dashboard/` stream.
- **7-step agent loop:**
  1. *Observe:* Polls numerical RAM state (HP, coordinates, battle flag) AND captures visual screenshots.
  2. *Orient:* Assesses active screen contexts (dialog, battle, low party health, map obstacle).
  3. *Decide:* Prioritizes actions (dialog advancement > combat > healing > story goals > exploration).
  4. *Act:* Dispatches short bursts (2–4 inputs max, such as directional walking or button taps) to avoid overshooting.
  5. *Verify:* Inspects immediate post-movement screenshots with vision models to prevent getting trapped by ledges or doors.
  6. *Record:* Logs state checkpoints to memory using structured `PKM:` prefixes.
  7. *Save:* Writes named savestates before major encounters and route warps.

## See also

[[MOC Skills]] · [[Zoth OS]]