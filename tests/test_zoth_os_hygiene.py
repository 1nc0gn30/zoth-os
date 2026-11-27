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


def test_tools_catalog_lists_85_tools_and_key_entries():
    assert CATALOG_PATH.is_file(), f"Missing catalog: {CATALOG_PATH}"
    text = CATALOG_PATH.read_text(encoding="utf-8")
    assert "85-Tool" in text or "85 Studio tools" in text
    assert "zoth-memory-vault" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-memory-vault"
    assert "zoth-egregore" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-egregore"
    assert "zoth-bot-os" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-bot-os"
    assert "zoth-comfy-foundry" in text, "ZOTHOS_TOOLS_CATALOG.md missing zoth-comfy-foundry"


def test_zoth_studio_systemd_unit_points_to_serve_mjs():
    unit = ROOT / "config" / "includes.chroot" / "etc" / "systemd" / "system" / "zoth-studio.service"
    assert unit.is_file(), f"Missing unit: {unit}"
    text = unit.read_text(encoding="utf-8")
    assert "/opt/zoth-studio/server/serve.mjs --port 3000" in text
    assert "/opt/zoth-studio/server.js" not in text


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


def test_hermes_gateway_chroot_systemd_unit_is_hardened_and_portable():
    unit = ROOT / "config" / "includes.chroot" / "etc" / "systemd" / "user" / "hermes-gateway.service"
    assert unit.is_file(), f"Missing chroot user unit: {unit}"
    text = unit.read_text(encoding="utf-8")

    # Zero literal /home/<user> paths
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", text), "Literal /home/<user> path found in hermes-gateway.service"
    assert "ConditionPathExists=%h/.hermes/hermes-agent/.hermes/bin/hermes" in text
    assert "WorkingDirectory=%h/.hermes" in text
    assert "Environment=HERMES_HOME=%h/.hermes" in text
    assert "Environment=HERMES_SUPERVISED_CHILD=1" in text
    assert "UMask=0077" in text
    assert "NoNewPrivileges=yes" in text
    assert "PrivateTmp=yes" in text
    assert "MemoryHigh=3G" in text
    assert "MemoryMax=4G" in text
    assert "CPUQuota=400%" in text
    assert "SyslogIdentifier=hermes-gateway" in text
    assert "Documentation=https://github.com/1nc0gn30/hermes-zoth" in text

    res = subprocess.run(
        ["systemd-analyze", "--user", "verify", str(unit)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert res.returncode == 0, f"systemd-analyze --user verify failed: {res.stderr}"


def test_hermes_and_hermes_gateway_chroot_wrappers():
    hermes_bin = BIN_DIR / "hermes"
    gw_bin = BIN_DIR / "hermes-gateway"
    assert hermes_bin.is_file(), f"Missing {hermes_bin}"
    assert gw_bin.is_file(), f"Missing {gw_bin}"

    hermes_text = hermes_bin.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", hermes_text), "Literal /home/ path in chroot hermes wrapper"
    pos_dot_hermes = hermes_text.find("$HERMES_USER_DIR/.hermes/bin/hermes")
    pos_opt_hermes = hermes_text.find("$HERMES_OPT_DIR/venv/bin/hermes")
    assert pos_dot_hermes != -1 and pos_opt_hermes != -1 and pos_dot_hermes < pos_opt_hermes, (
        "chroot hermes wrapper must prioritize $HERMES_USER_DIR/.hermes/bin/hermes before legacy /opt fallback"
    )
    res_bash = subprocess.run(["bash", "-n", str(hermes_bin)], capture_output=True, text=True, check=False)
    assert res_bash.returncode == 0, f"bash -n failed for hermes: {res_bash.stderr}"

    gw_text = gw_bin.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", gw_text), "Literal /home/ path in chroot hermes-gateway wrapper"
    res_help = subprocess.run(["python3", str(gw_bin), "--help"], capture_output=True, text=True, check=False)
    assert res_help.returncode == 0 and "hermes-gateway" in res_help.stdout, f"hermes-gateway --help failed: {res_help.stderr}"

