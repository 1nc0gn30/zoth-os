#!/usr/bin/env python3
"""Standard Model Context Protocol (MCP) server for NullAI HexStrike Security Arsenal (v3.2.0).

Exposes HexStrike's 156-tool security catalog, hardened command synthesis, loopback-scoped
TCP port probing, HTTP security header auditing, Shannon byte entropy inspection, local
repository static security auditing, and markdown reporting over JSON-RPC 2.0 stdio.
"""

from __future__ import annotations

import json
import math
import os
import re
import shlex
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

VERSION = "3.2.0"
ROOT = Path(__file__).resolve().parent
TOOLS_JSON_PATH = ROOT / "ui" / "src" / "data" / "tools.json"
INTEL_PATH = Path(os.path.expanduser("~/.hexstrike/intel.json"))

TARGET_ALLOWLIST_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$")
TOOL_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$")
SHELL_META_RE = re.compile(r"[;&|`$()<>\\\n\r'\"\t\x00]")
LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1"}
MAX_SCAN_PORTS = 64

# Fallback tools list if tools.json isn't present
DEFAULT_TOOLS = [
    {"id": "nmap", "name": "Nmap Network Scan", "category": "Recon", "usefulness": 10, "tags": ["recon", "scan", "port-scan"]},
    {"id": "masscan", "name": "Masscan", "category": "Recon", "usefulness": 9, "tags": ["recon", "fast", "port-scan"]},
    {"id": "amass", "name": "OWASP Amass", "category": "Recon", "usefulness": 9, "tags": ["recon", "osint"]},
    {"id": "sqlmap", "name": "SQLMap Automated Injection", "category": "Exploitation", "usefulness": 10, "tags": ["sqli", "database"]},
    {"id": "nikto", "name": "Nikto Web Vulnerability Scanner", "category": "Web", "usefulness": 8, "tags": ["web", "cve"]},
    {"id": "gobuster", "name": "Gobuster Directory Scanner", "category": "Web", "usefulness": 9, "tags": ["web", "bruteforce"]},
    {"id": "ffuf", "name": "FFUF Fast Web Fuzzer", "category": "Web", "usefulness": 10, "tags": ["fuzz", "web"]},
    {"id": "hydra", "name": "THC-Hydra Login Cracker", "category": "Password", "usefulness": 9, "tags": ["bruteforce", "auth"]},
    {"id": "hashcat", "name": "Hashcat Password Recovery", "category": "Password", "usefulness": 10, "tags": ["gpu", "hash"]},
    {"id": "metasploit", "name": "Metasploit Framework", "category": "Exploitation", "usefulness": 10, "tags": ["framework", "exploit"]},
]

# Required defensive HTTP security headers with weights summing to 100
SECURITY_HEADER_SPEC = [
    ("strict-transport-security", "Strict-Transport-Security", 20, "Enforces HTTPS transport and mitigates downgrade attacks."),
    ("content-security-policy", "Content-Security-Policy", 25, "Restricts script, frame, and resource origins to mitigate XSS."),
    ("x-frame-options", "X-Frame-Options", 15, "Prevents clickjacking via iframe framing policies."),
    ("x-content-type-options", "X-Content-Type-Options", 15, "Prevents MIME-type sniffing via nosniff."),
    ("referrer-policy", "Referrer-Policy", 15, "Controls outbound referrer leakage."),
    ("permissions-policy", "Permissions-Policy", 10, "Restricts sensitive browser hardware/API capabilities."),
]

STATIC_AUDIT_RULES = [
    ("HS-SEC-001", "HIGH", "Unsafe subprocess shell invocation", re.compile(r"\b(?:create_subprocess_shell|shell\s*=\s*True|os\.popen\s*\()")),
    ("HS-SEC-002", "HIGH", "Dynamic eval/exec sink", re.compile(r"\b(?:eval|exec)\s*\(")),
    ("HS-SEC-003", "MEDIUM", "Raw innerHTML DOM sink", re.compile(r"\.innerHTML\s*=")),
    ("HS-SEC-004", "CRITICAL", "Potential hardcoded API key/token shape", re.compile(r"(?:AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)")),
    ("HS-SEC-005", "HIGH", "Disabled TLS certificate verification", re.compile(r"(?:ssl\s*=\s*False|verify\s*=\s*False|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]?0)")),
    ("HS-SEC-006", "HIGH", "Disabled Electron webSecurity", re.compile(r"webSecurity\s*:\s*false")),
]

