"""Zero-Dependency JSON-RPC 2.0 Stdio MCP Server for Etsy POD Forge (v2.6.0).

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Exposes 6 Print-on-Demand tools over stdio (JSON-RPC 2.0):
  1. pod_list_cadres
  2. pod_generate_canvas
  3. pod_generate_mockup
  4. pod_synthesize_listing
  5. pod_calculate_margins
  6. pod_search_prompts
"""

from __future__ import annotations

import json
import sys
from typing import Any, Dict, List, Optional

from . import __version__
from .canvas_generator import CanvasConfig, CanvasGenerator
from .listing_synthesizer import CADRE_SPECS, VALID_CADRES, ProfitMetrics, synthesize_listing
from .mockup_engine import MockupConfig, MockupEngine
from .prompt_vault import get_all_prompts, get_prompts_by_cadre, search_prompts

PROTOCOL_VERSION = "2024-11-05"

MCP_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "pod_list_cadres",
        "description": "List all 5 Etsy POD Forge cadres with 300-DPI canvas specs, default retail/production economics, Printify blueprint/provider IDs, and Gelato v4 product UIDs.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
    {
        "name": "pod_generate_canvas",
        "description": "Synthesize a 300-DPI RGBA print-ready PNG canvas (or preview) for any of the 5 POD cadres and return dimensions, DPI metadata, and base64 PNG data URI.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cadre": {"type": "string", "enum": sorted(VALID_CADRES), "default": "apparel"},
                "title": {"type": "string", "description": "Primary artwork headline text"},
                "subtitle": {"type": "string", "description": "Optional subtitle text"},
                "names": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of custom botanical/family names",
                },
                "preview": {"type": "boolean", "default": True},
                "include_base64": {"type": "boolean", "default": True},
            },
            "required": ["cadre"],
        },
    },
    {
        "name": "pod_generate_mockup",
        "description": "Composite print artwork onto a 1400x1400 or 1600x1200 lifestyle mockup scene (apparel, mugs, totes, wall_art, crafting) and return JPEG metadata and base64 data URI.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cadre": {"type": "string", "enum": sorted(VALID_CADRES), "default": "apparel"},
                "color": {"type": "string", "default": "sand", "description": "Garment or product colorway"},
                "title": {"type": "string", "description": "Custom artwork headline"},
                "subtitle": {"type": "string", "description": "Optional subtitle text"},
                "names": {"type": "array", "items": {"type": "string"}},
                "include_base64": {"type": "boolean", "default": True},
            },
            "required": ["cadre"],
        },
    },
    {
        "name": "pod_synthesize_listing",
        "description": "Synthesize a compliant Etsy listing kit: <=140-char title, 13 unique <=20-char search tags, 0-100 SEO score, product description, and 2026 margin breakdown.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cadre": {"type": "string", "enum": sorted(VALID_CADRES), "default": "apparel"},
                "title_hook": {"type": "string", "description": "Custom front-loaded title hook"},
                "custom_names": {"type": "string", "description": "Comma-separated personalization names"},
                "retail_price": {"type": "number"},
                "production_cost": {"type": "number"},
                "shipping_charged": {"type": "number", "default": 0.0},
                "shipping_cost": {"type": "number", "default": 0.0},
                "offsite_ads_rate": {"type": "number", "enum": [0, 0.12, 0.15], "default": 0},
            },
            "required": ["cadre"],
        },
    },
    {
        "name": "pod_calculate_margins",
        "description": "Calculate exact 2026 Etsy fees ($0.20 listing + 6.5% transaction + 3%+$0.25 processing + 0%/12%/15% Offsite Ads), net profit, margin %, ROI %, and break-even price.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "retail_price": {"type": "number"},
                "production_cost": {"type": "number"},
                "shipping_charged": {"type": "number", "default": 0.0},
                "shipping_cost": {"type": "number", "default": 0.0},
                "offsite_ads_rate": {"type": "number", "enum": [0, 0.12, 0.15], "default": 0},
            },
            "required": ["retail_price", "production_cost"],
        },
    },
    {
        "name": "pod_search_prompts",
        "description": "Search or filter the curated 53-recipe Etsy POD Prompt Vault by cadre and/or keyword query.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "cadre": {"type": "string", "enum": sorted(VALID_CADRES)},
                "query": {"type": "string", "description": "Keyword search across title, subject, style, tags"},
                "limit": {"type": "integer", "default": 15, "minimum": 1, "maximum": 60},
            },
        },
    },
]


def _validate_cadre(val: Any, default: str = "apparel") -> str:
    if val is None:
        return default
    if not isinstance(val, str):
        raise ValueError("cadre must be a string")
    key = val.strip().lower()
    if key not in VALID_CADRES:
        raise ValueError(f"Unknown cadre '{val}'. Expected one of: {', '.join(sorted(VALID_CADRES))}")
    return key


