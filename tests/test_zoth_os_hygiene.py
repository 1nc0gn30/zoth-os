from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parent.parent
BIN_DIR = ROOT / "config" / "includes.chroot" / "usr" / "local" / "bin"
OPT_DIR = ROOT / "config" / "includes.chroot" / "opt"
CATALOG_PATH = ROOT / "ZOTHOS_TOOLS_CATALOG.md"

TEXT_EXTENSIONS = {
    ".html",
    ".htm",
    ".js",
    ".mjs",
    ".cjs",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
    ".py",
    ".sh",
}
SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv"}


def test_shell_scripts_pass_bash_syntax_check():
    for script_name in ("zoth-firstboot", "zoth-memory-vault"):
        script_path = BIN_DIR / script_name
        assert script_path.is_file(), f"Missing script: {script_path}"
        res = subprocess.run(
            ["bash", "-n", str(script_path)],
            capture_output=True,
            text=True,
            check=False,
        )
        assert res.returncode == 0, f"bash -n failed for {script_name}: {res.stderr}"


def test_zoth_firstboot_has_non_root_log_fallback():
    firstboot = (BIN_DIR / "zoth-firstboot").read_text(encoding="utf-8")
    assert "${HOME}/.local/state/zoth-nexus-firstboot.log" in firstboot
    assert "/var/log/zoth-nexus-firstboot.log" in firstboot
    assert re.search(r"EUID.*-ne\s+0", firstboot), "Missing non-root EUID guard for LOG path"


def test_tools_catalog_lists_83_tools_and_key_entries():
    assert CATALOG_PATH.is_file(), f"Missing catalog: {CATALOG_PATH}"
    text = CATALOG_PATH.read_text(encoding="utf-8")
    assert "83-Tool" in text or "83 Studio tools" in text
    assert "zoth-memory-vault" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-memory-vault"
    assert "zoth-egregore" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-egregore"


def test_zero_paywall_or_depay_regressions_in_chroot_opt():
    assert OPT_DIR.is_dir(), f"Missing chroot opt dir: {OPT_DIR}"
    forbidden = re.compile(r"\.paywall-|isProLicensed|depay", re.IGNORECASE)
    hits = []

    for path in OPT_DIR.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        match = forbidden.search(content)
        if match:
            hits.append(f"{path.relative_to(ROOT)} ({match.group(0)})")

    assert not hits, f"Found paywall/DePay regressions in chroot opt/: {hits}"
