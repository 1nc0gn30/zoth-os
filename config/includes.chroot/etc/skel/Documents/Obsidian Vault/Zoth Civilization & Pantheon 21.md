---
title: "Zoth Civilization v3.5 & Pantheon 21 Character Engine"
date: 2026-11-02
tags:
  - canon
  - zoth-civilization
  - pantheon-21
  - webgl
  - rpg
aliases:
  - "Zoth Civilization"
  - "Pantheon 21"
  - "8-Planet Star System"
cluster: Studio
stdp_weight: 0.99
---

# 🌌 Zoth Civilization v3.5 & Pantheon 21 Character Engine

Autonomous 21-agent civilization simulation, RPG ability engine, and **8-Planet 3D Star System** running across **Zoth Civilization (`:8088`)** and **[[Zoth Studio]] (`:3000/world`)**.

- **Standalone Daemon**: `~/NullAITech/zoth-civilization` (`http://127.0.0.1:8088`)
- **Studio 3D World Route**: `http://127.0.0.1:3000/world` ([https://zoth.nullai.tech/world](https://zoth.nullai.tech/world))
- **Core Modules**: `src/pantheon_abilities.js`, `ZothWorldCanvas3D.jsx`, `PantheonCharacterStudio.jsx`, `zothWorldPlanets.js`

---

## 1. 8-Planet 3D Star System (`ZothWorldCanvas3D.jsx`)

1. **`SOLARIS-PRIME` (Central Dyson Core)**: High-energy plasma shader + rotating Dyson rings powering the 21-agent fleet.
2. **`AETHER-IX` (Command & Orchestration)**: Home of `AZOTH`, `HERMES`, and `ARCHITECT`.
3. **`KRONOS-FORGE` (Systems & Kernel Foundry)**: Home of `FORGE`, `RUST-SMITH`, and `KERNEL-WARDEN`.
4. **`VAELOR-PRIME` (Consensus & Treasury Lattice)**: Home of `VAELOR-ORACLE`, `BFT-SENTINEL`, and `MINT-ALCHEMIST`.
5. **`NYX-SHADOW` (Red/Blue Cyber Operations)**: Home of `HEXSTRIKE`, `ANDERSON`, and `GHOST-WALKER`.
6. **`SYNAPSE-VII` (Biomorphic STDP Cortex)**: Home of `NEURO-WEAVER`, `DREAM-SCRIBER`, and `OBSIDIAN-KEEPER`.
7. **`TERRA-NEXUS` (Autonomous Web & Growth)**: Home of `AEO-HERALD`, `OMNIPOST`, and `LAUNCH-PILOT`.
8. **`SANCTUM-OMEGA` (Hermetic Wisdom & Adytum)**: Home of `THOTH`, `ORACLE-XXII`, and `SANCTUM-GUARD`.

---

## 2. Pantheon 21 RPG Character & Ability System

- **84 Custom Abilities (4 per Agent: `Q` Primary, `W` Tactical, `E` Defensive/Utility, `R` Ultimate)**:
  - Executed via `POST /api/pantheon/:id/cast` and `POST /api/pantheon/combo`.
- **21×21 Synergy Matrix**:
  - Cross-agent elemental and architectural combos with deterministic cooldowns, XP progression, and live 3D particle VFX.

---

## Related Notes

- [[00 Home]] · [[Zoth Studio]] · [[Adytum 22 Tarot 3D Engine]] · [[Zoth OS]] · [[MOC Pantheon]]
