# Design: Phase 1 — Theatre Map

> Date: 2026-04-12
> Phase: 1 of 8 (from docs/ROADMAP.md)
> Chainlink issue: #83

## Overview

Build a playable theatre layer where the player manages an 8-sector Western Front.
Each turn: review the map, allocate surplus resources, choose one sector to fight
personally (handed off to campaign in Phase 2), auto-resolve the other 7, view
narrative results, check win conditions. Theatre state persists to localStorage.

**UI approach (per Michael):** Hybrid diegetic — the mockup spec's visual layout
(parchment map + walnut table edge with five objects), parchment aesthetic applied,
but interactions simplified. Wax seal is a styled button, brass dials are styled +/-
controls. Objects exist visually but don't need physics.

**Win conditions (per Michael):** Industrial strangulation only for now. Capital
capture deferred to playtesting.

**Key constraint:** No time pressure at the theatre level. No timers, no phase
budgets. The player advances when they choose.

### Adversarial Review Fixes (2026-04-12)

The following issues were found in adversarial review and addressed in this revision:
- C1: Use `ResourceType` consistently (not `keyof Resources`)
- C2: Explicitly remove old `Sector` export, replace with `SectorState`
- C3: Document array↔Record conversion in save/load
- C4: **Add surplus pool computation formula** (the core economic formula was missing)
- S1: Baseline recomputed on load regardless of saved value
- S2: Document turn-1 special case
- S3: Define contested sector baseline formula
- S4: Define control state transition thresholds
- S5: Add `revertToAllocate` action for bidirectional allocate↔select
- S6: Document array↔Record conversion in persistence
- S7: Specify front line path algorithm
- S8: Extract `RandomSource` to shared module

---

## Implementation Units

### Unit 1: Theatre Types

**File**: `src/types/theatre.ts` (replace existing placeholder)

```typescript
import type { Resources, ResourceType } from './campaign';

// ── Sector identification ────────────────────────────────────
export const SECTOR_IDS = [
  'flandres', 'artois', 'picardie', 'champagne',
  'verdun', 'lorraine', 'vosges', 'alsace',
] as const;
export type SectorId = (typeof SECTOR_IDS)[number];

// ── Static sector data (loaded from theatre-map.ts) ──────────
export interface SectorDefinition {
  id: SectorId;
  name: string;                    // "Flandres"
  displayName: string;             // "Secteur de Flandres"
  polygon: [number, number][];     // SVG points, 1024×520 map area
  centroid: [number, number];      // Block cluster placement
  adjacentTo: SectorId[];
  generators: Resources;           // Per-turn resource generation
}

// ── Runtime sector state ─────────────────────────────────────
export interface SectorState {
  id: SectorId;
  control: 'player' | 'enemy' | 'contested';
  baseline: Resources;             // Auto-assigned from generators
  allocated: Resources;            // Surplus the player added
  enemyStrength: number;           // AI's committed strength (2.0–5.0)
  frontPosition: number;           // -8 to +8 (same scale as campaign)
  lastResult: SectorTurnResult | null;
}

export interface SectorTurnResult {
  outcome: 'held' | 'lost-ground' | 'gained-ground' | 'critical';
  frontMovement: number;
  decidingResource: ResourceType;
  decidingReason: string;
}

// ── Dispatches ───────────────────────────────────────────────
export type DispatchCategory = 'held' | 'lost-ground' | 'gained-ground' | 'critical';

export interface TheatreDispatch {
  id: string;                      // Unique ID for React keys
  sectorId: SectorId;
  category: DispatchCategory;
  text: string;
  isCritical: boolean;
  isRead: boolean;
  isWarCorrespondent: boolean;     // Chosen sector's special dispatch
  turn: number;
}

// ── Turn phases ──────────────────────────────────────────────
export type TheatreTurnPhase =
  | 'review'     // Examen
  | 'allocate'   // Allocation
  | 'select'     // Sélection
  | 'resolve'    // Résolution
  | 'update';    // Bilan

export const PHASE_DISPLAY: Record<TheatreTurnPhase, string> = {
  review: 'Examen',
  allocate: 'Allocation',
  select: 'Sélection',
  resolve: 'Résolution',
  update: 'Bilan',
};

// ── Seal (advance-turn) states ───────────────────────────────
export type SealState =
  | { enabled: true; label: string }
  | { enabled: false; label: string; reason: 'critical-unread' | 'no-sector-chosen' };

// ── Save state ───────────────────────────────────────────────
export interface TheatreSaveState {
  version: 1;
  turn: number;
  sectors: SectorState[];
  dispatches: TheatreDispatch[];
  surplusPool: Resources;
  chosenSector: SectorId | null;
  phase: TheatreTurnPhase;
  industrialHealth: { player: number; enemy: number };
}
```

**Implementation Notes**:
- `SectorId` is a string union derived from `SECTOR_IDS` const array — single source of truth
- `SectorState.baseline` is computed from generators each turn, not stored permanently.
  **On load from save, baseline is always recomputed** regardless of saved value (forward compat).
