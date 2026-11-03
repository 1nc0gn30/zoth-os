---
title: "zoth"
tags: [os, cli]
aliases: ["zoth"]
---

# zoth

Studio CLI (`/opt/zoth-studio/bin/zoth.js`). Starts the memory daemon, signal bridge, and vault from Studio `backend/`. Pulls published tools into `./tools` on request. Usage: `npm run zoth -- <command>` from the Studio repo. Chroot entry is a symlink → `/opt/zoth-studio/bin/zoth.js`.

Image CLI `zoth` at `/usr/local/bin/zoth` (executable, 13,450 bytes).

**Shebang / kind:** `/usr/bin/env node`

No header comment in the chroot copy.

Live host also has `/usr/local/bin/zoth` after the repo↔OS sync.

## See also

[[Zoth OS]] · [[MOC CLIs]]