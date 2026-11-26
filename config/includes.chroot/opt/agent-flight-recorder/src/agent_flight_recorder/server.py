"""
server.py - Interactive Black Box Flight Deck, Hardened REST API, and SSE Telemetry Feed.
Listens on 127.0.0.1:8104 by default. Serves Dual-Theme UI and time-scrubbing forensic endpoints.
Zero external dependencies (Python 3.10+ standard library).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import json
import math
import mimetypes
import os
import queue
import re
import threading
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from socketserver import ThreadingMixIn
from typing import Optional, Dict, Any

from . import __version__
from .storage import FlightStorage, GLOBAL_BROADCASTER
from .ingestion import IngestionEngine
from .exporter import (
    generate_single_file_html,
    generate_json_export,
    generate_csv_export,
    generate_markdown_export,
)

MAX_BODY_BYTES = 1_048_576  # 1 MiB cap on POST bodies

_LOCAL_ORIGIN_RE = re.compile(r"^https?://(127\.0\.0\.1|localhost|\[::1\])(?::(\d{1,5}))?$")
_HOST_HEADER_RE = re.compile(r"^(127\.0\.0\.1|localhost|\[::1\])(?::(\d{1,5}))?$", re.IGNORECASE)
_ALLOWED_REMOTE_ORIGINS = frozenset({"https://zoth.nullai.tech"})
_SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' (index) if it
    tries to climb out with '..' or is absolute. Raw request paths are not normalised."""
    rel = urllib.parse.unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _has_traversal(raw: str) -> bool:
    """Detect path traversal attempts in raw or percent-encoded paths."""
    raw_str = str(raw or "")
    decoded_once = urllib.parse.unquote(raw_str)
    decoded_twice = urllib.parse.unquote(decoded_once)
    for candidate in (raw_str, decoded_once, decoded_twice):
        if "\\" in candidate:
            return True
        parts = candidate.split("/")
        if any(p == ".." for p in parts):
            return True
        non_empty = [p for p in parts if p not in ("", ".")]
        if non_empty and ":" in non_empty[0]:
            return True
    return False


def _is_local_origin(origin: Optional[str]) -> bool:
    """Strict browser Origin check.
    No Origin header = non-browser client (CLI/daemon): allowed.
    Otherwise only http(s)://127.0.0.1[:port], localhost[:port], [::1][:port]
    (with valid integer port 1..65535 and zero path/userinfo/query/fragment),
    or https://zoth.nullai.tech are allowed."""
    if not origin:
        return True
    if not isinstance(origin, str):
        return False
    origin_str = origin.strip()
    if origin_str in _ALLOWED_REMOTE_ORIGINS:
        return True
    m = _LOCAL_ORIGIN_RE.match(origin_str)
    if not m:
        return False
    port_str = m.group(2)
    if port_str is not None:
        port = int(port_str)
        if port < 1 or port > 65535:
            return False
    return True


def _is_valid_host(host_header: Optional[str], server_port: Optional[int] = None) -> bool:
    """Validate HTTP Host header against loopback hostnames to defeat DNS rebinding."""
    if not host_header:
        return True
    m = _HOST_HEADER_RE.match(host_header.strip())
    if not m:
        return False
    port_str = m.group(2)
    if port_str is not None:
        port = int(port_str)
        if port < 1 or port > 65535:
            return False
        if server_port is not None and port != server_port:
            return False
    return True


def _sanitize_filename_part(value: str) -> str:
    cleaned = _SAFE_FILENAME_RE.sub("_", str(value or "session")).strip("._")
    return cleaned[:96] or "session"


class ThreadedFlightServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class FlightDeckRequestHandler(BaseHTTPRequestHandler):
    storage: Optional[FlightStorage] = None
    ingestion: Optional[IngestionEngine] = None
    public_dir: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))

    def log_message(self, format, *args):
        pass

    def _bound_port(self) -> int:
        if self.server and getattr(self.server, "server_port", None):
            return int(self.server.server_port)
        return 8104

    def _check_host(self) -> bool:
        host_hdr = self.headers.get("Host")
        if not _is_valid_host(host_hdr, self._bound_port()):
            self._send_json(403, {"error": "Forbidden Host header"}, include_cors=False)
            return False
        return True

    def _check_origin_for_api(self) -> bool:
        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin):
            self._send_json(403, {"error": "cross-origin request blocked"}, include_cors=False)
            return False
        return True

    def _set_common_security_headers(self):
        self.send_header(
            "Content-Security-Policy",
            "frame-ancestors 'self' http://127.0.0.1:* http://localhost:* https://zoth.nullai.tech",
        )
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")

    def _set_api_headers(
        self,
        status: int = 200,
        content_type: str = "application/json",
        include_cors: bool = True,
    ):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Vary", "Origin")
        if include_cors:
            origin = self.headers.get("Origin")
            if origin and _is_local_origin(origin):
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self._set_common_security_headers()

    def _send_json(self, status: int, payload: Any, include_cors: bool = True):
        body = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
        self._set_api_headers(status, "application/json", include_cors=include_cors)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _parse_limit(self, query: Dict[str, list], default: int = 50) -> Optional[int]:
        raw_vals = query.get("limit")
        if not raw_vals:
            return default
        try:
            val = int(raw_vals[0])
        except (TypeError, ValueError):
            self._send_json(400, {"error": "Invalid 'limit' parameter; must be an integer between 1 and 500"})
            return None
        if val < 1 or val > 500:
            self._send_json(400, {"error": "Invalid 'limit' parameter; must be between 1 and 500"})
            return None
        return val

    def _parse_offset_ms(self, raw_val: Any) -> Optional[float]:
        try:
            val = float(raw_val)
        except (TypeError, ValueError):
            return None
        if not math.isfinite(val) or val < 0:
            return None
        return val

    def _read_json_body(self) -> Optional[Dict[str, Any]]:
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            content_len = 0
        else:
            try:
                content_len = int(raw_cl)
            except (TypeError, ValueError):
                self._send_json(400, {"error": "Invalid Content-Length header"})
                return None
            if content_len < 0:
                self._send_json(400, {"error": "Negative Content-Length header"})
                return None
            if content_len > MAX_BODY_BYTES:
                self._send_json(413, {"error": f"Payload too large (max {MAX_BODY_BYTES} bytes)"})
                return None

        raw = self.rfile.read(content_len) if content_len > 0 else b""
        if not raw:
            self._send_json(400, {"error": "Empty JSON body"})
            return None
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            self._send_json(400, {"error": "Malformed JSON request body"})
            return None

        if not isinstance(data, dict):
            self._send_json(400, {"error": "JSON request body must be an object"})
            return None
        return data

    def _handle_export_bundle(self, sid: Optional[str]):
        if not sid:
            sessions = self.storage.get_sessions(limit=1) if self.storage else []
            if sessions:
                sid = sessions[0]["session_id"]
        if not sid:
            self._send_json(404, {"error": "No sessions available to export"})
            return

        session = self.storage.get_session(sid) if self.storage else None
        if not session:
            self._send_json(404, {"error": f"Session not found: {sid}"})
            return

        events = self.storage.get_timeline(sid) if self.storage else []
        verification = self.storage.verify_session_chain(sid) if self.storage else None
        html_bytes = generate_single_file_html(session, events, verification=verification).encode("utf-8")
        safe_name = _sanitize_filename_part(sid)

        self._set_api_headers(200, "text/html; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="flight-incident-{safe_name}.html"')
        self.send_header("Content-Length", str(len(html_bytes)))
        self.end_headers()
        self.wfile.write(html_bytes)

    def _handle_export_format(self, fmt: str, sid: Optional[str]):
        if not sid:
            sessions = self.storage.get_sessions(limit=1) if self.storage else []
            if sessions:
                sid = sessions[0]["session_id"]
        if not sid:
            self._send_json(404, {"error": "No sessions available to export"})
            return

        session = self.storage.get_session(sid) if self.storage else None
        if not session:
            self._send_json(404, {"error": f"Session not found: {sid}"})
            return

        events = self.storage.get_timeline(sid) if self.storage else []
        verification = self.storage.verify_session_chain(sid) if self.storage else None
        safe_name = _sanitize_filename_part(sid)

        if fmt == "json":
            body = generate_json_export(session, events, verification).encode("utf-8")
            self._set_api_headers(200, "application/json; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="flight-incident-{safe_name}.json"')
        elif fmt == "csv":
            body = generate_csv_export(session, events).encode("utf-8")
            self._set_api_headers(200, "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="flight-incident-{safe_name}.csv"')
        elif fmt == "markdown":
            body = generate_markdown_export(session, events, verification).encode("utf-8")
            self._set_api_headers(200, "text/markdown; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="flight-incident-{safe_name}.md"')
        else:
            self._send_json(400, {"error": f"Unsupported export format: {fmt}"})
            return

        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        if not self._check_host():
            return
        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin):
            self._send_json(403, {"error": "cross-origin preflight blocked"}, include_cors=False)
            return
        self._set_api_headers(204, "text/plain", include_cors=True)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self):
        if not self._check_host():
            return
        path = urllib.parse.urlparse(self.path).path
        if path in ("/health", "/api/health") or path.startswith("/api/"):
            if not self._check_origin_for_api():
                return
            self._set_api_headers(200, "application/json")
            self.end_headers()
            return
        self._serve_file(path, is_head=True)

    def do_GET(self):
        if not self._check_host():
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/api/health", "/health"):
            if not self._check_origin_for_api():
                return
            data = {
                "status": "online",
                "service": "agent-flight-recorder",
                "port": self._bound_port(),
                "version": __version__,
            }
            self._send_json(200, data)
            return

        if path.startswith("/api/"):
            if not self._check_origin_for_api():
                return

            if path == "/api/stats":
                stats = self.storage.get_db_stats() if self.storage else {}
                stats["version"] = __version__
                stats["port"] = self._bound_port()
                self._send_json(200, stats)
                return

            if path == "/api/sessions":
                limit = self._parse_limit(query, default=50)
                if limit is None:
                    return
                sessions = self.storage.get_sessions(limit=limit) if self.storage else []
                self._send_json(200, {"sessions": sessions, "limit": limit})
                return

            if path == "/api/events":
                limit = self._parse_limit(query, default=100)
                if limit is None:
                    return
                sid = query.get("session_id", [None])[0]
                etype = query.get("event_type", [None])[0]
                q_str = query.get("q", [None])[0]
                events = (
                    self.storage.get_events(session_id=sid, event_type=etype, q=q_str, limit=limit)
                    if self.storage
                    else []
                )
                self._send_json(200, {"events": events, "count": len(events), "limit": limit})
                return

            if path.startswith("/api/session/"):
                sid = urllib.parse.unquote(path[len("/api/session/") :]).strip()
                session = self.storage.get_session(sid) if self.storage else None
                if not session:
                    self._send_json(404, {"error": "Session not found"})
                    return
                session["hash_chain"] = self.storage.verify_session_chain(sid) if self.storage else None
                self._send_json(200, session)
                return

            if path.startswith("/api/timeline/"):
                sid = urllib.parse.unquote(path[len("/api/timeline/") :]).strip()
                events = self.storage.get_timeline(sid) if self.storage else []
                self._send_json(200, {"session_id": sid, "events": events})
                return

            if path.startswith("/api/verify/"):
                sid = urllib.parse.unquote(path[len("/api/verify/") :]).strip()
                verification = self.storage.verify_session_chain(sid) if self.storage else None
                if verification is None:
                    self._send_json(404, {"error": f"Session not found: {sid}"})
                    return
                self._send_json(200, verification)
                return

            if path.startswith("/api/scrub/"):
                sid = urllib.parse.unquote(path[len("/api/scrub/") :]).strip()
                offset_str = query.get("offset_ms", [None])[0]
                offset_ms: Optional[float] = None
                if offset_str is not None:
                    offset_ms = self._parse_offset_ms(offset_str)
                    if offset_ms is None:
                        self._send_json(
                            400,
                            {"error": "Invalid 'offset_ms' query parameter; must be a non-negative finite number"},
                        )
                        return
                forensics = (
                    self.storage.get_session_forensics(sid, up_to_offset_ms=offset_ms)
                    if self.storage
                    else {}
                )
                self._send_json(200, forensics)
                return

            if path.startswith("/api/briefing/"):
                sid = urllib.parse.unquote(path[len("/api/briefing/") :]).strip()
                session = self.storage.get_session(sid) if self.storage else None
                if not session:
                    self._send_json(404, {"error": f"Session not found: {sid}"})
                    return
                events = self.storage.get_timeline(sid) if self.storage else []
                chain = self.storage.verify_session_chain(sid) if self.storage else None

                threat_count = sum(
                    1
                    for e in events
                    if e["event_type"] == "prompt_scan"
                    and isinstance(e.get("payload"), dict)
                    and (e["payload"].get("blocked") or float(e["payload"].get("score") or 0) >= 0.7)
                )
                mock_count = sum(1 for e in events if e["event_type"] == "mock_replay")
                engram_count = sum(1 for e in events if e["event_type"] == "synaptic_engram")
                capsule_count = sum(1 for e in events if e["event_type"] == "capsule_execution")
                dur = float(session.get("duration_seconds") or 0.0)
                chain_state = "verified intact" if (chain and chain.get("valid")) else "unverified"

                briefing_text = (
                    f"Flight Incident Briefing for Session {sid}. "
                    f"Mission completed in {dur:.2f} seconds with exit code {session.get('exit_code', 0)}. "
                    f"Recorded {len(events)} hash-chained telemetry events (SHA-256 chain {chain_state}). "
                    f"{threat_count} prompt injection attack vectors were intercepted and neutralized. "
                    f"{mock_count} API requests were fulfilled via Mock Twin, "
                    f"{capsule_count} capsule runs were logged, and {engram_count} synaptic engrams were captured."
                )
                self._send_json(
                    200,
                    {
                        "session_id": sid,
                        "briefing_text": briefing_text,
                        "target_voice": "Kokoro-TTS (:9394)",
                        "hash_chain": chain,
                        "event_stats": {
                            "total_events": len(events),
                            "threats_blocked": threat_count,
                            "mock_replays": mock_count,
                            "engrams": engram_count,
                            "capsule_runs": capsule_count,
                            "duration_seconds": dur,
                        },
                    },
                )
                return

            if path == "/api/export/bundle":
                sid = query.get("session_id", [None])[0]
                self._handle_export_bundle(sid)
                return

            if path in ("/api/export/json", "/api/export/csv", "/api/export/markdown"):
                fmt = path.rsplit("/", 1)[1]
                sid = query.get("session_id", [None])[0]
                self._handle_export_format(fmt, sid)
                return

            if path in ("/api/stream", "/api/events/stream"):
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self.send_header("Connection", "keep-alive")
                self.send_header("Vary", "Origin")
                origin = self.headers.get("Origin")
                if origin and _is_local_origin(origin):
                    self.send_header("Access-Control-Allow-Origin", origin)
                self._set_common_security_headers()
                self.end_headers()

                welcome = (
                    f"event: connected\ndata: "
                    f"{json.dumps({'status': 'monitoring', 'port': self._bound_port(), 'version': __version__})}\n\n"
                )
                self.wfile.write(welcome.encode("utf-8"))
                self.wfile.flush()

                sub_queue = GLOBAL_BROADCASTER.subscribe()
                try:
                    while True:
                        try:
                            msg = sub_queue.get(timeout=15.0)
                            self.wfile.write(msg.encode("utf-8"))
                            self.wfile.flush()
                        except queue.Empty:
                            ping = f": heartbeat {int(time.time())}\n\n"
                            self.wfile.write(ping.encode("utf-8"))
                            self.wfile.flush()
                except (BrokenPipeError, ConnectionResetError):
                    pass
                finally:
                    GLOBAL_BROADCASTER.unsubscribe(sub_queue)
                return

            # Unknown /api/* GET route -> 404 JSON (never soft-200 HTML)
            self._send_json(404, {"error": f"Endpoint not found: {path}"})
            return

        # Static UI & assets
        self._serve_file(path, is_head=False)

    def do_POST(self):
        if not self._check_host():
            return
        if not self._check_origin_for_api():
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/ingest":
            data = self._read_json_body()
            if data is None:
                return

            sid = data.get("session_id")
            if sid is not None:
                sid = str(sid).strip()
            if not sid:
                sessions = self.storage.get_sessions(1) if self.storage else []
                if sessions and sessions[0].get("status") == "recording":
                    sid = sessions[0]["session_id"]
                else:
                    sid = self.storage.create_session(title="Live Ingestion") if self.storage else "flt-auto"
            else:
                if self.storage:
                    title = str(data.get("session_title") or data.get("title") or f"Ingested Stream • {sid}")
                    command = str(data.get("command") or "")
                    self.storage.ensure_session(session_id=sid, title=title, command=command)

            event_type = str(data.get("event_type") or "custom_event").strip() or "custom_event"
            payload = data.get("payload", {})
            severity = str(data.get("severity") or "INFO").upper()

            timestamp = data.get("timestamp")
            if timestamp is not None:
                try:
                    timestamp = float(timestamp)
                    if not math.isfinite(timestamp):
                        raise ValueError()
                except (TypeError, ValueError):
                    self._send_json(400, {"error": "Invalid 'timestamp'; must be a finite number"})
                    return

            offset_ms = data.get("offset_ms")
            if offset_ms is not None:
                offset_ms = self._parse_offset_ms(offset_ms)
                if offset_ms is None:
                    self._send_json(400, {"error": "Invalid 'offset_ms'; must be a non-negative finite number"})
                    return

            event_id = 0
            if self.storage:
                event_id = self.storage.append_event(
                    session_id=sid,
                    event_type=event_type,
                    payload=payload,
                    severity=severity,
                    timestamp=timestamp,
                    offset_ms=offset_ms,
                )

            chain = self.storage.verify_session_chain(sid) if self.storage else None
            self._send_json(
                200,
                {
                    "status": "ingested",
                    "event_id": event_id,
                    "session_id": sid,
                    "head_hash": chain["head_hash"] if chain else "",
                    "chain_valid": bool(chain["valid"]) if chain else False,
                },
            )
            return

        if path == "/api/export/bundle":
            sid = query.get("session_id", [None])[0]
            if not sid:
                raw_cl = int(self.headers.get("Content-Length") or 0)
                if raw_cl > 0:
                    data = self._read_json_body()
                    if data is None:
                        return
                    sid = data.get("session_id")
            self._handle_export_bundle(str(sid).strip() if sid else None)
            return

        self._send_json(404, {"error": f"Endpoint not found: {path}"})

    def _serve_file(self, req_path: str, is_head: bool = False):
        if _has_traversal(req_path):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._set_common_security_headers()
            self.send_header("Content-Length", "13")
            self.end_headers()
            if not is_head:
                self.wfile.write(b"403 Forbidden")
            return

        public_root = Path(self.public_dir).resolve()
        if req_path in ("/", "", "/index.html"):
            target = public_root / "index.html"
        else:
            rel_path = _safe_rel(req_path)
            if not rel_path:
                self.send_response(403)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self._set_common_security_headers()
                self.send_header("Content-Length", "13")
                self.end_headers()
                if not is_head:
                    self.wfile.write(b"403 Forbidden")
                return
            target = (public_root / rel_path).resolve()

        if not target.is_relative_to(public_root):
            self.send_response(403)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._set_common_security_headers()
            self.send_header("Content-Length", "13")
            self.end_headers()
            if not is_head:
                self.wfile.write(b"403 Forbidden")
            return

        if not target.is_file():
            self.send_response(404)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._set_common_security_headers()
            self.send_header("Content-Length", "13")
            self.end_headers()
            if not is_head:
                self.wfile.write(b"404 Not Found")
            return

        mime_type, _ = mimetypes.guess_type(str(target))
        content_type = mime_type or "application/octet-stream"
        if content_type.startswith("text/") and "charset=" not in content_type:
            content_type += "; charset=utf-8"

        try:
            content = target.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self._set_common_security_headers()
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            if not is_head:
                self.wfile.write(content)
        except Exception:
            err = b"500 Internal Server Error"
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self._set_common_security_headers()
            self.send_header("Content-Length", str(len(err)))
            self.end_headers()
            if not is_head:
                self.wfile.write(err)


class FlightDeckServer:
    def __init__(self, host: str = "127.0.0.1", port: int = 8104, storage: Optional[FlightStorage] = None):
        self.host = host
        self.port = port
        self.storage = storage or FlightStorage()
        self.ingestion = IngestionEngine(self.storage)
        self.server: Optional[ThreadedFlightServer] = None
        self._thread: Optional[threading.Thread] = None

    def start(self):
        FlightDeckRequestHandler.storage = self.storage
        FlightDeckRequestHandler.ingestion = self.ingestion
        self.server = ThreadedFlightServer((self.host, self.port), FlightDeckRequestHandler)
        self.port = self.server.server_port
        self._thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self._thread.start()
        print(f"[*] Flight Deck UI active on http://{self.host}:{self.port}")

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            print("[*] Flight Deck Server stopped.")
