"""Cryptographic Vault and Authenticated Encryption Engine for EnvGuard.

Delegates all new encryptions to the canonical pure-Python NIST FIPS 197
AES-256-CTR + PBKDF2-HMAC-SHA256 (600,000 default rounds) + HMAC-SHA256
Encrypt-then-MAC engine in `mcp_server.py`, while retaining read-only
backward-compatible decryption for legacy `BEGIN ENVGUARD VAULT v1` envelopes.
Zero external runtime dependencies - pure Python stdlib.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
from pathlib import Path
from typing import Optional, Union

from envguard_secrets_vault.compat import atomic_write_text, safe_read_text
from envguard_secrets_vault.mcp_server import (
    PBKDF2_ITERATIONS,
    PBKDF2_MAX_ITERATIONS,
    PBKDF2_MIN_ITERATIONS,
    VAULT_FOOTER,
    VAULT_HEADER,
    validate_kdf_iterations,
    vault_decrypt,
    vault_encrypt,
)

ARMOR_HEADER = VAULT_HEADER
ARMOR_FOOTER = VAULT_FOOTER
LEGACY_ARMOR_HEADER = "-----BEGIN ENVGUARD VAULT v1-----"
LEGACY_ARMOR_FOOTER = "-----END ENVGUARD VAULT v1-----"
DEFAULT_PBKDF2_ITERATIONS = PBKDF2_ITERATIONS
MIN_PBKDF2_ITERATIONS = PBKDF2_MIN_ITERATIONS
MAX_PBKDF2_ITERATIONS = PBKDF2_MAX_ITERATIONS
SALT_SIZE = 16
NONCE_SIZE = 16


class VaultError(Exception):
    """Base exception for cryptographic vault operations."""


class AuthenticationError(VaultError):
    """Raised when decryption fails due to an incorrect password or tampered payload."""


class InvalidPayloadError(VaultError):
    """Raised when the armored payload structure is invalid or corrupt."""


class EncryptedVault:
    """Zero-dependency authenticated cryptographic vault for environment secrets."""

    def __init__(self, iterations: int = DEFAULT_PBKDF2_ITERATIONS) -> None:
        self.iterations = validate_kdf_iterations(iterations)

    def _derive_keys_legacy(self, password: str, salt: bytes, iterations: int) -> tuple[bytes, bytes]:
        if not password:
            raise ValueError("Password cannot be empty.")
        derived = hashlib.pbkdf2_hmac(
            hash_name="sha256",
            password=password.encode("utf-8"),
            salt=salt,
            iterations=iterations,
            dklen=64,
        )
        return derived[:32], derived[32:64]

    def _generate_keystream_legacy(self, key: bytes, nonce: bytes, length: int) -> bytes:
        if length == 0:
            return b""
        num_blocks = math.ceil(length / 32)
        stream_chunks = []
        for i in range(num_blocks):
            counter_bytes = i.to_bytes(8, byteorder="big")
            block = hmac.new(key, nonce + counter_bytes, hashlib.sha256).digest()
            stream_chunks.append(block)
        return b"".join(stream_chunks)[:length]

    def _decrypt_legacy_v1(self, cleaned: str, password: str) -> str:
        start = cleaned.find(LEGACY_ARMOR_HEADER) + len(LEGACY_ARMOR_HEADER)
        end = cleaned.find(LEGACY_ARMOR_FOOTER)
        body_b64 = cleaned[start:end].replace("\n", "").replace("\r", "").strip()
        try:
            json_raw = base64.b64decode(body_b64.encode("ascii")).decode("utf-8")
            data = json.loads(json_raw)
        except Exception as exc:
            raise InvalidPayloadError(f"Invalid legacy armored payload envelope: {exc}") from exc

        if not isinstance(data, dict) or data.get("v") != 1:
            raise InvalidPayloadError("Unsupported or corrupt legacy vault payload version.")

        try:
            iterations = validate_kdf_iterations(data["iter"])
            salt = base64.b64decode(data["salt"])
            nonce = base64.b64decode(data["nonce"])
            received_tag = base64.b64decode(data["tag"])
            ciphertext = base64.b64decode(data["ciphertext"])
        except (KeyError, ValueError, TypeError) as exc:
            raise InvalidPayloadError(f"Corrupt legacy vault payload fields: {exc}") from exc

        enc_key, mac_key = self._derive_keys_legacy(password, salt, iterations)
        aad = b"ENVGUARD_VAULT_V1" + iterations.to_bytes(4, byteorder="big") + salt + nonce
        expected_tag = hmac.new(mac_key, aad + ciphertext, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_tag, received_tag):
            raise AuthenticationError(
                "Authentication failed: invalid password or corrupted/tampered payload."
            )

        keystream = self._generate_keystream_legacy(enc_key, nonce, len(ciphertext))
        plaintext_bytes = bytes(a ^ b for a, b in zip(ciphertext, keystream))
        try:
            return plaintext_bytes.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise AuthenticationError("Payload decrypted but contains invalid UTF-8.") from exc

    def encrypt_env(self, content: str, password: str) -> str:
        """Encrypt environment text with password into canonical AES-256-CTR-HMAC-SHA256 armored envelope."""
        if not password:
            raise ValueError("Password cannot be empty.")
        res = vault_encrypt(content, password=password, iterations=self.iterations)
        return res["vault_armor"]

    def decrypt_env(self, armored_payload: str, password: str) -> str:
        """Decrypt canonical AES-256-CTR-HMAC-SHA256 (or legacy v1) armored envelope with strict HMAC verification."""
        if not password:
            raise ValueError("Password cannot be empty.")

        cleaned = armored_payload.strip()
        if LEGACY_ARMOR_HEADER in cleaned and LEGACY_ARMOR_FOOTER in cleaned:
            return self._decrypt_legacy_v1(cleaned, password)

        try:
            res = vault_decrypt(cleaned, password=password)
            return res["decrypted_content"]
        except ValueError as exc:
            msg = str(exc)
            if "Authentication failed" in msg or "UTF-8 decoding error" in msg:
                raise AuthenticationError(msg) from exc
            raise InvalidPayloadError(msg) from exc

    def encrypt_file(
        self,
        source_path: Union[str, Path],
        dest_path: Union[str, Path],
        password: str,
    ) -> None:
        """Read source file, encrypt contents, and write atomically to destination."""
        content = safe_read_text(source_path)
        armored = self.encrypt_env(content, password)
        atomic_write_text(dest_path, armored)

    def decrypt_file(
        self,
        source_path: Union[str, Path],
        dest_path: Optional[Union[str, Path]],
        password: str,
    ) -> str:
        """Read encrypted file, decrypt contents, and optionally write to destination."""
        armored = safe_read_text(source_path)
        decrypted = self.decrypt_env(armored, password)
        if dest_path:
            atomic_write_text(dest_path, decrypted)
        return decrypted
