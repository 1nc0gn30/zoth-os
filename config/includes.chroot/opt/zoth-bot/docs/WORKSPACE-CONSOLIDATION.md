# Workspace consolidation plan

Canonical root: `~/.config/zothos/zoth-bot/` (override with `ZOTH_BOT_ROOT`).
It holds state.json, bots/, skills/, workspace/, zoth-bot.db (SQLite), portal-token, keys.enc.json.

Found on zoth-pill (2026-10-17):

| Path | Files | Used by current code? |
|---|---|---|
| `~/.config/zothos/zoth-bot/workspace` | 3 | Yes (canonical) |
| `~/.local/share/zoth-bot/workspace` | 1 (README) | No |
| `~/.zoth-bot/workspace` | 1 (README) | No |

No code in this repo references the two legacy paths. Nothing was moved.

Steps (manual, after a backup):
1. `diff -r` each legacy workspace against the canonical one; copy anything unique into `workspace/legacy-<name>/`.
2. Replace each legacy dir with a symlink to the canonical workspace (keeps any external scripts working).
3. After a week with no breakage, delete the symlinks.
