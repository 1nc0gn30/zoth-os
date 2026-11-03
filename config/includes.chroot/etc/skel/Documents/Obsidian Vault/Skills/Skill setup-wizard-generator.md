---
title: "setup-wizard-generator"
tags: [skill, hermes]
aliases: ["setup-wizard-generator"]
---

# setup-wizard-generator

**setup-wizard-generator** is an optional Hermes workstation skill that creates interactive Bash setup wizards to guide human operators through complex manual procedures.

- **Origin:** Hermes skill (`~/.hermes/hermes-agent/optional-skills/devops/setup-wizard-generator/SKILL.md`, ported from Matt Pocock's `wizard` skill)
- **Category:** Workstation skill (Hermes DevOps), not a Zoth product.
- **Dependencies:** `bash`, optional `gh` CLI (for GitHub secrets/variables).

### When to Load
Load this skill when:
- Orchestrating third-party console provisioning (e.g. Stripe, Supabase, OAuth apps, DNS) requiring manual human dashboard clicks.
- Guiding developers through populating `.env` files, CI secrets, or repository variables.
- Conducting human-gated cutovers or irreversible database migrations.
- Note: Do NOT use this skill for steps the AI agent can perform autonomously.

### Core Capabilities & Methodology
- **Standardized Wizard Template:** Uses a structured library (`templates/template.sh`) with standard functions (`stage`, `open_url`, `ask`, `ask_secret`, `write_env`, `set_secret`, `confirm`, `finish`).
- **Stage Isolation:** Clears screen per stage with step-by-step guidance and remaining progress counters so human context isn't lost.
- **Secure Secret Handling:** Distinguishes between visible inputs (`ask`) and masked credential entries (`ask_secret`).
- **Static Verification:** Enforces syntax validation via `bash -n` and `shellcheck` with end-to-end destination tracing instead of blocking on interactive terminal execution.

## See also

[[MOC Skills]] · [[Zoth OS]]