"""Shared security primitives for AZOTH Local Archon Agent (v3.1.0).

Provides:
- Loopback Host & Origin validation (DNS rebinding & cross-origin CSRF defense)
- Per-boot CSPRNG session token generation and constant-time verification
- Strict Path containment via Path.resolve().is_relative_to() with symlink escape rejection
- Public HTTP/HTTPS SSRF guard (blocks file://, loopback, RFC1918, link-local/IMDS, tailnet)
- Strict package-name validation
"""

from __future__ import annotations

import hmac
import ipaddress
import os
import re
import secrets
import socket
import urllib.parse
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
TOKEN_FILE = ROOT / ".azoth_session_token"
LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}

PACKAGE_NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._+-]{0,80}$")

# Blocked CIDR blocks for SSRF defense
_BLOCKED_NETS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("100.64.0.0/10"),  # CGNAT / Tailscale
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("ff00::/8"),
]

_BOOT_TOKEN: Optional[str] = None


def get_api_token() -> str:
    """Return active session API token (env override or CSPRNG per-boot token)."""
    global _BOOT_TOKEN
    env_tok = os.getenv("AZOTH_API_TOKEN", "").strip()
    if env_tok:
        return env_tok
    if _BOOT_TOKEN is None:
        _BOOT_TOKEN = secrets.token_hex(32)
        try:
            fd = os.open(str(TOKEN_FILE), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            try:
                os.write(fd, (_BOOT_TOKEN + "\n").encode("utf-8"))
            finally:
                os.close(fd)
            os.chmod(TOKEN_FILE, 0o600)
        except Exception:
            pass
    return _BOOT_TOKEN


def extract_request_token(headers: dict[str, str], query_token: Optional[str] = None) -> Optional[str]:
    """Extract token from X-Azoth-Token, Authorization: Bearer, or explicit query_token."""
    x_tok = headers.get("x-azoth-token", "").strip()
    if x_tok:
        return x_tok
    auth = headers.get("authorization", "").strip()
    if auth.lower().startswith("bearer "):
        cand = auth[7:].strip()
        if cand:
            return cand
    if query_token and query_token.strip():
        return query_token.strip()
    return None


def verify_api_token(provided: Optional[str]) -> bool:
    """Constant-time verification against active session API token."""
    if not provided:
        return False
    expected = get_api_token()
    return hmac.compare_digest(provided.strip(), expected)


def _allowed_extra_hosts() -> set[str]:
    raw = os.getenv("AZOTH_ALLOWED_HOSTS", "")
    return {h.strip().lower() for h in raw.split(",") if h.strip()}


def is_valid_host_header(host_header: str, authenticated: bool = False) -> bool:
    """Validate HTTP Host header strictly against loopback (or explicit opt-in when authenticated)."""
    if not host_header:
        return False
    raw = host_header.strip()
    if not raw or any(ch in raw for ch in (" ", "\t", "\r", "\n", "/", "\\", "@")):
        return False

    hostname: Optional[str] = None
    port_str: Optional[str] = None

    if raw.startswith("["):
        end_idx = raw.find("]")
        if end_idx == -1:
            return False
        hostname = raw[1:end_idx].lower()
        rest = raw[end_idx + 1 :]
        if rest:
            if not rest.startswith(":"):
                return False
            port_str = rest[1:]
    else:
        if raw.count(":") > 1:
            return False
        if ":" in raw:
            hostname, port_str = raw.rsplit(":", 1)
            hostname = hostname.lower()
        else:
            hostname = raw.lower()

    if port_str is not None:
        if not port_str.isdigit():
            return False
        port_num = int(port_str)
        if not (1 <= port_num <= 65535):
            return False

    if hostname in LOOPBACK_HOSTS:
        return True
    if authenticated and hostname in _allowed_extra_hosts():
        return True
    return False


def parse_allowed_origin(origin: str) -> Optional[str]:
    """Strictly parse and allowlist loopback Origins (rejecting port-suffix spoofs & credentials).

    Returns canonical 'scheme://netloc' if allowed, else None.
    """
    if not origin:
        return None
    raw = origin.strip()
    if any(ch in raw for ch in (" ", "\t", "\r", "\n")):
        return None
    try:
        u = urllib.parse.urlparse(raw)
    except Exception:
        return None

    if u.scheme not in ("http", "https"):
        return None
    if u.username is not None or u.password is not None:
        return None
    if u.path not in ("", "/") or u.params or u.query or u.fragment:
        return None

    host = (u.hostname or "").lower()
    if host not in LOOPBACK_HOSTS:
        return None

    try:
        port = u.port
    except ValueError:
        # Rejects spoofs such as http://127.0.0.1:8136.example.invalid
        return None

    if port is not None and not (1 <= port <= 65535):
        return None

    canonical_host = f"[{host}]" if ":" in host else host
    expected_netloc = f"{canonical_host}:{port}" if port is not None else canonical_host
    if u.netloc.lower() != expected_netloc:
        return None

    return f"{u.scheme}://{expected_netloc}"


def resolve_contained_path(
    input_path: str | Path,
    base_dir: Path,
    extra_allowed_dirs: Optional[list[Path]] = None,
) -> Path:
    """Resolve a path strictly inside base_dir (or extra_allowed_dirs) via is_relative_to().

    Rejects NUL bytes, '..' traversal, sibling-prefix bypasses, and symlinks escaping base_dir.
    """
    raw = str(input_path)
    if "\x00" in raw or not raw.strip():
        raise PermissionError("Invalid empty or NUL-containing path.")

    bases = [base_dir.resolve()]
    if extra_allowed_dirs:
        bases.extend(d.resolve() for d in extra_allowed_dirs)

    candidate = Path(raw)
    if not candidate.is_absolute():
        candidate = bases[0] / candidate

    # Reject any symlink along the chain whose resolved target escapes allowed roots
    probe = candidate
    checked = 0
    while checked < 64:
        if probe.is_symlink():
            target_resolved = probe.resolve(strict=False)
            if not any(target_resolved.is_relative_to(b) for b in bases):
                raise PermissionError(f"Symlink '{input_path}' escapes the sandbox workspace.")
        if probe == probe.parent:
            break
        probe = probe.parent
        checked += 1

    resolved = candidate.resolve(strict=False)
    if not any(resolved.is_relative_to(b) for b in bases):
        raise PermissionError(f"Path '{input_path}' is outside the sandbox workspace.")
    return resolved


def _is_blocked_ip(ip_str: str) -> bool:
    try:
        ip_obj = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_multicast or ip_obj.is_reserved or ip_obj.is_unspecified:
        return True
    return any(ip_obj in net for net in _BLOCKED_NETS)


def validate_public_http_url(url: str, allow_about_blank: bool = False) -> tuple[bool, str]:
    """Validate URL is public http:// or https:// (blocking file://, loopback, RFC1918, IMDS, tailnet)."""
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string."

    cleaned = url.strip()
    if allow_about_blank and cleaned == "about:blank":
        return True, cleaned

    try:
        parsed = urllib.parse.urlparse(cleaned)
    except Exception:
        return False, f"Malformed URL: {cleaned}"

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return False, f"Blocked URL scheme '{scheme or 'none'}': only http:// and https:// are permitted."

    host = (parsed.hostname or "").strip().lower()
    if not host:
        return False, "URL missing hostname."

    try:
        port = parsed.port
    except ValueError:
        return False, "URL has invalid port."
    if port is not None and not (1 <= port <= 65535):
        return False, "URL port out of range."

    # Optional test opt-in for private HTTP(S) only (still blocks file:// and non-HTTP schemes)
    if os.getenv("AZOTH_ALLOW_PRIVATE_URLS") == "1":
        return True, cleaned

    # Hostname-level SSRF blocklist
    if (
        host in LOOPBACK_HOSTS
        or host == "0.0.0.0"
        or host.endswith(".localhost")
        or host.endswith(".local")
        or host.endswith(".internal")
        or host.endswith(".ts.net")
        or host == "metadata.google.internal"
    ):
        return False, f"Blocked SSRF target host: '{host}'."

    # Direct IP literal check
    if _is_blocked_ip(host):
        return False, f"Blocked private/internal IP address: '{host}'."

    # DNS resolution check (if resolvable in current environment)
    try:
        infos = socket.getaddrinfo(host, port or (443 if scheme == "https" else 80), proto=socket.IPPROTO_TCP)
        for info in infos:
            sockaddr = info[4]
            if sockaddr:
                resolved_ip = sockaddr[0]
                if _is_blocked_ip(resolved_ip):
                    return False, f"Blocked SSRF target: '{host}' resolves to internal address '{resolved_ip}'."
    except socket.gaierror:
        # Offline or unresolvable public domain: literal IP/hostname checks already passed
        pass
    except Exception:
        pass

    return True, cleaned


def validate_package_name(package: str) -> tuple[bool, str]:
    """Validate a single package name strictly against shell-safe characters."""
    cleaned = (package or "").strip()
    if not cleaned or not PACKAGE_NAME_RE.fullmatch(cleaned):
        return False, f"Invalid package name '{package}': only alphanumeric and ._+- characters (max 81 chars) are allowed."
    return True, cleaned
