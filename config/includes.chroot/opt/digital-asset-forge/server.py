#!/usr/bin/env python3
"""
Digital Asset Forge - Sovereign Entrypoint & Daemon
Port 8118
"""
import sys
import os
from pathlib import Path

root_dir = Path(__file__).resolve().parent
src_dir = root_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from digital_asset_forge.server import run_server, PORT

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Digital Asset Forge Daemon")
    parser.add_argument("--port", type=int, default=PORT, help="Port to listen on (default 8118)")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface to bind")
    args = parser.parse_args()
    run_server(port=args.port, host=args.host)
