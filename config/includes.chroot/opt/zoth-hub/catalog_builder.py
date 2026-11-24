#!/usr/bin/env python3
"""
Zoth Hub Catalog Builder — Extracts all 85 tools from Zoth Studio v2's
toolsData.js and merges them with core ZothOS desktop utilities into a
self-contained, 6-category catalog.json for offline & live ZothOS sessions.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

HERE = Path(__file__).resolve().parent
DEFAULT_TOOLS_JS = Path("/home/zoth/NullAITech/zoth-studio-v2/src/data/toolsData.js")
DEFAULT_OUT = HERE / "catalog.json"

CATEGORIES: List[Dict[str, str]] = [
    {
        "id": "ai-agents",
        "name": "AI Agents & Swarms",
        "short": "AI & Swarms",
        "icon": "◈",
        "description": "Local LLMs, autonomous agent decks, memory substrates, MCP bridges, and collective inference.",
    },
    {
        "id": "security-privacy",
        "name": "Security & Privacy",
        "short": "Security",
        "icon": "⛨",
        "description": "OSINT recon, threat rules, sandboxes, secrets vaults, Tor privacy, and defensive auditing.",
    },
    {
        "id": "web-dev",
        "name": "Web & Dev Foundry",
        "short": "Web & Dev",
        "icon": "⌘",
        "description": "Full-stack AI builders, schema transpilers, AEO/SEO diagnostics, testing twins, and browser/terminal tools.",
    },
    {
        "id": "media-creative",
        "name": "Media, 3D & Creative",
        "short": "Media & 3D",
        "icon": "✦",
        "description": "WebGL 3D studios, Comfy Cloud renders, ASCII/Braille art, shader synthesis, and video/audio labs.",
    },
    {
        "id": "commerce-automation",
        "name": "Commerce & Automation",
        "short": "Commerce",
        "icon": "⇄",
        "description": "Etsy, Shopify, Printify & Gelato connectors, POD margin tools, cron planners, and social automation.",
    },
    {
        "id": "system-hardware",
        "name": "System & Hardware",
        "short": "System & OS",
        "icon": "⚙",
        "description": "ZothOS core utilities, hardware mirroring, telemetry decks, installer, workspaces, and themes.",
    },
]

CATEGORY_BY_ID = {c["id"]: c for c in CATEGORIES}

# Explicit per-tool overrides for crystal-clear placement
TOOL_CATEGORY_OVERRIDES: Dict[str, str] = {
    "zoth-os": "system-hardware",
    "zothos-lite": "system-hardware",
    "pixel-cast": "system-hardware",
    "aether-observatory": "system-hardware",
    "likeness-desk": "media-creative",
    "agent-voice-call": "ai-agents",
    "agent-flight-recorder": "security-privacy",
    "zoth-x-connector": "commerce-automation",
    "zoth-obsidian-tracker": "ai-agents",
    "zela-glasses-guide": "system-hardware",
    "zothnet": "security-privacy",
}

ORIGINAL_CATEGORY_MAP: Dict[str, str] = {
    "Swarm & Core": "ai-agents",
    "Memory & Brain": "ai-agents",
    "AI & Knowledge": "ai-agents",
    "Planning": "ai-agents",
    "Voice & Real-Time": "ai-agents",
    "Security & Recon": "security-privacy",
    "Security & OpSec": "security-privacy",
    "Security & Network": "security-privacy",
    "Security & Enclave": "security-privacy",
    "Forensics & Telemetry": "security-privacy",
    "Autonomous Web": "web-dev",
    "Simulation & Testing": "web-dev",
    "Accessibility & UI": "web-dev",
    "Growth & SEO": "web-dev",
    "Media & 3D": "media-creative",
    "Commerce & POD": "commerce-automation",
    "Commerce & MCP": "commerce-automation",
    "Automation": "commerce-automation",
    "Education & Growth": "commerce-automation",
    "Hardware & OS": "system-hardware",
    "System & Telemetry": "system-hardware",
}

# Known CLI binary aliases beyond tool id / repo
EXTRA_CLI_BINS: Dict[str, List[str]] = {
    "zoth-comfy-foundry": ["zoth-comfy", "zoth-comfy-foundry"],
    "neuro-memory-daemon": ["zoth-memory", "zoth-neuro-memory", "neuro-memory", "neuro-memory-daemon"],
    "zoth-civilization": ["zoth-civ", "zoth-civilization"],
    "producthunt-connector": ["zoth-ph", "zoth-producthunt", "producthunt-connector"],
    "agent-egress-sentinel": ["agent-egress", "zoth-egress-sentinel", "agent-egress-sentinel"],
    "agent-mock-twin": ["agent-mock", "zoth-mock-twin", "agent-mock-twin"],
    "agent-prompt-firewall": ["agent-firewall", "zoth-prompt-firewall", "agent-prompt-firewall"],
    "agent-flight-recorder": ["agent-flight", "zoth-flight-recorder", "agent-flight-recorder"],
    "agent-capsule-jail": ["agent-capsule", "zoth-capsule-jail", "agent-capsule-jail"],
    "agent-policy-auditor": ["agent-policy", "zoth-policy-auditor", "agent-policy-auditor"],
    "agent-budget-sentinel": ["agent-budget", "zoth-budget-sentinel", "agent-budget-sentinel"],
    "badge3d-coin-generator": ["badge3d", "badge3d-coin-generator"],
    "robots-txt-auditor": ["robots-txt", "robots-txt-auditor"],
    "osint-scout-skill": ["osint-scout", "osint-scout-skill"],
    "shodan-surface-sentinel": ["shodan-sentinel", "shodan-surface-sentinel"],
    "ghidra-mcp-bridge": ["ghidra-bridge", "ghidra-mcp-bridge"],
    "reality-shader-forge": ["reality-forge", "reality-shader-forge"],
    "zoth-bolt": ["zoth-bolt", "bolt.diy"],
    "zoth-webgen": ["zoth-webgen", "zoth-bolt"],
    "hexstrike-arsenal": ["hexstrike-arsenal", "hexstrike"],
    "etsy-pod-forge": ["etsy-pod-forge", "zoth-etsy-pod-forge"],
    "etsy-connector": ["etsy-connector", "zoth-etsy-connector"],
    "mcp-lens": ["mcp-lens", "zoth-mcp-lens"],
}

# Core ZothOS desktop applications (not in toolsData.js)
CORE_DESKTOP_APPS: List[Dict[str, Any]] = [
    {
        "id": "zoth-studio-v2",
        "name": "Zoth Studio v2",
        "category_id": "ai-agents",
        "original_category": "ZothOS Core",
        "description": "Local Zoth Studio v2 sovereign web console unifying tool routes, documentation, and local endpoints on :3000.",
        "version": "3.4.0",
        "execution_type": "local_daemon",
        "cli_bins": ["zoth-studio"],
        "local_port": 3000,
        "local_url": "http://127.0.0.1:3000",
        "live_url": "https://zoth.nullai.tech",
        "studio_url": "https://zoth.nullai.tech",
        "github": "https://github.com/NullAITech/zoth-studio-v2",
        "pull": "zoth-studio",
        "core_app": True,
        "desktop_exec": "zoth-studio",
    },
    {
        "id": "hermes-agent-cli",
        "name": "Hermes Agent CLI",
        "category_id": "ai-agents",
        "original_category": "ZothOS Core",
        "description": "Nous Research autonomous terminal agent with tool calling, persistent skills, and local/cloud model routing.",
        "version": "3.4.0",
        "execution_type": "local_cli",
        "cli_bins": ["hermes"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/NousResearch/hermes-agent",
        "pull": "hermes",
        "core_app": True,
        "desktop_exec": "hermes",
    },
    {
        "id": "ollama-local-llm",
        "name": "Ollama Local LLM Server",
        "category_id": "ai-agents",
        "original_category": "ZothOS Core",
        "description": "Local loopback LLM inference engine bound to 127.0.0.1:11434 for offline zero-telemetry model execution.",
        "version": "local",
        "execution_type": "local_daemon",
        "cli_bins": ["ollama"],
        "local_port": 11434,
        "local_url": "http://127.0.0.1:11434",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/ollama/ollama",
        "pull": "ollama list",
        "core_app": True,
        "desktop_exec": "ollama",
    },
    {
        "id": "zoth-ghost-privacy",
        "name": "NullAI GhostMode",
        "category_id": "security-privacy",
        "original_category": "ZothOS Core",
        "description": "Transparent Tor routing, MAC randomization, amnesic RAM hygiene, and anti-forensics toggle.",
        "version": "3.4.0",
        "execution_type": "local_cli",
        "cli_bins": ["zoth-ghost"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "zoth-ghost --help",
        "core_app": True,
        "desktop_exec": "zoth-ghost",
    },
    {
        "id": "zoth-sec-arsenal",
        "name": "ZothOS Sec Arsenal",
        "category_id": "security-privacy",
        "original_category": "ZothOS Core",
        "description": "Interactive Kali & Parrot security auditing launcher for network, web, and binary assessment tools.",
        "version": "3.4.0",
        "execution_type": "local_cli",
        "cli_bins": ["zoth-sec"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "zoth-sec",
        "core_app": True,
        "desktop_exec": "zoth-sec",
    },
    {
        "id": "zoth-keepassxc",
        "name": "KeePassXC Password Vault",
        "category_id": "security-privacy",
        "original_category": "ZothOS Core",
        "description": "Offline AES-256 encrypted local password database and hardware-key credential manager.",
        "version": "system",
        "execution_type": "desktop_app",
        "cli_bins": ["keepassxc", "zoth-keepassxc"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/keepassxreboot/keepassxc",
        "pull": "keepassxc",
        "core_app": True,
        "desktop_exec": "keepassxc",
    },
    {
        "id": "zoth-browser",
        "name": "Zoth Browser (Chrome)",
        "category_id": "web-dev",
        "original_category": "ZothOS Core",
        "description": "Hardened Google Chrome web engine and DevTools workstation preconfigured for ZothOS.",
        "version": "system",
        "execution_type": "desktop_app",
        "cli_bins": ["zoth-chrome", "google-chrome", "chromium"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "zoth-chrome",
        "core_app": True,
        "desktop_exec": "zoth-chrome",
    },
    {
        "id": "zoth-terminal",
        "name": "Zoth Terminal (Konsole)",
        "category_id": "web-dev",
        "original_category": "ZothOS Core",
        "description": "KDE Plasma 6 Konsole sovereign shell with Zoth Gold profile, CLI wrappers, and tmux/zsh ergonomics.",
        "version": "system",
        "execution_type": "desktop_app",
        "cli_bins": ["konsole", "zoth-konsole"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "konsole",
        "core_app": True,
        "desktop_exec": "konsole",
    },
    {
        "id": "install-zothos",
        "name": "Install ZothOS 3.4.0",
        "category_id": "system-hardware",
        "original_category": "ZothOS Core",
        "description": "Calamares graphical system installer for writing ZothOS 3.4.0 from Live ISO to bare-metal or VM storage.",
        "version": "3.4.0",
        "execution_type": "desktop_app",
        "cli_bins": ["launch-calamares", "calamares"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "launch-calamares",
        "core_app": True,
        "desktop_exec": "launch-calamares",
    },
    {
        "id": "zoth-control-center",
        "name": "Zoth Control Center",
        "category_id": "system-hardware",
        "original_category": "ZothOS Core",
        "description": "System diagnostics, daemon controls, cursor/theme settings, and hardware overview for ZothOS.",
        "version": "3.4.0",
        "execution_type": "local_cli",
        "cli_bins": ["zoth-control-center", "zoth-mode"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "zoth-control-center",
        "core_app": True,
        "desktop_exec": "zoth-control-center",
    },
    {
        "id": "zoth-workspaces",
        "name": "Zoth Workspaces",
        "category_id": "system-hardware",
        "original_category": "ZothOS Core",
        "description": "Eight named KDE Plasma 6 virtual desktops with multi-monitor output layout management.",
        "version": "3.4.0",
        "execution_type": "local_cli",
        "cli_bins": ["zoth-workspaces"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://github.com/1nc0gn30/zoth-os",
        "pull": "zoth-workspaces --help",
        "core_app": True,
        "desktop_exec": "zoth-workspaces",
    },
    {
        "id": "kde-dolphin",
        "name": "Dolphin File Manager",
        "category_id": "system-hardware",
        "original_category": "ZothOS Core",
        "description": "KDE Plasma 6 native file manager with split views, tabs, and terminal panel.",
        "version": "system",
        "execution_type": "desktop_app",
        "cli_bins": ["dolphin"],
        "local_port": None,
        "local_url": "",
        "live_url": "",
        "studio_url": "",
        "github": "https://invent.kde.org/system/dolphin",
        "pull": "dolphin",
        "core_app": True,
        "desktop_exec": "dolphin",
    },
]


def _load_tools_via_node(tools_js_path: Path) -> List[Dict[str, Any]]:
    script = (
        "const fs = require('fs');\n"
        "const vm = require('vm');\n"
        "const src = fs.readFileSync(process.argv[1], 'utf8');\n"
        "const cleaned = src.replace(/export const microTools\\s*=/, 'const microTools =') + '\\nmodule.exports = microTools;';\n"
        "const mod = { exports: {} };\n"
        "vm.runInNewContext(cleaned, { module: mod, exports: mod.exports });\n"
        "process.stdout.write(JSON.stringify(mod.exports));\n"
    )
    res = subprocess.run(
        ["node", "-e", script, str(tools_js_path)],
        capture_output=True,
        text=True,
        check=True,
    )
    data = json.loads(res.stdout)
    if not isinstance(data, list):
        raise ValueError("toolsData.js did not evaluate to a list")
    return data


def _extract_cli_bins(tool: Dict[str, Any]) -> List[str]:
    tid = str(tool.get("id", "")).strip()
    repo = str(tool.get("repo", "")).strip()
    bins: List[str] = []
    for candidate in EXTRA_CLI_BINS.get(tid, []):
        if candidate and candidate not in bins:
            bins.append(candidate)
    for candidate in (tid, repo, str(tool.get("alias", "")).strip()):
        if candidate and re.fullmatch(r"[A-Za-z0-9._-]+", candidate) and candidate not in bins:
            bins.append(candidate)
    pull = str(tool.get("pull", ""))
    # Extract CLI hints like "# or: foo-bar --status"
    m = re.search(r"#\s*or:\s*([A-Za-z0-9._-]+)", pull)
    if m:
        cmd = m.group(1)
        if cmd not in ("git", "cd", "python3", "node", "sudo") and cmd not in bins:
            bins.append(cmd)
    return bins


def _map_category(tool: Dict[str, Any]) -> str:
    tid = str(tool.get("id", "")).strip()
    if tid in TOOL_CATEGORY_OVERRIDES:
        return TOOL_CATEGORY_OVERRIDES[tid]
    orig = str(tool.get("category", "")).strip()
    return ORIGINAL_CATEGORY_MAP.get(orig, "ai-agents")


def build_catalog(tools_js_path: Path = DEFAULT_TOOLS_JS) -> Dict[str, Any]:
    raw_tools = _load_tools_via_node(tools_js_path)
    items: List[Dict[str, Any]] = []
    seen_ids = set()

    for t in raw_tools:
        tid = str(t.get("id", "")).strip()
        if not tid or tid in seen_ids:
            continue
        seen_ids.add(tid)
        cat_id = _map_category(t)
        cat_meta = CATEGORY_BY_ID[cat_id]

        local_port = t.get("localPort")
        if isinstance(local_port, bool) or not isinstance(local_port, int):
            local_port = None
        local_url = str(t.get("localUrl") or "").strip()
        if not local_url and local_port:
            local_url = f"http://127.0.0.1:{local_port}"

        raw_live = t.get("liveUrl")
        live_url = str(raw_live).strip() if isinstance(raw_live, str) and raw_live.strip() else ""
        if live_url.startswith("/"):
            live_url = f"https://zoth.nullai.tech{live_url}"

        studio_url = f"https://zoth.nullai.tech/tools/{tid}"
        exec_type = str(t.get("executionType") or "local_cli").strip()

        items.append(
            {
                "id": tid,
                "name": str(t.get("name") or tid).strip(),
                "repo": str(t.get("repo") or tid).strip(),
                "category_id": cat_id,
                "category": cat_meta["name"],
                "original_category": str(t.get("category") or "Tools").strip(),
                "description": str(t.get("description") or "").strip(),
                "version": str(t.get("version") or "1.0.0").strip(),
                "execution_type": exec_type,
                "cli_bins": _extract_cli_bins(t),
                "local_port": local_port,
                "local_url": local_url,
                "live_url": live_url,
                "studio_url": studio_url,
                "github": str(t.get("github") or "").strip(),
                "pull": str(t.get("pull") or "").strip(),
                "published": bool(t.get("published", True)),
                "core_app": False,
                "desktop_exec": None,
            }
        )

    for core in CORE_DESKTOP_APPS:
        cid = core["id"]
        if cid in seen_ids:
            continue
        seen_ids.add(cid)
        cat_meta = CATEGORY_BY_ID[core["category_id"]]
        entry = dict(core)
        entry["category"] = cat_meta["name"]
        entry["published"] = True
        entry.setdefault("repo", cid)
        items.append(entry)

    # Sort: core apps first within each category, then alphabetical by name
    cat_order = {c["id"]: idx for idx, c in enumerate(CATEGORIES)}
    items.sort(key=lambda x: (cat_order.get(x["category_id"], 99), not x["core_app"], x["name"].lower()))

    return {
        "schema_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "studio_tools_count": len(raw_tools),
        "core_apps_count": len(items) - len(raw_tools),
        "total_count": len(items),
        "categories": CATEGORIES,
        "items": items,
    }


def main(argv: Optional[List[str]] = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Build self-contained Zoth Hub catalog.json")
    parser.add_argument("--source", type=Path, default=DEFAULT_TOOLS_JS, help="Path to toolsData.js")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output catalog.json path")
    args = parser.parse_args(argv)

    catalog = build_catalog(args.source)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"Wrote {args.out} ({catalog['total_count']} items: "
        f"{catalog['studio_tools_count']} Studio tools + {catalog['core_apps_count']} core apps "
        f"across {len(catalog['categories'])} categories)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
