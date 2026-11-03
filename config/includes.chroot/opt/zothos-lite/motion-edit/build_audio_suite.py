"""Synthesize mastered -14.0 LUFS procedural audio tracks for the 3-video ZothOS-Lite v1.1 Motion Edit Suite."""

import json
import math
import os
import sys

sys.path.insert(0, "/home/zoth/.gemini/config/skills/claude-motion/scripts")
from sfx import Mix, synth, dsp

DIR = "/home/zoth/NullAITech/zothos-lite/motion-edit"


def bass_pulse(freq, dur=0.34, drive=1.55):
    n = int(dur * synth.SR)
    s1 = dsp.saw(freq, n)
    s2 = dsp.sine(freq * 0.5, n)
    raw = [0.58 * a + 0.78 * b for a, b in zip(s1, s2)]
    filt = dsp.svf(raw, lambda i: 165 + 1150 * math.exp(-i / (0.082 * synth.SR)), q=1.18, mode="lp")
    out = []
    for i, v in enumerate(filt):
        tt = i / synth.SR
        env = min(1.0, tt / 0.005) * math.exp(-tt / 0.21)
        out.append(math.tanh(drive * v * env))
    return out


def braille_arp(freqs, step_s=0.075, duty=0.25):
    out = []
    for f in freqs:
        n = int(step_s * synth.SR)
        p = dsp.pulse(f, n, width=duty)
        for k in range(n):
            tt = k / synth.SR
            env = min(1.0, tt / 0.003) * math.exp(-tt / (step_s * 0.82))
            out.append(p[k] * env * 0.45)
    return out


