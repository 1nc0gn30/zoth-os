---
title: "Zoth Trust & Supply Chain"
date: 2026-10-26
tags:
  - moc
  - os
  - security
  - trust
  - supply-chain
  - slsa
  - virustotal
  - sigstore
  - sbom
  - codeql
  - semgrep
aliases:
  - Trust Architecture
  - Supply Chain Security
  - Zoth Trust & Verification
  - PR-35 Trust Parity
cluster: Security
stdp_weight: 0.99
---

# 🛡️ Zoth Trust & Supply Chain Security Architecture

**Zero-trust supply-chain provenance, continuous SAST scanning, and automated multi-engine anti-malware verification across ZothOS and Zoth Studio.**

> [!tip] Sovereign Trust Parity (ZothOS PR #35 & Zoth Studio v2 PR #11)
> Both [[Zoth OS]] (`NullAITech/zoth-os`) and [[Zoth Studio]] (`NullAITech/zoth-studio-v2`) enforce identical, reproducible security controls. Every production release is signed with keyless Sigstore Cosign OIDC identities, attested via SLSA build provenance, audited across 70+ AV engines on VirusTotal, and transparently mapped with SPDX/CycloneDX SBOMs.

---

## 1. Automated Supply-Chain & Security Controls Matrix

| Control | Implementation & Workflow | Scope & Cadence | Output & Verification Permalinks |
| :--- | :--- | :--- | :--- |
| **VirusTotal Binary Scan** | `.github/workflows/virustotal-release.yml`<br>`tools/virustotal-release.sh` | Every published release & manual dispatch | Generates `virustotal-report.md` with per-asset SHA-256 and VT analysis links attached to GitHub Releases |
| **Sigstore Cosign Signing** | `.github/workflows/release-sign.yml`<br>`cosign verify-blob` | Every published release | Keyless OIDC `SHA256SUMS.cosign.bundle` verifiable against GitHub Actions issuer |
| **SLSA Provenance** | GitHub Attestations (`actions/attest-build-provenance`) | Every published release | Cryptographically verifiable build provenance via `gh attestation verify` |
| **SPDX & CycloneDX SBOM** | `.github/workflows/sbom.yml`<br>Anchore Syft engine | Every release & push to `main` | `zothos-source.spdx.json` and `zothos-source.cdx.json` dependency graphs |
| **OpenSSF Scorecard** | `.github/workflows/scorecard.yml` | Push to `main` & weekly cron | Public transparency report & badge at [scorecard.dev](https://scorecard.dev/viewer/?repo=github.com/NullAITech/zoth-os) |
| **CodeQL SAST** | `.github/workflows/codeql.yml` | Push to `main`, PRs, weekly cron | Deep semantic analysis across Python, JavaScript/TypeScript, and Actions |
| **Semgrep SAST** | `.github/workflows/semgrep.yml` | Push to `main`, PRs, weekly cron | Multi-rule scanning (`p/security-audit`, `p/secrets`, `p/default`) uploaded to SARIF |
| **Secret & PII Guardrail** | `tools/scan-secrets.sh`<br>`.gitleaks.toml` | Pre-commit & CI push/PR gate | Zero-leak gate blocking secrets, private keys, API tokens, and disk serial numbers |

---

## 2. VirusTotal Release Scanning Policy

> [!important] Multi-Engine Binary Verification Gate
> Release installers (`.AppImage`, `.deb`, `.rpm`, `.dmg`, `.exe`, `.msi`, `.iso`, `.run`, `.tar.gz`, `.zip`) are scanned against 70+ commercial antivirus engines via the VirusTotal v3 REST API.

1. **Targeted Artifact Scope**:
   `tools/virustotal-release.sh` filters release assets to scan only binary binaries and installer bundles. Checksum manifests, signatures (`.sig`, `.pem`), Cosign bundles (`.bundle`), provenance attestations (`.intoto.jsonl`), and SBOM JSON documents are preserved without consuming scanning quotas.
2. **Paced Rate Limiting**:
   Requests are metered at ~4 requests/minute to maintain full compatibility with standard free-tier `VT_API_KEY` credentials stored in GitHub repository secrets.
3. **High-Confidence Gate**:
   The verification script immediately fails if any industry-standard high-confidence engine reports a detection:
   - `Microsoft Defender`, `Kaspersky`, `BitDefender`, `ESET-NOD32`
   - `CrowdStrike Falcon`, `SentinelOne`, `Sophos`, `Symantec`
   - `Malwarebytes`, `ClamAV`, `Google Safebrowsing`, `Avast`, `McAfee`
4. **Resilience Invariant**:
   `continue-on-error: true` at the workflow step prevents external network latency or transient VirusTotal API outages from permanently deadlocking mission-critical release publishing.

---

## 3. Cryptographic Verification Playbook

Users, enterprise auditors, and AI agent coordinators verify any Zoth release using pure command-line tools:

### Step 1: Verify Keyless Sigstore Signature
```bash
# Verify cryptographic signature using GitHub Actions OIDC identity
cosign verify-blob SHA256SUMS \
  --bundle SHA256SUMS.cosign.bundle \
  --certificate-identity-regexp '^https://github.com/NullAITech/zoth-os/\.github/workflows/release-sign\.yml@' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

### Step 2: Verify SLSA Build Provenance Attestation
```bash
# Verify build was synthesized inside GitHub Actions without tampering
gh attestation verify SHA256SUMS --repo NullAITech/zoth-os
```

### Step 3: Verify Asset Checksums & VirusTotal Report
```bash
# Verify binary SHA-256 digests against signed manifest
sha256sum --ignore-missing -c SHA256SUMS

# Inspect VirusTotal scan permalinks in release notes
cat virustotal-report.md
```

---

## 4. Integration with Zoth Fleet & Second Brain

The trust architecture directly connects with ZothOS daemons and developer tooling:

- **Egress & Jail Daemons**: `agent-egress-sentinel` (:8095) and `agent-capsule-jail` (:8105) ensure running processes cannot phone home or leak secrets during build stages.
- **Continuous Audit**: `agent-policy-auditor` (:8106) correlates Git commits with signed SBOM hashes.
- **Flight Recorder**: `agent-flight-recorder` (:8104) logs cryptographic attestations into permanent audit ledgers.
- **Obsidian Second Brain Integration**: Query live fleet security status and port integrity via `zoth-second-brain status` or view the interactive database in [[Zoth Fleet & Daemons.base]].

---

## See also

- [[00 Home]]
- [[Zoth OS]]
- [[Zoth Studio]]
- [[MOC Daemons]]
- [[MOC CLIs]]
- [[CLI zoth-mcp]]
- [[Vaelor Network]]
- [[Zoth Fleet & Daemons.base]]
- [[Sovereign MCP Tools & Agent Catalog.base]]
- [[Vaelor & Sovereign Economy.canvas]]
- [[Zoth Plugin & Connector Marketplace.canvas]]
- [[ZothOS & Studio Supply-Chain Trust Stack.canvas]]
