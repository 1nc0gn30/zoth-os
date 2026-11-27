"""Comprehensive automated security, binary parser, MCP, CLI & TUI tests for GhidraMCP Bridge v3.6.0."""

import http.client
import json
import os
import struct
import subprocess
import sys
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from analyzer import (
    ANNOTATIONS_STORE,
    BinaryAnalyzer,
    MCP_TOOLS,
    PROGRAMS_DB,
    VERSION,
    compute_shannon_entropy,
    parse_binary_headers_and_sections,
    validate_symbol_arg,
)
from server import GhidraMcpHandler, MAX_BODY_BYTES


@pytest.fixture(scope="module")
def live_server():
    server = ThreadingHTTPServer(("127.0.0.1", 0), GhidraMcpHandler)
    port = server.server_port
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield {"url": f"http://127.0.0.1:{port}", "port": port}
    server.shutdown()
    server.server_close()


def _http_req(port: int, method: str, path: str, headers=None, body=None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=10.0)
    hdrs = dict(headers or {})
    if "Host" not in hdrs:
        hdrs["Host"] = f"127.0.0.1:{port}"
    try:
        conn.request(method, path, body=body, headers=hdrs)
    except (BrokenPipeError, ConnectionResetError):
        pass
    resp = conn.getresponse()
    raw = resp.read()
    resp_headers = {k.lower(): v for k, v in resp.getheaders()}
    conn.close()
    return resp.status, resp_headers, raw


def _get_json(live_server, path: str, headers=None):
    status, resp_headers, raw = _http_req(live_server["port"], "GET", path, headers=headers)
    return status, resp_headers, json.loads(raw.decode("utf-8"))


def _post_json(live_server, path: str, payload, headers=None):
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    body = payload if isinstance(payload, (bytes, bytearray)) else json.dumps(payload).encode("utf-8")
    status, resp_headers, raw = _http_req(live_server["port"], "POST", path, headers=hdrs, body=body)
    parsed = json.loads(raw.decode("utf-8")) if raw else None
    return status, resp_headers, parsed


# --- L1 SECURITY, HEADERS, HOST/ORIGIN, DIRECTORY LISTING, HEAD, 404, 413 ---


def test_health_and_security_headers(live_server):
    status, hdrs, data = _get_json(live_server, "/health")
    assert status == 200
    assert data["status"] == "healthy"
    assert data["service"] == "ghidra-mcp-bridge"
    assert data["version"] == VERSION == "3.6.0"
    assert data["port"] == live_server["port"]
    assert "Zero Paywalls" in data["access"]
    assert data["engines"]["readelf"] == "READY"
    assert data["engines"]["strings"] == "READY"

    assert hdrs.get("x-frame-options") == "SAMEORIGIN"
    assert hdrs.get("x-content-type-options") == "nosniff"
    assert hdrs.get("referrer-policy") == "strict-origin-when-cross-origin"
    csp = hdrs.get("content-security-policy", "")
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*" in csp
    assert "origin" in hdrs.get("vary", "").lower()
    assert hdrs.get("access-control-allow-origin") != "*"


def test_host_dns_rebinding_rejected(live_server):
    status, hdrs, data = _get_json(live_server, "/health", headers={"Host": "evil.example.invalid"})
    assert status == 403
    assert "Forbidden" in data["error"]
    assert hdrs.get("x-content-type-options") == "nosniff"


@pytest.mark.parametrize("method", ["GET", "HEAD", "OPTIONS", "POST"])
@pytest.mark.parametrize("bad_origin", ["http://127.0.0.1:81310", "https://evil.example"])
def test_disallowed_cors_origin_rejected(live_server, method, bad_origin):
    path = "/api/mcp" if method == "POST" else "/health"
    body = b'{"jsonrpc":"2.0","id":1,"method":"ping"}' if method == "POST" else None
    hdrs = {"Origin": bad_origin}
    if method == "POST":
        hdrs["Content-Type"] = "application/json"
    status, resp_hdrs, _ = _http_req(live_server["port"], method, path, headers=hdrs, body=body)
    assert status == 403
    assert resp_hdrs.get("access-control-allow-origin") is None
    assert "origin" in resp_hdrs.get("vary", "").lower()


