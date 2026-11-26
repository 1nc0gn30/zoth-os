"""Local-First Zero-Egress Voice Synthesis Bridge.

Strict Local-First Audio Pipeline (Zero Cloud Egress by Default):
1. Tier 1 (Local Neural): Kokoro ONNX server on 127.0.0.1:9394 (when online)
2. Tier 2 (Local Offline): Local piper binary (if configured) or espeak-ng / espeak
3. Tier 3 (Local Pure-Python): Synthesized 24 kHz 16-bit mono PCM WAV tone fallback
4. Opt-in Cloud (Disabled by Default): Microsoft edge-tts ONLY when ZOTH_ALLOW_CLOUD_TTS=1
"""

from __future__ import annotations

import json
import logging
import math
import os
import shutil
import struct
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger("agent_voice_call.tts_bridge")

KOKORO_PORT = int(os.environ.get("KOKORO_PORT", "9394"))
KOKORO_URL = f"http://127.0.0.1:{KOKORO_PORT}/speak"
KOKORO_HEALTH_URL = f"http://127.0.0.1:{KOKORO_PORT}/health"

EDGE_TTS_BIN = os.environ.get("EDGE_TTS_BIN", "/opt/zothos-ai-env/bin/edge-tts")

VOICES: Dict[str, Dict[str, str]] = {
    "azoth": {
        "id": "am_michael",
        "espeak_voice": "en-us+m3",
        "edge_voice": "en-US-ChristopherNeural",
        "label": "Azoth",
        "tone": "Deep, Strategic, Resonant Baritone",
    },
    "ghostbyte": {
        "id": "am_onyx",
        "espeak_voice": "en-us+m1",
        "edge_voice": "en-US-GuyNeural",
        "label": "Ghostbyte",
        "tone": "Cybernetic, Decisive, Imperator",
    },
    "athena": {
        "id": "bf_emma",
        "espeak_voice": "en-gb+f3",
        "edge_voice": "en-GB-SoniaNeural",
        "label": "Athena",
        "tone": "Articulate, Sharp, British Classical",
    },
    "mercury": {
        "id": "am_puck",
        "espeak_voice": "en-us+m4",
        "edge_voice": "en-US-EricNeural",
        "label": "Mercury",
        "tone": "Fast, Agile, Inquisitive",
    },
    "kitsune": {
        "id": "af_heart",
        "espeak_voice": "en-us+f4",
        "edge_voice": "en-US-JennyNeural",
        "label": "Kitsune",
        "tone": "Warm, Natural, Conversational",
    },
    "chronos": {
        "id": "bm_daniel",
        "espeak_voice": "en-gb+m2",
        "edge_voice": "en-GB-RyanNeural",
        "label": "Chronos",
        "tone": "Measured, Deep, Stoic Architect",
    },
}


def is_cloud_tts_allowed() -> bool:
    """Cloud TTS is strictly opt-in via ZOTH_ALLOW_CLOUD_TTS=1 (off by default)."""
    return os.environ.get("ZOTH_ALLOW_CLOUD_TTS", "").strip().lower() in ("1", "true", "yes")


def _sanitize_cli_text(text: str, max_len: int = 400) -> str:
    """Normalize whitespace and neutralize leading dashes so subprocesses never parse text as flags."""
    clean = " ".join(str(text or "").split()).strip()[:max_len]
    if not clean:
        return ""
    if clean.startswith("-"):
        clean = " " + clean
    return clean


