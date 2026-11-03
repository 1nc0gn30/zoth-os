---
title: "oss-forensics"
tags: [skill, hermes]
aliases: ["oss-forensics"]
---

# oss-forensics

A 7-phase multi-agent forensic investigation framework for researching open-source software supply chain compromises, suspicious commits, maintainer takeovers, and deleted git history. Adapted from RAPTOR's forensics methodology.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/security/oss-forensics/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When investigating a GitHub repository for supply chain compromise or backdoors.
- When auditing force-pushes, branch deletions, or recovering deleted commits.
- When analyzing suspicious pull requests, compromised workflow files (`.github/workflows/`), or dependency confusion attacks.
- When extracting and structuring Indicators of Compromise (IOCs) from code artifacts.

## Investigation Phases & Guardrails
- **7-Phase Pipeline:**
  1. *Initialization & IOC Parsing:* Sets up evidence tracking (`evidence-store.py`) and parses target repos, actors, and IOCs.
  2. *Multi-Source Investigation:* Collects data across GH Archive, Wayback Machine, GitHub API, and local git reflogs.
  3. *Consolidation & Cross-Validation:* Deduplicates and verifies commit SHAs and artifacts across independent sources.
  4. *Hypothesis Formation:* Formulates explicit `[HYPOTHESIS]` statements with causal links.
  5. *Validation:* Mechanically validates hypotheses against registered `EV-XXXX` evidence IDs.
  6. *Reporting:* Generates formal markdown reports using `forensic-report.md`.
- **Safety Guardrails:** Enforces the evidence-first rule, static-only code analysis (no local execution of suspicious payloads), and credential redaction.

## See also

[[MOC Skills]] · [[Zoth OS]]