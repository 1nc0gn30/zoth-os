---
title: "Streamlit Studio"
tags: [os, desktop]
aliases: ["streamlit", "Streamlit Studio"]
---

# Streamlit Studio

Build and turn data scripts into shareable web apps.

## Desktop Entry Details

- **Name:** `Streamlit Studio`
- **GenericName:** `Data & ML App Framework`
- **Comment:** `Build and turn data scripts into shareable web apps`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Streamlit Studio" -- /usr/local/bin/zoth-streamlit`
- **Icon:** `/usr/share/pixmaps/zoth-ai.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;Education;`
- **Startup Notify:** `true`
- **File:** `/usr/share/applications/streamlit.desktop`

## Launch Configuration & Behavior

The desktop entry registers Streamlit Studio under the Development and Education categories as a Data & ML App Framework. Instead of launching directly in a detached shell, it delegates execution to `/usr/local/bin/zoth-konsole` titled "Streamlit Studio", which starts the wrapper script `/usr/local/bin/zoth-streamlit` while retaining startup notification hooks.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[CLI zoth-streamlit|zoth-streamlit]] · [[CLI zoth-konsole|zoth-konsole]]