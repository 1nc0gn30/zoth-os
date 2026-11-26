"""Hardened Multi-threaded Loopback HTTP and REST API Server for Cyber Turtle Studio.

Serves the Cyber Turtle Studio web application and exposes REST APIs for executing
Logo scripts, synthesizing L-System fractals, Truchet tiles, BFS-solved mazes,
spirographs, 2-Opt TSP toolpath optimization, and exporting SVG, CNC G-Code, and
Unicode Braille/ASCII art.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from . import __version__
from .catalog import (
    generate_pattern,
    get_catalog_summary,
    list_categories,
    list_presets,
    list_tags,
)
from .compat import get_platform_info, sanitize_display_path
from .exporters import (
    export_ascii,
    export_gcode,
    export_svg,
)
from .lsystem_engine import generate_lsystem
from .models import DrawingAST
from .spirograph import generate_spirograph
from .toolpath_optimizer import ToolpathOptimizer, render_toolpath_comparison_svg
from .truchet_maze import (
    generate_maze_labyrinth,
    generate_truchet_tiling,
    render_ascii_maze,
)
from .turtle_engine import execute_logo

MAX_POST_BYTES = 1048576  # 1 MiB strict cap
STUDIO_PORT = 3000
DEFAULT_PORT = 8129

SECURITY_CSP = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'self' http://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:* http://localhost:*"
)

_LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}


def _is_loopback_host(host_header: Optional[str], server_port: int = DEFAULT_PORT) -> bool:
    """Validate HTTP Host header against strict loopback allowlist (DNS-rebinding guard)."""
    if not host_header:
        return True
    raw = host_header.strip().lower()
    if not raw:
        return True
    # Parse IPv6 bracketed host or host[:port]
    try:
        parsed = urllib.parse.urlparse(f"http://{raw}")
    except Exception:
        return False
    hostname = (parsed.hostname or "").lower()
    if hostname not in _LOOPBACK_HOSTS:
        return False
    # Reject spoofed credentials or path injection in Host
    if parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port is not None and port != int(server_port):
        return False
    return True


def _is_local_origin(origin: Optional[str], server_port: int = DEFAULT_PORT) -> bool:
    """Exact-port loopback Origin allowlist: active server_port and Studio :3000 only."""
    if not origin:
        return True
    try:
        u = urllib.parse.urlparse(origin.strip())
    except Exception:
        return False
    if u.scheme not in ("http", "https"):
        return False
    hostname = (u.hostname or "").lower()
    if hostname not in _LOOPBACK_HOSTS:
        return False
    if u.username or u.password:
        return False
    try:
        port = u.port
    except ValueError:
        return False
    if port is None:
        return False
    return port in {int(server_port), STUDIO_PORT}


def _cors_origin(handler: BaseHTTPRequestHandler) -> Optional[str]:
    """Return Origin only when explicitly present and exact-port allowlisted."""
    origin = handler.headers.get("Origin", "").strip()
    if not origin:
        return None
    port = handler.server.server_address[1] if getattr(handler, "server", None) else DEFAULT_PORT
    return origin if _is_local_origin(origin, server_port=port) else None


def _has_traversal(raw_path: str) -> bool:
    """Detect raw or percent-encoded path traversal segments."""
    decoded = raw_path
    for _ in range(3):
        unq = urllib.parse.unquote(decoded)
        if ".." in unq.replace("\\", "/").split("/") or "\\" in unq or "\x00" in unq:
            return True
        if unq == decoded:
            break
        decoded = unq
    return False


class StudioHTTPRequestHandler(BaseHTTPRequestHandler):
    """Hardened loopback HTTP/REST handler with strict security headers and validation."""

    server_version = f"CyberTurtleStudio/{__version__}"
    sys_version = ""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.public_dir = self._find_public_dir()
        super().__init__(*args, **kwargs)

    @property
    def _active_port(self) -> int:
        try:
            return int(self.server.server_address[1])
        except Exception:
            return DEFAULT_PORT

    @staticmethod
    def _find_public_dir() -> Path:
        """Locate the public assets folder across package installs, /opt, and dev trees."""
        candidates = [
            Path(__file__).resolve().parent.parent.parent / "public",
            Path("/opt/cyber-turtle-studio/public"),
            Path.cwd() / "public",
            Path(__file__).resolve().parent / "public",
        ]
        for c in candidates:
            if c.is_dir() and (c / "index.html").is_file():
                return c.resolve()
        for c in candidates:
            if c.is_dir():
                return c.resolve()
        return (Path(__file__).resolve().parent.parent.parent / "public").resolve()

    def _send_security_headers(self, include_cors_methods: bool = False) -> None:
        """Emit all 4 baseline security headers plus strict Vary/CORS headers."""
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", SECURITY_CSP)
        self.send_header("Vary", "Origin")

        allowed_origin = _cors_origin(self)
        if allowed_origin:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
        if include_cors_methods or allowed_origin:
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def _check_host_guard(self, head_only: bool = False) -> bool:
        """Return True if Host is allowlisted; otherwise emit 403 JSON and return False."""
        host_hdr = self.headers.get("Host")
        if not _is_loopback_host(host_hdr, server_port=self._active_port):
            self._send_error(403, "Forbidden: non-loopback Host header rejected", head_only=head_only)
            return False
        return True

    def _check_origin_guard(self, head_only: bool = False) -> bool:
        """Return True if Origin is absent or exact-port allowlisted; otherwise 403 JSON."""
        origin = self.headers.get("Origin", "").strip()
        if origin and not _is_local_origin(origin, server_port=self._active_port):
            self._send_error(403, "Forbidden: cross-origin or disallowed port blocked", head_only=head_only)
            return False
        return True

    def _send_bytes(
        self,
        body: bytes,
        content_type: str,
        status: int = 200,
        extra_headers: Optional[Dict[str, str]] = None,
        head_only: bool = False,
        include_cors_methods: bool = False,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self._send_security_headers(include_cors_methods=include_cors_methods)
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        if not head_only and body:
            self.wfile.write(body)

    def _send_json(self, data: Any, status: int = 200, head_only: bool = False) -> None:
        body = json.dumps(data, default=str).encode("utf-8")
        self._send_bytes(
            body,
            content_type="application/json; charset=utf-8",
            status=status,
            head_only=head_only,
        )

    def _send_error(self, status: int, message: str, head_only: bool = False) -> None:
        self._send_json(
            {"success": False, "error": message, "status": status},
            status=status,
            head_only=head_only,
        )

    def do_OPTIONS(self) -> None:
        """Handle CORS pre-flight requests with strict Host + exact-port Origin enforcement."""
        if not self._check_host_guard():
            return
        if not self._check_origin_guard():
            return
        self.send_response(200)
        self._send_security_headers(include_cors_methods=True)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        """Handle HEAD requests identically to GET without response body bytes."""
        self._handle_get_or_head(head_only=True)

    def do_GET(self) -> None:
        """Route GET requests for static UI files, presets catalog, and REST APIs."""
        self._handle_get_or_head(head_only=False)

    def _handle_get_or_head(self, head_only: bool = False) -> None:
        if not self._check_host_guard(head_only=head_only):
            return

        parsed = urllib.parse.urlparse(self.path)
        raw_path = parsed.path
        if _has_traversal(raw_path):
            self._send_error(403, "Forbidden: path traversal rejected", head_only=head_only)
            return

        path = urllib.parse.unquote(raw_path)
        query_params = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            index_file = self.public_dir / "index.html"
            if index_file.is_file():
                self._send_bytes(
                    index_file.read_bytes(),
                    content_type="text/html; charset=utf-8",
                    status=200,
                    head_only=head_only,
                )
            else:
                self._send_error(404, "Standalone UI index.html not found", head_only=head_only)
            return

        if path in ("/api/presets", "/api/catalog"):
            category_filter = query_params.get("category", [None])[0]
            type_filter = query_params.get("type", [None])[0]
            tag_filter = query_params.get("tag", [None])[0]

            presets_list = list_presets(category=category_filter, drawing_type=type_filter, tag=tag_filter)
            presets_dicts = [
                {
                    "id": p.id,
                    "title": p.title,
                    "name": p.name,
                    "category": p.category,
                    "type": p.type,
                    "description": p.description,
                    "difficulty": p.difficulty,
                    "default_parameters": p.default_parameters,
                    "tags": p.tags,
                    "axiom": p.config.axiom,
                    "rules": p.config.rules,
                    "angle": p.config.angle,
                    "iterations": p.recommended_iterations,
                    "step_size": p.config.step_size,
                    "start_heading": p.config.start_heading,
                    "default_theme": p.default_theme,
                }
                for p in presets_list
            ]
            self._send_json(
                {
                    "summary": get_catalog_summary(),
                    "categories": list_categories(),
                    "tags": list_tags(),
                    "presets": presets_dicts,
                    "count": len(presets_dicts),
                },
                head_only=head_only,
            )
            return

        if path in ("/health", "/api/health", "/api/stats", "/api/diagnostics"):
            stats = {
                "status": "healthy" if path in ("/api/stats", "/api/diagnostics") else "ok",
                "healthy": True,
                "service": "cyber-turtle-studio",
                "version": __version__,
                "port": self._active_port,
                "server": "Cyber Turtle Studio ThreadingHTTPServer",
                "summary": get_catalog_summary(),
                "platform": get_platform_info().__dict__,
                "public_dir": sanitize_display_path(self.public_dir),
            }
            self._send_json(stats, head_only=head_only)
            return

        if path == "/api/mcp/config":
            from .mcp_server import MCPServer

            mcp = MCPServer()
            self._send_json(
                {
                    "service": "cyber-turtle-studio",
                    "version": __version__,
                    "transport": "stdio",
                    "command": "cyber-turtle-studio",
                    "args": ["mcp"],
                    "tools": [t["name"] for t in mcp.get_tool_definitions()],
                    "tool_count": len(mcp.get_tool_definitions()),
                },
                head_only=head_only,
            )
            return

        if path == "/api/truchet":
            try:
                rows = int(query_params.get("rows", ["10"])[0])
                cols = int(query_params.get("cols", ["10"])[0])
                tile_size = float(query_params.get("tile_size", ["40.0"])[0])
                style = query_params.get("style", ["arcs"])[0]
                seed_val = query_params.get("seed", [None])[0]
                seed = int(seed_val) if seed_val is not None and seed_val != "" else None
                theme = query_params.get("theme", ["cyber_matrix"])[0]
                animate = query_params.get("animate", ["false"])[0].lower() in ("true", "1", "yes")

                ast, stats = generate_truchet_tiling(
                    rows=rows,
                    cols=cols,
                    tile_size=tile_size,
                    style=style,
                    seed=seed,
                )
            except (ValueError, TypeError) as exc:
                self._send_error(400, f"Invalid truchet query parameters: {exc}", head_only=head_only)
                return

            svg_str = export_svg(ast, theme=theme, animate=animate)
            gcode_str, _ = export_gcode(ast)
            self._send_json(
                {
                    "success": True,
                    "style": style,
                    "rows": rows,
                    "cols": cols,
                    "stats": stats,
                    "ast": ast.to_dict(),
                    "svg": svg_str,
                    "gcode": gcode_str,
                },
                head_only=head_only,
            )
            return

        if path == "/api/maze":
            try:
                rows = int(query_params.get("rows", ["15"])[0])
                cols = int(query_params.get("cols", ["15"])[0])
                cell_size = float(query_params.get("cell_size", ["25.0"])[0])
                algo = query_params.get("algo", query_params.get("algorithm", ["recursive_backtracker"]))[0]
                seed_val = query_params.get("seed", [None])[0]
                seed = int(seed_val) if seed_val is not None and seed_val != "" else None
                solve = query_params.get("solve", ["false"])[0].lower() in ("true", "1", "yes")
                theme = query_params.get("theme", ["cyber_matrix"])[0]
                animate = query_params.get("animate", ["false"])[0].lower() in ("true", "1", "yes")

                ast, meta = generate_maze_labyrinth(
                    rows=rows,
                    cols=cols,
                    cell_size=cell_size,
                    algorithm=algo,
                    seed=seed,
                    solve=solve,
                )
            except (ValueError, TypeError) as exc:
                self._send_error(400, f"Invalid maze query parameters: {exc}", head_only=head_only)
                return

            svg_str = export_svg(ast, theme=theme, animate=animate)
            gcode_str, _ = export_gcode(ast)
            ascii_str = render_ascii_maze(meta)
            self._send_json(
                {
                    "success": True,
                    "algorithm": algo,
                    "rows": rows,
                    "cols": cols,
                    "solved": solve,
                    "solution_length": meta.get("solution_length", 0),
                    "meta": meta,
                    "ast": ast.to_dict(),
                    "svg": svg_str,
                    "gcode": gcode_str,
                    "ascii": ascii_str,
                },
                head_only=head_only,
            )
            return

        if path == "/api/spirograph":
            try:
                outer_r = float(query_params.get("outer_r", ["120.0"])[0])
                inner_r = float(query_params.get("inner_r", ["45.0"])[0])
                pen_d = float(query_params.get("pen_d", ["65.0"])[0])
                steps = int(query_params.get("steps", ["1800"])[0])
                if steps < 10 or steps > 20000:
                    raise ValueError("steps must be 10..20000")
                theme = query_params.get("theme", ["cyber_matrix"])[0]
                ast = generate_spirograph(
                    R=outer_r, r=inner_r, d=pen_d, steps=steps
                )
            except (ValueError, TypeError) as exc:
                self._send_error(400, f"Invalid spirograph query parameters: {exc}", head_only=head_only)
                return

            svg_str = export_svg(ast, theme=theme)
            gcode_str, _ = export_gcode(ast)
            self._send_json(
                {
                    "success": True,
                    "stats": ast.stats(),
                    "ast": ast.to_dict(),
                    "svg": svg_str,
                    "gcode": gcode_str,
                },
                head_only=head_only,
            )
            return

        if path.startswith("/api/"):
            self._send_error(404, f"API endpoint not found: {path}", head_only=head_only)
            return

        # Serve static files strictly within self.public_dir; disable directory listing!
        self._serve_static_file(path, head_only=head_only)

    def _serve_static_file(self, rel_url_path: str, head_only: bool = False) -> None:
        rel_clean = rel_url_path.lstrip("/")
        public_root = self.public_dir.resolve()
        candidate = (public_root / rel_clean).resolve()

        try:
            candidate.relative_to(public_root)
        except ValueError:
            self._send_error(403, "Forbidden: path outside public root", head_only=head_only)
            return

        if candidate.is_dir():
            # Explicitly disable directory listing (return 403 JSON)
            self._send_error(403, "Forbidden: directory listing is disabled", head_only=head_only)
            return

        if not candidate.is_file():
            self._send_error(404, f"Not found: {rel_url_path}", head_only=head_only)
            return

        ctype, _ = mimetypes.guess_type(str(candidate))
        if not ctype:
            ctype = "application/octet-stream"
        if ctype.startswith("text/") or ctype in ("application/javascript", "application/json", "application/xml"):
            ctype = f"{ctype}; charset=utf-8"

        self._send_bytes(
            candidate.read_bytes(),
            content_type=ctype,
            status=200,
            head_only=head_only,
        )

    def do_POST(self) -> None:
        """Route POST requests for Logo execution, L-System synthesis, and exporters."""
        if not self._check_host_guard():
            return
        if not self._check_origin_guard():
            return

        parsed = urllib.parse.urlparse(self.path)
        if _has_traversal(parsed.path):
            self._send_error(403, "Forbidden: path traversal rejected")
            return
        path = urllib.parse.unquote(parsed.path)

        raw_cl = self.headers.get("Content-Length", "0").strip()
        try:
            content_length = int(raw_cl) if raw_cl else 0
        except ValueError:
            self._send_error(400, "Invalid Content-Length header")
            return

        if content_length < 0:
            self._send_error(400, "Negative Content-Length header rejected")
            return
        if content_length > MAX_POST_BYTES:
            self._send_error(
                413,
                f"Payload too large: {content_length} bytes exceeds {MAX_POST_BYTES} byte (1 MiB) limit",
            )
            return

        body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
        try:
            req_data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
            if not isinstance(req_data, dict):
                raise ValueError("JSON body must be an object")
        except Exception as exc:
            self._send_error(400, f"Invalid JSON payload: {exc}")
            return

        try:
            if path == "/api/execute-logo":
                script = str(req_data.get("script", "repeat 4 [ fd 100 rt 90 ]"))
                color = req_data.get("color")
                width = float(req_data.get("width", 1.5))
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))

                ast = execute_logo(script, color=color, width=width)
                svg_str = export_svg(ast, theme=theme, animate=animate)
                gcode_str, _ = export_gcode(ast)

                self._send_json(
                    {
                        "success": True,
                        "title": ast.title,
                        "ast": ast.to_dict(),
                        "stats": ast.stats(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                    }
                )

            elif path == "/api/generate-lsystem":
                axiom = str(req_data.get("axiom", "F--F--F"))
                rules = req_data.get("rules", {"F": "F+F--F+F"})
                iterations = int(req_data.get("iterations", 3))
                angle_deg = float(req_data.get("angle_deg", req_data.get("angle", 60.0)))
                step_size = float(req_data.get("step_size", req_data.get("step", 10.0)))
                initial_heading = float(req_data.get("initial_heading", req_data.get("heading", 0.0)))
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))

                ast = generate_lsystem(
                    axiom=axiom,
                    rules=rules,
                    iterations=iterations,
                    angle_deg=angle_deg,
                    step_size=step_size,
                    initial_heading_deg=initial_heading,
                )
                svg_str = export_svg(ast, theme=theme, animate=animate)
                gcode_str, _ = export_gcode(ast)

                self._send_json(
                    {
                        "success": True,
                        "title": ast.title,
                        "ast": ast.to_dict(),
                        "stats": ast.stats(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                    }
                )

            elif path == "/api/generate-preset":
                preset_id = str(req_data.get("preset_id", "koch_snowflake"))
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))
                iterations = req_data.get("iterations")
                step_size = req_data.get("step_size")

                ast = generate_pattern(
                    preset_id,
                    iterations=int(iterations) if iterations is not None else None,
                    step_size=float(step_size) if step_size is not None else None,
                )
                svg_str = export_svg(ast, theme=theme, animate=animate)
                gcode_str, _ = export_gcode(ast)

                self._send_json(
                    {
                        "success": True,
                        "preset_id": preset_id,
                        "title": ast.title,
                        "ast": ast.to_dict(),
                        "stats": ast.stats(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                    }
                )

            elif path == "/api/export-svg":
                ast = self._extract_or_generate_ast(req_data)
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))
                duration = float(req_data.get("duration", 4.0))

                svg_content = export_svg(ast, theme=theme, animate=animate, duration_sec=duration)
                if req_data.get("as_download", False):
                    self._send_bytes(
                        svg_content.encode("utf-8"),
                        content_type="image/svg+xml; charset=utf-8",
                        status=200,
                        extra_headers={"Content-Disposition": 'attachment; filename="drawing.svg"'},
                    )
                else:
                    self._send_json({"success": True, "svg": svg_content})

            elif path == "/api/export-gcode":
                ast = self._extract_or_generate_ast(req_data)
                bed_w = float(req_data.get("bed_width", 200.0))
                bed_h = float(req_data.get("bed_height", 200.0))
                feed_draw = float(req_data.get("feed_draw", 1200.0))
                feed_travel = float(req_data.get("feed_travel", 3000.0))
                z_up = float(req_data.get("z_up", 5.0))
                z_down = float(req_data.get("z_down", 0.0))
                laser_mode = bool(req_data.get("laser_mode", False))

                gcode_content, gstats = export_gcode(
                    ast,
                    bed_width=bed_w,
                    bed_height=bed_h,
                    feed_draw=feed_draw,
                    feed_travel=feed_travel,
                    z_up=z_up,
                    z_down=z_down,
                    laser_mode=laser_mode,
                )
                if req_data.get("as_download", False):
                    self._send_bytes(
                        gcode_content.encode("utf-8"),
                        content_type="text/plain; charset=utf-8",
                        status=200,
                        extra_headers={"Content-Disposition": 'attachment; filename="drawing.gcode"'},
                    )
                else:
                    self._send_json({"success": True, "gcode": gcode_content, "stats": gstats})

            elif path == "/api/export-ascii":
                ast = self._extract_or_generate_ast(req_data)
                width = max(16, min(160, int(req_data.get("width", 64))))
                height = max(8, min(80, int(req_data.get("height", 32))))
                mode = str(req_data.get("mode", "braille"))
                ascii_text = export_ascii(ast, width=width, height=height, mode=mode, use_color=False)
                self._send_json({"success": True, "ascii": ascii_text})

            elif path == "/api/optimize-toolpath":
                ast = self._extract_or_generate_ast(req_data)
                draw_feed = float(req_data.get("draw_feedrate", 1200.0))
                travel_feed = float(req_data.get("travel_feedrate", 3000.0))

                optimizer = ToolpathOptimizer(draw_feedrate_mm_min=draw_feed, travel_feedrate_mm_min=travel_feed)
                opt_ast, report = optimizer.optimize_toolpath(ast)

                comp_svg = render_toolpath_comparison_svg(ast, opt_ast)
                opt_gcode, _ = export_gcode(opt_ast)

                self._send_json(
                    {
                        "success": True,
                        "report": report.to_dict(),
                        "ast": opt_ast.to_dict(),
                        "comparison_svg": comp_svg,
                        "optimized_gcode": opt_gcode,
                    }
                )

            elif path == "/api/truchet":
                rows = int(req_data.get("rows", 10))
                cols = int(req_data.get("cols", 10))
                tile_size = float(req_data.get("tile_size", 40.0))
                style = req_data.get("style", "arcs")
                seed = req_data.get("seed")
                seed_int = int(seed) if seed is not None and seed != "" else None
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))

                ast, stats = generate_truchet_tiling(
                    rows=rows,
                    cols=cols,
                    tile_size=tile_size,
                    style=style,
                    seed=seed_int,
                )
                svg_str = export_svg(ast, theme=theme, animate=animate)
                gcode_str, _ = export_gcode(ast)

                self._send_json(
                    {
                        "success": True,
                        "style": style,
                        "rows": rows,
                        "cols": cols,
                        "stats": stats,
                        "ast": ast.to_dict(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                    }
                )

            elif path == "/api/maze":
                rows = int(req_data.get("rows", 15))
                cols = int(req_data.get("cols", 15))
                cell_size = float(req_data.get("cell_size", 25.0))
                algo = req_data.get("algorithm", req_data.get("algo", "recursive_backtracker"))
                seed = req_data.get("seed")
                seed_int = int(seed) if seed is not None and seed != "" else None
                solve = bool(req_data.get("solve", False))
                theme = str(req_data.get("theme", "cyber_matrix"))
                animate = bool(req_data.get("animate", False))

                ast, meta = generate_maze_labyrinth(
                    rows=rows,
                    cols=cols,
                    cell_size=cell_size,
                    algorithm=algo,
                    seed=seed_int,
                    solve=solve,
                )
                svg_str = export_svg(ast, theme=theme, animate=animate)
                gcode_str, _ = export_gcode(ast)
                ascii_str = render_ascii_maze(meta)

                self._send_json(
                    {
                        "success": True,
                        "algorithm": algo,
                        "rows": rows,
                        "cols": cols,
                        "solved": solve,
                        "solution_length": meta.get("solution_length", 0),
                        "meta": meta,
                        "ast": ast.to_dict(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                        "ascii": ascii_str,
                    }
                )

            elif path == "/api/spirograph":
                outer_r = float(req_data.get("outer_r", 120.0))
                inner_r = float(req_data.get("inner_r", 45.0))
                pen_d = float(req_data.get("pen_d", 65.0))
                steps = int(req_data.get("steps", 1800))
                if steps < 10 or steps > 20000:
                    raise ValueError("steps must be 10..20000")
                theme = str(req_data.get("theme", "cyber_matrix"))

                ast = generate_spirograph(R=outer_r, r=inner_r, d=pen_d, steps=steps)
                svg_str = export_svg(ast, theme=theme)
                gcode_str, _ = export_gcode(ast)

                self._send_json(
                    {
                        "success": True,
                        "stats": ast.stats(),
                        "ast": ast.to_dict(),
                        "svg": svg_str,
                        "gcode": gcode_str,
                    }
                )

            else:
                self._send_error(404, f"API endpoint not found: {path}")

        except (ValueError, KeyError, TypeError) as exc:
            self._send_error(400, f"Bad request for {path}: {exc}")
        except Exception as err:
            self._send_error(500, f"Error processing {path}: {err}")

    def _extract_or_generate_ast(self, data: Dict[str, Any]) -> DrawingAST:
        """Helper to resolve a DrawingAST from payload or preset."""
        if "ast" in data and isinstance(data["ast"], dict):
            return DrawingAST.from_dict(data["ast"])
        if "truchet" in data and isinstance(data["truchet"], dict):
            ast, _ = generate_truchet_tiling(**data["truchet"])
            return ast
        if "maze" in data and isinstance(data["maze"], dict):
            ast, _ = generate_maze_labyrinth(**data["maze"])
            return ast
        if "preset_id" in data:
            return generate_pattern(str(data["preset_id"]))
        if "script" in data:
            return execute_logo(str(data["script"]))
        if "axiom" in data and "rules" in data:
            return generate_lsystem(
                axiom=str(data["axiom"]),
                rules=data["rules"],
                iterations=int(data.get("iterations", 3)),
                angle_deg=float(data.get("angle_deg", data.get("angle", 60.0))),
            )
        return generate_pattern("koch_snowflake")

    def log_message(self, format: str, *args: Any) -> None:
        """Quiet standard request logging in production unless explicitly debugging."""
        if os.environ.get("CYBER_TURTLE_DEBUG"):
            super().log_message(format, *args)


def create_server(host: str = "127.0.0.1", port: int = DEFAULT_PORT) -> ThreadingHTTPServer:
    """Create and return configured ThreadingHTTPServer instance."""
    server_addr = (host, port)
    return ThreadingHTTPServer(server_addr, StudioHTTPRequestHandler)


def start_server(
    host: str = "127.0.0.1",
    port: int = DEFAULT_PORT,
    open_browser: bool = False,
    auto_port: bool = True,
) -> None:
    """Start the multi-threaded Cyber Turtle Studio UI server."""
    current_port = port
    max_attempts = 10 if auto_port else 1
    httpd: Optional[ThreadingHTTPServer] = None

    for _ in range(max_attempts):
        try:
            httpd = create_server(host, current_port)
            break
        except OSError:
            if not auto_port:
                raise
            current_port += 1

    if httpd is None:
        raise RuntimeError(f"Could not bind server to {host}:{port}-{current_port}")

    url = f"http://{host}:{current_port}/"
    print(f"Cyber Turtle Studio v{__version__} running at: {url}")
    print("   Press Ctrl+C to stop.")

    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Cyber Turtle Studio server...")
    finally:
        httpd.server_close()


def main() -> None:
    """CLI entry point for running ui_server directly."""
    parser = argparse.ArgumentParser(description="Cyber Turtle Studio UI Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host address to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Port to listen on (default: {DEFAULT_PORT})")
    parser.add_argument("--no-browser", action="store_true", help="Do not open web browser automatically")
    args = parser.parse_args()

    start_server(host=args.host, port=args.port, open_browser=not args.no_browser)


if __name__ == "__main__":
    main()
