---
title: "zoth-telemetry"
tags: [os, cli]
aliases: ["zoth-telemetry"]
---

# zoth-telemetry

`file`: Python script.

`zoth-telemetry` is an AI telemetry emitter CLI that transmits agent runtime metrics to the Zoth Math Pillar HUD over HTTP.

## What it does

The script collects reasoning, memory, and performance metrics from running AI agents and sends them via an HTTP POST request to `http://<host>:<port>/telemetry` (defaults to `127.0.0.1:9995`).

If the telemetry endpoint is offline or unreachable, the command exits silently with status code `0` (or prints debug output to `stderr` if `--verbose` is passed), avoiding failure cascades when HUD services are not running.

## Telemetry arguments

- `--agent`: Agent identifier (default: `CustomAgent`).
- `--model`: Name of the active LLM.
- `--phase`: Operational phase (`PREFILL`, `REASONING`, `TOOL_DISPATCH`, `SYNTHESIS`, `IDLE`; default: `EXEC`).
- `--markov`: Discrete Markov stage (`PERCEIVE`, `REASONING`, `HYPOTHESIZE`, `TOOL_EXEC`, `SYNTHESIS`).
- `--tok-sec`: Generation throughput in tokens per second.
- `--context-used` / `--context-max`: Context window token consumption.
- `--entropy` / `--confidence`: Reasoning dispersion and probability scores (0.0 to 1.0).
- `--latency`: Execution latency in milliseconds.
- `--vram`: GPU memory consumption in MB.
- `--step` / `--max-steps`: Current step index and total planning horizon.
- `--tool`: Active tool name.
- `--note`: Reasoning rationale or explanatory text.
- `--host` / `--port`: Destination endpoint (default: `127.0.0.1:9995`).

## See also

[[Zoth OS]] · [[MOC CLIs]]