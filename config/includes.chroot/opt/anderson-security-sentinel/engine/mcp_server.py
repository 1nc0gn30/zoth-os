#!/usr/bin/env python3
"""Anderson Security Sentinel — Zero-Dependency Stdlib JSON-RPC 2.0 Stdio MCP Server.

Exposes 4 live security tools over stdin/stdout (newline-delimited JSON-RPC 2.0):
  - sentinel_status     : Armed state, security status, camera & enrolled count
  - sentinel_scan_rf    : Wi-Fi VRTI RF tomography nodes, disturbance index, room bounds
  - sentinel_perimeter  : USB sysfs tripwire, BlueZ BLE proximity, cameras & building envelope
  - sentinel_dossier    : SHA-256 chain-of-custody forensic dossier seal & posture

Queries the live loopback daemon on 127.0.0.1:8103 when running and gracefully falls
back to local config/engine inspection when the daemon is idle.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

MCP_PROTOCOL_VERSION = "2024-11-05"
SERVER_NAME = "anderson-security-sentinel"
SERVER_VERSION = "2.6.0"
DEFAULT_PORT = int(os.environ.get("ANDERSON_PORT", "8103"))


TOOLS = [
    {
        "name": "sentinel_status",
        "description": "Return Anderson Security Sentinel daemon health, armed state, camera activity, and enrolled biometric template count.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "port": {"type": "integer", "description": "Loopback daemon port (default 8103)", "default": 8103}
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "sentinel_scan_rf",
        "description": "Query or trigger an 802.11 Wi-Fi X-Ray VRTI RF tomography sweep returning ambient beacons, disturbance index, room bounds, and building perimeter.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "trigger_scan": {"type": "boolean", "description": "Trigger an immediate scan before reading snapshot", "default": False},
                "port": {"type": "integer", "default": 8103},
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "sentinel_perimeter",
        "description": "Inspect physical hardware perimeter: USB sysfs tripwire baseline, BlueZ BLE proximity guard, detected surveillance cameras, and building envelope.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "port": {"type": "integer", "default": 8103}
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "sentinel_dossier",
        "description": "Generate and return a SHA-256 sealed cryptographic chain-of-custody forensic security dossier.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "port": {"type": "integer", "default": 8103}
            },
            "additionalProperties": False,
        },
    },
]


def _daemon_request(port: int, path: str, method: str = "GET", timeout: float = 2.5) -> dict | None:
    url = f"http://127.0.0.1:{port}{path}"
    headers = {
        "Origin": f"http://127.0.0.1:{port}",
        "X-Sentinel-Action": "1",
    }
    token = os.environ.get("ANDERSON_API_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if method == "POST":
        data = b"{}"
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return None


def _offline_status(port: int) -> dict:
    from engine.config import load_settings
    cfg = load_settings()
    return {
        "daemon_online": False,
        "service": SERVER_NAME,
        "version": SERVER_VERSION,
        "port": port,
        "armed": bool(cfg.get("armed", True)),
        "security_status": "OFFLINE_STANDBY",
        "vision_mode": cfg.get("vision_mode", "normal"),
        "camera_active": False,
        "enrolled_count": 0,
    }


def dispatch_tool(name: str, arguments: dict | None = None) -> dict:
    args = arguments if isinstance(arguments, dict) else {}
    port = int(args.get("port") or DEFAULT_PORT)

    if name == "sentinel_status":
        health = _daemon_request(port, "/health")
        status = _daemon_request(port, "/api/status")
        if health or status:
            merged = dict(health or {})
            if status:
                merged.update(status)
            merged["daemon_online"] = True
            merged["version"] = SERVER_VERSION
            return merged
        return _offline_status(port)

    if name == "sentinel_scan_rf":
        if args.get("trigger_scan"):
            _daemon_request(port, "/api/wifi_xray/scan", method="POST")
        snap = _daemon_request(port, "/api/wifi_xray")
        if snap:
            bp = snap.get("building_perimeter") or {}
            return {
                "daemon_online": True,
                "active": bool(snap.get("active", True)),
                "total_nodes": snap.get("total_nodes", len(snap.get("nodes", []))),
                "disturbance_index": snap.get("disturbance_index", 0.0),
                "room_bounds": snap.get("room_bounds", {}),
                "tomography_grid_active": bool(snap.get("tomography_grid")),
                "building_perimeter": {
                    "footprint_sqm": bp.get("footprint_sqm"),
                    "building_width_m": bp.get("building_width_m"),
                    "building_length_m": bp.get("building_length_m"),
                    "estimated_partitions": bp.get("estimated_partitions"),
                },
                "cameras_detected": len(snap.get("cameras", [])),
            }
        return {
            "daemon_online": False,
            "active": False,
            "total_nodes": 0,
            "disturbance_index": 0.0,
            "room_bounds": {},
            "tomography_grid_active": False,
            "building_perimeter": {},
            "cameras_detected": 0,
            "note": f"Daemon on 127.0.0.1:{port} is offline. Start with `anderson-security-sentinel serve`.",
        }

    if name == "sentinel_perimeter":
        usb = _daemon_request(port, "/api/usb_status")
        ble = _daemon_request(port, "/api/bluetooth_status")
        cams = _daemon_request(port, "/api/cameras")
        bldg = _daemon_request(port, "/api/building_perimeter")
        if any(x is not None for x in (usb, ble, cams, bldg)):
            return {
                "daemon_online": True,
                "usb_status": usb or {},
                "bluetooth_status": ble or {},
                "cameras": cams or {"total_cameras": 0, "cameras": []},
                "building_perimeter": bldg or {},
            }
        return {
            "daemon_online": False,
            "usb_status": {"active": False, "trusted_count": 0},
            "bluetooth_status": {"active": False, "owner_present": False, "total_devices": 0},
            "cameras": {"total_cameras": 0, "cameras": []},
            "building_perimeter": {},
            "note": f"Daemon on 127.0.0.1:{port} is offline.",
        }

    if name == "sentinel_dossier":
        dossier = _daemon_request(port, "/api/export_dossier")
        if dossier:
            return {
                "daemon_online": True,
                "dossier_id": dossier.get("dossier_id"),
                "generated_at": dossier.get("generated_at"),
                "sentinel_version": dossier.get("sentinel_version", SERVER_VERSION),
                "system_state": dossier.get("system_state", {}),
                "chain_of_custody": dossier.get("chain_of_custody", {}),
                "hardware_security": dossier.get("hardware_security", {}),
                "cryptographic_seal": dossier.get("cryptographic_seal", {}),
            }
        from engine.config import INTRUDERS_DIR, load_settings
        from engine.forensic_dossier import ForensicDossierGenerator

        class _OfflineStub:
            def __init__(self):
                self.settings = load_settings()
                self.security_status = "OFFLINE_STANDBY"
                self.events = []

                class _Det:
                    enrolled_embeddings = []

                self.detector = _Det()

        gen = ForensicDossierGenerator(INTRUDERS_DIR)
        d = gen.build_dossier(_OfflineStub())
        d["daemon_online"] = False
        return d

    raise KeyError(f"Unknown tool: {name}")


def handle_jsonrpc(req: dict) -> dict | None:
    req_id = req.get("id")
    method = req.get("method", "")
    params = req.get("params") or {}

    if method == "notifications/initialized":
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": MCP_PROTOCOL_VERSION,
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        tool_name = params.get("name", "")
        tool_args = params.get("arguments") or {}
        try:
            payload = dispatch_tool(tool_name, tool_args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(payload, indent=2)}],
                    "structuredContent": payload,
                    "isError": False,
                },
            }
        except KeyError as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32602, "message": str(exc)},
            }
        except Exception as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps({"error": str(exc)})}],
                    "isError": True,
                },
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def serve_stdio() -> int:
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError as exc:
            resp = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": f"Parse error: {exc}"}}
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
            continue
        resp = handle_jsonrpc(req)
        if resp is not None:
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
    return 0


if __name__ == "__main__":
    raise SystemExit(serve_stdio())
