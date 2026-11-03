---
title: "creative-ideation"
tags: [skill, hermes]
aliases: ["creative-ideation"]
---

# creative-ideation

- **Origin:** Hermes skill (workstation skill, not a Zoth product; author: SHL0MS)
- **Path:** `~/.hermes/hermes-agent/optional-skills/creative/creative-ideation/SKILL.md`
- **Tags:** `Creative`, `Ideation`, `Brainstorming`, `Methods`, `Inspiration`

## Overview
A routed methodology library for creative problem-solving and divergent thinking, designed to replace generic LLM brainstorming with named, discipline-specific creative practices.

## When to Load
- User presents open-ended generative requests ("What should I make?", "Inspire me", "Help me pick an idea").
- User is unblocking stagnation ("I'm stuck", "Going in circles") or seeking subversion ("Make this weirder", "Less obvious").
- Framing research questions, product theses, writing prompts, or software artifact mechanisms.

## Routing Engine & Operating Rules
- **Anti-Slop Discipline:** Explicitly discards the first 3 ideas (or 5 for high-slop domains like AI/productivity apps) as superficial defaults.
- **Routing Protocol:** Categorizes intent by **Phase** (Generating, Expanding, Selecting, Unblocking, Subverting, Refining, Synthesizing), **Domain** (Text, Object, Artifact, System, Self, Research, Product), and **Specificity**.
- **Named Methods Library:** Dispatches to 22 structured methods including TRIZ (engineering contradictions), SCAMPER (expansion), OuLiPo (formal writing constraints), Oblique Strategies (unblocking), Jobs-to-be-Done (product framing), and Premortem/Inversion (selection).
- **Output Standards:** Enforces naming the selected method, describing concrete mechanisms rather than abstract stacks, and ensuring at least one idea is immediately actionable and buildable.

## See also

[[MOC Skills]] · [[Zoth OS]]