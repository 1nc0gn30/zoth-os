---
title: "decision-questionnaire"
tags: [skill, hermes]
aliases: ["decision-questionnaire"]
---

# decision-questionnaire

A Hermes workstation skill for turning blocked or unanswerable decisions into structured questionnaire documents.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`productivity/decision-questionnaire`), not a Zoth product. It was ported from `mattpocock/skills` (`to-questionnaire`).

## Purpose & Description

When a decision hinges on information, domain expertise, or judgment held by someone else, this skill interviews the user about the communication context ("interview the send, not the subject") and drafts a clean discovery questionnaire in Markdown (`decision-questionnaire-<slug>.md`).

### When to Load

- A decision is blocked on facts or judgment from a third party (stakeholder, domain specialist, vendor, or operations).
- The user expresses hesitation or defers a choice pending external input ("I need to ask X about this").
- Preparing targeted questions for an upcoming async handoff or alignment meeting.
- *Do not load* when answers are already discoverable from the local codebase, project documentation, or web research.

### Core Workflow

1. **Interview the Send:** Gathers recipient context (role, relationship) and exact outcomes needed in two concise exchanges.
2. **Draft Questionnaire:** Constructs single-idea questions ordered most-important-first, with orienting context, deadline expectations, and answer stubs (`>`).
3. **Save & Report:** Writes the formatted questionnaire to disk and reports the file path.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill meeting-action-items|meeting-action-items]] · [[Skill document-to-action-items|document-to-action-items]]