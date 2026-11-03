---
title: "hermes-agent-skill-authoring"
tags: [skill, hermes]
aliases: ["hermes-agent-skill-authoring"]
---

# hermes-agent-skill-authoring

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/software-development/hermes-agent-skill-authoring/SKILL.md`

## Overview
An operational guide enforcing repository standards for authoring and contributing in-repo `SKILL.md` files to the `hermes-agent` codebase. Unlike user-local skills (`~/.hermes/skills/`), in-repo skills ship directly with the agent distribution and must adhere to strict frontmatter, structure, and testing criteria.

## When to Load
- When contributing a reusable workflow or procedure to ship directly in the `hermes-agent` repository.
- When deciding between bundled (`skills/<category>/`) for daily-driver workflows versus optional (`optional-skills/<category>/`) for niche or heavy workflows.
- When auditing frontmatter requirements, platform gating, or description length constraints.
- When editing existing in-repo skills, writing unit tests, or regenerating documentation.

## Hardline Standards & Structure
- **Frontmatter Standards:** Must include `name`, semver `version`, human-first `author`, `license`, audited `platforms`, and a concise `description` (strictly ≤ 60 characters, one sentence, ending with a period).
- **Body Sections:** Organized into `When to Use`, `Prerequisites`, `How to Run`, `Procedure` (with checkable completion criteria), `Pitfalls`, and `Verification`.
- **Tool Invocations:** Must reference native Hermes agent tools (`terminal`, `read_file`, `write_file`, `patch`) rather than raw shell commands (`cat`, `sed`, `grep`).
- **Tests & Docs:** Requires unit tests in `tests/skills/test_<skill>_skill.py` and documentation updates via `website/scripts/generate-skill-docs.py`.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill requesting-code-review|requesting-code-review]]