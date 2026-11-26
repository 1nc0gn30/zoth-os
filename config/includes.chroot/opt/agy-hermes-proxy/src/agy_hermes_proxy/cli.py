"""CLI entrypoint for `agy-hermes-proxy` (serve, status, models, doctor, --version)."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from . import __version__
from .app import get_exec_timeout, get_max_body_bytes, get_max_concurrency, resolve_agy_bin


def _http_get_json(url: str, timeout: float = 4.0) -> Dict[str, Any]:
    headers = {"Accept": "application/json"}
    token = os.environ.get("AGY_PROXY_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
        return json.loads(raw)


def cmd_serve(host: str, port: int, log_level: str = "info") -> int:
    import uvicorn
    from .app import create_app

    print(f"Starting AGY-Hermes OpenAI Bridge v{__version__} on http://{host}:{port}/v1 ...")
    uvicorn.run(create_app(), host=host, port=port, log_level=log_level)
    return 0


def cmd_status(host: str, port: int, as_json: bool) -> int:
    url = f"http://{host}:{port}/health"
    try:
        data = _http_get_json(url)
        if as_json:
            print(json.dumps(data, indent=2))
        else:
            print(f"AGY-Hermes Proxy v{data.get('version', 'unknown')} — ONLINE ({host}:{port})")
            print(f"  AGY CLI : {'available' if data.get('agy_available') else 'missing'} ({data.get('agy_version') or 'n/a'})")
            print(f"  Models  : {data.get('models_count', 0)} ({data.get('models_source', 'unknown')})")
            print(f"  Slots   : {data.get('active_requests', 0)} / {data.get('max_concurrency', 0)}")
            print(f"  Uptime  : {data.get('uptime_seconds', 0)}s")
        return 0
    except Exception as exc:
        err = {"status": "offline", "host": host, "port": port, "error": str(exc)}
        if as_json:
            print(json.dumps(err, indent=2))
        else:
            print(f"AGY-Hermes Proxy — OFFLINE ({host}:{port}): {exc}", file=sys.stderr)
        return 1


def cmd_models(host: str, port: int, as_json: bool) -> int:
    url = f"http://{host}:{port}/v1/models"
    try:
        data = _http_get_json(url)
        items = data.get("data", [])
        if as_json:
            print(json.dumps(data, indent=2))
        else:
            print(f"AGY-Hermes Proxy models ({len(items)} available on {host}:{port}):")
            for m in items:
                print(f"  {m.get('id', ''):32s}  {m.get('display_name', '')}  [{m.get('owned_by', '')}]")
        return 0
    except Exception as exc:
        err = {"error": str(exc), "host": host, "port": port}
        if as_json:
            print(json.dumps(err, indent=2))
        else:
            print(f"Failed to query models on {host}:{port}: {exc}", file=sys.stderr)
        return 1


def cmd_doctor(host: str, port: int, as_json: bool) -> int:
    agy_bin = resolve_agy_bin()
    agy_version: Optional[str] = None
    if agy_bin:
        try:
            proc = subprocess.run([agy_bin, "--version"], capture_output=True, text=True, timeout=5)
            if proc.returncode == 0 and proc.stdout.strip():
                agy_version = proc.stdout.strip().splitlines()[0]
        except Exception:
            pass

    proxy_online = False
    proxy_health: Optional[Dict[str, Any]] = None
    try:
        proxy_health = _http_get_json(f"http://{host}:{port}/health", timeout=2.5)
        proxy_online = proxy_health.get("status") == "ok"
    except Exception:
        proxy_online = False

    report = {
        "version": __version__,
        "python": sys.version.split()[0],
        "agy_available": bool(agy_bin),
        "agy_version": agy_version,
        "proxy_endpoint": f"http://{host}:{port}",
        "proxy_online": proxy_online,
        "proxy_version": proxy_health.get("version") if proxy_health else None,
        "models_count": proxy_health.get("models_count") if proxy_health else None,
        "cli_on_path": bool(shutil.which("agy-hermes-proxy")),
        "security": {
            "host_allowlist": ["127.0.0.1", "localhost", "[::1]"],
            "loopback_cors_only": True,
            "auth_token_configured": bool(os.environ.get("AGY_PROXY_TOKEN", "").strip()),
            "max_body_bytes": get_max_body_bytes(),
            "max_concurrency": get_max_concurrency(),
            "timeout_seconds": get_exec_timeout(),
        },
        "ok": bool(agy_bin),
    }

    if as_json:
        print(json.dumps(report, indent=2))
    else:
        print(f"agy-hermes-proxy doctor (v{__version__})")
        print(f"  Python          : {report['python']}")
        print(f"  AGY CLI         : {'OK (' + (agy_version or 'detected') + ')' if agy_bin else 'MISSING'}")
        print(f"  Live Proxy      : {'ONLINE v' + str(report['proxy_version']) + ' (' + str(report['models_count']) + ' models)' if proxy_online else 'OFFLINE (' + report['proxy_endpoint'] + ')'}")
        print(f"  Security        : loopback Host+CORS allowlist, cap={report['security']['max_body_bytes']}B, max_conc={report['security']['max_concurrency']}, timeout={report['security']['timeout_seconds']}s")
    return 0 if report["ok"] else 1


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="agy-hermes-proxy",
        description="Hardened loopback OpenAI-compatible bridge to Antigravity CLI (agy).",
    )
    parser.add_argument("--version", action="version", version=f"agy-hermes-proxy {__version__}")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind or query (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=18000, help="Port to bind or query (default: 18000)")
    parser.add_argument("--log-level", default="info", help="Uvicorn log level when serving directly")

    sub = parser.add_subparsers(dest="command")

    p_serve = sub.add_parser("serve", help="Run the AGY-Hermes OpenAI-compatible HTTP bridge")
    p_serve.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    p_serve.add_argument("--port", type=int, default=18000, help="Bind port (default: 18000)")
    p_serve.add_argument("--log-level", default="info", help="Uvicorn log level")

    p_status = sub.add_parser("status", help="Check live proxy health status")
    p_status.add_argument("--host", default="127.0.0.1")
    p_status.add_argument("--port", type=int, default=18000)
    p_status.add_argument("--json", action="store_true", dest="as_json", help="Emit JSON output")

    p_models = sub.add_parser("models", help="List available models from the proxy")
    p_models.add_argument("--host", default="127.0.0.1")
    p_models.add_argument("--port", type=int, default=18000)
    p_models.add_argument("--json", action="store_true", dest="as_json", help="Emit JSON output")

    p_doctor = sub.add_parser("doctor", help="Run local diagnostics for AGY CLI and proxy security posture")
    p_doctor.add_argument("--host", default="127.0.0.1")
    p_doctor.add_argument("--port", type=int, default=18000)
    p_doctor.add_argument("--json", action="store_true", dest="as_json", help="Emit JSON output")

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "status":
        return cmd_status(args.host, args.port, args.as_json)
    if args.command == "models":
        return cmd_models(args.host, args.port, args.as_json)
    if args.command == "doctor":
        return cmd_doctor(args.host, args.port, args.as_json)
    # Default or explicit `serve`: supports backwards-compatible `agy-hermes-proxy --port 18000`
    return cmd_serve(args.host, args.port, getattr(args, "log_level", "info"))


if __name__ == "__main__":
    raise SystemExit(main())
