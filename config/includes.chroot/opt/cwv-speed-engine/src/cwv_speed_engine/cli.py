#!/usr/bin/env python3
"""
Command Line Interface (CLI) for cwv-speed-engine.

Subcommands:
  audit     - Run CWV & performance audit on a live URL or local HTML file.
  optimize  - Optimize HTML asset loading, image dimensions, font preconnects.
  cache     - Generate immutable caching headers (Netlify, Vercel, Nginx, Next.js, Cloudflare, Apache).
  pwa       - Generate W3C webmanifest and Service Worker bundle.
  og        - Generate OpenGraph & Twitter Card meta tags and previews.
  diff      - Compare before/after performance audits.
  check     - CI/CD quality gate check.
  mcp       - Run stdio MCP server or export client configurations.
  serve     - Start CWV Speed Studio Web UI.
  platform  - Inspect multi-OS runtime diagnostics.
  test      - Run internal engine verification test suite.
"""

from __future__ import annotations

import argparse
import http.server
import json
import os
import socketserver
import sys
import threading
import time
import unittest
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

from cwv_speed_engine.mcp_server import (
    SERVER_NAME,
    SERVER_VERSION,
    MCPServer,
    audit_html_content,
    audit_target,
    diff_performance,
    generate_cache_config,
    generate_mcp_client_config,
    generate_og_card,
    generate_pwa,
    get_platform_diagnostics,
    optimize_html,
    run_mcp_server,
)

# ---------------------------------------------------------------------------
# ANSI Color & Terminal Helpers
# ---------------------------------------------------------------------------

class TermColor:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    BG_GREEN = "\033[42m\033[30m"
    BG_YELLOW = "\033[43m\033[30m"
    BG_RED = "\033[41m\033[37m"


def is_color_enabled() -> bool:
    """Check if ANSI color output is enabled."""
    if os.environ.get("NO_COLOR") is not None:
        return False
    if os.environ.get("TERM") == "dumb":
        return False
    return sys.stdout.isatty()


def colorize(text: str, color_code: str, force_color: bool = False) -> str:
    """Apply terminal color if supported."""
    if force_color or is_color_enabled():
        return f"{color_code}{text}{TermColor.RESET}"
    return text


def score_badge(score: int, grade: str) -> str:
    """Format colored score badge."""
    text = f" {score}/100 [{grade}] "
    if score >= 90:
        return colorize(text, TermColor.BG_GREEN + TermColor.BOLD)
    elif score >= 50:
        return colorize(text, TermColor.BG_YELLOW + TermColor.BOLD)
    else:
        return colorize(text, TermColor.BG_RED + TermColor.BOLD)


def metric_badge(rating: str) -> str:
    """Format status badge for vital metric."""
    if rating == "good":
        return colorize("● PASS", TermColor.GREEN + TermColor.BOLD)
    elif rating == "needs-improvement":
        return colorize("▲ FAIR", TermColor.YELLOW + TermColor.BOLD)
    else:
        return colorize("■ POOR", TermColor.RED + TermColor.BOLD)


# ---------------------------------------------------------------------------
# CLI Command Implementations
# ---------------------------------------------------------------------------

