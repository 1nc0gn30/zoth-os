"""HTTP Server & REST Cockpit for Agent Policy Auditor (Port 8106).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Pip Dependencies.
"""

from __future__ import annotations

import json
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from agent_policy_auditor import __version__
from agent_policy_auditor.auditor import ManifestAuditor
from agent_policy_auditor.broker import PolicyBroker

MAX_BODY_BYTES = 1_048_576  # 1 MiB strict POST body cap

_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})


def _has_traversal(raw: str) -> bool:
    """Detect path traversal probes (raw or percent-encoded '..', backslashes, or drive letters)."""
    if not raw:
        return False
    text = str(raw)
    decoded = urllib.parse.unquote(text)
    decoded_twice = urllib.parse.unquote(decoded)
    for candidate in (text, decoded, decoded_twice):
        if "\x00" in candidate or "\\" in candidate:
            return True
        stripped = candidate.lstrip("/")
        parts = [p for p in stripped.split("/") if p != ""]
        if any(p == ".." for p in parts):
            return True
        if parts and ":" in parts[0]:
            return True
    return False


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' (index) if it
    tries to climb out with '..' or is absolute."""
    rel = urllib.parse.unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _is_local_origin(origin: Optional[str]) -> bool:
    """Strict browser Origin guard against CSRF and port-suffix bypasses.
    Absent/empty Origin = non-browser local client (CLI/agent): allowed.
    Otherwise strictly http(s)://(localhost|127.0.0.1|[::1])(:numeric_port)? with no userinfo/path/suffix."""
    if origin is None or origin == "":
        return True
    raw = str(origin).strip()
    if not raw or any(c in raw for c in ("\r", "\n", " ", "\t")):
        return False
    try:
        u = urllib.parse.urlparse(raw)
    except ValueError:
        return False
    if u.scheme not in ("http", "https"):
        return False
    if u.username is not None or u.password is not None:
        return False
    if u.path not in ("", "/") or u.params or u.query or u.fragment:
        return False
    host = u.hostname
    if host not in _LOCAL_HOSTS:
        return False
    try:
        port = u.port  # Raises ValueError on suffixes like 8106.example.invalid
    except ValueError:
        return False
    if port is not None and not (1 <= port <= 65535):
        return False
    host_part = f"[{host}]" if host == "::1" else host
    expected_netloc = f"{host_part}:{port}" if port is not None else host_part
    return u.netloc.lower() == expected_netloc.lower()


def _is_local_host(host_header: Optional[str]) -> bool:
    """Strict Host header allowlist against DNS rebinding."""
    if not host_header:
        return True
    raw = str(host_header).strip()
    if not raw or any(c in raw for c in ("\r", "\n", " ", "\t", "@", "/")):
        return False
    try:
        u = urllib.parse.urlparse(f"http://{raw}")
        host = u.hostname
        port = u.port
    except ValueError:
        return False
    if host not in _LOCAL_HOSTS:
        return False
    if port is not None and not (1 <= port <= 65535):
        return False
    host_part = f"[{host}]" if host == "::1" else host
    expected_netloc = f"{host_part}:{port}" if port is not None else host_part
    return u.netloc.lower() == expected_netloc.lower()


def _allowed_cors_origin(handler: BaseHTTPRequestHandler) -> Optional[str]:
    origin = handler.headers.get("Origin")
    if origin and _is_local_origin(origin):
        return origin.strip()
    return None


STATIC_DIR = Path(__file__).resolve().parent.parent.parent / "public"

_MIME_MAP = {
    ".html": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".xml": "application/xml; charset=utf-8",
}


class PolicyCockpitServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def __init__(
        self,
        server_address: Tuple[str, int],
        handler_class: type[BaseHTTPRequestHandler],
        broker: Optional[PolicyBroker] = None,
        auditor: Optional[ManifestAuditor] = None,
    ) -> None:
        super().__init__(server_address, handler_class)
        self.broker = broker if broker is not None else PolicyBroker()
        self.auditor = auditor if auditor is not None else ManifestAuditor()
        self.start_time = time.time()


