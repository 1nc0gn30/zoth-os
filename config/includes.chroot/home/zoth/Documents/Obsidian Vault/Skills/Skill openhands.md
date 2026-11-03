---
title: "openhands"
tags: [skill, hermes]
aliases: ["openhands"]
---

# openhands

Delegates coding tasks to the headless [OpenHands CLI](https://github.com/All-Hands-AI/OpenHands) via terminal tools. OpenHands provides a model-agnostic software development agent capable of multi-step file editing and shell execution across any LiteLLM-supported provider (DeepSeek, Ollama, OpenRouter, Anthropic, OpenAI).

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/autonomous-ai-agents/openhands/SKILL.md`
- **Platforms:** Linux, macOS

## When to Load
- When explicitly requested to delegate coding to OpenHands.
- When running coding tasks on non-Anthropic or non-OpenAI LLM providers (e.g., DeepSeek, Qwen, Ollama, vLLM).
- When executing automated multi-step file modifications and shell workflows within a workspace.

## Key Capabilities & Workflow
- **Headless automation:** Executes batch tasks using `openhands --headless --json --override-with-envs --exit-without-confirmation -t '<prompt>'`.
- **Environment configuration:** Passes model and API parameters via `LLM_MODEL` (LiteLLM slug), `LLM_API_KEY`, and `LLM_BASE_URL`.
- **Banner suppression:** Uses `OPENHANDS_SUPPRESS_BANNER=1` to keep stdout clean for parsing JSONL streams.
- **Event stream monitoring:** Emits line-delimited JSON events (`MessageEvent`, `ActionEvent`, `ObservationEvent`, `FinishAction`) readable via background process tools.
- **Conversation resumption:** Resumes previous tasks using `--resume <dashed-uuid>` from previous run hints.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill claude-code|claude-code]] · [[Skill codex|codex]] · [[Skill opencode|opencode]] · [[Skill hermes-agent|hermes-agent]]