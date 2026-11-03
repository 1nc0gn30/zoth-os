---
title: "ToolsPage"
tags: [studio, page]
---

# ToolsPage

React tool directory and catalog page for **NullAI Tools & WebGPU Workstations**.

- **File:** `zoth-studio-v2/src/pages/ToolsPage.jsx`
- **Route:** [[Route tools|/tools]]

## What It Renders

`ToolsPage` renders a searchable, filterable catalog of sovereign micro-tools and workstations sourced from `microTools` (`zoth-studio-v2/src/data/toolsData.js`).

Key features and interface elements:
- **Header & Daemon Status:** Displays studio connection state via `useStudioStatus` (reflecting active local services) and WebGPU sovereign runtime availability (`useSovereignRuntime`).
- **Interactive Search & URL State:** Full-text search with hotkey (`/` to focus), synchronized with query parameters (`?q=`, `?cat=`, `?mode=`, `?pinned=1`) for shareable filtered views.
- **Filter Controls:** Dropdowns and toggles for tool categories, execution mode (`all`, `webgpu`, `local_cli`), and pinned favorite tools.
- **Tool Cards:** Responsive grid displaying:
  - Tool title, description, category chip, and execution type badge.
  - Pinning toggle saved to `localStorage` (`zoth.pinnedTools`).
  - One-click copy for `git clone` repository commands.
  - Expandable detail view and direct launch button routing to `RealToolWorkspacePage` (`/tools/:toolId`) or GitHub repository.

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route tools|/tools]]