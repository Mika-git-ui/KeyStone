import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Conveyor belt with rollers & sequential traveling payloads ─── */
export function ConveyorBelt({ start, end, isOperational, isStandbyFlow }) {
  const groupRef = useRef();
  const progressRef = useRef(0);
  const markerCount = 4;

  const direction = useMemo(() => {
    return new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
  }, [start, end]);

  const length = direction.length();
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const angle = Math.atan2(direction.x, direction.z);

  // Speed: steady if nominal, slower if running under standby fallback, 0 if blocked
  const speed = !isOperational ? 0 : isStandbyFlow ? 0.18 : 0.32;

  useFrame((_, delta) => {
    if (groupRef.current && isOperational) {
      progressRef.current = (progressRef.current + delta * speed) % 1;
      groupRef.current.children.forEach((child, i) => {
        if (child.userData.isMarker) {
          const t = ((i / markerCount) + progressRef.current) % 1;
          child.position.x = start[0] + direction.x * t - midX;
          child.position.z = start[2] + direction.z * t - midZ;
        }
      });
    }
  });

  const rollerPositions = useMemo(() => {
    const positions = [];
    const steps = Math.floor(length * 2.0);
    for (let i = 0; i <= steps; i++) {
      positions.push(i / steps);
    }
    return positions;
  }, [length]);

  return (
    <group position={[midX, 0.05, midZ]} rotation={[0, angle, 0]}>
      {/* Side structural safety guide rails */}
      {[-0.66, 0.66].map((sideZ, idx) => (
        <group key={`rail-${idx}`} position={[0, 0.12, sideZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[length, 0.18, 0.04]} />
            <meshStandardMaterial color="#2d333b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Top safety stripe */}
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[length, 0.02, 0.042]} />
            <meshStandardMaterial color={isOperational ? (isStandbyFlow ? '#3498db' : '#e67e22') : '#cf3a3a'} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Bed slider plate */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[length, 0.1, 1.28]} />
        <meshStandardMaterial color="#1e2329" metalness={0.65} roughness={0.45} />
      </mesh>

      {/* Heavy-duty steel rollers */}
      {rollerPositions.map((t, i) => (
        <mesh key={i} position={[(t - 0.5) * length, 0.07, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
          <cylinderGeometry args={[0.045, 0.045, 1.26, 12]} />
          <meshStandardMaterial color={isOperational ? '#485461' : '#2b3038'} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Conveyed workpieces (Machined component billet / carrier) */}
      <group ref={groupRef}>
        {Array.from({ length: markerCount }).map((_, i) => {
          const t = i / markerCount;
          return (
            <group
              key={i}
              position={[(t - 0.5) * length, 0.16, 0]}
              userData={{ isMarker: true }}
            >
              {/* Transport Carrier Pallet */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.34, 0.04, 0.34]} />
                <meshStandardMaterial color="#373e47" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Cylindrical Raw/Turned Workpiece */}
              <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.14, 16]} />
                <meshStandardMaterial
                  color={!isOperational ? '#5c2a2a' : isStandbyFlow ? '#7eb3d6' : '#d1d8e0'}
                  metalness={0.85}
                  roughness={0.25}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ─── Machine Station: Distinct Industrial Archetypes + Motion + Diagnostic Overlays ─── */
export function MachineStation({
  config,
  failed,
  isBackupActive,
  isSelected,
  onClick,
  onPointerOver,
  onPointerOut
}) {
  const [x, , z] = config.position;
  const toolAnimRef = useRef();
  const beaconLightRef = useRef();

  // Purposeful subtle kinematic motion tied directly to station operational state
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Tool head kinematic motion
    if (toolAnimRef.current) {
      if (!failed || isBackupActive) {
        // Operational motion (slowed if on reduced standby)
        const speedFactor = isBackupActive ? 0.6 : 1.0;

        if (config.id === 'cutting') {
          // Linear reciprocating cutting gantry motion
          toolAnimRef.current.position.z = Math.sin(t * 2.2 * speedFactor) * 0.45;
        } else if (config.id === 'welding') {
          // Robotic torch articulation
          toolAnimRef.current.rotation.z = Math.sin(t * 1.8 * speedFactor) * 0.18;
          toolAnimRef.current.rotation.y = Math.cos(t * 1.5 * speedFactor) * 0.15;
        } else if (config.id === 'assembly') {
          // Press stroke vertical reciprocation
          toolAnimRef.current.position.y = 0.5 + Math.sin(t * 2.5 * speedFactor) * 0.15;
        } else if (config.id === 'inspection') {
          // Optical scanning gantry sweep
          toolAnimRef.current.position.x = Math.sin(t * 1.6 * speedFactor) * 0.4;
        }
      } else {
        // When failed: tool immediately parks or freezes
        if (config.id === 'cutting') toolAnimRef.current.position.z = 0;
        if (config.id === 'welding') toolAnimRef.current.rotation.z = 0.25; // parked tilt
        if (config.id === 'assembly') toolAnimRef.current.position.y = 0.65; // parked up
        if (config.id === 'inspection') toolAnimRef.current.position.x = 0;
      }
    }

    // 2. Beacon tower illumination
    if (beaconLightRef.current) {
      if (failed && !isBackupActive) {
        // Unmitigated emergency fault strobe
        const pulse = Math.sin(t * 6);
        beaconLightRef.current.intensity = pulse > 0 ? 3.0 : 0.2;
      } else if (isBackupActive) {
        // Steady blue standby indication
        beaconLightRef.current.intensity = 1.4;
      } else {
        // Nominal operational glow
        beaconLightRef.current.intensity = 0.9;
      }
    }
  });

  // Machine color themes
  const baseSteelColor = failed
    ? (isBackupActive ? '#1a2633' : '#2b1b1d')
    : (isSelected ? '#252c34' : '#22272e');

  const statusBadgeBg = failed
    ? (isBackupActive ? '#153e66' : '#731f1f')
    : '#1e4620';

  const statusBadgeText = failed
    ? (isBackupActive ? 'BACKUP ACTIVE' : 'FAULT INJECTED')
    : 'OPERATIONAL';

  const statusBadgeColor = failed
    ? (isBackupActive ? '#38bdf8' : '#ff4d4f')
    : '#4ade80';

  return (
    <group
      position={[x, 0, z]}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* ── Selection Wireframe Bracket on Floor ── */}
      {isSelected && (
        <group position={[0, 0.03, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(3.8, 0.04, 3.8)]} />
            <lineBasicMaterial color="#e67e22" linewidth={2.5} />
          </lineSegments>
          {/* Floor orange spot wash */}
          <pointLight position={[0, 0.6, 0]} color="#e67e22" intensity={1.8} distance={3.8} />
        </group>
      )}

      {/* ── Machined Cast Iron Plinth ── */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.4, 0.2, 3.4]} />
        <meshStandardMaterial color="#181c20" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* ── Main Station Chassis Body ── */}
      <mesh position={[0, 1.0, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 1.6, 2.8]} />
        <meshStandardMaterial color={baseSteelColor} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* ── High-Contrast Service Panels & Trim ── */}
      <mesh position={[0, 1.0, 1.42]}>
        <boxGeometry args={[2.0, 1.1, 0.04]} />
        <meshStandardMaterial color="#15181c" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Station ID Plate */}
      <mesh position={[0, 1.7, 1.43]}>
        <boxGeometry args={[1.6, 0.14, 0.02]} />
        <meshStandardMaterial color={isSelected ? '#e67e22' : '#3d4550'} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* ── Station Specific Tooling & Mechanical Details ── */}
      {config.id === 'cutting' && (
        <group position={[0, 1.8, 0]}>
          {/* Laser Bridge & Gantry Rails */}
          <mesh position={[0, 0.6, -0.6]} castShadow>
            <boxGeometry args={[2.4, 0.16, 0.16]} />
            <meshStandardMaterial color="#373e47" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.6, 0.6]} castShadow>
            <boxGeometry args={[2.4, 0.16, 0.16]} />
            <meshStandardMaterial color="#373e47" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Tool carriage with reciprocating motion */}
          <group ref={toolAnimRef} position={[0, 0.6, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.5, 0.28, 0.5]} />
              <meshStandardMaterial color="#e67e22" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Laser Nozzle */}
            <mesh position={[0, -0.35, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.04, 0.45, 16]} />
              <meshStandardMaterial color="#d1d8e0" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Focal glow on workpiece */}
            {(!failed || isBackupActive) && (
              <pointLight position={[0, -0.55, 0]} color="#e67e22" intensity={2.5} distance={1.8} />
            )}
          </group>
          {/* Slatted Bed Table */}
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[2.2, 0.1, 2.0]} />
            <meshStandardMaterial color="#2d333b" metalness={0.85} roughness={0.3} />
          </mesh>
          {/* Metal Sheet Workpiece */}
          <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.4, 0.02, 1.2]} />
            <meshStandardMaterial color="#a0aec0" metalness={0.95} roughness={0.15} />
          </mesh>
        </group>
      )}

      {config.id === 'welding' && (
        <group position={[0, 1.8, 0]}>
          {/* Enclosure Hood Frame */}
          <mesh position={[0, 0.8, -0.9]} castShadow>
            <boxGeometry args={[2.2, 1.4, 0.15]} />
            <meshStandardMaterial color="#24292e" metalness={0.8} />
          </mesh>
          {/* Articulated Robotic Welding Arm Pedestal */}
          <mesh position={[-0.7, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 0.4, 16]} />
            <meshStandardMaterial color="#373e47" metalness={0.85} />
          </mesh>
          {/* Articulated Torch Assembly */}
          <group ref={toolAnimRef} position={[-0.7, 0.45, 0]}>
            {/* Lower boom */}
            <mesh position={[0.3, 0.4, 0]} rotation={[0, 0, -0.6]} castShadow>
              <boxGeometry args={[0.9, 0.12, 0.12]} />
              <meshStandardMaterial color="#e67e22" metalness={0.8} />
            </mesh>
            {/* Upper forearm with welding tip */}
            <mesh position={[0.7, 0.55, 0]} rotation={[0, 0, 0.7]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 12]} />
              <meshStandardMaterial color="#d1d8e0" metalness={0.9} />
            </mesh>
            {/* Arc torch tip */}
            <mesh position={[0.9, 0.3, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.02, 0.22, 12]} />
              <meshStandardMaterial color="#2d333b" metalness={0.9} />
            </mesh>
            {/* Intermittent weld spark illuminator */}
            {(!failed || isBackupActive) && (
              <pointLight position={[0.95, 0.18, 0]} color="#60a5fa" intensity={2.0} distance={2.5} />
            )}
          </group>
          {/* Fixture Vise Worktable */}
          <mesh position={[0.2, 0.1, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.4, 0.2, 1.4]} />
            <meshStandardMaterial color="#2d333b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Dual Welded Beams Workpiece */}
          <mesh position={[0.2, 0.25, 0]} castShadow>
            <boxGeometry args={[0.9, 0.1, 0.2]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      )}

      {config.id === 'assembly' && (
        <group position={[0, 1.8, 0]}>
          {/* Heavy Double-Column Press Frame */}
          {[-0.8, 0.8].map((colX, i) => (
            <mesh key={`col-${i}`} position={[colX, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 1.4, 16]} />
              <meshStandardMaterial color="#d1d8e0" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Top Hydraulic Crown Crosshead */}
          <mesh position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[2.0, 0.35, 1.0]} />
            <meshStandardMaterial color="#2d333b" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Ram & Pick-and-Place Actuator with vertical press stroke */}
          <group ref={toolAnimRef} position={[0, 0.5, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.18, 0.18, 0.8, 16]} />
              <meshStandardMaterial color="#373e47" metalness={0.85} />
            </mesh>
            <mesh position={[0, -0.42, 0]} castShadow>
              <boxGeometry args={[0.7, 0.12, 0.7]} />
              <meshStandardMaterial color="#e67e22" metalness={0.8} />
            </mesh>
            {/* Gripper fingers */}
            {[-0.22, 0.22].map((fX, i) => (
              <mesh key={`f-${i}`} position={[fX, -0.52, 0]} castShadow>
                <boxGeometry args={[0.06, 0.12, 0.2]} />
                <meshStandardMaterial color="#d1d8e0" metalness={0.9} />
              </mesh>
            ))}
          </group>
          {/* Assembly Fixture Station & Parts Bin */}
          <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
            <boxGeometry args={[1.8, 0.16, 1.6]} />
            <meshStandardMaterial color="#1e2329" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.12, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
          </mesh>
        </group>
      )}

      {config.id === 'inspection' && (
        <group position={[0, 1.8, 0]}>
          {/* CMM / Laser Telecentric Scanning Tunnel Arch */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <torusGeometry args={[0.85, 0.12, 12, 32]} />
            <meshStandardMaterial color="#2d333b" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Sensor Scan Line Ring */}
          <mesh position={[0, 0.7, 0]}>
            <torusGeometry args={[0.83, 0.03, 8, 32]} />
            <meshStandardMaterial
              color={(!failed || isBackupActive) ? '#38bdf8' : '#731f1f'}
              emissive={(!failed || isBackupActive) ? '#38bdf8' : '#731f1f'}
              emissiveIntensity={1.5}
            />
          </mesh>
          {/* Optical sweep detector carriage */}
          <group ref={toolAnimRef} position={[0, 1.45, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.35, 0.15, 0.35]} />
              <meshStandardMaterial color="#e67e22" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.15, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.18, 12]} />
              <meshStandardMaterial color="#d1d8e0" metalness={0.9} />
            </mesh>
            {/* Telecentric Scanner beam onto inspection part */}
            {(!failed || isBackupActive) && (
              <pointLight position={[0, -0.4, 0]} color="#38bdf8" intensity={2.0} distance={1.8} />
            )}
          </group>
          {/* Precision Optical Flat Inspection Platform */}
          <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
            <cylinderGeometry args={[0.7, 0.75, 0.2, 24]} />
            <meshStandardMaterial color="#1e2329" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Finished Calibrated Workpiece */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.4, 0.16, 0.4]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* ── Industrial Stack Beacon Tower with Strobe ── */}
      <group position={[1.1, 2.1, 1.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
          <meshStandardMaterial color="#1c2126" metalness={0.9} />
        </mesh>
        {/* Beacon lens */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.24, 16]} />
          <meshStandardMaterial
            color={failed ? (isBackupActive ? '#38bdf8' : '#ef4444') : '#22c55e'}
            emissive={failed ? (isBackupActive ? '#38bdf8' : '#ef4444') : '#22c55e'}
            emissiveIntensity={failed && !isBackupActive ? 2.2 : 1.4}
            roughness={0.2}
          />
        </mesh>
        <pointLight
          ref={beaconLightRef}
          position={[0, 0.45, 0]}
          color={failed ? (isBackupActive ? '#38bdf8' : '#ef4444') : '#22c55e'}
          intensity={1.2}
          distance={4.5}
        />
      </group>

      {/* ── In-Viewport Diagnostic Billboard Overlay ── */}
      <Html
        position={[0, 2.7, 0]}
        center
        distanceFactor={18}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          padding: '2px 7px',
          background: 'rgba(18, 22, 26, 0.88)',
          border: `1px solid ${isSelected ? '#e67e22' : 'var(--border-default, #373e47)'}`,
          borderLeft: `3px solid ${statusBadgeColor}`,
          borderRadius: 3,
          backdropFilter: 'blur(4px)',
          fontFamily: 'monospace',
          fontSize: '9px',
          whiteSpace: 'nowrap',
          color: '#e2e8f0',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontWeight: 700, color: isSelected ? '#e67e22' : '#cbd5e1' }}>
            {config.name.toUpperCase()}
          </span>
          <span style={{
            background: statusBadgeBg,
            color: statusBadgeColor,
            fontWeight: 800,
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: 2,
          }}>
            {statusBadgeText}
          </span>
        </div>
      </Html>
    </group>
  );
}

