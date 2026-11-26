import os
import time
import subprocess
import threading
import asyncio

from .config import AUDIO_DIR, DEFAULT_INTRUDER_PHRASE, load_settings

ALLOWED_SFX = {
    "sonar_ping": "sonar_ping.wav",
    "access_granted": "access_granted.wav",
    "breach_claxon": "breach_claxon.wav",
}


class VoiceSynthesizer:
    def __init__(self, settings=None, precache=False):
        self.settings = dict(settings) if isinstance(settings, dict) else load_settings()
        self.is_speaking = False
        self._lock = threading.Lock()
        self._playback_process = None
        if precache:
            self.precache_standard_phrases()

    def _should_precache_cloud(self):
        if os.environ.get("ANDERSON_OFFLINE", "").strip().lower() in ("1", "true", "yes"):
            return False
        return self.settings.get("tts_engine", "edge") == "edge"

    def update_settings(self, settings):
        self.settings = settings
        if self._should_precache_cloud():
            threading.Thread(target=self.precache_standard_phrases, daemon=True).start()

    def precache_standard_phrases(self):
        """Pre-generate mp3 files for instant zero-latency playback when edge TTS is active."""
        if not self._should_precache_cloud():
            return

        welcome_text = self.settings.get("welcome_phrase", "Welcome back, Mr. Anderson.")
        intruder_text = self.settings.get("intruder_phrase", DEFAULT_INTRUDER_PHRASE)
        shoulder_text = self.settings.get("shoulder_phrase", "Warning. Someone is looking over your shoulder.")
        voice = self.settings.get("tts_voice", "en-US-ChristopherNeural")

        welcome_file = AUDIO_DIR / "welcome_anderson.mp3"
        intruder_file = AUDIO_DIR / "intruder_warning.mp3"
        shoulder_file = AUDIO_DIR / "shoulder_surfer.mp3"
        walk_away_file = AUDIO_DIR / "walk_away.mp3"

        def _gen():
            try:
                import edge_tts
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                async def _save():
                    await edge_tts.Communicate(welcome_text, voice, rate="+0%", pitch="-5Hz").save(str(welcome_file))
                    await edge_tts.Communicate(intruder_text, voice, rate="+0%", pitch="-5Hz").save(str(intruder_file))
                    await edge_tts.Communicate(shoulder_text, voice, rate="+5%", pitch="-3Hz").save(str(shoulder_file))
                    await edge_tts.Communicate("User departed. Locking terminal.", voice, rate="+0%", pitch="-5Hz").save(str(walk_away_file))

                loop.run_until_complete(_save())
                loop.close()
                print("[VoiceSynth] Neural audio cache updated successfully.")
            except Exception as e:
                print(f"[VoiceSynth] Warning pre-caching neural audio: {e}")

        t = threading.Thread(target=_gen, daemon=True)
        t.start()

    def play_sfx(self, sfx_name: str, blocking: bool = False) -> bool:
        """Play a safe pre-registered tactical sound effect; graceful no-op when headless/muted."""
        if not self.settings.get("play_sound_effects", True):
            return False
        if os.environ.get("ANDERSON_OFFLINE", "").strip().lower() in ("1", "true", "yes"):
            return False
        filename = ALLOWED_SFX.get(str(sfx_name or "").strip())
        if not filename:
            return False
        sfx_file = AUDIO_DIR / filename
        if not sfx_file.exists():
            return False

        def _runner():
            self._play_file(str(sfx_file))

        t = threading.Thread(target=_runner, daemon=True)
        t.start()
        if blocking:
            t.join()
        return True

    def speak(self, text, alert_type="custom", blocking=False):
        """Thread-safe playback. alert_type can be 'welcome', 'intruder', 'shoulder', 'walk_away', or 'custom'."""
        if os.environ.get("ANDERSON_OFFLINE", "").strip().lower() in ("1", "true", "yes"):
            return

        with self._lock:
            if self.is_speaking:
                return
            self.is_speaking = True

        def _runner():
            try:
                engine = self.settings.get("tts_engine", "edge")

                audio_file = None
                if alert_type == "welcome":
                    f = AUDIO_DIR / "welcome_anderson.mp3"
                    if f.exists() and f.stat().st_size > 500:
                        audio_file = str(f)
                elif alert_type == "intruder":
                    f = AUDIO_DIR / "intruder_warning.mp3"
                    if f.exists() and f.stat().st_size > 500:
                        audio_file = str(f)
                elif alert_type == "shoulder":
                    f = AUDIO_DIR / "shoulder_surfer.mp3"
                    if f.exists() and f.stat().st_size > 500:
                        audio_file = str(f)
                elif alert_type == "walk_away":
                    f = AUDIO_DIR / "walk_away.mp3"
                    if f.exists() and f.stat().st_size > 500:
                        audio_file = str(f)

                if self.settings.get("play_sound_effects", True):
                    sfx_file = None
                    if alert_type == "welcome":
                        sfx_file = AUDIO_DIR / "access_granted.wav"
                    elif alert_type == "intruder":
                        sfx_file = AUDIO_DIR / "breach_claxon.wav"
                    elif alert_type == "shoulder":
                        sfx_file = AUDIO_DIR / "sonar_ping.wav"

                    if sfx_file and sfx_file.exists():
                        self._play_file(str(sfx_file))

                if audio_file and engine != "espeak":
                    self._play_file(audio_file)
                elif engine == "espeak":
                    self._speak_espeak(text)
                else:
                    self._speak_edge_or_fallback(text)
            finally:
                with self._lock:
                    self.is_speaking = False

        t = threading.Thread(target=_runner, daemon=True)
        t.start()
        if blocking:
            t.join()

    def _play_file(self, filepath):
        try:
            self._playback_process = subprocess.Popen(
                ["/usr/bin/ffplay", "-nodisp", "-autoexit", "-loglevel", "quiet", filepath],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self._playback_process.wait()
        except Exception as e:
            print(f"[VoiceSynth] Playback error: {e}")

    def _speak_espeak(self, text):
        try:
            subprocess.run(
                ["/usr/bin/espeak-ng", "-v", "en-us", "-p", "35", "-s", "150", text],
                check=False
            )
        except Exception:
            try:
                subprocess.run(["/usr/bin/spd-say", "-t", "male1", text], check=False)
            except Exception:
                pass

    def _speak_edge_or_fallback(self, text):
        temp_file = str(AUDIO_DIR / f"temp_{int(time.time()*1000)}.mp3")
        try:
            import edge_tts
            voice = self.settings.get("tts_voice", "en-US-ChristopherNeural")
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def _save():
                comm = edge_tts.Communicate(text, voice)
                await comm.save(temp_file)

            loop.run_until_complete(_save())
            loop.close()
            self._play_file(temp_file)
            if os.path.exists(temp_file):
                os.remove(temp_file)
        except Exception as e:
            print(f"[VoiceSynth] Neural fallback to espeak due to: {e}")
            self._speak_espeak(text)