def build_hero_showreel():
    """1. Flagship Hero Showreel (18.0s, 128 BPM, -14.0 LUFS)."""
    tl = {
        "title": "ZothOS-Lite v1.1 — Sovereign Amnesic Desktop OS Flagship Showreel",
        "fps": 60, "width": 1920, "height": 1080, "duration": 18.0, "bpm": 128
    }
    with open(os.path.join(DIR, "timeline_hero.json"), "w") as f:
        json.dump(tl, f, indent=2)

    mix = Mix(18.0, seed=101)
    dur = 18.0
    chords = [
        (0.0,  [146.83, 220.00, 261.63, 329.63, 440.00]),  # Dm9 (Amnesic Boot + 3D Cathedral)
        (3.2,  [116.54, 174.61, 220.00, 293.66, 349.23]),  # BbMaj7 (Konsole 25.04 Direct PTY)
        (6.8,  [130.81, 196.00, 261.63, 329.63, 493.88]),  # CMaj9 (Vaelor L1 + Zoth-Node Drop)
        (10.8, [146.83, 220.00, 293.66, 349.23, 523.25]),  # Dm11 (AZOTH Braille AI + Merkle CoT)
        (14.5, [146.83, 220.00, 293.66, 369.99, 440.00]),  # D Major (Sovereign Resolve)
    ]
    vol = synth.envelope([
        (0.0, 0.44), (3.0, 0.52), (6.5, 0.34), (6.8, 0.68), (10.8, 0.60), (14.5, 0.68), (17.8, 0.20)
    ])
    pad_l, pad_r = synth.pad(dur, chords, volume=vol, detune=0.75, tremolo=0.26, xfade=0.40)
    mix.put_stereo(0.0, pad_l, pad_r, gain=0.46)

    spb = 60.0 / 128.0
    roots = [
        (0.0, 3.2, 73.42),
        (3.2, 6.8, 58.27),
        (6.8, 10.8, 65.41),
        (10.8, 14.5, 73.42),
        (14.5, 17.5, 73.42),
    ]
    t = 0.0
    beat_idx = 0
    while t < 17.4:
        rf = 73.42
        for s0, s1, r in roots:
            if s0 <= t < s1:
                rf = r
                break
        gain = 0.42 if t < 3.2 else (0.62 if 6.8 <= t < 14.5 else 0.48)
        octave = 2.0 if (beat_idx % 2 == 1 and t >= 6.8) else 1.0
        mix.put(t, bass_pulse(rf * octave, dur=0.32), gain=gain)
        if beat_idx % 2 == 1 and t >= 3.2:
            mix.put(t, synth.click(freq=2600, dur=0.030), gain=0.20, pan=0.18 if beat_idx % 4 == 1 else -0.18)
        t += spb
        beat_idx += 1

    # Scene 1 (0.0s): Amnesic RAM Boot + 3D Cathedral/Singularity
    mix.put(0.02, synth.impact(dur=1.10), gain=0.80)
    mix.put(0.08, synth.chime([293.66, 440.0, 587.33, 880.0], dur=1.6, tau=0.65), gain=0.40)
    mix.typing(0.32, 1.80, 26, gain=(0.15, 0.22))

    # Scene 2 (3.2s): Direct In-Terminal Konsole 25.04 PTY
    mix.put(3.00, synth.whoosh(0.42, 320, 2500, peak=0.65), gain=0.55, pan=-0.25)
    mix.put(3.20, synth.pop(380, 760, dur=0.16), gain=0.46, pan=-0.20)
    mix.typing(3.45, 5.25, 32, gain=(0.16, 0.24))
    mix.put(5.35, braille_arp([293.66, 349.23, 440.0, 587.33, 880.0], step_s=0.075), gain=0.48, pan=0.20)

    # Scene 3 (6.8s): Vaelor L1 + Zoth-Node Validator Drop
    mix.put(5.55, synth.riser(1.25, f0=240, f1=4800), gain=0.62)
    mix.put(6.80, synth.impact(dur=1.30), gain=0.92)
    mix.put(6.84, synth.chime([261.63, 392.00, 523.25, 783.99, 1046.50], dur=1.9, tau=0.75), gain=0.46)
    for i in range(4):
        mix.put(7.40 + i * 0.42, synth.pop(440 + i * 130, 880 + i * 210, dur=0.15), gain=0.42, pan=-0.3 + i * 0.2)

    # Scene 4 (10.8s): AZOTH Embodied Braille AI & Chain-of-Thoughts DAG
    mix.put(10.60, synth.whoosh(0.40, 380, 2600, peak=0.62), gain=0.54, pan=0.25)
    mix.put(10.80, braille_arp([392.00, 440.0, 587.33, 698.46, 880.0], step_s=0.072), gain=0.50, pan=-0.20)
    mix.typing(11.15, 12.65, 24, gain=(0.14, 0.22))
    mix.put(13.10, synth.chime([440.0, 554.37, 659.25, 880.0], dur=1.4, tau=0.55), gain=0.42)

    # Scene 5 (14.5s): Final Sovereign Resolve
    mix.put(13.85, synth.riser(0.65, f0=320, f1=3600), gain=0.46)
    mix.put(14.50, synth.impact(dur=1.20), gain=0.78)
    mix.put(14.52, synth.chime([293.66, 369.99, 440.0, 587.33, 739.99, 880.0], dur=2.8, tau=1.1), gain=0.54)
    mix.put(14.95, braille_arp([293.66, 369.99, 440.0, 587.33, 739.99, 880.0], step_s=0.09), gain=0.40, pan=0.1)

    out_wav = os.path.join(DIR, "audio_hero.wav")
    stats = mix.master(target_lufs=-14.0)
    mix.write(out_wav)
    print("Saved", out_wav, stats)


