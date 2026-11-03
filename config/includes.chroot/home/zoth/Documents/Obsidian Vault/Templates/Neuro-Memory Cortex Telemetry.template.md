---
title: "{{ title }}"
tags: [telemetry, neuro-memory, stdp, synapses, engrams, knap-rendered]
aliases: ["Cortex Telemetry", "STDP Memory Stats"]
total_memories: {{ total_memories }}
total_synapses: {{ total_synapses }}
synaptic_density: {{ synaptic_density }}
average_importance: {{ average_importance }}
timestamp: "{{ timestamp }}"
status: "ACTIVE"
---

# 🧠 {{ title }}

> [!important] Biological Synaptic Substrate (:8094)
> Real-time neural telemetry compiled directly from the Neuro-Memory biological substrate daemon via `@kepano/knap` structured template synthesis.

- **Total Memories (Engrams):** `{{ total_memories }}`
- **Total Synaptic Connections:** `{{ total_synapses }}` (Spike-Timing-Dependent Plasticity)
- **Synaptic Density:** `{{ synaptic_density }}` synapses / memory
- **Average Importance Rating:** `{{ average_importance }}`
- **Average Access Replays:** `{{ average_accesses }}`
- **Working Memory Cache:** `{{ working_memory_usage }} bytes`

## Biological Cortex Architecture

```mermaid
flowchart TD
    subgraph IngestionSensory["⚡ Sensory & Knowledge Ingestion"]
        Obsidian["Obsidian Second Brain<br/>(1,710 notes)"]
        Studio["Zoth Studio IDE (:3000)"]
        Agents["Hermes & Antigravity Swarm"]
    end
    
    subgraph BiologicalCortex["🧠 STDP Synaptic Substrate (:8094)"]
        direction TB
        Insight["Insight Engrams<br/>{{ categories.insight }} memories"]
        Egress["Network Egress<br/>{{ categories.network_egress }} memories"]
        Episodic["Episodic Experiences<br/>{{ categories.episodic }} memories"]
        Security["Security Chains<br/>{{ categories.security_chain }} memories"]
        Semantic["Semantic Vault Notes<br/>{{ categories.semantic }} memories"]
        Procedural["Procedural Canvases & Bases<br/>{{ categories.procedural }} memories"]
    end
    
    subgraph MetacognitionDream["🌙 Sleep Replay & Dream Consolidator"]
        Consolidator["Hebbian Pruning & LTP"]
        Lattice["Vaelor PoUW Attestation (:8140)"]
    end
    
    Obsidian -->|POST /api/obsidian/sync| BiologicalCortex
    Studio -->|Event Spooler| BiologicalCortex
    Agents -->|POST /api/remember| BiologicalCortex
    BiologicalCortex --> Consolidator
    Consolidator --> Lattice
```

## Memory Category Breakdown

| Category | Engram Count | Primary Role in Cognitive Substrate |
|:---|:---:|:---|
| `insight` | {{ categories.insight }} | Algorithmic breakthroughs, architecture designs & syntheses |
| `network_egress` | {{ categories.network_egress }} | HTTP audit traces, RPC attestations & network transactions |
| `episodic` | {{ categories.episodic }} | Interaction histories, tool executions & timestamped events |
| `security_chain` | {{ categories.security_chain }} | Cryptographic keys, Ed25519 signatures & security audits |
| `semantic` | {{ categories.semantic }} | Obsidian Second Brain MOCs & canonical concepts |
| `procedural` | {{ categories.procedural }} | JSON Canvas 1.0 & Obsidian Bases schema workflows |

> [!tip] Spike-Timing-Dependent Plasticity (STDP)
> Pre-synaptic spikes preceding post-synaptic firing induce Long-Term Potentiation (LTP), strengthening associative recall pathways, while delayed spikes trigger Long-Term Depression (LTD).

## See Also

- [[Zoth Memory|Zoth Memory Architecture]]
- [[Zoth Memory Stratum.base|Memory Stratum Database]]
- [[Netrunner Cyber-Cortex Knowledge Map.canvas|Cyber-Cortex Knowledge Canvas]]
- [[Zoth Autonomous Agents & Hermes Fleet.canvas|Hermes Fleet Canvas]]
- [[00 Home]]
