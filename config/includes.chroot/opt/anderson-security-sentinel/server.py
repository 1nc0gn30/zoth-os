#!/usr/bin/env python3
"""
Anderson Security Sentinel — Sovereign Daemon & Tactical Ops Server.
Autonomous biometric perimeter defense, facial recognition tripwire, and RF tomography.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

def main():
    parser = argparse.ArgumentParser(description="Anderson Security Sentinel Sovereign Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", "-p", type=int, default=8103, help="Port to listen on (default: 8103)")
    args = parser.parse_args()

    print(f"✦ Anderson Security Sentinel Server launching on http://{args.host}:{args.port}")
    import uvicorn
    uvicorn.run("web.server:app", host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
