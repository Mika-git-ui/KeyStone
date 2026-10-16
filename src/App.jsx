import { useState, useCallback, useMemo, useRef } from 'react';
import FactoryScene from './components/FactoryScene';
import TopBar from './components/TopBar';
import SceneHierarchy from './components/SceneHierarchy';
import MachineInspector from './components/MachineInspector';
import OperationalStrip from './components/OperationalStrip';
import AnalysisModal from './components/AnalysisModal';
import AuthScreen from './components/AuthScreen';
import ChatPlanner from './components/ChatPlanner';
import { MACHINE_CONFIGS } from './data/machines';
import { getMachineById } from './data/machineCatalogue';
import { computeSimulation } from './simulation/productionLine';
import { useAnalysis } from './hooks/useAnalysis';
import './App.css';

// Initial machine operational state (all false = operational)
const initialMachineStates = Object.fromEntries(
  MACHINE_CONFIGS.map((m) => [m.id, false])
);

// Initial backup standby configuration from defaults
const initialBackupStates = Object.fromEntries(
  MACHINE_CONFIGS.map((m) => [m.id, !!m.defaultBackupEnabled])
);

// Safe session-scoped storage helpers for non-sensitive demo session state
function getSessionItem(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function setSessionItem(key, value) {
  try {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    // Graceful fallback if storage disabled or unavailable
  }
}

const DEFAULT_DEMO_USER = {
  name: 'Demo Engineer',
  role: 'Virtual Factory Planner',
  facility: 'Pilot Plant Alpha (Demo Corridor)',
  isTemporary: true,
};

export default function App() {
  // Demo Workspace Navigation & Identity Flow: 'auth' → 'chat' → 'factory'
  const [currentUser, setCurrentUser] = useState(() => {
    return getSessionItem('keystone_demo_user', DEFAULT_DEMO_USER);
  });

  const [currentView, setCurrentView] = useState(() => {
    const saved = getSessionItem('keystone_demo_view');
    return saved && ['chat', 'factory'].includes(saved) ? saved : 'auth';
  });

  const [planContext, setPlanContext] = useState(() => {
    return getSessionItem('keystone_demo_plan', null);
  });

  const [hasOpenedFactory, setHasOpenedFactory] = useState(() => {
    const saved = getSessionItem('keystone_demo_view');
    return saved === 'factory';
  });

  const [machineStates, setMachineStates] = useState(initialMachineStates);
  const [backupStates, setBackupStates] = useState(initialBackupStates);
  const [selectedStationId, setSelectedStationId] = useState('cutting');
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [eventLog, setEventLog] = useState([
    'SYSTEM INITIALIZED — 4/4 STATIONS ONLINE',
  ]);

  const sceneRef = useRef(null);

  // Analysis Hook talking to FastAPI backend
  const {
    report,
    recommendations,
    loading: isAnalyzing,
    recLoading,
    error: analyzeError,
    analyze,
    clear: clearAnalysis,
  } = useAnalysis();

  const appendLog = useCallback((message) => {
    setEventLog((prev) => [...prev.slice(-12), message]);
  }, []);

  // Toggle station operational / failed
  const toggleMachine = useCallback((id) => {
    setMachineStates((prev) => {
      const willBeFailed = !prev[id];
      const stationObj = MACHINE_CONFIGS.find((m) => m.id === id);
      const name = stationObj ? stationObj.name : id;

      appendLog(
        willBeFailed
          ? `[FAULT INJECTED] Station '${name}' simulated breakdown.`
          : `[RESTORED] Station '${name}' returned to normal operation.`
      );

      return { ...prev, [id]: willBeFailed };
    });
  }, [appendLog]);

  // Toggle station standby backup configuration
  const toggleBackup = useCallback((id) => {
    setBackupStates((prev) => {
      const willBeEnabled = !prev[id];
      const stationObj = MACHINE_CONFIGS.find((m) => m.id === id);
      const name = stationObj ? stationObj.name : id;

      appendLog(
        willBeEnabled
          ? `[STANDBY READY] Backup redundancy armed for '${name}'.`
          : `[STANDBY OFF] Backup redundancy disarmed for '${name}'.`
      );

      return { ...prev, [id]: willBeEnabled };
    });
  }, [appendLog]);

  // Restore all machines to operational state
  const resetAll = useCallback(() => {
    setMachineStates(initialMachineStates);
    appendLog('[ALL CLEAR] Reset command executed — all stations restored.');
  }, [appendLog]);

  // Select station across hierarchy, 3D viewport, and inspector
  const handleSelectStation = useCallback((id) => {
    setSelectedStationId(id);
    const stationObj = MACHINE_CONFIGS.find((m) => m.id === id);
    if (stationObj) {
      appendLog(`[INSPECT] Selected station '${stationObj.name}'.`);
    }
  }, [appendLog]);

  // Derived simulation snapshot
  const sim = useMemo(
    () => computeSimulation(MACHINE_CONFIGS, machineStates, backupStates),
    [machineStates, backupStates]
  );

  // Run failure analysis via API and open modal
  const handleOpenAnalysis = useCallback(() => {
    setIsAnalysisModalOpen(true);
    appendLog('[ANALYSIS] Querying FailureEngine & MitigationEngine…');
    analyze(MACHINE_CONFIGS, backupStates);
  }, [analyze, backupStates, appendLog]);

  // Quick action from recommendation card to enable backup
  const handleApplyMitigation = useCallback((stationId) => {
    setBackupStates((prev) => ({ ...prev, [stationId]: true }));
    appendLog(`[MITIGATION APPLIED] Standby enabled on station '${stationId}'.`);
    // Re-run analysis with updated backup states
    analyze(MACHINE_CONFIGS, { ...backupStates, [stationId]: true });
  }, [backupStates, analyze, appendLog]);

  const selectedStation = useMemo(
    () => MACHINE_CONFIGS.find((m) => m.id === selectedStationId) || MACHINE_CONFIGS[0],
    [selectedStationId]
  );

  const selectedStationStat = useMemo(
    () => sim.stationStats?.find((s) => s.id === selectedStationId),
    [sim, selectedStationId]
  );

  const selectedCatalogueMachine = useMemo(() => {
    const selectedId = planContext?.selections?.[selectedStation.id];
    return selectedId ? getMachineById(selectedId) : null;
  }, [planContext, selectedStation.id]);

  const handleAuthenticate = useCallback((authData) => {
    const user = authData.user || DEFAULT_DEMO_USER;
    setCurrentUser(user);
    setSessionItem('keystone_demo_user', user);
    setCurrentView('chat');
    setSessionItem('keystone_demo_view', 'chat');
    appendLog(`[DEMO WORKSPACE OPENED] Welcome ${user.name}`);
  }, [appendLog]);

  const handleSimulateFactory = useCallback((plan) => {
    setPlanContext(plan);
    setSessionItem('keystone_demo_plan', plan);
    setHasOpenedFactory(true);
    setCurrentView('factory');
    setSessionItem('keystone_demo_view', 'factory');

    // If user's plan specifies redundancy, ensure standby is armed on cutting and welding
    if (plan?.redundancyPreference?.toLowerCase().includes('standby')) {
      setBackupStates((prev) => ({
        ...prev,
        cutting: true,
        welding: true,
      }));
    }

    appendLog(`[FACTORY LOADED] 3D Simulation initialized for plan: ${plan.productType}`);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }, [appendLog]);

  const handleQuickJumpToFactory = useCallback(() => {
    setHasOpenedFactory(true);
    setCurrentView('factory');
    setSessionItem('keystone_demo_view', 'factory');
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }, []);

  const handleReturnToPlanner = useCallback(() => {
    setCurrentView('chat');
    setSessionItem('keystone_demo_view', 'chat');
  }, []);

  const handleSwitchProfile = useCallback(() => {
    setCurrentView('auth');
    setSessionItem('keystone_demo_view', 'auth');
  }, []);

  return (
    <>
      {/* ── View 1: Demo Identity & Workspace Entry ─────────────── */}
      {currentView === 'auth' && (
        <AuthScreen
          initialName={currentUser?.name || DEFAULT_DEMO_USER.name}
          onAuthenticate={handleAuthenticate}
        />
      )}

      {/* ── View 2: Conversational Factory Planner ─────────────────── */}
      {currentView === 'chat' && (
        <ChatPlanner
          user={currentUser}
          existingPlan={planContext}
          onSimulateFactory={handleSimulateFactory}
          onQuickJumpToFactory={handleQuickJumpToFactory}
          onSwitchProfile={handleSwitchProfile}
        />
      )}

      {/* ── View 3: 3D Factory Simulation Workbench ───────────────── */}
      {hasOpenedFactory && (
        <div
          className="workbench-shell"
          style={{ display: currentView === 'factory' ? 'grid' : 'none' }}
        >
          {/* ── Top Application Command Bar ────────────────────────────── */}
          <TopBar
            sim={sim}
            onResetSimulation={resetAll}
            onOpenAnalysis={handleOpenAnalysis}
            isAnalyzing={isAnalyzing}
            onResetCamera={() => sceneRef.current?.resetCamera()}
            onSetIsoView={() => sceneRef.current?.setIsometricView()}
            onSetTopView={() => sceneRef.current?.setTopView()}
            onReturnToPlanner={handleReturnToPlanner}
            planContext={planContext}
            user={currentUser}
          />

          {/* ── Left Scene Outliner / Hierarchy ───────────────────────── */}
          <SceneHierarchy
            machines={MACHINE_CONFIGS}
            machineStates={machineStates}
            backupStates={backupStates}
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
            onToggleFailure={toggleMachine}
          />

          {/* ── Central 3D Factory Viewport ────────────────────────────── */}
          <main className="wb-viewport-container">
            {/* Viewport Overlay Controls */}
            <div className="wb-viewport-overlay-top">
              <div className="wb-viewport-tag">
                <span style={{ color: 'var(--accent-orange)' }}>●</span>
                <span>VIEWPORT: 3D SIMULATION CORRIDOR</span>
                <span style={{ color: 'var(--text-disabled)' }}>|</span>
                <span>GRID: 2.0m</span>
              </div>

              <div className="wb-viewport-cam-tools">
                <button
                  className="wb-btn"
                  onClick={() => sceneRef.current?.setFrontView()}
                  title="Front Elevation View"
                >
                  Front
                </button>
                <button
                  className="wb-btn"
                  onClick={() => sceneRef.current?.setIsometricView()}
                  title="Isometric Perspective"
                >
                  Iso
                </button>
                <button
                  className="wb-btn"
                  onClick={() => sceneRef.current?.resetCamera()}
                  title="Reset View"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 3D Scene */}
            <FactoryScene
              ref={sceneRef}
              machineStates={machineStates}
              backupStates={backupStates}
              selectedStationId={selectedStationId}
              sim={sim}
              onMachineClick={handleSelectStation}
            />

            {/* Navigation Hint */}
            <div className="wb-viewport-hint">
              Left Drag: Orbit · Scroll: Zoom · Right Drag / Shift+Drag: Pan · Click Station: Select & Inspect
            </div>
          </main>

          {/* ── Right Station Properties Inspector ─────────────────────── */}
          <MachineInspector
            station={selectedStation}
            stationStat={selectedStationStat}
            isFailed={!!machineStates[selectedStation.id]}
            isBackupEnabled={
              backupStates[selectedStation.id] !== undefined
                ? backupStates[selectedStation.id]
                : !!selectedStation.defaultBackupEnabled
            }
            onToggleFailure={() => toggleMachine(selectedStation.id)}
            onToggleBackup={() => toggleBackup(selectedStation.id)}
            planCatalogueMachine={selectedCatalogueMachine}
          />

          {/* ── Bottom Operational Telemetry & Sequence Strip ──────────── */}
          <OperationalStrip
            machines={MACHINE_CONFIGS}
            machineStates={machineStates}
            backupStates={backupStates}
            selectedStationId={selectedStationId}
            sim={sim}
            onSelectStation={handleSelectStation}
            eventLog={eventLog}
          />

          {/* ── Failure Analysis & Mitigations Modal Workspace ──────────── */}
          {isAnalysisModalOpen && (
            <AnalysisModal
              report={report}
              recommendations={recommendations}
              loading={isAnalyzing}
              recLoading={recLoading}
              error={analyzeError}
              onClose={() => setIsAnalysisModalOpen(false)}
              onApplyMitigation={handleApplyMitigation}
            />
          )}
        </div>
      )}
    </>
  );
}
