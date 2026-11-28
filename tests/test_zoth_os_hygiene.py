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


def test_zoth_gdrive_backup_never_syncs_konsole_relay_secrets():
    backup_script = BIN_DIR / "zoth-gdrive-backup"
    assert backup_script.is_file(), f"Missing {backup_script}"
    text = backup_script.read_text(encoding="utf-8")
    res_bash = subprocess.run(["bash", "-n", str(backup_script)], capture_output=True, text=True, check=False)
    assert res_bash.returncode == 0, f"bash -n failed for zoth-gdrive-backup: {res_bash.stderr}"

    active_lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    for line in active_lines:
        assert ".config/konsole-relay" not in line, (
            f"zoth-gdrive-backup must NEVER sync ~/.config/konsole-relay: {line}"
        )
        assert "konsole-relay/token" not in line, (
            f"zoth-gdrive-backup must NEVER sync konsole-relay/token: {line}"
        )


def test_konsole_relay_chroot_unit_opt_cli_and_vault_parity():
    unit = ROOT / "config" / "includes.chroot" / "etc" / "systemd" / "user" / "konsole-relay.service"
    assert unit.is_file(), f"Missing chroot user unit: {unit}"
    text = unit.read_text(encoding="utf-8")

    assert not re.search(r"/home/[a-zA-Z0-9._-]+", text), "Literal /home/<user> path in konsole-relay.service"
    assert "ConditionPathExists=/opt/konsole-relay/konsole_relay.py" in text
    assert "ExecStart=/usr/bin/python3 /opt/konsole-relay/konsole_relay.py serve --port 8797" in text
    assert "Restart=on-failure" in text
    assert "RestartSec=3" in text
    assert "SyslogIdentifier=konsole-relay" in text
    assert "Documentation=https://github.com/1nc0gn30/konsole-relay" in text
    assert "UMask=0077" in text
    assert "NoNewPrivileges=yes" in text
    assert "PrivateTmp=yes" in text
    assert "MemoryHigh=64M" in text
    assert "MemoryMax=128M" in text
    assert "CPUQuota=50%" in text

    res = subprocess.run(
        ["systemd-analyze", "--user", "verify", str(unit)],
        capture_output=True,
        text=True,
        check=False,
    )
    assert res.returncode == 0, f"systemd-analyze --user verify failed: {res.stderr}"

    opt_dir = OPT_DIR / "konsole-relay"
    assert opt_dir.is_dir(), f"Missing chroot opt dir: {opt_dir}"
    for req in ("konsole_relay.py", "konsole-relay", "README.md", "LICENSE"):
        assert (opt_dir / req).is_file(), f"Missing {req} in chroot /opt/konsole-relay"
    assert not list(opt_dir.rglob("__pycache__")), "Stale __pycache__ found in chroot /opt/konsole-relay"
    assert not list(opt_dir.rglob("*.pyc")), "Stale .pyc found in chroot /opt/konsole-relay"
    assert not (opt_dir / ".git").exists(), ".git must not be mirrored into chroot /opt/konsole-relay"
    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 100 * 1024, f"Chroot /opt/konsole-relay exceeds 100 KB lean budget ({total_bytes} B)"

    kr_bin = BIN_DIR / "konsole-relay"
    assert kr_bin.is_file(), f"Missing {kr_bin}"
    assert kr_bin.read_bytes() == (opt_dir / "konsole-relay").read_bytes(), "chroot CLI wrapper diverged from /opt/konsole-relay"
    kr_text = kr_bin.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", kr_text), "Literal /home/ path in konsole-relay wrapper"
    res_bash = subprocess.run(["bash", "-n", str(kr_bin)], capture_output=True, text=True, check=False)
    assert res_bash.returncode == 0, f"bash -n failed for konsole-relay wrapper: {res_bash.stderr}"

    vault_base = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault" / "OS"
    for rel in ("Daemons/Daemon konsole-relay.md", "CLIs/CLI konsole-relay.md"):
        vp = vault_base / rel
        assert vp.is_file(), f"Missing chroot Vault note: {vp}"
        vtxt = vp.read_text(encoding="utf-8")
        assert not re.search(r"(?<![A-Za-z0-9_-])/home/(?!\.config)[a-zA-Z0-9._-]+", vtxt), f"Literal /home/ path in Vault note {rel}"
        assert "zoth-gdrive-backup" in vtxt or "cloud" in vtxt.lower()