def execute_tool(name: str, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Execute one of the 6 registered Etsy POD Forge MCP tools."""
    args = arguments if isinstance(arguments, dict) else {}

    if name == "pod_list_cadres":
        return {
            "version": __version__,
            "count": len(CADRE_SPECS),
            "cadres": CADRE_SPECS,
        }

    if name == "pod_generate_canvas":
        cadre = _validate_cadre(args.get("cadre", "apparel"))
        preview = bool(args.get("preview", True))
        cfg = CanvasConfig.default_for_cadre(cadre, preview=preview)
        if args.get("title"):
            cfg.title_text = str(args["title"])[:160]
        if args.get("subtitle"):
            cfg.subtitle_text = str(args["subtitle"])[:160]
        names = args.get("names")
        if isinstance(names, str):
            cfg.custom_names = [n.strip() for n in names.split(",") if n.strip()][:8]
        elif isinstance(names, list):
            cfg.custom_names = [str(n).strip() for n in names if str(n).strip()][:8]
        gen = CanvasGenerator(cfg)
        raw = gen.generate_bytes(format="PNG")
        res: Dict[str, Any] = {
            "cadre": cadre,
            "width": cfg.width,
            "height": cfg.height,
            "dpi": cfg.dpi,
            "mode": "RGBA",
            "bytes": len(raw),
            "is_preview": preview,
        }
        if args.get("include_base64", True):
            import base64
            res["image_b64"] = "data:image/png;base64," + base64.b64encode(raw).decode("utf-8")
        return res

    if name == "pod_generate_mockup":
        cadre = _validate_cadre(args.get("cadre", "apparel"))
        color = str(args.get("color", "sand"))[:32]
        canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
        if args.get("title"):
            canvas_cfg.title_text = str(args["title"])[:160]
        if args.get("subtitle"):
            canvas_cfg.subtitle_text = str(args["subtitle"])[:160]
        names = args.get("names")
        if isinstance(names, str):
            canvas_cfg.custom_names = [n.strip() for n in names.split(",") if n.strip()][:8]
        elif isinstance(names, list):
            canvas_cfg.custom_names = [str(n).strip() for n in names if str(n).strip()][:8]
        art = CanvasGenerator(canvas_cfg).generate()
        mock_cfg = MockupConfig.default_for_cadre(cadre)
        mock_cfg.product_color = color
        engine = MockupEngine(mock_cfg)
        raw = engine.composite_bytes(art, format="JPEG")
        res = {
            "cadre": cadre,
            "color": color,
            "width": mock_cfg.width,
            "height": mock_cfg.height,
            "format": "JPEG",
            "bytes": len(raw),
        }
        if args.get("include_base64", True):
            import base64
            res["mockup_b64"] = "data:image/jpeg;base64," + base64.b64encode(raw).decode("utf-8")
        return res

    if name == "pod_synthesize_listing":
        cadre = _validate_cadre(args.get("cadre", "apparel"))
        kit = synthesize_listing(
            cadre=cadre,
            custom_title_hook=str(args["title_hook"])[:140] if args.get("title_hook") else None,
            custom_names=str(args["custom_names"])[:200] if args.get("custom_names") else None,
            retail_price=float(args["retail_price"]) if args.get("retail_price") is not None else None,
            production_cost=float(args["production_cost"]) if args.get("production_cost") is not None else None,
            shipping_charged=float(args.get("shipping_charged", 0.0)),
            shipping_cost=float(args.get("shipping_cost", 0.0)),
            offsite_ads_rate=float(args.get("offsite_ads_rate", 0.0)),
        )
        return {
            "listing": kit.to_dict(),
            "invariant_errors": kit.validate_invariants(),
            "compliant": len(kit.validate_invariants()) == 0,
        }

    if name == "pod_calculate_margins":
        if "retail_price" not in args or "production_cost" not in args:
            raise ValueError("retail_price and production_cost are required")
        metrics = ProfitMetrics.calculate(
            retail=float(args["retail_price"]),
            production=float(args["production_cost"]),
            shipping_charged=float(args.get("shipping_charged", 0.0)),
            shipping_cost=float(args.get("shipping_cost", 0.0)),
            offsite_ads_rate=float(args.get("offsite_ads_rate", 0.0)),
        )
        return metrics.to_dict()

    if name == "pod_search_prompts":
        cadre_arg = args.get("cadre")
        query = str(args.get("query", "")).strip()
        limit = max(1, min(60, int(args.get("limit", 15))))
        if cadre_arg:
            cadre_key = _validate_cadre(cadre_arg)
            pool = get_prompts_by_cadre(cadre_key)
        else:
            pool = get_all_prompts()
        if query:
            q_low = query.lower()
            pool = [
                p for p in pool
                if q_low in p.title.lower()
                or q_low in p.subject.lower()
                or q_low in p.style.lower()
                or any(q_low in t.lower() for t in p.tags)
            ]
        return {
            "count": len(pool[:limit]),
            "total_matched": len(pool),
            "total_available": len(get_all_prompts()),
            "prompts": [p.to_dict() for p in pool[:limit]],
        }

    raise KeyError(f"Unknown MCP tool: {name}")


def handle_jsonrpc_message(msg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Process one JSON-RPC 2.0 request and return a response dict (or None for notifications)."""
    method = msg.get("method")
    req_id = msg.get("id")
    params = msg.get("params") or {}

    if method == "notifications/initialized" or (req_id is None and str(method or "").startswith("notifications/")):
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "etsy-pod-forge",
                    "version": __version__,
                },
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {"tools": MCP_TOOLS_DEFINITIONS},
        }

    if method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments") or {}
        try:
            result = execute_tool(str(tool_name), tool_args)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps(result, indent=2)}],
                    "isError": False,
                },
            }
        except KeyError as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": str(exc)},
            }
        except Exception as exc:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": json.dumps({"error": str(exc)})}],
                    "isError": True,
                },
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def run_stdio_server() -> int:
    """Run newline-delimited JSON-RPC 2.0 MCP server on stdin/stdout."""
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError as exc:
            err = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {exc}"},
            }
            sys.stdout.write(json.dumps(err) + "\n")
            sys.stdout.flush()
            continue

        if not isinstance(msg, dict):
            err = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32600, "message": "Invalid Request: expected JSON object"},
            }
            sys.stdout.write(json.dumps(err) + "\n")
            sys.stdout.flush()
            continue

        resp = handle_jsonrpc_message(msg)
        if resp is not None:
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(run_stdio_server())
