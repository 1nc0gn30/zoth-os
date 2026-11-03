---
title: "How does the Argon2id Secrets Vault protect API keys and credentials?"
tags: [studio, faq]
---

# How does the Argon2id Secrets Vault protect API keys and credentials?

**Category:** Security

High-entropy key derivation with 64MB memory hardness ensures dictionary and brute-force resistance. Secrets live strictly in local encrypted memory.

The Secrets Vault provides zero-knowledge local cryptographic protection for developer credentials, private keys, and local model tokens. Master cryptographic keys are derived using memory-hard Argon2id (configured with t=3 iterations, m=64MB memory cost, and p=4 parallelism lanes), rendering GPU and ASIC dictionary attacks computationally intractable. Operator secrets at rest are shielded using authenticated encryption (XChaCha20-Poly1305 or AES-256-GCM via WebCrypto). Decrypted keys are retained strictly in volatile browser memory for the minimum required task duration and securely zeroized upon task completion or window close.

## See also

[[Zoth Studio]] · [[MOC FAQs]]