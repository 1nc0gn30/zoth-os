---
title: "segment-anything-model"
tags: [skill, hermes]
aliases: ["segment-anything-model"]
---

# segment-anything-model

Workflows, architectural reference, and deployment patterns for Meta AI's Segment Anything Model (SAM), providing promptable zero-shot image segmentation across diverse visual domains without fine-tuning.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/mlops/models/segment-anything-model/SKILL.md`

### When to Load
- Performing zero-shot object or region segmentation on arbitrary natural, medical, or satellite images.
- Building interactive computer vision annotation pipelines using point clicks (foreground/background) or bounding boxes.
- Extracting segmented image subjects into transparent RGBA assets or generating training masks for downstream models.
- Running automated whole-image mask generation across regular spatial grids.
- Deploying SAM pipelines through PyTorch (`SamPredictor`), HuggingFace Transformers, or ONNX Runtime.

### Core Architecture & Prompts
- **ViT Backbones:** Available in ViT-B (fastest, lightweight), ViT-L (balanced), and ViT-H (maximum segmentation fidelity).
- **Prompt Types:** Foreground/background coordinate points (`1` vs `0`), bounding box coordinates `[x1, y1, x2, y2]`, and low-resolution previous mask logits for iterative boundary refinement.
- **Inference Efficiency:** The ViT image encoder computes heavy image embeddings once via `predictor.set_image()`, allowing real-time prompt evaluation across subsequent points and boxes.
- **Automatic Mask Generation:** `SamAutomaticMaskGenerator` samples dense point grids and filters results via predicted IoU and mask stability thresholds.

## See also

[[MOC Skills]] · [[Zoth OS]]