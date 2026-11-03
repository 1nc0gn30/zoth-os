---
title: "cloudflare-temporary-deploy"
tags: [skill, hermes]
aliases: ["cloudflare-temporary-deploy"]
---

# cloudflare-temporary-deploy

**cloudflare-temporary-deploy** is a Hermes workstation skill (not a Zoth product) enabling zero-account, throwaway deployment of Cloudflare Workers via `wrangler deploy --temporary`.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/web-development/cloudflare-temporary-deploy/SKILL.md`

### Core Capabilities

- **Zero-Auth Deployment:** Launches Workers to a live `*.workers.dev` URL without requiring account registration, OAuth flows, or API tokens.
- **60-Minute Ephemeral Lifecycle:** Provisions a disposable account that auto-deletes after 60 minutes unless claimed via a returned tokenized claim URL.
- **Autonomous Iteration Loop:** Allows headless agents to deploy, parse live/claim URLs via `scripts/parse_deploy_output.py`, verify responses with `curl`, and redeploy with cached account reuse.
- **Feature Set Support:** Enables testing of Workers, Static Assets (up to 1,000 files), KV, D1 (1 DB, 100 MB limit), Durable Objects, and Queues.

### When to Load

Load during autonomous prototyping, evaluating Worker code, or providing rapid preview URLs without interrupting the user for credentials. It should not be used for production, CI/CD, or authenticated environments where permanent credentials already exist.

## See also

[[MOC Skills]] · [[Zoth OS]]