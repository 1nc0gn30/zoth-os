---
title: "SEO"
tags: [studio, component]
---

# SEO

The `SEO` component (`zoth-studio-v2/src/components/SEO.jsx`) is a headless metadata controller that dynamically injects SEO, AEO (Answer Engine Optimization), and AX (Agent Experience) metadata into the runtime document `<head>`.

## What It Renders

Returns `null` (no visual DOM elements), operating entirely through side-effects within a `useEffect` hook:

- **Document Title:** Sets `document.title` to the custom title or route fallback from `getRouteMeta`.
- **Standard Meta Tags:** Injects or updates `description`, `keywords`, `author`, and `robots` (supporting `noindex` or full crawler indexing directives).
- **Open Graph Tags:** Configures `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, and `og:image`.
- **Twitter Cards:** Configures `twitter:card` (`summary_large_image`), `twitter:site`, `twitter:title`, `twitter:description`, and `twitter:image`.
- **Canonical Link:** Injects or updates `<link rel="canonical">` matching the canonical URL from `siteConfig.url`.
- **Schema.org JSON-LD Graph:** Injects or updates a structured `<script id="zoth-schema-graph" type="application/ld+json">` tag containing the route-specific graph from `generateSchemaGraph(currentPath)`.

## Parent & Integration

Rendered at the root in `App.jsx` for global route tracking, and overridden in individual pages (e.g. `AgoraPage`, `VoiceStationPage`, `MathPillarsPage`, `AXPage`, `FaqsPage`, `GalleryPage`, `NotFoundPage`) for custom titles and descriptions.

## See also

[[Zoth Studio]] · [[MOC Components]]