def cmd_audit(args: argparse.Namespace) -> int:
    """Execute performance audit command."""
    target = args.target
    device = getattr(args, "device", "mobile") or "mobile"
    min_score = float(getattr(args, "min_score", 85.0) or 85.0)
    json_mode = getattr(args, "json", False)

    result = audit_target(target=target, min_score=min_score, device=device, allow_local_file=True)
    res_dict = result.to_dict()

    if json_mode:
        print(json.dumps(res_dict, indent=2))
        return 0 if result.passed else 1

    # Terminal UI output
    print("")
    print(colorize("┌" + "─" * 70 + "┐", TermColor.CYAN))
    print(colorize("│", TermColor.CYAN) + colorize("  ⚡ CORE WEB VITALS SPEED AUDIT", TermColor.BOLD + TermColor.WHITE).ljust(77) + colorize("│", TermColor.CYAN))
    print(colorize("└" + "─" * 70 + "┘", TermColor.CYAN))

    print(f"\n  {colorize('Target:', TermColor.DIM)}  {colorize(target, TermColor.BOLD)}")
    print(f"  {colorize('Device:', TermColor.DIM)}  {device.capitalize()}")
    print(f"  {colorize('Score:', TermColor.DIM)}   {score_badge(result.score, result.grade)}")

    # Core Web Vitals Table
    print(f"\n  {colorize('CORE WEB VITALS METRICS:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"  {'Metric':<32} {'Value':<12} {'Status':<18} {'Threshold'}")
    print("  " + "─" * 68)

    vitals = result.vitals
    for key in ["lcp", "cls", "inp", "fcp", "ttfb", "tbt"]:
        if key in vitals:
            v = vitals[key]
            val_str = f"{v['value']} {v['unit']}"
            thresh_str = f"<= {v['threshold_good']}{v['unit']}"
            print(f"  {v['name']:<32} {val_str:<12} {metric_badge(v['rating']):<27} {thresh_str}")

    # Diagnostics
    print(f"\n  {colorize('OPPORTUNITIES & DIAGNOSTICS:', TermColor.BOLD + TermColor.CYAN)}")
    if not result.diagnostics:
        print(colorize("  ✔ No critical performance issues found.", TermColor.GREEN))
    else:
        for diag in result.diagnostics:
            sev = diag.get("severity", "INFO")
            if sev == "CRITICAL":
                badge = colorize("[CRITICAL]", TermColor.RED + TermColor.BOLD)
            elif sev == "WARNING":
                badge = colorize("[WARNING]", TermColor.YELLOW + TermColor.BOLD)
            elif sev == "GOOD":
                badge = colorize("[PASSED]", TermColor.GREEN + TermColor.BOLD)
            else:
                badge = colorize("[INFO]", TermColor.BLUE)

            print(f"\n  {badge} {colorize(diag.get('title', ''), TermColor.BOLD)}")
            print(f"    {diag.get('description', '')}")
            if diag.get("recommendation"):
                print(f"    {colorize('Fix:', TermColor.GREEN)} {diag.get('recommendation')}")
            if diag.get("savings"):
                print(f"    {colorize('Savings:', TermColor.CYAN)} {diag.get('savings')}")
            if diag.get("affected_elements"):
                print(f"    {colorize('Elements:', TermColor.DIM)} {', '.join(diag.get('affected_elements')[:3])}")

    # Quality Gate Summary
    print("\n  " + "─" * 68)
    if result.passed:
        gate_msg = colorize(f"✔ QUALITY GATE PASSED (Score {result.score} >= {min_score})", TermColor.GREEN + TermColor.BOLD)
    else:
        gate_msg = colorize(f"✖ QUALITY GATE FAILED (Score {result.score} < {min_score})", TermColor.RED + TermColor.BOLD)
    print(f"  {gate_msg}\n")

    if getattr(args, "output", None):
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(res_dict, f, indent=2)
        print(f"  Saved audit report to: {args.output}")

    return 0 if result.passed else 1


def cmd_optimize(args: argparse.Namespace) -> int:
    """Execute HTML optimization command."""
    input_file = args.file
    output_file = getattr(args, "output", None)
    inline_css = getattr(args, "inline", False)
    json_mode = getattr(args, "json", False)

    if not os.path.exists(input_file):
        print(colorize(f"Error: file not found at '{input_file}'", TermColor.RED), file=sys.stderr)
        return 1

    with open(input_file, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    result = optimize_html(
        html_content=content,
        inline_critical_css=inline_css,
        preconnect_fonts=True,
        lazy_load_images=True,
        defer_scripts=True,
    )

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(result["optimized_html"])

    if json_mode:
        output_data = {
            "input_file": input_file,
            "output_file": output_file,
            "actions_taken": result["actions_taken"],
            "actions_count": result["actions_count"],
            "estimated_lcp_reduction_ms": result["estimated_lcp_reduction_ms"],
            "estimated_cls_reduction": result["estimated_cls_reduction"],
        }
        print(json.dumps(output_data, indent=2))
        return 0

    print(colorize(f"\n⚡ Optimized '{input_file}':", TermColor.BOLD + TermColor.GREEN))
    for action in result["actions_taken"]:
        print(f"  ✔ {action}")

    print(f"\n  {colorize('Estimated LCP savings:', TermColor.DIM)} ~{result['estimated_lcp_reduction_ms']}ms")
    print(f"  {colorize('Estimated CLS reduction:', TermColor.DIM)} ~{result['estimated_cls_reduction']}")

    if output_file:
        print(f"  {colorize('Output saved to:', TermColor.BOLD)} {output_file}\n")
    else:
        print(colorize("\n--- Optimized HTML Preview (First 40 lines) ---", TermColor.DIM))
        lines = result["optimized_html"].splitlines()[:40]
        print("\n".join(lines))
        if len(result["optimized_html"].splitlines()) > 40:
            print(colorize(f"... ({len(result['optimized_html'].splitlines()) - 40} more lines. Use --output <file> to save)", TermColor.DIM))

    return 0


def cmd_cache(args: argparse.Namespace) -> int:
    """Execute cache config generation command."""
    fw = getattr(args, "framework", "netlify") or "netlify"
    output_dir = getattr(args, "output_dir", None)
    days = int(getattr(args, "days", 365) or 365)
    json_mode = getattr(args, "json", False)

    try:
        config = generate_cache_config(framework=fw, static_asset_ttl_days=days)
    except Exception as e:
        print(colorize(f"Error: {e}", TermColor.RED), file=sys.stderr)
        return 1

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        target_path = os.path.join(output_dir, config["target_filename"])
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(config["config_content"])
        config["written_to"] = target_path

    if json_mode:
        print(json.dumps(config, indent=2))
        return 0

    print(colorize(f"\n⚡ Generated Cache Configuration for '{fw.upper()}':", TermColor.BOLD + TermColor.CYAN))
    print(f"  Target file: {colorize(config['target_filename'], TermColor.BOLD)}")
    print(f"  {config['instructions']}\n")
    print(colorize("--- Content ---", TermColor.DIM))
    print(config["config_content"])

    if output_dir:
        print(colorize(f"✔ File written to: {config['written_to']}\n", TermColor.GREEN))

    return 0


def cmd_pwa(args: argparse.Namespace) -> int:
    """Execute PWA generator command."""
    name = getattr(args, "name", "Speed App") or "Speed App"
    theme_color = getattr(args, "theme_color", "#1a73e8") or "#1a73e8"
    output_dir = getattr(args, "output_dir", None)
    json_mode = getattr(args, "json", False)

    bundle = generate_pwa(name=name, theme_color=theme_color)

    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        manifest_path = os.path.join(output_dir, "manifest.json")
        sw_path = os.path.join(output_dir, "sw.js")
        head_path = os.path.join(output_dir, "pwa_head.html")

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(bundle["manifest_json"])
        with open(sw_path, "w", encoding="utf-8") as f:
            f.write(bundle["sw_js"])
        with open(head_path, "w", encoding="utf-8") as f:
            f.write(bundle["head_snippet"])

        bundle["written_to"] = output_dir

    if json_mode:
        print(json.dumps(bundle, indent=2))
        return 0

    print(colorize(f"\n⚡ Generated Progressive Web App Bundle for '{name}':", TermColor.BOLD + TermColor.GREEN))
    print(f"  - manifest.json (W3C Web App Manifest)")
    print(f"  - sw.js (Offline & Stale-While-Revalidate Service Worker)")
    print(f"  - pwa_head.html (Meta tags & Registration Script)\n")

    if output_dir:
        print(colorize(f"✔ Files written to: {output_dir}\n", TermColor.GREEN))
    else:
        print(colorize("--- Manifest JSON ---", TermColor.DIM))
        print(bundle["manifest_json"])
        print(colorize("\n--- Head Snippet ---", TermColor.DIM))
        print(bundle["head_snippet"])

    return 0


def cmd_og(args: argparse.Namespace) -> int:
    """Execute OpenGraph and Twitter Card generation command."""
    title = getattr(args, "title", "High-Performance Web Application") or "High-Performance Web Application"
    desc = getattr(args, "desc", "Ultra-fast website audited and optimized for Core Web Vitals.") or "Ultra-fast website audited and optimized for Core Web Vitals."
    url = getattr(args, "url", None)
    image = getattr(args, "image", None)
    output_file = getattr(args, "output", None)
    json_mode = getattr(args, "json", False)

    card = generate_og_card(title=title, description=desc, url=url, image=image)

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(card["complete_snippet"])

    if json_mode:
        print(json.dumps(card, indent=2))
        return 0

    print(colorize(f"\n⚡ Generated OpenGraph & Twitter Card Meta Tags:", TermColor.BOLD + TermColor.CYAN))
    print(card["meta_tags_html"])
    print(colorize("\n--- Schema.org JSON-LD ---", TermColor.DIM))
    print(card["json_ld_script"])

    if output_file:
        print(colorize(f"\n✔ Snippet saved to: {output_file}\n", TermColor.GREEN))

    return 0


def cmd_diff(args: argparse.Namespace) -> int:
    """Execute performance diff command."""
    target_a = args.target_a
    target_b = args.target_b
    json_mode = getattr(args, "json", False)

    diff_res = diff_performance(target_a, target_b)

    if json_mode:
        print(json.dumps(diff_res, indent=2))
        return 0

    print("")
    print(colorize("┌" + "─" * 70 + "┐", TermColor.CYAN))
    print(colorize("│", TermColor.CYAN) + colorize("  ⚡ PERFORMANCE AUDIT COMPARISON (DIFF)", TermColor.BOLD + TermColor.WHITE).ljust(77) + colorize("│", TermColor.CYAN))
    print(colorize("└" + "─" * 70 + "┘", TermColor.CYAN))

    print(f"\n  {colorize('Baseline (A):', TermColor.DIM)}  {target_a}")
    print(f"  {colorize('Candidate (B):', TermColor.DIM)} {target_b}")

    score_delta = diff_res["score_delta"]
    delta_str = f"+{score_delta}" if score_delta > 0 else str(score_delta)
    delta_color = TermColor.GREEN if score_delta > 0 else (TermColor.RED if score_delta < 0 else TermColor.WHITE)

    print(f"\n  {colorize('Overall Score:', TermColor.BOLD)} {diff_res['score_before']} -> {diff_res['score_after']} ({colorize(delta_str + ' pts', delta_color + TermColor.BOLD)})")
    print(f"  {colorize('Verdict:', TermColor.BOLD)}       {colorize(diff_res['verdict'], delta_color)}")

    print(f"\n  {colorize('METRIC COMPARISON:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"  {'Metric':<25} {'Baseline':<12} {'Candidate':<12} {'Delta':<12} {'Status'}")
    print("  " + "─" * 68)

    for m_name, m_data in diff_res["metric_deltas"].items():
        before_str = f"{m_data['before']} {m_data['unit']}"
        after_str = f"{m_data['after']} {m_data['unit']}"
        d_val = m_data["delta"]
        d_str = f"{'+' if d_val > 0 else ''}{d_val} {m_data['unit']}"
        status = colorize("✔ IMPROVED", TermColor.GREEN) if m_data["improved"] else (colorize("✖ REGRESSED", TermColor.RED) if d_val > 0 else colorize("● UNCHANGED", TermColor.DIM))
        print(f"  {m_name.upper():<25} {before_str:<12} {after_str:<12} {d_str:<12} {status}")

    if diff_res["improvements"]:
        print(f"\n  {colorize('Improvements:', TermColor.GREEN + TermColor.BOLD)}")
        for imp in diff_res["improvements"]:
            print(f"    ✔ {imp}")

    if diff_res["regressions"]:
        print(f"\n  {colorize('Regressions:', TermColor.RED + TermColor.BOLD)}")
        for reg in diff_res["regressions"]:
            print(f"    ✖ {reg}")

    print("")
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    """Execute CI/CD quality gate check."""
    target = args.target
    min_score = float(getattr(args, "min_score", 85.0) or 85.0)
    json_mode = getattr(args, "json", False)

    result = audit_target(target=target, min_score=min_score, allow_local_file=True)
    res_dict = result.to_dict()

    if json_mode:
        print(json.dumps(res_dict, indent=2))
    else:
        status_str = colorize("PASSED", TermColor.GREEN + TermColor.BOLD) if result.passed else colorize("FAILED", TermColor.RED + TermColor.BOLD)
        print(f"CWV Quality Gate: {status_str} - Target: '{target}', Score: {result.score}/100, Min Score: {min_score}")

    return 0 if result.passed else 1


def cmd_mcp(args: argparse.Namespace) -> int:
    """Run MCP server or export MCP configurations."""
    tools_mode = getattr(args, "tools", False)
    config_client = getattr(args, "config", None)
    output_file = getattr(args, "output", None)

    server = MCPServer()

    if tools_mode:
        print(colorize("\n⚡ Registered CWV Speed Engine MCP Tools:\n", TermColor.BOLD + TermColor.CYAN))
        for t in server.tools.values():
            print(f"  {colorize(t.name, TermColor.BOLD + TermColor.GREEN)}")
            print(f"    {t.description}")
            print(f"    {colorize('Required Params:', TermColor.DIM)} {t.input_schema.get('required', [])}\n")
        return 0

    if config_client:
        if config_client.lower() == "all":
            all_configs = {
                client: generate_mcp_client_config(client)
                for client in ["claude", "cursor", "cline", "zed", "generic"]
            }
            output_json = json.dumps(all_configs, indent=2)
        else:
            client_conf = generate_mcp_client_config(config_client)
            output_json = json.dumps(client_conf, indent=2)

        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(output_json)
            print(colorize(f"✔ Saved MCP client config for '{config_client}' to: {output_file}", TermColor.GREEN))
        else:
            print(output_json)
        return 0

    # Default: Run stdio MCP server
    server.run_stdio()
    return 0


def cmd_platform(args: argparse.Namespace) -> int:
    """Inspect multi-OS runtime diagnostics."""
    json_mode = getattr(args, "json", False)
    diag = get_platform_diagnostics()

    if json_mode:
        print(json.dumps(diag, indent=2))
        return 0

    print("")
    print(colorize("┌" + "─" * 70 + "┐", TermColor.CYAN))
    print(colorize("│", TermColor.CYAN) + colorize("  ⚡ MULTI-OS PLATFORM DIAGNOSTICS", TermColor.BOLD + TermColor.WHITE).ljust(77) + colorize("│", TermColor.CYAN))
    print(colorize("└" + "─" * 70 + "┘", TermColor.CYAN))

    sys_info = diag["system"]
    py_info = diag["python"]
    paths = diag["paths"]

    print(f"\n  {colorize('Operating System:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"    OS:            {sys_info['os']} ({sys_info['machine']})")
    print(f"    Release:       {sys_info['release']}")
    print(f"    Version:       {sys_info['version']}")

    print(f"\n  {colorize('Python Runtime:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"    Version:       {py_info['version']} ({py_info['implementation']})")
    print(f"    Executable:    {py_info['executable']}")
    print(f"    Prefix:        {py_info['prefix']}")

    print(f"\n  {colorize('Cross-Platform Path Config:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"    Directory Sep: {repr(paths['sep'])}")
    print(f"    Path Sep:      {repr(paths['pathsep'])}")
    print(f"    Line Sep:      {paths['linesep']}")
    print(f"    Working Dir:   {paths['cwd']}")

    print(f"\n  {colorize('Standard Library Health Checks:', TermColor.BOLD + TermColor.CYAN)}")
    for mod, status in diag["stdlib_health"].items():
        stat_badge = colorize("✔ OK", TermColor.GREEN) if status else colorize("✖ FAIL", TermColor.RED)
        print(f"    {mod:<20} {stat_badge}")

    print(f"\n  {colorize('Engine Details:', TermColor.BOLD + TermColor.CYAN)}")
    print(f"    Engine Name:   {diag['engine']['name']}")
    print(f"    Engine Ver:    {diag['engine']['version']}")
    print(f"    MCP Protocol:  {diag['engine']['mcp_protocol']}\n")

    return 0


def cmd_speculation(args: argparse.Namespace) -> int:
    """Execute speculation rules and instant navigation generation."""
    from .speculation_engine import generate_speculation_plan, inject_speculation_rules_into_html
    target = args.target
    if "\n" not in target and len(target) < 260:
        try:
            target_path = Path(target)
            if target_path.is_file():
                content = target_path.read_text(encoding="utf-8")
            else:
                content = target
        except OSError:
            content = target
    else:
        content = target

    base_url = getattr(args, "base_url", "https://example.com") or "https://example.com"
    aggressiveness = getattr(args, "aggressiveness", "balanced") or "balanced"
    fmt = getattr(args, "format", "summary") or "summary"
    inject_path_str = getattr(args, "inject", None)

    plan = generate_speculation_plan(content, base_url=base_url, aggressiveness=aggressiveness)
    p_dict = plan.to_dict()

    if inject_path_str:
        inj_path = Path(inject_path_str)
        if inj_path.is_file():
            orig_html = inj_path.read_text(encoding="utf-8")
            updated = inject_speculation_rules_into_html(orig_html, plan.speculation_rules_script_tag)
            inj_path.write_text(updated, encoding="utf-8")
            print(f"✅ Injected Speculation Rules into: {inj_path}")

    if fmt == "json":
        print(json.dumps(p_dict, indent=2))
        return 0
    elif fmt == "script":
        print(plan.speculation_rules_script_tag)
        return 0
    elif fmt == "headers":
        for h in plan.early_hints_headers:
            print(f"Link: {h}")
        return 0

    # Summary
    print("")
    print(colorize("┌" + "─" * 70 + "┐", TermColor.CYAN))
    print(colorize("│", TermColor.CYAN) + colorize("  ⚡ W3C SPECULATION RULES & 103 EARLY HINTS ACCELERATOR", TermColor.BOLD + TermColor.WHITE).ljust(77) + colorize("│", TermColor.CYAN))
    print(colorize("└" + "─" * 70 + "┘", TermColor.CYAN))

    print(f"\n  {colorize('Prerender URLs:', TermColor.BOLD + TermColor.CYAN)} {len(plan.prerender_urls)}")
    for u in plan.prerender_urls:
        print(f"    • {colorize(u, TermColor.GREEN)} (Instant Navigation)")
    print(f"\n  {colorize('Prefetch URLs:', TermColor.BOLD + TermColor.CYAN)} {len(plan.prefetch_urls)}")
    for u in plan.prefetch_urls[:6]:
        print(f"    • {u} (Network Cached)")
    print(f"\n  {colorize('Excluded Side-Effect URLs:', TermColor.BOLD + TermColor.YELLOW)} {len(plan.excluded_urls)}")
    for u in plan.excluded_urls[:4]:
        print(f"    • {colorize(u, TermColor.DIM)} (Guarded)")

    print(f"\n  {colorize('PREDICTIVE CORE WEB VITALS IMPACT:', TermColor.BOLD + TermColor.WHITE)}")
    print(f"  • Estimated TTFB: 650.0ms -> {colorize(str(plan.projected_new_ttfb_ms) + 'ms', TermColor.GREEN + TermColor.BOLD)} (-{plan.estimated_ttfb_saving_ms}ms)")
    print(f"  • Estimated LCP:  2200.0ms -> {colorize(str(plan.projected_new_lcp_ms) + 'ms', TermColor.GREEN + TermColor.BOLD)} (-{plan.estimated_lcp_saving_ms}ms)")
    print("\n" + "=" * 72 + "\n")
    return 0


def cmd_budget(args: argparse.Namespace) -> int:
    """Execute performance budget audit and multi-network simulation."""
    from .budget_simulator import (
        audit_performance_budget,
        render_ascii_budget_report,
    )
    target = args.target
    if "\n" not in target and len(target) < 4096:
        try:
            target_path = Path(target)
            if target_path.is_file():
                content = target_path.read_text(encoding="utf-8")
                target_name = target_path.name
            else:
                content = target
                target_name = target[:50]
        except OSError:
            content = target
            target_name = target[:50]
    else:
        content = target
        target_name = "Inline Markup"

    custom_budgets: Dict[str, float] = {}
    if getattr(args, "script_budget", None) is not None:
        custom_budgets["script"] = float(args.script_budget)
    if getattr(args, "css_budget", None) is not None:
        custom_budgets["stylesheet"] = float(args.css_budget)
    if getattr(args, "total_budget", None) is not None:
        custom_budgets["total"] = float(args.total_budget)

    report = audit_performance_budget(
        html_or_resources=content,
        custom_budgets=custom_budgets if custom_budgets else None,
        target_name=target_name,
    )

    if getattr(args, "json", False):
        print(json.dumps(report.to_dict(), indent=2))
        return 1 if (getattr(args, "fail_on_error", False) and not report.is_passing) else 0

    if getattr(args, "lighthouse", False):
        print(json.dumps(report.lighthouse_budget_json, indent=2))
        return 0

    print(render_ascii_budget_report(report))
    print()

    if getattr(args, "fail_on_error", False) and not report.is_passing:
        print(colorize("❌ CI Gate Failure: Resource weights exceed performance budget threshold.", TermColor.RED + TermColor.BOLD))
        return 1

    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """Start CWV Speed Studio Web UI."""
    port = int(getattr(args, "port", 8128) or 8128)
    host = getattr(args, "host", "127.0.0.1") or "127.0.0.1"
    open_browser = getattr(args, "open", False) or False

    from cwv_speed_engine.ui_server import start_ui_server
    try:
        start_ui_server(host=host, port=port, open_browser=open_browser, blocking=True)
    except Exception as e:
        print(colorize(f"Error starting Speed Studio on {host}:{port}: {e}", TermColor.RED), file=sys.stderr)
        return 1
    return 0


# ---------------------------------------------------------------------------
# Internal Self-Test Suite Runner
# ---------------------------------------------------------------------------

def run_internal_self_tests() -> int:
    """Run built-in engine verification test suite."""
    print(colorize("\n⚡ Running CWV Speed Engine Internal Verification Suite...\n", TermColor.BOLD + TermColor.CYAN))

    suite = unittest.TestSuite()

    class InternalEngineTests(unittest.TestCase):
        def test_audit_html_content(self) -> None:
            sample_html = """<!DOCTYPE html>
            <html>
            <head>
              <title>Test Page</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://example.com/app.js" defer></script>
            </head>
            <body>
              <img src="/img1.png" width="800" height="600" loading="lazy" alt="Test">
            </body>
            </html>"""
            res = audit_html_content(sample_html, target_name="test.html")
            self.assertGreaterEqual(res.score, 80)
            self.assertIn("lcp", res.vitals)
            self.assertIn("cls", res.vitals)

        def test_optimize_html(self) -> None:
            raw_html = """<html><head><script src="test.js"></script></head><body><img src="hero.jpg"><img src="pic2.jpg"></body></html>"""
            opt = optimize_html(raw_html)
            self.assertIn("loading=\"lazy\"", opt["optimized_html"])
            self.assertIn("defer", opt["optimized_html"])

        def test_cache_config(self) -> None:
            c_net = generate_cache_config("netlify")
            self.assertIn("netlify.toml", c_net["target_filename"])
            c_ver = generate_cache_config("vercel")
            self.assertIn("vercel.json", c_ver["target_filename"])

        def test_pwa_generator(self) -> None:
            pwa = generate_pwa("Fast App")
            self.assertIn("Fast App", pwa["manifest_json"])
            self.assertIn("CACHE_NAME", pwa["sw_js"])

        def test_og_generator(self) -> None:
            og = generate_og_card("Super Title", "Super Description")
            self.assertIn("og:title", og["meta_tags_html"])
            self.assertIn("twitter:card", og["meta_tags_html"])

        def test_mcp_server_dispatch(self) -> None:
            srv = MCPServer()
            init_resp = srv.handle_request({"jsonrpc": "2.0", "id": 1, "method": "initialize"})
            self.assertEqual(init_resp["result"]["serverInfo"]["name"], "cwv-speed-engine")
            tools_resp = srv.handle_request({"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
            self.assertGreaterEqual(len(tools_resp["result"]["tools"]), 6)

        def test_platform_diagnostics(self) -> None:
            diag = get_platform_diagnostics()
            self.assertIn("system", diag)
            self.assertIn("python", diag)

    loader = unittest.TestLoader()
    suite.addTests(loader.loadTestsFromTestCase(InternalEngineTests))
    runner = unittest.TextTestRunner(verbosity=2)
    test_result = runner.run(suite)

    if test_result.wasSuccessful():
        print(colorize("\n✔ All internal engine verification checks PASSED.\n", TermColor.BOLD + TermColor.GREEN))
        return 0
    else:
        print(colorize("\n✖ Engine verification checks FAILED.\n", TermColor.BOLD + TermColor.RED))
        return 1


# ---------------------------------------------------------------------------
# Main CLI Parser & Dispatcher
# ---------------------------------------------------------------------------

def build_cli_parser() -> argparse.ArgumentParser:
    """Construct the command line parser."""
    # Common parent parser for flags shared across top-level and subparsers
    common_parent = argparse.ArgumentParser(add_help=False)
    common_parent.add_argument(
        "--no-color",
        action="store_true",
        help="Disable ANSI color codes in output.",
    )

    parser = argparse.ArgumentParser(
        prog="cwv-engine",
        parents=[common_parent],
        description=f"⚡ CWV Speed Engine v{SERVER_VERSION} — High-performance Core Web Vitals audit engine, optimizer, and MCP server.",
    )
    parser.add_argument(
        "-v", "--version",
        action="version",
        version=f"cwv-speed-engine {SERVER_VERSION}",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run internal engine verification test suite.",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Check local service status and configuration.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output status telemetry as JSON.",
    )

    subparsers = parser.add_subparsers(dest="subcommand", help="Subcommand to execute")

    # 1. audit
    p_audit = subparsers.add_parser("audit", parents=[common_parent], help="Run CWV performance audit on a URL or local HTML file")
    p_audit.add_argument("target", help="Live URL (https://...) or local HTML file path")
    p_audit.add_argument("--min-score", type=float, default=85.0, help="Minimum score quality gate (default: 85)")
    p_audit.add_argument("--device", choices=["mobile", "desktop"], default="mobile", help="Device emulation mode")
    p_audit.add_argument("--json", action="store_true", help="Output audit report as JSON")
    p_audit.add_argument("--output", "-o", help="Save JSON audit output to file")

    # 2. optimize
    p_opt = subparsers.add_parser("optimize", parents=[common_parent], help="Transform and optimize HTML assets and loading strategies")
    p_opt.add_argument("file", help="HTML file to optimize")
    p_opt.add_argument("--output", "-o", help="Write optimized HTML to file")
    p_opt.add_argument("--inline", action="store_true", help="Inline critical CSS")
    p_opt.add_argument("--json", action="store_true", help="Output optimization stats as JSON")

    # 3. cache
    p_cache = subparsers.add_parser("cache", parents=[common_parent], help="Generate immutable caching headers and server configs")
    p_cache.add_argument(
        "--framework", "-f",
        choices=["netlify", "vercel", "nginx", "nextjs", "cloudflare", "apache"],
        default="netlify",
        help="Target hosting or server framework (default: netlify)",
    )
    p_cache.add_argument("--days", type=int, default=365, help="Cache TTL days for immutable assets (default: 365)")
    p_cache.add_argument("--output-dir", "-o", help="Directory to save generated configuration file")
    p_cache.add_argument("--json", action="store_true", help="Output cache config details as JSON")

    # 4. pwa
    p_pwa = subparsers.add_parser("pwa", parents=[common_parent], help="Generate W3C webmanifest and Service Worker sw.js bundle")
    p_pwa.add_argument("--name", "-n", default="Speed App", help="Progressive Web App name")
    p_pwa.add_argument("--theme-color", default="#1a73e8", help="Primary hex theme color")
    p_pwa.add_argument("--output-dir", "-o", help="Directory to write PWA bundle files")
    p_pwa.add_argument("--json", action="store_true", help="Output PWA bundle assets as JSON")

    # 5. og
    p_og = subparsers.add_parser("og", parents=[common_parent], help="Generate OpenGraph and Twitter Card meta tags and previews")
    p_og.add_argument("--title", "-t", default="High-Performance Web App", help="Page title")
    p_og.add_argument("--desc", "-d", default="Ultra-fast web experience optimized for Core Web Vitals.", help="Page description")
    p_og.add_argument("--image", "-i", help="Preview image URL")
    p_og.add_argument("--url", "-u", help="Canonical page URL")
    p_og.add_argument("--output", "-o", help="File to write meta tag snippet")
    p_og.add_argument("--json", action="store_true", help="Output OG card data as JSON")

    # 6. diff
    p_diff = subparsers.add_parser("diff", parents=[common_parent], help="Compare two performance audits with score delta and diagnostics")
    p_diff.add_argument("target_a", help="Baseline URL or file path")
    p_diff.add_argument("target_b", help="Candidate/Optimized URL or file path")
    p_diff.add_argument("--json", action="store_true", help="Output diff comparison as JSON")

    # 7. check
    p_check = subparsers.add_parser("check", parents=[common_parent], help="CI/CD quality gate check (exits non-zero on failure)")
    p_check.add_argument("target", help="URL or local file path to audit")
    p_check.add_argument("--min-score", type=float, default=85.0, help="Minimum score threshold (default: 85)")
    p_check.add_argument("--json", action="store_true", help="Output check result as JSON")

    # 8. mcp
    p_mcp = subparsers.add_parser("mcp", parents=[common_parent], help="Run stdio JSON-RPC MCP server or export client configurations")
    p_mcp.add_argument("--tools", action="store_true", help="List registered MCP tools and JSON schemas")
    p_mcp.add_argument(
        "--config", "-c",
        choices=["claude", "cursor", "cline", "zed", "generic", "all"],
        help="Export client configuration JSON",
    )
    p_mcp.add_argument("--output", "-o", help="File to write client configuration")

    # 9. serve
    p_serve = subparsers.add_parser("serve", parents=[common_parent], help="Start CWV Speed Studio Web UI")
    p_serve.add_argument("--port", "-p", type=int, default=8128, help="Server port (default: 8128)")
    p_serve.add_argument("--host", default="127.0.0.1", help="Server host address (default: 127.0.0.1)")

    # 10. platform
    p_plat = subparsers.add_parser("platform", parents=[common_parent], help="Inspect multi-OS runtime diagnostics and health")
    p_plat.add_argument("--json", action="store_true", help="Output platform diagnostics as JSON")

    # 11. speculation
    p_spec = subparsers.add_parser("speculation", parents=[common_parent], help="Generate W3C Speculation Rules for instant zero-latency prerendering & 103 Early Hints")
    p_spec.add_argument("target", type=str, help="HTML file path or raw HTML string or URL")
    p_spec.add_argument("--base-url", type=str, default="https://example.com", help="Base URL for resolving internal links (default: https://example.com)")
    p_spec.add_argument("--aggressiveness", choices=["conservative", "balanced", "aggressive"], default="balanced", help="Speculation aggressiveness (default: balanced)")
    p_spec.add_argument("--format", choices=["summary", "json", "script", "headers"], default="summary", help="Output format (default: summary)")
    p_spec.add_argument("--inject", type=str, help="Optional HTML file to inject <script type='speculationrules'> into")

    # 12. budget
    p_bud = subparsers.add_parser("budget", parents=[common_parent], help="Audit page assets against Core Web Vitals performance budgets and simulate network throttling")
    p_bud.add_argument("target", type=str, help="HTML file path or raw HTML string or URL")
    p_bud.add_argument("--script-budget", type=float, default=None, help="Custom script budget in KB (default: 170 KB)")
    p_bud.add_argument("--css-budget", type=float, default=None, help="Custom stylesheet budget in KB (default: 50 KB)")
    p_bud.add_argument("--total-budget", type=float, default=None, help="Custom total payload budget in KB (default: 500 KB)")
    p_bud.add_argument("--json", action="store_true", help="Output JSON audit report")
    p_bud.add_argument("--lighthouse", action="store_true", help="Output Lighthouse budget.json configuration")
    p_bud.add_argument("--fail-on-error", action="store_true", help="Exit with non-zero code if budget is exceeded (CI gate)")

    # 13. test
    subparsers.add_parser("test", parents=[common_parent], help="Run internal engine verification test suite")

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    """Main CLI entrypoint."""
    parser = build_cli_parser()
    args = parser.parse_args(argv)

    if args.no_color:
        os.environ["NO_COLOR"] = "1"

    if args.test or args.subcommand == "test":
        return run_internal_self_tests()

    if not args.subcommand and (getattr(args, "status", False) or getattr(args, "json", False)):
        info = {
            "service": "cwv-speed-engine",
            "version": SERVER_VERSION,
            "port": 8128,
            "local_url": "http://127.0.0.1:8128",
            "studio_url": "https://zoth.nullai.tech/tools/cwv-speed-engine",
            "status": "ready",
        }
        if getattr(args, "json", False):
            print(json.dumps(info, indent=2))
        else:
            print(f"cwv-speed-engine {SERVER_VERSION} | http://127.0.0.1:8128 | ready")
        return 0

    if not args.subcommand:
        parser.print_help()
        return 0

    dispatch_map = {
        "audit": cmd_audit,
        "optimize": cmd_optimize,
        "cache": cmd_cache,
        "pwa": cmd_pwa,
        "og": cmd_og,
        "diff": cmd_diff,
        "check": cmd_check,
        "mcp": cmd_mcp,
        "serve": cmd_serve,
        "platform": cmd_platform,
        "speculation": cmd_speculation,
        "budget": cmd_budget,
    }

    handler = dispatch_map.get(args.subcommand)
    if handler:
        return handler(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
