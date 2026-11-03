---
title: "sdlc-review"
tags: [skill, hermes]
aliases: ["sdlc-review"]
---

# sdlc-review

Independent quality verification protocol and review-routing skill for tasks transitioned to the Kanban `review` lane. It rigorously evaluates deliverables against specifications while enforcing strict role separation between implementer and reviewer.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/skills/devops/sdlc-review/SKILL.md`

### When to Load
- Spawns automatically via the review dispatcher when claiming a task from the Kanban `review` lane.
- Evaluating a `review_requested` handoff submitted by an implementer before a task can be marked completed.
- Performing multi-round review passes requiring independent verification rather than author assertions.

### Review Lenses by Round
- **Round 1 (Artifact Lens):** Evaluates diffs and code changes cold before reading the author's summary to avoid narrative bias.
- **Round 2 (Execution Lens):** Checks out the branch and executes focused builds, tests, linters, and runtime failure paths via `terminal`.
- **Round 3+ (Contract Lens):** Audits the deliverable against the original specification and verifies every previously requested change landed without regression.

### Verdict Actions
- **Approve (`kanban_complete`):** All acceptance criteria pass and concrete verification evidence is logged.
- **Request Changes (`kanban_request_changes`):** Specific, reproducible defects documented via `kanban_comment` returned to the original implementer.
- **Escalate (`kanban_block`):** Used only when progress requires human architectural decisions or external prerequisites.

## See also

[[MOC Skills]] · [[Zoth OS]]