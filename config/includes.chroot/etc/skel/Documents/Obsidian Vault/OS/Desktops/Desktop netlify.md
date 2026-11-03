---
title: "Netlify CLI"
tags: [os, desktop]
aliases: ["netlify", "Netlify CLI"]
---

# Netlify CLI

Develop, build, test, and deploy projects to Netlify.

## Desktop Entry Details

- **Name:** `Netlify CLI`
- **Generic Name:** `Serverless & Edge Deployment`
- **Comment:** `Develop, build, test, and deploy projects to Netlify`
- **Exec:** `/usr/local/bin/zoth-konsole --title "Netlify CLI" -- /usr/local/bin/zoth-netlify`
- **Icon:** `/usr/share/pixmaps/zoth-web3.png`
- **Terminal:** `false`
- **Type:** `Application`
- **Categories:** `Development;Cloud;`
- **Startup Notify:** `true`
- **Keywords:** `netlify;deploy;serverless;functions;cli;`
- **File:** `/usr/share/applications/netlify.desktop`

## Launch Configuration & Behavior

The desktop entry catalogs Netlify CLI under Development and Cloud tools for serverless and edge deployments. Rather than launching directly into a standard shell, it delegates execution to `/usr/local/bin/zoth-konsole` configured with the window title `"Netlify CLI"`, executing the wrapper script `/usr/local/bin/zoth-netlify` with startup notification enabled.

## See also

[[Zoth OS]] · [[MOC Desktops]] · [[MCP netlify|netlify]] · [[CLI zoth-netlify|zoth-netlify]] · [[CLI netlify|netlify]]