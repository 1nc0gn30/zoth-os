# Security Policy & Cryptographic Verification

The ZothOS engineering philosophy adheres to the **Sovereign Zero-Leak Standard** and third-party auditable cryptographic provenance. We believe security claims must be verifiable by anyone without trusting self-reported labels or marketing badges.

---

## 1. Supported Versions

| Version | Status | Security Updates | Provenance |
| :--- | :--- | :--- | :--- |
| **v3.1.x** | **Active / Current** | Supported (Rolling upstream Debian Trixie/Sid + Zoth kernel) | Sigstore Signed + Rekor Verified |
| **v3.0.x** | Deprecated | Critical fixes only | Checksum verified |
| **v1.x** | Archived | End of life | Legacy |

---

## 2. Cryptographic Release Verification (Sigstore Cosign)

Every official ZothOS ISO release is cryptographically signed using **Sigstore (`cosign`)** and logged to the public **Rekor Transparency Log**. You do not have to blindly trust an ISO hash posted on a website—anyone can verify that the checksum was signed by the legitimate project release key and recorded in the append-only transparency ledger.

### How to Verify the ZothOS ISO

1. **Install `cosign`** (if not already installed):
   ```bash
   # Linux / macOS (Homebrew or binary release)
   curl -sSfL https://raw.githubusercontent.com/sigstore/cosign/main/install.sh | sh
   ```

2. **Download the Release Artifacts**:
   * `zothos-3.1-amd64.iso`
   * `zothos-3.1-amd64.iso.sha256`
   * `zothos-3.1-amd64.iso.sha256.bundle` (Sigstore transparency bundle)
   * `cosign.pub` (Official public key)

3. **Verify the Sigstore Cryptographic Signature & Rekor Log**:
   ```bash
   cosign verify-blob \
     --key cosign.pub \
     --bundle zothos-3.1-amd64.iso.sha256.bundle \
     zothos-3.1-amd64.iso.sha256
   ```
   *Expected output: `Verified OK`*

4. **Verify the ISO SHA-256 Checksum**:
   ```bash
   sha256sum -c zothos-3.1-amd64.iso.sha256
   ```
   *Expected output: `zothos-3.1-amd64.iso: OK`*

5. **VirusTotal Multi-Engine AV Verification**:
   The ISO SHA-256 hash can be independently inspected across 70+ antivirus engines:
   * **SHA-256**: `44ab8e7bf2e50e1096ebea16b258133ed57aecd910a6b2178c3f3f65736ba1fc`
   * **VirusTotal Public Report**: [Inspect on VirusTotal](https://www.virustotal.com/gui/file/44ab8e7bf2e50e1096ebea16b258133ed57aecd910a6b2178c3f3f65736ba1fc)

---

## 3. Software Bill of Materials (SBOM) & Vulnerability Scanning

To provide transparent insight into every package, shared library, and binary bundled inside ZothOS:

* **SPDX 2.3 & CycloneDX SBOMs** are generated using Anchore **`syft`** for every release.
* **Vulnerability Reports** are audited using **`grype`** against the National Vulnerability Database (NVD) and Debian Security Tracker.
* You can inspect the bundled packages at any time:
  ```bash
  syft zothos-3.1-amd64.iso -o table
  ```

---

## 4. Reporting a Security Vulnerability

If you discover a potential security vulnerability in ZothOS or any of its bundled tools, please notify us immediately through coordinated disclosure:

* **Primary Security Contact**: `neal@nealfrazier.tech`
* **Lead Architect**: Neal Frazier (@1nc0gn30)
* **Response SLA**:
  * **Initial Acknowledgment**: Within **24 hours**.
  * **Triage & Remediation Timeline**: Within **72 hours** for high/critical severity.
* **Responsible Disclosure**: Please do not open public GitHub issues for undisclosed security vulnerabilities. We will coordinate a patch, credit you in the release notes, and publish the advisory simultaneously with the patched release.

---

## 5. Security Hygiene & CI Auditing

* **OpenSSF Scorecard**: Automated branch protection, dependency pinning, and release signing scored via `.github/workflows/scorecard.yml`.
* **GitHub CodeQL**: Deep AST static code analysis running on Python, Shell, and GitHub Actions via `.github/workflows/codeql.yml`.
* **Zero-Leak Guard**: Automated pre-commit and build-time secret scanning (`engine/secret_scanner.js`).
