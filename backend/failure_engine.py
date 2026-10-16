
"""
KEYSTONE — Failure Scenario Search Engine
Stage 3C: Deterministic production-line analysis with backup capacity.

DISCLAIMER
This is a simplified sequential-line model for simulation and educational
purposes only. Results are estimates and are not industrially validated
or calibrated. Backups may provide less capacity than primary machines.
"""

from __future__ import annotations

import itertools
import math
from typing import Any


MachineConfig = dict[str, Any]
Scenario = dict[str, Any]


class FailureEngine:
    """
    Deterministic failure-scenario analysis for a sequential production line.

    Required machine fields:
        id: unique, non-empty string
        name: non-empty string
        capacity_per_min: finite number greater than zero

    Optional fields:
        backup_capacity_per_min: finite number >= 0 (default 0)
        backup_enabled: boolean (default False)
        dependencies: accepted for compatibility; not used in this model
    """

    def __init__(self, config: dict) -> None:
        if not isinstance(config, dict):
            raise ValueError("config must be a dictionary")

        machines = config.get("machines")

        if (
            not isinstance(machines, list)
            or not machines
        ):
            raise ValueError(
                "config must contain a non-empty 'machines' list"
            )

        normalized: list[MachineConfig] = []
        seen_ids: set[str] = set()

        for index, machine in enumerate(machines):
            if not isinstance(machine, dict):
                raise ValueError(
                    f"Machine at index {index} must be a dictionary"
                )

            for field in ("id", "name", "capacity_per_min"):
                if field not in machine:
                    raise ValueError(
                        f"Machine '{machine.get('id', '?')}' is missing "
                        f"required field '{field}'"
                    )

            machine_id = machine["id"]
            name = machine["name"]

            if not isinstance(machine_id, str) or not machine_id.strip():
                raise ValueError(
                    f"Machine at index {index} must have a non-empty string id"
                )

            if machine_id in seen_ids:
                raise ValueError(
                    f"Duplicate machine id: '{machine_id}'"
                )
            seen_ids.add(machine_id)

            if not isinstance(name, str) or not name.strip():
                raise ValueError(
                    f"Machine '{machine_id}' must have a non-empty string name"
                )

            capacity = machine["capacity_per_min"]
            self._validate_capacity(
                capacity,
                f"Machine '{machine_id}' capacity_per_min",
                allow_zero=False,
            )

            backup_capacity = machine.get("backup_capacity_per_min", 0.0)
            self._validate_capacity(
                backup_capacity,
                f"Machine '{machine_id}' backup_capacity_per_min",
                allow_zero=True,
            )

            backup_enabled = machine.get("backup_enabled", False)
            if not isinstance(backup_enabled, bool):
                raise ValueError(
                    f"Machine '{machine_id}' backup_enabled must be a boolean"
                )

            normalized_machine = dict(machine)
            normalized_machine["backup_capacity_per_min"] = backup_capacity
            normalized_machine["backup_enabled"] = backup_enabled
            normalized.append(normalized_machine)

        # Keep the normalized configuration and ID lookup.
        self._machines: list[MachineConfig] = normalized
        self._id_to_machine: dict[str, MachineConfig] = {
            machine["id"]: machine for machine in self._machines
        }

    @staticmethod
    def _validate_capacity(
        value: Any,
        field_description: str,
        allow_zero: bool,
    ) -> None:
        """Reject booleans, non-numeric values, NaN, infinity and invalid signs."""
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(
                f"{field_description} must be a finite number"
            )

        if not math.isfinite(value):
            raise ValueError(
                f"{field_description} must be a finite number"
            )

        if allow_zero:
            if value < 0:
                raise ValueError(
                    f"{field_description} must be >= 0"
                )
        elif value <= 0:
            raise ValueError(
                f"{field_description} must be > 0"
            )

    @property
    def machines(self) -> list[MachineConfig]:
        """Return a list copy of the configured machines."""
        return [dict(machine) for machine in self._machines]

    def baseline_throughput(self) -> float:
        """Normal throughput equals the lowest primary station capacity."""
        return min(
            machine["capacity_per_min"] for machine in self._machines
        )

    # ------------------------------------------------------------------
    # Scenario generation
    # ------------------------------------------------------------------

    def single_failure_scenarios(self) -> list[Scenario]:
        scenarios = [
            self._evaluate_scenario([machine["id"]])
            for machine in self._machines
        ]
        return self._rank_and_tag_ties(scenarios)

    def pair_failure_scenarios(self) -> list[Scenario]:
        machine_ids = [machine["id"] for machine in self._machines]
        scenarios = [
            self._evaluate_scenario(list(pair))
            for pair in itertools.combinations(machine_ids, 2)
        ]
        return self._rank_and_tag_ties(scenarios)

    def all_scenarios(self) -> list[Scenario]:
        machine_ids = [machine["id"] for machine in self._machines]

        scenarios = [
            self._evaluate_scenario([machine_id])
            for machine_id in machine_ids
        ]

        scenarios.extend(
            self._evaluate_scenario(list(pair))
            for pair in itertools.combinations(machine_ids, 2)
        )

        return self._rank_and_tag_ties(scenarios)

    # ------------------------------------------------------------------
    # Key findings
    # ------------------------------------------------------------------

    def most_critical_machine(self) -> Scenario:
        """Return the highest-loss single-machine failure scenario."""
        return self.single_failure_scenarios()[0]

    def most_damaging_pair(self) -> Scenario | None:
        """Return the highest-loss pair, or None with fewer than two machines."""
        if len(self._machines) < 2:
            return None

        return self.pair_failure_scenarios()[0]

    # ------------------------------------------------------------------
    # Full report
    # ------------------------------------------------------------------

    def full_report(self) -> dict[str, Any]:
        single = self.single_failure_scenarios()
        pairs = self.pair_failure_scenarios()
        critical = single[0]
        worst_pair = pairs[0] if pairs else None

        return {
            "baseline_throughput_per_min": self.baseline_throughput(),
            "machine_count": len(self._machines),
            "machines": [
                {
                    "id": machine["id"],
                    "name": machine["name"],
                    "capacity_per_min": machine["capacity_per_min"],
                    "backup_capacity_per_min": machine[
                        "backup_capacity_per_min"
                    ],
                    "backup_enabled": machine["backup_enabled"],
                }
                for machine in self._machines
            ],
            "single_failure_scenarios": single,
            "pair_failure_scenarios": pairs,
            "most_critical_machine": critical,
            "most_damaging_pair": worst_pair,
            "model_note": (
                "ESTIMATE ONLY. Results are based on a simplified "
                "sequential-line bottleneck model with optional backup capacity. "
                "Backups do not always maintain full production. "
                "Results are not industrially validated or calibrated. "
                "Machine dependencies are not simulated by this model."
            ),
        }

    # ------------------------------------------------------------------
    # Scenario evaluation
    # ------------------------------------------------------------------

    def _evaluate_scenario(self, failed_ids: list[str]) -> Scenario:
        """Evaluate a failure scenario with optional backup activation."""
        if not isinstance(failed_ids, list):
            raise ValueError("failed_ids must be a list of machine IDs")

        for machine_id in failed_ids:
            if machine_id not in self._id_to_machine:
                raise ValueError(f"Unknown machine id: '{machine_id}'")

        # Reject duplicate IDs rather than silently inflating failed_count.
        if len(failed_ids) != len(set(failed_ids)):
            raise ValueError("failed_ids must not contain duplicate machine IDs")

        baseline = self.baseline_throughput()
        failed_set = set(failed_ids)

        operational = [
            machine
            for machine in self._machines
            if machine["id"] not in failed_set
        ]
        failed_machines = [
            self._id_to_machine[machine_id]
            for machine_id in failed_ids
        ]

        effective_capacities: dict[str, float] = {}
        backups_activated: list[dict[str, Any]] = []

        for machine in self._machines:
            machine_id = machine["id"]

            if machine_id not in failed_set:
                effective_capacities[machine_id] = machine["capacity_per_min"]
                continue

            backup_capacity = machine["backup_capacity_per_min"]

            if machine["backup_enabled"] and backup_capacity > 0:
                effective_capacities[machine_id] = backup_capacity
                backups_activated.append(
                    {
                        "machine_id": machine_id,
                        "machine_name": machine["name"],
                        "backup_capacity_per_min": backup_capacity,
                    }
                )
            else:
                effective_capacities[machine_id] = 0.0

        # The line is limited by its lowest effective station capacity.
        bottleneck_id = min(
            effective_capacities,
            key=lambda machine_id: effective_capacities[machine_id],
        )
        scenario_throughput = effective_capacities[bottleneck_id]
        bottleneck_capacity = scenario_throughput

        units_lost = max(0.0, baseline - scenario_throughput)
        loss_pct = round((units_lost / baseline) * 100, 2)

        return {
            "failed_ids": [machine["id"] for machine in failed_machines],
            "failed_names": [machine["name"] for machine in failed_machines],
            "failed_count": len(failed_machines),
            "baseline_per_min": baseline,
            "scenario_throughput": scenario_throughput,
            "units_lost_per_min": units_lost,
            "production_loss_pct": loss_pct,
            "operational_ids": [machine["id"] for machine in operational],
            "operational_count": len(operational),
            "backups_activated": backups_activated,
            "has_backup_activated": bool(backups_activated),
            "effective_capacities": effective_capacities,
            "bottleneck_id": bottleneck_id,
            "bottleneck_capacity": bottleneck_capacity,
        }

    @classmethod
    def _rank_and_tag_ties(
        cls,
        scenarios: list[Scenario],
    ) -> list[Scenario]:
        """Rank by descending loss; equal losses share a rank."""
        sorted_scenarios = sorted(
            scenarios,
            key=lambda scenario: (
                -scenario["production_loss_pct"],
                scenario["failed_ids"],
            ),
        )

        loss_counts: dict[float, int] = {}
        for scenario in sorted_scenarios:
            loss = scenario["production_loss_pct"]
            loss_counts[loss] = loss_counts.get(loss, 0) + 1

        current_rank = 1
        last_loss = None

        for index, scenario in enumerate(sorted_scenarios):
            loss = scenario["production_loss_pct"]

            if loss != last_loss:
                current_rank = index + 1
                last_loss = loss

            scenario["rank"] = current_rank
            scenario["is_tied"] = loss_counts[loss] > 1

        return sorted_scenarios
