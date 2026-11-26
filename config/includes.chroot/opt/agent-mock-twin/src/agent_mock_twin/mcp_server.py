"""
mcp_server.py: Zero-dependency JSON-RPC 2.0 stdio MCP server for Agent Mock Twin.
Exposes: mock_replay_query, mock_list_routes, mock_import_spec, mock_get_stats.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from typing import Any, Dict, List, Optional, TextIO

from .matcher import RequestMatcher
from .mock_server import VERSION, _validate_upload_headers
from .parser import HarParser, OpenAPIParser, RecordedRoute
from .storage import MockStorage

PROTOCOL_VERSION = "2024-11-05"

TOOLS_SPEC: List[Dict[str, Any]] = [
    {
        "name": "mock_replay_query",
        "description": "Execute or test an offline API mock request against recorded HAR or OpenAPI routes (uses live :8097 daemon if reachable, otherwise local SQLite).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"], "default": "POST"},
                "path": {"type": "string", "description": "Target request path (e.g. /v1/chat/completions or /v1/users/42)"},
                "body": {"description": "Optional JSON object or raw string request body"},
            },
            "required": ["path"],
        },
    },
    {
        "name": "mock_list_routes",
        "description": "List active mock routes indexed in Agent Mock Twin (filtered optionally by provider).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "provider": {"type": "string", "description": "Optional provider filter (openai, anthropic, ollama, gemini, custom)"},
                "limit": {"type": "integer", "minimum": 1, "maximum": 200, "default": 50},
            },
        },
    },
    {
        "name": "mock_import_spec",
        "description": "Import a HAR 1.2 archive, OpenAPI 3.0 spec, or route list (via inline JSON object/string or local file_path) into Agent Mock Twin.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "spec": {"description": "HAR 1.2 / OpenAPI 3.0 JSON object, JSON string, or route list"},
                "file_path": {"type": "string", "description": "Optional local path to a HAR 1.2 or OpenAPI 3.0 JSON file"},
            },
        },
    },
    {
        "name": "mock_get_stats",
        "description": "Fetch cumulative mock replay telemetry (total hits, tokens saved, estimated USD saved, routes count, and match-tier breakdown).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "port": {"type": "integer", "default": 8097, "description": "Optional loopback daemon port to probe"},
            },
        },
    },
]


class MCPServer:
    """Line-delimited JSON-RPC 2.0 stdio MCP server for Agent Mock Twin."""

    def __init__(self, db_path: str = "agent_mock.db", port: int = 8097) -> None:
        self.db_path = db_path
        self.port = int(port)
        self.storage = MockStorage(db_path=db_path)
        self.matcher = RequestMatcher(base_latency_ms=0, jitter_ms=0)

    def _http_json(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None, port: Optional[int] = None) -> Optional[Dict[str, Any]]:
        target_port = int(port or self.port)
        url = f"http://127.0.0.1:{target_port}{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {"Content-Type": "application/json"} if data is not None else {}
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            return None

    def _call_mock_replay_query(self, args: Dict[str, Any]) -> Dict[str, Any]:
        method = str(args.get("method", "POST")).upper()
        path = str(args.get("path", "/v1/chat/completions"))
        body = args.get("body", "")
        if isinstance(body, (dict, list)):
            body_str = json.dumps(body)
        else:
            body_str = str(body or "")

        live = self._http_json("POST", "/api/test", {"method": method, "path": path, "body": body_str})
        if live and live.get("success"):
            resp_obj: Any = live.get("response_body", "")
            try:
                resp_obj = json.loads(resp_obj) if isinstance(resp_obj, str) else resp_obj
            except Exception:
                pass
            return {
                "source": "live-daemon",
                "status": live.get("response_status", 200),
                "matchedTier": live.get("match_type", "fallback"),
                "confidence": live.get("confidence", 1.0),
                "tokensSaved": live.get("tokens_saved", 0),
                "usdSaved": live.get("usd_saved", 0.0),
                "provider": live.get("provider", "custom"),
                "response": resp_obj,
            }

        candidates = self.storage.get_routes()
        match_res = self.matcher.match(
            method=method,
            path=path,
            query_params={},
            headers={"content-type": "application/json"},
            body=body_str,
            candidates=candidates,
        )
        self.storage.record_hit(
            method=method,
            path=path,
            match_type=match_res.match_type,
            status_code=match_res.route.response_status,
            latency_ms=match_res.latency_ms,
            tokens_saved=match_res.tokens_saved,
            usd_saved=match_res.usd_saved,
            provider=match_res.route.provider,
            route_id=match_res.route.id,
        )
        try:
            parsed_resp = json.loads(match_res.route.response_body)
        except Exception:
            parsed_resp = match_res.route.response_body
        return {
            "source": "local-sqlite",
            "status": match_res.route.response_status,
            "matchedTier": match_res.match_type,
            "confidence": match_res.confidence,
            "tokensSaved": match_res.tokens_saved,
            "usdSaved": match_res.usd_saved,
            "provider": match_res.route.provider,
            "response": parsed_resp,
        }

    def _call_mock_list_routes(self, args: Dict[str, Any]) -> Dict[str, Any]:
        provider_filter = str(args.get("provider", "") or "").lower().strip()
        try:
            limit = max(1, min(200, int(args.get("limit", 50))))
        except (TypeError, ValueError):
            limit = 50

        live = self._http_json("GET", "/api/routes")
        if live and live.get("success") and isinstance(live.get("routes"), list):
            routes = live["routes"]
            source = "live-daemon"
        else:
            routes = [r.to_dict() for r in self.storage.get_routes()]
            source = "local-sqlite"

        if provider_filter:
            routes = [r for r in routes if str(r.get("provider", "")).lower() == provider_filter]
        routes = routes[:limit]
        summary = [
            {
                "id": r.get("id"),
                "method": r.get("method"),
                "path": r.get("path"),
                "provider": r.get("provider"),
                "response_status": r.get("response_status", 200),
                "token_estimate": r.get("token_estimate", 0),
                "description": r.get("description", ""),
            }
            for r in routes
        ]
        return {"source": source, "count": len(summary), "routes": summary}

    def _call_mock_import_spec(self, args: Dict[str, Any]) -> Dict[str, Any]:
        raw_spec = args.get("spec")
        file_path = args.get("file_path")

        if raw_spec is None and file_path:
            fp = os.path.expanduser(str(file_path))
            if not os.path.isfile(fp):
                raise ValueError(f"Spec file not found: {fp}")
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
        elif isinstance(raw_spec, str):
            data = json.loads(raw_spec)
        elif isinstance(raw_spec, (dict, list)):
            data = raw_spec
        else:
            raise ValueError("Provide either 'spec' (HAR/OpenAPI JSON) or 'file_path'.")

        header_err = _validate_upload_headers(data)
        if header_err:
            raise ValueError(header_err)

        live = self._http_json("POST", "/api/upload", data if isinstance(data, dict) else {"content": json.dumps(data)})
        if live and live.get("success"):
            return {
                "source": "live-daemon",
                "imported_count": live.get("imported_count", 0),
                "stats": live.get("stats", {}),
            }

        if isinstance(data, dict) and isinstance(data.get("log"), dict) and isinstance(data["log"].get("entries"), list):
            routes = HarParser.parse_dict(data)
        elif isinstance(data, dict) and ("openapi" in data or "swagger" in data or "paths" in data):
            routes = OpenAPIParser.parse_dict(data)
        elif isinstance(data, list):
            routes = [RecordedRoute.from_dict(d) for d in data if isinstance(d, dict)]
        else:
            raise ValueError("Unrecognized format. Expected HAR 1.2, OpenAPI 3.0, or route list.")

        saved = self.storage.save_routes(routes)
        return {
            "source": "local-sqlite",
            "imported_count": saved,
            "stats": self.storage.get_stats(),
        }

    def _call_mock_get_stats(self, args: Dict[str, Any]) -> Dict[str, Any]:
        target_port = int(args.get("port") or self.port)
        health = self._http_json("GET", "/health", port=target_port)
        stats_resp = self._http_json("GET", "/api/stats", port=target_port)
        if health and stats_resp and stats_resp.get("success"):
            return {
                "source": "live-daemon",
                "online": True,
                "port": target_port,
                "version": health.get("version", VERSION),
                "health": health,
                "stats": stats_resp.get("stats", {}),
            }
        return {
            "source": "local-sqlite",
            "online": False,
            "port": target_port,
            "version": VERSION,
            "stats": self.storage.get_stats(),
        }

    def handle_request(self, req: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        req_id = req.get("id")
        method = req.get("method", "")
        params = req.get("params") or {}

        if method == "notifications/initialized":
            return None

        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": PROTOCOL_VERSION,
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "agent-mock-twin", "version": VERSION},
                },
            }

        if method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": {}}

        if method == "tools/list":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS_SPEC}}

        if method == "tools/call":
            tool_name = params.get("name")
            tool_args = params.get("arguments") or {}
            dispatch = {
                "mock_replay_query": self._call_mock_replay_query,
                "mock_list_routes": self._call_mock_list_routes,
                "mock_import_spec": self._call_mock_import_spec,
                "mock_get_stats": self._call_mock_get_stats,
            }
            fn = dispatch.get(tool_name)
            if fn is None:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": f"Unknown tool: {tool_name}"},
                }
            try:
                result_obj = fn(tool_args if isinstance(tool_args, dict) else {})
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps(result_obj, indent=2)}],
                        "structuredContent": result_obj,
                        "isError": False,
                    },
                }
            except Exception as exc:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps({"error": str(exc)})}],
                        "isError": True,
                    },
                }

        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }

    def serve_stdio(self, stdin: Optional[TextIO] = None, stdout: Optional[TextIO] = None) -> int:
        in_stream = stdin or sys.stdin
        out_stream = stdout or sys.stdout
        for raw_line in in_stream:
            line = raw_line.strip()
            if not line:
                continue
            try:
                req = json.loads(line)
            except json.JSONDecodeError as exc:
                err_resp = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {"code": -32700, "message": f"Parse error: {exc}"},
                }
                out_stream.write(json.dumps(err_resp) + "\n")
                out_stream.flush()
                continue
            if not isinstance(req, dict):
                continue
            resp = self.handle_request(req)
            if resp is not None:
                out_stream.write(json.dumps(resp) + "\n")
                out_stream.flush()
        return 0
