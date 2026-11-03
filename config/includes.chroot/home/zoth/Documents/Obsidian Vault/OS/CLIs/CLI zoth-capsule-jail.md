---
title: "zoth-capsule-jail"
tags: [os, cli]
aliases: ["zoth-capsule-jail"]
---

# zoth-capsule-jail

Chroot entry is a symlink → `agent-capsule`.

`zoth-capsule-jail` is the command-line wrapper script located at `/usr/local/bin/zoth-capsule-jail`, engineered by 1nc0gn30 • NullAI for the NullAI Platform.

It acts as the primary system entry point for launching the Agent Capsule Jail environment, forwarding all command-line arguments to the underlying runtime.

### Execution Flow

The script resolves and executes the Agent Capsule Jail binary or Python module in order of preference:

1. **Compiled / Direct Binary**:
   - Checks for an executable binary at `/home/zoth/NullAITech/agent-capsule-jail/bin/agent-capsule`.
   - If present and executable, delegates execution directly via `exec`.
2. **Python Module Fallback**:
   - If the standalone binary is absent, checks for the repository source directory at `/home/zoth/NullAITech/agent-capsule-jail/src/agent_capsule_jail`.
   - Exports `/home/zoth/NullAITech/agent-capsule-jail/src` to `PYTHONPATH` and executes `python3 -m agent_capsule_jail.cli "$@"`.
3. **Error Handling**:
   - If neither path exists, outputs an error message to `stderr` and exits with status code `1`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-capsule-jail|zoth-capsule-jail]]