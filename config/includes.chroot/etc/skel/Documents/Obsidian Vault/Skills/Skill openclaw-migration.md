---
title: "openclaw-migration"
tags: [skill, hermes]
aliases: ["openclaw-migration"]
---

# openclaw-migration

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/migration/openclaw-migration/SKILL.md`
- **Category:** Migration / Persona / Memory Import
- **Platforms:** Linux, macOS, Windows

## Overview

The `openclaw-migration` workstation skill imports existing OpenClaw configurations, personas, memories, and skills into Hermes Agent with structured conflict resolution and dry-run safety previews. It uses `scripts/openclaw_to_hermes.py` or the CLI command `hermes claw migrate`.

## When to Load

Load this skill when:
- Migrating an OpenClaw setup (`~/.openclaw`) into Hermes Agent during initial setup or system consolidation.
- Transforming OpenClaw memory files, persona instructions, and skills into Hermes-native formats.
- Auditing migration compatibility, dry-run diffs, and skipped or archived configuration artifacts.

## Core Capabilities & Workflows

- **CLI Interface:** Supports non-interactive or guided migration via `hermes claw migrate` with flags like `--dry-run`, `--preset user-data`, `--overwrite`, and `--source`.
- **Imported Assets:**
  - Converts `SOUL.md` into the Hermes home persona definition.
  - Transforms `MEMORY.md` and `USER.md` into Hermes memory entries.
  - Merges command approvals into `command_allowlist`.
  - Copies OpenClaw skills into `~/.hermes/skills/openclaw-imports/`.
  - Mirrors audio assets (`workspace/tts/`) into `~/.hermes/tts/`.
- **Migration Presets:** `user-data` (default safe migration excluding secrets) and `full` (adds allowlisted secrets such as `TELEGRAM_BOT_TOKEN` via `--migrate-secrets`).
- **Conflict Handling:** Provides structured resolution for conflicting `SOUL.md` or existing skill names (`skip`, `overwrite`, or `rename`), exporting a final audit report (`report.json` and `summary.md`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]]