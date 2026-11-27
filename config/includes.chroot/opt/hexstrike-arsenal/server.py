#!/usr/bin/env python3
"""
HexStrike Security Arsenal (v3.2.0) — Hardened Standalone Loopback Web & REST Server.
Listens on http://127.0.0.1:8138 by default.
"""

from __future__ import annotations

import argparse
import http.server
import json
import mimetypes
import os
import re
import socketserver
import sys
import urllib.parse
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = (ROOT_DIR / "public").resolve()
sys.path.insert(0, str(ROOT_DIR))

from mcp_server import (
    VERSION,
    audit_http_headers,
    audit_local_repo,
    compute_shannon_entropy,
    get_tool_command,
    load_tools_catalog,
    mcp_tool_definitions,
    run_socket_port_scan,
)

MAX_POST_BYTES = 65536
LOOPBACK_ORIGIN_RE = re.compile(r"^https?://(127\.0\.0\.1|localhost|\[::1\])(:\d{1,5})?$")
CSP_HEADER = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "connect-src 'self' http://127.0.0.1:* http://localhost:*; "
    "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*"
)

CVE_DATABASE = [
    {
        "id": "CVE-2024-6387",
        "title": "OpenSSH regreSSHion Signal Handler Race Condition",
        "product": "OpenSSH (9.0p1 - 9.7p1)",
        "cvss": 8.1,
        "severity": "HIGH",
        "epss": "94.2%",
        "mitre": "T1190",
        "mitigation": "Upgrade openssh-server >= 9.8p1 or set LoginGraceTime 0 in sshd_config.",
    },
    {
        "id": "CVE-2024-3094",
        "title": "XZ Utils / liblzma Malicious Backdoor Injection",
        "product": "XZ Utils (5.6.0 & 5.6.1)",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "epss": "98.7%",
        "mitre": "T1588.005",
        "mitigation": "Downgrade to xz-utils <= 5.4.x or verify clean distribution build hashes.",
    },
    {
        "id": "CVE-2024-21626",
        "title": "runc Container Leaky File Descriptor Escape",
        "product": "runc (< 1.1.12)",
        "cvss": 8.6,
        "severity": "HIGH",
        "epss": "86.4%",
        "mitre": "T1068",
        "mitigation": "Update runc >= 1.1.12 and enforce read-only host rootfs mounts.",
    },
    {
        "id": "CVE-2023-44487",
        "title": "HTTP/2 Rapid Reset Denial of Service Protocol Flaw",
        "product": "HTTP/2 Protocol Implementations",
        "cvss": 7.5,
        "severity": "HIGH",
        "epss": "92.1%",
        "mitre": "T1498",
        "mitigation": "Enforce RST_STREAM flood thresholds in edge reverse proxies.",
    },
    {
        "id": "CVE-2021-44228",
        "title": "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
        "product": "Apache Log4j2 (2.0-beta9 to 2.14.1)",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "epss": "99.9%",
        "mitre": "T1190",
        "mitigation": "Upgrade Log4j >= 2.17.1 or set log4j2.formatMsgNoLookups=true.",
    },
]


