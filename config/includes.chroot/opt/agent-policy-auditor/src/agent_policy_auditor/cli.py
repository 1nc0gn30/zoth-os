"""CLI Entrypoint for Agent Policy Auditor.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library — Zero External Dependencies.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

from agent_policy_auditor import __version__
from agent_policy_auditor.auditor import ManifestAuditor
from agent_policy_auditor.broker import PolicyBroker
from agent_policy_auditor.mcp_server import run_stdio_server
from agent_policy_auditor.web_cockpit import serve


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    for var in ("ZOTH_BIND_HOST", "HOST"):
        val = os.environ.get(var, "").strip()
        if val == "localhost":
            return "127.0.0.1"
        if val:
            try:
                ipaddress.ip_address(val)
                return val
            except ValueError:
                pass
    return "127.0.0.1"


def _fetch_json(url: str, timeout: float = 1.5) -> Optional[Dict[str, Any]]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return None


def _emit_status(host: str, port: int, as_json: bool) -> None:
    base = f"http://{host}:{port}"
    health = _fetch_json(f"{base}/health")
    stats = None
    active: List[Dict[str, Any]] = []
    online = False

    if health and health.get("status") == "ok":
        stats = _fetch_json(f"{base}/api/stats")
        leases_payload = _fetch_json(f"{base}/api/leases") or {}
        active = leases_payload.get("leases", [])
        online = stats is not None

    if not online:
        broker = PolicyBroker()
        stats = broker.get_stats()
        active = broker.get_active_leases()

    payload = {
        "service": "agent-policy-auditor",
        "version": __version__,
        "online": online,
        "mode": "live-daemon" if online else "offline-sqlite",
        "host": host,
        "port": port,
        "endpoint": base,
        "health": health,
        "stats": stats,
        "active_leases": active,
    }

    if as_json:
        print(json.dumps(payload, indent=2))
        return

    print("\n" + "=" * 62)
    print(f"  AGENT POLICY AUDITOR v{__version__} — BROKER STATUS")
    print("=" * 62)
    print(f"  • Daemon Endpoint:      {base} ({'ONLINE' if online else 'OFFLINE / LOCAL SQLITE'})")
    print(f"  • Total Leases Granted: {stats['total_leases_granted']}")
    print(f"  • Active Leases:        {stats['active_leases_count']}")
    print(f"  • Revoked Leases:       {stats['revoked_leases_count']}")
    print(f"  • Violations Blocked:   {stats['violations_blocked']}")
    print(f"  • Budget Allocated:     ${stats['total_budget_allocated_usd']:.2f}")
    print(f"  • Budget Consumed:      ${stats['total_budget_consumed_usd']:.4f}")
    print("-" * 62)
    if active:
        print("  ACTIVE LEASES:")
        for lease in active:
            print(
                f"    [{lease['lease_id']}] Agent: {lease['agent_id']} | "
                f"Cap: {lease['capability']} | Target: {lease['target']} | TTL: {lease['ttl_seconds']:.1f}s"
            )
    else:
        print("  No active leases currently in effect.")
    print("=" * 62 + "\n")


def main(argv: Optional[List[str]] = None) -> None:
    parser = argparse.ArgumentParser(
        prog="agent-policy-auditor",
        description=f"Agent Policy Auditor & Capability Leaser v{__version__} (Port 8106)",
    )
    parser.add_argument("-v", "--version", action="version", version=f"agent-policy-auditor {__version__}")
    parser.add_argument("--status", action="store_true", help="Display active leases and live/offline broker telemetry")
    parser.add_argument("--json", action="store_true", help="Emit structured JSON output")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Daemon host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8106, help="Daemon port (default: 8106)")

    subparsers = parser.add_subparsers(dest="subcommand", help="Subcommand to run")

    # Serve Command
    serve_parser = subparsers.add_parser("serve", help="Launch the Cockpit REST API and web UI")
    serve_parser.add_argument("--port", type=int, default=8106, help="Port to bind (default: 8106)")
    serve_parser.add_argument(
        "--host",
        type=str,
        default=_default_bind_host(),
        help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST)",
    )

    # Status Command
    status_parser = subparsers.add_parser("status", help="Display active leases and broker telemetry")
    status_parser.add_argument("--host", type=str, default="127.0.0.1", help="Daemon host (default: 127.0.0.1)")
    status_parser.add_argument("--port", type=int, default=8106, help="Daemon port (default: 8106)")
    status_parser.add_argument("--json", action="store_true", help="Emit structured JSON output")

    # MCP Command
    subparsers.add_parser("mcp", help="Run zero-dependency JSON-RPC 2.0 stdio MCP server")

    # Lease Commands
    lease_parser = subparsers.add_parser("lease", help="Manage capability leases")
    lease_sub = lease_parser.add_subparsers(dest="lease_action")

    grant_parser = lease_sub.add_parser("grant", help="Issue a new capability lease")
    grant_parser.add_argument("--agent", type=str, required=True, help="Agent identifier")
    grant_parser.add_argument(
        "--cap",
        type=str,
        required=True,
        help="Capability type (FS_READ, FS_WRITE, NET_EGRESS, SHELL_EXEC, TOKEN_BUDGET)",
    )
    grant_parser.add_argument("--target", type=str, default="*", help="Target glob or domain")
    grant_parser.add_argument("--duration", type=float, default=300.0, help="Duration in seconds (1..86400)")
    grant_parser.add_argument("--budget", type=float, default=0.0, help="Max USD budget quota (default: 0.0)")
    grant_parser.add_argument("--json", action="store_true", help="Emit JSON output")

    verify_parser = lease_sub.add_parser("verify", help="Verify an action against a lease")
    verify_parser.add_argument("--lease", type=str, required=True, help="Lease ID")
    verify_parser.add_argument("--cap", type=str, required=True, help="Capability type to verify")
    verify_parser.add_argument("--target", type=str, required=True, help="Target path/domain to verify")
    verify_parser.add_argument("--cost", type=float, default=0.0, help="Action USD cost")
    verify_parser.add_argument("--json", action="store_true", help="Emit JSON output")

    revoke_parser = lease_sub.add_parser("revoke", help="Revoke a specific lease")
    revoke_parser.add_argument("--lease", type=str, required=True, help="Lease ID to revoke")
    revoke_parser.add_argument("--json", action="store_true", help="Emit JSON output")

    revoke_all_parser = lease_sub.add_parser("revoke-all", help="Emergency kill-switch for one agent or all agents")
    revoke_all_parser.add_argument("--agent", type=str, default="", help="Specific agent ID (omit with --all for global kill)")
    revoke_all_parser.add_argument("--all", dest="all_agents", action="store_true", help="Revoke all leases across all agents")
    revoke_all_parser.add_argument("--json", action="store_true", help="Emit JSON output")

    # Audit Command
    audit_parser = subparsers.add_parser("audit", help="Audit an agent manifest or tool schema")
    audit_parser.add_argument("--file", type=str, required=True, help="Path to JSON manifest or prompt file")
    audit_parser.add_argument("--json", action="store_true", help="Emit audit report as JSON")

    args = parser.parse_args(argv)

    if getattr(args, "status", False) or (getattr(args, "json", False) and not args.subcommand):
        _emit_status(args.host, args.port, as_json=bool(getattr(args, "json", False)))
        return

    if args.subcommand == "serve":
        serve(port=args.port, host=args.host)
        return

    if args.subcommand == "status":
        _emit_status(args.host, args.port, as_json=bool(getattr(args, "json", False)))
        return

    if args.subcommand == "mcp":
        sys.exit(run_stdio_server())

    if args.subcommand == "lease":
        broker = PolicyBroker()
        if args.lease_action == "grant":
            try:
                lease = broker.grant_lease(
                    agent_id=args.agent,
                    capability=args.cap,
                    target=args.target,
                    duration_sec=args.duration,
                    max_budget_usd=args.budget,
                )
            except ValueError as exc:
                print(f"Error: {exc}", file=sys.stderr)
                sys.exit(2)
            if getattr(args, "json", False):
                print(json.dumps({"status": "granted", "lease": lease.to_dict()}, indent=2))
                return
            print(f"✓ Granted Lease: {lease.lease_id}")
            print(f"  Agent:      {lease.agent_id}")
            print(f"  Capability: {lease.capability}")
            print(f"  Target:     {lease.target}")
            print(f"  Budget Cap: ${lease.max_budget_usd:.2f}")
            print(f"  Expires:    {time.ctime(lease.expires_at)} ({lease.duration_sec:.0f}s)")
            return

        if args.lease_action == "verify":
            try:
                allowed, reason = broker.verify_action(
                    lease_id=args.lease,
                    capability=args.cap,
                    target=args.target,
                    cost_usd=args.cost,
                )
            except ValueError as exc:
                print(f"Error: {exc}", file=sys.stderr)
                sys.exit(2)
            if getattr(args, "json", False):
                print(json.dumps({"allowed": allowed, "reason": reason}, indent=2))
            else:
                print(f"Result: {'✓ AUTHORIZED' if allowed else '✗ DENIED'}")
                print(f"Reason: {reason}")
            sys.exit(0 if allowed else 1)

        if args.lease_action == "revoke":
            success = broker.revoke_lease(args.lease)
            if getattr(args, "json", False):
                print(json.dumps({"revoked": success, "lease_id": args.lease}, indent=2))
            elif success:
                print(f"✓ Revoked Lease: {args.lease}")
            else:
                print(f"✗ Lease not found: {args.lease}")
            sys.exit(0 if success else 1)

        if args.lease_action == "revoke-all":
            if args.all_agents or not args.agent:
                count = broker.revoke_all_leases()
                scope = "all_agents"
            else:
                count = broker.revoke_all_for_agent(args.agent)
                scope = args.agent
            if getattr(args, "json", False):
                print(json.dumps({"revoked_count": count, "scope": scope}, indent=2))
            else:
                print(f"⚡ Revoked {count} active lease(s) (scope: {scope})")
            return

        lease_parser.print_help()
        return

    if args.subcommand == "audit":
        p = Path(args.file)
        if not p.is_file():
            print(f"Error: File not found: {args.file}", file=sys.stderr)
            sys.exit(1)
        raw = p.read_text(encoding="utf-8")
        auditor = ManifestAuditor()
        report = auditor.audit_manifest(raw, name=p.name)
        if getattr(args, "json", False):
            print(json.dumps(report.to_dict(), indent=2))
            return
        print("\n" + "=" * 62)
        print(f"  MANIFEST AUDIT REPORT: {report.manifest_name}")
        print("=" * 62)
        print(f"  • Security Score: {report.security_score}/100 [{report.risk_level}]")
        print(f"  • Total Findings: {report.total_findings}")
        print("-" * 62)
        for f in report.findings:
            print(f"  [{f.severity}] {f.rule_id}: {f.description}")
            print(f"     Remediation: {f.remediation}")
        print("-" * 62)
        print(f"  Compliance: {json.dumps(report.compliance_frameworks, indent=4)}")
        print("=" * 62 + "\n")
        return

    parser.print_help()


if __name__ == "__main__":
    main()
