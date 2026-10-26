"""
ingestion.py - Multi-Source Forensic Ingestion & Daemon Telemetry Bridges.
Zero external dependencies (Python 3.10+ standard library).
"""

import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from .storage import FlightStorage


def fetch_json(url: str, timeout: float = 1.0) -> Optional[Any]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AgentFlightRecorder/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status in (200, 201):
                return json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    return None


class IngestionEngine:
    def __init__(self, storage: FlightStorage):
        self.storage = storage

    def ingest_event(self, session_id: str, event_type: str, payload: Any, severity: str = "INFO", timestamp: Optional[float] = None, offset_ms: Optional[float] = None) -> int:
        return self.storage.append_event(
            session_id=session_id,
            event_type=event_type,
            payload=payload,
            severity=severity,
            timestamp=timestamp,
            offset_ms=offset_ms
        )

    def poll_active_bridges(self, session_id: str) -> Dict[str, Any]:
        """Poll sovereign ports (8098, 8095, 8097, 8094) and record active engrams/events."""
        results = {}

        # 1. Prompt Firewall (:8098)
        fw_stats = fetch_json("http://127.0.0.1:8098/api/threats")
        if fw_stats and isinstance(fw_stats, list):
            results["firewall_threats"] = len(fw_stats)
            for t in fw_stats[:3]:
                self.ingest_event(session_id, "prompt_scan", {
                    "threat_type": t.get("threat_type"),
                    "details": [t.get("reason", "")],
                    "score": 0.95 if t.get("threat_type") in ("CRITICAL", "HIGH") else 0.5,
                    "blocked": True,
                    "source": "port_8098"
                }, severity="WARN")

        # 2. Mock Twin (:8097)
        twin_stats = fetch_json("http://127.0.0.1:8097/api/stats")
        if twin_stats and isinstance(twin_stats, dict):
            results["mock_stats"] = twin_stats
            if twin_stats.get("total_hits", 0) > 0:
                self.ingest_event(session_id, "mock_replay", {
                    "tokens_saved": twin_stats.get("total_tokens_saved", 35),
                    "model": "gpt-4o",
                    "cost_saved_usd": twin_stats.get("total_tokens_saved", 35) * 0.000005,
                    "source": "port_8097"
                }, severity="INFO")

        # 3. Neuro-Memory (:8094)
        mem_data = fetch_json("http://127.0.0.1:8094/api/memories?limit=3")
        if mem_data and isinstance(mem_data, dict) and "memories" in mem_data:
            results["neuro_memories"] = len(mem_data["memories"])
            for m in mem_data["memories"]:
                self.ingest_event(session_id, "synaptic_engram", {
                    "id": m.get("id"),
                    "text": m.get("text", "")[:120],
                    "importance": m.get("importance", 0.6),
                    "source": "port_8094"
                }, severity="INFO")

        # 4. Egress Sentinel (:8095)
        sentinel_stats = fetch_json("http://127.0.0.1:8095/api/stats")
        if sentinel_stats and isinstance(sentinel_stats, dict):
            results["sentinel_stats"] = sentinel_stats

        return results
