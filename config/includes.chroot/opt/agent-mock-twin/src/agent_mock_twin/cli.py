"""
cli.py: Command-line interface for agent-mock-twin.
Supports `serve`, `import`, `stats`, `status`, `run`, and `mcp` (stdio JSON-RPC 2.0 MCP server).
Zero external pip dependencies.
"""

from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from typing import List

from .mcp_server import MCPServer
from .mock_server import VERSION, MockServer
from .parser import HarParser, OpenAPIParser, RecordedRoute
from .storage import MockStorage


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


def parse_data_file(file_path: str, storage: MockStorage) -> int:
    """Detect format and import HAR or OpenAPI file into storage."""
    if not os.path.isfile(file_path):
        print(f"[!] Error: File not found: {file_path}", file=sys.stderr)
        return 0

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict) and isinstance(data.get("log"), dict) and "entries" in data["log"]:
            routes = HarParser.parse_dict(data)
            source = "HAR 1.2"
        elif isinstance(data, dict) and ("openapi" in data or "swagger" in data or "paths" in data):
            routes = OpenAPIParser.parse_dict(data)
            source = "OpenAPI 3.0"
        elif isinstance(data, list):
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
    print(f"  AGENT MOCK TWIN v{VERSION} • Offline API Mock & Network Twin")
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
    print(f"[*] Local Mock Server:   http://{args.host}:{server.port}")
    print(f"[*] Web Dashboard UI:    http://{args.host}:{server.port}/")
    print(f"[*] Mock Base URL:       http://{args.host}:{server.port}/v1")
    print(f"[*] Ingested Endpoints:  {stats['routes_count']} active routes")
    print(f"[*] Latency Simulation:  {server.matcher.base_latency_ms}ms (±{server.matcher.jitter_ms}ms jitter)")
    if server.matcher.chaos_rate > 0.0:
        print(f"[*] Chaos Injection:     {server.matcher.chaos_rate * 100:.1f}% ({server.matcher.chaos_type})")
    print("-" * 68)
    print("Press Ctrl+C or send SIGTERM to stop server cleanly.\n", flush=True)

    def signal_handler(sig, frame):
        print("\n[*] Shutting down Agent Mock Twin server cleanly...", flush=True)
        server.request_shutdown_async()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        server.serve_forever(poll_interval=0.25)
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
    import urllib.request

    port = getattr(args, "port", 8097)
    as_json = bool(getattr(args, "json", False))
    live_health = None
    live_stats = None
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=2.0) as resp:
            live_health = json.loads(resp.read().decode("utf-8"))
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/stats", timeout=2.0) as resp:
            live_stats = json.loads(resp.read().decode("utf-8")).get("stats")
    except Exception:
        pass

    storage = MockStorage(db_path=args.db)
    stats = live_stats if live_stats is not None else storage.get_stats()

    if as_json:
        print(json.dumps({
            "service": "agent-mock-twin",
            "version": VERSION,
            "online": live_health is not None,
            "port": port,
            "health": live_health,
            "stats": stats,
        }, indent=2))
        return 0

    print("=" * 60)
    print(f"  AGENT MOCK TWIN v{VERSION} TELEMETRY SUMMARY")
    print("=" * 60)
    print(f"  Daemon Endpoint:            http://127.0.0.1:{port} ({'ONLINE' if live_health else 'LOCAL DB'})")
    print(f"  Total Requests Intercepted: {stats.get('total_hits', 0):,}")
    print(f"  Total API Tokens Saved:     {stats.get('total_tokens_saved', 0):,}")
    print(f"  Estimated Cost Saved:       ${stats.get('total_usd_saved', 0.0):.4f} USD")
    print(f"  Active Mock Routes:         {stats.get('routes_count', 0):,}")
    print(f"  Providers Indexed:          {', '.join(stats.get('providers', [])) or 'None'}")
    print(f"  Average Simulated Latency:  {stats.get('avg_latency_ms', 0)} ms")
    if stats.get("matches_by_type"):
        print("  Match Tier Breakdown:")
        for tier, count in stats["matches_by_type"].items():
            print(f"    - {tier.capitalize()}: {count:,}")
    print("=" * 60)
    return 0


def cmd_mcp(args: argparse.Namespace) -> int:
    """Run JSON-RPC 2.0 stdio MCP server."""
    mcp = MCPServer(db_path=args.db, port=args.port)
    return mcp.serve_stdio()


