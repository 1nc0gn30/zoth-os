---
title: "osint-investigation"
tags: [skill, hermes]
aliases: ["osint-investigation"]
---

# osint-investigation

Investigative framework for public-records cross-referencing and financial discovery using Python standard library tools without external dependencies. Resolves entities and constructs evidence chains across corporate disclosures, government contracts, lobbying, sanctions, litigation, and public property records.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/osint-investigation/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When investigating corporate structures, beneficial ownership, or board memberships.
- When tracing federal contract awards (USAspending) and lobbying disclosures (Senate LD-1/LD-2).
- When screening entities against sanctions (OFAC SDN) or offshore leaks (ICIJ).
- When cross-referencing court dockets (CourtListener), property records (NYC ACRIS), web archives (Wayback Machine), or international news (GDELT).
- Do NOT use for general web browsing (`web_search`), domain DNS analysis (`domain-intel`), or academic literature (`arxiv`).

## Key Data Sources & Tools
- **Corporate & Regulatory:** SEC EDGAR (`fetch_sec_edgar.py`), OpenCorporates (`fetch_opencorporates.py`), USAspending (`fetch_usaspending.py`), Senate LDA (`fetch_senate_ld.py`).
- **Sanctions & Offshore:** OFAC SDN snapshot (`fetch_ofac_sdn.py`), ICIJ Offshore Leaks (`fetch_icij_offshore.py`).
- **Legal & Property:** CourtListener opinions/dockets (`fetch_courtlistener.py`), NYC ACRIS property deeds/mortgages (`fetch_nyc_acris.py`).
- **Narrative & Media:** GDELT global news (`fetch_gdelt.py`), Wikipedia/Wikidata entities (`fetch_wikipedia.py`), Wayback Machine (`fetch_wayback.py`).
- **Entity resolution:** Normalizes entity names to CSV and builds structured evidence chains with confidence ratings.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill domain-intel|domain-intel]] · [[Skill arxiv|arxiv]]