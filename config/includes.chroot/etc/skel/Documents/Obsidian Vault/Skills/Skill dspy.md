---
title: "dspy"
tags: [skill, hermes]
aliases: ["dspy"]
---

# dspy

Declarative language model programming framework developed by Stanford NLP that replaces manual prompt engineering with typed signatures, composable reasoning modules, and automated data-driven prompt optimization.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/mlops/research/dspy/SKILL.md`
- **Author:** Orchestra Research (Stanford NLP)

## When to Load
Load this skill when constructing complex AI pipelines, Retrieval-Augmented Generation (RAG) architectures, or tool-calling agents that require declarative input/output contracts, programmatic reasoning, or metric-driven automatic prompt tuning.

## Core Architectural Primitives
1. **Signatures (`dspy.Signature`):** Define declarative task interfaces specifying `dspy.InputField` and `dspy.OutputField` mappings.
2. **Modules:**
   - `dspy.Predict`: Direct prompt prediction.
   - `dspy.ChainOfThought`: Automatically elicits intermediate reasoning steps.
   - `dspy.ReAct`: Interleaves thought steps and external tool invocations.
   - `dspy.ProgramOfThought`: Generates and executes programmatic code to solve logical or mathematical problems.
3. **Teleprompters & Optimizers:**
   - `BootstrapFewShot`: Synthesizes effective few-shot demonstrations across training examples based on evaluation metrics.
   - `MIPRO`: Iteratively optimizes prompt instructions and demonstration sets.
   - `BootstrapFinetune`: Formats curated traces for model fine-tuning.

## See also

[[MOC Skills]] · [[Zoth OS]]