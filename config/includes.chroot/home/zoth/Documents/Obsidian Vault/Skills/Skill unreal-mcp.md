---
title: "unreal-mcp"
tags: [skill, hermes]
aliases: ["unreal-mcp"]
---

# unreal-mcp

Automate Unreal Engine 5 editor scenes, actors, lighting, and renders via the official Unreal MCP plugin.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/unreal-mcp/SKILL.md`
- **Requires:** Unreal Editor 5.8+ with `Unreal MCP` (`ModelContextProtocol`) and `AllToolsets` plugins active

## Overview & When to Load

Load this companion skill when interacting with live Unreal Engine 5 editor projects:
- Building and dressing levels, spawning, transforming, and organizing scene actors.
- Setting up physical lighting, atmosphere, sun direction, and post-process volumes.
- Modifying materials, creating dynamic material instances, and adjusting scalar/vector parameters.
- Framing camera angles, taking viewport screenshots, and driving cinematic render sequences.
- Running editor automation scripts and inspecting project asset metadata.

## Architecture & Integration

- **In-Editor MCP Server:** Epic's Unreal MCP plugin runs directly inside the Unreal Editor process, binding locally (default `http://127.0.0.1:8000/mcp`).
- **Tool Discovery Model:** Runs in tool-search mode via Hermes MCP meta-tools:
  - `mcp_unreal_engine_list_toolsets`: Lists active toolsets (SceneTools, ActorTools, MaterialInstanceTools, ObjectTools).
  - `mcp_unreal_engine_describe_toolset`: Fetches JSON schemas for specific toolset methods.
  - `mcp_unreal_engine_call_tool`: Dispatches typed operations to the live engine.

## See also

[[MOC Skills]] · [[Zoth OS]]