#!/usr/bin/env python3
"""
City Desk — Hardened Local Publisher & REST Workstation Server (v2.6.0).
Serves 1,000 localized finished pages across 20 trades and 50 US cities.
Zero-dependency Python 3 HTTP server with strict path containment, Host/Origin
allowlists, request bounds, security headers, and dynamic data parity.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, quote, unquote, urlencode, urlparse, urlsplit

VERSION = "2.6.0"
START_TIME = time.time()
BASE_DIR = Path(__file__).resolve().parent
SITE_DIR = (BASE_DIR / "site").resolve()
MAX_BODY_BYTES = 1_048_576  # 1 MiB
ALLOWED_HOSTS = {"127.0.0.1", "localhost", "::1"}
SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")

_CATALOG_CACHE: Dict[str, Any] = {
    "mtime": None,
    "trades": [],
    "cities": [],
    "offers": [],
}


def _lead_log_path() -> Path:
    state_root = os.environ.get("XDG_STATE_HOME") or os.path.join(
        os.path.expanduser("~"), ".local", "state"
    )
    return Path(state_root) / "city-desk" / "leads.jsonl"


def _ensure_site_built() -> None:
    offers_file = SITE_DIR / "offers.json"
    services_file = SITE_DIR / "api" / "services.json"
    if offers_file.is_file() and services_file.is_file():
        return
    build_js = BASE_DIR / "build.js"
    if build_js.is_file():
        try:
            subprocess.run(
                ["node", str(build_js)],
                cwd=str(BASE_DIR),
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=30,
            )
        except Exception:
            pass


def load_catalog() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Load canonical 20 trades, 50 cities, and 1,000 offers from compiled site/ JSON."""
    _ensure_site_built()
    services_file = SITE_DIR / "api" / "services.json"
    offers_file = SITE_DIR / "offers.json"

    try:
        mtime = (
            services_file.stat().st_mtime if services_file.is_file() else 0.0,
            offers_file.stat().st_mtime if offers_file.is_file() else 0.0,
        )
    except OSError:
        mtime = (0.0, 0.0)

    if _CATALOG_CACHE["mtime"] == mtime and _CATALOG_CACHE["trades"]:
        return (
            _CATALOG_CACHE["trades"],
            _CATALOG_CACHE["cities"],
            _CATALOG_CACHE["offers"],
        )

    trades: List[Dict[str, Any]] = []
    cities: List[Dict[str, Any]] = []
    offers: List[Dict[str, Any]] = []

    if services_file.is_file():
        try:
            raw_services = json.loads(services_file.read_text(encoding="utf-8"))
            for item in raw_services.get("trades", []):
                trades.append(
                    {
                        "slug": str(item.get("slug", "")),
                        "name": str(item.get("name", "")),
                        "price": int(item.get("agencyValueUSD", item.get("price", 0))),
                        "line": str(item.get("line", "")),
                    }
                )
        except Exception:
            trades = []

    if offers_file.is_file():
        try:
            raw_offers = json.loads(offers_file.read_text(encoding="utf-8"))
            if isinstance(raw_offers, list):
                offers = raw_offers
                seen_cities: set[str] = set()
                for entry in raw_offers:
                    offer_path = str(entry.get("path", ""))
                    parts = [p for p in offer_path.split("/") if p]
                    city_slug = parts[1] if len(parts) >= 2 and parts[0] == "cities" else ""
                    if city_slug and city_slug not in seen_cities:
                        seen_cities.add(city_slug)
                        cities.append(
                            {
                                "slug": city_slug,
                                "name": str(entry.get("city", "")),
                                "state": str(entry.get("state", "")),
                            }
                        )
        except Exception:
            offers = []
            cities = []

    _CATALOG_CACHE["mtime"] = mtime
    _CATALOG_CACHE["trades"] = trades
    _CATALOG_CACHE["cities"] = cities
    _CATALOG_CACHE["offers"] = offers
    return trades, cities, offers


