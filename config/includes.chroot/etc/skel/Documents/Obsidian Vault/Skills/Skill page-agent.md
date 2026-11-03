---
title: "page-agent"
tags: [skill, hermes]
aliases: ["page-agent"]
---

# page-agent

Embeddable in-page natural language GUI copilot based on Alibaba's open-source [page-agent](https://github.com/alibaba/page-agent) TypeScript library. Interprets DOM structure as text (without vision models or screenshots) to execute actions directly inside web applications via any OpenAI-compatible LLM endpoint.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/web-development/page-agent/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load
- When embedding an in-app AI assistant into SaaS, CRM, admin panels, or internal enterprise dashboards.
- When enabling natural language UI navigation and accessibility on legacy web pages without refactoring frontend code.
- When building interactive walkthroughs, training demos, or guided onboarding workflows.
- Do NOT use for autonomous external web scraping or cross-tab automation (use Playwright or browser tools instead).

## Key Implementation Patterns
- **Evaluation / quick demo:** Injects via CDN script tag or browser bookmarklet (`page-agent.demo.js`) with an evaluation LLM proxy.
- **Production integration:** Installs via `npm install page-agent` and initializes `PageAgent` with an OpenAI-compatible API endpoint (Qwen/DashScope, OpenAI, Ollama, OpenRouter).
- **Execution modes:** Presents an interactive user panel (`agent.panel.show()`) or executes instructions programmatically (`agent.execute(...)`).
- **Security best practices:** Recommends routing API requests through a server proxy rather than exposing raw LLM keys in client browsers.

## See also

[[MOC Skills]] · [[Zoth OS]]