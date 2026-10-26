"""
cli.py - Command Line Interface for Agent Flight Recorder.
Zero external dependencies (Python 3.10+ standard library).
"""

import argparse
import os
import sys
import time
from typing import List, Optional

from .storage import FlightStorage
from .recorder import SessionRecorder
from .server import FlightDeckServer
from .exporter import export_bundle


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    import ipaddress, os
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
    recorder = SessionRecorder(storage=storage, session_id=args.session, title=args.title)

    print("=" * 70)
    print("  AGENT FLIGHT RECORDER • BLACK BOX FLIGHT SESSION")
    print(f"  Recording Target: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    print("=" * 70)

    exit_code = recorder.record_command(cmd)

    print("\n" + "=" * 70)
    print("  FLIGHT RECORDER MISSION COMPLETED")
    print(f"  Session ID:      {recorder.session_id}")
    print(f"  Exit Status:     {exit_code}")
    print(f"  Flight Deck UI:  Run './bin/agent-flight serve' to scrub execution")
    print("=" * 70)
    sys.exit(exit_code)


def cmd_serve(args: argparse.Namespace):
    port = args.port
    storage = FlightStorage(db_path=args.db)
    host = getattr(args, "host", None) or _default_bind_host()
    server = FlightDeckServer(host=host, port=port, storage=storage)

    print("=" * 70)
    print("  AGENT FLIGHT RECORDER • TIME-SCRUBBING COCKPIT")
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
        print(f"    Open this file directly in any web browser to replay offline.")
    except Exception as e:
        print(f"Export Error: {str(e)}")
        sys.exit(1)


def cmd_status(args: argparse.Namespace):
    storage = FlightStorage(db_path=args.db)
    stats = storage.get_db_stats()
    sessions = storage.get_sessions(limit=5)

    print("=" * 66)
    print("  AGENT FLIGHT RECORDER • BLACK BOX TELEMETRY STATUS")
    print("=" * 66)
    print(f"  Total Recorded Sessions: {stats['total_sessions']}")
    print(f"  Total Forensic Events:   {stats['total_events']}")
    print(f"  Total Recorded Flight:   {stats['total_recorded_duration_s']}s")
    print(f"  Database Footprint:      {stats['storage_size_kb']} KB")
    print("-" * 66)
    print("Recent Flight Sessions:")
    if not sessions:
        print("  (No recorded sessions yet)")
    else:
        for s in sessions:
            status_symbol = "✓" if s["status"] == "completed" else "✗"
            print(f"  • [{status_symbol}] {s['session_id']} | {s['title']} ({s['duration_seconds']}s, {s['event_count']} events)")
    print("=" * 66)


def main():
    parser = argparse.ArgumentParser(
        prog="agent-flight",
        description="Autonomous Black Box Flight Recorder & Time-Scrubbing Telemetry Forensics Hub"
    )
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # record
    p_rec = subparsers.add_parser("record", help="Record an agent execution session")
    p_rec.add_argument("--command", "-c", help="Command string to run")
    p_rec.add_argument("--title", default="Agent Flight Run", help="Session title")
    p_rec.add_argument("--session", default=None, help="Custom session ID")
    p_rec.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_rec.add_argument("cmd_remainder", nargs=argparse.REMAINDER, help="Command to run after --")
    p_rec.set_defaults(func=cmd_record)

    # serve
    p_srv = subparsers.add_parser("serve", help="Launch Time-Scrubbing Flight Deck UI")
    p_srv.add_argument("--host", default=None, help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST; use 0.0.0.0 only on trusted networks)")
    p_srv.add_argument("--port", type=int, default=8104, help="Flight deck port (default: 8104)")
    p_srv.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_srv.set_defaults(func=cmd_serve)

    # export
    p_exp = subparsers.add_parser("export", help="Export standalone single-file incident bundle")
    p_exp.add_argument("--session", "-s", default=None, help="Session ID to export")
    p_exp.add_argument("--output", "-o", default=None, help="Output HTML bundle path")
    p_exp.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_exp.set_defaults(func=cmd_export)

    # status
    p_stat = subparsers.add_parser("status", help="Summarize flight telemetry storage")
    p_stat.add_argument("--db", default="flight_recorder.db", help="SQLite database path")
    p_stat.set_defaults(func=cmd_status)

    parsed = parser.parse_args()
    if hasattr(parsed, "cmd_remainder") and parsed.cmd_remainder and parsed.cmd_remainder[0] == "--":
        parsed.cmd_remainder = parsed.cmd_remainder[1:]

    parsed.func(parsed)


if __name__ == "__main__":
    main()
