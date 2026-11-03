---
title: "research-paper-writing"
tags: [skill, hermes]
aliases: ["research-paper-writing"]
---

# research-paper-writing

End-to-end pipeline for producing publication-ready ML and AI research papers targeting top venues (NeurIPS, ICML, ICLR, ACL, AAAI, and COLM). It models research as an iterative cycle where results inform experiments and review feedback directs revision.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/research/research-paper-writing/SKILL.md`

### When to Load
- Starting a new paper project from code, data, or experimental ideas.
- Designing claim-driven empirical benchmarks, ablations, and compute-budgeted experiment sweeps.
- Verifying literature and citations programmatically (using Semantic Scholar, arXiv, DOI content negotiation) to eliminate hallucinated references.
- Drafting, structuring, and revising LaTeX paper sections according to conference norms.
- Running multi-perspective self-review simulation ensembles prior to final submission.

### Core Lifecycle
- **Setup & Framing:** Define a single-sentence core contribution, audit codebase assets, and track compute budgets.
- **Literature Review:** Execute iterative breadth-then-depth queries and run mandatory programmatic citation validation.
- **Experimentation:** Map each hypothesis directly to an experiment with naive, strong, and ablation baselines; use crash-safe incremental saving and cron monitoring.
- **Analysis:** Calculate error bars, confidence intervals, and statistical tests (e.g., McNemar's test, Cohen's d/h), maintaining an `experiment_log.md` bridge to writeup.
- **Drafting & Review:** Assemble modular LaTeX sections, follow structured figure/table design standards, and run simulated critical reviewer ensembles.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill arxiv|arxiv]] · [[Skill subagent-driven-development|subagent-driven-development]]