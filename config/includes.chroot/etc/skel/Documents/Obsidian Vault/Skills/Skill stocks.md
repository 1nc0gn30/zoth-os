---
title: "stocks"
tags: [skill, hermes]
aliases: ["stocks"]
---

# stocks

Read-only stock quotes, historical OHLCV data, company search, ticker comparisons, and cryptocurrency pricing via Yahoo Finance.

- **Origin:** Hermes optional workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/finance/stocks/SKILL.md`
- **Prerequisites:** Python 3.8+ standard library (no pip packages required; optional `ALPHA_VANTAGE_KEY` to backfill crumb-protected fields)

## When to Load
Load this skill when looking up real-time stock prices (e.g., AAPL, TSLA), finding tickers from company names, evaluating historical price trends/OHLCV data, comparing ticker metrics side-by-side, or checking crypto quotes (e.g., BTC, ETH, SOL).

## Commands & Utility
Executed via `scripts/stocks_client.py` and outputs JSON to stdout:
- `quote SYMBOL [SYMBOL2 ...]`: Returns current price, change, change percentage, volume, and 52-week high/low.
- `search QUERY`: Searches company names and returns top 5 matches with symbol, name, exchange, and type.
- `history SYMBOL [--range RANGE]`: Fetches daily OHLCV records and summary statistics over ranges (`1mo`, `3mo`, `6mo`, `1y`, `5y`).
- `compare SYMBOL1 SYMBOL2 [...]`: Displays comparative price, change percentage, and 52-week metrics.
- `crypto SYMBOL [...]`: Queries crypto prices (automatically appends `-USD`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill dcf-model|dcf-model]] · [[Skill comps-analysis|comps-analysis]] · [[Skill lbo-model|lbo-model]]