- `SectorState.allocated` is what the player distributes from the surplus pool
- Total strength for a sector = `baseline + allocated` (fed into auto-resolve as Resources)
- **Store migration:** The old `TheatreSlice` used `sectors: Sector[]` (array). The new
  slice uses `sectors: Record<SectorId, SectorState>` (object). This is a breaking change.
  No production code outside `theatreSlice.ts` consumes this field (layer stubs don't read it).
  Save state uses `SectorState[]` (array for clean JSON); load converts to Record, save converts back.
- **Control state thresholds:** `frontPosition >= 6` → `player`, `<= -6` → `enemy`, otherwise
  `contested`. `applyResults` must update the `control` field when these thresholds are crossed.

**Acceptance Criteria**:
- [ ] All 8 sector IDs are defined
- [ ] `SectorState` captures resources, control, front position, and last result
- [ ] `TheatreDispatch` has `isRead` and `isCritical` for lockout logic
- [ ] `TheatreSaveState` contains enough data to fully reconstruct game state
- [ ] No import of infrastructure modules (Ports & Adapters — types are pure domain)

---

### Unit 2: Theatre Map Data

**File**: `src/data/theatre-map.ts`

```typescript
import type { SectorDefinition, SectorId } from '../types/theatre';

export const THEATRE_SECTORS: Record<SectorId, SectorDefinition> = {
  flandres: {
    id: 'flandres',
    name: 'Flandres',
    displayName: 'Secteur de Flandres',
    polygon: [ /* 5-7 points approximating Flanders region */ ],
    centroid: [120, 140],
    adjacentTo: ['artois'],
    generators: { manpower: 4, equipment: 3, food: 3 },
  },
  artois: {
    id: 'artois',
    name: 'Artois',
    displayName: "Secteur d'Artois",
    polygon: [ /* ... */ ],
    centroid: [220, 180],
    adjacentTo: ['flandres', 'picardie'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
  picardie: {
    id: 'picardie',
    name: 'Picardie',
    displayName: 'Secteur de Picardie',
    polygon: [ /* ... */ ],
    centroid: [340, 220],
    adjacentTo: ['artois', 'champagne'],
    generators: { manpower: 3, equipment: 3, food: 4 },
  },
  champagne: {
    id: 'champagne',
    name: 'Champagne',
    displayName: 'Secteur de Champagne',
    polygon: [ /* ... */ ],
    centroid: [460, 260],
    adjacentTo: ['picardie', 'verdun'],
    generators: { manpower: 4, equipment: 3, food: 4 },
  },
  verdun: {
    id: 'verdun',
    name: 'Verdun',
    displayName: 'Secteur de Verdun',
    polygon: [ /* ... */ ],
    centroid: [560, 290],
    adjacentTo: ['champagne', 'lorraine'],
    generators: { manpower: 5, equipment: 4, food: 2 },
  },
  lorraine: {
    id: 'lorraine',
    name: 'Lorraine',
    displayName: 'Secteur de Lorraine',
    polygon: [ /* ... */ ],
    centroid: [670, 310],
    adjacentTo: ['verdun', 'vosges'],
    generators: { manpower: 3, equipment: 5, food: 3 },
  },
  vosges: {
    id: 'vosges',
    name: 'Vosges',
    displayName: 'Secteur des Vosges',
    polygon: [ /* ... */ ],
    centroid: [780, 350],
    adjacentTo: ['lorraine', 'alsace'],
    generators: { manpower: 2, equipment: 3, food: 4 },
  },
  alsace: {
    id: 'alsace',
    name: 'Alsace',
    displayName: "Secteur d'Alsace",
    polygon: [ /* ... */ ],
    centroid: [880, 400],
    adjacentTo: ['vosges'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
};

/** Ordered array for iteration (west to east, matching reveal order) */
export const SECTOR_ORDER: SectorId[] = [
  'flandres', 'artois', 'picardie', 'champagne',
  'verdun', 'lorraine', 'vosges', 'alsace',
];

/** Generate the SVG front line path from sector front positions */
export function generateFrontLinePath(
  sectors: Record<SectorId, { frontPosition: number }>,
): string;

/** Initial sector states for a new game */
export function createInitialSectors(): Record<SectorId, import('../types/theatre').SectorState>;
```

**Implementation Notes**:
- Polygon coordinates are approximate — they define the visual sector boundaries on the 1024×520 map area. The map is rotated ~30deg so the front runs roughly horizontal (matching period staff maps). Exact coords will need visual tuning.
- `generators` values are the per-turn resource generation. Verdun has high manpower (major garrison), Lorraine has high equipment (industrial). These are the first balance knobs to tune.
- `generateFrontLinePath` algorithm: each sector's centroid provides the x-coordinate anchor point. `frontPosition` maps to a y-offset via `PIXELS_PER_POSITION = 3` (i.e., ±24px max range for the ±8 position range — small movements, WWI pace). The 8 anchor points are smoothed with cubic Bezier curves (`C` command in SVG path) to create a natural meandering line. The path runs roughly horizontal across the 1024px width. Positive position = line shifts toward enemy territory (up on the map), negative = toward player territory (down).
- `createInitialSectors` sets all sectors to `contested`, `frontPosition: 0`, random `enemyStrength` (2.5–4.5), empty allocations.

**Surplus Pool Computation Formula (C4 fix — the core economic formula):**

This is the game's primary balance knob, configured via `GameConfig.surplusToBaselineRatio` (default 0.3).

```typescript
/**
 * Compute baseline and surplus for a new turn.
 *
 * Each sector generates resources from its generators, scaled by control:
 *   - player control: full generator output → player baseline
 *   - enemy control:  zero → player gets nothing
 *   - contested:      proportional to front position
 *     controlFraction = (frontPosition + MAX_POS) / (2 * MAX_POS)
 *     baseline = generators * controlFraction
 *
 * Total generation = sum of all sector baselines.
 * Surplus pool = total generation * surplusToBaselineRatio.
 * Each sector's baseline is reduced by (baseline * ratio) — that portion goes to the pool.
 * The player freely distributes the surplus pool across sectors.
 *
 * Example at default 0.3 ratio:
 *   Verdun generators: M=5, E=4, F=2. Contested at frontPosition=+2.
 *   controlFraction = (2 + 8) / 16 = 0.625
 *   rawBaseline = { M: 3.1, E: 2.5, F: 1.25 } (rounded to 1 decimal)
 *   baseline kept = rawBaseline * (1 - 0.3) = { M: 2.2, E: 1.8, F: 0.9 }
 *   contribution to surplus = rawBaseline * 0.3 = { M: 0.9, E: 0.8, F: 0.4 }
 *   (surplus contributions from all 8 sectors are summed into one pool)
 */
export function computeTurnEconomics(
  sectors: Record<SectorId, SectorState>,
  config: { surplusToBaselineRatio: number; maxPosition: number },
): {
  baselines: Record<SectorId, Resources>;
  surplusPool: Resources;
};
```

**Turn 1 special case (S2 fix):** All sectors start `contested` at `frontPosition: 0`,
so `controlFraction = 0.5` — each sector generates half its capacity. The surplus pool
starts from these half-generators. Dispatch stack starts empty. The first Examen phase
has nothing to review — the seal immediately reads "Commencer Allocation".

**Acceptance Criteria**:
- [ ] All 8 sectors defined with generators, adjacency, centroids
- [ ] `SECTOR_ORDER` matches west-to-east geographic order
- [ ] `createInitialSectors` produces valid `SectorState` for all 8 sectors
- [ ] `generateFrontLinePath` returns a valid SVG path `d` string

---

### Unit 3: Theatre Palette

**File**: `src/shared/theatre-palette.ts`

```typescript
/** Theatre layer colour palette — parchment cartographic style */
export const THEATRE = {
  // Parchment surface
  parchment: '#F5E6D3',
  parchmentFold: '#E8D5B7',
  ink: '#2C1810',
  fadedInk: '#B8A890',
  dimInk: '#5C5040',

  // Territory washes (semi-transparent in use)
  alliedWash: '#B8C8D8',
  enemyWash: '#D8B8B8',

  // Wooden blocks & tokens
  manpowerBlock: '#7b3f00',
  equipmentToken: '#1a3c5e',
  foodToken: '#2d5a1b',
  blockBevel: '#8B7355',
  blockShadow: 'rgba(44,24,16,0.4)',

  // Selection & glow (warm lamp-light, NEVER blue)
  sectorGlow: 'rgba(180,140,80,0.6)',
  sealGlowBright: '#A8916A',
  sealGlowDim: '#5C5040',

  // Table edge
  walnut: '#3D2817',
  brassRail: '#8B7355',
  leatherBlotter: '#4A3728',
  dispatchPaper: '#F0E8D8',
  criticalSeal: '#8B3A3A',

  // Strength indicators (reuse from shared/resources.ts)
  strengthGood: '#2d6a2d',
  strengthLow: '#b7770d',
  strengthCritical: '#c0392b',

  // Grid overlay
  gridLine: 'rgba(44,24,16,0.08)',
} as const;

export type TheatreColour = typeof THEATRE;
```

**Implementation Notes**:
- These constants come directly from the approved mockup spec §6 palette table
- Reuses existing `LEVEL_COL` values from `src/shared/resources.ts` for strength indicators
- `sectorGlow` is always warm lamp-light — the spec is explicit that blue digital highlighting is forbidden

**Acceptance Criteria**:
- [ ] All hex values match the mockup spec §6 palette table
- [ ] No blue highlight colours anywhere
- [ ] Exported as a single `THEATRE` const (single source of truth for the layer's palette)

---

### Unit 4: Auto-Resolve Logic

**File**: `src/layers/theatre/auto-resolve.ts`

```typescript
import type { SectorState, SectorTurnResult, SectorId } from '../../types/theatre';
import type { Resources } from '../../types/campaign';

// RandomSource imported from src/shared/random.ts (shared port — see below)

/**
 * Compute the total strength of a sector's resources.
 * Reuses the same weight formula as campaign: M*0.4 + E*0.3 + F*0.3
 */
export function sectorStrength(baseline: Resources, allocated: Resources): number;

/**
 * Auto-resolve a single unattended sector.
 * Returns the outcome, front movement, and deciding factor.
 *
 * The formula mirrors campaign's rollSegment but with a WWI-pace cap:
 * max front movement is ±1 per turn (even on dominant results).
 * Critical outcomes (front moved ±1 AND total strength ratio > 2:1) trigger
 * the 'critical' category.
 */
export function autoResolveSector(
  sector: SectorState,
  rng?: RandomSource,
): SectorTurnResult;

/**
 * Auto-resolve all unattended sectors (everything except the chosen one).
 * Returns a map of sector ID to result.
 */
export function autoResolveAll(
  sectors: Record<SectorId, SectorState>,
  chosenSector: SectorId,
  rng?: RandomSource,
): Record<SectorId, SectorTurnResult>;

/**
 * Apply auto-resolve results to sector states.
 * Mutates nothing — returns new sector states.
 */
export function applyResults(
  sectors: Record<SectorId, SectorState>,
  results: Record<SectorId, SectorTurnResult>,
): Record<SectorId, SectorState>;
```

**Implementation Notes**:
- `autoResolveSector` uses the same weighted-roll approach as `rollSegment` in `src/shared/helpers.ts`, but with a hard cap of ±1 front movement per turn (WWI pace constraint). The `amount` field in `SectorTurnResult.frontMovement` is always -1, 0, or +1.
- Critical detection: if the front moved AND the strength ratio between sides exceeds 2:1, mark as `critical`. This triggers the red wax seal on the dispatch.
- `RandomSource` port allows deterministic testing. Default falls through to `Math.random()`.
- The deciding factor uses `RES_WEIGHT` to identify which resource contributed most/least (same logic as `decidingFactor` in helpers.ts).

**Acceptance Criteria**:
- [ ] Front movement is capped at ±1 (WWI pace)
- [ ] Critical outcomes are detected when strength ratio > 2:1
- [ ] Results with deterministic `RandomSource` are reproducible
- [ ] `applyResults` returns new state, does not mutate inputs
- [ ] Chosen sector is excluded from auto-resolve

---

### Unit 5: Dispatch Templates

**File**: `src/layers/theatre/dispatch-templates.ts`

```typescript
import type { SectorId, DispatchCategory, TheatreDispatch } from '../../types/theatre';
import type { SectorTurnResult } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';

// RandomSource imported from src/shared/random.ts

/**
 * Generate a narrative dispatch for a sector's auto-resolve result.
 * Avoids repeating templates within a 2-turn window.
 *
 * @param recentTemplateIds - template IDs used in the last 2 turns (for dedup)
 * @returns The dispatch and the template ID used (for tracking)
 */
export function generateDispatch(
  sectorId: SectorId,
  result: SectorTurnResult,
  turn: number,
  recentTemplateIds: Set<string>,
  rng?: RandomSource,
): { dispatch: TheatreDispatch; templateId: string };

/**
 * Generate a war correspondent dispatch for the player's chosen sector.
 * More elaborate than auto-resolve dispatches, referencing actual events.
 * Placeholder for Phase 2 integration — returns a generic template for now.
 */
export function generateWarCorrespondentDispatch(
  sectorId: SectorId,
  turn: number,
): TheatreDispatch;
```

**Implementation Notes**:
- Templates are stored as a const array per category, each with a unique ID and a template string containing `${sector}` for interpolation. At least 4 templates per category (held, lost-ground, gained-ground, critical).
- Template text comes directly from mockup spec §5 dispatch templates.
- The `recentTemplateIds` set prevents repetition: skip any template whose ID is in the set, fall back to any available if all are recent.
- War correspondent dispatch is a stub for Phase 1 — Phase 2 will fill it with actual campaign event data.
- Each dispatch gets a unique `id` via `crypto.randomUUID()` for React keys.

**Acceptance Criteria**:
- [ ] At least 4 templates per dispatch category
- [ ] Template text matches mockup spec §5
- [ ] No template repeats within a 2-turn window (given sufficient templates)
- [ ] Sector names are correctly interpolated
- [ ] Critical dispatches have `isCritical: true`

---

### Unit 6: Win Conditions

**File**: `src/layers/theatre/win-conditions.ts`

```typescript
import type { SectorState, SectorId } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';

export type GameOutcome =
  | { status: 'ongoing' }
  | { status: 'victory'; reason: string }
  | { status: 'defeat'; reason: string };

/**
 * Compute industrial capacity for both sides.
 * A sector's industrial output = its equipment generator value * control factor.
 * Control: 'player' = full output to player, 'enemy' = full to enemy,
 * 'contested' = split 50/50 based on front position.
 */
export function computeIndustrialCapacity(
  sectors: Record<SectorId, SectorState>,
): { player: number; enemy: number };

/**
 * Check if industrial strangulation has occurred.
 * Threshold: if one side's industrial capacity drops below 30% of the map total,
 * they lose. The 30% threshold is a tuning knob.
 */
export function checkWinCondition(
  sectors: Record<SectorId, SectorState>,
  strangulationThreshold?: number,
): GameOutcome;
```

**Implementation Notes**:
- Industrial capacity is derived from the `generators.equipment` values across all sectors, modified by control.
- For contested sectors, front position determines the split: `frontPosition > 0` = player has advantage, proportional to position/MAX_POS.
- The strangulation threshold defaults to 0.3 (30%). When either side's industrial capacity falls below this fraction of the total, that side loses.
- This is deliberately simple. Capital capture and other win conditions are deferred per Michael's decision.

**Acceptance Criteria**:
- [ ] Full player control = 100% of sector's equipment output to player
- [ ] Full enemy control = 100% to enemy
- [ ] Contested sectors split proportionally by front position
- [ ] Victory/defeat detected when capacity drops below threshold
- [ ] Returns 'ongoing' when no win condition is met

---

### Unit 7: Persistence

**File**: `src/layers/theatre/persistence.ts`

```typescript
import type { TheatreSaveState } from '../../types/theatre';

const SAVE_KEY = 'skies-theatre-save';

/** Port: injectable storage for testability */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Default production storage */
export const defaultStorage: StoragePort = localStorage;

/**
 * Save theatre state to storage.
 * Called automatically after each Bilan phase (commitment point 2).
 */
export function saveTheatreState(
  state: TheatreSaveState,
  storage?: StoragePort,
): void;

/**
 * Load theatre state from storage.
 * Returns null if no save exists or if the save is corrupt/incompatible.
 * Validates the version field before returning.
 */
export function loadTheatreState(
  storage?: StoragePort,
): TheatreSaveState | null;

/**
 * Delete save data (for "New Game" or testing).
 */
export function clearTheatreState(
  storage?: StoragePort,
): void;
```

**Implementation Notes**:
- JSON serialization/deserialization. `saveTheatreState` calls `JSON.stringify`, `loadTheatreState` calls `JSON.parse` with a try/catch for corruption.
- **Record↔Array conversion:** The store uses `Record<SectorId, SectorState>` for O(1) lookup. The save state uses `SectorState[]` for clean JSON. `saveTheatreState` converts Record→Array via `Object.values()`. `loadTheatreState` converts Array→Record by keying on `sector.id`. This conversion must be explicit in the implementation.
- **Baseline recomputation on load:** After loading, recompute `baseline` from generators and current `frontPosition`/`control`. Do not trust saved baseline values (forward compatibility).
- Version check: if the loaded `version` field doesn't match the current version (1), return null. This allows future migration.
- The `StoragePort` interface matches `window.localStorage`'s API surface exactly, so the default is just `localStorage` directly.
- Save happens at the Bilan→next-Examen transition (commitment point 2 per the mockup spec).

**Acceptance Criteria**:
- [ ] Save and load round-trip produces identical state
- [ ] Corrupt JSON returns null (no throw)
- [ ] Version mismatch returns null
- [ ] `clearTheatreState` removes the save key
- [ ] Works with injected mock storage (for tests)

---

### Unit 8: Theatre Store Slice

**File**: `src/store/theatreSlice.ts` (replace existing)

```typescript
import type { StateCreator } from 'zustand';
import type {
  SectorId, SectorState, TheatreTurnPhase, TheatreDispatch,
  SealState, TheatreSaveState,
} from '../types/theatre';
import type { Resources, ResourceType } from '../types/campaign';

export interface TheatreSlice {
  // ── State ────────────────────────────────────
  sectors: Record<SectorId, SectorState>;
  currentTurn: number;
  turnPhase: TheatreTurnPhase;
  surplusPool: Resources;
  chosenSector: SectorId | null;
  activeSector: SectorId | null;    // Which sector's folio is shown
  dispatches: TheatreDispatch[];
  revealIndex: number;              // Which sector is being revealed (-1 = not revealing)
  revealSpeed: 1 | 4;              // Normal or fast-forward
  industrialHealth: { player: number; enemy: number };
  recentTemplateIds: string[];     // Dispatch template dedup (last 2 turns)

  // ── Computed (derived in selectors) ──────────
  // sealState: SealState  — computed via selector, not stored

  // ── Actions ──────────────────────────────────
  /** Initialize a new game with fresh sectors */
  initTheatre: () => void;

  /** Restore from a save state */
  restoreTheatre: (save: TheatreSaveState) => void;

  /** Advance to the next turn phase */
  advancePhase: () => void;

  /** Allocate surplus to a sector (+1 of a resource type) */
  allocateSurplus: (sectorId: SectorId, resource: ResourceType, delta: 1 | -1) => void;

  /** Set which sector the player will personally command */
  chooseToFight: (sectorId: SectorId) => void;

  /** Revert from select back to allocate (bidirectional toggle per mockup spec) */
  revertToAllocate: () => void;

  /** Set which sector's folio is displayed */
  setActiveSector: (sectorId: SectorId) => void;

  /** Run auto-resolution for all unattended sectors */
  resolveUnattended: () => void;

  /** Advance the reveal sequence by one sector */
  advanceReveal: () => void;

  /** Set reveal speed (1 = normal, 4 = fast-forward on tap) */
  setRevealSpeed: (speed: 1 | 4) => void;

  /** Mark a dispatch as read */
  markDispatchRead: (dispatchId: string) => void;

  /** Begin next turn (refill surplus, reset allocations, auto-save) */
  beginNextTurn: () => void;
}

export const createTheatreSlice: StateCreator<TheatreSlice> = (set, get) => ({
  /* ... implementation ... */
});
```

**Selectors** (pure functions, not stored in state):

```typescript
import type { StoreState } from './index';
import type { SealState } from '../types/theatre';

/** Compute seal state from current phase and dispatch state */
export function selectSealState(state: StoreState): SealState;

/** Compute total resources for a sector (baseline + allocated) */
export function selectSectorResources(
  state: StoreState,
  sectorId: import('../types/theatre').SectorId,
): import('../types/campaign').Resources;

/** Check if any critical dispatches are unread */
export function selectHasUnreadCritical(state: StoreState): boolean;

/** Get the surplus remaining to allocate */
export function selectRemainingPool(state: StoreState): import('../types/campaign').Resources;
```

**Implementation Notes**:
- `sectors` is stored as `Record<SectorId, SectorState>` not an array — O(1) lookup by ID.
- `advancePhase` follows the mockup spec's phase flow: review → allocate → select → resolve → update. The resolve phase triggers `resolveUnattended` and starts the reveal sequence.
- `allocateSurplus` validates that the surplus pool has available resources and the sector's allocated doesn't exceed a per-sector cap (6 per resource type, matching campaign defaults).
- `resolveUnattended` calls the `autoResolveAll` function from Unit 4, then generates dispatches via Unit 5, stores results, and starts the reveal at `revealIndex: 0`.
- `beginNextTurn` calls `computeTurnEconomics` (Unit 2) with `GameConfig.surplusToBaselineRatio` and `GameConfig.maxPosition` to recompute baselines and surplus pool. Resets `allocated` on all sectors, clears the chosen sector, increments turn, prunes `recentTemplateIds` (keep only IDs from last 2 turns), saves to localStorage via `saveTheatreState`, and transitions to 'review'.
- `revertToAllocate` sets `turnPhase` to `'allocate'`, clears `chosenSector`, and resets the sector glow. Triggered when the player taps the supply tray or a sector's allocation control while in the 'select' phase (per mockup spec §4: "Allocation ↔ Sélection are reversible").
- Selectors are pure functions outside the slice, not methods — this follows Zustand best practices for derived state.

**Acceptance Criteria**:
- [ ] All state fields initialized correctly in `initTheatre`
- [ ] `allocateSurplus` refuses when pool is empty (scarcity through resistance)
- [ ] `advancePhase` follows the correct phase sequence
- [ ] `resolveUnattended` excludes the chosen sector
- [ ] `beginNextTurn` auto-saves to localStorage
- [ ] `selectSealState` returns correct lockout state for each phase

---

### Unit 9: SVG Theatre Map Component

**File**: `src/layers/theatre/TheatreMap.tsx`

```typescript
import type { SectorId, SectorState } from '../../types/theatre';

interface TheatreMapProps {
  sectors: Record<SectorId, SectorState>;
  activeSector: SectorId | null;
  chosenSector: SectorId | null;
  revealingSector: SectorId | null;   // Currently being revealed
  revealText: string | null;          // Pencil-mark deciding factor
  onSectorTap: (id: SectorId) => void;
}

export function TheatreMap(props: TheatreMapProps): JSX.Element;
```

**Internal structure:**
- Outer `<svg>` viewBox `0 0 1024 520`
- `<defs>` block with:
  - `feTurbulence` + `feDisplacementMap` filter chain for hand-drawn borders (1.5–2px displacement)
  - Parchment tiling `<pattern>` at `#F5E6D3` base
  - `feGaussianBlur` for watercolour wash edges
- Sector polygons as `<path>` elements with parchment fill, ink borders, territory wash overlays
- Front line as single `<path>` with `stroke-dasharray` animation capability
- Sector name labels in EB Garamond small caps 14pt
- Marginalia: compass rose (top-right), scale bar (bottom-left), header text (top-centre)
- Off-map capital wax-seal markers ("VERS PARIS", "VERS BERLIN")
- Wooden manpower blocks as absolutely-positioned DOM nodes overlaid on the SVG (CSS, not SVG, for independent animation)

**Implementation Notes**:
- The SVG filter chain (`feTurbulence` → `feDisplacementMap`) is defined once in `<defs>` and referenced by URL. This runs on the GPU and is performant if not re-triggered per frame.
- Territory washes use semi-transparent fills clipped to sector polygons with `feGaussianBlur` for bleed edges.
- The front line path is generated by `generateFrontLinePath` from Unit 2. When front positions change, the path transitions via `stroke-dasharray` + `stroke-dashoffset` animation over 800ms.
- Wooden blocks are CSS DOM nodes, not SVG elements — they sit in a positioned container overlaying the SVG. Each block is ~22×22pt with the bevel gradient and drop shadow from the mockup spec. Blocks cluster near sector centroids.
- Active sector gets warm lamp-light glow (`box-shadow: 0 0 12px rgba(180,140,80,0.6)`).
- Reveal pencil text uses the `pencilMark` CSS class with Architects Daughter font. **Note:** Architects Daughter must be added to the typography stack (new dependency: `@fontsource/architects-daughter`).
- Coordinate grid: faint lines at ~80pt spacing in `rgba(44,24,16,0.08)`.

**Acceptance Criteria**:
- [ ] All 8 sectors render with correct polygon shapes
- [ ] Territory control colours are visually distinct (allied blue wash vs enemy red wash)
- [ ] Front line renders as a smooth path through all sectors
- [ ] Tapping a sector fires `onSectorTap` with the correct sector ID
- [ ] Active sector has warm glow highlight (not blue)
- [ ] Wooden manpower blocks render at sector centroids
- [ ] SVG renders at 1024×520 without scrollbars

---

### Unit 10: Table Edge Components

**Files**:
- `src/layers/theatre/TableEdge.tsx` — layout container
- `src/layers/theatre/TurnLedger.tsx`
- `src/layers/theatre/SupplyTray.tsx`
- `src/layers/theatre/SectorFolio.tsx`
- `src/layers/theatre/DispatchStack.tsx`
- `src/layers/theatre/WaxSeal.tsx`

#### TableEdge

```typescript
interface TableEdgeProps {
  phase: import('../../types/theatre').TheatreTurnPhase;
  children: React.ReactNode; // The five objects, laid out by TableEdge
}
export function TableEdge(props: TableEdgeProps): JSX.Element;
```

Layout: walnut background (`#3D2817`), brass rail at top edge, 5 slots arranged per mockup spec §3 (120 + 140 + 416 + 140 + 120 = 936pt objects + 64pt gutters + 24pt margins = 1024pt). Phase-dependent lighting: each child receives a `dimmed` prop based on the current phase (per mockup spec §4 phase tables).

#### TurnLedger (120pt)

```typescript
interface TurnLedgerProps {
  turn: number;
  phase: import('../../types/theatre').TheatreTurnPhase;
  dimmed: boolean;
}
export function TurnLedger(props: TurnLedgerProps): JSX.Element;
```

Renders: leather diary, Roman numeral turn number (EB Garamond italic 16pt, `#5C3A1D`), month/year, French phase name, pencil tick progression.

#### SupplyTray (140pt)

```typescript
interface SupplyTrayProps {
  surplusPool: import('../../types/campaign').Resources;
  dimmed: boolean;
}
export function SupplyTray(props: SupplyTrayProps): JSX.Element;
```

Renders: wooden tray with three columns of stacked tokens. Stack height = reserve count. Empty column shows bare wood. Token shapes: brown blocks (manpower), blue discs (equipment), green sack icons (food). No numbers displayed — physical fullness is the quantity signal.

#### SectorFolio (416pt)

```typescript
interface SectorFolioProps {
  sector: import('../../types/theatre').SectorState;
  definition: import('../../types/theatre').SectorDefinition;
  phase: import('../../types/theatre').TheatreTurnPhase;
  isChosen: boolean;
  remainingPool: import('../../types/campaign').Resources;
  dimmed: boolean;
  onAllocate: (resource: import('../../types/campaign').ResourceType, delta: 1 | -1) => void;
  onChooseToFight: () => void;
}
export function SectorFolio(props: SectorFolioProps): JSX.Element;
```

Renders: foolscap paper on leather blotter. Header (EB Garamond italic 18pt), intelligence summary (Special Elite 11pt), three resource controls (styled +/- with brass appearance, 56pt diameter hit area), composite strength meter (horizontal bar coloured by level), deciding-factor caption, "Commander en personne" checkbox at bottom. +/- controls disable when surplus pool is empty (scarcity through resistance — controls dim to `#B8A890`).

#### DispatchStack (140pt)

```typescript
interface DispatchStackProps {
  dispatches: import('../../types/theatre').TheatreDispatch[];
  dimmed: boolean;
  onOpenStack: () => void;
}
export function DispatchStack(props: DispatchStackProps): JSX.Element;
```

Renders: stacked paper sheets with offset. Stack thickness = dispatch count. Top dispatch shows red wax seal if critical. Tap opens a dispatch reader overlay.

**Dispatch Reader** (overlay, rendered by DispatchStack when open):

```typescript
interface DispatchReaderProps {
  dispatches: import('../../types/theatre').TheatreDispatch[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}
```

Full-screen overlay with flip-through. Each tap turns a page and marks it read.

#### WaxSeal (120pt)

```typescript
interface WaxSealProps {
  sealState: import('../../types/theatre').SealState;
  onPress: () => void;
}
export function WaxSeal(props: WaxSealProps): JSX.Element;
```

Renders: 88pt brass seal stamp on red wax pool. Enabled: bright brass `#A8916A`, bright wax `#8B3A3A`. Disabled: dim brass `#5C5040`, dull wax `#5C2828`. Label below from `sealState.label`. Touch target: 88pt (well above 44pt minimum). Functionally a `<button>` with diegetic styling.

**Implementation Notes**:
- All five objects use CSS for diegetic appearance (gradients, shadows, opacity for dimming). No canvas rendering on the table edge.
- The dimming system: during each phase, irrelevant objects have `opacity: 0.4` and `pointer-events: none`. The phase-to-dim mapping follows mockup spec §4 exactly.
- SectorFolio's +/- controls are `<button>` elements styled with brass colouring and a 56pt hit area. The `disabled` state dims to `#B8A890` (faded ink) rather than standard grey.
- The dispatch reader overlay covers the centre of the screen with a paper texture background. Dispatches flip one at a time.

**Acceptance Criteria**:
- [ ] Table edge layout totals exactly 1024pt (objects + gutters + margins)
- [ ] All five objects visible and correctly positioned
- [ ] Phase-dependent dimming matches mockup spec §4 tables
- [ ] SectorFolio +/- controls disable when surplus pool empty
- [ ] SupplyTray shows physical token stacks, no numbers
- [ ] WaxSeal hit area >= 44pt
- [ ] Dispatch reader opens on stack tap, marks dispatches read on page turn

---

### Unit 11: Resolution Reveal

**File**: `src/layers/theatre/ResolutionReveal.tsx`

```typescript
interface ResolutionRevealProps {
  /** Ordered list of sector results to reveal */
  results: Array<{
    sectorId: import('../../types/theatre').SectorId;
    result: import('../../types/theatre').SectorTurnResult;
    dispatch: import('../../types/theatre').TheatreDispatch;
  }>;
  /** Index of the sector currently being revealed */
  currentIndex: number;
  /** Playback speed multiplier (1 or 4) */
  speed: 1 | 4;
  /** Called when the current sector's reveal animation completes */
  onRevealComplete: () => void;
  /** Called when user taps to fast-forward */
  onTapToAccelerate: () => void;
}

export function ResolutionReveal(props: ResolutionRevealProps): JSX.Element;
```

**Implementation Notes**:
- This component orchestrates the per-sector reveal animation from mockup spec §5. It renders an overlay on the map that controls the sector glow, pencil-mark text, front-line redraw, and dispatch-stack arrival.
- Animation timing per sector (at 1× speed): 0s glow, 0.3s pencil text starts, 1s front line redraws, 1.8s blocks update, 2s dispatch slides to stack, 2.5s done. At 4× speed: divide all timings by 4.
- Uses `requestAnimationFrame` for smooth animation. State is internal to the component (which animation step is active), not in the store.
- Tapping anywhere during reveal calls `onTapToAccelerate`, which sets speed to 4× for all remaining sectors.
- The pencil-mark text uses Architects Daughter italic 13pt with a letter-by-letter reveal (slight delay per character).
- When all sectors are revealed, the component unmounts and the parent transitions to the 'update' (Bilan) phase.

**Acceptance Criteria**:
- [ ] Sectors reveal in order (north to south / west to east)
- [ ] Each sector takes ~2.5s at normal speed
- [ ] Tapping accelerates remaining reveals to 4×
- [ ] Pencil text appears letter-by-letter
- [ ] Front line animates via stroke-dasharray
- [ ] Dispatch slides onto the stack

---

### Unit 12: TheatreLayer Root

**File**: `src/layers/theatre/TheatreLayer.tsx` (replace existing stub)

```typescript
export function TheatreLayer(): JSX.Element;
```

**Internal structure:**
- Reads all theatre state from the store via `useStore`
- On mount: checks for saved state in localStorage. If found, restores. Otherwise, initializes new game.
- Renders: `<TheatreMap>` (top 520pt) + `<TableEdge>` (bottom 248pt) containing the five table-edge objects
- During resolve phase: renders `<ResolutionReveal>` overlay
- When dispatch reader is open: renders `<DispatchReader>` overlay
- Computes `SealState` via selector and passes to `WaxSeal`
- Routes `WaxSeal.onPress` to `advancePhase` (which handles the phase flow)
- Routes sector taps:
  - In review phase: transition to allocate and set active sector
  - In allocate phase: swap active sector folio
  - In select phase: choose sector to fight
  - In resolve/update phases: no-op

**Implementation Notes**:
- The TheatreLayer is the composition root for this feature — it wires the store to the component tree.
- Save/load is triggered here: load on mount, save in `beginNextTurn` (which calls `saveTheatreState`).
- The component renders a single full-screen container at 1024×768. No responsive behaviour.
- **Important for Phase 2:** When the player seals orders in the Sélection phase, this is where the zoom-to-campaign transition will hook in. For Phase 1, pressing the seal in Sélection simply skips to resolve (auto-resolves all 8 sectors including the chosen one, since campaign integration doesn't exist yet).

**Acceptance Criteria**:
- [ ] New game initializes 8 sectors with correct starting state
- [ ] Saved game loads from localStorage on mount
- [ ] Phase flow: review → allocate → select → resolve → update → review (next turn)
- [ ] Seal press advances the correct phase
- [ ] Critical dispatch lockout prevents advancing when unread criticals exist
- [ ] Full theatre turn is playable without campaign layer (all sectors auto-resolve)
- [ ] Auto-save triggers at turn boundary

---

## Implementation Order

```
1. Unit 1:  Theatre Types           (no dependencies)
2. Unit 3:  Theatre Palette         (no dependencies)
3. Unit 2:  Theatre Map Data        (depends on Unit 1 types)
4. Unit 4:  Auto-Resolve Logic      (depends on Units 1, 2)
5. Unit 5:  Dispatch Templates      (depends on Units 1, 2)
6. Unit 6:  Win Conditions          (depends on Units 1, 2)
7. Unit 7:  Persistence             (depends on Unit 1)
8. Unit 8:  Theatre Store Slice     (depends on Units 1-7)
9. Unit 9:  TheatreMap SVG          (depends on Units 1-3, 8)
10. Unit 10: Table Edge Components  (depends on Units 1, 3, 8)
11. Unit 11: Resolution Reveal      (depends on Units 1, 3, 8-10)
12. Unit 12: TheatreLayer Root      (depends on all above)
```

Units 1-3 can be implemented in parallel (no cross-dependencies).
Units 4-7 can be implemented in parallel (all depend only on types and data).
Units 9-10 can be implemented in parallel (both depend on store but not each other).

---

## Testing

### Unit Tests: `src/layers/theatre/__tests__/auto-resolve.test.ts`

Test `autoResolveSector` with deterministic random source:
- Sector with player advantage (high resources vs low enemy) → advance or hold
- Sector with enemy advantage → retreat or hold
- Front movement never exceeds ±1 (WWI pace cap)
- Critical detection when strength ratio > 2:1
- Chosen sector excluded from `autoResolveAll`

### Unit Tests: `src/layers/theatre/__tests__/dispatch-templates.test.ts`

- Each category has at least 4 templates
- Sector names interpolated correctly
- Recent template IDs are excluded (dedup within 2-turn window)
- Critical dispatches have `isCritical: true`

### Unit Tests: `src/layers/theatre/__tests__/win-conditions.test.ts`

- All player-controlled sectors → high player industrial capacity
- All enemy-controlled sectors → high enemy capacity
- Contested sectors split by front position
- Victory when enemy capacity < 30% threshold
- Defeat when player capacity < 30% threshold
- Ongoing when both sides above threshold

### Unit Tests: `src/layers/theatre/__tests__/persistence.test.ts`

- Save/load round-trip with mock storage
- Corrupt JSON returns null
- Version mismatch returns null
- Clear removes saved state

### Unit Tests: `src/store/__tests__/theatreSlice.test.ts`

- `initTheatre` creates 8 sectors with correct initial state
- `allocateSurplus` decrements pool and increments sector allocation
- `allocateSurplus` refuses when pool is empty
- `advancePhase` follows correct sequence
- `resolveUnattended` produces results and dispatches
- `beginNextTurn` resets allocations and increments turn
- `selectSealState` returns correct state per phase
- `selectHasUnreadCritical` detects unread critical dispatches

### Integration Test: `src/layers/theatre/__tests__/theatre-flow.test.ts`

Full turn flow:
1. Init new game
2. Allocate surplus to Verdun
3. Choose Verdun to fight
4. Advance to resolve → all 8 sectors auto-resolve (Phase 1 behaviour)
5. Verify dispatches generated
6. Mark all dispatches read
7. Advance to next turn
8. Verify save state in mock localStorage
9. Verify surplus pool refilled

---

## Verification Checklist

```bash
# Build compiles cleanly
npm run build

# Lint passes
npm run lint

# Dev server starts
npm run dev
# → Navigate to localhost, verify theatre layer loads

# Play 5 turns:
# 1. Review: read dispatches
# 2. Allocate: move surplus to sectors, verify controls disable when empty
# 3. Select: choose a sector
# 4. Resolve: watch reveal sequence (tap to accelerate)
# 5. Update: read dispatches, advance to next turn
# Verify: front lines move (small amounts), dispatches generate narrative text,
#          auto-save works (refresh browser, state persists)

# Check timing: allocation + resolve + review should be under 3 minutes
```

---

## Shared Port: RandomSource

**File**: `src/shared/random.ts`

```typescript
/** Port: injectable randomness for testability */
export interface RandomSource {
  random(): number; // 0-1, same contract as Math.random
}

/** Default production random source */
export const defaultRandom: RandomSource = { random: () => Math.random() };
```

Used by auto-resolve (Unit 4) and dispatch templates (Unit 5). Single definition, no duplication.

---

## Additional Specifications (from adversarial review)

### Enemy Strength Display Mapping (M6 fix)

SectorFolio displays enemy strength as a qualitative French term, not a number:

```typescript
export function enemyStrengthLabel(strength: number): string {
  if (strength < 2.5) return 'faibles';
  if (strength < 3.5) return 'modérés';
  if (strength < 4.5) return 'forts';
  return 'très forts';
}
```

### Turn Date Tracking (M5 fix)

The game starts in **Février 1916**. Each turn advances by 1 month. Store the turn's
month index in `TheatreSaveState`:

```typescript
// Add to TheatreSaveState:
startMonth: number; // 0-indexed: 0 = Février 1916

// In TurnLedger, compute display:
const MONTHS_FR = [
  'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
  'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier'
];
const monthIndex = (startMonth + currentTurn - 1) % 12;
const year = 1916 + Math.floor((startMonth + currentTurn - 1) / 12);
```

### Dispatch Template Dedup Tracking (M4 fix)

Add to `TheatreSlice`:

```typescript
recentTemplateIds: string[]; // Template IDs used in last 2 turns
```

`beginNextTurn` prunes entries older than 2 turns by keeping only IDs from
dispatches where `dispatch.turn >= currentTurn - 1`.

### War Correspondent Dispatch Rendering (M1 fix)

`DispatchStack` and `DispatchReader` should check `isWarCorrespondent` and render
those dispatches larger (wider paper, slight angle, handwritten signature line at
bottom). This differentiates them from auto-resolve dispatches visually.

---

## New Dependency

Add to `package.json`:
- `@fontsource/architects-daughter` — for pencil-mark text on sectors during reveal

---

## Type Barrel Update

**File**: `src/types/index.ts` — add re-exports for new theatre types:

```typescript
export type {
  SectorId, SectorDefinition, SectorState, SectorTurnResult,
  DispatchCategory, TheatreDispatch, TheatreTurnPhase,
  SealState, TheatreSaveState,
} from './theatre';
export { SECTOR_IDS, PHASE_DISPLAY } from './theatre';
```

**Remove** the old `Sector` interface export — it is incompatible with `SectorState`
(different fields entirely). The only consumer is `theatreSlice.ts`, which is being
replaced in Unit 8. Also remove the old `SectorId` type alias (replaced by the string
union derived from `SECTOR_IDS`).