def is_kokoro_online(timeout: float = 0.35) -> bool:
    """Check if local Kokoro voice engine is responsive on 127.0.0.1:9394."""
    try:
        req = urllib.request.Request(KOKORO_HEALTH_URL)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def get_tts_status() -> Dict[str, Any]:
    """Report active local-first TTS engine status without triggering network egress."""
    kokoro_up = is_kokoro_online(timeout=0.25)
    piper_bin = shutil.which("piper")
    piper_model = os.environ.get("PIPER_MODEL", "").strip()
    piper_ready = bool(piper_bin and piper_model and os.path.isfile(piper_model))
    espeak_bin = shutil.which("espeak-ng") or shutil.which("espeak")
    cloud_opt_in = is_cloud_tts_allowed()

    if kokoro_up:
        active_engine = "kokoro"
    elif piper_ready:
        active_engine = "piper"
    elif espeak_bin:
        active_engine = "espeak-ng"
    elif cloud_opt_in:
        active_engine = "edge-tts (opt-in)"
    else:
        active_engine = "pcm-synth"

    return {
        "tts_engine": active_engine,
        "local_first_tts": True,
        "cloud_tts_opt_in": cloud_opt_in,
        "kokoro_online": kokoro_up,
        "piper_available": piper_ready,
        "espeak_available": bool(espeak_bin),
    }


