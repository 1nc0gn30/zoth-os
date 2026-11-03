---
title: "actual-setup"
tags: [skill, hermes]
aliases: ["actual-setup"]
---

# Actual Computer Setup

A workstation skill from Hermes for setting up Actual Computer (`actual.inc`) inference in Hermes across cloud relay and local on-device daemon modes.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/devops/actual-setup/SKILL.md`

## When to load
Load this skill when configuring Hermes to route LLM inference through Actual Computer:
- Integrating the hosted end-to-end encrypted relay at `https://api.actual.inc` using an `ac_` API key.
- Configuring on-device local inference via the local Actual daemon running at `http://127.0.0.1:8080`.
- Downloading and loading local GGUF models (`actual models download` with explicit quantization, followed by `actual models load`).
- Troubleshooting HTTP 400 responses, empty response streams, or reasoning effort parameter issues.

## Key configurations & architecture
- **First-class provider:** Hermes includes built-in provider support for `actual` (aliases: `actual-computer`, `actualcomputer`, `aci`); custom provider blocks should not be created.
- **Relay mode:** Requires `ACTUAL_API_KEY=ac_...` stored in `~/.hermes/.env` and setting `hermes config set model.provider actual`.
- **Local daemon mode:** Setting `ACTUAL_BASE_URL=http://127.0.0.1:8080` automatically switches Hermes into unauthenticated loopback mode without requiring an API key.
- **Context considerations:** Small local models (<32k context) can overflow when loaded with full agent toolsets (~26k schemas + prompt); restricts tools (`-t file,web`) or loads higher context models.

## See also

[[MOC Skills]] · [[Zoth OS]]