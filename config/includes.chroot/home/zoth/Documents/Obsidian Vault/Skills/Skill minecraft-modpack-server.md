---
title: "minecraft-modpack-server"
tags: [skill, hermes]
aliases: ["minecraft-modpack-server"]
---

# minecraft-modpack-server

Host modded Minecraft servers (CurseForge, Modrinth).

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/gaming/minecraft-modpack-server/SKILL.md`

## Overview & When to Load

Load when deploying or administering modded Minecraft servers (CurseForge, Modrinth packs), configuring NeoForge or Forge loaders, tuning JVM parameters, or establishing automated server backups.

## Key Setup Procedures & Rules

1. **Preference Gathering:** Clarifies server name/MOTD, seed, game mode, difficulty, online auth mode, expected player count, and RAM limits before editing configurations.
2. **Runtime & Mod Loader:**
   - Matches Java runtime to Minecraft version (Java 21 for 1.21+, Java 17 for 1.18–1.20, Java 8 for legacy 1.16 and below).
   - Extracts server packs and runs loader installers (e.g. `INSTALL_ONLY=true` or installer jars) without starting prematurely.
   - Automatically writes `eula=true` to `eula.txt`.
3. **Configuration & Server Properties:**
   - Mandatory modded flags: `allow-flight=true` (prevents false player kicks from modded flight gear) and `max-tick-time=180000` (tolerates heavy worldgen lag).
   - Sets view and simulation distances based on host hardware and player counts.
4. **JVM & Memory Tuning:** Configures `user_jvm_args.txt` with G1GC flags, pre-touching, and RAM thresholds (6–12 GB for 100–200 mods; 12–24 GB for large packs), keeping reserve memory for the host OS.
5. **Networking & Firewall:** Opens TCP port 25565 via `ufw` and creates standalone launch scripts.
6. **Automated Backups:** Implements hourly compressed tarball backups with automatic rotation (retaining the 24 most recent archives).

## See also

[[MOC Skills]] · [[Zoth OS]]