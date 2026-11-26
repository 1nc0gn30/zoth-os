"""SSRF Defense-in-Depth & Safe URL Fetcher for cwv-speed-engine.

Enforces strict security invariants across HTTP API, Analyzer, and MCP contexts:
  1. Strict scheme allowlist: ONLY http and https are permitted.
     (Explicitly rejects file://, ftp://, gopher://, data:, javascript:, etc.)
  2. Hostname & DNS resolution guard via socket.getaddrinfo():
     Every resolved IP address (including IPv4-mapped IPv6) must be globally routable
     (blocks loopback, private RFC1918, link-local/cloud metadata 169.254.169.254,
     CGNAT, multicast, reserved, and unspecified ranges).
  3. Redirect-hop validation via SafeRedirectHandler (max 3 hops, every redirect
     Location re-validated against scheme + DNS/IP rules before connecting).
  4. Bounded response body read (2 MiB cap), safe bounded gzip/deflate decompression,
     and strict 5-second timeout.
"""

from __future__ import annotations

import ipaddress
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
import zlib
from typing import Dict, Optional, Tuple

ALLOWED_SCHEMES = frozenset({"http", "https"})
MAX_RESPONSE_BYTES = 2 * 1024 * 1024  # 2 MiB hard cap
DEFAULT_TIMEOUT_SECONDS = 5.0
MAX_REDIRECTS = 3

BLOCKED_HOSTNAMES = frozenset({
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "metadata.google.internal",
    "metadata.goog",
    "instance-data",
})

BLOCKED_HOST_SUFFIXES = (
    ".localhost",
    ".local",
    ".internal",
    ".home.arpa",
)


class SSRFBlockedError(ValueError):
    """Raised when a target URL violates SSRF or scheme security policies."""

    def __init__(self, message: str, status_code: int = 403, reason: str = "ssrf_blocked") -> None:
        super().__init__(message)
        self.status_code = status_code
        self.reason = reason


def _assert_ip_is_global(ip_str: str) -> None:
    """Validate that an IP address string is strictly globally routable."""
    # Strip IPv6 zone identifier (e.g. fe80::1%eth0)
    cleaned = ip_str.split("%", 1)[0].strip("[]")
    try:
        ip_obj = ipaddress.ip_address(cleaned)
    except ValueError as exc:
        raise SSRFBlockedError(
            f"Blocked malformed IP address: {ip_str}",
            status_code=400,
            reason="invalid_ip",
        ) from exc

    candidates = [ip_obj]
    if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped is not None:
        candidates.append(ip_obj.ipv4_mapped)

    for candidate in candidates:
        if (
            not candidate.is_global
            or candidate.is_private
            or candidate.is_loopback
            or candidate.is_link_local
            or candidate.is_multicast
            or candidate.is_reserved
            or candidate.is_unspecified
        ):
            raise SSRFBlockedError(
                f"Blocked non-public target IP address ({candidate}). "
                "Loopback, private RFC1918, link-local, and cloud metadata endpoints are prohibited.",
                status_code=403,
                reason="non_global_ip",
            )