def validate_host_header(host_header: Optional[str]) -> bool:
    """Strictly allow loopback hosts (127.0.0.1, localhost, [::1]) with optional valid port."""
    if not host_header:
        return False
    raw = host_header.strip()
    if not raw or any(ch.isspace() for ch in raw) or "/" in raw or "@" in raw:
        return False
    try:
        parsed = urlparse(f"http://{raw}")
    except Exception:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if parsed.path or parsed.query or parsed.fragment:
        return False
    hostname = (parsed.hostname or "").lower()
    if hostname not in ALLOWED_HOSTS:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port is not None and not (1 <= port <= 65535):
        return False
    return True


def validate_origin_header(origin_header: Optional[str]) -> Tuple[bool, Optional[str]]:
    """Validate optional Origin header against strict loopback allowlist."""
    if origin_header is None or origin_header.strip() == "":
        return True, None
    origin = origin_header.strip()
    if any(ch.isspace() for ch in origin):
        return False, None
    try:
        parsed = urlparse(origin)
    except Exception:
        return False, None
    if parsed.scheme not in ("http", "https"):
        return False, None
    if parsed.username is not None or parsed.password is not None:
        return False, None
    if parsed.path not in ("", "/") or parsed.params or parsed.query or parsed.fragment:
        return False, None
    hostname = (parsed.hostname or "").lower()
    if hostname not in ALLOWED_HOSTS:
        return False, None
    try:
        port = parsed.port
    except ValueError:
        return False, None
    if port is not None and not (1 <= port <= 65535):
        return False, None
    return True, origin


def resolve_safe_static_path(url_path: str) -> Tuple[Optional[Path], Optional[str]]:
    """
    Canonicalize static URL path and enforce strict SITE_DIR containment.
    Returns (Path, None) when safe, or (None, "forbidden") on traversal/escape attempts.
    """
    if "\x00" in url_path or "\\" in url_path:
        return None, "forbidden"

    decoded = url_path
    for _ in range(3):
        nxt = unquote(decoded)
        if nxt == decoded:
            break
        decoded = nxt

    if "\x00" in decoded or "\\" in decoded:
        return None, "forbidden"

    segments = [seg for seg in decoded.split("/") if seg]
    if any(seg in (".", "..") for seg in segments):
        return None, "forbidden"

    rel = "/".join(segments)
    if not rel:
        candidate = SITE_DIR / "index.html"
    else:
        candidate = SITE_DIR / rel
        if candidate.is_dir():
            candidate = candidate / "index.html"

    try:
        resolved = candidate.resolve(strict=False)
    except OSError:
        return None, "forbidden"

    if not resolved.is_relative_to(SITE_DIR):
        return None, "forbidden"

    return resolved, None


