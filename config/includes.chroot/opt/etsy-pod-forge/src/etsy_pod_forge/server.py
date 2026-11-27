"""Hardened Multi-Threaded HTTP Server & REST API for Etsy POD Forge (v2.6.0).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library (`http.server`, `urllib`, `json`, `threading`, `zipfile`) + Pillow.
Binds strictly to loopback (127.0.0.1:8107 by default) with Host/Origin 403 guards,
all 4 security headers, 1 MiB body cap, strict JSON validation, and zero unsolicited egress.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import mimetypes
import os
import sys
import threading
import time
import urllib.parse
import zipfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from socketserver import ThreadingMixIn
from typing import Any, Dict, List, Optional, Tuple

from . import __version__
from .canvas_generator import CanvasConfig, CanvasGenerator
from .listing_synthesizer import CADRE_SPECS, VALID_CADRES, ProfitMetrics, synthesize_listing
from .mcp_server import MCP_TOOLS_DEFINITIONS
from .mockup_engine import MockupConfig, MockupEngine
from .prompt_vault import get_all_prompts, get_prompts_by_cadre, search_prompts

MAX_BODY_BYTES = 1_048_576  # 1 MiB strict request body ceiling
MAX_TEXT_FIELD_LEN = 500
VALID_COLORWAYS = frozenset({"sand", "pepper", "moss", "dusty_rose", "ivory", "white", "natural", "oak_frame", "blueprint"})
LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})

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


def _is_valid_host(host_header: Optional[str], server_port: int) -> bool:
    """Validate HTTP Host header against loopback hostnames and exact bound port."""
    if not host_header:
        return False
    raw = host_header.strip()
    if not raw or any(c.isspace() for c in raw):
        return False
    try:
        parsed = urllib.parse.urlparse(f"http://{raw}")
    except ValueError:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        return False
    if parsed.hostname not in LOOPBACK_HOSTS:
        return False
    try:
        host_port = parsed.port
    except ValueError:
        return False
    if host_port is not None and host_port != server_port:
        return False
    return True


def _is_local_origin(origin: Optional[str], server_port: Optional[int] = None) -> bool:
    """Validate browser Origin header.

    - Empty / absent Origin (non-browser CLI/agent): allowed.
    - When server_port is supplied (all live HTTP requests): strictly allow ONLY
      http://127.0.0.1:<server_port>, http://localhost:<server_port>, http://[::1]:<server_port>,
      plus Studio origins http://127.0.0.1:3000 / http://localhost:3000 / http://[::1]:3000.
      Port-suffix spoofing (e.g. :81070) and external origins are rejected with 403.
    """
    if not origin:
        return True
    if not isinstance(origin, str):
        return False
    raw = origin.strip()
    if not raw or raw.lower() == "null":
        return False
    try:
        u = urllib.parse.urlparse(raw)
        origin_port = u.port
    except ValueError:
        return False
    if u.username is not None or u.password is not None:
        return False
    if u.path not in ("", "/") or u.query or u.fragment:
        return False
    if u.hostname not in LOOPBACK_HOSTS:
        return False
    if server_port is not None:
        if u.scheme != "http":
            return False
        allowed_ports = {int(server_port), 3000}
        return origin_port in allowed_ports
    return u.scheme in ("http", "https")


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class ForgeTelemetry:
    """Thread-safe local in-memory telemetry accumulator (zero unsolicited network egress)."""

    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.start_time = time.time()
        self.canvases_generated = 0
        self.mockups_generated = 0
        self.listings_synthesized = 0
        self.kits_exported = 0
        self.projected_revenue = 0.0

    def record_canvas(self) -> None:
        with self.lock:
            self.canvases_generated += 1

    def record_mockup(self) -> None:
        with self.lock:
            self.mockups_generated += 1

    def record_listing(self, retail_price: float) -> None:
        with self.lock:
            self.listings_synthesized += 1
            self.projected_revenue += float(retail_price)

    def record_export(self) -> None:
        with self.lock:
            self.kits_exported += 1

    def get_stats(self, port: int = 8107) -> Dict[str, Any]:
        with self.lock:
            uptime = round(time.time() - self.start_time, 1)
            return {
                "service": "etsy-pod-forge",
                "status": "healthy",
                "version": __version__,
                "port": int(port),
                "uptime_seconds": uptime,
                "canvases_generated": self.canvases_generated,
                "mockups_generated": self.mockups_generated,
                "listings_synthesized": self.listings_synthesized,
                "kits_exported": self.kits_exported,
                "projected_revenue": round(self.projected_revenue, 2),
                "cadre_count": len(CADRE_SPECS),
                "prompt_count": len(get_all_prompts()),
                "mcp_tool_count": len(MCP_TOOLS_DEFINITIONS),
            }


GLOBAL_TELEMETRY = ForgeTelemetry()


class ValidationError(ValueError):
    """Raised when an HTTP request payload fails strict schema validation."""


def _validate_cadre(val: Any, default: str = "apparel") -> str:
    if val is None:
        return default
    if not isinstance(val, str):
        raise ValidationError("Field 'cadre' must be a string.")
    key = val.strip().lower()
    if key not in VALID_CADRES:
        raise ValidationError(
            f"Invalid cadre '{val[:40]}'. Allowed values: {', '.join(sorted(VALID_CADRES))}."
        )
    return key


def _validate_text(val: Any, field_name: str, default: str = "") -> str:
    if val is None:
        return default
    if not isinstance(val, str):
        raise ValidationError(f"Field '{field_name}' must be a string.")
    cleaned = val.strip()
    if len(cleaned) > MAX_TEXT_FIELD_LEN:
        raise ValidationError(f"Field '{field_name}' exceeds {MAX_TEXT_FIELD_LEN} characters.")
    return cleaned


def _validate_float(
    val: Any,
    field_name: str,
    default: Optional[float] = None,
    min_val: float = 0.0,
    max_val: float = 100000.0,
) -> Optional[float]:
    if val is None or val == "":
        return default
    if isinstance(val, bool) or not isinstance(val, (int, float, str)):
        raise ValidationError(f"Field '{field_name}' must be a number.")
    try:
        num = float(val)
    except (ValueError, TypeError) as exc:
        raise ValidationError(f"Field '{field_name}' must be a valid number.") from exc
    if not math.isfinite(num) or num < min_val or num > max_val:
        raise ValidationError(f"Field '{field_name}' must be between {min_val} and {max_val}.")
    return num


def _validate_names(val: Any) -> Optional[List[str]]:
    if val is None or val == "":
        return None
    if isinstance(val, str):
        if len(val) > MAX_TEXT_FIELD_LEN:
            raise ValidationError(f"Field 'names' exceeds {MAX_TEXT_FIELD_LEN} characters.")
        items = [n.strip() for n in val.split(",") if n.strip()]
        return items[:12] if items else None
    if isinstance(val, list):
        if len(val) > 20:
            raise ValidationError("Field 'names' cannot exceed 20 entries.")
        out: List[str] = []
        for item in val:
            if not isinstance(item, str):
                raise ValidationError("All entries in 'names' must be strings.")
            s = item.strip()
            if len(s) > 64:
                raise ValidationError("Individual name entries cannot exceed 64 characters.")
            if s:
                out.append(s)
        return out[:12] if out else None
    raise ValidationError("Field 'names' must be a comma-separated string or list of strings.")


def _validate_color(val: Any, default: str = "sand") -> str:
    if val is None or val == "":
        return default
    if not isinstance(val, str):
        raise ValidationError("Field 'color' must be a string.")
    key = val.strip().lower()
    if key not in VALID_COLORWAYS:
        return default
    return key


class ForgeRequestHandler(BaseHTTPRequestHandler):
    """Hardened HTTP request handler supporting REST API endpoints and static files."""

    server_version = f"EtsyPODForge/{__version__}"
    protocol_version = "HTTP/1.1"

    def __init__(self, *args: Any, directory: Optional[str] = None, **kwargs: Any) -> None:
        if directory is None:
            cur_dir = os.path.dirname(os.path.abspath(__file__))
            pkg_root = os.path.dirname(os.path.dirname(cur_dir))
            directory = os.path.join(pkg_root, "public")
        self.public_dir = Path(directory).resolve()
        super().__init__(*args, **kwargs)

    def log_message(self, format: str, *args: Any) -> None:
        # Keep logs compact without leaking sensitive data
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

    def _bound_port(self) -> int:
        return int(getattr(self.server, "server_port", 8107))

    def _emit_security_headers(self, allow_cors: bool = True) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_HEADER)
        self.send_header("Vary", "Origin")
        origin = self.headers.get("Origin")
        if allow_cors and origin and _is_local_origin(origin, server_port=self._bound_port()):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_bytes(
        self,
        status_code: int,
        body: bytes,
        content_type: str,
        extra_headers: Optional[Dict[str, str]] = None,
        head_only: bool = False,
        allow_cors: bool = True,
    ) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self._emit_security_headers(allow_cors=allow_cors)
        self.end_headers()
        if not head_only and body:
            self.wfile.write(body)

    def _send_json(
        self,
        status_code: int,
        data: Any,
        head_only: bool = False,
        allow_cors: bool = True,
    ) -> None:
        raw = json.dumps(data, indent=2).encode("utf-8")
        self._send_bytes(
            status_code,
            raw,
            "application/json; charset=utf-8",
            head_only=head_only,
            allow_cors=allow_cors,
        )

    def _enforce_guards(self, head_only: bool = False) -> bool:
        """Enforce strict loopback Host and exact-port Origin allowlist on every method."""
        port = self._bound_port()
        host = self.headers.get("Host")
        if not _is_valid_host(host, port):
            self._send_json(
                403,
                {"error": "forbidden host header", "code": "HOST_REJECTED"},
                head_only=head_only,
                allow_cors=False,
            )
            return False

        origin = self.headers.get("Origin")
        if origin is not None and not _is_local_origin(origin, server_port=port):
            self._send_json(
                403,
                {"error": "cross-origin request blocked", "code": "ORIGIN_REJECTED"},
                head_only=head_only,
                allow_cors=False,
            )
            return False
        return True

    def _read_json_body(self) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
        """Read and strictly parse JSON request body with 1 MiB ceiling."""
        raw_len = self.headers.get("Content-Length")
        if raw_len is None or raw_len.strip() == "":
            return {}, None
        try:
            content_len = int(raw_len.strip())
        except ValueError:
            return None, (400, "Invalid Content-Length header")
        if content_len < 0:
            return None, (400, "Negative Content-Length header")
        if content_len > MAX_BODY_BYTES:
            self.close_connection = True
            return None, (413, f"Request body exceeds {MAX_BODY_BYTES} bytes limit")
        if content_len == 0:
            return {}, None

        raw_bytes = self.rfile.read(content_len)
        try:
            text = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return None, (400, "Request body must be valid UTF-8")
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            return None, (400, "Malformed JSON payload")
        if not isinstance(parsed, dict):
            return None, (400, "JSON payload must be an object")
        return parsed, None

    def _build_export_zip(
        self,
        cadre: str,
        title: str = "",
        names_str: str = "Emma, Liam, Olivia, Noah",
        retail: Optional[float] = None,
        prod: Optional[float] = None,
        shipping_charged: float = 0.0,
        shipping_cost: float = 0.0,
        offsite_ads_rate: float = 0.0,
        color: str = "sand",
    ) -> bytes:
        """Assemble a safe, Zip-Slip-free Master ZIP Kit for a whitelisted cadre."""
        assert cadre in VALID_CADRES

        kit = synthesize_listing(
            cadre=cadre,
            custom_title_hook=title or None,
            custom_names=names_str,
            retail_price=retail,
            production_cost=prod,
            shipping_charged=shipping_charged,
            shipping_cost=shipping_cost,
            offsite_ads_rate=offsite_ads_rate,
        )

        canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
        if title:
            canvas_cfg.title_text = title
        names_list = [n.strip() for n in names_str.split(",") if n.strip()]
        if names_list:
            canvas_cfg.custom_names = names_list[:8]

        gen = CanvasGenerator(canvas_cfg)
        art = gen.generate()
        buf_png = io.BytesIO()
        art.save(buf_png, format="PNG", dpi=(canvas_cfg.dpi, canvas_cfg.dpi), optimize=True)
        canvas_bytes = buf_png.getvalue()

        mock_cfg = MockupConfig.default_for_cadre(cadre)
        mock_cfg.product_color = color
        mockup_bytes = MockupEngine(mock_cfg).composite_bytes(art, format="JPEG")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"{cadre}_print_canvas.png", canvas_bytes)
            zf.writestr(f"{cadre}_lifestyle_mockup.jpg", mockup_bytes)
            listing_doc = (
                f"===========================================================\n"
                f"ETSY STORE LISTING ASSET KIT — {kit.product_type.upper()}\n"
                f"Etsy POD Forge v{__version__}\n"
                f"Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform\n"
                f"===========================================================\n\n"
                f"TITLE (Length: {len(kit.title)} chars <= 140):\n"
                f"{kit.title}\n\n"
                f"13 SEARCH TAGS (All <= 20 chars):\n"
                f"{', '.join(kit.tags)}\n\n"
                f"2026 FINANCIAL ECONOMICS:\n"
                f"- Retail Price:       ${kit.profit.retail_price:.2f}\n"
                f"- Buyer Shipping:     ${kit.profit.shipping_charged:.2f}\n"
                f"- Gross Revenue:      ${kit.profit.gross_revenue:.2f}\n"
                f"- Production Cost:    ${kit.profit.production_cost:.2f}\n"
                f"- POD Ship Cost:      ${kit.profit.shipping_cost:.2f}\n"
                f"- Offsite Ads Tier:   {int(round(kit.profit.offsite_ads_rate * 100))}%\n"
                f"- Total Etsy Fees:    ${kit.profit.total_fees:.2f}\n"
                f"- Net Profit / Sale:  ${kit.profit.net_profit:.2f} ({kit.profit.margin_percent:.1f}% Margin)\n"
                f"- Break-Even Price:   ${kit.profit.break_even_price:.2f}\n\n"
                f"FULL DESCRIPTION:\n"
                f"-----------------------------------------------------------\n"
                f"{kit.description}\n"
            )
            zf.writestr("listing_details.txt", listing_doc)
            zf.writestr("listing_data.json", json.dumps(kit.to_dict(), indent=2))

        GLOBAL_TELEMETRY.record_export()
        return zip_buffer.getvalue()

    def _serve_static(self, url_path: str, head_only: bool = False) -> None:
        """Serve static files strictly inside public_dir; disable directory listings."""
        unquoted = urllib.parse.unquote(url_path)
        if "\x00" in unquoted or "\\" in unquoted:
            self._send_json(403, {"error": "forbidden path"}, head_only=head_only)
            return

        # Reject explicit path traversal segments before resolving
        segments = [seg for seg in unquoted.split("/") if seg]
        if any(seg in (".", "..") for seg in segments):
            self._send_json(403, {"error": "path traversal blocked"}, head_only=head_only)
            return

        if not segments:
            candidate = (self.public_dir / "index.html").resolve()
        else:
            candidate = (self.public_dir.joinpath(*segments)).resolve()

        if not candidate.is_relative_to(self.public_dir):
            self._send_json(403, {"error": "path traversal blocked"}, head_only=head_only)
            return

        if candidate.is_dir():
            # Disable directory listings completely (e.g., GET /assets/ -> 403 Forbidden)
            self._send_json(403, {"error": "directory listing disabled"}, head_only=head_only)
            return

        if not candidate.is_file():
            self._send_json(404, {"error": "not found", "path": url_path}, head_only=head_only)
            return

        ctype, _ = mimetypes.guess_type(str(candidate))
        if not ctype:
            ctype = "application/octet-stream"
        elif ctype.startswith("text/") or ctype in ("application/javascript", "application/json", "application/xml"):
            ctype = f"{ctype}; charset=utf-8"

        try:
            data = candidate.read_bytes()
        except OSError:
            self._send_json(404, {"error": "file unreadable"}, head_only=head_only)
            return

        self._send_bytes(200, data, ctype, head_only=head_only)

    def _handle_get_or_head(self, head_only: bool = False) -> None:
        if not self._enforce_guards(head_only=head_only):
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)
        port = self._bound_port()

        if path in ("/api/health", "/health"):
            self._send_json(
                200,
                {
                    "status": "healthy",
                    "service": "etsy-pod-forge",
                    "port": port,
                    "version": __version__,
                    "engine": "pod-canvas-mockup-seo-studio",
                    "cadres": len(CADRE_SPECS),
                    "prompts": len(get_all_prompts()),
                    "mcp_tools": len(MCP_TOOLS_DEFINITIONS),
                    "uptime_seconds": round(time.time() - GLOBAL_TELEMETRY.start_time, 1),
                },
                head_only=head_only,
            )
            return

        if path == "/api/stats":
            self._send_json(200, GLOBAL_TELEMETRY.get_stats(port=port), head_only=head_only)
            return

        if path == "/api/cadres":
            self._send_json(
                200,
                {"cadres": CADRE_SPECS, "count": len(CADRE_SPECS), "version": __version__},
                head_only=head_only,
            )
            return

        if path == "/api/mcp/tools":
            self._send_json(
                200,
                {
                    "server": "etsy-pod-forge",
                    "version": __version__,
                    "transport": "stdio",
                    "command": "etsy-pod-forge",
                    "args": ["mcp"],
                    "count": len(MCP_TOOLS_DEFINITIONS),
                    "tools": MCP_TOOLS_DEFINITIONS,
                },
                head_only=head_only,
            )
            return

        if path == "/api/prompts":
            cadre_filter = qs.get("cadre", [None])[0]
            search_query = qs.get("q", [None])[0]
            try:
                if cadre_filter is not None and cadre_filter.strip() != "":
                    cadre_key = _validate_cadre(cadre_filter)
                    prompts = get_prompts_by_cadre(cadre_key)
                else:
                    prompts = get_all_prompts()
                if search_query:
                    q_clean = _validate_text(search_query, "q").lower()
                    prompts = [
                        p for p in prompts
                        if q_clean in p.title.lower()
                        or q_clean in p.subject.lower()
                        or q_clean in p.style.lower()
                        or any(q_clean in t.lower() for t in p.tags)
                    ]
            except ValidationError as exc:
                self._send_json(400, {"error": str(exc)}, head_only=head_only)
                return

            self._send_json(
                200,
                {
                    "prompts": [p.to_dict() for p in prompts],
                    "count": len(prompts),
                    "total_available": len(get_all_prompts()),
                },
                head_only=head_only,
            )
            return

        if path == "/api/export-kit":
            try:
                cadre = _validate_cadre(qs.get("cadre", ["apparel"])[0])
                title = _validate_text(qs.get("title", [""])[0], "title")
                names_raw = qs.get("names", ["Emma, Liam, Olivia, Noah"])[0]
                names_list = _validate_names(names_raw)
                names_str = ", ".join(names_list) if names_list else "Emma, Liam, Olivia, Noah"
                retail = _validate_float(qs.get("retail", [None])[0], "retail")
                prod = _validate_float(qs.get("production", [None])[0], "production")
                ship_in = _validate_float(qs.get("shipping_charged", [0.0])[0], "shipping_charged", default=0.0) or 0.0
                ship_out = _validate_float(qs.get("shipping_cost", [0.0])[0], "shipping_cost", default=0.0) or 0.0
                ads_rate = _validate_float(qs.get("offsite_ads_rate", [0.0])[0], "offsite_ads_rate", default=0.0, max_val=0.5) or 0.0
                color = _validate_color(qs.get("color", ["sand"])[0])
            except ValidationError as exc:
                self._send_json(400, {"error": str(exc)}, head_only=head_only)
                return

            zip_bytes = self._build_export_zip(
                cadre=cadre,
                title=title,
                names_str=names_str,
                retail=retail,
                prod=prod,
                shipping_charged=ship_in,
                shipping_cost=ship_out,
                offsite_ads_rate=ads_rate,
                color=color,
            )
            self._send_bytes(
                200,
                zip_bytes,
                "application/zip",
                extra_headers={"Content-Disposition": f'attachment; filename="etsy_kit_{cadre}.zip"'},
                head_only=head_only,
            )
            return

        self._serve_static(path, head_only=head_only)

    def do_OPTIONS(self) -> None:
        if not self._enforce_guards(head_only=False):
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self._emit_security_headers(allow_cors=True)
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_get_or_head(head_only=True)

    def do_GET(self) -> None:
        self._handle_get_or_head(head_only=False)

    def do_POST(self) -> None:
        if not self._enforce_guards(head_only=False):
            return

        path = urllib.parse.urlparse(self.path).path
        payload, err = self._read_json_body()
        if err is not None:
            status_code, msg = err
            self._send_json(status_code, {"error": msg})
            return
        assert payload is not None

        try:
            if path == "/api/generate-canvas":
                cadre = _validate_cadre(payload.get("cadre", "apparel"))
                preview_raw = payload.get("preview", True)
                if not isinstance(preview_raw, bool):
                    raise ValidationError("Field 'preview' must be a boolean.")
                title = _validate_text(payload.get("title"), "title")
                subtitle = _validate_text(payload.get("subtitle"), "subtitle")
                names = _validate_names(payload.get("names"))

                cfg = CanvasConfig.default_for_cadre(cadre, preview=preview_raw)
                if title:
                    cfg.title_text = title
                if subtitle:
                    cfg.subtitle_text = subtitle
                if names:
                    cfg.custom_names = names

                gen = CanvasGenerator(cfg)
                b64 = gen.generate_base64()
                GLOBAL_TELEMETRY.record_canvas()

                self._send_json(
                    200,
                    {
                        "success": True,
                        "image_b64": b64,
                        "width": cfg.width,
                        "height": cfg.height,
                        "dpi": cfg.dpi,
                        "cadre": cadre,
                        "is_preview": preview_raw,
                    },
                )
                return

            if path == "/api/generate-mockup":
                cadre = _validate_cadre(payload.get("cadre", "apparel"))
                color = _validate_color(payload.get("color"), default="sand")
                title = _validate_text(payload.get("title"), "title")
                subtitle = _validate_text(payload.get("subtitle"), "subtitle")
                names = _validate_names(payload.get("names"))

                canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
                if title:
                    canvas_cfg.title_text = title
                if subtitle:
                    canvas_cfg.subtitle_text = subtitle
                if names:
                    canvas_cfg.custom_names = names

                art = CanvasGenerator(canvas_cfg).generate()
                mockup_cfg = MockupConfig.default_for_cadre(cadre)
                mockup_cfg.product_color = color
                mockup_b64 = MockupEngine(mockup_cfg).composite_base64(art)
                GLOBAL_TELEMETRY.record_mockup()

                self._send_json(
                    200,
                    {
                        "success": True,
                        "mockup_b64": mockup_b64,
                        "width": mockup_cfg.width,
                        "height": mockup_cfg.height,
                        "cadre": cadre,
                        "color": color,
                    },
                )
                return

            if path == "/api/generate-listing":
                cadre = _validate_cadre(payload.get("cadre", "apparel"))
                title_hook = _validate_text(payload.get("title_hook") or payload.get("title"), "title_hook") or None
                names_list = _validate_names(payload.get("custom_names") or payload.get("names"))
                custom_names = ", ".join(names_list) if names_list else None
                retail = _validate_float(payload.get("retail_price"), "retail_price")
                prod = _validate_float(payload.get("production_cost"), "production_cost")
                ship_in = _validate_float(payload.get("shipping_charged"), "shipping_charged", default=0.0) or 0.0
                ship_out = _validate_float(payload.get("shipping_cost"), "shipping_cost", default=0.0) or 0.0
                ads_rate = _validate_float(payload.get("offsite_ads_rate"), "offsite_ads_rate", default=0.0, max_val=0.5) or 0.0

                kit = synthesize_listing(
                    cadre=cadre,
                    custom_title_hook=title_hook,
                    custom_names=custom_names,
                    retail_price=retail,
                    production_cost=prod,
                    shipping_charged=ship_in,
                    shipping_cost=ship_out,
                    offsite_ads_rate=ads_rate,
                )
                errors = kit.validate_invariants()
                GLOBAL_TELEMETRY.record_listing(kit.profit.retail_price)

                self._send_json(
                    200,
                    {
                        "success": True,
                        "listing": kit.to_dict(),
                        "invariant_errors": errors,
                    },
                )
                return

            if path == "/api/calculate-margins":
                retail = _validate_float(payload.get("retail_price"), "retail_price")
                prod = _validate_float(payload.get("production_cost"), "production_cost")
                if retail is None or prod is None:
                    raise ValidationError("Fields 'retail_price' and 'production_cost' are required.")
                ship_in = _validate_float(payload.get("shipping_charged"), "shipping_charged", default=0.0) or 0.0
                ship_out = _validate_float(payload.get("shipping_cost"), "shipping_cost", default=0.0) or 0.0
                ads_rate = _validate_float(payload.get("offsite_ads_rate"), "offsite_ads_rate", default=0.0, max_val=0.5) or 0.0
                metrics = ProfitMetrics.calculate(
                    retail=retail,
                    production=prod,
                    shipping_charged=ship_in,
                    shipping_cost=ship_out,
                    offsite_ads_rate=ads_rate,
                )
                self._send_json(200, {"success": True, "profit": metrics.to_dict()})
                return

            if path == "/api/export-kit":
                cadre = _validate_cadre(payload.get("cadre", "apparel"))
                title = _validate_text(payload.get("title"), "title")
                names_list = _validate_names(payload.get("names"))
                names_str = ", ".join(names_list) if names_list else "Emma, Liam, Olivia, Noah"
                retail = _validate_float(payload.get("retail_price"), "retail_price")
                prod = _validate_float(payload.get("production_cost"), "production_cost")
                ship_in = _validate_float(payload.get("shipping_charged"), "shipping_charged", default=0.0) or 0.0
                ship_out = _validate_float(payload.get("shipping_cost"), "shipping_cost", default=0.0) or 0.0
                ads_rate = _validate_float(payload.get("offsite_ads_rate"), "offsite_ads_rate", default=0.0, max_val=0.5) or 0.0
                color = _validate_color(payload.get("color"), default="sand")

                zip_bytes = self._build_export_zip(
                    cadre=cadre,
                    title=title,
                    names_str=names_str,
                    retail=retail,
                    prod=prod,
                    shipping_charged=ship_in,
                    shipping_cost=ship_out,
                    offsite_ads_rate=ads_rate,
                    color=color,
                )
                self._send_bytes(
                    200,
                    zip_bytes,
                    "application/zip",
                    extra_headers={"Content-Disposition": f'attachment; filename="etsy_kit_{cadre}.zip"'},
                )
                return

        except ValidationError as exc:
            self._send_json(400, {"error": str(exc), "code": "VALIDATION_ERROR"})
            return

        self._send_json(404, {"error": "Endpoint not found", "path": path})


class ForgeServer:
    """Manages the lifecycle of the Etsy POD Forge HTTP server."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8107, public_dir: Optional[str] = None) -> None:
        self.host = host
        self.port = port
        self.public_dir = public_dir
        self.server: Optional[ThreadingHTTPServer] = None
        self.thread: Optional[threading.Thread] = None

    def start(self, block: bool = True) -> None:
        pub = self.public_dir

        class BoundHandler(ForgeRequestHandler):
            def __init__(self, *args: Any, **kwargs: Any) -> None:
                super().__init__(*args, directory=pub, **kwargs)

        self.server = ThreadingHTTPServer((self.host, self.port), BoundHandler)
        self.port = int(self.server.server_port)
        print(f"● Etsy POD Forge v{__version__} listening on http://{self.host}:{self.port}", flush=True)

        if block:
            try:
                self.server.serve_forever()
            except KeyboardInterrupt:
                self.stop()
        else:
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()

    def stop(self) -> None:
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            print("● Etsy POD Forge Server stopped.", flush=True)


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description=f"Etsy POD Forge HTTP Server (v{__version__})")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8107, help="Port to bind (default: 8107)")
    parser.add_argument("--public-dir", default=None, help="Optional path to public static assets directory")
    args = parser.parse_args(argv)

    server = ForgeServer(host=args.host, port=args.port, public_dir=args.public_dir)
    server.start(block=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
