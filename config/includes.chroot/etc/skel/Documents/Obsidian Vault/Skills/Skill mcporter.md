---
title: "mcporter"
tags: [skill, hermes]
aliases: ["mcporter"]
---

# mcporter

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mcp/mcporter/SKILL.md`

## Overview
Provides a command-line interface for discovering, testing, authenticating, and calling Model Context Protocol (MCP) servers and tools directly from the terminal.

## When to Load
- Listing local MCP servers configured by desktop clients (such as Claude Desktop or Cursor).
- Inspecting tool parameter schemas and capability definitions (`mcporter list <server> --schema`).
- Executing one-off tool calls to HTTP endpoints or local stdio processes without persistent client configuration.
- Authenticating against remote MCP services requiring OAuth flows (`mcporter auth`).
- Generating typed client bindings or dedicated CLI wrappers (`mcporter generate-cli`, `mcporter emit-ts`).
- Running persistent MCP server daemon processes (`mcporter daemon`).

## Core Capabilities
- CLI tool executed via Node.js (`npx mcporter` or global npm package).
- Supports flexible tool call syntax: key=value arguments, JSON payloads (`--args`), and inline function call notations.
- Structured JSON output formatting (`--output json`) for integration into automated terminal pipelines.

## See also

[[MOC Skills]] · [[Zoth OS]]