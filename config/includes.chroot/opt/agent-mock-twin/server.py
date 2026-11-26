#!/usr/bin/env python3
"""
server.py: Standalone production HTTP daemon for Agent Mock Twin (v2.6.0).
Runs on 127.0.0.1:8097 serving REST API, SSE telemetry feed, and dual-theme dashboard.
Zero external pip dependencies.
"""

import argparse
import os
import signal
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from agent_mock_twin.mock_server import VERSION, MockServer


def main() -> int:
    parser = argparse.ArgumentParser(description=f"Agent Mock Twin Production Server v{VERSION}")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8097, help="Port to listen on (default: 8097)")
    parser.add_argument("--db", default=os.path.join(BASE_DIR, "agent_mock.db"), help="Path to SQLite database")
    parser.add_argument("--latency", type=int, default=25, help="Base simulated latency in ms (default: 25)")
    parser.add_argument("--jitter", type=int, default=15, help="Simulated latency jitter in ms (default: 15)")
    parser.add_argument("--chaos", type=float, default=0.0, help="Chaos fault rate 0.0-1.0 (default: 0.0)")
    args = parser.parse_args()

    public_dir = os.path.join(BASE_DIR, "public")
    server = MockServer(
        host=args.host,
        port=args.port,
        db_path=args.db,
        public_dir=public_dir,
        base_latency_ms=args.latency,
        jitter_ms=args.jitter,
        chaos_rate=args.chaos,
    )

    def handle_signal(sig, frame):
        print("\nShutting down Agent Mock Twin gracefully...", flush=True)
        server.request_shutdown_async()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    print(f"✦ Agent Mock Twin v{VERSION} listening on http://{args.host}:{server.port}", flush=True)
    print(f"  Health Check: http://{args.host}:{server.port}/health", flush=True)
    print(f"  API Routes:   http://{args.host}:{server.port}/api/routes", flush=True)
    print(f"  Telemetry:    http://{args.host}:{server.port}/api/stats", flush=True)

    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown_cleanly()
    return 0


if __name__ == "__main__":
    sys.exit(main())
