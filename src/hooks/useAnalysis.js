/**
 * useAnalysis — custom hook that POSTs the current machine config
 * to POST /api/analyze and POST /api/recommendations.
 *
 * The backend (Python/FastAPI + FailureEngine + MitigationEngine) performs ALL analysis.
 */

import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export function useAnalysis() {
  const [report, setReport]                   = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [recLoading, setRecLoading]           = useState(false);
  const [error, setError]                     = useState(null);

  const analyze = useCallback(async (machines, backupStates = {}) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setRecommendations(null);

    const payload = {
      machines: machines.map((m) => ({
        id:                      m.id,
        name:                    m.name,
        capacity_per_min:        m.capacityPerMin,
        backup_capacity_per_min: m.backupCapacityPerMin || 0,
        backup_enabled:          backupStates[m.id] !== undefined
                                   ? backupStates[m.id]
                                   : !!m.defaultBackupEnabled,
      })),
    };

    try {
      // 1. Fetch analysis report
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          detail = body?.detail ?? detail;
          if (Array.isArray(detail)) {
            detail = detail.map((e) => e.msg ?? JSON.stringify(e)).join('; ');
          }
        } catch (_) { /* keep status */ }
        throw new Error(detail);
      }

      const data = await res.json();
      setReport(data);

      // 2. Fetch mitigation recommendations in parallel/cascade
      setRecLoading(true);
      try {
        const recRes = await fetch(`${API_BASE}/api/recommendations`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommendations(recData);
        }
      } catch (recErr) {
        console.warn('Could not load mitigation recommendations:', recErr);
      } finally {
        setRecLoading(false);
      }

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError(
          `Cannot reach the analysis server at ${API_BASE}. ` +
          'Make sure the backend is running: ' +
          'uvicorn backend.main:app --reload --port 8000'
        );
      } else {
        setError(err.message ?? 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setReport(null);
    setRecommendations(null);
    setError(null);
  }, []);

  return { report, recommendations, loading, recLoading, error, analyze, clear };
}
