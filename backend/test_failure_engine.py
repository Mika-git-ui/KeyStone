
import unittest
import math

from backend.failure_engine import FailureEngine


def make_engine(machines=None):
    if machines is None:
        machines = [
            {
                "id": "cutting",
                "name": "Cutting",
                "capacity_per_min": 120,
                "backup_capacity_per_min": 70,
                "backup_enabled": True,
            },
            {
                "id": "welding",
                "name": "Welding",
                "capacity_per_min": 95,
                "backup_capacity_per_min": 60,
                "backup_enabled": True,
            },
            {
                "id": "assembly",
                "name": "Assembly",
                "capacity_per_min": 110,
                "backup_capacity_per_min": 50,
                "backup_enabled": False,
            },
            {
                "id": "inspection",
                "name": "Inspection",
                "capacity_per_min": 130,
                "backup_capacity_per_min": 80,
                "backup_enabled": False,
            },
        ]
    return FailureEngine({"machines": machines})


class TestBaseline(unittest.TestCase):
    def test_baseline_is_minimum_station_capacity(self):
        self.assertEqual(make_engine().baseline_throughput(), 95)

    def test_baseline_is_numeric(self):
        self.assertIsInstance(make_engine().baseline_throughput(), (int, float))

    def test_baseline_with_backup_config(self):
        self.assertEqual(make_engine().baseline_throughput(), 95)

    def test_machine_order_is_preserved(self):
        ids = [m["id"] for m in make_engine().machines]
        self.assertEqual(ids, ["cutting", "welding", "assembly", "inspection"])


class TestSingleFailure(unittest.TestCase):
    def test_each_scenario_has_one_failed_machine(self):
        for scenario in make_engine().single_failure_scenarios():
            self.assertEqual(scenario["failed_count"], 1)

    def test_failed_machines_are_not_operational(self):
        for scenario in make_engine().single_failure_scenarios():
            for machine_id in scenario["failed_ids"]:
                self.assertNotIn(machine_id, scenario["operational_ids"])

    def test_failed_names_match_machine_configuration(self):
        engine = make_engine()
        lookup = {m["id"]: m["name"] for m in engine.machines}
        for scenario in engine.single_failure_scenarios():
            self.assertEqual(
                scenario["failed_names"],
                [lookup[machine_id] for machine_id in scenario["failed_ids"]],
            )

    def test_four_machines_produce_four_single_scenarios(self):
        self.assertEqual(len(make_engine().single_failure_scenarios()), 4)

    def test_operational_count(self):
        for scenario in make_engine().single_failure_scenarios():
            self.assertEqual(scenario["operational_count"], 3)

    def test_unprotected_failure_stops_sequential_line(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["assembly"])
        self.assertEqual(scenario["scenario_throughput"], 0)


class TestPairFailure(unittest.TestCase):
    def test_all_expected_pairs_are_present(self):
        scenarios = make_engine().pair_failure_scenarios()
        actual = {frozenset(s["failed_ids"]) for s in scenarios}
        expected = {
            frozenset(pair)
            for pair in [
                ("cutting", "welding"),
                ("cutting", "assembly"),
                ("cutting", "inspection"),
                ("welding", "assembly"),
                ("welding", "inspection"),
                ("assembly", "inspection"),
            ]
        }
        self.assertEqual(actual, expected)

    def test_all_unprotected_pairs_stop_line(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["assembly", "inspection"])
        self.assertEqual(scenario["scenario_throughput"], 0)

    def test_each_pair_has_two_distinct_failed_machines(self):
        for scenario in make_engine().pair_failure_scenarios():
            self.assertEqual(scenario["failed_count"], 2)
            self.assertEqual(len(set(scenario["failed_ids"])), 2)

    def test_four_machines_produce_six_pairs(self):
        self.assertEqual(len(make_engine().pair_failure_scenarios()), 6)

    def test_operational_count(self):
        for scenario in make_engine().pair_failure_scenarios():
            self.assertEqual(scenario["operational_count"], 2)


class TestBackups(unittest.TestCase):
    def test_backup_cannot_exceed_other_station_bottleneck(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["cutting"])
        self.assertEqual(scenario["scenario_throughput"], 70)

    def test_disabled_backup_is_not_used(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["assembly"])
        self.assertEqual(scenario["scenario_throughput"], 0)
        self.assertEqual(scenario["backups_activated"], [])

    def test_enabled_backup_preserves_configured_capacity(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["welding"])
        self.assertEqual(scenario["scenario_throughput"], 60)
        self.assertEqual(len(scenario["backups_activated"]), 1)

    def test_keystone_four_station_backup_scenarios(self):
        engine = make_engine()

        cutting = engine._evaluate_scenario(["cutting"])
        welding = engine._evaluate_scenario(["welding"])

        self.assertEqual(cutting["scenario_throughput"], 70)
        self.assertEqual(cutting["units_lost_per_min"], 25)
        self.assertEqual(cutting["production_loss_pct"], 26.32)

        self.assertEqual(welding["scenario_throughput"], 60)
        self.assertEqual(welding["units_lost_per_min"], 35)
        self.assertEqual(welding["production_loss_pct"], 36.84)

    def test_no_backup_means_zero_throughput(self):
        machines = [
            {"id": "a", "name": "A", "capacity_per_min": 100},
            {"id": "b", "name": "B", "capacity_per_min": 90},
        ]
        engine = make_engine(machines)
        self.assertEqual(engine._evaluate_scenario(["a"])["scenario_throughput"], 0)

    def test_two_failures_with_one_unprotected_station_stop_line(self):
        engine = make_engine()
        scenario = engine._evaluate_scenario(["cutting", "assembly"])
        self.assertEqual(scenario["scenario_throughput"], 0)

    def test_zero_capacity_backup_does_not_activate(self):
        machines = [
            {
                "id": "a",
                "name": "A",
                "capacity_per_min": 100,
                "backup_capacity_per_min": 0,
                "backup_enabled": True,
            },
            {"id": "b", "name": "B", "capacity_per_min": 90},
        ]
        engine = make_engine(machines)
        scenario = engine._evaluate_scenario(["a"])
        self.assertEqual(scenario["scenario_throughput"], 0)
        self.assertFalse(scenario["has_backup_activated"])


