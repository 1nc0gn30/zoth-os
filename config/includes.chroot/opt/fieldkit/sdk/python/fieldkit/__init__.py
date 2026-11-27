"""FieldKit Python SDK & Edge Runtime Engine.

The reference implementation of the FieldKit Physical AI Operating Specification (RFC-FK-001).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
"""

__version__ = "2.0.0"
__author__ = "Neal Frazier Tech (@1nc0gn30)"
__license__ = "MIT"

from .mission import Mission, Step, StateTransitionError
from .sensory import BoundingBox, LandmarkPoint, GestureDetector, RaycastEvaluator
from .voice import NearFieldVoiceGate
from .vault import SovereignBiometricVault, HAS_CRYPTO

__all__ = [
    "__version__",
    "__author__",
    "__license__",
    "HAS_CRYPTO",
    "Mission",
    "Step",
    "StateTransitionError",
    "BoundingBox",
    "LandmarkPoint",
    "GestureDetector",
    "RaycastEvaluator",
    "NearFieldVoiceGate",
    "SovereignBiometricVault",
]
