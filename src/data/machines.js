/**
 * KEYSTONE — Machine Station Definitions
 *
 * capacityPerMin: maximum units this station can process per minute
 *                 under normal operating conditions.
 * backupCapacityPerMin: maximum units this station can process when
 *                       its backup machine is engaged.
 * defaultBackupEnabled: initial default toggle for backup readiness.
 *
 * (Example values for simulation only — not calibrated to real machinery.)
 *
 * Production line order (index 0 → 3):
 *   Cutting → Welding → Assembly → Inspection
 */
export const MACHINE_CONFIGS = [
  {
    id: 'cutting',
    name: 'Cutting Station',
    position: [-9, 0, -3],
    color: '#00bcd4',
    icon: '✂',
    description: 'Precision laser cutting',
    capacity: 87,               // UI visual load %
    capacityPerMin: 120,        // units/min — primary
    backupCapacityPerMin: 70,   // units/min — backup
    defaultBackupEnabled: true, // backup machine on standby
  },
  {
    id: 'welding',
    name: 'Welding Station',
    position: [-3, 0, -3],
    color: '#00bcd4',
    icon: '🔥',
    description: 'Automated arc welding',
    capacity: 92,
    capacityPerMin: 95,         // natural baseline bottleneck
    backupCapacityPerMin: 60,
    defaultBackupEnabled: true,
  },
  {
    id: 'assembly',
    name: 'Assembly Station',
    position: [3, 0, -3],
    color: '#00bcd4',
    icon: '⚙',
    description: 'Robotic assembly',
    capacity: 78,
    capacityPerMin: 110,
    backupCapacityPerMin: 50,
    defaultBackupEnabled: false,
  },
  {
    id: 'inspection',
    name: 'Inspection Station',
    position: [9, 0, -3],
    color: '#00bcd4',
    icon: '🔍',
    description: 'Quality inspection',
    capacity: 95,
    capacityPerMin: 130,
    backupCapacityPerMin: 80,
    defaultBackupEnabled: false,
  },
];
