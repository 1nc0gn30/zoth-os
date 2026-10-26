"""
test_mock_twin.py: Unit and integration tests for agent-mock-twin.
Zero external pip dependencies (runs with standard unittest or pytest).
"""

import json
import os
import sys
import time
import unittest
import urllib.request
from urllib.error import HTTPError

# Ensure src is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from agent_mock_twin.matcher import RequestMatcher
from agent_mock_twin.mock_server import MockServer
from agent_mock_twin.parser import HarParser, OpenAPIParser, RecordedRoute
from agent_mock_twin.storage import MockStorage


class TestHarParser(unittest.TestCase):
    def test_har_parsing(self):
        sample_har = {
            "log": {
                "version": "1.2",
                "entries": [
                    {
                        "request": {
                            "method": "POST",
                            "url": "https://api.openai.com/v1/chat/completions",
                            "headers": [{"name": "Content-Type", "value": "application/json"}],
                            "postData": {
                                "mimeType": "application/json",
                                "text": json.dumps({"model": "gpt-4o", "messages": [{"role": "user", "content": "ping"}]}),
                            },
                        },
                        "response": {
                            "status": 200,
                            "headers": [{"name": "Content-Type", "value": "application/json"}],
                            "content": {
                                "mimeType": "application/json",
                                "text": json.dumps({"choices": [{"message": {"content": "pong"}}], "usage": {"total_tokens": 25}}),
                            },
                        },
                    }
                ],
            }
        }

        routes = HarParser.parse_dict(sample_har)
        self.assertEqual(len(routes), 1)
        r = routes[0]
        self.assertEqual(r.method, "POST")
        self.assertEqual(r.path, "/v1/chat/completions")
        self.assertEqual(r.provider, "openai")
        self.assertEqual(r.response_status, 200)
        self.assertIn("pong", r.response_body)
        self.assertEqual(r.token_estimate, 25)
        self.assertIn("messages", r.body_keys)


