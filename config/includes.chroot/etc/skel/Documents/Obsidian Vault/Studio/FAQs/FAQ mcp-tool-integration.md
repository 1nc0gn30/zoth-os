---
title: "How does Model Context Protocol (MCP) tool integration work in Zoth Studio v2?"
tags: [studio, faq]
---

# How does Model Context Protocol (MCP) tool integration work in Zoth Studio v2?

**Category:** Architecture

Standard MCP interface allows external AI agents to discover and invoke Zoth Studio's 72 tools via validated JSON-Schema contracts.

Zoth Studio implements the Anthropic Model Context Protocol (MCP) specification to bridge tools with external agent frameworks. External agent environments (such as Claude Code, Hermes Agent, Cursor, or local agents) can connect to the studio interface: • tools/list: Discovers all 72 sovereign tools with complete input parameter schemas. • tools/call: Dispatches execution requests against validated JSON-Schema contracts. • resources/read: Inspects local memory states or architectural specifications. All tool executions remain contained within the local client runtime without external network leakage.

## See also

[[Zoth Studio]] · [[MOC FAQs]]