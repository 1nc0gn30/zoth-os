"""zoth-ph / producthunt-connector CLI."""

from __future__ import annotations

import argparse
import getpass
import json
import sys
from typing import List, Optional

from . import __version__, client, config
from .cockpit import run_server


def _print_json(data: object) -> None:
    print(json.dumps(data, indent=2))


def cmd_login(_: argparse.Namespace) -> int:
    print("Create an app at https://www.producthunt.com/v2/oauth/applications")
    print("Copy the Developer Token (it does not expire). Paste it here.")
    print("Do not paste the token in chat.")
    token = getpass.getpass("Developer token: ").strip()
    if not token:
        print("empty token", file=sys.stderr)
        return 1
    config.save_secret(token)
    print(f"saved {config.SECRET_PATH} mode 0600")
    ph = client.ProductHuntClient(token)
    try:
        me = ph.whoami()
    except client.ProductHuntError as err:
        print(f"token saved, whoami failed: {err}", file=sys.stderr)
        return 2
    print(f"signed in as @{me.get('username') or me.get('name') or 'unknown'}")
    return 0


def cmd_whoami(_: argparse.Namespace) -> int:
    ph = client.ProductHuntClient()
    if not ph.is_configured():
        print("not logged in. run: zoth-ph login", file=sys.stderr)
        return 2
    try:
        me = ph.whoami()
    except client.ProductHuntError as err:
        print(str(err), file=sys.stderr)
        return 1
    print(f"@{me.get('username')}  {me.get('name')}")
    return 0


def _status_payload() -> dict:
    desired = config.load_desired()
    ph = client.ProductHuntClient()
    if not ph.is_configured():
        payload = {
            "ok": False,
            "configured": False,
            "error": "not logged in",
            "desired": desired,
            "can_patch_via_api": False,
            "login": "zoth-ph login",
            "dashboard": desired.get("dashboard_hint"),
        }
        config.save_status(payload)
        return payload
    post = ph.fetch_post(str(desired.get("slug") or "zothos"))
    payload = client.build_status(post, desired)
    config.save_status(payload)
    return payload


def cmd_status(args: argparse.Namespace) -> int:
    try:
        payload = _status_payload()
    except client.ProductHuntError as err:
        print(str(err), file=sys.stderr)
        return 1
    if args.json:
        _print_json(payload)
        return 0 if payload.get("ok") or not payload.get("configured") else 3
    if not payload.get("configured"):
        print("not logged in. run: zoth-ph login")
        return 2
    print(f"{payload.get('name')}  {payload.get('url')}")
    print(f"votes {payload.get('votesCount')}  comments {payload.get('commentsCount')}  reviews {payload.get('reviewsCount')}")
    ranks = []
    if payload.get("weeklyRank") is not None:
        ranks.append(f"week #{payload['weeklyRank']}")
    if payload.get("monthlyRank") is not None:
        ranks.append(f"month #{payload['monthlyRank']}")
    if ranks:
        print("rank " + "  ".join(ranks))
    print(f"website  {payload.get('website')}")
    print(f"desired  {payload['desired']['website']}  {'OK' if payload.get('website_ok') else 'DRIFT'}")
    gits = payload.get("github_urls") or []
    print("github   " + (", ".join(gits) if gits else "(none)"))
    print(f"desired  {payload['desired']['github']}  {'OK' if payload.get('github_release_ok') else 'DRIFT'}")
    if payload.get("drift"):
        print()
        print("Product Hunt API cannot set these. Dashboard steps:")
        for item in payload["drift"]:
            print(f"- {item['field']}: {item['action']}")
    else:
        print("listing URLs match desired state")
    return 0 if payload.get("ok") else 3


def cmd_comments(args: argparse.Namespace) -> int:
    try:
        payload = _status_payload()
    except client.ProductHuntError as err:
        print(str(err), file=sys.stderr)
        return 1
    comments = payload.get("comments") or []
    if args.json:
        _print_json(comments)
        return 0
    if not comments:
        print("no comments")
        return 0
    for item in comments:
        who = item.get("username") or item.get("user") or "?"
        print(f"@{who}  {item.get('createdAt')}")
        print((item.get("body") or "").strip())
        print()
    print("This tool does not post replies. Paste them on Product Hunt yourself.")
    return 0


def cmd_badges(args: argparse.Namespace) -> int:
    badges = client.badge_html(config.load_desired())
    if args.json:
        _print_json(badges)
        return 0
    print("FEATURED")
    print(badges["featured_html"])
    print()
    print("REVIEW")
    print(badges["review_html"])
    return 0


def cmd_serve(args: argparse.Namespace) -> int:
    run_server(host=args.host, port=args.port)
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="zoth-ph",
        description="Product Hunt connector for Zoth OS. Read listing, diff URLs, never auto-post.",
    )
    parser.add_argument("--version", action="version", version=f"zoth-ph {__version__}")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("login", help="Save developer token to ~/.config/zothos/producthunt.secret.json")
    sub.add_parser("whoami", help="Show the Product Hunt user for the saved token")

    st = sub.add_parser("status", help="Fetch ZOTHOS listing and diff desired website/GitHub")
    st.add_argument("--json", action="store_true")

    cm = sub.add_parser("comments", help="List recent comments (does not reply)")
    cm.add_argument("--json", action="store_true")

    bd = sub.add_parser("badges", help="Print official featured and review badge HTML")
    bd.add_argument("--json", action="store_true")

    sv = sub.add_parser("serve", help="Local cockpit on 127.0.0.1:8121")
    sv.add_argument("--port", type=int, default=8121)
    sv.add_argument("--host", default=None)

    args = parser.parse_args(argv)
    cmd = args.command or "status"
    if cmd == "login":
        return cmd_login(args)
    if cmd == "whoami":
        return cmd_whoami(args)
    if cmd == "status":
        return cmd_status(args)
    if cmd == "comments":
        return cmd_comments(args)
    if cmd == "badges":
        return cmd_badges(args)
    if cmd == "serve":
        return cmd_serve(args)
    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
