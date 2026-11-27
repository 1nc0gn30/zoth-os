"""Digital Asset Forge - Sovereign Command-Line Interface.

Zero-dependency Python standard library CLI.
"""

import argparse
import json
import shutil
import subprocess
import sys
import urllib.request
import webbrowser

from . import __version__
from .ratios import RatioCalculator
from .pack_generator import ArtPackGenerator
from .printing_guide import PrintingGuideGenerator
from .etsy_copywriter import EtsyCopywriter
from .server import PORT, _default_bind_host, run_server
from .mcp_server import run_mcp_stdio


def _probe_daemon(host: str, port: int, timeout: float = 0.7) -> bool:
    url = f"http://{host}:{port}/health"
    try:
        req = urllib.request.Request(url, headers={"Host": f"{host}:{port}"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def _launch_desktop(host: str, port: int, dry_run: bool = False, as_json: bool = False) -> int:
    url = f"http://{host}:{port}"
    daemon_running = _probe_daemon(host, port)
    opener = shutil.which("xdg-open") or "webbrowser"
    payload = {
        "service": "digital-asset-forge",
        "version": __version__,
        "action": "desktop",
        "url": url,
        "daemon_running": daemon_running,
        "dry_run": dry_run,
        "opener": opener,
    }
    if dry_run:
        if as_json:
            print(json.dumps(payload, indent=2))
        else:
            print(f"Digital Asset Forge v{__version__} desktop target: {url} (daemon_running={daemon_running})")
        return 0

    if not daemon_running:
        # Attempt to start user systemd unit if installed, otherwise inform cleanly
        systemctl = shutil.which("systemctl")
        if systemctl:
            subprocess.run(
                [systemctl, "--user", "start", "digital-asset-forge.service"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
            daemon_running = _probe_daemon(host, port, timeout=1.5)
            payload["daemon_running"] = daemon_running

    opened = False
    if shutil.which("xdg-open"):
        try:
            subprocess.Popen(
                ["xdg-open", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            opened = True
        except Exception:
            opened = False
    if not opened:
        try:
            opened = bool(webbrowser.open(url))
        except Exception:
            opened = False
    payload["opened"] = opened

    if as_json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"Digital Asset Forge v{__version__} -> {url} (daemon_running={daemon_running}, opened={opened})")
    return 0


def main():
    parser = argparse.ArgumentParser(
        prog="digital-asset-forge",
        description="High-Res 300 DPI Multi-Ratio Wall Art Pack Generator (Etsy & Shopify Digital Downloads)",
    )
    parser.add_argument("--version", action="version", version=f"digital-asset-forge {__version__}")
    parser.add_argument("--status", action="store_true", help="Print service status and ratio summary")
    parser.add_argument("--json", action="store_true", help="Output JSON payload")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Subcommand: status
    p_status = subparsers.add_parser("status", help="Print service status and ratio summary")
    p_status.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: manifest
    p_manifest = subparsers.add_parser("manifest", help="Generate multi-ratio digital product pack manifest")
    p_manifest.add_argument("--title", default="Celestial Obsidian Horizon", help="Artwork title")
    p_manifest.add_argument("--artist", default="1nc0gn30", help="Artist name")
    p_manifest.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: guide
    p_guide = subparsers.add_parser("guide", help="Generate customer printing instructions manual")
    p_guide.add_argument("--title", default="Celestial Obsidian Horizon", help="Artwork title")
    p_guide.add_argument("--shop", default="NullAI Studio", help="Shop brand name")
    p_guide.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: etsy
    p_etsy = subparsers.add_parser("etsy", help="Generate Etsy listing copy, 13 tags, and margin economics")
    p_etsy.add_argument("--title", default="Celestial Obsidian Horizon", help="Artwork title")
    p_etsy.add_argument("--niche", default="abstract", choices=["abstract", "botanical", "landscape", "geometric"])
    p_etsy.add_argument("--price", type=float, default=6.99, help="Retail price USD")
    p_etsy.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: dpi
    p_dpi = subparsers.add_parser("dpi", help="Validate pixel resolution against target physical print size")
    p_dpi.add_argument("--width", type=int, default=7200, help="Source image pixel width")
    p_dpi.add_argument("--height", type=int, default=10800, help="Source image pixel height")
    p_dpi.add_argument("--target-w", type=float, default=24.0, help="Physical print width in inches")
    p_dpi.add_argument("--target-h", type=float, default=36.0, help="Physical print height in inches")
    p_dpi.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: server
    p_server = subparsers.add_parser("server", help="Launch HTTP server and Web UI")
    p_server.add_argument("--host", default=None, help="Bind host (default: 127.0.0.1)")
    p_server.add_argument("--port", type=int, default=PORT, help="Server port (default: 8118)")

    # Subcommand: desktop
    p_desktop = subparsers.add_parser("desktop", help="Open Digital Asset Forge local workstation (:8118)")
    p_desktop.add_argument("--host", default="127.0.0.1", help="Local daemon host (default: 127.0.0.1)")
    p_desktop.add_argument("--port", type=int, default=PORT, help="Local daemon port (default: 8118)")
    p_desktop.add_argument("--dry-run", action="store_true", help="Print resolved launch payload without opening a browser")
    p_desktop.add_argument("--json", action="store_true", help="Output raw JSON")

    # Subcommand: mcp
    subparsers.add_parser("mcp", help="Run stdio JSON-RPC 2.0 MCP server (6 forge_* tools)")

    args = parser.parse_args()

    if args.status or args.command == "status" or (args.json and not args.command):
        families = RatioCalculator.get_all_families()
        daemon_up = _probe_daemon("127.0.0.1", PORT)
        payload = {
            "service": "digital-asset-forge",
            "version": __version__,
            "status": "ready",
            "daemon_online": daemon_up,
            "default_port": PORT,
            "local_url": f"http://127.0.0.1:{PORT}",
            "ratio_family_count": len(families),
            "ratio_families": [f.get("id") for f in families],
            "mcp_tools": 6,
        }
        if getattr(args, "json", False):
            print(json.dumps(payload, indent=2))
        else:
            print(
                f"Digital Asset Forge v{payload['version']} | Status: {payload['status']} "
                f"| Daemon :8118: {'ONLINE' if daemon_up else 'STANDBY'} "
                f"| Ratios: {payload['ratio_family_count']} | MCP Tools: 6"
            )
        return

    if args.command == "manifest":
        manifest = ArtPackGenerator.generate_manifest(args.title, args.artist)
        if args.json:
            print(json.dumps(manifest, indent=2))
        else:
            print("=" * 70)
            print(f"DIGITAL ASSET FORGE PACK: {manifest['artwork_title']}")
            print(f"Artist: {manifest['artist']} | Total Files: {manifest['total_files']} | Est. Size: {manifest['total_estimated_size_mb']} MB")
            print("=" * 70)
            for f in manifest["files"]:
                print(f"- [{f['ratio']}] {f['filename']}")
                print(f"   Max Size: {f['max_print_size']} | Resolution: {f['resolution']} (300 DPI)")
            print("-" * 70)
            plan = manifest["etsy_delivery_plan"]
            print(f"Etsy Upload Viable: {'YES' if plan['etsy_direct_upload_viable'] else 'NO'} ({plan['total_zip_archives']} ZIP archives)")
            for b in plan["bundles"]:
                print(f"   - {b['zip_filename']} ({b['bundle_size_mb']} MB, {len(b['contained_files'])} files)")
            print("=" * 70)

    elif args.command == "guide":
        if getattr(args, "json", False):
            print(json.dumps(PrintingGuideGenerator.generate_guide_payload(args.title, args.shop), indent=2))
        else:
            print(PrintingGuideGenerator.generate_guide_markdown(args.title, args.shop))

    elif args.command == "etsy":
        listing = EtsyCopywriter.generate_listing(args.title, args.niche, args.price)
        if args.json:
            print(json.dumps(listing, indent=2))
        else:
            print("=" * 70)
            print(f"ETSY LISTING: {listing['title']}")
            print("=" * 70)
            print("13 SEARCH TAGS (<= 20 chars each):")
            for i, tag in enumerate(listing["tags"], 1):
                print(f"  {i:2d}. {tag} ({len(tag)} chars)")
            print("-" * 70)
            eco = listing["economics"]
            print(f"Retail Price: ${eco['retail_price_usd']:.2f}")
            print(f"Etsy Fees:    ${eco['total_platform_fees_usd']:.2f} (Listing $0.20 + Tx 6.5% + Proc 3%+$0.25)")
            print(f"Net Margin:   ${eco['net_profit_per_sale_usd']:.2f} ({eco['profit_margin_percentage']}%)")
            print(f"Monthly Net (100 sales): ${eco['monthly_net_at_100_sales_usd']:.2f}")
            print(f"Monthly Net (500 sales): ${eco['monthly_net_at_500_sales_usd']:.2f}")
            print("=" * 70)

    elif args.command == "dpi":
        report = RatioCalculator.validate_dpi_quality(args.width, args.height, args.target_w, args.target_h)
        if getattr(args, "json", False):
            print(json.dumps(report, indent=2))
        else:
            print("=" * 60)
            print(f"DPI AUDIT REPORT: {report['rating']}")
            print(f"Pixel Dimensions:    {report['pixel_dimensions']}")
            print(f"Physical Target:     {report['physical_dimensions']}")
            print(f"Effective DPI:       {report['effective_dpi']} DPI ({report['label']})")
            print(f"Status:              {report['status'].upper()}")
            print("=" * 60)

    elif args.command == "server":
        run_server(port=args.port, host=args.host or _default_bind_host())

    elif args.command == "desktop":
        sys.exit(_launch_desktop(args.host, args.port, dry_run=args.dry_run, as_json=args.json))

    elif args.command == "mcp":
        run_mcp_stdio()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
