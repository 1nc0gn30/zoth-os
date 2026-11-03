---
title: "chroma"
tags: [skill, hermes]
aliases: ["chroma"]
---

# chroma

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/chroma/SKILL.md`

## Overview
`chroma` provides operational guidelines and patterns for Chroma, an open-source, AI-native embedding database designed for building LLM applications with long-term memory and retrieval-augmented generation (RAG).

## When to Load
Load this skill when:
- Designing or implementing local RAG pipelines and semantic document search.
- Needing an embedded, self-hosted, or in-memory vector database without mandatory cloud services.
- Indexing documents, source text, and embeddings alongside structured metadata for filtered similarity queries.
- Prototyping vector search in Python (`chromadb`) or Node.js/TypeScript environments.

## Key Features & Operations
- **Storage Modes**: Operates in-memory (`Client()`), persistent local disk storage (`PersistentClient(path=...)`), or distributed client/server setups (`HttpClient(host, port)`).
- **Collection Management**: Creates and organizes vector spaces with built-in or custom embedding functions (e.g., SentenceTransformers, OpenAI embeddings).
- **Document Indexing**: Stores raw text documents, identifiers, and JSON metadata dictionaries in unified collections (`collection.add()`).
- **Filtered Semantic Querying**: Executes similarity searches (`collection.query()`) combined with structured metadata filters (`where={"category": "..."}`) and content filters (`where_document`).
- **Dependencies**: Requires `chromadb` and `sentence-transformers`.

## See also

[[MOC Skills]] · [[Zoth OS]]