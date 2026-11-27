from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Set

import yaml

logger = logging.getLogger("fieldkit.mission")

DEFAULT_TERMINAL_STATES = frozenset({"mission_complete", "complete"})


class StateTransitionError(Exception):
    """Raised when an illegal, cyclic, or out-of-order step transition is attempted."""


@dataclass
class Step:
    id: str
    name: str
    prompt_speech: str
    expected_action: Optional[str] = None
    verification_rules: Dict[str, Any] = field(default_factory=dict)
    on_success: Optional[str] = None
    on_failure: Optional[str] = None
    completed_at: Optional[float] = None
    verification_evidence: Optional[str] = None

    @property
    def is_completed(self) -> bool:
        return self.completed_at is not None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "prompt_speech": self.prompt_speech,
            "expected_action": self.expected_action,
            "verification_rules": dict(self.verification_rules),
            "on_success": self.on_success,
            "on_failure": self.on_failure,
            "completed_at": self.completed_at,
            "verification_evidence": self.verification_evidence,
        }


class Mission:
    """Deterministic Directed Acyclic Graph (DAG) state machine for physical operations."""

    def __init__(
        self,
        mission_id: str,
        title: str,
        category: str = "general",
        initial_step: Optional[str] = None,
        failure_step: Optional[str] = None,
        requirements: Optional[Dict[str, Any]] = None,
        terminal_states: Optional[Dict[str, Any]] = None,
    ):
        self.mission_id = mission_id
        self.title = title
        self.category = category
        self.initial_step_id = initial_step
        self.failure_step_id = failure_step
        self.requirements: Dict[str, Any] = dict(requirements or {})
        self.terminal_states: Dict[str, Any] = dict(terminal_states or {})
        self.steps: Dict[str, Step] = {}
        self.ordered_step_ids: List[str] = []
        self.current_step_id: Optional[str] = None
        self.started_at: float = time.time()
        self.completed_at: Optional[float] = None
        self.aborted: bool = False
        self.abort_reason: Optional[str] = None
        self._visited_step_ids: Set[str] = set()
        self.listeners: List[Callable[[str, Step], None]] = []

    @classmethod
    def from_yaml_file(cls, filepath: str) -> Mission:
        with open(filepath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            raise StateTransitionError("Mission YAML root must be a mapping object")
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Mission:
        if not isinstance(data, dict):
            raise StateTransitionError("Mission definition must be a dictionary")

        sm = data.get("state_machine", {})
        if not isinstance(sm, dict):
            raise StateTransitionError("state_machine section must be a dictionary")

        raw_steps = sm.get("steps", [])
        if not isinstance(raw_steps, list) or len(raw_steps) == 0:
            raise StateTransitionError("Mission must define a non-empty list of steps")

        m = cls(
            mission_id=str(data.get("mission_id", f"mission-{int(time.time())}")),
            title=str(data.get("title", "Untitled Physical Mission")),
            category=str(data.get("category", "general")),
            initial_step=sm.get("initial_step"),
            failure_step=sm.get("failure_step"),
            requirements=data.get("requirements") if isinstance(data.get("requirements"), dict) else {},
            terminal_states=sm.get("terminal_states") if isinstance(sm.get("terminal_states"), dict) else {},
        )

        seen_ids: Set[str] = set()
        for idx, step_data in enumerate(raw_steps):
            if not isinstance(step_data, dict):
                raise StateTransitionError(f"Step at index {idx} must be a dictionary")
            step_id = step_data.get("id")
            step_name = step_data.get("name")
            prompt_speech = step_data.get("prompt_speech")
            if not isinstance(step_id, str) or not step_id.strip():
                raise StateTransitionError(f"Step at index {idx} missing valid string 'id'")
            if step_id in seen_ids:
                raise StateTransitionError(f"Duplicate step id '{step_id}' in mission definition")
            seen_ids.add(step_id)
            if not isinstance(step_name, str) or not step_name.strip():
                raise StateTransitionError(f"Step '{step_id}' missing valid string 'name'")
            if not isinstance(prompt_speech, str) or not prompt_speech.strip():
                raise StateTransitionError(f"Step '{step_id}' missing valid string 'prompt_speech'")

            rules = step_data.get("verification_rules", {})
            if rules is None:
                rules = {}
            if not isinstance(rules, dict):
                raise StateTransitionError(f"Step '{step_id}' verification_rules must be a dictionary")

            verification_target = step_data.get("verification_target")
            if verification_target and "visual_target" not in rules:
                rules = dict(rules)
                rules["visual_target"] = str(verification_target)

            s = Step(
                id=step_id,
                name=step_name,
                prompt_speech=prompt_speech,
                expected_action=step_data.get("expected_action"),
                verification_rules=rules,
                on_success=step_data.get("on_success"),
                on_failure=step_data.get("on_failure"),
            )
            m.add_step(s)

        if m.initial_step_id:
            if m.initial_step_id not in m.steps:
                raise StateTransitionError(
                    f"Initial step '{m.initial_step_id}' does not exist in mission steps"
                )
            m.current_step_id = m.initial_step_id
        elif m.ordered_step_ids:
            m.current_step_id = m.ordered_step_ids[0]

        m.validate_dag()
        return m

    def _terminal_names(self) -> Set[str]:
        return set(DEFAULT_TERMINAL_STATES) | set(self.terminal_states.keys())

    def _resolve_forward_target(self, step_id: str) -> Optional[str]:
        step = self.steps[step_id]
        terminals = self._terminal_names()
        if step.on_success is not None:
            if step.on_success in terminals:
                return None
            if step.on_success not in self.steps:
                raise StateTransitionError(
                    f"Step '{step_id}' on_success target '{step.on_success}' does not exist"
                )
            return step.on_success

        cur_idx = self.ordered_step_ids.index(step_id)
        if cur_idx + 1 < len(self.ordered_step_ids):
            return self.ordered_step_ids[cur_idx + 1]
        return None

    def validate_dag(self) -> None:
        """Verify forward step transitions form a valid acyclic DAG."""
        if not self.ordered_step_ids:
            return

        if self.initial_step_id and self.initial_step_id not in self.steps:
            raise StateTransitionError(
                f"Initial step '{self.initial_step_id}' does not exist in mission steps"
            )

        # 0 = unvisited, 1 = visiting (active recursion stack), 2 = visited
        state: Dict[str, int] = {sid: 0 for sid in self.ordered_step_ids}

        for start_id in self.ordered_step_ids:
            if state[start_id] != 0:
                continue
            path: List[str] = []
            node: Optional[str] = start_id
            while node is not None:
                if state[node] == 1:
                    cycle_start = path.index(node)
                    cycle_path = " -> ".join(path[cycle_start:] + [node])
                    raise StateTransitionError(f"Cycle detected in mission DAG: {cycle_path}")
                if state[node] == 2:
                    break
                state[node] = 1
                path.append(node)
                node = self._resolve_forward_target(node)
            for visited_node in path:
                state[visited_node] = 2

    def add_step(self, step: Step) -> None:
        self.steps[step.id] = step
        if step.id not in self.ordered_step_ids:
            self.ordered_step_ids.append(step.id)
        if not self.current_step_id:
            self.current_step_id = step.id

    def subscribe(self, callback: Callable[[str, Step], None]) -> None:
        """Subscribe to step advancement events (e.g. for audio TTS dispatch)."""
        self.listeners.append(callback)

    @property
    def current_step(self) -> Optional[Step]:
        if self.completed_at is not None:
            return None
        if not self.current_step_id or self.current_step_id not in self.steps:
            return None
        return self.steps[self.current_step_id]

    @property
    def is_finished(self) -> bool:
        return self.completed_at is not None or self.current_step is None

    @property
    def progress_percentage(self) -> float:
        if not self.ordered_step_ids:
            return 100.0 if self.completed_at else 0.0
        completed = sum(1 for sid in self.ordered_step_ids if self.steps[sid].is_completed)
        return round((completed / len(self.ordered_step_ids)) * 100.0, 1)

    def _notify(self, event: str, step: Step) -> None:
        for listener in self.listeners:
            try:
                listener(event, step)
            except Exception as exc:
                logger.warning("Mission listener error on '%s': %s", event, exc)

    def advance(self, evidence: str = "Sensory verification confirmed") -> Optional[Step]:
        """Verify the current step and transition forward in the DAG."""
        if self.is_finished:
            return None

        curr = self.current_step
        if not curr:
            return None

        # Validate target & guard against runtime cycles even when steps were added imperatively
        next_step_id = self._resolve_forward_target(curr.id)
        if next_step_id is not None and (
            next_step_id == curr.id or next_step_id in self._visited_step_ids
        ):
            raise StateTransitionError(
                f"Cycle detected transitioning from '{curr.id}' to '{next_step_id}'"
            )

        curr.completed_at = time.time()
        curr.verification_evidence = evidence
        self._visited_step_ids.add(curr.id)
        self._notify("step_verified", curr)

        if next_step_id is None:
            self.current_step_id = None
            self.completed_at = time.time()
            return None

        self.current_step_id = next_step_id
        new_step = self.current_step
        if new_step is not None:
            self._notify("step_activated", new_step)
        return new_step

    def abort(self, reason: str = "Safety threshold violated") -> None:
        """Abort mission to failure safety state."""
        self.aborted = True
        self.abort_reason = reason
        self.current_step_id = self.failure_step_id
        self.completed_at = time.time()
        self._notify("mission_aborted", Step(id="abort", name="ABORT", prompt_speech=reason))
