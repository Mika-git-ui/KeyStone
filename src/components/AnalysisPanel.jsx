/**
 * AnalysisPanel — Stage 4A
 * Displays ranked failure scenarios returned by the Python backend,
 * showing backup activations, revised throughput, explicit tie markers,
 * and AI-assisted mitigation recommendations grounded in simulation verification.
 */

/* ─── small helpers ────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, color: '#405a5a', letterSpacing: 2,
      fontWeight: 700, padding: '10px 14px 6px',
    }}>
      {children}
    </div>
  );
}

function LossBar({ pct }) {
  const color = pct >= 100 ? '#ff3b3b' : pct >= 50 ? '#ff9900' : '#00e5ff';
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ height: 3, background: '#0d2222', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color,
          transition: 'width 0.4s ease',
          borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

function ScenarioBadge({ label, color }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
      color, background: `${color}15`,
      border: `1px solid ${color}33`,
      borderRadius: 3, padding: '1px 5px',
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function ScenarioRow({ scenario, displayRank }) {
  const loss = scenario.production_loss_pct;
  const lossColor = loss >= 100 ? '#ff3b3b' : loss >= 50 ? '#ff9900' : '#00e5ff';
  const isPair = scenario.failed_count > 1;
  const backups = scenario.backups_activated || [];
  const rankNumber = scenario.rank !== undefined ? scenario.rank : displayRank;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a1818 0%, #070f0f 100%)',
      border: `1px solid ${loss >= 100 ? '#3a100800' : '#0d2828'}`,
      borderLeft: `3px solid ${lossColor}`,
      borderRadius: 6,
      padding: '9px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {/* Row header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontSize: 9, color: '#2a4a4a', fontVariantNumeric: 'tabular-nums',
            flexShrink: 0, width: 20,
          }}>
            #{rankNumber}
          </span>

          <span style={{ fontSize: 11, color: '#a0c8c8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {scenario.failed_names.join(' + ')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {scenario.is_tied && <ScenarioBadge label="TIED" color="#ffaa00" />}
          {isPair && <ScenarioBadge label="PAIR" color="#8866ff" />}
          <span style={{
            fontSize: 13, fontWeight: 700, color: lossColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {loss}%
          </span>
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'flex', gap: 12, fontSize: 9, color: '#405a5a', marginLeft: 26 }}>
        <span>throughput: <b style={{ color: scenario.scenario_throughput > 0 ? '#00e5ff' : '#ff3b3b' }}>{scenario.scenario_throughput} u/min</b></span>
        <span>lost: <b style={{ color: lossColor }}>{scenario.units_lost_per_min} u/min</b></span>
      </div>

      {/* Backup notification if activated */}
      {backups.length > 0 && (
        <div style={{
          marginLeft: 26,
          marginTop: 2,
          fontSize: 8.5,
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>🛡 Backup active:</span>
          <span>
            {backups.map((b) => `${b.machine_name} (${b.backup_capacity_per_min} u/m)`).join(', ')}
          </span>
        </div>
      )}

      <div style={{ marginLeft: 26 }}>
        <LossBar pct={loss} />
      </div>
    </div>
  );
}

