---
title: "huggingface-hub"
tags: [skill, hermes]
aliases: ["huggingface-hub"]
---

# huggingface-hub

Hugging Face CLI (`hf`) reference for searching, downloading, and uploading models, datasets, and Spaces.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/models/huggingface-hub/SKILL.md`
- **CLI Utility:** `hf` (replaces deprecated `huggingface-cli`)

## Purpose & Overview

The `huggingface-hub` skill guides interactions with the official Hugging Face Hub via the modern `hf` command-line utility. It covers repository management, dataset queries, model weights downloading, remote jobs, and cache pruning.

## When to Load

- Authenticating sessions using API tokens (`hf auth login`, `list`, `switch`).
- Downloading model artifacts, tokenizer configs, or dataset repositories (`hf download <REPO_ID>`).
- Uploading files or entire folders to Hugging Face repositories (`hf upload <REPO_ID>`).
- Querying remote dataset parquet files directly using SQL via embedded DuckDB (`hf datasets sql`).
- Managing compute infrastructure, including Inference Endpoints (`hf endpoints`), remote jobs (`hf jobs`), and Spaces (`hf spaces`).
- Managing local Hub storage cache (`hf cache list`, `hf cache prune`).

## Core Commands

- `hf auth whoami`: Identifies the active authenticated Hugging Face account.
- `hf download <repo>`: Fetches remote files or entire model repositories.
- `hf upload <repo> <path>`: Pushes local files or directories to the Hub.
- `hf cache prune`: Cleans detached or stale revisions from the local cache.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill huggingface-tokenizers|huggingface-tokenizers]]