"""Zero-Dependency Stdio JSON-RPC 2.0 MCP Server for Agent Policy Auditor.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Exposes 4 live PolicyBroker & ManifestAuditor tools over stdio:
  - policy_lease_grant
  - policy_lease_verify
  - policy_lease_revoke
  - policy_audit_manifest
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict, IO, List, Optional

from agent_policy_auditor import __version__
from agent_policy_auditor.auditor import ManifestAuditor
from agent_policy_auditor.broker import PolicyBroker, VALID_CAPABILITIES

MCP_PROTOCOL_VERSION = "2024-11-05"

TOOLS_SPEC: List[Dict[str, Any]] = [
    {
        "name": "policy_lease_grant",
        "description": "Issue a time-bound, HMAC-SHA256 signed capability lease for an autonomous agent.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id": {"type": "string", "description": "Unique agent identifier"},
                "capability": {
                    "type": "string",
                    "enum": sorted(VALID_CAPABILITIES),
                    "description": "Capability scope primitive",
                },
                "target": {"type": "string", "description": "Path glob, domain, or command scope"},
                "duration_sec": {
                    "type": "number",
                    "description": "Lease TTL in seconds (1..86400)",
                    "default": 300.0,
                },
                "budget_usd": {
                    "type": "number",
                    "description": "Optional USD spend ceiling (0..100000)",
                    "default": 0.0,
                },
            },
            "required": ["agent_id", "capability", "target"],
        },
    },
    {
        "name": "policy_lease_verify",
        "description": "Cryptographically verify an agent action against an active capability lease and budget quota.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "lease_id": {"type": "string", "description": "Issued lease identifier"},
                "capability": {
                    "type": "string",
                    "enum": sorted(VALID_CAPABILITIES),
                    "description": "Capability being exercised",
                },
                "target": {"type": "string", "description": "Concrete path, domain, or resource target"},
                "cost_usd": {
                    "type": "number",
                    "description": "Non-negative action cost in USD",
                    "default": 0.0,
                },
            },
            "required": ["lease_id", "capability", "target"],
        },
    },
    {
        "name": "policy_lease_revoke",
        "description": "Revoke a single capability lease, all leases for one agent, or trigger global kill-switch.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "lease_id": {"type": "string", "description": "Specific lease ID to revoke"},
                "agent_id": {"type": "string", "description": "Revoke all active leases for this agent"},
                "all_agents": {
                    "type": "boolean",
                    "description": "When true, revoke every active lease across all agents",
                    "default": False,
                },
            },
        },
    },
    {
        "name": "policy_audit_manifest",
        "description": "Statically audit an MCP manifest, tool schema, or system prompt against OWASP LLM Top 10 and NIST AI RMF.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "manifest": {
                    "description": "JSON object, tool list, or raw prompt string to audit",
                },
                "name": {
                    "type": "string",
                    "description": "Human-readable manifest label",
                    "default": "agent_manifest",
                },
            },
            "required": ["manifest"],
        },
    },
]


class PolicyMCPServer:
    """In-process JSON-RPC 2.0 handler backed by PolicyBroker and ManifestAuditor."""

    def __init__(
        self,
        broker: Optional[PolicyBroker] = None,
        auditor: Optional[ManifestAuditor] = None,
    ) -> None:
        self.broker = broker if broker is not None else PolicyBroker()
        self.auditor = auditor if auditor is not None else ManifestAuditor()

    def _call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(arguments, dict):
            return self._tool_result({"error": "arguments must be an object"}, is_error=True)

        try:
            if name == "policy_lease_grant":
                lease = self.broker.grant_lease(
                    agent_id=arguments.get("agent_id", ""),
                    capability=arguments.get("capability", ""),
                    target=arguments.get("target", ""),
                    duration_sec=arguments.get("duration_sec", 300.0),
                    max_budget_usd=arguments.get("budget_usd", arguments.get("max_budget_usd", 0.0)),
                )
                return self._tool_result({"status": "granted", "lease": lease.to_dict()}, is_error=False)

            if name == "policy_lease_verify":
                allowed, reason = self.broker.verify_action(
                    lease_id=arguments.get("lease_id", ""),
                    capability=arguments.get("capability", ""),
                    target=arguments.get("target", ""),
                    cost_usd=arguments.get("cost_usd", 0.0),
                )
                lease_info = self.broker.get_lease(str(arguments.get("lease_id", "")).strip())
                payload: Dict[str, Any] = {"allowed": allowed, "reason": reason}
                if lease_info:
                    payload["used_budget_usd"] = lease_info["used_budget_usd"]
                    payload["max_budget_usd"] = lease_info["max_budget_usd"]
                    payload["remaining_budget_usd"] = round(
                        max(0.0, lease_info["max_budget_usd"] - lease_info["used_budget_usd"]),
                        6,
                    )
                return self._tool_result(payload, is_error=False)

            if name == "policy_lease_revoke":
                if arguments.get("all_agents"):
                    count = self.broker.revoke_all_leases()
                    return self._tool_result({"revoked_count": count, "scope": "all_agents"}, is_error=False)
                if arguments.get("lease_id"):
                    lid = str(arguments["lease_id"]).strip()
                    revoked = self.broker.revoke_lease(lid)
                    return self._tool_result({"revoked": revoked, "lease_id": lid}, is_error=False)
                if arguments.get("agent_id"):
                    aid = str(arguments["agent_id"]).strip()
                    count = self.broker.revoke_all_for_agent(aid)
                    return self._tool_result({"revoked_count": count, "agent_id": aid}, is_error=False)
                return self._tool_result(
                    {"error": "Specify lease_id, agent_id, or all_agents=true"},
                    is_error=True,
                )

            if name == "policy_audit_manifest":
                if "manifest" not in arguments:
                    return self._tool_result({"error": "manifest argument is required"}, is_error=True)
                manifest = arguments["manifest"]
                m_name = str(arguments.get("name", "agent_manifest"))
                report = self.auditor.audit_manifest(manifest, name=m_name)
                return self._tool_result(report.to_dict(), is_error=False)

            return self._tool_result({"error": f"Unknown tool: {name}"}, is_error=True)
        except ValueError as exc:
            return self._tool_result({"error": str(exc)}, is_error=True)

    @staticmethod
    def _tool_result(payload: Dict[str, Any], is_error: bool) -> Dict[str, Any]:
        return {
            "content": [{"type": "text", "text": json.dumps(payload)}],
            "structuredContent": payload,
            "isError": is_error,
        }

    def handle_request(self, msg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not isinstance(msg, dict):
            return {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32600, "message": "Invalid Request"},
            }

        req_id = msg.get("id")
        method = msg.get("method")
        params = msg.get("params") or {}

        # Notifications without id require no response
        if req_id is None and isinstance(method, str) and method.startswith("notifications/"):
            return None

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": MCP_PROTOCOL_VERSION,
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": "agent-policy-auditor",
                        "version": __version__,
                    },
                },
            }

        if method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}

        if method == "tools/list":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"tools": TOOLS_SPEC},
            }

        if method == "tools/call":
            if not isinstance(params, dict) or not isinstance(params.get("name"), str):
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": "Invalid params: tool name required"},
                }
            result = self._call_tool(params["name"], params.get("arguments") or {})
            return {"jsonrpc": "2.0", "id": req_id, "result": result}

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }


def run_stdio_server(
    stdin: Optional[IO[str]] = None,
    stdout: Optional[IO[str]] = None,
    broker: Optional[PolicyBroker] = None,
    auditor: Optional[ManifestAuditor] = None,
) -> int:
    in_stream = stdin if stdin is not None else sys.stdin
    out_stream = stdout if stdout is not None else sys.stdout
    server = PolicyMCPServer(broker=broker, auditor=auditor)

    for raw_line in in_stream:
        line = raw_line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error"},
            }
            out_stream.write(json.dumps(resp) + "\n")
            out_stream.flush()
            continue

        resp = server.handle_request(msg)
        if resp is not None:
            out_stream.write(json.dumps(resp) + "\n")
            out_stream.flush()
    return 0
