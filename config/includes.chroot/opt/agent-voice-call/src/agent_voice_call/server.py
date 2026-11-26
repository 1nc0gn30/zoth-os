"""HTTP Server & Voice Call REST Gateway.

100% Python Standard Library — Zero External Dependencies.
Serves the dual-theme Live Call Cockpit and hardened REST APIs on 127.0.0.1:8114.
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

from __future__ import annotations

import base64
import http.server
import json
import logging
import mimetypes
import os
import socketserver
import urllib.parse
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from . import __version__
from .call_engine import CallManager, SessionLimitError
from .tts_bridge import (
    VOICES,
    get_tts_status,
    is_kokoro_online,
    synthesize_speech_wav_with_engine,
)

logger = logging.getLogger("agent_voice_call.server")

PUBLIC_DIR = Path(__file__).resolve().parent.parent.parent / "public"
MAX_BODY_BYTES = 1_048_576  # 1 MiB strict request body cap
ALLOWED_LOOPBACK_HOSTS = ("localhost", "127.0.0.1", "::1")


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' if traversal or absolute."""
    rel = urllib.parse.unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _is_traversal_probe(raw: str) -> bool:
    """Detect explicit path traversal attempts before normalization."""
    decoded = urllib.parse.unquote(str(raw or "")).replace("\\", "/")
    parts = [p for p in decoded.split("/") if p not in ("", ".")]
    return any(p == ".." for p in parts) or (bool(parts) and ":" in parts[0])


def _is_local_origin(origin: Optional[str]) -> bool:
    """Strict browser Origin check against loopback hosts only.

    - Missing/empty Origin -> allowed (non-browser CLI/agent client).
    - Present Origin -> must be http(s)://(localhost|127.0.0.1|[::1])[:valid_port],
      no userinfo, no path/query/fragment, and exact reconstructed netloc.
      Closes port-suffix bypasses like http://127.0.0.1:8114.example.invalid.
    """
    if not origin:
        return True
    if not isinstance(origin, str):
        return False
    origin_str = origin.strip()
    if not origin_str or origin_str.lower() == "null":
        return False
    try:
        u = urllib.parse.urlparse(origin_str)
        if u.scheme not in ("http", "https"):
            return False
        if u.username is not None or u.password is not None:
            return False
        if u.path not in ("", "/") or u.params or u.query or u.fragment:
            return False
        if u.hostname not in ALLOWED_LOOPBACK_HOSTS:
            return False
        port = u.port  # Raises ValueError on malformed ports like '8114.example.invalid'
        if port is not None and not (1 <= port <= 65535):
            return False
        host_repr = "[::1]" if u.hostname == "::1" else u.hostname
        expected_netloc = f"{host_repr}:{port}" if port is not None else host_repr
        return u.netloc.lower() == expected_netloc
    except ValueError:
        return False


def _is_local_host(host_header: Optional[str]) -> bool:
    """Strict loopback Host header allowlist to prevent DNS rebinding attacks."""
    if not host_header:
        return True
    host_str = host_header.strip()
    if not host_str or "/" in host_str or "@" in host_str or " " in host_str:
        return False
    try:
        u = urllib.parse.urlparse(f"http://{host_str}")
        if u.username is not None or u.password is not None:
            return False
        if u.hostname not in ALLOWED_LOOPBACK_HOSTS:
            return False
        port = u.port  # Raises ValueError if port is non-numeric
        if port is not None and not (1 <= port <= 65535):
            return False
        host_repr = "[::1]" if u.hostname == "::1" else u.hostname
        expected_netloc = f"{host_repr}:{port}" if port is not None else host_repr
        return u.netloc.lower() == expected_netloc
    except ValueError:
        return False


