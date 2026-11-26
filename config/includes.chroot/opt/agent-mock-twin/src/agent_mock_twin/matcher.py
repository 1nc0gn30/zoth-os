"""
matcher.py: Multi-tier request matching engine (Exact -> OpenAPI {param} Template -> Fuzzy Semantic -> Fallback Synthesis).
Zero external pip dependencies.
"""

from __future__ import annotations

import dataclasses
import hashlib
import json
import random
import time
from typing import Any, Dict, List, Optional, Tuple

from .parser import RecordedRoute, estimate_tokens, extract_json_keys, hash_body, normalize_path

VALID_CHAOS_TYPES = (
    "429_rate_limit",
    "500_internal_error",
    "503_service_unavailable",
    "timeout_hang",
)

DETERMINISTIC_EPOCH = 1700000000


def _match_path_template(template_path: str, actual_path: str) -> Optional[Tuple[int, Dict[str, str]]]:
    """Safe literal-segment OpenAPI `{param}` matcher (zero arbitrary regex -> ReDoS-proof).

    Returns (literal_segment_count, extracted_params) if `template_path` contains at least one
    `{param}` segment and matches `actual_path` segment-for-segment, else None.
    """
    tpl = normalize_path(template_path)
    act = normalize_path(actual_path)
    if "{" not in tpl or "}" not in tpl:
        return None

    tpl_segs = [s for s in tpl.split("/") if s != ""]
    act_segs = [s for s in act.split("/") if s != ""]
    if len(tpl_segs) != len(act_segs):
        return None

    params: Dict[str, str] = {}
    literal_count = 0
    for t_seg, a_seg in zip(tpl_segs, act_segs):
        if t_seg.startswith("{") and t_seg.endswith("}") and len(t_seg) > 2:
            param_name = t_seg[1:-1].strip()
            if not param_name or "{" in param_name or "}" in param_name or not a_seg:
                return None
            params[param_name] = a_seg
        else:
            if t_seg != a_seg:
                return None
            literal_count += 1

    if not params:
        return None
    return literal_count, params


@dataclasses.dataclass
class MatchResult:
    route: RecordedRoute
    match_type: str  # "exact" | "template" | "fuzzy" | "fallback" | "chaos"
    confidence: float  # 0.0 to 1.0
    latency_ms: int
    tokens_saved: int
    usd_saved: float


