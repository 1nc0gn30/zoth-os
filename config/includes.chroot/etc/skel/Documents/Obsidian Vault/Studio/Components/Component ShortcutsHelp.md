---
title: "ShortcutsHelp"
tags: [studio, component]
---

# ShortcutsHelp

The `ShortcutsHelp` component (`zoth-studio-v2/src/components/ShortcutsHelp.jsx`) is a global modal helper that displays available keyboard shortcuts across Zoth Studio.

## What It Renders

- **Keyboard Listener:** Watches for the `?` key outside editable form fields (`input`, `textarea`, `select`, `contentEditable`) to toggle dialog visibility.
- **Shortcuts Modal Dialog:** A gold-accented MUI `Dialog` titled "Keyboard shortcuts" containing:
  - `Ctrl / ⌘ + K` — Search every page and tool (command palette)
  - `Ctrl + ~` — Open the 21-terminal Swarm matrix
  - `/` — Focus search (Tools catalog)
  - `?` — Show this list
  - `Esc` — Close dialogs and palettes
  - `Tab / Shift + Tab` — Move between controls
- **Styling:** Monospace `<kbd>` elements with gold borders and contrast text next to action descriptions.

## Parent & Integration

Mounted at the root level in `App.jsx` to provide universal shortcut reference across all Studio pages and views.

## See also

[[Zoth Studio]] · [[MOC Components]]