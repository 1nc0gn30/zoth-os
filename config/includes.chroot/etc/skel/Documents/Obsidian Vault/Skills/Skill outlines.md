---
title: "outlines"
tags: [skill, hermes]
aliases: ["outlines"]
---

# outlines

Structured LLM text generation library developed by dottxt.ai. Uses finite-state machines and grammar-guided token masking to guarantee syntactically valid JSON, regex matches, choice classifications, and Pydantic schema adherence with zero rejection sampling overhead.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/inference/outlines/SKILL.md`
- **Platforms:** Linux, macOS, Windows
- **Dependencies:** `outlines`, `transformers`, `vllm`, `pydantic`

## When to Load
- When needing guaranteed, syntactically valid JSON or XML from LLM generations.
- When extracting structured data into type-safe Pydantic models.
- When constraining token generation to specific regex patterns or discrete choices (`Literal[...]`).
- When operating local models through Hugging Face Transformers, llama.cpp, or vLLM backends.

## Key Architecture & v1 API
- **Model wrapping:** Wraps backends using `outlines.from_transformers(...)`, `outlines.from_vllm(...)`, or `outlines.from_llamacpp(...)`.
- **Direct invocation:** In Outlines v1, invokes models directly with prompt and schema: `model(prompt, output_type)` (e.g., passing a `BaseModel` class or `Literal[...]`).
- **Parsing:** Returns valid JSON strings directly decodable via `Model.model_validate_json(result)`.
- **Grammar-level guidance:** Modifies logits during sampling so invalid tokens cannot be selected.

## See also

[[MOC Skills]] · [[Zoth OS]]