def test_valid_loopback_origin_reflected(live_server):
    origin = f"http://127.0.0.1:{live_server['port']}"
    status, hdrs, _ = _get_json(live_server, "/health", headers={"Origin": origin})
    assert status == 200
    assert hdrs.get("access-control-allow-origin") == origin
    assert "origin" in hdrs.get("vary", "").lower()

    studio_origin = "http://127.0.0.1:3000"
    status2, hdrs2, _ = _get_json(live_server, "/api/status", headers={"Origin": studio_origin})
    assert status2 == 200
    assert hdrs2.get("access-control-allow-origin") == studio_origin


def test_assets_directory_listing_blocked(live_server):
    status, hdrs, data = _get_json(live_server, "/assets/")
    assert status == 403
    assert "directory listing" in data["error"].lower()
    assert hdrs.get("x-frame-options") == "SAMEORIGIN"


def test_head_endpoints_and_clean_404(live_server):
    for ep in ("/", "/health", "/api/health", "/api/status", "/api/tools", "/api/programs", "/api/sections", "/api/entropy"):
        status, hdrs, raw = _http_req(live_server["port"], "HEAD", ep)
        assert status == 200, f"HEAD {ep} failed: {status}"
        assert raw == b""
        assert hdrs.get("x-content-type-options") == "nosniff"

    status_404, hdrs_404, raw_404 = _http_req(live_server["port"], "GET", "/nonexistent-404")
    assert status_404 == 404
    assert hdrs_404.get("x-content-type-options") == "nosniff"
    assert b"404" in raw_404 or b"not found" in raw_404.lower()

    status_fav, _, _ = _http_req(live_server["port"], "GET", "/favicon.ico")
    assert status_fav in (200, 404)

    status_trav, _, _ = _http_req(live_server["port"], "GET", "/%2e%2e/server.py")
    assert status_trav in (403, 404)


def test_post_body_over_1mib_returns_413(live_server):
    oversized = b"{" + b" " * (MAX_BODY_BYTES + 2048) + b"}"
    status, hdrs, data = _post_json(live_server, "/api/mcp", oversized)
    assert status == 413
    assert "1048576" in data["error"]["message"] or "maximum" in data["error"]["message"].lower()
    assert hdrs.get("x-content-type-options") == "nosniff"


def test_invalid_query_params_return_400(live_server):
    status, _, data = _get_json(live_server, "/api/strings?program=/bin/echo&min_len=abc")
    assert status == 400
    assert "min_len" in data["error"]

    status2, _, data2 = _get_json(live_server, "/api/hex?program=/bin/echo&offset=-1")
    assert status2 == 400
    assert "offset" in data2["error"]

    status3, _, data3 = _get_json(live_server, "/api/hex?program=/bin/echo&length=99999")
    assert status3 == 400
    assert "length" in data3["error"]


@pytest.mark.parametrize("bad_fn", ["main; !id", "main|sh", "main$(id)", "main `id`", "a b"])
def test_r2_command_injection_rejected(live_server, bad_fn):
    with pytest.raises(ValueError):
        validate_symbol_arg(bad_fn)

    from urllib.parse import quote
    status, _, data = _get_json(live_server, f"/api/disassemble?program=/bin/echo&fn={quote(bad_fn)}")
    assert status == 400
    assert "Invalid" in data["error"]

    status2, _, data2 = _post_json(
        live_server,
        "/api/mcp",
        {
            "jsonrpc": "2.0",
            "id": 901,
            "method": "tools/call",
            "params": {"name": "decompile_function", "arguments": {"program_id": "/bin/echo", "function": bad_fn}},
        },
    )
    assert status2 == 400
    assert data2["error"]["code"] == -32602


