"""
cli.py: Command-line interface for agent-mock-twin.
Supports `serve`, `import`, `stats`, and `run` (zero-latency offline agent execution wrapper).
Zero external pip dependencies.
"""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from typing import List, Optional

from .mock_server import MockServer
from .parser import HarParser, OpenAPIParser
from .storage import MockStorage


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



def parse_data_file(file_path: str, storage: MockStorage) -> int:
    """Detect format and import HAR or OpenAPI file into storage."""
    if not os.path.isfile(file_path):
        print(f"[!] Error: File not found: {file_path}", file=sys.stderr)
        return 0

    try:
        import json
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "log" in data and "entries" in data["log"]:
            routes = HarParser.parse_dict(data)
            source = "HAR 1.2"
        elif "openapi" in data or "swagger" in data or "paths" in data:
            routes = OpenAPIParser.parse_dict(data)
            source = "OpenAPI 3.0"
        elif isinstance(data, list):
            from .parser import RecordedRoute
            routes = [RecordedRoute.from_dict(d) for d in data if isinstance(d, dict)]
            source = "Route List"
        else:
            print(f"[!] Warning: Could not detect HAR or OpenAPI structure in {file_path}", file=sys.stderr)
            return 0

        count = storage.save_routes(routes)
        print(f"[+] Ingested {count} routes from {source} ({file_path})")
        return count
    except Exception as e:
        print(f"[!] Error parsing {file_path}: {e}", file=sys.stderr)
        return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """Start standalone mock server and web dashboard."""
    print("=" * 68)
    print("  AGENT MOCK TWIN • Autonomous Offline Network Twin for AI Agents")
    print("  $0 API Token Cost in CI/CD · 100% Deterministic Local Replays")
    print("=" * 68)

    server = MockServer(
        host=args.host,
        port=args.port,
        db_path=args.db,
        base_latency_ms=args.latency,
        jitter_ms=args.jitter,
        chaos_rate=args.chaos,
    )

    if args.data:
        parse_data_file(args.data, server.storage)

    stats = server.storage.get_stats()
    print(f"[*] Local Mock Server:   http://{args.host}:{args.port}")
    print(f"[*] Web Dashboard UI:    http://{args.host}:{args.port}/")
    print(f"[*] Mock Base URL:       http://{args.host}:{args.port}/v1")
    print(f"[*] Ingested Endpoints:  {stats['routes_count']} active routes")
    print(f"[*] Latency Simulation:  {args.latency}ms (±{args.jitter}ms jitter)")
    if args.chaos > 0.0:
        print(f"[*] Chaos Injection:     {args.chaos * 100:.1f}% error rate active")
    print("-" * 68)
    print("Press Ctrl+C to stop server.\n")

    def signal_handler(sig, frame):
        print("\n[*] Shutting down Agent Mock Twin server cleanly...")
        server.shutdown_cleanly()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown_cleanly()
    return 0


def cmd_import(args: argparse.Namespace) -> int:
    """Import HAR or OpenAPI file into SQLite database."""
    storage = MockStorage(db_path=args.db)
    count = parse_data_file(args.file, storage)
    if count > 0:
        stats = storage.get_stats()
        print(f"[✓] Database now holds {stats['routes_count']} mock routes across {len(stats['providers'])} providers.")
        return 0
    return 1


def cmd_stats(args: argparse.Namespace) -> int:
    """Display summary of token and USD savings."""
    storage = MockStorage(db_path=args.db)
    stats = storage.get_stats()
    print("=" * 60)
    print("  AGENT MOCK TWIN TELEMETRY SUMMARY")
    print("=" * 60)
    print(f"  Total Requests Intercepted: {stats['total_hits']:,}")
    print(f"  Total API Tokens Saved:     {stats['total_tokens_saved']:,}")
    print(f"  Estimated Cost Saved:       ${stats['total_usd_saved']:.4f} USD")
    print(f"  Active Mock Routes:         {stats['routes_count']:,}")
    print(f"  Providers Indexed:          {', '.join(stats['providers']) or 'None'}")
    print(f"  Average Simulated Latency:  {stats['avg_latency_ms']} ms")
    if stats["matches_by_type"]:
        print("  Match Tier Breakdown:")
        for tier, count in stats["matches_by_type"].items():
            print(f"    - {tier.capitalize()}: {count:,}")
    print("=" * 60)
    return 0


