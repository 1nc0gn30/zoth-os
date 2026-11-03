---
title: "zoth-policy-auditor"
tags: [os, cli]
aliases: ["zoth-policy-auditor"]
---

# zoth-policy-auditor

Chroot entry is a symlink → `agent-policy`.

`zoth-policy-auditor` is a Bash CLI wrapper located at `/usr/local/bin/zoth-policy-auditor` that launches the Agent Policy Auditor utility.

### Execution Flow

The script inspects local paths in `/home/zoth/NullAITech/agent-policy-auditor` to execute the policy auditor:

1. **Pre-compiled / Standalone Binary**: Checks for an executable binary at `/home/zoth/NullAITech/agent-policy-auditor/bin/agent-policy`. If present, it directly executes it with all passed CLI arguments.
2. **Module Execution Fallback**: If the standalone binary is absent but the package directory `/home/zoth/NullAITech/agent-policy-auditor/src/agent_policy_auditor` exists, it prepends the repository's `src/` directory to `PYTHONPATH` and runs `python3 -m agent_policy_auditor.cli "$@"`.
3. **Exit Failure**: If neither target is discovered, it emits an error message to `stderr` and exits with return code `1`.

### Technical Metadata

- **Location**: `/usr/local/bin/zoth-policy-auditor`
- **Interpreter**: `/usr/bin/env bash` (`set -e`)
- **Attribution**: Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-policy-auditor|zoth-policy-auditor]]