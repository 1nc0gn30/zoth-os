---
title: "apple-reminders"
tags: [skill, hermes]
aliases: ["apple-reminders"]
---

# apple-reminders

Terminal management of Apple Reminders via the `remindctl` CLI utility. Allows reading, creating, and editing reminder tasks that synchronize across macOS and iOS via iCloud.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/skills/apple/apple-reminders/SKILL.md`
- **Platforms:** macOS only
- **Prerequisites:** `remindctl` (`brew install steipete/tap/remindctl`) with Reminders permission granted

### When to Load
- Adding or listing user reminders and personal tasks that sync to iPhone/iPad.
- Managing named reminder lists (`remindctl list <Name> --create`).
- Checking due, overdue, or daily reminder schedules.

### When NOT to Use
- Scheduling internal agent alerts or recurring cron timers (use the scheduling tool).
- Calendar event scheduling or team project management.

### Key Capabilities
- **Inspecting Tasks:** `remindctl` (today), `remindctl overdue`, `remindctl week`, `remindctl all`, or date-specific queries.
- **Creating Tasks:** `remindctl add --title "..." --list "..." --due "..."`.
- **Due Time vs Alarm:** Supports explicit `--alarm` parameters for early nudge notifications separate from `--due` dates.

## See also

[[MOC Skills]] · [[Zoth OS]]