#!/usr/bin/env python3
import os
import stat

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
bin_dir = os.path.join(ROOT_DIR, "config/includes.chroot/usr/local/bin")

tools = [
    {
        "name": "claude",
        "title": "Anthropic Claude Code",
        "tagline": "ANTHROPIC CLAUDE CODE CLI HARNESS",
        "ascii": r"""   ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗
  ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝
  ██║     ██║     ███████║██║   ██║██║  ██║█████╗  
  ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  
  ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗
   ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝""",
        "candidates": [
            "~/.local/bin/claude",
            "~/.local/bin/claude-code",
            "~/.npm-global/bin/claude",
            "~/.claude/bin/claude",
            "/usr/local/bin/claude-code",
            "/usr/bin/claude",
            "/usr/bin/claude-code"
        ],
        "check_names": ["claude-code", "claude"],
        "node_pkg": "~/.local/lib/node_modules/@anthropic-ai/claude-code/cli.mjs",
        "install_cmd": "mkdir -p ~/.local/bin && (npm install -g --prefix ~/.local @anthropic-ai/claude-code || curl -fsSL https://claude.ai/install.sh | bash)",
        "install_desc": "npm install -g @anthropic-ai/claude-code (or curl https://claude.ai/install.sh)"
    },
    {
        "name": "opencode",
        "title": "OpenCode AI Pair",
        "tagline": "OPEN-SOURCE AUTONOMOUS CODING ENGINE & CLI",
        "ascii": r"""   ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║   ██║██║  ██║█████╗  
  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║   ██║██║  ██║██╔══╝  
  ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗╚██████╔╝██████╔╝███████╗
   ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝""",
        "candidates": [
            "~/.local/bin/opencode",
            "~/.npm-global/bin/opencode",
            "/opt/zothos-ai-env/bin/opencode",
            "/usr/local/bin/opencode-cli",
            "/usr/bin/opencode"
        ],
        "check_names": ["opencode-cli", "opencode"],
        "node_pkg": "",
        "install_cmd": "pip install --user --upgrade opencode-ai || npm install -g --prefix ~/.local opencode-ai",
        "install_desc": "pip install --user opencode-ai / npm install -g opencode-ai"
    },
    {
        "name": "grok",
        "title": "xAI Grok CLI",
        "tagline": "xAI GROK INTELLIGENCE CONSOLE & CLI",
        "ascii": r"""   ██████╗ ██████╗  ██████╗ ██╗  ██╗
  ██╔════╝ ██╔══██╗██╔═══██╗██║ ██╔╝
  ██║  ███╗██████╔╝██║   ██║█████═╝ 
  ██║   ██║██╔══██╗██║   ██║██  ██╗ 
  ╚██████╔╝██║  ██║╚██████╔╝██║ ██╗
   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝""",
        "candidates": [
            "~/.local/bin/grok",
            "~/.grok/bin/grok",
            "~/.npm-global/bin/grok",
            "/usr/local/bin/grok-cli",
            "/usr/bin/grok"
        ],
        "check_names": ["grok-cli", "grok"],
        "node_pkg": "",
        "install_cmd": "mkdir -p ~/.local/bin && (npm install -g --prefix ~/.local @xai/grok-cli || pip install --user --upgrade xai-grok)",
        "install_desc": "npm install -g @xai/grok-cli / pip install xai-grok"
    },
    {
        "name": "agy",
        "title": "Google Antigravity SDK",
        "tagline": "GOOGLE ANTIGRAVITY AUTONOMOUS AGENT HARNESS",
        "ascii": r"""    █████╗  ██████╗ ██╗   ██╗
   ██╔══██╗██╔════╝ ██║   ██║
   ███████║██║  ███╗██║   ██║
   ██╔══██║██║   ██║██║   ██║
   ██║  ██║╚██████╔╝╚██████╔╝
   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ """,
        "candidates": [
            "~/.local/bin/agy",
            "~/.local/bin/antigravity",
            "~/.npm-global/bin/agy",
            "/usr/local/bin/agy-cli",
            "/usr/bin/agy"
        ],
        "check_names": ["agy-cli", "antigravity", "agy"],
        "node_pkg": "",
        "install_cmd": "mkdir -p ~/.local/bin && (npm install -g --prefix ~/.local @google/antigravity-sdk || pip install --user --upgrade google-antigravity)",
        "install_desc": "npm install -g @google/antigravity-sdk / pip install google-antigravity"
    },
    {
        "name": "aider",
        "title": "Aider AI Coding Agent",
        "tagline": "AIDER AI PAIR PROGRAMMING IN THE TERMINAL",
        "ascii": r"""    █████╗ ██╗██████╗ ███████╗██████╗ 
   ██╔══██╗██║██╔══██╗██╔════╝██╔══██╗
   ███████║██║██║  ██║█████╗  ██████╔╝
   ██╔══██║██║██║  ██║██╔══╝  ██╔══██╗
   ██║  ██║██║██████╔╝███████╗██║  ██║
   ╚═╝  ╚═╝╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝""",
        "candidates": [
            "~/.local/bin/aider",
            "~/.local/share/uv/tools/aider-chat/bin/aider",
            "/opt/zothos-ai-env/bin/aider",
            "/usr/local/bin/aider-cli",
            "/usr/bin/aider"
        ],
        "check_names": ["aider-cli", "aider"],
        "node_pkg": "",
        "install_cmd": "pip install --user --upgrade aider-chat || /opt/zothos-ai-env/bin/pip install --upgrade aider-chat",
        "install_desc": "pip install --user aider-chat"
    },
    {
        "name": "cline",
        "title": "Cline Autonomous Agent",
        "tagline": "CLINE.BOT AUTONOMOUS CODING AGENT & CLI",
        "ascii": r"""    ██████╗██╗     ██╗███╗   ██╗███████╗
   ██╔════╝██║     ██║████╗  ██║██╔════╝
   ██║     ██║     ██║██╔██╗ ██║█████╗  
   ██║     ██║     ██║██║╚██╗██║██╔══╝  
   ╚██████╗███████╗██║██║ ╚████║███████╗
    ╚═════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝""",
        "candidates": [
            "~/.local/bin/cline",
            "~/.npm-global/bin/cline",
            "/usr/local/bin/cline-cli",
            "/usr/bin/cline"
        ],
        "check_names": ["cline-cli", "cline"],
        "node_pkg": "",
        "install_cmd": "mkdir -p ~/.local/bin && npm install -g --prefix ~/.local cline",
        "install_desc": "npm install -g cline"
    },
    {
        "name": "codex",
        "title": "OpenAI Codex Agent",
        "tagline": "OPENAI CODEX AUTONOMOUS ARCHITECTURE HARNESS",
        "ascii": r"""    ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗
   ██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝
   ██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ 
   ██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ 
   ╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗
    ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝""",
        "candidates": [
            "~/.local/bin/codex",
            "~/.npm-global/bin/codex",
            "/usr/local/bin/codex-cli",
            "/usr/bin/codex"
        ],
        "check_names": ["codex-cli", "codex"],
        "node_pkg": "",
        "install_cmd": "mkdir -p ~/.local/bin && (npm install -g --prefix ~/.local @openai/codex || pip install --user --upgrade openai-codex)",
        "install_desc": "npm install -g @openai/codex / pip install openai-codex"
    }
]

