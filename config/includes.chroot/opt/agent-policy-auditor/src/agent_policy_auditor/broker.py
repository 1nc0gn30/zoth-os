"""Autonomous Policy Broker and Time-Bound Capability Leaser.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
Provides HMAC-SHA256 signed capability leases with automatic TTL expiry,
segment-aware path normalization, SQLite WAL persistence, audit event logging,
and emergency kill-switches.
100% Python Standard Library — Zero External Dependencies.
"""

from __future__ import annotations

import fnmatch
import hashlib
import hmac
import math
import os
import posixpath
import re
import secrets
import sqlite3
import threading
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

VALID_CAPABILITIES = frozenset({
    "FS_READ",
    "FS_WRITE",
    "NET_EGRESS",
    "SHELL_EXEC",
    "TOKEN_BUDGET",
})

FS_CAPABILITIES = frozenset({"FS_READ", "FS_WRITE"})

MIN_DURATION_SEC = 1.0
MAX_DURATION_SEC = 86400.0
MIN_BUDGET_USD = 0.0
MAX_BUDGET_USD = 100000.0


def _ensure_secure_file_mode(path: Path, mode: int = 0o600) -> None:
    """Enforce restrictive permissions on sensitive SQLite/secret files."""
    try:
        if path.exists():
            os.chmod(path, mode)
    except OSError:
        pass


def _load_or_create_secret_key(db_path: Optional[str] = None) -> str:
    """Resolve HMAC signing secret from env or 0600 key file; never fall back to a hardcoded constant."""
    env_key = os.environ.get("AGENT_POLICY_SECRET", "").strip()
    if env_key:
        return env_key

    candidates: List[Path] = [Path.home() / ".local" / "share" / "zoth" / "policy_secret.key"]
    if db_path and db_path != ":memory:":
        candidates.append(Path(db_path).resolve().parent / "policy_secret.key")

    for key_file in candidates:
        try:
            if key_file.is_file():
                val = key_file.read_text(encoding="utf-8").strip()
                if val:
                    _ensure_secure_file_mode(key_file, 0o600)
                    return val
            key_file.parent.mkdir(parents=True, exist_ok=True)
            generated = secrets.token_hex(32)
            fd = os.open(str(key_file), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
            try:
                os.write(fd, generated.encode("utf-8"))
            finally:
                os.close(fd)
            _ensure_secure_file_mode(key_file, 0o600)
            return generated
        except OSError:
            continue

    # Last resort: ephemeral CSPRNG key in memory (never a static constant)
    return secrets.token_hex(32)


def _has_traversal_segment(raw_path: str) -> bool:
    """Detect '..' path traversal segments or null bytes in a raw filesystem path."""
    if "\x00" in raw_path:
        return True
    unified = raw_path.replace("\\", "/")
    parts = [p for p in unified.split("/") if p != ""]
    return any(p == ".." for p in parts)


def _normalize_fs_path(raw_path: str) -> str:
    """Normalize a POSIX-style path while preserving leading '~' semantics."""
    s = raw_path.strip().replace("\\", "/")
    if s == "*":
        return "*"
    has_tilde = s == "~" or s.startswith("~/")
    if has_tilde:
        rest = s[2:] if s.startswith("~/") else ""
        norm_rest = posixpath.normpath("/" + rest).lstrip("/")
        return "~/" + norm_rest if norm_rest else "~"
    return posixpath.normpath(s)


def _compile_fs_glob(pattern: str) -> re.Pattern[str]:
    """Compile segment-aware glob: '**' crosses '/', '*' matches within a single segment."""
    out: List[str] = ["^"]
    i = 0
    n = len(pattern)
    while i < n:
        c = pattern[i]
        if c == "*":
            if i + 1 < n and pattern[i + 1] == "*":
                # Match zero or more path segments
                if i + 2 < n and pattern[i + 2] == "/":
                    out.append("(?:.*/)?")
                    i += 3
                    continue
                out.append(".*")
                i += 2
                continue
            out.append("[^/]*")
            i += 1
        elif c == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(c))
            i += 1
    out.append("$")
    return re.compile("".join(out))


