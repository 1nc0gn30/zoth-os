"""
storage.py: SQLite storage engine with zero external pip dependencies.
Stores routes, hits, and telemetry with microsecond in-memory routing cache.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional

from .parser import RecordedRoute


class MockStorage:
    """Thread-safe SQLite storage for mock routes and telemetry hits."""

    def __init__(self, db_path: str = "agent_mock.db"):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._routes_cache: List[RecordedRoute] = []
        self._init_db()
        self._load_cache()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS mock_routes (
                        id TEXT PRIMARY KEY,
                        method TEXT NOT NULL,
                        path TEXT NOT NULL,
                        query_params TEXT,
                        headers TEXT,
                        body_hash TEXT,
                        body_keys TEXT,
                        raw_body TEXT,
                        response_status INTEGER DEFAULT 200,
                        response_headers TEXT,
                        response_body TEXT,
                        source TEXT DEFAULT 'har',
                        provider TEXT DEFAULT 'custom',
                        token_estimate INTEGER DEFAULT 0,
                        hit_count INTEGER DEFAULT 0,
                        description TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_routes_method_path ON mock_routes(method, path)")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_routes_body_hash ON mock_routes(body_hash)")

                cur.execute("""
                    CREATE TABLE IF NOT EXISTS mock_hits (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp REAL NOT NULL,
                        method TEXT NOT NULL,
                        path TEXT NOT NULL,
                        match_type TEXT NOT NULL,
                        status_code INTEGER NOT NULL,
                        latency_ms INTEGER NOT NULL,
                        tokens_saved INTEGER NOT NULL,
                        usd_saved REAL NOT NULL,
                        provider TEXT NOT NULL,
                        route_id TEXT
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_hits_ts ON mock_hits(timestamp DESC)")

                cur.execute("""
                    CREATE TABLE IF NOT EXISTS server_config (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    )
                """)
                conn.commit()
            finally:
                conn.close()

    def _load_cache(self) -> None:
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT * FROM mock_routes ORDER BY created_at ASC")
                rows = cur.fetchall()
                loaded = []
                for r in rows:
                    loaded.append(self._row_to_route(r))
                self._routes_cache = loaded
            finally:
                conn.close()

    @staticmethod
    def _row_to_route(row: sqlite3.Row) -> RecordedRoute:
        return RecordedRoute(
            id=row["id"],
            method=row["method"],
            path=row["path"],
            query_params=json.loads(row["query_params"] or "{}"),
            headers=json.loads(row["headers"] or "{}"),
            body_hash=row["body_hash"] or "empty",
            body_keys=json.loads(row["body_keys"] or "[]"),
            raw_body=row["raw_body"] or "",
            response_status=row["response_status"],
            response_headers=json.loads(row["response_headers"] or "{}"),
            response_body=row["response_body"] or "",
            source=row["source"],
            provider=row["provider"],
            token_estimate=row["token_estimate"],
            description=row["description"] or "",
        )

    def save_route(self, route: RecordedRoute) -> bool:
        """Upsert a single route and update memory cache."""
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO mock_routes (
                        id, method, path, query_params, headers, body_hash, body_keys,
                        raw_body, response_status, response_headers, response_body,
                        source, provider, token_estimate, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        method=excluded.method,
                        path=excluded.path,
                        query_params=excluded.query_params,
                        headers=excluded.headers,
                        body_hash=excluded.body_hash,
                        body_keys=excluded.body_keys,
                        raw_body=excluded.raw_body,
                        response_status=excluded.response_status,
                        response_headers=excluded.response_headers,
                        response_body=excluded.response_body,
                        source=excluded.source,
                        provider=excluded.provider,
                        token_estimate=excluded.token_estimate,
                        description=excluded.description
                """, (
                    route.id,
                    route.method,
                    route.path,
                    json.dumps(route.query_params),
                    json.dumps(route.headers),
                    route.body_hash,
                    json.dumps(route.body_keys),
                    route.raw_body,
                    route.response_status,
                    json.dumps(route.response_headers),
                    route.response_body,
                    route.source,
                    route.provider,
                    route.token_estimate,
                    route.description,
                ))
                conn.commit()

                # Update in-memory cache
                self._routes_cache = [r for r in self._routes_cache if r.id != route.id]
                self._routes_cache.append(route)
                return True
            finally:
                conn.close()

    def save_routes(self, routes: List[RecordedRoute]) -> int:
        """Batch save multiple routes."""
        count = 0
        for r in routes:
            if self.save_route(r):
                count += 1
        return count

    def get_routes(self) -> List[RecordedRoute]:
        """Return list of all cached routes."""
        with self._lock:
            return list(self._routes_cache)

    def record_hit(
        self,
        method: str,
        path: str,
        match_type: str,
        status_code: int,
        latency_ms: int,
        tokens_saved: int,
        usd_saved: float,
        provider: str,
        route_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Record an intercepted request hit and increment route counter."""
        ts = time.time()
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO mock_hits (
                        timestamp, method, path, match_type, status_code,
                        latency_ms, tokens_saved, usd_saved, provider, route_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ts, method, path, match_type, status_code,
                    latency_ms, tokens_saved, usd_saved, provider, route_id
                ))

                if route_id:
                    cur.execute("UPDATE mock_routes SET hit_count = hit_count + 1 WHERE id = ?", (route_id,))

                conn.commit()
            finally:
                conn.close()

        return {
            "timestamp": ts,
            "method": method,
            "path": path,
            "match_type": match_type,
            "status_code": status_code,
            "latency_ms": latency_ms,
            "tokens_saved": tokens_saved,
            "usd_saved": usd_saved,
            "provider": provider,
            "route_id": route_id,
        }

    def get_recent_hits(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent hits for replay log."""
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    SELECT id, timestamp, method, path, match_type, status_code,
                           latency_ms, tokens_saved, usd_saved, provider, route_id
                    FROM mock_hits
                    ORDER BY id DESC
                    LIMIT ?
                """, (limit,))
                rows = cur.fetchall()
                return [dict(r) for r in rows]
            finally:
                conn.close()

    def get_stats(self) -> Dict[str, Any]:
        """Aggregate global server stats."""
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("""
                    SELECT
                        COUNT(*) as total_hits,
                        COALESCE(SUM(tokens_saved), 0) as total_tokens,
                        COALESCE(SUM(usd_saved), 0.0) as total_usd,
                        COALESCE(AVG(latency_ms), 0.0) as avg_latency
                    FROM mock_hits
                """)
                summary = dict(cur.fetchone())

                cur.execute("SELECT match_type, COUNT(*) as cnt FROM mock_hits GROUP BY match_type")
                match_breakdown = {r["match_type"]: r["cnt"] for r in cur.fetchall()}

                cur.execute("SELECT provider, COUNT(*) as cnt FROM mock_hits GROUP BY provider")
                provider_breakdown = {r["provider"]: r["cnt"] for r in cur.fetchall()}

                routes_count = len(self._routes_cache)
                providers_set = sorted(list(set(r.provider for r in self._routes_cache)))

                return {
                    "total_hits": int(summary["total_hits"]),
                    "total_tokens_saved": int(summary["total_tokens"]),
                    "total_usd_saved": round(float(summary["total_usd"]), 4),
                    "avg_latency_ms": round(float(summary["avg_latency"]), 1),
                    "routes_count": routes_count,
                    "providers": providers_set,
                    "matches_by_type": match_breakdown,
                    "hits_by_provider": provider_breakdown,
                }
            finally:
                conn.close()

    def clear_all(self) -> None:
        """Clear all stored routes and hits."""
        with self._lock:
            conn = self._get_connection()
            try:
                cur = conn.cursor()
                cur.execute("DELETE FROM mock_hits")
                cur.execute("DELETE FROM mock_routes")
                conn.commit()
                self._routes_cache = []
            finally:
                conn.close()
