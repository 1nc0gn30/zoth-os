"""Console script entrypoints for `fieldkit` and `fieldkit-mcp`."""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path
from typing import List, Optional


def _locate_repo_root() -> Optional[Path]:
    env_dir = os.environ.get("FIELDKIT_REPO_DIR")
    candidates = []
    if env_dir:
        candidates.append(Path(env_dir))
    candidates.append(Path("/opt/fieldkit"))
    candidates.append(Path(__file__).resolve().parents[3])
    for candidate in candidates:
        if (candidate / "mcp" / "fieldkit_mcp_server.py").is_file():
            return candidate
    return None


def _load_script_main(script_path: Path):
    spec = importlib.util.spec_from_file_location("_fieldkit_entry", str(script_path))
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load entrypoint script: {script_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.main


def run_cli(argv: Optional[List[str]] = None) -> int:
    root = _locate_repo_root()
    if root is None:
        sys.stderr.write("fieldkit: unable to locate FieldKit installation (set FIELDKIT_REPO_DIR or install /opt/fieldkit)\n")
        return 1
    main_fn = _load_script_main(root / "cli" / "fieldkit")
    return int(main_fn(argv) or 0)


def run_mcp(argv: Optional[List[str]] = None) -> int:
    root = _locate_repo_root()
    if root is None:
        sys.stderr.write("fieldkit-mcp: unable to locate FieldKit installation (set FIELDKIT_REPO_DIR or install /opt/fieldkit)\n")
        return 1
    main_fn = _load_script_main(root / "mcp" / "fieldkit_mcp_server.py")
    return int(main_fn(argv) or 0)
