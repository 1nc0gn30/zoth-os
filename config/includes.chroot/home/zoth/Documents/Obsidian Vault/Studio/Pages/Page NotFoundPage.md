---
title: "NotFoundPage"
tags: [studio, page]
---

# NotFoundPage

`NotFoundPage` serves as the smart 404 fallback page mounted on the catch-all wildcard route `*` in Zoth Studio v2.

## What it renders

- **Error Notice**: Displays an `ERROR 404` monospace badge and headline (*"This page isn't in the Studio"*), rendering the invalid `pathname` and suggesting the `Ctrl/⌘ + K` global tool search shortcut.
- **Dynamic Sitemap Route Discovery**: Fetches `/sitemap.xml` on mount to compile the current index of active canonical studio paths.
- **Typo-Tolerant Route Suggestions**: Uses word-level Levenshtein distance scoring (`lev`, `score`) against discovered sitemap paths to generate up to six "Did you mean" clickable chip recommendations for mistyped URLs.
- **Popular Destination Links**: Provides quick navigation buttons to major studio sections: `/tools/`, `/workstations/`, `/swarm/`, `/voice/`, `/gallery/`, and `/docs/`.
- **Primary CTA**: A prominent button returning the operator to `/` (*"Back to Studio home"*).
- **SEO Metadata**: Sets `<SEO>` headers with `noindex` and title `"Page not found | Zoth Studio"`.

- **Source:** `zoth-studio-v2/src/pages/NotFoundPage.jsx`
- **Route:** `*` (Catch-all fallback)

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route note|*]]