from __future__ import annotations

import math
from typing import List, Optional


class NearFieldVoiceGate:
    """Acoustic gating algorithm enforcing fail-closed near-field wearer isolation."""

    def __init__(
        self,
        min_similarity_threshold: float = 0.82,
        attenuation_db: float = 18.0,
        max_distance_meters: float = 1.0,
    ):
        self.min_similarity_threshold = float(min_similarity_threshold)
        self.attenuation_db = float(attenuation_db)
        self.max_distance_meters = float(max_distance_meters)
        self.enrolled_embedding: Optional[List[float]] = None

    @staticmethod
    def _validate_vector(vec: List[float]) -> Optional[List[float]]:
        if not isinstance(vec, (list, tuple)) or len(vec) == 0:
            return None
        parsed: List[float] = []
        for x in vec:
            if isinstance(x, bool) or not isinstance(x, (int, float)):
                return None
            fx = float(x)
            if not math.isfinite(fx):
                return None
            parsed.append(fx)
        return parsed

    def enroll_voiceprint(self, spectral_embedding: List[float]) -> None:
        """Register the wearer's acoustic vocal fingerprint."""
        parsed = self._validate_vector(spectral_embedding)
        if parsed is None:
            raise ValueError("spectral_embedding must be a non-empty list of finite numbers")

        norm = math.sqrt(sum(x * x for x in parsed))
        if not math.isfinite(norm) or norm <= 0.0:
            raise ValueError("spectral_embedding must have a positive finite norm")

        self.enrolled_embedding = [x / norm for x in parsed]

    def similarity_score(self, incoming_embedding: List[float]) -> Optional[float]:
        """Compute cosine similarity against enrolled wearer voiceprint, or None if invalid/unenrolled."""
        if self.enrolled_embedding is None:
            return None

        parsed = self._validate_vector(incoming_embedding)
        if parsed is None or len(parsed) != len(self.enrolled_embedding):
            return None

        norm = math.sqrt(sum(x * x for x in parsed))
        if not math.isfinite(norm) or norm <= 0.0:
            return None

        normalized_in = [x / norm for x in parsed]
        similarity = sum(a * b for a, b in zip(self.enrolled_embedding, normalized_in))
        if not math.isfinite(similarity):
            return None
        return similarity

    def verify_speaker(self, incoming_embedding: List[float]) -> bool:
        """Fail-closed speaker verification against the enrolled wearer voiceprint."""
        score = self.similarity_score(incoming_embedding)
        if score is None:
            return False
        return score >= self.min_similarity_threshold

    def is_near_field(self, estimated_distance_meters: float) -> bool:
        """Verify audio source originated within [0.0, max_distance_meters]."""
        if isinstance(estimated_distance_meters, bool) or not isinstance(
            estimated_distance_meters, (int, float)
        ):
            return False
        dist = float(estimated_distance_meters)
        return math.isfinite(dist) and 0.0 <= dist <= self.max_distance_meters
