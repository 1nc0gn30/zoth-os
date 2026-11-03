---
title: "polymarket"
tags: [skill, hermes]
aliases: ["polymarket"]
---

# Polymarket (Prediction Market Data)

A workstation skill from Hermes for querying prediction markets, betting odds, orderbooks, and price histories using Polymarket's public read-only REST APIs.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/finance/polymarket/SKILL.md`

## When to load
Load this skill when an agent or user needs prediction market data or event odds:
- Answering questions about real-world event probabilities and prediction market odds ("What are the odds of X happening?").
- Looking up specific Polymarket contracts, current Yes/No pricing, and trading volume.
- Inspecting orderbook depth, spreads, or historical pricing charts.
- Tracking market movements across politics, sports, crypto, culture, and macro events.
- *Note:* This skill is strictly read-only and requires zero authentication; it does not execute financial transactions or manage private keys.

## Key APIs & data structures
- **Three public endpoints:**
  - **Gamma API (`gamma-api.polymarket.com`):** High-level search and event discovery (`/events`, `/markets`).
  - **CLOB API (`clob.polymarket.com`):** Real-time pricing, orderbooks, and price history using token IDs and condition IDs.
  - **Data API (`data-api.polymarket.com`):** Open interest and transaction volume tracking.
- **Price as probability:** Binary market contract prices directly indicate implied probabilities (e.g., a Yes price of `0.65` indicates a 65% implied probability).
- **Data handling:** Handles double-encoded JSON fields returned by the Gamma API (such as `outcomePrices` and `clobTokenIds`), requiring string deserialization in Python.

## See also

[[MOC Skills]] · [[Zoth OS]]