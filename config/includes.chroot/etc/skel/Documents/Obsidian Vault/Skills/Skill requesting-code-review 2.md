---
title: "requesting-code-review"
tags: [skill, hermes]
aliases: ["requesting-code-review"]
---

# requesting-code-review

Automated pre-commit code verification pipeline featuring static security scanning, baseline-aware test gates, independent reviewer subagents, and an auto-fix loop.

- **Origin:** Hermes skill (`software-development/requesting-code-review`)
- **Author:** Hermes Agent (adapted from obra/superpowers + MorAlekss)
- **Path:** `~/.hermes/skills/software-development/requesting-code-review/SKILL.md`
- **Platforms:** Linux, macOS, Windows
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Completing a feature implementation or bug fix prior to `git commit` or `git push`.
- The user requests to "commit", "push", "ship", "done", "verify", or "review before merge".
- Two or more code files have been modified in a git repository.
- Serving as the verification quality gate between subagent tasks in `subagent-driven-development`.
- *Exceptions:* Skip for documentation-only changes, trivial config updates, or explicit user bypass.

## Verification Pipeline (8-Step Sequence)
1. **Diff Extraction:** Inspect staged changes via `git diff --cached` (or per-file diffs if exceeding 15k characters).
2. **Static Security Scan:** Scans additions for hardcoded credentials, shell injections (`subprocess(..., shell=True)`), dangerous `eval`/`exec`, unsafe `pickle.loads`, or raw SQL concatenation.
3. **Baseline-Aware Gates:** Runs language test suites (`pytest`, `npm test`, `cargo test`, `go test`) and linters (`ruff`, `mypy`, `eslint`, `clippy`), blocking solely on new regressions introduced against the pre-change baseline.
4. **Self-Review Checklist:** Verifies parameterization, input sanitization, error handling, and cleans out temporary debug logging.
5. **Independent Reviewer Subagent:** Spawns an isolated subagent with clean context to review the diff and return a strict JSON verdict (`passed`, `security_concerns`, `logic_errors`).
6. **Verdict Evaluation:** Consolidates findings across static scanning, baseline diffs, and reviewer feedback.
7. **Auto-Fix Loop:** Invokes a dedicated fixer agent for up to two cycles to remediate detected faults without adding unrequested features.
8. **Verified Commit:** Upon passing, commits changes using the conventional `[verified] <description>` prefix.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill subagent-driven-development|subagent-driven-development]] · [[Skill test-driven-development|test-driven-development]] · [[Skill github|github]]