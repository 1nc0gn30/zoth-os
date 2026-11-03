#!/usr/bin/env python3
"""
WebMCP Protocol Suite — Sovereign Daemon & REST API Server.
Zero-dependency JSON-RPC 2.0 inspector, MCP schema validator, and live bus simulator.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict

START_TIME = time.time()
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"

SAMPLE_PRESETS = [
    {
        "id": "solana_tip_transfer",
        "name": "solana_tip_transfer",
        "label": "Solana Tip & Microtransaction",
        "description": "Signs and broadcasts a non-custodial SOL tip transfer on the Solana blockchain.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "recipient": {
                    "type": "string",
                    "description": "Base58 encoded Solana wallet address"
                },
                "amountSol": {
                    "type": "number",
                    "description": "Amount in SOL (e.g. 0.05)"
                },
                "memo": {
                    "type": "string",
                    "description": "Optional on-chain memo string"
                }
            },
            "required": ["recipient", "amountSol"]
        }
    },
    {
        "id": "stripe_buy_coffee",
        "name": "stripe_buy_coffee",
        "label": "Stripe Coffee Donation Checkout",
        "description": "Generates a sovereign 100% unlocked Stripe coffee checkout session.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "checkoutUrl": {
                    "type": "string",
                    "description": "Target checkout URL"
                },
                "currency": {
                    "type": "string",
                    "description": "Currency code (default: USD)"
                }
            },
            "required": ["checkoutUrl"]
        }
    },
    {
        "id": "system_diagnostics",
        "name": "system_diagnostics",
        "label": "ZothOS System Diagnostics",
        "description": "Queries sovereign local CPU, memory, process tree, and hardware telemetry.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "subsystem": {
                    "type": "string",
                    "enum": ["cpu", "memory", "storage", "daemons", "all"],
                    "description": "Subsystem target"
                },
                "verbose": {
                    "type": "boolean",
                    "description": "Return detailed telemetry"
                }
            },
            "required": ["subsystem"]
        }
    }
]

def audit_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
    score = 100
    warnings = []
    
    name = schema.get("name", "")
    if not name:
        score -= 25
        warnings.append("Missing tool 'name' identifier.")
    elif not all(c.isalnum() or c in ("_", "-") for c in name):
        score -= 10
        warnings.append("Tool name contains non-standard characters (recommend alphanumeric and underscores).")

    desc = schema.get("description", "")
    if not desc:
        score -= 20
        warnings.append("Missing tool description for LLM grounding.")
    elif len(desc) < 20:
        score -= 10
        warnings.append("Description is very brief; consider elaborating capabilities.")

    input_schema = schema.get("inputSchema", {})
    if not isinstance(input_schema, dict) or not input_schema:
        score -= 25
        warnings.append("Missing or empty 'inputSchema' object.")
    else:
        props = input_schema.get("properties", {})
        if not isinstance(props, dict) or not props:
            score -= 15
            warnings.append("No properties defined in inputSchema.")
        else:
            for prop_name, prop_def in props.items():
                if isinstance(prop_def, dict) and not prop_def.get("description"):
                    score -= 5
                    warnings.append(f"Property '{prop_name}' lacks a descriptive prompt doc.")

    score = max(10, min(100, score))
    grade = "A+" if score >= 95 else "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 50 else "F"
    token_est = len(json.dumps(schema)) // 4

    return {
        "score": score,
        "grade": grade,
        "tokenEstimate": token_est,
        "warnings": warnings,
        "is_safe": score >= 70
    }

class WebMcpHandler(BaseHTTPRequestHandler):
    def send_json(self, data: Any, status: int = 200) -> None:
        raw = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        url_path = self.path.split("?")[0]

        if url_path in ("/health", "/api/health"):
            self.send_json({
                "status": "ok",
                "service": "webmcp-protocol-inspector",
                "uptime": round(time.time() - START_TIME, 2),
                "port": self.server.server_port,
                "version": "1.0.0",
                "features": ["json-rpc-2.0", "mcp-schema-validation", "token-meter", "w3c-webmcp"]
            })
            return

        if url_path == "/api/presets":
            self.send_json({"status": "ok", "presets": SAMPLE_PRESETS})
            return

        # Static serving
        clean_path = url_path.lstrip("/")
        if not clean_path:
            clean_path = "index.html"

        file_path = (PUBLIC_DIR / clean_path).resolve()
        if not str(file_path).startswith(str(PUBLIC_DIR)) or not file_path.is_file():
            fallback = PUBLIC_DIR / "index.html"
            if fallback.is_file():
                file_path = fallback
            else:
                self.send_error(404, "Not Found")
                return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        mime_type = mime_type or "application/octet-stream"
        try:
            content = file_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", f"{mime_type}; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Internal Error: {e}")

    def do_POST(self) -> None:
        url_path = self.path.split("?")[0]

        try:
            length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(length)
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            self.send_json({"status": "error", "message": f"Malformed JSON request: {e}"}, status=400)
            return

        if url_path in ("/api/inspect", "/api/audit"):
            schema = body.get("schema") or body
            audit = audit_schema(schema)
            self.send_json({
                "status": "ok",
                "schema": schema,
                "audit": audit,
                "timestamp": time.time()
            })
            return

        if url_path == "/api/rpc/simulate":
            # Simulate JSON-RPC 2.0 dispatch
            method = body.get("method", "tools/call")
            params = body.get("params", {})
            msg_id = body.get("id", 1)
            
            self.send_json({
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"Successfully executed {method} via sovereign local MCP bus at {time.strftime('%Y-%m-%d %H:%M:%SZ', time.gmtime())}"
                        }
                    ],
                    "isError": False,
                    "simulated": True,
                    "paramsReceived": params
                }
            })
            return

        self.send_error(404, "Endpoint not found")

    def log_message(self, format: str, *args: Any) -> None:
        # Minimal quiet logging
        pass

def run_server(host: str = "127.0.0.1", port: int = 8142) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer((host, port), WebMcpHandler)
    return server

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebMCP Protocol Suite Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--port", "-p", type=int, default=8142, help="Port to listen on (default: 8142)")
    args = parser.parse_args()

    print(f"✦ WebMCP Protocol Suite Server starting on http://{args.host}:{args.port}")
    httpd = run_server(host=args.host, port=args.port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping WebMCP Protocol Suite Server...")
        httpd.server_close()
