#!/usr/bin/env python3
"""
Hardened Zero-Dependency Web UI Server & REST API for DeepSearch Research Agent (:8122).

Serves the Dual-Theme DeepSearch Research Studio frontend from public/ and exposes
REST endpoints for Tree-of-Thought planning, 5-stage research synthesis, SSRF-guarded
URL fetching, claim corroboration, evidence provenance graphs, report export,
MCP configuration delivery, and ZIP research bundle generation.

Security invariants:
- Strict loopback Host header allowlist (127.0.0.1, localhost, [::1] -> 403 JSON)
- Exact-port Origin CORS allowlist (active server port + Zoth Studio :3000 ONLY)
- All 4 security headers (XFO, XCTO, Referrer-Policy, zero-egress loopback CSP) on every response
- 1 MiB POST body cap (413 JSON) & 500-char topic/query cap (400 JSON)
- Containment-verified static file serving (403 JSON on traversal or directory paths, 404 JSON on missing)
- Remote output_path rejected on POST /api/export (403 JSON)
- Strict Content-Disposition filename sanitization on POST /api/export-bundle
"""

from __future__ import annotations

import io
import json
import logging
import mimetypes
import os
import re
import sys
import time
import urllib.parse
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Iterable, Optional, Set, Tuple

from deepsearch_research_agent.mcp_server import (
    SERVER_NAME,
    SERVER_VERSION,
    deepsearch_corroborate,
    deepsearch_evidence_graph,
    deepsearch_execute,
    deepsearch_export_report,
    deepsearch_fetch,
    deepsearch_get_diagnostics,
    deepsearch_plan,
    generate_mcp_client_config,
)
from deepsearch_research_agent.url_guard import SSRFBlockedError

logger = logging.getLogger("deepsearch_research_agent.ui_server")
SERVER_START_TIME = time.time()

DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8122
STUDIO_PORT = 3000
MAX_BODY_BYTES = 1048576  # 1 MiB
MAX_TOPIC_LENGTH = 500

STRICT_CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*"
)


# =====================================================================
# Security & Path Helpers
# =====================================================================

def _has_traversal_syntax(raw_path: str) -> bool:
    """Detect raw or percent-encoded path traversal / drive-letter / backslash attempts."""
    raw = str(raw_path or "")
    decoded = urllib.parse.unquote(raw)
    for candidate in (raw, decoded):
        if "\\" in candidate or "\x00" in candidate:
            return True
        parts = [p for p in candidate.split("/") if p]
        if any(p == ".." for p in parts):
            return True
        if parts and ":" in parts[0]:
            return True
    return False


def _safe_rel(raw: str) -> str:
    """Request path -> safe relative path inside a static dir; '' if it tries to
    climb out with '..' or is absolute/Windows-drive prefixed."""
    rel = urllib.parse.unquote(str(raw or "")).replace("\\", "/").lstrip("/")
    parts = [p for p in rel.split("/") if p not in ("", ".")]
    if any(p == ".." for p in parts) or ":" in (parts[0] if parts else ""):
        return ""
    return "/".join(parts)


def _is_loopback_host(host_header: Optional[str]) -> bool:
    """Validate that the HTTP Host header targets loopback only (DNS-rebinding guard)."""
    if not host_header:
        return False
    h = host_header.strip().lower()
    if any(c in h for c in (" ", "\t", "\r", "\n", "/", "@")):
        return False
    if h.startswith("["):
        # IPv6 bracket form: [::1] or [::1]:port
        if h == "[::1]":
            return True
        if h.startswith("[::1]:"):
            port_s = h[6:]
            return port_s.isdigit() and 1 <= int(port_s) <= 65535
        return False
    if ":" in h:
        host_part, port_part = h.rsplit(":", 1)
        if not (port_part.isdigit() and 1 <= int(port_part) <= 65535):
            return False
    else:
        host_part = h
    return host_part in ("127.0.0.1", "localhost")


def _is_local_origin(
    origin: Optional[str],
    allowed_ports: Optional[Iterable[int]] = None,
) -> bool:
    """True for absent Origin (CLI/curl/same-origin) or an exact-port loopback origin.

    Default allowed ports are {8122, 3000} (DeepSearch daemon + Zoth Studio).
    Explicitly rejects port-suffix spoofs (e.g. :81220, :181220), arbitrary local
    ports (:8080, :9000), and all remote origins.
    """
    if not origin:
        return True
    if not isinstance(origin, str):
        return False
    ports: Set[int] = set(allowed_ports) if allowed_ports is not None else {DEFAULT_PORT, STUDIO_PORT}
    try:
        u = urllib.parse.urlparse(origin.strip())
    except Exception:
        return False
    if u.scheme not in ("http", "https"):
        return False
    if (u.hostname or "").lower() not in ("localhost", "127.0.0.1", "::1"):
        return False
    if u.path not in ("", "/") or u.query or u.fragment or u.username or u.password:
        return False
    try:
        port = u.port
    except ValueError:
        return False
    return port in ports


