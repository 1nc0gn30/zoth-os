---
title: "mcp-oauth-remote-gateway"
tags: [skill, hermes]
aliases: ["mcp-oauth-remote-gateway"]
---

# mcp-oauth-remote-gateway

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mcp/mcp-oauth-remote-gateway/SKILL.md`

## Overview
Provides manual OAuth 2.1 and PKCE authorization workflows for remote Model Context Protocol (MCP) servers operating on headless gateways, VPS hosts, or Docker containers where local loopback redirects fail.

## When to Load
- Connecting remote HTTP MCP servers that require OAuth authentication to headless Hermes gateways.
- Performing manual authorization code flows with PKCE when running in environments without an interactive desktop browser.
- Manually registering OAuth clients via Dynamic Client Registration (RFC 7591).
- Populating Hermes token storage (`$HERMES_HOME/mcp-tokens/<server>.json` and `<server>.client.json`) to enable `/reload-mcp` without browser intervention.
- Diagnosing MCP OAuth session expirations, circuit breaker lockouts, and token refresh failures (`diagnose-oauth-mcp.py`).

## Core Architecture
- **Protocol Flow:** Discovers metadata via RFC 9728, executes public client registration, constructs PKCE authorize links, exchanges authorization codes, and writes structured tokens.
- **Safety Invariants:** Stashes verifiers securely, enforces CSRF state validation, and tests connection initialization prior to reloading Hermes MCP services.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill hermes-agent|hermes-agent]] · [[Skill mcporter|mcporter]] · [[Skill fastmcp|fastmcp]]