---
title: "product-price-monitor"
tags: [skill, hermes]
aliases: ["product-price-monitor"]
---

# product-price-monitor

- **Origin:** Hermes (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/productivity/product-price-monitor/SKILL.md`
- **Category:** Productivity / Shopping & Travel

## Overview
`product-price-monitor` automates price and availability tracking for purchasable products, flights, hotel rooms, or ticket listings. It standardizes all-in pricing (including taxes, fees, shipping, and currency conversion) and manages recurring monitoring tasks via cron schedules.

## When to Load
Load when instructed to monitor concrete items or travel listings for price drops or inventory availability over time (e.g., flight fare drops, hotel room openings, product discount thresholds). Not intended for one-off live price lookups.

## Operating Procedure
1. **Item Pinning**: Documents explicit URLs, SKU/product IDs, variants, sellers, and dates to ensure unambiguous identification.
2. **Threshold Setting**: Defines exact alert rules, target prices, currency handling, and notification delivery endpoints.
3. **Baseline & Job Creation**: Runs an initial live fetch via `web_extract` or browser navigation, persists state to `~/.hermes/price-watches/<watch-slug>.json`, and registers a Hermes `cronjob`.
4. **Scheduled Evaluation**: Ticks re-fetch data, compute normalized all-in totals, suppress duplicate alerts using stored fingerprints, and trigger alerts upon threshold entry.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill maps|maps]]