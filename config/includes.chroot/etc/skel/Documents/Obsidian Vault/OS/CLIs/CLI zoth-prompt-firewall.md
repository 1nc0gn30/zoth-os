---
title: "zoth-prompt-firewall"
tags: [os, cli]
aliases: ["zoth-prompt-firewall"]
---

# zoth-prompt-firewall

Chroot entry is a symlink → `agent-firewall`.

`zoth-prompt-firewall` is a Bash CLI launcher located at `/usr/local/bin/zoth-prompt-firewall` that executes the Agent Prompt Firewall application.

### Execution Flow

The script automates locating and starting the prompt firewall daemon or CLI interface:

1. **Pre-built CLI Binary**: Checks for an executable at `~/NullAITech/agent-prompt-firewall/bin/agent-firewall`. If found, it executes the binary passing through all CLI parameters.
2. **Python Package Fallback**: If the standalone binary does not exist but the module directory `~/NullAITech/agent-prompt-firewall/src/agent_prompt_firewall` is present, it exports `~/NullAITech/agent-prompt-firewall/src` to `PYTHONPATH` and invokes `python3 -m agent_prompt_firewall.cli "$@"`.
3. **Failure Exit**: If neither path exists on the host, it logs an error message to `stderr` and exits with status `1`.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-prompt-firewall`
- **Interpreter**: `/usr/bin/env bash` (`set -e`)
- **Attribution**: Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-prompt-firewall|zoth-prompt-firewall]]