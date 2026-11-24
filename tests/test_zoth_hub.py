import json
import os
import re
import socket
import subprocess
import sys
import threading
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CHROOT = REPO_ROOT / "config" / "includes.chroot"
HUB_DIR = CHROOT / "opt" / "zoth-hub"
SKEL_DESKTOP = CHROOT / "etc" / "skel" / "Desktop"
APPS_DIR = CHROOT / "usr" / "share" / "applications"
BIN_DIR = CHROOT / "usr" / "local" / "bin"
DESKTOP_DIRS = CHROOT / "usr" / "share" / "desktop-directories"
PLASMA_MENU = CHROOT / "etc" / "xdg" / "menus" / "plasma-applications.menu"
PLASMA_SETUP = BIN_DIR / "zoth-plasma-setup"

EXPECTED_DESKTOP_FILES = {
    "zoth-hub.desktop",
    "zoth-bot-os.desktop",
    "zoth-terminal.desktop",
    "google-chrome.desktop",
    "install-zothos.desktop",
}

EXPECTED_CATEGORIES = {
    "AI Agents & Swarms",
    "Security & Privacy",
    "Web & Dev Foundry",
    "Media, 3D & Creative",
    "Commerce & Automation",
    "System & Hardware",
}

VALID_STATUSES = {"running", "installed_cli", "browser_ready", "not_installed"}


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _start_test_hub():
    sys.path.insert(0, str(HUB_DIR))
    import hub_server  # noqa: E402

    port = _free_port()
    handler = hub_server.make_handler(HUB_DIR / "catalog.json", HUB_DIR / "public", port)
    server = hub_server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def test_zoth_hub_api_health_catalog_and_launch_allowlist():
    server, port = _start_test_hub()
    base = f"http://127.0.0.1:{port}"
    try:
        # 1. /health
        with urllib.request.urlopen(f"{base}/health", timeout=5) as r:
            assert r.status == 200
            health = json.loads(r.read().decode())
            assert health["status"] == "ok"
            assert health["service"] == "zoth-hub"
            assert health["total_items"] >= 85
            assert health["categories"] == 6

        # 2. /api/categories
        with urllib.request.urlopen(f"{base}/api/categories", timeout=5) as r:
            assert r.status == 200
            cats_data = json.loads(r.read().decode())
            cat_names = {c["name"] for c in cats_data["categories"]}
            assert cat_names == EXPECTED_CATEGORIES

        # 3. /api/catalog
        with urllib.request.urlopen(f"{base}/api/catalog", timeout=10) as r:
            assert r.status == 200
            cat = json.loads(r.read().decode())
            items = cat["items"]
            assert len(items) >= 85
            assert cat["studio_tools_count"] >= 85
            assert {c["name"] for c in cat["categories"]} == EXPECTED_CATEGORIES
            for it in items:
                assert it["status"] in VALID_STATUSES
                assert it["runtime_summary"]
                assert it["category"] in EXPECTED_CATEGORIES

        # 4. /api/launch rejects shell injection & unknown IDs
        for bad_id in ("; rm -rf /", "$(id)", "../../etc/passwd", "nonexistent-tool-999"):
            req = urllib.request.Request(
                f"{base}/api/launch",
                data=json.dumps({"id": bad_id, "mode": "auto", "dry_run": True}).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            try:
                urllib.request.urlopen(req, timeout=5)
                assert False, f"Expected HTTP 404 for bad id {bad_id!r}"
            except urllib.error.HTTPError as exc:
                assert exc.code == 404

        # 5. /api/launch rejects invalid mode
        req = urllib.request.Request(
            f"{base}/api/launch",
            data=json.dumps({"id": "zoth-terminal", "mode": "shell", "dry_run": True}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            urllib.request.urlopen(req, timeout=5)
            assert False, "Expected HTTP 400 for invalid mode"
        except urllib.error.HTTPError as exc:
            assert exc.code == 400

        # 6. /api/launch dry_run succeeds on valid allowlisted browser item
        req = urllib.request.Request(
            f"{base}/api/launch",
            data=json.dumps({"id": "promptmaster-studio", "mode": "browser", "dry_run": True}).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            assert r.status == 200
            res = json.loads(r.read().decode())
            assert res["ok"] is True
            assert res["dry_run"] is True
            assert isinstance(res["argv"], list) and len(res["argv"]) >= 2
    finally:
        server.shutdown()
        server.server_close()


def test_zoth_hub_cli_flags():
    hub_bin = BIN_DIR / "zoth-hub"
    assert hub_bin.is_file()
    env = dict(os.environ, ZOTH_HUB_DIR=str(HUB_DIR))

    res = subprocess.run(
        [str(hub_bin), "--status", "--json"],
        capture_output=True,
        text=True,
        check=True,
        env=env,
    )
    data = json.loads(res.stdout)
    assert data["service"] == "zoth-hub"
    assert data["summary"]["total"] >= 85
    assert len(data["categories"]) == 6


def test_skel_desktop_has_exactly_five_curated_launchers_and_zero_folders():
    assert SKEL_DESKTOP.is_dir()
    entries = list(SKEL_DESKTOP.iterdir())
    subdirs = [e.name for e in entries if e.is_dir()]
    assert not subdirs, f"Found forbidden Desktop clutter folders: {subdirs}"

    names = {e.name for e in entries}
    assert names == EXPECTED_DESKTOP_FILES, f"Expected {EXPECTED_DESKTOP_FILES}, got {names}"

    for entry in entries:
        assert os.access(entry, os.X_OK), f"Desktop launcher is not executable: {entry.name}"
        content = entry.read_text(encoding="utf-8")
        assert "xfce4-terminal" not in content


def test_applications_menu_clean_deduplicated_and_zero_broken_bins():
    assert APPS_DIR.is_dir()
    desktop_files = sorted(APPS_DIR.glob("*.desktop"))
    assert len(desktop_files) > 50

    # Required canonical entries must exist
    for required in (
        "zoth-hub.desktop",
        "zoth-bot-os.desktop",
        "zoth-comfy-foundry.desktop",
        "zoth-memory-vault.desktop",
        "zoth-bolt.desktop",
        "install-zothos.desktop",
    ):
        assert (APPS_DIR / required).is_file(), f"Missing canonical desktop entry: {required}"

    # Removed duplicates must stay gone
    for removed in ("bolt-diy.desktop", "bolt.diy.desktop"):
        assert not (APPS_DIR / removed).exists(), f"Duplicate menu entry still present: {removed}"

    xfce_hits = []
    visible_names = defaultdict(list)
    broken_bins = []

    for path in desktop_files:
        txt = path.read_text(encoding="utf-8", errors="ignore")
        if "xfce4-terminal" in txt:
            xfce_hits.append(path.name)

        name = ""
        nodisplay = False
        for line in txt.splitlines():
            if line.startswith("Name=") and not name:
                name = line.split("=", 1)[1].strip()
            elif line.strip() == "NoDisplay=true":
                nodisplay = True

        if not nodisplay and name:
            visible_names[name].append(path.name)

        for match in re.findall(r"/usr/local/bin/[A-Za-z0-9._-]+", txt):
            bname = os.path.basename(match)
            if not (BIN_DIR / bname).exists():
                broken_bins.append((path.name, match))

    dups = {k: v for k, v in visible_names.items() if len(v) > 1}
    assert not xfce_hits, f"Found legacy xfce4-terminal calls: {xfce_hits}"
    assert not dups, f"Found duplicate visible menu names: {dups}"
    assert not broken_bins, f"Found broken /usr/local/bin targets: {broken_bins}"


def test_xdg_menus_and_plasma_setup_layout():
    expected_dirs = [
        "zoth-hub-ai.directory",
        "zoth-security.directory",
        "zoth-dev-web.directory",
        "zoth-media-3d.directory",
        "zoth-commerce.directory",
        "zoth-system.directory",
    ]
    for dname in expected_dirs:
        assert (DESKTOP_DIRS / dname).is_file(), f"Missing directory file: {dname}"

    ET.parse(PLASMA_MENU)
    menu_txt = PLASMA_MENU.read_text(encoding="utf-8")
    for dname in expected_dirs:
        assert dname in menu_txt, f"{dname} not wired into plasma-applications.menu"

    setup_txt = PLASMA_SETUP.read_text(encoding="utf-8")
    assert 'mkdir -p "$HOME/Desktop/01-AI-Agents-and-Dev"' not in setup_txt
    assert "zoth-hub.desktop" in setup_txt
    assert "zoth-bot-os.desktop" in setup_txt
