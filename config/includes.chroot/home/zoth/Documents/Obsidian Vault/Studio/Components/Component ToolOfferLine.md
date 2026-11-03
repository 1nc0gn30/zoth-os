---
title: "ToolOfferLine"
tags: [studio, component]
---

# ToolOfferLine

- **File:** `zoth-studio-v2/src/components/ToolOfferLine.jsx`
- **Parent / Routes:** [[Page HomePage]] (`/`), [[Page ToolsPage]] (`/tools`), [[Page RealToolWorkspacePage]] (`/tools/:slug`)

## Overview

`ToolOfferLine` is a compact presentation component that renders commercial pricing badges and external live-application links for catalog tools with active deployments or public checkouts. If a tool has neither a price nor a live URL, the component renders nothing (`null`).

## What It Renders

- **Price Badge:** When `tool.priceUsd` is present, renders a monospace gold-bordered MUI `Chip` displaying the dollar amount (e.g. `$0`).
- **Live App Link:** When `tool.liveUrl` is present, renders a small text button linking directly to the external production deployment with `target="_blank"` and `rel="noopener noreferrer"`.
- **Pricing Note:** When `tool.priceNote` is defined, appends a small secondary caption string describing tier or billing context.
- **Theme Awareness:** Uses the `isDark` prop to adapt gold text and background tinting between dark and light modes.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page HomePage]] · [[Page ToolsPage]] · [[Page RealToolWorkspacePage]]