class CityDeskHandler(BaseHTTPRequestHandler):
    server_version = f"CityDesk/{VERSION}"

    def _security_headers(self, allowed_origin: Optional[str] = None) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self' http://127.0.0.1:* http://localhost:*; "
            "base-uri 'self'; "
            "form-action 'self'; "
            "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*",
        )
        self.send_header("Vary", "Origin")
        if allowed_origin:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _check_host_and_origin(self, require_valid_origin: bool = False) -> Tuple[bool, Optional[str]]:
        if not validate_host_header(self.headers.get("Host")):
            self.send_json(
                {"status": "error", "message": "Forbidden Host header"},
                status=403,
                allowed_origin=None,
            )
            return False, None

        origin_ok, allowed_origin = validate_origin_header(self.headers.get("Origin"))
        if not origin_ok and require_valid_origin:
            self.send_json(
                {"status": "error", "message": "Forbidden Origin header"},
                status=403,
                allowed_origin=None,
            )
            return False, None
        return True, allowed_origin if origin_ok else None

    def send_json(
        self,
        payload: Any,
        status: int = 200,
        allowed_origin: Optional[str] = None,
        head_only: bool = False,
    ) -> None:
        raw = json.dumps(payload, indent=2).encode("utf-8")
        self.send_response(status)
        self._security_headers(allowed_origin=allowed_origin)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def _send_bytes(
        self,
        content: bytes,
        content_type: str,
        status: int = 200,
        allowed_origin: Optional[str] = None,
        head_only: bool = False,
    ) -> None:
        self.send_response(status)
        self._security_headers(allowed_origin=allowed_origin)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if not head_only:
            self.wfile.write(content)

    def do_OPTIONS(self) -> None:
        ok, allowed_origin = self._check_host_and_origin(require_valid_origin=True)
        if not ok:
            return
        self.send_response(204)
        self._security_headers(allowed_origin=allowed_origin)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_get(head_only=True)

    def do_GET(self) -> None:
        self._handle_get(head_only=False)

    def _handle_get(self, head_only: bool = False) -> None:
        parsed = urlsplit(self.path)
        url_path = parsed.path or "/"
        is_api = url_path == "/health" or url_path.startswith("/api/")

        ok, allowed_origin = self._check_host_and_origin(require_valid_origin=is_api)
        if not ok:
            return

        trades, cities, offers = load_catalog()
        server_port = getattr(self.server, "server_port", 8087)

        if url_path == "/health":
            self.send_json(
                {
                    "status": "ok",
                    "service": "city-desk",
                    "version": VERSION,
                    "uptime": round(time.time() - START_TIME, 2),
                    "port": server_port,
                    "trades_count": len(trades),
                    "cities_count": len(cities),
                    "total_pages": len(offers),
                    "license": "100% Free & Open Access (Zero Paywalls)",
                },
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        if url_path in ("/api/trades", "/api/services"):
            self.send_json(
                {"status": "ok", "version": VERSION, "count": len(trades), "trades": trades},
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        if url_path == "/api/cities":
            self.send_json(
                {"status": "ok", "version": VERSION, "count": len(cities), "cities": cities},
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        if url_path == "/api/offers":
            qs = parse_qs(parsed.query)
            trade_filter = (qs.get("trade", [""])[0] or "").strip().lower()
            city_filter = (qs.get("city", [""])[0] or "").strip().lower()
            filtered = offers
            if trade_filter:
                filtered = [o for o in filtered if str(o.get("service", "")).lower() == trade_filter]
            if city_filter:
                filtered = [
                    o
                    for o in filtered
                    if f"/cities/{city_filter}/" in str(o.get("path", "")).lower()
                ]
            self.send_json(
                {
                    "status": "ok",
                    "version": VERSION,
                    "count": len(filtered),
                    "offers": filtered,
                },
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        if url_path in ("/api/status", "/api/info"):
            self.send_json(
                {
                    "status": "ok",
                    "service": "city-desk",
                    "version": VERSION,
                    "category": "Growth & SEO",
                    "site_dir": "site",
                    "trades_count": len(trades),
                    "cities_count": len(cities),
                    "pages_indexed": len(offers),
                    "studio_workbench_url": "https://zoth.nullai.tech/tools/city-desk",
                    "local_endpoint": f"http://127.0.0.1:{server_port}",
                    "support_coffee": "https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X",
                },
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        # Serve static discovery JSON under /api/*.json if present; otherwise JSON 404 for unknown /api/*
        if url_path.startswith("/api/"):
            target_api, err = resolve_safe_static_path(url_path)
            if err == "forbidden":
                self.send_json(
                    {"status": "error", "message": "Forbidden path"},
                    status=403,
                    allowed_origin=allowed_origin,
                    head_only=head_only,
                )
                return
            if target_api is not None and target_api.is_file() and target_api.suffix == ".json":
                self._send_bytes(
                    target_api.read_bytes(),
                    "application/json; charset=utf-8",
                    status=200,
                    allowed_origin=allowed_origin,
                    head_only=head_only,
                )
                return
            self.send_json(
                {"status": "error", "message": "API endpoint not found", "path": url_path},
                status=404,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        # Static files with strict path containment
        target_file, err = resolve_safe_static_path(url_path)
        if err == "forbidden":
            self.send_json(
                {"status": "error", "message": "Forbidden path"},
                status=403,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        if target_file is not None and target_file.is_file():
            mime_type, _ = mimetypes.guess_type(str(target_file))
            if target_file.suffix == ".html":
                mime_type = "text/html; charset=utf-8"
            elif target_file.suffix == ".json":
                mime_type = "application/json; charset=utf-8"
            elif target_file.suffix == ".js":
                mime_type = "application/javascript; charset=utf-8"
            elif target_file.suffix == ".css":
                mime_type = "text/css; charset=utf-8"
            elif target_file.suffix in (".txt", ".xml"):
                mime_type = (
                    "application/xml; charset=utf-8"
                    if target_file.suffix == ".xml"
                    else "text/plain; charset=utf-8"
                )
            else:
                mime_type = mime_type or "application/octet-stream"

            self._send_bytes(
                target_file.read_bytes(),
                mime_type,
                status=200,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        not_found = SITE_DIR / "404.html"
        if not_found.is_file():
            self._send_bytes(
                not_found.read_bytes(),
                "text/html; charset=utf-8",
                status=404,
                allowed_origin=allowed_origin,
                head_only=head_only,
            )
            return

        self.send_json(
            {"status": "error", "message": "Page not found", "path": url_path},
            status=404,
            allowed_origin=allowed_origin,
            head_only=head_only,
        )

    def _read_request_body(
        self, allowed_origin: Optional[str], allow_form: bool = False
    ) -> Optional[Dict[str, Any]]:
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            length = 0
        else:
            try:
                length = int(raw_cl.strip())
            except ValueError:
                self.send_json(
                    {"status": "error", "message": "Invalid Content-Length header"},
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return None
            if length < 0:
                self.send_json(
                    {"status": "error", "message": "Negative Content-Length header"},
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return None
            if length > MAX_BODY_BYTES:
                self.send_json(
                    {
                        "status": "error",
                        "message": f"Payload too large (max {MAX_BODY_BYTES} bytes)",
                    },
                    status=413,
                    allowed_origin=allowed_origin,
                )
                return None

        body_bytes = self.rfile.read(length) if length > 0 else b""
        content_type = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()

        if allow_form and content_type == "application/x-www-form-urlencoded":
            try:
                parsed = parse_qs(body_bytes.decode("utf-8"), keep_blank_values=True)
                return {k: (v[0] if isinstance(v, list) and v else "") for k, v in parsed.items()}
            except Exception:
                self.send_json(
                    {"status": "error", "message": "Malformed form payload"},
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return None

        if not body_bytes:
            return {}

        try:
            decoded = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            self.send_json(
                {"status": "error", "message": "Malformed JSON payload"},
                status=400,
                allowed_origin=allowed_origin,
            )
            return None

        if not isinstance(decoded, dict):
            self.send_json(
                {"status": "error", "message": "JSON payload must be an object"},
                status=400,
                allowed_origin=allowed_origin,
            )
            return None

        return decoded

    def do_POST(self) -> None:
        ok, allowed_origin = self._check_host_and_origin(require_valid_origin=True)
        if not ok:
            return

        url_path = urlsplit(self.path).path or "/"
        trades, cities, _ = load_catalog()
        server_port = getattr(self.server, "server_port", 8087)

        if url_path in ("/api/synth", "/api/generate"):
            body = self._read_request_body(allowed_origin=allowed_origin, allow_form=False)
            if body is None:
                return

            trade_slug = str(body.get("trade", "painters")).strip().lower()
            city_slug = str(body.get("city", "boise-id")).strip().lower()
            biz = str(body.get("biz", "Apex Craftsman")).strip()[:120]
            phone = str(body.get("phone", "")).strip()[:40]
            email = str(body.get("email", "")).strip()[:120]

            trade_map = {t["slug"]: t for t in trades}
            city_map = {c["slug"]: c for c in cities}

            if not SLUG_RE.match(trade_slug) or (trade_map and trade_slug not in trade_map):
                self.send_json(
                    {"status": "error", "message": f"Unknown trade slug: {trade_slug}"},
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return

            if not SLUG_RE.match(city_slug) or (city_map and city_slug not in city_map):
                self.send_json(
                    {"status": "error", "message": f"Unknown city slug: {city_slug}"},
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return

            trade_info = trade_map.get(trade_slug, {"slug": trade_slug, "name": trade_slug, "price": 800, "line": ""})
            city_info = city_map.get(city_slug, {"slug": city_slug, "name": city_slug, "state": ""})

            query_params: Dict[str, str] = {}
            if biz:
                query_params["biz"] = biz
            if phone:
                query_params["phone"] = phone
            if email:
                query_params["email"] = email

            qs = f"?{urlencode(query_params)}" if query_params else ""
            preview_url = (
                f"http://127.0.0.1:{server_port}/cities/"
                f"{quote(city_slug, safe='')}/{quote(trade_slug, safe='')}/{qs}"
            )

            self.send_json(
                {
                    "status": "ok",
                    "version": VERSION,
                    "trade": trade_slug,
                    "trade_name": trade_info["name"],
                    "price_usd": trade_info["price"],
                    "city": city_slug,
                    "city_name": city_info["name"],
                    "state": city_info["state"],
                    "biz": biz,
                    "phone": phone,
                    "email": email,
                    "preview_url": preview_url,
                    "timestamp": time.time(),
                },
                status=200,
                allowed_origin=allowed_origin,
            )
            return

        if url_path == "/api/lead":
            body = self._read_request_body(allowed_origin=allowed_origin, allow_form=True)
            if body is None:
                return

            form_name = str(body.get("form-name") or body.get("form_name") or "").strip()[:64]
            contact_name = str(
                body.get("customer_name") or body.get("business_name") or ""
            ).strip()[:120]
            contact_channel = str(
                body.get("customer_phone")
                or body.get("owner_phone")
                or body.get("owner_email")
                or ""
            ).strip()[:120]

            if not form_name or not contact_name or not contact_channel:
                self.send_json(
                    {
                        "status": "error",
                        "message": "Missing required lead fields (form_name, name, and phone or email).",
                    },
                    status=400,
                    allowed_origin=allowed_origin,
                )
                return

            city_val = str(body.get("city", "")).strip()[:80]
            trade_val = str(body.get("trade", "")).strip()[:80]
            received_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            receipt_seed = f"{received_at}:{form_name}:{city_val}:{trade_val}:{time.time_ns()}"
            receipt_id = "cd-" + hashlib.sha256(receipt_seed.encode("utf-8")).hexdigest()[:12]

            # Record anonymized metadata receipt locally (never persist raw PII in repo)
            try:
                log_file = _lead_log_path()
                log_file.parent.mkdir(parents=True, exist_ok=True)
                record = {
                    "receipt_id": receipt_id,
                    "received_at": received_at,
                    "form_name": form_name,
                    "city": city_val,
                    "trade": trade_val,
                    "has_contact": True,
                }
                with open(log_file, "a", encoding="utf-8") as fh:
                    fh.write(json.dumps(record) + "\n")
                try:
                    os.chmod(log_file, 0o600)
                except OSError:
                    pass
            except OSError:
                pass

            self.send_json(
                {
                    "status": "ok",
                    "receipt_id": receipt_id,
                    "form_name": form_name,
                    "city": city_val,
                    "trade": trade_val,
                    "received_at": received_at,
                    "message": "Lead logged locally.",
                },
                status=201,
                allowed_origin=allowed_origin,
            )
            return

        self.send_json(
            {"status": "error", "message": "API endpoint not found", "path": url_path},
            status=404,
            allowed_origin=allowed_origin,
        )

    def log_message(self, format: str, *args: Any) -> None:
        pass


def run_server(host: str = "127.0.0.1", port: int = 8087) -> ThreadingHTTPServer:
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer((host, port), CityDeskHandler)
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="City Desk Local Publisher & Hardened REST Server"
    )
    parser.add_argument("--version", "-v", action="version", version=f"city-desk {VERSION}")
    parser.add_argument(
        "--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port", "-p", type=int, default=8087, help="Port to listen on (default: 8087)"
    )
    parser.add_argument(
        "--status", action="store_true", help="Print service status metadata and exit"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output service metadata as JSON and exit"
    )
    args = parser.parse_args()

    trades_list, cities_list, offers_list = load_catalog()
    if args.status or args.json:
        info = {
            "service": "city-desk",
            "version": VERSION,
            "host": args.host,
            "port": args.port,
            "trades_count": len(trades_list),
            "cities_count": len(cities_list),
            "total_pages": len(offers_list),
        }
        if args.json:
            print(json.dumps(info, indent=2))
        else:
            print(
                f"city-desk v{VERSION} ({args.host}:{args.port}) | "
                f"trades={len(trades_list)} | cities={len(cities_list)} | pages={len(offers_list)}"
            )
        sys.exit(0)

    print(f"City Desk Server v{VERSION} starting on http://{args.host}:{args.port}")
    httpd = run_server(host=args.host, port=args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping City Desk Server...")
        httpd.server_close()
