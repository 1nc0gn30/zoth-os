---
title: "zoth-mock-twin"
tags: [os, cli]
aliases: ["zoth-mock-twin"]
---

# zoth-mock-twin

Chroot entry is a symlink → `agent-mock-twin`.

`zoth-mock-twin` is the CLI wrapper for the Agent Mock Twin suite, engineered by 1nc0gn30 (@1nc0gn30) for the NullAI Platform.

## Execution Flow

The script attempts to resolve and launch `agent-mock-twin` using a three-tier fallback order:

1. **Primary Binary**: Executes `~/NullAITech/agent-mock-twin/bin/agent-mock-twin` if executable.
2. **Alternate Binary**: Executes `~/NullAITech/agent-mock-twin/bin/agent-mock` if executable.
3. **Python Module Fallback**: If neither binary exists, checks for `~/NullAITech/agent-mock-twin/src/agent_mock_twin`. If present, prepends `src` to `PYTHONPATH` and runs:
   ```bash
   exec python3 -m agent_mock_twin.cli "$@"
   ```
4. **Error Handling**: Outputs an error to `stderr` and exits with code 1 if no target executable or package directory is located.

## Paths

- **Wrapper Script**: `/usr/local/bin/zoth-mock-twin`
- **Repository Root**: `~/NullAITech/agent-mock-twin`
- **Primary Binary**: `~/NullAITech/agent-mock-twin/bin/agent-mock-twin`
- **Alternate Binary**: `~/NullAITech/agent-mock-twin/bin/agent-mock`

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-mock-twin|zoth-mock-twin]]