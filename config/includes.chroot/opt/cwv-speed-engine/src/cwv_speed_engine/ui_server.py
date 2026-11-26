"""
CWV Speed Studio UI Server (v2.6.0) for cwv-speed-engine.
Zero-dependency, SSRF-hardened ThreadingHTTPServer providing loopback REST APIs
and interactive dual-theme web interface for Core Web Vitals auditing, automated
HTML transformation, PWA generation, caching headers, W3C Speculation Rules,
performance budgets, performance diffing, and AI Agent MCP hub.
"""

from __future__ import annotations

import argparse
import html as html_mod
import http.server
import io
import json
import logging
import mimetypes
import os
import pathlib
import re
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
import zipfile
from typing import Any, Dict, List, Optional, Tuple, Union

from .mcp_server import (
    MCPServer,
    SERVER_VERSION,
    audit_html_content as _core_audit_html_content,
    get_platform_diagnostics,
)
from .url_guard import SSRFBlockedError, safe_fetch_url

logger = logging.getLogger("cwv_speed_engine.ui_server")

VERSION = "2.6.0"
SERVER_START_TIME = time.time()
MAX_BODY_BYTES = 1_048_576  # 1 MiB strict POST cap
ALLOWED_BUNDLE_TYPES = frozenset({"pwa", "optimized_html", "starter", "cwv_kit"})
ALLOWED_PWA_STRATEGIES = frozenset({"stale-while-revalidate", "cache-first", "network-first"})

CSP_HEADER_VALUE = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self' http://127.0.0.1:8128 http://localhost:8128; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "frame-ancestors 'self' http://127.0.0.1:3000 http://localhost:3000 http://127.0.0.1:* http://localhost:*"
)

_LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})


def _normalize_rating(rating: str) -> str:
    r = (rating or "").lower().replace("-", "_")
    if r == "good":
        return "GOOD"
    if r in ("needs_improvement", "fair", "warning"):
        return "NEEDS_IMPROVEMENT"
    return "POOR"


def _is_valid_loopback_host(host_header: Optional[str]) -> bool:
    """Validate HTTP Host header against strict loopback allowlist (DNS-rebinding defense)."""
    if not host_header:
        return True  # HTTP/1.0 requests without Host on loopback
    raw = host_header.strip().lower()
    if not raw or any(ch in raw for ch in (" ", "\t", "\r", "\n", "/", "\\", "@")):
        return False

    # IPv6 bracketed host: [::1] or [::1]:8128
    if raw.startswith("["):
        end = raw.find("]")
        if end == -1:
            return False
        host = raw[1:end]
        rest = raw[end + 1 :]
        if rest:
            if not rest.startswith(":") or not rest[1:].isdigit():
                return False
            port = int(rest[1:])
            if port < 1 or port > 65535:
                return False
        return host == "::1"

    # IPv4 / hostname with optional :port
    if ":" in raw:
        parts = raw.rsplit(":", 1)
        host, port_str = parts[0], parts[1]
        if not port_str.isdigit():
            return False
        port = int(port_str)
        if port < 1 or port > 65535:
            return False
    else:
        host = raw

    return host in ("127.0.0.1", "localhost")


def _is_allowed_origin(origin: Optional[str], server_port: int = 8128) -> bool:
    """Validate Origin header strictly against exact local ports (:8128, :3000, or active port)."""
    if not origin:
        return False
    try:
        parsed = urllib.parse.urlparse(origin.strip())
    except Exception:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    if parsed.path not in ("", "/") or parsed.params or parsed.query or parsed.fragment:
        return False
    host = (parsed.hostname or "").lower()
    if host not in _LOOPBACK_HOSTS:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    if port is None:
        return False
    allowed_ports = {8128, 3000, int(server_port)}
    return port in allowed_ports


def _safe_color(value: str, fallback: str) -> str:
    val = str(value or "").strip()
    if re.match(r"^#[0-9a-fA-F]{3,8}$", val):
        return val
    return fallback


# ==============================================================================
# Core Web Vitals Auditing & Simulation Engine (Unified with mcp_server core)
# ==============================================================================

