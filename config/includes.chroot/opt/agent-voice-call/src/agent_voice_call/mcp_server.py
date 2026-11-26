"""Zero-Dependency JSON-RPC 2.0 Stdio MCP Server for Agent Voice Call.

Exposes 4 real tools over stdio:
  1. agent_voice_call_status   — daemon & local-first TTS engine status
  2. agent_voice_call_voices   — 6 local voice personas & engine capabilities
  3. agent_voice_call_speak    — local utterance dialogue + WAV synthesis
  4. agent_voice_call_debriefs — persisted local call debrief transcripts

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from typing import Any, Dict, List, Optional, TextIO

from . import __version__
from .call_engine import CallManager
from .tts_bridge import VOICES, get_tts_status

MCP_PROTOCOL_VERSION = "2024-11-05"

TOOLS: List[Dict[str, Any]] = [
    {
        "name": "agent_voice_call_status",
        "description": "Inspect Agent Voice Call loopback daemon health (:8114), active session count, and local-first TTS engine status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "port": {"type": "integer", "description": "Loopback port to inspect (default: 8114)", "default": 8114},
            },
            "additionalProperties": False,
        },
    },
    {
        "name": "agent_voice_call_voices",
        "description": "List all 6 available Agent Voice Call personas (azoth, ghostbyte, athena, mercury, kitsune, chronos) and local TTS backend metadata.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
    {
        "name": "agent_voice_call_speak",
        "description": "Generate a spoken reply for a user prompt using local Ollama/intent dialogue and local-first WAV synthesis (Kokoro -> Piper/espeak-ng -> PCM fallback).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Utterance or prompt to speak to the agent"},
                "voice": {
                    "type": "string",
                    "enum": list(VOICES.keys()),
                    "default": "azoth",
                    "description": "Persona voice identifier",
                },
                "persist": {
                    "type": "boolean",
                    "default": False,
                    "description": "Whether to persist this single-turn call debrief locally",
                },
            },
            "required": ["text"],
            "additionalProperties": False,
        },
    },
    {
        "name": "agent_voice_call_debriefs",
        "description": "Read recent locally persisted voice call debriefs and transcripts from ~/.local/share/zoth/voice_calls/debriefs.jsonl.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 100, "default": 10},
            },
            "additionalProperties": False,
        },
    },
]


def _probe_live_daemon(port: int = 8114) -> Optional[Dict[str, Any]]:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{int(port)}/health", timeout=1.0) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return None


def dispatch_tool_call(name: str, arguments: Optional[Dict[str, Any]], manager: Optional[CallManager] = None) -> Dict[str, Any]:
    """Execute one of the 4 MCP tools and return an MCP CallToolResult payload."""
    args = arguments if isinstance(arguments, dict) else {}
    mgr = manager or CallManager()

    if name == "agent_voice_call_status":
        port = int(args.get("port", 8114))
        live = _probe_live_daemon(port)
        tts = get_tts_status()
        payload = {
            "service": "agent-voice-call",
            "version": __version__,
            "port": port,
            "daemon_online": live is not None,
            "daemon": live,
            "tts": tts,
            "persisted_debriefs": len(mgr.list_debriefs(limit=100)),
        }
        return {"content": [{"type": "text", "text": json.dumps(payload, indent=2)}], "isError": False}

    if name == "agent_voice_call_voices":
        payload = {
            "version": __version__,
            "voices": VOICES,
            "tts": get_tts_status(),
        }
        return {"content": [{"type": "text", "text": json.dumps(payload, indent=2)}], "isError": False}

    if name == "agent_voice_call_speak":
        text = args.get("text")
        if not isinstance(text, str) or not text.strip():
            return {
                "content": [{"type": "text", "text": json.dumps({"error": "text must be a non-empty string"})}],
                "isError": True,
            }
        voice = str(args.get("voice", "azoth")).strip().lower()
        if voice not in VOICES:
            return {
                "content": [{"type": "text", "text": json.dumps({"error": f"unknown voice: {voice}", "available_voices": list(VOICES.keys())})}],
                "isError": True,
            }
        persist = bool(args.get("persist", False))
        _sid, token = mgr.create_call_token(channel="mcp", voice=voice)
        session = mgr.validate_token(token)
        assert session is not None
        reply_text, wav_bytes, latency_ms = mgr.process_utterance(session, text.strip())
        summary = None
        if persist:
            summary = mgr.end_call_session(session)
        else:
            session.status = "ENDED"

        payload = {
            "session_id": session.session_id,
            "voice": voice,
            "user_text": text.strip(),
            "reply_text": reply_text,
            "tts_engine": session.metadata.get("last_tts_engine", "local"),
            "latency_ms": latency_ms,
            "wav_bytes": len(wav_bytes) if wav_bytes else 0,
            "persisted": persist,
            "summary": summary,
        }
        return {"content": [{"type": "text", "text": json.dumps(payload, indent=2)}], "isError": False}

    if name == "agent_voice_call_debriefs":
        limit = max(1, min(100, int(args.get("limit", 10))))
        debriefs = mgr.list_debriefs(limit=limit)
        payload = {
            "count": len(debriefs),
            "debriefs": debriefs,
        }
        return {"content": [{"type": "text", "text": json.dumps(payload, indent=2)}], "isError": False}

    return {
        "content": [{"type": "text", "text": json.dumps({"error": f"unknown_tool: {name}"})}],
        "isError": True,
    }


def handle_jsonrpc_message(msg: Dict[str, Any], manager: Optional[CallManager] = None) -> Optional[Dict[str, Any]]:
    """Process a single JSON-RPC 2.0 request object and return a response dict (or None for notifications)."""
    req_id = msg.get("id")
    method = msg.get("method")
    params = msg.get("params") or {}

    if method == "notifications/initialized" or (req_id is None and str(method).startswith("notifications/")):
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": MCP_PROTOCOL_VERSION,
                "capabilities": {"tools": {}},
                "serverInfo": {
                    "name": "agent-voice-call",
                    "version": __version__,
                },
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        tool_name = params.get("name", "") if isinstance(params, dict) else ""
        tool_args = params.get("arguments", {}) if isinstance(params, dict) else {}
        result = dispatch_tool_call(str(tool_name), tool_args, manager=manager)
        return {"jsonrpc": "2.0", "id": req_id, "result": result}

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def run_stdio(stdin: Optional[TextIO] = None, stdout: Optional[TextIO] = None) -> int:
    """Run newline-delimited JSON-RPC 2.0 MCP server loop over stdio."""
    in_stream = stdin or sys.stdin
    out_stream = stdout or sys.stdout
    manager = CallManager()

    for raw_line in in_stream:
        line = raw_line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            err = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error"},
            }
            out_stream.write(json.dumps(err) + "\n")
            out_stream.flush()
            continue

        if not isinstance(msg, dict):
            err = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32600, "message": "Invalid Request"},
            }
            out_stream.write(json.dumps(err) + "\n")
            out_stream.flush()
            continue

        resp = handle_jsonrpc_message(msg, manager=manager)
        if resp is not None:
            out_stream.write(json.dumps(resp) + "\n")
            out_stream.flush()

    return 0


if __name__ == "__main__":
    sys.exit(run_stdio())
