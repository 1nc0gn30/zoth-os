---
title: "DocsPage"
tags: [studio, page]
---

# DocsPage

`DocsPage` is the comprehensive architecture and developer documentation manual in Zoth Studio, rendered at route `[[Route docs|/docs]]`.

## Rendered Capabilities

- **15 Technical Reference Chapters**: Details the full engineering specifications across 15 structured sections:
  - *Architecture & Micro-Repos*: Zero-egress invariants, local loopback topology, and repository decoupling.
  - *Agent Swarm & Signal Mesh*: 21-agent cadre topologies, inter-process communication sockets, and E2EE packet exchange.
  - *Cryptographic Sanctum*: Argon2id key derivation, XChaCha20-Poly1305 encryption, and Adytum hardware key ratcheting.
  - *Neural Memory & Consensus*: Lucy STDP synaptic plasticity formulas, local vector indices, and 3-agent Byzantine PBFT consensus.
  - *Infrastructure & Deployment*: Netlify edge prerendering, AEO discovery endpoints, and Zoth OS KVM VM installation.
  - *CLI Tooling & Protocols*: System diagnostic commands (`zoth-status`, `zoth-heal`), embedded math pillars, zero-egress panels, and MCP/AX specifications.
- **Topic Filtering & Scroll Rail**: Allows filtering by subject tags (`Invariants`, `Memory & STDP`, `Consensus Math`, `Enclaves & Netlify`) with an active table-of-contents rail tracked via IntersectionObserver.
- **Interactive Code Blocks & Tool Search**: Gold-on-void copyable code blocks with confirmation toasts, paired with an interactive micro-tool search filter.

- **Source File:** `zoth-studio-v2/src/pages/DocsPage.jsx`
- **Parent / Route:** Served at `/docs` (math reference routes at `[[Route docs-math|/docs/math]]`)

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route docs|/docs]]