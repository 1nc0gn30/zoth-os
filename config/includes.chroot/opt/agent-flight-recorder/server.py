#!/usr/bin/env python3
"""
server.py: Production HTTP Daemon for Agent Flight Recorder.
Runs on 127.0.0.1:8104 serving Black Box Cockpit UI, REST forensics API, and SSE telemetry feed.
Zero external pip dependencies.
"""

import argparse
import os
import signal
import sys
import time

# Ensure src/ is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from agent_flight_recorder.storage import FlightStorage
from agent_flight_recorder.server import FlightDeckServer


def main():
    parser = argparse.ArgumentParser(description="Agent Flight Recorder Black Box Daemon")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8104, help="Port to listen on (default: 8104)")
    parser.add_argument("--db", default=os.path.join(BASE_DIR, "flight_recorder.db"), help="Path to SQLite database")
    args = parser.parse_args()

    storage = FlightStorage(db_path=args.db)
    server = FlightDeckServer(
        host=args.host,
        port=args.port,
        storage=storage
    )

    def handle_signal(sig, frame):
        print("\nShutting down Agent Flight Recorder gracefully...")
        server.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    server.start()

    print(f"✦ Agent Flight Recorder running on http://{args.host}:{args.port}")
    print(f"  Cockpit Dashboard : http://{args.host}:{args.port}/")
    print(f"  Health Check      : http://{args.host}:{args.port}/health")
    print(f"  Sessions API      : http://{args.host}:{args.port}/api/sessions")
    print(f"  Telemetry Stats   : http://{args.host}:{args.port}/api/stats")
    print(f"  Database Storage  : {args.db}")
    print("  Access            : 100% Free & Open Access (Zero Paywalls)")

    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        handle_signal(None, None)


if __name__ == "__main__":
    main()
