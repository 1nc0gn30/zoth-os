---
title: "shop"
tags: [skill, hermes]
aliases: ["shop"]
---

# shop

**shop** is an optional Hermes workstation skill integrating the Shop CLI (`@shopify/shop-cli`) to enable conversational product discovery, order management, and agent-assisted checkouts.

- **Origin:** Hermes skill (`/home/zoth/.hermes/hermes-agent/optional-skills/productivity/shop/SKILL.md`)
- **Category:** Workstation skill (Hermes Productivity / E-commerce), not a Zoth product.
- **Dependencies:** `@shopify/shop-cli` (`shop`), `curl`, `node`.

### When to Load
Load this skill when:
- Searching for products, querying availability, or finding similar items across the Shop merchant catalog.
- Managing e-commerce checkouts, shipping rate calculations, and order creation.
- Tracking existing package deliveries, managing product returns, or executing reorders.

### Core Capabilities & Protocol
- **Catalog Search & Filtering:** Uses `shop search` with geographic filters (`--ships-to`, `--currency`, `--country`), product variants (`--like-id`), and visual image input (`--image`).
- **Conversational Presentation Rules:** Enforces displaying exactly one message per product card, localizing currency, and following up with a recommendation summary.
- **Agent Checkout Flow:** Creates checkouts via bare merchant domains (`shop checkout create/update/complete`) requiring explicit purchase confirmation and delegated budget checks.
- **Order Tracking & Returns:** Queries historical purchases and shipping tracking numbers (`shop orders search --type tracking`).
- **Security & Safety Guardrails:** Defends against prompt injections embedded in merchant descriptions, protects buyer PII, and restricts prohibited merchandise categories.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill shopify|shopify]] · [[Skill maps|maps]]