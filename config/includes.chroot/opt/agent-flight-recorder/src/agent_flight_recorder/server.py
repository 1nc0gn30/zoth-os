"""
server.py - Interactive Black Box Flight Deck, REST API, and SSE Telemetry Feed.
Listens on port 8104. Serves dark obsidian UI and time-scrubbing forensic endpoints.
Zero external dependencies (Python 3.10+ standard library).
"""

import json
import mimetypes
import os
import queue
import threading
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Optional, Dict, Any, List

from .storage import FlightStorage, GLOBAL_BROADCASTER
from .ingestion import IngestionEngine
from .exporter import generate_single_file_html


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



class ThreadedFlightServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class FlightDeckRequestHandler(BaseHTTPRequestHandler):
    storage: FlightStorage = None
    ingestion: IngestionEngine = None
    public_dir: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "public"))

    def log_message(self, format, *args):
        pass

    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")

    def do_OPTIONS(self):
        self._set_headers(200, "text/plain")
        self.end_headers()

    def do_HEAD(self):
        path = self.path.split("?")[0]
        if path.startswith("/api/"):
            self._set_headers(200, "application/json")
            self.end_headers()
            return
        self._serve_file(path, is_head=True)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/api/health", "/health"):
            data = {"status": "online", "service": "agent-flight-recorder", "port": 8104, "version": "0.1.0"}
            body = json.dumps(data).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path == "/api/stats":
            stats = self.storage.get_db_stats() if self.storage else {}
            body = json.dumps(stats, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path == "/api/sessions":
            sessions = self.storage.get_sessions(limit=50) if self.storage else []
            body = json.dumps({"sessions": sessions}, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path.startswith("/api/session/"):
            sid = path.split("/api/session/")[1]
            session = self.storage.get_session(sid) if self.storage else None
            if not session:
                self._set_headers(404, "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Session not found"}).encode("utf-8"))
                return
            body = json.dumps(session, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path.startswith("/api/timeline/"):
            sid = path.split("/api/timeline/")[1]
            events = self.storage.get_timeline(sid) if self.storage else []
            body = json.dumps({"events": events}, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path.startswith("/api/scrub/"):
            sid = path.split("/api/scrub/")[1]
            offset_str = query.get("offset_ms", [None])[0]
            offset_ms = float(offset_str) if offset_str is not None else None
            forensics = self.storage.get_session_forensics(sid, up_to_offset_ms=offset_ms) if self.storage else {}
            body = json.dumps(forensics, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path.startswith("/api/briefing/"):
            sid = path.split("/api/briefing/")[1]
            session = self.storage.get_session(sid) if self.storage else None
            events = self.storage.get_timeline(sid) if self.storage else []
            
            # Generate Kokoro TTS-ready text briefing
            threat_count = sum(1 for e in events if e["event_type"] == "prompt_scan" and e.get("payload", {}).get("blocked"))
            mock_count = sum(1 for e in events if e["event_type"] == "mock_replay")
            engram_count = sum(1 for e in events if e["event_type"] == "synaptic_engram")
            dur = session.get("duration_seconds", 0.0) if session else 0.0

            briefing_text = (
                f"Flight Incident Briefing for Session {sid}. "
                f"Mission completed in {dur:.2f} seconds with exit code {session.get('exit_code', 0) if session else 0}. "
                f"During flight execution, {threat_count} prompt injection attack vectors were intercepted and neutralized. "
                f"{mock_count} API requests were fulfilled deterministically via Mock Twin with zero token cost. "
                f"{engram_count} synaptic engrams were persisted to Lucy Cognitive Oracle. "
                f"Black box flight telemetry recorded successfully."
            )
            body = json.dumps({
                "session_id": sid,
                "briefing_text": briefing_text,
                "target_voice": "Kokoro-TTS (:9394)",
                "event_stats": {
                    "threats_blocked": threat_count,
                    "mock_replays": mock_count,
                    "engrams": engram_count,
                    "duration_seconds": dur
                }
            }, indent=2).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        elif path == "/api/export/bundle":
            sid = query.get("session_id", [None])[0]
            if not sid:
                # Default to most recent session
                sessions = self.storage.get_sessions(limit=1) if self.storage else []
                if sessions:
                    sid = sessions[0]["session_id"]
            if not sid:
                self._set_headers(400, "text/plain")
                self.end_headers()
                self.wfile.write(b"No sessions available to export.")
                return

            session = self.storage.get_session(sid)
            events = self.storage.get_timeline(sid)
            html = generate_single_file_html(session, events).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="flight-incident-{sid}.html"')
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return

        elif path == "/api/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
            self.end_headers()

            welcome = f"event: connected\ndata: {json.dumps({'status': 'monitoring', 'port': 8104})}\n\n"
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

        # Serve static UI
        self._serve_file(path, is_head=False)

    def do_POST(self):
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        path = self.path.split("?")[0]

        if path == "/api/ingest":
            content_len = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(content_len) if content_len > 0 else b""
            try:
                data = json.loads(raw.decode("utf-8"))
            except Exception:
                data = {}

            sid = data.get("session_id")
            if not sid:
                # Find or create active session
                sessions = self.storage.get_sessions(1) if self.storage else []
                if sessions and sessions[0].get("status") == "recording":
                    sid = sessions[0]["session_id"]
                else:
                    sid = self.storage.create_session(title="Live Ingestion") if self.storage else "flt-auto"

            event_type = data.get("event_type", "custom_event")
            payload = data.get("payload", {})
            severity = data.get("severity", "INFO")
            timestamp = data.get("timestamp")
            offset_ms = data.get("offset_ms")

            event_id = 0
            if self.storage:
                event_id = self.storage.append_event(
                    session_id=sid,
                    event_type=event_type,
                    payload=payload,
                    severity=severity,
                    timestamp=timestamp,
                    offset_ms=offset_ms
                )

            body = json.dumps({"status": "ingested", "event_id": event_id, "session_id": sid}).encode("utf-8")
            self._set_headers(200, "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self._set_headers(404, "application/json")
        body = json.dumps({"error": f"Endpoint not found: {path}"}).encode("utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _serve_file(self, req_path: str, is_head: bool = False):
        if req_path == "/" or not req_path:
            rel_path = "index.html"
        else:
            rel_path = _safe_rel(req_path)
        file_path = os.path.join(self.public_dir, rel_path)
        if not os.path.abspath(file_path).startswith(os.path.abspath(self.public_dir)):
            self._set_headers(403, "text/plain")
            self.end_headers()
            return

        if not os.path.isfile(file_path):
            file_path = os.path.join(self.public_dir, "index.html")

        if os.path.isfile(file_path):
            mime_type, _ = mimetypes.guess_type(file_path)
            content_type = mime_type or "text/plain; charset=utf-8"
            if content_type.startswith("text/"):
                content_type += "; charset=utf-8"

            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                self._set_headers(200, content_type)
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                if not is_head:
                    self.wfile.write(content)
            except Exception as e:
                self._set_headers(500, "text/plain")
                self.end_headers()
                if not is_head:
                    self.wfile.write(f"500 Internal Error: {str(e)}".encode("utf-8"))
        else:
            self._set_headers(404, "text/plain")
            self.end_headers()
            if not is_head:
                self.wfile.write(b"404 Not Found")


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
        self._thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self._thread.start()
        print(f"[*] Flight Deck UI active on http://{self.host}:{self.port}")

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            print("[*] Flight Deck Server stopped.")
