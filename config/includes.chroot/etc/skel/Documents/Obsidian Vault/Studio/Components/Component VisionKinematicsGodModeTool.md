---
title: "VisionKinematicsGodModeTool"
tags: [studio, component]
aliases: ["VisionKinematicsGodModeTool"]
---

# VisionKinematicsGodModeTool

The `VisionKinematicsGodModeTool` component (`zoth-studio-v2/src/components/tools/VisionKinematicsGodModeTool.jsx`) is the dedicated God-Mode touchless vision and facial kinematics workstation powering [[Studio vision-gesture-control|Vision Gesture Control]] and [[Studio likeness-desk|Likeness Desk (AI Video Double)]].

## What It Renders

- **60fps 21-Joint Skeletal Hand Tracking**: Real-time interactive kinematic bone renderer computing Euclidean distance vectors between landmarks (wrist, CMC, MCP, IP, DIP, tip) for pinch and curl gestures.
- **68-Point Facial Mesh & Viseme Lip-Sync Rig**: High-fidelity facial landmark mesh with normalized pupil gaze tracking and phoneme viseme waveform extraction (e.g. `Viseme_AA`, `Viseme_O`, `Viseme_M` for Kokoro TTS and Wav2Lip mouth animation).
- **Kalman Filter Alpha Tuning**: Real-time slider adjusting exponential smoothing weights ($\alpha = 0.05$ to $0.95$) to balance jitter elimination against spatial latency.
- **KWin & Reality Switch Dispatchers**: Maps touchless hand postures to ZothOS system actions across privilege rings:
  - `PINCH_INDEX_THUMB (< 0.045m)`: `zoth-mode --cycle-reality` (Ring 2)
  - `SWIPE_LEFT_TWO_FINGER`: `qdbus org.kde.KWin /KWin nextDesktop` (Ring 1)
  - `FIST_HOLD_800MS`: `zoth-amnesia --lock-vault` (Ring 0)
  - `OPEN_PALM_SPREAD`: `zoth-voice-call --ptt-toggle` (Ring 2)
- **100% Zero-Egress Webcam Pipeline**: Operates completely in-browser via WebGPU/Wasm with zero video transmission over the network.

## Parent & Integration

Mounted at `/tools/vision-gesture-control` and referenced by [[Studio likeness-desk|Likeness Desk (AI Video Double)]], synchronized with `RealityContext` and paired with CLI [[CLI zoth-gesture-map|zoth-gesture-map]].

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Studio vision-gesture-control|Vision Gesture Control]] · [[Studio likeness-desk|Likeness Desk (AI Video Double)]] · [[CLI zoth-gesture-map|zoth-gesture-map]]
