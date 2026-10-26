"""
mock_server.py: Autonomous zero-dependency ThreadingHTTPServer for AI agent mocks & network twin.
Serves both REST / SSE telemetry API, static dashboard UI, and zero-latency mock endpoints.
Zero external pip dependencies.
"""

from __future__ import annotations

import http.server
import json
import mimetypes
import os
import queue
import socket
import sys
import threading
import time
from typing import Any, Dict, List, Optional, Set
from urllib.parse import parse_qs, urlparse

from .matcher import MatchResult, RequestMatcher
from .parser import HarParser, OpenAPIParser, RecordedRoute, normalize_path
from .storage import MockStorage


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' (index) if it
    tries to climb out with '..' or is absolute. Raw request paths are not normalised."""
    from urllib.parse import unquote
    rel = unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _is_local_origin(origin) -> bool:
    """Browser Origin check. No Origin header = non-browser client (CLI/agent): allowed.
    Otherwise only http(s)://localhost / 127.0.0.1 / [::1] pages may call this API, so a
    random website can't drive the local server from the user's browser (CSRF)."""
    if not origin:
        return True
    from urllib.parse import urlparse
    try:
        u = urlparse(origin)
    except ValueError:
        return False
    return u.scheme in ("http", "https") and u.hostname in ("localhost", "127.0.0.1", "::1")


def _cors_origin(handler) -> str:
    origin = handler.headers.get("Origin")
    return origin if origin and _is_local_origin(origin) else "http://127.0.0.1"



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

    server: "MockServer"  # Type hint for server reference

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress noisy default console logging, output clean structured logs
        pass

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, anthropic-version")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_HEAD(self) -> None:
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if self._try_serve_static(path, is_head=True):
            return
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query = parse_qs(parsed_url.query)

        # 1. API: Server Telemetry & Management Routes
        if path == "/api/stats":
            stats = self.server.storage.get_stats()
            self._send_json(200, {"success": True, "stats": stats})
            return

        if path == "/api/routes":
            routes = [r.to_dict() for r in self.server.storage.get_routes()]
            self._send_json(200, {"success": True, "count": len(routes), "routes": routes})
            return

        if path == "/api/hits":
            limit = int(query.get("limit", [50])[0])
            hits = self.server.storage.get_recent_hits(limit=limit)
            self._send_json(200, {"success": True, "count": len(hits), "hits": hits})
            return

        if path == "/api/config":
            cfg = {
                "base_latency_ms": self.server.matcher.base_latency_ms,
                "jitter_ms": self.server.matcher.jitter_ms,
                "chaos_rate": self.server.matcher.chaos_rate,
                "chaos_type": self.server.matcher.chaos_type,
            }
            self._send_json(200, {"success": True, "config": cfg})
            return

        if path == "/api/stream":
            self._handle_sse_stream()
            return

        # 2. Static Asset Delivery for Dashboard
        if self._try_serve_static(path):
            return

        # 3. Intercept as Mock Request (e.g. GET /v1/models)
        self._handle_mock_request(method="GET", body="")

    def do_POST(self) -> None:
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        # Read body
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
        body_text = body_bytes.decode("utf-8", errors="replace")

        # 1. API Management
        if path == "/api/upload":
            self._handle_api_upload(body_text)
            return

        if path == "/api/config":
            self._handle_api_config(body_text)
            return

        if path == "/api/clear":
            self.server.storage.clear_all()
            self._send_json(200, {"success": True, "message": "All mock routes and hits cleared."})
            return

        if path == "/api/test":
            self._handle_api_test(body_text)
            return

        # 2. Intercept as Mock Request (e.g. POST /v1/chat/completions)
        self._handle_mock_request(method="POST", body=body_text)

    def do_PUT(self) -> None:
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        content_length = int(self.headers.get("Content-Length", 0))
        body_text = self.rfile.read(content_length).decode("utf-8", errors="replace") if content_length > 0 else ""
        self._handle_mock_request(method="PUT", body=body_text)

    def do_DELETE(self) -> None:
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        self._handle_mock_request(method="DELETE", body="")

    def do_PATCH(self) -> None:
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        content_length = int(self.headers.get("Content-Length", 0))
        body_text = self.rfile.read(content_length).decode("utf-8", errors="replace") if content_length > 0 else ""
        self._handle_mock_request(method="PATCH", body=body_text)

    def _handle_mock_request(self, method: str, body: str) -> None:
        """Route request through matcher and serve mock response."""
        parsed_url = urlparse(self.path)
        raw_path = parsed_url.path
        query = parse_qs(parsed_url.query)

        # Collect lowercased request headers
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

        # Apply latency simulation
        self.server.matcher.apply_latency_sleep(match_res.latency_ms)

        # Record hit telemetry
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

        # Broadcast telemetry to SSE feed
        self.server.broadcaster.broadcast("hit", hit_record)

        # Send response
        status = match_res.route.response_status
        self.send_response(status)
        self._send_cors_headers()

        # Send route headers
        for h_name, h_val in match_res.route.response_headers.items():
            if h_name.lower() not in ("content-length", "access-control-allow-origin", "x-mock-twin"):
                self.send_header(h_name, h_val)

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
        self._send_cors_headers()
        self.end_headers()

        q = self.server.broadcaster.subscribe()

        # Send initial connect event
        init_payload = f"event: connect\ndata: {json.dumps({'status': 'connected', 'stats': self.server.storage.get_stats()})}\n\n"
        try:
            self.wfile.write(init_payload.encode("utf-8"))
            self.wfile.flush()
        except Exception:
            self.server.broadcaster.unsubscribe(q)
            return

        try:
            while not self.server.is_stopping:
                try:
                    event = q.get(timeout=2.0)
                    self.wfile.write(event.encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    # Send keep-alive ping
                    self.wfile.write(b": keep-alive\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            self.server.broadcaster.unsubscribe(q)

    def _handle_api_upload(self, body_text: str) -> None:
        """Import HAR or OpenAPI blueprint JSON."""
        try:
            data = json.loads(body_text)
            routes: List[RecordedRoute] = []

            # Check if HAR or OpenAPI
            if "log" in data and "entries" in data["log"]:
                routes = HarParser.parse_dict(data)
            elif "openapi" in data or "swagger" in data or "paths" in data:
                routes = OpenAPIParser.parse_dict(data)
            elif isinstance(data, list):
                # Direct route list
                routes = [RecordedRoute.from_dict(d) for d in data if isinstance(d, dict)]
            else:
                self._send_json(400, {"success": False, "error": "Unrecognized format. Expected HAR 1.2 or OpenAPI 3.0 specification."})
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
        """Update latency and chaos settings."""
        try:
            data = json.loads(body_text)
            if "base_latency_ms" in data:
                self.server.matcher.base_latency_ms = int(data["base_latency_ms"])
            if "jitter_ms" in data:
                self.server.matcher.jitter_ms = int(data["jitter_ms"])
            if "chaos_rate" in data:
                self.server.matcher.chaos_rate = float(data["chaos_rate"])
            if "chaos_type" in data:
                self.server.matcher.chaos_type = str(data["chaos_type"])

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
            method = req.get("method", "POST").upper()
            path = req.get("path", "/v1/chat/completions")
            req_body = req.get("body", "")
            if isinstance(req_body, dict):
                req_body = json.dumps(req_body)

            candidates = self.server.storage.get_routes()
            match_res = self.server.matcher.match(
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body=req_body,
                candidates=candidates,
            )

            # Record test hit
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
        """Serve files from public directory or fallback to index.html for SPA."""
        public_dir = self.server.public_dir
        if not os.path.isdir(public_dir):
            return False

        if path in ("/", ""):
            file_path = os.path.join(public_dir, "index.html")
        else:
            rel = _safe_rel(path)
            file_path = os.path.join(public_dir, rel)

        if os.path.isfile(file_path):
            self._serve_file(file_path, is_head=is_head)
            return True

        # SPA fallback
        index_path = os.path.join(public_dir, "index.html")
        if not path.startswith("/api/") and not path.startswith("/v1/") and os.path.isfile(index_path):
            self._serve_file(index_path, is_head=is_head)
            return True

        return False

    def _serve_file(self, file_path: str, is_head: bool = False) -> None:
        """Serve a static file with correct MIME type and caching headers."""
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
            self.send_header("Content-Type", f"{mime_type}; charset=utf-8" if "text" in mime_type or "javascript" in mime_type else mime_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self._send_cors_headers()
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
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(payload)


class MockServer(http.server.ThreadingHTTPServer):
    """Threading HTTPServer instance managing storage, matcher, and broadcaster."""

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
        self.port = port
        self.storage = MockStorage(db_path=db_path)
        self.matcher = RequestMatcher(
            base_latency_ms=base_latency_ms,
            jitter_ms=jitter_ms,
            chaos_rate=chaos_rate,
        )
        self.broadcaster = SSEBroadcaster()
        self.is_stopping = False

        if public_dir:
            self.public_dir = public_dir
        else:
            # Locate public dir relative to repository root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.public_dir = os.path.join(base_dir, "public")

    def run_in_thread(self) -> threading.Thread:
        """Start server in a daemon thread."""
        t = threading.Thread(target=self.serve_forever, daemon=True)
        t.start()
        return t

    def shutdown_cleanly(self) -> None:
        self.is_stopping = True
        self.shutdown()
        self.server_close()
