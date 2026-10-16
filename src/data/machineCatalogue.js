/**
 * KEYSTONE — Industrial Machine Catalogue (MVP Demo)
 *
 * Data Integrity & Verification Disclaimer:
 * ---------------------------------------------------------------------------
 * Prices and technical specifications below are INDICATIVE / ILLUSTRATIVE
 * based on general industrial equipment market ranges in India (INR).
 * They do NOT represent formal manufacturer quotations or certified throughput.
 * Actual line throughput in industrial practice depends on workpiece material,
 * geometry, thickness, tool wear, and operator cycle times.
 * ---------------------------------------------------------------------------
 */

export const MACHINE_CATALOGUE = [
  // ── Station 1: Cutting ────────────────────────────────────────────────
  {
    id: 'opticut_3015',
    name: 'OptiCut 3015 Fiber Laser (3kW)',
    category: 'cutting',
    categoryName: 'Cutting Station',
    badge: 'High Precision',
    priceInr: '₹38,50,000',
    priceNumeric: 3850000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Laser Source': '3000W Fiber Resonator',
      'Working Bed': '3000 × 1500 mm dual pallet',
      'Positioning Accuracy': '±0.03 mm/m',
      'Max Acceleration': '1.2G',
      'Assist Gases': 'Oxygen / Nitrogen / Compressed Air',
      'Sheet Thickness (Steel)': 'Up to 20 mm mild steel',
    },
    notes: 'Indicative price for standard CNC fiber laser gantry system. Production rate depends on sheet gauge and cut path complexity.',
  },
  {
    id: 'apex_plasmacut_1530',
    name: 'Apex PlasmaCut HD 1530 (130A)',
    category: 'cutting',
    categoryName: 'Cutting Station',
    badge: 'Budget Heavy Plate',
    priceInr: '₹14,80,000',
    priceNumeric: 1480000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Power Source': '130A High-Definition Plasma',
      'Bed Dimensions': '3000 × 1500 mm water table',
      'Positioning Accuracy': '±0.15 mm/m',
      'Max Traverse': '18 m/min',
      'Consumable Life': 'Approx. 800 pierce cycles',
      'Sheet Thickness (Steel)': 'Up to 25 mm pierce',
    },
    notes: 'Cost-effective alternative for medium-to-heavy plate. Greater kerf angle and edge slag compared to fiber laser.',
  },

  // ── Station 2: Welding ────────────────────────────────────────────────
  {
    id: 'arcmaster_mig500',
    name: 'ArcMaster MIG-500 Pulse System',
    category: 'welding',
    categoryName: 'Welding Station',
    badge: 'Reliable Workhorse',
    priceInr: '₹12,40,000',
    priceNumeric: 1240000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Welding Process': 'Synergic Pulsed MIG/MAG / FCAW',
      'Output Current': '500A @ 60% duty cycle, 387A @ 100%',
      'Wire Feed Speed': '1.5 – 22 m/min (4-roll drive)',
      'Fixture Type': 'Pneumatic toggle clamping bench',
      'Fume Extraction': 'Integrated source capture hood',
      'Shielding Gas': 'Ar / CO2 mixture (82/18)',
    },
    notes: 'Indicative price includes power supply, torch cooler, wire feeder, and basic pneumatic clamping fixture. Operator-guided loading.',
  },
  {
    id: 'roboweld_cell_10kg',
    name: 'RoboWeld 6-Axis Robotic Cell (10kg)',
    category: 'welding',
    categoryName: 'Welding Station',
    badge: 'Automated Robotic',
    priceInr: '₹34,50,000',
    priceNumeric: 3450000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Articulated Arm': '6-Axis Industrial Robot (10 kg payload)',
      'Working Reach': '1,440 mm spherical radius',
      'Repeatability': '±0.04 mm',
      'Seam Tracking': 'Optical laser arc seam sensor',
      'Safety System': 'Interlocked optical light curtain cage',
      'Positioner': 'Single-axis rotary indexing table',
    },
    notes: 'Full turnkey robotic enclosure with safety interlocks. Higher initial capital with continuous non-stop automated seam execution.',
  },

  // ── Station 3: Assembly ───────────────────────────────────────────────
  {
    id: 'pneufast_bench',
    name: 'PneuFast Multi-Torque Fastening Bench',
    category: 'assembly',
    categoryName: 'Assembly Station',
    badge: 'Ergonomic Manual+',
    priceInr: '₹8,50,000',
    priceNumeric: 850000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Torque Tools': '2× Brushless DC Electric Drivers (1–12 Nm)',
      'Torque Accuracy': '±2.5% ISO 5393 calibrated',
      'Poka-Yoke': 'Pick-to-light component bins + screw counter',
      'Worktable': 'Anodized aluminum with ESD matting',
      'Pneumatics': 'SMC air preparation + dual press cylinder (5 kN)',
    },
    notes: 'Operator station with error-proofing controls (poka-yoke). Throughput is governed by operator dexterity and batch size.',
  },
  {
    id: 'flexcell_scara_6kg',
    name: 'FlexCell SCARA Robotic Assembler (6kg)',
    category: 'assembly',
    categoryName: 'Assembly Station',
    badge: 'High-Speed Automated',
    priceInr: '₹23,80,000',
    priceNumeric: 2380000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Kinematics': '4-Axis SCARA Industrial Robot',
      'Arm Reach': '600 mm reach / 200 mm Z-stroke',
      'Payload': '6 kg rated payload',
      'Standard Cycle': '0.42 s per pick-and-place cycle',
      'Repeatability': '±0.015 mm (X-Y), ±0.01 mm (Z)',
      'Part Feeder': 'Integrated vibratory bowl + linear track',
    },
    notes: 'Fully automated fastener insertion and placement. Requires standardized part presentation from upstream feeding equipment.',
  },

  // ── Station 4: Inspection ─────────────────────────────────────────────
  {
    id: 'visionscan_2d',
    name: 'VisionScan 2D Telecentric Optical Station',
    category: 'inspection',
    categoryName: 'Inspection Station',
    badge: '100% In-Line High Speed',
    priceInr: '₹16,20,000',
    priceNumeric: 1620000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Camera': '20 Megapixel High-Speed CMOS Area Scan',
      'Optics': 'Bilateral Telecentric Lens (zero parallax)',
      'Field of View': '220 × 180 mm',
      'Measurement Accuracy': '±2.0 µm feature repeatability',
      'Lighting': 'Multi-angle programmable dome LED ring',
      'Inspection Time': '< 350 ms per image evaluation',
    },
    notes: 'Designed for 100% in-line dimensional verification and defect inspection directly on moving parts without contact.',
  },
  {
    id: 'acupoint_cmm_3d',
    name: 'AcuPoint 3D Bridge CMM Station',
    category: 'inspection',
    categoryName: 'Inspection Station',
    badge: 'Metrology Lab Grade',
    priceInr: '₹28,50,000',
    priceNumeric: 2850000,
    priceType: 'indicative',
    sourceUrl: null,
    sourceStatus: 'unverified_indicative',
    verificationLabel: 'Illustrative Market Benchmark',
    specs: {
      'Architecture': 'Air-bearing granite bridge design',
      'Measuring Volume': '600 × 800 × 500 mm (X/Y/Z)',
      'Probe System': 'Renishaw 5-Axis motorized indexing touch-trigger',
      'Accuracy (MPEE)': '1.9 + L/350 µm (ISO 10360-2)',
      'Temperature': 'Active thermal compensation sensors',
    },
    notes: 'High-precision coordinate measuring machine. Typically utilized for statistical quality control sampling rather than 100% continuous line pace.',
  },
];

/**
 * Default initial machinery selection mapping to the 4 stations.
 */
export const DEFAULT_CATALOGUE_SELECTIONS = {
  cutting: 'opticut_3015',
  welding: 'arcmaster_mig500',
  assembly: 'pneufast_bench',
  inspection: 'visionscan_2d',
};

export function getMachinesByCategory(category) {
  return MACHINE_CATALOGUE.filter((m) => m.category === category);
}

export function getMachineById(id) {
  return MACHINE_CATALOGUE.find((m) => m.id === id) || null;
}

export function calculateTotalEstimate(selections) {
  return Object.values(selections).reduce((acc, machineId) => {
    const machine = getMachineById(machineId);
    return acc + (machine ? machine.priceNumeric : 0);
  }, 0);
}

export function formatInrCurrency(amount) {
  if (typeof amount !== 'number') return '₹0';
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2);
    return `₹${cr} Crore`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(2);
    return `₹${lk} Lakhs`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
