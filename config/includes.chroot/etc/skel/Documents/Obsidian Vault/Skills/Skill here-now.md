---
title: "here-now"
tags: [skill, hermes]
aliases: ["here-now"]
---

# here-now

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/productivity/here-now/SKILL.md`
- **Homepage:** `https://here.now`

## Overview
Enables agents to deploy static websites and share raw files at `{slug}.here.now`, as well as store private persistent agent data in cloud Drives. Anonymous uploads remain active for 24 hours (with a claim token), while authenticated accounts maintain permanent sites and default Drives.

## When to Load
- When publishing static HTML sites, SPAs, or raw media (images, PDFs, audio) directly to public web URLs from the CLI.
- When updating an existing deployment using its site slug.
- When an agent needs private cloud storage (`My Drive`) to persist notes, memory, context, or code without public web hosting.
- When sharing scoped Drive access tokens with other agents using path prefixes and TTLs.

## Key Tools & Scripts
- `scripts/publish.sh`: Three-step upload flow (create/update -> upload -> finalize). Supports `--slug`, `--spa`, `--ttl`, and `--forkable`.
- `scripts/drive.sh`: Private drive CLI supporting `ls`, `put`, `cat`, and scoped token sharing.
- **Dependencies:** Requires `curl`, `file`, and `jq`.
- **Credentials:** Reads from `~/.herenow/credentials`, `$HERENOW_API_KEY`, or OTP-based email verification.

## See also

[[MOC Skills]] · [[Zoth OS]]