def _match_fs_scope(target_raw: str, lease_pattern_raw: str) -> Tuple[bool, str]:
    """Strictly validate and match a filesystem target against a lease pattern."""
    if _has_traversal_segment(target_raw):
        return False, "PathTraversalBlocked: Target contains disallowed '..' traversal segment or null byte"
    if _has_traversal_segment(lease_pattern_raw):
        return False, "PathTraversalBlocked: Lease pattern contains disallowed '..' segment"

    norm_target = _normalize_fs_path(target_raw)
    norm_pattern = _normalize_fs_path(lease_pattern_raw)

    if norm_pattern == "*":
        return True, ""
    if norm_pattern == norm_target:
        return True, ""

    # Support `dir/**` matching `dir` itself as well as descendants
    if norm_pattern.endswith("/**"):
        prefix = norm_pattern[:-3].rstrip("/")
        if norm_target == prefix or norm_target.startswith(prefix + "/"):
            return True, ""
        return False, ""

    regex = _compile_fs_glob(norm_pattern)
    if regex.match(norm_target):
        return True, ""
    return False, ""


def _parse_finite_float(val: Any, name: str) -> float:
    if isinstance(val, bool):
        raise ValueError(f"{name} must be a finite number, not boolean")
    try:
        num = float(val)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be a valid finite number") from exc
    if not math.isfinite(num):
        raise ValueError(f"{name} must be finite (NaN/Infinity rejected)")
    return num