/* ─── Architectural Factory Floor with Depth, Perspective & Corridor Axis ─── */
export function FactoryFloor() {
  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Steel Concrete Substrate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[80, 50]} />
        <meshStandardMaterial color="#14181c" metalness={0.25} roughness={0.7} />
      </mesh>

      {/* Primary Engineering Grid (2m cells with steel-grey line hierarchy) */}
      <gridHelper args={[64, 32, '#485461', '#1f252c']} position={[0, 0.005, -3]} />

      {/* Machine Corridor Visual Baseline Strip */}
      <mesh position={[0, 0.008, -3]} receiveShadow>
        <boxGeometry args={[26, 0.002, 0.08]} />
        <meshBasicMaterial color="#e67e22" opacity={0.35} transparent />
      </mesh>

      {/* Safety Demarcation Lines in front of stations */}
      <mesh position={[0, 0.008, -1.1]} receiveShadow>
        <boxGeometry args={[26, 0.002, 0.06]} />
        <meshBasicMaterial color="#373e47" opacity={0.7} transparent />
      </mesh>

      {/* Machine Perimeter Protection Curb */}
      <mesh position={[0, 0.15, -14]} receiveShadow castShadow>
        <boxGeometry args={[68, 0.3, 0.3]} />
        <meshStandardMaterial color="#22272e" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ─── Structural Overhead Crane / Lighting Gantry ─── */
