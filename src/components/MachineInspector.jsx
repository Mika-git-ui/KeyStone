export default function MachineInspector({
  station,
  stationStat,
  isFailed,
  isBackupEnabled,
  onToggleFailure,
  onToggleBackup,
  planCatalogueMachine,
}) {
  if (!station) {
    return (
      <aside className="wb-inspector">
        <div className="wb-panel-header">
          <span>Properties</span>
          <span>No Selection</span>
        </div>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Click a station in the 3D viewport or hierarchy outliner to inspect properties.
        </div>
      </aside>
    );
  }

  const isBackupActive = isFailed && isBackupEnabled && (station.backupCapacityPerMin || 0) > 0;
  const isBottleneck = stationStat?.isBottleneck;

  let currentOperationalRate = station.capacityPerMin;
  if (isFailed) {
    currentOperationalRate = isBackupActive ? station.backupCapacityPerMin : 0;
  }

  return (
    <aside className="wb-inspector">
      <div className="wb-panel-header">
        <span>Station Inspector</span>
        <span style={{ color: 'var(--accent-orange)' }}>{station.id.toUpperCase()}</span>
      </div>

      <div className="wb-inspector-content">
        {/* Identity & Status Card */}
        <div className="wb-section">
          <div className="wb-section-title">
            <span>Identification & State</span>
            {isBottleneck && (
              <span style={{ color: 'var(--status-warning)', fontSize: 8 }}>BOTTLENECK</span>
            )}
          </div>
          <div className="wb-section-body">
            <div className="wb-prop-row">
              <span className="wb-prop-key">Station Name:</span>
              <span className="wb-prop-val">{station.name}</span>
            </div>
            <div className="wb-prop-row">
              <span className="wb-prop-key">Description:</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{station.description}</span>
            </div>
            <div className="wb-prop-row">
              <span className="wb-prop-key">Health State:</span>
              <span style={{
                fontWeight: 700,
                color: isFailed
                  ? (isBackupActive ? 'var(--status-backup)' : 'var(--status-alert)')
                  : 'var(--status-healthy)',
              }}>
                {isFailed
                  ? (isBackupActive ? 'DEGRADED (STANDBY ACTIVE)' : 'CRITICAL FAILURE')
                  : 'OPERATIONAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Planning Specification (from Chat Planner) */}
        {planCatalogueMachine && (
          <div className="wb-section">
            <div className="wb-section-title">
              <span>Planned Equipment Specification</span>
              <span style={{ color: 'var(--accent-orange)' }}>CATALOGUE LINK</span>
            </div>
            <div className="wb-section-body">
              <div className="wb-prop-row">
                <span className="wb-prop-key">Planned Model:</span>
                <span className="wb-prop-val" style={{ fontWeight: 600 }}>{planCatalogueMachine.name}</span>
              </div>
              <div className="wb-prop-row">
                <span className="wb-prop-key">Indicative Cost:</span>
                <span style={{ color: 'var(--status-healthy)', fontFamily: 'var(--font-mono)' }}>
                  {planCatalogueMachine.priceInr} ({planCatalogueMachine.verificationLabel})
                </span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.35 }}>
                * Real-world rates depend on tooling cycle. Twin uses calibrated baseline model.
              </div>
            </div>
          </div>
        )}

        {/* Capacity & Production Dynamics */}
        <div className="wb-section">
          <div className="wb-section-title">
            <span>Throughput Parameters</span>
            <span>UNITS/MIN</span>
          </div>
          <div className="wb-section-body">
            <div className="wb-prop-row">
              <span className="wb-prop-key">Primary Rated Capacity:</span>
              <span className="wb-prop-val">{station.capacityPerMin} u/min</span>
            </div>
            <div className="wb-prop-row">
              <span className="wb-prop-key">Standby Unit Capacity:</span>
              <span className="wb-prop-val">{station.backupCapacityPerMin || 0} u/min</span>
            </div>
            <div className="wb-prop-row" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
              <span className="wb-prop-key">Current Station Output:</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                color: currentOperationalRate > 0 ? 'var(--text-primary)' : 'var(--status-alert)',
              }}>
                {currentOperationalRate} u/min
              </span>
            </div>
          </div>
        </div>

        {/* Standby & Redundancy Controls */}
        <div className="wb-section">
          <div className="wb-section-title">
            <span>Standby Redundancy Path</span>
            <span>FAILOVER</span>
          </div>
          <div className="wb-section-body">
            <div className="wb-prop-row">
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 11 }}>
                  Automatic Standby
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 9.5 }}>
                  Engages secondary capacity upon primary breakdown
                </div>
              </div>

              <div
                className={`wb-toggle-pill ${isBackupEnabled ? 'on' : ''}`}
                onClick={onToggleBackup}
                title="Toggle standby backup engagement"
              />
            </div>

            {/* Active Protection Banner */}
            {isBackupActive && (
              <div style={{
                marginTop: 4,
                padding: '6px 8px',
                background: 'var(--status-backup-subtle)',
                border: '1px solid var(--status-backup-border)',
                borderRadius: 3,
                fontSize: 9.5,
                color: 'var(--status-backup)',
                fontFamily: 'var(--font-mono)',
              }}>
                🛡 Active Protection: Standby engaged at {station.backupCapacityPerMin} u/min
              </div>
            )}
          </div>
        </div>

        {/* Direct Simulation Fault Injection */}
        <div className="wb-section">
          <div className="wb-section-title">
            <span>Simulation Fault Injection</span>
            <span>MANUAL TEST</span>
          </div>
          <div className="wb-section-body">
            <p style={{ color: 'var(--text-muted)', fontSize: 10 }}>
              Simulate sudden mechanical failure or line halt at this station to test downstream line resilience.
            </p>

            <button
              className={`wb-btn ${isFailed ? '' : 'active'}`}
              style={{
                width: '100%',
                height: 28,
                marginTop: 4,
                background: isFailed ? '#2a1215' : 'var(--bg-panel-elevated)',
                borderColor: isFailed ? 'var(--status-alert-border)' : 'var(--border-strong)',
                color: isFailed ? 'var(--status-alert)' : 'var(--text-primary)',
              }}
              onClick={onToggleFailure}
            >
              {isFailed ? '⚡ Clear Simulated Failure (Restore)' : '✕ Inject Simulated Failure'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
