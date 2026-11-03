---
title: "Navbar"
tags: [studio, component]
---

# Navbar

The `Navbar` component (`zoth-studio-v2/src/components/Navbar.jsx`) is the global top navigation header rendered across all pages in Zoth Studio.

## What It Renders

- **Brand Header:** 3D Golden Z logo (`GoldenZLogo3D`) and "Zoth Studio" title linking to home (`/`).
- **Sovereign Runtime Status Pill:** Real-time runtime indicator driven by `useSovereignRuntime` and `useStudioStatus`, reporting local node status, civilization day cycle, or WebGPU state.
- **Primary Route Navigation:**
  - **Arsenal** (`/arsenal`)
  - **Agora** (`/agora`)
  - **Voice Station** (`/voice`)
  - **Zoth OS** (`/zoth-os`)
  - **WebGen** (`/webgen`)
  - **Swarm** (`/swarm`)
  - **HexStrike** (`/hexstrike`)
- **Knowledge Dropdown:** Quick access to Documentation (`/docs`), Six Math Pillars (`/docs/math`), Architecture FAQs (`/faqs`), Agent Experience (`/ax`), and Studio Gallery (`/gallery`).
- **Global Actions & Utilities:**
  - **Swarm Matrix Trigger:** Full/compact button and `Ctrl+~` shortcut toggling the lazy-loaded `SwarmDaemonMultiplexer`.
  - **Command Palette:** Search dialog triggered via search button or `⌘K` / `Ctrl+K` to search micro-tools and workstations.
  - **Theme Toggle:** Dark and light mode switcher.
  - **External Link:** NullAI button linking to `https://nullai.tech`.
  - **Mobile Navigation Drawer:** Responsive slide-out drawer replicating navigation links on compact viewports.

## Parent & Integration

Serves as the persistent primary navigation shell rendered in `App.jsx` across all Studio routes.

## See also

[[Zoth Studio]] · [[MOC Components]]