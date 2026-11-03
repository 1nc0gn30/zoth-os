---
title: "zoth-agent-conductor"
tags: [os, cli]
aliases: ["zoth-agent-conductor"]
---

# zoth-agent-conductor

`file`: Bourne-Again shell script.

`zoth-agent-conductor` is the ZothOS Sovereign Agent Conductor CLI wrapper script located at `/usr/local/bin/zoth-agent-conductor`.

## Purpose & Execution Flow

The bash wrapper resolves and executes the agent conductor runtime through fallback stages:

1. **Primary Binary**: Checks for an executable at `~/NullAITech/bin/zoth-agent-conductor`. If present, delegates execution directly with all passed arguments.
2. **Python Module Fallback**: If the primary binary is absent but `~/NullAITech/src/conductor` exists, adds `~/NullAITech/src` to `PYTHONPATH` and invokes `python3 -m conductor "$@"`.
3. **Error Handling**: Exits with code `1` and emits an error if neither target location exists.

## Runtime Details

- **Path**: `/usr/local/bin/zoth-agent-conductor`
- **Interpreter**: `/usr/bin/env bash`
- **Target Workspace**: `~/NullAITech`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-agent-conductor|zoth-agent-conductor]]