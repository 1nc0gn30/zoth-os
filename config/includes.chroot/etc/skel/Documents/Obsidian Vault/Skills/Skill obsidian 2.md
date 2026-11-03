---
title: "obsidian"
tags: [skill, hermes]
aliases: ["obsidian"]
---

# obsidian

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/note-taking/obsidian/SKILL.md`
- **Category:** Note-Taking / Knowledge Management
- **Platforms:** Linux, macOS, Windows

## Overview

The `obsidian` workstation skill establishes filesystem-first conventions for navigating, searching, creating, and modifying notes in local Obsidian vaults. It guides agents to interact with Markdown notes cleanly without relying on fragile shell pipelines.

## When to Load

Load this skill when:
- Reading, searching, or exploring existing markdown files within an Obsidian vault.
- Creating new structured notes or appending content to existing sections.
- Linking concepts across knowledge graphs using standard Obsidian ``wikilink` syntax` syntax.
- Managing vault files in environments where vault directories may contain spaces.

## Key Principles & Conventions

- **Path Resolution:** Resolves vault locations via the `OBSIDIAN_VAULT_PATH` environment variable, defaulting to `~/Documents/Obsidian Vault`. Always passes fully-resolved absolute paths to avoid expansion failures.
- **Native File Tools Over Shell:** Prefers structured tools (`read_file`, `write_file`, `patch`, `search_files`) over shell utilities (`cat`, `echo`, `grep`, `find`) to eliminate quoting pitfalls and handle whitespace safely.
- **Searching:** Uses structured file search for filenames (`target: "files"`, `pattern: "*.md"`) and regex searches across note contents (`target: "content"`).
- **Targeted Edits & Wikilinks:** Employs anchored patches for contextual edits, writes complete files when updating whole structures, and links related documents via `note-name wikilinks` wikilinks.

## See also

[[MOC Skills]] · [[Zoth OS]]