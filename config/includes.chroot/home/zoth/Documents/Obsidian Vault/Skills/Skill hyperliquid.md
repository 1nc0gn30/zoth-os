---
title: "hyperliquid"
tags: [skill, hermes]
aliases: ["hyperliquid"]
---

# hyperliquid

Read-only market data queries, account inspections, and post-trade analytics for Hyperliquid perpetuals and spot markets.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/blockchain/hyperliquid/SKILL.md`
- **Helper Script:** `~/.hermes/skills/blockchain/hyperliquid/scripts/hyperliquid_client.py`
- **Prerequisites:** Python stdlib (`urllib`, `json`, `argparse`); no API keys, private keys, or signing required.

## Purpose & Overview

The `hyperliquid` skill provides read-only inspection tools that interact with Hyperliquid's public `/info` API. It allows agents to monitor perpetual and spot market liquidity, audit wallet positions, review order execution, and export normalized candle and funding data for backtesting.

## When to Load

- Querying live perp and spot markets, open interest, and 24h volume (`markets`, `spots`, `dexs`).
- Fetching historical candlestick data or hourly funding rate histories (`candles`, `funding`).
- Inspecting live Level-2 order book depth and liquidity snapshots (`l2`).
- Auditing a wallet's active perpetual positions, margin state, or spot token balances (`state`, `spot-balances`).
- Analyzing historical fills and order execution records (`fills`, `orders`).
- Generating post-trade reviews summarizing realized PnL, fee drag, and trading heuristics (`review`).
- Exporting normalized market datasets to JSON for backtesting preparation (`export`).

## Core Commands

- `hyperliquid_client.py markets --limit 15 --sort volume`: Lists top perpetual contracts by volume.
- `hyperliquid_client.py candles <coin> --interval 1h --hours 24`: Retrieves OHLCV price candles.
- `hyperliquid_client.py state [address]`: Displays open perp positions, leverage, and margin health.
- `hyperliquid_client.py review [address] --hours 72`: Generates a post-trade performance and fee report.

## See also

[[MOC Skills]] · [[Zoth OS]]