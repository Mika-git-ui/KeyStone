"""
KEYSTONE — Mitigation Engine Unit Tests
Stage 4A: Recommendation logic, capacity calculations, missing credentials, fallback behavior.
"""

import os
import unittest
from mitigation_engine import (
    MitigationEngine,
    RuleBasedAdvisor,
    ExternalLLMAdvisor,
    get_advisor,
)


class TestMitigationEngine(unittest.TestCase):

    def setUp(self):
        self.config = {
            "machines": [
                {"id": "cutting", "name": "Cutting Station", "capacity_per_min": 120, "backup_capacity_per_min": 70, "backup_enabled": False},
                {"id": "welding", "name": "Welding Station", "capacity_per_min": 95, "backup_capacity_per_min": 60, "backup_enabled": True},
                {"id": "assembly", "name": "Assembly Station", "capacity_per_min": 110, "backup_capacity_per_min": 0, "backup_enabled": False},
                {"id": "inspection", "name": "Inspection Station", "capacity_per_min": 130, "backup_capacity_per_min": 80, "backup_enabled": False},
            ]
        }

    def test_generate_recommendations_structure(self):
        engine = MitigationEngine(self.config)
        result = engine.generate_mitigations()

        self.assertIn("factory_baseline_throughput", result)
        self.assertEqual(result["factory_baseline_throughput"], 95)
        self.assertIn("recommendations", result)
        self.assertTrue(len(result["recommendations"]) > 0)
        self.assertIn("advisor_provider", result)
        self.assertIn("disclaimer", result)

    def test_recommendation_contents_and_simulation_verification(self):
        engine = MitigationEngine(self.config)
        result = engine.generate_mitigations()
        recs = result["recommendations"]

        for rec in recs:
            self.assertIn("action_type", rec)
            self.assertIn("station_id", rec)
            self.assertIn("simulated_impact", rec)
            self.assertIn("explanation", rec)
            self.assertTrue(rec.get("is_simulated_verified"))

            sim_impact = rec["simulated_impact"]
            self.assertIn("mitigated_throughput", sim_impact)
            self.assertIn("mitigated_loss_pct", sim_impact)
            self.assertLessEqual(
                sim_impact["mitigated_loss_pct"],
                rec["target_scenario"]["production_loss_pct"]
            )

    def test_enabling_existing_backup_recommendation(self):
        """Cutting has backup_capacity 70 but backup_enabled=False -> should recommend ENABLE_BACKUP."""
        engine = MitigationEngine(self.config)
        result = engine.generate_mitigations()
        cutting_rec = next((r for r in result["recommendations"] if r["station_id"] == "cutting"), None)

        self.assertIsNotNone(cutting_rec)
        self.assertEqual(cutting_rec["action_type"], "ENABLE_BACKUP")
        # When cutting enabled, throughput during cutting failure is min(70, 95) = 70
        self.assertEqual(cutting_rec["simulated_impact"]["mitigated_throughput"], 70)
        # Loss decreases from 100% to (95-70)/95 ~ 26.32%
        self.assertAlmostEqual(cutting_rec["simulated_impact"]["mitigated_loss_pct"], 26.32, places=1)

    def test_upgrade_backup_capacity_recommendation(self):
        """Welding has backup enabled at 60 u/min, but baseline is 95 -> should recommend upgrade to 95."""
        engine = MitigationEngine(self.config)
        result = engine.generate_mitigations()
        welding_rec = next((r for r in result["recommendations"] if r["station_id"] == "welding"), None)

        self.assertIsNotNone(welding_rec)
        self.assertEqual(welding_rec["action_type"], "UPGRADE_BACKUP_CAPACITY")
        self.assertEqual(welding_rec["parameters"]["target_backup_capacity"], 95)
        # Mitigated throughput reaches baseline 95 u/min (0% loss)
        self.assertEqual(welding_rec["simulated_impact"]["mitigated_throughput"], 95)
        self.assertEqual(welding_rec["simulated_impact"]["mitigated_loss_pct"], 0.0)

    def test_provision_backup_for_station_without_backup(self):
        """Assembly has 0 backup capacity -> should recommend PROVISION_BACKUP_UNIT."""
        engine = MitigationEngine(self.config)
        result = engine.generate_mitigations()
        assembly_rec = next((r for r in result["recommendations"] if r["station_id"] == "assembly"), None)

        self.assertIsNotNone(assembly_rec)
        self.assertEqual(assembly_rec["action_type"], "PROVISION_BACKUP_UNIT")
        self.assertGreater(assembly_rec["parameters"]["proposed_backup_capacity"], 0)

    def test_missing_credentials_fallback(self):
        """When KEYSTONE_LLM_API_KEY is not set, get_advisor defaults to RuleBasedAdvisor."""
        old_key = os.environ.get("KEYSTONE_LLM_API_KEY")
        old_openai = os.environ.get("OPENAI_API_KEY")
        try:
            os.environ.pop("KEYSTONE_LLM_API_KEY", None)
            os.environ.pop("OPENAI_API_KEY", None)

            advisor = get_advisor()
            self.assertIsInstance(advisor, RuleBasedAdvisor)
            self.assertEqual(advisor.provider_name, "deterministic_rule_engine")
        finally:
            if old_key:
                os.environ["KEYSTONE_LLM_API_KEY"] = old_key
            if old_openai:
                os.environ["OPENAI_API_KEY"] = old_openai

    def test_external_llm_advisor_empty_key_graceful_fallback(self):
        """ExternalLLMAdvisor with dummy or empty key delegates to deterministic fallback."""
        advisor = ExternalLLMAdvisor(api_key="dummy")
        recs = advisor.generate_explanations(
            recommendations=[{
                "station_name": "Test Station",
                "action_type": "ENABLE_BACKUP",
                "simulated_impact": {"mitigated_loss_pct": 30.0, "mitigated_throughput": 70.0},
                "target_scenario": {"production_loss_pct": 100.0},
                "parameters": {},
            }],
            factory_context={"baseline_throughput": 100.0}
        )
        self.assertEqual(len(recs), 1)
        self.assertIn("explanation", recs[0])
        self.assertEqual(recs[0]["ai_provider"], "deterministic_rule_engine")


if __name__ == "__main__":
    unittest.main(verbosity=2)
