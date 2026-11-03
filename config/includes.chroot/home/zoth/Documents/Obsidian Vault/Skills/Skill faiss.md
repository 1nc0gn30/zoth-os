---
title: "faiss"
tags: [skill, hermes]
aliases: ["faiss"]
---

# faiss

Billion-scale dense vector similarity search and clustering library developed by Meta/Facebook AI Research, offering CPU and CUDA GPU acceleration for high-throughput nearest neighbor queries.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/faiss/SKILL.md`
- **Dependencies:** `faiss-cpu`, `faiss-gpu`, `numpy`
- **Tags:** RAG, FAISS, Similarity Search, Vector Search, Facebook AI, GPU Acceleration, Billion-Scale, HNSW

## When to Load

Load when implementing large-scale vector similarity retrieval (millions to billions of embeddings), accelerating nearest-neighbor lookups via NVIDIA CUDA GPUs, or building memory-compact RAG retrieval pipelines where raw search speed takes priority over relational metadata filtering.

## Index Architectures & Features

- **Flat (Exact):** `IndexFlatL2` and `IndexFlatIP` (cosine similarity with normalized vectors) provide 100% accuracy for datasets under 10k vectors.
- **IVF (Inverted File):** Approximate index partitioning vector space into Voronoi cells (`nlist`), tuned at query time with `nprobe`.
- **HNSW:** Graph-based index (`IndexHNSWFlat`) providing the fastest search latency and high accuracy (~99%) without requiring upfront training.
- **Product Quantization (PQ):** Compresses high-dimensional vectors to reduce memory consumption by 16–32×.
- **Framework Integrations:** Supports direct serialization (`write_index`/`read_index`) as well as LangChain and LlamaIndex vector store wrappers.

## See also

[[MOC Skills]] · [[Zoth OS]]