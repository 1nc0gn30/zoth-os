---
title: "Studio /workstations/:workstationId"
tags: [studio, route]
---
# Studio /workstations/:workstationId

Studio path `/workstations/:workstationId` renders local `WorkstationRedirect` in `zoth-studio-v2/src/App.jsx`, which `<Navigate>`s to `/tools/:workstationId`. It is not a page.

- **Local:** `http://127.0.0.1:3000/workstations/:workstationId`
- **Live:** `https://zoth.nullai.tech/workstations/:workstationId`
- **Skip intros:** `?intro=0`
- **Force intro:** `?intro=1`
- **Redirects to:** [[Route tools-toolId|/tools/:toolId]] · [[Page RealToolWorkspacePage|RealToolWorkspacePage]]
- **Declared in:** `zoth-studio-v2/src/App.jsx`


## See also

[[Zoth Studio]] · [[MOC Routes]] · [[Route tools-toolId|/tools/:toolId]] · [[MOC Workstations]]
