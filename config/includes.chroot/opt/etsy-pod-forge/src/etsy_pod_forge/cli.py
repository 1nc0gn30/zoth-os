"""Command-Line Interface (CLI) for Etsy POD Forge (v2.6.0).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Commands:
  generate   Generate print-ready 300-DPI transparent PNG canvas
  mockup     Composite design onto realistic lifestyle product background
  listing    Synthesize complete Etsy SEO listing kit (title, 13 tags, copy, profits)
  prompts    Browse 53 curated AI image generation recipes
  serve      Launch hardened web workstation & REST API daemon (127.0.0.1:8107)
  status     Query live daemon health & local engine summary
  desktop    Open local workstation UI (or print workstation URL headlessly)
  mcp        Start zero-dependency JSON-RPC 2.0 stdio MCP server (6 POD tools)
  test       Execute automated pytest verification suite
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import subprocess
import sys
import urllib.request
from typing import List, Optional

from . import __version__
from .canvas_generator import CanvasConfig, CanvasGenerator
from .listing_synthesizer import CADRE_SPECS, synthesize_listing
from .mcp_server import MCP_TOOLS_DEFINITIONS, run_stdio_server
from .mockup_engine import MockupConfig, MockupEngine
from .prompt_vault import get_all_prompts, get_prompts_by_cadre, search_prompts
from .server import ForgeServer


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


C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"
C_GOLD = "\033[38;5;214m"
C_GOLD_BOLD = "\033[1;38;5;214m"
C_GREEN = "\033[38;5;48m"
C_GREEN_BOLD = "\033[1;38;5;48m"
C_CYAN = "\033[38;5;51m"
C_RED = "\033[38;5;196m"
C_GRAY = "\033[38;5;244m"


def print_banner() -> None:
    print(f"""
{C_GOLD_BOLD}╔══════════════════════════════════════════════════════════════════════════════╗
║                ETSY POD FORGE v{__version__} — PRINT-ON-DEMAND STUDIO                ║
║          Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform       ║
╚══════════════════════════════════════════════════════════════════════════════╝{C_RESET}""")


def _probe_status(port: int) -> dict:
    url = f"http://127.0.0.1:{port}/api/stats"
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=1.5) as resp:
            stats = json.loads(resp.read().decode("utf-8"))
        return {
            "tool": "etsy-pod-forge",
            "version": __version__,
            "online": True,
            "port": port,
            "url": f"http://127.0.0.1:{port}",
            "studio_route": "/tools/etsy-pod-forge",
            "cadres": len(CADRE_SPECS),
            "prompts": len(get_all_prompts()),
            "mcp_tools": len(MCP_TOOLS_DEFINITIONS),
            "stats": stats,
        }
    except Exception:
        return {
            "tool": "etsy-pod-forge",
            "version": __version__,
            "online": False,
            "port": port,
            "url": f"http://127.0.0.1:{port}",
            "studio_route": "/tools/etsy-pod-forge",
            "cadres": len(CADRE_SPECS),
            "prompts": len(get_all_prompts()),
            "mcp_tools": len(MCP_TOOLS_DEFINITIONS),
            "stats": None,
        }


def cmd_generate(args: argparse.Namespace) -> int:
    """Generate high-res or preview canvas."""
    if not getattr(args, "json", False):
        print_banner()
    cadre = args.cadre.lower()
    preview = args.preview
    out_file = args.out or f"{cadre}_canvas.png"

    names = [n.strip() for n in args.names.split(",")] if args.names else None
    cfg = CanvasConfig.default_for_cadre(cadre, preview=preview)
    if args.title:
        cfg.title_text = args.title
    if args.subtitle:
        cfg.subtitle_text = args.subtitle
    if names:
        cfg.custom_names = names

    gen = CanvasGenerator(cfg)
    img = gen.generate()
    img.save(out_file, dpi=(cfg.dpi, cfg.dpi), optimize=True)

    if getattr(args, "json", False):
        print(json.dumps({
            "ok": True,
            "cadre": cadre,
            "out": out_file,
            "width": img.width,
            "height": img.height,
            "dpi": cfg.dpi,
            "mode": img.mode,
            "preview": preview,
        }, indent=2))
        return 0

    print(f"{C_GREEN}✓ Canvas saved:{C_RESET} {out_file}")
    print(f"  Dimensions: {img.width}x{img.height} px @ {cfg.dpi} DPI ({img.mode})")
    return 0


def cmd_mockup(args: argparse.Namespace) -> int:
    """Composite design onto lifestyle mockup."""
    if not getattr(args, "json", False):
        print_banner()
    cadre = args.cadre.lower()
    out_file = args.out or f"{cadre}_mockup.jpg"

    mock_cfg = MockupConfig.default_for_cadre(cadre)
    if args.color:
        mock_cfg.product_color = args.color

    engine = MockupEngine(mock_cfg)
    mock_img = engine.composite()
    mock_img.save(out_file, quality=92, optimize=True)

    if getattr(args, "json", False):
        print(json.dumps({
            "ok": True,
            "cadre": cadre,
            "out": out_file,
            "width": mock_img.width,
            "height": mock_img.height,
            "colorway": mock_cfg.product_color,
        }, indent=2))
        return 0

    print(f"{C_GREEN}✓ Mockup saved:{C_RESET} {out_file}")
    print(f"  Dimensions: {mock_img.width}x{mock_img.height} px | Colorway: {mock_cfg.product_color}")
    return 0


def cmd_listing(args: argparse.Namespace) -> int:
    """Synthesize complete Etsy SEO listing kit."""
    cadre = args.cadre.lower()
    kit = synthesize_listing(
        cadre=cadre,
        custom_title_hook=args.title,
        custom_names=args.names,
        retail_price=args.retail,
        production_cost=args.cost,
        shipping_charged=getattr(args, "shipping_charged", 0.0) or 0.0,
        shipping_cost=getattr(args, "shipping_cost", 0.0) or 0.0,
        offsite_ads_rate=getattr(args, "offsite_ads_rate", 0.0) or 0.0,
    )

    if args.json:
        print(json.dumps(kit.to_dict(), indent=2))
        return 0

    print_banner()
    print(f"{C_BOLD}Product Cadre:{C_RESET}     {C_GOLD}{kit.product_type}{C_RESET}")
    print(f"{C_BOLD}Etsy Title:{C_RESET}        {C_CYAN}{kit.title}{C_RESET} ({len(kit.title)} chars <= 140)")
    print(f"\n{C_BOLD}13 Search Tags:{C_RESET}")
    for i, t in enumerate(kit.tags, 1):
        print(f"  {C_GRAY}{i:02d}.{C_RESET} {C_GREEN}{t}{C_RESET} ({len(t)} chars)")

    print(f"\n{C_BOLD}2026 Financial Economics:{C_RESET}")
    print(f"  Retail Price:       ${kit.profit.retail_price:.2f}")
    print(f"  Production Cost:    ${kit.profit.production_cost:.2f}")
    print(f"  Offsite Ads Tier:   {int(round(kit.profit.offsite_ads_rate * 100))}% (${kit.profit.etsy_offsite_ads_fee:.2f})")
    print(f"  Marketplace Fees:   ${kit.profit.total_fees:.2f}")
    print(f"  Break-Even Price:   ${kit.profit.break_even_price:.2f}")
    print(f"  {C_GREEN_BOLD}Net Profit / Sale:  ${kit.profit.net_profit:.2f} ({kit.profit.margin_percent:.1f}% Margin){C_RESET}")

    errs = kit.validate_invariants()
    if errs:
        print(f"\n{C_RED}✗ Invariant Errors:{C_RESET}")
        for e in errs:
            print(f"  - {e}")
        return 1
    print(f"\n{C_GREEN}✓ All Etsy SEO & Tag Invariants Satisfied (Score {kit.seo_score}/100).{C_RESET}")
    return 0


def cmd_prompts(args: argparse.Namespace) -> int:
    """Browse prompt vault recipes."""
    if args.search:
        prompts = search_prompts(args.search)
    elif args.cadre:
        prompts = get_prompts_by_cadre(args.cadre)
    else:
        prompts = get_all_prompts()

    if getattr(args, "json", False):
        print(json.dumps({
            "count": len(prompts[: args.limit]),
            "total_matched": len(prompts),
            "total_available": len(get_all_prompts()),
            "prompts": [p.to_dict() for p in prompts[: args.limit]],
        }, indent=2))
        return 0

    print_banner()
    print(f"{C_CYAN}Prompt Vault Catalog ({len(prompts)} matching / {len(get_all_prompts())} total):{C_RESET}\n")
    for p in prompts[: args.limit]:
        print(f"{C_GOLD_BOLD}[{p.id}] {p.title}{C_RESET} ({C_GRAY}{p.target_product}{C_RESET})")
        print(f"  {C_BOLD}Subject:{C_RESET} {p.subject}")
        print(f"  {C_BOLD}Style:{C_RESET}   {p.style}")
        print(f"  {C_BOLD}Ratio:{C_RESET}   --ar {p.aspect_ratio}  |  {C_BOLD}Model:{C_RESET} {p.model}\n")
    if len(prompts) > args.limit:
        print(f"{C_DIM}... and {len(prompts) - args.limit} more recipes available.{C_RESET}")
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """Start the hardened REST API and Dual-Theme Web Workstation."""
    print_banner()
    port = args.port
    host = args.host

    pkg_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    public_dir = os.path.join(pkg_root, "public")

    print(f"{C_GREEN}● Starting Etsy POD Forge v{__version__} on http://{host}:{port}{C_RESET}")
    print(f"  Web Workstation:    http://{host}:{port}/")
    print(f"  REST Cadres:        http://{host}:{port}/api/cadres")
    print(f"  MCP Tools Catalog:  http://{host}:{port}/api/mcp/tools")
    print(f"  Health Check:       http://{host}:{port}/health")
    print(f"{C_DIM}Press Ctrl+C to stop gracefully.{C_RESET}\n")

    server = ForgeServer(host=host, port=port, public_dir=public_dir)
    server.start(block=True)
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    """Query live server status and display health metrics."""
    info = _probe_status(args.port)
    if getattr(args, "json", False):
        print(json.dumps(info, indent=2))
        return 0

    print_banner()
    if info["online"]:
        stats = info["stats"] or {}
        print(f"{C_GREEN}● ONLINE{C_RESET} — etsy-pod-forge v{__version__} on 127.0.0.1:{args.port}")
        print(f"  Uptime:             {stats.get('uptime_seconds', 0)}s")
        print(f"  Canvases Rendered:  {stats.get('canvases_generated', 0)}")
        print(f"  Mockups Composited: {stats.get('mockups_generated', 0)}")
        print(f"  Listings Created:   {stats.get('listings_synthesized', 0)}")
        print(f"  Kits Exported:      {stats.get('kits_exported', 0)}")
        print(f"  Cadres / Prompts:   {info['cadres']} cadres · {info['prompts']} prompts · {info['mcp_tools']} MCP tools")
    else:
        print(f"{C_GOLD}● STANDBY (IDLE){C_RESET} — etsy-pod-forge v{__version__} is on-demand (port {args.port} idle)")
        print(f"  Local Engine Ready: {info['cadres']} cadres · {info['prompts']} prompts · {info['mcp_tools']} MCP tools")
        print(f"  Start Server:       etsy-pod-forge serve --port {args.port}")
    return 0


def cmd_desktop(args: argparse.Namespace) -> int:
    """Open desktop workstation URL or print status in headless sessions."""
    port = getattr(args, "port", 8107)
    url = f"http://127.0.0.1:{port}"
    has_display = bool(os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY"))
    if has_display and not getattr(args, "dry_run", False):
        try:
            subprocess.Popen(
                ["xdg-open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            print(f"Opened Etsy POD Forge workstation: {url}")
            return 0
        except OSError:
            pass
    print(f"Etsy POD Forge v{__version__} workstation URL: {url} (start with: etsy-pod-forge serve --port {port})")
    return 0


def cmd_mcp(_args: argparse.Namespace) -> int:
    """Launch JSON-RPC 2.0 stdio MCP server exposing 6 POD tools."""
    return run_stdio_server()


def cmd_test(_args: argparse.Namespace) -> int:
    """Run automated pytest test suite."""
    print_banner()
    pkg_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cmd = [sys.executable, "-m", "pytest", "-v", os.path.join(pkg_root, "tests")]
    res = subprocess.run(cmd)
    return res.returncode


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="etsy-pod-forge",
        description=f"Etsy POD Forge v{__version__}: 300-DPI Print Canvas, Lifestyle Mockups, Etsy SEO & 6-Tool MCP Server.",
    )
    parser.add_argument("--version", action="version", version=f"etsy-pod-forge {__version__}")
    parser.add_argument("--status", action="store_true", help="Print live daemon & local engine status and exit")
    parser.add_argument("--json", action="store_true", help="Emit JSON output when combined with --status")
    parser.add_argument("--port", type=int, default=8107, help="Loopback server port (default: 8107)")

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    p_gen = subparsers.add_parser("generate", help="Generate print-ready 300-DPI PNG canvas")
    p_gen.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Target product cadre")
    p_gen.add_argument("--preview", action="store_true", help="Generate lightweight preview resolution")
    p_gen.add_argument("--title", help="Custom main title text")
    p_gen.add_argument("--subtitle", help="Custom subtitle text")
    p_gen.add_argument("--names", help="Comma-separated custom names")
    p_gen.add_argument("--out", help="Output PNG file path")
    p_gen.add_argument("--json", action="store_true", help="Output clean JSON")

    p_mock = subparsers.add_parser("mockup", help="Composite design onto product mockup")
    p_mock.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Product cadre")
    p_mock.add_argument("--color", default="sand", help="Product colorway")
    p_mock.add_argument("--out", help="Output JPG file path")
    p_mock.add_argument("--json", action="store_true", help="Output clean JSON")

    p_list = subparsers.add_parser("listing", help="Synthesize complete Etsy listing kit")
    p_list.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Product cadre")
    p_list.add_argument("--title", help="Custom title hook prefix")
    p_list.add_argument("--names", help="Custom names string")
    p_list.add_argument("--retail", type=float, help="Custom retail price")
    p_list.add_argument("--cost", type=float, help="Custom production cost")
    p_list.add_argument("--shipping-charged", type=float, default=0.0, help="Buyer shipping charged ($)")
    p_list.add_argument("--shipping-cost", type=float, default=0.0, help="POD shipping cost ($)")
    p_list.add_argument("--offsite-ads-rate", type=float, default=0.0, choices=[0.0, 0.12, 0.15], help="Etsy Offsite Ads rate")
    p_list.add_argument("--json", action="store_true", help="Output clean JSON (no ANSI banner)")

    p_prompts = subparsers.add_parser("prompts", help="Browse 53-recipe AI prompt vault")
    p_prompts.add_argument("--cadre", choices=list(CADRE_SPECS.keys()), help="Filter by cadre")
    p_prompts.add_argument("--search", help="Search keywords across prompts")
    p_prompts.add_argument("--limit", type=int, default=10, help="Maximum prompts to display")
    p_prompts.add_argument("--json", action="store_true", help="Output clean JSON")

    p_serve = subparsers.add_parser("serve", help="Start hardened web workstation & REST API daemon")
    p_serve.add_argument("--port", type=int, default=8107, help="Port to bind (default: 8107)")
    p_serve.add_argument("--host", default=_default_bind_host(), help="Host interface (default: 127.0.0.1)")

    p_status = subparsers.add_parser("status", help="Check daemon health and local engine status")
    p_status.add_argument("--port", type=int, default=8107, help="Server port (default: 8107)")
    p_status.add_argument("--json", action="store_true", help="Output clean JSON")

    p_desktop = subparsers.add_parser("desktop", help="Open local web workstation UI")
    p_desktop.add_argument("--port", type=int, default=8107, help="Server port (default: 8107)")
    p_desktop.add_argument("--dry-run", action="store_true", help="Print URL without launching browser")

    subparsers.add_parser("mcp", help="Run JSON-RPC 2.0 stdio MCP server (6 POD tools)")
    subparsers.add_parser("test", help="Run automated pytest test suite")

    args = parser.parse_args(argv)

    if args.status and not args.command:
        return cmd_status(args)

    dispatch = {
        "generate": cmd_generate,
        "mockup": cmd_mockup,
        "listing": cmd_listing,
        "prompts": cmd_prompts,
        "serve": cmd_serve,
        "status": cmd_status,
        "desktop": cmd_desktop,
        "mcp": cmd_mcp,
        "test": cmd_test,
    }

    fn = dispatch.get(args.command)
    if fn:
        return fn(args)
    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())
