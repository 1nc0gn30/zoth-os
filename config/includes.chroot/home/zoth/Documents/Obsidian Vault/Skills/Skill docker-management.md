---
title: "docker-management"
tags: [skill, hermes]
aliases: ["docker-management"]
---

# docker-management

A Hermes workstation skill for managing Docker containers, images, volumes, networks, and Compose stacks.

> [!NOTE] Origin & Scope
> This is a **Hermes workstation skill** (`devops/docker-management`), not a Zoth product. It executes standard Docker Engine and Compose CLI commands locally.

## Purpose & Description

Provides structured operational procedures for administering container lifecycles, debugging crashes, managing persistent storage, and maintaining multi-service Compose applications.

### When to Load

- Starting, stopping, pausing, restarting, inspecting, or removing Docker containers.
- Building, tagging, pushing, pulling, or pruning container images.
- Deploying and tearing down multi-container services with Docker Compose (`docker compose up -d`, `down`).
- Managing persistent data with Docker named volumes and configuring container network bridges.
- Troubleshooting crashing services by inspecting container logs (`docker logs --tail 50 -f`) or executing interactive container shells (`docker exec -it`).
- Assessing Docker disk space consumption (`docker system df`) and cleaning dangling images and containers.
- Reviewing and optimizing `Dockerfile` directives and build caching.

### Prerequisites

Requires a functional local Docker Engine installation, Docker Compose v2, and user permissions to communicate with the Docker daemon socket (or sudo access).

## See also

[[MOC Skills]] · [[Zoth OS]]