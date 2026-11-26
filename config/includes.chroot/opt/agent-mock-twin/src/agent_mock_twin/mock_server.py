"""
mock_server.py: Autonomous zero-dependency ThreadingHTTPServer for AI agent mocks & network twin.
Serves REST / SSE telemetry API, static dashboard UI, and zero-latency mock endpoints.
Zero external pip dependencies.
"""

from __future__ import annotations

import http.server
import json
import math
import mimetypes
import os
import queue
import re
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from urllib.parse import parse_qs, unquote, urlparse

from .matcher import VALID_CHAOS_TYPES, RequestMatcher
from .parser import (
    HarParser,
    OpenAPIParser,
    RecordedRoute,
    find_header_crlf_violation,
    has_crlf_or_ctl,
    is_valid_header_name,
    normalize_path,
)
from .storage import MockStorage

VERSION = "2.6.0"
MAX_BODY_BYTES = 2 * 1024 * 1024  # 2 MiB hard cap

_LOCAL_ORIGIN_RE = re.compile(
    r"^https?://(127\.0\.0\.1|localhost|\[::1\])(?::(\d{1,5}))?$",
    re.IGNORECASE,
)
_ALLOWED_STATIC_ORIGINS = frozenset({"https://zoth.nullai.tech"})
_ALLOWED_HOST_RE = re.compile(
    r"^(127\.0\.0\.1|localhost|\[::1\])(?::(\d{1,5}))?$",
    re.IGNORECASE,
)


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' (index) if it
    tries to climb out with '..' or is absolute. Raw request paths are not normalised."""
    rel = unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _has_path_traversal(raw: str) -> bool:
    """Detect dot-dot traversal, backslash escape, or Windows drive prefixes in raw URL paths."""
    raw_str = str(raw or "")
    decoded = unquote(raw_str)
    decoded2 = unquote(decoded)
    for candidate in (raw_str, decoded, decoded2):
        if "\\" in candidate or "\x00" in candidate:
            return True
        path_only = candidate.split("?", 1)[0].split("#", 1)[0]
        parts = [p for p in path_only.split("/") if p != ""]
        if any(p == ".." for p in parts):
            return True
        if parts and ":" in parts[0]:
            return True
    return False


def _is_local_origin(origin: Optional[str]) -> bool:
    """Strict Origin check. No Origin header = non-browser client (CLI/agent): allowed.
    Otherwise only strict http(s)://127.0.0.1|localhost|[::1](:1..65535) or https://zoth.nullai.tech."""
    if not origin:
        return True
    if not isinstance(origin, str):
        return False
    origin_clean = origin.strip()
    if origin_clean in _ALLOWED_STATIC_ORIGINS:
        return True
    m = _LOCAL_ORIGIN_RE.match(origin_clean)
    if not m:
        return False
    port_str = m.group(2)
    if port_str is not None:
        port_val = int(port_str)
        if not (1 <= port_val <= 65535):
            return False
    return True


def _is_allowed_host(host_header: Optional[str], bound_port: Optional[int] = None) -> bool:
    """Validate HTTP Host header against loopback allowlist (DNS rebinding defense)."""
    if not host_header:
        return True
    if not isinstance(host_header, str):
        return False
    m = _ALLOWED_HOST_RE.match(host_header.strip())
    if not m:
        return False
    port_str = m.group(2)
    if port_str is not None:
        port_val = int(port_str)
        if not (1 <= port_val <= 65535):
            return False
        if bound_port and bound_port > 0 and port_val != bound_port:
            return False
    return True


def _validate_upload_headers(data: Any) -> Optional[str]:
    """Scan uploaded HAR / route list payloads for CRLF or invalid RFC 7230 headers."""
    if isinstance(data, dict) and isinstance(data.get("log"), dict):
        entries = data["log"].get("entries", [])
        if isinstance(entries, list):
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                for section in ("request", "response"):
                    sec = entry.get(section)
                    if isinstance(sec, dict) and isinstance(sec.get("headers"), list):
                        for h in sec["headers"]:
                            if not isinstance(h, dict):
                                continue
                            name = str(h.get("name", ""))
                            val = str(h.get("value", ""))
                            if not is_valid_header_name(name):
                                return f"Invalid HTTP header name in HAR: {name!r}"
                            if has_crlf_or_ctl(val):
                                return f"Forbidden CRLF/control character in HAR header {name!r}"
    elif isinstance(data, list):
        for item in data:
            if not isinstance(item, dict):
                continue
            for field in ("headers", "response_headers"):
                if field in item and item[field] is not None:
                    bad, reason = find_header_crlf_violation(item[field])
                    if bad:
                        return reason
    return None