def test_likeness_desk_chroot_privacy_opt_cli_desktop_and_vault_parity():
    opt_dir = OPT_DIR / "likeness-desk"
    assert opt_dir.is_dir(), f"Missing chroot opt dir: {opt_dir}"

    # CRITICAL P0 REGRESSION GUARD: Never leak personal biometric media into ISO chroot /opt/likeness-desk/data/
    biometric_exts = {".jpg", ".jpeg", ".png", ".wav", ".webm", ".mp4", ".ogg", ".flac", ".m4a"}
    data_dir = opt_dir / "data"
    if data_dir.exists():
        leaked = [
            str(p.relative_to(opt_dir))
            for p in data_dir.rglob("*")
            if p.is_file() and (p.suffix.lower() in biometric_exts or p.name == "profile.json")
        ]
        assert not leaked, f"Personal biometric data leaked into chroot /opt/likeness-desk/data/: {leaked}"

    # Zero preview media or unused 45 MiB public/assets bloat in chroot
    assert not (opt_dir / "public" / "assets").exists(), "Unused public/assets bloat found in chroot /opt/likeness-desk"
    for leaked_prev in ("preview.txt", "preview.ready", "preview.face", "preview.wav", "preview.mp4"):
        assert not (opt_dir / "public" / leaked_prev).exists(), f"Leaked {leaked_prev} in chroot /opt/likeness-desk/public"

    for req in ("server.js", "LICENSE", "package.json", "README.md", "netlify.toml", "likeness-desk.desktop"):
        assert (opt_dir / req).is_file(), f"Missing {req} in chroot /opt/likeness-desk"
    for pub_req in ("index.html", "style.css", "app.js", "og-image.png", "icon.png", "robots.txt", "sitemap.xml", "llms.txt"):
        assert (opt_dir / "public" / pub_req).is_file(), f"Missing public/{pub_req} in chroot /opt/likeness-desk"
    assert (opt_dir / "public" / ".well-known" / "mcp.json").is_file()
    assert (opt_dir / "bin" / "likeness-desk").is_file()
    assert (opt_dir / "bin" / "likeness-desk-tui").is_file()
    assert (opt_dir / "bin" / "likeness-desk-mcp").is_file()
    assert not list(opt_dir.rglob("__pycache__")), "Stale __pycache__ found in chroot /opt/likeness-desk"
    assert not list(opt_dir.rglob("*.pyc")), "Stale .pyc found in chroot /opt/likeness-desk"
    assert not (opt_dir / ".git").exists()

    # Lean size guard (< 1 MiB for code + brand assets without venv/models/third_party)
    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 4 * 1024 * 1024, f"Chroot /opt/likeness-desk exceeds 4 MiB lean budget ({total_bytes} B)"

    # 4-way CLI/TUI chroot parity & zero literal /home/<user> paths
    cli_bin = BIN_DIR / "likeness-desk"
    tui_bin = BIN_DIR / "likeness-desk-tui"
    assert cli_bin.is_file() and tui_bin.is_file()
    assert cli_bin.read_bytes() == (opt_dir / "bin" / "likeness-desk").read_bytes()
    assert tui_bin.read_bytes() == (opt_dir / "bin" / "likeness-desk-tui").read_bytes()
    for p in (cli_bin, tui_bin):
        txt = p.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", txt), f"Literal /home/ path in {p.name}"
    res_ver = subprocess.run(["python3", str(cli_bin), "--version"], capture_output=True, text=True, check=False)
    assert res_ver.returncode == 0 and "2.6.0" in res_ver.stdout
    res_tui = subprocess.run(["python3", str(tui_bin), "--status"], capture_output=True, text=True, check=False)
    assert res_tui.returncode == 0 and "2.6.0" in res_tui.stdout

    # .desktop parity
    desktop = ROOT / "config" / "includes.chroot" / "usr" / "share" / "applications" / "likeness-desk.desktop"
    assert desktop.is_file()
    assert desktop.read_bytes() == (opt_dir / "likeness-desk.desktop").read_bytes()
    desk_txt = desktop.read_text(encoding="utf-8")
    assert "X-Zoth-Media" in desk_txt
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", desk_txt)

    # Vault note parity & zero literal /home/<user> paths
    vault_note = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault" / "Studio" / "Tools" / "Studio likeness-desk.md"
    assert vault_note.is_file()
    vtxt = vault_note.read_text(encoding="utf-8")
    assert "2.6.0" in vtxt and "likeness_status" in vtxt
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", vtxt)


