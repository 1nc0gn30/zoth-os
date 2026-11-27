"""Digital Asset Forge - Hardened Loopback Threaded HTTP Server (Port 8118)
Zero-dependency Python 3.10+ Standard Library HTTP, ZIP Export & Static Server.
"""

from pathlib import Path
from typing import Any, Dict, Optional, Set
import http.server
import io
import ipaddress
import json
import math
import mimetypes
import os
import re
import threading
import time
import urllib.parse
import zipfile

from . import __version__
from .ratios import RatioCalculator
from .pack_generator import ArtPackGenerator
from .printing_guide import PrintingGuideGenerator
from .etsy_copywriter import EtsyCopywriter

VERSION = __version__
PORT = int(os.environ.get("ASSET_FORGE_PORT", 8118))
STUDIO_PORT = 3000
MAX_BODY_BYTES = 1048576  # 1 MiB
MAX_TITLE_LEN = 200
MAX_NAME_LEN = 120
START_TIME = time.time()

LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})
CSP_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*"
)

TELEMETRY_LOCK = threading.Lock()
TELEMETRY: Dict[str, Any] = {
    "packs_generated": 0,
    "dpi_audits_performed": 0,
    "etsy_listings_optimized": 0,
    "zip_bundles_exported": 0,
    "cumulative_potential_revenue_usd": 0.0,
}

PUBLIC_DIR = Path(__file__).resolve().parent.parent.parent / "public"


def _allowed_origin_ports(active_port: Optional[int] = None) -> Set[int]:
    return {int(active_port if active_port is not None else PORT), STUDIO_PORT}


def _is_local_host(host_header: Optional[str]) -> bool:
    """Strict loopback Host header allowlist (DNS-rebinding defense)."""
    if not host_header:
        return False
    raw = host_header.strip().lower()
    if not raw or "/" in raw or "@" in raw or " " in raw or "\\" in raw:
        return False
    try:
        parsed = urllib.parse.urlsplit(f"http://{raw}")
    except ValueError:
        return False
    if parsed.hostname not in LOOPBACK_HOSTS:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port is not None and not (1 <= port <= 65535):
        return False
    return True


def _is_local_origin(origin: Optional[str], active_port: Optional[int] = None) -> bool:
    """Browser Origin guard with exact loopback port pinning.
    No Origin header = non-browser client (CLI/agent): allowed.
    Browser Origin must match http(s)://(localhost|127.0.0.1|[::1]):{active_port,3000}.
    """
    if not origin:
        return True
    try:
        u = urllib.parse.urlparse(origin)
    except ValueError:
        return False
    if u.scheme not in ("http", "https"):
        return False
    if u.hostname not in LOOPBACK_HOSTS:
        return False
    try:
        origin_port = u.port
    except ValueError:
        return False
    if origin_port is None:
        return False
    return origin_port in _allowed_origin_ports(active_port)


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    for var in ("ZOTH_BIND_HOST", "HOST"):
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


def _has_path_traversal(raw_path: str) -> bool:
    """Detect raw or percent-encoded path traversal segments or backslashes."""
    if not raw_path or "\x00" in raw_path:
        return True
    candidate = raw_path
    for _ in range(3):
        if "\\" in candidate or "\x00" in candidate:
            return True
        parts = candidate.split("/")
        if any(p == ".." for p in parts):
            return True
        decoded = urllib.parse.unquote(candidate)
        if decoded == candidate:
            break
        candidate = decoded
    return False


def _sanitize_download_slug(title: str) -> str:
    cleaned = re.sub(r"[^a-z0-9_-]+", "-", title.lower().strip())
    cleaned = re.sub(r"-{2,}", "-", cleaned).strip("-_")
    return (cleaned[:60] or "digital-art-pack")


def _validate_text(value: Any, field: str, default: str, max_len: int) -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        raise ValueError(f"Field '{field}' must be a string")
    text = value.strip()
    if len(text) > max_len:
        raise ValueError(f"Field '{field}' exceeds maximum length of {max_len} characters")
    return text or default


def _validate_positive_int(value: Any, field: str, default: int, min_val: int = 1, max_val: int = 100000) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        raise ValueError(f"Field '{field}' must be an integer")
    try:
        num = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Field '{field}' must be a valid integer") from exc
    if num < min_val or num > max_val:
        raise ValueError(f"Field '{field}' must be between {min_val} and {max_val}")
    return num


