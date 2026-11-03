---
title: "apple-notes"
tags: [skill, hermes]
aliases: ["apple-notes"]
---

# apple-notes

Terminal interface for managing Apple Notes on macOS using the `memo` command-line utility. Notes synchronize across Apple devices via iCloud.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/apple/apple-notes/SKILL.md`
- **Platforms:** macOS only
- **Prerequisites:** `memo` CLI (`brew tap antoniorodr/memo && brew install antoniorodr/memo/memo`) and Automation permissions for Notes.app

### When to Load
- Creating, searching, or listing Apple Notes for cross-device iCloud access.
- Organizing notes into folders or exporting notes to HTML or Markdown.

### When NOT to Use
- Managing Markdown knowledge vaults (use the [[Skill obsidian|obsidian]] skill instead).
- Internal agent scratchpads or memory (use the internal `memory` tool).

### Common Operations
- **List / Search:** `memo notes`, filter by folder with `-f "Folder"`, or fuzzy-search with `-s "query"`.
- **Create:** `memo notes -a` (opens `$EDITOR`) or target a folder with `-f`.
- **Manage:** Interactive flags for editing (`-e`), deleting (`-d`), and moving (`-m`).
- **Export:** `memo notes -ex` exports notes to HTML or Markdown.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obsidian|obsidian]]