def cmd_run(args: argparse.Namespace, remaining_args: List[str]) -> int:
    """Run an agent command wrapped with local mock redirection."""
    if not remaining_args:
        print("[!] Error: No command specified to run. Usage: agent-mock-twin run -- <command...>", file=sys.stderr)
        return 1

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

        server.run_in_thread()
        spawned_server = True
        time.sleep(0.25)
    except OSError as e:
        if getattr(e, "errno", None) == 98 or "address already in use" in str(e).lower():
            print(f"[*] Connected to existing Agent Mock Twin running on port {args.port}")
        else:
            raise

    mock_base_v1 = f"http://{args.host}:{args.port}/v1"
    mock_root = f"http://{args.host}:{args.port}"

    env = os.environ.copy()
    env["OPENAI_BASE_URL"] = mock_base_v1
    env["OPENAI_API_BASE"] = mock_base_v1
    env["ANTHROPIC_BASE_URL"] = mock_root
    env["AGENT_MOCK_TWIN"] = "1"
    env["AGENT_MOCK_PORT"] = str(args.port)
    env["HTTP_PROXY"] = mock_root
    env["NO_PROXY"] = "localhost,127.0.0.1"

    print(f"[*] [Agent Mock Twin v{VERSION}] Interceptor active on port {args.port}")
    print(f"[*] OPENAI_BASE_URL -> {mock_base_v1}")
    print(f"[*] ANTHROPIC_BASE_URL -> {mock_root}")
    print(f"[*] Executing child process: {' '.join(remaining_args)}\n")

    initial_stats = storage.get_stats()
    initial_hits = initial_stats["total_hits"]
    initial_tokens = initial_stats["total_tokens_saved"]
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
        session_hits = max(0, final_stats["total_hits"] - initial_hits)
        session_tokens = max(0, final_stats["total_tokens_saved"] - initial_tokens)

        print("\n" + "=" * 60)
        print("  AGENT MOCK TWIN SESSION REPORT")
        print("=" * 60)
        print(f"  Execution Time:        {elapsed:.2f}s")
        print(f"  API Calls Intercepted: {session_hits}")
        print(f"  Tokens Saved:          {session_tokens:,}")
        print("  API Token Cost:        $0.00 (100% Mock Replay)")
        print(f"  Child Exit Code:       {ret_code}")
        print("=" * 60)

        if spawned_server and server:
            server.shutdown_cleanly()

    return ret_code


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="agent-mock-twin",
        description="Autonomous Offline API Mock & Network Twin for AI Agents (Neal Frazier Tech • NullAI Platform)",
    )
    parser.add_argument("-v", "--version", action="version", version=f"agent-mock-twin {VERSION}")
    parser.add_argument("--status", action="store_true", help="Display mock server status and token savings")
    parser.add_argument("--json", action="store_true", help="Output telemetry as JSON")
    parser.add_argument("--port", type=int, default=8097, help="Mock server port (default: 8097)")
    parser.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # serve command
    p_serve = subparsers.add_parser("serve", help="Start offline mock server and web dashboard")
    p_serve.add_argument("--host", default=_default_bind_host(), help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST)")
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
    p_stats.add_argument("--port", type=int, default=8097, help="Mock server port (default: 8097)")
    p_stats.add_argument("--json", action="store_true", help="Output telemetry as JSON")

    # status command
    p_status = subparsers.add_parser("status", help="Display mock server status and telemetry stats")
    p_status.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    p_status.add_argument("--port", type=int, default=8097, help="Mock server port (default: 8097)")
    p_status.add_argument("--json", action="store_true", help="Output telemetry as JSON")

    # mcp command
    p_mcp = subparsers.add_parser("mcp", help="Run JSON-RPC 2.0 stdio MCP server (4 mock tools)")
    p_mcp.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    p_mcp.add_argument("--port", type=int, default=8097, help="Loopback daemon port to prefer (default: 8097)")

    # run command
    p_run = subparsers.add_parser("run", help="Run agent command with environment redirected to local mock twin")
    p_run.add_argument("--host", default="127.0.0.1", help="Mock host address (default: 127.0.0.1)")
    p_run.add_argument("--port", type=int, default=8097, help="Mock port (default: 8097)")
    p_run.add_argument("--data", help="Path to initial HAR or OpenAPI file to load")
    p_run.add_argument("--db", default="agent_mock.db", help="Path to SQLite database")
    p_run.add_argument("--latency", type=int, default=25, help="Base latency simulation in ms (default: 25)")

    # Use parse_known_args only when 'run' is invoked so bogus subcommands still exit 2
    if len(sys.argv) > 1 and sys.argv[1] == "run":
        args, remaining = parser.parse_known_args()
    else:
        args = parser.parse_args()
        remaining = []

    if getattr(args, "status", False) or (getattr(args, "json", False) and not args.command):
        sys.exit(cmd_stats(args))

    if not args.command:
        parser.print_help()
        sys.exit(0)

    if args.command == "serve":
        sys.exit(cmd_serve(args))
    elif args.command == "import":
        sys.exit(cmd_import(args))
    elif args.command in ("stats", "status"):
        sys.exit(cmd_stats(args))
    elif args.command == "mcp":
        sys.exit(cmd_mcp(args))
    elif args.command == "run":
        sys.exit(cmd_run(args, remaining))


if __name__ == "__main__":
    main()
