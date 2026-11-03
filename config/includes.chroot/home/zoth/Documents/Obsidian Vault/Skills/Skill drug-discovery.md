---
title: "drug-discovery"
tags: [skill, hermes]
aliases: ["drug-discovery"]
---

# drug-discovery

Cheminformatics and pharmacology research workflow for querying bioactivity databases, evaluating oral drug-likeness criteria, and auditing pharmaceutical safety profiles using open scientific APIs.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/drug-discovery/SKILL.md`
- **Author:** bennytimz

## When to Load
Load this skill when investigating pharmaceutical compounds, querying bioactivity and target binding affinities, evaluating oral bioavailability (Lipinski/Veber rules), checking FDA drug interactions and adverse event reports, or mapping gene-disease targets.

## Core Workflows & Public APIs
Uses zero-dependency `curl` and Python standard library pipelines across public endpoints without API keys:
- **ChEMBL Bioactivity:** Searches target proteins, retrieves bioactivity assays (`pChEMBL >= 6`), and pulls canonical SMILES and physicochemical properties.
- **PubChem Drug-Likeness:** Evaluates oral bioavailability metrics via PUG REST:
  - *Lipinski Rule of 5 (Ro5):* MW $\le 500$, LogP $\le 5$, H-bond donors $\le 5$, H-bond acceptors $\le 10$.
  - *Veber Rules:* Polar surface area (TPSA $\le 140\text{ \AA}^2$) and rotatable bonds ($\le 10$).
- **OpenFDA Interactions & Adverse Events:** Retrieves official drug label interaction warnings and MedDRA adverse reaction frequency statistics.
- **PubChem Compound Search:** Resolves compound names to CIDs, isomeric SMILES, and InChIKeys.
- **OpenTargets Platform:** Queries target gene-disease associations via the OpenTargets GraphQL API.

## See also

[[MOC Skills]] · [[Zoth OS]]