class RequestMatcher:
    """Matches incoming agent HTTP requests against recorded routes with latency & chaos support."""

    def __init__(
        self,
        base_latency_ms: int = 25,
        jitter_ms: int = 15,
        chaos_rate: float = 0.0,
        chaos_type: str = "429_rate_limit",
        usd_per_1k_tokens: float = 0.005,
    ):
        self.base_latency_ms = max(0, min(10000, int(base_latency_ms)))
        self.jitter_ms = max(0, min(5000, int(jitter_ms)))
        self.chaos_rate = max(0.0, min(1.0, float(chaos_rate)))
        self.chaos_type = chaos_type if chaos_type in VALID_CHAOS_TYPES else "429_rate_limit"
        self.usd_per_1k_tokens = usd_per_1k_tokens

    def match(
        self,
        method: str,
        path: str,
        query_params: Dict[str, Any],
        headers: Dict[str, str],
        body: str,
        candidates: List[RecordedRoute],
    ) -> MatchResult:
        method = method.upper()
        norm_path = normalize_path(path)
        req_hash = hash_body(body)
        req_keys = set(extract_json_keys(body))

        # 0. Check Chaos Fault Injection
        if self.chaos_rate > 0.0 and random.random() < self.chaos_rate:
            chaos_route = self._synthesize_chaos(method, norm_path, body)
            sim_latency = self._compute_latency()
            if self.chaos_type == "timeout_hang":
                sim_latency = max(sim_latency, min(2000, self.base_latency_ms + 250))
            return MatchResult(
                route=chaos_route,
                match_type="chaos",
                confidence=1.0,
                latency_ms=sim_latency,
                tokens_saved=0,
                usd_saved=0.0,
            )

        # 1. Exact Match: Method + Path + Body Hash
        exact_matches = [
            r for r in candidates
            if r.method == method and r.path == norm_path and r.body_hash == req_hash
        ]
        if exact_matches:
            matched = exact_matches[0]
            sim_latency = self._compute_latency()
            tokens = matched.token_estimate or estimate_tokens(body, matched.response_body)
            usd = round((tokens / 1000.0) * self.usd_per_1k_tokens, 5)
            return MatchResult(
                route=matched,
                match_type="exact",
                confidence=1.0,
                latency_ms=sim_latency,
                tokens_saved=tokens,
                usd_saved=usd,
            )

        # 1b. Exact Match on Path + Method if body is empty or GET/HEAD/OPTIONS/DELETE request
        if method in ("GET", "HEAD", "OPTIONS", "DELETE") or req_hash == "empty":
            path_matches = [r for r in candidates if r.method == method and r.path == norm_path]
            if path_matches:
                matched = path_matches[0]
                sim_latency = self._compute_latency()
                tokens = matched.token_estimate or 15
                usd = round((tokens / 1000.0) * self.usd_per_1k_tokens, 5)
                return MatchResult(
                    route=matched,
                    match_type="exact",
                    confidence=0.95,
                    latency_ms=sim_latency,
                    tokens_saved=tokens,
                    usd_saved=usd,
                )

        # 2. Fuzzy Semantic Match: Exact Method + Path with JSON key & model similarity
        same_path_candidates = [
            r for r in candidates
            if r.method == method and r.path == norm_path
        ]
        if same_path_candidates:
            best_route, best_score = self._score_candidates(same_path_candidates, body, req_keys)
            if best_route and best_score >= 0.4:
                sim_latency = self._compute_latency()
                tokens = best_route.token_estimate or estimate_tokens(body, best_route.response_body)
                usd = round((tokens / 1000.0) * self.usd_per_1k_tokens, 5)
                return MatchResult(
                    route=best_route,
                    match_type="fuzzy",
                    confidence=min(0.99, round(best_score, 2)),
                    latency_ms=sim_latency,
                    tokens_saved=tokens,
                    usd_saved=usd,
                )

        # 2b. Safe Literal-Segment OpenAPI `{param}` Path-Template Matching (ReDoS-proof)
        template_hits: List[Tuple[int, int, RecordedRoute, Dict[str, str]]] = []
        for idx, cand in enumerate(candidates):
            if cand.method != method:
                continue
            tpl_match = _match_path_template(cand.path, norm_path)
            if tpl_match is not None:
                lit_count, params = tpl_match
                body_bonus = 1 if cand.body_hash == req_hash else 0
                template_hits.append((lit_count, body_bonus, idx, cand, params))

        if template_hits:
            # Sort by most literal segments, then exact body hash match, then deterministic insertion order
            template_hits.sort(key=lambda item: (-item[0], -item[1], item[2]))
            _, body_bonus, _, matched, _params = template_hits[0]
            sim_latency = self._compute_latency()
            tokens = matched.token_estimate or estimate_tokens(body, matched.response_body)
            usd = round((tokens / 1000.0) * self.usd_per_1k_tokens, 5)
            return MatchResult(
                route=matched,
                match_type="template",
                confidence=0.98 if body_bonus else 0.92,
                latency_ms=sim_latency,
                tokens_saved=tokens,
                usd_saved=usd,
            )

        # 3. Fallback Response Synthesis (Unseen Endpoints)
        fallback_route = self._synthesize_fallback(method, norm_path, body)
        sim_latency = self._compute_latency()
        tokens = fallback_route.token_estimate
        usd = round((tokens / 1000.0) * self.usd_per_1k_tokens, 5)
        return MatchResult(
            route=fallback_route,
            match_type="fallback",
            confidence=0.5,
            latency_ms=sim_latency,
            tokens_saved=tokens,
            usd_saved=usd,
        )

    def _score_candidates(
        self,
        candidates: List[RecordedRoute],
        body: str,
        req_keys: set,
    ) -> Tuple[Optional[RecordedRoute], float]:
        best_route: Optional[RecordedRoute] = None
        best_score = -1.0
        req_model = self._extract_model(body)

        for cand in candidates:
            score = 0.5
            cand_keys = set(cand.body_keys)

            if req_keys and cand_keys:
                jaccard = len(req_keys & cand_keys) / len(req_keys | cand_keys)
                score += jaccard * 0.3
            elif not req_keys and not cand_keys:
                score += 0.2

            cand_model = self._extract_model(cand.raw_body)
            if req_model and cand_model:
                if req_model == cand_model:
                    score += 0.2
                elif req_model.split("-")[0] == cand_model.split("-")[0]:
                    score += 0.1

            if score > best_score:
                best_score = score
                best_route = cand

        return best_route, best_score

    def _compute_latency(self) -> int:
        """Compute latency with random jitter."""
        if self.base_latency_ms <= 0:
            return 0
        jitter = random.randint(-self.jitter_ms, self.jitter_ms) if self.jitter_ms > 0 else 0
        return max(5, self.base_latency_ms + jitter)

    def apply_latency_sleep(self, latency_ms: int) -> None:
        """Sleep for simulated latency if greater than 0."""
        if latency_ms > 0:
            time.sleep(latency_ms / 1000.0)

    @staticmethod
    def _extract_model(body: str) -> Optional[str]:
        if not body:
            return None
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict) and "model" in parsed:
                return str(parsed["model"]).lower()
        except Exception:
            pass
        return None

    @staticmethod
    def _deterministic_id(prefix: str, method: str, path: str, body: str) -> str:
        digest = hashlib.sha256(f"{method}:{path}:{hash_body(body)}".encode("utf-8")).hexdigest()[:12]
        return f"{prefix}{digest}"

    def _synthesize_fallback(self, method: str, path: str, body: str) -> RecordedRoute:
        """Synthesize 100% deterministic mock response for known provider formats."""
        det_suffix = hashlib.sha256(f"{method}:{path}:{hash_body(body)}".encode("utf-8")).hexdigest()[:12]
        req_model = self._extract_model(body) or "mock-twin-v1"

        if "/chat/completions" in path:
            content = "Deterministic mock twin response for autonomous agent testing ($0 token cost)."
            res_body = json.dumps({
                "id": f"chatcmpl-mock-twin-{det_suffix}",
                "object": "chat.completion",
                "created": DETERMINISTIC_EPOCH,
                "model": req_model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": content,
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": 20,
                    "completion_tokens": 15,
                    "total_tokens": 35,
                },
            }, indent=2)
            return RecordedRoute(
                id=f"synth_{det_suffix}",
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body_hash=hash_body(body),
                body_keys=extract_json_keys(body),
                raw_body=body,
                response_status=200,
                response_headers={"content-type": "application/json", "x-mock-twin": "fallback-openai"},
                response_body=res_body,
                source="synthetic",
                provider="openai",
                token_estimate=35,
                description="Synthesized OpenAI Chat Completion Fallback",
            )

        if "/messages" in path:
            res_body = json.dumps({
                "id": f"msg_mock_twin_{det_suffix}",
                "type": "message",
                "role": "assistant",
                "model": req_model,
                "content": [
                    {
                        "type": "text",
                        "text": "Deterministic mock twin response for autonomous agent testing ($0 token cost).",
                    }
                ],
                "stop_reason": "end_turn",
                "stop_sequence": None,
                "usage": {
                    "input_tokens": 24,
                    "output_tokens": 16,
                },
            }, indent=2)
            return RecordedRoute(
                id=f"synth_{det_suffix}",
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body_hash=hash_body(body),
                body_keys=extract_json_keys(body),
                raw_body=body,
                response_status=200,
                response_headers={"content-type": "application/json", "x-mock-twin": "fallback-anthropic"},
                response_body=res_body,
                source="synthetic",
                provider="anthropic",
                token_estimate=40,
                description="Synthesized Anthropic Claude Message Fallback",
            )

        if "/embeddings" in path:
            res_body = json.dumps({
                "object": "list",
                "data": [
                    {
                        "object": "embedding",
                        "index": 0,
                        "embedding": [0.0123, -0.0456, 0.0789, 0.0012] * 384,
                    }
                ],
                "model": req_model,
                "usage": {"prompt_tokens": 12, "total_tokens": 12},
            })
            return RecordedRoute(
                id=f"synth_{det_suffix}",
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body_hash=hash_body(body),
                body_keys=extract_json_keys(body),
                raw_body=body,
                response_status=200,
                response_headers={"content-type": "application/json", "x-mock-twin": "fallback-embeddings"},
                response_body=res_body,
                source="synthetic",
                provider="openai",
                token_estimate=12,
                description="Synthesized Embedding Fallback",
            )

        if "/models" in path:
            res_body = json.dumps({
                "object": "list",
                "data": [
                    {"id": "gpt-4o", "object": "model", "owned_by": "openai"},
                    {"id": "gpt-4o-mini", "object": "model", "owned_by": "openai"},
                    {"id": "claude-3-5-sonnet", "object": "model", "owned_by": "anthropic"},
                ],
            })
            return RecordedRoute(
                id=f"synth_{det_suffix}",
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body_hash=hash_body(body),
                body_keys=extract_json_keys(body),
                raw_body=body,
                response_status=200,
                response_headers={"content-type": "application/json", "x-mock-twin": "fallback-models"},
                response_body=res_body,
                source="synthetic",
                provider="openai",
                token_estimate=10,
                description="Synthesized Models List Fallback",
            )

        if "/api/generate" in path:
            res_body = json.dumps({
                "model": req_model,
                "created_at": "2026-11-26T00:00:00Z",
                "response": "Deterministic offline Ollama twin response ($0 token cost).",
                "done": True,
                "eval_count": 32,
            }, indent=2)
            return RecordedRoute(
                id=f"synth_{det_suffix}",
                method=method,
                path=path,
                query_params={},
                headers={"content-type": "application/json"},
                body_hash=hash_body(body),
                body_keys=extract_json_keys(body),
                raw_body=body,
                response_status=200,
                response_headers={"content-type": "application/json", "x-mock-twin": "fallback-ollama"},
                response_body=res_body,
                source="synthetic",
                provider="ollama",
                token_estimate=32,
                description="Synthesized Ollama Generate Fallback",
            )

        # Generic REST Fallback
        res_body = json.dumps({
            "mock": True,
            "twin": "agent-mock-twin",
            "id": f"synth_{det_suffix}",
            "method": method,
            "path": path,
            "status": "synthesized",
            "message": "Deterministic offline mock twin endpoint.",
        }, indent=2)
        return RecordedRoute(
            id=f"synth_{det_suffix}",
            method=method,
            path=path,
            query_params={},
            headers={"content-type": "application/json"},
            body_hash=hash_body(body),
            body_keys=extract_json_keys(body),
            raw_body=body,
            response_status=200,
            response_headers={"content-type": "application/json", "x-mock-twin": "fallback-generic"},
            response_body=res_body,
            source="synthetic",
            provider="custom",
            token_estimate=15,
            description=f"Generic Synthesized {method} {path}",
        )

    def _synthesize_chaos(self, method: str, path: str, body: str = "") -> RecordedRoute:
        """Create artificial chaos/fault response."""
        det_suffix = hashlib.sha256(f"chaos:{self.chaos_type}:{method}:{path}:{hash_body(body)}".encode("utf-8")).hexdigest()[:12]
        if self.chaos_type == "500_internal_error":
            res_body = json.dumps({"error": {"message": "Simulated internal server error (Chaos Injection)", "type": "server_error", "code": 500}})
            status = 500
        elif self.chaos_type == "503_service_unavailable":
            res_body = json.dumps({"error": {"message": "Service temporarily overloaded (Chaos Injection)", "type": "service_unavailable", "code": 503}})
            status = 503
        elif self.chaos_type == "timeout_hang":
            res_body = json.dumps({"error": {"message": "Upstream gateway timeout simulated (Chaos Injection)", "type": "gateway_timeout", "code": 504}})
            status = 504
        else:
            res_body = json.dumps({
                "error": {
                    "message": "Rate limit reached for requests (Simulated Chaos Fault Injection)",
                    "type": "requests",
                    "code": "rate_limit_exceeded",
                }
            })
            status = 429

        return RecordedRoute(
            id=f"chaos_{det_suffix}",
            method=method,
            path=path,
            query_params={},
            headers={"content-type": "application/json"},
            body_hash="chaos",
            body_keys=[],
            raw_body="",
            response_status=status,
            response_headers={
                "content-type": "application/json",
                "x-mock-twin": "chaos-fault-injection",
                "retry-after": "5",
            },
            response_body=res_body,
            source="synthetic",
            provider="custom",
            token_estimate=0,
            description=f"Chaos Fault {status} on {method} {path}",
        )
