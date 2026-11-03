---
title: "zoth-streamlit"
tags: [os, cli]
aliases: ["zoth-streamlit"]
---

# zoth-streamlit

`file`: Bourne-Again shell script.

`zoth-streamlit` is an interactive terminal menu and launcher for Streamlit data dashboards and machine learning applications in ZothOS.

## What it does

- **Direct passthrough:** When passed command-line arguments, it immediately invokes `exec streamlit "$@"`.
- **Environment setup:** Preconfigures `~/.streamlit/credentials.toml` (disabling email prompts) and `~/.streamlit/config.toml` (disabling telemetry usage stats, headless flags, and CORS/XSRF restrictions for local usage). Resolves the active browser (`google-chrome`, `firefox`, or `xdg-open`).
- **Interactive TUI menu:** When run without arguments, displays telemetry (Streamlit version, Python version, default port `http://localhost:8501`, active app count) and provides operations:
  1. **Launch ZothOS Cyber Intelligence Studio:** Runs `/usr/share/zothos/streamlit/cyber_dashboard.py`.
  2. **Launch Streamlit Official Hello Demo Hub:** Runs `streamlit hello`.
  3. **Run Custom Python Streamlit Script:** Prompts for a `.py` file path and executes it.
  4. **Scaffold New Streamlit App Template:** Generates a starter interactive script with sliders, charts, and tables.
  5. **Streamlit API Cheatsheet & Guide:** In-terminal guide for core Streamlit widgets and bindings.
  6. **Kill Running Streamlit Servers:** Terminates active `streamlit run` and `streamlit hello` processes.
  7. **Streamlit Python Terminal Shell:** Spawns an interactive bash subshell.
  0. **Exit.**

## See also

[[Zoth OS]] · [[MOC CLIs]]