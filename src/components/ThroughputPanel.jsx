/**
 * ThroughputPanel — Stage 2 simulation stats display.
 * Shows baseline vs current throughput, units lost, and production loss %.
 * All numbers are clearly labelled as ESTIMATES.
 */

function StatCell({ label, value, unit, color, highlight, small }) {
  return (
    <div style={{
      padding: small ? '8px 12px' : '10px 14px',
      background: highlight ? `${color}0d` : '#060e0e',
      border: `1px solid ${highlight ? color + '33' : '#0d2828'}`,
      borderRadius: 6,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2, background: color, opacity: 0.7,
        }} />
      )}
      <div style={{
        fontSize: 9,
        color: '#405a5a',
        letterSpacing: 1.2,
        marginBottom: 3,
        fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontSize: small ? 16 : 20,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {value}
        {unit && (
          <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 3, color: '#405a5a' }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function ThroughputBar({ baseline, current, lost }) {
  const currentPct = baseline > 0 ? (current / baseline) * 100 : 0;
  const lostPct = baseline > 0 ? (lost / baseline) * 100 : 0;

  return (
    <div style={{ padding: '0 14px 12px' }}>
      <div style={{
        fontSize: 9,
        color: '#405a5a',
        letterSpacing: 1.2,
        marginBottom: 6,
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>LINE THROUGHPUT (EST.)</span>
        <span style={{ color: '#2a4a4a' }}>{baseline} u/min baseline</span>
      </div>

      {/* Stacked bar */}
      <div style={{
        height: 8,
        background: '#0d2222',
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
      }}>
        <div style={{
          width: `${currentPct}%`,
          background: current === 0 ? '#330000' : 'linear-gradient(90deg, #005555, #00e5ff)',
          transition: 'width 0.5s ease',
          borderRadius: '4px 0 0 4px',
        }} />
        <div style={{
          width: `${lostPct}%`,
          background: 'linear-gradient(90deg, #440000, #ff3b3b44)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 5,
        fontSize: 9,
        color: '#2a4a4a',
      }}>
        <span style={{ color: current === 0 ? '#ff3b3b' : '#00e5ff' }}>
          ▪ Active: {current} u/min
        </span>
        {lost > 0 && (
          <span style={{ color: '#ff3b3b' }}>▪ Lost: {lost} u/min</span>
        )}
      </div>
    </div>
  );
}

function AlertBanner({ sim }) {
  if (!sim.hasFailures) return null;

  const hasBackups = sim.backupsActivated && sim.backupsActivated.length > 0;
  const isLineHalted = sim.lineDown;

  let msg = '';
  let color = '#ff3b3b';

  if (isLineHalted) {
    msg = sim.failedCount === 1
      ? '1 station failed (no backup) — production line halted'
      : `${sim.failedCount} stations failed — production line halted`;
  } else if (hasBackups) {
    color = '#38bdf8';
    msg = `${sim.backupsActivated.length} backup machine(s) engaged — production reduced to ${sim.currentThroughput} u/min`;
  }

  return (
    <div style={{
      margin: '0 14px 10px',
      padding: '8px 12px',
      background: isLineHalted ? '#1a00002a' : '#0369a122',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
        flexShrink: 0,
        animation: 'pulse 1s infinite',
      }} />
      <span style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: 0.5 }}>
        {msg}
      </span>
    </div>
  );
}

export default function ThroughputPanel({ sim, onResetAll }) {
  const lossColor =
    sim.productionLossPct === 0 ? '#405a5a'
      : sim.productionLossPct < 30 ? '#ff9900'
        : '#ff3b3b';

  const uptimeColor =
    sim.productionLossPct === 0 ? '#00e5ff'
      : sim.productionLossPct < 30 ? '#ff9900'
        : '#ff3b3b';

  return (
    <div style={{
      borderBottom: '1px solid #0d2828',
      paddingBottom: 4,
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px 8px',
      }}>
        <div>
          <div style={{
            fontSize: 9, color: '#405a5a',
            letterSpacing: 1.5, fontWeight: 700, marginBottom: 1,
          }}>PRODUCTION SIMULATION</div>
          <div style={{ fontSize: 8, color: '#2a3a3a', letterSpacing: 0.5 }}>
            * ESTIMATES ONLY — not calibrated industrial data
          </div>
        </div>
        {sim.hasFailures && (
          <button
            onClick={onResetAll}
            title="Restore all failed machines"
            style={{
              background: 'linear-gradient(135deg, #001a1a, #000e0e)',
              border: '1px solid #00e5ff44',
              borderRadius: 5,
              color: '#00e5ff',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.8,
              padding: '4px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ↺ RESET ALL
          </button>
        )}
      </div>

      {/* Alert if line is down */}
      <AlertBanner sim={sim} />

      {/* 4 key stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        padding: '0 14px 10px',
      }}>
        <StatCell
          label="BASELINE"
          value={sim.baselineThroughput}
          unit="u/min"
          color="#405a5a"
        />
        <StatCell
          label="CURRENT"
          value={sim.currentThroughput}
          unit="u/min"
          color={sim.currentThroughput === sim.baselineThroughput ? '#00e5ff' : sim.currentThroughput === 0 ? '#ff3b3b' : '#ff9900'}
          highlight={sim.lineDown}
        />
        <StatCell
          label="UNITS LOST /MIN"
          value={sim.unitsLostPerMin}
          unit="u/min"
          color={lossColor}
          highlight={sim.unitsLostPerMin > 0}
          small
        />
        <StatCell
          label="PRODUCTION LOSS"
          value={`${sim.productionLossPct}%`}
          color={uptimeColor}
          highlight={sim.productionLossPct > 0}
          small
        />
      </div>

      {/* Throughput bar */}
      <ThroughputBar
        baseline={sim.baselineThroughput}
        current={sim.currentThroughput}
        lost={sim.unitsLostPerMin}
      />
    </div>
  );
}

