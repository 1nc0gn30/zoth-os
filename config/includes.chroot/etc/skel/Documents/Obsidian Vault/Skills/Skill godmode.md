---
title: "godmode"
tags: [skill, hermes]
aliases: ["godmode"]
---

# G0DM0D3 Jailbreaking

A workstation skill from Hermes for red-teaming and bypassing safety filters on API-served LLMs through prompt injection templates, input obfuscation, and multi-model racing.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/security/godmode/SKILL.md`

## When to load
Load this skill when red-teaming or evaluating safety alignment on API-served LLMs:
- Testing prompt-level safety boundaries on closed or cloud-hosted models (Claude, GPT, Gemini, Grok).
- Obfuscating sensitive trigger words to evaluate input-side safety classifiers.
- Setting up persistent system prompts and prefill priming templates in Hermes configurations.
- Benchmarking multi-model response compliance against restricted prompts.

## Key capabilities & workflows
- **GODMODE CLASSIC:** Applies model-specific system prompt injection templates targeting context boundaries (Claude), refusal inversion (Gemini), and output dividers (Grok).
- **PARSELTONGUE:** Provides 33 input obfuscation transforms across Light, Standard, and Heavy tiers using leetspeak, homoglyphs, zero-width characters, and base64 encoding to evade input filters.
- **ULTRAPLINIAN:** Concurrently queries multiple models via OpenRouter to evaluate refusal rates, latency, and response quality.
- **Auto-jailbreak engine:** Inspects the active model family in `~/.hermes/config.yaml`, runs canary tests, evaluates refusal markers, and writes winning prompt and `prefill.json` configurations.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obliteratus|obliteratus]]