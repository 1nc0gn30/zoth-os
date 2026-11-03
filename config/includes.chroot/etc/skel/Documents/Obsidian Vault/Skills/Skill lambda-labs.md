---
title: "lambda-labs"
tags: [skill, hermes]
aliases: ["lambda-labs"]
---

# lambda-labs

`lambda-labs` is a Hermes workstation skill covering the provisioning, automation, and management of on-demand GPU cloud instances and multi-node Slurm clusters on Lambda Labs for machine learning workloads.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/mlops/lambda-labs/SKILL.md`
- **Dependencies:** `lambda-cloud-client>=1.0.0`
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Deploying dedicated GPU compute (NVIDIA B200, H100, GH200, A100, A10) for model training, fine-tuning, or batch inference.
- Automating instance lifecycle operations (launch, monitor, terminate) via the Python client or REST API.
- Configuring persistent cloud storage across instance restarts using network filesystems (`/lambda/nfs/<name>`).
- Coordinating multi-node distributed training jobs using Slurm 1-Click Clusters over InfiniBand networks.

## Key Capabilities & Workflow

- **Pre-Configured Environment:** Leverages the pre-installed Lambda Stack (Ubuntu 22.04, CUDA, cuDNN, NCCL, PyTorch, TensorFlow).
- **Programmatic Control:** Uses `lambda-cloud-client` or cURL requests authenticated with `LAMBDA_API_KEY` to launch instances and register SSH keys.
- **Persistent Data Management:** Attaches persistent shared filesystems at launch to safeguard model weights and training checkpoints against ephemeral disk loss.
- **Port Forwarding:** Documents SSH tunneling patterns for accessing remote JupyterLab and TensorBoard dashboards locally.

## See also

[[MOC Skills]] · [[Zoth OS]]