---
title: "threejs-frame-conventions"
tags: [skill, grok]
aliases: ["threejs-frame-conventions"]
---

# threejs-frame-conventions

Spatial frame derivation rules and execution-based verification for Three.js (and Y-up, right-handed) 3D coordinate systems.

- **Origin:** Grok bundled skill (`~/.grok/bundled/skills/threejs-frame-conventions`)
- **When to load:** Whenever authoring or editing 3D movement, camera controllers, input mapping, character facing, model mounting, or collision geometry in Three.js games.

### Core Architectural Rules
- **Rule 1: Single Source of Truth:** Read camera-relative movement vectors directly from the camera object per frame (`camera.getWorldDirection`). Derive heading and yaw from a single transform rather than separate Euler formulas. Prefix vector variables with their coordinate frame (`fwdWorld`, `dirCam`).
- **Rule 2: Essential Three.js Invariants:**
  - Local forward for `Object3D` is `-z`; positive `rotation.y` rotates counter-clockwise seen from above.
  - `Object3D.lookAt()` points `+z` toward the target (unlike cameras/lights, which point `-z`).
  - Planar angles from level compilers require negation: `yawFromPlanarAngle = (phi) => -phi`.
  - glTF rigs face `+z` with the character's left at `+x`. Front is `up × right`.
- **Rule 3: Measure, Never Hardcode Assets:** Derive asset orientation from two independent markers (e.g. toe-bone vectors, head nodes) and align them to the parent `-z`.
- **Rule 4: Verification via Execution:** Validate input and facing with an in-engine test harness (`__selfTestControls()`) measuring motion against an independent oracle. Inspect rendered frames for culled winding or misplaced collision.
- **Rule 5: Synchronized Collision & Rendering:** Meshes and collision volumes must originate from the exact same source definitions via shared conversion helpers.
- **Rule 6: Codebase Review Checklist:** Grep for raw `Math.sin`/`cos` on angles, uncalibrated `.lookAt()`, hardcoded `Math.PI` asset rotations, or mutated scratch vectors (`_tmp`).

## See also

[[MOC Skills]] · [[Zoth OS]]