---
title: "Biomorphic STDP & 3D Netrunner Cortex"
created: "2026-10-26T07:04:24Z"
updated: "2026-10-26T07:04:24Z"
category: "LLM-Wiki"
tags: [wiki, llm-synthesized, karpathy-wiki, neuro-memory, stdp, netrunner, cortex, synapses]
stdp_engrams: 6
confidence: 0.99
status: "CANONICAL"
---

# 📚 Biomorphic STDP & 3D Netrunner Cortex

> [!abstract] Executive Summary
> The **Biomorphic STDP & 3D Netrunner Cortex** is the central biological cognitive substrate powering ZothOS and Zoth Studio (`:8094`). Operating on biological principles of **Spike-Timing-Dependent Plasticity (STDP)** and **Hebbian Learning**, the cortex continuously updates associative synaptic weights between 41,690+ cognitive engrams across semantic, episodic, insight, and security categories. Through an autonomous **Metacognitive Dream Loop** and real-time 3D Netrunner force-directed embedding, the substrate distills ambient developer actions into enduring mathematical intuition with zero telemetry data leakage.

## Conceptual Architecture

```mermaid
flowchart LR
    subgraph SensoryInputs["⚡ Sensory Ingestion Channels"]
        Obsidian["Obsidian Vault<br/>(1,714 notes)"]
        Studio["Zoth Studio IDE<br/>(/memory)"]
        Hermes["Hermes & Swarm<br/>Agents"]
    end
    
    subgraph NetrunnerCortex["🧠 3D Biological Cortex (:8094)"]
        direction TB
        Engrams["41,692 Active Engrams<br/>(Semantic Vectors)"]
        Synapses["2,018,290 STDP Synapses<br/>(Hebbian Plasticity)"]
        Engrams --- Synapses
    end
    
    subgraph CognitiveDynamics["🌙 Metacognition & Sleep Replay"]
        LTP["Hebbian LTP<br/>(Pre < Post Spike)"]
        LTD["Depression LTD<br/>(Post < Pre Spike)"]
        Replay["Dream Loop<br/>(Slow-Wave Consolidation)"]
    end
    
    SensoryInputs -->|POST /api/remember| NetrunnerCortex
    NetrunnerCortex --> CognitiveDynamics
    CognitiveDynamics -->|Pruned Knowledge| NetrunnerCortex
```

## Functional Taxonomy & Core Cognitive Subsystems

### 1. Spike-Timing-Dependent Plasticity (STDP) Engine
Unlike static vector embeddings that require computationally expensive full-corpus reindexing, the STDP engine continuously modulates individual synaptic connection weights in real-time based on the precise relative timing of cognitive spikes. Co-activated engrams strengthen their association pathways while dormant synapses undergo exponential decay.

### 2. 3D Force-Directed Netrunner Cortex
The visual Netrunner workbench (`/memory`) renders memories in an interactive 3D WebGL force-directed space. Synaptic connections act as damped harmonic springs, pulling correlated engrams together into high-density conceptual constellations while orthogonal memories repel.

### 3. Sleep Replay & Metacognitive Consolidation
Embedded in `neuro-memory.service`, the autonomous Dream Loop agent simulates mammalian slow-wave sleep (SWS). During idle system periods, episodic memory sequences are replayed at high temporal compression, consolidating transient observations into permanent architectural insights while pruning synaptic noise.

### 4. Categorical Memory Stratum
Memories are structured into distinct cognitive categories:
- **`insight`:** High-order mathematical breakthroughs and architectural paradigms.
- **`semantic`:** Obsidian Second Brain MOCs and canonical documentation.
- **`episodic`:** Timestamped terminal workflows, CLI executions, and tool events.
- **`security_chain`:** Ed25519 public keys, TLS fingerprints, and cryptographic receipts.
- **`procedural`:** JSON Canvas 1.0 layouts and Obsidian Bases YAML specifications.

## Key Mathematical Formulations & Technical Primitives

### 1. Spike-Timing-Dependent Plasticity (STDP) Learning Rule
For a pre-synaptic spike at time $t_{\text{pre}}$ and a post-synaptic spike at time $t_{\text{post}}$, the synaptic weight modification $\Delta w_{ij}$ is given by:
$$\Delta w_{ij} = \begin{cases} A_+ \exp\left(-\frac{\Delta t}{\tau_+}\right) & \text{if } \Delta t > 0 \quad (\text{Long-Term Potentiation / LTP}) \\ -A_- \exp\left(\frac{\Delta t}{\tau_-}\right) & \text{if } \Delta t < 0 \quad (\text{Long-Term Depression / LTD}) \end{cases}$$
Where $\Delta t = t_{\text{post}} - t_{\text{pre}}$, $A_+ = 0.05$, $A_- = 0.025$, and $\tau_+ = \tau_- = 20\text{ ms}$.

