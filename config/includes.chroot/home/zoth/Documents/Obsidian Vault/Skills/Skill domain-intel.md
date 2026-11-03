---
title: "domain-intel"
tags: [skill, hermes]
aliases: ["domain-intel"]
---

# domain-intel

Passive OSINT domain reconnaissance tool for discovering subdomains, inspecting SSL certificates, checking WHOIS records, and resolving DNS entries with zero external dependencies and zero API keys.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/domain-intel/SKILL.md`
- **Author:** FurkanL0, Hermes Agent

## When to Load
Load this skill when investigating domain infrastructure, checking TLS certificate expirations or SANs, discovering subdomains via Certificate Transparency, verifying WHOIS registration data, or running passive registration availability checks without using invasive active scanners.

## Tooling & Architecture
Operates via `scripts/domain_intel.py`, using purely Python standard library modules (`socket`, `ssl`, `urllib`, `json`, `concurrent.futures`):
- All command outputs are emitted as structured JSON.
- Compatible across Linux, macOS, and Windows.

## Key Commands & Data Sources
- **`subdomains`:** Passive subdomain discovery queried from Certificate Transparency logs (`crt.sh` over HTTPS).
- **`ssl`:** TLS certificate inspection (expiration date, cipher suite, Subject Alternative Names, issuer) via direct TCP connection to port 443.
- **`whois`:** Registration details, registrar, and lifecycle dates via direct TCP port 43 queries to authoritative WHOIS servers across 100+ TLDs.
- **`dns`:** Record lookups (A, AAAA, MX, NS, TXT, CNAME) utilizing system DNS and Google DNS-over-HTTPS (DoH).
- **`available`:** Heuristic registration check combining DNS, WHOIS, and SSL signals.
- **`bulk`:** Multi-threaded batch queries across multiple domains.

## See also

[[MOC Skills]] · [[Zoth OS]]