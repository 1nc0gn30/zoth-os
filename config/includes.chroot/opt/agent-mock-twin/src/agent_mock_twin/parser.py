"""
parser.py: Ingests HAR 1.2 archives and OpenAPI 3.0 blueprints into normalized mock routes.
Zero external pip dependencies.
"""

from __future__ import annotations

import base64
import dataclasses
import hashlib
import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse


@dataclasses.dataclass
class RecordedRoute:
    id: str
    method: str
    path: str
    query_params: Dict[str, Any]
    headers: Dict[str, str]
    body_hash: str
    body_keys: List[str]
    raw_body: str
    response_status: int
    response_headers: Dict[str, str]
    response_body: str
    source: str = "har"  # "har" | "openapi" | "synthetic"
    provider: str = "custom"  # "openai" | "anthropic" | "gemini" | "ollama" | "custom"
    token_estimate: int = 0
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return dataclasses.asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> RecordedRoute:
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


def normalize_path(path: str) -> str:
    """Normalize path by stripping query strings, fragments, and trailing slashes."""
    p = path.split("?")[0].split("#")[0].strip()
    if not p.startswith("/"):
        p = "/" + p
    if len(p) > 1 and p.endswith("/"):
        p = p[:-1]
    return p


def hash_body(body: str) -> str:
    """Deterministic hash of request body."""
    if not body:
        return "empty"
    # Try compacting JSON to avoid whitespace mismatch
    try:
        parsed = json.loads(body)
        compact = json.dumps(parsed, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(compact.encode("utf-8")).hexdigest()
    except Exception:
        return hashlib.sha256(body.encode("utf-8")).hexdigest()


def extract_json_keys(body: str) -> List[str]:
    """Extract top-level and first-level keys from request body JSON."""
    if not body:
        return []
    try:
        parsed = json.loads(body)
        keys = []
        if isinstance(parsed, dict):
            for k, v in parsed.items():
                keys.append(str(k))
                if isinstance(v, dict):
                    for subk in v.keys():
                        keys.append(f"{k}.{subk}")
        return sorted(list(set(keys)))
    except Exception:
        return []


def detect_provider(url: str, path: str, body: str) -> str:
    """Detect AI provider from URL, path, or request payload."""
    combined = f"{url.lower()} {path.lower()} {body[:200].lower()}"
    if "api.openai.com" in combined or "/v1/chat/completions" in combined or "/v1/embeddings" in combined:
        return "openai"
    if "api.anthropic.com" in combined or "/v1/messages" in combined or "anthropic-version" in combined:
        return "anthropic"
    if "generativelanguage.googleapis.com" in combined or "gemini" in combined:
        return "gemini"
    if "ollama" in combined or "/api/generate" in combined:
        return "ollama"
    return "custom"


def estimate_tokens(req_body: str, res_body: str) -> int:
    """Estimate token count from response JSON or heuristic."""
    # Check OpenAI style usage
    try:
        parsed = json.loads(res_body)
        if isinstance(parsed, dict) and "usage" in parsed:
            usage = parsed["usage"]
            if isinstance(usage, dict):
                if "total_tokens" in usage and isinstance(usage["total_tokens"], (int, float)):
                    return int(usage["total_tokens"])
                in_tok = usage.get("prompt_tokens") or usage.get("input_tokens") or 0
                out_tok = usage.get("completion_tokens") or usage.get("output_tokens") or 0
                if in_tok or out_tok:
                    return int(in_tok + out_tok)
    except Exception:
        pass

    # Heuristic: ~4 chars per token
    combined_len = len(req_body or "") + len(res_body or "")
    return max(10, combined_len // 4)


class HarParser:
    """Parses standard HTTP Archive (HAR 1.2) files into RecordedRoutes."""

    @staticmethod
    def parse_file(file_path: str) -> List[RecordedRoute]:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return HarParser.parse_dict(data)

    @staticmethod
    def parse_dict(data: Dict[str, Any]) -> List[RecordedRoute]:
        routes: List[RecordedRoute] = []
        entries = data.get("log", {}).get("entries", [])
        if not entries and isinstance(data, list):
            entries = data

        for idx, entry in enumerate(entries):
            req = entry.get("request", {})
            res = entry.get("response", {})
            if not req:
                continue

            method = req.get("method", "GET").upper()
            raw_url = req.get("url", "")
            parsed_url = urlparse(raw_url)
            path = normalize_path(parsed_url.path or "/")

            # Query params
            query_params: Dict[str, Any] = {}
            if parsed_url.query:
                query_params.update(parse_qs(parsed_url.query))
            for q in req.get("queryString", []):
                q_name = q.get("name")
                if q_name:
                    query_params[q_name] = q.get("value", "")

            # Headers
            headers: Dict[str, str] = {}
            for h in req.get("headers", []):
                h_name = h.get("name", "").lower()
                # Skip volatile connection headers
                if h_name not in ("user-agent", "host", "connection", "accept-encoding"):
                    headers[h_name] = h.get("value", "")

            # Request Body
            post_data = req.get("postData", {})
            raw_body = post_data.get("text", "")
            b_hash = hash_body(raw_body)
            b_keys = extract_json_keys(raw_body)

            # Response
            res_status = int(res.get("status", 200))
            res_headers: Dict[str, str] = {}
            for h in res.get("headers", []):
                h_name = h.get("name", "").lower()
                res_headers[h_name] = h.get("value", "")
            if "content-type" not in res_headers:
                res_headers["content-type"] = "application/json"
            res_headers["x-mock-twin"] = "true"

            content = res.get("content", {})
            res_body = content.get("text", "")
            if content.get("encoding") == "base64" and res_body:
                try:
                    res_body = base64.b64decode(res_body).decode("utf-8", errors="replace")
                except Exception:
                    pass

            provider = detect_provider(raw_url, path, raw_body)
            token_est = estimate_tokens(raw_body, res_body)

            route_id = hashlib.sha256(
                f"{method}:{path}:{b_hash}:{idx}".encode("utf-8")
            ).hexdigest()[:16]

            routes.append(
                RecordedRoute(
                    id=route_id,
                    method=method,
                    path=path,
                    query_params=query_params,
                    headers=headers,
                    body_hash=b_hash,
                    body_keys=b_keys,
                    raw_body=raw_body,
                    response_status=res_status,
                    response_headers=res_headers,
                    response_body=res_body,
                    source="har",
                    provider=provider,
                    token_estimate=token_est,
                    description=f"{provider.upper()} {method} {path} (from HAR)",
                )
            )

        return routes


class OpenAPIParser:
    """Parses OpenAPI 3.0 / 3.1 specifications into RecordedRoutes."""

    @staticmethod
    def parse_file(file_path: str) -> List[RecordedRoute]:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return OpenAPIParser.parse_dict(data)

    @staticmethod
    def parse_dict(data: Dict[str, Any]) -> List[RecordedRoute]:
        routes: List[RecordedRoute] = []
        paths = data.get("paths", {})
        if not isinstance(paths, dict):
            return routes

        for raw_path, path_item in paths.items():
            if not isinstance(path_item, dict):
                continue
            norm_path = normalize_path(raw_path)

            for method in ("get", "post", "put", "delete", "patch", "options"):
                if method not in path_item:
                    continue
                op = path_item[method]
                if not isinstance(op, dict):
                    continue

                method_upper = method.upper()

                # Extract request example / schema
                raw_body = ""
                request_body = op.get("requestBody", {})
                if isinstance(request_body, dict):
                    content = request_body.get("content", {})
                    app_json = content.get("application/json", {})
                    if "example" in app_json:
                        raw_body = json.dumps(app_json["example"])
                    elif "examples" in app_json and app_json["examples"]:
                        first_ex = next(iter(app_json["examples"].values()), {})
                        if isinstance(first_ex, dict) and "value" in first_ex:
                            raw_body = json.dumps(first_ex["value"])

                b_hash = hash_body(raw_body)
                b_keys = extract_json_keys(raw_body)

                # Extract response example
                responses = op.get("responses", {})
                res_status = 200
                res_body = '{"status":"ok","mock":true}'

                for status_code in ("200", "201", "default"):
                    if status_code in responses:
                        res_obj = responses[status_code]
                        if isinstance(res_obj, dict):
                            if status_code.isdigit():
                                res_status = int(status_code)
                            content = res_obj.get("content", {})
                            app_json = content.get("application/json", {})
                            if "example" in app_json:
                                res_body = json.dumps(app_json["example"])
                                break
                            if "examples" in app_json and app_json["examples"]:
                                first_ex = next(iter(app_json["examples"].values()), {})
                                if isinstance(first_ex, dict) and "value" in first_ex:
                                    res_body = json.dumps(first_ex["value"])
                                    break
                            # Synthesize minimal mock from schema
                            schema = app_json.get("schema", {})
                            if schema:
                                res_body = json.dumps(OpenAPIParser._sample_from_schema(schema))
                                break

                provider = detect_provider("", norm_path, raw_body)
                token_est = estimate_tokens(raw_body, res_body)

                route_id = hashlib.sha256(
                    f"{method_upper}:{norm_path}:{b_hash}".encode("utf-8")
                ).hexdigest()[:16]

                routes.append(
                    RecordedRoute(
                        id=route_id,
                        method=method_upper,
                        path=norm_path,
                        query_params={},
                        headers={"content-type": "application/json"},
                        body_hash=b_hash,
                        body_keys=b_keys,
                        raw_body=raw_body,
                        response_status=res_status,
                        response_headers={
                            "content-type": "application/json",
                            "x-mock-twin": "true",
                        },
                        response_body=res_body,
                        source="openapi",
                        provider=provider,
                        token_estimate=token_est,
                        description=op.get("summary") or f"{provider.upper()} {method_upper} {norm_path} (from OpenAPI)",
                    )
                )

        return routes

    @staticmethod
    def _sample_from_schema(schema: Dict[str, Any]) -> Any:
        """Create a deterministic sample JSON value from an OpenAPI schema."""
        t = schema.get("type", "object")
        if t == "object":
            props = schema.get("properties", {})
            out = {}
            for k, prop in props.items():
                if isinstance(prop, dict):
                    out[k] = OpenAPIParser._sample_from_schema(prop)
                else:
                    out[k] = "mock_val"
            if not out:
                return {"mock": True, "twin": "agent-mock-twin"}
            return out
        elif t == "array":
            items = schema.get("items", {})
            return [OpenAPIParser._sample_from_schema(items)] if isinstance(items, dict) else ["mock_item"]
        elif t == "string":
            return schema.get("default") or schema.get("example") or "mock_string"
        elif t == "integer":
            return schema.get("default") or 42
        elif t == "number":
            return schema.get("default") or 3.14
        elif t == "boolean":
            return schema.get("default") if "default" in schema else True
        return {"mock": True}
