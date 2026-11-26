"""Zero-dependency stdio MCP server for agent-flight-recorder (JSON-RPC 2.0, newline-delimited).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.

Tools:
  flight_recorder_scrub     Scrub and reconstruct session forensics at a millisecond offset
  flight_recorder_sessions  List recorded sessions and SQLite storage metrics
  flight_recorder_ingest    Append a SHA-256 hash-chained forensic event into a session
  flight_recorder_verify    Verify a session's append-only SHA-256 hash chain integrity

Run:  agent-flight-recorder mcp   (or python3 -m agent_flight_recorder.mcp_server --db <path>)
"""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, List, Optional, TextIO

from . import __version__
from .storage import FlightStorage

PROTOCOL_VERSION = "2025-06-18"
SUPPORTED_PROTOCOLS = ("2025-06-18", "2025-03-26", "2024-11-05")

TOOLS: List[Dict[str, Any]] = [
    {
        "name": "flight_recorder_scrub",
        "description": "Scrub and reconstruct the agent execution state (terminal output, egress nodes, engrams, threats, capsule runs, and SHA-256 chain head) up to a specific millisecond offset.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "Flight session ID"},
                "offset_ms": {
                    "type": "number",
                    "minimum": 0,
                    "description": "Millisecond offset along the timeline (omit for end-of-session snapshot)",
                },
            },
            "required": ["session_id"],
            "additionalProperties": False,
        },
    },
    {
        "name": "flight_recorder_sessions",
        "description": "List recent recorded flight sessions alongside SQLite telemetry storage stats.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 500,
                    "default": 25,
                    "description": "Maximum number of sessions to return",
                },
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "flight_recorder_ingest",
        "description": "Append a forensic telemetry event into SQLite (auto-creating the parent session if needed) and link it into the session's SHA-256 hash chain.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "Optional session ID (auto-created if absent)"},
                "event_type": {"type": "string", "description": "Event type (e.g. terminal_stdout, network_egress, prompt_scan, capsule_execution)"},
                "payload": {"type": "object", "description": "Structured JSON payload for the event"},
                "severity": {"type": "string", "enum": ["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"], "default": "INFO"},
                "offset_ms": {"type": "number", "minimum": 0, "description": "Optional explicit millisecond offset"},
            },
            "required": ["event_type", "payload"],
            "additionalProperties": False,
        },
    },
    {
        "name": "flight_recorder_verify",
        "description": "Verify the append-only SHA-256 hash chain of a recorded session to detect any post-recording SQLite tampering.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string", "description": "Flight session ID to verify"},
            },
            "required": ["session_id"],
            "additionalProperties": False,
        },
    },
]


