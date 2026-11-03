"""Automated unit and integration tests for GhidraMCP Binary Reverse Engineering Bridge."""

import json
import threading
import urllib.request
from http.server import HTTPServer
import pytest

from server import GhidraMcpHandler, PROGRAMS_DB, MCP_TOOLS


@pytest.fixture(scope="module")
def live_server():
    server = HTTPServer(("127.0.0.1", 0), GhidraMcpHandler)
    port = server.server_port
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()
    server.server_close()


def _get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": "pytest-ghidra-mcp"})
    with urllib.request.urlopen(req, timeout=3.0) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def _post_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "pytest-ghidra-mcp"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=3.0) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def test_health_endpoint(live_server):
    status, data = _get_json(f"{live_server}/health")
    assert status == 200
    assert data["status"] == "healthy"
    assert data["service"] == "ghidra-mcp-bridge"
    assert data["version"] == "3.5.0"
    assert "Zero Paywalls" in data["access"]


def test_api_status_endpoint(live_server):
    status, data = _get_json(f"{live_server}/api/status")
    assert status == 200
    assert data["bridge_status"] == "ONLINE"
    assert data["active_targets"] == len(PROGRAMS_DB)
    assert data["mcp_tools_count"] == len(MCP_TOOLS)


def test_api_tools_registry(live_server):
    status, data = _get_json(f"{live_server}/api/tools")
    assert status == 200
    tool_names = [t["name"] for t in data["tools"]]
    assert "list_methods" in tool_names
    assert "decompile_function" in tool_names
    assert "search_strings" in tool_names
    assert "annotate_variable" in tool_names


def test_api_programs_catalog(live_server):
    status, data = _get_json(f"{live_server}/api/programs")
    assert status == 200
    assert isinstance(data, list)
    prog_ids = [p["id"] for p in data]
    assert "zoth-vault-daemon" in prog_ids
    assert "firmware-auth-arm" in prog_ids


def test_decompile_x86_64_argon2id(live_server):
    status, data = _get_json(
        f"{live_server}/api/decompile?program=zoth-vault-daemon&fn=argon2id_kdf_derive"
    )
    assert status == 200
    assert data["program"] == "zoth-vault-daemon.elf"
    assert data["arch"] == "x86_64"
    assert data["function"] == "argon2id_kdf_derive"
    assert data["address"] == "0x00401340"
    assert "argon2_hash" in data["pseudocode"]
    assert len(data["disasm"]) >= 5


def test_decompile_arm_cortex_m4_reset_handler(live_server):
    status, data = _get_json(
        f"{live_server}/api/decompile?program=firmware-auth-arm&fn=Reset_Handler"
    )
    assert status == 200
    assert data["program"] == "firmware_boot.bin"
    assert "ARM Cortex-M4" in data["arch"]
    assert data["function"] == "Reset_Handler"
    assert "verify_flash_signature" in data["pseudocode"]


def test_mcp_jsonrpc_tools_list(live_server):
    status, data = _post_json(
        f"{live_server}/api/mcp",
        {"jsonrpc": "2.0", "id": 101, "method": "tools/list", "params": {}},
    )
    assert status == 200
    assert data["jsonrpc"] == "2.0"
    assert data["id"] == 101
    assert len(data["result"]["tools"]) == 4


def test_mcp_jsonrpc_call_search_strings(live_server):
    status, data = _post_json(
        f"{live_server}/api/mcp",
        {
            "jsonrpc": "2.0",
            "id": 102,
            "method": "tools/call",
            "params": {
                "name": "search_strings",
                "arguments": {"program_id": "zoth-vault-daemon"},
            },
        },
    )
    assert status == 200
    text = data["result"]["content"][0]["text"]
    strings = json.loads(text)
    assert "Zoth Vault Ring-0 Custody Daemon online." in strings