@dataclass
class CapabilityLease:
    lease_id: str
    agent_id: str
    capability: str  # FS_READ, FS_WRITE, NET_EGRESS, SHELL_EXEC, TOKEN_BUDGET
    target: str      # Path glob, domain, command pattern, etc.
    granted_at: float
    expires_at: float
    duration_sec: float
    max_budget_usd: float = 0.0
    used_budget_usd: float = 0.0
    active: bool = True
    revoked: bool = False
    signature: str = ""

    def is_expired(self) -> bool:
        return time.time() > self.expires_at

    def is_valid(self) -> bool:
        return self.active and not self.revoked and not self.is_expired()

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class PolicyBroker:
    """Manages agent capability leases and enforces security policies."""

    def __init__(self, db_path: Optional[str] = None, secret_key: Optional[str] = None):
        self._lock = threading.RLock()
        self.db_path = db_path or os.environ.get(
            "AGENT_POLICY_DB",
            str(Path.home() / ".local" / "share" / "zoth" / "policy_leases.db")
        )
        if self.db_path != ":memory:":
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._secret_key = (secret_key.strip() if isinstance(secret_key, str) and secret_key.strip() else _load_or_create_secret_key(self.db_path))
        self.leases: Dict[str, CapabilityLease] = {}
        self.violations_blocked: int = 0
        self.total_leases_granted: int = 0
        self._init_db()
        self._load_from_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=5.0)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self) -> None:
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS leases (
                        lease_id TEXT PRIMARY KEY,
                        agent_id TEXT,
                        capability TEXT,
                        target TEXT,
                        granted_at REAL,
                        expires_at REAL,
                        duration_sec REAL,
                        max_budget_usd REAL,
                        used_budget_usd REAL,
                        active INTEGER,
                        revoked INTEGER,
                        signature TEXT
                    )
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS broker_metrics (
                        key TEXT PRIMARY KEY,
                        val INTEGER DEFAULT 0
                    )
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS audit_events (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        ts REAL NOT NULL,
                        event_type TEXT NOT NULL,
                        agent_id TEXT DEFAULT '',
                        lease_id TEXT DEFAULT '',
                        capability TEXT DEFAULT '',
                        target TEXT DEFAULT '',
                        allowed INTEGER DEFAULT 1,
                        detail TEXT DEFAULT ''
                    )
                """)
                cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_events_ts ON audit_events(ts DESC)")
                conn.commit()
            finally:
                conn.close()
            if self.db_path != ":memory:":
                _ensure_secure_file_mode(Path(self.db_path), 0o600)

    def get_key_fingerprint(self) -> str:
        digest = hashlib.sha256(self._secret_key.encode("utf-8")).hexdigest()[:32]
        return f"SHA256:{digest}"

    def record_event(
        self,
        event_type: str,
        agent_id: str = "",
        lease_id: str = "",
        capability: str = "",
        target: str = "",
        allowed: bool = True,
        detail: str = "",
    ) -> None:
        """Persist a policy/audit event to SQLite."""
        with self._lock:
            try:
                conn = self._connect()
                try:
                    conn.execute(
                        """
                        INSERT INTO audit_events (ts, event_type, agent_id, lease_id, capability, target, allowed, detail)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            time.time(),
                            str(event_type)[:64],
                            str(agent_id)[:128],
                            str(lease_id)[:64],
                            str(capability)[:32],
                            str(target)[:512],
                            1 if allowed else 0,
                            str(detail)[:512],
                        ),
                    )
                    conn.commit()
                finally:
                    conn.close()
            except Exception:
                pass

    def get_audit_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Return recent persistent SQLite audit events."""
        safe_limit = max(1, min(int(limit), 200))
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    SELECT id, ts, event_type, agent_id, lease_id, capability, target, allowed, detail
                    FROM audit_events
                    ORDER BY id DESC
                    LIMIT ?
                    """,
                    (safe_limit,),
                )
                rows = cur.fetchall()
            finally:
                conn.close()
            return [
                {
                    "id": r[0],
                    "ts": r[1],
                    "event_type": r[2],
                    "agent_id": r[3],
                    "lease_id": r[4],
                    "capability": r[5],
                    "target": r[6],
                    "allowed": bool(r[7]),
                    "detail": r[8],
                }
                for r in rows
            ]

    def _increment_violation(self) -> None:
        self.violations_blocked += 1
        try:
            conn = self._connect()
            try:
                conn.execute(
                    "INSERT INTO broker_metrics (key, val) VALUES ('violations_blocked', 1) "
                    "ON CONFLICT(key) DO UPDATE SET val = val + 1"
                )
                conn.commit()
            finally:
                conn.close()
        except Exception:
            pass

    def _load_from_db(self) -> None:
        with self._lock:
            conn = self._connect()
            try:
                cur = conn.cursor()
                cur.execute(
                    "SELECT lease_id, agent_id, capability, target, granted_at, expires_at, "
                    "duration_sec, max_budget_usd, used_budget_usd, active, revoked, signature FROM leases"
                )
                rows = cur.fetchall()
                loaded: Dict[str, CapabilityLease] = {}
                for r in rows:
                    lease = CapabilityLease(
                        lease_id=r[0],
                        agent_id=r[1],
                        capability=r[2],
                        target=r[3],
                        granted_at=r[4],
                        expires_at=r[5],
                        duration_sec=r[6],
                        max_budget_usd=r[7],
                        used_budget_usd=r[8],
                        active=bool(r[9]),
                        revoked=bool(r[10]),
                        signature=r[11],
                    )
                    loaded[lease.lease_id] = lease
                self.leases = loaded
                cur.execute("SELECT val FROM broker_metrics WHERE key = 'violations_blocked'")
                m_row = cur.fetchone()
                if m_row is not None:
                    self.violations_blocked = max(self.violations_blocked, int(m_row[0]))
            finally:
                conn.close()
            self.total_leases_granted = len(self.leases)

    def _generate_signature(
        self,
        lease_id: str,
        agent_id: str,
        capability: str,
        target: str,
        granted_at: float,
        expires_at: float,
        max_budget_usd: float,
    ) -> str:
        payload = (
            f"{lease_id}:{agent_id}:{capability}:{target}:"
            f"{granted_at:.4f}:{expires_at:.4f}:{max_budget_usd:.4f}"
        ).encode("utf-8")
        return hmac.new(self._secret_key.encode("utf-8"), payload, hashlib.sha256).hexdigest()

    def grant_lease(
        self,
        agent_id: str,
        capability: str,
        target: str,
        duration_sec: float = 300.0,
        max_budget_usd: float = 0.0,
    ) -> CapabilityLease:
        """Issue a time-bound, HMAC-SHA256 signed capability lease to an agent."""
        if not isinstance(agent_id, str) or not agent_id.strip():
            raise ValueError("agent_id must be a non-empty string")
        clean_agent_id = agent_id.strip()
        if len(clean_agent_id) > 128 or "\x00" in clean_agent_id:
            raise ValueError("agent_id exceeds 128 characters or contains null bytes")

        if not isinstance(capability, str) or not capability.strip():
            raise ValueError("capability must be a non-empty string")
        cap_upper = capability.strip().upper()
        if cap_upper not in VALID_CAPABILITIES:
            allowed = ", ".join(sorted(VALID_CAPABILITIES))
            raise ValueError(f"Unsupported capability '{capability}'. Allowed: {allowed}")

        if not isinstance(target, str) or not target.strip():
            raise ValueError("target must be a non-empty string")
        clean_target = target.strip()
        if len(clean_target) > 512 or "\x00" in clean_target:
            raise ValueError("target exceeds 512 characters or contains null bytes")
        if cap_upper in FS_CAPABILITIES and _has_traversal_segment(clean_target):
            raise ValueError("Filesystem lease target must not contain '..' path traversal segments")

        dur = _parse_finite_float(duration_sec, "duration_sec")
        if dur < MIN_DURATION_SEC or dur > MAX_DURATION_SEC:
            raise ValueError(
                f"duration_sec must be between {int(MIN_DURATION_SEC)} and {int(MAX_DURATION_SEC)} seconds"
            )

        budget = _parse_finite_float(max_budget_usd, "max_budget_usd")
        if budget < MIN_BUDGET_USD or budget > MAX_BUDGET_USD:
            raise ValueError(
                f"max_budget_usd must be between {MIN_BUDGET_USD:.2f} and {MAX_BUDGET_USD:.2f}"
            )

        with self._lock:
            lease_id = f"lease_{secrets.token_hex(6)}"
            now = time.time()
            expires_at = now + dur
            sig = self._generate_signature(
                lease_id=lease_id,
                agent_id=clean_agent_id,
                capability=cap_upper,
                target=clean_target,
                granted_at=now,
                expires_at=expires_at,
                max_budget_usd=budget,
            )

            lease = CapabilityLease(
                lease_id=lease_id,
                agent_id=clean_agent_id,
                capability=cap_upper,
                target=clean_target,
                granted_at=now,
                expires_at=expires_at,
                duration_sec=dur,
                max_budget_usd=budget,
                used_budget_usd=0.0,
                active=True,
                revoked=False,
                signature=sig,
            )

            self.leases[lease_id] = lease
            self.total_leases_granted = len(self.leases)

            conn = self._connect()
            try:
                conn.execute(
                    "INSERT OR REPLACE INTO leases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        lease.lease_id,
                        lease.agent_id,
                        lease.capability,
                        lease.target,
                        lease.granted_at,
                        lease.expires_at,
                        lease.duration_sec,
                        lease.max_budget_usd,
                        lease.used_budget_usd,
                        int(lease.active),
                        int(lease.revoked),
                        lease.signature,
                    ),
                )
                conn.commit()
            finally:
                conn.close()

            self.record_event(
                event_type="LEASE_GRANTED",
                agent_id=lease.agent_id,
                lease_id=lease.lease_id,
                capability=lease.capability,
                target=lease.target,
                allowed=True,
                detail=f"ttl={dur:.0f}s budget=${budget:.2f}",
            )
            return lease

    def verify_action(
        self,
        lease_id: str,
        capability: str,
        target: str,
        cost_usd: float = 0.0,
    ) -> Tuple[bool, str]:
        """Verify whether an action is authorized under an active lease."""
        cost = _parse_finite_float(cost_usd, "cost_usd")
        if cost < 0.0:
            raise ValueError("cost_usd must be >= 0.0")
        if not isinstance(lease_id, str) or not lease_id.strip():
            raise ValueError("lease_id must be a non-empty string")
        if not isinstance(capability, str) or not capability.strip():
            raise ValueError("capability must be a non-empty string")
        if not isinstance(target, str) or not target.strip():
            raise ValueError("target must be a non-empty string")
        if "\x00" in target:
            raise ValueError("target must not contain null bytes")

        cap_upper = capability.strip().upper()
        if cap_upper not in VALID_CAPABILITIES:
            allowed = ", ".join(sorted(VALID_CAPABILITIES))
            raise ValueError(f"Unsupported capability '{capability}'. Allowed: {allowed}")

        clean_lease_id = lease_id.strip()
        target_clean = target.strip()

        self._load_from_db()
        with self._lock:
            lease = self.leases.get(clean_lease_id)
            if not lease:
                self._increment_violation()
                reason = "LeaseNotFound: No capability lease registered with this ID"
                self.record_event("ACTION_DENIED", "", clean_lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            if lease.revoked:
                self._increment_violation()
                reason = "LeaseRevoked: Capability lease was explicitly revoked by security operator"
                self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            if lease.is_expired():
                lease.active = False
                self._increment_violation()
                reason = f"LeaseExpired: Capability lease expired {time.time() - lease.expires_at:.1f}s ago"
                self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            # Verify cryptographic signature (covers max_budget_usd & granted_at)
            expected_sig = self._generate_signature(
                lease_id=lease.lease_id,
                agent_id=lease.agent_id,
                capability=lease.capability,
                target=lease.target,
                granted_at=lease.granted_at,
                expires_at=lease.expires_at,
                max_budget_usd=lease.max_budget_usd,
            )
            if not hmac.compare_digest(lease.signature, expected_sig):
                self._increment_violation()
                reason = "TamperedSignature: Lease signature verification failed (payload or budget modified)"
                self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            # Verify capability type
            if lease.capability != cap_upper:
                self._increment_violation()
                reason = f"CapabilityMismatch: Required {cap_upper}, lease only grants {lease.capability}"
                self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            # Verify target match
            lease_target = str(lease.target).strip()
            matched = False
            custom_deny_reason = ""

            if lease.capability in FS_CAPABILITIES:
                matched, custom_deny_reason = _match_fs_scope(target_clean, lease_target)
            else:
                patterns = [p.strip() for p in lease_target.split(",") if p.strip()] or [lease_target]
                for pat in patterns:
                    if pat == "*" or pat == target_clean or fnmatch.fnmatch(target_clean, pat):
                        matched = True
                        break

            if not matched:
                self._increment_violation()
                reason = custom_deny_reason or (
                    f"TargetNotPermitted: Action target '{target_clean}' does not match lease pattern '{lease_target}'"
                )
                self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                return False, reason

            # Check budget quota if applicable
            if lease.max_budget_usd > 0.0:
                if lease.used_budget_usd + cost > lease.max_budget_usd + 1e-12:
                    self._increment_violation()
                    reason = (
                        f"BudgetExceeded: Lease budget ${lease.max_budget_usd:.4f} exceeded "
                        f"(used: ${lease.used_budget_usd:.4f}, requested: ${cost:.4f})"
                    )
                    self.record_event("ACTION_DENIED", lease.agent_id, lease.lease_id, cap_upper, target_clean, False, reason)
                    return False, reason
                lease.used_budget_usd = round(lease.used_budget_usd + cost, 6)
                conn = self._connect()
                try:
                    conn.execute(
                        "UPDATE leases SET used_budget_usd = ? WHERE lease_id = ?",
                        (lease.used_budget_usd, lease.lease_id),
                    )
                    conn.commit()
                finally:
                    conn.close()

            reason = "Authorized: Action matches active capability lease"
            self.record_event(
                "ACTION_ALLOWED",
                lease.agent_id,
                lease.lease_id,
                cap_upper,
                target_clean,
                True,
                f"cost=${cost:.4f} used=${lease.used_budget_usd:.4f}/${lease.max_budget_usd:.4f}",
            )
            return True, reason

    def revoke_lease(self, lease_id: str) -> bool:
        """Revoke a specific lease immediately."""
        self._load_from_db()
        with self._lock:
            lease = self.leases.get(lease_id)
            if not lease:
                return False
            lease.active = False
            lease.revoked = True

            conn = self._connect()
            try:
                conn.execute("UPDATE leases SET active = 0, revoked = 1 WHERE lease_id = ?", (lease_id,))
                conn.commit()
            finally:
                conn.close()

            self.record_event(
                "LEASE_REVOKED",
                lease.agent_id,
                lease.lease_id,
                lease.capability,
                lease.target,
                True,
                "Revoked by operator",
            )
            return True

    def revoke_all_for_agent(self, agent_id: str) -> int:
        """Emergency Kill-Switch: Revoke all active leases for a specific agent."""
        self._load_from_db()
        count = 0
        with self._lock:
            for lease in self.leases.values():
                if lease.agent_id == agent_id and (lease.active and not lease.revoked):
                    lease.active = False
                    lease.revoked = True
                    count += 1
            if count > 0:
                conn = self._connect()
                try:
                    conn.execute("UPDATE leases SET active = 0, revoked = 1 WHERE agent_id = ?", (agent_id,))
                    conn.commit()
                finally:
                    conn.close()
                self.record_event(
                    "KILLSWITCH_AGENT",
                    agent_id,
                    "",
                    "",
                    "*",
                    True,
                    f"Revoked {count} active lease(s) for agent {agent_id}",
                )
        return count

    def revoke_all_leases(self) -> int:
        """Global Emergency Kill-Switch: Revoke EVERY active lease across all agents."""
        self._load_from_db()
        count = 0
        with self._lock:
            for lease in self.leases.values():
                if lease.active and not lease.revoked:
                    lease.active = False
                    lease.revoked = True
                    count += 1
            if count > 0:
                conn = self._connect()
                try:
                    conn.execute("UPDATE leases SET active = 0, revoked = 1 WHERE active = 1 OR revoked = 0")
                    conn.commit()
                finally:
                    conn.close()
                self.record_event(
                    "KILLSWITCH_ALL",
                    "*",
                    "",
                    "",
                    "*",
                    True,
                    f"Global kill-switch revoked {count} active lease(s) across all agents",
                )
        return count

    def get_lease(self, lease_id: str) -> Optional[Dict[str, Any]]:
        """Return a single lease record (or None)."""
        self._load_from_db()
        with self._lock:
            lease = self.leases.get(lease_id)
            if not lease:
                return None
            d = lease.to_dict()
            d["ttl_seconds"] = max(0.0, lease.expires_at - time.time())
            return d

    def get_active_leases(self) -> List[Dict[str, Any]]:
        """Return all valid, non-expired leases."""
        self._load_from_db()
        with self._lock:
            valid = []
            now = time.time()
            for lease in self.leases.values():
                if lease.is_valid():
                    d = lease.to_dict()
                    d["ttl_seconds"] = max(0.0, lease.expires_at - now)
                    valid.append(d)
            return sorted(valid, key=lambda x: x["ttl_seconds"])

    def get_stats(self) -> Dict[str, Any]:
        """Return operational telemetry."""
        self._load_from_db()
        with self._lock:
            active_count = sum(1 for lease in self.leases.values() if lease.is_valid())
            revoked_count = sum(1 for lease in self.leases.values() if lease.revoked)
            total_budget = sum(lease.max_budget_usd for lease in self.leases.values())
            used_budget = sum(lease.used_budget_usd for lease in self.leases.values())

            return {
                "total_leases_granted": self.total_leases_granted,
                "active_leases_count": active_count,
                "revoked_leases_count": revoked_count,
                "violations_blocked": self.violations_blocked,
                "total_budget_allocated_usd": round(total_budget, 4),
                "total_budget_consumed_usd": round(used_budget, 4),
            }
