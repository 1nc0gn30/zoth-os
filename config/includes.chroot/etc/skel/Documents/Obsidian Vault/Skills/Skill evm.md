---
title: "evm"
tags: [skill, hermes]
aliases: ["evm"]
---

# evm

Read-only multi-chain EVM client for inspecting wallet balances, ERC-20 tokens, transactions, contract metadata, and gas prices across 8 EVM networks without requiring API keys or third-party packages.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/blockchain/evm/SKILL.md`
- **Helper Script:** `~/.hermes/skills/blockchain/evm/scripts/evm_client.py`
- **Supported Chains:** Ethereum, BNB Chain (BSC), Base, Arbitrum One, Polygon, Optimism, Avalanche C-Chain, zkSync Era

## When to Load

Load when inspecting wallet portfolios, scanning an address across all 8 chains in parallel, decoding transaction input data via 4byte signatures, checking dangerous unlimited token allowances, resolving ENS names or reverse addresses, tracking gas costs, inspecting contract proxies, or detecting recent whale transfers.

## Key Tool Capabilities

- **Wallet & Multichain Portfolios:** Scans native balances and ~30 known ERC-20 tokens per chain with optional USD pricing via CoinGecko.
- **Transaction Decoding:** Translates call selectors and calldata using public function signatures from `4byte.directory`.
- **Security & Inspection:** Checks high-risk unlimited ERC-20 approvals against DEX/bridge contracts, and detects proxy patterns (EIP-1967/EIP-1167) and token standards (ERC-20/ERC-721/ERC-165).
- **ENS Resolution:** Resolves `.eth` names to addresses and reverse-resolves addresses using public ENS endpoints.
- **Gas & Network Stats:** Compares gas costs across all 8 networks simultaneously (note: L2 estimates cover execution gas only).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill solana|solana]]