### 2. Exponential Synaptic Weight Retention & Decay
Unstimulated synapses experience continuous passive decay governed by decay constant $\lambda$:
$$w_{ij}(t) = w_{ij}(0) \cdot \exp(-\lambda t) + \sum_{k=1}^{M} \Delta w_{ij}^{(k)}$$
With minimum weight clamp $w_{\min} = 0.01$ and saturation threshold $w_{\max} = 1.00$.

### 3. 3D Force-Directed Spatial Equilibrium
The equilibrium position $\mathbf{p}_i$ for node $i$ in $\mathbb{R}^3$ satisfies:
$$\mathbf{F}_i = \sum_{j \neq i} \frac{k_{\text{rep}}^2}{\|\mathbf{p}_i - \mathbf{p}_j\|^2} \hat{\mathbf{r}}_{ij} - \sum_{(i,j) \in E} \frac{\|\mathbf{p}_i - \mathbf{p}_j\|^2}{k_{\text{att}}} \cdot w_{ij} \hat{\mathbf{r}}_{ij} = \mathbf{0}$$

## Bidirectional Knowledge Graph Links

### Obsidian Second Brain Notes
- [[Zoth Memory]] — Canonical memory architecture, socket endpoints, and schema definitions
- [[05-Telemetry/Neuro-Memory Cortex Telemetry]] — Live STDP engram counts and synapse metrics
- [[Agents/Neuro-Memory Dream Consolidator]] — Autonomous sleep replay and engram pruning agent
- [[Skills/Skill dream-loop]] — Dream loop execution skill
- [[00 Home]] — Dashboard and master graph entrypoint

### Visual Canvases
- [[Netrunner Cyber-Cortex Knowledge Map.canvas]] — Procedural spatial map of the cyber-cortex
- [[Zoth Second Brain.canvas]] — Master second brain spatial layout
- [[Zoth Autonomous Agents & Hermes Fleet.canvas]] — Swarm agents memory interface

### Database Registries
- [[Zoth Memory Stratum.base]] — Database view of all memory categories and importance ratings
- [[Zoth Fleet & Daemons.base]] — Health status for port :8094
- [[Zoth Autonomous Agents.base]] — Autonomous agent fleet

## STDP Synaptic Provenance & Vector Evidence

| Memory ID | Category | Importance | Synaptic Tags | Excerpt |
|:---|:---:|:---:|:---|:---|
| `2499042e-130` | `semantic` | 0.96 | `wiki`, `llm-wiki`, `karpathy` | [Karpathy LLM Wiki · [[Byzantine Quorum & Epistemic Consensus]]] **Byzantine Quorum & Epistemic Consensus** is an essent... |
| `229f55a9-293` | `semantic` | 0.96 | `wiki`, `llm-wiki`, `karpathy` | [Karpathy LLM Wiki · [[Byzantine Quorum & Epistemic Consensus]]] **Byzantine Quorum & Epistemic Consensus** is an essent... |
| `729801a1-982` | `semantic` | 0.96 | `wiki`, `llm-wiki`, `karpathy` | [Karpathy LLM Wiki · [[Byzantine Quorum & Epistemic Consensus]]] **Byzantine Quorum & Epistemic Consensus** is an essent... |
| `20749f81-bcc` | `episodic` | 0.90 | `hermetic_cycle`, `divergent_synthesis`, `objective_crystallization` | [Adytum Cycle #1] Thoth (Key 2: The High Priestess) completed Observational Adytum Cycle. Divergence: "Conceptual diverg... |
| `cd40176b-b3d` | `episodic` | 0.90 | `hermetic_cycle`, `divergent_synthesis`, `objective_crystallization` | [Adytum Cycle #22] Pixel-Neko (Key 2: The High Priestess) completed Observational Adytum Cycle. Divergence: "Associative... |
| `ca70f192-e31` | `episodic` | 0.90 | `hermetic_cycle`, `divergent_synthesis`, `objective_crystallization` | [Adytum Cycle #24] Azoth (Key 2: The High Priestess) completed Observational Adytum Cycle. Divergence: "Synthesizing Scr... |

## See Also

- [[00 Home]]
- [[Zoth LLM Wiki Index.base|Zoth LLM Wiki Index Database]]
