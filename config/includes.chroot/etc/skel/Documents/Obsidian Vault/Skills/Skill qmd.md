---
title: "qmd"
tags: [skill, hermes]
aliases: ["qmd"]
---

# qmd

On-device, local hybrid search engine combining BM25 keyword matching, vector embeddings, and LLM reranking over personal markdown notes, documentation, and transcripts.

- **Origin:** Hermes skill (`optional-skills/research/qmd`)
- **Author:** Hermes Agent + Teknium (upstream by Tobi Lütke)
- **Platforms:** macOS, Linux (requires Node.js >= 22)
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Querying markdown knowledge bases or note collections with semantic conceptual understanding rather than simple regex/grep.
- Configuring local document collections (`qmd collection add`) and metadata contexts (`qmd context add`).
- Generating and updating local vector embeddings (`qmd embed`).
- Integrating local search tools into agent sessions via Model Context Protocol (`qmd mcp` or HTTP daemon).

## Search Modalities & Pipeline
1. **Keyword Search (`qmd search`):** Instant BM25 text retrieval using SQLite FTS5 (~0.2s, zero model overhead).
2. **Semantic Search (`qmd vsearch`):** Dense vector similarity powered by a local `embeddinggemma-300M` model.
3. **Hybrid Reranked Query (`qmd query`):** Executes query expansion (1.7B model), parallel BM25 and vector search, Reciprocal Rank Fusion (RRF), and `qwen3-reranker` candidate scoring.
4. **Targeted Retrieval (`qmd get` / `qmd multi-get`):** Fast extraction of specific documents, line ranges, or glob patterns.

## Architecture & Storage
- **Local Isolation:** Zero cloud dependencies; all vectors and metadata persist in `~/.cache/qmd/index.sqlite`.
- **MCP Server Support:** Exposes tools (`mcp_qmd_search`, `mcp_qmd_vsearch`, `mcp_qmd_deep_search`, `mcp_qmd_get`) via stdio or an HTTP daemon on port 8181.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill obsidian|obsidian]] · [[Skill hermes-agent|hermes-agent]] · [[Skill arxiv|arxiv]]