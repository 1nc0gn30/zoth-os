---
title: "guidance"
tags: [skill, hermes]
aliases: ["guidance"]
---

# guidance

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/guidance/SKILL.md`

## Overview

A constrained language model generation framework created by Microsoft Research. Guidance controls token-level decoding using regular expressions, context-free grammars, and discrete option selections, guaranteeing syntactically valid JSON, structured entities, and typed outputs without retry loops.

## When to Load

- Enforcing strict syntax on language model output (regex patterns, date formats, email addresses, IDs).
- Guaranteeing schema-compliant JSON generation using Pydantic schemas or custom grammars.
- Eliminating token boundary artifacts via automated "token healing" across prompt and generation splits.
- Building structured multi-step reasoning chains and ReAct-style agent loops in Python.
- Minimizing inference latency and token overhead by restricting decoding paths at the logit level.

## Core Capabilities & Backends

- **Constrained Generation Primitives:**
  - `gen(regex=...)`: Constrains generation strictly to a regular expression.
  - `select([...], name=...)`: Restricts output to an exact list of valid options.
  - `guidance.json(schema=Model)`: Compiles Pydantic models directly into token-level generation grammars.
  - `@guidance`: Function decorator for authoring composable, reusable generation templates.
- **Backend Compatibility:**
  - *Local Backends (`Transformers`, `LlamaCpp`):* Provide direct token logit access required for regex, selection, and grammar constraints.
  - *Remote Backends (`OpenAI`):* Support standard prompting and unconstrained `gen()` chat flows only (remote APIs do not allow token logit masking).

## See also

[[MOC Skills]] · [[Zoth OS]]