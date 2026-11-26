"""
cli.py - Command Line Interface for Agent Flight Recorder.
Zero external dependencies (Python 3.10+ standard library).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import argparse
import json
import os
import sys
import time
import urllib.request

from . import __version__
from .storage import FlightStorage
from .recorder import SessionRecorder
from .server import FlightDeckServer
from .exporter import export_bundle
from .mcp_server import run_mcp_stdio


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    import ipaddress

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


def cmd_record(args: argparse.Namespace):
    cmd = args.command
    if not cmd and args.cmd_remainder:
        cmd = args.cmd_remainder
    if not cmd:
        print("Error: No command specified to record. Use --command '<cmd>' or pass arguments after --")
        sys.exit(1)

    storage = FlightStorage(db_path=args.db)
    recorder = SessionRecorder(
        storage=storage,
        session_id=args.session,
        title=args.title,
        with_proxy=bool(getattr(args, "with_proxy", False)),
    )

    print("=" * 70)
    print(f"  AGENT FLIGHT RECORDER v{__version__} • BLACK BOX FLIGHT SESSION")
    print(f"  Recording Target: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    print("=" * 70)

    exit_code = recorder.record_command(cmd)

    print("\n" + "=" * 70)
    print("  FLIGHT RECORDER MISSION COMPLETED")
    print(f"  Session ID:      {recorder.session_id}")
    print(f"  Exit Status:     {exit_code}")
    print("  Flight Deck UI:  Run 'agent-flight-recorder serve' to scrub execution")
    print("=" * 70)
    sys.exit(exit_code)


def cmd_serve(args: argparse.Namespace):
    port = args.port
    storage = FlightStorage(db_path=args.db)
    host = getattr(args, "host", None) or _default_bind_host()
    server = FlightDeckServer(host=host, port=port, storage=storage)

    print("=" * 70)
    print(f"  AGENT FLIGHT RECORDER v{__version__} • TIME-SCRUBBING COCKPIT")
    print(f"  Forensic Flight Deck UI: http://{host}:{port}/")
    print(f"  Event Ingestion API:     http://{host}:{port}/api/ingest")
    print(f"  Database Storage:        {args.db}")
    print("=" * 70)
    print("Press Ctrl+C to stop flight deck.")

    try:
        server.start()
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\n[*] Shutting down Flight Deck...")
    finally:
        server.stop()


def cmd_export(args: argparse.Namespace):
    storage = FlightStorage(db_path=args.db)
    sid = args.session
    if not sid:
        sessions = storage.get_sessions(limit=1)
        if not sessions:
            print("Error: No sessions found in database to export.")
            sys.exit(1)
        sid = sessions[0]["session_id"]

    out_file = args.output or f"incident-{sid}.html"
    try:
        abs_path = export_bundle(sid, storage, out_file)
        print(f"[✓] Incident bundle successfully exported to: {abs_path}")
        print("    Open this file directly in any web browser to replay offline.")
    except Exception as e:
        print(f"Export Error: {str(e)}")
        sys.exit(1)


def cmd_verify(args: argparse.Namespace):
    storage = FlightStorage(db_path=args.db)
    sid = args.session
    if not sid:
        sessions = storage.get_sessions(limit=1)
        if not sessions:
            print("Error: No sessions found in database to verify.")
            sys.exit(1)
        sid = sessions[0]["session_id"]

    result = storage.verify_session_chain(sid)
    if result is None:
        if getattr(args, "json", False):
            print(json.dumps({"error": f"Session not found: {sid}"}))
        else:
            print(f"Error: Session '{sid}' not found.")
        sys.exit(1)

    if getattr(args, "json", False):
        print(json.dumps(result, indent=2))
    else:
        status = "VALID" if result["valid"] else f"BROKEN at event #{result['broken_at_event_id']}"
        print(f"Session {sid}: SHA-256 Chain {status} ({result['event_count']} events)")
        print(f"Head Hash: {result['head_hash']}")

    sys.exit(0 if result["valid"] else 2)


def cmd_mcp(args: argparse.Namespace):
    run_mcp_stdio(db_path=args.db)


def cmd_status(args: argparse.Namespace):
    port = getattr(args, "port", 8104)
    as_json = bool(getattr(args, "json", False))
    live_health = None
    live_stats = None
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1.5) as resp:
            live_health = json.loads(resp.read().decode("utf-8"))
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/stats", timeout=1.5) as resp:
            live_stats = json.loads(resp.read().decode("utf-8"))
    except Exception:
        pass

    storage = FlightStorage(db_path=args.db)
    stats = live_stats if live_stats is not None else storage.get_db_stats()
    sessions = storage.get_sessions(limit=5)

    if as_json:
        print(
            json.dumps(
                {
                    "service": "agent-flight-recorder",
                    "version": __version__,
                    "online": live_health is not None,
                    "port": port,
                    "health": live_health,
                    "stats": stats,
                    "recent_sessions": sessions,
                    "attribution": "Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform",
                },
                indent=2,
            )
        )
        return

    print("=" * 66)
    print(f"  AGENT FLIGHT RECORDER v{__version__} • BLACK BOX TELEMETRY STATUS")
    print("=" * 66)
    print(f"  Daemon Endpoint:         http://127.0.0.1:{port} ({'ONLINE' if live_health else 'OFFLINE / LOCAL DB'})")
    print(f"  Total Recorded Sessions: {stats.get('total_sessions', 0)}")
    print(f"  Total Forensic Events:   {stats.get('total_events', 0)}")
    print(f"  Total Recorded Flight:   {stats.get('total_recorded_duration_s', 0)}s")
    print(f"  Database Footprint:      {stats.get('storage_size_kb', 0)} KB")
    print("-" * 66)
    print("Recent Flight Sessions:")
    if not sessions:
        print("  (No recorded sessions yet)")
    else:
        for s in sessions:
            status_symbol = "✓" if s["status"] == "completed" else "●"
            print(
                f"  • [{status_symbol}] {s['session_id']} | {s['title']} "
                f"({s['duration_seconds']}s, {s['event_count']} events)"
            )
    print("=" * 66)


def main():
    parser = argparse.ArgumentParser(
        prog="agent-flight-recorder",
        description=(
            f"Agent Flight Recorder v{__version__} — Autonomous Black Box Flight Recorder & "
            "Time-Scrubbing Telemetry Forensics Hub (Engineered by Neal Frazier Tech @1nc0gn30 • NullAI Platform)"
        ),
    )
    parser.add_argument("-v", "--version", action="version", version=f"agent-flight-recorder {__version__}")
    parser.add_argument("--status", action="store_true", help="Summarize flight telemetry storage and daemon status")
    parser.add_argument("--json", action="store_true", help="Emit telemetry as JSON")
    parser.add_argument("--port", type=int, default=8104, help="Flight deck port (default: 8104)")
    parser.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    subparsers = parser.add_subparsers(dest="subcommand", required=False)

    # record
    p_rec = subparsers.add_parser("record", help="Record an agent execution session")
    p_rec.add_argument("--command", "-c", help="Command string to run")
    p_rec.add_argument("--title", default="Agent Flight Run", help="Session title")
    p_rec.add_argument("--session", default=None, help="Custom session ID")
    p_rec.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_rec.add_argument(
        "--with-proxy",
        action="store_true",
        help="Opt-in to injecting local interceptor env vars (HTTP_PROXY=:8096, OPENAI_BASE_URL=:8099)",
    )
    p_rec.add_argument("cmd_remainder", nargs=argparse.REMAINDER, help="Command to run after --")
    p_rec.set_defaults(func=cmd_record)

    # serve
    p_srv = subparsers.add_parser("serve", help="Launch Time-Scrubbing Flight Deck UI")
    p_srv.add_argument(
        "--host",
        default=None,
        help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST; use 0.0.0.0 only on trusted networks)",
    )
    p_srv.add_argument("--port", type=int, default=8104, help="Flight deck port (default: 8104)")
    p_srv.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_srv.set_defaults(func=cmd_serve)

    # export
    p_exp = subparsers.add_parser("export", help="Export standalone single-file HTML incident bundle")
    p_exp.add_argument("--session", "-s", default=None, help="Session ID to export")
    p_exp.add_argument("--output", "-o", default=None, help="Output HTML bundle path")
    p_exp.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_exp.set_defaults(func=cmd_export)

    # verify
    p_ver = subparsers.add_parser("verify", help="Verify SHA-256 hash chain integrity of a session")
    p_ver.add_argument("--session", "-s", default=None, help="Session ID to verify (defaults to latest)")
    p_ver.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_ver.add_argument("--json", action="store_true", help="Emit verification result as JSON")
    p_ver.set_defaults(func=cmd_verify)

    # mcp
    p_mcp = subparsers.add_parser("mcp", help="Run zero-dependency JSON-RPC 2.0 stdio MCP server")
    p_mcp.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_mcp.set_defaults(func=cmd_mcp)

    # status
    p_stat = subparsers.add_parser("status", help="Summarize flight telemetry storage")
    p_stat.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_stat.add_argument("--port", type=int, default=8104, help="Flight deck port (default: 8104)")
    p_stat.add_argument("--json", action="store_true", help="Emit telemetry as JSON")
    p_stat.set_defaults(func=cmd_status)

    parsed = parser.parse_args()
    if getattr(parsed, "status", False) or (getattr(parsed, "json", False) and not parsed.subcommand):
        cmd_status(parsed)
        return
    if not parsed.subcommand:
        parser.print_help()
        return
    if hasattr(parsed, "cmd_remainder") and parsed.cmd_remainder and parsed.cmd_remainder[0] == "--":
        parsed.cmd_remainder = parsed.cmd_remainder[1:]

    parsed.func(parsed)


if __name__ == "__main__":
    main()