export function CeilingTruss() {
  const bayColumns = [-10, -4, 2, 8];
  return (
    <group position={[0, 7.8, -3]}>
      {/* Longitudinal Main Gantry I-Beams */}
      {[-4, 4].map((zPos, idx) => (
        <mesh key={`beam-${idx}`} position={[0, 0, zPos]}>
          <boxGeometry args={[32, 0.24, 0.24]} />
          <meshStandardMaterial color="#24292e" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}

      {/* Cross Spars & High-Bay Industrial Downlights */}
      {bayColumns.map((xPos, idx) => (
        <group key={`bay-${idx}`} position={[xPos, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.22, 0.22, 8]} />
            <meshStandardMaterial color="#24292e" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Recessed High-Bay Luminaire Housing */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.26, 0.2, 0.24, 12]} />
            <meshStandardMaterial color="#373e47" metalness={0.9} />
          </mesh>
          {/* Spot Fill illuminating workstation surface */}
          <pointLight
            position={[0, -0.55, 0]}
            color="#f8fafc"
            intensity={6.0}
            distance={18}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}

/* ─── Industrial Exhaust Vapour ─── */
export function SteamEffect({ position, failed, isBackupActive }) {
  const meshRef = useRef();
  const speed = useRef(Math.random() * 0.25 + 0.2);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime() * speed.current;
      meshRef.current.position.y = position[1] + ((t * 0.5) % 2.0);
      meshRef.current.material.opacity = Math.max(0, 0.16 - ((t * 0.5) % 2.0) * 0.08);
      meshRef.current.scale.setScalar(1 + ((t * 0.5) % 2.0) * 0.4);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshStandardMaterial
        color={failed ? (isBackupActive ? '#38bdf8' : '#731f1f') : '#94a3b8'}
        transparent
        opacity={0.14}
        roughness={0.9}
      />
    </mesh>
  );
}
