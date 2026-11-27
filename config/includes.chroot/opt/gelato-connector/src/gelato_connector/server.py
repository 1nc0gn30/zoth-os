"""HTTP & REST API Server for Gelato Connector (v2.6.0).

Port 8116 — Zero external runtime dependencies (100% Python Standard Library).
Enforces strict loopback Host & exact-port Origin allowlists, 4 HTTP security headers,
disabled directory listings, HEAD support, 1 MiB body cap, and strict JSON validation.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

from __future__ import annotations

import json
import math
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from . import __version__
from .artwork_auditor import audit_artwork_dimensions
from .catalog import GELATO_PRODUCTS, get_product, list_products
from .client import GelatoClient
from .margin_engine import calculate_multi_channel_margins
from .mcp_server import TOOLS as MCP_TOOLS
from .shipping_engine import FX_TO_USD, LOCAL_HUBS, get_shipping_quote

MAX_BODY_BYTES = 1024 * 1024  # 1 MiB
STUDIO_PORT = 3000

CSP_POLICY = (
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


def _is_valid_host(host_header: Optional[str], server_port: Optional[int] = None) -> bool:
    """Validate HTTP Host header against loopback hosts (DNS-rebinding protection)."""
    if not host_header:
        return True
    raw = host_header.strip().lower()
    if not raw:
        return False

    hostname: Optional[str] = None
    port: Optional[int] = None

    if raw.startswith("["):
        # IPv6 bracket notation: [::1] or [::1]:8116
        end = raw.find("]")
        if end == -1:
            return False
        hostname = raw[1:end]
        rest = raw[end + 1:]
        if rest:
            if not rest.startswith(":"):
                return False
            try:
                port = int(rest[1:])
            except ValueError:
                return False
    else:
        if ":" in raw:
            parts = raw.rsplit(":", 1)
            hostname = parts[0]
            try:
                port = int(parts[1])
            except ValueError:
                return False
        else:
            hostname = raw

    if hostname not in ("127.0.0.1", "localhost", "::1"):
        return False

    if port is not None and server_port is not None and port != server_port:
        return False
    return True


def _is_local_origin(origin: Optional[str], server_port: Optional[int] = None) -> bool:
    """Exact-port loopback Origin allowlist (CSRF / port-suffix bypass protection).

    No Origin header = non-browser client (CLI/curl/agent): allowed.
    When Origin is present, only exact http://127.0.0.1:<port>, http://localhost:<port>,
    or http://[::1]:<port> matching the bound server port (or Studio :3000) is allowed.
    """
    if not origin:
        return True
    try:
        u = urlparse(origin)
    except ValueError:
        return False

    if u.scheme != "http":
        return False
    if u.hostname not in ("localhost", "127.0.0.1", "::1"):
        return False
    if u.path not in ("", "/") or u.params or u.query or u.fragment or u.username or u.password:
        return False

    allowed_ports = {STUDIO_PORT}
    if server_port is not None:
        allowed_ports.add(int(server_port))
    else:
        allowed_ports.add(8116)

    try:
        port = u.port
    except ValueError:
        return False

    return port in allowed_ports


def _parse_float(value: Any, field: str, min_val: Optional[float] = None) -> float:
    """Strictly parse a finite float (rejecting booleans, NaN, Inf, and bad strings)."""
    if isinstance(value, bool):
        raise ValueError(f"Field '{field}' must be a number, not boolean")
    try:
        num = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"Field '{field}' must be a valid number")
    if not math.isfinite(num):
        raise ValueError(f"Field '{field}' must be a finite number")
    if min_val is not None and num < min_val:
        raise ValueError(f"Field '{field}' must be >= {min_val}")
    return num


def _parse_int(value: Any, field: str, min_val: Optional[int] = None) -> int:
    """Strictly parse an integer (rejecting booleans, floats, and bad strings)."""
    if isinstance(value, bool):
        raise ValueError(f"Field '{field}' must be an integer, not boolean")
    if isinstance(value, float):
        if not value.is_integer():
            raise ValueError(f"Field '{field}' must be an integer")
        num = int(value)
    elif isinstance(value, int):
        num = value
    elif isinstance(value, str) and value.strip().lstrip("+-").isdigit():
        num = int(value.strip())
    else:
        raise ValueError(f"Field '{field}' must be a valid integer")
    if min_val is not None and num < min_val:
        raise ValueError(f"Field '{field}' must be >= {min_val}")
    return num


class GelatoRequestHandler(SimpleHTTPRequestHandler):
    """Handles static files from public/ and JSON API endpoints with hardened security controls."""

    def __init__(self, *args, **kwargs):
        public_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "public"
        )
        super().__init__(*args, directory=public_dir, **kwargs)

    def _server_port(self) -> int:
        return int(self.server.server_address[1])

    def _send_security_headers(self) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_POLICY)
        self.send_header("Vary", "Origin")
        origin = self.headers.get("Origin")
        if origin and _is_local_origin(origin, self._server_port()):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def end_headers(self) -> None:
        self._send_security_headers()
        super().end_headers()

    def _send_json(self, data: Dict[str, Any], status: int = HTTPStatus.OK, head_only: bool = False) -> None:
        """Serialize and send JSON response (or headers only for HEAD)."""
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if not head_only:
            self.wfile.write(payload)

    def _check_access(self, head_only: bool = False) -> bool:
        """Enforce loopback Host and exact-port Origin allowlists on every request."""
        port = self._server_port()
        host_header = self.headers.get("Host")
        if not _is_valid_host(host_header, port):
            self._send_json(
                {"error": "Forbidden Host header (loopback only)"},
                status=HTTPStatus.FORBIDDEN,
                head_only=head_only,
            )
            return False

        origin = self.headers.get("Origin")
        if origin and not _is_local_origin(origin, port):
            self._send_json(
                {"error": "Cross-origin or disallowed port Origin blocked"},
                status=HTTPStatus.FORBIDDEN,
                head_only=head_only,
            )
            return False
        return True

    def list_directory(self, path: str):
        """Disable static directory indexing (returns 403 JSON)."""
        self._send_json({"error": "Directory listing is disabled"}, status=HTTPStatus.FORBIDDEN)
        return None

    def _resolve_api_get(self, path: str, query: Dict[str, Any]) -> Optional[Tuple[int, Dict[str, Any]]]:
        """Resolve JSON API GET/HEAD routes. Returns (status, payload) or None for static files."""
        if path in ("/health", "/api/health"):
            return (HTTPStatus.OK, {
                "status": "healthy",
                "service": "gelato-connector",
                "version": __version__,
                "port": self._server_port(),
                "apiConfigured": bool(os.environ.get("GELATO_API_KEY")),
                "productApi": GelatoClient.BASE_URL,
                "orderApi": GelatoClient.ORDER_API_URL,
                "engine": "Python Standard Library (Zero External Dependencies)",
                "creator": "Neal Frazier Tech (@1nc0gn30)"
            })

        if path == "/api/stats":
            return (HTTPStatus.OK, {
                "service": "gelato-connector",
                "version": __version__,
                "status": "online",
                "port": self._server_port(),
                "productsCount": len(GELATO_PRODUCTS),
                "hubsCount": len(LOCAL_HUBS),
                "activeCountriesCount": len(LOCAL_HUBS),
                "supportedCurrencies": list(FX_TO_USD.keys()),
                "mcpToolsCount": len(MCP_TOOLS),
                "creator": "Neal Frazier Tech (@1nc0gn30)"
            })

        if path == "/api/products":
            category = query.get("category", [None])[0]
            items = list_products(category)
            return (HTTPStatus.OK, {
                "success": True,
                "count": len(items),
                "products": items
            })

        if path.startswith("/api/products/"):
            prod_id = path.split("/")[-1]
            p = get_product(prod_id)
            if p:
                return (HTTPStatus.OK, {"success": True, "product": p})
            return (HTTPStatus.NOT_FOUND, {"error": f"Product '{prod_id}' not found"})

        if path == "/api/hubs":
            return (HTTPStatus.OK, {
                "success": True,
                "count": len(LOCAL_HUBS),
                "fxToUsd": FX_TO_USD,
                "hubs": LOCAL_HUBS
            })

        if path == "/api/mcp/tools":
            return (HTTPStatus.OK, {
                "success": True,
                "service": "gelato-connector",
                "version": __version__,
                "count": len(MCP_TOOLS),
                "tools": MCP_TOOLS
            })

        if path == "/api/shop":
            return (HTTPStatus.OK, {
                "success": True,
                "shop": GelatoClient().get_shop_info()
            })

        return None

    def do_OPTIONS(self) -> None:
        """Handle CORS pre-flight requests after enforcing Host and Origin allowlists."""
        if not self._check_access(head_only=False):
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        """Handle HEAD requests for API and static endpoints."""
        if not self._check_access(head_only=True):
            return
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        api_resp = self._resolve_api_get(path, query)
        if api_resp is not None:
            status, payload = api_resp
            return self._send_json(payload, status=status, head_only=True)

        super().do_HEAD()

    def do_GET(self) -> None:
        """Handle GET requests for API endpoints and static assets."""
        if not self._check_access(head_only=False):
            return
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        query = parse_qs(parsed.query)

        api_resp = self._resolve_api_get(path, query)
        if api_resp is not None:
            status, payload = api_resp
            return self._send_json(payload, status=status, head_only=False)

        super().do_GET()

    def do_POST(self) -> None:
        """Handle POST calculation, audit, and Order API v4 payload requests."""
        if not self._check_access(head_only=False):
            return

        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")

        try:
            raw_len = self.headers.get("Content-Length", "0")
            content_length = int(raw_len)
            if content_length < 0:
                return self._send_json({"error": "Invalid Content-Length"}, status=HTTPStatus.BAD_REQUEST)
        except ValueError:
            return self._send_json({"error": "Invalid Content-Length header"}, status=HTTPStatus.BAD_REQUEST)

        if content_length > MAX_BODY_BYTES:
            return self._send_json(
                {"error": "Payload exceeds 1MB limit"},
                status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )

        try:
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            return self._send_json({"error": f"Invalid JSON body: {str(e)}"}, status=HTTPStatus.BAD_REQUEST)

        if not isinstance(body, dict):
            return self._send_json({"error": "JSON body must be an object"}, status=HTTPStatus.BAD_REQUEST)

        try:
            # Margin Calculation
            if path == "/api/margins":
                prod_id = body.get("productId", "acrylic_print_16x24")
                retail = _parse_float(body.get("retailPrice", 68.00), "retailPrice", min_val=0.0)
                currency = str(body.get("currency", "USD"))
                dest = str(body.get("destinationCountry", "US"))
                quantity = _parse_int(body.get("quantity", 1), "quantity", min_val=1)

                res = calculate_multi_channel_margins(
                    product_id=prod_id,
                    retail_price=retail,
                    currency=currency,
                    destination_country=dest,
                    quantity=quantity,
                )
                return self._send_json({"success": True, "margins": res})

            # Shipping Quote
            if path == "/api/shipping":
                prod_id = body.get("productId", "acrylic_print_16x24")
                dest = str(body.get("destinationCountry", "US"))
                is_express = bool(body.get("isExpress", False))
                quantity = _parse_int(body.get("quantity", 1), "quantity", min_val=1)

                quote = get_shipping_quote(prod_id, dest, is_express, quantity)
                return self._send_json({"success": True, "shipping": quote})

            # Artwork Auditor
            if path == "/api/audit":
                prod_id = body.get("productId", "acrylic_print_16x24")
                w = _parse_int(body.get("widthPx", 4800), "widthPx", min_val=1)
                h = _parse_int(body.get("heightPx", 7200), "heightPx", min_val=1)
                name = str(body.get("fileName", "masterpiece.png"))

                audit = audit_artwork_dimensions(prod_id, w, h, name)
                return self._send_json({"success": True, "audit": audit})

            # Order API v4 Payload Generator
            if path == "/api/create-payload":
                prod_id = body.get("productId", "acrylic_print_16x24")
                image_url = body.get("imageUrl", "https://example.com/artwork.png")
                name = str(body.get("recipientName", "Jane Doe"))
                address = str(body.get("addressLine", "Example Street 1"))
                city = str(body.get("city", "Berlin"))
                country = str(body.get("country", "DE"))
                postal = str(body.get("postalCode", "10115"))
                order_type = str(body.get("orderType", "draft"))
                order_ref = str(body.get("orderReferenceId", "ORDER-GELATO-8116"))
                quantity = _parse_int(body.get("quantity", 1), "quantity", min_val=1)
                artwork_title = body.get("artworkTitle") or body.get("title")
                currency = body.get("currency")

                order_payload = GelatoClient().create_order_payload(
                    product_id=prod_id,
                    image_url=image_url,
                    recipient_name=name,
                    address_line=address,
                    city=city,
                    country=country,
                    postal_code=postal,
                    order_reference=order_ref,
                    order_type=order_type,
                    quantity=quantity,
                    artwork_title=artwork_title,
                    currency=currency,
                )
                return self._send_json({"success": True, "gelato_order_payload": order_payload})

            return self._send_json({"error": f"Path not found: {path}"}, status=HTTPStatus.NOT_FOUND)
        except LookupError as e:
            return self._send_json({"error": str(e)}, status=HTTPStatus.NOT_FOUND)
        except ValueError as e:
            return self._send_json({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)


class GelatoHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def run_server(port: int = 8116, host: str = "127.0.0.1") -> None:
    """Start the Gelato Connector HTTP daemon."""
    server_address = (host, port)
    httpd = GelatoHTTPServer(server_address, GelatoRequestHandler)
    print(f"Gelato Connector v{__version__} listening on http://{host}:{httpd.server_address[1]}")
    print("   • Endpoints: /health, /api/stats, /api/products, /api/hubs, /api/mcp/tools, /api/margins, /api/shipping, /api/audit, /api/create-payload")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] Shutting down Gelato Connector server gracefully...")
        httpd.server_close()