AUDIT_SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".pytest_cache"}
AUDIT_EXTENSIONS = {".py", ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".html", ".sh", ".json", ".yml", ".yaml", ".env"}


def redact_home_path(path_str: str) -> str:
    """Replace user home prefix with '~' so reports never leak local usernames."""
    home = str(Path.home())
    if path_str.startswith(home):
        return "~" + path_str[len(home):]
    return path_str


def sanitize_target(target: str) -> str:
    """Validate target against strict allowlist (no leading dash, no shell metacharacters)."""
    if not isinstance(target, str):
        raise ValueError("Target must be a string")
    cleaned = target.strip()
    if not cleaned or cleaned.startswith("-"):
        raise ValueError("Invalid target: empty or leading dash rejected")
    if ".." in cleaned or SHELL_META_RE.search(cleaned):
        raise ValueError("Invalid target: shell metacharacters rejected")
    if not TARGET_ALLOWLIST_RE.fullmatch(cleaned):
        raise ValueError("Invalid target: contains disallowed characters")
    return cleaned


def sanitize_tool_id(tool_id: str) -> str:
    """Validate tool identifier against strict token allowlist."""
    if not isinstance(tool_id, str):
        raise ValueError("Tool ID must be a string")
    cleaned = tool_id.strip()
    if not TOOL_ID_RE.fullmatch(cleaned):
        raise ValueError("Invalid tool identifier")
    return cleaned