def audit_html_content(
    html: str,
    device: str = "mobile",
    url_context: str = "",
    measured_ttfb_ms: Optional[float] = None,
) -> Dict[str, Any]:
    """Perform a deterministic Core Web Vitals audit unified with the core MCP/CLI engine."""
    if not html or not html.strip():
        return {
            "score": 0,
            "rating": "POOR",
            "device": device,
            "url": url_context,
            "metrics": {
                "lcp": {"value": 5.0, "unit": "s", "rating": "POOR", "target": "< 2.5s"},
                "cls": {"value": 0.35, "unit": "", "rating": "POOR", "target": "< 0.10"},
                "inp": {"value": 450, "unit": "ms", "rating": "POOR", "target": "< 200ms"},
                "fcp": {"value": 3.2, "unit": "s", "rating": "POOR", "target": "< 1.8s"},
                "ttfb": {"value": 1200, "unit": "ms", "rating": "POOR", "target": "< 800ms"},
                "speed_index": {"value": 4.8, "unit": "s", "rating": "POOR", "target": "< 3.4s"},
            },
            "diagnostics": [],
            "summary": {"passed": 0, "warning": 0, "critical": 1, "info": 0, "total": 1},
            "timestamp": time.time(),
        }

    dev = "desktop" if str(device or "mobile").lower() == "desktop" else "mobile"
    default_ttfb = 220.0 if dev == "mobile" else 140.0
    ttfb_in = float(measured_ttfb_ms) if measured_ttfb_ms is not None else default_ttfb

    core_result = _core_audit_html_content(
        html_text=html,
        target_name=url_context or "inline.html",
        measured_ttfb_ms=ttfb_in,
        device=dev,
        min_score=85.0,
    )
    core_dict = core_result.to_dict()
    vitals = core_dict["vitals"]

    lcp_val = round(float(vitals["lcp"]["value"]), 2)
    cls_val = round(float(vitals["cls"]["value"]), 3)
    inp_val = int(round(float(vitals["inp"]["value"])))
    fcp_val = round(float(vitals["fcp"]["value"]), 2)
    ttfb_val = int(round(float(vitals["ttfb"]["value"])))
    speed_index_val = round(fcp_val * 1.35 + lcp_val * 0.4, 2)

    diagnostics: List[Dict[str, Any]] = []
    for diag in core_dict["diagnostics"]:
        sev = str(diag.get("severity", "INFO")).upper()
        passed = sev in ("GOOD", "PASS")
        diagnostics.append({
            "rule_id": diag.get("id", "CWV-RULE"),
            "category": diag.get("category", "Performance"),
            "title": diag.get("title", ""),
            "description": diag.get("description", ""),
            "severity": "PASS" if passed else sev,
            "impact": diag.get("savings") or ("Optimal" if passed else f"{diag.get('category', 'CWV')} impact"),
            "recommendation": diag.get("recommendation", ""),
            "passed": passed,
        })

    score = int(core_dict["score"])
    rating = "GOOD" if score >= 90 else ("NEEDS_IMPROVEMENT" if score >= 50 else "POOR")

    passed_count = sum(1 for d in diagnostics if d["passed"])
    critical_count = sum(1 for d in diagnostics if d["severity"] == "CRITICAL")
    warning_count = sum(1 for d in diagnostics if d["severity"] == "WARNING")
    info_count = sum(1 for d in diagnostics if d["severity"] == "INFO")

    return {
        "score": score,
        "grade": core_dict["grade"],
        "rating": rating,
        "device": dev,
        "url": url_context,
        "metrics": {
            "lcp": {"value": lcp_val, "unit": "s", "rating": _normalize_rating(vitals["lcp"]["rating"]), "target": "< 2.5s"},
            "cls": {"value": cls_val, "unit": "", "rating": _normalize_rating(vitals["cls"]["rating"]), "target": "< 0.10"},
            "inp": {"value": inp_val, "unit": "ms", "rating": _normalize_rating(vitals["inp"]["rating"]), "target": "< 200ms"},
            "fcp": {"value": fcp_val, "unit": "s", "rating": _normalize_rating(vitals["fcp"]["rating"]), "target": "< 1.8s"},
            "ttfb": {"value": ttfb_val, "unit": "ms", "rating": _normalize_rating(vitals["ttfb"]["rating"]), "target": "< 800ms"},
            "speed_index": {
                "value": speed_index_val,
                "unit": "s",
                "rating": "GOOD" if speed_index_val <= 3.4 else ("NEEDS_IMPROVEMENT" if speed_index_val <= 5.8 else "POOR"),
                "target": "< 3.4s",
            },
        },
        "diagnostics": diagnostics,
        "stats": core_dict.get("stats", {}),
        "summary": {
            "passed": passed_count,
            "warning": warning_count,
            "critical": critical_count,
            "info": info_count,
            "total": len(diagnostics),
        },
        "timestamp": time.time(),
    }


