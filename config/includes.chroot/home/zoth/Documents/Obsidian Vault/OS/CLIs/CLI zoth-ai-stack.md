---
title: "zoth-ai-stack"
tags: [os, cli]
aliases: ["zoth-ai-stack"]
---

# zoth-ai-stack

`file`: Bourne-Again shell script.

`zoth-ai-stack` is an executable CLI wrapper located at `/usr/local/bin/zoth-ai-stack`.

## Purpose & Execution Flow

The script acts as a standardized entry point to the ZOTH AI environment, forwarding all invocations directly to the main launcher:

```bash
#!/usr/bin/env bash
# Zoth AI Stack Executable Wrapper
exec /usr/local/bin/zoth-ai "$@"
```

When executed:
- It replaces the shell process with `/usr/local/bin/zoth-ai` using `exec`.
- All arguments and environment configurations are passed through without modification.
- Initiates either the Electron GUI cockpit or headless AI runtime checks depending on the display environment.

## Runtime Metadata

- **Path**: `/usr/local/bin/zoth-ai-stack`
- **Interpreter**: `/usr/bin/env bash`
- **Upstream Target**: `/usr/local/bin/zoth-ai`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-ai-stack|zoth-ai-stack]] · [[CLI zoth-ai|zoth-ai]]