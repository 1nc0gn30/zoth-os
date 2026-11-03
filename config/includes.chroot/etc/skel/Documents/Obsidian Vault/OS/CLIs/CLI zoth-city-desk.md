---
title: "zoth-city-desk"
tags: [os, cli]
aliases: ["zoth-city-desk"]
---

# zoth-city-desk

`file`: Python script, Unicode text, UTF-8 text executable.

`zoth-city-desk` is the command-line companion to [[Studio city-desk|City Desk]] and [[Component CivicProcurementGodModeTool|CivicProcurementGodModeTool]]. It calculates municipal RFP bids, evaluates Firm-Fixed-Price margins, and analyzes regional solicitation ceilings across Hampton Roads (757) and Commonwealth of Virginia eVA opportunities.

## Usage & Options

```bash
zoth-city-desk [-h] [--hours HOURS] [--rate RATE] [--json]
```

- **`--hours HOURS`**: Estimated engineering labor hours (default: 420)
- **`--rate RATE`**: Billable hourly rate in USD (default: $165)
- **`--json`**: Output bid calculations, net margins, and solicitation matrices as structured JSON

## Solicitation Coverage

- **`RFP-757-2026-CYBER-09`**: Hampton Roads (757) Municipal Enclave — Ceiling: $185,000 (NAICS 541512)
- **`QQ-EVA-2026-8841`**: Virginia eVA Quick-Quote Micro-Purchase — Ceiling: $48,500 (NAICS 541511)
- **`N261-042-SBIR`**: DoD / Navy NSWC Norfolk Innovation Grant — Ceiling: $250,000 (NAICS 541715)

## Implementation Details

- **Path**: `/usr/local/bin/zoth-city-desk` (symlinked from `~/.local/bin/zoth-city-desk`)
- **Runtime**: `/usr/bin/env python3`
- **Zero External Dependencies**: Pure Python standard library implementation (`argparse`, `json`)
- **Procurement Logic**: Computes total bid price, estimated direct labor burden, net dollar margin, and net margin percentage

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio city-desk|City Desk]] · [[Component CivicProcurementGodModeTool|CivicProcurementGodModeTool]]
