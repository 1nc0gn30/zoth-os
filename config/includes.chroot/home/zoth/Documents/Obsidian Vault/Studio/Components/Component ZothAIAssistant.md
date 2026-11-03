---
title: "ZothAIAssistant"
tags: [studio, component]
---

# ZothAIAssistant

- **File:** `zoth-studio-v2/src/components/ZothAIAssistant.jsx`
- **Parent / Route:** [[Page WorkstationDetailPage]] (`/workstations/:slug`)

## Overview

`ZothAIAssistant` is an in-browser neural assistant component powered by a local, quantized `Qwen2.5-0.5B-Instruct` model (`onnx-community/Qwen2.5-0.5B-Instruct`, `q4` dtype) running via `@huggingface/transformers`. It allows operators to control and modify workstation tools in real time through structured tool calls.

## What It Renders

- **Header Bar:** Displays the tool name, active compute substrate (`WebGPU` or `WASM/CPU` fallback), and a lifecycle status chip (`NOT LOADED`, `LOADING MODEL…`, `READY`, `THINKING…`, or `ERROR`).
- **Interactive Log Stream:** A scrollable console area displaying tagged messages:
  - `SYS`: Pipeline load notifications and device status.
  - `YOU`: Operator prompt input.
  - `ZOTH`: Model action execution responses and confirmed parameter updates.
  - `ERR`: Error logs for model retrieval or JSON parsing failures.
- **Prompt Input & Execution:** Text field for operator instructions paired with a "Load & run" / "Run" button with loading spinners.
- **Action Hint Chips:** Selectable chips derived from registered tool actions (e.g. `actions.slice(0, 6)`) that pre-fill natural language instructions to mutate workstation state.
- **Zero-Egress Invariant:** Model weights load locally on user demand and execute without telemetry or phoning home once cached.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page WorkstationDetailPage]]