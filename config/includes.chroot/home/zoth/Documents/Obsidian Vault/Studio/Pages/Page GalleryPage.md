---
title: "GalleryPage"
tags: [studio, page]
---

# GalleryPage

`GalleryPage` renders the **Studio Gallery** view mounted at route `/gallery` in Zoth Studio v2.

## What it renders

- **Header & Introduction**: Displays the "Studio Gallery" label, main heading, explanatory copy detailing desktop/mobile captures in the dark theme, and indicates that capture media resides in `public/studio-captures/`.
- **Grouped Route Captures**: Iterates through `galleryGroups` imported from `../data/galleryManifest`. Each group contains a title, lede, and list of route items.
- **Capture Cards (`CaptureCard`)**: For each documented route:
  - Displays the page title and path (e.g. `/adytum/docs`).
  - An **Open route** button navigating directly to the target studio route via `RouterLink`.
  - A responsive dual-frame grid with desktop and phone-width mobile viewports (`Frame`).
- **Media Frames (`Frame`)**: Renders a lazy-loaded static screenshot alongside an HTML5 video player (`<video controls playsInline preload="none">`) previewing the route's motion intro.
- **SEO Metadata**: Sets `<SEO>` title to `"Studio Gallery // Pages and Motion Intros"` with a description and canonical `/gallery` path.

- **Source:** `zoth-studio-v2/src/pages/GalleryPage.jsx`
- **Route:** `/gallery`

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route gallery|/gallery]]