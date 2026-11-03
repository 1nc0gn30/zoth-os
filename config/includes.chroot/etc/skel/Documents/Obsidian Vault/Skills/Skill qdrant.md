---
title: "qdrant"
tags: [skill, hermes]
aliases: ["qdrant"]
---

# qdrant

Rust-based vector similarity search engine and database optimized for production Retrieval-Augmented Generation (RAG) and semantic search.

- **Origin:** Hermes skill (`optional-skills/mlops/qdrant`)
- **Author:** Orchestra Research
- **Dependencies:** `qdrant-client>=1.14.0`
- **Platforms:** Linux, macOS, Windows
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Designing low-latency vector retrieval pipelines for production RAG systems.
- Configuring Qdrant collections with HNSW graph indexing and distance metrics (Cosine, Dot, Euclid, Manhattan).
- Implementing hybrid search combining dense semantic embeddings with sparse vectors (BM25, SPLADE).
- Filtering vector search results against arbitrary metadata payloads using `query_points`.
- Memory-optimizing large vector stores (>1M vectors) via scalar quantization and on-disk payload storage.

## Core Architecture & Features
- **Data Model:** Operates on points (`PointStruct`) comprising unique IDs, dense/sparse vectors, and flexible JSON payloads.
- **Client & API:** Interacts over REST and gRPC (ports 6333/6334) using the modern `qdrant-client` API (`client.query_points`).
- **Payload Indexing:** Supports dedicated field schema indexing (`KEYWORD`, `INTEGER`, `FLOAT`, `GEO`, `TEXT`, `BOOL`) for fast pre-filtering.
- **RAG Framework Integrations:** Directly integrates with SentenceTransformers, LangChain, and LlamaIndex vector stores.
- **Scalability:** Distributed clustering support with Raft consensus, sharding, replication, and cloud connectivity.

## See also

[[MOC Skills]] · [[Zoth OS]]