def build_vaelor_node_edit():
    """2. Vaelor (VLR) L1 & Zoth-Node Validator Cockpit Motion Edit (15.0s, 132 BPM, -14.0 LUFS)."""
    tl = {
        "title": "Vaelor (VLR) L1 Account-Lattice & Zoth-Node Validator Cockpit Motion Edit",
        "fps": 60, "width": 1920, "height": 1080, "duration": 15.0, "bpm": 132
    }
    with open(os.path.join(DIR, "timeline_vaelor.json"), "w") as f:
        json.dump(tl, f, indent=2)

    mix = Mix(15.0, seed=202)
    dur = 15.0
    chords = [
        (0.0,  [164.81, 246.94, 329.63, 392.00, 493.88]),  # Em9 (Vaelor Account-Lattice Genesis)
        (3.5,  [130.81, 196.00, 246.94, 329.63, 392.00]),  # CMaj7 (Ed25519 + Blake2b + Argon2id)
        (7.2,  [146.83, 220.00, 293.66, 369.99, 440.00]),  # D6/9 (Thermal-Governed PoUW Guardrail)
        (11.2, [164.81, 246.94, 329.63, 415.30, 493.88]),  # E Major Resolve (Zoth-Node BFT Finality)
    ]
    vol = synth.envelope([
        (0.0, 0.45), (3.3, 0.54), (7.0, 0.36), (7.2, 0.68), (11.2, 0.66), (14.8, 0.22)
    ])
    pad_l, pad_r = synth.pad(dur, chords, volume=vol, detune=0.80, tremolo=0.28, xfade=0.38)
    mix.put_stereo(0.0, pad_l, pad_r, gain=0.45)

    spb = 60.0 / 132.0
    roots = [
        (0.0, 3.5, 82.41),   # E2
        (3.5, 7.2, 65.41),   # C2
        (7.2, 11.2, 73.42),  # D2
        (11.2, 14.5, 82.41), # E2
    ]
    t = 0.0
    beat_idx = 0
    while t < 14.4:
        rf = 82.41
        for s0, s1, r in roots:
            if s0 <= t < s1:
                rf = r
                break
        gain = 0.44 if t < 3.5 else (0.64 if 7.2 <= t < 11.5 else 0.50)
        octave = 2.0 if (beat_idx % 2 == 1 and t >= 3.5) else 1.0
        mix.put(t, bass_pulse(rf * octave, dur=0.30, drive=1.65), gain=gain)
        if beat_idx % 2 == 1:
            mix.put(t, synth.click(freq=2800, dur=0.028), gain=0.21, pan=-0.2 if beat_idx % 4 == 1 else 0.2)
        t += spb
        beat_idx += 1

    # Scene 1 (0.0s): Vaelor Account-Lattice & DAG-BFT Finality
    mix.put(0.02, synth.impact(dur=1.05), gain=0.82)
    mix.put(0.08, braille_arp([329.63, 493.88, 659.25, 987.77], step_s=0.07), gain=0.46)
    mix.typing(0.35, 1.85, 26, gain=(0.15, 0.23))

    # Scene 2 (3.5s): Ed25519 + Blake2b-256 + Argon2id Cold Signer
    mix.put(3.30, synth.whoosh(0.40, 350, 2700, peak=0.65), gain=0.56, pan=-0.25)
    mix.put(3.50, synth.pop(420, 840, dur=0.16), gain=0.48)
    for i in range(5):
        mix.put(3.85 + i * 0.32, synth.click(freq=1900 + i * 180, dur=0.035), gain=0.28, pan=-0.3 + i * 0.15)
    mix.put(5.60, synth.chime([329.63, 493.88, 659.25, 783.99], dur=1.4, tau=0.55), gain=0.42)

    # Scene 3 (7.2s): Thermal-Governed PoUW Security Miner (80°C/85°C Guardrail)
    mix.put(6.00, synth.riser(1.20, f0=260, f1=5200), gain=0.64)
    mix.put(7.20, synth.impact(dur=1.25), gain=0.92)
    mix.put(7.25, braille_arp([293.66, 440.0, 587.33, 880.0, 1174.66], step_s=0.068), gain=0.52)
    mix.typing(7.60, 9.20, 28, gain=(0.15, 0.23))

    # Scene 4 (11.2s): Zoth-Node Validator Cockpit Resolve
    mix.put(10.65, synth.riser(0.55, f0=340, f1=3800), gain=0.48)
    mix.put(11.20, synth.impact(dur=1.15), gain=0.80)
    mix.put(11.24, synth.chime([329.63, 415.30, 493.88, 659.25, 830.61, 987.77], dur=2.6, tau=1.0), gain=0.55)

    out_wav = os.path.join(DIR, "audio_vaelor.wav")
    stats = mix.master(target_lufs=-14.0)
    mix.write(out_wav)
    print("Saved", out_wav, stats)