def test_math_pillars_chroot_cli_tui_desktop_opt_and_vault_parity():
    cli_bin = BIN_DIR / "zoth-math-pillar"
    tui_bin = BIN_DIR / "zoth-math-pillar-tui"
    assert cli_bin.is_file() and tui_bin.is_file()

    cli_txt = cli_bin.read_text(encoding="utf-8")
    tui_txt = tui_bin.read_text(encoding="utf-8")
    assert "Neal Frazier Tech (@1nc0gn30) • NullAI Platform" in cli_txt
    assert "--agent" in cli_txt and "parse_agent_arg" in cli_txt
    assert "/api/telemetry" not in tui_txt
    assert "127.0.0.1:9995/active" in tui_txt
    for p in (cli_bin, tui_bin):
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", p.read_text(encoding="utf-8")), f"Literal /home/ path in {p.name}"

    res_cli = subprocess.run(["python3", str(cli_bin), "--agent", "Ollama", "--json"], capture_output=True, text=True, check=False)
    assert res_cli.returncode == 0 and '"selected_agent": "Ollama"' in res_cli.stdout
    assert "Neal Frazier Tech" in res_cli.stdout

    res_tui = subprocess.run(["python3", str(tui_bin), "--help"], capture_output=True, text=True, check=False)
    assert res_tui.returncode == 0 and "127.0.0.1:9995/active" in res_tui.stdout

    desktop = ROOT / "config" / "includes.chroot" / "usr" / "share" / "applications" / "zoth-math-pillar.desktop"
    assert desktop.is_file()
    desk_txt = desktop.read_text(encoding="utf-8")
    assert "Categories=X-Zoth-Security;Utility;System;Monitor;ArtificialIntelligence;Development;" in desk_txt
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", desk_txt)

    opt_index = OPT_DIR / "zoth-math-pillar" / "index.html"
    assert opt_index.is_file()
    opt_html = opt_index.read_text(encoding="utf-8")
    assert "fonts.googleapis.com" not in opt_html, "External Google Fonts egress forbidden in chroot /opt/zoth-math-pillar/index.html"
    assert 'name="viewport"' in opt_html

    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    expected_notes = [
        vault_root / "Studio" / "Workstations" / "Workstation math-pillars.md",
        vault_root / "Studio" / "Pages" / "Page MathPillarsPage.md",
        vault_root / "Studio" / "Pages" / "Page MathPillarDetailPage.md",
        vault_root / "OS" / "CLIs" / "CLI zoth-math-pillar.md",
        vault_root / "OS" / "Desktops" / "Desktop zoth-math-pillar.md",
        vault_root / "Studio" / "Tools" / "Studio zoth-math-pillar.md",
    ]
    for note in expected_notes:
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt), f"Literal /home/ leak in {note.name}"
        assert "/studio/math-pillars.html" not in ntxt, f"Dead legacy path in {note.name}"
        assert "Bourne-Again shell script" not in ntxt, f"Stale CLI type in {note.name}"
        assert "Graph Theory, Chaos Theory" not in ntxt, f"Wrong pillar taxonomy in {note.name}"


