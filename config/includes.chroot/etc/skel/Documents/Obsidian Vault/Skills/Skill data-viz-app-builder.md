---
title: "data-viz-app-builder"
tags: [skill, hermes]
aliases: ["data-viz-app-builder"]
---

# data-viz-app-builder

- **Origin:** Hermes skill (workstation skill, not a Zoth product; author: Upstage AI)
- **Path:** `~/.hermes/skills/data-viz-app-builder/SKILL.md`
- **Tags:** `creative`, `3d`, `data-viz`, `react`, `threejs`, `documentation`

## Overview
A web application and data pipeline skill for generating 3D data visualization dashboards (React, Vite, Three.js) that map queried data (such as network or geographic datasets) onto interactive 3D globes with accompanying in-app documentation.

## When to Load
- User requests a 3D visual dashboard or interactive globe for search/query results (e.g., Shodan hosts, IP ranges, geographical endpoints).
- Projects requiring a paired deliverable: a Python data collection pipeline script plus an interactive frontend with embedded API docs.
- Visualizing geospatial and faceted datasets with search cards and interactive orbit controls.

## Architecture & Implementation
- **3D Visualization Stack:** Built on React and Vite using `three`, `@react-three/fiber`, and `@react-three/drei` featuring a textured globe, atmospheric glow, coordinate markers with glow rings, and orbit controls.
- **UI Aesthetics:** Dark theme (`#070b18`) with glassmorphic overlay panels for search filters, cards, and documentation drawers.
- **Data Ingestion Pipeline:** Accompanying Python script handles API authentication, facet grouping, error handling, and structured data exports.
- **Security & Build Standards:** Strictly isolates API credentials to environment variables (`.env`), ensures zero key leaks in artifacts, and verifies delivery via successful `npm run build` exits.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent-skill-authoring|hermes-agent-skill-authoring]]