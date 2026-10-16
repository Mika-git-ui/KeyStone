import { useState } from 'react';
import ThroughputPanel from './ThroughputPanel';
import AnalysisPanel from './AnalysisPanel';
import { useAnalysis } from '../hooks/useAnalysis';

const STATUS_LABELS = {
  operational: { label: 'Operational', color: '#00e5ff' },
  backup: { label: 'BACKUP ACTIVE', color: '#38bdf8' },
  failed: { label: 'FAILED (HALTED)', color: '#ff3b3b' },
};

function CapacityBar({ value, failed, isBackupActive, backupCapacity }) {
  const displayVal = failed
    ? (isBackupActive ? backupCapacity : 0)
    : value;

  const barColor = failed
    ? (isBackupActive ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : '#ff3b3b')
    : 'linear-gradient(90deg, #006666, #00e5ff)';

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#607a7a', letterSpacing: 0.8 }}>
          {isBackupActive ? 'BACKUP CAPACITY' : 'LOAD CAPACITY'}
        </span>
        <span style={{
          fontSize: 10,
          color: failed ? (isBackupActive ? '#38bdf8' : '#ff3b3b') : '#00e5ff',
          fontWeight: 600,
        }}>
          {displayVal}%
        </span>
      </div>
      <div style={{
        height: 4,
        background: '#0d2222',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${displayVal}%`,
          background: barColor,
          borderRadius: 2,
          transition: 'width 0.5s ease, background 0.3s',
        }} />
      </div>
    </div>
  );
}

function MachineCard({
  config,
  failed,
  stationStat,
  backupEnabled,
  onToggle,
  onToggleBackup,
  isSelected,
  onSelect,
}) {
  const isBackupActive = stationStat?.isBackupActive;
  const isBottleneck = stationStat?.isBottleneck && (!failed || isBackupActive);

  let statusKey = 'operational';
  if (failed) {
    statusKey = isBackupActive ? 'backup' : 'failed';
  }
  const status = STATUS_LABELS[statusKey];

  const leftBorderColor = failed
    ? (isBackupActive ? '#38bdf8' : '#ff2020')
    : (isBottleneck ? '#ff9900' : '#00e5ff');

  const cardBg = failed
    ? (isBackupActive
        ? 'linear-gradient(135deg, #08212e 0%, #04141c 100%)'
        : 'linear-gradient(135deg, #1a0808 0%, #120404 100%)')
    : (isSelected
        ? 'linear-gradient(135deg, #001e1e 0%, #00120e 100%)'
        : 'linear-gradient(135deg, #0c1818 0%, #080f0f 100%)');

  return (
    <div
      onClick={onSelect}
      style={{
        background: cardBg,
        border: `1px solid ${
          failed
            ? (isBackupActive ? '#0284c755' : '#5a1010')
            : (isBottleneck ? '#ff990055' : isSelected ? '#00e5ff55' : '#0d2828')
        }`,
        borderRadius: 8,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: leftBorderColor,
        borderRadius: '8px 0 0 8px',
        transition: 'background 0.3s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginLeft: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13 }}>{config.icon}</span>
            <span style={{ color: '#c0d8d8', fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>
              {config.name}
            </span>
            {isBottleneck && (
              <span style={{
                fontSize: 8,
                color: '#ff9900',
                background: '#ff990015',
                border: '1px solid #ff990033',
                borderRadius: 3,
                padding: '1px 5px',
                letterSpacing: 0.8,
                fontWeight: 700,
              }}>
                BOTTLENECK
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#405a5a', marginBottom: 6, marginLeft: 20 }}>
            {config.description}
          </div>

          {/* Status badge + throughput inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 20 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: `${status.color}15`,
              border: `1px solid ${status.color}44`,
              borderRadius: 4,
              padding: '2px 8px',
            }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: status.color,
                boxShadow: `0 0 6px ${status.color}`,
                animation: failed && !isBackupActive ? 'none' : 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 9.5, color: status.color, fontWeight: 600, letterSpacing: 0.8 }}>
                {status.label}
              </span>
            </div>

            {/* Throughput chip */}
            <span style={{
              fontSize: 10,
              color: failed ? (isBackupActive ? '#38bdf8' : '#4a1010') : '#2a5a5a',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {stationStat?.effectiveCapacity !== undefined
                ? stationStat.effectiveCapacity
                : (failed ? 0 : config.capacityPerMin)} u/min
            </span>
          </div>
        </div>

        {/* Toggle failure button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          title={failed ? 'Restore machine' : 'Simulate failure'}
          style={{
            background: failed
              ? (isBackupActive
                  ? 'linear-gradient(135deg, #0369a1, #082f49)'
                  : 'linear-gradient(135deg, #2a0808, #1a0404)')
              : 'linear-gradient(135deg, #001a1a, #000e0e)',
            border: `1px solid ${failed ? (isBackupActive ? '#38bdf866' : '#ff202055') : '#00e5ff33'}`,
            borderRadius: 6,
            color: failed ? (isBackupActive ? '#38bdf8' : '#ff6060') : '#00e5ff',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 0.8,
            padding: '5px 9px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            marginLeft: 6,
          }}
        >
          {failed ? '⚡ RESTORE' : '✕ FAIL'}
        </button>
      </div>

      {/* Backup controls row */}
      <div style={{
        marginTop: 8,
        marginLeft: 6,
        padding: '5px 8px',
        background: '#040d0d',
        borderRadius: 4,
        border: '1px solid #0d2222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9.5, color: '#64748b' }}>🛡 Backup Unit:</span>
          <span style={{
            fontSize: 10,
            color: backupEnabled ? '#38bdf8' : '#475569',
            fontWeight: 600,
          }}>
            {config.backupCapacityPerMin} u/min
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleBackup(); }}
          title={`Click to ${backupEnabled ? 'disable' : 'enable'} standby backup machine`}
          style={{
            background: backupEnabled ? '#0284c722' : '#0f172a',
            border: `1px solid ${backupEnabled ? '#38bdf866' : '#334155'}`,
            borderRadius: 4,
            color: backupEnabled ? '#38bdf8' : '#64748b',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 8px',
            cursor: 'pointer',
            letterSpacing: 0.5,
          }}
        >
          {backupEnabled ? 'STANDBY ON' : 'DISABLED'}
        </button>
      </div>

      <div style={{ marginLeft: 6 }}>
        <CapacityBar
          value={config.capacity}
          failed={failed}
          isBackupActive={isBackupActive}
          backupCapacity={Math.round((config.backupCapacityPerMin / config.capacityPerMin) * 100)}
        />
      </div>
    </div>
  );
}

export default function SidePanel({
  machines,
  machineStates,
  backupStates = {},
  sim,
  onToggle,
  onToggleBackup,
  onResetAll,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const { report, loading, error, analyze, clear } = useAnalysis();

  const showAnalysis = loading || error !== null || report !== null;

  return (
    <div style={{
      width: 300,
      minWidth: 280,
      height: '100%',
      background: '#060e0e',
      borderLeft: '1px solid #0d2828',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ── Panel header ───────────────────────────────── */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid #0d2828',
        background: 'linear-gradient(180deg, #061414 0%, #060e0e 100%)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: sim.lineDown ? '#ff3b3b' : sim.hasFailures ? '#38bdf8' : '#00e5ff',
            boxShadow: sim.lineDown ? '0 0 8px #ff3b3b' : sim.hasFailures ? '0 0 8px #38bdf8' : '0 0 8px #00e5ff',
          }} />
          <span style={{ color: '#00e5ff', fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
            KEYSTONE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#c0d8d8', letterSpacing: 0.5 }}>
              Factory Monitor
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#405a5a' }}>
              Industrial Failure Analysis Platform
            </p>
          </div>

          {/* ── Analyze Failures button ──────────────── */}
          <button
            onClick={() => showAnalysis ? clear() : analyze(machines, backupStates)}
            disabled={loading}
            title={showAnalysis ? 'Close report' : 'Run failure scenario analysis via Python engine'}
            style={{
              background: showAnalysis
                ? 'linear-gradient(135deg, #001010, #000808)'
                : 'linear-gradient(135deg, #003333, #001a1a)',
              border: `1px solid ${showAnalysis ? '#00e5ff33' : '#00e5ff66'}`,
              borderRadius: 6,
              color: loading ? '#2a5a5a' : '#00e5ff',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              padding: '5px 10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              marginTop: 2,
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ …' : showAnalysis ? '✕ Close' : '⚡ Analyze'}
          </button>
        </div>
      </div>

      {/* ── Throughput simulation panel ─────────────────── */}
      <div style={{ flexShrink: 0 }}>
        <ThroughputPanel sim={sim} onResetAll={onResetAll} />
      </div>

      {/* ── Analysis results panel (replaces machine list when open) ─── */}
      {showAnalysis && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderTop: '1px solid #0d2828' }}>
          <AnalysisPanel
            report={report}
            recommendations={recommendations}
            loading={loading}
            recLoading={recLoading}
            error={error}
            onClose={clear}
          />
        </div>
      )}

      {/* ── Machine stations section (hidden while analysis panel is open) ── */}
      {!showAnalysis && (
        <>
          <div style={{
            padding: '10px 14px 6px',
            fontSize: 9,
            color: '#405a5a',
            letterSpacing: 2,
            fontWeight: 700,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>MACHINE STATIONS</span>
            <span style={{ fontSize: 9, color: '#2a4a4a' }}>
              {sim.operationalCount}/{machines.length} operational
            </span>
          </div>

          {/* Machine cards (scrollable) */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 10px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            scrollbarWidth: 'thin',
            scrollbarColor: '#0d2828 transparent',
          }}>
            {machines.map((config) => {
              const stationStat = sim.stationStats?.find((s) => s.id === config.id);
              const isBackupEnabled = backupStates[config.id] !== undefined
                ? backupStates[config.id]
                : !!config.defaultBackupEnabled;

              return (
                <MachineCard
                  key={config.id}
                  config={config}
                  failed={machineStates[config.id]}
                  stationStat={stationStat}
                  backupEnabled={isBackupEnabled}
                  isSelected={selectedId === config.id}
                  onSelect={() => setSelectedId(config.id === selectedId ? null : config.id)}
                  onToggle={() => onToggle(config.id)}
                  onToggleBackup={() => onToggleBackup(config.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #0d2828',
        fontSize: 9,
        color: '#1e3030',
        letterSpacing: 0.5,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>KEYSTONE v3.0 · Stage 3C: Backup Engine</span>
        <span style={{
          color: sim.lineDown
            ? '#ff3b3b'
            : sim.hasFailures
              ? '#38bdf8'
              : '#00e5ff44'
        }}>
          {sim.lineDown ? '⚠ LINE DOWN' : sim.hasFailures ? '🛡 BACKUP ENGAGED' : '● RUNNING'}
        </span>
      </div>
    </div>
  );
}