def test_maya_linux_chroot_security_bloat_and_parity():
    maya_opt = OPT_DIR / "maya-linux"
    assert maya_opt.is_dir(), "Chroot /opt/maya-linux must exist"
    assert not (maya_opt / "public" / "assets" / "audio").exists(), "Dead commercial MP3s must not be in chroot"
    assert not (maya_opt / "dist" / "assets" / "audio").exists(), "Dead commercial MP3s must not be in dist"
    assert not (maya_opt / "public" / "PresetPreviews").exists(), "Unreferenced PresetPreviews must be purged"
    assert not (maya_opt / "__pycache__").exists(), "__pycache__ must not exist in chroot"
    assert not (maya_opt / "node_modules").exists(), "node_modules must not exist in chroot"
    assert (maya_opt / "LICENSE").is_file(), "MIT LICENSE must exist"

    total_bytes = sum(p.stat().st_size for p in maya_opt.rglob("*") if p.is_file())
    assert total_bytes < 10 * 1024 * 1024, f"Chroot /opt/maya-linux too large: {total_bytes / (1024 * 1024):.2f} MiB"

    main_js = (maya_opt / "main.js").read_text(encoding="utf-8")
    assert "nodeIntegration: false" in main_js
    assert "contextIsolation: true" in main_js
    assert "webSecurity: true" in main_js
    assert "sandbox: true" in main_js
    assert "setWindowOpenHandler" in main_js
    assert "will-navigate" in main_js
    assert "run_ytdlp_" not in main_js
    assert "--no-check-certificates" not in main_js
    assert "before-quit" in main_js

    engine_py = (maya_opt / "maya_motion_engine.py").read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", engine_py), "Literal /home/<user> path in maya_motion_engine.py"
    assert "/tmp/maya_motion_wavs" not in engine_py

    index_html = (maya_opt / "index.html").read_text(encoding="utf-8")
    assert "fonts.googleapis.com" not in index_html
    assert "Content-Security-Policy" in index_html
    assert "SoftwareApplication" in index_html

    cli_bin = BIN_DIR / "maya"
    assert cli_bin.is_file()
    cli_txt = cli_bin.read_text(encoding="utf-8")
    assert 'VERSION="2.0.0"' in cli_txt
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", cli_txt)

    desktop = ROOT / "config" / "includes.chroot" / "usr" / "share" / "applications" / "maya-linux.desktop"
    assert desktop.is_file()

    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    for note in (
        vault_root / "OS" / "CLIs" / "CLI maya.md",
        vault_root / "OS" / "Desktops" / "Desktop maya-linux.md",
    ):
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert "2.0.0" in ntxt
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt)


