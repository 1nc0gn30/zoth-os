---
title: "ErrorBoundary"
tags: [studio, component]
---

# ErrorBoundary

`ErrorBoundary` is a top-level React class error boundary that intercepts uncaught component rendering exceptions and HMR errors to prevent workstation crashes.

### Hierarchy & Placement

- Wraps the root application tree in `main.jsx` (outside the MUI `ThemeProvider`).
- Wraps individual route transitions in `App.jsx` with a dynamic `key={routePath}` to isolate errors per route.
- Uses fixed gold-and-void colors (`#0B0B12`, `#26262F`, `#D4AF37`) so it renders reliably even if theme context fails.

### What it renders

- **Normal State:**
  - Passes through `this.props.children` without modifying layout.
- **Error Fallback UI:**
  - Intercepts render exceptions via `static getDerivedStateFromError(error)` and logs details to the console in `componentDidCatch`.
  - Renders a centered recovery panel with a gold accent border.
  - Heading: `⚡ Zoth Studio Workstation UI Recovered`.
  - Context copy explaining that a component rendering or HMR exception was intercepted to prevent downtime.
  - Monospace code container displaying `this.state.error?.toString()`.
  - **Reload Workstation UI Button:** Triggers `window.location.reload()` while resetting internal error state.

## See also

[[Zoth Studio]] · [[MOC Components]]