def load_tools_catalog() -> list[dict[str, Any]]:
    if TOOLS_JSON_PATH.exists():
        try:
            with open(TOOLS_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and data:
                    return data
        except Exception:
            pass
    return DEFAULT_TOOLS


def get_tool_command(tool_id: str, target: str) -> str:
    """Generate canonical, shell-quoted command invocation syntax for a tool against a validated target."""
    safe_tool = sanitize_tool_id(tool_id)
    safe_target = sanitize_target(target)
    quoted_target = shlex.quote(safe_target)
    url_target = safe_target if safe_target.startswith(("http://", "https://")) else f"http://{safe_target}"
    quoted_url = shlex.quote(url_target)

    cmd_map = {
        "nmap": f"nmap -sV -sC -- {quoted_target}",
        "masscan": f"masscan -p1-10000 {quoted_target} --rate=1000",
        "amass": f"amass enum -d {quoted_target}",
        "sublist3r": f"sublist3r -d {quoted_target}",
        "gobuster": f"gobuster dir -u {quoted_url} -w /usr/share/wordlists/dirb/common.txt",
        "ffuf": f"ffuf -u {shlex.quote(url_target.rstrip('/') + '/FUZZ')} -w /usr/share/wordlists/dirb/common.txt",
        "nikto": f"nikto -h {quoted_target}",
        "whatweb": f"whatweb -a 3 -- {quoted_target}",
        "sqlmap": f"sqlmap -u {quoted_url} --batch --banner",
        "commix": f"commix --url {quoted_url} --batch",
        "wpscan": f"wpscan --url {quoted_url} --no-update",
        "nuclei": f"nuclei -u {quoted_url}",
        "hydra": f"hydra -L /usr/share/wordlists/metasploit/namelist.txt -P /usr/share/wordlists/rockyou.txt {quoted_target} ssh",
        "hashcat": f"hashcat -m 0 {quoted_target} /usr/share/wordlists/rockyou.txt",
        "john": f"john --wordlist=/usr/share/wordlists/rockyou.txt {quoted_target}",
        "metasploit": f"msfconsole -q -x {shlex.quote(f'use auxiliary/scanner/portscan/tcp; set RHOSTS {safe_target}; run; exit')}",
        "searchsploit": f"searchsploit -- {quoted_target}",
        "trivy": f"trivy image -- {quoted_target}",
        "portscan": f"nmap -Pn -T4 -p 1-1000 -- {quoted_target}",
    }
    return cmd_map.get(safe_tool.lower(), f"{shlex.quote(safe_tool)} -- {quoted_target}")


def run_socket_port_scan(
    host: str,
    ports: list[int],
    timeout: float = 0.4,
    allow_external: bool = False,
) -> dict[str, Any]:
    """Perform bounded, zero-dependency TCP socket probe (loopback-only by default)."""
    clean_host = (host or "127.0.0.1").strip().lower()
    if not allow_external and clean_host not in LOOPBACK_HOSTS:
        raise ValueError(
            f"External host '{clean_host}' blocked by default loopback policy (allowed: 127.0.0.1, localhost, ::1)"
        )

    validated_ports: list[int] = []
    seen: set[int] = set()
    for p in ports:
        try:
            pi = int(p)
        except (TypeError, ValueError):
            continue
        if 1 <= pi <= 65535 and pi not in seen:
            seen.add(pi)
            validated_ports.append(pi)
        if len(validated_ports) >= MAX_SCAN_PORTS:
            break

    family = socket.AF_INET6 if ":" in clean_host else socket.AF_INET
    open_ports: list[int] = []
    closed_ports: list[int] = []

    for port in validated_ports:
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.settimeout(max(0.05, min(float(timeout), 2.0)))
                res = s.connect_ex((clean_host, port))
                if res == 0:
                    open_ports.append(port)
                else:
                    closed_ports.append(port)
        except OSError:
            closed_ports.append(port)

    return {
        "host": clean_host,
        "loopback_enforced": not allow_external,
        "scanned_count": len(validated_ports),
        "open_ports": open_ports,
        "closed_ports": closed_ports,
        "open_count": len(open_ports),
        "closed_count": len(closed_ports),
    }


def _parse_raw_http_headers(raw_headers: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for line in raw_headers.splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        key = k.strip().lower()
        val = v.strip()
        if key and not key.startswith("http/"):
            headers[key] = val
    return headers


def audit_http_headers(
    url: str | None = None,
    raw_headers: str | dict[str, str] | None = None,
    timeout: float = 3.0,
) -> dict[str, Any]:
    """Audit observed HTTP security headers from a loopback URL or offline raw header dump.

    Never fabricates PASS scores: every score is computed strictly from observed headers.
    """
    observed: dict[str, str] = {}
    source_mode = "offline_raw"
    status_code: int | None = None
    target_label = "offline-raw-headers"

    if raw_headers is not None and (isinstance(raw_headers, dict) or str(raw_headers).strip()):
        if isinstance(raw_headers, dict):
            observed = {str(k).strip().lower(): str(v).strip() for k, v in raw_headers.items()}
        else:
            observed = _parse_raw_http_headers(str(raw_headers))
    elif url:
        raw_url = url.strip()
        if "://" not in raw_url:
            raw_url = f"http://{raw_url}"
        parsed = urllib.parse.urlparse(raw_url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Only http:// and https:// URLs are supported")
        host = (parsed.hostname or "").strip().lower()
        if host not in LOOPBACK_HOSTS:
            raise ValueError(
                f"Live HTTP header probe restricted to loopback targets (127.0.0.1, localhost, ::1); "
                f"paste raw_headers for offline inspection of '{host}'."
            )
        source_mode = "loopback_live"
        target_label = parsed.geturl()
        req = urllib.request.Request(
            target_label,
            method="HEAD",
            headers={"User-Agent": f"HexStrike-HeaderAuditor/{VERSION}"},
        )
        try:
            with urllib.request.urlopen(req, timeout=max(0.5, min(float(timeout), 5.0))) as resp:
                status_code = resp.status
                observed = {k.lower(): v for k, v in resp.headers.items()}
        except urllib.error.HTTPError as exc:
            status_code = exc.code
            observed = {k.lower(): v for k, v in (exc.headers.items() if exc.headers else [])}
        except Exception as exc:
            raise RuntimeError(f"Failed to probe {target_label}: {exc}") from exc
    else:
        raise ValueError("Either url (loopback) or raw_headers must be provided")

    findings: list[dict[str, Any]] = []
    score = 0
    for key, display_name, weight, desc in SECURITY_HEADER_SPEC:
        val = observed.get(key)
        present = bool(val)
        if present:
            score += weight
        findings.append(
            {
                "header": display_name,
                "key": key,
                "present": present,
                "status": "PASS" if present else "MISSING",
                "weight": weight,
                "earned": weight if present else 0,
                "observed_value": val if present else None,
                "description": desc,
            }
        )

    server_banner = observed.get("server")
    powered_by = observed.get("x-powered-by")
    disclosures: list[str] = []
    if server_banner and any(tok in server_banner.lower() for tok in ("python/", "basehttp", "apache/", "nginx/", "php/")):
        disclosures.append(f"Server header leaks version info: {server_banner}")
    if powered_by:
        disclosures.append(f"X-Powered-By leaks stack info: {powered_by}")

    grade = "A+" if score >= 95 else "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 50 else "D" if score >= 30 else "F"
    return {
        "target": target_label,
        "mode": source_mode,
        "http_status": status_code,
        "observed_header_count": len(observed),
        "score": score,
        "max_score": 100,
        "grade": grade,
        "findings": findings,
        "disclosures": disclosures,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def compute_shannon_entropy(
    data: bytes | str | None = None,
    file_path: str | None = None,
    is_hex: bool = False,
    max_bytes: int = 2 * 1024 * 1024,
) -> dict[str, Any]:
    """Compute exact Shannon byte entropy (0.0-8.0 bits/byte), byte stats, and packing classification."""
    source_label = "inline-input"
    raw_bytes: bytes

    if file_path:
        p = Path(os.path.expanduser(file_path)).resolve()
        if not p.is_file():
            raise FileNotFoundError(f"File not found: {redact_home_path(str(p))}")
        with open(p, "rb") as f:
            raw_bytes = f.read(max_bytes)
        source_label = redact_home_path(str(p))
    elif data is not None:
        if isinstance(data, bytes):
            raw_bytes = data[:max_bytes]
        else:
            text_val = str(data)
            if is_hex:
                cleaned_hex = re.sub(r"[^0-9a-fA-F]", "", text_val)
                if len(cleaned_hex) % 2 != 0:
                    raise ValueError("Hex input must contain an even number of hex digits")
                raw_bytes = bytes.fromhex(cleaned_hex)[:max_bytes]
            else:
                raw_bytes = text_val.encode("utf-8")[:max_bytes]
    else:
        raise ValueError("Either data or file_path must be provided")

    total = len(raw_bytes)
    if total == 0:
        return {
            "source": source_label,
            "byte_count": 0,
            "unique_bytes": 0,
            "shannon_entropy": 0.0,
            "max_entropy": 8.0,
            "printable_ascii_ratio": 0.0,
            "classification": "EMPTY",
            "top_bytes": [],
        }

    counts = Counter(raw_bytes)
    entropy = 0.0
    for count in counts.values():
        p_b = count / total
        entropy -= p_b * math.log2(p_b)

    printable = sum(1 for b in raw_bytes if 32 <= b <= 126 or b in (9, 10, 13))
    printable_ratio = round(printable / total, 4)

    if entropy >= 7.2:
        classification = "PACKED / ENCRYPTED"
    elif entropy >= 6.0:
        classification = "HIGH_ENTROPY / COMPRESSED"
    elif entropy >= 3.5:
        classification = "NORMAL_TEXT_OR_CODE"
    else:
        classification = "LOW_ENTROPY / STRUCTURED"

    top_bytes = [
        {"byte_hex": f"0x{b:02x}", "count": c, "ratio": round(c / total, 4)}
        for b, c in counts.most_common(8)
    ]

    return {
        "source": source_label,
        "byte_count": total,
        "unique_bytes": len(counts),
        "shannon_entropy": round(entropy, 4),
        "max_entropy": 8.0,
        "printable_ascii_ratio": printable_ratio,
        "classification": classification,
        "top_bytes": top_bytes,
    }


def audit_local_repo(
    path: str,
    max_files: int = 250,
    max_file_bytes: int = 256 * 1024,
) -> dict[str, Any]:
    """Run bounded local defensive static security audit on a directory or single file."""
    target = Path(os.path.expanduser(path)).resolve()
    if not target.exists():
        raise FileNotFoundError(f"Audit path not found: {redact_home_path(str(target))}")

    files_to_scan: list[Path] = []
    if target.is_file():
        files_to_scan.append(target)
    else:
        for dirpath, dirnames, filenames in os.walk(target):
            dirnames[:] = [d for d in sorted(dirnames) if d not in AUDIT_SKIP_DIRS]
            for fn in sorted(filenames):
                fp = Path(dirpath) / fn
                if fp.is_symlink():
                    continue
                if fp.suffix.lower() in AUDIT_EXTENSIONS or fn in (".gitignore", "Dockerfile"):
                    files_to_scan.append(fp)
                    if len(files_to_scan) >= max_files:
                        break
            if len(files_to_scan) >= max_files:
                break

    findings: list[dict[str, Any]] = []
    scanned_files = 0
    for fp in files_to_scan:
        try:
            if not fp.resolve().is_relative_to(target if target.is_dir() else target.parent):
                continue
            if fp.stat().st_size > max_file_bytes:
                continue
            content = fp.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        scanned_files += 1
        rel = str(fp.relative_to(target)) if target.is_dir() else fp.name
        for line_no, line in enumerate(content.splitlines(), 1):
            for rule_id, severity, title, pattern in STATIC_AUDIT_RULES:
                if pattern.search(line):
                    findings.append(
                        {
                            "rule_id": rule_id,
                            "severity": severity,
                            "title": title,
                            "file": rel,
                            "line": line_no,
                            "snippet": line.strip()[:120],
                        }
                    )
                    if len(findings) >= 100:
                        break
            if len(findings) >= 100:
                break

    hygiene: list[dict[str, Any]] = []
    if target.is_dir():
        has_gitignore = (target / ".gitignore").is_file()
        hygiene.append({"check": ".gitignore present", "status": "PASS" if has_gitignore else "WARN"})
        has_readme = (target / "README.md").is_file()
        hygiene.append({"check": "README.md present", "status": "PASS" if has_readme else "WARN"})

    sev_counts = Counter(f["severity"] for f in findings)
    return {
        "target": redact_home_path(str(target)),
        "scanned_files": scanned_files,
        "finding_count": len(findings),
        "severity_counts": {
            "CRITICAL": sev_counts.get("CRITICAL", 0),
            "HIGH": sev_counts.get("HIGH", 0),
            "MEDIUM": sev_counts.get("MEDIUM", 0),
        },
        "hygiene": hygiene,
        "findings": findings,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def mcp_tool_definitions() -> list[dict[str, Any]]:
    return [
        {
            "name": "hexstrike_list_tools",
            "description": "List and filter the 156-tool HexStrike security catalog by category, tag, or usefulness score.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "Filter by category (e.g. Recon, Web, Exploitation, Password, Cloud)"},
                    "tag": {"type": "string", "description": "Filter by tag (e.g. osint, sqli, bruteforce, cve)"},
                    "min_usefulness": {"type": "integer", "description": "Minimum usefulness rating (1-10)", "default": 1},
                },
            },
        },
        {
            "name": "hexstrike_generate_cmd",
            "description": "Generate shell-quoted canonical command line invocation syntax for a security tool against a validated target.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "tool": {"type": "string", "description": "Tool identifier (e.g. nmap, sqlmap, gobuster, nikto)"},
                    "target": {"type": "string", "description": "Validated domain, IP address, or URL target"},
                },
                "required": ["tool", "target"],
            },
        },
        {
            "name": "hexstrike_port_scan",
            "description": "Perform bounded non-destructive loopback TCP socket port sweep (127.0.0.1 / localhost / ::1, max 64 ports).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "host": {"type": "string", "description": "Loopback host (default 127.0.0.1)", "default": "127.0.0.1"},
                    "ports": {"type": "array", "items": {"type": "integer"}, "description": "List of TCP ports (1..65535, max 64)"},
                },
            },
        },
        {
            "name": "hexstrike_target_intel",
            "description": "Retrieve stored target intelligence, history, and findings from the local ~/.hexstrike/intel.json enclave.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Target hostname or IP"},
                },
                "required": ["target"],
            },
        },
        {
            "name": "hexstrike_generate_report",
            "description": "Generate a deterministic markdown security assessment report with UTC timestamp and validated commands.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "Target hostname or IP"},
                },
                "required": ["target"],
            },
        },
        {
            "name": "hexstrike_audit_headers",
            "description": "Inspect HTTP security headers (HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) on a loopback URL or offline raw header dump.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Loopback URL (e.g. http://127.0.0.1:8138)"},
                    "raw_headers": {"type": "string", "description": "Optional offline raw HTTP response headers block"},
                },
            },
        },
        {
            "name": "hexstrike_shannon_entropy",
            "description": "Compute exact Shannon byte entropy (0.0-8.0 bits/byte), printable ASCII ratio, and packing/encryption classification on a local file or inline data.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "file_path": {"type": "string", "description": "Local file path to inspect"},
                    "data": {"type": "string", "description": "Inline UTF-8 text or hex string"},
                    "is_hex": {"type": "boolean", "description": "Decode inline data as hexadecimal bytes", "default": False},
                },
            },
        },
        {
            "name": "hexstrike_audit_repo",
            "description": "Run local defensive static security checks (shell injection, eval/innerHTML sinks, disabled TLS/webSecurity, secret shapes) on a local repository path.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Local directory or file path to audit"},
                },
                "required": ["path"],
            },
        },
    ]


