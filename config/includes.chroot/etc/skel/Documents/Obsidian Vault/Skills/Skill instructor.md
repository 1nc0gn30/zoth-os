---
title: "instructor"
tags: [skill, hermes]
aliases: ["instructor"]
---

# instructor

`instructor` is a Hermes workstation skill providing design patterns and reference implementations for extracting structured, type-safe data from LLM outputs using Pydantic models.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/mlops/instructor/SKILL.md`
- **Dependencies:** `instructor`, `pydantic`, `openai`, `anthropic`
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Designing structured data extraction workflows from unstructured LLM responses.
- Enforcing strict schema constraints using Pydantic fields, regex validators, and Python enums.
- Implementing automatic error feedback loops where failed schema validations prompt the LLM to retry.
- Streaming partial response objects (`create_partial`) or iterable collections (`create_iterable`) in real time.
- Standardizing structured generation across multiple model providers (Anthropic Claude, OpenAI, local Ollama endpoints).

## Key Capabilities & Workflow

- **Model Wrapping:** Initializes provider-specific clients using `instructor.from_anthropic()` or `instructor.from_openai()`.
- **Validation & Retries:** Automatically parses LLM output into `response_model=YourSchema`, re-submitting validation errors back to the model up to `max_retries`.
- **Operational Modes:** Supports provider tool calling (`Mode.ANTHROPIC_TOOLS`, `Mode.TOOLS`) and standard JSON schema extraction fallbacks (`Mode.JSON`).

## See also

[[MOC Skills]] · [[Zoth OS]]