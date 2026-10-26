"""Localhost cockpit for the Product Hunt connector. Stdlib only."""

from __future__ import annotations

import ipaddress
import json
import os
import time
import urllib.parse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Optional

from . import __version__, client, config

PUBLIC_DIR = Path(__file__).resolve().parent.parent.parent / "public"
START_TIME = time.time()
STATS = {"status_fetches": 0, "logins": 0}


def _default_bind_host() -> str:
    for var in ("ZOTH_BIND_HOST",):
        val = os.environ.get(var, "").strip()
        if val == "localhost":
            return "127.0.0.1"
        if val:
            try:
                ipaddress.ip_address(val)
                return val
            except ValueError:
                pass
    return "127.0.0.1"


def _is_local_origin(origin: Optional[str]) -> bool:
    if not origin:
        return True
    try:
        parsed = urllib.parse.urlparse(origin)
    except ValueError:
        return False
    return parsed.scheme in ("http", "https") and parsed.hostname in ("localhost", "127.0.0.1", "::1")


def _safe_rel(raw: str) -> str:
    rel = urllib.parse.unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _status() -> dict:
    STATS["status_fetches"] += 1
    desired = config.load_desired()
    ph = client.ProductHuntClient()
    if not ph.is_configured():
        return {
            "ok": False,
            "configured": False,
            "desired": desired,
            "can_patch_via_api": False,
            "login": "zoth-ph login",
        }
    post = ph.fetch_post(str(desired.get("slug") or "zothos"))
    payload = client.build_status(post, desired)
    config.save_status(payload)
    return payload


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args: Any) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("[zoth-ph] " + (fmt % args) + "\n")

    def _cors(self) -> None:
        origin = self.headers.get("Origin")
        allow = origin if origin and _is_local_origin(origin) else "http://127.0.0.1"
        self.send_header("Access-Control-Allow-Origin", allow)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Cache-Control", "no-store")

    def _json(self, code: int, data: Any) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        if path in ("/health", "/api/health"):
            self._json(HTTPStatus.OK, {
                "status": "healthy",
                "service": "producthunt-connector",
                "port": getattr(self.server, "server_port", 8121),
                "version": __version__,
                "uptime_seconds": round(time.time() - START_TIME, 1),
                "configured": client.ProductHuntClient().is_configured(),
            })
            return
        if path == "/api/stats":
            self._json(HTTPStatus.OK, {
                **STATS,
                "uptime_seconds": round(time.time() - START_TIME, 1),
                "configured": client.ProductHuntClient().is_configured(),
                "website_ok": None,
                "votes": None,
            })
            return
        if path == "/api/status":
            try:
                self._json(HTTPStatus.OK, _status())
            except client.ProductHuntError as err:
                self._json(HTTPStatus.BAD_GATEWAY, {"ok": False, "error": str(err)})
            return
        if path == "/api/badges":
            self._json(HTTPStatus.OK, client.badge_html(config.load_desired()))
            return
        rel = _safe_rel(parsed.path)
        target = PUBLIC_DIR / ("index.html" if rel in ("", "index.html") else rel)
        root = PUBLIC_DIR.resolve()
        try:
            resolved = target.resolve()
            resolved.relative_to(root)
            data = resolved.read_bytes()
        except (OSError, ValueError):
            self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            return
        ctype = "text/html; charset=utf-8"
        if resolved.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif resolved.suffix == ".js":
            ctype = "application/javascript; charset=utf-8"
        elif resolved.suffix == ".svg":
            ctype = "image/svg+xml"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin):
            self._json(HTTPStatus.FORBIDDEN, {"error": "origin blocked"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > 32_000:
            self._json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": "payload too large"})
            return
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(HTTPStatus.BAD_REQUEST, {"error": "invalid json"})
            return
        if path == "/api/login":
            token = str(body.get("developer_token") or "").strip()
            if not token:
                self._json(HTTPStatus.BAD_REQUEST, {"error": "developer_token required"})
                return
            config.save_secret(token)
            STATS["logins"] += 1
            ph = client.ProductHuntClient(token)
            try:
                me = ph.whoami()
            except client.ProductHuntError as err:
                self._json(HTTPStatus.BAD_GATEWAY, {"ok": False, "saved": True, "error": str(err)})
                return
            self._json(HTTPStatus.OK, {"ok": True, "saved": True, "username": me.get("username")})
            return
        self._json(HTTPStatus.NOT_FOUND, {"error": "not found"})


def run_server(host: Optional[str] = None, port: int = 8121) -> None:
    bind = host or _default_bind_host()
    httpd = ThreadingHTTPServer((bind, port), Handler)
    print(f"zoth-ph cockpit http://{bind}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