def test_mcp_lens_chroot_security_bloat_and_parity():
    opt_dir = OPT_DIR / "mcp-lens"
    assert opt_dir.is_dir(), "Chroot /opt/mcp-lens must exist"
    for req in (
        opt_dir / "server.py",
        opt_dir / "electron" / "main.cjs",
        opt_dir / "bin" / "mcp-lens",
        opt_dir / "bin" / "mcp-lens-tui",
        opt_dir / "src" / "mcp_lens" / "mcp_server.py",
        opt_dir / "public" / "index.html",
        opt_dir / "public" / "lens_engine.js",
        opt_dir / "public" / "style.css",
        opt_dir / "public" / "llms.txt",
        opt_dir / "public" / ".well-known" / "mcp.json",
        opt_dir / "LICENSE",
        opt_dir / "README.md",
    ):
        assert req.is_file(), f"Missing required file in chroot /opt/mcp-lens: {req}"

    assert not list(opt_dir.rglob("*.pyc")), "Stale .pyc bytecode must not exist in chroot /opt/mcp-lens"
    assert not list(opt_dir.rglob("gpu-*")), "Unused gpu-* bloat must not exist in chroot /opt/mcp-lens"

    total_bytes = sum(p.stat().st_size for p in opt_dir.rglob("*") if p.is_file())
    assert total_bytes < 1024 * 1024, f"Chroot /opt/mcp-lens exceeds 1 MiB: {total_bytes / 1024:.1f} KiB"

    index_html = (opt_dir / "public" / "index.html").read_text(encoding="utf-8")
    assert "cdn.tailwindcss.com" not in index_html
    assert "fonts.googleapis.com" not in index_html
    assert "onclick=" not in index_html

    engine_js = (opt_dir / "public" / "lens_engine.js").read_text(encoding="utf-8")
    assert ".innerHTML" not in engine_js

    electron_main = (opt_dir / "electron" / "main.cjs").read_text(encoding="utf-8")
    assert "sandbox: true" in electron_main
    assert "before-quit" in electron_main
    assert "detached: false" in electron_main

    cli_bin = BIN_DIR / "mcp-lens"
    tui_bin = BIN_DIR / "mcp-lens-tui"
    assert cli_bin.is_file() and tui_bin.is_file()
    assert cli_bin.read_bytes() == (opt_dir / "bin" / "mcp-lens").read_bytes()
    assert tui_bin.read_bytes() == (opt_dir / "bin" / "mcp-lens-tui").read_bytes()
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", cli_bin.read_text(encoding="utf-8"))
    assert "math.sin" not in tui_bin.read_text(encoding="utf-8")
    assert "canvasui-asciify-lens" not in tui_bin.read_text(encoding="utf-8")

    desktop = ROOT / "config" / "includes.chroot" / "usr" / "share" / "applications" / "mcp-lens.desktop"
    assert desktop.is_file()
    dtxt = desktop.read_text(encoding="utf-8")
    assert "Exec=/usr/local/bin/mcp-lens desktop" in dtxt
    assert "Categories=X-Zoth-Dev;Development;Utility;ArtificialIntelligence;" in dtxt

    unit = ROOT / "config" / "includes.chroot" / "etc" / "systemd" / "system" / "mcp-lens.service"
    assert unit.is_file()
    utxt = unit.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", utxt)
    assert "WorkingDirectory=%h" in utxt

    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    for note in (
        vault_root / "OS" / "CLIs" / "CLI mcp-lens.md",
        vault_root / "Studio" / "Tools" / "Studio mcp-lens.md",
        vault_root / "Studio" / "Workstations" / "Workstation mcp-lens.md",
        vault_root / "OS" / "Units" / "Unit mcp-lens.service.md",
        vault_root / "OS" / "Desktops" / "Desktop zoth-mcp-lens.md",
    ):
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert "2.6.0" in ntxt
        assert "Neal Frazier Tech" in ntxt
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt)


def test_mission_control_vault_parity_and_hygiene():
    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    ws_note = vault_root / "Studio" / "Workstations" / "Workstation mission-control.md"
    legacy_note = vault_root / "Studio" / "Legacy" / "Legacy mission-control.md"
    swarm_page_note = vault_root / "Studio" / "Pages" / "Page SwarmPage.md"

    for note in (ws_note, legacy_note, swarm_page_note):
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt), f"Literal /home/ leak in {note.name}"
        assert "/studio/mission-control.html" not in ntxt, f"Dead /studio/mission-control.html path in {note.name}"

    ws_txt = ws_note.read_text(encoding="utf-8")
    assert "2.5.0" in ws_txt
    assert "/workstations/mission-control" in ws_txt
    assert "/api/studio/mission-control" in ws_txt
    assert "In-App Route:** `/swarm`" not in ws_txt

    leg_txt = legacy_note.read_text(encoding="utf-8")
    assert "/workstations/mission-control" in leg_txt
    assert "Now lives at:** `/swarm`" not in leg_txt

    sp_txt = swarm_page_note.read_text(encoding="utf-8")
    assert "TechnicalReferencePage" in sp_txt
    assert "127.0.0.1:8141" in sp_txt
    assert "SwarmFrameJourney" not in sp_txt


