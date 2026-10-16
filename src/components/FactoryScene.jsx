import { useRef, useImperativeHandle, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MACHINE_CONFIGS } from '../data/machines';
import {
  ConveyorBelt,
  MachineStation,
  FactoryFloor,
  CeilingTruss,
  SteamEffect,
} from './FactoryComponents';

// Conveyor connections connecting the sequential corridor
const CONVEYORS = [
  { start: [-7.3, 0.25, -3], end: [-4.7, 0.25, -3], leftIdx: 0, rightIdx: 1 },
  { start: [-1.3, 0.25, -3], end: [1.3, 0.25, -3], leftIdx: 1, rightIdx: 2 },
  { start: [4.7, 0.25, -3], end: [7.3, 0.25, -3], leftIdx: 2, rightIdx: 3 },
];

const FactoryScene = forwardRef(function FactoryScene(
  {
    machineStates,
    backupStates = {},
    selectedStationId,
    sim,
    onMachineClick,
  },
  ref
) {
  const controlsRef = useRef();

  // Expose camera presets framing the complete line
  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.object.position.set(0, 11, 16);
        controlsRef.current.target.set(0, 1.2, -3);
      }
    },
    setTopView: () => {
      if (controlsRef.current) {
        controlsRef.current.object.position.set(0, 24, -3);
        controlsRef.current.target.set(0, 0, -3);
      }
    },
    setFrontView: () => {
      if (controlsRef.current) {
        controlsRef.current.object.position.set(0, 2.5, 15);
        controlsRef.current.target.set(0, 1.3, -3);
      }
    },
    setIsometricView: () => {
      if (controlsRef.current) {
        controlsRef.current.object.position.set(15, 12, 13);
        controlsRef.current.target.set(0, 1.0, -3);
      }
    },
  }));

  // Conveyor operational state:
  // In a sequential line, product flow halts if either upstream or downstream station has failed with NO backup.
  // If stations are running or covered by standby backups, flow continues at appropriate rate.
  const isStationActive = (machineId) => {
    const isFailed = !!machineStates[machineId];
    if (!isFailed) return true;
    const isBackupEnabled = backupStates[machineId] !== undefined
      ? backupStates[machineId]
      : !!MACHINE_CONFIGS.find(m => m.id === machineId)?.defaultBackupEnabled;
    const backupCap = MACHINE_CONFIGS.find(m => m.id === machineId)?.backupCapacityPerMin || 0;
    return isBackupEnabled && backupCap > 0;
  };

  const isStationOnStandby = (machineId) => {
    const isFailed = !!machineStates[machineId];
    if (!isFailed) return false;
    const isBackupEnabled = backupStates[machineId] !== undefined
      ? backupStates[machineId]
      : !!MACHINE_CONFIGS.find(m => m.id === machineId)?.defaultBackupEnabled;
    return isBackupEnabled;
  };

  return (
    <Canvas
      shadows
      camera={{ position: [0, 11, 16], fov: 48, near: 0.1, far: 200 }}
      style={{ background: '#0e1114' }}
      className="wb-viewport-canvas"
    >
      {/* ── Key High-Visibility Studio Industrial Lighting Rig ── */}
      {/* 1. Ambient lighting lifted so machines never look dark/black */}
      <ambientLight intensity={0.7} color="#475569" />

      {/* 2. Primary Key Sunlight */}
      <directionalLight
        position={[12, 24, 14]}
        intensity={1.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0001}
      />

      {/* 3. Front Elevation Key Light to illuminate front service panels */}
      <directionalLight position={[0, 8, 18]} intensity={0.9} color="#e2e8f0" />

      {/* 4. Rear Rim / Hair Light for machine edge separation */}
      <directionalLight position={[-16, 12, -14]} intensity={0.8} color="#94a3b8" />

      {/* Structural Environment */}
      <FactoryFloor />
      <CeilingTruss />

      {/* Conveyors with sequential state propagation */}
      {CONVEYORS.map((belt, i) => {
        const leftId = MACHINE_CONFIGS[belt.leftIdx].id;
        const rightId = MACHINE_CONFIGS[belt.rightIdx].id;

        const leftOk = isStationActive(leftId);
        const rightOk = isStationActive(rightId);
        // Line-wide sequential flow: if line is halted, conveyors stop.
        const beltOperational = (sim?.currentThroughput ?? 1) > 0 && leftOk && rightOk;
        const beltStandby = isStationOnStandby(leftId) || isStationOnStandby(rightId);

        return (
          <ConveyorBelt
            key={`conveyor-${i}`}
            start={belt.start}
            end={belt.end}
            isOperational={beltOperational}
            isStandbyFlow={beltStandby}
          />
        );
      })}

      {/* Machine Stations with detailed industrial kinematics */}
      {MACHINE_CONFIGS.map((config) => {
        const isFailed = !!machineStates[config.id];
        const isBackupEnabled = backupStates[config.id] !== undefined
          ? backupStates[config.id]
          : !!config.defaultBackupEnabled;
        const isBackupActive = isFailed && isBackupEnabled && (config.backupCapacityPerMin || 0) > 0;
        const isSelected = selectedStationId === config.id;

        return (
          <MachineStation
            key={config.id}
            config={config}
            failed={isFailed}
            isBackupActive={isBackupActive}
            isSelected={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onMachineClick(config.id);
            }}
          />
        );
      })}

      {/* Operational Exhaust Vapour */}
      {MACHINE_CONFIGS.map((config) => {
        const isFailed = !!machineStates[config.id];
        const isBackupEnabled = backupStates[config.id] !== undefined
          ? backupStates[config.id]
          : !!config.defaultBackupEnabled;
        const isBackupActive = isFailed && isBackupEnabled && (config.backupCapacityPerMin || 0) > 0;

        return [-0.35, 0.35].map((xOff, j) => (
          <SteamEffect
            key={`steam-${config.id}-${j}`}
            position={[config.position[0] + xOff, 2.9, config.position[2] - 0.2]}
            failed={isFailed}
            isBackupActive={isBackupActive}
          />
        ));
      })}

      {/* Orbit & Navigation Controls */}
      <OrbitControls
        ref={controlsRef}
        target={[0, 1.2, -3]}
        minDistance={5}
        maxDistance={42}
        minPolarAngle={0.05}
        maxPolarAngle={Math.PI / 2.05}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
});

export default FactoryScene;
