---
title: "npx"
tags: [os, cli]
aliases: ["npx"]
---

# npx

Not a regular file in the ISO chroot `/usr/local/bin` (symlink, missing, or directory on this copy).

Image `/usr/local/bin/npx` is a **symlink** → `../lib/node_modules/npm/bin/npx-cli.js`.

Not a regular file in the chroot copy, so it was easy to miss. It is still part of the image PATH.

## See also

[[Host npx|host extra]] · 

[[Zoth OS]] · [[MOC CLIs]]