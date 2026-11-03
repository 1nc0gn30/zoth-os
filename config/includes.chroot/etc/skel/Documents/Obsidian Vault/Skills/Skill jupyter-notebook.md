---
title: "jupyter-notebook"
tags: [skill, hermes]
aliases: ["jupyter-notebook"]
---

# jupyter-notebook

`jupyter-notebook` is a Hermes workstation skill that interfaces with a live Jupyter kernel via `hamelnb` (`jupyter_live_kernel.py`) to provide a stateful, iterative Python REPL where variables and imports persist across executions.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/data-science/jupyter-notebook/SKILL.md`
- **Category:** Data Science
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Conducting exploratory data analysis, data science modeling, or machine learning iteration requiring persistent variable state.
- Inspecting data structures, DataFrames, and API responses incrementally across multiple execution steps.
- Editing, updating, or validating `.ipynb` notebook cells and executing notebook verification runs (`restart-run-all`).
- *Note:* Use stateless `execute_code` for one-shot scripts and `terminal` for general shell workflows.

## Key Capabilities & Workflow

- **Kernel Discovery & Management:** Lists active Jupyter servers and notebooks via `uv run "$SCRIPT" servers` and `notebooks`.
- **Stateful Execution:** Runs arbitrary Python code inside an active notebook kernel via `execute --path <file.ipynb> --code '<python>' --compact`.
- **Variable Inspection:** Queries live in-memory variables and inspects object previews with the `variables` subcommand.
- **Notebook Cell Manipulation:** Programmatically inserts, replaces, and deletes notebook cells (`contents`, `edit insert`, `edit replace-source`).
- **Resilient Transport:** Supports WebSocket execution with a fallback to direct ZeroMQ (`--transport zmq`) for reliable socket communication.

## See also

[[MOC Skills]] · [[Zoth OS]]