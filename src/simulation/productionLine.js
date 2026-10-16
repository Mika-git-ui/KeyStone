/**
 * KEYSTONE — Production Line Simulation Engine
 * Stage 3C: Deterministic bottleneck model with backup support
 *
 * Model assumptions (clearly labelled as estimates):
 *  - Stations are sequential: Cutting → Welding → Assembly → Inspection
 *  - For each station:
 *      * If operational: effective capacity = capacityPerMin.
 *      * If failed:
 *          - If backupEnabled && backupCapacityPerMin > 0: effective capacity = backupCapacityPerMin.
 *          - Otherwise: effective capacity = 0.
 *  - Line throughput = min(effective capacity) across all stations.
 *  - A station with 0 effective capacity brings sequential throughput to 0.
 *  - Results are *estimates* for simulation purposes only.
 */

/**
 * Compute the full simulation snapshot from the current machine states and backup settings.
 *
 * @param {Array}  machines       - MACHINE_CONFIGS array
 * @param {Object} machineStates  - { [id]: boolean } — true = failed
 * @param {Object} [backupStates] - { [id]: boolean } — true = backup enabled
 * @returns {SimSnapshot}
 */
export function computeSimulation(machines, machineStates, backupStates = {}) {
  // Baseline: throughput when every station is operational on primary capacity
  const baselineThroughput = Math.min(...machines.map((m) => m.capacityPerMin));

  // Identify operational, failed, and backup status for each station
  const operational = machines.filter((m) => !machineStates[m.id]);
  const failed = machines.filter((m) => machineStates[m.id]);

  const effectiveCapacities = {};
  const backupsActivated = [];

  machines.forEach((m) => {
    const isFailed = !!machineStates[m.id];
    const isBackupEnabled = backupStates[m.id] !== undefined
      ? backupStates[m.id]
      : !!m.defaultBackupEnabled;

    if (!isFailed) {
      effectiveCapacities[m.id] = m.capacityPerMin;
    } else {
      if (isBackupEnabled && (m.backupCapacityPerMin || 0) > 0) {
        effectiveCapacities[m.id] = m.backupCapacityPerMin;
        backupsActivated.push({
          id: m.id,
          name: m.name,
          backupCapacityPerMin: m.backupCapacityPerMin,
        });
      } else {
        effectiveCapacities[m.id] = 0;
      }
    }
  });

  // Current throughput is the bottleneck across all effective capacities
  const currentThroughput = Math.min(...Object.values(effectiveCapacities));

  // Find bottleneck station among all stations
  const bottleneckEntry = Object.entries(effectiveCapacities).reduce(
    (min, [id, cap]) => (cap < min.cap ? { id, cap } : min),
    { id: null, cap: Infinity }
  );

  // Loss metrics
  const unitsLostPerMin = Math.max(0, baselineThroughput - currentThroughput);
  const productionLossPct =
    baselineThroughput > 0
      ? Math.round((unitsLostPerMin / baselineThroughput) * 100)
      : 0;

  // Per-station contribution for UI
  const stationStats = machines.map((m) => {
    const isFailed = !!machineStates[m.id];
    const isBackupEnabled = backupStates[m.id] !== undefined
      ? backupStates[m.id]
      : !!m.defaultBackupEnabled;
    const isBackupActive = isFailed && isBackupEnabled && (m.backupCapacityPerMin || 0) > 0;

    return {
      id: m.id,
      isFailed,
      isBackupEnabled,
      isBackupActive,
      capacityPerMin: m.capacityPerMin,
      backupCapacityPerMin: m.backupCapacityPerMin || 0,
      effectiveCapacity: effectiveCapacities[m.id],
      isBottleneck: bottleneckEntry.id === m.id,
    };
  });

  return {
    baselineThroughput,       // units/min — all stations up on primary
    currentThroughput,        // units/min — right now
    unitsLostPerMin,          // units/min lost
    productionLossPct,        // 0-100 %
    failedCount: failed.length,
    operationalCount: operational.length,
    backupsActivated,
    bottleneckId: bottleneckEntry.id,
    stationStats,
    lineDown: currentThroughput === 0 && failed.length > 0,
    hasFailures: failed.length > 0,
  };
}
