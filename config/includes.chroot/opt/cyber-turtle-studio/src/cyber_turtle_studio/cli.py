"""Cyber Turtle Studio - Sovereign Multi-OS Command Line Interface (CLI).

Pure Python standard library multi-OS CLI for Logo execution, L-System synthesis,
multi-format export (SVG, CNC G-Code, Braille/ASCII), web studio server, diagnostics,
and Model Context Protocol (MCP) server launch.
"""

from __future__ import annotations

import argparse
import http.server
import json
import os
import sys
import threading
import time
import urllib.parse
import webbrowser
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

from .catalog import (
    GLOBAL_REGISTRY,
    generate_pattern,
    get_catalog_summary,
    get_preset,
    list_categories,
    list_presets,
    list_tags,
)
from . import __version__
from .compat import (
    PlatformInfo,
    atomic_write_text,
    get_platform_info,
    normalize_path,
    read_text_safe,
    safe_path,
    sanitize_display_path,
)
from .exporters import (
    ASCIIExporter,
    ASCIIRenderMode,
    GCodeConfig,
    GCodeExporter,
    GCodeToolMode,
    SVGExporter,
    THEMES,
    export_animated_svg,
    export_ascii,
    export_gcode,
    export_svg,
)
from .models import DrawingAST, LSystemConfig, LSystemRule, PatternPreset
from .toolpath_optimizer import ToolpathOptimizer, render_toolpath_comparison_svg
from .truchet_maze import (
    MazeAlgorithm,
    TruchetStyle,
    generate_maze_labyrinth,
    generate_truchet_tiling,
    render_ascii_maze,
)
from .turtle_engine import LogoParser, TurtleEngine, execute_logo

PRESETS = GLOBAL_REGISTRY._presets


# =============================================================================
# Terminal Formatting & Color Styling Helper
# =============================================================================

class Styler:
    """Cross-platform ANSI color formatter with automatic degradation."""

    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled

    def _c(self, code: str, text: str) -> str:
        if not self.enabled:
            return text
        return f"\033[{code}m{text}\033[0m"

    def cyan(self, text: str) -> str:
        return self._c("96", text)

    def green(self, text: str) -> str:
        return self._c("92", text)

    def gold(self, text: str) -> str:
        return self._c("93", text)

    def magenta(self, text: str) -> str:
        return self._c("95", text)

    def blue(self, text: str) -> str:
        return self._c("94", text)

    def red(self, text: str) -> str:
        return self._c("91", text)

    def bold(self, text: str) -> str:
        return self._c("1", text)

    def dim(self, text: str) -> str:
        return self._c("2", text)

    def badge(self, label: str, text: str) -> str:
        return f"{self.bold(self.cyan(f'[{label}]'))} {text}"

    def header(self, title: str) -> str:
        line = "━" * max(40, len(title) + 8)
        return f"\n{self.cyan(line)}\n{self.bold(self.cyan(f'  🐢 {title}'))}\n{self.cyan(line)}"


# =============================================================================
# Helper Utilities
# =============================================================================

def _resolve_input_code(source_or_code: str) -> str:
    """If source_or_code points to an existing file, read it; otherwise treat as code."""
    path = safe_path(source_or_code)
    if path.is_file():
        return read_text_safe(path)
    return source_or_code


def _parse_rules_input(raw_rules: Union[str, Dict[str, Any]]) -> Dict[str, str]:
    """Normalize rule input from either a dictionary or delimited string."""
    if isinstance(raw_rules, dict):
        return {str(k).strip(): str(v).strip() for k, v in raw_rules.items()}

    rules_dict: Dict[str, str] = {}
    rule_str = str(raw_rules).strip()
    if not rule_str:
        return rules_dict

    if rule_str.startswith("{") and rule_str.endswith("}"):
        try:
            parsed = json.loads(rule_str)
            if isinstance(parsed, dict):
                return {str(k).strip(): str(v).strip() for k, v in parsed.items()}
        except Exception:
            pass

    delimiters = [",", "\n", ";"]
    tokens = [rule_str]
    for delim in delimiters:
        new_tokens = []
        for t in tokens:
            new_tokens.extend(t.split(delim))
        tokens = new_tokens

    for token in tokens:
        token = token.strip()
        if not token:
            continue
        if "->" in token:
            parts = token.split("->", 1)
        elif "=" in token:
            parts = token.split("=", 1)
        elif ":" in token:
            parts = token.split(":", 1)
        else:
            continue
        pred = parts[0].strip()
        succ = parts[1].strip()
        if pred:
            rules_dict[pred] = succ

    return rules_dict


# =============================================================================
# CLI Subcommand Implementations
# =============================================================================

