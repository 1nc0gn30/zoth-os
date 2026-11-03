---
title: "clip"
tags: [skill, hermes]
aliases: ["clip"]
---

# clip

**clip** is a Hermes workstation skill (not a Zoth product) providing workflows and code patterns for OpenAI's Contrastive Language-Image Pre-Training (CLIP) model.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/clip/SKILL.md`

### Core Capabilities

- **Zero-Shot Classification:** Classifies images against arbitrary text labels without task-specific training data using visual and text feature similarity.
- **Semantic Image Search:** Encodes image datasets and queries into normalized embedding vectors to retrieve top-k visual matches via cosine similarity.
- **Cross-Modal Retrieval & Moderation:** Evaluates text-image alignment for content filtering (e.g. NSFW or graphic content detection) and batch similarity matrix calculations.
- **Vector Database Integration:** Provides ingestion and query patterns for storing normalized embeddings in systems like Chroma or FAISS.
- **Model Architectures:** Details trade-offs across Vision Transformer variants (`ViT-B/32`, `ViT-B/16`, `ViT-L/14`) and ResNet backbones (`RN50`, `RN101`).

### When to Load

Load when building multimodal pipelines requiring zero-shot visual tagging, text-driven image retrieval, or embedding-based content moderation. For dense captioning, chat, or segmentation, the skill recommends alternatives like BLIP-2, LLaVA, or Segment Anything.

## See also

[[MOC Skills]] · [[Zoth OS]]