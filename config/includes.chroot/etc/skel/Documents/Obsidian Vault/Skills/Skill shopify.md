---
title: "shopify"
tags: [skill, hermes]
aliases: ["shopify"]
---

# shopify

**shopify** is an optional Hermes workstation skill providing lightweight patterns to interact directly with the Shopify Admin and Storefront GraphQL APIs using `curl` and `jq`.

- **Origin:** Hermes skill (`~/.hermes/hermes-agent/optional-skills/productivity/shopify/SKILL.md`)
- **Category:** Workstation skill (Hermes Productivity), not a Zoth product.
- **Prerequisites:** Environment variables `SHOPIFY_ACCESS_TOKEN` (`shpat_...`), `SHOPIFY_STORE_DOMAIN`, and tools `curl`, `jq`.

### When to Load
Load this skill when:
- Querying, creating, or modifying products, variants, and pricing on a Shopify merchant store without an external SDK.
- Managing stock quantities across multi-location inventory systems.
- Pulling order records, customer history, fulfillments, or custom metafields.
- Executing high-volume catalog exports via Shopify GraphQL Bulk Operations.

### Core Capabilities & Workflows
- **Direct GraphQL Execution:** Uses `shop_gql` curl wrappers posting to `/admin/api/${SHOPIFY_API_VERSION}/graphql.json` with the `X-Shopify-Access-Token` header.
- **Product & Variant Operations:** Queries catalog nodes via GID strings (`gid://shopify/Product/...`), runs `productCreate`, and batches variant adjustments (`productVariantsBulkCreate`).
- **Inventory Control:** Inspects location levels and updates stock using `inventoryAdjustQuantities` (deltas) or `inventorySetQuantities` (absolute counts).
- **Order & Customer Inspection:** Fetches order line items, payment status, and customer shipping details with pagination support.
- **Metafield Management:** Reads and updates arbitrary metadata via `metafieldsSet`.
- **Bulk Operations:** Triggers asynchronous `bulkOperationRunQuery` pipelines to dump massive datasets to JSONL files.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill airtable|airtable]] · [[Skill xurl|xurl]]