template_body = '''#!/usr/bin/env python3
"""
[+] ZOTHOS __TITLE__ Sovereign Agent Workstation v3.0
Official Terminal CLI Harness
"""

import os
import sys
import shutil
import subprocess

GREEN = "\\033[38;2;0;255;157m"
GOLD = "\\033[38;2;255;215;0m"
CYAN = "\\033[38;2;0;229;255m"
RED = "\\033[38;2;255;51;85m"
GRAY = "\\033[38;2;120;140;160m"
BOLD = "\\033[1m"
RESET = "\\033[0m"

TOOL_NAME = "__TITLE__"
BIN_CANDIDATES = __CANDIDATES__
CHECK_NAMES = __CHECK_NAMES__
NODE_PKG = "__NODE_PKG__"
INSTALL_CMD = "__INSTALL_CMD__"
INSTALL_DESC = "__INSTALL_DESC__"

def find_real_binary():
    self_path = os.path.realpath(sys.argv[0])
    for p in BIN_CANDIDATES:
        path = os.path.expanduser(p)
        if os.path.isfile(path) and os.access(path, os.X_OK):
            if os.path.realpath(path) != self_path:
                return path

    for name in CHECK_NAMES:
        found = shutil.which(name)
        if found and os.path.realpath(found) != self_path:
            return found

    if NODE_PKG:
        npm_pkg = os.path.expanduser(NODE_PKG)
        if os.path.isfile(npm_pkg):
            return npm_pkg

    return None

def get_version(bin_path):
    if not bin_path:
        return None
    try:
        cmd = [bin_path, "--version"] if not bin_path.endswith(".mjs") else ["node", bin_path, "--version"]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
        out = (res.stdout or res.stderr).strip().split("\\n")[0]
        return out if out else "Verified"
    except Exception:
        return "Verified"

def banner():
    os.system("clear" if os.name == "posix" else "cls")
    print(f"{GOLD}{BOLD}")
    print(r"""__ASCII__""")
    print(f"         {CYAN}[+] __TAGLINE__ [+]{RESET}\\n")

def run_cli(real_bin, args):
    if not real_bin:
        print(f"\\n{RED}[!] {TOOL_NAME} is not installed yet.{RESET}")
        print(f"    Please install it using option [2] in the menu or run: {sys.argv[0]} install\\n")
        sys.exit(1)

    print(f"{GREEN}[*] Launching {TOOL_NAME} CLI ({real_bin})...{RESET}\\n")
    if real_bin.endswith(".mjs"):
        cmd = ["node", real_bin] + args
        os.execvp("node", cmd)
    else:
        cmd = [real_bin] + args
        os.execvp(real_bin, cmd)

def install_or_update():
    banner()
    real_bin = find_real_binary()
    if real_bin:
        ver = get_version(real_bin)
        print(f"{GREEN}{BOLD}[✓] VERIFIED & INSTALLED:{RESET} {real_bin}")
        print(f"    Version: {CYAN}{ver}{RESET}\\n")
        ans = input(f"Would you like to reinstall or update from official sources? [y/N]: ").strip().lower()
        if ans not in ["y", "yes"]:
            print(f"\\n{GRAY}[*] Operation canceled. Existing installation preserved.{RESET}")
            input(f"\\n{GRAY}Press Enter to return to menu...{RESET}")
            return

    print(f"\\n{GOLD}[*] Installing official {TOOL_NAME}...{RESET}")
    print(f"{GRAY}Running: {INSTALL_DESC}{RESET}\\n")

    res = os.system(INSTALL_CMD)

    new_bin = find_real_binary()
    if new_bin:
        ver = get_version(new_bin)
        print(f"\\n{GREEN}{BOLD}[✓] SUCCESS: {TOOL_NAME} IS VERIFIED & INSTALLED!{RESET}")
        print(f"    Binary Path: {CYAN}{new_bin}{RESET}")
        print(f"    Version:     {CYAN}{ver}{RESET}\\n")
    else:
        if res == 0:
            print(f"\\n{GREEN}[✓] Installation completed successfully.{RESET}")
        else:
            print(f"\\n{RED}[!] Installation exited with code {res}. Please check network or dependencies.{RESET}")

    input(f"\\n{GRAY}Press Enter to return to menu...{RESET}")

def main():
    args = sys.argv[1:]

    # If explicit CLI arguments or subcommands provided:
    if args:
        if args[0] in ["install", "--install"]:
            install_or_update()
            return
        real_bin = find_real_binary()
        if real_bin:
            run_cli(real_bin, args)
        else:
            banner()
            print(f"{RED}[!] {TOOL_NAME} is not installed yet.{RESET}")
            if not sys.stdin.isatty():
                print(f"{GRAY}Run '{sys.argv[0]} install' to install official package.{RESET}")
                sys.exit(1)
            ans = input(f"Would you like to install official {TOOL_NAME} now? [Y/n]: ").strip().lower()
            if ans in ["", "y", "yes"]:
                install_or_update()
                new_bin = find_real_binary()
                if new_bin:
                    run_cli(new_bin, args)
            sys.exit(1)

    # Interactive Menu (Terminal or Desktop launcher)
    while True:
        banner()
        real_bin = find_real_binary()

        print(f"{BOLD}══════════════════════════════════════════════════════════════════════{RESET}")
        if real_bin:
            ver = get_version(real_bin)
            print(f"  {GREEN}{BOLD}[✓] STATUS: VERIFIED & INSTALLED{RESET}")
            print(f"      {GRAY}Path:{RESET}    {CYAN}{real_bin}{RESET}")
            print(f"      {GRAY}Version:{RESET} {ver}")
        else:
            print(f"  {RED}{BOLD}[!] STATUS: NOT INSTALLED{RESET}")
            print(f"      {GRAY}Official {TOOL_NAME} package required.{RESET}")
            print(f"      {GRAY}Select option [2] below to install.{RESET}")
        print(f"{BOLD}══════════════════════════════════════════════════════════════════════{RESET}\\n")

        print(f"  {BOLD}{GOLD}[1]{RESET}  {BOLD}Launch {TOOL_NAME} CLI{RESET}               {GRAY}(Runs official terminal tool){RESET}")
        print(f"  {BOLD}{CYAN}[2]{RESET}  {BOLD}Install / Verify / Update Package{RESET}  {GRAY}({INSTALL_DESC}){RESET}")
        print(f"  {BOLD}{GRAY}[0]{RESET}  {BOLD}Exit{RESET}\\n")

        try:
            choice = input(f"Select option [1-2, 0]: ").strip()
            if choice == "1":
                if real_bin:
                    run_cli(real_bin, [])
                else:
                    print(f"\\n{RED}[!] {TOOL_NAME} is not installed yet.{RESET}")
                    ans = input(f"Install now? [Y/n]: ").strip().lower()
                    if ans in ["", "y", "yes"]:
                        install_or_update()
            elif choice == "2":
                install_or_update()
            elif choice in ["0", "q", "Q", "exit"]:
                break
        except (KeyboardInterrupt, EOFError):
            print("\\n")
            break

if __name__ == "__main__":
    main()
'''

for tool in tools:
    code = template_body
    code = code.replace("__TITLE__", tool["title"])
    code = code.replace("__TAGLINE__", tool["tagline"])
    code = code.replace("__ASCII__", tool["ascii"])
    code = code.replace("__CANDIDATES__", repr(tool["candidates"]))
    code = code.replace("__CHECK_NAMES__", repr(tool["check_names"]))
    code = code.replace("__NODE_PKG__", tool["node_pkg"])
    code = code.replace("__INSTALL_CMD__", tool["install_cmd"])
    code = code.replace("__INSTALL_DESC__", tool["install_desc"])

    target = os.path.join(bin_dir, tool["name"])
    with open(target, "w") as f:
        f.write(code)
    os.chmod(target, stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)
    print(f"[✓] Created {target}")

# Create symlink antigravity -> agy
antigravity_link = os.path.join(bin_dir, "antigravity")
if os.path.exists(antigravity_link) or os.path.islink(antigravity_link):
    os.remove(antigravity_link)
os.symlink("agy", antigravity_link)
print(f"[✓] Created symlink {antigravity_link} -> agy")
