"""
storage.py - Thread-Safe SQLite Time-Series Storage with SHA-256 Append-Only Hash Chain.
Zero external dependencies (Python 3.10+ standard library).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import hashlib
import json
import os
import queue
import sqlite3
import threading
import time
import uuid
from typing import Dict, Any, List, Optional

GENESIS_HASH = "0" * 64


def compute_event_hash(
    session_id: str,
    seq: int,
    offset_ms: float,
    event_type: str,
    payload: Any,
    prev_hash: str,
) -> str:
    """Compute deterministic SHA-256 hash linking an event to its predecessor."""
    canonical = json.dumps(
        {
            "session_id": str(session_id),
            "seq": int(seq),
            "offset_ms": round(float(offset_ms), 2),
            "event_type": str(event_type),
            "payload": payload,
            "prev_hash": str(prev_hash),
        },
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        f = float(val)
        if f != f:  # NaN check
            return default
        return f
    except (TypeError, ValueError):
        return default


def _safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


class EventBroadcaster:
    """Thread-safe event fan-out broadcaster for SSE streams."""

    def __init__(self):
        self._subscribers: List[queue.Queue] = []
        self._lock = threading.Lock()

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=200)
        with self._lock:
            self._subscribers.append(q)
        return q

    def unsubscribe(self, q: queue.Queue):
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)

    def broadcast(self, event_type: str, data: Dict[str, Any]):
        msg = f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
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
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=5000")
        return conn

    def _init_db(self):
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute(
                    """
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
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS timeline_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        session_id TEXT NOT NULL,
                        timestamp REAL NOT NULL,
                        offset_ms REAL NOT NULL,
                        event_type TEXT NOT NULL,
                        payload_json TEXT NOT NULL,
                        severity TEXT NOT NULL DEFAULT 'INFO',
                        seq INTEGER NOT NULL DEFAULT 0,
                        prev_hash TEXT NOT NULL DEFAULT '',
                        event_hash TEXT NOT NULL DEFAULT '',
                        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
                    )
                    """
                )

                # Safe schema migration for pre-v2.6.0 databases
                cur.execute("PRAGMA table_info(timeline_events)")
                existing_cols = {row["name"] for row in cur.fetchall()}
                if "seq" not in existing_cols:
                    cur.execute("ALTER TABLE timeline_events ADD COLUMN seq INTEGER NOT NULL DEFAULT 0")
                if "prev_hash" not in existing_cols:
                    cur.execute("ALTER TABLE timeline_events ADD COLUMN prev_hash TEXT NOT NULL DEFAULT ''")
                if "event_hash" not in existing_cols:
                    cur.execute("ALTER TABLE timeline_events ADD COLUMN event_hash TEXT NOT NULL DEFAULT ''")

                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON timeline_events(session_id)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_offset ON timeline_events(session_id, offset_ms)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON timeline_events(session_id, event_type)")
                conn.commit()
            finally:
                conn.close()

    def create_session(
        self,
        session_id: Optional[str] = None,
        title: str = "Agent Session",
        command: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        sid = session_id or f"flt-{uuid.uuid4().hex[:10]}"
        now = time.time()
        meta_str = json.dumps(metadata or {}, ensure_ascii=False)
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT session_id FROM sessions WHERE session_id = ?", (sid,))
                if cur.fetchone():
                    cur.execute(
                        """
                        UPDATE sessions
                        SET title = ?, command = ?, metadata_json = ?
                        WHERE session_id = ?
                        """,
                        (title, command, meta_str, sid),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO sessions (
                            session_id, title, command, start_time, status, event_count, metadata_json
                        ) VALUES (?, ?, ?, ?, 'recording', 0, ?)
                        """,
                        (sid, title, command, now, meta_str),
                    )
                conn.commit()
                return sid
            finally:
                conn.close()

    def ensure_session(
        self,
        session_id: str,
        title: Optional[str] = None,
        command: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a session row if it does not yet exist (prevents cross-daemon orphans)."""
        now = time.time()
        meta_str = json.dumps(metadata or {"auto_created": True}, ensure_ascii=False)
        resolved_title = title or f"Ingested Stream • {session_id}"
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT session_id FROM sessions WHERE session_id = ?", (session_id,))
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO sessions (
                            session_id, title, command, start_time, status, event_count, metadata_json
                        ) VALUES (?, ?, ?, ?, 'recording', 0, ?)
                        """,
                        (session_id, resolved_title, command, now, meta_str),
                    )
                    conn.commit()
                return session_id
            finally:
                conn.close()

    def append_event(
        self,
        session_id: str,
        event_type: str,
        payload: Any,
        severity: str = "INFO",
        timestamp: Optional[float] = None,
        offset_ms: Optional[float] = None,
    ) -> int:
        now = _safe_float(timestamp, time.time()) if timestamp is not None else time.time()
        payload_obj = payload if not isinstance(payload, str) else {"text": payload}
        payload_str = json.dumps(payload_obj, ensure_ascii=False)

        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()

                # Ensure parent session exists (FK integrity for cross-daemon telemetry)
                cur.execute("SELECT start_time FROM sessions WHERE session_id = ?", (session_id,))
                sess_row = cur.fetchone()
                if not sess_row:
                    auto_title = f"Ingested Stream • {session_id}"
                    cur.execute(
                        """
                        INSERT INTO sessions (
                            session_id, title, command, start_time, status, event_count, metadata_json
                        ) VALUES (?, ?, '', ?, 'recording', 0, ?)
                        """,
                        (session_id, auto_title, now, json.dumps({"auto_created": True})),
                    )
                    start_time = now
                else:
                    start_time = sess_row["start_time"]

                if offset_ms is None:
                    computed_offset = max(0.0, (now - start_time) * 1000.0)
                else:
                    computed_offset = max(0.0, _safe_float(offset_ms, 0.0))
                computed_offset = round(computed_offset, 2)

                # Link to previous event in session hash chain
                cur.execute(
                    """
                    SELECT seq, event_hash FROM timeline_events
                    WHERE session_id = ?
                    ORDER BY id DESC LIMIT 1
                    """,
                    (session_id,),
                )
                last_row = cur.fetchone()
                if last_row:
                    seq = int(last_row["seq"] or 0) + 1
                    prev_hash = last_row["event_hash"] or GENESIS_HASH
                else:
                    seq = 1
                    prev_hash = GENESIS_HASH

                event_hash = compute_event_hash(
                    session_id=session_id,
                    seq=seq,
                    offset_ms=computed_offset,
                    event_type=event_type,
                    payload=payload_obj,
                    prev_hash=prev_hash,
                )

                cur.execute(
                    """
                    INSERT INTO timeline_events (
                        session_id, timestamp, offset_ms, event_type, payload_json, severity,
                        seq, prev_hash, event_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        session_id,
                        now,
                        computed_offset,
                        event_type,
                        payload_str,
                        severity,
                        seq,
                        prev_hash,
                        event_hash,
                    ),
                )
                event_id = cur.lastrowid

                # Update session event count & observed duration
                obs_duration = round(computed_offset / 1000.0, 3)
                cur.execute(
                    """
                    UPDATE sessions
                    SET event_count = event_count + 1,
                        duration_seconds = MAX(COALESCE(duration_seconds, 0.0), ?)
                    WHERE session_id = ?
                    """,
                    (obs_duration, session_id),
                )
                conn.commit()

                # Broadcast to SSE
                GLOBAL_BROADCASTER.broadcast(
                    "timeline_event",
                    {
                        "id": event_id,
                        "event_id": event_id,
                        "session_id": session_id,
                        "seq": seq,
                        "timestamp": now,
                        "offset_ms": computed_offset,
                        "event_type": event_type,
                        "payload": payload_obj,
                        "severity": severity,
                        "prev_hash": prev_hash,
                        "event_hash": event_hash,
                    },
                )

                return event_id or 0
            finally:
                conn.close()

    def verify_session_chain(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Recompute and verify the SHA-256 hash chain for a session."""
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT session_id FROM sessions WHERE session_id = ?", (session_id,))
                if not cur.fetchone():
                    return None

                cur.execute(
                    """
                    SELECT id, session_id, seq, offset_ms, event_type, payload_json, prev_hash, event_hash
                    FROM timeline_events
                    WHERE session_id = ?
                    ORDER BY id ASC
                    """,
                    (session_id,),
                )
                rows = cur.fetchall()

                expected_prev = GENESIS_HASH
                expected_seq = 1
                head_hash = GENESIS_HASH

                for row in rows:
                    row_id = row["id"]
                    try:
                        payload_obj = json.loads(row["payload_json"])
                    except Exception:
                        return {
                            "session_id": session_id,
                            "valid": False,
                            "event_count": len(rows),
                            "head_hash": head_hash,
                            "broken_at_event_id": row_id,
                            "reason": "corrupt_payload_json",
                        }

                    row_prev = row["prev_hash"] or ""
                    row_hash = row["event_hash"] or ""
                    row_seq = int(row["seq"] or 0)

                    if row_seq != expected_seq or row_prev != expected_prev:
                        return {
                            "session_id": session_id,
                            "valid": False,
                            "event_count": len(rows),
                            "head_hash": head_hash,
                            "broken_at_event_id": row_id,
                            "reason": "prev_hash_or_seq_mismatch",
                        }

                    recomputed = compute_event_hash(
                        session_id=row["session_id"],
                        seq=row_seq,
                        offset_ms=row["offset_ms"],
                        event_type=row["event_type"],
                        payload=payload_obj,
                        prev_hash=row_prev,
                    )
                    if not row_hash or row_hash != recomputed:
                        return {
                            "session_id": session_id,
                            "valid": False,
                            "event_count": len(rows),
                            "head_hash": head_hash,
                            "broken_at_event_id": row_id,
                            "reason": "event_hash_mismatch",
                        }

                    head_hash = row_hash
                    expected_prev = row_hash
                    expected_seq += 1

                return {
                    "session_id": session_id,
                    "valid": True,
                    "event_count": len(rows),
                    "head_hash": head_hash,
                    "broken_at_event_id": None,
                }
            finally:
                conn.close()

    def end_session(self, session_id: str, exit_code: int = 0, status: str = "completed"):
        now = time.time()
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT start_time, duration_seconds FROM sessions WHERE session_id = ?", (session_id,))
                row = cur.fetchone()
                if row:
                    wall_dur = max(0.0, now - row["start_time"])
                    duration = max(wall_dur, float(row["duration_seconds"] or 0.0))
                else:
                    duration = 0.0
                cur.execute(
                    """
                    UPDATE sessions SET
                        end_time = ?,
                        duration_seconds = ?,
                        exit_code = ?,
                        status = ?
                    WHERE session_id = ?
                    """,
                    (now, round(duration, 3), exit_code, status, session_id),
                )
                conn.commit()

                GLOBAL_BROADCASTER.broadcast(
                    "session_ended",
                    {
                        "session_id": session_id,
                        "duration_seconds": round(duration, 3),
                        "exit_code": exit_code,
                        "status": status,
                    },
                )
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
                try:
                    data["metadata"] = json.loads(data.get("metadata_json") or "{}")
                except Exception:
                    data["metadata"] = {}
                return data
            finally:
                conn.close()

    def get_sessions(self, limit: int = 50) -> List[Dict[str, Any]]:
        safe_limit = max(1, min(500, _safe_int(limit, 50)))
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    SELECT session_id, title, command, start_time, end_time,
                           duration_seconds, exit_code, status, event_count, metadata_json
                    FROM sessions
                    ORDER BY start_time DESC LIMIT ?
                    """,
                    (safe_limit,),
                )
                results = []
                for row in cur.fetchall():
                    item = dict(row)
                    try:
                        item["metadata"] = json.loads(item.get("metadata_json") or "{}")
                    except Exception:
                        item["metadata"] = {}
                    results.append(item)
                return results
            finally:
                conn.close()

    def get_timeline(
        self,
        session_id: str,
        start_offset_ms: float = 0.0,
        end_offset_ms: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                if end_offset_ms is not None:
                    cur.execute(
                        """
                        SELECT id, session_id, timestamp, offset_ms, event_type, payload_json, severity,
                               seq, prev_hash, event_hash
                        FROM timeline_events
                        WHERE session_id = ? AND offset_ms >= ? AND offset_ms <= ?
                        ORDER BY offset_ms ASC, id ASC
                        """,
                        (session_id, start_offset_ms, end_offset_ms),
                    )
                else:
                    cur.execute(
                        """
                        SELECT id, session_id, timestamp, offset_ms, event_type, payload_json, severity,
                               seq, prev_hash, event_hash
                        FROM timeline_events
                        WHERE session_id = ? AND offset_ms >= ?
                        ORDER BY offset_ms ASC, id ASC
                        """,
                        (session_id, start_offset_ms),
                    )
                events = []
                for row in cur.fetchall():
                    try:
                        payload = json.loads(row["payload_json"])
                    except Exception:
                        payload = {"raw": row["payload_json"]}
                    events.append(
                        {
                            "id": row["id"],
                            "session_id": row["session_id"],
                            "seq": row["seq"],
                            "timestamp": row["timestamp"],
                            "offset_ms": row["offset_ms"],
                            "event_type": row["event_type"],
                            "payload": payload,
                            "severity": row["severity"],
                            "prev_hash": row["prev_hash"],
                            "event_hash": row["event_hash"],
                        }
                    )
                return events
            finally:
                conn.close()

    def get_events(
        self,
        session_id: Optional[str] = None,
        event_type: Optional[str] = None,
        q: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        safe_limit = max(1, min(500, _safe_int(limit, 100)))
        clauses = []
        params: List[Any] = []
        if session_id:
            clauses.append("session_id = ?")
            params.append(session_id)
        if event_type and event_type != "all":
            clauses.append("event_type = ?")
            params.append(event_type)
        if q:
            like = f"%{q}%"
            clauses.append("(event_type LIKE ? OR severity LIKE ? OR payload_json LIKE ? OR session_id LIKE ?)")
            params.extend([like, like, like, like])

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        sql = f"""
            SELECT id, session_id, timestamp, offset_ms, event_type, payload_json, severity,
                   seq, prev_hash, event_hash
            FROM timeline_events
            {where_sql}
            ORDER BY id DESC
            LIMIT ?
        """
        params.append(safe_limit)

        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute(sql, tuple(params))
                events = []
                for row in cur.fetchall():
                    try:
                        payload = json.loads(row["payload_json"])
                    except Exception:
                        payload = {"raw": row["payload_json"]}
                    events.append(
                        {
                            "id": row["id"],
                            "session_id": row["session_id"],
                            "seq": row["seq"],
                            "timestamp": row["timestamp"],
                            "offset_ms": row["offset_ms"],
                            "event_type": row["event_type"],
                            "payload": payload,
                            "severity": row["severity"],
                            "prev_hash": row["prev_hash"],
                            "event_hash": row["event_hash"],
                        }
                    )
                return events
            finally:
                conn.close()

    def get_session_forensics(
        self, session_id: str, up_to_offset_ms: Optional[float] = None
    ) -> Dict[str, Any]:
        """Compute cumulative state snapshot up to a specific scrubber offset."""
        events = self.get_timeline(session_id, start_offset_ms=0.0, end_offset_ms=up_to_offset_ms)

        terminal_lines: List[str] = []
        network_nodes = set()
        synaptic_engrams = []
        max_threat_score = 0.0
        threat_events = []
        tokens_saved = 0
        file_mutations = []
        capsule_executions = []
        latest_cpu = 0.0
        latest_ram_mb = 0.0

        for ev in events:
            etype = ev["event_type"]
            raw_p = ev["payload"]
            p = raw_p if isinstance(raw_p, dict) else {"text": str(raw_p)}

            if etype in ("terminal_stdout", "terminal_stderr", "terminal"):
                line = str(p.get("text", ""))
                terminal_lines.append(line)

            elif etype == "network_egress":
                dest = str(p.get("destination") or p.get("host") or p.get("url") or "unknown")
                network_nodes.add(dest)

            elif etype == "synaptic_engram":
                synaptic_engrams.append(
                    {
                        "id": str(p.get("id", f"engram-{ev['id']}")),
                        "offset_ms": ev["offset_ms"],
                        "text": str(p.get("text", ""))[:160],
                        "importance": _safe_float(p.get("importance"), 0.5),
                    }
                )

            elif etype == "prompt_scan":
                score = _safe_float(p.get("score"), 0.0)
                max_threat_score = max(max_threat_score, score)
                if score >= 0.70 or bool(p.get("blocked")):
                    threat_events.append(
                        {
                            "offset_ms": ev["offset_ms"],
                            "score": score,
                            "details": p.get("details", []),
                            "type": str(p.get("threat_type", "HIGH")),
                        }
                    )

            elif etype == "mock_replay":
                tokens_saved += _safe_int(p.get("tokens_saved"), 35)

            elif etype == "file_mutation":
                file_mutations.append(
                    {
                        "path": p.get("path"),
                        "action": str(p.get("action", "modify")),
                        "bytes": _safe_int(p.get("bytes"), 0),
                    }
                )

            elif etype == "capsule_execution":
                capsule_executions.append(
                    {
                        "offset_ms": ev["offset_ms"],
                        "capsule_id": p.get("capsule_id"),
                        "command": p.get("command"),
                        "exit_code": p.get("exit_code"),
                        "status": p.get("status"),
                        "receipt_sha256": p.get("receipt_sha256"),
                    }
                )

            elif etype == "system_metric":
                latest_cpu = _safe_float(p.get("cpu_percent"), latest_cpu)
                latest_ram_mb = _safe_float(p.get("memory_mb"), latest_ram_mb)

        chain = self.verify_session_chain(session_id)
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
            "capsule_executions": capsule_executions,
            "cpu_percent": latest_cpu,
            "memory_mb": latest_ram_mb,
            "chain_valid": bool(chain["valid"]) if chain else False,
            "head_hash": chain["head_hash"] if chain else GENESIS_HASH,
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
                    "storage_size_kb": round(size_bytes / 1024, 2),
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