class VoiceCallHandler(http.server.BaseHTTPRequestHandler):
    """Processes live call audio turns, token validation, and web cockpit requests."""

    server: VoiceCallServer

    def log_message(self, format: str, *args: Any) -> None:
        pass  # Quiet logs

    def _emit_cors_headers(self) -> None:
        """Emit Vary: Origin always, and Access-Control-Allow-Origin ONLY for verified local origins."""
        self.send_header("Vary", "Origin")
        origin = self.headers.get("Origin")
        if origin and _is_local_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)

    def _emit_security_headers(self, is_html: bool = False) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        if is_html:
            self.send_header(
                "Content-Security-Policy",
                "frame-ancestors 'self' http://127.0.0.1:* http://localhost:* http://[::1]:* https://zoth.nullai.tech",
            )

    def _check_host_and_origin(self, require_local_origin: bool = True, head_only: bool = False) -> bool:
        """Enforce loopback Host allowlist and strict Origin check. Returns True if allowed."""
        if not _is_local_host(self.headers.get("Host")):
            self._send_json({"error": "invalid_host_header"}, code=403, head_only=head_only)
            return False
        if require_local_origin and not _is_local_origin(self.headers.get("Origin")):
            self._send_json({"error": "cross_origin_blocked"}, code=403, head_only=head_only)
            return False
        return True

    def _method_not_allowed(self) -> None:
        if not self._check_host_and_origin(require_local_origin=True):
            return
        body = json.dumps(
            {"error": "method_not_allowed", "allowed": ["GET", "POST", "HEAD", "OPTIONS"]},
            indent=2,
        ).encode("utf-8")
        self.send_response(405)
        self.send_header("Allow", "GET, POST, HEAD, OPTIONS")
        self.send_header("Content-Type", "application/json")
        self._emit_cors_headers()
        self._emit_security_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self) -> None:
        self._method_not_allowed()

    def do_DELETE(self) -> None:
        self._method_not_allowed()

    def do_PATCH(self) -> None:
        self._method_not_allowed()

    def do_OPTIONS(self) -> None:
        if not self._check_host_and_origin(require_local_origin=True):
            return
        self.send_response(204)
        self._emit_cors_headers()
        self._emit_security_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Call-Token")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_get(head_only=True)

    def do_GET(self) -> None:
        self._handle_get(head_only=False)

    def _handle_get(self, head_only: bool = False) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Always enforce Host allowlist; enforce Origin allowlist on API & status endpoints
        is_api = path.startswith("/api/") or path in ("/health", "/status")
        if not self._check_host_and_origin(require_local_origin=is_api, head_only=head_only):
            return

        # 1. Health Endpoint
        if path in ("/health", "/status", "/api/stats"):
            tts_info = get_tts_status()
            self._send_json({
                "status": "healthy",
                "service": "agent-voice-call",
                "version": __version__,
                "port": self.server.server_port,
                "active_sessions": self.server.manager.active_session_count(),
                "max_sessions": self.server.manager.max_sessions,
                "debrief_count": len(self.server.manager.list_debriefs(limit=100)),
                "kokoro_online": tts_info["kokoro_online"],
                "tts_engine": tts_info["tts_engine"],
                "local_first_tts": tts_info["local_first_tts"],
                "cloud_tts_opt_in": tts_info["cloud_tts_opt_in"],
                "espeak_available": tts_info["espeak_available"],
                "piper_available": tts_info["piper_available"],
                "available_voices": list(VOICES.keys()),
            }, head_only=head_only)
            return

        # 2. Session Validation Endpoint (READ-ONLY: never mutates or mints sessions!)
        if path == "/api/call/session":
            token = query.get("token", [""])[0].strip()
            if not token:
                self._send_json({"error": "token_required", "hint": "POST /api/call/create to mint a session"}, code=401, head_only=head_only)
                return
            session = self.server.manager.validate_token(token)
            if not session:
                self._send_json({"error": "invalid_or_expired_token"}, code=404, head_only=head_only)
                return
            self._send_json({
                "session_id": session.session_id,
                "token": session.token,
                "voice": session.voice,
                "channel": session.channel,
                "status": session.status,
                "turn_count": len(session.turns),
            }, head_only=head_only)
            return

        # 3. Persisted Call Debrief History
        if path == "/api/call/history":
            limit_raw = query.get("limit", ["20"])[0]
            try:
                limit = max(1, min(100, int(limit_raw)))
            except ValueError:
                self._send_json({"error": "invalid_limit"}, code=400, head_only=head_only)
                return
            debriefs = self.server.manager.list_debriefs(limit=limit)
            self._send_json({
                "debriefs": debriefs,
                "count": len(debriefs),
            }, head_only=head_only)
            return

        # 4. Welcome / Audio Test Greeting Endpoint
        if path == "/api/call/welcome":
            voice = query.get("voice", ["azoth"])[0].strip().lower()
            if voice not in VOICES:
                self._send_json({"error": "unknown_voice", "available_voices": list(VOICES.keys())}, code=400, head_only=head_only)
                return
            v_info = VOICES[voice]
            v_name = v_info["label"]
            text = f"Live on the line. {v_name} is listening."
            audio_wav, tts_engine = synthesize_speech_wav_with_engine(text, voice_name=voice)
            audio_b64 = base64.b64encode(audio_wav).decode("ascii") if audio_wav else None
            self._send_json({
                "text": text,
                "voice": voice,
                "tts_engine": tts_engine,
                "audio_base64": audio_b64,
                "audio_mime": "audio/wav",
            }, head_only=head_only)
            return

        # 5. Available Voices Directory
        if path == "/api/voices":
            self._send_json({"voices": VOICES, "tts": get_tts_status()}, head_only=head_only)
            return

        # 6. Live Call Cockpit HTML
        if path in ("/", "/call", "/index.html"):
            index_file = PUBLIC_DIR / "index.html"
            if index_file.exists():
                self._serve_file(index_file, "text/html; charset=utf-8", head_only=head_only, is_html=True)
                return

        # 7. Static Assets with strict traversal & symlink containment
        if _is_traversal_probe(path):
            self._send_json({"error": "forbidden"}, code=403, head_only=head_only)
            return

        safe_path = _safe_rel(path)
        if not safe_path:
            self._send_json({"error": "not_found"}, code=404, head_only=head_only)
            return

        public_root = PUBLIC_DIR.resolve()
        candidate = PUBLIC_DIR / safe_path
        try:
            resolved = candidate.resolve(strict=True)
        except OSError:
            self._send_json({"error": "not_found"}, code=404, head_only=head_only)
            return

        if not resolved.is_relative_to(public_root) or not resolved.is_file():
            self._send_json({"error": "forbidden"}, code=403, head_only=head_only)
            return

        mime, _ = mimetypes.guess_type(str(resolved))
        self._serve_file(
            resolved,
            mime or "application/octet-stream",
            head_only=head_only,
            is_html=(mime == "text/html"),
        )

    def _read_json_object_body(self) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, Dict[str, Any]]]]:
        """Parse and validate Content-Length, 1 MiB body limit, and strict JSON object."""
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            return {}, None

        raw_cl_stripped = raw_cl.strip()
        if not raw_cl_stripped.isdigit():
            return None, (400, {"error": "invalid_content_length"})

        content_length = int(raw_cl_stripped)
        if content_length > MAX_BODY_BYTES:
            return None, (413, {"error": "payload_too_large", "max_bytes": MAX_BODY_BYTES})

        if content_length == 0:
            return {}, None

        body_bytes = self.rfile.read(content_length)
        try:
            parsed = json.loads(body_bytes.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None, (400, {"error": "invalid_json"})

        if not isinstance(parsed, dict):
            return None, (400, {"error": "json_object_required"})

        return parsed, None

    def do_POST(self) -> None:
        if not self._check_host_and_origin(require_local_origin=True):
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path not in ("/api/call/create", "/api/call/speak", "/api/call/end"):
            self._send_json({"error": "not_found"}, code=404)
            return

        payload, err = self._read_json_object_body()
        if err is not None:
            self._send_json(err[1], code=err[0])
            return
        assert payload is not None

        # 1. Create Call Session Token
        if path == "/api/call/create":
            channel = payload.get("channel", "web")
            voice = payload.get("voice", "azoth")
            if not isinstance(channel, str) or not isinstance(voice, str):
                self._send_json({"error": "invalid_field_type", "detail": "channel and voice must be strings"}, code=400)
                return

            norm_voice = voice.strip().lower() or "azoth"
            if norm_voice not in VOICES:
                self._send_json({"error": "unknown_voice", "available_voices": list(VOICES.keys())}, code=400)
                return

            try:
                session_id, token = self.server.manager.create_call_token(
                    channel=channel.strip().lower() or "web",
                    voice=norm_voice,
                )
            except SessionLimitError as exc:
                self._send_json({"error": "session_limit_reached", "detail": str(exc)}, code=429)
                return

            local_url = f"http://127.0.0.1:{self.server.server_port}/call?token={token}"
            tailscale_domain = os.environ.get("ZOTH_TAILSCALE_DOMAIN", "").strip()
            call_url = f"https://{tailscale_domain}/call?token={token}" if tailscale_domain else local_url

            self._send_json({
                "status": "created",
                "session_id": session_id,
                "token": token,
                "call_url": call_url,
                "local_url": local_url,
                "voice": norm_voice,
            })
            return

        # 2. Process Spoken Utterance (strictly requires valid active session token)
        if path == "/api/call/speak":
            raw_token = payload.get("token") if "token" in payload else self.headers.get("X-Call-Token")
            raw_text = payload.get("text", "")
            raw_voice = payload.get("voice", "")

            if raw_token is not None and not isinstance(raw_token, str):
                self._send_json({"error": "invalid_field_type", "detail": "token must be a string"}, code=400)
                return
            if not isinstance(raw_text, str):
                self._send_json({"error": "invalid_field_type", "detail": "text must be a string"}, code=400)
                return
            if raw_voice is not None and not isinstance(raw_voice, str):
                self._send_json({"error": "invalid_field_type", "detail": "voice must be a string"}, code=400)
                return

            token = (raw_token or "").strip()
            if not token:
                self._send_json({"error": "token_required"}, code=401)
                return

            session = self.server.manager.validate_token(token)
            if not session:
                self._send_json({"error": "invalid_or_expired_token"}, code=401)
                return

            requested_voice = (raw_voice or "").strip().lower()
            if requested_voice:
                if requested_voice not in VOICES:
                    self._send_json({"error": "unknown_voice", "available_voices": list(VOICES.keys())}, code=400)
                    return
                session.voice = requested_voice

            user_text = raw_text.strip()
            if not user_text:
                self._send_json({"error": "text_required"}, code=400)
                return

            reply_text, audio_wav, latency_ms = self.server.manager.process_utterance(session, user_text)
            audio_b64 = base64.b64encode(audio_wav).decode("ascii") if audio_wav else None
            tts_engine = session.metadata.get("last_tts_engine", "local")

            self._send_json({
                "session_id": session.session_id,
                "user_text": user_text,
                "reply_text": reply_text,
                "latency_ms": latency_ms,
                "voice": session.voice,
                "tts_engine": tts_engine,
                "audio_base64": audio_b64,
                "audio_mime": "audio/wav",
            })
            return

        # 3. End Call Session
        if path == "/api/call/end":
            raw_token = payload.get("token") if "token" in payload else self.headers.get("X-Call-Token")
            if raw_token is not None and not isinstance(raw_token, str):
                self._send_json({"error": "invalid_field_type", "detail": "token must be a string"}, code=400)
                return
            token = (raw_token or "").strip()
            if not token:
                self._send_json({"error": "token_required"}, code=401)
                return

            session = self.server.manager.validate_token(token)
            if not session:
                self._send_json({"error": "invalid_or_expired_token"}, code=401)
                return

            summary = self.server.manager.end_call_session(session)
            self._send_json({
                "status": "ended",
                "summary": summary,
            })
            return

    def _send_json(self, data: Dict[str, Any], code: int = 200, head_only: bool = False) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._emit_cors_headers()
        self._emit_security_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _serve_file(self, path: Path, mime: str, head_only: bool = False, is_html: bool = False) -> None:
        try:
            with open(path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self._emit_cors_headers()
            self._emit_security_headers(is_html=is_html)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            if not head_only:
                self.wfile.write(content)
        except Exception as e:
            self._send_json({"error": f"Failed reading file: {e}"}, code=500, head_only=head_only)


class VoiceCallServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """Threaded HTTP Server for live call station."""

    daemon_threads = True
    allow_reuse_address = True

    def __init__(self, host: str, port: int, manager: CallManager):
        self.manager = manager
        super().__init__((host, port), VoiceCallHandler)