class FlightRecorderMCPServer:
    def __init__(self, storage: FlightStorage):
        self.storage = storage

    def _call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(arguments, dict):
            raise ValueError("Tool arguments must be a JSON object")

        if name == "flight_recorder_scrub":
            sid = str(arguments.get("session_id") or "").strip()
            if not sid:
                raise ValueError("session_id is required")
            session = self.storage.get_session(sid)
            if not session:
                return {
                    "content": [{"type": "text", "text": json.dumps({"error": f"Session not found: {sid}"})}],
                    "isError": True,
                }
            offset_raw = arguments.get("offset_ms")
            offset_ms: Optional[float] = None
            if offset_raw is not None:
                offset_ms = float(offset_raw)
                if offset_ms < 0:
                    raise ValueError("offset_ms must be >= 0")
            snap = self.storage.get_session_forensics(sid, up_to_offset_ms=offset_ms)
            snap["duration_ms"] = round(float(session.get("duration_seconds") or 0.0) * 1000.0, 2)
            return {
                "content": [{"type": "text", "text": json.dumps(snap, ensure_ascii=False)}],
                "structuredContent": snap,
                "isError": False,
            }

        if name == "flight_recorder_sessions":
            limit = int(arguments.get("limit", 25))
            limit = max(1, min(500, limit))
            result = {
                "sessions": self.storage.get_sessions(limit=limit),
                "stats": self.storage.get_db_stats(),
                "version": __version__,
            }
            return {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}],
                "structuredContent": result,
                "isError": False,
            }

        if name == "flight_recorder_ingest":
            event_type = str(arguments.get("event_type") or "").strip()
            if not event_type:
                raise ValueError("event_type is required")
            payload = arguments.get("payload")
            if not isinstance(payload, dict):
                raise ValueError("payload must be a JSON object")
            sid = str(arguments.get("session_id") or "").strip()
            if not sid:
                sid = self.storage.create_session(title="MCP Ingested Session")
            severity = str(arguments.get("severity") or "INFO").upper()
            offset_raw = arguments.get("offset_ms")
            offset_ms = float(offset_raw) if offset_raw is not None else None
            if offset_ms is not None and offset_ms < 0:
                raise ValueError("offset_ms must be >= 0")

            event_id = self.storage.append_event(
                session_id=sid,
                event_type=event_type,
                payload=payload,
                severity=severity,
                offset_ms=offset_ms,
            )
            chain = self.storage.verify_session_chain(sid)
            result = {
                "status": "ingested",
                "event_id": event_id,
                "session_id": sid,
                "head_hash": chain["head_hash"] if chain else "",
                "chain_valid": bool(chain["valid"]) if chain else False,
            }
            return {
                "content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}],
                "structuredContent": result,
                "isError": False,
            }

        if name == "flight_recorder_verify":
            sid = str(arguments.get("session_id") or "").strip()
            if not sid:
                raise ValueError("session_id is required")
            verification = self.storage.verify_session_chain(sid)
            if verification is None:
                return {
                    "content": [{"type": "text", "text": json.dumps({"error": f"Session not found: {sid}"})}],
                    "isError": True,
                }
            return {
                "content": [{"type": "text", "text": json.dumps(verification, ensure_ascii=False)}],
                "structuredContent": verification,
                "isError": False,
            }

        raise KeyError(f"Unknown tool: {name}")

    def handle_message(self, msg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not isinstance(msg, dict) or msg.get("jsonrpc") != "2.0":
            return {
                "jsonrpc": "2.0",
                "id": msg.get("id") if isinstance(msg, dict) else None,
                "error": {"code": -32600, "message": "Invalid Request"},
            }

        req_id = msg.get("id")
        method = msg.get("method")
        params = msg.get("params") or {}

        # Notifications have no id and expect no reply
        if req_id is None and method in ("notifications/initialized", "notifications/cancelled"):
            return None

        if method == "initialize":
            client_proto = params.get("protocolVersion") if isinstance(params, dict) else None
            chosen = client_proto if client_proto in SUPPORTED_PROTOCOLS else PROTOCOL_VERSION
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": chosen,
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {
                        "name": "agent-flight-recorder",
                        "version": __version__,
                    },
                },
            }

        if method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}

        if method == "tools/list":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

        if method == "tools/call":
            if not isinstance(params, dict) or not params.get("name"):
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": "Missing tool name"},
                }
            try:
                res = self._call_tool(str(params["name"]), params.get("arguments") or {})
                return {"jsonrpc": "2.0", "id": req_id, "result": res}
            except KeyError as exc:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": str(exc)},
                }
            except ValueError as exc:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32602, "message": str(exc)},
                }
            except Exception as exc:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32603, "message": f"Internal tool error: {exc}"},
                }

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }

    def serve_stdio(self, stdin: TextIO = sys.stdin, stdout: TextIO = sys.stdout) -> None:
        for raw_line in stdin:
            line = raw_line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                err = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": "Parse error"},
                }
                stdout.write(json.dumps(err) + "\n")
                stdout.flush()
                continue

            resp = self.handle_message(msg)
            if resp is not None:
                stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
                stdout.flush()


def run_mcp_stdio(db_path: str = "flight_recorder.db") -> None:
    storage = FlightStorage(db_path=db_path)
    server = FlightRecorderMCPServer(storage=storage)
    server.serve_stdio()


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent Flight Recorder Stdio MCP Server (JSON-RPC 2.0)")
    parser.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    args = parser.parse_args()
    run_mcp_stdio(db_path=args.db)


if __name__ == "__main__":
    main()