def test_non_binary_plaintext_file_rejected(live_server):
    toml_path = str(ROOT_DIR / "netlify.toml")
    assert os.path.isfile(toml_path)
    status, _, data = _get_json(live_server, f"/api/strings?program={toml_path}")
    assert status in (400, 403)
    assert "executable binary" in data["error"].lower()

    status2, _, data2 = _get_json(live_server, f"/api/inspect?program={toml_path}")
    assert status2 in (400, 403)


# --- L2 SPEC-COMPLIANT JSON-RPC 2.0 MCP & PERSISTENT ANNOTATIONS ---


def test_mcp_protocol_compliance(live_server):
    # initialize
    status, _, data = _post_json(
        live_server,
        "/api/mcp",
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
    )
    assert status == 200
    assert data["result"]["protocolVersion"] == "2024-11-05"
    assert "tools" in data["result"]["capabilities"]
    assert data["result"]["serverInfo"]["name"] == "ghidra-mcp-bridge"
    assert data["result"]["serverInfo"]["version"] == "3.6.0"

    # notification -> 204 zero body
    status_n, _, data_n = _post_json(
        live_server,
        "/api/mcp",
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
    )
    assert status_n == 204
    assert data_n is None

    # ping
    status_p, _, data_p = _post_json(
        live_server,
        "/api/mcp",
        {"jsonrpc": "2.0", "id": 2, "method": "ping"},
    )
    assert status_p == 200
    assert data_p["result"] == {}

    # tools/list -> 8 real tools
    status_t, _, data_t = _post_json(
        live_server,
        "/api/mcp",
        {"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": {}},
    )
    assert status_t == 200
    names = [t["name"] for t in data_t["result"]["tools"]]
    assert len(names) == 8
    assert "inspect_sections_and_entropy" in names
    assert "read_hex_dump" in names

    # unknown method -> -32601
    status_um, _, data_um = _post_json(
        live_server,
        "/api/mcp",
        {"jsonrpc": "2.0", "id": 4, "method": "nonexistent/method", "params": {}},
    )
    assert status_um == 400
    assert data_um["error"]["code"] == -32601

    # unknown tool -> -32601
    status_ut, _, data_ut = _post_json(
        live_server,
        "/api/mcp",
        {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "tools/call",
            "params": {"name": "fake_tool", "arguments": {}},
        },
    )
    assert status_ut == 400
    assert data_ut["error"]["code"] == -32601


def test_annotate_variable_persists_in_decompile_and_disasm(live_server):
    ANNOTATIONS_STORE.clear()
    status, _, data = _post_json(
        live_server,
        "/api/mcp",
        {
            "jsonrpc": "2.0",
            "id": 205,
            "method": "tools/call",
            "params": {
                "name": "annotate_variable",
                "arguments": {
                    "program_id": "zoth-vault-daemon",
                    "function": "main",
                    "old_name": "config",
                    "new_name": "vault_cfg",
                },
            },
        },
    )
    assert status == 200
    assert "vault_cfg" in data["result"]["content"][0]["text"]

    status_d, _, decomp = _get_json(live_server, "/api/decompile?program=zoth-vault-daemon&fn=main")
    assert status_d == 200
    assert "/* Zoth Annotations: config -> vault_cfg */" in decomp["pseudocode"]
    assert "vault_cfg" in decomp["pseudocode"]
    assert "vault_init(&vault_cfg, 8787)" in decomp["pseudocode"]
    ANNOTATIONS_STORE.clear()


# --- L2 PURE-PYTHON ELF / PE32+ / MACH-O / HEX / SHANNON ENTROPY ---


