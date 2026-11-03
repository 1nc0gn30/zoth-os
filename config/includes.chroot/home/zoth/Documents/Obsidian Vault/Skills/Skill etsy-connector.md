---
title: "etsy-connector"
tags: [skill, agy]
aliases: ["etsy-connector"]
---

# etsy-connector

- **Origin:** Gemini / AGY skill (`~/.gemini/config/skills/etsy-connector/SKILL.md`)
- **When to load:** Load when researching Etsy marketplace products, auditing listing SEO, modeling seller fees/margins, looking up taxonomy categories, drafting listings, or generating Print-on-Demand (POD) fulfillment payloads.

## Overview & MCP Tools

`etsy-connector` connects Antigravity to the Etsy Open API v3 and Print-on-Demand (POD) workflows (such as Printify). When active in `mcp_config.json`, it exposes 8 specialized MCP tools:

- `etsy_search_listings`: Queries active marketplace listings by keywords and price range.
- `etsy_audit_listing_seo`: Validates titles (≤140 chars) and tags against ranking requirements.
- `etsy_calculate_profit_margins`: Models Etsy fees, POD base costs, and shipping to determine net profits.
- `etsy_get_taxonomy_categories`: Looks up category taxonomy IDs for listing placement.
- `etsy_create_draft_listing`: Generates new draft product listings on Etsy.
- `etsy_upload_listing_image`: Uploads mockup photos and arranges display ranks.
- `etsy_get_shop_details`: Fetches shop performance metrics, active listings, and reviews.
- `etsy_generate_pod_payload`: Formats blueprint payloads for POD creation.

## Etsy SEO & Financial Invariants

- **Title Constraints:** Maximum 140 characters; primary keywords must be front-loaded in the first 40 characters for mobile display cards.
- **Tag Constraints:** Exactly 13 multi-word tags, strictly ≤20 characters each, with no duplicates.
- **Fee Structure:** Factors in $0.20 listing renewal, 6.5% transaction fee, and 3.0% + $0.25 payment processing fee.
- **Simulation Mode:** Automatically falls back to high-fidelity mock data if live API keystrings and tokens are unconfigured.

## See also

[[MOC Skills]] · [[Zoth OS]]