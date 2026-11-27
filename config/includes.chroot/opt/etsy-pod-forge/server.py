#!/usr/bin/env python3
"""Etsy POD Forge (v2.6.0) — Root Server Launcher.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library + Pillow.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from etsy_pod_forge import __version__
from etsy_pod_forge.server import ForgeServer


def main() -> int:
    parser = argparse.ArgumentParser(description=f"Etsy POD Forge Server (v{__version__})")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8107, help="Port to bind to (default: 8107)")
    args = parser.parse_args()

    public_dir = str(Path(__file__).resolve().parent / "public")
    server = ForgeServer(host=args.host, port=args.port, public_dir=public_dir)
    server.start(block=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
