#!/usr/bin/env python3
"""HexStrike Security Arsenal CLI (v3.2.0) — Local-first defensive & red-team suite."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from mcp_server import (
    VERSION,
    audit_http_headers,
    audit_local_repo,
    compute_shannon_entropy,
    get_tool_command,
    load_tools_catalog,
    mcp_tool_definitions,
    redact_home_path,
    run_mcp_server,
    run_socket_port_scan,
)


def format_table(rows: list[list[str]], headers: list[str]) -> str:
    """Format simple ASCII table."""
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(val)))

    header_str = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    sep_str = "-+-".join("-" * col_widths[i] for i in range(len(headers)))
    row_strs = [" | ".join(str(row[i]).ljust(col_widths[i]) for i in range(len(headers))) for row in rows]
    return f"{header_str}\n{sep_str}\n" + "\n".join(row_strs)


def _check_daemon_health(port: int = 8138) -> dict:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=1.0) as resp:
            if resp.status == 200:
                return {"online": True, "payload": json.loads(resp.read().decode("utf-8"))}
    except Exception:
        pass
    return {"online": False, "payload": None}


def main(argv: list[str] | None = None) -> int:
    base_parser = argparse.ArgumentParser(add_help=False)
    base_parser.add_argument("--json", action="store_true", help="Format output as JSON")

    parser = argparse.ArgumentParser(
        prog="hexstrike-arsenal",
        description=f"HexStrike Security Arsenal (v{VERSION}) — Local-first security catalog, defensive auditor & MCP server",
        parents=[base_parser],
    )
    parser.add_argument("--version", action="version", version=f"hexstrike-arsenal v{VERSION}")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # 1. list / tools
    for name in ("list", "tools"):
        p_tools = subparsers.add_parser(name, help="List and search tools in the 156-tool security catalog", parents=[base_parser])
        p_tools.add_argument("--category", "-c", type=str, help="Filter by category")
        p_tools.add_argument("--tag", "-t", type=str, help="Filter by tag")
        p_tools.add_argument("--min-score", "-s", type=int, default=1, help="Minimum usefulness rating (1-10)")

    # 2. cmd
    p_cmd = subparsers.add_parser("cmd", help="Generate shell-quoted command syntax for a tool", parents=[base_parser])
    p_cmd.add_argument("tool", type=str, help="Tool ID (e.g. nmap, sqlmap, gobuster)")
    p_cmd.add_argument("target", type=str, help="Validated target domain, IP, or URL")

    # 3. scan
    p_scan = subparsers.add_parser("scan", help="Run bounded loopback TCP socket sweep (127.0.0.1 default)", parents=[base_parser])
    p_scan.add_argument("target", type=str, default="127.0.0.1", nargs="?", help="Loopback host (default: 127.0.0.1)")
    p_scan.add_argument("--ports", "-p", type=str, default="22,80,443,3000,8094,8138,8787,11434", help="Comma-separated ports (max 64)")

    # 4. headers
    p_headers = subparsers.add_parser("headers", help="Audit HTTP security headers on loopback URL or offline raw header dump", parents=[base_parser])
    p_headers.add_argument("--url", "-u", type=str, help="Loopback URL (e.g. http://127.0.0.1:8138)")
    p_headers.add_argument("--raw-file", type=str, help="Path to file containing raw HTTP response headers")

    # 5. entropy
    p_entropy = subparsers.add_parser("entropy", help="Calculate Shannon byte entropy (0.0-8.0 bits/byte) on a file or string", parents=[base_parser])
    p_entropy.add_argument("--file", "-f", dest="file_path", type=str, help="Local file path to analyze")
    p_entropy.add_argument("--text", "-t", type=str, help="Inline text string to analyze")
    p_entropy.add_argument("--hex", action="store_true", help="Interpret --text as hexadecimal bytes")

    # 6. audit
    p_audit = subparsers.add_parser("audit", help="Run local static defensive security audit on a directory or file", parents=[base_parser])
    p_audit.add_argument("--path", "--repo", dest="path", type=str, default=".", help="Local directory or file path to audit")

    # 7. report
    p_report = subparsers.add_parser("report", help="Generate deterministic security assessment markdown report", parents=[base_parser])
    p_report.add_argument("target", type=str, help="Target host or IP")

    # 8. status
    p_status = subparsers.add_parser("status", help="Inspect HexStrike installation, catalog size, MCP tools, and :8138 daemon", parents=[base_parser])
    p_status.add_argument("--port", type=int, default=8138, help="Loopback daemon port to probe (default: 8138)")

    # 9. mcp
    subparsers.add_parser("mcp", help="Run Model Context Protocol (MCP) JSON-RPC 2.0 stdio server (8 tools)", parents=[base_parser])

    # 10. serve
    p_serve = subparsers.add_parser("serve", help="Launch HexStrike loopback HTTP workstation server", parents=[base_parser])
    p_serve.add_argument("--port", type=int, default=8138, help="Port to listen on (default: 8138)")
    p_serve.add_argument("--host", type=str, default="127.0.0.1", help="Host address (default: 127.0.0.1)")
    p_serve.add_argument("--fastapi", action="store_true", help="Run optional FastAPI backend instead of standalone server.py")

    args = parser.parse_args(argv)

    if args.command == "mcp":
        return run_mcp_server()

    if args.command in ("list", "tools"):
        catalog = load_tools_catalog()
        cat = (args.category or "").lower()
        tag = (args.tag or "").lower()
        min_s = args.min_score

        filtered = []
        for t in catalog:
            if cat and cat not in str(t.get("category", "")).lower():
                continue
            if tag and not any(tag in str(x).lower() for x in t.get("tags", [])):
                continue
            if int(t.get("usefulness", 1)) < min_s:
                continue
            filtered.append(t)

        if args.json:
            print(json.dumps({"count": len(filtered), "tools": filtered}, indent=2))
        else:
            rows = [
                [t.get("id", ""), t.get("name", ""), t.get("category", ""), str(t.get("usefulness", "")), ",".join(t.get("tags", [])[:3])]
                for t in filtered[:30]
            ]
            headers = ["ID", "Name", "Category", "Score", "Tags"]
            print(f"\n[+] HexStrike Arsenal ({len(filtered)} tools matching criteria):")
            print(format_table(rows, headers))
            if len(filtered) > 30:
                print(f"\n... and {len(filtered) - 30} more tools. Use --json or filter by --category/--tag.")
        return 0

    if args.command == "cmd":
        try:
            command_str = get_tool_command(args.tool, args.target)
        except ValueError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps({"tool": args.tool, "target": args.target, "command": command_str}, indent=2))
        else:
            print(f"\n[+] Tool: {args.tool}")
            print(f"[+] Target: {args.target}")
            print(f"[+] Command: {command_str}\n")
        return 0

    if args.command == "scan":
        port_list = [int(p.strip()) for p in args.ports.split(",") if p.strip().isdigit()]
        try:
            res = run_socket_port_scan(args.target, port_list, allow_external=False)
        except ValueError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n[+] HexStrike Loopback Socket Scan: {res['host']}")
            print(f"[+] Probed: {res['scanned_count']} ports")
            print(f"[+] Open Ports: {res['open_ports']}")
            print(f"[+] Status: {'NO OPEN PORTS' if len(res['open_ports']) == 0 else 'ACTIVE LISTENERS DETECTED'}\n")
        return 0

    if args.command == "headers":
        raw_hdr = None
        if args.raw_file:
            raw_hdr = Path(os.path.expanduser(args.raw_file)).read_text(encoding="utf-8", errors="ignore")
        try:
            res = audit_http_headers(url=args.url, raw_headers=raw_hdr)
        except (ValueError, RuntimeError, OSError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n[+] HTTP Header Audit: {res['target']} ({res['mode']})")
            print(f"[+] Score: {res['score']}/100 (Grade {res['grade']})")
            rows = [[f["header"], f["status"], f"{f['earned']}/{f['weight']}", f["observed_value"] or "-"] for f in res["findings"]]
            print(format_table(rows, ["Header", "Status", "Points", "Observed Value"]))
        return 0

    if args.command == "entropy":
        try:
            res = compute_shannon_entropy(data=args.text, file_path=args.file_path, is_hex=args.hex)
        except (ValueError, FileNotFoundError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n[+] Shannon Entropy Analysis: {res['source']}")
            print(f"    Bytes          : {res['byte_count']} ({res['unique_bytes']} unique)")
            print(f"    Entropy        : {res['shannon_entropy']} / 8.0 bits/byte")
            print(f"    Printable ASCII: {round(res['printable_ascii_ratio'] * 100, 1)}%")
            print(f"    Classification : {res['classification']}\n")
        return 0

    if args.command == "audit":
        try:
            res = audit_local_repo(args.path)
        except (ValueError, FileNotFoundError) as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"\n[+] Local Defensive Static Audit: {res['target']}")
            print(f"    Files Scanned: {res['scanned_files']} | Findings: {res['finding_count']} {res['severity_counts']}")
            if res["findings"]:
                rows = [[f["severity"], f["rule_id"], f"{f['file']}:{f['line']}", f["title"]] for f in res["findings"][:30]]
                print(format_table(rows, ["Sev", "Rule", "Location", "Finding"]))
        return 0

    if args.command == "report":
        try:
            nmap_c = get_tool_command("nmap", args.target)
            gob_c = get_tool_command("gobuster", args.target)
            nik_c = get_tool_command("nikto", args.target)
            sql_c = get_tool_command("sqlmap", args.target)
        except ValueError as exc:
            print(f"Error: {exc}", file=sys.stderr)
            return 2
        report_md = (
            f"# NullAI HexStrike Security Audit Report: {args.target}\n"
            f"**Classification:** LOCAL ENCLAVE ASSESSMENT\n\n"
            f"Target: `{args.target}`\n"
            f"- **Recon:** `{nmap_c}`\n"
            f"- **Web Surface:** `{gob_c}`\n"
            f"- **Vulnerability Check:** `{nik_c}`\n"
            f"- **Injection Verification:** `{sql_c}`\n"
        )
        if args.json:
            print(json.dumps({"target": args.target, "report": report_md}, indent=2))
        else:
            print(report_md)
        return 0

    if args.command == "status":
        catalog = load_tools_catalog()
        mcp_defs = mcp_tool_definitions()
        daemon = _check_daemon_health(args.port)
        info = {
            "id": "hexstrike-arsenal",
            "name": "HexStrike Security Arsenal",
            "version": VERSION,
            "root_dir": redact_home_path(str(ROOT)),
            "arsenal_count": len(catalog),
            "mcp_tool_count": len(mcp_defs),
            "mcp_tools": [t["name"] for t in mcp_defs],
            "local_endpoint": f"http://127.0.0.1:{args.port}",
            "studio_route": "http://127.0.0.1:3000/tools/hexstrike-arsenal",
            "daemon_online": daemon["online"],
            "access": "100% Free & Open Access",
        }
        if args.json:
            print(json.dumps(info, indent=2))
        else:
            print(f"HexStrike Security Arsenal v{VERSION}")
            print(f"  Root Dir   : {info['root_dir']}")
            print(f"  Catalog    : {info['arsenal_count']} tools | MCP Tools: {info['mcp_tool_count']}")
            print(f"  Daemon     : {'ONLINE' if info['daemon_online'] else 'IDLE (on-demand)'} ({info['local_endpoint']})")
            print(f"  Studio URL : {info['studio_route']}")
        return 0

    if args.command == "serve":
        if args.fastapi:
            try:
                import uvicorn

                print(f"Launching HexStrike FastAPI Backend at http://{args.host}:{args.port}...")
                uvicorn.run("backend.main:app", host=args.host, port=args.port, reload=False)
                return 0
            except Exception as e:
                print(f"Error launching FastAPI backend: {e}", file=sys.stderr)
                return 1
        from server import main as run_standalone_server

        return run_standalone_server(["--host", args.host, "--port", str(args.port)])

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
