---
title: "zoth-audio-effects"
tags: [os, cli]
aliases: ["zoth-audio-effects"]
---

# zoth-audio-effects

`file`: Python script.

`zoth-audio-effects` is the ZOTHOS acoustic engine and UI sound effect daemon located at `/usr/local/bin/zoth-audio-effects`.

Written in Python 3 with zero external dependencies, it programmatically synthesizes and caches procedural 44.1 kHz, 16-bit mono PCM WAV audio waveforms to `~/.cache/zothos/sounds/`.

### Key Functionality

- **Procedural Waveform Synthesis**: Generates frequency-swept tones with exponential decay envelopes using sine, triangle, and square waveforms via Python's standard `wave`, `math`, and `struct` modules.
- **Audio Backend Fallback**: Plays audio asynchronously through whichever Linux sound player is detected on the system:
  - `paplay` (PulseAudio)
  - `aplay` (ALSA)
  - `pw-play` (PipeWire)
- **Sound Presets**: Accepts command-line triggers mapped to specific desktop sound events:
  - `click` (680 Hz triangle wave, 0.08s)
  - `hover` (320 Hz sine wave, 0.05s)
  - `launch` (520 Hz sine wave, 0.18s)
  - `matrix` (440 Hz triangle wave, 0.22s)
  - `ghost` (220 Hz square wave, 0.25s)
  - `gold` (780 Hz sine wave, 0.25s)
  - `win11` (580 Hz sine wave, 0.20s)
  - `poke` (620 Hz triangle wave, 0.12s)

### Usage

```bash
zoth-audio-effects <click|hover|launch|matrix|ghost|gold|win11|poke>
```

## See also

[[Zoth OS]] · [[MOC CLIs]]