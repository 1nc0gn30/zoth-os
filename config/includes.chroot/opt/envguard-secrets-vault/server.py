#!/usr/bin/env python3
"""
EnvGuard Secrets Vault - Standalone Loopback REST API & Web Workstation Server
Listens strictly on http://127.0.0.1:8088 by default.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
SRC_DIR = ROOT_DIR / "src"
PUBLIC_DIR = ROOT_DIR / "public"

if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from envguard_secrets_vault.ui_server import start_server


def parse_args(argv=None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="envguard-server",
        description="EnvGuard Secrets Vault hardened loopback REST API & Web Workstation server.",
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("HOST", "127.0.0.1"),
        help="Loopback bind host (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("PORT", "8088")),
        help="HTTP port (default: 8088)",
    )
    parser.add_argument(
        "--public-dir",
        default=str(PUBLIC_DIR),
        help="Static web assets directory",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args()
    print(f"[EnvGuard] Starting EnvGuard Secrets Vault v2.6.0 on http://{args.host}:{args.port} ...")
    start_server(host=args.host, port=args.port, public_dir=args.public_dir)
