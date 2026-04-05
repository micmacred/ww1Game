/**
 * Central tuning surface for Skies of the Great War.
 *
 * Every balance-affecting constant lives here so that theatre-level
 * modifiers can adjust campaign behaviour without touching internals.
 */

export interface GameConfig {
  // ── Pulse timing ────────────────────────────────────────────────
  /** Seconds per sub-pulse (default 30) */
  subPulseSec: number;
  /** Number of sub-pulses per major pulse (default 6) */
  numPulses: number;
  /** Major push every N sub-pulses (default 3) */
  majorEvery: number;

  // ── Front ───────────────────────────────────────────────────────
  /** Number of front-line segments (default 6) */
  numSegments: number;
  /** Maximum positional value per segment (default 8) */
  maxPosition: number;

  // ── Resources ───────────────────────────────────────────────────
  /** Total resource pool available across the front */
  totalResources: { manpower: number; equipment: number; food: number };
  /** Starting reserves before allocation (default 6 each) */
  defaultReserves: { manpower: number; equipment: number; food: number };
  /** Default per-segment allocation (default 2 each) */
  defaultPerSegment: { manpower: number; equipment: number; food: number };
  /** Relative weight of each resource in composite strength */
  resourceWeights: { manpower: number; equipment: number; food: number };

  // ── Aircraft ────────────────────────────────────────────────────
  /** Starting aircraft counts by mission type */
  aircraftStart: { dogfight: number; bombing: number; recon: number };
  /** Multiplier bonus applied while air missions are active */
  airBonus: { dogfight: number; bombing: number; recon: number };
  /** Per-pulse attrition probability by mission type and pulse class */
  attritionRisk: {
    dogfight: { sub: number; major: number };
    bombing: { sub: number; major: number };
    recon: { sub: number; major: number };
  };

  // ── Scoring ─────────────────────────────────────────────────────
  /** Points awarded per net position held */
  positionPoints: number;
  /** Bonus points for controlling an entire segment */
  segmentBonus: number;

  // ── Theatre (placeholders) ──────────────────────────────────────
  /**
   * Fraction of surplus resources converted to baseline each turn.
   * Critical balance knob — controls how fast advantage snowballs.
   */
  surplusToBaselineRatio: number;
}

// ── Defaults ────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: GameConfig = {
  // Pulse timing
  subPulseSec: 30,
  numPulses: 6,
  majorEvery: 3,

  // Front
  numSegments: 6,
  maxPosition: 8,

  // Resources
  totalResources: { manpower: 18, equipment: 18, food: 18 },
  defaultReserves: { manpower: 6, equipment: 6, food: 6 },
  defaultPerSegment: { manpower: 2, equipment: 2, food: 2 },
  resourceWeights: { manpower: 0.4, equipment: 0.3, food: 0.3 },

  // Aircraft
  aircraftStart: { dogfight: 4, bombing: 3, recon: 3 },
  airBonus: { dogfight: 1.5, bombing: 1.2, recon: 0.8 },
  attritionRisk: {
    dogfight: { sub: 0.22, major: 0.38 },
    bombing: { sub: 0.15, major: 0.28 },
    recon: { sub: 0.10, major: 0.20 },
  },

  // Scoring
  positionPoints: 12,
  segmentBonus: 8,

  // Theatre
  surplusToBaselineRatio: 0.3,
};