def validate_url(url: str, *, resolve_dns: bool = True) -> str:
    """Validate a URL against scheme, hostname, and resolved IP allowlists.

    Returns the normalized http/https URL string if safe, or raises SSRFBlockedError.
    """
    if not isinstance(url, str) or not url.strip():
        raise SSRFBlockedError("Target URL must be a non-empty string.", status_code=400, reason="empty_url")

    raw = url.strip()
    if any(ch in raw for ch in ("\r", "\n", "\x00")):
        raise SSRFBlockedError("Target URL contains illegal control characters.", status_code=400, reason="invalid_url")

    parsed = urllib.parse.urlparse(raw)

    # Explicit scheme check: if any scheme is present, it MUST be http or https.
    if parsed.scheme:
        scheme = parsed.scheme.lower()
        if scheme not in ALLOWED_SCHEMES:
            raise SSRFBlockedError(
                f"Disallowed URL scheme '{scheme}://'. Only http:// and https:// URLs are permitted.",
                status_code=400,
                reason="disallowed_scheme",
            )
    else:
        # Reject schemeless paths or pseudo-schemes with colons before first slash
        first_seg = raw.split("/", 1)[0]
        if raw.startswith("/") or ":" in first_seg:
            raise SSRFBlockedError(
                "Invalid or disallowed URL scheme. Provide a full http:// or https:// URL.",
                status_code=400,
                reason="disallowed_scheme",
            )
        raw = f"https://{raw}"
        parsed = urllib.parse.urlparse(raw)

    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise SSRFBlockedError(
            f"Disallowed URL scheme '{parsed.scheme}'. Only http and https are permitted.",
            status_code=400,
            reason="disallowed_scheme",
        )

    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname:
        raise SSRFBlockedError("Target URL is missing a valid hostname.", status_code=400, reason="missing_host")

    if hostname in BLOCKED_HOSTNAMES or any(hostname.endswith(sfx) for sfx in BLOCKED_HOST_SUFFIXES):
        raise SSRFBlockedError(
            f"Blocked restricted hostname '{hostname}'. Localhost and internal domains are prohibited.",
            status_code=403,
            reason="blocked_hostname",
        )

    # Validate explicit port if supplied
    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    except ValueError as exc:
        raise SSRFBlockedError("Invalid port number in target URL.", status_code=400, reason="invalid_port") from exc

    if port < 1 or port > 65535:
        raise SSRFBlockedError("Port number out of valid range (1-65535).", status_code=400, reason="invalid_port")

    # Direct IP literal check (handles IPv4, IPv6, and integer/octal/hex IPv4 encodings)
    try:
        ipaddress.ip_address(hostname.split("%", 1)[0])
        is_literal_ip = True
    except ValueError:
        is_literal_ip = False

    if is_literal_ip:
        _assert_ip_is_global(hostname)
        return raw

    # Reject integer/short-form IPv4 literals (e.g. http://2130706433 or http://0x7f000001)
    try:
        packed = socket.inet_aton(hostname)
        dotted = socket.inet_ntoa(packed)
        _assert_ip_is_global(dotted)
        return raw
    except OSError:
        pass

    if resolve_dns:
        try:
            infos = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
        except socket.gaierror as exc:
            raise SSRFBlockedError(
                f"Target hostname '{hostname}' could not be resolved.",
                status_code=400,
                reason="dns_resolution_failed",
            ) from exc

        if not infos:
            raise SSRFBlockedError(
                f"Target hostname '{hostname}' returned no DNS records.",
                status_code=400,
                reason="dns_empty",
            )

        for info in infos:
            sockaddr = info[4]
            resolved_ip = sockaddr[0]
            _assert_ip_is_global(resolved_ip)

    return raw


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Custom HTTP redirect handler that re-validates every redirect hop via url_guard."""

    def __init__(self, max_redirects: int = MAX_REDIRECTS) -> None:
        super().__init__()
        self.max_redirects = max_redirects

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        hops = getattr(req, "_cwv_redirect_hops", 0) + 1
        if hops > self.max_redirects:
            raise SSRFBlockedError(
                f"Blocked redirect chain exceeding maximum {self.max_redirects} hops.",
                status_code=403,
                reason="too_many_redirects",
            )

        resolved_target = urllib.parse.urljoin(req.full_url, newurl)
        validated_target = validate_url(resolved_target, resolve_dns=True)

        new_req = super().redirect_request(req, fp, code, msg, headers, validated_target)
        if new_req is not None:
            setattr(new_req, "_cwv_redirect_hops", hops)
        return new_req


def _safe_decompress(raw_bytes: bytes, encoding: str, max_bytes: int) -> bytes:
    """Safely decompress gzip/deflate payloads with a strict output size cap."""
    enc = (encoding or "").lower().strip()
    if "gzip" in enc:
        try:
            decompressor = zlib.decompressobj(16 + zlib.MAX_WBITS)
            return decompressor.decompress(raw_bytes, max_bytes)
        except Exception:
            return raw_bytes
    if "deflate" in enc:
        try:
            decompressor = zlib.decompressobj()
            return decompressor.decompress(raw_bytes, max_bytes)
        except Exception:
            try:
                decompressor = zlib.decompressobj(-zlib.MAX_WBITS)
                return decompressor.decompress(raw_bytes, max_bytes)
            except Exception:
                return raw_bytes
    return raw_bytes


def safe_fetch_url(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
    max_bytes: int = MAX_RESPONSE_BYTES,
) -> Tuple[bytes, Dict[str, str], float, str]:
    """Fetch a validated public HTTP/HTTPS URL with redirect guardrails and size cap.

    Returns:
        (decoded_or_raw_bytes, lowercased_headers, ttfb_ms, final_url)
    """
    validated_url = validate_url(url, resolve_dns=True)
    effective_timeout = min(max(0.5, float(timeout)), DEFAULT_TIMEOUT_SECONDS)

    req_headers = headers or {
        "User-Agent": "CWV-Speed-Engine/2.6.0 (+https://github.com/1nc0gn30/cwv-speed-engine)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
    }
    req = urllib.request.Request(validated_url, headers=req_headers)
    setattr(req, "_cwv_redirect_hops", 0)

    opener = urllib.request.build_opener(SafeRedirectHandler(max_redirects=MAX_REDIRECTS))

    t0 = time.perf_counter()
    with opener.open(req, timeout=effective_timeout) as response:
        t1 = time.perf_counter()
        ttfb_ms = round((t1 - t0) * 1000.0, 2)

        final_url = response.geturl() if hasattr(response, "geturl") else validated_url
        if final_url and final_url != validated_url:
            validate_url(final_url, resolve_dns=True)

        raw_bytes = response.read(max_bytes)

        resp_headers_obj = getattr(response, "headers", {})
        if hasattr(resp_headers_obj, "items"):
            resp_headers = {k.lower(): v for k, v in resp_headers_obj.items()}
        elif isinstance(resp_headers_obj, dict):
            resp_headers = {k.lower(): v for k, v in resp_headers_obj.items()}
        else:
            resp_headers = {}

        decompressed = _safe_decompress(raw_bytes, resp_headers.get("content-encoding", ""), max_bytes)
        return decompressed, resp_headers, ttfb_ms, final_url
