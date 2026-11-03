"""Procedural Monotone Cyberpunk + Braille Matrix + Merkle CoT Audio Score (18.0s, -14.0 LUFS)."""

import math
from sfx import synth, dsp

SEED = 77
TARGET_LUFS = -14.0
TIMELINE = "timeline.json"
OUT = "audio_master.wav"


def bass_pulse(freq, dur=0.34):
    """Punchy analog saw+sub bass pulse for 128 BPM momentum."""
    n = int(dur * synth.SR)
    s1 = dsp.saw(freq, n)
    s2 = dsp.sine(freq * 0.5, n)
    raw = [0.58 * a + 0.78 * b for a, b in zip(s1, s2)]
    filt = dsp.svf(raw, lambda i: 160 + 1050 * math.exp(-i / (0.085 * synth.SR)), q=1.15, mode="lp")
    out = []
    for i, v in enumerate(filt):
        tt = i / synth.SR
        env = min(1.0, tt / 0.005) * math.exp(-tt / 0.21)
        out.append(math.tanh(1.55 * v * env))
    return out


def braille_arp(freqs, step_s=0.078, duty=0.25):
    """Crisp 1-bit Braille matrix pulse arpeggio for telemetry & Merkle DAG transitions."""
    out = []
    for f in freqs:
        n = int(step_s * synth.SR)
        p = dsp.pulse(f, n, width=duty)
        for k in range(n):
            tt = k / synth.SR
            env = min(1.0, tt / 0.003) * math.exp(-tt / (step_s * 0.82))
            out.append(p[k] * env * 0.44)
    return out


def score(mix, tl):
    dur = tl["duration"]

    # 1. Sovereign harmonic pad (D Dorian -> Bb Maj7 -> D Minor 9 Drop -> G Min9 -> D Maj9 Resolve)
    chords = [
        (0.0,  [146.83, 220.00, 261.63, 329.63, 440.00]),  # Dm9 (Amnesic RAM Boot)
        (3.0,  [116.54, 174.61, 220.00, 293.66, 349.23]),  # BbMaj7 (AZOTH Braille AI + Kokoro Voice)
        (6.5,  [146.83, 220.00, 293.66, 349.23, 523.25]),  # Dm11 (Chain of Thoughts Merkle DAG Drop)
        (10.5, [196.00, 293.66, 349.23, 440.00, 587.33]),  # Gm9 (Horological Chronometer & Cyber Dojo)
        (14.5, [146.83, 220.00, 293.66, 369.99, 440.00]),  # D Major (Sovereign Resolve)
    ]
    vol = synth.envelope([
        (0.0, 0.42),
        (2.8, 0.50),
        (6.2, 0.32),
        (6.5, 0.65),
        (10.5, 0.56),
        (14.5, 0.66),
        (17.8, 0.22),
    ])
    pad_l, pad_r = synth.pad(dur, chords, volume=vol, detune=0.72, tremolo=0.25, xfade=0.40)
    mix.put_stereo(0.0, pad_l, pad_r, gain=0.46)

    # 2. Driving 128 BPM bassline grid (0.46875s per beat)
    spb = 60.0 / 128.0
    roots = [
        (0.0, 3.0, 73.42),    # D2
        (3.0, 6.5, 58.27),    # Bb1
        (6.5, 10.5, 73.42),   # D2 (Chain of Thoughts Drop)
        (10.5, 14.5, 98.00),  # G2
        (14.5, 17.5, 73.42),  # D2
    ]
    t = 0.0
    beat_idx = 0
    while t < 17.3:
        root_f = 73.42
        for s0, s1, rf in roots:
            if s0 <= t < s1:
                root_f = rf
                break
        gain = 0.38 if t < 3.0 else (0.60 if 6.5 <= t < 14.5 else 0.46)
        octave = 2.0 if (beat_idx % 2 == 1 and t >= 6.5) else 1.0
        mix.put(t, bass_pulse(root_f * octave, dur=0.32), gain=gain)
        if beat_idx % 2 == 1 and t >= 3.0:
            mix.put(t, synth.click(freq=2500, dur=0.032), gain=0.19, pan=0.15)
        t += spb
        beat_idx += 1

    # 3. Scene transitions, risers, impacts, and telemetry cues
    # Scene 1 (0.0s): Amnesic Boot Impact + 3D Braille Matrix Ignition
    mix.put(0.02, synth.impact(dur=1.05), gain=0.76)
    mix.put(0.08, synth.chime([293.66, 440.0, 587.33, 880.0], dur=1.5, tau=0.6), gain=0.38)
    mix.typing(0.30, 1.70, 26, gain=(0.14, 0.22))

    # Scene 2 (3.0s): AZOTH Embodied Braille AI & Kokoro Neural TTS
    mix.put(2.80, synth.whoosh(0.42, 300, 2400, peak=0.65), gain=0.54, pan=-0.25)
    mix.put(3.00, synth.pop(360, 720, dur=0.16), gain=0.46, pan=-0.20)
    mix.put(3.15, braille_arp([293.66, 349.23, 440.0, 587.33, 880.0], step_s=0.08), gain=0.48, pan=0.15)
    mix.put(4.60, synth.pop(440, 880, dur=0.16), gain=0.44, pan=0.25)

    # Big Riser into Scene 3 (Chain of Thoughts Working Memory Drop at 6.5s)
    mix.put(5.20, synth.riser(1.30, f0=240, f1=4800), gain=0.60)
    mix.put(6.50, synth.impact(dur=1.25), gain=0.90)
    mix.put(6.54, synth.chime([293.66, 440.0, 659.25, 880.0, 1174.66], dur=1.9, tau=0.75), gain=0.45)
    mix.typing(6.85, 8.35, 28, gain=(0.15, 0.23))
    # 4-tier memory node pop sequence
    for i in range(4):
        mix.put(8.50 + i * 0.35, synth.pop(420 + i * 140, 840 + i * 220, dur=0.15), gain=0.42, pan=-0.3 + i * 0.2)

    # Scene 4 (10.5s): Horological Chronometer & Cyber Dojo
    mix.put(10.30, synth.whoosh(0.40, 380, 2600, peak=0.62), gain=0.52, pan=0.25)
    mix.put(10.50, braille_arp([392.00, 440.0, 587.33, 698.46, 880.0], step_s=0.075), gain=0.50, pan=-0.20)
    # Horological chronometer ticks
    for k in range(10):
        tk = 11.0 + k * 0.14
        mix.put(tk, synth.click(freq=1600 + k * 120, dur=0.035), gain=0.24, pan=-0.25 + 0.05 * k)
    mix.put(12.80, synth.chime([440.0, 554.37, 659.25, 880.0], dur=1.4, tau=0.55), gain=0.42)

    # Scene 5 (14.5s): Final Brand Resolve
    mix.put(13.85, synth.riser(0.65, f0=320, f1=3600), gain=0.45)
    mix.put(14.50, synth.impact(dur=1.15), gain=0.76)
    mix.put(14.52, synth.chime([293.66, 369.99, 440.0, 587.33, 739.99, 880.0], dur=2.8, tau=1.1), gain=0.54)
    mix.put(14.95, braille_arp([293.66, 369.99, 440.0, 587.33, 739.99, 880.0], step_s=0.09), gain=0.38, pan=0.1)
