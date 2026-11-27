#!/usr/bin/env python3
"""
DeepSearch Research Agent & Studio Local Workbench Launcher (:8122).

Thin entrypoint that resolves src/ cleanly and launches the hardened
deepsearch_research_agent.ui_server ThreadingHTTPServer on loopback 127.0.0.1:8122.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from deepsearch_research_agent import __version__
from deepsearch_research_agent.ui_server import start_server


def main() -> int:
    parser = argparse.ArgumentParser(
        description=f"DeepSearch Research Agent & Studio v{__version__} (Hardened Local Workbench)"
    )
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8122, help="Bind port (default: 8122)")
    parser.add_argument("--open", action="store_true", help="Open browser automatically")
    parser.add_argument("--version", action="version", version=f"deepsearch-research-agent {__version__}")
    args, _ = parser.parse_known_args()

    httpd = start_server(host=args.host, port=args.port, open_browser=args.open)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down DeepSearch Research Studio server...")
        httpd.shutdown()
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
