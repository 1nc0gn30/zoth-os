#!/usr/bin/env python3
"""Agent Policy Auditor — Root Server Launcher (v2.6.0).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Dependencies.
"""
import argparse
import sys
from pathlib import Path

src_dir = Path(__file__).resolve().parent / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from agent_policy_auditor.cli import _default_bind_host
from agent_policy_auditor.web_cockpit import serve


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent Policy Auditor Server")
    parser.add_argument("--host", default=_default_bind_host(), help="Host to bind to (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8106, help="Port to bind to (default: 8106)")
    args = parser.parse_args()

    serve(port=args.port, host=args.host)


if __name__ == "__main__":
    main()
