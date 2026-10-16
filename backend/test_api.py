"""
KEYSTONE — API Integration Tests (Stage 3B)
Uses FastAPI's built-in TestClient (via httpx).

Run (from project root):
    python -m pytest backend/test_api.py -v
    # or
    python backend/test_api.py

These tests do NOT start a live server — TestClient exercises the app
in-process, so uvicorn does not need to be running.

Existing engine tests (test_failure_engine.py) are unaffected.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(__file__))

try:
    from fastapi.testclient import TestClient
    from main import app
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

VALID_PAYLOAD = {
    "machines": [
        {"id": "cutting",    "name": "Cutting Station",    "capacity_per_min": 120},
        {"id": "welding",    "name": "Welding Station",    "capacity_per_min": 95},
        {"id": "assembly",   "name": "Assembly Station",   "capacity_per_min": 110},
        {"id": "inspection", "name": "Inspection Station", "capacity_per_min": 130},
    ]
}


def get_client():
    return TestClient(app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestHealth(unittest.TestCase):

    def test_health_returns_200(self):
        r = get_client().get("/health")
        self.assertEqual(r.status_code, 200)

    def test_health_contains_status_ok(self):
        r = get_client().get("/health")
        self.assertEqual(r.json()["status"], "ok")

    def test_health_contains_stage(self):
        r = get_client().get("/health")
        self.assertIn("stage", r.json())

    def test_health_contains_note(self):
        r = get_client().get("/health")
        self.assertIn("note", r.json())


@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestAnalyzeSuccess(unittest.TestCase):

    def setUp(self):
        self.client = get_client()
        self.r = self.client.post("/api/analyze", json=VALID_PAYLOAD)

    def test_returns_200(self):
        self.assertEqual(self.r.status_code, 200)

    def test_response_is_json(self):
        data = self.r.json()
        self.assertIsInstance(data, dict)

    def test_baseline_throughput_present(self):
        data = self.r.json()
        self.assertIn("baseline_throughput_per_min", data)

    def test_baseline_throughput_value(self):
        """Welding (95) is slowest → baseline = 95."""
        data = self.r.json()
        self.assertEqual(data["baseline_throughput_per_min"], 95)

    def test_single_failure_scenarios_present(self):
        data = self.r.json()
        self.assertIn("single_failure_scenarios", data)

    def test_single_failure_scenarios_count(self):
        data = self.r.json()
        self.assertEqual(len(data["single_failure_scenarios"]), 4)

    def test_pair_failure_scenarios_count(self):
        data = self.r.json()
        self.assertEqual(len(data["pair_failure_scenarios"]), 6)

    def test_most_critical_machine_present(self):
        data = self.r.json()
        self.assertIn("most_critical_machine", data)

    def test_most_damaging_pair_present(self):
        data = self.r.json()
        self.assertIn("most_damaging_pair", data)

    def test_model_note_present(self):
        data = self.r.json()
        self.assertIn("model_note", data)
        self.assertIn("ESTIMATE", data["model_note"])

    def test_scenarios_have_required_fields(self):
        data = self.r.json()
        required = {
            "failed_ids", "failed_names", "failed_count",
            "baseline_per_min", "scenario_throughput",
            "units_lost_per_min", "production_loss_pct",
        }
        for scenario in data["single_failure_scenarios"]:
            for field in required:
                self.assertIn(field, scenario, msg=f"Missing field '{field}'")

    def test_scenarios_ranked_descending_by_loss(self):
        data = self.r.json()
        losses = [s["production_loss_pct"] for s in data["single_failure_scenarios"]]
        self.assertEqual(losses, sorted(losses, reverse=True))

    def test_failed_names_in_scenarios(self):
        """Every scenario must include the human-readable failed machine names."""
        data = self.r.json()
        for s in data["single_failure_scenarios"]:
            self.assertIsInstance(s["failed_names"], list)
            self.assertEqual(len(s["failed_names"]), 1)

    def test_machine_count(self):
        data = self.r.json()
        self.assertEqual(data["machine_count"], 4)


@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestAnalyzeValidation(unittest.TestCase):

    def setUp(self):
        self.client = get_client()

    def _post(self, payload):
        return self.client.post("/api/analyze", json=payload)

    def test_empty_machines_list_returns_422(self):
        r = self._post({"machines": []})
        self.assertEqual(r.status_code, 422)

    def test_missing_machines_key_returns_422(self):
        r = self._post({})
        self.assertEqual(r.status_code, 422)

    def test_zero_capacity_returns_422(self):
        r = self._post({
            "machines": [{"id": "x", "name": "X", "capacity_per_min": 0}]
        })
        self.assertEqual(r.status_code, 422)

    def test_negative_capacity_returns_422(self):
        r = self._post({
            "machines": [{"id": "x", "name": "X", "capacity_per_min": -5}]
        })
        self.assertEqual(r.status_code, 422)

    def test_missing_id_returns_422(self):
        r = self._post({
            "machines": [{"name": "X", "capacity_per_min": 100}]
        })
        self.assertEqual(r.status_code, 422)

    def test_missing_name_returns_422(self):
        r = self._post({
            "machines": [{"id": "x", "capacity_per_min": 100}]
        })
        self.assertEqual(r.status_code, 422)

    def test_duplicate_ids_returns_422(self):
        r = self._post({
            "machines": [
                {"id": "dup", "name": "A", "capacity_per_min": 100},
                {"id": "dup", "name": "B", "capacity_per_min": 80},
            ]
        })
        self.assertEqual(r.status_code, 422)

    def test_id_with_space_returns_422(self):
        r = self._post({
            "machines": [{"id": "bad id", "name": "X", "capacity_per_min": 100}]
        })
        self.assertEqual(r.status_code, 422)

    def test_optional_dependencies_accepted(self):
        """dependencies field is optional and should not cause errors."""
        r = self._post({
            "machines": [
                {"id": "a", "name": "A", "capacity_per_min": 100, "dependencies": []},
                {"id": "b", "name": "B", "capacity_per_min": 80,  "dependencies": ["a"]},
            ]
        })
        self.assertEqual(r.status_code, 200)

    def test_single_machine_accepted(self):
        r = self._post({
            "machines": [{"id": "solo", "name": "Solo", "capacity_per_min": 50}]
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data["baseline_throughput_per_min"], 50)


@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestCORS(unittest.TestCase):

    def test_cors_preflight_from_vite_5174(self):
        """OPTIONS preflight from Vite dev origin must succeed."""
        r = get_client().options(
            "/api/analyze",
            headers={
                "Origin": "http://localhost:5174",
                "Access-Control-Request-Method": "POST",
            },
        )
        # FastAPI CORS middleware returns 200 for preflight
        self.assertIn(r.status_code, [200, 204])

    def test_cors_header_in_post_response(self):
        r = get_client().post(
            "/api/analyze",
            json=VALID_PAYLOAD,
            headers={"Origin": "http://localhost:5174"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn("access-control-allow-origin", r.headers)


@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestBackupAPI(unittest.TestCase):

    def setUp(self):
        self.client = get_client()

    def test_analyze_with_backups_enabled(self):
        payload = {
            "machines": [
                {"id": "m1", "name": "M1", "capacity_per_min": 100, "backup_capacity_per_min": 60, "backup_enabled": True},
                {"id": "m2", "name": "M2", "capacity_per_min": 90, "backup_capacity_per_min": 0, "backup_enabled": False},
            ]
        }
        r = self.client.post("/api/analyze", json=payload)
        self.assertEqual(r.status_code, 200)
        data = r.json()

        # Baseline = min(100, 90) = 90
        self.assertEqual(data["baseline_throughput_per_min"], 90)

        # Single failure for m1: backup engaged at 60 u/min; line throughput = min(60, 90) = 60
        s_m1 = next(s for s in data["single_failure_scenarios"] if s["failed_ids"] == ["m1"])
        self.assertEqual(s_m1["scenario_throughput"], 60)
        self.assertEqual(s_m1["units_lost_per_min"], 30)
        self.assertAlmostEqual(s_m1["production_loss_pct"], 33.33, places=2)
        self.assertEqual(len(s_m1["backups_activated"]), 1)
        self.assertEqual(s_m1["backups_activated"][0]["machine_id"], "m1")

        # Single failure for m2: no backup -> 0 throughput (100% loss)
        s_m2 = next(s for s in data["single_failure_scenarios"] if s["failed_ids"] == ["m2"])
        self.assertEqual(s_m2["scenario_throughput"], 0)
        self.assertEqual(s_m2["production_loss_pct"], 100.0)

        # In response, m2 is ranked before m1
        self.assertEqual(data["single_failure_scenarios"][0]["failed_ids"], ["m2"])
        self.assertEqual(data["single_failure_scenarios"][1]["failed_ids"], ["m1"])

    def test_negative_backup_capacity_rejected(self):
        payload = {
            "machines": [
                {"id": "m1", "name": "M1", "capacity_per_min": 100, "backup_capacity_per_min": -10, "backup_enabled": True},
            ]
        }
        r = self.client.post("/api/analyze", json=payload)
        self.assertEqual(r.status_code, 422)


@unittest.skipUnless(HAS_FASTAPI, "fastapi/httpx not installed — skipping API tests")
class TestRecommendationsAPI(unittest.TestCase):

    def setUp(self):
        self.client = get_client()

    def test_recommendations_endpoint_returns_mitigations(self):
        payload = {
            "machines": [
                {"id": "cutting", "name": "Cutting", "capacity_per_min": 120, "backup_capacity_per_min": 70, "backup_enabled": False},
                {"id": "welding", "name": "Welding", "capacity_per_min": 95, "backup_capacity_per_min": 60, "backup_enabled": True},
            ]
        }
        r = self.client.post("/api/recommendations", json=payload)
        self.assertEqual(r.status_code, 200)
        data = r.json()

        self.assertIn("recommendations", data)
        self.assertTrue(len(data["recommendations"]) > 0)
        self.assertIn("advisor_provider", data)
        self.assertIn("disclaimer", data)

        rec = data["recommendations"][0]
        self.assertIn("action_type", rec)
        self.assertIn("explanation", rec)
        self.assertIn("simulated_impact", rec)

    def test_recommendations_endpoint_validation_error(self):
        r = self.client.post("/api/recommendations", json={"machines": []})
        self.assertEqual(r.status_code, 422)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if not HAS_FASTAPI:
        print("WARNING: fastapi/httpx not installed. Install requirements.txt first.")
        print("  pip install -r backend/requirements.txt")
        sys.exit(1)
    unittest.main(verbosity=2)


