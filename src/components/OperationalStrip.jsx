export default function OperationalStrip({
  machines,
  machineStates,
  backupStates,
  selectedStationId,
  sim,
  onSelectStation,
  eventLog = [],
}) {
  const latestEvent = eventLog.length > 0 ? eventLog[eventLog.length - 1] : 'SYSTEM INITIALIZED — READY';

  return (
    <footer className="wb-status-strip">
      {/* ── Left: Interactive Production Sequence Flow Pipeline ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Line Flow:</span>
        <div className="wb-pipeline-flow">
          {machines.map((station, idx) => {
            const isFailed = !!machineStates[station.id];
            const isBackupEnabled = backupStates[station.id] !== undefined
              ? backupStates[station.id]
              : !!station.defaultBackupEnabled;
            const isBackupActive = isFailed && isBackupEnabled && (station.backupCapacityPerMin || 0) > 0;
            const isSelected = selectedStationId === station.id;

            let stepClass = '';
            if (isFailed) {
              stepClass = isBackupActive ? 'backup' : 'failed';
            }
            if (isSelected) {
              stepClass += ' selected';
            }

            return (
              <div key={station.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div
                  className={`wb-flow-step ${stepClass}`}
                  onClick={() => onSelectStation(station.id)}
                  style={{ cursor: 'pointer' }}
                  title={`${station.name} — Click to inspect`}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{idx + 1}.</span>
                  <span>{station.name.split(' ')[0]}</span>
                </div>
                {idx < machines.length - 1 && <span className="wb-flow-arrow">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Center: Session Event Telemetry ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: 420,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--text-secondary)',
        fontSize: 9.5,
      }}>
        <span style={{ color: 'var(--accent-orange)' }}>LOG:</span>
        <span>{latestEvent}</span>
      </div>

      {/* ── Right: Live Throughput Summary ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>BASELINE:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sim.baselineThroughput} u/min</span>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>SIMULATED RATE:</span>
          <span style={{
            fontWeight: 700,
            color: sim.currentThroughput === 0
              ? 'var(--status-alert)'
              : sim.currentThroughput < sim.baselineThroughput
                ? 'var(--status-backup)'
                : 'var(--status-healthy)',
          }}>
            {sim.currentThroughput} u/min
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>LOSS:</span>
          <span style={{
            fontWeight: 700,
            color: sim.productionLossPct > 0 ? 'var(--status-alert)' : 'var(--text-muted)',
          }}>
            {sim.productionLossPct}%
          </span>
        </div>
      </div>
    </footer>
  );
}
