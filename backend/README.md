# KEYSTONE Backend — Stage 4A: AI-Assisted Mitigation Recommendation Layer

> **Disclaimer:** All results produced by this engine are **estimates** based
> on a simplified sequential-line bottleneck model. They are not industrially validated
> and should not be used for safety-critical decisions. Backups do not always
> preserve full production; their capacity may be lower than the primary machine.
> Recommendations strictly separate verified simulation results from explanation narratives.

---

## What this is

`KEYSTONE` provides a deterministic production-line failure search engine paired with an AI-assisted mitigation recommendation layer:

1. **Failure Scenario Search Engine** (`failure_engine.py`):
   - Accepts factory configurations (primary and backup capacities).
   - Generates all single-machine and pairwise failure combinations.
   - Evaluates deterministic line throughput and flags tied scenarios.
2. **Mitigation Recommendation Layer** (`mitigation_engine.py`):
   - Ingests ranked failure scenarios.
   - Synthesizes engineering mitigations (e.g., enabling standby backups, upgrading backup capacity to line rate, or provisioning redundancy).
   - **Verifies exact throughput impacts** by running what-if simulations through `FailureEngine`. Numerical gains are never fabricated.
   - Employs a provider-independent advisor protocol with a **transparent deterministic fallback** when no LLM API key (`KEYSTONE_LLM_API_KEY` or `OPENAI_API_KEY`) is configured.
3. **FastAPI Endpoints** (`main.py`):
   - `GET /health`: Health and stage metadata.
   - `POST /api/analyze`: Scenario evaluation and baseline metrics.
   - `POST /api/recommendations`: Prioritized, simulation-grounded mitigations.

---

## Files

| File | Purpose |
|---|---|
| `failure_engine.py` | Core deterministic engine supporting backup capacities |
| `mitigation_engine.py` | Recommendation synthesis, what-if verification, and advisor fallback layer |
| `main.py` | FastAPI application exposing `/health`, `/api/analyze`, and `/api/recommendations` |
| `test_failure_engine.py` | Unit tests for baseline, single/pair failures, backup modeling, and ties |
| `test_mitigation_engine.py` | Unit tests for mitigation calculations, credentials handling, and fallback behavior |
| `test_api.py` | Integration tests for all endpoints via FastAPI `TestClient` |
| `requirements.txt` | Dependencies (`fastapi`, `uvicorn`) |
| `README.md` | This file |

---

## How to run the backend and tests

### Running the Tests

From the **project root** (`keystone/`):

```bash
# Run all unit and API tests
python -m unittest backend.test_failure_engine backend.test_api backend.test_mitigation_engine
```

Expected result: **88 tests pass**, 0 failures.

### Running the FastAPI Server

```bash
uvicorn backend.main:app --reload --port 8000
```

Verify in your browser or curl:
- Health check: `http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

### Configuring an LLM Provider (Optional)

If you wish to attach an external LLM for explanation synthesis, set:
```bash
$env:KEYSTONE_LLM_API_KEY = "your-api-key"
```
If this key is omitted or left empty, the engine automatically and transparently operates using `deterministic_rule_engine`, clearly attributing the output.

---

## Running the React Frontend

In a separate terminal from `keystone/`:

```bash
npm run dev
```

Open `http://localhost:5174` (or the port indicated by Vite).

---

## Simulation model — assumptions and limitations

### What the model does

| Rule | Detail |
|---|---|
| **Sequential dependency** | Every station must maintain positive effective capacity for the line to produce output |
| **Primary capacity** | `capacity_per_min` of the station |
| **Backup capacity** | `backup_capacity_per_min` engaged only when `backup_enabled == true` |
| **Mitigation verification** | Proposed interventions are re-simulated using `FailureEngine._simulate_what_if()` |
| **Explanation separation** | Exact recovered throughput is tagged as verified simulation data; narratives indicate provider source |
| **Ranking & Ties** | Highest loss first; tied scenarios are explicitly flagged `is_tied: true` |

### Known limitations

- **Simplified sequential model.** Dynamic buffers and bypass topologies are not modeled.
- **No failure probabilities.** All scenarios are evaluated as equal possibilities.
- **Single & pair failures only.** Triple+ simultaneous failures are not enumerated.
- **Instantaneous steady-state.** Transient ramp-up delays are not simulated.