class CockpitHandler(BaseHTTPRequestHandler):
    broker: Optional[PolicyBroker] = None
    auditor: Optional[ManifestAuditor] = None
    start_time: float = time.time()

    def _get_broker(self) -> PolicyBroker:
        srv_broker = getattr(self.server, "broker", None)
        if srv_broker is not None:
            return srv_broker
        if CockpitHandler.broker is None:
            CockpitHandler.broker = PolicyBroker()
        return CockpitHandler.broker

    def _get_auditor(self) -> ManifestAuditor:
        srv_auditor = getattr(self.server, "auditor", None)
        if srv_auditor is not None:
            return srv_auditor
        if CockpitHandler.auditor is None:
            CockpitHandler.auditor = ManifestAuditor()
        return CockpitHandler.auditor

    def _get_start_time(self) -> float:
        return float(getattr(self.server, "start_time", CockpitHandler.start_time))

    def log_message(self, format: str, *args: Any) -> None:
        pass  # Suppress noisy default HTTP logs

    def _send_security_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Vary", "Origin")

    def _send_json(self, data: Any, status: int = 200, include_cors: bool = True) -> None:
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_security_headers()
        if include_cors:
            allowed_origin = _allowed_cors_origin(self)
            if allowed_origin:
                self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _guard_host(self) -> bool:
        if not _is_local_host(self.headers.get("Host")):
            self._send_json({"error": "host header not permitted"}, status=403, include_cors=False)
            return False
        return True

    def _guard_origin(self) -> bool:
        origin = self.headers.get("Origin")
        if origin is not None and not _is_local_origin(origin):
            self._send_json({"error": "cross-origin request blocked"}, status=403, include_cors=False)
            return False
        return True

    def _read_json_body(self) -> Optional[Dict[str, Any]]:
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            length = 0
        else:
            try:
                length = int(str(raw_cl).strip())
            except ValueError:
                self._send_json({"error": "invalid Content-Length header"}, status=400)
                return None
            if length < 0:
                self._send_json({"error": "invalid Content-Length header"}, status=400)
                return None

        if length > MAX_BODY_BYTES:
            self._send_json(
                {"error": "payload too large", "max_bytes": MAX_BODY_BYTES},
                status=413,
            )
            return None

        raw_body = self.rfile.read(length) if length > 0 else b""
        if not raw_body:
            return {}

        try:
            decoded = raw_body.decode("utf-8")
            parsed = json.loads(decoded)
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json({"error": "malformed JSON payload"}, status=400)
            return None

        if not isinstance(parsed, dict):
            self._send_json({"error": "JSON payload must be an object"}, status=400)
            return None
        return parsed

    def do_OPTIONS(self) -> None:
        if not self._guard_host():
            return
        origin = self.headers.get("Origin")
        if origin is not None and not _is_local_origin(origin):
            self._send_json({"error": "cross-origin preflight blocked"}, status=403, include_cors=False)
            return
        self.send_response(204)
        self._send_security_headers()
        allowed_origin = _allowed_cors_origin(self)
        if allowed_origin:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self) -> None:
        if not self._guard_host():
            return

        url = urllib.parse.urlparse(self.path)
        path = url.path

        # API & Health Routes enforce strict Origin guard too
        if path.startswith("/api/") or path in ("/api", "/health"):
            if not self._guard_origin():
                return

            broker = self._get_broker()
            port = getattr(self.server, "server_port", 8106)

            if path in ("/api/health", "/health"):
                self._send_json({
                    "status": "ok",
                    "service": "agent-policy-auditor",
                    "version": __version__,
                    "port": port,
                })
                return

            if path == "/api/status":
                stats = broker.get_stats()
                self._send_json({
                    "status": "ok",
                    "service": "agent-policy-auditor",
                    "version": __version__,
                    "port": port,
                    "uptime_seconds": round(time.time() - self._get_start_time(), 1),
                    "key_fingerprint": broker.get_key_fingerprint(),
                    "stats": stats,
                })
                return

            if path == "/api/stats":
                stats = broker.get_stats()
                stats["uptime_seconds"] = round(time.time() - self._get_start_time(), 1)
                stats["version"] = __version__
                stats["key_fingerprint"] = broker.get_key_fingerprint()
                self._send_json(stats)
                return

            if path == "/api/leases":
                leases = broker.get_active_leases()
                self._send_json({
                    "leases": leases,
                    "count": len(leases),
                    "key_fingerprint": broker.get_key_fingerprint(),
                })
                return

            if path == "/api/audit/events":
                qs = urllib.parse.parse_qs(url.query)
                raw_limit = (qs.get("limit") or ["50"])[0]
                try:
                    limit = max(1, min(int(raw_limit), 200))
                except ValueError:
                    self._send_json({"error": "invalid limit query parameter"}, status=400)
                    return
                events = broker.get_audit_events(limit=limit)
                self._send_json({"events": events, "count": len(events)})
                return

            self._send_json({"error": "endpoint not found", "path": path}, status=404)
            return

        # Reject path traversal probes with 403 JSON (never soft-200 SPA fallback)
        if _has_traversal(path):
            self._send_json({"error": "path traversal blocked"}, status=403)
            return

        # Serve Static Files
        clean_path = _safe_rel(path)
        if not clean_path:
            clean_path = "index.html"
        static_root = STATIC_DIR.resolve()
        target_file = (static_root / clean_path).resolve()

        if not target_file.is_relative_to(static_root):
            self._send_json({"error": "forbidden"}, status=403)
            return

        if target_file.is_file():
            mime = _MIME_MAP.get(target_file.suffix.lower(), "application/octet-stream")
            content = target_file.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self._send_security_headers()
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        self._send_json({"error": "not found", "path": path}, status=404)

    def do_POST(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return

        url = urllib.parse.urlparse(self.path)
        path = url.path

        if path not in (
            "/api/leases/grant",
            "/api/leases/verify",
            "/api/leases/revoke",
            "/api/leases/revoke_all",
            "/api/audit",
        ):
            self._send_json({"error": "endpoint not found", "path": path}, status=404)
            return

        body = self._read_json_body()
        if body is None:
            return

        broker = self._get_broker()
        auditor = self._get_auditor()

        if path == "/api/leases/grant":
            if not body:
                self._send_json(
                    {"error": "request body required with agent_id, capability, and target"},
                    status=400,
                )
                return
            agent_id = body.get("agent_id")
            capability = body.get("capability")
            target = body.get("target")
            duration_sec = body.get("duration_sec", 300.0)
            budget_usd = body.get("budget_usd", body.get("max_budget_usd", 0.0))

            try:
                lease = broker.grant_lease(
                    agent_id=agent_id,
                    capability=capability,
                    target=target,
                    duration_sec=duration_sec,
                    max_budget_usd=budget_usd,
                )
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=400)
                return

            self._notify_flight_recorder(
                "LEASE_GRANTED",
                f"Granted {lease.capability} to {lease.agent_id} for target {lease.target}",
            )
            self._send_json({"status": "granted", "lease": lease.to_dict()})
            return

        if path == "/api/leases/verify":
            lease_id = body.get("lease_id")
            capability = body.get("capability")
            target = body.get("target")
            cost_usd = body.get("cost_usd", 0.0)

            try:
                allowed, reason = broker.verify_action(
                    lease_id=lease_id,
                    capability=capability,
                    target=target,
                    cost_usd=cost_usd,
                )
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=400)
                return

            if not allowed:
                self._notify_flight_recorder(
                    "LEASE_VIOLATION",
                    f"Blocked unauthorized {capability} on {target}: {reason}",
                )

            lease_info = broker.get_lease(str(lease_id).strip()) if isinstance(lease_id, str) else None
            resp: Dict[str, Any] = {"allowed": allowed, "reason": reason}
            if lease_info:
                resp["used_budget_usd"] = lease_info["used_budget_usd"]
                resp["max_budget_usd"] = lease_info["max_budget_usd"]
                resp["remaining_budget_usd"] = round(
                    max(0.0, lease_info["max_budget_usd"] - lease_info["used_budget_usd"]),
                    6,
                )
                resp["ttl_seconds"] = round(lease_info["ttl_seconds"], 1)
            self._send_json(resp)
            return

        if path == "/api/leases/revoke":
            lease_id = body.get("lease_id")
            if not isinstance(lease_id, str) or not lease_id.strip():
                self._send_json({"error": "lease_id must be a non-empty string"}, status=400)
                return
            clean_id = lease_id.strip()
            success = broker.revoke_lease(clean_id)
            if success:
                self._notify_flight_recorder("LEASE_REVOKED", f"Revoked lease {clean_id}")
            self._send_json({"revoked": success, "lease_id": clean_id})
            return

        if path == "/api/leases/revoke_all":
            all_agents = bool(body.get("all_agents", False))
            agent_id = body.get("agent_id", "")
            if agent_id is not None and not isinstance(agent_id, str):
                self._send_json({"error": "agent_id must be a string"}, status=400)
                return
            clean_agent = (agent_id or "").strip()

            if all_agents or not clean_agent:
                count = broker.revoke_all_leases()
                self._notify_flight_recorder(
                    "EMERGENCY_KILLSWITCH",
                    f"Global kill-switch revoked all {count} active leases",
                )
                self._send_json({"revoked_count": count, "scope": "all_agents", "all_agents": True})
            else:
                count = broker.revoke_all_for_agent(clean_agent)
                self._notify_flight_recorder(
                    "EMERGENCY_KILLSWITCH",
                    f"Revoked all {count} leases for agent {clean_agent}",
                )
                self._send_json({"revoked_count": count, "scope": clean_agent, "agent_id": clean_agent})
            return

        if path == "/api/audit":
            if not body:
                self._send_json({"error": "manifest payload is required"}, status=400)
                return
            manifest = body.get("manifest", body)
            name = body.get("name", "agent_manifest")
            if not isinstance(name, str):
                self._send_json({"error": "name must be a string"}, status=400)
                return
            report = auditor.audit_manifest(manifest, name=name)
            broker.record_event(
                "MANIFEST_AUDIT",
                name,
                "",
                "AUDIT",
                name,
                report.risk_level in ("SAFE", "LOW"),
                f"score={report.security_score}/100 risk={report.risk_level} findings={report.total_findings}",
            )
            self._send_json(report.to_dict())
            return

    def _method_not_allowed(self) -> None:
        if not self._guard_host():
            return
        if not self._guard_origin():
            return
        self._send_json({"error": "method not allowed"}, status=405)

    do_PUT = _method_not_allowed
    do_DELETE = _method_not_allowed
    do_PATCH = _method_not_allowed
    do_TRACE = _method_not_allowed

    def _notify_flight_recorder(self, event_type: str, message: str) -> None:
        """Forward policy events into Agent Flight Recorder on port 8104 asynchronously."""
        payload = json.dumps({
            "source": "agent-policy-auditor",
            "type": event_type,
            "message": message,
            "timestamp_ms": int(time.time() * 1000),
        }).encode("utf-8")

        def _send() -> None:
            try:
                req = urllib.request.Request(
                    "http://127.0.0.1:8104/api/ingest",
                    data=payload,
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(req, timeout=0.35):
                    pass
            except Exception:
                pass

        threading.Thread(target=_send, daemon=True).start()


def create_server(
    port: int = 8106,
    host: str = "127.0.0.1",
    broker: Optional[PolicyBroker] = None,
    auditor: Optional[ManifestAuditor] = None,
) -> PolicyCockpitServer:
    return PolicyCockpitServer((host, port), CockpitHandler, broker=broker, auditor=auditor)


def serve(port: int = 8106, host: str = "127.0.0.1") -> None:
    server = create_server(port=port, host=host)
    print(f"⚡ [AGENT POLICY AUDITOR v{__version__}] Cockpit & Lease Broker running on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Agent Policy Auditor...")
        server.server_close()