def _validate_positive_float(value: Any, field: str, default: float, min_val: float = 0.01, max_val: float = 10000.0) -> float:
    if value is None:
        return default
    if isinstance(value, bool):
        raise ValueError(f"Field '{field}' must be a number")
    try:
        num = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Field '{field}' must be a valid number") from exc
    if not math.isfinite(num) or num < min_val or num > max_val:
        raise ValueError(f"Field '{field}' must be a finite number between {min_val} and {max_val}")
    return num


def build_export_bundle_zip(
    artwork_title: str = "Celestial Obsidian Horizon",
    artist_name: str = "1nc0gn30",
    shop_name: str = "NullAI Studio",
    niche: str = "abstract",
    retail_price_usd: float = 6.99,
) -> tuple[bytes, str]:
    """Assemble a real in-memory ZIP bundle with manifest, printing guide, and Etsy listing JSON."""
    manifest = ArtPackGenerator.generate_manifest(artwork_title=artwork_title, artist_name=artist_name)
    guide_md = PrintingGuideGenerator.generate_guide_markdown(artwork_title=artwork_title, shop_name=shop_name)
    listing = EtsyCopywriter.generate_listing(
        artwork_title=artwork_title,
        niche=niche,
        retail_price_usd=retail_price_usd,
    )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", json.dumps(manifest, indent=2).encode("utf-8"))
        zf.writestr("PRINTING_GUIDE.md", guide_md.encode("utf-8"))
        zf.writestr("etsy_listing.json", json.dumps(listing, indent=2).encode("utf-8"))

    slug = _sanitize_download_slug(artwork_title)
    filename = f"{slug}-digital-asset-forge-pack.zip"
    return buf.getvalue(), filename


