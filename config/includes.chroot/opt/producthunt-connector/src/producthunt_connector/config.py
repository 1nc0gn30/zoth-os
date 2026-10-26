"""Paths and desired-state for the Product Hunt connector.

Secrets live in producthunt.secret.json mode 0600.
Desired URLs live in producthunt.json (no secrets).
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict
from urllib.parse import urlparse, urlunparse

CONFIG_DIR = Path.home() / ".config" / "zothos"
SECRET_PATH = CONFIG_DIR / "producthunt.secret.json"
DESIRED_PATH = CONFIG_DIR / "producthunt.json"
STATUS_PATH = Path.home() / ".local" / "share" / "zothos" / "producthunt-status.json"

DEFAULT_DESIRED: Dict[str, Any] = {
    "slug": "zothos",
    "product_id": 1333989,
    "post_id": 1276873,
    "product_url": "https://www.producthunt.com/products/zothos",
    "launch_url": "https://www.producthunt.com/products/zothos?launch=zothos",
    "desired_website": "https://zothos.nullai.tech",
    "desired_github": "https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0",
    "desired_github_repo": "https://github.com/NullAITech/zoth-os",
    "featured_post_id": 1276873,
    "review_product_id": 1333989,
    "dashboard_hint": "https://www.producthunt.com/products/zothos",
}


def ensure_dirs() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)


def load_secret() -> Dict[str, Any]:
    if not SECRET_PATH.exists():
        return {}
    try:
        return json.loads(SECRET_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def save_secret(developer_token: str) -> None:
    ensure_dirs()
    payload = json.dumps({"developer_token": developer_token.strip()}, indent=2) + "\n"
    tmp = SECRET_PATH.with_name(SECRET_PATH.name + ".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        handle.write(payload)
    os.chmod(tmp, 0o600)
    os.replace(tmp, SECRET_PATH)
    os.chmod(SECRET_PATH, 0o600)


def token_from_env_or_file() -> str:
    env = os.environ.get("PRODUCTHUNT_DEVELOPER_TOKEN", "").strip()
    if env:
        return env
    return str(load_secret().get("developer_token") or "").strip()


def load_desired() -> Dict[str, Any]:
    data = dict(DEFAULT_DESIRED)
    if DESIRED_PATH.exists():
        try:
            overlay = json.loads(DESIRED_PATH.read_text(encoding="utf-8"))
            if isinstance(overlay, dict):
                data.update({k: v for k, v in overlay.items() if v not in (None, "")})
        except (OSError, json.JSONDecodeError):
            pass
    return data


def save_desired(overlay: Dict[str, Any]) -> Dict[str, Any]:
    ensure_dirs()
    data = load_desired()
    data.update({k: v for k, v in overlay.items() if v is not None})
    DESIRED_PATH.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return data


def save_status(status: Dict[str, Any]) -> None:
    ensure_dirs()
    clean = {k: v for k, v in status.items() if k not in ("developer_token", "token", "access_token")}
    STATUS_PATH.write_text(json.dumps(clean, indent=2) + "\n", encoding="utf-8")


def normalize_url(url: str) -> str:
    raw = (url or "").strip()
    if not raw:
        return ""
    parsed = urlparse(raw)
    host = (parsed.hostname or "").lower()
    path = parsed.path.rstrip("/") or ""
    if parsed.query:
        keep = []
        for part in parsed.query.split("&"):
            key = part.split("=", 1)[0].lower()
            if key in ("ref", "utm_source", "utm_medium", "utm_campaign", "utm_content"):
                continue
            keep.append(part)
        query = "&".join(keep)
    else:
        query = ""
    scheme = parsed.scheme or "https"
    netloc = host
    if parsed.port and parsed.port not in (80, 443):
        netloc = f"{host}:{parsed.port}"
    return urlunparse((scheme, netloc, path, "", query, ""))


def host_of(url: str) -> str:
    return (urlparse(url).hostname or "").lower()
