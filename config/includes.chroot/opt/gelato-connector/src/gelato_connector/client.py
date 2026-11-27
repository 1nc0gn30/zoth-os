"""Gelato Product v3 & Order v4 API Client.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Dependencies.
"""

from __future__ import annotations

import ipaddress
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from . import __version__
from .catalog import GELATO_PRODUCTS, get_product
from .shipping_engine import normalize_country_code, to_iso2_country_code

_BLOCKED_HOSTNAMES = {"localhost", "localhost.localdomain", "metadata.google.internal", "metadata"}
_BLOCKED_SUFFIXES = (".localhost", ".local", ".internal", ".invalid", ".home.arpa")


def validate_public_https_url(url: Any) -> str:
    """Validate that an artwork URL is a public https:// URL, rejecting SSRF & private/loopback hosts."""
    if not isinstance(url, str) or not url.strip():
        raise ValueError("imageUrl must be a non-empty public https:// URL")
    cleaned = url.strip()
    parsed = urllib.parse.urlparse(cleaned)
    if parsed.scheme.lower() != "https":
        raise ValueError("imageUrl must use the https:// scheme (http://, file://, and non-HTTPS schemes are rejected)")
    host = (parsed.hostname or "").strip().lower().rstrip(".")
    if not host:
        raise ValueError("imageUrl must include a valid public hostname")
    if host in _BLOCKED_HOSTNAMES or any(host.endswith(sfx) for sfx in _BLOCKED_SUFFIXES):
        raise ValueError(f"imageUrl host '{host}' is blocked (local/internal hostnames are not permitted)")

    # Reject IP literals in loopback, RFC1918 private, link-local/IMDS, multicast, or reserved space
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None

    if ip is not None:
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise ValueError(f"imageUrl IP '{host}' is blocked (private, loopback, link-local, or reserved IP)")
    else:
        # Public DNS hostnames must contain at least one dot (reject single-label intranet hosts)
        if "." not in host:
            raise ValueError(f"imageUrl host '{host}' must be a fully-qualified public domain")

    return cleaned


class GelatoClient:
    """Gelato Product v3 & Order v4 API Client with Live & Offline Deterministic Modes."""

    # Gelato Product API v3 (catalog listing) & Order API v4 (order submission).
    BASE_URL = "https://product.gelatoapis.com/v3"
    ORDER_API_URL = "https://order.gelatoapis.com/v4/orders"

    OFFLINE_MESSAGE = (
        "GELATO_API_KEY is not set. Live Gelato API calls are disabled; catalog, shipping, "
        "margin, audit and order-payload tools use the bundled offline reference data. "
        "Create a key in the Gelato dashboard (Developer > API Keys) and export GELATO_API_KEY to enable live mode."
    )

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key if api_key is not None else os.environ.get("GELATO_API_KEY", "")
        self.is_live = bool(self.api_key)

    def _request(self, endpoint: str, method: str = "GET", data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make an authenticated HTTP request. Raises when no API key is configured."""
        if not self.is_live:
            raise RuntimeError(self.OFFLINE_MESSAGE)

        url = f"{self.BASE_URL}{endpoint}"
        headers = {
            "X-API-KEY": self.api_key,
            "Content-Type": "application/json",
            "User-Agent": f"gelato-connector/{__version__}"
        }

        body = json.dumps(data).encode("utf-8") if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Gelato API Error {e.code}: {err_body}")
        except Exception as e:
            raise RuntimeError(f"Gelato Connection Error: {e}")

    def get_shop_info(self) -> Dict[str, Any]:
        """Report API connection status. Live mode verifies the key against GET /v3/catalogs."""
        if not self.is_live:
            return {
                "api_connected": False,
                "mode": "OFFLINE",
                "product_api": self.BASE_URL,
                "order_api": self.ORDER_API_URL,
                "error": self.OFFLINE_MESSAGE,
            }
        catalogs = self._request("/catalogs")
        items = catalogs.get("data", catalogs) if isinstance(catalogs, dict) else catalogs
        return {
            "api_connected": True,
            "mode": "LIVE",
            "product_api": self.BASE_URL,
            "order_api": self.ORDER_API_URL,
            "catalogs_count": len(items) if isinstance(items, list) else None,
        }

    def get_catalog(self) -> List[Dict[str, Any]]:
        """List localized Gelato products."""
        if not self.is_live:
            return GELATO_PRODUCTS
        return self._request("/catalogs")

    def create_order_payload(
        self,
        product_id: Any,
        image_url: str,
        recipient_name: str = "Jane Doe",
        address_line: str = "Example Street 1",
        city: str = "Berlin",
        country: str = "DE",
        postal_code: str = "10115",
        order_reference: str = "ORDER-GELATO-8116",
        order_type: str = "draft",
        quantity: int = 1,
        artwork_title: Optional[str] = None,
        currency: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Build schema-valid Gelato Order API v4 payload with SSRF guard and safe 'draft' default."""
        product = get_product(product_id)
        if not product:
            raise LookupError(f"Unknown product ID '{product_id}'")

        validated_url = validate_public_https_url(image_url)

        mode = str(order_type or "draft").strip().lower()
        if mode not in ("draft", "order"):
            raise ValueError("orderType must be 'draft' or 'order'")

        if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
            raise ValueError("quantity must be a positive integer (>= 1)")

        norm_country = normalize_country_code(country)
        iso2_country = to_iso2_country_code(norm_country)

        if currency:
            resolved_currency = str(currency).strip().upper()
        elif norm_country in ("DE", "FR", "IT", "ES", "NL"):
            resolved_currency = "EUR"
        elif norm_country == "UK":
            resolved_currency = "GBP"
        elif norm_country == "CA":
            resolved_currency = "CAD"
        elif norm_country == "AU":
            resolved_currency = "AUD"
        elif norm_country == "JP":
            resolved_currency = "JPY"
        else:
            resolved_currency = "USD"

        clean_name = str(recipient_name or "Jane Doe").strip() or "Jane Doe"
        parts = clean_name.split()
        first_name = parts[0]
        last_name = " ".join(parts[1:]) if len(parts) > 1 else "Recipient"

        ref_id = str(order_reference or "ORDER-GELATO-8116").strip() or "ORDER-GELATO-8116"
        item_entry: Dict[str, Any] = {
            "itemReferenceId": f"ITEM-{product['id']}-01",
            "productUid": product["product_uid"],
            "files": [
                {
                    "type": "default",
                    "url": validated_url
                }
            ],
            "quantity": quantity
        }
        if artwork_title and str(artwork_title).strip():
            item_entry["title"] = str(artwork_title).strip()

        payload: Dict[str, Any] = {
            "orderType": mode,
            "orderReferenceId": ref_id,
            "customerReferenceId": f"CUST-{ref_id}",
            "currency": resolved_currency,
            "shipmentMethodUid": "standard",
            "shippingAddress": {
                "firstName": first_name,
                "lastName": last_name,
                "addressLine1": str(address_line or "Example Street 1").strip(),
                "city": str(city or "Berlin").strip(),
                "country": iso2_country,
                "postCode": str(postal_code or "10115").strip(),
                "email": "customer@example.com"
            },
            "items": [item_entry],
        }
        if artwork_title and str(artwork_title).strip():
            payload["metadata"] = {
                "artworkTitle": str(artwork_title).strip(),
                "productId": product["id"],
                "apiEndpoint": self.ORDER_API_URL,
            }
        return payload
