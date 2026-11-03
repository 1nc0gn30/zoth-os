---
title: "solana"
tags: [skill, hermes]
aliases: ["solana"]
---

# solana

Workstation skill from Hermes (not a Zoth product). Authored by Deniz Alagoz (gizdusum) and Hermes Agent.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/blockchain/solana/SKILL.md`
- **Helper Script:** `~/.hermes/skills/blockchain/solana/scripts/solana_client.py`

## Overview

Queries Solana on-chain data enriched with USD pricing via CoinGecko without external dependencies or API keys. Uses Python standard library (`urllib`, `json`, `argparse`) against public or private RPC endpoints (`SOLANA_RPC_URL`).

## When to Load

- Looking up Solana wallet balances, SPL token holdings, and total portfolio values in USD.
- Inspecting transaction details by signature (status, fees, balance deltas).
- Fetching SPL token metadata, total supply, market cap, and top holders.
- Tracking recent transaction activity for an on-chain address.
- Checking live network statistics (slot, epoch, TPS) or querying current token prices (e.g. SOL, BONK, JUP).
- Scanning the latest block for large SOL transfers (whale detection).

## Supported CLI Commands

- `wallet <address>` — SOL and SPL balances with USD valuation and dust filtering.
- `tx <signature>` — Detailed transaction breakdown and program invocations.
- `token <mint>` — Metadata, supply, price, and top 5 token holders.
- `activity <address>` — Recent transaction history for an address (up to 25).
- `nft <address>` — Uncompressed NFT detection heuristic (`amount=1`, `decimals=0`).
- `whales [--min-sol N]` — Point-in-time large SOL transfer scan in latest block.
- `stats` — Network TPS, current slot, epoch, and SOL market cap.
- `price <mint_or_symbol>` — Fast price lookup for known tickers or mint IDs.

## See also

[[MOC Skills]] · [[Zoth OS]]