class HexStrikeHTTPHandler(http.server.BaseHTTPRequestHandler):
    """Hardened HTTP Request Handler for HexStrike Security Arsenal."""

    server_version = "HexStrike/3.2"
    sys_version = ""

    def log_message(self, format: str, *args) -> None:
        if "200" in str(args):
            return
        sys.stderr.write(f"[HexStrike] {format % args}\n")

    def _allowed_hosts(self) -> set[str]:
        port = self.server.server_port
        return {
            f"127.0.0.1:{port}",
            f"localhost:{port}",
            f"[::1]:{port}",
            "127.0.0.1",
            "localhost",
            "[::1]",
        }

    def _validate_host(self) -> bool:
        host = (self.headers.get("Host") or "").strip().lower()
        if not host or host not in self._allowed_hosts():
            self._send_json({"error": "Invalid Host header", "host": host}, status=400, is_api=True)
            return False
        return True

    def _is_loopback_origin(self, origin: str | None) -> bool:
        if not origin:
            return True
        return bool(LOOPBACK_ORIGIN_RE.fullmatch(origin.strip().lower()))

    def _send_security_headers(self, is_api: bool = False) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_HEADER)
        if is_api:
            self.send_header("Cache-Control", "no-store")
        origin = self.headers.get("Origin")
        if origin and self._is_loopback_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data: Any, status: int = 200, head_only: bool = False, is_api: bool = True) -> None:
        payload = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._send_security_headers(is_api=is_api)
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _send_static_file(self, target_file: Path, head_only: bool = False) -> None:
        mime_type, _ = mimetypes.guess_type(str(target_file))
        mime_type = mime_type or "application/octet-stream"
        if mime_type.startswith("text/") or mime_type in ("application/javascript", "application/json"):
            mime_type = f"{mime_type}; charset=utf-8"
        content = target_file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(content)))
        self._send_security_headers(is_api=False)
        self.end_headers()
        if not head_only:
            self.wfile.write(content)

    def do_OPTIONS(self) -> None:
        if not self._validate_host():
            return
        origin = self.headers.get("Origin")
        if origin and not self._is_loopback_origin(origin):
            self._send_json({"error": "Cross-origin preflight forbidden"}, status=403, is_api=True)
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._send_security_headers(is_api=True)
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_get_or_head(head_only=True)

    def do_GET(self) -> None:
        self._handle_get_or_head(head_only=False)

    def _handle_get_or_head(self, head_only: bool = False) -> None:
        if not self._validate_host():
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/health", "/api/health"):
            catalog = load_tools_catalog()
            self._send_json(
                {
                    "status": "healthy",
                    "service": "hexstrike-arsenal",
                    "version": VERSION,
                    "sovereign": True,
                    "arsenal_count": len(catalog),
                    "mcp_tools": len(mcp_tool_definitions()),
                    "loopback_only": True,
                    "engine": "Local-First Defensive & Penetration Audit Workstation",
                },
                head_only=head_only,
            )
            return

        if path in ("/api/status", "/api/analytics"):
            catalog = load_tools_catalog()
            self._send_json(
                {
                    "service": "hexstrike-arsenal",
                    "version": VERSION,
                    "arsenal_count": len(catalog),
                    "mcp_tools": len(mcp_tool_definitions()),
                    "cve_database": "Synced 2026-FTQC",
                    "cves": CVE_DATABASE,
                    "capabilities": [
                        "nmap-recon",
                        "cve-inspector",
                        "loopback-socket-sweep",
                        "http-header-audit",
                        "shannon-entropy",
                        "local-repo-audit",
                        "mcp-protocol",
                    ],
                    "zero_telemetry": True,
                },
                head_only=head_only,
            )
            return

        if path == "/api/mcp/tools":
            defs = mcp_tool_definitions()
            self._send_json(
                {
                    "service": "hexstrike-arsenal",
                    "version": VERSION,
                    "protocolVersion": "2024-11-05",
                    "count": len(defs),
                    "tools": defs,
                },
                head_only=head_only,
            )
            return

        if path == "/api/tools":
            catalog = load_tools_catalog()
            cat = query.get("category", [""])[0].lower()
            min_score_raw = query.get("min_score", ["1"])[0]
            try:
                min_score = int(min_score_raw)
            except (TypeError, ValueError):
                self._send_json({"error": "Invalid min_score: integer required"}, status=400, head_only=head_only)
                return
            if min_score < 0 or min_score > 10:
                self._send_json({"error": "min_score must be between 0 and 10"}, status=400, head_only=head_only)
                return
            filtered = [
                t
                for t in catalog
                if (not cat or cat in str(t.get("category", "")).lower())
                and int(t.get("usefulness", 1)) >= min_score
            ]
            self._send_json({"count": len(filtered), "tools": filtered}, head_only=head_only)
            return

        if path == "/api/cmd":
            tool_id = query.get("tool", ["nmap"])[0]
            target = query.get("target", ["127.0.0.1"])[0]
            try:
                cmd_str = get_tool_command(tool_id, target)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=400, head_only=head_only)
                return
            self._send_json({"tool": tool_id, "target": target, "command": cmd_str}, head_only=head_only)
            return

        if path == "/api/scan":
            target = query.get("target", ["127.0.0.1"])[0]
            ports_raw = query.get("ports", ["22,80,443,3000,8094,8138,8787,11434"])[0]
            port_list: list[int] = []
            for p in ports_raw.split(","):
                tok = p.strip()
                if not tok:
                    continue
                if not tok.isdigit():
                    self._send_json({"error": f"Invalid port token: {tok!r}"}, status=400, head_only=head_only)
                    return
                port_list.append(int(tok))
            if not port_list:
                self._send_json({"error": "At least one valid TCP port (1-65535) is required"}, status=400, head_only=head_only)
                return
            try:
                scan_res = run_socket_port_scan(target, port_list, allow_external=False)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=400, head_only=head_only)
                return
            self._send_json(scan_res, head_only=head_only)
            return

        if path == "/api/headers":
            url = query.get("url", [""])[0]
            if not url:
                url = f"http://127.0.0.1:{self.server.server_port}/"
            try:
                result = audit_http_headers(url=url)
            except (ValueError, RuntimeError) as exc:
                self._send_json({"error": str(exc)}, status=400, head_only=head_only)
                return
            self._send_json(result, head_only=head_only)
            return

        if path in ("/", "/index.html"):
            target_file = (PUBLIC_DIR / "index.html").resolve()
        else:
            rel = path.lstrip("/")
            if not rel or "\x00" in rel:
                self._send_json({"error": "Path not found", "path": path}, status=404, head_only=head_only)
                return
            target_file = (PUBLIC_DIR / rel).resolve()

        if target_file.is_file() and target_file.is_relative_to(PUBLIC_DIR):
            self._send_static_file(target_file, head_only=head_only)
            return

        self._send_json({"error": "Path not found", "path": path}, status=404, head_only=head_only)

    def _read_json_body(self) -> tuple[dict[str, Any] | None, int | None, str | None]:
        raw_len = self.headers.get("Content-Length")
        if raw_len is None:
            return {}, None, None
        try:
            content_len = int(raw_len)
        except ValueError:
            return None, 400, "Invalid Content-Length header"
        if content_len < 0:
            return None, 400, "Negative Content-Length rejected"
        if content_len > MAX_POST_BYTES:
            return None, 413, f"Payload Too Large (max {MAX_POST_BYTES} bytes)"
        if content_len == 0:
            return {}, None, None
        raw = self.rfile.read(content_len)
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception:
            return None, 400, "Malformed JSON payload"
        if not isinstance(parsed, dict):
            return None, 400, "JSON body must be an object"
        return parsed, None, None

    def do_POST(self) -> None:
        if not self._validate_host():
            return
        origin = self.headers.get("Origin")
        if origin and not self._is_loopback_origin(origin):
            self._send_json({"error": "Cross-origin POST forbidden"}, status=403)
            return

        body, err_status, err_msg = self._read_json_body()
        if err_status is not None or body is None:
            self._send_json({"error": err_msg or "Invalid request"}, status=err_status or 400)
            return

        path = urllib.parse.urlparse(self.path).path

        if path in ("/execute", "/api/execute"):
            tool = str(body.get("tool", "nmap"))
            target = str(body.get("target", "127.0.0.1"))
            ports = body.get("ports", [3000, 8094, 8138, 11434])
            if not isinstance(ports, list):
                self._send_json({"error": "ports must be a list of integers"}, status=400)
                return
            try:
                cmd_str = get_tool_command(tool, target)
                scan_res = run_socket_port_scan(target, ports, allow_external=False)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, status=400)
                return
            self._send_json(
                {
                    "status": "success",
                    "tool": tool,
                    "target": target,
                    "synthesized_command": cmd_str,
                    "socket_probe": scan_res,
                    "execution": "Local loopback command synthesis & socket probe complete",
                }
            )
            return

        if path == "/api/headers":
            try:
                res = audit_http_headers(
                    url=body.get("url"),
                    raw_headers=body.get("raw_headers"),
                )
            except (ValueError, RuntimeError) as exc:
                self._send_json({"error": str(exc)}, status=400)
                return
            self._send_json(res)
            return

        if path == "/api/entropy":
            try:
                res = compute_shannon_entropy(
                    data=body.get("data"),
                    file_path=body.get("file_path"),
                    is_hex=bool(body.get("is_hex", False)),
                )
            except (ValueError, FileNotFoundError) as exc:
                self._send_json({"error": str(exc)}, status=400)
                return
            self._send_json(res)
            return

        if path == "/api/audit":
            target_path = body.get("path")
            if not target_path or not isinstance(target_path, str):
                self._send_json({"error": "path string is required"}, status=400)
                return
            try:
                res = audit_local_repo(target_path)
            except (ValueError, FileNotFoundError) as exc:
                self._send_json({"error": str(exc)}, status=400)
                return
            self._send_json(res)
            return

        self._send_json({"error": "Endpoint not recognized", "path": path}, status=404)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 32


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="hexstrike-server",
        description=f"HexStrike Security Arsenal v{VERSION} loopback HTTP server",
    )
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"), help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8138")), help="Bind port (default: 8138)")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    print(f"HexStrike Security Arsenal v{VERSION} listening on http://{args.host}:{args.port}")
    server = ThreadedHTTPServer((args.host, args.port), HexStrikeHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown requested.")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
