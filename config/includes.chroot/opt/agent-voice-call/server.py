#!/usr/bin/env python3
"""Root launcher for Agent Voice Call server (v2.6.0).

Supports both:
  python3 server.py --port 8114
  python3 server.py serve --port 8114

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from agent_voice_call import __version__
from agent_voice_call.cli import _default_bind_host, cmd_serve


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=f"Agent Voice Call Station Server v{__version__}")
    parser.add_argument("action", nargs="?", choices=["serve"], default="serve", help="Optional command (serve)")
    parser.add_argument("--version", action="version", version=f"agent-voice-call {__version__}")
    parser.add_argument("--port", type=int, default=8114, help="Port to bind (default: 8114)")
    parser.add_argument("--host", default=_default_bind_host(), help="Host to bind (default: 127.0.0.1)")
    args = parser.parse_args(argv)
    return cmd_serve(args)


if __name__ == "__main__":
    sys.exit(main())