def _sanitize_slug(topic: str) -> str:
    """Sanitize a topic string for safe Content-Disposition attachment filenames."""
    slug = re.sub(r"[^a-z0-9_-]+", "-", str(topic or "").lower()).strip("-_")
    return slug[:48] or "research-dossier"


def _find_public_dir() -> Optional[str]:
    """Locate the public/ static directory cleanly."""
    candidates = [
        os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", "public")),
        os.path.realpath(os.path.join(os.getcwd(), "public")),
        os.path.realpath(os.path.join(os.path.dirname(__file__), "public")),
    ]
    for p in candidates:
        if os.path.isdir(p):
            return p
    return None


class _HardenedHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


# =====================================================================
# DeepSearch HTTP Request Handler
# =====================================================================

class DeepSearchRequestHandler(BaseHTTPRequestHandler):
    """Hardened HTTP Request Handler for DeepSearch Studio and REST APIs."""

    server_version = f"{SERVER_NAME}/{SERVER_VERSION}"

    def _allowed_origin_ports(self) -> Set[int]:
        ports = {DEFAULT_PORT, STUDIO_PORT}
        try:
            active_port = int(self.server.server_port)
            if active_port > 0:
                ports.add(active_port)
        except Exception:
            pass
        return ports

    def _is_trusted_origin(self) -> bool:
        origin = self.headers.get("Origin")
        return _is_local_origin(origin, allowed_ports=self._allowed_origin_ports())

    def _send_security_and_cors_headers(self) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", STRICT_CSP)
        self.send_header("Vary", "Origin")

        origin = self.headers.get("Origin")
        if origin and self._is_trusted_origin():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def _check_host(self) -> bool:
        if not _is_loopback_host(self.headers.get("Host")):
            self._send_json(
                {"error": "Forbidden Host header (loopback only)", "status": 403},
                status=403,
            )
            return False
        return True

    def _send_json(self, data: Any, status: int = 200, *, head_only: bool = False) -> None:
        payload = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._send_security_and_cors_headers()
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _send_error_json(self, message: str, status: int = 400, *, head_only: bool = False) -> None:
        self._send_json({"error": message, "status": status}, status=status, head_only=head_only)

    def _read_json_body(self) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
        """Read and parse JSON body with strict 1 MiB cap.

        Returns (body_dict, None) on success or (None, (status_code, error_message)) on failure.
        """
        content_length_header = self.headers.get("Content-Length")
        if content_length_header is None:
            return {}, None
        try:
            length = int(content_length_header.strip())
        except ValueError:
            return None, (400, "Invalid Content-Length header")
        if length < 0:
            return None, (400, "Negative Content-Length header")
        if length > MAX_BODY_BYTES:
            self.close_connection = True
            return None, (413, f"Payload exceeds {MAX_BODY_BYTES} byte limit (1 MiB)")
        if length == 0:
            return {}, None

        try:
            raw_data = self.rfile.read(length).decode("utf-8")
            if not raw_data.strip():
                return {}, None
            parsed = json.loads(raw_data)
            if not isinstance(parsed, dict):
                return None, (400, "JSON request body must be an object")
            return parsed, None
        except Exception as e:
            logger.warning("Error parsing JSON request body: %s", e)
            return None, (400, "Invalid JSON payload in request body")

    def _health_payload(self) -> Dict[str, Any]:
        return {
            "status": "ok",
            "healthy": True,
            "service": SERVER_NAME,
            "name": SERVER_NAME,
            "version": SERVER_VERSION,
            "port": getattr(self.server, "server_port", DEFAULT_PORT),
            "sovereign": True,
            "engine": "5-Stage Tree-of-Thought Research, Citation DAG & Contradiction Synthesis",
            "uptime_seconds": round(time.time() - SERVER_START_TIME, 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def _stats_payload(self) -> Dict[str, Any]:
        return {
            "service": SERVER_NAME,
            "version": SERVER_VERSION,
            "pipeline_stages": 5,
            "mcp_tools": 7,
            "ssrf_guard": "active",
            "max_body_bytes": MAX_BODY_BYTES,
            "max_topic_length": MAX_TOPIC_LENGTH,
            "uptime_seconds": round(time.time() - SERVER_START_TIME, 2),
        }

    def do_OPTIONS(self) -> None:
        """Handle CORS preflight requests with exact-port loopback validation."""
        if not self._check_host():
            return
        origin = self.headers.get("Origin")
        if origin and not self._is_trusted_origin():
            self._send_error_json("Cross-origin preflight blocked", status=403)
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._send_security_and_cors_headers()
        if not origin:
            self.send_header("Allow", "GET, HEAD, POST, OPTIONS")
        self.end_headers()

    def do_HEAD(self) -> None:
        """Handle HEAD requests cleanly with full security headers and zero body."""
        if not self._check_host():
            return
        self._handle_get_or_head(head_only=True)

    def do_GET(self) -> None:
        """Route GET requests for static assets and REST API endpoints."""
        if not self._check_host():
            return
        self._handle_get_or_head(head_only=False)

    def _handle_get_or_head(self, *, head_only: bool) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        # Reject path traversal on any path immediately with 403 JSON
        if _has_traversal_syntax(path):
            self._send_error_json("Path traversal forbidden", status=403, head_only=head_only)
            return

        if path in ("/health", "/api/health"):
            self._send_json(self._health_payload(), status=200, head_only=head_only)
            return

        if path in ("/api/stats", "/stats"):
            self._send_json(self._stats_payload(), status=200, head_only=head_only)
            return

        if path == "/api/diagnostics":
            check_net = query_params.get("network", ["false"])[0].lower() == "true"
            diag = deepsearch_get_diagnostics(include_network_check=check_net)
            self._send_json(diag, status=200, head_only=head_only)
            return

        if path == "/api/mcp/config":
            client_name = query_params.get("client", ["claude_desktop"])[0]
            py_path = query_params.get("python", [sys.executable or "python3"])[0]
            cfg = generate_mcp_client_config(client_name=client_name, python_path=py_path)
            self._send_json({"client": client_name, "config": cfg}, status=200, head_only=head_only)
            return

        if path in ("/api/evidence-graph", "/api/provenance"):
            include_svg = query_params.get("svg", ["false"])[0].lower() == "true"
            res = deepsearch_evidence_graph(include_svg=include_svg)
            self._send_json(res, status=200, head_only=head_only)
            return

        self._serve_static(path, head_only=head_only)

    def do_POST(self) -> None:
        """Route POST requests for planning, research, fetching, corroboration, and export."""
        if not self._check_host():
            return
        if not self._is_trusted_origin():
            self._send_error_json("Cross-origin POST request blocked", status=403)
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if _has_traversal_syntax(path):
            self._send_error_json("Path traversal forbidden", status=403)
            return

        body, err = self._read_json_body()
        if err is not None:
            status_code, msg = err
            self._send_error_json(msg, status=status_code)
            return
        assert body is not None

        try:
            if path == "/api/plan":
                topic = str(body.get("topic", body.get("query", ""))).strip()
                depth = str(body.get("depth", "deep"))
                focus_areas = body.get("focus_areas")
                if not topic:
                    self._send_error_json("Field 'topic' is required", status=400)
                    return
                if len(topic) > MAX_TOPIC_LENGTH:
                    self._send_error_json(f"Field 'topic' exceeds {MAX_TOPIC_LENGTH} characters", status=400)
                    return
                res = deepsearch_plan(topic=topic, depth=depth, focus_areas=focus_areas)
                self._send_json(res)

            elif path == "/api/research":
                topic = str(body.get("topic", body.get("query", ""))).strip()
                depth = str(body.get("depth", "deep"))
                out_format = str(body.get("format", "markdown"))
                max_sources = int(body.get("max_sources", 5))
                if not topic:
                    self._send_error_json("Field 'topic' is required", status=400)
                    return
                if len(topic) > MAX_TOPIC_LENGTH:
                    self._send_error_json(f"Field 'topic' exceeds {MAX_TOPIC_LENGTH} characters", status=400)
                    return
                res = deepsearch_execute(topic=topic, depth=depth, format=out_format, max_sources=max_sources)
                self._send_json(res)

            elif path == "/api/fetch":
                url = str(body.get("url", "")).strip()
                raw = bool(body.get("raw", False))
                timeout = max(1, min(int(body.get("timeout", 10)), 20))
                if not url:
                    self._send_error_json("Field 'url' is required", status=400)
                    return
                try:
                    res = deepsearch_fetch(url=url, raw=raw, timeout=timeout)
                    self._send_json(res)
                except SSRFBlockedError as ssrf_err:
                    self._send_error_json(str(ssrf_err), status=403)
                except ValueError as val_err:
                    self._send_error_json(str(val_err), status=400)

            elif path == "/api/corroborate":
                sources = body.get("sources", [])
                claim = body.get("claim")
                topic = body.get("topic")
                if topic and len(str(topic)) > MAX_TOPIC_LENGTH:
                    self._send_error_json(f"Field 'topic' exceeds {MAX_TOPIC_LENGTH} characters", status=400)
                    return
                if not sources or not isinstance(sources, list):
                    self._send_error_json("Field 'sources' must be a non-empty list", status=400)
                    return
                res = deepsearch_corroborate(sources=sources, claim=claim, topic=topic)
                self._send_json(res)

            elif path == "/api/export":
                if body.get("output_path"):
                    self._send_error_json(
                        "Remote 'output_path' filesystem writes are forbidden over HTTP API",
                        status=403,
                    )
                    return
                report_data = body.get("report", body.get("report_data", {}))
                out_format = str(body.get("format", "markdown"))
                if not report_data:
                    self._send_error_json("Field 'report' is required", status=400)
                    return
                res = deepsearch_export_report(report_data=report_data, format=out_format, output_path=None)
                self._send_json(res)

            elif path in ("/api/evidence-graph", "/api/provenance"):
                res = deepsearch_evidence_graph(
                    nodes=body.get("nodes"),
                    edges=body.get("edges"),
                    synthesis_data=body.get("synthesis_data"),
                    include_svg=bool(body.get("include_svg", False)),
                    trace_target=body.get("trace_target"),
                )
                self._send_json(res)

            elif path == "/api/export-bundle":
                report_data = body.get("report", body.get("report_data", {}))
                topic = str(body.get("topic", report_data.get("topic", "research-dossier") if isinstance(report_data, dict) else "research-dossier")).strip()
                if len(topic) > MAX_TOPIC_LENGTH:
                    self._send_error_json(f"Field 'topic' exceeds {MAX_TOPIC_LENGTH} characters", status=400)
                    return
                if not report_data:
                    report_data = deepsearch_execute(topic=topic or "Research Dossier", depth="deep", format="json")

                zip_bytes = self._create_bundle_zip(report_data, topic)
                safe_slug = _sanitize_slug(topic)
                safe_filename = f"deepsearch-{safe_slug}-bundle.zip"

                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Disposition", f'attachment; filename="{safe_filename}"')
                self.send_header("Content-Length", str(len(zip_bytes)))
                self._send_security_and_cors_headers()
                self.end_headers()
                self.wfile.write(zip_bytes)

            else:
                self._send_error_json(f"Endpoint '{path}' not found", status=404)

        except ValueError as ve:
            self._send_error_json(str(ve), status=400)
        except PermissionError as pe:
            self._send_error_json(str(pe), status=403)
        except Exception as e:
            logger.error("Error handling POST %s: %s", path, e, exc_info=True)
            self._send_error_json(f"Internal server error: {str(e)}", status=500)

    def _create_bundle_zip(self, report_data: Dict[str, Any], topic: str) -> bytes:
        """Create a complete research export ZIP bundle (Markdown, HTML, JSON, BibTeX)."""
        md_export = deepsearch_export_report(report_data, format="markdown")
        html_export = deepsearch_export_report(report_data, format="html")
        bib_export = deepsearch_export_report(report_data, format="bibtex")
        json_export = json.dumps(report_data, indent=2, ensure_ascii=False)

        sources_json = json.dumps(report_data.get("sources", []), indent=2, ensure_ascii=False)
        metrics_json = json.dumps(report_data.get("metrics", {}), indent=2, ensure_ascii=False)
        corroboration_json = json.dumps(report_data.get("corroboration_matrix", {}), indent=2, ensure_ascii=False)

        readme_content = f"""# DeepSearch Research Dossier: {topic}

Autonomous Multi-Perspective Deep Research & Verification Export Bundle (v{SERVER_VERSION}).
Generated: {report_data.get('generated_at', time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()))}

## Bundle Contents
1. `report.md` - Full research report in GitHub-flavored Markdown
2. `report.html` - Standalone HTML report (XSS-escaped)
3. `report.json` - Complete structured JSON research dossier
4. `citations.bib` - BibTeX bibliography entries
5. `sources.json` - Normalized references and credibility scores
6. `metrics.json` - Consensus and verification metrics
7. `corroboration.json` - Cross-source stance corroboration matrix
"""

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("README.md", readme_content)
            zf.writestr("report.md", md_export["content"])
            zf.writestr("report.html", html_export["content"])
            zf.writestr("report.json", json_export)
            zf.writestr("citations.bib", bib_export["content"])
            zf.writestr("sources.json", sources_json)
            zf.writestr("metrics.json", metrics_json)
            zf.writestr("corroboration.json", corroboration_json)

        buffer.seek(0)
        return buffer.getvalue()

    def _serve_static(self, path: str, *, head_only: bool = False) -> None:
        """Serve verified static files from public/ with strict containment."""
        public_dir = _find_public_dir()
        if not public_dir:
            self._send_error_json("Static frontend directory not found", status=500, head_only=head_only)
            return

        real_public = os.path.realpath(public_dir)

        if path in ("/", "/index.html", ""):
            index_path = os.path.realpath(os.path.join(real_public, "index.html"))
            if os.path.commonpath([real_public, index_path]) == real_public and os.path.isfile(index_path):
                self._serve_file(index_path, head_only=head_only)
                return
            self._send_error_json("index.html not found", status=404, head_only=head_only)
            return

        clean_rel = _safe_rel(path)
        if not clean_rel:
            self._send_error_json("Forbidden path", status=403, head_only=head_only)
            return

        target_path = os.path.realpath(os.path.join(real_public, clean_rel))
        try:
            in_bounds = os.path.commonpath([real_public, target_path]) == real_public
        except ValueError:
            in_bounds = False

        if not in_bounds:
            self._send_error_json("Path traversal forbidden", status=403, head_only=head_only)
            return

        # Block directory listings (e.g. /assets/ or /assets) with 403 JSON
        if os.path.isdir(target_path) or path.endswith("/"):
            self._send_error_json("Directory listing forbidden", status=403, head_only=head_only)
            return

        if os.path.isfile(target_path):
            self._serve_file(target_path, head_only=head_only)
            return

        self._send_error_json(f"Resource '{path}' not found", status=404, head_only=head_only)

    def _serve_file(self, filepath: str, *, head_only: bool = False) -> None:
        """Serve a single filesystem file with security headers and MIME type."""
        try:
            mime_type, _ = mimetypes.guess_type(filepath)
            if mime_type is None:
                mime_type = "application/octet-stream"
            if any(tok in mime_type for tok in ("text", "json", "javascript", "xml", "svg")):
                content_type = f"{mime_type}; charset=utf-8"
            else:
                content_type = mime_type

            with open(filepath, "rb") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self._send_security_and_cors_headers()
            self.end_headers()
            if not head_only:
                self.wfile.write(content)
        except Exception as e:
            self._send_error_json(f"Error serving file: {str(e)}", status=500, head_only=head_only)

    def log_message(self, format: str, *args: Any) -> None:
        logger.info("%s - - [%s] %s", self.address_string(), self.log_date_time_string(), format % args)


# =====================================================================
# Server Launcher
# =====================================================================

def run_ui_server(
    host: str = DEFAULT_HOST,
    port: int = DEFAULT_PORT,
    open_browser: bool = False,
) -> ThreadingHTTPServer:
    """Start and return the hardened DeepSearch ThreadingHTTPServer."""
    httpd = _HardenedHTTPServer((host, port), DeepSearchRequestHandler)
    actual_port = httpd.server_port
    url = f"http://{'127.0.0.1' if host in ('0.0.0.0', '127.0.0.1') else host}:{actual_port}"
    print(f"DeepSearch Research Agent & Studio v{SERVER_VERSION} listening on {url}")

    if open_browser:
        import webbrowser
        try:
            webbrowser.open(url)
        except Exception:
            pass

    return httpd


start_server = run_ui_server


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description=f"DeepSearch Research Studio Server v{SERVER_VERSION}")
    ap.add_argument("--host", default=DEFAULT_HOST)
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--open", action="store_true")
    cli_args = ap.parse_args()
    server = run_ui_server(host=cli_args.host, port=cli_args.port, open_browser=cli_args.open)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down DeepSearch Research Studio server...")
        server.shutdown()
    finally:
        server.server_close()
