---
title: "github"
tags: [skill, hermes]
aliases: ["github"]
---

# GitHub CLI

A workstation skill from Hermes for end-to-end GitHub workflows using the official `gh` CLI, covering authentication, issue tracking, PR lifecycles, and code reviews.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `/home/zoth/.hermes/hermes-agent/skills/software-development/github/SKILL.md`

## When to load
Load this skill when an agent or user needs to interact with GitHub repositories:
- Setting up or troubleshooting authentication (`gh auth login`, SSH keys, PATs).
- Managing issue trackers: opening, searching for duplicates, labeling, and closing issues.
- Driving pull request lifecycles: branch management, PR creation, watching CI test runs, and executing merges.
- Conducting code reviews: inspecting diffs, generating inline review comments, and issuing review verdicts.
- Performing repository operations: cloning, creating, forking, and managing GitHub Releases.

## Key capabilities & workflows
- **Reference-based routing:** Directs execution to dedicated workflow guides for auth, issues, PR lifecycles, issue-to-PR delivery, code review, and repo management.
- **CLI-first operations:** Uses porcelain `gh` commands wherever available, falling back to `gh api` for lower-level REST queries.
- **Verification discipline:** Requires checking `gh auth status` at session start, verifying CI via `gh pr checks` rather than assumptions, and reading discussion threads (`--comments`) prior to action.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill codebase-inspection|codebase-inspection]] · [[Skill requesting-code-review|requesting-code-review]]