def handle_mcp_tool_call(tool_name: str, args: dict[str, Any], catalog: list[dict[str, Any]] | None = None) -> tuple[Any, dict[str, Any] | None]:
    """Dispatch a single MCP tools/call invocation cleanly."""
    cat_list = catalog if catalog is not None else load_tools_catalog()

    try:
        if tool_name == "hexstrike_list_tools":
            cat = str(args.get("category", "")).lower()
            tag = str(args.get("tag", "")).lower()
            min_u = int(args.get("min_usefulness", 1))

            filtered = []
            for t in cat_list:
                if cat and cat not in str(t.get("category", "")).lower():
                    continue
                if tag and not any(tag in str(x).lower() for x in t.get("tags", [])):
                    continue
                if int(t.get("usefulness", 1)) < min_u:
                    continue
                filtered.append(t)

            return {"content": [{"type": "text", "text": json.dumps({"count": len(filtered), "tools": filtered}, indent=2)}]}, None

        if tool_name == "hexstrike_generate_cmd":
            tool = str(args.get("tool", ""))
            target = str(args.get("target", ""))
            cmd = get_tool_command(tool, target)
            return {"content": [{"type": "text", "text": json.dumps({"tool": tool, "target": target, "command": cmd}, indent=2)}]}, None

        if tool_name == "hexstrike_port_scan":
            host = str(args.get("host", "127.0.0.1"))
            ports = args.get("ports") or [22, 80, 443, 3000, 8094, 8138, 8787, 11434]
            res = run_socket_port_scan(host, ports, allow_external=False)
            return {"content": [{"type": "text", "text": json.dumps(res, indent=2)}]}, None

        if tool_name == "hexstrike_target_intel":
            target = sanitize_target(str(args.get("target", "")))
            intel_data: dict[str, Any] = {}
            if INTEL_PATH.exists():
                try:
                    with open(INTEL_PATH, "r", encoding="utf-8") as f:
                        intel_data = json.load(f)
                except Exception:
                    pass
            findings = intel_data.get(target, {"history": [], "findings": {}})
            return {"content": [{"type": "text", "text": json.dumps({"target": target, "intel": findings}, indent=2)}]}, None

        if tool_name == "hexstrike_generate_report":
            target = sanitize_target(str(args.get("target", "")))
            ts = datetime.now(timezone.utc).isoformat()
            report_md = (
                f"# NullAI HexStrike Security Audit Report: {target}\n"
                f"**Classification:** LOCAL ENCLAVE ASSESSMENT\n"
                f"**Timestamp (UTC):** {ts}\n\n"
                f"## Assessment Scope\n"
                f"Target `{target}` prepared for authorized reconnaissance, header inspection, and defensive review.\n\n"
                f"## Recommended Scoped Commands\n"
                f"- **Service Discovery:** `{get_tool_command('nmap', target)}`\n"
                f"- **Directory Enumeration:** `{get_tool_command('gobuster', target)}`\n"
                f"- **Web Server Check:** `{get_tool_command('nikto', target)}`\n"
                f"- **Injection Verification:** `{get_tool_command('sqlmap', target)}`\n\n"
                f"## Local Execution Policy\n"
                f"Zero cloud telemetry collected. All generated reports stay on local disk.\n"
            )
            return {"content": [{"type": "text", "text": report_md}]}, None

        if tool_name == "hexstrike_audit_headers":
            res = audit_http_headers(url=args.get("url"), raw_headers=args.get("raw_headers"))
            return {"content": [{"type": "text", "text": json.dumps(res, indent=2)}]}, None

        if tool_name == "hexstrike_shannon_entropy":
            res = compute_shannon_entropy(
                data=args.get("data"),
                file_path=args.get("file_path"),
                is_hex=bool(args.get("is_hex", False)),
            )
            return {"content": [{"type": "text", "text": json.dumps(res, indent=2)}]}, None

        if tool_name == "hexstrike_audit_repo":
            res = audit_local_repo(str(args.get("path", "")))
            return {"content": [{"type": "text", "text": json.dumps(res, indent=2)}]}, None

        return None, {"code": -32601, "message": f"Method not found: {tool_name}"}
    except (ValueError, FileNotFoundError, RuntimeError) as exc:
        return None, {"code": -32602, "message": str(exc)}


