---
title: "Zoth Sentinel"
tags: [os, sentinel]
aliases: ["ZOTH-SENTINEL-APEX"]
---

# Zoth Sentinel

**ZOTH-SENTINEL-APEX** — image sentinel config. Version `1.0.0`.

- **Enabled in JSON:** `True`
- **Provider / model:** `ollama` / `llama3.2:latest`
- **Base URL:** `http://127.0.0.1:11434/v1`
- **Safety ring:** `ring-1`
- **Auto execute:** `True` · autonomous remediation `True`
- **Log:** `/var/log/zoth-sentinel.log`
- **IPC:** `/run/zoth-sentinel.sock`
- **Telemetry interval:** 10s · CPU 90% · RAM 90%
- **Provider catalog names:** ollama, openai, anthropic, deepseek, groq, grok, openrouter, gemini, vllm

API keys and env values are **not** copied into this vault. File: `etc/zothos/sentinel.json`.
Companion CLI: [[CLI zoth-sentinel]].

## See also

[[Zoth OS]] · [[Agent permissions]] · [[CLI zoth-sentinel]]
