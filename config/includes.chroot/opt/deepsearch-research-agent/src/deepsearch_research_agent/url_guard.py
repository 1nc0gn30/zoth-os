"""
url_guard.py - Strict SSRF & Scheme Guard for DeepSearch URL Fetching.

Pure Python 3.9-3.13 stdlib. Enforces http/https schemes only, rejects
localhost / .local / .internal hostnames, validates IP literals and DNS
resolutions against loopback, RFC1918, CGNAT, link-local / cloud IMDS,
IPv6 ULA, multicast, unspecified, and reserved ranges, and validates every
HTTP redirect target so 301/302 responses cannot pivot to internal networks.
"""

from __future__ import annotations

import ipaddress
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request
from typing import Optional, Set

ALLOWED_SCHEMES: Set[str] = {"http", "https"}

BLOCKED_HOSTNAMES: Set[str] = {
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "metadata.google.internal",
    "metadata",
    "instance-data",
}

BLOCKED_SUFFIXES = (
    ".localhost",
    ".local",
    ".internal",
    ".home.arpa",
)

# CGNAT 100.64.0.0/10 and additional special-purpose IPv4/IPv6 ranges
_EXTRA_BLOCKED_NETS = (
    ipaddress.ip_network("100.64.0.0/10"),      # RFC 6598 Shared / CGNAT
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud IMDS
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol Assignments
    ipaddress.ip_network("192.0.2.0/24"),       # TEST-NET-1
    ipaddress.ip_network("198.18.0.0/15"),      # Benchmarking
    ipaddress.ip_network("198.51.100.0/24"),    # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),     # TEST-NET-3
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved
    ipaddress.ip_network("fc00::/7"),           # IPv6 Unique Local (ULA)
    ipaddress.ip_network("fe80::/10"),          # IPv6 Link-Local
)

_ORIG_URLOPEN = urllib.request.urlopen


class SSRFBlockedError(PermissionError):
    """Raised when a URL resolves to or targets a forbidden host/network."""


def _is_blocked_ip(ip_obj: ipaddress._BaseAddress) -> bool:
    """Return True if an IPv4/IPv6 address is loopback, private, link-local, or reserved."""
    if isinstance(ip_obj, ipaddress.IPv6Address) and ip_obj.ipv4_mapped is not None:
        if _is_blocked_ip(ip_obj.ipv4_mapped):
            return True
    if (
        ip_obj.is_loopback
        or ip_obj.is_private
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    ):
        return True
    for net in _EXTRA_BLOCKED_NETS:
        if ip_obj.version == net.version and ip_obj in net:
            return True
    return False


def validate_fetch_url(url: str, *, resolve_dns: bool = True) -> str:
    """Validate that a URL is safe for outbound HTTP(S) fetching.

    Raises:
        ValueError: for empty URLs, malformed URLs, or non-http(s) schemes (e.g. file://, ftp://).
        SSRFBlockedError: for localhost, internal domains, or private/loopback/IMDS IPs.

    Returns:
        The normalized safe URL string.
    """
    if not url or not isinstance(url, str) or not url.strip():
        raise ValueError("URL cannot be empty.")

    raw = url.strip()
    if any(c in raw for c in ("\r", "\n", "\x00")):
        raise ValueError("URL contains forbidden control characters.")

    parsed = urllib.parse.urlparse(raw)
    scheme = (parsed.scheme or "").lower()
    if scheme not in ALLOWED_SCHEMES:
        raise ValueError(f"Unsupported URL scheme '{scheme or 'none'}': only http and https are allowed.")

    hostname = (parsed.hostname or "").strip().lower().rstrip(".")
    if not hostname:
        raise ValueError("URL must include a valid hostname.")

    if parsed.username or parsed.password:
        raise ValueError("Embedded credentials in URL are not allowed.")

    if hostname in BLOCKED_HOSTNAMES or any(hostname.endswith(sfx) for sfx in BLOCKED_SUFFIXES):
        raise SSRFBlockedError(f"SSRF guard blocked internal hostname: {hostname}")

    # Direct IP literal check (handles IPv4, IPv6, integer/hex IPv4 via socket.inet_aton)
    try:
        ip_obj = ipaddress.ip_address(hostname)
    except ValueError:
        ip_obj = None

    if ip_obj is not None:
        if _is_blocked_ip(ip_obj):
            raise SSRFBlockedError(f"SSRF guard blocked non-public IP address: {ip_obj}")
        return raw

    # Reject obfuscated numeric IPv4 literals (e.g., 2130706433, 0x7f000001, 127.1)
    try:
        packed = socket.inet_aton(hostname)
        obf_ip = ipaddress.IPv4Address(packed)
        if _is_blocked_ip(obf_ip):
            raise SSRFBlockedError(f"SSRF guard blocked obfuscated internal IP: {hostname}")
    except OSError:
        pass

    if resolve_dns:
        port = parsed.port or (443 if scheme == "https" else 80)
        try:
            infos = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
        except socket.gaierror:
            # If DNS cannot resolve (e.g. offline test with mocked urlopen), allow caller
            # to fail naturally at network open time unless hostname itself was blocked above.
            infos = []
        for info in infos:
            addr = info[4][0]
            try:
                resolved_ip = ipaddress.ip_address(addr.split("%")[0])
            except ValueError:
                continue
            if _is_blocked_ip(resolved_ip):
                raise SSRFBlockedError(
                    f"SSRF guard blocked hostname '{hostname}' resolving to private/internal IP {resolved_ip}"
                )

    return raw


def sanitize_href(url: str) -> str:
    """Allow only safe http:// or https:// href values in rendered HTML."""
    if not url or not isinstance(url, str):
        return "#"
    stripped = url.strip()
    parsed = urllib.parse.urlparse(stripped)
    if (parsed.scheme or "").lower() in ("http", "https") and parsed.netloc:
        return stripped
    return "#"


class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """HTTPRedirectHandler that enforces SSRF URL validation on every redirect hop."""

    max_redirections = 5

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        target = urllib.parse.urljoin(req.full_url, newurl)
        validate_fetch_url(target, resolve_dns=True)
        return super().redirect_request(req, fp, code, msg, headers, target)


def safe_urlopen(
    req: urllib.request.Request,
    *,
    timeout: int = 10,
    context: Optional[ssl.SSLContext] = None,
):
    """Validate URL + redirects against SSRF and open the request.

    Preserves compatibility with unit tests that patch ``urllib.request.urlopen``.
    """
    validate_fetch_url(req.full_url, resolve_dns=True)

    # If a unit test has monkeypatched urllib.request.urlopen, delegate to it
    # after SSRF validation so mocked tests continue to work deterministically.
    if urllib.request.urlopen is not _ORIG_URLOPEN:
        if context is not None:
            return urllib.request.urlopen(req, timeout=timeout, context=context)
        return urllib.request.urlopen(req, timeout=timeout)

    handlers = [SafeRedirectHandler()]
    if context is not None:
        handlers.append(urllib.request.HTTPSHandler(context=context))
    opener = urllib.request.build_opener(*handlers)
    return opener.open(req, timeout=timeout)