def build_vertical_hype_edit():
    """3. Vertical 9:16 Hype Edit (15.0s, 136 BPM, -14.0 LUFS)."""
    tl = {
        "title": "ZothOS-Lite v1.1 — Vertical 9:16 High-Velocity Hype Edit",
        "fps": 60, "width": 1080, "height": 1920, "duration": 15.0, "bpm": 136
    }
    with open(os.path.join(DIR, "timeline_vertical.json"), "w") as f:
        json.dump(tl, f, indent=2)

    mix = Mix(15.0, seed=303)
    dur = 15.0
    chords = [
        (0.0,  [146.83, 220.00, 293.66, 349.23, 440.00]),
        (3.0,  [130.81, 196.00, 261.63, 329.63, 392.00]),
        (6.0,  [116.54, 174.61, 233.08, 293.66, 440.00]),
        (9.0,  [164.81, 246.94, 329.63, 392.00, 587.33]),
        (12.0, [146.83, 220.00, 293.66, 369.99, 587.33]),
    ]
    vol = synth.envelope([
        (0.0, 0.46), (2.8, 0.54), (6.0, 0.68), (9.0, 0.64), (12.0, 0.70), (14.8, 0.22)
    ])
    pad_l, pad_r = synth.pad(dur, chords, volume=vol, detune=0.82, tremolo=0.30, xfade=0.32)
    mix.put_stereo(0.0, pad_l, pad_r, gain=0.44)

    spb = 60.0 / 136.0
    roots = [
        (0.0, 3.0, 73.42),
        (3.0, 6.0, 65.41),
        (6.0, 9.0, 58.27),
        (9.0, 12.0, 82.41),
        (12.0, 14.5, 73.42),
    ]
    t = 0.0
    beat_idx = 0
    while t < 14.4:
        rf = 73.42
        for s0, s1, r in roots:
            if s0 <= t < s1:
                rf = r
                break
        octave = 2.0 if beat_idx % 2 == 1 else 1.0
        mix.put(t, bass_pulse(rf * octave, dur=0.28, drive=1.70), gain=0.58)
        if beat_idx % 2 == 1:
            mix.put(t, synth.click(freq=3000, dur=0.025), gain=0.22, pan=0.25 if beat_idx % 4 == 1 else -0.25)
        t += spb
        beat_idx += 1

    # Fast 3-second scene transitions for vertical reel
    for cut in [0.02, 3.0, 6.0, 9.0, 12.0]:
        if cut > 0.5:
            mix.put(cut - 0.35, synth.whoosh(0.36, 360, 2900, peak=0.68), gain=0.58)
        mix.put(cut, synth.impact(dur=0.95), gain=0.84)
        mix.put(cut + 0.06, braille_arp([293.66, 440.0, 587.33, 880.0], step_s=0.065), gain=0.48)

    mix.typing(0.40, 1.80, 22, gain=(0.15, 0.22))
    mix.typing(6.35, 7.80, 24, gain=(0.15, 0.22))
    mix.put(12.05, synth.chime([293.66, 369.99, 440.0, 587.33, 880.0], dur=2.5, tau=0.95), gain=0.55)

    out_wav = os.path.join(DIR, "audio_vertical.wav")
    stats = mix.master(target_lufs=-14.0)
    mix.write(out_wav)
    print("Saved", out_wav, stats)


if __name__ == "__main__":
    build_hero_showreel()
    build_vaelor_node_edit()
    build_vertical_hype_edit()