def test_models_console_vault_parity_and_hygiene():
    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    ws_note = vault_root / "Studio" / "Workstations" / "Workstation models.md"
    legacy_note = vault_root / "Studio" / "Legacy" / "Legacy models.md"

    for note in (ws_note, legacy_note):
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt), f"Literal /home/ leak in {note.name}"
        assert "/studio/models.html" not in ntxt, f"Dead /studio/models.html path in {note.name}"

    ws_txt = ws_note.read_text(encoding="utf-8")
    assert "2.4.0" in ws_txt
    assert "/workstations/models" in ws_txt
    assert "/api/studio/models" in ws_txt
    assert "zoth open models" in ws_txt
    assert "Neal Frazier Tech" in ws_txt

    leg_txt = legacy_note.read_text(encoding="utf-8")
    assert "/workstations/models" in leg_txt
    assert "Now lives at:** `/docs`" not in leg_txt


def test_netlify_ax_vault_parity_and_hygiene():
    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    ws_note = vault_root / "Studio" / "Workstations" / "Workstation netlify-ax.md"
    assert ws_note.is_file(), f"Missing chroot Vault note: {ws_note}"
    txt = ws_note.read_text(encoding="utf-8")
    assert not re.search(r"/home/[a-zA-Z0-9._-]+", txt), "Literal /home/ leak in Workstation netlify-ax.md"
    assert "/studio/netlify-ax.html" not in txt, "Dead /studio/netlify-ax.html path in Workstation netlify-ax.md"
    assert "2.4.0" in txt
    assert "/workstations/netlify-ax" in txt
    assert "/api/studio/netlify-ax" in txt
    assert "zoth open netlify-ax" in txt
    assert "Neal Frazier Tech" in txt


def test_netrunner_memory_vault_parity_and_hygiene():
    vault_root = ROOT / "config" / "includes.chroot" / "etc" / "skel" / "Documents" / "Obsidian Vault"
    ws_note = vault_root / "Studio" / "Workstations" / "Workstation netrunner-memory.md"
    legacy_note = vault_root / "Studio" / "Legacy" / "Legacy netrunner-memory.md"
    comp_note = vault_root / "Studio" / "Components" / "Component Netrunner3DWorld.md"

    for note in (ws_note, legacy_note, comp_note):
        assert note.is_file(), f"Missing chroot Vault note: {note}"
        ntxt = note.read_text(encoding="utf-8")
        assert not re.search(r"/home/[a-zA-Z0-9._-]+", ntxt), f"Literal /home/ leak in {note.name}"
        assert "/studio/netrunner-memory.html" not in ntxt, f"Dead /studio/netrunner-memory.html path in {note.name}"

    ws_txt = ws_note.read_text(encoding="utf-8")
    assert "2.4.0" in ws_txt
    assert "/workstations/netrunner-memory" in ws_txt
    assert "/api/studio/netrunner-memory" in ws_txt
    assert "zoth open netrunner-memory" in ws_txt
    assert "python3 -m neuro_memory_daemon.cli serve --port 8094" in ws_txt
    assert "Neal Frazier Tech" in ws_txt

    leg_txt = legacy_note.read_text(encoding="utf-8")
    assert "/workstations/netrunner-memory" in leg_txt
    assert "Now lives at:** `/memory`" not in leg_txt

    comp_txt = comp_note.read_text(encoding="utf-8")
    assert "Retired" in comp_txt
    assert "NetrunnerMemoryHubGodModeTool.jsx" in comp_txt
    assert "Rendered by [[Page MemoryPage" not in comp_txt