def _synthesize_kokoro(clean_text: str, voice_name: str, timeout: float = 3.0) -> Optional[bytes]:
    """Tier 1: Request speech synthesis from local Kokoro server on 127.0.0.1:9394."""
    if not is_kokoro_online(timeout=0.25):
        return None

    v_info = VOICES.get(voice_name.lower(), VOICES["azoth"])
    voice_id = v_info.get("id", "am_michael")

    payload = json.dumps({
        "text": clean_text[:350],
        "voice": voice_id,
    }).encode("utf-8")

    req = urllib.request.Request(
        KOKORO_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = resp.read()
                if len(data) > 44:
                    return data
    except Exception as e:
        logger.warning("Kokoro synthesis failed: %s", e)
    return None


def _synthesize_piper(clean_text: str, timeout: float = 4.0) -> Optional[bytes]:
    """Tier 2a: Local offline Piper ONNX CLI if binary and PIPER_MODEL are configured."""
    piper_bin = shutil.which("piper")
    piper_model = os.environ.get("PIPER_MODEL", "").strip()
    if not piper_bin or not piper_model or not os.path.isfile(piper_model):
        return None

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_wav:
        wav_path = f_wav.name

    try:
        cmd = [piper_bin, "--model", piper_model, "--output_file", wav_path]
        res = subprocess.run(
            cmd,
            input=(clean_text[:400] + "\n").encode("utf-8"),
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        if res.returncode == 0 and os.path.exists(wav_path) and os.path.getsize(wav_path) > 44:
            with open(wav_path, "rb") as f:
                return f.read()
    except Exception as e:
        logger.warning("Piper synthesis failed: %s", e)
    finally:
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except OSError:
                pass
    return None


def _synthesize_espeak(clean_text: str, voice_name: str = "azoth", timeout: float = 3.0) -> Optional[bytes]:
    """Tier 2b: Local offline espeak-ng / espeak with strict '--' separator."""
    espeak_bin = shutil.which("espeak-ng") or shutil.which("espeak")
    if not espeak_bin:
        return None

    safe_text = _sanitize_cli_text(clean_text, max_len=400)
    if not safe_text:
        return None

    v_info = VOICES.get(voice_name.lower(), VOICES["azoth"])
    espeak_voice = v_info.get("espeak_voice", "en-us")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_wav:
        wav_path = f_wav.name

    try:
        # Use '--' so leading-dash text like '--version' or '-x' is never parsed as CLI flags
        cmd = [espeak_bin, "-v", espeak_voice, "-w", wav_path, "--", safe_text]
        res = subprocess.run(cmd, capture_output=True, timeout=timeout, check=False)
        if res.returncode != 0 or not os.path.exists(wav_path) or os.path.getsize(wav_path) <= 44:
            # Retry with default voice if variant isn't installed
            cmd_fallback = [espeak_bin, "-w", wav_path, "--", safe_text]
            res = subprocess.run(cmd_fallback, capture_output=True, timeout=timeout, check=False)
        if res.returncode == 0 and os.path.exists(wav_path) and os.path.getsize(wav_path) > 44:
            with open(wav_path, "rb") as f:
                return f.read()
    except Exception as e:
        logger.warning("espeak synthesis failed: %s", e)
    finally:
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except OSError:
                pass
    return None


def _synthesize_pcm_fallback(clean_text: str, voice_name: str = "azoth") -> bytes:
    """Tier 3: Pure-Python stdlib PCM WAV cadence tone (zero binaries, zero network)."""
    sample_rate = 24000
    word_count = max(1, min(12, len(clean_text.split())))
    duration_sec = min(1.2, 0.25 + word_count * 0.05)
    num_samples = int(sample_rate * duration_sec)

    base_freqs = {
        "azoth": 220.0,
        "ghostbyte": 246.94,
        "athena": 329.63,
        "mercury": 293.66,
        "kitsune": 349.23,
        "chronos": 196.0,
    }
    freq = base_freqs.get(voice_name.lower(), 220.0)

    pcm_frames = bytearray()
    for i in range(num_samples):
        t = i / sample_rate
        env = math.sin(math.pi * min(1.0, i / max(1, num_samples - 1)))
        sample = (
            0.22 * math.sin(2.0 * math.pi * freq * t)
            + 0.11 * math.sin(2.0 * math.pi * (freq * 1.5) * t)
        ) * env
        pcm_frames.extend(struct.pack("<h", int(max(-1.0, min(1.0, sample)) * 32767)))

    data_size = len(pcm_frames)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,  # PCM
        1,  # mono
        sample_rate,
        sample_rate * 2,
        2,
        16,
        b"data",
        data_size,
    )
    return header + bytes(pcm_frames)


def _synthesize_edge_tts(clean_text: str, voice_name: str, timeout: float = 7.0) -> Optional[bytes]:
    """Opt-in Cloud Tier (ONLY called when ZOTH_ALLOW_CLOUD_TTS=1)."""
    if not is_cloud_tts_allowed():
        return None

    edge_bin = EDGE_TTS_BIN if os.path.exists(EDGE_TTS_BIN) else shutil.which("edge-tts")
    ffmpeg_bin = shutil.which("ffmpeg")

    if not edge_bin or not ffmpeg_bin:
        return None

    safe_text = _sanitize_cli_text(clean_text, max_len=400)
    if not safe_text:
        return None

    v_info = VOICES.get(voice_name.lower(), VOICES["azoth"])
    edge_voice = v_info.get("edge_voice", "en-US-ChristopherNeural")

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f_mp3:
        mp3_path = f_mp3.name
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_wav:
        wav_path = f_wav.name

    try:
        # Use '--text=...' so leading-dash strings never confuse argparse
        cmd_edge = [edge_bin, f"--voice={edge_voice}", f"--text={safe_text}", f"--write-media={mp3_path}"]
        res_edge = subprocess.run(cmd_edge, capture_output=True, timeout=timeout, check=False)
        if res_edge.returncode != 0 or not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 100:
            return None

        cmd_ffmpeg = [
            ffmpeg_bin, "-y",
            "-i", mp3_path,
            "-ar", "24000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            "-v", "error",
            wav_path,
        ]
        res_ff = subprocess.run(cmd_ffmpeg, capture_output=True, timeout=timeout, check=False)
        if res_ff.returncode == 0 and os.path.exists(wav_path) and os.path.getsize(wav_path) > 44:
            with open(wav_path, "rb") as f:
                return f.read()
    except Exception as e:
        logger.warning("Edge-TTS synthesis error: %s", e)
    finally:
        for p in (mp3_path, wav_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass

    return None


def synthesize_speech_wav_with_engine(
    text: str,
    voice_name: str = "azoth",
    timeout: float = 8.0,
) -> Tuple[Optional[bytes], str]:
    """Synthesize speech locally first and return (wav_bytes, engine_name).

    Strict Local-First Order (Zero Cloud Egress by Default):
    1. Kokoro local ONNX daemon on 127.0.0.1:9394 (if online)
    2. Local offline Piper ONNX CLI (if PIPER_MODEL configured) or espeak-ng / espeak
    3. Opt-in Microsoft edge-tts ONLY when ZOTH_ALLOW_CLOUD_TTS=1
    4. Pure-Python local PCM WAV tone fallback
    """
    clean_text = " ".join(str(text or "").split()).strip()
    if not clean_text:
        return None, "none"

    # Tier 1: Local Kokoro server (127.0.0.1:9394)
    wav_bytes = _synthesize_kokoro(clean_text, voice_name=voice_name, timeout=min(3.0, timeout))
    if wav_bytes:
        return wav_bytes, "kokoro"

    # Tier 2a: Local Piper ONNX CLI
    wav_bytes = _synthesize_piper(clean_text, timeout=min(4.0, timeout))
    if wav_bytes:
        return wav_bytes, "piper"

    # Optional Cloud Opt-In (strictly gated behind ZOTH_ALLOW_CLOUD_TTS=1)
    if is_cloud_tts_allowed():
        wav_bytes = _synthesize_edge_tts(clean_text, voice_name=voice_name, timeout=timeout)
        if wav_bytes:
            return wav_bytes, "edge-tts"

    # Tier 2b: Local offline espeak-ng / espeak
    wav_bytes = _synthesize_espeak(clean_text, voice_name=voice_name, timeout=min(3.0, timeout))
    if wav_bytes:
        return wav_bytes, "espeak-ng"

    # Tier 3: Pure-Python PCM WAV synthesis fallback
    return _synthesize_pcm_fallback(clean_text, voice_name=voice_name), "pcm-synth"


def synthesize_speech_wav(text: str, voice_name: str = "azoth", timeout: float = 8.0) -> Optional[bytes]:
    """Synthesize speech using the local-first pipeline and return PCM WAV bytes."""
    wav_bytes, _engine = synthesize_speech_wav_with_engine(text, voice_name=voice_name, timeout=timeout)
    return wav_bytes


def convert_wav_to_opus_ogg(wav_bytes: bytes) -> Optional[bytes]:
    """Convert raw WAV audio to OGG Opus for efficient playback."""
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        logger.warning("ffmpeg not found, returning raw wav")
        return wav_bytes

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as in_f:
        in_f.write(wav_bytes)
        in_path = in_f.name

    out_path = in_path.replace(".wav", ".ogg")

    try:
        cmd = [
            ffmpeg_bin,
            "-y",
            "-i", in_path,
            "-c:a", "libopus",
            "-b:a", "32k",
            "-v", "error",
            out_path,
        ]
        res = subprocess.run(cmd, capture_output=True, timeout=10.0)
        if res.returncode == 0 and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            with open(out_path, "rb") as out_f:
                return out_f.read()
    except Exception as e:
        logger.warning("ffmpeg conversion failed: %s", e)
    finally:
        for p in (in_path, out_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass

    return wav_bytes


def generate_voice_file(
    text: str,
    voice_name: str = "azoth",
    out_format: str = "ogg",
    out_dir: Optional[Path] = None,
) -> Optional[str]:
    """Synthesize speech and save to a local file with 0600 permissions. Returns absolute path."""
    wav_data = synthesize_speech_wav(text, voice_name=voice_name)
    if not wav_data:
        return None

    if out_dir is not None:
        temp_dir = Path(out_dir)
    else:
        env_dir = os.environ.get("VOICE_CALL_DATA_DIR", "").strip()
        temp_dir = (Path(env_dir) / "voice_notes") if env_dir else (Path.home() / ".local" / "share" / "zoth" / "voice_calls" / "voice_notes")
    temp_dir.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(temp_dir, 0o700)
    except OSError:
        pass

    ext = "ogg" if out_format.lower() == "ogg" else "wav"
    payload = convert_wav_to_opus_ogg(wav_data) if ext == "ogg" else wav_data
    if not payload:
        return None

    file_path = temp_dir / f"voice_{os.getpid()}_{int(time.time() * 1000)}.{ext}"
    with open(file_path, "wb") as f:
        f.write(payload)
    try:
        os.chmod(file_path, 0o600)
    except OSError:
        pass
    return str(file_path)
