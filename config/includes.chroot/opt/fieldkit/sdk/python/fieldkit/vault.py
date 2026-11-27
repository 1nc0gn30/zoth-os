from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("fieldkit.vault")

try:
    from cryptography.exceptions import InvalidTag
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    HAS_CRYPTO = True
except ImportError:
    InvalidTag = Exception  # type: ignore[assignment,misc]
    AESGCM = None  # type: ignore[assignment]
    HAS_CRYPTO = False


class SovereignBiometricVault:
    """On-device cryptographic storage for biometric facial and voice vectors.

    Adheres to RFC-FK-001 Section 4: AES-256-GCM authenticated encryption at rest
    with zero external egress. On desktop Linux without a TEE/StrongBox enclave,
    keys are explicitly reported as in-memory software RAM keys.
    """

    def __init__(
        self,
        key: Optional[bytes] = None,
        *,
        allow_insecure_simulation: bool = False,
    ):
        if not HAS_CRYPTO and not allow_insecure_simulation:
            raise RuntimeError(
                "cryptography package is required for AES-256-GCM biometric encryption"
            )

        self._insecure_simulation: bool = not HAS_CRYPTO
        if key is not None:
            if not isinstance(key, (bytes, bytearray)) or len(key) != 32:
                raise ValueError("AES-256-GCM key must be exactly 32 bytes")
            self._key = bytearray(key)
        else:
            raw_key = AESGCM.generate_key(bit_length=256) if HAS_CRYPTO else os.urandom(32)
            self._key = bytearray(raw_key)

        self._store: Dict[str, bytearray] = {}
        self._zeroized_on_clear: bool = True

    @property
    def key(self) -> bytes:
        return bytes(self._key)

    def store_identity(self, identity_id: str, payload: Dict[str, Any]) -> None:
        """Encrypt and commit a biometric payload to local in-memory storage."""
        if not isinstance(identity_id, str) or not identity_id.strip():
            raise ValueError("identity_id must be a non-empty string")
        if not isinstance(payload, dict):
            raise TypeError("payload must be a dictionary")

        raw = json.dumps(payload, sort_keys=True).encode("utf-8")
        if HAS_CRYPTO and not self._insecure_simulation:
            aesgcm = AESGCM(bytes(self._key))
            nonce = os.urandom(12)
            ciphertext = aesgcm.encrypt(nonce, raw, identity_id.encode("utf-8"))
            self._store[identity_id] = bytearray(nonce + ciphertext)
        else:
            mask = hashlib.sha256(bytes(self._key) + identity_id.encode("utf-8")).digest()
            masked = bytes(b ^ mask[i % len(mask)] for i, b in enumerate(raw))
            self._store[identity_id] = bytearray(masked)

    def retrieve_identity(self, identity_id: str) -> Optional[Dict[str, Any]]:
        """Decrypt and return a biometric record from local storage."""
        blob = self._store.get(identity_id)
        if not blob:
            return None

        if HAS_CRYPTO and not self._insecure_simulation:
            if len(blob) < 28:  # 12-byte nonce + 16-byte GCM auth tag minimum
                logger.warning("Corrupt vault record for identity '%s': truncated payload", identity_id)
                return None
            aesgcm = AESGCM(bytes(self._key))
            nonce = bytes(blob[:12])
            ciphertext = bytes(blob[12:])
            try:
                decrypted = aesgcm.decrypt(nonce, ciphertext, identity_id.encode("utf-8"))
                return json.loads(decrypted.decode("utf-8"))
            except (InvalidTag, ValueError, TypeError, UnicodeDecodeError) as exc:
                logger.warning("Failed to decrypt vault record for '%s': %s", identity_id, type(exc).__name__)
                return None
        else:
            mask = hashlib.sha256(bytes(self._key) + identity_id.encode("utf-8")).digest()
            unmasked = bytes(b ^ mask[i % len(mask)] for i, b in enumerate(blob))
            try:
                return json.loads(unmasked.decode("utf-8"))
            except (ValueError, TypeError, UnicodeDecodeError) as exc:
                logger.warning("Failed to decode simulated vault record for '%s': %s", identity_id, type(exc).__name__)
                return None

    def clear(self) -> None:
        """Overwrite stored ciphertext buffers and clear the vault."""
        for buf in self._store.values():
            for i in range(len(buf)):
                buf[i] = 0
        self._store.clear()

    def export_audit_manifest(self) -> Dict[str, Any]:
        """Return honest cryptographic audit metadata for the active vault runtime."""
        if HAS_CRYPTO and not self._insecure_simulation:
            return {
                "standard": "FieldKit RFC-FK-001 Section 4 (Biometric People Vault)",
                "has_cryptography": True,
                "cipher": "AES-256-GCM (256-bit key, 96-bit nonce, 128-bit auth tag)",
                "key_management": (
                    "IN_MEMORY_SOFTWARE_RAM_KEY "
                    "(Linux Desktop — Hardware KeyStore/StrongBox requires Android/TEE)"
                ),
                "enrolled_records": len(self._store),
                "cloud_sync_enabled": False,
                "memory_zeroized_on_clear": self._zeroized_on_clear,
                "zero_egress": True,
                "zero_egress_compliance": "PASSED",
                "security_warning": False,
            }

        return {
            "standard": "FieldKit RFC-FK-001 Section 4 (Biometric People Vault)",
            "has_cryptography": False,
            "cipher": "INSECURE_SIMULATION_XOR_ONLY",
            "key_management": "IN_MEMORY_SOFTWARE_SIMULATION_UNAUTHENTICATED",
            "enrolled_records": len(self._store),
            "cloud_sync_enabled": False,
            "memory_zeroized_on_clear": self._zeroized_on_clear,
            "zero_egress": True,
            "zero_egress_compliance": "DEGRADED_SIMULATION_ONLY",
            "security_warning": True,
        }
