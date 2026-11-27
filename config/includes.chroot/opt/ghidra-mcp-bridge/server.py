#!/usr/bin/env python3
"""GhidraMCP Binary Reverse Engineering Loopback Daemon (v3.6.0).

Hardened loopback HTTP/JSON-RPC 2.0 server:
- Strict loopback Host validation (403 Forbidden on non-loopback Host)
- Exact-port loopback CORS Origin allowlist (403 Forbidden on disallowed Origin, zero ACAO: *)
- All 4 mandatory security headers + Vary: Origin on every response
- Disabled static directory listings (403 Forbidden JSON)
- ThreadingHTTPServer with dynamic bound port reporting
- 1 MiB request body cap (413 Content Too Large)
- Safe log_message() & full HEAD support across health/API/static endpoints
- Pure-Python ELF/PE/Mach-O/WASM sections, Shannon entropy, and hex dump endpoints
- Spec-compliant JSON-RPC 2.0 MCP bridge (8 tools)

Zero external runtime dependencies.
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import json
import os
import sys
import time
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"
START_TIME = time.time()
MAX_BODY_BYTES = 1_048_576  # 1 MiB

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from analyzer import (
    BinaryAnalyzer,
    MCP_PROTOCOL_VERSION,
    MCP_TOOLS,
    PROGRAMS_DB,
    VERSION,
    handle_mcp_request,
)

ANALYZER = BinaryAnalyzer()

CSP_HEADER = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self' http://127.0.0.1:* http://localhost:*; "
    "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*; "
    "base-uri 'self'; "
    "form-action 'self'"
)

LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
STUDIO_PORTS = {3000}


def parse_host_header(host_header: str) -> Tuple[Optional[str], Optional[int]]:
    """Parse HTTP Host header into (hostname, port)."""
    raw = (host_header or "").strip().lower()
    if not raw or "/" in raw or "@" in raw or " " in raw:
        return None, None
    if raw.startswith("["):
        end = raw.find("]")
        if end == -1:
            return None, None
        hostname = raw[1:end]
        rest = raw[end + 1:]
        if not rest:
            return hostname, None
        if not rest.startswith(":"):
            return None, None
        try:
            return hostname, int(rest[1:])
        except ValueError:
            return None, None
    if ":" in raw:
        parts = raw.rsplit(":", 1)
        try:
            return parts[0], int(parts[1])
        except ValueError:
            return None, None
    return raw, None


def validate_loopback_origin(origin: str, server_port: int) -> bool:
    """Validate Origin strictly against loopback hosts on exact server_port or Studio :3000."""
    if not origin:
        return True
    try:
        parsed = urllib.parse.urlparse(origin.strip())
    except Exception:
        return False
    if parsed.scheme != "http":
        return False
    if parsed.username or parsed.password:
        return False
    if parsed.path not in ("", "/") or parsed.params or parsed.query or parsed.fragment:
        return False
    hostname = (parsed.hostname or "").lower()
    if hostname not in LOOPBACK_HOSTS:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port is None:
        return False
    return port == server_port or port in STUDIO_PORTS


class GhidraMcpHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        self._cors_origin: Optional[str] = None
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_HEADER)
        self.send_header("Vary", "Origin")
        if self._cors_origin:
            self.send_header("Access-Control-Allow-Origin", self._cors_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def _validate_request_security(self) -> bool:
        """Enforce loopback Host and exact-port loopback Origin guards."""
        self._cors_origin = None
        server_port = self.server.server_port

        host_hdr = self.headers.get("Host")
        if host_hdr is not None:
            hostname, port = parse_host_header(host_hdr)
            if hostname not in LOOPBACK_HOSTS or (port is not None and port != server_port):
                self.close_connection = True
                self.send_json(403, {"error": "Forbidden: non-loopback or mismatched Host header"})
                return False

        origin_hdr = self.headers.get("Origin")
        if origin_hdr is not None:
            if not validate_loopback_origin(origin_hdr, server_port):
                self.close_connection = True
                self.send_json(403, {"error": "Forbidden: disallowed CORS Origin"})
                return False
            self._cors_origin = origin_hdr.strip()

        return True

    def _parse_int_param(
        self, query: Dict[str, Any], name: str, default: int, min_val: int, max_val: int
    ) -> int:
        raw = query.get(name, [str(default)])[0]
        try:
            val = int(raw)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Invalid integer parameter '{name}': {raw}") from exc
        if val < min_val or val > max_val:
            raise ValueError(f"Parameter '{name}' must be between {min_val} and {max_val}")
        return val

    def _handle_api_get(self, path: str, query: Dict[str, Any], head_only: bool = False) -> bool:
        """Handle API GET/HEAD routes. Returns True if path matched an API endpoint."""
        server_port = self.server.server_port

        if path in ("/health", "/api/health"):
            engines = ANALYZER.get_engines_status()
            self.send_json(
                200,
                {
                    "status": "healthy",
                    "service": "ghidra-mcp-bridge",
                    "version": VERSION,
                    "protocol": f"Model Context Protocol (MCP) {MCP_PROTOCOL_VERSION}",
                    "ghidra_headless": (
                        "READY (/usr/share/ghidra/support/analyzeHeadless)"
                        if engines["ghidra_headless"] == "READY"
                        else "UNAVAILABLE"
                    ),
                    "engines": engines,
                    "port": server_port,
                    "uptime_seconds": round(time.time() - START_TIME, 2),
                    "access": "100% Free & Open-Access (Zero Paywalls)",
                },
                head_only=head_only,
            )
            return True

        if path == "/api/status":
            engines = ANALYZER.get_engines_status()
            self.send_json(
                200,
                {
                    "bridge_status": "ONLINE",
                    "bridge_version": VERSION,
                    "port": server_port,
                    "active_targets": len(PROGRAMS_DB),
                    "mcp_tools_count": len(MCP_TOOLS),
                    "engines": engines,
                    "server_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
                head_only=head_only,
            )
            return True

        if path == "/api/tools":
            self.send_json(200, {"version": VERSION, "tools": MCP_TOOLS}, head_only=head_only)
            return True

        if path == "/api/programs":
            summaries = []
            for p in PROGRAMS_DB:
                summaries.append({
                    "id": p["id"],
                    "name": p["name"],
                    "arch": p["arch"],
                    "format": p["format"],
                    "compiler": p["compiler"],
                    "entry_point": p["entry_point"],
                    "functions": list(p["functions"].keys()),
                    "strings_count": len(p["strings"]),
                    "is_demo": True,
                })
            for sp in ("/bin/echo", "/bin/ls", "/bin/bash"):
                if os.path.isfile(sp):
                    summaries.append({
                        "id": sp,
                        "name": Path(sp).name,
                        "path": sp,
                        "arch": "x86_64",
                        "format": "ELF64",
                        "compiler": "GCC/GNU Binutils",
                        "entry_point": "Dynamic",
                        "functions": ["main"],
                        "strings_count": 100,
                        "is_demo": False,
                    })
            self.send_json(200, summaries, head_only=head_only)
            return True

        if path in ("/api/sections", "/api/entropy"):
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            try:
                res = ANALYZER.inspect_sections_and_entropy(prog_id)
                self.send_json(200, res, head_only=head_only)
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/hex":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            try:
                offset = self._parse_int_param(query, "offset", 0, 0, 100_000_000)
                length = self._parse_int_param(query, "length", 256, 16, 4096)
                res = ANALYZER.read_hex_dump(prog_id, offset=offset, length=length)
                self.send_json(200, res, head_only=head_only)
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/inspect":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                res = ANALYZER.inspect_binary(prog_id, force_jail=force_jail)
                self.send_json(200, res, head_only=head_only)
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/methods":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            filter_q = query.get("filter", [None])[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                methods = ANALYZER.list_methods(prog_id, filter_query=filter_q, force_jail=force_jail)
                self.send_json(
                    200,
                    {"program": prog_id, "total": len(methods), "methods": methods},
                    head_only=head_only,
                )
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/disassemble":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            fn_name = query.get("fn", query.get("function", ["main"]))[0]
            syntax = query.get("syntax", ["intel"])[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                data = ANALYZER.disassemble_function(prog_id, fn_name, syntax=syntax, force_jail=force_jail)
                self.send_json(200, data, head_only=head_only)
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/decompile":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            fn_name = query.get("fn", query.get("function", ["main"]))[0]
            engine = query.get("engine", ["auto"])[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                data = ANALYZER.decompile_function(prog_id, fn_name, engine=engine, force_jail=force_jail)
                self.send_json(200, data, head_only=head_only)
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/strings":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            query_str = query.get("query", query.get("q", [None]))[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                min_len = self._parse_int_param(query, "min_len", 4, 1, 256)
                strings = ANALYZER.search_strings(
                    prog_id, query=query_str, min_len=min_len, force_jail=force_jail
                )
                self.send_json(
                    200,
                    {"program": prog_id, "count": len(strings), "strings": strings},
                    head_only=head_only,
                )
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        if path == "/api/xrefs":
            prog_id = query.get("program", ["zoth-vault-daemon"])[0]
            target_sym = query.get("target", query.get("sym", ["main"]))[0]
            force_jail = query.get("jail", ["0"])[0] in ("1", "true")
            try:
                xrefs = ANALYZER.get_xrefs(prog_id, target_sym, force_jail=force_jail)
                self.send_json(
                    200,
                    {"program": prog_id, "target": target_sym, "count": len(xrefs), "xrefs": xrefs},
                    head_only=head_only,
                )
            except PermissionError as e:
                self.send_json(403, {"error": str(e)}, head_only=head_only)
            except ValueError as e:
                self.send_json(400, {"error": str(e)}, head_only=head_only)
            except FileNotFoundError as e:
                self.send_json(404, {"error": str(e)}, head_only=head_only)
            return True

        return False

    def _is_traversal_attempt(self, raw_path: str) -> bool:
        decoded = urllib.parse.unquote(raw_path)
        if ".." in decoded.split("/") or "\\..\\" in decoded or decoded.startswith("/.."):
            return True
        return False

    def list_directory(self, path):
        """Disable directory listings completely."""
        self.send_json(403, {"error": "Forbidden: directory listing is disabled"})
        return None

    def do_HEAD(self):
        if not self._validate_request_security():
            return
        parsed = urllib.parse.urlparse(self.path)
        if self._is_traversal_attempt(parsed.path):
            self.send_json(403, {"error": "Forbidden: path traversal blocked"}, head_only=True)
            return
        query = urllib.parse.parse_qs(parsed.query)
        if self._handle_api_get(parsed.path, query, head_only=True):
            return
        super().do_HEAD()

    def do_GET(self):
        if not self._validate_request_security():
            return
        parsed = urllib.parse.urlparse(self.path)
        if self._is_traversal_attempt(parsed.path):
            self.send_json(403, {"error": "Forbidden: path traversal blocked"})
            return
        query = urllib.parse.parse_qs(parsed.query)
        if self._handle_api_get(parsed.path, query, head_only=False):
            return
        super().do_GET()

    def do_POST(self):
        if not self._validate_request_security():
            return

        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/mcp":
            self.send_json(404, {"error": "Not Found"})
            return

        raw_len = self.headers.get("Content-Length", "0")
        try:
            content_len = int(raw_len)
        except ValueError:
            self.send_json(400, {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Invalid Content-Length"}})
            return

        if content_len < 0:
            self.send_json(400, {"jsonrpc": "2.0", "id": None, "error": {"code": -32600, "message": "Negative Content-Length"}})
            return

        if content_len > MAX_BODY_BYTES:
            self.close_connection = True
            self.send_json(
                413,
                {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32600,
                        "message": f"Payload exceeds maximum body cap of {MAX_BODY_BYTES} bytes",
                    },
                },
            )
            return

        raw_body = self.rfile.read(content_len)
        try:
            rpc_req = json.loads(raw_body.decode("utf-8"))
        except Exception as e:
            self.send_json(
                400,
                {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": f"Parse error: {e}"}},
            )
            return

        status_code, response_obj = handle_mcp_request(ANALYZER, rpc_req)
        if status_code == 204 or response_obj is None:
            self.send_response(204)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_json(status_code, response_obj)

    def do_OPTIONS(self):
        if not self._validate_request_security():
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def send_json(self, status_code: int, data: Any, head_only: bool = False):
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def send_error(self, code, message=None, explain=None):
        """Return clean JSON error responses with all security headers."""
        try:
            code_int = int(code)
        except Exception:
            code_int = 500
        self.send_json(code_int, {"error": message or f"HTTP {code_int}", "status": code_int})

    def log_message(self, format, *args):
        """Safe logging that handles HTTPStatus and non-string args without raising."""
        try:
            msg = format % args if args else str(format)
        except Exception:
            msg = " ".join(str(a) for a in args) if args else str(format)
        if '" 200 ' in msg or '" 204 ' in msg:
            return
        sys.stderr.write(f"[{self.log_date_time_string()}] {msg}\n")


def run(host: str = "127.0.0.1", port: int = 8131):
    server_address = (host, port)
    httpd = ThreadingHTTPServer(server_address, GhidraMcpHandler)
    actual_port = httpd.server_port
    engines = ANALYZER.get_engines_status()
    print(f"✦ GhidraMCP Reverse Engineering Bridge v{VERSION} running on http://{host}:{actual_port}")
    print(f"  Health endpoint: http://{host}:{actual_port}/health")
    print(f"  MCP Tools (8):   http://{host}:{actual_port}/api/tools")
    print(
        f"  Active Engines:  Ghidra={engines['ghidra_headless']} | r2={engines['radare2']} "
        f"| objdump={engines['objdump']} | jail={engines['agent_capsule_jail']}"
    )
    print(f"  Decompile API:   http://{host}:{actual_port}/api/decompile?program=/bin/echo&fn=main")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping GhidraMCP daemon...")
        httpd.server_close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=f"GhidraMCP Bridge Daemon v{VERSION}")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    parser.add_argument("--port", type=int, default=8131, help="Port to bind")
    args = parser.parse_args()
    run(host=args.host, port=args.port)