class AssetForgeHandler(http.server.BaseHTTPRequestHandler):
    """Hardened zero-dependency HTTP Handler for Digital Asset Forge API and Web UI."""

    protocol_version = "HTTP/1.1"

    def log_message(self, format: str, *args: Any) -> None:
        # Keep stdout/stderr clean during daemon/test runs
        return

    def _active_port(self) -> int:
        try:
            return int(self.server.server_port)
        except Exception:
            return PORT

    def _send_security_headers(self) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_POLICY)
        self.send_header("Vary", "Origin")

    def _maybe_send_cors_headers(self) -> None:
        origin = self.headers.get("Origin")
        if origin and _is_local_origin(origin, self._active_port()):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def _send_json(self, data: Any, status: int = 200, head_only: bool = False) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self._send_security_headers()
        self._maybe_send_cors_headers()
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _send_bytes(
        self,
        body: bytes,
        content_type: str,
        status: int = 200,
        head_only: bool = False,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self._send_security_headers()
        self._maybe_send_cors_headers()
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _check_host(self, head_only: bool = False) -> bool:
        if not _is_local_host(self.headers.get("Host")):
            self._send_json({"error": "untrusted Host header blocked"}, status=403, head_only=head_only)
            return False
        return True

    def _serve_static(self, raw_path: str, head_only: bool = False) -> None:
        if _has_path_traversal(raw_path):
            self._send_json({"error": "path traversal blocked"}, status=403, head_only=head_only)
            return

        decoded_path = urllib.parse.unquote(raw_path)
        if decoded_path == "/":
            rel = "index.html"
        else:
            rel = decoded_path.lstrip("/")

        if rel.startswith("api/") or rel == "api":
            self._send_json({"error": f"Endpoint not found: {decoded_path}"}, status=404, head_only=head_only)
            return

        public_root = PUBLIC_DIR.resolve()
        try:
            target = (public_root / rel).resolve()
        except Exception:
            self._send_json({"error": "invalid path"}, status=403, head_only=head_only)
            return

        if target != public_root and public_root not in target.parents:
            self._send_json({"error": "path traversal blocked"}, status=403, head_only=head_only)
            return

        if target.is_dir():
            self._send_json({"error": "directory listing disabled"}, status=403, head_only=head_only)
            return

        if not target.is_file():
            self._send_json({"error": f"Not found: {decoded_path}"}, status=404, head_only=head_only)
            return

        ctype, _ = mimetypes.guess_type(str(target))
        if target.suffix == ".ico":
            ctype = "image/x-icon"
        elif target.suffix == ".svg":
            ctype = "image/svg+xml"
        elif target.suffix == ".js" or target.suffix == ".mjs":
            ctype = "application/javascript; charset=utf-8"
        elif target.suffix == ".css":
            ctype = "text/css; charset=utf-8"
        elif target.suffix == ".html":
            ctype = "text/html; charset=utf-8"
        elif target.suffix == ".json":
            ctype = "application/json; charset=utf-8"
        elif target.suffix == ".xml":
            ctype = "application/xml; charset=utf-8"
        elif target.suffix == ".txt":
            ctype = "text/plain; charset=utf-8"
        elif not ctype:
            ctype = "application/octet-stream"

        data = target.read_bytes()
        cache_hdr = "no-cache" if target.suffix in (".html", ".js", ".css") else "public, max-age=3600"
        self._send_bytes(data, ctype, status=200, head_only=head_only, extra_headers={"Cache-Control": cache_hdr})

    def _handle_get_or_head(self, head_only: bool = False) -> None:
        if not self._check_host(head_only=head_only):
            return

        parsed = urllib.parse.urlsplit(self.path)
        raw_path = parsed.path

        if _has_path_traversal(raw_path):
            self._send_json({"error": "path traversal blocked"}, status=403, head_only=head_only)
            return

        if raw_path in ("/health", "/api/health"):
            self._send_json(
                {
                    "status": "healthy",
                    "service": "digital-asset-forge",
                    "version": VERSION,
                    "port": self._active_port(),
                    "uptime_seconds": round(time.time() - START_TIME, 1),
                },
                status=200,
                head_only=head_only,
            )
            return

        if raw_path == "/api/stats":
            with TELEMETRY_LOCK:
                snapshot = dict(TELEMETRY)
            self._send_json(
                {
                    "service": "digital-asset-forge",
                    "version": VERSION,
                    "telemetry": snapshot,
                    "uptime_seconds": round(time.time() - START_TIME, 1),
                },
                status=200,
                head_only=head_only,
            )
            return

        if raw_path == "/api/ratios":
            families = RatioCalculator.get_all_families()
            self._send_json(
                {
                    "count": len(families),
                    "ratio_families": families,
                },
                status=200,
                head_only=head_only,
            )
            return

        self._serve_static(raw_path, head_only=head_only)

    def do_OPTIONS(self) -> None:
        if not self._check_host():
            return
        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin, self._active_port()):
            self._send_json({"error": "cross-origin preflight blocked"}, status=403)
            return
        self.send_response(204)
        self.send_header("Content-Length", "0")
        self.send_header("Access-Control-Max-Age", "86400")
        self._send_security_headers()
        self._maybe_send_cors_headers()
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_get_or_head(head_only=True)

    def do_GET(self) -> None:
        self._handle_get_or_head(head_only=False)

    def do_POST(self) -> None:
        if not self._check_host():
            return

        origin = self.headers.get("Origin")
        if not _is_local_origin(origin, self._active_port()):
            self._send_json({"error": "cross-origin request blocked"}, status=403)
            return

        parsed = urllib.parse.urlsplit(self.path)
        raw_path = parsed.path

        if _has_path_traversal(raw_path):
            self._send_json({"error": "path traversal blocked"}, status=403)
            return

        raw_cl = self.headers.get("Content-Length", "0")
        try:
            content_length = int(raw_cl)
        except (TypeError, ValueError):
            self._send_json({"error": "Invalid Content-Length header"}, status=400)
            return

        if content_length < 0:
            self._send_json({"error": "Negative Content-Length header"}, status=400)
            return

        if content_length > MAX_BODY_BYTES:
            self._send_json(
                {"error": f"Payload exceeds {MAX_BODY_BYTES} byte limit"},
                status=413,
            )
            self.close_connection = True
            return

        try:
            post_body = self.rfile.read(content_length) if content_length > 0 else b""
            payload = json.loads(post_body.decode("utf-8")) if post_body else {}
        except Exception as exc:
            self._send_json({"error": f"Invalid JSON payload: {str(exc)}"}, status=400)
            return

        if not isinstance(payload, dict):
            self._send_json({"error": "JSON payload must be an object"}, status=400)
            return

        try:
            if raw_path == "/api/generate_pack":
                title = _validate_text(payload.get("artwork_title"), "artwork_title", "Celestial Obsidian Horizon", MAX_TITLE_LEN)
                artist = _validate_text(payload.get("artist_name"), "artist_name", "1nc0gn30", MAX_NAME_LEN)
                manifest = ArtPackGenerator.generate_manifest(artwork_title=title, artist_name=artist)
                with TELEMETRY_LOCK:
                    TELEMETRY["packs_generated"] += 1
                    TELEMETRY["cumulative_potential_revenue_usd"] = round(
                        TELEMETRY["cumulative_potential_revenue_usd"] + 6.99 * 50, 2
                    )
                self._send_json({"manifest": manifest, "status": "success"}, status=200)
                return

            if raw_path == "/api/printing_guide":
                title = _validate_text(payload.get("artwork_title"), "artwork_title", "Celestial Obsidian Horizon", MAX_TITLE_LEN)
                shop = _validate_text(payload.get("shop_name"), "shop_name", "NullAI Studio", MAX_NAME_LEN)
                guide = PrintingGuideGenerator.generate_guide_payload(artwork_title=title, shop_name=shop)
                self._send_json({"printing_guide": guide, "status": "success"}, status=200)
                return

            if raw_path == "/api/etsy_copy":
                title = _validate_text(payload.get("artwork_title"), "artwork_title", "Celestial Obsidian Horizon", MAX_TITLE_LEN)
                niche = _validate_text(payload.get("niche"), "niche", "abstract", 40)
                price = _validate_positive_float(payload.get("retail_price_usd"), "retail_price_usd", 6.99, 0.50, 5000.0)
                listing = EtsyCopywriter.generate_listing(
                    artwork_title=title, niche=niche, retail_price_usd=price
                )
                with TELEMETRY_LOCK:
                    TELEMETRY["etsy_listings_optimized"] += 1
                self._send_json({"listing": listing, "status": "success"}, status=200)
                return

            if raw_path == "/api/validate_dpi":
                w_px = _validate_positive_int(payload.get("pixel_width"), "pixel_width", 7200, 1, 200000)
                h_px = _validate_positive_int(payload.get("pixel_height"), "pixel_height", 10800, 1, 200000)
                w_in = _validate_positive_float(payload.get("target_width_inches"), "target_width_inches", 24.0, 0.1, 1000.0)
                h_in = _validate_positive_float(payload.get("target_height_inches"), "target_height_inches", 36.0, 0.1, 1000.0)
                report = RatioCalculator.validate_dpi_quality(w_px, h_px, w_in, h_in)
                with TELEMETRY_LOCK:
                    TELEMETRY["dpi_audits_performed"] += 1
                self._send_json({"dpi_report": report, "status": "success"}, status=200)
                return

            if raw_path == "/api/export_bundle":
                title = _validate_text(payload.get("artwork_title"), "artwork_title", "Celestial Obsidian Horizon", MAX_TITLE_LEN)
                artist = _validate_text(payload.get("artist_name"), "artist_name", "1nc0gn30", MAX_NAME_LEN)
                shop = _validate_text(payload.get("shop_name"), "shop_name", artist, MAX_NAME_LEN)
                niche = _validate_text(payload.get("niche"), "niche", "abstract", 40)
                price = _validate_positive_float(payload.get("retail_price_usd"), "retail_price_usd", 6.99, 0.50, 5000.0)
                zip_bytes, filename = build_export_bundle_zip(
                    artwork_title=title,
                    artist_name=artist,
                    shop_name=shop,
                    niche=niche,
                    retail_price_usd=price,
                )
                with TELEMETRY_LOCK:
                    TELEMETRY["zip_bundles_exported"] += 1
                self._send_bytes(
                    zip_bytes,
                    "application/zip",
                    status=200,
                    extra_headers={
                        "Content-Disposition": f'attachment; filename="{filename}"',
                        "Cache-Control": "no-cache, no-store, must-revalidate",
                    },
                )
                return

            self._send_json({"error": f"Endpoint not found: {raw_path}"}, status=404)
        except ValueError as exc:
            self._send_json({"error": str(exc)}, status=400)
        except Exception:
            self._send_json({"error": "Internal request processing error"}, status=500)


class ReusableThreadingHTTPServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def create_server(port: int = PORT, host: Optional[str] = None) -> ReusableThreadingHTTPServer:
    bind_host = host or _default_bind_host()
    return ReusableThreadingHTTPServer((bind_host, port), AssetForgeHandler)


def run_server(port: int = PORT, host: Optional[str] = None) -> None:
    bind_host = host or _default_bind_host()
    httpd = create_server(port=port, host=bind_host)
    print(f"Digital Asset Forge v{VERSION} listening on http://{bind_host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Digital Asset Forge gracefully...")
        httpd.server_close()


if __name__ == "__main__":
    import argparse

    _ap = argparse.ArgumentParser(description="Run the Digital Asset Forge HTTP server and web UI")
    _ap.add_argument(
        "--host",
        default=None,
        help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST; use 0.0.0.0 only on trusted networks)",
    )
    _ap.add_argument("--port", type=int, default=PORT)
    _a = _ap.parse_args()
    run_server(port=_a.port, host=_a.host)