class TestRanking(unittest.TestCase):
    def test_all_scenarios_are_sorted_by_loss(self):
        scenarios = make_engine().all_scenarios()
        losses = [s["production_loss_pct"] for s in scenarios]
        self.assertEqual(losses, sorted(losses, reverse=True))

    def test_critical_machine_matches_first_single_scenario(self):
        engine = make_engine()
        self.assertEqual(
            engine.most_critical_machine(),
            engine.single_failure_scenarios()[0],
        )

    def test_equal_losses_are_labelled_as_ties(self):
        machines = [
            {"id": "a", "name": "A", "capacity_per_min": 100},
            {"id": "b", "name": "B", "capacity_per_min": 100},
            {"id": "c", "name": "C", "capacity_per_min": 100},
        ]
        scenarios = make_engine(machines).single_failure_scenarios()
        self.assertTrue(all(s["is_tied"] for s in scenarios))
        self.assertEqual(len({s["rank"] for s in scenarios}), 1)

    def test_pair_scenarios_are_sorted_by_loss(self):
        scenarios = make_engine().pair_failure_scenarios()
        losses = [s["production_loss_pct"] for s in scenarios]
        self.assertEqual(losses, sorted(losses, reverse=True))

    def test_ranking_is_deterministic(self):
        engine = make_engine()
        self.assertEqual(engine.all_scenarios(), engine.all_scenarios())

    def test_single_scenarios_are_sorted_by_loss(self):
        scenarios = make_engine().single_failure_scenarios()
        losses = [s["production_loss_pct"] for s in scenarios]
        self.assertEqual(losses, sorted(losses, reverse=True))

    def test_total_scenario_count(self):
        self.assertEqual(len(make_engine().all_scenarios()), 10)

    def test_worst_pair_matches_first_pair_scenario(self):
        engine = make_engine()
        self.assertEqual(
            engine.most_damaging_pair(),
            engine.pair_failure_scenarios()[0],
        )


class TestEdgeCases(unittest.TestCase):
    def test_calls_are_repeatable(self):
        engine = make_engine()
        self.assertEqual(engine.full_report(), engine.full_report())

    def test_equal_capacities(self):
        machines = [
            {"id": "a", "name": "A", "capacity_per_min": 50},
            {"id": "b", "name": "B", "capacity_per_min": 50},
        ]
        engine = make_engine(machines)
        self.assertEqual(engine.baseline_throughput(), 50)

    def test_extra_dependency_fields_do_not_break_engine(self):
        machines = [
            {
                "id": "a",
                "name": "A",
                "capacity_per_min": 100,
                "dependencies": [],
            },
            {"id": "b", "name": "B", "capacity_per_min": 90},
        ]
        self.assertEqual(make_engine(machines).baseline_throughput(), 90)

    def test_float_capacity(self):
        machines = [
            {"id": "a", "name": "A", "capacity_per_min": 100.5},
            {"id": "b", "name": "B", "capacity_per_min": 90.5},
        ]
        self.assertEqual(make_engine(machines).baseline_throughput(), 90.5)

    def test_report_is_json_serialisable(self):
        import json
        json.dumps(make_engine().full_report())

    def test_single_machine_factory_has_no_pairs(self):
        machines = [{"id": "a", "name": "A", "capacity_per_min": 100}]
        engine = make_engine(machines)
        self.assertEqual(engine.pair_failure_scenarios(), [])
        self.assertIsNone(engine.most_damaging_pair())


class TestValidation(unittest.TestCase):
    def test_duplicate_failure_ids_are_rejected_or_deduplicated(self):
        engine = make_engine()
        with self.assertRaises(ValueError):
            engine._evaluate_scenario(["cutting", "cutting"])

    def test_duplicate_machine_config_ids_are_rejected(self):
        machines = [
            {"id": "a", "name": "A", "capacity_per_min": 100},
            {"id": "a", "name": "Duplicate A", "capacity_per_min": 90},
        ]
        with self.assertRaises(ValueError):
            make_engine(machines)

    def test_empty_machines_list_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([])

    def test_missing_capacity_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([{"id": "a", "name": "A"}])

    def test_missing_id_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([{"name": "A", "capacity_per_min": 100}])

    def test_missing_machines_key_raises_value_error(self):
        with self.assertRaises(ValueError):
            FailureEngine({})

    def test_missing_name_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([{"id": "a", "capacity_per_min": 100}])

    def test_negative_capacity_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([{"id": "a", "name": "A", "capacity_per_min": -1}])

    def test_non_finite_capacity_is_rejected(self):
        for value in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    make_engine([
                        {"id": "a", "name": "A", "capacity_per_min": value}
                    ])

    def test_unknown_failure_id_is_rejected(self):
        with self.assertRaises(ValueError):
            make_engine()._evaluate_scenario(["unknown"])

    def test_zero_capacity_raises_value_error(self):
        with self.assertRaises(ValueError):
            make_engine([{"id": "a", "name": "A", "capacity_per_min": 0}])


if __name__ == "__main__":
    unittest.main()
