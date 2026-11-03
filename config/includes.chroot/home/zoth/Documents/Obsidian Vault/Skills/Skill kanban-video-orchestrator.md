---
title: "kanban-video-orchestrator"
tags: [skill, hermes]
aliases: ["kanban-video-orchestrator"]
---

# kanban-video-orchestrator

`kanban-video-orchestrator` is a Hermes workstation meta-pipeline skill for scoping, staffing, and managing multi-agent video production workflows using the Hermes Kanban board engine.

- **Origin:** Hermes workstation skill (authored by SHL0MS & alt-glitch, not a Zoth product)
- **Source Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/kanban-video-orchestrator/SKILL.md`
- **Category:** Creative / Orchestration
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Orchestrating complex video productions (commercial teasers, narrative shorts, explainers, music videos) requiring division of labor across specialized agent roles.
- Designing modular team configurations composed of distinct agent profiles (director, scriptwriter, visual designer, animator, sound engineer).
- *Note:* Do not use for one-shot media conversions, single procedural scripts, or jobs fitting a single specialized rendering tool.

## Key Capabilities & Workflow

- **Orchestration Lifecycle:** Executes across six phases: Discovery, Brief Generation (`brief.md`), Team Design, Environment Setup (`setup.sh`), Autonomous Execution, and Pipeline Monitoring.
- **Role & Profile Management:** Automatically provisions Hermes agent profiles (`hermes profile create --clone`) paired with distinct `SOUL.md` directives and custom toolsets.
- **Shared Project Workspace:** Standardizes all pipeline workers on a single filesystem directory (`dir:<absolute_path>`) scoped under a dedicated tenant (`--tenant <project-slug>`).
- **Director Separation:** Enforces that the director agent strictly manages task decomposition and routing across kanban queues without executing rendering tasks directly.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill ascii-video|ascii-video]] · [[Skill manim-video|manim-video]] · [[Skill p5js|p5js]] · [[Skill comfyui|comfyui]] · [[Skill pixel-art|pixel-art]] · [[Skill ascii-art|ascii-art]]