def audit_url(url: str, device: str = "mobile", timeout: int = 5) -> Dict[str, Any]:
    """Fetch a validated public URL with SSRF guardrails and run the unified CWV audit."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 CWVSpeedStudio/2.6.0"
            if str(device).lower() == "mobile"
            else "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CWVSpeedStudio/2.6.0"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate",
    }

    # Raises SSRFBlockedError immediately for disallowed schemes, loopback, RFC1918, metadata, bad redirects
    raw_bytes, resp_headers, ttfb_ms, final_url = safe_fetch_url(
        url,
        headers=headers,
        timeout=min(float(timeout), 5.0),
    )

    charset = "utf-8"
    content_type = resp_headers.get("content-type", "")
    if "charset=" in content_type.lower():
        charset = content_type.lower().split("charset=", 1)[-1].split(";", 1)[0].strip() or "utf-8"

    html_doc = raw_bytes.decode(charset, errors="replace")
    res = audit_html_content(html_doc, device=device, url_context=final_url, measured_ttfb_ms=ttfb_ms)

    # Expose only safe caching/content metadata (never raw internal headers)
    safe_header_keys = ("content-type", "cache-control", "content-encoding", "vary", "etag")
    res["cache_headers"] = {k: resp_headers[k] for k in safe_header_keys if k in resp_headers}
    return res


# ==============================================================================
# Automated HTML Speed Transformer
# ==============================================================================

def transform_html(html: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Apply deterministic Core Web Vitals optimizations to HTML markup."""
    if not html:
        return {"optimized_html": "", "stats": {}, "changes": []}

    opt = {
        "dimensions": True,
        "lazy_loading": True,
        "font_preconnect": True,
        "defer_scripts": True,
        "preload_hero": True,
        "critical_css": True,
        "minify": False,
    }
    if isinstance(options, dict):
        opt.update(options)

    changes: List[str] = []
    working_html = html

    # 1. Font Preconnect & display=swap
    if opt.get("font_preconnect"):
        if "fonts.googleapis.com" in working_html and "display=swap" not in working_html:
            working_html = re.sub(
                r'(fonts\.googleapis\.com/css2?\?[^"\'\s>]+)',
                lambda m: m.group(1) + ("&amp;display=swap" if "&amp;" in m.group(1) else "&display=swap"),
                working_html,
            )
            changes.append("Appended &display=swap to Google Fonts links to eliminate FOIT")

        preconnect_tags = (
            '    <link rel="preconnect" href="https://fonts.googleapis.com">\n'
            '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        )
        if "fonts.googleapis.com" in working_html and 'rel="preconnect"' not in working_html:
            if "<head>" in working_html:
                working_html = working_html.replace("<head>", f"<head>\n{preconnect_tags}", 1)
            elif "<head " in working_html:
                working_html = re.sub(r"(<head[^>]*>)", rf"\1\n{preconnect_tags}", working_html, count=1)
            changes.append("Injected font preconnect hints for Google Fonts and GStatic")

    # 2. Defer Render-Blocking Scripts (scoped strictly to <head>)
    if opt.get("defer_scripts"):
        def defer_script_tag(match: re.Match) -> str:
            tag = match.group(0)
            lower_tag = tag.lower()
            if "src=" in lower_tag and "defer" not in lower_tag and "async" not in lower_tag and 'type="module"' not in lower_tag and "type='module'" not in lower_tag:
                return re.sub(r"<script\b", "<script defer", tag, count=1, flags=re.IGNORECASE)
            return tag

        head_match = re.search(r"(<head\b[^>]*>)(.*?)(</head>)", working_html, re.IGNORECASE | re.DOTALL)
        if head_match:
            head_start, head_body, head_end = head_match.group(1), head_match.group(2), head_match.group(3)
            new_head_body = re.sub(r"<script\b[^>]*>", defer_script_tag, head_body, flags=re.IGNORECASE)
            if new_head_body != head_body:
                working_html = working_html[:head_match.start()] + head_start + new_head_body + head_end + working_html[head_match.end():]
                changes.append("Added 'defer' attribute to external scripts in <head> to unblock parsing")

    # 3. Image Dimensions & Aspect-Ratio + Lazy Loading + Hero Preload
    first_img_src = None
    img_counter = 0

    def transform_img_tag(match: re.Match) -> str:
        nonlocal first_img_src, img_counter
        tag = match.group(0)
        img_counter += 1

        src_match = re.search(r'src=["\']([^"\']+)["\']', tag, re.IGNORECASE)
        src = src_match.group(1) if src_match else ""

        if img_counter == 1:
            first_img_src = src
            if opt.get("preload_hero"):
                if "fetchpriority=" not in tag.lower():
                    tag = re.sub(r"<img\b", '<img fetchpriority="high"', tag, count=1, flags=re.IGNORECASE)
                if "loading=" not in tag.lower():
                    tag = re.sub(r"<img\b", '<img loading="eager"', tag, count=1, flags=re.IGNORECASE)
        else:
            if opt.get("lazy_loading"):
                if "loading=" not in tag.lower():
                    tag = re.sub(r"<img\b", '<img loading="lazy"', tag, count=1, flags=re.IGNORECASE)
                if "decoding=" not in tag.lower():
                    tag = re.sub(r"<img\b", '<img decoding="async"', tag, count=1, flags=re.IGNORECASE)

        if opt.get("dimensions"):
            has_width = bool(re.search(r"\bwidth\s*=", tag, re.IGNORECASE))
            has_height = bool(re.search(r"\bheight\s*=", tag, re.IGNORECASE))
            if not (has_width and has_height):
                if not has_width:
                    tag = re.sub(r"<img\b", '<img width="800"', tag, count=1, flags=re.IGNORECASE)
                if not has_height:
                    tag = re.sub(r"<img\b", '<img height="500"', tag, count=1, flags=re.IGNORECASE)

        return tag

    working_html = re.sub(r"<img\b[^>]*>", transform_img_tag, working_html, flags=re.IGNORECASE)
    if img_counter > 0:
        changes.append(f"Optimized {img_counter} image(s): explicit dimensions, lazy loading, and decoding='async'")

    # 4. Preload Hero Image in <head>
    if opt.get("preload_hero") and first_img_src and not first_img_src.startswith("data:"):
        safe_hero_src = html_mod.escape(first_img_src, quote=True)
        preload_hero_tag = f'    <link rel="preload" as="image" href="{safe_hero_src}" fetchpriority="high">\n'
        if f'href="{safe_hero_src}"' not in working_html or 'rel="preload"' not in working_html:
            if "<head>" in working_html:
                working_html = working_html.replace("<head>", f"<head>\n{preload_hero_tag}", 1)
            elif "<head " in working_html:
                working_html = re.sub(r"(<head[^>]*>)", rf"\1\n{preload_hero_tag}", working_html, count=1)
            changes.append(f"Added preload tag for LCP hero image: {first_img_src}")

    # 5. Critical CSS Reset Injection
    if opt.get("critical_css"):
        critical_style = (
            '    <style id="cwv-critical-reset">\n'
            "      img, video { max-width: 100%; height: auto; display: block; }\n"
            "      .hero-lcp { content-visibility: visible; contain-intrinsic-size: 800px 500px; }\n"
            "      .below-fold { content-visibility: auto; contain-intrinsic-size: 1px 600px; }\n"
            "    </style>\n"
        )
        if "cwv-critical-reset" not in working_html:
            if "<head>" in working_html:
                working_html = working_html.replace("<head>", f"<head>\n{critical_style}", 1)
            elif "<head " in working_html:
                working_html = re.sub(r"(<head[^>]*>)", rf"\1\n{critical_style}", working_html, count=1)
            changes.append("Injected critical CSS reset with content-visibility containment")

    # 6. Minification (Optional)
    if opt.get("minify"):
        working_html = re.sub(r"<!--(?!\[if).*?-->", "", working_html, flags=re.DOTALL)
        working_html = re.sub(r"\n\s*\n", "\n", working_html)
        changes.append("Stripped HTML comments and normalized whitespace")

    original_size = len(html.encode("utf-8"))
    optimized_size = len(working_html.encode("utf-8"))
    savings_bytes = original_size - optimized_size

    return {
        "optimized_html": working_html,
        "changes": changes,
        "stats": {
            "original_bytes": original_size,
            "optimized_bytes": optimized_size,
            "savings_bytes": savings_bytes,
            "savings_percent": round((savings_bytes / max(1, original_size)) * 100, 1),
            "changes_count": len(changes),
        },
    }


# ==============================================================================
# PWA & Service Worker Studio Generator (HTML-escaped & strategy-accurate)
# ==============================================================================

def generate_pwa(config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate sanitized PWA manifest, strategy-specific service worker, and offline HTML."""
    cfg = {
        "name": "CWV Speed App",
        "short_name": "SpeedApp",
        "theme_color": "#047857",
        "background_color": "#FAF8F3",
        "start_url": "/",
        "display": "standalone",
        "orientation": "portrait-primary",
        "description": "Core Web Vitals optimized Progressive Web App.",
        "strategy": "stale-while-revalidate",
        "scope": "/",
    }
    if isinstance(config, dict):
        for k in cfg:
            if k in config and config[k] is not None:
                cfg[k] = str(config[k])

    sw_strategy = cfg["strategy"].lower().strip()
    if sw_strategy not in ALLOWED_PWA_STRATEGIES:
        sw_strategy = "stale-while-revalidate"

    safe_theme_color = _safe_color(cfg["theme_color"], "#047857")
    safe_bg_color = _safe_color(cfg["background_color"], "#FAF8F3")
    safe_name_html = html_mod.escape(cfg["name"], quote=True)

    manifest_dict = {
        "$schema": "https://json.schemastore.org/web-manifest-combined.json",
        "name": cfg["name"],
        "short_name": cfg["short_name"],
        "description": cfg["description"],
        "start_url": cfg["start_url"],
        "scope": cfg["scope"],
        "display": cfg["display"],
        "orientation": cfg["orientation"],
        "theme_color": safe_theme_color,
        "background_color": safe_bg_color,
        "categories": ["utilities", "productivity"],
        "icons": [
            {"src": "/assets/icon.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "/assets/icon.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
        "shortcuts": [
            {"name": "Speed Audit", "url": "/?tab=auditor", "description": "Launch Core Web Vitals audit"},
            {"name": "HTML Transformer", "url": "/?tab=transformer", "description": "Transform HTML for speed"},
        ],
    }

    if sw_strategy == "cache-first":
        fetch_body = """  // Strategy: Cache-First (serve cache immediately, fall back to network & populate cache)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => (request.mode === 'navigate' ? caches.match('/offline.html') : undefined));
    })
  );"""
    elif sw_strategy == "network-first":
        fetch_body = """  // Strategy: Network-First (always try network, fall back to cache or offline.html)
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then((c) => c || (request.mode === 'navigate' ? caches.match('/offline.html') : undefined)))
  );"""
    else:
        fetch_body = """  // Strategy: Stale-While-Revalidate (instant cache hit + background network refresh)
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(() => cached || (request.mode === 'navigate' ? caches.match('/offline.html') : undefined));
      return cached || networkFetch;
    })
  );"""

    sw_code = f"""/**
 * CWV Speed Studio v{VERSION} - Service Worker
 * Strategy: {sw_strategy}
 */

