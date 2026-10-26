"""
agent-mock-twin: Autonomous Offline API Mock & Network Twin for AI Agents.
Enables $0 API token cost in CI/CD and local development with 100% deterministic outputs.
Zero external pip dependencies.
"""

__version__ = "0.1.0"
__author__ = "Neal Frazier <neal@nullai.tech>"
__all__ = [
    "HarParser",
    "OpenAPIParser",
    "RecordedRoute",
    "RequestMatcher",
    "MockStorage",
    "MockServer",
]

from .parser import HarParser, OpenAPIParser, RecordedRoute
from .matcher import RequestMatcher
from .storage import MockStorage
from .mock_server import MockServer