class SSEBroadcaster:
    """Thread-safe SSE event broadcaster for live UI telemetry feed."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._queues: Set[queue.Queue] = set()

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=100)
        with self._lock:
            self._queues.add(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            self._queues.discard(q)

    def broadcast(self, event_type: str, data: Any) -> None:
        payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        with self._lock:
            for q in list(self._queues):
                try:
                    q.put_nowait(payload)
                except queue.Full:
                    pass


class MockHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    """Handles both mock route intercepts and server control/telemetry API."""

    server: "MockServer"

    def log_message(self, format: str, *args: Any) -> None:
        pass

    def _send_security_headers(self) -> None:
        self.send_header(
            "Content-Security-Policy",
            "frame-ancestors 'self' http://127.0.0.1:* http://localhost:* https://zoth.nullai.tech",
        )
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")

    def _send_api_cors_headers(self) -> None:
        self._send_security_headers()
        self.send_header("Vary", "Origin")
        origin = self.headers.get("Origin")
        if origin and _is_local_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin.strip())
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
            self.send_header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Requested-With, anthropic-version",
            )

    def _reject_forbidden(self, message: str) -> None:
        payload = json.dumps({"success": False, "error": message}).encode("utf-8")
        self.send_response(403)
        self._send_security_headers()
        self.send_header("Vary", "Origin")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _guard_host(self) -> bool:
        host_hdr = self.headers.get("Host")
        bound_port = getattr(self.server, "server_port", None) or self.server.port
        if not _is_allowed_host(host_hdr, bound_port=bound_port):
            self._reject_forbidden("Forbidden Host header")
            return False
        return True

    def _guard_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin):
            self._reject_forbidden("cross-origin request blocked")
            return False
        return True

    def _read_request_body(self) -> Optional[str]:
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None or raw_cl.strip() == "":
            return ""
        cl_str = raw_cl.strip()
        if not cl_str.isdigit():
            self._send_json(400, {"success": False, "error": "Invalid Content-Length header"})
            return None
        content_length = int(cl_str)
        if content_length > MAX_BODY_BYTES:
            self._send_json(413, {"success": False, "error": f"Payload exceeds {MAX_BODY_BYTES} byte limit"})
            return None
        if content_length == 0:
            return ""
        body_bytes = self.rfile.read(content_length)
        return body_bytes.decode("utf-8", errors="replace")

    def _is_known_mock_api_route(self, method: str, path: str) -> bool:
        """Allow explicitly registered mock routes (or Ollama /api/generate) under /api/*."""
        norm = normalize_path(path)
        if norm == "/api/generate" and method == "POST":
            return True
        for r in self.server.storage.get_routes():
            if r.method == method and r.path == norm:
                return True
        return False

    def do_OPTIONS(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        self.send_response(204)
        self._send_api_cors_headers()
        self.end_headers()

    def do_HEAD(self) -> None:
        if not self._guard_host():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if self._try_serve_static(path, is_head=True):
            return
        self.send_response(200)
        self._send_api_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        if not self._guard_host():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return

        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query = parse_qs(parsed_url.query)

        # 1. API: Server Telemetry & Management Routes
        if path in ("/health", "/api/health", "/status", "/api/status"):
            if not self._guard_origin():
                return
            stats = self.server.storage.get_stats()
            actual_port = getattr(self.server, "server_port", None) or self.server.port
            self._send_json(200, {
                "status": "ok",
                "service": "agent-mock-twin",
                "version": VERSION,
                "port": actual_port,
                "routes_count": stats.get("routes_count", 0),
                "total_hits": stats.get("total_hits", 0),
                "total_tokens_saved": stats.get("total_tokens_saved", 0),
                "saved_dollars": stats.get("total_usd_saved", 0.0),
                "total_usd_saved": stats.get("total_usd_saved", 0.0),
                "license": "100% Free & Open Access (Zero Paywalls)",
            })
            return

        if path == "/api/stats":
            if not self._guard_origin():
                return
            stats = self.server.storage.get_stats()
            self._send_json(200, {"success": True, "version": VERSION, "stats": stats})
            return

        if path == "/api/routes":
            if not self._guard_origin():
                return
            routes = [r.to_dict() for r in self.server.storage.get_routes()]
            self._send_json(200, {"success": True, "count": len(routes), "routes": routes})
            return

        if path == "/api/hits":
            if not self._guard_origin():
                return
            raw_limit = query.get("limit", ["50"])[0]
            try:
                limit = int(raw_limit)
            except (TypeError, ValueError):
                self._send_json(400, {"success": False, "error": "Invalid 'limit' query parameter; must be an integer."})
                return
            limit = max(1, min(500, limit))
            hits = self.server.storage.get_recent_hits(limit=limit)
            self._send_json(200, {"success": True, "count": len(hits), "limit": limit, "hits": hits})
            return

        if path == "/api/config":
            if not self._guard_origin():
                return
            cfg = {
                "base_latency_ms": self.server.matcher.base_latency_ms,
                "jitter_ms": self.server.matcher.jitter_ms,
                "chaos_rate": self.server.matcher.chaos_rate,
                "chaos_type": self.server.matcher.chaos_type,
            }
            self._send_json(200, {"success": True, "config": cfg})
            return

        if path == "/api/stream":
            if not self._guard_origin():
                return
            self._handle_sse_stream()
            return

        # Unknown /api/* routes return 404 JSON without polluting mock_hits
        if path.startswith("/api/") and not self._is_known_mock_api_route("GET", path):
            if not self._guard_origin():
                return
            self._send_json(404, {"success": False, "error": f"Unknown API endpoint: {path}"})
            return

        # 2. Static Asset Delivery for Dashboard
        if self._try_serve_static(path):
            return

        # 3. Intercept as Mock Request (e.g. GET /v1/models, GET /v1/users/42)
        if not self._guard_origin():
            return
        self._handle_mock_request(method="GET", body="")

    def do_POST(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return

        parsed_url = urlparse(self.path)
        path = parsed_url.path

        body_text = self._read_request_body()
        if body_text is None:
            return

        # 1. API Management
        if path == "/api/upload":
            self._handle_api_upload(body_text)
            return

        if path == "/api/config":
            self._handle_api_config(body_text)
            return

        if path == "/api/clear":
            self.server.storage.clear_all()
            self.server.broadcaster.broadcast("clear", {"stats": self.server.storage.get_stats()})
            self._send_json(200, {"success": True, "message": "All mock routes and hits cleared."})
            return

        if path == "/api/test":
            self._handle_api_test(body_text)
            return

        if path.startswith("/api/") and not self._is_known_mock_api_route("POST", path):
            self._send_json(404, {"success": False, "error": f"Unknown API endpoint: {path}"})
            return

        # 2. Intercept as Mock Request (e.g. POST /v1/chat/completions)
        self._handle_mock_request(method="POST", body=body_text)

    def do_PUT(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return
        path = urlparse(self.path).path
        if path.startswith("/api/") and not self._is_known_mock_api_route("PUT", path):
            self._send_json(404, {"success": False, "error": f"Unknown API endpoint: {path}"})
            return
        body_text = self._read_request_body()
        if body_text is None:
            return
        self._handle_mock_request(method="PUT", body=body_text)

    def do_DELETE(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return
        path = urlparse(self.path).path
        if path.startswith("/api/") and not self._is_known_mock_api_route("DELETE", path):
            self._send_json(404, {"success": False, "error": f"Unknown API endpoint: {path}"})
            return
        self._handle_mock_request(method="DELETE", body="")

    def do_PATCH(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        if _has_path_traversal(self.path):
            self._reject_forbidden("Path traversal blocked")
            return
        path = urlparse(self.path).path
        if path.startswith("/api/") and not self._is_known_mock_api_route("PATCH", path):
            self._send_json(404, {"success": False, "error": f"Unknown API endpoint: {path}"})
            return
        body_text = self._read_request_body()
        if body_text is None:
            return
        self._handle_mock_request(method="PATCH", body=body_text)

    def _handle_mock_request(self, method: str, body: str) -> None:
        """Route request through matcher and serve mock response."""
        parsed_url = urlparse(self.path)
        raw_path = parsed_url.path
        query = parse_qs(parsed_url.query)

        req_headers = {k.lower(): v for k, v in self.headers.items()}

        candidates = self.server.storage.get_routes()
        match_res = self.server.matcher.match(
            method=method,
            path=raw_path,
            query_params=query,
            headers=req_headers,
            body=body,
            candidates=candidates,
        )

        self.server.matcher.apply_latency_sleep(match_res.latency_ms)

        hit_record = self.server.storage.record_hit(
            method=method,
            path=raw_path,
            match_type=match_res.match_type,
            status_code=match_res.route.response_status,
            latency_ms=match_res.latency_ms,
            tokens_saved=match_res.tokens_saved,
            usd_saved=match_res.usd_saved,
            provider=match_res.route.provider,
            route_id=match_res.route.id,
        )

        self.server.broadcaster.broadcast("hit", hit_record)

        status = match_res.route.response_status
        self.send_response(status)
        self._send_api_cors_headers()

        # Defense-in-depth CRLF + RFC 7230 emission guard
        protected = {
            "content-length",
            "transfer-encoding",
            "access-control-allow-origin",
            "vary",
            "x-mock-twin",
            "x-mock-type",
            "x-mock-latency-ms",
            "x-mock-tokens-saved",
        }
        for h_name, h_val in match_res.route.response_headers.items():
            name_str = str(h_name).strip()
            val_str = str(h_val)
            if name_str.lower() in protected:
                continue
            if not is_valid_header_name(name_str) or has_crlf_or_ctl(val_str):
                continue
            self.send_header(name_str, val_str)

        self.send_header("x-mock-twin", "true")
        self.send_header("x-mock-type", match_res.match_type)
        self.send_header("x-mock-latency-ms", str(match_res.latency_ms))
        self.send_header("x-mock-tokens-saved", str(match_res.tokens_saved))

        res_bytes = match_res.route.response_body.encode("utf-8")
        self.send_header("Content-Length", str(len(res_bytes)))
        self.end_headers()
        self.wfile.write(res_bytes)

    def _handle_sse_stream(self) -> None:
        """Stream real-time server hit telemetry to connected browser clients."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self._send_api_cors_headers()
        self.end_headers()

        q = self.server.broadcaster.subscribe()

        init_payload = (
            f"event: connect\n"
            f"data: {json.dumps({'status': 'connected', 'version': VERSION, 'stats': self.server.storage.get_stats()})}\n\n"
        )
        try:
            self.wfile.write(init_payload.encode("utf-8"))
            self.wfile.flush()
        except Exception:
            self.server.broadcaster.unsubscribe(q)
            return

        try:
            ticks = 0
            while not self.server.is_stopping:
                try:
                    event = q.get(timeout=0.5)
                    self.wfile.write(event.encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    ticks += 1
                    if ticks % 4 == 0:
                        self.wfile.write(b": keep-alive\n\n")
                        self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            self.server.broadcaster.unsubscribe(q)

    def _handle_api_upload(self, body_text: str) -> None:
        """Import HAR or OpenAPI blueprint JSON with CRLF header validation."""
        try:
            data = json.loads(body_text)
            if isinstance(data, dict) and "content" in data and isinstance(data["content"], str):
                data = json.loads(data["content"])

            header_err = _validate_upload_headers(data)
            if header_err:
                self._send_json(400, {"success": False, "error": header_err})
                return

            routes: List[RecordedRoute] = []
            if isinstance(data, dict) and isinstance(data.get("log"), dict) and isinstance(data["log"].get("entries"), list):
                routes = HarParser.parse_dict(data)
            elif isinstance(data, dict) and ("openapi" in data or "swagger" in data or "paths" in data):
                routes = OpenAPIParser.parse_dict(data)
            elif isinstance(data, list):
                if not data or not all(isinstance(d, dict) and "path" in d for d in data):
                    self._send_json(400, {"success": False, "error": "Route list entries must be objects with a 'path' field."})
                    return
                routes = [RecordedRoute.from_dict(d) for d in data]
            else:
                self._send_json(
                    400,
                    {"success": False, "error": "Unrecognized format. Expected HAR 1.2, OpenAPI 3.0, or route list."},
                )
                return

            saved_count = self.server.storage.save_routes(routes)
            stats = self.server.storage.get_stats()
            self._send_json(200, {
                "success": True,
                "imported_count": saved_count,
                "message": f"Successfully ingested {saved_count} mock endpoints into twin.",
                "stats": stats,
            })
        except Exception as e:
            self._send_json(400, {"success": False, "error": f"Failed to parse upload: {str(e)}"})

    def _handle_api_config(self, body_text: str) -> None:
        """Strictly validate and update latency and chaos settings."""
        try:
            data = json.loads(body_text)
            if not isinstance(data, dict):
                self._send_json(400, {"success": False, "error": "Config payload must be a JSON object."})
                return

            if "base_latency_ms" in data:
                val = data["base_latency_ms"]
                if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
                    self._send_json(400, {"success": False, "error": "base_latency_ms must be a finite number."})
                    return
                self.server.matcher.base_latency_ms = max(0, min(10000, int(val)))

            if "jitter_ms" in data:
                val = data["jitter_ms"]
                if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
                    self._send_json(400, {"success": False, "error": "jitter_ms must be a finite number."})
                    return
                self.server.matcher.jitter_ms = max(0, min(5000, int(val)))

            if "chaos_rate" in data:
                val = data["chaos_rate"]
                if isinstance(val, bool) or not isinstance(val, (int, float)) or not math.isfinite(val):
                    self._send_json(400, {"success": False, "error": "chaos_rate must be a finite number."})
                    return
                self.server.matcher.chaos_rate = max(0.0, min(1.0, float(val)))

            if "chaos_type" in data:
                ctype = str(data["chaos_type"])
                if ctype not in VALID_CHAOS_TYPES:
                    self._send_json(
                        400,
                        {"success": False, "error": f"Invalid chaos_type '{ctype}'. Allowed: {', '.join(VALID_CHAOS_TYPES)}"},
                    )
                    return
                self.server.matcher.chaos_type = ctype

            cfg = {
                "base_latency_ms": self.server.matcher.base_latency_ms,
                "jitter_ms": self.server.matcher.jitter_ms,
                "chaos_rate": self.server.matcher.chaos_rate,
                "chaos_type": self.server.matcher.chaos_type,
            }
            self._send_json(200, {"success": True, "config": cfg})
        except Exception as e:
            self._send_json(400, {"success": False, "error": str(e)})

    def _handle_api_test(self, body_text: str) -> None:
        """Simulate an agent request via the REST API for dashboard playground."""
        try:
            req = json.loads(body_text)
            if not isinstance(req, dict):
                self._send_json(400, {"success": False, "error": "Test payload must be a JSON object."})
                return
            method = str(req.get("method", "POST")).upper()
            path = str(req.get("path", "/v1/chat/completions"))
            req_body = req.get("body", "")
            if isinstance(req_body, (dict, list)):
                req_body = json.dumps(req_body)
            else:
                req_body = str(req_body or "")

            candidates = self.server.storage.get_routes()
            match_res = self.server.matcher.match(
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body=req_body,
                candidates=candidates,
            )

            hit_record = self.server.storage.record_hit(
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
            self.server.broadcaster.broadcast("hit", hit_record)

            self._send_json(200, {
                "success": True,
                "hit": hit_record,
                "match_type": match_res.match_type,
                "confidence": match_res.confidence,
                "latency_ms": match_res.latency_ms,
                "tokens_saved": match_res.tokens_saved,
                "usd_saved": match_res.usd_saved,
                "provider": match_res.route.provider,
                "response_status": match_res.route.response_status,
                "response_body": match_res.route.response_body,
                "response_headers": match_res.route.response_headers,
            })
        except Exception as e:
            self._send_json(400, {"success": False, "error": str(e)})

    def _try_serve_static(self, path: str, is_head: bool = False) -> bool:
        """Serve files from public directory with strict Path.resolve().is_relative_to() containment."""
        public_root = Path(self.server.public_dir).resolve()
        if not public_root.is_dir():
            return False

        if path in ("/", ""):
            candidate = (public_root / "index.html").resolve()
        else:
            rel = _safe_rel(path)
            if not rel:
                self._reject_forbidden("Invalid static path")
                return True
            candidate = (public_root / rel).resolve()

        if not candidate.is_relative_to(public_root):
            self._reject_forbidden("Path traversal blocked")
            return True

        if candidate.is_file():
            self._serve_file(str(candidate), is_head=is_head)
            return True

        # SPA fallback only for UI routes (never /api/* or /v1/*)
        index_path = (public_root / "index.html").resolve()
        if not path.startswith("/api/") and not path.startswith("/v1/") and index_path.is_file():
            self._serve_file(str(index_path), is_head=is_head)
            return True

        return False

    def _serve_file(self, file_path: str, is_head: bool = False) -> None:
        """Serve a static file with correct MIME type and zero wildcard/fallback ACAO."""
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            if file_path.endswith(".js"):
                mime_type = "application/javascript"
            elif file_path.endswith(".css"):
                mime_type = "text/css"
            elif file_path.endswith(".html"):
                mime_type = "text/html"
            else:
                mime_type = "text/plain"

        try:
            with open(file_path, "rb") as f:
                content = f.read()

            self.send_response(200)
            ct = f"{mime_type}; charset=utf-8" if ("text" in mime_type or "javascript" in mime_type or "xml" in mime_type) else mime_type
            self.send_header("Content-Type", ct)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self._send_security_headers()
            self.end_headers()
            if not is_head:
                self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": f"Failed to read static file: {str(e)}"})

    def _send_json(self, status: int, data: Any) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._send_api_cors_headers()
        self.end_headers()
        self.wfile.write(payload)


class MockServer(http.server.ThreadingHTTPServer):
    """Threading HTTPServer instance managing storage, matcher, and broadcaster."""

    daemon_threads = True

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 8097,
        db_path: str = "agent_mock.db",
        public_dir: Optional[str] = None,
        base_latency_ms: int = 25,
        jitter_ms: int = 15,
        chaos_rate: float = 0.0,
    ) -> None:
        self.allow_reuse_address = True
        super().__init__((host, port), MockHTTPRequestHandler)
        self.host = host
        self.port = self.server_port
        self.storage = MockStorage(db_path=db_path)
        self.matcher = RequestMatcher(
            base_latency_ms=base_latency_ms,
            jitter_ms=jitter_ms,
            chaos_rate=chaos_rate,
        )
        self.broadcaster = SSEBroadcaster()
        self.is_stopping = False
        self._shutdown_started = threading.Event()

        if public_dir:
            self.public_dir = public_dir
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.public_dir = os.path.join(base_dir, "public")

    def run_in_thread(self) -> threading.Thread:
        """Start server in a daemon thread."""
        t = threading.Thread(target=self.serve_forever, kwargs={"poll_interval": 0.25}, daemon=True)
        t.start()
        return t

    def request_shutdown_async(self) -> None:
        """Safe to call from a main-thread signal handler (never deadlocks serve_forever)."""
        self.is_stopping = True
        if not self._shutdown_started.is_set():
            self._shutdown_started.set()
            threading.Thread(target=self.shutdown, daemon=True).start()

    def shutdown_cleanly(self) -> None:
        """Shut down HTTPServer cleanly from outside serve_forever's thread."""
        self.is_stopping = True
        if not self._shutdown_started.is_set():
            self._shutdown_started.set()
            try:
                self.shutdown()
            except Exception:
                pass
        try:
            self.server_close()
        except Exception:
            pass