def run_mcp_server() -> int:
    """Run JSON-RPC 2.0 stdio server loop for Model Context Protocol."""
    tools_list = mcp_tool_definitions()
    catalog = load_tools_catalog()

    def send_response(req_id: Any, result: Any = None, error: dict[str, Any] | None = None) -> None:
        payload: dict[str, Any] = {"jsonrpc": "2.0", "id": req_id}
        if error:
            payload["error"] = error
        else:
            payload["result"] = result
        sys.stdout.write(json.dumps(payload) + "\n")
        sys.stdout.flush()

    for line in sys.stdin:
        raw = line.strip()
        if not raw:
            continue

        try:
            req = json.loads(raw)
        except json.JSONDecodeError:
            send_response(None, None, {"code": -32700, "message": "Parse error"})
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params", {}) or {}

        if method == "initialize":
            send_response(
                req_id,
                {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {
                        "name": "hexstrike-terminal",
                        "version": VERSION,
                    },
                },
            )
            continue

        if method == "notifications/initialized":
            continue

        if method == "ping":
            send_response(req_id, {})
            continue

        if method == "tools/list":
            send_response(req_id, {"tools": tools_list})
            continue

        if method == "tools/call":
            tool_name = str(params.get("name", ""))
            args = params.get("arguments", {}) or {}
            result, err = handle_mcp_tool_call(tool_name, args, catalog=catalog)
            send_response(req_id, result, err)
            continue

        send_response(req_id, None, {"code": -32601, "message": f"Method not found: {method}"})

    return 0


if __name__ == "__main__":
    sys.exit(run_mcp_server())
