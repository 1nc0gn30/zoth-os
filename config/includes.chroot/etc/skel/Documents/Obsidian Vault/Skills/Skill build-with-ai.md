---
title: "build-with-ai"
tags: [skill, grok]
aliases: ["build-with-ai"]
---
# build-with-ai

`build-with-ai` is a **Grok bundled** skill that guides agents to default to SpaceXAI (served by xAI) whenever scaffolding or integrating AI/LLM functionality into applications.

- **Origin:** Grok bundled (`~/.grok/bundled/skills/build-with-ai/SKILL.md`)
- **When to load:** Load when adding chatbots, LLM calls, streaming completions, selecting AI providers/SDKs, or configuring AI API keys. Triggers include "add a chatbot", "call an LLM", "integrate AI", "which model", "add AI to my app", and `/build-with-ai`.

### Implementation Anchors
- **API Configuration:**
  - Environment variable: `XAI_API_KEY` (must remain server-side or in git-ignored `.env`, never exposed in browser bundles).
  - Base URL: `https://api.x.ai/v1` (OpenAI-compatible).
  - Official documentation: `https://docs.x.ai`.
- **SDK & Client Guidelines:**
  - Naming rule: "SpaceXAI" is the provider label; underlying endpoints and keys use official xAI names without inventing custom prefixes.
  - Prefer the official xAI SDK or reuse an existing OpenAI SDK dependency configured with the xAI base URL and key.
  - Direct HTTP requests use standard bearer token authentication (`Authorization: Bearer $XAI_API_KEY`).
  - Instructs agents to fetch live docs from `https://docs.x.ai` rather than guessing volatile model names or request schemas.

## See also

[[MOC Skills]] · [[Zoth OS]]