"""
storage.py - Thread-Safe SQLite Time-Series Storage for Flight Recorder.
Zero external dependencies (Python 3.10+ standard library).
"""

import json
import os
import queue
import sqlite3
import threading
import time
import uuid
from typing import Dict, Any, List, Optional, Tuple


class EventBroadcaster:
    """Thread-safe event fan-out broadcaster for SSE streams."""
    def __init__(self):
        self._subscribers: List[queue.Queue] = []
        self._lock = threading.Lock()

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=100)
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    def broadcast(self, event_type: str, data: Dict[str, Any]):
        msg = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        with self._lock:
            dead = []
            for q in self._subscribers:
                try:
                    q.put_nowait(msg)
                except queue.Full:
                    dead.append(q)
            for d in dead:
                if d in self._subscribers:
                    self._subscribers.remove(d)


GLOBAL_BROADCASTER = EventBroadcaster()


class FlightStorage:
    def __init__(self, db_path: str = "flight_recorder.db"):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        session_id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        command TEXT,
                        start_time REAL NOT NULL,
                        end_time REAL,
                        duration_seconds REAL DEFAULT 0.0,
                        exit_code INTEGER DEFAULT 0,
                        status TEXT NOT NULL DEFAULT 'recording',
                        event_count INTEGER DEFAULT 0,
                        metadata_json TEXT
                    )
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS timeline_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT NOT NULL,
                        timestamp REAL NOT NULL,
                        offset_ms REAL NOT NULL,
                        event_type TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        severity TEXT NOT NULL DEFAULT 'INFO',
                        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON timeline_events(session_id)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_offset ON timeline_events(session_id, offset_ms)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON timeline_events(session_id, event_type)")
                conn.commit()
            finally:
                conn.close()

    def create_session(self, session_id: Optional[str] = None, title: str = "Agent Session", command: str = "", metadata: Optional[Dict[str, Any]] = None) -> str:
        sid = session_id or f"flt-{uuid.uuid4().hex[:10]}"
        now = time.time()
        meta_str = json.dumps(metadata or {})
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT OR REPLACE INTO sessions (
                        session_id, title, command, start_time, status, event_count, metadata_json
                    ) VALUES (?, ?, ?, ?, 'recording', 0, ?)
                """, (sid, title, command, now, meta_str))
                conn.commit()
                return sid
            finally:
                conn.close()

    def append_event(self, session_id: str, event_type: str, payload: Any, severity: str = "INFO", timestamp: Optional[float] = None, offset_ms: Optional[float] = None) -> int:
        now = timestamp if timestamp is not None else time.time()
        payload_str = json.dumps(payload) if not isinstance(payload, str) else json.dumps({"text": payload})

        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                # Get session start_time if offset_ms not explicitly provided
                if offset_ms is None:
                    cur.execute("SELECT start_time FROM sessions WHERE session_id = ?", (session_id,))
                    row = cur.fetchone()
                    if row:
                        start_time = row["start_time"]
                        offset_ms = max(0.0, (now - start_time) * 1000.0)
                    else:
                        offset_ms = 0.0

                cur.execute("""
                    INSERT INTO timeline_events (
                        session_id, timestamp, offset_ms, event_type, payload_json, severity
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (session_id, now, round(offset_ms, 2), event_type, payload_str, severity))
                event_id = cur.lastrowid

                # Update session event count
                cur.execute("UPDATE sessions SET event_count = event_count + 1 WHERE session_id = ?", (session_id,))
                conn.commit()

                # Broadcast to SSE
                GLOBAL_BROADCASTER.broadcast("timeline_event", {
                    "event_id": event_id,
                    "session_id": session_id,
                    "timestamp": now,
                    "offset_ms": round(offset_ms, 2),
                    "event_type": event_type,
                    "payload": json.loads(payload_str),
                    "severity": severity,
                })

                return event_id or 0
            finally:
                conn.close()

    def end_session(self, session_id: str, exit_code: int = 0, status: str = "completed"):
        now = time.time()
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT start_time FROM sessions WHERE session_id = ?", (session_id,))
                row = cur.fetchone()
                if row:
                    duration = max(0.0, now - row["start_time"])
                else:
                    duration = 0.0
                cur.execute("""
                    UPDATE sessions SET
                        end_time = ?,
                        duration_seconds = ?,
                        exit_code = ?,
                        status = ?
                    WHERE session_id = ?
                """, (now, round(duration, 3), exit_code, status, session_id))
                conn.commit()

                GLOBAL_BROADCASTER.broadcast("session_ended", {
                    "session_id": session_id,
                    "duration_seconds": round(duration, 3),
                    "exit_code": exit_code,
                    "status": status,
                })
            finally:
                conn.close()

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
                row = cur.fetchone()
                if not row:
                    return None
                data = dict(row)
                data["metadata"] = json.loads(data.get("metadata_json") or "{}")
                return data
            finally:
                conn.close()

    def get_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    SELECT session_id, title, command, start_time, end_time,
                           duration_seconds, exit_code, status, event_count, metadata_json
                    FROM sessions
                    ORDER BY start_time DESC LIMIT ?
                """, (limit,))
                results = []
                for row in cur.fetchall():
                    item = dict(row)
                    item["metadata"] = json.loads(item.get("metadata_json") or "{}")
                    results.append(item)
                return results
            finally:
                conn.close()

    def get_timeline(self, session_id: str, start_offset_ms: float = 0.0, end_offset_ms: Optional[float] = None) -> List[Dict[str, Any]]:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                if end_offset_ms is not None:
                    cur.execute("""
                        SELECT id, timestamp, offset_ms, event_type, payload_json, severity
                        FROM timeline_events
                        WHERE session_id = ? AND offset_ms >= ? AND offset_ms <= ?
                        ORDER BY offset_ms ASC
                    """, (session_id, start_offset_ms, end_offset_ms))
                else:
                    cur.execute("""
                        SELECT id, timestamp, offset_ms, event_type, payload_json, severity
                        FROM timeline_events
                        WHERE session_id = ? AND offset_ms >= ?
                        ORDER BY offset_ms ASC
                    """, (session_id, start_offset_ms))
                events = []
                for row in cur.fetchall():
                    events.append({
                        "id": row["id"],
                        "timestamp": row["timestamp"],
                        "offset_ms": row["offset_ms"],
                        "event_type": row["event_type"],
                        "payload": json.loads(row["payload_json"]),
                        "severity": row["severity"]
                    })
                return events
            finally:
                conn.close()

    def get_session_forensics(self, session_id: str, up_to_offset_ms: Optional[float] = None) -> Dict[str, Any]:
        """Compute state snapshot up to a specific scrubber offset."""
        events = self.get_timeline(session_id, start_offset_ms=0.0, end_offset_ms=up_to_offset_ms)
        
        terminal_lines = []
        network_nodes = set()
        synaptic_engrams = []
        max_threat_score = 0.0
        threat_events = []
        tokens_saved = 0
        file_mutations = []
        latest_cpu = 0.0
        latest_ram_mb = 0.0

        for ev in events:
            etype = ev["event_type"]
            p = ev["payload"]

            if etype in ("terminal_stdout", "terminal_stderr", "terminal"):
                line = p.get("text", "")
                terminal_lines.append(line)

            elif etype == "network_egress":
                dest = p.get("destination") or p.get("host") or p.get("url") or "unknown"
                network_nodes.add(dest)

            elif etype == "synaptic_engram":
                synaptic_engrams.append({
                    "id": p.get("id", f"engram-{ev['id']}"),
                    "offset_ms": ev["offset_ms"],
                    "text": p.get("text", "")[:120],
                    "importance": p.get("importance", 0.5)
                })

            elif etype == "prompt_scan":
                score = float(p.get("score", 0.0))
                max_threat_score = max(max_threat_score, score)
                if score >= 0.70 or p.get("blocked"):
                    threat_events.append({
                        "offset_ms": ev["offset_ms"],
                        "score": score,
                        "details": p.get("details", []),
                        "type": p.get("threat_type", "HIGH")
                    })

            elif etype == "mock_replay":
                tokens_saved += int(p.get("tokens_saved", 35))

            elif etype == "file_mutation":
                file_mutations.append({
                    "path": p.get("path"),
                    "action": p.get("action", "modify"),
                    "bytes": p.get("bytes", 0)
                })

            elif etype == "system_metric":
                latest_cpu = float(p.get("cpu_percent", 0.0))
                latest_ram_mb = float(p.get("memory_mb", 0.0))

        return {
            "session_id": session_id,
            "scrub_offset_ms": up_to_offset_ms,
            "events_count": len(events),
            "terminal_text": "\n".join(terminal_lines),
            "network_nodes": sorted(list(network_nodes)),
            "synaptic_engrams": synaptic_engrams,
            "max_threat_score": max_threat_score,
            "threat_events": threat_events,
            "tokens_saved": tokens_saved,
            "file_mutations": file_mutations,
            "cpu_percent": latest_cpu,
            "memory_mb": latest_ram_mb
        }

    def get_db_stats(self) -> Dict[str, Any]:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT COUNT(*) FROM sessions")
                total_sessions = cur.fetchone()[0]
                cur.execute("SELECT COUNT(*) FROM timeline_events")
                total_events = cur.fetchone()[0]
                cur.execute("SELECT SUM(duration_seconds) FROM sessions")
                total_duration = cur.fetchone()[0] or 0.0

                size_bytes = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0

                return {
                    "total_sessions": total_sessions,
                    "total_events": total_events,
                    "total_recorded_duration_s": round(total_duration, 2),
                    "storage_size_bytes": size_bytes,
                    "storage_size_kb": round(size_bytes / 1024, 2)
                }
            finally:
                conn.close()

    def clear(self):
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("DELETE FROM timeline_events")
                cur.execute("DELETE FROM sessions")
                conn.commit()
            finally:
                conn.close()
