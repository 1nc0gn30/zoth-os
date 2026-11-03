---
title: "statusline"
tags: [skill, grok]
aliases: ["statusline"]
---

# statusline

Skill for configuring the optional live status-line row in Grok Build.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/statusline`)
- **When to load:** When configuring, troubleshooting, or scripting the status bar in Grok Build.

### Key Capabilities & Configuration
- **Config Target:** Written to `[ui.status_line]` inside `$GROK_HOME/config.toml` (or `~/.grok/config.toml`). Only configured at the user level, not per repository.
- **Built-in Mode (`type = "builtin"`):**
  - Displays context items: `cwd`, `model`, `context`, `cost`, `turn-timer`, `session-name` (default: `cwd`, `model`, `context`).
- **Custom Script Mode (`type = "command"`):**
  - Executes a local shell script (e.g., `command = "~/.grok/statusline.sh"`).
  - Optional `refresh_interval` (1–86400 seconds) updates the line on a timer; otherwise updates on state changes.
  - `padding` (0–16) controls inset.
- **Disabled Mode (`type = "disabled"`):** Hides the row (`off`, `none`, and `hidden` are valid aliases).

### Script Contract & Stdin Context
- Grok pipes session context as JSON to stdin: `cwd`, `session_id`, `session_name`, `transcript_path`, `model.display_name`, `workspace.repo_root`, `context_window.used_percentage`, `cost.total_cost_usd`, and `trigger`.
- Output is captured from stdout: up to 5 lines, 1024 characters per line, with a 10-second execution timeout. Supports ANSI styling and OSC 8 terminal hyperlinks.
- Config edits take effect on restart; external script edits update immediately on the next trigger.

## See also

[[MOC Skills]] · [[Zoth OS]]