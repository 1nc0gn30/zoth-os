---
title: "blackbox"
tags: [skill, hermes]
aliases: ["blackbox"]
---

# blackbox

Hermes workstation skill authored by Nous Research / Hermes Agent. Labeled as origin, not a Zoth product.

## Overview

Delegates coding tasks to the Blackbox AI CLI (`@blackbox_ai/blackbox-cli`), a multi-model agent platform that dispatches prompts to multiple LLMs and uses a judge to select the optimal solution.

## When to Load

Load when delegating coding tasks, PR code reviews, architectural refactoring, or multi-model benchmarking to Blackbox AI from within Hermes terminal sessions.

## Key Capabilities & Modes

- **Multi-Model Evaluation**: Runs code implementations across multiple models (Claude, Codex, Gemini, Blackbox Pro) using judge/chairman workflows to pick the best result.
- **One-Shot & Background Execution**: Supports immediate execution via `--prompt` or background execution monitored via Hermes process management (`poll`, `log`, `submit`).
- **Checkpoints**: Preserves session state with `--resume-checkpoint` to continue tasks without repeating prior setup.
- **Vision Support**: Supports image analysis with VLM switching modes (`once`, `session`, `persist`).

## Operational Rules

- Requires Node.js 20+ and a valid Blackbox API key configured via `blackbox configure`.
- Must always be invoked with `pty=true` in Hermes terminal calls to prevent interactive terminal hangs.
- Explicit `workdir` scoping is required to contain file modifications to the intended workspace.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-code|claude-code]] · [[Skill codex|codex]] · [[Skill hermes-agent|hermes-agent]]