const CACHE_NAME = 'cwv-speed-engine-v{VERSION}';
const STATIC_ASSETS = ['/', '/index.html', '/offline.html', '/site.webmanifest'];

self.addEventListener('install', (event) => {{
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
}});

self.addEventListener('activate', (event) => {{
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener('fetch', (event) => {{
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;
{fetch_body}
}});
"""

    offline_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline | {safe_name_html}</title>
  <meta name="theme-color" content="{safe_theme_color}">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF8F3;
      color: #101828;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
    }}
    .offline-card {{
      background: #FFFFFF;
      border-radius: 16px;
      padding: 36px;
      max-width: 460px;
      text-align: center;
      border: 1px solid rgba(16,24,40,0.12);
    }}
    .retry-btn {{
      background: {safe_theme_color};
      color: #FFFFFF;
      border: none;
      padding: 12px 24px;
      border-radius: 9999px;
      font-weight: 700;
      cursor: pointer;
    }}
  </style>
</head>
<body>
  <div class="offline-card">
    <h1>You are currently offline</h1>
    <p>{safe_name_html} has cached core assets for instant recovery once connectivity returns.</p>
    <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>"""

    html_snippet = f"""<!-- PWA Head Integration -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="{safe_theme_color}">
<link rel="apple-touch-icon" href="/assets/icon.png">
<script>
  if ('serviceWorker' in navigator) {{
    window.addEventListener('load', () => {{
      navigator.serviceWorker.register('/sw.js').catch(() => {{}});
    }});
  }}
</script>"""

    return {
        "strategy": sw_strategy,
        "manifest": manifest_dict,
        "manifest_json": json.dumps(manifest_dict, indent=2),
        "service_worker": sw_code,
        "offline_html": offline_html,
        "html_snippet": html_snippet,
    }


# ==============================================================================
# OpenGraph & Social Preview Generator (HTML-escaped)
# ==============================================================================

def generate_og(config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate HTML-escaped OpenGraph, Twitter Card, and Google Search metadata."""
    cfg = {
        "title": "CWV Speed Studio | Core Web Vitals Engine",
        "description": "Core Web Vitals diagnostic engine, HTML AST speed transformer, PWA generator, and 8-tool MCP server.",
        "image": "/assets/banner.png",
        "url": "https://cwv-speed-studio.netlify.app/",
        "site_name": "CWV Speed Studio",
        "twitter_handle": "@1nc0gn30",
    }
    if isinstance(config, dict):
        for k in cfg:
            if k in config and config[k] is not None:
                cfg[k] = str(config[k])

    esc = {k: html_mod.escape(v, quote=True) for k, v in cfg.items()}

    tags = [
        f'<title>{esc["title"]}</title>',
        f'<meta name="description" content="{esc["description"]}">',
        f'<link rel="canonical" href="{esc["url"]}">',
        "<!-- OpenGraph / Facebook -->",
        '<meta property="og:type" content="website">',
        f'<meta property="og:url" content="{esc["url"]}">',
        f'<meta property="og:title" content="{esc["title"]}">',
        f'<meta property="og:description" content="{esc["description"]}">',
        f'<meta property="og:image" content="{esc["image"]}">',
        f'<meta property="og:site_name" content="{esc["site_name"]}">',
        "<!-- Twitter Card -->",
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:site" content="{esc["twitter_handle"]}">',
        f'<meta name="twitter:creator" content="{esc["twitter_handle"]}">',
        f'<meta name="twitter:title" content="{esc["title"]}">',
        f'<meta name="twitter:description" content="{esc["description"]}">',
        f'<meta name="twitter:image" content="{esc["image"]}">',
    ]

    return {
        "html_snippet": "\n".join(tags),
        "tags": tags,
        "preview_data": cfg,
    }


# ==============================================================================
# Performance Diff Comparator
# ==============================================================================

def compare_diff(
    baseline_input: Union[str, Dict[str, Any]],
    candidate_input: Union[str, Dict[str, Any]],
    device: str = "mobile",
) -> Dict[str, Any]:
    """Compare baseline vs candidate HTML or audit reports with exact metric deltas."""
    baseline_report = audit_html_content(baseline_input, device=device) if isinstance(baseline_input, str) else baseline_input
    candidate_report = audit_html_content(candidate_input, device=device) if isinstance(candidate_input, str) else candidate_input

    b_score = int(baseline_report.get("score", 0))
    c_score = int(candidate_report.get("score", 0))
    score_delta = c_score - b_score

    b_m = baseline_report.get("metrics", {})
    c_m = candidate_report.get("metrics", {})

    def get_delta(metric_name: str, round_digits: int = 2) -> Dict[str, Any]:
        b_val = b_m.get(metric_name, {}).get("value", 0)
        c_val = c_m.get(metric_name, {}).get("value", 0)
        delta_val = round(c_val - b_val, round_digits) if round_digits > 0 else int(round(c_val - b_val))
        return {
            "baseline": b_val,
            "candidate": c_val,
            "delta": delta_val,
            "improved": delta_val < 0,
            "unit": b_m.get(metric_name, {}).get("unit", ""),
        }

    metric_deltas = {
        "lcp": get_delta("lcp", 2),
        "cls": get_delta("cls", 3),
        "inp": get_delta("inp", 0),
        "fcp": get_delta("fcp", 2),
        "ttfb": get_delta("ttfb", 0),
    }

    b_rules = {d.get("rule_id"): d for d in baseline_report.get("diagnostics", [])}
    c_rules = {d.get("rule_id"): d for d in candidate_report.get("diagnostics", [])}

    resolved_issues: List[Dict[str, Any]] = []
    for rule_id, b_diag in b_rules.items():
        if not b_diag.get("passed", False):
            c_diag = c_rules.get(rule_id)
            if c_diag is None or c_diag.get("passed", False):
                resolved_issues.append({
                    "rule_id": rule_id,
                    "title": b_diag.get("title", ""),
                    "category": b_diag.get("category", ""),
                    "resolved": True,
                })

    if score_delta > 0:
        summary = f"Score increased from {b_score} to {c_score} (+{score_delta} pts) with {len(resolved_issues)} issue(s) resolved."
    elif score_delta < 0:
        summary = f"Score regressed from {b_score} to {c_score} ({score_delta} pts)."
    else:
        summary = f"No score change ({b_score} → {c_score}, 0 pts delta)."

    return {
        "baseline_score": b_score,
        "candidate_score": c_score,
        "score_delta": score_delta,
        "improved": score_delta > 0,
        "baseline_rating": baseline_report.get("rating", "POOR"),
        "candidate_rating": candidate_report.get("rating", "POOR"),
        "metric_deltas": metric_deltas,
        "resolved_issues": resolved_issues,
        "resolved_count": len(resolved_issues),
        "summary": summary,
    }


# ==============================================================================
# Cache-Control & Headers Exporter
# ==============================================================================

def export_cache_headers(platform: str, custom_rules: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """Generate production caching and security header configs for 6 edge platforms."""
    plat = str(platform or "netlify").lower().strip()

    if plat == "netlify":
        filename = "_headers"
        content = """# Netlify High-Performance Cache & Security Headers
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=31536000, immutable
/static/*
  Cache-Control: public, max-age=31536000, immutable

/*.woff2
  Cache-Control: public, max-age=31536000, immutable
/*.webp
  Cache-Control: public, max-age=2592000, stale-while-revalidate=86400
/*.avif
  Cache-Control: public, max-age=2592000, stale-while-revalidate=86400

/sw.js
  Cache-Control: public, max-age=0, must-revalidate
/site.webmanifest
  Cache-Control: public, max-age=0, must-revalidate

/*
  Cache-Control: public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
"""
    elif plat == "vercel":
        filename = "vercel.json"
        config_obj = {
            "headers": [
                {
                    "source": "/(.*)\\.(js|css|woff2|avif|webp)",
                    "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}],
                },
                {
                    "source": "/(sw\\.js|site\\.webmanifest)",
                    "headers": [{"key": "Cache-Control", "value": "public, max-age=0, must-revalidate"}],
                },
                {
                    "source": "/(.*)",
                    "headers": [
                        {"key": "X-Content-Type-Options", "value": "nosniff"},
                        {"key": "X-Frame-Options", "value": "SAMEORIGIN"},
                        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                        {"key": "Cache-Control", "value": "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400"},
                    ],
                },
            ]
        }
        content = json.dumps(config_obj, indent=2)
    elif plat == "nginx":
        filename = "nginx.conf"
        content = """# Nginx Core Web Vitals Caching Config
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript image/svg+xml;

location ~* \\.(?:css|js|woff2|avif|webp|png|jpg|svg)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    access_log off;
}

location ~* (?:sw\\.js|site\\.webmanifest|manifest\\.json)$ {
    expires -1;
    add_header Cache-Control "public, max-age=0, must-revalidate";
}

location / {
    add_header Cache-Control "public, max-age=0, must-revalidate, s-maxage=3600, stale-while-revalidate=86400";
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    try_files $uri $uri/ /index.html;
}
"""
    elif plat == "cloudflare":
        filename = "_headers"
        content = """# Cloudflare Pages / Workers Cache Rules
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.woff2
  Cache-Control: public, max-age=31536000, immutable
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
"""
    elif plat == "nextjs":
        filename = "next.config.js"
        content = """/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ['image/avif', 'image/webp'], minimumCacheTTL: 31536000 },
  async headers() {
    return [
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ],
      },
    ];
  },
};
module.exports = nextConfig;
"""
    else:
        filename = ".htaccess"
        content = """# Apache Core Web Vitals Speed Headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\\.(js|css|woff2|webp|avif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "(sw\\.js|site\\.webmanifest)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
</IfModule>
"""

    return {"platform": plat, "filename": filename, "content": content}


# ==============================================================================
# AI Agent & Model Context Protocol (MCP) Hub (Strictly 8 real cwv_* tools)
# ==============================================================================

def get_mcp_config(client: str = "claude") -> Dict[str, Any]:
    """Return MCP client config aligned strictly with the 8 real cwv_* tools in mcp_server.py."""
    cli = str(client or "claude").lower().strip()
    server = MCPServer()
    tool_names = list(server.tools.keys())
    available_tools = [
        {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.input_schema.get("properties", {}),
            "required": tool.input_schema.get("required", []),
        }
        for tool in server.tools.values()
    ]

    configs = {
        "claude": {
            "mcpServers": {
                "cwv-speed-engine": {
                    "command": "cwv-speed-engine",
                    "args": ["mcp"],
                }
            }
        },
        "cursor": {
            "mcpServers": {
                "cwv-speed-engine": {
                    "command": "cwv-speed-engine",
                    "args": ["mcp"],
                }
            }
        },
        "cline": {
            "mcpServers": {
                "cwv-speed-engine": {
                    "command": "cwv-speed-engine",
                    "args": ["mcp"],
                    "disabled": False,
                    "autoApprove": tool_names,
                }
            }
        },
        "windsurf": {
            "mcpServers": {
                "cwv-speed-engine": {
                    "command": "cwv-speed-engine",
                    "args": ["mcp"],
                }
            }
        },
        "zed": {
            "context_servers": {
                "cwv-speed-engine": {
                    "command": {
                        "path": "cwv-speed-engine",
                        "args": ["mcp"],
                    }
                }
            }
        },
    }

    selected = configs.get(cli, configs["claude"])
    return {
        "client": cli,
        "version": VERSION,
        "transport": "stdio",
        "tool_count": len(available_tools),
        "config": selected,
        "json_str": json.dumps(selected, indent=2),
        "available_tools": available_tools,
    }


# ==============================================================================
# Zip Archive Export Bundle
# ==============================================================================

def create_zip_bundle(bundle_type: str, data: Dict[str, Any]) -> bytes:
    """Create an in-memory ZIP archive for PWA, optimized HTML, starter, or cwv_kit bundles."""
    if bundle_type not in ALLOWED_BUNDLE_TYPES:
        raise ValueError(f"Unsupported bundle_type '{bundle_type}'. Allowed: {sorted(ALLOWED_BUNDLE_TYPES)}")

    payload = data if isinstance(data, dict) else {}
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        if bundle_type == "pwa":
            pwa_res = generate_pwa(payload)
            zf.writestr("site.webmanifest", pwa_res["manifest_json"])
            zf.writestr("sw.js", pwa_res["service_worker"])
            zf.writestr("offline.html", pwa_res["offline_html"])
            zf.writestr("pwa-head-snippet.html", pwa_res["html_snippet"])
            zf.writestr("README.md", f"# PWA Production Bundle (CWV Speed Engine v{VERSION})\n\nPlace `site.webmanifest`, `sw.js`, and `offline.html` in your public root directory.\n")
        elif bundle_type == "optimized_html":
            raw_html = str(payload.get("html") or "<!DOCTYPE html><html><body><h1>CWV Speed Studio</h1></body></html>")
            opt_res = transform_html(raw_html, payload.get("options"))
            zf.writestr("index.optimized.html", opt_res["optimized_html"])
            zf.writestr("optimization-report.json", json.dumps(opt_res["stats"], indent=2))
        elif bundle_type == "cwv_kit":
            from .budget_simulator import audit_performance_budget
            from .speculation_engine import generate_speculation_plan

            raw_html = str(payload.get("html") or "<!DOCTYPE html><html><head><title>App</title></head><body><a href='/docs'>Docs</a></body></html>")
            base_url = str(payload.get("base_url") or "https://example.com")
            aggressiveness = str(payload.get("aggressiveness") or "balanced")
            budget_report = audit_performance_budget(raw_html, target_name="CWV Kit Export")
            spec_plan = generate_speculation_plan(raw_html, base_url=base_url, aggressiveness=aggressiveness)
            pwa_res = generate_pwa(payload)

            zf.writestr("budget.json", json.dumps(budget_report.lighthouse_budget_json, indent=2))
            zf.writestr("speculation-rules.html", spec_plan.speculation_rules_script_tag)
            zf.writestr("_headers", export_cache_headers("netlify")["content"])
            zf.writestr("site.webmanifest", pwa_res["manifest_json"])
            zf.writestr("sw.js", pwa_res["service_worker"])
            zf.writestr("offline.html", pwa_res["offline_html"])
        else:  # starter
            pwa_res = generate_pwa(payload)
            zf.writestr("site.webmanifest", pwa_res["manifest_json"])
            zf.writestr("sw.js", pwa_res["service_worker"])
            zf.writestr("offline.html", pwa_res["offline_html"])
            zf.writestr("_headers", export_cache_headers("netlify")["content"])
            zf.writestr("vercel.json", export_cache_headers("vercel")["content"])
            zf.writestr("nginx.conf", export_cache_headers("nginx")["content"])
            zf.writestr("next.config.js", export_cache_headers("nextjs")["content"])
            zf.writestr("claude_desktop_config.json", get_mcp_config("claude")["json_str"])

    buf.seek(0)
    return buf.getvalue()


FALLBACK_INDEX_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CWV Speed Studio v{VERSION} | Core Web Vitals Engine</title>
</head>
<body>
  <main style="max-width:720px;margin:48px auto;font-family:system-ui,sans-serif;padding:0 16px;">
    <h1>CWV Speed Studio v{VERSION}</h1>
    <p>Core Web Vitals Speed Engine server is active. Place <code>public/index.html</code> in the web root for the full UI.</p>
  </main>
</body>
</html>
"""


# ==============================================================================
# Hardened Loopback HTTP Request Handler
# ==============================================================================

class SpeedStudioRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Hardened loopback REST API & static file handler for CWV Speed Engine."""

    def __init__(self, *args, directory: Optional[str] = None, **kwargs):
        if directory is None:
            base_dir = pathlib.Path(__file__).resolve().parent.parent.parent
            public_dir = base_dir / "public"
            directory = str(public_dir) if public_dir.exists() else str(base_dir)
        self._public_root = pathlib.Path(directory).resolve()
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args: Any) -> None:
        logger.debug("%s - - [%s] %s", self.address_string(), self.log_date_time_string(), format % args)

    def _active_port(self) -> int:
        try:
            return int(self.server.server_port)
        except Exception:
            return 8128

    def _send_security_headers(self) -> None:
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CSP_HEADER_VALUE)

    def _send_cors_headers(self, *, allow_if_valid: bool = True) -> None:
        origin = self.headers.get("Origin")
        self.send_header("Vary", "Origin")
        if allow_if_valid and origin and _is_allowed_origin(origin, self._active_port()):
            self.send_header("Access-Control-Allow-Origin", origin.strip())
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")

    def _send_json(self, status: int, data: Any, *, head_only: bool = False, allow_cors: bool = True) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self._send_security_headers()
        self._send_cors_headers(allow_if_valid=allow_cors)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _send_bytes(
        self,
        status: int,
        body: bytes,
        content_type: str,
        *,
        head_only: bool = False,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self.send_response(status)
        self._send_security_headers()
        self._send_cors_headers(allow_if_valid=True)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        if not head_only:
            self.wfile.write(body)

    def _enforce_host(self, *, head_only: bool = False) -> bool:
        if not _is_valid_loopback_host(self.headers.get("Host")):
            self._send_json(
                403,
                {"error": "Forbidden: invalid Host header (loopback only)", "status": 403},
                head_only=head_only,
                allow_cors=False,
            )
            return False
        return True

    def _enforce_origin_for_mutation(self) -> bool:
        origin = self.headers.get("Origin")
        if origin is not None and not _is_allowed_origin(origin, self._active_port()):
            self._send_json(
                403,
                {"error": "Forbidden: Origin not permitted by loopback CORS policy", "status": 403},
                allow_cors=False,
            )
            return False
        return True

    def _read_json_body(self) -> Tuple[Optional[Dict[str, Any]], Optional[Tuple[int, str]]]:
        raw_len = self.headers.get("Content-Length")
        if raw_len is None:
            return {}, None
        try:
            content_length = int(raw_len)
        except ValueError:
            return None, (400, "Invalid Content-Length header")
        if content_length < 0:
            return None, (400, "Negative Content-Length header")
        if content_length > MAX_BODY_BYTES:
            return None, (413, f"Request body exceeds {MAX_BODY_BYTES} byte limit")
        if content_length == 0:
            return {}, None

        raw_bytes = self.rfile.read(content_length)
        try:
            decoded = raw_bytes.decode("utf-8")
            parsed = json.loads(decoded)
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None, (400, "Malformed JSON request body")

        if not isinstance(parsed, dict):
            return None, (400, "JSON request body must be an object")
        return parsed, None

    def _resolve_static_file(self, url_path: str) -> Tuple[Optional[pathlib.Path], Optional[int], Optional[str]]:
        """Safely resolve a static asset path under public_root; block traversal & directory listings."""
        raw_decoded = urllib.parse.unquote(url_path)
        if "\x00" in raw_decoded or "\\" in raw_decoded:
            return None, 403, "Forbidden path"

        # Explicitly reject any path segment equal to '..'
        segments = [seg for seg in raw_decoded.split("/") if seg]
        if any(seg == ".." for seg in segments):
            return None, 403, "Forbidden path traversal"

        candidate = self._public_root.joinpath(*segments)
        try:
            resolved = candidate.resolve(strict=False)
        except Exception:
            return None, 403, "Forbidden path"

        if not resolved.is_relative_to(self._public_root):
            return None, 403, "Forbidden path traversal"

        if resolved.is_dir():
            return None, 403, "Directory listing is disabled"

        if not resolved.exists() or not resolved.is_file():
            return None, 404, "Not found"

        return resolved, None, None

    def _handle_read_request(self, *, head_only: bool = False) -> None:
        if not self._enforce_host(head_only=head_only):
            return

        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path in ("/health", "/api/health"):
            self._send_json(
                200,
                {
                    "status": "healthy",
                    "version": VERSION,
                    "service": "cwv-speed-engine-ui",
                    "uptime_seconds": round(time.time() - SERVER_START_TIME, 2),
                    "timestamp": time.time(),
                },
                head_only=head_only,
            )
            return

        if path == "/api/platform":
            self._send_json(200, get_platform_diagnostics(), head_only=head_only)
            return

        if path == "/api/tools":
            srv = MCPServer()
            tools_data = [t.to_mcp_dict() for t in srv.tools.values()]
            self._send_json(
                200,
                {"version": VERSION, "tool_count": len(tools_data), "tools": tools_data},
                head_only=head_only,
            )
            return

        if path == "/api/mcp/config":
            params = urllib.parse.parse_qs(parsed_url.query)
            client = params.get("client", ["claude"])[0]
            self._send_json(200, get_mcp_config(client), head_only=head_only)
            return

        if path == "/api/cache/export":
            params = urllib.parse.parse_qs(parsed_url.query)
            platform = params.get("platform", ["netlify"])[0]
            self._send_json(200, export_cache_headers(platform), head_only=head_only)
            return

        if path == "/api/budget":
            from .budget_simulator import audit_performance_budget
            params = urllib.parse.parse_qs(parsed_url.query)
            target_name = params.get("name", ["Web Studio Audit"])[0]
            sample_html = "<html><head><script src='/app.js'></script><link rel='stylesheet' href='/style.css'></head><body><img src='/hero.jpg'></body></html>"
            report = audit_performance_budget(sample_html, target_name=target_name)
            self._send_json(200, report.to_dict(), head_only=head_only)
            return

        if path in ("/", "/index.html"):
            index_path = self._public_root / "index.html"
            if index_path.is_file():
                content = index_path.read_bytes()
            else:
                content = FALLBACK_INDEX_HTML.encode("utf-8")
            self._send_bytes(200, content, "text/html; charset=utf-8", head_only=head_only)
            return

        # Static asset serving with canonical traversal & directory-listing protection
        resolved, err_status, err_msg = self._resolve_static_file(path)
        if err_status is not None or resolved is None:
            self._send_json(
                err_status or 404,
                {"error": err_msg or "Not found", "status": err_status or 404},
                head_only=head_only,
            )
            return

        ctype, _ = mimetypes.guess_type(str(resolved))
        if not ctype:
            ctype = "application/octet-stream"
        if ctype.startswith(("text/", "application/javascript", "application/json", "application/xml")):
            ctype = f"{ctype}; charset=utf-8"

        self._send_bytes(200, resolved.read_bytes(), ctype, head_only=head_only)

    def do_OPTIONS(self) -> None:
        if not self._enforce_host():
            return
        if not self._enforce_origin_for_mutation():
            return
        self.send_response(204)
        self._send_security_headers()
        self._send_cors_headers(allow_if_valid=True)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_read_request(head_only=True)

    def do_GET(self) -> None:
        self._handle_read_request(head_only=False)

    def do_POST(self) -> None:
        if not self._enforce_host():
            return
        if not self._enforce_origin_for_mutation():
            return

        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        body, err = self._read_json_body()
        if err is not None or body is None:
            status_code, msg = err or (400, "Invalid request body")
            self._send_json(status_code, {"error": msg, "status": status_code})
            return

        # 1. Auditor endpoint (SSRF-hardened)
        if path == "/api/audit":
            url = str(body.get("url") or "").strip()
            raw_html = body.get("html") or ""
            device = str(body.get("device") or "mobile")

            if url:
                try:
                    report = audit_url(url, device=device)
                except SSRFBlockedError as exc:
                    self._send_json(
                        exc.status_code,
                        {"error": str(exc), "code": exc.reason, "status": exc.status_code},
                    )
                    return
                except Exception:
                    self._send_json(
                        502,
                        {"error": "Unable to retrieve target URL within timeout.", "code": "upstream_fetch_failed", "status": 502},
                    )
                    return
            elif isinstance(raw_html, str) and raw_html.strip():
                report = audit_html_content(raw_html, device=device)
            else:
                self._send_json(400, {"error": "Missing 'url' or 'html' in request body", "status": 400})
                return

            self._send_json(200, report)
            return

        # 2. HTML Transformer endpoint
        if path in ("/api/optimize", "/api/transform"):
            raw_html = body.get("html", "")
            if not isinstance(raw_html, str) or not raw_html.strip():
                self._send_json(400, {"error": "Missing 'html' field in request body", "status": 400})
                return
            options = body.get("options", {})
            result = transform_html(raw_html, options=options if isinstance(options, dict) else {})
            self._send_json(200, result)
            return

        # 3. PWA Generation endpoint (+ README alias /api/pwa)
        if path in ("/api/pwa/generate", "/api/pwa"):
            result = generate_pwa(body)
            self._send_json(200, result)
            return

        # 4. OpenGraph Generation endpoint (+ README alias /api/og)
        if path in ("/api/og/generate", "/api/og"):
            result = generate_og(body)
            self._send_json(200, result)
            return

        # 5. Performance Diff endpoint
        if path in ("/api/diff", "/api/compare"):
            baseline = body.get("baseline")
            candidate = body.get("candidate")
            device = str(body.get("device") or "mobile")

            if not baseline or not candidate:
                self._send_json(400, {"error": "Missing 'baseline' or 'candidate' in request body", "status": 400})
                return

            baseline_str = baseline.get("html") or baseline.get("url", "") if isinstance(baseline, dict) else str(baseline)
            candidate_str = candidate.get("html") or candidate.get("url", "") if isinstance(candidate, dict) else str(candidate)

            diff_result = compare_diff(baseline_str, candidate_str, device=device)
            self._send_json(200, diff_result)
            return

        # 6. Cache Headers export endpoint (+ README alias /api/cache)
        if path in ("/api/cache/export", "/api/cache"):
            platform = body.get("platform") or body.get("framework") or "netlify"
            result = export_cache_headers(str(platform), body.get("custom_rules"))
            self._send_json(200, result)
            return

        # 7. MCP config endpoint
        if path == "/api/mcp/config":
            client = str(body.get("client") or "claude")
            self._send_json(200, get_mcp_config(client))
            return

        # 8. Zip bundle export endpoint (strictly allowlisted bundle_type)
        if path == "/api/export-zip":
            bundle_type = str(body.get("bundle_type") or "pwa").strip().lower()
            if bundle_type not in ALLOWED_BUNDLE_TYPES:
                self._send_json(
                    400,
                    {
                        "error": f"Invalid bundle_type. Allowed values: {sorted(ALLOWED_BUNDLE_TYPES)}",
                        "status": 400,
                    },
                )
                return
            data = body.get("data", {})
            zip_bytes = create_zip_bundle(bundle_type, data if isinstance(data, dict) else {})
            self._send_bytes(
                200,
                zip_bytes,
                "application/zip",
                extra_headers={"Content-Disposition": f'attachment; filename="cwv-speed-{bundle_type}-bundle.zip"'},
            )
            return

        # 9. Speculation Rules endpoint
        if path == "/api/speculation":
            from .speculation_engine import generate_speculation_plan
            content = str(body.get("content") or body.get("html") or body.get("target") or "")
            base_url = str(body.get("base_url") or "https://example.com")
            aggressiveness = str(body.get("aggressiveness") or "balanced")
            plan = generate_speculation_plan(content, base_url=base_url, aggressiveness=aggressiveness)
            self._send_json(200, plan.to_dict())
            return

        # 10. Performance Budget endpoint
        if path == "/api/budget":
            from .budget_simulator import audit_performance_budget
            content = str(body.get("content") or body.get("html") or body.get("target") or "")
            target_name = str(body.get("target_name") or "Web Studio Audit")
            custom_budgets = body.get("custom_budgets")
            report = audit_performance_budget(
                html_or_resources=content,
                custom_budgets=custom_budgets if isinstance(custom_budgets, dict) else None,
                target_name=target_name,
            )
            self._send_json(200, report.to_dict())
            return

        self._send_json(404, {"error": f"Endpoint {path} not found", "status": 404})


# ==============================================================================
# Server Factory & Runner Helpers
# ==============================================================================

def create_server(host: str = "127.0.0.1", port: int = 8128, directory: Optional[str] = None) -> http.server.ThreadingHTTPServer:
    """Create and configure a ThreadingHTTPServer instance for CWV Speed Studio."""
    handler = lambda *args, **kwargs: SpeedStudioRequestHandler(*args, directory=directory, **kwargs)
    return http.server.ThreadingHTTPServer((host, port), handler)


def start_ui_server(
    host: str = "127.0.0.1",
    port: int = 8128,
    open_browser: bool = False,
    blocking: bool = True,
    directory: Optional[str] = None,
) -> Union[http.server.ThreadingHTTPServer, Tuple[http.server.ThreadingHTTPServer, threading.Thread]]:
    """Start the CWV Speed Studio web UI server."""
    server = create_server(host, port, directory=directory)
    url = f"http://{host}:{port}/"
    print(f"\nCWV Speed Engine v{VERSION} listening on {url} (REST API: {url}api/health)\n")

    if open_browser:
        try:
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        except Exception as e:
            logger.debug("Could not open browser automatically: %s", e)

    if blocking:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            server.shutdown()
        return server

    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def main() -> None:
    """CLI launcher for CWV Speed Studio UI Server."""
    parser = argparse.ArgumentParser(description=f"CWV Speed Studio UI Server v{VERSION} (cwv-speed-engine)")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8128, help="Port to bind (default: 8128)")
    parser.add_argument("--open", action="store_true", help="Automatically open browser")
    parser.add_argument("--dir", default=None, help="Custom directory to serve static assets from")
    args = parser.parse_args()
    start_ui_server(host=args.host, port=args.port, open_browser=args.open, blocking=True, directory=args.dir)


if __name__ == "__main__":
    main()
