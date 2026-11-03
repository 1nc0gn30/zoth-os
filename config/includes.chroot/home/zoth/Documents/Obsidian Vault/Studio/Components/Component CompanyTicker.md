---
title: "CompanyTicker"
tags: [studio, component]
---

# CompanyTicker

`CompanyTicker` is a horizontal scrolling ecosystem strip rendered on the Studio home page (`HomePage.jsx`, route `/`) showcasing external AI engines, agent frameworks, and compute technologies integrated into Zoth Studio.

### What it renders

- **Header Banner:**
  - Displays the heading "POWERED BY INDUSTRY-LEADING AI ENGINES, AGENT FRAMEWORKS & COMPUTE".
  - Displays a gold-bordered chip tallying the 23 integrated AI and development partners.
- **Horizontal Scroll Carousel:**
  - An overflow-x scroll container containing interactive partner cards with custom hover borders and glowing drop shadows.
  - Each card renders an inline SVG logo from `SvgLogos`, partner title, category descriptor, and an outbound link to the official project site.
- **Integrated Partner Roster (23 entries):**
  - **AI Model Engines & Inference:** Google DeepMind, xAI Grok, Nous Research, OpenAI, Anthropic, Meta Llama, Ollama, Hugging Face.
  - **Model Training & Tuning:** Axolotl, Unsloth, vLLM, DSPy, PyTorch.
  - **Orchestration & RAG:** LangChain, LlamaIndex.
  - **Web, UI & Runtimes:** Vite, React 19.3, Material-UI, Tailwind CSS, WebGPU (W3C), Three.js, Python, Rust.

## See also

[[Zoth Studio]] · [[MOC Components]]