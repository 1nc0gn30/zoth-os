---
title: "Zoth Studio"
date: 2026-11-02
tags:
  - canon
  - zoth-studio
  - micro-saas
  - webgl
  - pantheon-21
  - adytum-22
aliases:
  - "Zoth Studio v2"
  - "Studio"
cluster: Studio
stdp_weight: 0.99
---

# ⚡ Zoth Studio v2 — Sovereign AI Workstation & 3D World

**Vite + React 19 + MUI 5 + Three.js / WebGL** sovereign platform running locally on `http://127.0.0.1:3000` and publicly at [https://zoth.nullai.tech](https://zoth.nullai.tech).

> [!important] 100% Free & Open-Access Architecture (Zero Paywalls)
> All **72 Sovereign Tools** in `src/data/toolsData.js` are **100% free, unlocked, and open-access ($0)** with zero blur locks, zero license modals, and zero paywalls. Optional patronage is supported via a clean **"☕ Buy Us a Coffee"** link and Solana tip address.

---

## 1. Identity & Endpoints

- **Repository**: `~/NullAITech/zoth-studio-v2` → `https://github.com/NullAITech/zoth-studio-v2`
- **Public Production URL**: [https://zoth.nullai.tech](https://zoth.nullai.tech)
- **Local Workstation URL**: `http://127.0.0.1:3000` (skip route intros with `?intro=0`)
- **System Bundle Mirror**: `/opt/zoth-studio/dist/`
- **CLI Launcher**: `zoth-studio` / `npx @nullaitech/zoth`
- **Catalog Source of Truth**: `src/data/toolsData.js` + `public/api/tools.json`

---

## 2. Flagship Routes & 3D Experiences

| Route | Component / Engine | What It Delivers |
| :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Sovereign command deck, 72-tool telemetry, 6 mathematical pillars & live fleet |
| `/world` | `ZothWorldPage.jsx` (`ZothWorldCanvas3D.jsx`) | **8-Planet 3D Star System & Dyson Core** (`SOLARIS-PRIME`, `AETHER-IX`, `KRONOS-FORGE`, `VAELOR-PRIME`, `NYX-SHADOW`, `SYNAPSE-VII`, `TERRA-NEXUS`, `SANCTUM-OMEGA`) + **Pantheon 21 Character Studio** (5-tab RPG inspector, 84 Q/W/E/R abilities, 21×21 synergy matrix) |
| `/adytum` | `AdytumPage.jsx` (`AdytumTarotEngine3D.jsx`) | **Adytum 22 Major Arcana 3D Tarot Diorama & Trials Engine** (Key `0` The Fool → Key `XXI` The World, procedural WebGL shrines, interactive 3-Card Tarot Spread Oracle, and playable Trials of Wisdom) |
| `/memory` | `MemoryPage.jsx` (`obsidianWikiData.js`) | **Obsidian Second Brain & Biomorphic 3D Netrunner Cortex** (`:8094` STDP engrams, Karpathy LLM Wiki reader, JSON Canvas 1.0 & Bases auditor) |
| `/zoth-os` | `ZothOsPage.jsx` | **ZothOS v3.4 & ZothOS-Lite v1.1 Showcase** with interactive Unicode U+2800 Braille & Bayer 8×8 Dither 3D Pyramid/Merkaba logo |
| `/arsenal` | `ArsenalPage.jsx` | Filterable catalog of all 72 sovereign developer, security, AI, and media tools |
| `/tools/:id` | `src/components/tools/*` | Dedicated God-Mode interactive workstation for each of the 72 tools |
| `/webgen` | `WebGenPage.jsx` | [[Zoth WebGen]] full-stack AI app foundry showcase |

---

## 3. Design System Invariants

- **Typography**: `Celtic Garamond` / `Cinzel` display headers, `Inter` / `Space Grotesk` UI body, `JetBrains Mono` telemetry and Braille canvases.
- **Color Palette**: Sovereign Gold (`#D4AF37` dark / `#B8860B` light), Obsidian Void (`#08080B`), Cyan Telemetry (`#38BDF8`), Emerald Verified (`#10B981`).
- **Route Intros**: 60fps Unicode `U+2800` 2×4 Sub-Pixel Braille + Ordered Bayer 8×8 Dither + Glyph Scramble (`IntroDirector.jsx` / `routeIntros.js`), skippable anytime via `?intro=0`.

---

## Related Notes

- [[00 Home]] · [[Zoth OS]] · [[ZothOS-Lite Web Desktop]] · [[Zoth Civilization & Pantheon 21]] · [[Adytum 22 Tarot 3D Engine]] · [[Zoth Memory]] · [[Public Surfaces]]
- [[Maps/Studio.canvas|Studio Canvas]] · [[Maps/Studio Tools.base|Studio Tools Base]] · [[Zoth 72 Sovereign Tools.base]]