def _build_synthetic_pe64() -> bytes:
    """Build a valid minimal PE32+ (x86_64) binary with .text and high-entropy .packed sections."""
    dos = bytearray(0x80)
    dos[0:2] = b"MZ"
    struct.pack_into("<I", dos, 0x3C, 0x80)

    pe_sig = b"PE\x00\x00"
    coff = struct.pack("<HHIIIHH", 0x8664, 2, 0, 0, 0, 0xF0, 0x0022)
    opt = bytearray(0xF0)
    struct.pack_into("<H", opt, 0, 0x20B)  # PE32+
    struct.pack_into("<I", opt, 16, 0x1000)  # AddressOfEntryPoint
    struct.pack_into("<Q", opt, 24, 0x140000000)  # ImageBase

    text_data = b"\x90" * 64 + b"\xc3" * 64
    packed_data = bytes(range(256))  # exact 8.0000 bits/byte Shannon entropy

    sec1_raw_ptr = 0x200
    sec2_raw_ptr = 0x300
    sec1 = struct.pack("<8sIIIIIIHHI", b".text\x00\x00\x00", len(text_data), 0x1000, len(text_data), sec1_raw_ptr, 0, 0, 0, 0, 0x60000020)
    sec2 = struct.pack("<8sIIIIIIHHI", b".packed\x00", len(packed_data), 0x2000, len(packed_data), sec2_raw_ptr, 0, 0, 0, 0, 0xC0000040)

    hdrs = bytes(dos) + pe_sig + coff + bytes(opt) + sec1 + sec2
    buf = bytearray(hdrs.ljust(sec1_raw_ptr, b"\x00"))
    buf.extend(text_data)
    buf.extend(b"\x00" * (sec2_raw_ptr - len(buf)))
    buf.extend(packed_data)
    return bytes(buf)


def _build_synthetic_macho64() -> bytes:
    """Build a valid minimal Mach-O 64-bit little-endian binary with __TEXT.__text section."""
    sec_offset = 0x100
    sec_data = b"\x55\x48\x89\xe5\x31\xc0\x5d\xc3" * 16
    # LC_SEGMENT_64 (72 bytes) + 1 section_64 (80 bytes) = 152 bytes
    seg_cmd = struct.pack(
        "<II16sQQQQIIII",
        0x19, 152, b"__TEXT", 0x100000000, 0x1000, 0, 0x1000, 7, 5, 1, 0,
    )
    sect_64 = struct.pack(
        "<16s16sQQIIIIIIII",
        b"__text", b"__TEXT", 0x100000100, len(sec_data), sec_offset, 4, 0, 0, 0x80000400, 0, 0, 0,
    )
    lc_main = struct.pack("<IIQQ", 0x80000028, 24, 0x100, 0)
    sizeofcmds = len(seg_cmd) + len(sect_64) + len(lc_main)
    mach_hdr = struct.pack("<IIIIIIII", 0xFEEDFACF, 0x01000007, 3, 2, 2, sizeofcmds, 0, 0)
    blob = (mach_hdr + seg_cmd + sect_64 + lc_main).ljust(sec_offset, b"\x00") + sec_data
    return blob


def test_pure_python_pe64_and_macho64_parsers():
    pe_parsed = parse_binary_headers_and_sections(_build_synthetic_pe64())
    assert pe_parsed["format"] == "PE32+"
    assert "x86_64" in pe_parsed["arch"]
    assert pe_parsed["entry_point"] == "0x140001000"
    assert len(pe_parsed["sections"]) == 2
    assert pe_parsed["sections"][1]["name"] == ".packed"
    assert pe_parsed["sections"][1]["entropy"] == 8.0
    assert pe_parsed["sections"][1]["packed"] is True
    assert pe_parsed["sections"][1]["status"] == "PACKED / ENCRYPTED"
    assert pe_parsed["packed_sections"] == 1

    macho_parsed = parse_binary_headers_and_sections(_build_synthetic_macho64())
    assert macho_parsed["format"] == "Mach-O 64-bit"
    assert macho_parsed["arch"] == "x86_64"
    assert macho_parsed["entry_point"] == "0x100"
    assert len(macho_parsed["sections"]) == 1
    assert macho_parsed["sections"][0]["name"] == "__TEXT.__text"
    assert compute_shannon_entropy(b"\x00" * 64) == 0.0


