import { useState } from 'react';

export default function AnalysisModal({
  report,
  recommendations,
  loading,
  recLoading,
  error,
  onClose,
  onApplyMitigation,
}) {
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'recommendations'

  if (loading) {
    return (
      <div className="wb-modal-backdrop">
        <div className="wb-modal-window" style={{ height: 260, width: 440, justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            width: 32,
            height: 32,
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--accent-orange)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 14,
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
            EVALUATING SYSTEM PERMUTATIONS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Executing FailureEngine & MitigationEngine via FastAPI…
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wb-modal-backdrop">
        <div className="wb-modal-window" style={{ height: 240, width: 480 }}>
          <div className="wb-modal-header">
            <span style={{ color: 'var(--status-alert)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ⚠ SIMULATION ENGINE ERROR
            </span>
            <button className="wb-btn" onClick={onClose}>Close</button>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: 'var(--status-alert)', fontSize: 11 }}>{error}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>
              Ensure the backend is running at http://localhost:8000 via:
              <br />
              <code>uvicorn backend.main:app --reload --port 8000</code>
            </div>
            <button className="wb-btn" style={{ alignSelf: 'flex-start', marginTop: 'auto' }} onClick={onClose}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const singles = report.single_failure_scenarios || [];
  const pairs = report.pair_failure_scenarios || [];
  const critical = report.most_critical_machine;
  const worstPair = report.most_damaging_pair;
  const recList = recommendations?.recommendations || [];

  return (
    <div className="wb-modal-backdrop" onClick={onClose}>
      <div className="wb-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Window Titlebar */}
        <div className="wb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
              FAILURE ANALYSIS & MITIGATION WORKBENCH
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Baseline: {report.baseline_throughput_per_min} u/min · {report.machine_count} Stations
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', background: 'var(--bg-deep)', borderRadius: 3, padding: 2 }}>
              <button
                className={`wb-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
                style={{ height: 20, fontSize: 9.5, border: 'none' }}
                onClick={() => setActiveTab('scenarios')}
              >
                Ranked Scenarios ({singles.length + pairs.length})
              </button>
              <button
                className={`wb-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                style={{ height: 20, fontSize: 9.5, border: 'none' }}
                onClick={() => setActiveTab('recommendations')}
              >
                Mitigations ({recList.length})
              </button>
            </div>
            <button className="wb-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="wb-modal-body">
          {/* Engineering Disclaimer Notice */}
          <div style={{
            padding: '6px 10px',
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-default)',
            borderRadius: 3,
            fontSize: 9,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            * ESTIMATE NOTICE: {report.model_note}
          </div>

          {activeTab === 'scenarios' ? (
            <>
              {/* Executive Impact Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {critical && (
                  <div className="wb-section">
                    <div className="wb-section-title">
                      <span>Worst Single Point of Failure</span>
                      <span style={{ color: 'var(--status-alert)' }}>CRITICAL</span>
                    </div>
                    <div className="wb-section-body">
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {critical.failed_names.join(', ')}
                        {critical.is_tied && <span className="wb-badge-tied">TIED IMPACT</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--status-alert)', marginTop: 2 }}>
                        {critical.production_loss_pct}% Production Loss · {critical.units_lost_per_min} u/min lost
                      </div>
                    </div>
                  </div>
                )}

                {worstPair && (
                  <div className="wb-section">
                    <div className="wb-section-title">
                      <span>Most Disruptive Pair Outage</span>
                      <span style={{ color: 'var(--accent-orange)' }}>PAIR COUPLING</span>
                    </div>
                    <div className="wb-section-body">
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {worstPair.failed_names.join(' + ')}
                        {worstPair.is_tied && <span className="wb-badge-tied">TIED IMPACT</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent-orange)', marginTop: 2 }}>
                        {worstPair.production_loss_pct}% Production Loss · {worstPair.units_lost_per_min} u/min lost
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Permutations Matrix Table */}
              <div className="wb-section">
                <div className="wb-section-title">
                  <span>Single Failure Permutations ({singles.length})</span>
                  <span>SORTED BY ESTIMATED LOSS</span>
                </div>
                <table className="wb-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Rank</th>
                      <th>Failed Component(s)</th>
                      <th>Mitigating Standby</th>
                      <th>Throughput</th>
                      <th>Units Lost</th>
                      <th style={{ textAlign: 'right' }}>Loss %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singles.map((s, idx) => {
                      const hasBackup = s.backups_activated && s.backups_activated.length > 0;
                      return (
                        <tr key={`single-${idx}`} className={s.production_loss_pct >= 100 ? 'critical' : ''}>
                          <td>#{s.rank || (idx + 1)}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {s.failed_names.join(', ')}
                            {s.is_tied && <span className="wb-badge-tied">TIED</span>}
                          </td>
                          <td>
                            {hasBackup ? (
                              <span style={{ color: 'var(--status-backup)' }}>
                                🛡 {s.backups_activated.map(b => b.machine_name).join(', ')} ({s.backups_activated[0].backup_capacity_per_min} u/m)
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-disabled)' }}>None</span>
                            )}
                          </td>
                          <td style={{ color: s.scenario_throughput > 0 ? 'var(--status-backup)' : 'var(--status-alert)', fontWeight: 700 }}>
                            {s.scenario_throughput} u/min
                          </td>
                          <td>{s.units_lost_per_min} u/min</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: s.production_loss_pct >= 100 ? 'var(--status-alert)' : 'var(--accent-orange)' }}>
                            {s.production_loss_pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pairwise Combinations Table */}
              <div className="wb-section">
                <div className="wb-section-title">
                  <span>Pairwise Combination Permutations ({pairs.length})</span>
                  <span>C(4, 2)</span>
                </div>
                <table className="wb-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Rank</th>
                      <th>Failed Pair</th>
                      <th>Throughput</th>
                      <th>Units Lost</th>
                      <th style={{ textAlign: 'right' }}>Loss %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairs.map((s, idx) => (
                      <tr key={`pair-${idx}`}>
                        <td>#{s.rank || (idx + 1)}</td>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {s.failed_names.join(' + ')}
                          {s.is_tied && <span className="wb-badge-tied">TIED</span>}
                        </td>
                        <td style={{ color: s.scenario_throughput > 0 ? 'var(--status-backup)' : 'var(--status-alert)', fontWeight: 700 }}>
                          {s.scenario_throughput} u/min
                        </td>
                        <td>{s.units_lost_per_min} u/min</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--status-alert)' }}>
                          {s.production_loss_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* Recommendations Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Provider Layer: {recommendations?.advisor_provider || 'deterministic_rule_engine'} · Verified by FailureEngine
              </div>

              {recLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Calculating verified mitigation paths…
                </div>
              ) : recList.length > 0 ? (
                recList.map((rec) => {
                  const simImpact = rec.simulated_impact;
                  const target = rec.target_scenario;
                  const prevLoss = target?.production_loss_pct ?? 100;
                  const newLoss = simImpact?.mitigated_loss_pct ?? 0;
                  const recoveredPct = Math.max(0, Math.round(prevLoss - newLoss));

                  return (
                    <div key={rec.id} className="wb-section">
                      <div className="wb-section-title">
                        <span style={{ color: 'var(--text-primary)', fontSize: 10.5 }}>{rec.title}</span>
                        <span style={{
                          color: rec.priority === 'HIGH' ? 'var(--status-alert)' : 'var(--accent-orange)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 8.5,
                        }}>
                          {rec.priority} PRIORITY
                        </span>
                      </div>
                      <div className="wb-section-body">
                        {/* Simulation Verification Banner */}
                        <div style={{
                          padding: '6px 8px',
                          background: 'var(--status-backup-subtle)',
                          border: '1px solid var(--status-backup-border)',
                          borderRadius: 3,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}>
                          <span style={{ color: 'var(--status-backup)', fontWeight: 700 }}>
                            ✓ VERIFIED SIMULATION IMPACT:
                          </span>
                          <span style={{ color: '#fff', fontWeight: 600 }}>
                            {simImpact.mitigated_throughput} u/min throughput
                          </span>
                          <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>
                            (+{recoveredPct}% capacity preserved during outage)
                          </span>
                        </div>

                        {/* Explanation Narrative */}
                        <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>
                          {rec.explanation}
                        </div>

                        {/* Interactive Apply Button if applicable */}
                        {rec.action_type === 'ENABLE_BACKUP' && onApplyMitigation && (
                          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              className="wb-btn primary"
                              onClick={() => onApplyMitigation(rec.station_id)}
                            >
                              ⚡ Apply: Enable Standby on {rec.station_name}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  All high-severity vulnerabilities are currently mitigated by active standby units.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
