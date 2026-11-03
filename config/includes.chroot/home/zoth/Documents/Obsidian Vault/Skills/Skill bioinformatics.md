---
title: "bioinformatics"
tags: [skill, hermes]
aliases: ["bioinformatics"]
---

# bioinformatics

Hermes workstation skill authored by Teknium (teknium1) and Hermes Agent. Labeled as origin, not a Zoth product.

## Overview

Acts as an on-demand gateway indexing over 400 computational biology and genomics skills across two primary open-source repositories: bioSkills and ClawBio.

## When to Load

Load when handling tasks in bioinformatics, DNA/RNA sequencing, variant calling, differential expression, single-cell RNA-seq, epigenomics, protein structure prediction, metagenomics, or pharmacogenomics.

## Indexed Libraries

- **bioSkills (385 reference skills)**: Code patterns, parameter guides, and decision trees covering sequence manipulation, read QC, alignment (BWA, STAR, HISAT2), variant calling (GATK, DeepVariant), bulk and single-cell RNA-seq, and pathway analysis.
- **ClawBio (33 runnable pipelines)**: Executable Python pipelines with reproducibility bundles (exporting reports, shell commands, and Conda environments), including `seq-wrangler`, `rnaseq-de`, `scrna-orchestrator`, `pharmgx-reporter`, and `struct-predictor`.

## Operational Workflow

- Fetches skills on demand via shallow git clones into `~/.hermes/cache/scratch/` rather than bundling hundreds of domain files locally.
- Treats bioSkills as domain reference guides and parameter cookbooks, while ClawBio pipelines provide executable scripts.
- Assumes local bioinformatics dependencies (Python libraries like `biopython`/`scanpy`, R Bioconductor packages, or CLI utilities like `samtools` and `bcftools`).

## See also

[[MOC Skills]] · [[Zoth OS]]