#!/usr/bin/env python3
"""Official FieldKit Model Context Protocol (MCP) Server (v2.0.0).

Hardened JSON-RPC 2.0 stdio MCP server wired directly to the FieldKit Python SDK
(Mission DAG, 3D RaycastEvaluator, NearFieldVoiceGate, SovereignBiometricVault)
and canonical YAML mission templates.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
Repository: https://github.com/NullAITech/fieldkit
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


def _resolve_fieldkit_root() -> Path:
    env_dir = os.environ.get("FIELDKIT_REPO_DIR")
    candidates: List[Path] = []
    if env_dir:
        candidates.append(Path(env_dir).resolve())
    opt_root = Path("/opt/fieldkit")
    if opt_root.is_dir():
        candidates.append(opt_root)
    candidates.append(Path(__file__).resolve().parent.parent)
    for candidate in candidates:
        if (candidate / "sdk" / "python" / "fieldkit").is_dir():
            return candidate
    return Path(__file__).resolve().parent.parent


FIELDKIT_ROOT = _resolve_fieldkit_root()
SDK_PYTHON_DIR = FIELDKIT_ROOT / "sdk" / "python"
if SDK_PYTHON_DIR.is_dir() and str(SDK_PYTHON_DIR) not in sys.path:
    sys.path.insert(0, str(SDK_PYTHON_DIR))

from fieldkit import (  # noqa: E402
    HAS_CRYPTO,
    BoundingBox,
    LandmarkPoint,
    Mission,
    NearFieldVoiceGate,
    RaycastEvaluator,
    SovereignBiometricVault,
    StateTransitionError,
    __version__ as SDK_VERSION,
)

SERVER_NAME = "fieldkit-mcp-server"
SERVER_VERSION = "2.0.0"
PROTOCOL_VERSION = "2024-11-05"
MAX_LINE_BYTES = 1_048_576  # 1 MiB stdin line cap
MAX_ACTIVE_MISSIONS = 128

TEMPLATE_FILES: Dict[str, str] = {
    "industrial_pump": "templates/industrial-repair/mission.yaml",
    "tccc_tourniquet": "templates/emergency-medical/mission.yaml",
    "datacenter_sweep": "templates/security-inspection/mission.yaml",
}

RESOURCE_REGISTRY: Dict[str, Dict[str, str]] = {
    "fieldkit://templates/industrial_pump": {
        "name": "Industrial Pump Overhaul Mission (YAML)",
        "description": "480V LOTO & centrifugal pump mechanical seal overhaul mission DAG.",
        "mimeType": "application/x-yaml",
        "rel_path": "templates/industrial-repair/mission.yaml",
    },
    "fieldkit://templates/tccc_tourniquet": {
        "name": "TCCC Limb Hemorrhage Mission (YAML)",
        "description": "Tactical Combat Casualty Care Care Under Fire CAT tourniquet mission DAG.",
        "mimeType": "application/x-yaml",
        "rel_path": "templates/emergency-medical/mission.yaml",
    },
    "fieldkit://templates/datacenter_sweep": {
        "name": "Datacenter Physical Tamper Sweep Mission (YAML)",
        "description": "Cage access, anti-tamper seal inspection, implant sweep, and CRAC audit DAG.",
        "mimeType": "application/x-yaml",
        "rel_path": "templates/security-inspection/mission.yaml",
    },
    "fieldkit://docs/specification": {
        "name": "FieldKit Operating Specification (RFC-FK-001)",
        "description": "Formal FieldKit physical AI operating specification document.",
        "mimeType": "text/markdown",
        "rel_path": "SPECIFICATION.md",
    },
}

_STOPWORDS = frozenset(
    {
        "and",
        "the",
        "for",
        "with",
        "from",
        "into",
        "onto",
        "step",
        "check",
        "verify",
        "confirm",
        "audit",
        "scan",
        "read",
        "log",
        "use",
        "apply",
        "lock",
        "new",
        "old",
        "unit",
        "level",
        "levels",
        "state",
        "mode",
        "under",
        "over",
        "until",
        "all",
    }
)

# Live SDK runtime instances
ACTIVE_MISSIONS: Dict[str, Mission] = {}
VOICE_GATE = NearFieldVoiceGate()


def _init_vault() -> SovereignBiometricVault:
    if HAS_CRYPTO:
        return SovereignBiometricVault()
    return SovereignBiometricVault(allow_insecure_simulation=True)


VAULT = _init_vault()


def _state_file_path() -> Optional[Path]:
    raw_dir = os.environ.get("FIELDKIT_STATE_DIR", "").strip()
    if not raw_dir:
        return None
    return Path(raw_dir) / "missions.json"


def _serialize_mission(m: Mission) -> Dict[str, Any]:
    return {
        "mission_id": m.mission_id,
        "title": m.title,
        "category": m.category,
        "initial_step": m.initial_step_id,
        "failure_step": m.failure_step_id,
        "requirements": m.requirements,
        "terminal_states": m.terminal_states,
        "current_step_id": m.current_step_id,
        "started_at": m.started_at,
        "completed_at": m.completed_at,
        "aborted": m.aborted,
        "abort_reason": m.abort_reason,
        "visited_step_ids": sorted(m._visited_step_ids),
        "steps": [m.steps[sid].to_dict() for sid in m.ordered_step_ids],
    }


def _deserialize_mission(payload: Dict[str, Any]) -> Mission:
    m = Mission.from_dict(
        {
            "mission_id": payload["mission_id"],
            "title": payload["title"],
            "category": payload.get("category", "general"),
            "requirements": payload.get("requirements", {}),
            "state_machine": {
                "initial_step": payload.get("initial_step"),
                "failure_step": payload.get("failure_step"),
                "terminal_states": payload.get("terminal_states", {}),
                "steps": payload["steps"],
            },
        }
    )
    m.current_step_id = payload.get("current_step_id")
    m.started_at = float(payload.get("started_at", time.time()))
    m.completed_at = payload.get("completed_at")
    m.aborted = bool(payload.get("aborted", False))
    m.abort_reason = payload.get("abort_reason")
    m._visited_step_ids = set(payload.get("visited_step_ids", []))
    for step_data in payload["steps"]:
        sid = step_data["id"]
        if sid in m.steps:
            m.steps[sid].completed_at = step_data.get("completed_at")
            m.steps[sid].verification_evidence = step_data.get("verification_evidence")
    return m


def _save_state() -> None:
    state_path = _state_file_path()
    if state_path is None:
        return
    state_dir = state_path.parent
    os.makedirs(state_dir, mode=0o700, exist_ok=True)
    try:
        os.chmod(state_dir, 0o700)
    except OSError:
        pass

    data = {
        "schema_version": "2.0.0",
        "saved_at": time.time(),
        "missions": {mid: _serialize_mission(m) for mid, m in ACTIVE_MISSIONS.items()},
    }
    fd, tmp_name = tempfile.mkstemp(prefix=".missions-", suffix=".tmp", dir=str(state_dir))
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp_name, state_path)
    finally:
        if os.path.exists(tmp_name):
            try:
                os.unlink(tmp_name)
            except OSError:
                pass


def _load_state() -> None:
    state_path = _state_file_path()
    if state_path is None or not state_path.is_file():
        return
    try:
        with open(state_path, "r", encoding="utf-8") as fh:
            raw = json.load(fh)
        missions_map = raw.get("missions", {})
        if isinstance(missions_map, dict):
            for mid, payload in missions_map.items():
                if len(ACTIVE_MISSIONS) >= MAX_ACTIVE_MISSIONS:
                    break
                if isinstance(mid, str) and isinstance(payload, dict):
                    ACTIVE_MISSIONS[mid] = _deserialize_mission(payload)
    except Exception:
        # Start clean if persisted file is unreadable/corrupt
        return


def _tokenize(text: str) -> List[str]:
    parts = [p for p in re.split(r"[^a-z0-9]+", text.lower()) if len(p) >= 3]
    return [p for p in parts if p not in _STOPWORDS]


def _extract_step_targets(step: Any) -> Tuple[List[str], set[str]]:
    phrases: List[str] = []
    tokens: set[str] = set()
    rules = step.verification_rules or {}
    for key in ("visual_target", "target_state", "scene_stability"):
        val = rules.get(key)
        if isinstance(val, str) and val.strip():
            phrases.append(val.strip().lower())
            tokens.update(_tokenize(val))
    if isinstance(step.expected_action, str) and step.expected_action.strip():
        phrases.append(step.expected_action.strip().lower())
        tokens.update(_tokenize(step.expected_action))
    if isinstance(step.name, str) and step.name.strip():
        tokens.update(_tokenize(step.name))
    return phrases, tokens


def _parse_finite_float(obj: Any, field: str) -> float:
    if isinstance(obj, bool) or not isinstance(obj, (int, float)):
        raise ValueError(f"Field '{field}' must be a finite number")
    val = float(obj)
    if not math.isfinite(val):
        raise ValueError(f"Field '{field}' must be a finite number")
    return val


def _parse_point(data: Any, name: str) -> LandmarkPoint:
    if not isinstance(data, dict):
        raise ValueError(f"Field '{name}' must be an object with x and y coordinates")
    return LandmarkPoint(
        x=_parse_finite_float(data.get("x"), f"{name}.x"),
        y=_parse_finite_float(data.get("y"), f"{name}.y"),
        z=_parse_finite_float(data.get("z", 0.0), f"{name}.z"),
    )


def _parse_bbox(data: Any, name: str = "target_box") -> BoundingBox:
    if not isinstance(data, dict):
        raise ValueError(f"Field '{name}' must be an object with ymin, xmin, ymax, xmax")
    ymin = _parse_finite_float(data.get("ymin"), f"{name}.ymin")
    xmin = _parse_finite_float(data.get("xmin"), f"{name}.xmin")
    ymax = _parse_finite_float(data.get("ymax"), f"{name}.ymax")
    xmax = _parse_finite_float(data.get("xmax"), f"{name}.xmax")
    if ymin > ymax or xmin > xmax:
        raise ValueError(f"Field '{name}' requires ymin <= ymax and xmin <= xmax")
    label = str(data.get("label", ""))
    return BoundingBox(ymin=ymin, xmin=xmin, ymax=ymax, xmax=xmax, label=label)


def _error_result(message: str) -> Dict[str, Any]:
    return {"content": [{"type": "text", "text": message}], "isError": True}


def _json_result(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {"content": [{"type": "text", "text": json.dumps(payload, indent=2)}]}


def mcp_tools_list() -> List[Dict[str, Any]]:
    """Return all 10 standard FieldKit MCP tool definitions."""
    return [
        {
            "name": "fieldkit_create_mission",
            "description": "Initialize a stateful FieldKit physical AI mission with a validated acyclic procedural state machine (DAG) and safety rules.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "mission_id": {
                        "type": "string",
                        "description": "Unique identifier for the mission session",
                    },
                    "title": {
                        "type": "string",
                        "description": "Human-readable mission title (e.g., 'Turbine Inspection')",
                    },
                    "category": {
                        "type": "string",
                        "enum": [
                            "industrial_maintenance",
                            "emergency_medicine",
                            "physical_security",
                            "aviation",
                            "general",
                        ],
                        "description": "Domain category",
                    },
                    "steps": {
                        "type": "array",
                        "minItems": 1,
                        "items": {
                            "type": "object",
                            "properties": {
                                "id": {"type": "string"},
                                "name": {"type": "string"},
                                "prompt_speech": {"type": "string"},
                                "verification_target": {"type": "string"},
                                "expected_action": {"type": "string"},
                                "verification_rules": {"type": "object"},
                                "on_success": {"type": "string"},
                                "on_failure": {"type": "string"},
                            },
                            "required": ["id", "name", "prompt_speech"],
                        },
                        "description": "Non-empty ordered steps forming an acyclic DAG for proactive audio guidance",
                    },
                },
                "required": ["mission_id", "title", "steps"],
            },
        },
        {
            "name": "fieldkit_load_template",
            "description": "Load a canonical YAML FieldKit mission template (industrial_pump, tccc_tourniquet, or datacenter_sweep) into an active DAG mission.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "template_name": {
                        "type": "string",
                        "enum": ["industrial_pump", "tccc_tourniquet", "datacenter_sweep"],
                        "description": "Name of canonical YAML template to instantiate",
                    },
                    "target_mission_id": {
                        "type": "string",
                        "description": "ID to assign to the new mission instance",
                    },
                },
                "required": ["template_name", "target_mission_id"],
            },
        },
        {
            "name": "fieldkit_get_mission_status",
            "description": "Retrieve current step, DAG progress, verification rules, elapsed time, and next proactive guidance for an active mission.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "mission_id": {
                        "type": "string",
                        "description": "Active mission ID",
                    }
                },
                "required": ["mission_id"],
            },
        },
        {
            "name": "fieldkit_progress_step",
            "description": "Progress an active mission to the next procedural DAG step upon physical verification (visual bounding box, gesture, or speech).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "mission_id": {
                        "type": "string",
                        "description": "Active mission ID",
                    },
                    "verification_evidence": {
                        "type": "string",
                        "description": "Summary of sensory confirmation (e.g. 'Pinch gesture verified on breaker latch')",
                    },
                },
                "required": ["mission_id"],
            },
        },
        {
            "name": "fieldkit_evaluate_fov_frame",
            "description": "Evaluate first-person field-of-view (FOV) detected objects and optional 3D hand pinch landmarks against the current mission checkpoint's real verification rules.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "mission_id": {
                        "type": "string",
                        "description": "Active mission ID",
                    },
                    "detected_objects": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Objects identified in glasses POV (e.g. ['breaker_switch_480v', 'padlock'])",
                    },
                    "hands_engaged": {
                        "type": "boolean",
                        "description": "Whether hands are detected holding tools or manipulating the target",
                    },
                    "thumb_tip": {
                        "type": "object",
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"},
                            "z": {"type": "number"},
                        },
                        "required": ["x", "y"],
                        "description": "Optional 3D thumb-tip landmark for RaycastEvaluator pinch targeting",
                    },
                    "index_tip": {
                        "type": "object",
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"},
                            "z": {"type": "number"},
                        },
                        "required": ["x", "y"],
                        "description": "Optional 3D index-tip landmark for RaycastEvaluator pinch targeting",
                    },
                    "target_box": {
                        "type": "object",
                        "properties": {
                            "ymin": {"type": "number"},
                            "xmin": {"type": "number"},
                            "ymax": {"type": "number"},
                            "xmax": {"type": "number"},
                            "label": {"type": "string"},
                        },
                        "required": ["ymin", "xmin", "ymax", "xmax"],
                        "description": "Optional normalized [ymin, xmin, ymax, xmax] bounding box for 3D raycast intersection",
                    },
                },
                "required": ["mission_id", "detected_objects"],
            },
        },
        {
            "name": "fieldkit_vault_audit",
            "description": "Query the live SovereignBiometricVault instance for honest runtime cryptography, key management, enrolled record count, and zero-egress audit proof.",
            "inputSchema": {
                "type": "object",
                "properties": {},
            },
        },
        {
            "name": "fieldkit_verify_raycast",
            "description": "Run real RaycastEvaluator 3D skeletal pinch-to-bounding-box hit testing against a normalized physical target box.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target_box": {
                        "type": "object",
                        "properties": {
                            "ymin": {"type": "number"},
                            "xmin": {"type": "number"},
                            "ymax": {"type": "number"},
                            "xmax": {"type": "number"},
                            "label": {"type": "string"},
                        },
                        "required": ["ymin", "xmin", "ymax", "xmax"],
                        "description": "Normalized target bounding box [ymin, xmin, ymax, xmax]",
                    },
                    "thumb_tip": {
                        "type": "object",
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"},
                            "z": {"type": "number"},
                        },
                        "required": ["x", "y"],
                        "description": "Thumb-tip 3D landmark coordinate",
                    },
                    "index_tip": {
                        "type": "object",
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"},
                            "z": {"type": "number"},
                        },
                        "required": ["x", "y"],
                        "description": "Index-tip 3D landmark coordinate",
                    },
                },
                "required": ["target_box", "thumb_tip", "index_tip"],
            },
        },
        {
            "name": "fieldkit_verify_voice_gate",
            "description": "Evaluate fail-closed NearFieldVoiceGate proximity ([0.0, 1.0] m) and optional speaker voiceprint cosine similarity verification.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "estimated_distance_meters": {
                        "type": "number",
                        "description": "Estimated distance from acoustic source to wearer microphone in meters",
                    },
                    "incoming_embedding": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Incoming speaker acoustic spectral embedding vector",
                    },
                    "enroll_embedding": {
                        "type": "array",
                        "items": {"type": "number"},
                        "description": "Optional wearer voiceprint vector to enroll before verification",
                    },
                    "min_similarity_threshold": {
                        "type": "number",
                        "description": "Optional cosine similarity threshold override (0.0 to 1.0)",
                    },
                },
                "required": ["estimated_distance_meters"],
            },
        },
        {
            "name": "fieldkit_list_missions",
            "description": "List all active, completed, and aborted missions along with available canonical YAML templates.",
            "inputSchema": {
                "type": "object",
                "properties": {},
            },
        },
        {
            "name": "fieldkit_abort_mission",
            "description": "Safely abort an active FieldKit mission and record its terminal failure state and safety reason.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "mission_id": {
                        "type": "string",
                        "description": "Active mission ID to abort",
                    },
                    "reason": {
                        "type": "string",
                        "description": "Safety reason for aborting the mission",
                    },
                },
                "required": ["mission_id"],
            },
        },
    ]


def handle_call_tool(name: str, args: Any) -> Dict[str, Any]:
    """Execute requested FieldKit MCP tool with strict input validation."""
    if not isinstance(args, dict):
        return _error_result("Invalid tool arguments: expected JSON object.")

    if name == "fieldkit_create_mission":
        m_id = args.get("mission_id")
        title = args.get("title")
        steps = args.get("steps")
        category = args.get("category", "general")

        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result("Invalid argument: 'mission_id' must be a non-empty string.")
        if not isinstance(title, str) or not title.strip():
            return _error_result("Invalid argument: 'title' must be a non-empty string.")
        if not isinstance(steps, list) or len(steps) == 0:
            return _error_result("Invalid argument: 'steps' must be a non-empty list of step objects.")
        if m_id not in ACTIVE_MISSIONS and len(ACTIVE_MISSIONS) >= MAX_ACTIVE_MISSIONS:
            return _error_result(
                f"Active mission limit ({MAX_ACTIVE_MISSIONS}) reached. Abort or clear a mission first."
            )

        try:
            mission = Mission.from_dict(
                {
                    "mission_id": m_id.strip(),
                    "title": title.strip(),
                    "category": str(category or "general"),
                    "state_machine": {"steps": steps},
                }
            )
        except StateTransitionError as exc:
            return _error_result(f"Invalid mission DAG: {exc}")

        ACTIVE_MISSIONS[mission.mission_id] = mission
        _save_state()
        first = mission.current_step
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Mission '{mission.title}' initialized with ID '{mission.mission_id}'.\n"
                        f"Current Step 1/{len(mission.ordered_step_ids)}: {first.name}\n"
                        f"Proactive Audio Cue: \"{first.prompt_speech}\""
                    ),
                }
            ]
        }

    if name == "fieldkit_load_template":
        tpl_key = args.get("template_name")
        m_id = args.get("target_mission_id")
        if not isinstance(tpl_key, str) or tpl_key not in TEMPLATE_FILES:
            allowed = ", ".join(sorted(TEMPLATE_FILES.keys()))
            return _error_result(
                f"Invalid template_name. Allowed canonical templates: {allowed}."
            )
        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result(
                "Invalid argument: 'target_mission_id' must be a non-empty string."
            )
        m_id = m_id.strip()
        if m_id not in ACTIVE_MISSIONS and len(ACTIVE_MISSIONS) >= MAX_ACTIVE_MISSIONS:
            return _error_result(
                f"Active mission limit ({MAX_ACTIVE_MISSIONS}) reached. Abort or clear a mission first."
            )

        yaml_path = FIELDKIT_ROOT / TEMPLATE_FILES[tpl_key]
        if not yaml_path.is_file():
            return _error_result(f"Template YAML asset unavailable for '{tpl_key}'.")

        try:
            mission = Mission.from_yaml_file(str(yaml_path))
        except StateTransitionError as exc:
            return _error_result(f"Failed to validate template '{tpl_key}': {exc}")

        mission.mission_id = m_id
        ACTIVE_MISSIONS[m_id] = mission
        _save_state()
        first = mission.current_step
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Template '{tpl_key}' loaded from canonical YAML into mission '{m_id}'.\n"
                        f"Title: {mission.title} ({mission.category})\n"
                        f"Steps: {len(mission.ordered_step_ids)}\n"
                        f"Step 1: {first.name} -> Audio Cue: \"{first.prompt_speech}\""
                    ),
                }
            ]
        }

    if name == "fieldkit_get_mission_status":
        m_id = args.get("mission_id")
        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result("Invalid argument: 'mission_id' must be a non-empty string.")
        mission = ACTIVE_MISSIONS.get(m_id)
        if not mission:
            return _error_result(f"Error: Mission '{m_id}' not found.")

        total = len(mission.ordered_step_ids)
        completed_count = sum(1 for sid in mission.ordered_step_ids if mission.steps[sid].is_completed)

        if mission.aborted:
            return _json_result(
                {
                    "mission_id": m_id,
                    "title": mission.title,
                    "category": mission.category,
                    "status": "ABORTED",
                    "abort_reason": mission.abort_reason,
                    "failure_step": mission.failure_step_id,
                    "progress": f"{completed_count}/{total}",
                    "progress_percentage": mission.progress_percentage,
                    "elapsed_seconds": int(time.time() - mission.started_at),
                }
            )

        if mission.is_finished:
            return _json_result(
                {
                    "mission_id": m_id,
                    "title": mission.title,
                    "category": mission.category,
                    "status": "COMPLETED",
                    "progress": f"{total}/{total}",
                    "progress_percentage": 100.0,
                    "elapsed_seconds": int((mission.completed_at or time.time()) - mission.started_at),
                    "completed_steps": total,
                }
            )

        curr = mission.current_step
        idx = mission.ordered_step_ids.index(curr.id)
        nxt_step = (
            mission.steps[mission.ordered_step_ids[idx + 1]]
            if idx + 1 < total
            else None
        )
        return _json_result(
            {
                "mission_id": m_id,
                "title": mission.title,
                "category": mission.category,
                "status": "ACTIVE",
                "progress": f"{idx + 1}/{total}",
                "progress_percentage": mission.progress_percentage,
                "current_step": curr.to_dict(),
                "next_step_preview": nxt_step.name if nxt_step else "Final Checkpoint",
                "elapsed_seconds": int(time.time() - mission.started_at),
                "hands_busy_mode": bool(mission.requirements.get("hands_busy", True)),
                "voice_gate_active": bool(mission.requirements.get("near_field_voice_gate", True)),
                "voice_gate_enrolled": VOICE_GATE.enrolled_embedding is not None,
                "completed_steps": completed_count,
            }
        )

    if name == "fieldkit_progress_step":
        m_id = args.get("mission_id")
        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result("Invalid argument: 'mission_id' must be a non-empty string.")
        mission = ACTIVE_MISSIONS.get(m_id)
        if not mission:
            return _error_result(f"Error: Mission '{m_id}' not found.")

        if mission.aborted:
            return _error_result(
                f"Mission '{m_id}' was aborted ({mission.abort_reason}) and cannot advance."
            )
        if mission.is_finished:
            return {"content": [{"type": "text", "text": f"Mission '{m_id}' is already finished."}]}

        prev_step = mission.current_step
        evidence = str(args.get("verification_evidence") or "Physical confirmation detected")
        try:
            next_step = mission.advance(evidence)
        except StateTransitionError as exc:
            return _error_result(f"State transition blocked: {exc}")

        _save_state()
        total = len(mission.ordered_step_ids)
        if next_step is None:
            terminal_cue = (
                mission.terminal_states.get("mission_complete", {}).get("prompt_speech")
                if isinstance(mission.terminal_states.get("mission_complete"), dict)
                else None
            )
            suffix = f"\nTerminal Audio Cue: \"{terminal_cue}\"" if terminal_cue else ""
            return {
                "content": [
                    {
                        "type": "text",
                        "text": (
                            f"Step '{prev_step.name}' VERIFIED.\n"
                            f"Mission '{mission.title}' is now 100% COMPLETE.{suffix}"
                        ),
                    }
                ]
            }

        new_idx = mission.ordered_step_ids.index(next_step.id) + 1
        return {
            "content": [
                {
                    "type": "text",
                    "text": (
                        f"Step '{prev_step.name}' verified.\n"
                        f"Advancing to Step {new_idx}/{total}: '{next_step.name}'\n"
                        f"Proactive Audio Cue to Ear: \"{next_step.prompt_speech}\""
                    ),
                }
            ]
        }

    if name == "fieldkit_evaluate_fov_frame":
        t0 = time.perf_counter()
        m_id = args.get("mission_id")
        detected = args.get("detected_objects")
        hands = bool(args.get("hands_engaged", False))

        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result("Invalid argument: 'mission_id' must be a non-empty string.")
        if not isinstance(detected, list) or not all(isinstance(x, str) for x in detected):
            return _error_result(
                "Invalid argument: 'detected_objects' must be an array of strings."
            )

        mission = ACTIVE_MISSIONS.get(m_id)
        if not mission:
            return _error_result(f"Error: Mission '{m_id}' not found.")
        if mission.aborted:
            return _error_result(f"Mission '{m_id}' is aborted. Sensor stream idle.")
        if mission.is_finished:
            return {"content": [{"type": "text", "text": "Mission completed. Sensor stream idle."}]}

        curr = mission.current_step
        target_phrases, target_tokens = _extract_step_targets(curr)

        matched_objects: List[str] = []
        matched_tokens: set[str] = set()
        for raw_obj in detected:
            norm_obj = raw_obj.strip().lower()
            if not norm_obj:
                continue
            obj_tokens = set(_tokenize(norm_obj))
            phrase_hit = any(
                (p in norm_obj or norm_obj in p)
                for p in target_phrases
                if len(p) >= 3
            )
            token_overlap = obj_tokens & target_tokens
            if phrase_hit or token_overlap:
                matched_objects.append(raw_obj)
                matched_tokens.update(token_overlap)

        target_matched = len(matched_objects) > 0

        # Optional real 3D RaycastEvaluator check
        raycast_result: Optional[Dict[str, Any]] = None
        if any(k in args for k in ("thumb_tip", "index_tip", "target_box")):
            if not all(k in args for k in ("thumb_tip", "index_tip", "target_box")):
                return _error_result(
                    "Raycast evaluation requires all three fields: 'thumb_tip', 'index_tip', and 'target_box'."
                )
            try:
                thumb = _parse_point(args["thumb_tip"], "thumb_tip")
                index = _parse_point(args["index_tip"], "index_tip")
                bbox = _parse_bbox(args["target_box"], "target_box")
            except ValueError as exc:
                return _error_result(f"Invalid raycast geometry: {exc}")
            raycast_result = RaycastEvaluator.evaluate_pinch_targeting(bbox, thumb, index)

        requires_pinch = bool(curr.verification_rules.get("pinch_detected", False))
        if raycast_result is not None:
            ready_to_advance = bool(target_matched and raycast_result["raycast_hit"])
        elif requires_pinch:
            ready_to_advance = bool(target_matched and hands)
        else:
            ready_to_advance = bool(target_matched)

        expected_target = (
            curr.verification_rules.get("visual_target")
            or curr.expected_action
            or curr.name
        )

        if not target_matched:
            recommendation = (
                f"Target mismatch: expected '{expected_target}' for step '{curr.name}', "
                f"but FOV detected {detected or 'no objects'}. Re-center wearable camera on target before advancing."
            )
        elif raycast_result is not None and not raycast_result["raycast_hit"]:
            recommendation = (
                f"Visual target '{expected_target}' matched, but 3D pinch raycast missed target bounding box "
                f"(confidence {raycast_result['raycast_confidence']}). Align thumb and index pinch within target bounds."
            )
        elif requires_pinch and not hands:
            recommendation = (
                f"Visual target '{expected_target}' matched, but step requires physical hand engagement/pinch "
                f"before advancing."
            )
        else:
            recommendation = (
                f"Target '{expected_target}' verified in operator FOV ({', '.join(matched_objects)}). "
                f"Ready to call fieldkit_progress_step."
            )

        elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 3)
        payload: Dict[str, Any] = {
            "evaluation": "FOV sensor verification complete",
            "mission_id": m_id,
            "step_id": curr.id,
            "step_target": curr.name,
            "expected_visual_target": expected_target,
            "detected_objects": detected,
            "matched_objects": matched_objects,
            "matched_tokens": sorted(matched_tokens),
            "target_matched": target_matched,
            "hands_busy_verified": hands,
            "requires_pinch": requires_pinch,
            "ready_to_advance": ready_to_advance,
            "evaluation_latency_ms": elapsed_ms,
            "recommendation": recommendation,
        }
        if raycast_result is not None:
            payload["raycast_hit"] = raycast_result["raycast_hit"]
            payload["raycast_confidence"] = raycast_result["raycast_confidence"]
            payload["raycast"] = raycast_result

        return _json_result(payload)

    if name == "fieldkit_vault_audit":
        manifest = VAULT.export_audit_manifest()
        return _json_result(manifest)

    if name == "fieldkit_verify_raycast":
        try:
            bbox = _parse_bbox(args.get("target_box"), "target_box")
            thumb = _parse_point(args.get("thumb_tip"), "thumb_tip")
            index = _parse_point(args.get("index_tip"), "index_tip")
        except ValueError as exc:
            return _error_result(f"Invalid raycast geometry: {exc}")

        result = RaycastEvaluator.evaluate_pinch_targeting(bbox, thumb, index)
        return _json_result(result)

    if name == "fieldkit_verify_voice_gate":
        raw_dist = args.get("estimated_distance_meters")
        if raw_dist is None:
            return _error_result(
                "Invalid argument: 'estimated_distance_meters' is required."
            )

        gate = VOICE_GATE
        threshold_override = args.get("min_similarity_threshold")
        if threshold_override is not None:
            try:
                th = _parse_finite_float(threshold_override, "min_similarity_threshold")
            except ValueError as exc:
                return _error_result(str(exc))
            if not (0.0 <= th <= 1.0):
                return _error_result(
                    "Invalid argument: 'min_similarity_threshold' must be between 0.0 and 1.0."
                )
            gate = NearFieldVoiceGate(
                min_similarity_threshold=th,
                attenuation_db=VOICE_GATE.attenuation_db,
                max_distance_meters=VOICE_GATE.max_distance_meters,
            )
            gate.enrolled_embedding = VOICE_GATE.enrolled_embedding

        enroll_vec = args.get("enroll_embedding")
        if enroll_vec is not None:
            try:
                gate.enroll_voiceprint(enroll_vec)
                if gate is VOICE_GATE:
                    pass
                else:
                    VOICE_GATE.enroll_voiceprint(enroll_vec)
            except ValueError as exc:
                return _error_result(f"Invalid enroll_embedding: {exc}")

        near_field = gate.is_near_field(raw_dist)
        incoming = args.get("incoming_embedding")
        if incoming is not None:
            sim = gate.similarity_score(incoming)
            speaker_ok = gate.verify_speaker(incoming)
        else:
            sim = None
            speaker_ok = False

        gate_passed = bool(near_field and speaker_ok)
        return _json_result(
            {
                "is_near_field": near_field,
                "estimated_distance_meters": raw_dist if isinstance(raw_dist, (int, float)) and not isinstance(raw_dist, bool) and math.isfinite(float(raw_dist)) else None,
                "max_distance_meters": gate.max_distance_meters,
                "voiceprint_enrolled": gate.enrolled_embedding is not None,
                "speaker_verified": speaker_ok,
                "similarity_score": round(sim, 6) if sim is not None else None,
                "min_similarity_threshold": gate.min_similarity_threshold,
                "gate_passed": gate_passed,
                "fail_closed_policy": True,
            }
        )

    if name == "fieldkit_list_missions":
        missions_summary = []
        for mid, m in ACTIVE_MISSIONS.items():
            total = len(m.ordered_step_ids)
            completed = sum(1 for sid in m.ordered_step_ids if m.steps[sid].is_completed)
            status = "ABORTED" if m.aborted else ("COMPLETED" if m.is_finished else "ACTIVE")
            missions_summary.append(
                {
                    "mission_id": mid,
                    "title": m.title,
                    "category": m.category,
                    "status": status,
                    "progress": f"{completed}/{total}",
                    "progress_percentage": m.progress_percentage,
                    "current_step_id": m.current_step_id,
                }
            )
        return _json_result(
            {
                "missions": missions_summary,
                "mission_count": len(missions_summary),
                "max_active_missions": MAX_ACTIVE_MISSIONS,
                "available_templates": sorted(TEMPLATE_FILES.keys()),
                "persistence_enabled": _state_file_path() is not None,
            }
        )

    if name == "fieldkit_abort_mission":
        m_id = args.get("mission_id")
        if not isinstance(m_id, str) or not m_id.strip():
            return _error_result("Invalid argument: 'mission_id' must be a non-empty string.")
        mission = ACTIVE_MISSIONS.get(m_id)
        if not mission:
            return _error_result(f"Error: Mission '{m_id}' not found.")

        reason = str(args.get("reason") or "Operator safety abort triggered")
        mission.abort(reason)
        _save_state()

        abort_speech = None
        if mission.failure_step_id and isinstance(
            mission.terminal_states.get(mission.failure_step_id), dict
        ):
            abort_speech = mission.terminal_states[mission.failure_step_id].get("prompt_speech")

        return _json_result(
            {
                "mission_id": m_id,
                "title": mission.title,
                "status": "ABORTED",
                "reason": reason,
                "failure_step": mission.failure_step_id,
                "abort_prompt_speech": abort_speech,
            }
        )

    return _error_result(f"Unknown tool: '{name}'")


def _list_resources() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    for uri, meta in RESOURCE_REGISTRY.items():
        items.append(
            {
                "uri": uri,
                "name": meta["name"],
                "description": meta["description"],
                "mimeType": meta["mimeType"],
            }
        )
    return items


def _read_resource(uri: Any) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    if not isinstance(uri, str) or uri not in RESOURCE_REGISTRY:
        return None, {"code": -32602, "message": "Invalid params: unknown resource URI"}
    meta = RESOURCE_REGISTRY[uri]
    target = FIELDKIT_ROOT / meta["rel_path"]
    if not target.is_file():
        return None, {"code": -32603, "message": "Resource file unavailable in installation"}
    content = target.read_text(encoding="utf-8")
    return {
        "contents": [
            {
                "uri": uri,
                "mimeType": meta["mimeType"],
                "text": content,
            }
        ]
    }, None


def _jsonrpc_error(req_id: Any, code: int, message: str) -> Dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": code, "message": message},
    }


def process_jsonrpc_message(raw_line: str) -> Optional[Dict[str, Any]]:
    """Process one JSON-RPC 2.0 line. Returns None for notifications (no stdout reply)."""
    try:
        req = json.loads(raw_line)
    except json.JSONDecodeError:
        return _jsonrpc_error(None, -32700, "Parse error: invalid JSON")

    if not isinstance(req, dict):
        return _jsonrpc_error(None, -32600, "Invalid Request: expected JSON object")

    is_notification = "id" not in req
    req_id = req.get("id")
    method = req.get("method")

    if not isinstance(method, str) or not method.strip():
        if is_notification:
            return None
        return _jsonrpc_error(req_id, -32600, "Invalid Request: missing valid method string")

    if "params" not in req:
        params: Dict[str, Any] = {}
    elif isinstance(req["params"], dict):
        params = req["params"]
    else:
        if is_notification:
            return None
        return _jsonrpc_error(req_id, -32602, "Invalid params: expected JSON object")

    # Strict JSON-RPC 2.0 §4.1: notifications MUST NOT receive any response
    if is_notification or method.startswith("notifications/"):
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": PROTOCOL_VERSION,
                "capabilities": {
                    "tools": {},
                    "resources": {},
                    "prompts": {},
                },
                "serverInfo": {
                    "name": SERVER_NAME,
                    "version": SERVER_VERSION,
                },
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": mcp_tools_list()}}

    if method == "tools/call":
        tool_name = params.get("name")
        if not isinstance(tool_name, str) or not tool_name.strip():
            return _jsonrpc_error(req_id, -32602, "Invalid params: tool 'name' must be a string")
        tool_args = params.get("arguments", {}) if "arguments" in params else {}
        try:
            tool_res = handle_call_tool(tool_name, tool_args)
        except Exception:
            tool_res = _error_result("Tool execution failed due to an internal error.")
        return {"jsonrpc": "2.0", "id": req_id, "result": tool_res}

    if method == "resources/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"resources": _list_resources()}}

    if method == "resources/read":
        result, err = _read_resource(params.get("uri"))
        if err is not None:
            return _jsonrpc_error(req_id, err["code"], err["message"])
        return {"jsonrpc": "2.0", "id": req_id, "result": result}

    if method == "prompts/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"prompts": []}}

    return _jsonrpc_error(req_id, -32601, f"Method '{method}' not found")


def build_status_manifest() -> Dict[str, Any]:
    """Build portable status manifest with zero literal user home-directory paths."""
    install_mode = "/opt/fieldkit" if str(FIELDKIT_ROOT) == "/opt/fieldkit" else "portable-repo"
    templates_available = [
        key for key, rel in TEMPLATE_FILES.items() if (FIELDKIT_ROOT / rel).is_file()
    ]
    return {
        "name": SERVER_NAME,
        "command": "fieldkit-mcp",
        "args": ["--stdio"],
        "version": SERVER_VERSION,
        "sdk_version": SDK_VERSION,
        "protocol_version": PROTOCOL_VERSION,
        "transport": "stdio",
        "status": "ready",
        "install_mode": install_mode,
        "tool_count": len(mcp_tools_list()),
        "tools": [t["name"] for t in mcp_tools_list()],
        "resource_count": len(RESOURCE_REGISTRY),
        "templates_available": sorted(templates_available),
        "has_cryptography": HAS_CRYPTO,
        "persistence_enabled": _state_file_path() is not None,
        "max_line_bytes": MAX_LINE_BYTES,
        "max_active_missions": MAX_ACTIVE_MISSIONS,
        "attribution": "Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform",
    }


def run_stdio_loop() -> int:
    """Run hardened JSON-RPC 2.0 MCP server over stdin/stdout."""
    _load_state()
    stdin_buf = sys.stdin.buffer
    stdout = sys.stdout

    while True:
        raw = stdin_buf.readline(MAX_LINE_BYTES + 1)
        if not raw:
            break

        if len(raw) > MAX_LINE_BYTES and not raw.endswith(b"\n"):
            # Drain remainder of oversized line safely
            while True:
                chunk = stdin_buf.readline(65536)
                if not chunk or chunk.endswith(b"\n"):
                    break
            res = _jsonrpc_error(
                None,
                -32600,
                f"Invalid Request: line exceeds {MAX_LINE_BYTES} byte limit",
            )
            stdout.write(json.dumps(res) + "\n")
            stdout.flush()
            continue

        if len(raw) > MAX_LINE_BYTES:
            res = _jsonrpc_error(
                None,
                -32600,
                f"Invalid Request: line exceeds {MAX_LINE_BYTES} byte limit",
            )
            stdout.write(json.dumps(res) + "\n")
            stdout.flush()
            continue

        try:
            line = raw.decode("utf-8").strip()
        except UnicodeDecodeError:
            res = _jsonrpc_error(None, -32700, "Parse error: invalid UTF-8 input")
            stdout.write(json.dumps(res) + "\n")
            stdout.flush()
            continue

        if not line:
            continue

        response = process_jsonrpc_message(line)
        if response is not None:
            stdout.write(json.dumps(response) + "\n")
            stdout.flush()

    return 0


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="fieldkit-mcp",
        description=(
            "FieldKit JSON-RPC 2.0 MCP Server (stdio) — Physical AI mission DAG, "
            "3D raycast, near-field voice gate, and biometric vault tools."
        ),
    )
    parser.add_argument(
        "--stdio",
        action="store_true",
        help="Run JSON-RPC 2.0 MCP server over stdin/stdout (default mode).",
    )
    parser.add_argument(
        "--version",
        action="store_true",
        help="Print FieldKit MCP server version and exit.",
    )
    parser.add_argument(
        "--status",
        action="store_true",
        help="Print FieldKit MCP server readiness summary and exit.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit machine-readable JSON manifest/status and exit.",
    )
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)

    if args.version:
        if args.json:
            print(json.dumps({"name": SERVER_NAME, "version": SERVER_VERSION, "sdk_version": SDK_VERSION}))
        else:
            print(f"fieldkit-mcp {SERVER_VERSION}")
        return 0

    if args.status or args.json:
        manifest = build_status_manifest()
        if args.json:
            print(json.dumps(manifest, indent=2))
        else:
            print(
                f"{manifest['name']} v{manifest['version']} (SDK v{manifest['sdk_version']})\n"
                f"Transport: {manifest['transport']} (protocol {manifest['protocol_version']})\n"
                f"Tools: {manifest['tool_count']} | Resources: {manifest['resource_count']} | "
                f"Templates: {', '.join(manifest['templates_available'])}\n"
                f"Crypto Backend: {'AES-256-GCM (cryptography)' if manifest['has_cryptography'] else 'UNAVAILABLE'}\n"
                f"{manifest['attribution']}"
            )
        return 0

    return run_stdio_loop()


if __name__ == "__main__":
    raise SystemExit(main())
