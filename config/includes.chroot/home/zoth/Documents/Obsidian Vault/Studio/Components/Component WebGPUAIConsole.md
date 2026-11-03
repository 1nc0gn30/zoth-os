---
title: "WebGPUAIConsole"
tags: [studio, component]
---

# WebGPUAIConsole

- **File:** `zoth-studio-v2/src/components/WebGPUAIConsole.jsx`
- **Parent / Route:** [[Page HomePage]] (`/`)

## Overview

`WebGPUAIConsole` is a client-side neural runner and hardware benchmark component titled "Zoth-AI (Qwen 2.5 Coder) WebGPU Neural Engine". It provides direct in-browser token generation and WGSL shader benchmarks with zero external server egress.

## What It Renders

- **Hardware Capability Telemetry:** Detects WebGPU support via `checkWebGPUSupport()` and displays hardware adapter name, compute throughput (TFLOPS), and WGSL matrix shader latency.
- **Model Substrate Selector:** Allows switching between two local model configurations:
  - `Zoth-AI 1.5B` (Flagship Qwen 2.5 Coder)
  - `Zoth-AI-Micro 360M` (SmolLM2 Edge Ultra-Light)
- **Preset Prompt Chips:** One-click prompt chips covering Zoth architecture, cyber pets, the Pour workflow, and zero-egress invariants.
- **Interactive Runner:** A prompt text input with a "Run Zoth-AI In-Browser" action and a "Benchmark GPU" action that executes matrix multiplication shaders.
- **Streaming Terminal & Metrics:** A live terminal output container rendering streaming tokens, blinking cursor, clipboard export button, and post-run performance chips (adapter, throughput, elapsed latency, and egress verification).

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page HomePage]]