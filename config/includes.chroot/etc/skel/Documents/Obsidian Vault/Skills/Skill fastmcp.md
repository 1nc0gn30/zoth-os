---
title: "fastmcp"
tags: [skill, hermes]
aliases: ["fastmcp"]
---

# fastmcp

Framework and workflow for building, testing, validating, and deploying Python Model Context Protocol (MCP) servers using FastMCP.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mcp/fastmcp/SKILL.md`
- **Homepage:** `https://gofastmcp.com`
- **Tags:** MCP, FastMCP, Python, Tools, Resources, Prompts, Deployment

## When to Load

Load when developing a new MCP server in Python, exposing APIs, databases, or local file processors as MCP tools, adding resources or prompts, smoke-testing servers locally via CLI, or installing them into clients like Claude Code, Cursor, or Hermes.

## Development & Lifecycle Workflow

1. **Scaffolding:** Starter templates available for REST API wrappers, SQLite query servers, and file processors via `scripts/scaffold_fastmcp.py`.
2. **Tool Implementation:** Uses `@mcp.tool` with explicit type annotations, docstrings, and JSON-serializable outputs.
3. **Resources & Prompts:** Exposes static schemas or policy files with `@mcp.resource`, and reusable instruction templates with `@mcp.prompt`.
4. **Local Validation:** Smoke tests with the FastMCP CLI before client integration:
   - `fastmcp inspect <server.py:mcp>`
   - `fastmcp list <server.py>`
   - `fastmcp call <server.py> <tool_name> [args]`
5. **Client Installation & Deployment:** Registers servers with clients via `fastmcp install` or serves over HTTP (`--transport http`).

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]] · [[Skill mcporter|mcporter]]