function KeyFinding({ label, scenario, color }) {
  if (!scenario) return null;
  const backups = scenario.backups_activated || [];

  return (
    <div style={{
      background: `${color}08`,
      border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6,
      padding: '8px 12px',
    }}>
      <div style={{ fontSize: 9, color: '#405a5a', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#c0d8d8', fontWeight: 600 }}>
        {scenario.failed_names.join(' + ')}
        {scenario.is_tied && (
          <span style={{ fontSize: 9, color: '#ffaa00', marginLeft: 6, fontWeight: 400 }}>
            (tied impact)
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2 }}>
        {scenario.production_loss_pct}% production loss · {scenario.units_lost_per_min} u/min lost
      </div>
      {backups.length > 0 && (
        <div style={{ fontSize: 8.5, color: '#38bdf8', marginTop: 3 }}>
          🛡 Backup engaged: {backups.map((b) => `${b.machine_name} @ ${b.backup_capacity_per_min} u/m`).join(', ')}
        </div>
      )}
    </div>
  );
}

/* ─── Mitigation Recommendations Block ──────────────────────────── */
function MitigationCard({ recommendation }) {
  const sim = recommendation.simulated_impact;
  const target = recommendation.target_scenario;
  const prevLoss = target?.production_loss_pct ?? 100;
  const newLoss = sim?.mitigated_loss_pct ?? 0;
  const recoveredPct = Math.max(0, Math.round(prevLoss - newLoss));

  return (
    <div style={{
      background: 'linear-gradient(135deg, #061824 0%, #030d14 100%)',
      border: '1px solid #0284c744',
      borderLeft: '3px solid #38bdf8',
      borderRadius: 6,
      padding: '9px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e0f2fe' }}>
          {recommendation.title}
        </span>
        <span style={{
          fontSize: 8,
          fontWeight: 700,
          color: '#38bdf8',
          background: '#0284c722',
          border: '1px solid #0284c744',
          borderRadius: 3,
          padding: '1px 5px',
        }}>
          {recommendation.priority}
        </span>
      </div>

      {/* Verified simulation impact row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#021827',
        border: '1px solid #0369a133',
        borderRadius: 4,
        padding: '4px 8px',
        fontSize: 9,
        color: '#7dd3fc',
      }}>
        <span>✓ SIMULATED IMPACT:</span>
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>
          {sim.mitigated_throughput} u/min throughput
        </span>
        <span style={{ color: '#4ade80', fontWeight: 600 }}>
          (+{recoveredPct}% capacity preserved)
        </span>
      </div>

      {/* AI / rule explanation */}
      <div style={{
        fontSize: 9.5,
        color: '#94a3b8',
        lineHeight: 1.4,
        marginTop: 2,
      }}>
        {recommendation.explanation}
      </div>

      {/* Provider attribution badge */}
      <div style={{
        fontSize: 8,
        color: '#475569',
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 2,
      }}>
        <span>Source: {recommendation.ai_provider}</span>
        <span>Verified via FailureEngine</span>
      </div>
    </div>
  );
}

/* ─── Loading state ─────────────────────────────────────────────── */
function LoadingPanel() {
  return (
    <div style={{ padding: '20px 14px', textAlign: 'center' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid #0d2828',
        borderTopColor: '#00e5ff',
        margin: '0 auto 12px',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 11, color: '#405a5a' }}>Evaluating failure scenarios & mitigations…</div>
      <div style={{ fontSize: 9, color: '#2a3a3a', marginTop: 4 }}>
        POST /api/analyze & /api/recommendations
      </div>
    </div>
  );
}

/* ─── Error state ───────────────────────────────────────────────── */
function ErrorPanel({ error, onClose }) {
  return (
    <div style={{ padding: '10px 12px 12px', margin: '0 10px' }}>
      <div style={{
        background: '#1a00001a',
        border: '1px solid #ff3b3b44',
        borderLeft: '3px solid #ff3b3b',
        borderRadius: 6,
        padding: '10px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: '#ff6060', fontWeight: 700 }}>⚠ ANALYSIS FAILED</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#405a5a', cursor: 'pointer', fontSize: 12 }}>✕</button>
        </div>
        <div style={{ fontSize: 10, color: '#c07070', lineHeight: 1.5, wordBreak: 'break-word' }}>
          {error}
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ───────────────────────────────────────────────── */
export default function AnalysisPanel({
  report,
  recommendations,
  loading,
  recLoading,
  error,
  onClose,
}) {
  if (loading) return <LoadingPanel />;
  if (error)   return <ErrorPanel error={error} onClose={onClose} />;
  if (!report) return null;

  const singles  = report.single_failure_scenarios  ?? [];
  const pairs    = report.pair_failure_scenarios    ?? [];
  const critical = report.most_critical_machine;
  const worstPair = report.most_damaging_pair;
  const recList  = recommendations?.recommendations ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px 6px',
        borderBottom: '1px solid #0d2828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 9, color: '#405a5a', letterSpacing: 1.5, fontWeight: 700 }}>
            FAILURE ANALYSIS & MITIGATION REPORT
          </div>
          <div style={{ fontSize: 8, color: '#2a3a3a', marginTop: 1 }}>
            Baseline: {report.baseline_throughput_per_min} u/min · {report.machine_count} stations
          </div>
        </div>
        <button
          onClick={onClose}
          title="Close report"
          style={{
            background: 'none', border: '1px solid #0d2828',
            borderRadius: 4, color: '#405a5a', cursor: 'pointer',
            fontSize: 10, padding: '2px 7px',
          }}
        >
          ✕ Close
        </button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: '#0d2828 transparent',
      }}>
        {/* Model note disclaimer */}
        <div style={{
          margin: '8px 12px',
          padding: '6px 10px',
          background: '#0d1a1a',
          border: '1px solid #0d2828',
          borderRadius: 4,
          fontSize: 8,
          color: '#2a4a4a',
          lineHeight: 1.4,
        }}>
          * {report.model_note}
        </div>

        {/* AI-Assisted Mitigation Recommendations Section */}
        <SectionLabel>
          AI-ASSISTED MITIGATION RECOMMENDATIONS ({recList.length})
        </SectionLabel>

        {recLoading ? (
          <div style={{ padding: '8px 14px', fontSize: 9.5, color: '#64748b' }}>
            ⏳ Computing verified mitigation options...
          </div>
        ) : recList.length > 0 ? (
          <div style={{ padding: '0 10px 6px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recList.map((rec) => (
              <MitigationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '4px 14px 8px', fontSize: 9, color: '#64748b' }}>
            No immediate mitigations required; current line configuration has full redundancy.
          </div>
        )}

        {/* Key findings */}
        <SectionLabel>KEY FINDINGS</SectionLabel>
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <KeyFinding label="MOST CRITICAL SINGLE FAILURE" scenario={critical} color="#ff3b3b" />
          <KeyFinding label="MOST DAMAGING PAIR" scenario={worstPair} color="#8866ff" />
        </div>

        {/* Single-failure scenarios */}
        <SectionLabel>SINGLE FAILURES ({singles.length})</SectionLabel>
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {singles.map((s, i) => (
            <ScenarioRow key={s.failed_ids.join('-')} scenario={s} displayRank={i + 1} />
          ))}
        </div>

        {/* Pair-failure scenarios */}
        <SectionLabel>PAIR FAILURES ({pairs.length})</SectionLabel>
        <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pairs.map((s, i) => (
            <ScenarioRow key={s.failed_ids.join('-')} scenario={s} displayRank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