def cmd_logo(args: argparse.Namespace, styler: Styler) -> int:
    """Execute Logo code and export output."""
    script = _resolve_input_code(args.script_or_file)
    if not script.strip():
        print(styler.red("Error: Provided Logo script is empty."), file=sys.stderr)
        return 1

    ast = execute_logo(script)
    ast.title = "Logo Script"
    stats = ast.stats()

    if not args.quiet:
        print(styler.header("Logo Code Execution"))
        seg_cnt = stats['total_segments']
        path_len = stats['total_path_length']
        w_val = stats['width']
        h_val = stats['height']
        asp_val = stats['aspect_ratio']
        print(f"  {styler.badge('STATS', f'Segments: {seg_cnt} | Length: {path_len:.1f}px')}")
        print(f"  {styler.badge('BOUNDS', f'{w_val:.1f} x {h_val:.1f} px (aspect {asp_val:.2f})')}")

    out_format = (args.format or "svg").lower()

    if args.output:
        out_path = safe_path(args.output)
        if out_format == "svg" or out_path.suffix.lower() == ".svg":
            export_svg(ast, theme=args.theme, animated=args.animate, stroke_width=args.stroke_width, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved SVG to {out_path}"))
        elif out_format in ("gcode", "cnc") or out_path.suffix.lower() in (".gcode", ".nc"):
            export_gcode(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved G-Code to {out_path}"))
        elif out_format in ("ascii", "txt") or out_path.suffix.lower() == ".txt":
            export_ascii(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved ASCII art to {out_path}"))
        elif out_format in ("json", "ast"):
            atomic_write_text(out_path, ast.to_json(indent=2))
            if not args.quiet:
                print(styler.green(f"  ✔ Saved AST JSON to {out_path}"))
    else:
        if out_format == "ascii":
            print(export_ascii(ast, width=60, height=28, mode="braille"))
        elif out_format == "json":
            print(ast.to_json(indent=2))
        elif out_format == "gcode":
            gcode_txt, _ = export_gcode(ast)
            print(gcode_txt)
        else:
            print("\n" + export_ascii(ast, width=54, height=24, mode="braille"))
            if not args.quiet:
                print(styler.dim("  (Use --output <file.svg> to save full vector markup)"))

    return 0


def cmd_lsystem(args: argparse.Namespace, styler: Styler) -> int:
    """Generate L-System fractal geometry."""
    target = args.preset_or_axiom.strip()
    ast: Optional[DrawingAST] = None

    pid = target.lower().replace("-", "_")
    if pid in PRESETS and not args.rules:
        preset = PRESETS[pid]
        ast = generate_pattern(
            pid,
            iterations=args.iterations,
            step_size=args.step_size,
        )
        title = preset.name
    else:
        rules = _parse_rules_input(args.rules or "")
        if not rules:
            print(styler.red("Error: L-System requires rules (e.g. --rules 'F=F+F-F')"), file=sys.stderr)
            return 1
        from .lsystem_engine import generate_lsystem as _raw_gen
        cfg = LSystemConfig(
            axiom=target,
            rules=rules,
            iterations=args.iterations or 3,
            angle=args.angle or 90.0,
            step_size=args.step_size or 10.0,
            name="Custom L-System",
        )
        ast = _raw_gen(cfg, iterations=cfg.iterations)
        title = "Custom L-System"

    stats = ast.stats()
    if not args.quiet:
        print(styler.header(f"L-System Fractal: {title}"))
        seg_cnt = stats['total_segments']
        path_len = stats['total_path_length']
        w_val = stats['width']
        h_val = stats['height']
        print(f"  {styler.badge('GRAMMAR', f'Segments: {seg_cnt} | Path: {path_len:.1f}px')}")
        print(f"  {styler.badge('BOUNDS', f'{w_val:.1f} x {h_val:.1f} px')}")

    out_format = (args.format or "svg").lower()
    if args.output:
        out_path = safe_path(args.output)
        if out_format == "svg" or out_path.suffix.lower() == ".svg":
            export_svg(ast, theme=args.theme, animated=args.animate, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved SVG to {out_path}"))
        elif out_format == "gcode":
            export_gcode(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved G-Code to {out_path}"))
        elif out_format == "ascii":
            export_ascii(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Saved ASCII art to {out_path}"))
        elif out_format == "json":
            atomic_write_text(out_path, ast.to_json(indent=2))
            if not args.quiet:
                print(styler.green(f"  ✔ Saved JSON AST to {out_path}"))
    else:
        if out_format == "ascii":
            print(export_ascii(ast, width=60, height=28, mode="braille"))
        elif out_format == "json":
            print(ast.to_json(indent=2))
        elif out_format == "gcode":
            gcode_txt, _ = export_gcode(ast)
            print(gcode_txt)
        else:
            print("\n" + export_ascii(ast, width=54, height=24, mode="braille"))

    return 0


def cmd_generate(args: argparse.Namespace, styler: Styler) -> int:
    """Directly generate and export a catalog preset."""
    preset_id = args.preset_id.strip().lower().replace("-", "_")
    try:
        kwargs: Dict[str, Any] = {}
        if args.iterations:
            kwargs["iterations"] = args.iterations
        if args.scale:
            kwargs["step_size"] = args.scale
        ast = generate_pattern(preset_id, **kwargs)
    except Exception as exc:
        print(styler.red(f"Error: {str(exc)}"), file=sys.stderr)
        return 1

    stats = ast.stats()
    if not args.quiet:
        print(styler.header(f"Catalog Preset: {ast.title}"))
        seg_cnt = stats['total_segments']
        path_len = stats['total_path_length']
        print(f"  {styler.badge('METRICS', f'Segments: {seg_cnt} | Length: {path_len:.1f}px')}")

    out_format = (args.format or "svg").lower()
    if args.output:
        out_path = safe_path(args.output)
        if out_format == "svg" or out_path.suffix.lower() == ".svg":
            export_svg(ast, theme=args.theme, animated=args.animate, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported SVG -> {out_path}"))
        elif out_format == "gcode":
            export_gcode(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported G-Code -> {out_path}"))
        elif out_format == "ascii":
            export_ascii(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported ASCII -> {out_path}"))
        elif out_format == "json":
            atomic_write_text(out_path, ast.to_json(indent=2))
            if not args.quiet:
                print(styler.green(f"  ✔ Exported JSON -> {out_path}"))
    else:
        print("\n" + export_ascii(ast, width=54, height=24, mode="braille"))

    return 0


def cmd_presets(args: argparse.Namespace, styler: Styler) -> int:
    """List all available presets with optional filtering."""
    presets = list_presets(category=args.category, tag=args.tag, difficulty=args.difficulty)

    if args.json:
        data = [p.to_dict() for p in presets]
        print(json.dumps(data, indent=2))
        return 0

    print(styler.header(f"Presets Catalog ({len(presets)} Available)"))
    print(f"  {styler.dim('Categories:')} {', '.join(list_categories())}\n")

    current_cat = ""
    for p in presets:
        if p.category != current_cat:
            current_cat = p.category
            print(f"\n{styler.bold(styler.gold(f'── {current_cat} ──'))}")

        tags_str = f" [{', '.join(p.tags[:3])}]" if p.tags else ""
        print(f"  • {styler.cyan(p.id.ljust(24))} {styler.bold(p.name)} ({p.difficulty}){styler.dim(tags_str)}")
        if args.detail:
            print(f"    {styler.dim(p.description)}")
            cfg = p.config
            print(f"    {styler.dim(f'Grammar: axiom={cfg.axiom}, angle={cfg.angle}°, iter={p.recommended_iterations}')}")

    print(f"\n{styler.dim('Tip: Run `cyber-turtle-studio generate <id> -o art.svg` to render any preset.')}")
    return 0


def cmd_gcode(args: argparse.Namespace, styler: Styler) -> int:
    """Export CNC Pen-Plotter / Laser Cutter G-Code."""
    target = args.file_or_preset.strip()
    pid = target.lower().replace("-", "_")

    if pid in PRESETS:
        ast = generate_pattern(pid)
    else:
        script = _resolve_input_code(target)
        ast = execute_logo(script)
        ast.title = "CNC Drawing"

    tool_mode = "laser" if args.laser else "pen_z"
    cfg = GCodeConfig(
        tool_mode=GCodeToolMode(tool_mode),
        draw_feedrate=args.feed,
        travel_feedrate=args.travel_feed,
        pen_up_z=args.z_up,
        pen_down_z=args.z_down,
        bed_width=args.bed_width,
        bed_height=args.bed_height,
    )
    gcode_str, stats = export_gcode(ast, config=cfg)

    if args.output:
        out_path = safe_path(args.output)
        atomic_write_text(out_path, gcode_str)
        if not args.quiet:
            total_l = stats.get('total_lines', len(gcode_str.splitlines()))
            print(styler.green(f"✔ Successfully saved CNC G-Code to {out_path} ({total_l} lines)"))
    else:
        print(gcode_str)

    return 0


def cmd_ascii(args: argparse.Namespace, styler: Styler) -> int:
    """Render direct ASCII / Braille terminal art preview."""
    target = args.preset_or_code.strip()
    pid = target.lower().replace("-", "_")

    if pid in PRESETS:
        ast = generate_pattern(pid)
    else:
        script = _resolve_input_code(target)
        ast = execute_logo(script)
        ast.title = "ASCII Art"

    mode = "ascii" if args.mode == "ascii" else "braille"
    text_art = export_ascii(ast, width=args.width, height=args.height, mode=mode, use_color=styler.enabled)
    print(text_art)
    return 0


def cmd_serve(args: argparse.Namespace, styler: Styler) -> int:
    """Launch the Cyber Turtle Studio Web UI (design influenced by Material 3 tokens)."""
    host = args.host
    port = args.port

    print(styler.header("Cyber Turtle Studio — Web Deck"))
    print(f"  {styler.badge('PORT', f'http://{host}:{port}')}")
    print(f"  {styler.badge('STATUS', 'Interactive Web UI & Realtime SVG Live Stage Ready')}")
    print(f"  {styler.dim('Press Ctrl+C to terminate the local web server.')}\n")

    from .ui_server import start_server
    try:
        start_server(host=host, port=port, open_browser=bool(args.browser))
    except KeyboardInterrupt:
        print(styler.cyan("\n[SHUTDOWN] Studio web server stopped gracefully."))
    return 0


def cmd_mcp(args: argparse.Namespace, styler: Styler) -> int:
    """Run Model Context Protocol server over stdio."""
    from .mcp_server import run_stdio_server
    run_stdio_server()
    return 0


def cmd_diagnostics(args: argparse.Namespace, styler: Styler) -> int:
    """Run system diagnostics and verify multi-OS compatibility."""
    plat = get_platform_info()
    test_path = safe_path(".diag_perm_check.tmp")
    write_ok = False
    try:
        atomic_write_text(test_path, "ok")
        write_ok = test_path.is_file()
        test_path.unlink()
    except Exception:
        write_ok = False

    diag_dict = {
        "os_name": plat.os_name,
        "is_windows": plat.is_windows,
        "is_macos": plat.is_macos,
        "is_linux": plat.is_linux,
        "is_termux": plat.is_termux,
        "python_version": f"{plat.python_version[0]}.{plat.python_version[1]}.{plat.python_version[2]}",
        "supports_ansi_color": plat.supports_ansi_color,
        "supports_unicode": plat.supports_unicode,
        "default_encoding": plat.default_encoding,
        "runtime_root": sanitize_display_path(Path(__file__).resolve().parent.parent.parent),
        "filesystem_write_ok": write_ok,
        "presets_loaded": len(GLOBAL_REGISTRY.list()),
        "available_themes": list(THEMES.keys()),
    }

    if args.json:
        print(json.dumps(diag_dict, indent=2))
        return 0

    print(styler.header("System Diagnostics & Platform Telemetry"))
    print(f"  • Operating System: {styler.cyan(plat.os_name.upper())} (Win={plat.is_windows}, Mac={plat.is_macos}, Lin={plat.is_linux}, Termux={plat.is_termux})")
    py_ver = diag_dict['python_version']
    print(f"  • Python Runtime:   {styler.green(f'Python {py_ver}')}")
    print(f"  • ANSI Color:       {styler.green('Supported' if plat.supports_ansi_color else 'Disabled')}")
    print(f"  • Unicode Braille:  {styler.green('Supported' if plat.supports_unicode else 'Disabled')}")
    print(f"  • Default Encoding: {styler.cyan(plat.default_encoding)}")
    print(f"  • File System I/O:  {styler.green('Atomic Read/Write OK' if write_ok else 'Permission Error')}")
    print(f"  • Preset Catalog:   {styler.gold(f'{len(GLOBAL_REGISTRY.list())} presets registered across {len(list_categories())} categories')}")
    print(f"  • Exporter Themes:  {styler.dim(', '.join(THEMES.keys()))}\n")
    return 0


def cmd_test(args: argparse.Namespace, styler: Styler) -> int:
    """Internal self-verification test runner."""
    print(styler.header("Internal Self-Verification Test Runner"))
    test_cases: List[Tuple[str, Any]] = []

    def t_turtle() -> None:
        t = TurtleEngine(
            start_pos=(0.0, 0.0),
            pen_color="#00ffcc",
            stroke_width=2.0,
        )
        t.forward(100).right(90).forward(100).left(45).backward(50)
        ast = t.get_drawing()
        assert len(ast.segments) >= 3, f"Expected >=3 segments, got {len(ast.segments)}"
        assert ast.stats()["total_drawing_length"] > 0

    def t_logo() -> None:
        ast = execute_logo("repeat 4 [ fd 50 rt 90 ]")
        assert len(ast.segments) >= 4, f"Expected 4 segments, got {len(ast.segments)}"

    def t_lsystem() -> None:
        from .lsystem_engine import generate_lsystem as _raw_gen
        cfg = LSystemConfig(axiom="F", rules={"F": "F+F-F"}, iterations=2, angle=60.0, step_size=10.0)
        ast = _raw_gen(cfg, iterations=2)
        assert len(ast.segments) >= 5, "L-System did not expand"

    def t_exporters() -> None:
        ast = execute_logo("repeat 6 [ fd 40 rt 60 ]")
        svg = export_svg(ast, theme="cyber_matrix", animated=True)
        assert "<svg" in svg and "</svg>" in svg
        gcode, stats = export_gcode(ast)
        assert "G21" in gcode and ("M30" in gcode or "M2" in gcode)
        ascii_art = export_ascii(ast, width=40, height=20, mode="braille")
        assert len(ascii_art) > 50

    def t_catalog() -> None:
        presets = GLOBAL_REGISTRY.list()
        assert len(presets) >= 10, f"Expected >=10 presets, got {len(presets)}"
        p = get_preset("dragon_curve")
        assert p is not None
        ast = generate_pattern("dragon_curve", iterations=4)
        assert len(ast.segments) > 10

    def t_mcp_dispatcher() -> None:
        from .mcp_server import MCPServer
        srv = MCPServer()
        res = srv.process_request({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
        assert res is not None and "tools" in res["result"]
        call_res = srv.process_request({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "turtle_execute_logo", "arguments": {"script": "fd 50"}},
        })
        assert call_res is not None and "content" in call_res["result"]

    test_cases = [
        ("Turtle Core Navigation & State Stack", t_turtle),
        ("Logo DSL Script Parser & Executor", t_logo),
        ("L-System Grammar Fractal Synthesizer", t_lsystem),
        ("Exporters (SVG, CNC G-Code, Braille ASCII)", t_exporters),
        ("Catalog Presets & Pattern Dispatcher", t_catalog),
        ("MCP JSON-RPC 2.0 Protocol Dispatcher", t_mcp_dispatcher),
    ]

    passed = 0
    for name, fn in test_cases:
        try:
            fn()
            print(f"  {styler.green('✔ PASS')} {name}")
            passed += 1
        except Exception as exc:
            print(f"  {styler.red('✖ FAIL')} {name}: {str(exc)}")

    print(f"\n{styler.bold(styler.cyan(f'Result: {passed}/{len(test_cases)} test suites passed successfully.'))}\n")
    return 0 if passed == len(test_cases) else 1


def cmd_optimize(args: argparse.Namespace, styler: Styler) -> int:
    """Optimize drawing toolpath rapid air travel with 2-Opt TSP."""
    if args.script:
        ast = execute_logo(args.script)
    elif args.preset:
        ast = generate_pattern(args.preset)
    else:
        # Default burst test pattern
        ast = execute_logo("REPEAT 8 [ FD 50 PU HOME RT REPCOUNT * 45 PD ]")

    opt = ToolpathOptimizer(
        draw_feedrate_mm_min=args.draw_feed,
        travel_feedrate_mm_min=args.travel_feed,
    )
    opt_ast, report = opt.optimize_toolpath(ast)

    if args.svg:
        svg_code = render_toolpath_comparison_svg(ast, opt_ast)
        atomic_write_text(args.svg, svg_code)
        if not args.quiet:
            print(f"  {styler.green('✔ Exported Toolpath Comparison SVG:')} {args.svg}")

    if args.json:
        print(json.dumps(report.to_dict(), indent=2))
        return 0

    if not args.quiet:
        print(f"\n{styler.bold(styler.cyan('⚡ Pen-Plotter Toolpath Optimization Report (2-Opt TSP)'))}\n")
        print(f"  Polylines Chained       : {styler.bold(str(report.total_polylines))}")
        print(f"  Drawing Distance        : {styler.cyan(f'{report.drawing_distance_mm:.1f} mm')}")
        print(f"  Initial Air Travel      : {styler.red(f'{report.initial_air_travel_mm:.1f} mm')}")
        print(f"  Optimized Air Travel    : {styler.green(f'{report.optimized_air_travel_mm:.1f} mm')}")
        print(f"  Air Travel Reduction    : {styler.bold(styler.green(f'{report.reduction_percent:.1f}%'))}")
        print(f"  Estimated Time (Init)   : {report.estimated_time_initial_sec:.1f}s")
        print(f"  Estimated Time (Opt)    : {styler.green(f'{report.estimated_time_optimized_sec:.1f}s')}")
        print(f"  Toolpath Efficiency     : {styler.bold(f'{report.efficiency_score:.1%}')}\n")
    return 0


def cmd_truchet(args: argparse.Namespace, styler: Styler) -> int:
    """Procedurally generate Truchet tiling patterns."""
    try:
        ast, stats = generate_truchet_tiling(
            rows=args.rows,
            cols=args.cols,
            tile_size=args.tile_size,
            style=args.style,
            seed=args.seed,
            stroke_width=args.stroke_width,
        )
    except Exception as exc:
        print(styler.red(f"Error: {str(exc)}"), file=sys.stderr)
        return 1

    out_format = (args.format or "svg").lower()

    if not args.quiet and out_format != "json":
        print(styler.header(f"Truchet Tiling: {args.style} ({args.rows}x{args.cols})"))
        seg_cnt = stats["total_segments"]
        tot_tiles = stats["total_tiles"]
        r_val = stats["rows"]
        c_val = stats["cols"]
        bw = stats["bounds"]["width"]
        bh = stats["bounds"]["height"]
        print(f"  {styler.badge('TILES', f'{tot_tiles} tiles ({r_val} rows x {c_val} cols)')}")
        print(f"  {styler.badge('STATS', f'Segments: {seg_cnt} | Dimensions: {bw}x{bh}px')}")

    if args.output:
        out_path = safe_path(args.output)
        if out_format == "svg" or out_path.suffix.lower() == ".svg":
            export_svg(ast, theme=args.theme, animated=args.animate, stroke_width=args.stroke_width, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Truchet SVG -> {out_path}"))
        elif out_format == "gcode":
            export_gcode(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Truchet G-Code -> {out_path}"))
        elif out_format == "ascii":
            export_ascii(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Truchet ASCII -> {out_path}"))
        elif out_format == "json":
            atomic_write_text(out_path, json.dumps(stats, indent=2))
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Truchet Metadata JSON -> {out_path}"))
    else:
        if out_format == "json":
            print(json.dumps(stats, indent=2))
        elif out_format == "ascii":
            print(export_ascii(ast, width=60, height=30, mode="braille"))
        else:
            print("\n" + export_ascii(ast, width=54, height=24, mode="braille"))
            if not args.quiet:
                print(styler.dim("  (Use --output <file.svg> to save full vector markup)"))
    return 0


def cmd_maze(args: argparse.Namespace, styler: Styler) -> int:
    """Algorithmic labyrinth maze generator with BFS path solver."""
    try:
        ast, meta = generate_maze_labyrinth(
            rows=args.rows,
            cols=args.cols,
            cell_size=args.cell_size,
            algorithm=args.algo,
            seed=args.seed,
            solve=args.solve,
        )
    except Exception as exc:
        print(styler.red(f"Error: {str(exc)}"), file=sys.stderr)
        return 1

    if args.ascii or args.format == "ascii":
        print(render_ascii_maze(meta))
        return 0

    out_format = (args.format or "svg").lower()

    if not args.quiet and out_format != "json":
        print(styler.header(f"Algorithmic Maze: {meta['algorithm']} ({args.rows}x{args.cols})"))
        w_segs = meta["wall_segments_count"]
        print(f"  {styler.badge('MAZE', f'{args.rows}x{args.cols} cells | Wall Segments: {w_segs}')}")
        if meta.get("solved"):
            sol_len = meta["solution_length"]
            print(f"  {styler.badge('SOLVED', styler.green(f'Solution Path Length: {sol_len} steps'))}")

    out_format = (args.format or "svg").lower()
    if args.output:
        out_path = safe_path(args.output)
        if out_format == "svg" or out_path.suffix.lower() == ".svg":
            export_svg(ast, theme=args.theme, animated=args.animate, stroke_width=max(1.0, args.cell_size * 0.1), file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Maze SVG -> {out_path}"))
        elif out_format == "gcode":
            export_gcode(ast, file_path=out_path)
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Maze G-Code -> {out_path}"))
        elif out_format == "json":
            atomic_write_text(out_path, json.dumps(meta, indent=2))
            if not args.quiet:
                print(styler.green(f"  ✔ Exported Maze Metadata JSON -> {out_path}"))
    else:
        if out_format == "json":
            print(json.dumps(meta, indent=2))
        else:
            print(render_ascii_maze(meta))
            if not args.quiet:
                print(styler.dim("  (Use --output <file.svg> to save full vector markup)"))
    return 0


# =============================================================================
# CLI Main Parser Construction
# =============================================================================

def build_parser() -> argparse.ArgumentParser:
    """Build root argument parser with all subcommands and global flags."""
    parser = argparse.ArgumentParser(
        prog="cyber-turtle-studio",
        description="Cyber Turtle Studio — Sovereign Algorithmic Geometry Engine & MCP Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    # Parent / Global Options
    parser.add_argument("-v", "--version", action="version", version=f"%(prog)s {__version__}")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI color output")
    parser.add_argument("-q", "--quiet", action="store_true", help="Suppress non-essential output")
    parser.add_argument("--status", action="store_true", help="Print service status metadata")
    parser.add_argument("--json", action="store_true", help="Output service status as JSON when no subcommand is given")

    subparsers = parser.add_subparsers(dest="subcommand", title="Commands", help="Available subcommands")

    # 1. logo
    p_logo = subparsers.add_parser("logo", help="Execute Logo script code or file")
    p_logo.add_argument("script_or_file", help="Logo code string or path to .logo script file")
    p_logo.add_argument("-o", "--output", help="Target output file path")
    p_logo.add_argument("-f", "--format", choices=["svg", "gcode", "ascii", "json"], default="svg", help="Output format")
    p_logo.add_argument("-t", "--theme", default="cyber_matrix", help="Visual theme palette")
    p_logo.add_argument("-a", "--animate", action="store_true", help="Enable CSS stroke animation in SVG")
    p_logo.add_argument("--stroke-width", type=float, default=1.5, help="Stroke width in pixels")
    p_logo.add_argument("-w", "--width", type=float, default=800.0, help="Canvas width")
    p_logo.add_argument("-H", "--height", type=float, default=800.0, help="Canvas height")

    # 2. lsystem
    p_ls = subparsers.add_parser("lsystem", help="Generate L-System fractal geometry")
    p_ls.add_argument("preset_or_axiom", help="Axiom string (e.g. 'FX') or preset name (e.g. 'dragon_curve')")
    p_ls.add_argument("-r", "--rules", help="Production rules (e.g. 'F=F+F-F' or 'X=X+YF+,Y=-FX-Y')")
    p_ls.add_argument("-i", "--iterations", type=int, default=3, help="Recursion iteration level")
    p_ls.add_argument("-a", "--angle", type=float, default=90.0, help="Turning angle in degrees")
    p_ls.add_argument("-s", "--step-size", type=float, default=10.0, help="Step forward distance in pixels")
    p_ls.add_argument("-o", "--output", help="Target output file path")
    p_ls.add_argument("-f", "--format", choices=["svg", "gcode", "ascii", "json"], default="svg", help="Output format")
    p_ls.add_argument("-t", "--theme", default="cyber_matrix", help="Visual theme palette")
    p_ls.add_argument("--animate", action="store_true", help="Enable CSS stroke animation in SVG")

    # 3. generate
    p_gen = subparsers.add_parser("generate", help="Generate catalog preset directly")
    p_gen.add_argument("preset_id", help="Preset identifier (e.g. 'koch_snowflake', 'dragon_curve')")
    p_gen.add_argument("-o", "--output", help="Target output file path")
    p_gen.add_argument("-f", "--format", choices=["svg", "gcode", "ascii", "json"], default="svg", help="Output format")
    p_gen.add_argument("-t", "--theme", default="cyber_matrix", help="Visual theme palette")
    p_gen.add_argument("-i", "--iterations", type=int, help="Override default iterations")
    p_gen.add_argument("-s", "--scale", type=float, help="Scale / step size override")
    p_gen.add_argument("-a", "--animate", action="store_true", help="Enable animated SVG output")

    # 4. presets
    p_pre = subparsers.add_parser("presets", help="List all built-in geometric templates")
    p_pre.add_argument("-c", "--category", help="Filter by category")
    p_pre.add_argument("--tag", help="Filter by tag keyword")
    p_pre.add_argument("-d", "--difficulty", help="Filter by difficulty ('Beginner', 'Intermediate', 'Advanced', 'Master')")
    p_pre.add_argument("--json", action="store_true", help="Output JSON array of presets")
    p_pre.add_argument("--detail", action="store_true", help="Display full parameter descriptions")

    # 5. gcode
    p_gc = subparsers.add_parser("gcode", help="Export CNC G-Code for pen-plotter or laser")
    p_gc.add_argument("file_or_preset", help="Preset ID or path to Logo script file")
    p_gc.add_argument("-o", "--output", help="Target .gcode file path")
    p_gc.add_argument("--feed", type=float, default=1200.0, help="Drawing feedrate in mm/min")
    p_gc.add_argument("--travel-feed", type=float, default=3000.0, help="Rapid travel feedrate in mm/min")
    p_gc.add_argument("--z-up", type=float, default=5.0, help="Z height for pen-up travel (mm)")
    p_gc.add_argument("--z-down", type=float, default=0.0, help="Z height for pen-down draw (mm)")
    p_gc.add_argument("--laser", action="store_true", help="Enable laser mode (M3/M5)")
    p_gc.add_argument("--bed-width", type=float, default=210.0, help="Bed width in mm")
    p_gc.add_argument("--bed-height", type=float, default=297.0, help="Bed height in mm")

    # 6. ascii
    p_asc = subparsers.add_parser("ascii", help="Render direct ASCII or Braille terminal art")
    p_asc.add_argument("preset_or_code", help="Preset ID or Logo script code")
    p_asc.add_argument("-m", "--mode", choices=["braille", "ascii"], default="braille", help="Rasterization mode")
    p_asc.add_argument("-w", "--width", type=int, default=60, help="Grid character width")
    p_asc.add_argument("-H", "--height", type=int, default=30, help="Grid character height")

    # 7. serve
    p_srv = subparsers.add_parser("serve", help="Launch Cyber Turtle Studio Web UI")
    p_srv.add_argument("-p", "--port", type=int, default=8129, help="HTTP port (default 8129)")
    p_srv.add_argument("-H", "--host", default="127.0.0.1", help="Bind host (default 127.0.0.1)")
    p_srv.add_argument("--browser", action="store_true", help="Open default web browser automatically")

    # 8. mcp
    subparsers.add_parser("mcp", help="Run Model Context Protocol server over stdio")

    # 9. diagnostics / platform / doctor
    p_diag = subparsers.add_parser("diagnostics", aliases=["platform", "doctor"], help="System diagnostics report")
    p_diag.add_argument("--json", action="store_true", help="Output raw JSON diagnostics")

    # 10. test
    subparsers.add_parser("test", help="Execute internal self-verification test runner")

    # 11. optimize
    p_opt = subparsers.add_parser("optimize", aliases=["toolpath", "tsp"], help="Optimize pen-plotter toolpath rapid air travel with 2-Opt TSP")
    p_opt.add_argument("-s", "--script", help="Logo script code")
    p_opt.add_argument("-p", "--preset", help="Catalog preset ID")
    p_opt.add_argument("--draw-feed", type=float, default=1200.0, help="Drawing feedrate in mm/min")
    p_opt.add_argument("--travel-feed", type=float, default=3000.0, help="Air travel feedrate in mm/min")
    p_opt.add_argument("--svg", help="Output comparison SVG file path")
    p_opt.add_argument("--json", action="store_true", help="Output telemetry as JSON")

    # 12. truchet
    p_truchet = subparsers.add_parser("truchet", help="Procedural Truchet tiling pattern generator")
    p_truchet.add_argument("-r", "--rows", type=int, default=10, help="Number of rows")
    p_truchet.add_argument("-c", "--cols", type=int, default=10, help="Number of columns")
    p_truchet.add_argument("-s", "--tile-size", type=float, default=40.0, help="Tile size in pixels")
    p_truchet.add_argument("--style", choices=["arcs", "diagonal", "concentric_arcs", "cross_line"], default="arcs", help="Truchet pattern style")
    p_truchet.add_argument("--seed", type=int, default=None, help="PRNG seed for deterministic output")
    p_truchet.add_argument("-o", "--output", help="Target output file path")
    p_truchet.add_argument("-f", "--format", choices=["svg", "gcode", "ascii", "json"], default="svg", help="Output format")
    p_truchet.add_argument("-t", "--theme", default="cyber_matrix", help="Visual theme palette")
    p_truchet.add_argument("--stroke-width", type=float, default=2.0, help="Stroke width in pixels")
    p_truchet.add_argument("-a", "--animate", action="store_true", help="Enable CSS stroke animation in SVG")

    # 13. maze
    p_maze = subparsers.add_parser("maze", help="Algorithmic labyrinth maze generator with BFS path solver")
    p_maze.add_argument("-r", "--rows", type=int, default=15, help="Number of maze rows")
    p_maze.add_argument("-c", "--cols", type=int, default=15, help="Number of maze columns")
    p_maze.add_argument("-s", "--cell-size", type=float, default=25.0, help="Maze cell size in pixels")
    p_maze.add_argument("--algo", choices=["recursive_backtracker", "wilson", "braided"], default="recursive_backtracker", help="Maze generation algorithm")
    p_maze.add_argument("--seed", type=int, default=None, help="PRNG seed for deterministic layout")
    p_maze.add_argument("--solve", action="store_true", help="Solve maze using BFS and overlay path")
    p_maze.add_argument("-o", "--output", help="Target output file path")
    p_maze.add_argument("-f", "--format", choices=["svg", "gcode", "ascii", "json"], default="svg", help="Output format")
    p_maze.add_argument("-t", "--theme", default="cyber_matrix", help="Visual theme palette")
    p_maze.add_argument("--ascii", action="store_true", help="Render ASCII terminal maze")
    p_maze.add_argument("-a", "--animate", action="store_true", help="Enable CSS stroke animation in SVG")

    # 14. status
    p_stat = subparsers.add_parser("status", help="Show service status and preset/tool summary")
    p_stat.add_argument("--json", action="store_true", help="Output JSON metadata")

    return parser


def cmd_status(as_json: bool = False) -> int:
    """Print Cyber Turtle Studio status summary."""
    from .mcp_server import MCPServer
    mcp = MCPServer()
    payload = {
        "service": "cyber-turtle-studio",
        "version": __version__,
        "default_host": "127.0.0.1",
        "default_port": 8129,
        "preset_count": len(PRESETS),
        "mcp_tools": [t["name"] for t in mcp.get_tool_definitions()],
    }
    if as_json:
        print(json.dumps(payload, indent=2))
    else:
        print(f"cyber-turtle-studio v{__version__} (127.0.0.1:8129) | presets={payload['preset_count']} | mcp_tools={len(payload['mcp_tools'])}")
    return 0


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Main CLI entry point."""
    parser = build_parser()
    args = parser.parse_args(argv)

    plat = get_platform_info()
    use_color = plat.supports_ansi_color and not args.no_color and "NO_COLOR" not in os.environ
    styler = Styler(enabled=use_color)

    if getattr(args, "status", False) or (getattr(args, "json", False) and not args.subcommand):
        return cmd_status(as_json=getattr(args, "json", False))

    if not args.subcommand:
        parser.print_help()
        return 0

    subcmd = args.subcommand.lower()

    if subcmd == "logo":
        return cmd_logo(args, styler)
    elif subcmd == "lsystem":
        return cmd_lsystem(args, styler)
    elif subcmd == "generate":
        return cmd_generate(args, styler)
    elif subcmd == "presets":
        return cmd_presets(args, styler)
    elif subcmd == "gcode":
        return cmd_gcode(args, styler)
    elif subcmd == "ascii":
        return cmd_ascii(args, styler)
    elif subcmd == "serve":
        return cmd_serve(args, styler)
    elif subcmd == "mcp":
        return cmd_mcp(args, styler)
    elif subcmd in ("diagnostics", "platform", "doctor"):
        return cmd_diagnostics(args, styler)
    elif subcmd == "test":
        return cmd_test(args, styler)
    elif subcmd in ("optimize", "toolpath", "tsp"):
        return cmd_optimize(args, styler)
    elif subcmd == "truchet":
        return cmd_truchet(args, styler)
    elif subcmd == "maze":
        return cmd_maze(args, styler)
    elif subcmd == "status":
        return cmd_status(as_json=getattr(args, "json", False))
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
