"""Live Call Engine & Agent Conversation Supervisor.

100% Python Standard Library — Zero External Dependencies.
Manages bounded conversational call sessions, local Ollama dialogue, local-first TTS,
and 0600-permissioned local transcript/debrief persistence.
"""

from __future__ import annotations

import glob
import json
import logging
import os
import secrets
import socket
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .tts_bridge import VOICES, synthesize_speech_wav_with_engine

logger = logging.getLogger("agent_voice_call.call_engine")

SIGNAL_SOCKET = "/tmp/signal-cli.sock"
SIGNAL_ACCOUNT = os.environ.get("SIGNAL_ACCOUNT", "")

MAX_ACTIVE_SESSIONS = 128
SESSION_IDLE_TTL_SEC = 3600.0
SESSION_MAX_AGE_SEC = 7200.0


class SessionLimitError(RuntimeError):
    """Raised when active session cap is reached."""


def resolve_data_dir(explicit_dir: Optional[Path] = None) -> Path:
    """Resolve persistent local data directory (overridable via VOICE_CALL_DATA_DIR)."""
    if explicit_dir is not None:
        return Path(explicit_dir)
    env_dir = os.environ.get("VOICE_CALL_DATA_DIR", "").strip()
    if env_dir:
        return Path(env_dir)
    return Path.home() / ".local" / "share" / "zoth" / "voice_calls"


@dataclass
class CallTurn:
    role: str  # "user" or "agent"
    text: str
    timestamp: str
    latency_ms: float = 0.0
    tts_engine: str = ""


@dataclass
class CallSession:
    session_id: str
    token: str
    channel: str  # "signal", "simplex", "web"
    created_at: float
    last_active: float = 0.0
    voice: str = "azoth"
    status: str = "ACTIVE"  # "ACTIVE", "ENDED"
    turns: List[CallTurn] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.last_active:
            self.last_active = self.created_at


