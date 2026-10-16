export default function TopBar({
  sim,
  onResetSimulation,
  onOpenAnalysis,
  isAnalyzing,
  onResetCamera,
  onSetIsoView,
  onSetTopView,
  onReturnToPlanner,
  planContext,
  user,
}) {
  let simStatusClass = 'healthy';
  let simStatusText = 'SYSTEM NOMINAL';

  if (sim.lineDown) {
    simStatusClass = 'fault';
    simStatusText = `LINE HALTED (${sim.failedCount} FAILED)`;
  } else if (sim.hasFailures) {
    simStatusClass = 'backup-active';
    simStatusText = `DEGRADED — BACKUP ENGAGED (${sim.currentThroughput} u/min)`;
  }

  return (
    <header className="wb-topbar">
      <div className="wb-brand-cluster">
        {onReturnToPlanner && (
          <button
            className="wb-btn"
            style={{
              borderColor: 'var(--accent-orange)',
              color: 'var(--accent-orange)',
              fontWeight: 600,
              marginRight: 6,
            }}
            onClick={onReturnToPlanner}
            title="Return to conversational factory planner"
          >
            ← Chat Planner
          </button>
        )}
        <div className="wb-logo-mark">K</div>
        <div className="wb-app-title">KEYSTONE</div>
        <div className="wb-workspace-tag">INDUSTRIAL SIMULATION WORKBENCH</div>
        {user?.name && (
          <div
            className="wb-chip"
            style={{
              background: 'rgba(52, 152, 219, 0.1)',
              color: 'var(--status-backup)',
              border: '1px solid var(--status-backup-border)',
              fontSize: 9.5,
              marginLeft: 6,
            }}
            title={`Active Demo Workspace: ${user.name}`}
          >
            <span style={{ fontSize: 7 }}>●</span>
            DEMO: {user.name.toUpperCase()}
          </div>
        )}
        {planContext?.productType && (
          <div
            className="wb-chip"
            style={{
              background: 'rgba(230, 126, 34, 0.1)',
              color: 'var(--accent-orange)',
              border: '1px solid var(--accent-orange-dim)',
              fontSize: 9.5,
              marginLeft: 8,
            }}
            title={`Active Plan: ${planContext.productType} (${planContext.targetVolume || ''})`}
          >
            <span style={{ fontSize: 7 }}>●</span>
            PLAN: {planContext.productType.toUpperCase()}
          </div>
        )}
      </div>

      <div className="wb-topbar-controls">
        {/* Dynamic Simulation State */}
        <div className={`wb-chip ${simStatusClass}`}>
          <span style={{ fontSize: 7 }}>●</span>
          {simStatusText}
        </div>

        {/* Viewport Camera Presets */}
        <div style={{ display: 'flex', gap: 3, borderLeft: '1px solid var(--border-default)', paddingLeft: 8 }}>
          <button className="wb-btn" onClick={onResetCamera} title="Reset viewport orbit camera">
            Cam Reset
          </button>
          <button className="wb-btn" onClick={onSetIsoView} title="Isometric perspective view">
            Isometric
          </button>
          <button className="wb-btn" onClick={onSetTopView} title="Top-down orthographic plan view">
            Plan (Top)
          </button>
        </div>

        {/* Global Operational Controls */}
        <div style={{ display: 'flex', gap: 6, borderLeft: '1px solid var(--border-default)', paddingLeft: 8 }}>
          {sim.hasFailures && (
            <button
              className="wb-btn"
              onClick={onResetSimulation}
              title="Restore all simulated stations to operational state"
            >
              Reset Failures
            </button>
          )}

          <button
            className="wb-btn primary"
            onClick={onOpenAnalysis}
            disabled={isAnalyzing}
            title="Launch failure scenario matrix and AI mitigation advisor"
          >
            {isAnalyzing ? 'Evaluating…' : 'Analyze Failures'}
          </button>
        </div>
      </div>
    </header>
  );
}