def cmd_run(args: argparse.Namespace, remaining_args: List[str]) -> int:
    """Run an agent command wrapped with local mock redirection."""
    if not remaining_args:
        print("[!] Error: No command specified to run. Usage: agent-mock run -- <command...>", file=sys.stderr)
        return 1

    # Filter out leading '--' if passed
    if remaining_args[0] == "--":
        remaining_args = remaining_args[1:]
    if not remaining_args:
        print("[!] Error: No command specified to run.", file=sys.stderr)
        return 1

    spawned_server = False
    server = None
    storage = MockStorage(db_path=args.db)

    try:
        server = MockServer(
            host=args.host,
            port=args.port,
            db_path=args.db,
            base_latency_ms=args.latency,
        )
        if args.data:
            parse_data_file(args.data, server.storage)

        server_thread = server.run_in_thread()
        spawned_server = True
        time.sleep(0.3)  # Give server brief moment to bind port
    except OSError as e:
        if getattr(e, "errno", None) == 98 or "address already in use" in str(e).lower():
            print(f"[*] Connected to existing Agent Mock Twin running on port {args.port}")
        else:
            raise

    # Environment variables for zero-code agent interception
    mock_base_v1 = f"http://{args.host}:{args.port}/v1"
    mock_root = f"http://{args.host}:{args.port}"

    env = os.environ.copy()
    env["OPENAI_BASE_URL"] = mock_base_v1
    env["OPENAI_API_BASE"] = mock_base_v1
    env["ANTHROPIC_BASE_URL"] = mock_root
    env["AGENT_MOCK_TWIN"] = "1"
    env["AGENT_MOCK_PORT"] = str(args.port)

    # Optional proxy redirection for custom HTTP clients
    env["HTTP_PROXY"] = mock_root
    env["NO_PROXY"] = "localhost,127.0.0.1"

    print(f"[*] [Agent Mock Twin] Interceptor active on port {args.port}")
    print(f"[*] OPENAI_BASE_URL -> {mock_base_v1}")
    print(f"[*] ANTHROPIC_BASE_URL -> {mock_root}")
    print(f"[*] Executing child process: {' '.join(remaining_args)}\n")

    initial_hits = storage.get_stats()["total_hits"]
    start_time = time.time()

    try:
        proc = subprocess.Popen(remaining_args, env=env)
        ret_code = proc.wait()
    except Exception as e:
        print(f"[!] Error executing child process: {e}", file=sys.stderr)
        ret_code = 1
    finally:
        elapsed = time.time() - start_time
        final_stats = storage.get_stats()
        session_hits = final_stats["total_hits"] - initial_hits

        print("\n" + "=" * 60)
        print("  AGENT MOCK TWIN SESSION REPORT")
        print("=" * 60)
        print(f"  Execution Time:        {elapsed:.2f}s")
        print(f"  API Calls Intercepted: {session_hits}")
        print(f"  Estimated Tokens Saved:{session_hits * 35:,}")
        print(f"  API Token Cost:        $0.00 (100% Mock Replay)")
        print(f"  Child Exit Code:       {ret_code}")
        print("=" * 60)

        if spawned_server and server:
            server.shutdown_cleanly()

    return ret_code


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="agent-mock",
        description="Autonomous Offline API Mock & Network Twin for AI Agents",
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # serve command
    p_serve = subparsers.add_parser("serve", help="Start offline mock server and web dashboard")
    p_serve.add_argument("--host", default=_default_bind_host(), help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST; use 0.0.0.0 only on trusted networks)")
    p_serve.add_argument("--port", type=int, default=8097, help="Port to listen on (default: 8097)")
    p_serve.add_argument("--data", help="Path to initial HAR or OpenAPI file to load")
    p_serve.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    p_serve.add_argument("--latency", type=int, default=25, help="Base latency simulation in ms (default: 25)")
    p_serve.add_argument("--jitter", type=int, default=15, help="Latency jitter range in ms (default: 15)")
    p_serve.add_argument("--chaos", type=float, default=0.0, help="Chaos fault injection rate 0.0-1.0 (default: 0.0)")

    # import command
    p_import = subparsers.add_parser("import", help="Import HAR or OpenAPI file into mock storage")
    p_import.add_argument("file", help="Path to HAR 1.2 JSON or OpenAPI 3.0 specification")
    p_import.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")

    # stats command
    p_stats = subparsers.add_parser("stats", help="Display token savings and telemetry stats")
    p_stats.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")

    # run command
    p_run = subparsers.add_parser("run", help="Run agent command with environment redirected to local mock twin")
    p_run.add_argument("--host", default="127.0.0.1", help="Mock host address (default: 127.0.0.1)")
    p_run.add_argument("--port", type=int, default=8097, help="Mock port (default: 8097)")
    p_run.add_argument("--data", help="Path to initial HAR or OpenAPI file to load")
    p_run.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    p_run.add_argument("--latency", type=int, default=25, help="Base latency simulation in ms (default: 25)")

    # Parse known args so `run` can consume trailing command
    args, remaining = parser.parse_known_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "serve":
        sys.exit(cmd_serve(args))
    elif args.command == "import":
        sys.exit(cmd_import(args))
    elif args.command == "stats":
        sys.exit(cmd_stats(args))
    elif args.command == "run":
        sys.exit(cmd_run(args, remaining))


if __name__ == "__main__":
    main()
