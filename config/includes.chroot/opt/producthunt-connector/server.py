#!/usr/bin/env python3
"""
Product Hunt Connector Server (Port :8139)
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""

import argparse
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(SCRIPT_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from producthunt_connector.cockpit import run_server


def main():
    parser = argparse.ArgumentParser(description="Product Hunt Connector Cockpit Daemon")
    parser.add_argument("--port", type=int, default=8139, help="Port to bind (default: 8139)")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind (default: 127.0.0.1)")
    args = parser.parse_args()

    print(f"⚡ Product Hunt Connector cockpit running on http://{args.host}:{args.port}")
    run_server(host=args.host, port=args.port)


if __name__ == "__main__":
    main()
