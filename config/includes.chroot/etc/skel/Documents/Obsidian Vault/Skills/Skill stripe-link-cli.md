---
title: "stripe-link-cli"
tags: [skill, hermes]
aliases: ["stripe-link-cli"]
---

# stripe-link-cli

Autonomous agent checkout and payment handling via Stripe Link using one-time virtual cards or Shared Payment Tokens (SPT).

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/payments/stripe-link-cli/SKILL.md`
- **Tooling & Platform:** Wraps `@stripe/link-cli` (Node.js 20+; Linux & macOS; US-only Link account requirement)

## When to Load
Load this skill when processing automated checkout requests ("buy X", "pay for X"), acquiring payment credentials for merchant checkouts, connecting a Link wallet, or handling HTTP 402 payment required responses (`method="stripe"`).

## Key Workflows & Security Constraints
- **Human Approval Gate:** All spends require user authorization via the Link mobile or web app (`--request-approval`); agents cannot self-approve transactions.
- **Credential Modes:**
  - `card`: For standard web forms and Stripe Elements checkouts.
  - `shared_payment_token`: For API-level Machine Payment Protocol (MPP) HTTP 402 endpoints.
- **PAN Isolation:** Primary Account Numbers (PANs) are saved directly to local files with `0600` permissions (`--output-file`) and never dumped to stdout or transcript context, followed by cleanup upon checkout completion.
- **MCP Support:** Can optionally run as a background MCP server via `npx @stripe/link-cli --mcp`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill mpp-agent|mpp-agent]] · [[Skill stripe-projects|stripe-projects]]