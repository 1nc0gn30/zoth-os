"""
agent-mock-twin: Autonomous Offline API Mock & Network Twin for AI Agents.
Enables $0 API token cost in CI/CD and local development with 100% deterministic outputs.
Zero external pip dependencies.
"""

__version__ = "2.6.0"
__author__ = "Neal Frazier Tech (@1nc0gn30) • NullAI Platform"
__all__ = [
    "__version__",
    "HarParser",
    "OpenAPIParser",
    "RecordedRoute",
    "RequestMatcher",
    "MockStorage",
    "MockServer",
    "MCPServer",
]

from .parser import HarParser, OpenAPIParser, RecordedRoute
from .matcher import RequestMatcher
from .storage import MockStorage
from .mock_server import MockServer
from .mcp_server import MCPServer
