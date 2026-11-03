---
title: "huggingface-tokenizers"
tags: [skill, hermes]
aliases: ["huggingface-tokenizers"]
---

# huggingface-tokenizers

High-performance text tokenization, vocabulary training, and alignment tracking using Hugging Face Tokenizers.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/huggingface-tokenizers/SKILL.md`
- **Dependencies:** `tokenizers`, `transformers`, `datasets` (Python)

## Purpose & Overview

The `huggingface-tokenizers` skill covers the Rust-backed `tokenizers` library for ultra-fast subword tokenization (BPE, WordPiece, and Unigram). It provides workflows for building custom NLP pipelines, training vocabularies from scratch on large corpora, and tracking character-level alignments.

## When to Load

- Training custom tokenizers (BPE for GPT-style models, WordPiece for BERT, or Unigram for SentencePiece-style models).
- Implementing complete tokenization pipelines: Normalization (`NFD`, `Lowercase`, `StripAccents`), Pre-tokenization (`Whitespace`, `ByteLevel`), Model training (`BpeTrainer`), and Post-processing (`TemplateProcessing`).
- Extracting exact character-to-token spans via alignment tracking (`output.offsets`) for NER and extractive QA.
- Converting raw custom tokenizers to Hugging Face `transformers` wrappers using `PreTrainedTokenizerFast`.
- Optimizing batch encoding with multi-processing, truncation, and dynamic padding.

## Core Workflows

- `Tokenizer(BPE(...))` & `BpeTrainer`: Builds and trains a custom subword model.
- `Tokenizer.from_pretrained("bert-base-uncased")`: Loads pre-trained tokenizer configs directly from the Hub.
- `tokenizer.encode_batch(...)`: High-throughput parallel encoding for large text datasets.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill huggingface-hub|huggingface-hub]]