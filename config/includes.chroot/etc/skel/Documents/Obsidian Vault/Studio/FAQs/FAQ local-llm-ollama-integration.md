---
title: "How does Zoth Studio connect to local LLMs like Ollama and llama.cpp?"
tags: [studio, faq]
---

# How does Zoth Studio connect to local LLMs like Ollama and llama.cpp?

**Category:** Memory & AI

Connects directly to local Ollama or llama.cpp instances for unlimited, offline, token-cost-free intelligence with complete data privacy.

Zoth Studio interfaces directly with locally running LLM engines (such as Ollama or llama.cpp) via browser fetch requests to local loopback endpoints (e.g. http://127.0.0.1:11434). Developers can pull recommended open-weight models (e.g. Qwen 2.5 Coder, Llama 3, DeepSeek) and link them directly to studio workspaces. The browser communicates straight to the local model socket: • Zero prompt data or tokens leave the local network. • Zero per-token API costs or third-party rate limits. • Full offline capability for security researchers and enterprise engineers working under strict non-disclosure or data compliance guidelines.

## See also

[[Zoth Studio]] · [[MOC FAQs]]