class TestOpenAPIParser(unittest.TestCase):
    def test_openapi_parsing(self):
        sample_spec = {
            "openapi": "3.0.0",
            "paths": {
                "/v1/messages": {
                    "post": {
                        "summary": "Create Anthropic message",
                        "requestBody": {
                            "content": {
                                "application/json": {
                                    "example": {"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "hi"}]}
                                }
                            }
                        },
                        "responses": {
                            "200": {
                                "content": {
                                    "application/json": {
                                        "example": {"id": "msg_123", "content": [{"type": "text", "text": "hello"}]}
                                    }
                                }
                            }
                        },
                    }
                }
            },
        }

        routes = OpenAPIParser.parse_dict(sample_spec)
        self.assertEqual(len(routes), 1)
        r = routes[0]
        self.assertEqual(r.method, "POST")
        self.assertEqual(r.path, "/v1/messages")
        self.assertEqual(r.provider, "anthropic")
        self.assertEqual(r.response_status, 200)
        self.assertIn("hello", r.response_body)


class TestRequestMatcher(unittest.TestCase):
    def setUp(self):
        self.matcher = RequestMatcher(base_latency_ms=0, jitter_ms=0)
        self.candidate = RecordedRoute(
            id="test_route_1",
            method="POST",
            path="/v1/chat/completions",
            query_params={},
            headers={"content-type": "application/json"},
            body_hash=HarParser.parse_dict({
                "log": {"entries": [{
                    "request": {"method": "POST", "url": "http://x/v1/chat/completions", "postData": {"text": '{"model":"gpt-4o"}'}},
                    "response": {"status": 200, "content": {"text": '{"reply":"exact"}'}}
                }]}
            })[0].body_hash,
            body_keys=["model"],
            raw_body='{"model":"gpt-4o"}',
            response_status=200,
            response_headers={"content-type": "application/json"},
            response_body='{"reply":"exact"}',
            source="har",
            provider="openai",
            token_estimate=30,
        )

    def test_exact_match(self):
        res = self.matcher.match(
            method="POST",
            path="/v1/chat/completions",
            query_params={},
            headers={},
            body='{"model":"gpt-4o"}',
            candidates=[self.candidate],
        )
        self.assertEqual(res.match_type, "exact")
        self.assertEqual(res.confidence, 1.0)
        self.assertIn("exact", res.route.response_body)

    def test_fuzzy_match(self):
        # Slightly different prompt body but same path and model
        res = self.matcher.match(
            method="POST",
            path="/v1/chat/completions",
            query_params={},
            headers={},
            body='{"model":"gpt-4o", "temperature": 0.5}',
            candidates=[self.candidate],
        )
        self.assertEqual(res.match_type, "fuzzy")
        self.assertGreaterEqual(res.confidence, 0.4)

    def test_fallback_synthesis(self):
        # Unseen endpoint
        res = self.matcher.match(
            method="POST",
            path="/v1/chat/completions",
            query_params={},
            headers={},
            body='{"model":"gpt-4o-unknown"}',
            candidates=[],  # empty
        )
        self.assertEqual(res.match_type, "fallback")
        self.assertIn("Deterministic mock twin response", res.route.response_body)


class TestStorage(unittest.TestCase):
    def test_sqlite_storage(self):
        db_path = "/tmp/test_agent_mock.db"
        if os.path.exists(db_path):
            os.remove(db_path)

        storage = MockStorage(db_path=db_path)
        route = RecordedRoute(
            id="test_db_1",
            method="GET",
            path="/v1/models",
            query_params={},
            headers={},
            body_hash="empty",
            body_keys=[],
            raw_body="",
            response_status=200,
            response_headers={"content-type": "application/json"},
            response_body='{"data":[]}',
            source="har",
            provider="openai",
            token_estimate=10,
        )
        storage.save_route(route)
        routes = storage.get_routes()
        self.assertEqual(len(routes), 1)
        self.assertEqual(routes[0].path, "/v1/models")

        # Record hit
        storage.record_hit(
            method="GET",
            path="/v1/models",
            match_type="exact",
            status_code=200,
            latency_ms=10,
            tokens_saved=10,
            usd_saved=0.00005,
            provider="openai",
            route_id="test_db_1",
        )
        stats = storage.get_stats()
        self.assertEqual(stats["total_hits"], 1)
        self.assertEqual(stats["total_tokens_saved"], 10)

        if os.path.exists(db_path):
            os.remove(db_path)


class TestMockServerIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.port = 8998
        cls.db_path = "/tmp/test_server_mock.db"
        if os.path.exists(cls.db_path):
            os.remove(cls.db_path)

        cls.server = MockServer(
            host="127.0.0.1",
            port=cls.port,
            db_path=cls.db_path,
            base_latency_ms=0,
            jitter_ms=0,
        )
        cls.server.run_in_thread()
        time.sleep(0.3)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown_cleanly()
        if os.path.exists(cls.db_path):
            os.remove(cls.db_path)

    def test_api_stats(self):
        url = f"http://127.0.0.1:{self.port}/api/stats"
        req = urllib.request.urlopen(url)
        self.assertEqual(req.status, 200)
        data = json.loads(req.read().decode("utf-8"))
        self.assertTrue(data["success"])
        self.assertIn("stats", data)

    def test_mock_chat_completion_intercept(self):
        url = f"http://127.0.0.1:{self.port}/v1/chat/completions"
        body = json.dumps({"model": "gpt-4o", "messages": [{"role": "user", "content": "hello"}]}).encode("utf-8")
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req)
        self.assertEqual(resp.status, 200)
        self.assertEqual(resp.headers.get("x-mock-twin"), "true")
        data = json.loads(resp.read().decode("utf-8"))
        self.assertIn("choices", data)

    def test_static_routes(self):
        # robots.txt
        req_robots = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/robots.txt")
        self.assertEqual(req_robots.status, 200)
        self.assertIn("User-agent", req_robots.read().decode("utf-8"))

        # sitemap.xml
        req_sitemap = urllib.request.urlopen(f"http://127.0.0.1:{self.port}/sitemap.xml")
        self.assertEqual(req_sitemap.status, 200)
        self.assertIn("urlset", req_sitemap.read().decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
