---
title: "zoth-flight-recorder"
tags: [os, cli]
aliases: ["zoth-flight-recorder"]
---

# zoth-flight-recorder

Chroot entry is a symlink → `agent-flight`.

`zoth-flight-recorder` is a bash wrapper script located at `/usr/local/bin/zoth-flight-recorder` for the Agent Flight Recorder telemetry and monitoring tool.

### Execution Flow

The wrapper resolves and launches the flight recorder binary or module:
1. **Primary Binary**: Checks for an executable at `/home/zoth/NullAITech/agent-flight-recorder/bin/agent-flight` and executes it directly if present.
2. **Python Module Fallback**: If the primary binary is not executable, checks for `/home/zoth/NullAITech/agent-flight-recorder/src/agent_flight_recorder`. It sets `PYTHONPATH` to `/home/zoth/NullAITech/agent-flight-recorder/src` and launches via `python3 -m agent_flight_recorder.cli`.
3. **Error Reporting**: If neither location exists, outputs an error message to `stderr` and exits with status 1.

All CLI parameters (`"$@"`) are passed through to the invoked runner.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-flight-recorder|zoth-flight-recorder]]