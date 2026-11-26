"""CLI Interface for Agent Voice Call Station.

100% Python Standard Library — Zero External Dependencies.
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import logging
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from typing import List, Optional

from . import __version__
from .call_engine import CallManager
from .mcp_server import run_stdio as run_mcp_stdio
from .server import VoiceCallServer
from .tts_bridge import VOICES, get_tts_status, is_kokoro_online


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    for var in ("ZOTH_BIND_HOST", "HOST"):
        val = os.environ.get(var, "").strip()
        if val == "localhost":
            return "127.0.0.1"
        if val:
            try:
                ipaddress.ip_address(val)
                return val
            except ValueError:
                pass
    return "127.0.0.1"


logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] (VoiceCall) %(message)s",
)
logger = logging.getLogger("agent_voice_call.cli")


def cmd_serve(args: argparse.Namespace) -> int:
    """Start the live voice calling station HTTP server."""
    manager = CallManager()
    server = VoiceCallServer(args.host, args.port, manager)
    tts_info = get_tts_status()

    print("\n" + "=" * 70)
    print(f"  AGENT VOICE CALL STATION v{__version__} • PORT {args.port}")
    print("=" * 70)
    print(f"  • Web Call Cockpit:   http://{args.host}:{args.port}/")
    print(f"  • Local-First TTS:    {tts_info['tts_engine']} (cloud opt-in: {tts_info['cloud_tts_opt_in']})")
    print(f"  • Kokoro (:9394):     {'ONLINE' if tts_info['kokoro_online'] else 'STANDBY'}")
    print(f"  • Available Voices:   {', '.join(VOICES.keys())}")
    print("=" * 70 + "\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down voice call station...")
        server.server_close()
    return 0


def cmd_call(args: argparse.Namespace) -> int:
    """Generate a scoped live voice call link via the running local daemon."""
    url = f"http://127.0.0.1:{args.port}/api/call/create"
    data = json.dumps({"channel": args.channel, "voice": args.voice}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            if getattr(args, "json", False):
                print(json.dumps(res, indent=2))
            else:
                print(f"Session ID: {res['session_id']}")
                print(f"Local URL:  {res.get('local_url', res['call_url'])}")
                print(f"Call URL:   {res['call_url']}")
            return 0
    except Exception as e:
        print(f"Error creating call link: {e}", file=sys.stderr)
        return 1


def cmd_status(host: str = "127.0.0.1", port: int = 8114, as_json: bool = False) -> int:
    url = f"http://{host}:{port}/health"
    live_info = None
    try:
        with urllib.request.urlopen(url, timeout=2.0) as resp:
            live_info = json.loads(resp.read().decode("utf-8"))
    except Exception:
        pass

    tts_info = get_tts_status()
    data = {
        "status": "online" if live_info else "standby",
        "service": "agent-voice-call",
        "version": __version__,
        "port": port,
        "kokoro_online": tts_info["kokoro_online"],
        "tts_engine": tts_info["tts_engine"],
        "local_first_tts": tts_info["local_first_tts"],
        "cloud_tts_opt_in": tts_info["cloud_tts_opt_in"],
        "available_voices": list(VOICES.keys()),
        "license": "100% Free & Open Access (Zero Paywalls)",
        "daemon": live_info,
    }

    if as_json:
        print(json.dumps(data, indent=2))
        return 0

    print("\n" + "=" * 70)
    print(f"  AGENT VOICE CALL STATION v{__version__} • PORT {port}")
    print("=" * 70)
    state_color = "\033[38;5;48mONLINE\033[0m" if live_info else "\033[38;5;208mSTANDBY\033[0m"
    print(f"  • Daemon Status:     {state_color} ({url})")
    print(f"  • Active TTS Engine: {tts_info['tts_engine']} (local-first, cloud opt-in={tts_info['cloud_tts_opt_in']})")
    print(f"  • Kokoro (:9394):    {'ONLINE' if data['kokoro_online'] else 'STANDBY'}")
    print(f"  • Available Voices:  {', '.join(data['available_voices'])}")
    print("  • Access Guarantee:  100% Free & Open Access (Zero Paywalls)")
    print("=" * 70 + "\n")
    return 0


def cmd_history(args: argparse.Namespace) -> int:
    """List recent persisted call debriefs."""
    mgr = CallManager()
    debriefs = mgr.list_debriefs(limit=args.limit)
    if args.json:
        print(json.dumps({"count": len(debriefs), "debriefs": debriefs}, indent=2))
        return 0
    if not debriefs:
        print("No persisted call debriefs found.")
        return 0
    for item in debriefs:
        print(
            f"[{item.get('ended_at', '')}] {item.get('session_id', '')} "
            f"voice={item.get('voice', '')} turns={item.get('total_turns', 0)} "
            f"duration={item.get('duration_sec', 0)}s"
        )
    return 0


def cmd_desktop(args: argparse.Namespace) -> int:
    """Open the local Agent Voice Call workstation in the desktop browser (starting daemon if needed)."""
    port = int(args.port)
    target_url = f"http://127.0.0.1:{port}/"
    health_url = f"http://127.0.0.1:{port}/health"

    daemon_running = False
    try:
        with urllib.request.urlopen(health_url, timeout=0.8) as resp:
            daemon_running = resp.status == 200
    except Exception:
        daemon_running = False

    opener = shutil.which("xdg-open") or shutil.which("chromium") or shutil.which("firefox")

    if getattr(args, "dry_run", False):
        print(json.dumps({
            "action": "desktop",
            "version": __version__,
            "url": target_url,
            "daemon_running": daemon_running,
            "opener": opener or "none",
        }, indent=2))
        return 0

    if not daemon_running:
        subprocess.Popen(
            [sys.executable, "-m", "agent_voice_call.cli", "serve", "--host", "127.0.0.1", "--port", str(port)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        for _ in range(25):
            time.sleep(0.15)
            try:
                with urllib.request.urlopen(health_url, timeout=0.5) as resp:
                    if resp.status == 200:
                        break
            except Exception:
                continue

    if opener:
        subprocess.Popen([opener, target_url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Opened Agent Voice Call desktop workstation at {target_url}")
        return 0

    print(f"Agent Voice Call workstation ready at {target_url}")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="agent-voice-call",
        description="Agent Voice Call — Local-First Voice Calling Station & Stdio MCP Server",
    )
    parser.add_argument("-v", "--version", action="version", version=f"agent-voice-call {__version__}")
    parser.add_argument("--status", action="store_true", help="Print local service status and configuration")
    parser.add_argument("--json", action="store_true", help="Output status/telemetry as JSON")
    parser.add_argument("--host", default=_default_bind_host(), help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8114, help="Port to bind/check (default: 8114)")

    subparsers = parser.add_subparsers(dest="command")

    # Status command
    status_p = subparsers.add_parser("status", help="Inspect status of running voice call daemon")
    status_p.add_argument("--host", default="127.0.0.1")
    status_p.add_argument("--port", type=int, default=8114)
    status_p.add_argument("--json", action="store_true", help="Emit raw stats as JSON")

    # Serve command
    serve_p = subparsers.add_parser("serve", help="Run the live voice call HTTP server")
    serve_p.add_argument("--host", default=_default_bind_host(), help="Host interface")
    serve_p.add_argument("--port", type=int, default=8114, help="Port to bind (default: 8114)")

    # Call command
    call_p = subparsers.add_parser("call", help="Generate a live call URL")
    call_p.add_argument("--channel", default="web", choices=["signal", "simplex", "web"])
    call_p.add_argument("--voice", default="azoth", choices=list(VOICES.keys()))
    call_p.add_argument("--port", type=int, default=8114)
    call_p.add_argument("--json", action="store_true", help="Emit raw response as JSON")

    # MCP command
    subparsers.add_parser("mcp", help="Run the JSON-RPC 2.0 stdio MCP server")

    # Desktop command
    desktop_p = subparsers.add_parser("desktop", help="Open local web workstation in desktop browser")
    desktop_p.add_argument("--port", type=int, default=8114)
    desktop_p.add_argument("--dry-run", action="store_true", help="Print launch plan as JSON without opening browser")

    # History command
    hist_p = subparsers.add_parser("history", help="List persisted local call debriefs")
    hist_p.add_argument("--limit", type=int, default=10)
    hist_p.add_argument("--json", action="store_true")

    args = parser.parse_args(argv)

    if getattr(args, "status", False) or (getattr(args, "json", False) and not args.command):
        return cmd_status(host=args.host, port=args.port, as_json=bool(getattr(args, "json", False)))

    if args.command == "status":
        return cmd_status(host=args.host, port=args.port, as_json=args.json)
    if args.command == "serve":
        return cmd_serve(args)
    if args.command == "call":
        return cmd_call(args)
    if args.command == "mcp":
        return run_mcp_stdio()
    if args.command == "desktop":
        return cmd_desktop(args)
    if args.command == "history":
        return cmd_history(args)

    return cmd_status(host=args.host, port=args.port, as_json=False)


if __name__ == "__main__":
    sys.exit(main())
