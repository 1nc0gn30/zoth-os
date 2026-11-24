#!/usr/bin/env python3
"""
Zoth Hub Server — Categorized, 100% honest ZothOS desktop launcher & tool catalog.

Zero external dependencies (Python 3 stdlib only).
Exposes:
  GET  /health
  GET  /api/categories
  GET  /api/catalog      (live TCP 60ms port probes + shutil.which CLI detection)
  POST /api/launch       (strict catalog allowlist, zero shell injection)
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import mimetypes
import os
import platform
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from socketserver import ThreadingMixIn
from typing import Any, Dict, List, Optional, Tuple

__version__ = "1.0.0"

HERE = Path(__file__).resolve().parent
CATALOG_PATH = HERE / "catalog.json"
PUBLIC_DIR = HERE / "public"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8195
TCP_PROBE_TIMEOUT_SEC = 0.06  # 60ms fast loopback probe

EXTRA_BIN_DIRS = (
    Path("/usr/local/bin"),
    Path("/usr/bin"),
    Path.home() / ".local" / "bin",
)

# Desktop GUI binaries that should launch directly rather than inside a terminal
DIRECT_GUI_BINS = {
    "konsole",
    "zoth-chrome",
    "google-chrome",
    "chromium",
    "launch-calamares",
    "calamares",
    "keepassxc",
    "dolphin",
    "zoth-studio",
    "zoth-control-center",
    "firefox",
    "systemsettings",
}


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def load_raw_catalog(catalog_path: Path = CATALOG_PATH) -> Dict[str, Any]:
    if not catalog_path.is_file():
        raise FileNotFoundError(f"Zoth Hub catalog not found at {catalog_path}")
    return json.loads(catalog_path.read_text(encoding="utf-8"))


def find_cli_binary(candidates: List[str]) -> Optional[str]:
    for name in candidates:
        if not name or "/" in name or "\\" in name or " " in name:
            continue
        found = shutil.which(name)
        if found:
            return found
        for d in EXTRA_BIN_DIRS:
            cand = d / name
            if cand.is_file() and os.access(cand, os.X_OK):
                return str(cand)
    return None


def probe_tcp_port(port: Optional[int], timeout: float = TCP_PROBE_TIMEOUT_SEC) -> bool:
    if not isinstance(port, int) or port <= 0 or port > 65535:
        return False
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        return sock.connect_ex(("127.0.0.1", port)) == 0
    except OSError:
        return False
    finally:
        try:
            sock.close()
        except OSError:
            pass


def _is_browser_capable(item: Dict[str, Any]) -> bool:
    exec_type = str(item.get("execution_type") or "")
    live_url = str(item.get("live_url") or "")
    return exec_type in ("browser", "webgpu", "hybrid") or live_url.startswith("https://")


def inspect_item(item: Dict[str, Any]) -> Dict[str, Any]:
    cli_bins = item.get("cli_bins") or []
    local_port = item.get("local_port")
    local_url = str(item.get("local_url") or "")
    live_url = str(item.get("live_url") or "")
    studio_url = str(item.get("studio_url") or "")
    exec_type = str(item.get("execution_type") or "local_cli")

    detected_bin = find_cli_binary(cli_bins)
    port_open = probe_tcp_port(local_port)
    browser_capable = _is_browser_capable(item)

    # Honest 4-state status hierarchy
    if port_open:
        status = "running"
        status_label = "Running Locally"
        runtime_summary = f"Live daemon responding on 127.0.0.1:{local_port}"
    elif detected_bin:
        status = "installed_cli"
        status_label = "Installed"
        runtime_summary = f"Binary installed at {detected_bin}"
    elif browser_capable:
        status = "browser_ready"
        status_label = "Browser-Ready"
        runtime_summary = (
            "Runs 100% in browser (zero local install required)"
            if exec_type in ("browser", "webgpu")
            else "Available in Zoth Studio web workbench"
        )
    else:
        status = "not_installed"
        status_label = "Not Installed"
        runtime_summary = "Not installed on this machine — inspect CLI install command"

    can_open_local = bool(port_open and local_url.startswith("http://127.0.0.1:"))
    can_launch_cli = bool(detected_bin)
    can_open_browser = bool(live_url.startswith("https://") or studio_url.startswith("https://"))

    enriched = dict(item)
    enriched.update(
        {
            "status": status,
            "status_label": status_label,
            "port_open": port_open,
            "detected_bin": detected_bin,
            "runtime_summary": runtime_summary,
            "capabilities": {
                "can_open_local": can_open_local,
                "can_launch_cli": can_launch_cli,
                "can_open_browser": can_open_browser,
            },
        }
    )
    return enriched


def probe_catalog(catalog_path: Path = CATALOG_PATH) -> Dict[str, Any]:
    raw = load_raw_catalog(catalog_path)
    raw_items = raw.get("items", [])
    categories = [dict(c) for c in raw.get("categories", [])]

    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        enriched_items = list(pool.map(inspect_item, raw_items))
    probe_ms = round((time.monotonic() - started) * 1000.0, 1)

    summary = {
        "total": len(enriched_items),
        "running": 0,
        "installed_cli": 0,
        "browser_ready": 0,
        "not_installed": 0,
    }
    cat_counts: Dict[str, Dict[str, int]] = {
        c["id"]: {
            "total": 0,
            "running": 0,
            "installed_cli": 0,
            "browser_ready": 0,
            "not_installed": 0,
        }
        for c in categories
    }

    for it in enriched_items:
        st = it["status"]
        summary[st] = summary.get(st, 0) + 1
        cid = it["category_id"]
        if cid in cat_counts:
            cat_counts[cid]["total"] += 1
            cat_counts[cid][st] = cat_counts[cid].get(st, 0) + 1

    for c in categories:
        c["counts"] = cat_counts.get(c["id"], {})

    return {
        "service": "zoth-hub",
        "version": __version__,
        "probed_at": datetime.now(timezone.utc).isoformat(),
        "probe_ms": probe_ms,
        "host": platform.node(),
        "studio_tools_count": raw.get("studio_tools_count", 0),
        "core_apps_count": raw.get("core_apps_count", 0),
        "summary": summary,
        "categories": categories,
        "items": enriched_items,
    }


def _find_browser_cmd() -> Optional[str]:
    for cand in ("zoth-chrome", "xdg-open", "google-chrome", "chromium", "firefox"):
        found = find_cli_binary([cand])
        if found:
            return found
    return None


def _build_launch_argv(item: Dict[str, Any], mode: str) -> Tuple[List[str], str, str]:
    """
    Build a strictly allowlisted subprocess argv for a catalog item.
    Never constructs shell command strings or uses shell=True.
    Returns (argv, resolved_mode, target_description).
    """
    if mode not in ("auto", "local", "cli", "browser"):
        raise ValueError(f"Unsupported launch mode: {mode}")

    detected_bin = item.get("detected_bin")
    port_open = bool(item.get("port_open"))
    local_url = str(item.get("local_url") or "")
    live_url = str(item.get("live_url") or "")
    studio_url = str(item.get("studio_url") or "")

    resolved_mode = mode
    if mode == "auto":
        if port_open and local_url.startswith("http://127.0.0.1:"):
            resolved_mode = "local"
        elif detected_bin:
            resolved_mode = "cli"
        elif live_url.startswith("https://") or studio_url.startswith("https://"):
            resolved_mode = "browser"
        else:
            raise RuntimeError(
                f"{item['name']} is not installed locally and has no browser endpoint. "
                f"Install command: {item.get('pull') or 'see catalog'}"
            )

    if resolved_mode == "local":
        if not local_url.startswith("http://127.0.0.1:"):
            raise RuntimeError(f"{item['name']} has no local loopback URL configured.")
        browser = _find_browser_cmd()
        if not browser:
            raise RuntimeError("No browser opener (zoth-chrome / xdg-open) found on PATH.")
        return ([browser, local_url], "local", local_url)

    if resolved_mode == "browser":
        target_url = live_url if live_url.startswith("https://") else studio_url
        if not target_url.startswith("https://"):
            raise RuntimeError(f"{item['name']} has no web URL available.")
        browser = _find_browser_cmd()
        if not browser:
            raise RuntimeError("No browser opener (zoth-chrome / xdg-open) found on PATH.")
        return ([browser, target_url], "browser", target_url)

    # CLI / Desktop binary launch
    if not detected_bin or not os.path.isfile(detected_bin):
        raise RuntimeError(f"No installed binary found on PATH for {item['name']}.")

    bin_name = Path(detected_bin).name
    if bin_name in DIRECT_GUI_BINS:
        return ([detected_bin], "desktop", detected_bin)

    # Launch CLI tools cleanly inside zoth-konsole or konsole (zero xfce4-terminal!)
    safe_title = "".join(ch for ch in str(item.get("name") or bin_name) if ch.isalnum() or ch in " -_.()")[:48]
    zoth_konsole = find_cli_binary(["zoth-konsole"])
    if zoth_konsole:
        # Use --pause so one-shot --help / interactive status stays readable and closes on Enter
        return ([zoth_konsole, "--pause", "--title", safe_title, "--", detected_bin, "--help"], "cli", detected_bin)

    konsole = find_cli_binary(["konsole"])
    if konsole:
        return ([konsole, "-e", detected_bin, "--help"], "cli", detected_bin)

    raise RuntimeError("No KDE Konsole terminal binary (zoth-konsole or konsole) available to launch CLI.")


def launch_catalog_item(
    item_id: str,
    mode: str = "auto",
    catalog_path: Path = CATALOG_PATH,
    dry_run: bool = False,
) -> Dict[str, Any]:
    if not isinstance(item_id, str) or not item_id or len(item_id) > 80:
        raise KeyError("Invalid tool identifier")
    # Strict allowlist character check before lookup
    for ch in item_id:
        if not (ch.isalnum() or ch in "-_."):
            raise KeyError("Invalid tool identifier characters")

    raw = load_raw_catalog(catalog_path)
    match = None
    for entry in raw.get("items", []):
        if entry.get("id") == item_id:
            match = entry
            break
    if match is None:
        raise KeyError(f"Unknown tool id: {item_id}")

    enriched = inspect_item(match)
    argv, resolved_mode, target = _build_launch_argv(enriched, mode)

    effective_dry_run = dry_run or os.environ.get("ZOTH_HUB_DRY_RUN") == "1"
    pid: Optional[int] = None
    if not effective_dry_run:
        proc = subprocess.Popen(
            argv,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
            close_fds=True,
        )
        pid = proc.pid

    return {
        "ok": True,
        "id": item_id,
        "name": enriched["name"],
        "mode": resolved_mode,
        "target": target,
        "argv": argv,
        "dry_run": effective_dry_run,
        "pid": pid,
    }


def make_handler(catalog_path: Path = CATALOG_PATH, public_dir: Path = PUBLIC_DIR, port: int = DEFAULT_PORT):
    class ZothHubHandler(BaseHTTPRequestHandler):
        server_version = f"ZothHub/{__version__}"

        def log_message(self, fmt: str, *args: Any) -> None:
            if os.environ.get("ZOTH_HUB_VERBOSE") == "1":
                super().log_message(fmt, *args)

        def _send_json(self, status: int, payload: Dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.end_headers()
            self.wfile.write(body)

        def _send_static(self, rel_path: str) -> None:
            clean = rel_path.lstrip("/") or "index.html"
            if clean == "":
                clean = "index.html"
            target = (public_dir / clean).resolve()
            try:
                target.relative_to(public_dir.resolve())
            except ValueError:
                self._send_json(HTTPStatus.FORBIDDEN, {"error": "Forbidden path"})
                return
            if not target.is_file():
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found"})
                return
            data = target.read_bytes()
            ctype, _ = mimetypes.guess_type(str(target))
            if not ctype:
                ctype = "application/octet-stream"
            if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
                ctype = f"{ctype}; charset=utf-8"
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self) -> None:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            qs = urllib.parse.parse_qs(parsed.query)

            if path == "/health":
                raw = load_raw_catalog(catalog_path)
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "status": "ok",
                        "service": "zoth-hub",
                        "version": __version__,
                        "port": port,
                        "total_items": len(raw.get("items", [])),
                        "studio_tools_count": raw.get("studio_tools_count", 0),
                        "categories": len(raw.get("categories", [])),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
                return

            if path == "/api/categories":
                data = probe_catalog(catalog_path)
                self._send_json(
                    HTTPStatus.OK,
                    {
                        "categories": data["categories"],
                        "summary": data["summary"],
                        "probe_ms": data["probe_ms"],
                    },
                )
                return

            if path == "/api/catalog":
                data = probe_catalog(catalog_path)
                items = data["items"]
                cat_filter = (qs.get("category") or [""])[0].strip()
                status_filter = (qs.get("status") or [""])[0].strip()
                q_filter = (qs.get("q") or [""])[0].strip().lower()

                if cat_filter and cat_filter != "all":
                    items = [it for it in items if it["category_id"] == cat_filter]
                if status_filter and status_filter != "all":
                    items = [it for it in items if it["status"] == status_filter]
                if q_filter:
                    items = [
                        it
                        for it in items
                        if q_filter in it["name"].lower()
                        or q_filter in it["id"].lower()
                        or q_filter in it["description"].lower()
                        or q_filter in it["category"].lower()
                        or q_filter in it["original_category"].lower()
                    ]
                data["items"] = items
                data["filtered_count"] = len(items)
                self._send_json(HTTPStatus.OK, data)
                return

            if path in ("/", "/index.html"):
                self._send_static("index.html")
                return

            self._send_static(path)

        def do_POST(self) -> None:
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path != "/api/launch":
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Unknown API endpoint"})
                return

            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid Content-Length"})
                return
            if length <= 0 or length > 8192:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Request body missing or too large"})
                return

            raw_body = self.rfile.read(length)
            try:
                payload = json.loads(raw_body.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON body"})
                return
            if not isinstance(payload, dict):
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "JSON payload must be an object"})
                return

            item_id = payload.get("id")
            mode = str(payload.get("mode") or "auto").strip().lower()
            dry_run = bool(payload.get("dry_run", False))

            if not isinstance(item_id, str) or not item_id.strip():
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Missing required string field: id"})
                return
            if mode not in ("auto", "local", "cli", "browser"):
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": f"Invalid launch mode: {mode}"})
                return

            try:
                result = launch_catalog_item(
                    item_id=item_id.strip(),
                    mode=mode,
                    catalog_path=catalog_path,
                    dry_run=dry_run,
                )
            except KeyError as exc:
                self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": str(exc)})
                return
            except ValueError as exc:
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
                return
            except RuntimeError as exc:
                self._send_json(HTTPStatus.CONFLICT, {"ok": False, "error": str(exc)})
                return

            self._send_json(HTTPStatus.OK, result)

    return ZothHubHandler


def _check_running_hub(host: str, port: int) -> Optional[Dict[str, Any]]:
    url = f"http://{host}:{port}/health"
    try:
        with urllib.request.urlopen(url, timeout=0.6) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError):
        return None
    return None


def _open_url_async(url: str) -> None:
    def _worker() -> None:
        time.sleep(0.35)
        browser = _find_browser_cmd()
        if browser:
            try:
                subprocess.Popen(
                    [browser, url],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                    close_fds=True,
                )
            except OSError:
                pass

    threading.Thread(target=_worker, daemon=True).start()


def cmd_status(host: str, port: int, as_json: bool) -> int:
    live = _check_running_hub(host, port)
    probed = probe_catalog(CATALOG_PATH)
    out = {
        "service": "zoth-hub",
        "version": __version__,
        "url": f"http://{host}:{port}",
        "server_running": live is not None,
        "summary": probed["summary"],
        "probe_ms": probed["probe_ms"],
        "categories": [
            {"id": c["id"], "name": c["name"], "counts": c["counts"]}
            for c in probed["categories"]
        ],
    }
    if as_json:
        print(json.dumps(out, indent=2))
    else:
        state = f"RUNNING on http://{host}:{port}" if live else f"STOPPED (default port {port})"
        s = probed["summary"]
        print(f"Zoth Hub v{__version__} — {state}")
        print(
            f"Catalog: {s['total']} tools across {len(probed['categories'])} categories "
            f"(probe {probed['probe_ms']}ms)"
        )
        print(
            f"  Running locally : {s['running']}\n"
            f"  Installed CLI   : {s['installed_cli']}\n"
            f"  Browser-ready   : {s['browser_ready']}\n"
            f"  Not installed   : {s['not_installed']}"
        )
    return 0


def cmd_list(as_json: bool) -> int:
    probed = probe_catalog(CATALOG_PATH)
    if as_json:
        print(json.dumps(probed, indent=2))
        return 0
    by_cat: Dict[str, List[Dict[str, Any]]] = {}
    for item in probed["items"]:
        by_cat.setdefault(item["category"], []).append(item)
    for cat in probed["categories"]:
        cname = cat["name"]
        rows = by_cat.get(cname, [])
        print(f"\n[{cat['icon']}] {cname} ({len(rows)})")
        for it in rows:
            badge = it["status"].upper().ljust(13)
            port_str = f":{it['local_port']}" if it.get("local_port") else "     "
            print(f"  {badge} {port_str:>6}  {it['id']:<30} {it['name']}")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="zoth-hub",
        description="Zoth Hub — Categorized, transparent desktop launcher for all 85 Zoth tools & core OS apps.",
    )
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Bind host (default: {DEFAULT_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help=f"Bind port (default: {DEFAULT_PORT})")
    parser.add_argument("--no-browser", action="store_true", help="Start server without opening browser")
    parser.add_argument("--status", action="store_true", help="Print live Zoth Hub status and tool probe summary")
    parser.add_argument("--list", action="store_true", help="List all categorized tools with live status")
    parser.add_argument("--json", action="store_true", help="Output JSON (for --status or --list)")
    args = parser.parse_args(argv)

    if args.status:
        return cmd_status(args.host, args.port, args.json)
    if args.list:
        return cmd_list(args.json)

    url = f"http://{args.host}:{args.port}"
    existing = _check_running_hub(args.host, args.port)
    if existing and existing.get("service") == "zoth-hub":
        if not args.no_browser:
            browser = _find_browser_cmd()
            if browser:
                subprocess.Popen(
                    [browser, url],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                    close_fds=True,
                )
        print(f"Zoth Hub already running at {url}")
        return 0

    handler_cls = make_handler(CATALOG_PATH, PUBLIC_DIR, args.port)
    server = ThreadingHTTPServer((args.host, args.port), handler_cls)
    print(f"Zoth Hub v{__version__} listening on {url}", flush=True)
    if not args.no_browser:
        _open_url_async(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
