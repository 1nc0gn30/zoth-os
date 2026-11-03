---
title: "pinecone"
tags: [skill, hermes]
aliases: ["pinecone"]
---

# Pinecone (Managed Vector Database)

A workstation skill from Hermes covering administration, indexing, querying, and hybrid search on Pinecone's managed vector database for production AI and RAG architectures.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/mlops/pinecone/SKILL.md`

## When to load
Load this skill when managing production vector database operations:
- Designing production RAG pipelines requiring managed, auto-scaling vector storage with sub-100ms p95 latency.
- Creating, configuring, and maintaining serverless (`ServerlessSpec`) or pod-based (`PodSpec`) Pinecone indexes.
- Implementing hybrid search combining dense semantic embeddings with sparse keyword/TF-IDF vectors.
- Partitioning index data across namespaces or filtering queries with structured metadata operators (`$and`, `$in`, `$gte`).
- Connecting Pinecone to external framework stacks including LangChain and LlamaIndex.

## Key capabilities & API patterns
- **Index management:** `pc.create_index()` with explicit dimensions, metrics (`cosine`, `euclidean`, `dotproduct`), and cloud provider/region specifications; index listing, stats inspection, and teardown.
- **Batch vector operations:** Batched upserts (`index.upsert(vectors, batch_size=100)`) with arbitrary JSON metadata payloads and sparse token value dictionaries.
- **Querying & metadata filters:** Similarity queries filtered by metadata fields and scoped to discrete user/tenant namespaces.
- **Hybrid search normalization:** Uses vector pre-scaling (`hybrid_score_norm`) to weight dense versus sparse query vectors (`alpha * dense` and `(1 - alpha) * sparse`) since Pinecone stores joint representations.
- **Framework integrations:** Provides patterns for `PineconeVectorStore` in LangChain and `VectorStoreIndex` in LlamaIndex.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pinecone-research|pinecone-research]]