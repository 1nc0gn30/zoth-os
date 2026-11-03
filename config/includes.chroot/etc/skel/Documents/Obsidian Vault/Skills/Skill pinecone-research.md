---
title: "pinecone-research"
tags: [skill, hermes]
aliases: ["pinecone-research"]
---

# Pinecone Research (Agent RAG & Memory)

A workstation skill from Hermes for implementing agent RAG pipelines, semantic search, and persistent long-term conversational memory using Pinecone and LangChain.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/research/pinecone-research/SKILL.md`

## When to load
Load this skill when an agent needs conversational memory or RAG retrieval:
- Building agent RAG pipelines backed by Pinecone serverless vector storage.
- Persisting and retrieving conversational context and history across separate agent sessions.
- Prototyping semantic search workflows integrated directly into agent toolchains.
- Isolating multi-session or multi-tenant memory contexts using namespaces.
- *Note:* Use [[Skill pinecone|pinecone]] instead when managing production index infrastructure, hybrid dense/sparse search, or cluster operations outside agent loops.

## Key capabilities & workflows
- **Serverless RAG setup:** Provisions serverless indexes on AWS/GCP with `Pinecone` and `PineconeVectorStore` via `langchain-pinecone`.
- **Session-scoped namespaces:** Partitions memory vectors using session-specific namespaces (`namespace=f"session-{session_id}"`) for multi-tenant isolation, alongside global cross-session similarity queries.
- **Batching & filtering:** Batches upserts (100–200 vectors per call) and tags records with session IDs, timestamps, and topics for metadata-filtered retrieval.
- **Memory pruning:** Outlines strategies for cleaning up expired or stale session namespaces to control vector storage footprint.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill pinecone|pinecone]]