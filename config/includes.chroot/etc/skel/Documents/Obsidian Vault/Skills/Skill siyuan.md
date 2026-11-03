---
title: "siyuan"
tags: [skill, hermes]
aliases: ["siyuan"]
---

# siyuan

**siyuan** is an optional Hermes workstation skill that provides patterns for querying, creating, and editing documents in a self-hosted SiYuan knowledge base using its HTTP kernel API.

- **Origin:** Hermes skill (`~/.hermes/hermes-agent/optional-skills/productivity/siyuan/SKILL.md`)
- **Category:** Workstation skill (Hermes Productivity / PKM), not a Zoth product.
- **Prerequisites:** Environment variable `SIYUAN_TOKEN`, optional `SIYUAN_URL` (default `http://127.0.0.1:6806`), `curl`, `jq`.

### When to Load
Load this skill when:
- Querying, reading, appending, or updating structured document blocks inside a local or remote SiYuan note instance.
- Running full-text block searches or SQL queries across personal knowledge graphs.
- Automating document imports, markdown exports, or custom block attribute tags (`custom-*`).

### Core Capabilities & Protocol
- **API Request Pattern:** Uses `POST` requests with JSON payloads and the `Authorization: Token $SIYUAN_TOKEN` header. Success is signaled by `{"code": 0}`.
- **Search & SQL Engine:** Executes full-text search (`/api/search/fullTextSearchBlock`) and SQL table queries (`/api/query/sql`, read-only `SELECT`).
- **Block-Level Operations:** Inspects Kramdown source (`/api/block/getBlockKramdown`), appends blocks (`/api/block/appendBlock`), and modifies content (`/api/block/updateBlock`).
- **Document Management:** Creates new markdown pages (`/api/filetree/createDocWithMd`), inspects notebook hierarchies (`/api/notebook/lsNotebooks`), and exports full markdown trees (`/api/export/exportMdContent`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obsidian|obsidian]] · [[Skill notion|notion]]