def test_real_elf64_inspect_sections_hex_decompile(live_server):
    status, _, meta = _get_json(live_server, "/api/inspect?program=/bin/echo")
    assert status == 200
    assert meta["name"] == "echo"
    assert meta["format"] == "ELF64"
    assert meta["format"] != "ELF ELF64"
    assert meta["size_bytes"] > 0
    assert len(meta["sha256"]) == 64

    status_s, _, sec = _get_json(live_server, "/api/sections?program=/bin/echo")
    assert status_s == 200
    assert sec["format"] == "ELF64"
    assert sec["sections_count"] >= 5
    assert any(s["name"] == ".text" for s in sec["sections"])
    assert 0.0 < sec["overall_entropy"] <= 8.0

    status_h, _, hx = _get_json(live_server, "/api/hex?program=/bin/echo&offset=0&length=64")
    assert status_h == 200
    assert hx["length"] == 64
    assert "7f 45 4c 46" in hx["dump"]

    status_dec, _, dec = _get_json(live_server, "/api/decompile?program=/bin/echo&fn=main")
    assert status_dec == 200
    assert len(dec["pseudocode"]) > 40
    assert len(dec["disasm"]) > 0


# --- L1/L2/L5 CLI STDIO MCP & TUI TELEMETRY ---


def test_cli_mcp_stdio_and_tui_no_home_leaks():
    cli_bin = str(ROOT_DIR / "bin" / "ghidra-mcp-bridge")
    tui_bin = str(ROOT_DIR / "bin" / "ghidra-mcp-bridge-tui")
    home_dir = str(Path.home())

    # CLI --json (zero literal home directory leak)
    p_cli = subprocess.run([cli_bin, "--json"], capture_output=True, text=True, timeout=10)
    assert p_cli.returncode == 0
    assert home_dir not in p_cli.stdout
    cli_data = json.loads(p_cli.stdout)
    assert cli_data["version"] == "3.6.0"
    assert cli_data["mcp_tools_count"] == 8

    # CLI --ui
    p_ui = subprocess.run([cli_bin, "--ui"], capture_output=True, text=True, timeout=10)
    assert p_ui.returncode == 0
    assert "127.0.0.1:8131" in p_ui.stdout

    # CLI mcp stdio handshake + tools/list + notification (zero stdout reply for notification)
    stdin_payload = (
        json.dumps({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}) + "\n"
        + json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n"
        + json.dumps({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}) + "\n"
    )
    p_mcp = subprocess.run([cli_bin, "mcp"], input=stdin_payload, capture_output=True, text=True, timeout=10)
    assert p_mcp.returncode == 0
    lines = [l for l in p_mcp.stdout.splitlines() if l.strip()]
    assert len(lines) == 2
    r1, r2 = json.loads(lines[0]), json.loads(lines[1])
    assert r1["result"]["protocolVersion"] == "2024-11-05"
    assert len(r2["result"]["tools"]) == 8

    # TUI --status --json (zero literal home directory leak, zero fake LUFS/sine boilerplate)
    p_tui = subprocess.run([tui_bin, "--status", "--json"], capture_output=True, text=True, timeout=10)
    assert p_tui.returncode == 0
    assert home_dir not in p_tui.stdout
    assert "LUFS" not in p_tui.stdout
    assert "canvasui" not in p_tui.stdout
    tui_data = json.loads(p_tui.stdout)
    assert tui_data["version"] == "3.6.0"
    assert tui_data["mcp_tools_count"] == 8
    assert "Neal Frazier Tech" in tui_data["attribution"]
