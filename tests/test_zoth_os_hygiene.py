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


def test_hermes_webchat_chroot_unit_opt_and_cli_parity():
    unit = ROOT / "config" / "includes.chroot" / "etc" / "systemd" / "user" / "zoth-webchat.service"
    assert unit.is_file(), f"Missing chroot user unit: {unit}"
    text = unit.read_text(encoding="utf-8")

    assert not re.search(r"/home/[a-zA-Z0-9._-]+", text), "Literal /home/<user> path found in zoth-webchat.service"
    assert "ConditionPathExists=%h/.hermes/hermes-agent/.hermes/bin/hermes" in text
    assert "WorkingDirectory=/opt/hermes-webchat" in text
    assert "ExecStart=/usr/bin/python3 /opt/hermes-webchat/server.py" in text
    assert "UMask=0077" in text
    assert "NoNewPrivileges=yes" in text
    assert "PrivateTmp=yes" in text
    assert "MemoryHigh=256M" in text
    assert "MemoryMax=512M" in text
    assert "CPUQuota=100%" in text
    assert "SyslogIdentifier=zoth-webchat" in text
    assert "Documentation=https://github.com/1nc0gn30/hermes-webchat" in text

    res = subprocess.run(
        ["systemd-analyze", "--user", "verify", str(unit)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert res.returncode == 0, f"systemd-analyze --user verify failed: {res.stderr}"

    opt_dir = OPT_DIR / "hermes-webchat"
    assert opt_dir.is_dir(), f"Missing chroot opt dir: {opt_dir}"
    expected_files = {"server.py", "index.html", "app.js", "app.css", "favicon.svg", "README.md", "LICENSE"}
    present_files = {p.name for p in opt_dir.iterdir() if p.is_file()}
    assert expected_files.issubset(present_files), f"Missing chroot /opt/hermes-webchat files: {expected_files - present_files}"
    assert not (opt_dir / "__pycache__").exists(), "Stale __pycache__ found in chroot /opt/hermes-webchat"
    assert not (opt_dir / ".git").exists(), ".git directory must not be mirrored into chroot /opt/hermes-webchat"
    assert not (opt_dir / "tests").exists(), "tests/ must not be mirrored into chroot /opt/hermes-webchat"
    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 100 * 1024, f"Chroot /opt/hermes-webchat exceeds 100 KB lean budget ({total_bytes} B)"

    wc_bin = BIN_DIR / "hermes-webchat"
    assert wc_bin.is_file(), f"Missing {wc_bin}"
    wc_text = wc_bin.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", wc_text), "Literal /home/ path in chroot hermes-webchat wrapper"
    res_wc = subprocess.run(["python3", str(wc_bin), "--help"], capture_output=True, text=True, check=False)
    assert res_wc.returncode == 0 and "hermes-webchat" in res_wc.stdout, f"hermes-webchat --help failed: {res_wc.stderr}"


def test_hexstrike_chroot_opt_electron_and_cli_parity():
    opt_dir = OPT_DIR / "hexstrike-arsenal"
    assert opt_dir.is_dir(), f"Missing chroot opt dir: {opt_dir}"
    for req in ("server.py", "cli.py", "mcp_server.py", "LICENSE", "README.md"):
        assert (opt_dir / req).is_file(), f"Missing {req} in chroot /opt/hexstrike-arsenal"
    assert (opt_dir / "public" / "index.html").is_file(), "Missing public/index.html in chroot /opt/hexstrike-arsenal"
    assert (opt_dir / "ui" / "src" / "data" / "tools.json").is_file(), "Missing tools.json in chroot /opt/hexstrike-arsenal"
    assert not (opt_dir / "__pycache__").exists(), "Stale __pycache__ found in chroot /opt/hexstrike-arsenal"
    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 1024 * 1024, f"Chroot /opt/hexstrike-arsenal exceeds 1 MiB lean budget ({total_bytes} B)"

    # Hardened legacy Electron /opt/hexstrike-app/main.js
    elec_main = OPT_DIR / "hexstrike-app" / "main.js"
    assert elec_main.is_file(), f"Missing {elec_main}"
    elec_text = elec_main.read_text(encoding="utf-8")
    assert "webSecurity: true" in elec_text, "chroot /opt/hexstrike-app/main.js must enforce webSecurity: true"
    assert "webSecurity: false" not in elec_text, "chroot /opt/hexstrike-app/main.js still has webSecurity: false"
    assert "bash', ['-c'" not in elec_text and 'bash", ["-c"' not in elec_text, "chroot /opt/hexstrike-app/main.js still spawns bash -c"
    assert "nohup " not in elec_text, "chroot /opt/hexstrike-app/main.js still invokes exec nohup"

    # CLI & TUI wrappers parity and zero literal /home/<user> paths
    hx_bin = BIN_DIR / "hexstrike-arsenal"
    hx_alias = BIN_DIR / "hexstrike"
    hx_tui = BIN_DIR / "hexstrike-arsenal-tui"
    assert hx_bin.is_file() and hx_alias.is_file() and hx_tui.is_file()
    assert hx_bin.read_bytes() == hx_alias.read_bytes(), "hexstrike and hexstrike-arsenal chroot wrappers diverged"
    for p in (hx_bin, hx_tui):
        txt = p.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", txt), f"Literal /home/ path in {p.name}"
    res_bash = subprocess.run(["bash", "-n", str(hx_bin)], capture_output=True, text=True, check=False)
    assert res_bash.returncode == 0, f"bash -n failed for hexstrike-arsenal: {res_bash.stderr}"
    res_tui = subprocess.run(["python3", str(hx_tui), "--help"], capture_output=True, text=True, check=False)
    assert res_tui.returncode == 0 and "hexstrike-arsenal-tui" in res_tui.stdout, f"hexstrike-arsenal-tui --help failed: {res_tui.stderr}"


def test_jwt_inspector_guard_chroot_opt_and_cli_parity():
    opt_dir = OPT_DIR / "jwt-inspector-guard"
    assert opt_dir.is_dir(), f"Missing chroot opt dir: {opt_dir}"
    for req in ("server.py", "pyproject.toml", "LICENSE", "README.md"):
        assert (opt_dir / req).is_file(), f"Missing {req} in chroot /opt/jwt-inspector-guard"
    assert (opt_dir / "public" / "index.html").is_file(), "Missing public/index.html in chroot /opt/jwt-inspector-guard"
    assert (opt_dir / "src" / "jwt_inspector_guard" / "ui_server.py").is_file(), "Missing ui_server.py in chroot /opt/jwt-inspector-guard"
    assert not list(opt_dir.rglob("__pycache__")), "Stale __pycache__ found in chroot /opt/jwt-inspector-guard"
    assert not (opt_dir / "tests").exists(), "tests/ must not be mirrored into chroot /opt/jwt-inspector-guard"
    assert not (opt_dir / ".git").exists(), ".git must not be mirrored into chroot /opt/jwt-inspector-guard"
    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 1024 * 1024, f"Chroot /opt/jwt-inspector-guard exceeds 1 MiB lean budget ({total_bytes} B)"

    jwt_bin = BIN_DIR / "jwt-inspector-guard"
    jwt_tui = BIN_DIR / "jwt-inspector-guard-tui"
    assert jwt_bin.is_file() and jwt_tui.is_file()
    for p in (jwt_bin, jwt_tui):
        txt = p.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", txt), f"Literal /home/ path in {p.name}"
    res_cli = subprocess.run(["python3", str(jwt_bin), "--version"], capture_output=True, text=True, check=False)
    assert res_cli.returncode == 0 and "2.6.0" in res_cli.stdout, f"jwt-inspector-guard --version failed: {res_cli.stderr}"
    res_tui = subprocess.run(["python3", str(jwt_tui), "--status"], capture_output=True, text=True, check=False)
    assert res_tui.returncode == 0 and "2.6.0" in res_tui.stdout, f"jwt-inspector-guard-tui --status failed: {res_tui.stderr}"

    desktop = ROOT / "config" / "includes.chroot" / "usr" / "share" / "applications" / "jwt-inspector-guard.desktop"
    assert desktop.is_file(), f"Missing chroot desktop file: {desktop}"
    desk_txt = desktop.read_text(encoding="utf-8")
    assert "/usr/local/bin/jwt-inspector-guard" in desk_txt
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", desk_txt)




