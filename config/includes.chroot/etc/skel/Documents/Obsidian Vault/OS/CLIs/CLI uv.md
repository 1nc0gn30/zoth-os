---
title: "uv"
tags: [os, cli]
aliases: ["uv"]
---

# uv

Image `/usr/local/bin/uv` is a wrapper that must not PATH-exec uv (self-recursion). `file`: Bourne-Again shell script.

uv launcher. This file lives at /usr/local/bin/uv on the image, so it must never exec a PATH lookup named "uv" or it will call itself.

Image CLI `uv` at `/usr/local/bin/uv` (executable, 615 bytes).

**Shebang / kind:** `/usr/bin/env bash`

Image /usr/local/bin/uv is a wrapper that must not PATH-exec uv (self-recursion).

Live host also has `/usr/local/bin/uv` after the repo↔OS sync.

## See also

[[Zoth OS]] · [[MOC CLIs]]