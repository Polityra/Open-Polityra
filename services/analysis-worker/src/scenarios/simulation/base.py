"""Scenario simulation framework.

Each scenario represents a configurable set of assumptions about how the
underlying system might evolve.  Scenarios can be edited, combined, and
run to produce comparative outcome summaries.

SAMPLE / PLACEHOLDER: The simulation engine uses simplified proportional
models for demonstration.  Replace with domain-specific agent-based or
system-dynamics models in production.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class SimulationScenario:
    """A single scenario with editable assumptions and configurable parameters.

    Attributes:
        name: Human-readable identifier for the scenario.
        assumptions: Key-value pairs describing the scenario's conditions.
        params: Additional simulation parameters (e.g. time_steps, step_size).
        active: Whether this scenario is included in simulations.
        metadata: Arbitrary extra data attached to the scenario.
    """

    name: str
    assumptions: dict[str, Any] = field(default_factory=dict)
    params: dict[str, float] = field(default_factory=lambda: {
        "time_steps": 30,
        "step_size": 1.0,
    })
    active: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)

    _id: str = field(default_factory=lambda: uuid.uuid4().hex[:8], init=False)

    # ── editing helpers ────────────────────────────────────────────────────────

    def set_assumption(self, key: str, value: Any) -> None:
        """Update or insert a single assumption."""
        self.assumptions[key] = value

    def remove_assumption(self, key: str) -> None:
        """Remove an assumption by key (no-op if missing)."""
        self.assumptions.pop(key, None)

    def update_params(self, **overrides: float) -> None:
        """Update multiple simulation parameters at once."""
        self.params.update(overrides)

    def with_name(self, name: str) -> SimulationScenario:
        """Return a copy of this scenario with the given name."""
        clone = SimulationScenario(
            name=name,
            assumptions=dict(self.assumptions),
            params=dict(self.params),
            active=self.active,
            metadata=dict(self.metadata),
        )
        return clone

    # ── simulation execution ───────────────────────────────────────────────────

    def run(
        self,
        initial_values: list[float],
        growth_fn: Any | None = None,
    ) -> dict[str, Any]:
        """Execute a simplified simulation using the scenario's assumptions.

        Args:
            initial_values: Starting observations for the model.
            growth_fn: Optional callable ``f(time_step) -> float`` that defines
                the growth at each step. If ``None``, uses an exponential model
                based on the ``growth_rate`` assumption (default 0.02).

        Returns:
            A dict with *sim_id*, *name*, *outcome_values*, and *summary*.
        """
        if not self.active:
            raise ValueError(f"scenario '{self.name}' is inactive")

        growth_rate = self.assumptions.get("growth_rate", 0.02)
        time_steps = int(self.params.get("time_steps", 30))

        outcome_values: list[float] = []
        current = initial_values[-1] if initial_values else 0.0

        for t in range(time_steps):
            if growth_fn is not None:
                increment = growth_fn(t) * growth_rate * current
            else:
                increment = growth_rate * current
            current += increment
            outcome_values.append(round(current, 4))

        summary = {
            "initial_value": initial_values[-1] if initial_values else 0.0,
            "final_value": outcome_values[-1] if outcome_values else 0.0,
            "total_change": (
                round(
                    (outcome_values[-1] - (initial_values[-1] if initial_values else 0)) / max(abs(initial_values[-1]) if initial_values else 1, 1e-9) * 100,
                    2,
                )
            ),
        }

        return {
            "sim_id": self._id,
            "name": self.name,
            "assumptions": dict(self.assumptions),
            "outcome_values": outcome_values,
            "summary": summary,
        }


@dataclass
class ScenarioSet:
    """A collection of scenarios to be run and compared."""

    name: str
    scenarios: list[SimulationScenario] = field(default_factory=list)

    def add(self, scenario: SimulationScenario) -> None:
        self.scenarios.append(scenario)

    def run_all(
        self,
        initial_values: list[float],
        growth_fn: Any | None = None,
    ) -> list[dict[str, Any]]:
        """Run every scenario and return results in insertion order."""
        return [s.run(initial_values, growth_fn) for s in self.scenarios if s.active]

    def remove(self, name: str) -> SimulationScenario | None:
        """Remove and return the scenario with *name*, or ``None``."""
        for i, s in enumerate(self.scenarios):
            if s.name == name:
                return self.scenarios.pop(i)
        return None
