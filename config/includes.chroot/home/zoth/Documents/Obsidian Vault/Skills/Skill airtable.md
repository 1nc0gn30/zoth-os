---
title: "airtable"
tags: [skill, hermes]
aliases: ["airtable"]
---

# airtable

Airtable REST API integration executed directly via `curl` using the `terminal` tool. Provides record CRUD operations, schema inspection, formulas, filtering, and upserts without requiring an external MCP server or Python SDK.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/productivity/airtable/SKILL.md`
- **Platforms:** Linux, macOS, Windows

### When to Load
- Reading or mutating Airtable bases, tables, views, or records.
- Performing batched inserts or upserts keyed on merge fields (`performUpsert`).
- Querying records using encoded Airtable formulas (`filterByFormula`).

### Key Capabilities & Rules
- **Authentication:** Personal Access Token (`AIRTABLE_API_KEY`) passed as `Bearer` header; tokens are scoped per base.
- **Endpoint:** `https://api.airtable.com/v0` interacting with bases (`app...`), tables (`tbl...`), and records (`rec...`).
- **Inspection First:** Recommends listing tables via `/meta/bases/$BASE_ID/tables` before mutating to verify field names and choice options.
- **Batching & Rate Limits:** Supports up to 10 records per POST/DELETE batch request; rate limited to 5 requests/sec per base.
- **Output:** Piped through `python -m json.tool` to maintain clean formatting for the agent.

## See also

[[MOC Skills]] · [[Zoth OS]]