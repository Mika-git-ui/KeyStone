export default function SceneHierarchy({
  machines,
  machineStates,
  backupStates,
  selectedStationId,
  onSelectStation,
  onToggleFailure,
}) {
  return (
    <aside className="wb-outliner">
      <div className="wb-panel-header">
        <span>Scene Hierarchy</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>4 Stations</span>
      </div>

      <div className="wb-tree-view">
        <div style={{ padding: '4px 10px 8px', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          ▾ Production Line (Sequential)
        </div>

        {machines.map((station, index) => {
          const isSelected = selectedStationId === station.id;
          const isFailed = !!machineStates[station.id];
          const isBackupEnabled = backupStates[station.id] !== undefined
            ? backupStates[station.id]
            : !!station.defaultBackupEnabled;
          const isBackupActive = isFailed && isBackupEnabled && (station.backupCapacityPerMin || 0) > 0;

          let badgeColor = 'var(--status-healthy)';
          let statusText = 'NORMAL';

          if (isFailed) {
            if (isBackupActive) {
              badgeColor = 'var(--status-backup)';
              statusText = 'BACKUP';
            } else {
              badgeColor = 'var(--status-alert)';
              statusText = 'FAILED';
            }
          }

          return (
            <div
              key={station.id}
              className={`wb-tree-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectStation(station.id)}
            >
              <div className="wb-tree-item-title">
                <span className="wb-tree-icon">[{index + 1}]</span>
                <span className="wb-tree-label">{station.name}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}40`,
                  padding: '1px 4px',
                  borderRadius: 2,
                }}>
                  {statusText}
                </span>

                {/* Quick Toggle Failure Button */}
                <button
                  className="wb-btn"
                  style={{
                    height: 18,
                    padding: '0 5px',
                    fontSize: 8.5,
                    borderColor: isFailed ? 'var(--status-alert-border)' : 'var(--border-default)',
                    color: isFailed ? 'var(--status-alert)' : 'var(--text-muted)',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFailure(station.id);
                  }}
                  title={isFailed ? 'Restore station' : 'Inject simulated failure'}
                >
                  {isFailed ? 'RES' : 'FAIL'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Outliner Summary Footer */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid var(--border-default)',
        background: 'var(--bg-workspace)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>Topology: Strict Serial</span>
        <span>Line: 4/4 Active</span>
      </div>
    </aside>
  );
}
