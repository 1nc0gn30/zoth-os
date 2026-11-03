---
title: "agent-merge-conflict-arbiter"
tags: [skill, hermes]
aliases: ["agent-merge-conflict-arbiter"]
---

# Agent Merge-Conflict Arbiter

A workstation skill from Hermes for acting as an impartial third-party reconciler to resolve git merge collisions between two autonomous agents.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/agent-merge-conflict-arbiter/SKILL.md`

## When to load
Load this skill when two autonomous agents' branches or worktrees collide during parallel development (such as multi-worktree refactoring or kanban task pipelines):
- `git merge` or `git rebase` halts on conflict markers between two agents' work.
- Neither conflicting agent should self-adjudicate due to inherent context bias or risk of overwriting peer work.
- Do not use for conflicts within a single agent's own work or for auto-regenerable lockfiles.

## Operational procedure
1. **Gather context:** Inspect `git status`, calculate `git merge-base`, and extract both branches' commit histories and stated intents from kanban completion summaries or PR bodies.
2. **Classify conflict hunks:**
   - **Disjoint intent:** Both changes serve separate goals and can coexist (combine both).
   - **Same question, different answer:** Competing architectural decisions (pick one based on stated intent; never create an unwanted compromise).
   - **Superseded:** One side's premise is rendered obsolete (keep the surviving implementation).
3. **Resolve under impartiality contract:** Apply patches strictly within conflict markers without drive-by refactorings or styling changes; never favor the parent spawning agent.
4. **Verify & document:** Run build and test suites to verify merged behavior, complete the merge commit, and provide a detailed hand-back summary itemizing every hunk decision.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]]