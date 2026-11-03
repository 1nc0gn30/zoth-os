---
title: "WindowCarousel"
tags: [studio, component]
---

# WindowCarousel

- **File:** `zoth-studio-v2/src/components/WindowCarousel.jsx`
- **Parent / Routes:** [[Page WebGenPage]] (`/webgen`), [[Page ConsensusPage]] (`/consensus`), [[Page AdytumPage]] (`/adytum`)

## Overview

`WindowCarousel` is a layout utility component designed to replace squished multi-column window grids with either a spacious single-window carousel slider or an expanded single-column stacked view.

## What It Renders

- **Top Navigation Bar:**
  - Header badge and title describing the current showcase section.
  - View switcher button ("Stack Columns" vs "Carousel Mode") when `allowToggleMode` is enabled.
  - Pagination counter (`01 / NN`) and previous/next chevron buttons for sequential navigation.
- **Carousel View Mode (`viewMode === 'carousel'`):**
  - Renders the active item via `renderItem(activeItem, activeIndex)` inside a gold-bordered `Paper` card.
  - Bottom indicator pills allowing direct clicking to jump between slide indices.
- **Stacked View Mode (`viewMode === 'stacked'`):**
  - Renders all items sequentially in a vertical MUI `Stack`, giving each child full width and distinct card borders.
- **Empty State Guard:** Returns `null` if the provided `items` array is empty.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page WebGenPage]] · [[Page ConsensusPage]] · [[Page AdytumPage]]