---
title: "mpp-agent"
tags: [skill, hermes]
aliases: ["mpp-agent"]
---

# mpp-agent

Pay HTTP 402 APIs via Machine Payments Protocol (MPP).

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/payments/mpp-agent/SKILL.md`

## Overview & When to Load

Load when interacting with paid APIs that return `HTTP 402 Payment Required` with a `www-authenticate` header, establishing autonomous agent wallets, or paying per-request web services.

## Client Options & Routing

- **Client Selection:**
  - `mppx`: Lightweight CLI for debugging and standalone calls (`npm install -g mppx`). Inspects challenges via `curl -i` and settles them with `mppx <url>`.
  - `link-cli`: Preferred when the 402 header advertises `method="stripe"` or the user uses Stripe Link (see `stripe-link-cli`).
  - `Tempo Wallet`: Used when persistent spend controls or service discovery are needed (`tempo wallet login`).
  - `Privy Agent CLI`: Supports multi-chain agent wallets and browser-based funding.
  - `AgentCash`: Accesses 300+ pre-priced machine endpoints through a unified USDC.e balance.
- **Key Operational Safeguards:**
  - *Zero-Exposure Credentials:* Private keys and wallet credentials remain inside local client configs and must never enter the agent conversation context.
  - *Zero-Amount Challenges:* Handles `$0.00` challenges that require proof credentials without funded balances.
  - *Client Scope:* Dedicated to agent client-side payment execution; hosting server-side MPP endpoints requires external server middlewares.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill stripe-link-cli|stripe-link-cli]] · [[Skill stripe-projects|stripe-projects]]