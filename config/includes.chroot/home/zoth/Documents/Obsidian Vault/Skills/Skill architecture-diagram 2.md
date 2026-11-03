---
title: "architecture-diagram"
tags: [skill, hermes]
aliases: ["architecture-diagram"]
---

# architecture-diagram

Generates standalone, dark-themed system and cloud infrastructure diagrams as zero-dependency HTML files with inline SVG graphics. Based on Cocoon AI's architecture diagram generator.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/creative/architecture-diagram/SKILL.md`
- **Platforms:** Linux, macOS, Windows
- **Dependencies:** None (zero-dependency, renders in any web browser)

### When to Load
- Visualizing software system architectures (frontend, backend, database, cache).
- Mapping cloud infrastructure, VPC topologies, subnets, and microservice meshes.
- Creating API routes, message bus flows, and deployment topology maps.

### When NOT to Use
- Hand-drawn or informal whiteboard concepts (prefer [[Skill excalidraw|excalidraw]]).
- High-level abstract conceptual diagrams (prefer [[Skill concept-diagrams|concept-diagrams]]).
- Physical hardware, scientific diagrams, or animated videos.

### Design System & Visuals
- **Theme:** Slate-950 background (`#020617`) with a 40px grid overlay and JetBrains Mono typography.
- **Semantic Color Coding:** Distinct fills/strokes for Frontend (cyan), Backend (emerald), Database (violet), Cloud (amber), Security (rose), Message Bus (orange), and External systems (slate).
- **Masking:** Uses double-rect masking to prevent connection lines and arrows from bleeding through semi-transparent boxes.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill concept-diagrams|concept-diagrams]] · [[Skill excalidraw|excalidraw]]