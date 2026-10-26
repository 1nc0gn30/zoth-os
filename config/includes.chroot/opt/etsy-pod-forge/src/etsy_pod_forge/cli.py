"""Command-Line Interface (CLI) for Etsy POD Forge.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Commands:
  generate   Generate print-ready high-resolution transparent PNG canvas
  mockup     Composite design onto realistic product background
  listing    Synthesize complete Etsy SEO listing kit (title, 13 tags, copy, profits)
  prompts    Browse 50+ battle-tested AI image generation recipes
  serve      Launch web cockpit and REST API daemon (Port 8107)
  status     Query live daemon health and telemetry metrics
  test       Execute automated verification test suite
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from typing import List, Optional

from .canvas_generator import CanvasGenerator, CanvasConfig
from .listing_synthesizer import synthesize_listing, CADRE_SPECS
from .mockup_engine import MockupEngine, MockupConfig
from .prompt_vault import get_all_prompts, get_prompts_by_cadre, search_prompts
from .server import ForgeServer


def _default_bind_host() -> str:
    """Bind address: localhost unless explicitly opted in via $ZOTH_BIND_HOST or
    $HOST (IP literal only; zsh sets HOST to the hostname) or --host."""
    import ipaddress, os
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


# ANSI Color Commodity Tokens
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"
C_GOLD = "\033[38;5;214m"
C_GOLD_BOLD = "\033[1;38;5;214m"
C_GREEN = "\033[38;5;48m"
C_GREEN_BOLD = "\033[1;38;5;48m"
C_CYAN = "\033[38;5;51m"
C_PURPLE = "\033[38;5;141m"
C_RED = "\033[38;5;196m"
C_GRAY = "\033[38;5;244m"


def print_banner() -> None:
    print(f"""
{C_GOLD_BOLD}╔══════════════════════════════════════════════════════════════════════════════╗
║               🌸 ETSY POD FORGE — AUTONOMOUS COMMERCE STUDIO 🌸              ║
║         Neal Frazier Tech (@1nc0gn30) • 55+ Women Demographic Engine         ║
╚══════════════════════════════════════════════════════════════════════════════╝{C_RESET}""")


def cmd_generate(args: argparse.Namespace) -> int:
    """Generate high-res or preview canvas."""
    print_banner()
    cadre = args.cadre.lower()
    preview = args.preview
    out_file = args.out or f"{cadre}_canvas.png"

    print(f"{C_CYAN}⚡ Generating {cadre.upper()} print canvas...{C_RESET}")
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

    print(f"{C_GREEN}✓ Canvas successfully saved:{C_RESET} {out_file}")
    print(f"  Dimensions: {img.width}x{img.height} px @ {cfg.dpi} DPI")
    print(f"  Mode:       {img.mode}")
    return 0


def cmd_mockup(args: argparse.Namespace) -> int:
    """Composite design onto lifestyle mockup."""
    print_banner()
    cadre = args.cadre.lower()
    out_file = args.out or f"{cadre}_mockup.jpg"

    print(f"{C_CYAN}⚡ Compositing {cadre.upper()} lifestyle mockup...{C_RESET}")
    mock_cfg = MockupConfig.default_for_cadre(cadre)
    if args.color:
        mock_cfg.product_color = args.color

    engine = MockupEngine(mock_cfg)
    mock_img = engine.composite()
    mock_img.save(out_file, quality=92, optimize=True)

    print(f"{C_GREEN}✓ Mockup successfully saved:{C_RESET} {out_file}")
    print(f"  Dimensions: {mock_img.width}x{mock_img.height} px")
    print(f"  Colorway:   {mock_cfg.product_color}")
    return 0


def cmd_listing(args: argparse.Namespace) -> int:
    """Synthesize complete Etsy SEO listing kit."""
    print_banner()
    cadre = args.cadre.lower()
    kit = synthesize_listing(
        cadre=cadre,
        custom_title_hook=args.title,
        custom_names=args.names,
        retail_price=args.retail,
        production_cost=args.cost,
    )

    if args.json:
        print(json.dumps(kit.to_dict(), indent=2))
        return 0

    print(f"{C_BOLD}Product Cadre:{C_RESET}     {C_GOLD}{kit.product_type}{C_RESET}")
    print(f"{C_BOLD}Etsy Title:{C_RESET}        {C_CYAN}{kit.title}{C_RESET} ({len(kit.title)} chars <= 140)")
    print(f"\n{C_BOLD}13 Search Tags:{C_RESET}")
    for i, t in enumerate(kit.tags, 1):
        print(f"  {C_GRAY}{i:02d}.{C_RESET} {C_GREEN}{t}{C_RESET} ({len(t)} chars)")

    print(f"\n{C_BOLD}Financial Economics:{C_RESET}")
    print(f"  Retail Price:       ${kit.profit.retail_price:.2f}")
    print(f"  Production Cost:    ${kit.profit.production_cost:.2f}")
    print(f"  Marketplace Fees:   ${kit.profit.total_fees:.2f}")
    print(f"  {C_GREEN_BOLD}Net Profit / Sale:  ${kit.profit.net_profit:.2f} ({kit.profit.margin_percent:.1f}% Margin){C_RESET}")

    errs = kit.validate_invariants()
    if errs:
        print(f"\n{C_RED}✗ Invariant Errors:{C_RESET}")
        for e in errs:
            print(f"  - {e}")
        return 1
    else:
        print(f"\n{C_GREEN}✓ All Etsy SEO & Tag Invariants 100% Satisfied.{C_RESET}")
    return 0


def cmd_prompts(args: argparse.Namespace) -> int:
    """Browse prompt vault recipes."""
    print_banner()
    if args.search:
        prompts = search_prompts(args.search)
        print(f"{C_CYAN}Search results for '{args.search}' ({len(prompts)} found):{C_RESET}\n")
    elif args.cadre:
        prompts = get_prompts_by_cadre(args.cadre)
        print(f"{C_CYAN}Prompts for cadre '{args.cadre}' ({len(prompts)} found):{C_RESET}\n")
    else:
        prompts = get_all_prompts()
        print(f"{C_CYAN}Total Prompt Vault Catalog ({len(prompts)} recipes):{C_RESET}\n")

    for i, p in enumerate(prompts[: args.limit], 1):
        print(f"{C_GOLD_BOLD}[{p.id}] {p.title}{C_RESET} ({C_GRAY}{p.target_product}{C_RESET})")
        print(f"  {C_BOLD}Subject:{C_RESET} {p.subject}")
        print(f"  {C_BOLD}Style:{C_RESET}   {p.style}")
        print(f"  {C_BOLD}Ratio:{C_RESET}   --ar {p.aspect_ratio}  |  {C_BOLD}Model:{C_RESET} {p.model}")
        print()
    if len(prompts) > args.limit:
        print(f"{C_DIM}... and {len(prompts) - args.limit} more recipes available.{C_RESET}")
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    """Start the REST API and Avant-Garde Web Cockpit."""
    print_banner()
    port = args.port
    host = args.host

    pkg_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    public_dir = os.path.join(pkg_root, "public")

    print(f"{C_GREEN}● Starting Etsy POD Forge Server on http://{host}:{port}{C_RESET}")
    print(f"  Web Cockpit:        http://{host}:{port}/")
    print(f"  REST API:           http://{host}:{port}/api/cadres")
    print(f"  Canvas API:         http://{host}:{port}/api/generate-canvas")
    print(f"  Mockup API:         http://{host}:{port}/api/generate-mockup")
    print(f"  Listing API:        http://{host}:{port}/api/generate-listing")
    print(f"  Health Check:       http://{host}:{port}/api/health")
    print(f"{C_GRAY}  Flight Recorder:    http://127.0.0.1:8104/api/ingest{C_RESET}")
    print(f"{C_GRAY}  Neuro Memory:       http://127.0.0.1:8094/api/memories{C_RESET}")
    print(f"{C_DIM}Press Ctrl+C to terminate server gracefully.{C_RESET}\n")

    server = ForgeServer(host=host, port=port, public_dir=public_dir)
    server.start(block=True)
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    """Query live server status and display health metrics."""
    print_banner()
    url = f"http://127.0.0.1:{args.port}/api/stats"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            stats = json.loads(resp.read().decode("utf-8"))

        print(f"{C_GREEN}● ONLINE{C_RESET} — etsy-pod-forge on port {args.port}")
        print(f"Uptime:             {stats.get('uptime_seconds', 0)}s")
        print(f"Canvases Rendered:  {stats.get('canvases_generated', 0)}")
        print(f"Mockups Composited: {stats.get('mockups_generated', 0)}")
        print(f"Listings Created:   {stats.get('listings_synthesized', 0)}")
        print(f"Kits Exported:      {stats.get('kits_exported', 0)}")
        print(f"Projected Revenue:  ${stats.get('projected_revenue', 0.0):.2f}")
        print(f"Flight Rec Events:  {stats.get('flight_recorder_events', 0)}")
        print(f"Neuro Memories:     {stats.get('neuro_memories_saved', 0)}")
        return 0
    except Exception as e:
        print(f"{C_RED}● OFFLINE{C_RESET} — Could not reach http://127.0.0.1:{args.port} ({e})")
        return 1


def cmd_test(args: argparse.Namespace) -> int:
    """Run automated test suite."""
    print_banner()
    print("Running pytest test suite...")
    pkg_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cmd = [sys.executable, "-m", "pytest", "-v", os.path.join(pkg_root, "tests")]
    res = subprocess.run(cmd)
    return res.returncode


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Etsy POD Forge: Autonomous Print-on-Demand Studio & Listing Synthesizer."
    )
    subparsers = parser.add_subparsers(dest="command", required=True, help="Command to execute")

    # Command: generate
    p_gen = subparsers.add_parser("generate", help="Generate print-ready canvas")
    p_gen.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Target product cadre")
    p_gen.add_argument("--preview", action="store_true", help="Generate lightweight preview resolution")
    p_gen.add_argument("--title", help="Custom main title text")
    p_gen.add_argument("--subtitle", help="Custom subtitle text")
    p_gen.add_argument("--names", help="Comma-separated custom grandchildren/blossom names")
    p_gen.add_argument("--out", help="Output PNG file path")

    # Command: mockup
    p_mock = subparsers.add_parser("mockup", help="Composite design onto product mockup")
    p_mock.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Product cadre")
    p_mock.add_argument("--color", default="sand", help="Product garment/mug colorway")
    p_mock.add_argument("--out", help="Output JPG file path")

    # Command: listing
    p_list = subparsers.add_parser("listing", help="Synthesize complete Etsy listing kit")
    p_list.add_argument("--cadre", default="apparel", choices=list(CADRE_SPECS.keys()), help="Product cadre")
    p_list.add_argument("--title", help="Custom title hook prefix")
    p_list.add_argument("--names", help="Custom names string")
    p_list.add_argument("--retail", type=float, help="Custom retail price")
    p_list.add_argument("--cost", type=float, help="Custom production cost")
    p_list.add_argument("--json", action="store_true", help="Output clean JSON")

    # Command: prompts
    p_prompts = subparsers.add_parser("prompts", help="Browse AI prompt recipe catalog")
    p_prompts.add_argument("--cadre", choices=list(CADRE_SPECS.keys()), help="Filter by cadre")
    p_prompts.add_argument("--search", help="Search keywords across prompts")
    p_prompts.add_argument("--limit", type=int, default=10, help="Maximum prompts to display")

    # Command: serve
    p_serve = subparsers.add_parser("serve", help="Start web cockpit & REST API daemon")
    p_serve.add_argument("--port", type=int, default=8107, help="Port to bind (default: 8107)")
    p_serve.add_argument("--host", default=_default_bind_host(), help="Host interface (default: 127.0.0.1 or $ZOTH_BIND_HOST; use 0.0.0.0 only on trusted networks)")

    # Command: status
    p_status = subparsers.add_parser("status", help="Check live daemon health and telemetry")
    p_status.add_argument("--port", type=int, default=8107, help="Server port (default: 8107)")

    # Command: test
    p_test = subparsers.add_parser("test", help="Run automated test suite")

    args = parser.parse_args(argv)

    dispatch = {
        "generate": cmd_generate,
        "mockup": cmd_mockup,
        "listing": cmd_listing,
        "prompts": cmd_prompts,
        "serve": cmd_serve,
        "status": cmd_status,
        "test": cmd_test,
    }

    fn = dispatch.get(args.command)
    if fn:
        return fn(args)
    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
