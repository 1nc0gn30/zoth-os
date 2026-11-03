---
title: "yuanbao"
tags: [skill, hermes]
aliases: ["yuanbao"]
---

# yuanbao

Integration skill for interacting with Tencent Yuanbao (元宝) groups ("派") and users.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/yuanbao/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to load
Load this skill when operating inside Yuanbao chat groups to:
- Query group metadata and participant rosters
- Look up member nicknames for mentions
- Send direct messages (DMs / 私信) to individual users
- Attach media files (images or documents) to direct messages

## Available Tools & Mechanics
- **`yb_query_group_info`:** Retrieves group name, owner ID, and member count.
- **`yb_query_group_members`:** Searches group members by name, lists bot assistants, or fetches exact nicknames.
- **`yb_send_dm`:** Sends private messages with optional `media_files` to target group members.
- **Messaging Flow:** Chat responses returned by the agent are dispatched directly by the gateway. Including `@nickname` in standard reply text automatically formats a live notification.

## See also

[[MOC Skills]] · [[Zoth OS]]