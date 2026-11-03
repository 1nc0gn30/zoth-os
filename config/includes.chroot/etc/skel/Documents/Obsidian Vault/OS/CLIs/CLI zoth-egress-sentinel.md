---
title: "zoth-egress-sentinel"
tags: [os, cli]
aliases: ["zoth-egress-sentinel"]
---

# zoth-egress-sentinel

Chroot entry is a symlink → `agent-egress`.

`zoth-egress-sentinel` is a bash wrapper script located at `/usr/local/bin/zoth-egress-sentinel` that launches the Agent Egress Sentinel CLI utility.

### Overview & Execution Logic

The script resolves and launches the egress sentinel via two fallback paths:
1. **Primary binary**: Checks for an executable binary at `~/NullAITech/agent-egress-sentinel/bin/agent-egress`. If found, executes it directly using `exec`.
2. **Python module fallback**: Checks for `~/NullAITech/agent-egress-sentinel/src/agent_egress_sentinel`. If present, sets `PYTHONPATH` to include `~/NullAITech/agent-egress-sentinel/src` and runs `python3 -m agent_egress_sentinel.cli`.
3. **Error handling**: If neither binary nor package directory is found, prints an error to standard error and exits with code 1.

All command-line arguments (`"$@"`) are passed through to the underlying runner.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-egress-sentinel|zoth-egress-sentinel]]