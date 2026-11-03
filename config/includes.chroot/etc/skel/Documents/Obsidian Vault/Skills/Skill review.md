---
title: "review"
tags: [skill, grok]
aliases: ["review"]
---

# review

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills`)
- **Path:** `~/.grok/bundled/skills/review/SKILL.md`
- **When to load:** Triggers on `/review` or requests to "code review", "review my changes", "review my branch", "review this PR", or "review a stack", with options like `--main`, `--local`, `--branch <name>`, `--pr <id>`, `--stack <id>`, `--submit`, or `--approve`.

Coordinates automated code review workflows by dispatching reviewer subagents equipped with a specialized reviewer persona (`shared/personas/reviewer.md`).

### Review Targets & Modes
- **Main Mode (`--main`):** Evaluates committed branch diffs against the merge-base with the default branch (`origin/main` / `origin/master`); requires a clean working tree.
- **Local Mode (`--local`):** Inspects uncommitted changes (staged, unstaged, and untracked files). Default when working tree is dirty.
- **Branch Mode (`--branch <name>`):** Reviews committed diffs between a named target branch and the default base branch.
- **PR Mode (`--pr <number|url>`):** Reviews a specific GitHub pull request and drafts findings as a PENDING GitHub review for interactive inspection.
- **Stack Mode (`--stack <number|url>`):** Discovers all PRs across a Graphite or GitHub stacked PR chain, assigning an isolated reviewer subagent per PR.

### Modifiers & Outputs
- **Publication Modifiers:** Accepts `--submit` (publishes immediately as a review `COMMENT`) or `--approve` (publishes and marks PR as approved); defaults to creating a non-published `PENDING` draft.
- **Artifacts:** Writes detailed markdown review logs and summaries to disk for local/branch modes, or posts structured inline line comments and review bodies to GitHub for PR/stack modes.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pr-babysit]]