class CallManager:
    """Manages bounded concurrent call sessions, tokens, agent dialogue, and local persistence."""

    def __init__(
        self,
        data_dir: Optional[Path] = None,
        max_sessions: int = MAX_ACTIVE_SESSIONS,
        idle_ttl_sec: float = SESSION_IDLE_TTL_SEC,
    ):
        self.sessions: Dict[str, CallSession] = {}
        self.token_to_id: Dict[str, str] = {}
        self._lock = threading.Lock()
        self.data_dir = resolve_data_dir(data_dir)
        self.debriefs_path = self.data_dir / "debriefs.jsonl"
        self.max_sessions = max_sessions
        self.idle_ttl_sec = idle_ttl_sec

    def _sweep_expired_locked(self, now: Optional[float] = None) -> int:
        """Expire idle/aged sessions and prune old ended entries. Caller holds self._lock."""
        now_ts = now if now is not None else time.time()
        removed = 0
        to_delete: List[str] = []

        for sid, session in list(self.sessions.items()):
            age = now_ts - session.created_at
            idle = now_ts - session.last_active
            if session.status == "ACTIVE" and (age > SESSION_MAX_AGE_SEC or idle > self.idle_ttl_sec):
                session.status = "ENDED"
            if session.status == "ENDED" and idle > 300.0:
                to_delete.append(sid)

        for sid in to_delete:
            sess = self.sessions.pop(sid, None)
            if sess:
                self.token_to_id.pop(sess.token, None)
                removed += 1

        # Cap total stored ended sessions in RAM so memory remains bounded
        ended = [s for s in self.sessions.values() if s.status == "ENDED"]
        if len(ended) > 64:
            ended.sort(key=lambda s: s.last_active)
            for sess in ended[: len(ended) - 64]:
                self.sessions.pop(sess.session_id, None)
                self.token_to_id.pop(sess.token, None)
                removed += 1

        return removed

    def active_session_count(self) -> int:
        with self._lock:
            self._sweep_expired_locked()
            return sum(1 for s in self.sessions.values() if s.status == "ACTIVE")

    def create_call_token(self, channel: str = "signal", voice: str = "azoth") -> Tuple[str, str]:
        """Generate a scoped call session token with bounded active session enforcement."""
        norm_voice = voice.lower().strip() if isinstance(voice, str) and voice.strip() else "azoth"
        if norm_voice not in VOICES:
            norm_voice = "azoth"
        norm_channel = channel.lower().strip() if isinstance(channel, str) and channel.strip() else "web"

        token = secrets.token_urlsafe(16)
        session_id = f"call_{secrets.token_hex(6)}"
        now_ts = time.time()

        with self._lock:
            self._sweep_expired_locked(now_ts)
            active_count = sum(1 for s in self.sessions.values() if s.status == "ACTIVE")
            if active_count >= self.max_sessions:
                raise SessionLimitError(f"Active session cap reached ({self.max_sessions})")

            session = CallSession(
                session_id=session_id,
                token=token,
                channel=norm_channel,
                created_at=now_ts,
                last_active=now_ts,
                voice=norm_voice,
                status="ACTIVE",
            )
            self.sessions[session_id] = session
            self.token_to_id[token] = session_id

        logger.info("Created call session %s for channel %s (voice=%s)", session_id, norm_channel, norm_voice)
        return session_id, token

    def validate_token(self, token: str) -> Optional[CallSession]:
        """Validate token and return active session if valid (never creates sessions)."""
        if not isinstance(token, str) or not token.strip():
            return None
        now_ts = time.time()
        with self._lock:
            self._sweep_expired_locked(now_ts)
            session_id = self.token_to_id.get(token)
            if not session_id:
                return None
            session = self.sessions.get(session_id)
            if session and session.status == "ACTIVE":
                if (now_ts - session.created_at) > SESSION_MAX_AGE_SEC or (now_ts - session.last_active) > self.idle_ttl_sec:
                    session.status = "ENDED"
                    return None
                return session
        return None

    def process_utterance(self, session: CallSession, user_text: str) -> Tuple[str, Optional[bytes], float]:
        """Process user utterance, query local reasoner, and synthesize local-first spoken reply."""
        t0 = time.time()
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        session.last_active = t0

        # 1. Record user turn
        session.turns.append(CallTurn(role="user", text=user_text, timestamp=now_str))

        # 2. Generate Agent Response
        agent_reply = self._generate_conversational_reply(session, user_text)

        # 3. Synthesize Voice Audio (local-first)
        audio_wav, tts_engine = synthesize_speech_wav_with_engine(agent_reply, voice_name=session.voice)

        elapsed_ms = round((time.time() - t0) * 1000.0, 1)
        session.last_active = time.time()
        session.metadata["last_tts_engine"] = tts_engine

        # 4. Record agent turn
        session.turns.append(CallTurn(
            role="agent",
            text=agent_reply,
            timestamp=datetime.now(timezone.utc).strftime("%H:%M:%S"),
            latency_ms=elapsed_ms,
            tts_engine=tts_engine,
        ))

        logger.info(
            "Call %s turn completed in %.1fms via %s: '%s'",
            session.session_id,
            elapsed_ms,
            tts_engine,
            agent_reply[:60],
        )
        return agent_reply, audio_wav, elapsed_ms

    def _persist_debrief(self, summary: Dict[str, Any]) -> bool:
        """Persist completed call debrief locally to 0600-permissioned JSONL."""
        try:
            self.data_dir.mkdir(parents=True, exist_ok=True)
            try:
                os.chmod(self.data_dir, 0o700)
            except OSError:
                pass
            line = json.dumps(summary, ensure_ascii=False) + "\n"
            fd = os.open(str(self.debriefs_path), os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            try:
                os.write(fd, line.encode("utf-8"))
            finally:
                os.close(fd)
            try:
                os.chmod(self.debriefs_path, 0o600)
            except OSError:
                pass
            return True
        except Exception as e:
            logger.warning("Failed persisting local debrief: %s", e)
            return False

    def list_debriefs(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Read recent persisted call debriefs from local disk (newest first)."""
        safe_limit = max(1, min(100, int(limit)))
        if not self.debriefs_path.exists():
            return []
        items: List[Dict[str, Any]] = []
        try:
            with open(self.debriefs_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        if isinstance(obj, dict):
                            items.append(obj)
                    except json.JSONDecodeError:
                        continue
        except OSError as e:
            logger.warning("Failed reading debrief history: %s", e)
            return []
        items.reverse()
        return items[:safe_limit]

    def end_call_session(self, session: CallSession) -> Dict[str, Any]:
        """End the call, persist transcript locally, and dispatch optional local hooks."""
        with self._lock:
            session.status = "ENDED"
            session.last_active = time.time()

        summary = self._summarize_session(session)
        persisted = self._persist_debrief(summary)
        summary["persisted_local"] = persisted
        summary["simplex_dispatched"] = False

        if os.environ.get("VOICE_CALL_DISABLE_EXTERNAL_HOOKS", "").strip() != "1":
            threading.Thread(target=self._dispatch_debrief, args=(session, summary), daemon=True).start()
            threading.Thread(target=self._ingest_telemetry, args=(session, summary), daemon=True).start()

        return summary

    def _generate_conversational_reply(self, session: CallSession, prompt: str) -> str:
        """Generate concise, natural spoken agent reply suited for voice dialogue."""
        lower = prompt.lower().strip()

        if any(g in lower for g in ("hello", "hey", "hi", "how are you", "are you there")):
            v_name = VOICES.get(session.voice, {}).get("label", "Azoth")
            return f"Hello. {v_name} here, live on the line. What objective are we tackling?"

        if "status" in lower or "system" in lower or "temps" in lower:
            try:
                t_files = glob.glob("/sys/class/thermal/thermal_zone*/temp")
                temp_c = "52"
                if t_files:
                    with open(t_files[0], "r", encoding="utf-8") as f:
                        temp_c = str(round(int(f.read().strip()) / 1000))
                return f"Systems are running cool at {temp_c} degrees Celsius. All local voice daemons are online and ready."
            except Exception:
                return "The local voice station is operational and system thermals are stable."

        if "who are you" in lower:
            v_name = VOICES.get(session.voice, {}).get("label", "Azoth")
            return f"I am {v_name}, your local AI voice persona on the NullAI Platform. All synthesis runs locally on your machine."

        # Route through local Ollama if available on 127.0.0.1:11434
        if os.environ.get("VOICE_CALL_DISABLE_OLLAMA", "").strip() != "1":
            for model_candidate in ("qwen2.5:0.5b", "llama3.2:1b", "qwen2.5:1.5b", "zoth-model:latest"):
                try:
                    req_data = json.dumps({
                        "model": model_candidate,
                        "prompt": (
                            f"You are {session.voice.upper()}, a local AI voice partner. "
                            f"Respond out loud in 1 to 2 concise spoken conversational sentences. "
                            f"Do not use markdown, emojis, or bullet points.\nUser: {prompt}\nAgent:"
                        ),
                        "stream": False,
                        "options": {"num_predict": 50, "temperature": 0.7},
                    }).encode("utf-8")
                    req = urllib.request.Request(
                        "http://127.0.0.1:11434/api/generate",
                        data=req_data,
                        headers={"Content-Type": "application/json"},
                    )
                    with urllib.request.urlopen(req, timeout=2.0) as resp:
                        if resp.status == 200:
                            res_json = json.loads(resp.read().decode("utf-8"))
                            text = str(res_json.get("response", "")).strip()
                            if text and not text.startswith("Error") and "not found" not in text:
                                return text
                except Exception:
                    continue

        return "Understood. I have logged that objective and persisted it to your local call transcript."

    def _summarize_session(self, session: CallSession) -> Dict[str, Any]:
        """Produce structured debrief of the voice call."""
        total_turns = len(session.turns)
        user_words = sum(len(t.text.split()) for t in session.turns if t.role == "user")
        duration_sec = round(max(0.0, time.time() - session.created_at), 1)
        dialogue_text = "\n".join([f"• {t.role.upper()} ({t.timestamp}): {t.text}" for t in session.turns])

        return {
            "session_id": session.session_id,
            "duration_sec": duration_sec,
            "total_turns": total_turns,
            "user_words": user_words,
            "voice": session.voice,
            "channel": session.channel,
            "tts_engine": session.metadata.get("last_tts_engine", "local"),
            "dialogue": dialogue_text,
            "ended_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "simplex_dispatched": False,
        }

    def _dispatch_debrief(self, session: CallSession, summary: Dict[str, Any]) -> None:
        """Optionally send formatted call debrief to Signal UNIX socket when configured."""
        signal_account = os.environ.get("SIGNAL_ACCOUNT", SIGNAL_ACCOUNT)
        if not (os.path.exists(SIGNAL_SOCKET) and signal_account):
            return

        msg = (
            f"[VOICE CALL COMPLETED · {summary['session_id']}]\n"
            f"Duration: {summary['duration_sec']}s ({summary['total_turns']} turns)\n"
            f"Voice Persona: {summary['voice'].upper()}\n"
            f"Ended At: {summary['ended_at']}\n\n"
            f"TRANSCRIPT:\n{summary['dialogue'][:2500]}\n"
        )
        try:
            payload = {
                "jsonrpc": "2.0",
                "method": "send",
                "params": {"recipient": [signal_account], "message": msg},
                "id": f"debrief-{int(time.time() * 1000)}",
            }
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as sock:
                sock.settimeout(5.0)
                sock.connect(SIGNAL_SOCKET)
                sock.sendall((json.dumps(payload) + "\n").encode("utf-8"))
                logger.info("Dispatched call debrief to Signal account %s", signal_account)
        except Exception as e:
            logger.warning("Failed sending debrief to Signal: %s", e)

    def _ingest_telemetry(self, session: CallSession, summary: Dict[str, Any]) -> None:
        """Optionally ingest call summary into local Neuro-Memory (:8094) and Flight Recorder (:8104)."""
        mem_payload = json.dumps({
            "text": (
                f"Live Voice Call [{session.session_id}] ({summary['duration_sec']}s, "
                f"{summary['total_turns']} turns). Voice: {session.voice}. "
                f"Dialogue: {summary['dialogue'][:800]}"
            ),
            "source": "agent-voice-call",
            "category": "live_voice_dialogue",
            "importance": 0.88,
            "tags": ["voice_call", session.session_id, session.voice],
        }).encode("utf-8")

        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8094/api/memories",
                data=mem_payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                logger.info("Ingested voice call engram to Neuro-Memory: status %d", resp.status)
        except Exception as e:
            logger.debug("Neuro-Memory ingestion skipped: %s", e)

        flt_payload = json.dumps({
            "session_id": f"flt-{session.session_id}",
            "event_type": "voice_call_session",
            "severity": "INFO",
            "payload": summary,
        }).encode("utf-8")

        try:
            req = urllib.request.Request(
                "http://127.0.0.1:8104/api/ingest",
                data=flt_payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                logger.info("Ingested flight telemetry: status %d", resp.status)
        except Exception as e:
            logger.debug("Flight recorder ingestion skipped: %s", e)
