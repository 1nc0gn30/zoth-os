---
title: "stripe-projects"
tags: [skill, hermes]
aliases: ["stripe-projects"]
---

# stripe-projects

Automated SaaS infrastructure provisioning, credential synchronization, and unified provider billing via the Stripe Projects CLI plugin.

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/payments/stripe-projects/SKILL.md`
- **Tooling & Platform:** Wraps the Stripe Projects plugin (`stripe plugin install projects`) via the Stripe CLI on Linux and macOS.

## When to Load
Load this skill when provisioning third-party SaaS services (such as Neon Postgres, Twilio SMS, or Runloop sandboxes), generating and writing service credentials directly into a project's local `.env`, rotating service API keys, or querying the available developer provider catalog.

## Commands & Workflow
Run from within the target project's root directory:
- `stripe projects init`: Initializes the project directory and sets up the encrypted credential vault (`.projects/vault/vault.json`).
- `stripe projects catalog`: Discovers supported third-party providers and backend services.
- `stripe projects add <provider>/<service>`: Provisions the requested resource under the user's account, writes environment secrets into `.env`, and links billing.
- `stripe projects list`: Inspects active providers and linked `.env` variable names.
- `stripe projects rotate <provider>` / `remove <provider>`: Rotates secret keys or deprovisions services.

> [!WARNING]
> Verify that `.env` is listed in `.gitignore` before adding services, as credentials written to disk are plain text.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill stripe-link-cli|stripe-link-cli]] · [[Skill mpp-agent|mpp-agent]]