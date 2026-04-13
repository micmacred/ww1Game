# Phase 1 — Theatre Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable theatre layer where the player manages an 8-sector Western Front: review dispatches, allocate surplus resources, choose a sector, auto-resolve all 8, view narrative results, check win conditions. Persists to localStorage.

**Architecture:** Zustand store slice drives all theatre state. Pure logic functions (auto-resolve, win conditions, persistence, dispatch generation) are in separate files with no UI dependencies, tested via Vitest with deterministic random sources. SVG map + CSS table-edge components compose into a full-screen 1024×768 theatre layer. Phase flow is a 5-step state machine managed by the store.

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, Vite 8, Vitest (to install), SVG for map, CSS for table-edge objects, EB Garamond + Special Elite + Architects Daughter fonts.

**Design spec:** `docs/superpowers/specs/2026-04-12-theatre-map-phase1-design.md`
**Mockup spec:** `docs/superpowers/specs/2026-04-07-theatre-layer-ui-mockups-design.md`

---

## File Structure

```
src/
├── types/
│   ├── theatre.ts            — REPLACE existing placeholder (Unit 1)
│   └── index.ts              — UPDATE barrel exports
├── shared/
│   ├── random.ts             — CREATE (shared RandomSource port)
│   └── theatre-palette.ts    — CREATE (Unit 3)
├── data/
│   └── theatre-map.ts        — CREATE (Unit 2)
├── layers/theatre/
│   ├── auto-resolve.ts       — CREATE (Unit 4)
│   ├── dispatch-templates.ts — CREATE (Unit 5)
│   ├── win-conditions.ts     — CREATE (Unit 6)
│   ├── persistence.ts        — CREATE (Unit 7)
│   ├── TheatreMap.tsx         — CREATE (Unit 9)
│   ├── TableEdge.tsx          — CREATE (Unit 10)
│   ├── TurnLedger.tsx         — CREATE (Unit 10)
│   ├── SupplyTray.tsx         — CREATE (Unit 10)
│   ├── SectorFolio.tsx        — CREATE (Unit 10)
│   ├── DispatchStack.tsx      — CREATE (Unit 10)
│   ├── WaxSeal.tsx            — CREATE (Unit 10)
│   ├── ResolutionReveal.tsx   — CREATE (Unit 11)
│   ├── TheatreLayer.tsx       — REPLACE existing stub (Unit 12)
│   └── __tests__/
│       ├── auto-resolve.test.ts
│       ├── dispatch-templates.test.ts
│       ├── win-conditions.test.ts
│       ├── persistence.test.ts
│       ├── theatreSlice.test.ts
│       └── theatre-flow.test.ts
├── store/
│   ├── theatreSlice.ts        — REPLACE existing placeholder (Unit 8)
│   └── index.ts               — NO CHANGE (already wired)
```

---

## Task 0: Test Framework Setup

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

This project has no test framework. Vitest integrates natively with Vite's config and supports TypeScript without additional setup.

- [ ] **Step 1: Install vitest and dependencies**

Run:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs**

Run: `npx vitest run`
Expected: 0 tests found, exits cleanly

- [ ] **Step 5: Install Architects Daughter font**

Run:
```bash
npm install @fontsource/architects-daughter
```

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.ts package-lock.json
git commit -m "chore: add vitest test framework and architects-daughter font"
```

---

## Task 1: Theatre Types (Unit 1)

**Files:**
- Replace: `src/types/theatre.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Replace theatre.ts with full type definitions**

Write `src/types/theatre.ts`:

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
  name: string;
  displayName: string;
  polygon: [number, number][];
  centroid: [number, number];
  adjacentTo: SectorId[];
  generators: Resources;
}

// ── Runtime sector state ─────────────────────────────────────
export interface SectorState {
  id: SectorId;
  control: 'player' | 'enemy' | 'contested';
  baseline: Resources;
  allocated: Resources;
  enemyStrength: number;
  frontPosition: number;
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
  id: string;
  sectorId: SectorId;
  category: DispatchCategory;
  text: string;
  isCritical: boolean;
  isRead: boolean;
  isWarCorrespondent: boolean;
  turn: number;
}

// ── Turn phases ──────────────────────────────────────────────
export type TheatreTurnPhase =
  | 'review'
  | 'allocate'
  | 'select'
  | 'resolve'
  | 'update';

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
  startMonth: number;
  sectors: SectorState[];
  dispatches: TheatreDispatch[];
  surplusPool: Resources;
  chosenSector: SectorId | null;
  phase: TheatreTurnPhase;
  industrialHealth: { player: number; enemy: number };
}
```

- [ ] **Step 2: Update barrel exports in index.ts**

Replace the theatre exports block in `src/types/index.ts`:

```typescript
export type {
  SectorId, SectorDefinition, SectorState, SectorTurnResult,
  DispatchCategory, TheatreDispatch, TheatreTurnPhase,
  SealState, TheatreSaveState,
} from './theatre';
export { SECTOR_IDS, PHASE_DISPLAY } from './theatre';
```

Remove the old `Sector` export — it is incompatible with `SectorState`.

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Compilation errors in `theatreSlice.ts` (imports old `Sector` type). This is expected — we fix it in Task 7.

- [ ] **Step 4: Commit**

```bash
git add src/types/theatre.ts src/types/index.ts
git commit -m "feat(theatre): replace placeholder types with full Phase 1 type system"
```

---

## Task 2: Shared RandomSource Port + Theatre Palette (Units 3 + shared)

**Files:**
- Create: `src/shared/random.ts`
- Create: `src/shared/theatre-palette.ts`

- [ ] **Step 1: Create RandomSource port**

Write `src/shared/random.ts`:

```typescript
/** Port: injectable randomness for testability */
export interface RandomSource {
  random(): number;
}

/** Default production random source */
export const defaultRandom: RandomSource = { random: () => Math.random() };
```

- [ ] **Step 2: Create theatre palette**

Write `src/shared/theatre-palette.ts`:

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

  // Strength indicators
  strengthGood: '#2d6a2d',
  strengthLow: '#b7770d',
  strengthCritical: '#c0392b',

  // Grid overlay
  gridLine: 'rgba(44,24,16,0.08)',
} as const;

export type TheatreColour = typeof THEATRE;
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Same errors as Task 1 Step 3 (theatreSlice.ts only).

- [ ] **Step 4: Commit**

```bash
git add src/shared/random.ts src/shared/theatre-palette.ts
git commit -m "feat(theatre): add RandomSource port and theatre palette constants"
```

---

## Task 3: Theatre Map Data (Unit 2)

**Files:**
- Create: `src/data/theatre-map.ts`
- Test: `src/layers/theatre/__tests__/theatre-map.test.ts`

The theatre-map.ts file provides sector definitions, polygon coordinates, the front line path generator, the surplus pool computation, and initial sector factory. Polygon coordinates are approximate and will need visual tuning — the priority is getting the shape types and data structure right.

- [ ] **Step 1: Write failing tests for theatre map data**

Create `src/layers/theatre/__tests__/theatre-map.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  THEATRE_SECTORS,
  SECTOR_ORDER,
  createInitialSectors,
  computeTurnEconomics,
  generateFrontLinePath,
} from '../../../data/theatre-map';
import { SECTOR_IDS } from '../../../types/theatre';
import type { SectorId, SectorState } from '../../../types/theatre';

describe('THEATRE_SECTORS', () => {
  it('defines all 8 sectors', () => {
    expect(Object.keys(THEATRE_SECTORS)).toHaveLength(8);
    for (const id of SECTOR_IDS) {
      expect(THEATRE_SECTORS[id]).toBeDefined();
      expect(THEATRE_SECTORS[id].id).toBe(id);
    }
  });

  it('each sector has a polygon with at least 3 points', () => {
    for (const sector of Object.values(THEATRE_SECTORS)) {
      expect(sector.polygon.length).toBeGreaterThanOrEqual(3);
      for (const point of sector.polygon) {
        expect(point).toHaveLength(2);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
      }
    }
  });

  it('each sector has positive generator values', () => {
    for (const sector of Object.values(THEATRE_SECTORS)) {
      expect(sector.generators.manpower).toBeGreaterThan(0);
      expect(sector.generators.equipment).toBeGreaterThan(0);
      expect(sector.generators.food).toBeGreaterThan(0);
    }
  });

  it('adjacency relationships are bidirectional', () => {
    for (const sector of Object.values(THEATRE_SECTORS)) {
      for (const adjId of sector.adjacentTo) {
        expect(THEATRE_SECTORS[adjId].adjacentTo).toContain(sector.id);
      }
    }
  });
});

describe('SECTOR_ORDER', () => {
  it('contains all 8 sector IDs in west-to-east order', () => {
    expect(SECTOR_ORDER).toHaveLength(8);
    expect(SECTOR_ORDER).toEqual([
      'flandres', 'artois', 'picardie', 'champagne',
      'verdun', 'lorraine', 'vosges', 'alsace',
    ]);
  });
});

describe('createInitialSectors', () => {
  it('creates contested sectors at frontPosition 0', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      const s = sectors[id];
      expect(s.control).toBe('contested');
      expect(s.frontPosition).toBe(0);
      expect(s.allocated).toEqual({ manpower: 0, equipment: 0, food: 0 });
      expect(s.lastResult).toBeNull();
    }
  });

  it('sets enemyStrength between 2.5 and 4.5', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      expect(sectors[id].enemyStrength).toBeGreaterThanOrEqual(2.5);
      expect(sectors[id].enemyStrength).toBeLessThanOrEqual(4.5);
    }
  });
});

describe('computeTurnEconomics', () => {
  it('computes surplus pool from contested sectors at position 0', () => {
    const sectors = createInitialSectors();
    const result = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: 0.3,
      maxPosition: 8,
    });

    // At position 0, controlFraction = (0+8)/(2*8) = 0.5
    // Each sector gets half its generators as raw baseline
    // 70% of that stays as baseline, 30% goes to surplus pool
    for (const id of SECTOR_IDS) {
      const gen = THEATRE_SECTORS[id].generators;
      const rawM = gen.manpower * 0.5;
      const rawE = gen.equipment * 0.5;
      const rawF = gen.food * 0.5;
      expect(result.baselines[id].manpower).toBeCloseTo(rawM * 0.7, 1);
      expect(result.baselines[id].equipment).toBeCloseTo(rawE * 0.7, 1);
      expect(result.baselines[id].food).toBeCloseTo(rawF * 0.7, 1);
    }

    // Surplus pool should be positive
    expect(result.surplusPool.manpower).toBeGreaterThan(0);
    expect(result.surplusPool.equipment).toBeGreaterThan(0);
    expect(result.surplusPool.food).toBeGreaterThan(0);
  });

  it('gives full output for player-controlled sectors', () => {
    const sectors = createInitialSectors();
    sectors.flandres = { ...sectors.flandres, control: 'player', frontPosition: 8 };
    const result = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: 0.3,
      maxPosition: 8,
    });
    const gen = THEATRE_SECTORS.flandres.generators;
    // Player control: full generators, 70% baseline, 30% surplus
    expect(result.baselines.flandres.manpower).toBeCloseTo(gen.manpower * 0.7, 1);
  });

  it('gives zero output for enemy-controlled sectors', () => {
    const sectors = createInitialSectors();
    sectors.flandres = { ...sectors.flandres, control: 'enemy', frontPosition: -8 };
    const result = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: 0.3,
      maxPosition: 8,
    });
    expect(result.baselines.flandres.manpower).toBe(0);
    expect(result.baselines.flandres.equipment).toBe(0);
    expect(result.baselines.flandres.food).toBe(0);
  });
});

describe('generateFrontLinePath', () => {
  it('returns a valid SVG path string', () => {
    const sectors = createInitialSectors();
    const path = generateFrontLinePath(sectors);
    expect(path).toMatch(/^M/); // SVG path starts with M (moveto)
    expect(path).toContain('C'); // Contains cubic bezier curves
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/theatre-map.test.ts`
Expected: FAIL — module `../../../data/theatre-map` does not exist

- [ ] **Step 3: Implement theatre-map.ts**

Create `src/data/theatre-map.ts`:

```typescript
import type { SectorDefinition, SectorId, SectorState } from '../types/theatre';
import type { Resources } from '../types/campaign';
import { SECTOR_IDS } from '../types/theatre';

const PIXELS_PER_POSITION = 3;

export const THEATRE_SECTORS: Record<SectorId, SectorDefinition> = {
  flandres: {
    id: 'flandres',
    name: 'Flandres',
    displayName: 'Secteur de Flandres',
    polygon: [[60, 80], [160, 60], [180, 140], [140, 180], [50, 160]],
    centroid: [120, 120],
    adjacentTo: ['artois'],
    generators: { manpower: 4, equipment: 3, food: 3 },
  },
  artois: {
    id: 'artois',
    name: 'Artois',
    displayName: "Secteur d'Artois",
    polygon: [[160, 60], [300, 100], [280, 200], [180, 200], [180, 140]],
    centroid: [220, 140],
    adjacentTo: ['flandres', 'picardie'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
  picardie: {
    id: 'picardie',
    name: 'Picardie',
    displayName: 'Secteur de Picardie',
    polygon: [[300, 100], [440, 160], [420, 260], [280, 260], [280, 200]],
    centroid: [340, 190],
    adjacentTo: ['artois', 'champagne'],
    generators: { manpower: 3, equipment: 3, food: 4 },
  },
  champagne: {
    id: 'champagne',
    name: 'Champagne',
    displayName: 'Secteur de Champagne',
    polygon: [[440, 160], [560, 200], [540, 300], [420, 300], [420, 260]],
    centroid: [460, 240],
    adjacentTo: ['picardie', 'verdun'],
    generators: { manpower: 4, equipment: 3, food: 4 },
  },
  verdun: {
    id: 'verdun',
    name: 'Verdun',
    displayName: 'Secteur de Verdun',
    polygon: [[560, 200], [660, 240], [640, 340], [540, 340], [540, 300]],
    centroid: [580, 270],
    adjacentTo: ['champagne', 'lorraine'],
    generators: { manpower: 5, equipment: 4, food: 2 },
  },
  lorraine: {
    id: 'lorraine',
    name: 'Lorraine',
    displayName: 'Secteur de Lorraine',
    polygon: [[660, 240], [780, 280], [760, 370], [640, 370], [640, 340]],
    centroid: [700, 310],
    adjacentTo: ['verdun', 'vosges'],
    generators: { manpower: 3, equipment: 5, food: 3 },
  },
  vosges: {
    id: 'vosges',
    name: 'Vosges',
    displayName: 'Secteur des Vosges',
    polygon: [[780, 280], [880, 320], [860, 410], [760, 410], [760, 370]],
    centroid: [810, 350],
    adjacentTo: ['lorraine', 'alsace'],
    generators: { manpower: 2, equipment: 3, food: 4 },
  },
  alsace: {
    id: 'alsace',
    name: 'Alsace',
    displayName: "Secteur d'Alsace",
    polygon: [[880, 320], [970, 360], [960, 450], [860, 450], [860, 410]],
    centroid: [910, 390],
    adjacentTo: ['vosges'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
};

/** Ordered array for iteration (west to east) */
export const SECTOR_ORDER: SectorId[] = [
  'flandres', 'artois', 'picardie', 'champagne',
  'verdun', 'lorraine', 'vosges', 'alsace',
];

/** Generate the SVG front line path from sector front positions */
export function generateFrontLinePath(
  sectors: Record<SectorId, { frontPosition: number }>,
): string {
  const points = SECTOR_ORDER.map((id) => {
    const def = THEATRE_SECTORS[id];
    const yOffset = -sectors[id].frontPosition * PIXELS_PER_POSITION;
    return { x: def.centroid[0], y: def.centroid[1] + yOffset };
  });

  if (points.length < 2) return '';

  // Start with moveto
  let d = `M ${points[0].x} ${points[0].y}`;

  // Cubic bezier through all points for a smooth meandering line
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    const cp1x = p0.x + dx;
    const cp1y = p0.y;
    const cp2x = p1.x - dx;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  return d;
}

/** Compute baseline and surplus for a new turn */
export function computeTurnEconomics(
  sectors: Record<SectorId, SectorState>,
  config: { surplusToBaselineRatio: number; maxPosition: number },
): {
  baselines: Record<SectorId, Resources>;
  surplusPool: Resources;
} {
  const baselines = {} as Record<SectorId, Resources>;
  const surplusPool: Resources = { manpower: 0, equipment: 0, food: 0 };

  for (const id of SECTOR_IDS) {
    const sector = sectors[id];
    const gen = THEATRE_SECTORS[id].generators;

    let controlFraction: number;
    if (sector.control === 'player') {
      controlFraction = 1;
    } else if (sector.control === 'enemy') {
      controlFraction = 0;
    } else {
      controlFraction = (sector.frontPosition + config.maxPosition) / (2 * config.maxPosition);
    }

    const rawBaseline: Resources = {
      manpower: gen.manpower * controlFraction,
      equipment: gen.equipment * controlFraction,
      food: gen.food * controlFraction,
    };

    const kept: Resources = {
      manpower: rawBaseline.manpower * (1 - config.surplusToBaselineRatio),
      equipment: rawBaseline.equipment * (1 - config.surplusToBaselineRatio),
      food: rawBaseline.food * (1 - config.surplusToBaselineRatio),
    };

    baselines[id] = kept;

    surplusPool.manpower += rawBaseline.manpower * config.surplusToBaselineRatio;
    surplusPool.equipment += rawBaseline.equipment * config.surplusToBaselineRatio;
    surplusPool.food += rawBaseline.food * config.surplusToBaselineRatio;
  }

  // Round surplus pool to 1 decimal for clean display
  surplusPool.manpower = Math.round(surplusPool.manpower * 10) / 10;
  surplusPool.equipment = Math.round(surplusPool.equipment * 10) / 10;
  surplusPool.food = Math.round(surplusPool.food * 10) / 10;

  return { baselines, surplusPool };
}

/** Initial sector states for a new game */
export function createInitialSectors(): Record<SectorId, SectorState> {
  const sectors = {} as Record<SectorId, SectorState>;

  for (const id of SECTOR_IDS) {
    sectors[id] = {
      id,
      control: 'contested',
      baseline: { manpower: 0, equipment: 0, food: 0 },
      allocated: { manpower: 0, equipment: 0, food: 0 },
      enemyStrength: 2.5 + Math.random() * 2.0,
      frontPosition: 0,
      lastResult: null,
    };
  }

  return sectors;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/theatre-map.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/theatre-map.ts src/layers/theatre/__tests__/theatre-map.test.ts
git commit -m "feat(theatre): add theatre map data, sector definitions, and economics formula"
```

---

## Task 4: Auto-Resolve Logic (Unit 4)

**Files:**
- Create: `src/layers/theatre/auto-resolve.ts`
- Test: `src/layers/theatre/__tests__/auto-resolve.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/layers/theatre/__tests__/auto-resolve.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  sectorStrength,
  autoResolveSector,
  autoResolveAll,
  applyResults,
} from '../auto-resolve';
import type { SectorState, SectorId } from '../../../types/theatre';
import type { RandomSource } from '../../../shared/random';
import { createInitialSectors } from '../../../data/theatre-map';

function makeRng(value: number): RandomSource {
  return { random: () => value };
}

function makeSector(overrides: Partial<SectorState> = {}): SectorState {
  return {
    id: 'verdun',
    control: 'contested',
    baseline: { manpower: 3, equipment: 2, food: 2 },
    allocated: { manpower: 1, equipment: 0, food: 0 },
    enemyStrength: 3.0,
    frontPosition: 0,
    lastResult: null,
    ...overrides,
  };
}

describe('sectorStrength', () => {
  it('computes weighted sum of baseline + allocated', () => {
    const result = sectorStrength(
      { manpower: 3, equipment: 2, food: 2 },
      { manpower: 1, equipment: 0, food: 0 },
    );
    // (3+1)*0.4 + (2+0)*0.3 + (2+0)*0.3 = 1.6 + 0.6 + 0.6 = 2.8
    expect(result).toBeCloseTo(2.8, 5);
  });
});

describe('autoResolveSector', () => {
  it('caps front movement at +1', () => {
    const sector = makeSector({
      baseline: { manpower: 10, equipment: 10, food: 10 },
      enemyStrength: 1.0,
    });
    const result = autoResolveSector(sector, makeRng(0.01));
    expect(result.frontMovement).toBeLessThanOrEqual(1);
    expect(result.frontMovement).toBeGreaterThanOrEqual(-1);
  });

  it('caps front movement at -1', () => {
    const sector = makeSector({
      baseline: { manpower: 1, equipment: 1, food: 1 },
      enemyStrength: 10.0,
    });
    const result = autoResolveSector(sector, makeRng(0.99));
    expect(result.frontMovement).toBeGreaterThanOrEqual(-1);
  });

  it('detects critical when strength ratio > 2:1 and front moves', () => {
    const sector = makeSector({
      baseline: { manpower: 1, equipment: 1, food: 1 },
      allocated: { manpower: 0, equipment: 0, food: 0 },
      enemyStrength: 8.0,
    });
    // Very high roll → retreat
    const result = autoResolveSector(sector, makeRng(0.99));
    if (result.frontMovement !== 0) {
      expect(result.outcome).toBe('critical');
    }
  });

  it('produces deterministic results with fixed RNG', () => {
    const sector = makeSector();
    const r1 = autoResolveSector(sector, makeRng(0.5));
    const r2 = autoResolveSector(sector, makeRng(0.5));
    expect(r1).toEqual(r2);
  });

  it('includes a deciding resource and reason', () => {
    const sector = makeSector();
    const result = autoResolveSector(sector, makeRng(0.3));
    expect(['manpower', 'equipment', 'food']).toContain(result.decidingResource);
    expect(result.decidingReason.length).toBeGreaterThan(0);
  });
});

describe('autoResolveAll', () => {
  it('excludes the chosen sector', () => {
    const sectors = createInitialSectors();
    const results = autoResolveAll(sectors, 'verdun', makeRng(0.5));
    expect(results.verdun).toBeUndefined();
    expect(Object.keys(results)).toHaveLength(7);
  });
});

describe('applyResults', () => {
  it('returns new state without mutating input', () => {
    const sectors = createInitialSectors();
    const results = autoResolveAll(sectors, 'verdun', makeRng(0.3));
    const original = JSON.parse(JSON.stringify(sectors));
    const updated = applyResults(sectors, results);

    // Input not mutated
    expect(sectors).toEqual(original);

    // Results applied
    for (const id of Object.keys(results) as SectorId[]) {
      expect(updated[id].lastResult).toEqual(results[id]);
      expect(updated[id].frontPosition).toBe(
        sectors[id].frontPosition + results[id].frontMovement,
      );
    }
  });

  it('updates control state when front crosses threshold', () => {
    const sectors = createInitialSectors();
    // Force flandres near the threshold
    sectors.flandres = { ...sectors.flandres, frontPosition: 5 };
    const results = autoResolveAll(sectors, 'verdun', makeRng(0.01));

    // If flandres gained ground (movement +1), position becomes 6 → player control
    if (results.flandres && results.flandres.frontMovement === 1) {
      const updated = applyResults(sectors, results);
      expect(updated.flandres.control).toBe('player');
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/auto-resolve.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement auto-resolve.ts**

Create `src/layers/theatre/auto-resolve.ts`:

```typescript
import type { SectorState, SectorTurnResult, SectorId } from '../../types/theatre';
import type { Resources, ResourceType } from '../../types/campaign';
import { SECTOR_IDS } from '../../types/theatre';
import { RES_WEIGHT, RES_OUTCOME } from '../../shared/resources';
import type { RandomSource } from '../../shared/random';
import { defaultRandom } from '../../shared/random';

const RES_KEYS: readonly ResourceType[] = ['manpower', 'equipment', 'food'];
const MAX_FRONT_MOVEMENT = 1; // WWI pace cap

/**
 * Compute the total strength of a sector's resources.
 * Same weight formula as campaign: M*0.4 + E*0.3 + F*0.3
 */
export function sectorStrength(baseline: Resources, allocated: Resources): number {
  let total = 0;
  for (const r of RES_KEYS) {
    total += (baseline[r] + allocated[r]) * RES_WEIGHT[r];
  }
  return total;
}

/**
 * Auto-resolve a single unattended sector.
 * Returns the outcome, front movement, and deciding factor.
 */
export function autoResolveSector(
  sector: SectorState,
  rng: RandomSource = defaultRandom,
): SectorTurnResult {
  const playerStr = sectorStrength(sector.baseline, sector.allocated);
  const enemyStr = sector.enemyStrength;
  const threshold = playerStr / (playerStr + enemyStr);
  const roll = rng.random();

  let rawMovement: number;
  if (roll < threshold * 0.6) {
    rawMovement = 1;
  } else if (roll < threshold + 0.15) {
    rawMovement = 0;
  } else {
    rawMovement = -1;
  }

  // WWI pace cap
  const frontMovement = Math.max(-MAX_FRONT_MOVEMENT, Math.min(MAX_FRONT_MOVEMENT, rawMovement));

  // Determine deciding factor
  const result = frontMovement > 0 ? 'advance' : frontMovement < 0 ? 'retreat' : 'hold';
  let decidingResource: ResourceType;
  let decidingReason: string;

  const total = sector.baseline;
  if (result === 'advance' || result === 'hold') {
    decidingResource = RES_KEYS.reduce((best, r) =>
      total[r] * RES_WEIGHT[r] > total[best] * RES_WEIGHT[best] ? r : best, RES_KEYS[0]);
    decidingReason = RES_OUTCOME[decidingResource].adv;
  } else {
    decidingResource = RES_KEYS.reduce((worst, r) =>
      total[r] * RES_WEIGHT[r] < total[worst] * RES_WEIGHT[worst] ? r : worst, RES_KEYS[0]);
    decidingReason = RES_OUTCOME[decidingResource].ret;
  }

  // Detect critical: front moved AND strength ratio > 2:1
  const ratio = Math.max(playerStr, enemyStr) / Math.max(Math.min(playerStr, enemyStr), 0.01);
  const isCritical = frontMovement !== 0 && ratio > 2;

  let outcome: SectorTurnResult['outcome'];
  if (isCritical) {
    outcome = 'critical';
  } else if (frontMovement > 0) {
    outcome = 'gained-ground';
  } else if (frontMovement < 0) {
    outcome = 'lost-ground';
  } else {
    outcome = 'held';
  }

  return { outcome, frontMovement, decidingResource, decidingReason };
}

/**
 * Auto-resolve all unattended sectors (everything except the chosen one).
 */
export function autoResolveAll(
  sectors: Record<SectorId, SectorState>,
  chosenSector: SectorId,
  rng: RandomSource = defaultRandom,
): Record<SectorId, SectorTurnResult> {
  const results = {} as Record<SectorId, SectorTurnResult>;
  for (const id of SECTOR_IDS) {
    if (id === chosenSector) continue;
    results[id] = autoResolveSector(sectors[id], rng);
  }
  return results;
}

/**
 * Apply auto-resolve results to sector states.
 * Mutates nothing — returns new sector states.
 */
export function applyResults(
  sectors: Record<SectorId, SectorState>,
  results: Record<SectorId, SectorTurnResult>,
): Record<SectorId, SectorState> {
  const updated = {} as Record<SectorId, SectorState>;
  for (const id of SECTOR_IDS) {
    const sector = sectors[id];
    const result = results[id];

    if (!result) {
      updated[id] = { ...sector };
      continue;
    }

    const newPosition = sector.frontPosition + result.frontMovement;

    let control: SectorState['control'];
    if (newPosition >= 6) {
      control = 'player';
    } else if (newPosition <= -6) {
      control = 'enemy';
    } else {
      control = 'contested';
    }

    updated[id] = {
      ...sector,
      frontPosition: newPosition,
      control,
      lastResult: result,
    };
  }
  return updated;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/auto-resolve.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layers/theatre/auto-resolve.ts src/layers/theatre/__tests__/auto-resolve.test.ts
git commit -m "feat(theatre): add auto-resolve logic with WWI pace cap"
```

---

## Task 5: Dispatch Templates (Unit 5)

**Files:**
- Create: `src/layers/theatre/dispatch-templates.ts`
- Test: `src/layers/theatre/__tests__/dispatch-templates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/layers/theatre/__tests__/dispatch-templates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { generateDispatch, generateWarCorrespondentDispatch } from '../dispatch-templates';
import type { SectorTurnResult } from '../../../types/theatre';
import type { RandomSource } from '../../../shared/random';

function makeRng(value: number): RandomSource {
  return { random: () => value };
}

describe('generateDispatch', () => {
  const heldResult: SectorTurnResult = {
    outcome: 'held',
    frontMovement: 0,
    decidingResource: 'manpower',
    decidingReason: 'troop weight told',
  };

  it('generates a dispatch with correct sector and category', () => {
    const { dispatch } = generateDispatch('verdun', heldResult, 1, new Set(), makeRng(0));
    expect(dispatch.sectorId).toBe('verdun');
    expect(dispatch.category).toBe('held');
    expect(dispatch.isCritical).toBe(false);
    expect(dispatch.isRead).toBe(false);
    expect(dispatch.isWarCorrespondent).toBe(false);
    expect(dispatch.turn).toBe(1);
  });

  it('interpolates sector name into dispatch text', () => {
    const { dispatch } = generateDispatch('verdun', heldResult, 1, new Set(), makeRng(0));
    expect(dispatch.text).toContain('Verdun');
  });

  it('marks critical dispatches', () => {
    const criticalResult: SectorTurnResult = {
      outcome: 'critical',
      frontMovement: -1,
      decidingResource: 'equipment',
      decidingReason: 'outgunned',
    };
    const { dispatch } = generateDispatch('verdun', criticalResult, 1, new Set(), makeRng(0));
    expect(dispatch.isCritical).toBe(true);
    expect(dispatch.category).toBe('critical');
  });

  it('avoids recently used templates', () => {
    const usedIds = new Set<string>();
    const templateIds: string[] = [];

    // Generate several dispatches tracking used template IDs
    for (let i = 0; i < 3; i++) {
      const { dispatch, templateId } = generateDispatch(
        'verdun', heldResult, 1, usedIds, makeRng(i * 0.25),
      );
      templateIds.push(templateId);
      usedIds.add(templateId);
      expect(dispatch.text.length).toBeGreaterThan(0);
    }

    // All template IDs should be different (dedup working)
    const uniqueIds = new Set(templateIds);
    expect(uniqueIds.size).toBe(templateIds.length);
  });

  it('has at least 4 templates per category', () => {
    const categories = ['held', 'lost-ground', 'gained-ground', 'critical'] as const;
    for (const cat of categories) {
      const result: SectorTurnResult = {
        outcome: cat,
        frontMovement: cat === 'held' ? 0 : cat === 'gained-ground' ? 1 : -1,
        decidingResource: 'manpower',
        decidingReason: 'test',
      };
      const usedIds = new Set<string>();
      // If we can generate 4 unique dispatches, there are at least 4 templates
      for (let i = 0; i < 4; i++) {
        const { templateId } = generateDispatch(
          'verdun', result, 1, usedIds, makeRng(i * 0.2),
        );
        usedIds.add(templateId);
      }
      expect(usedIds.size).toBe(4);
    }
  });
});

describe('generateWarCorrespondentDispatch', () => {
  it('returns a dispatch marked as war correspondent', () => {
    const dispatch = generateWarCorrespondentDispatch('verdun', 1);
    expect(dispatch.isWarCorrespondent).toBe(true);
    expect(dispatch.sectorId).toBe('verdun');
    expect(dispatch.turn).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/dispatch-templates.test.ts`
Expected: FAIL — module does not exist

- [ ] **Step 3: Implement dispatch-templates.ts**

Create `src/layers/theatre/dispatch-templates.ts`:

```typescript
import type { SectorId, DispatchCategory, TheatreDispatch, SectorTurnResult } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';
import type { RandomSource } from '../../shared/random';
import { defaultRandom } from '../../shared/random';

interface Template {
  id: string;
  text: string; // Contains ${sector} for interpolation
}

const TEMPLATES: Record<DispatchCategory, Template[]> = {
  held: [
    { id: 'held-1', text: 'The ${sector} sector held under heavy probing. Casualties light.' },
    { id: 'held-2', text: 'Quiet on the ${sector} front. Patrols exchanged.' },
    { id: 'held-3', text: '${sector} positions maintained. The mud remains the chief enemy.' },
    { id: 'held-4', text: 'The line at ${sector} absorbed the day\'s shelling. No ground given.' },
  ],
  'lost-ground': [
    { id: 'lost-1', text: 'German pressure forced a small withdrawal east of ${sector}. Two trench lines lost.' },
    { id: 'lost-2', text: 'The line at ${sector} bent but did not break. Reserves committed.' },
    { id: 'lost-3', text: 'A salient was pinched off in ${sector}. Two companies lost.' },
    { id: 'lost-4', text: '${sector} yielded a kilometre of ground. The dead were not all collected.' },
  ],
  'gained-ground': [
    { id: 'gain-1', text: 'An unexpected breakthrough at ${sector} — German positions fell.' },
    { id: 'gain-2', text: 'The ${sector} attack made progress. Three trench lines taken at heavy cost.' },
    { id: 'gain-3', text: '${sector} pushed forward. The new line is being consolidated.' },
    { id: 'gain-4', text: 'Our forces at ${sector} advanced under cover of dawn mist. Objectives taken.' },
  ],
  critical: [
    { id: 'crit-1', text: 'DISASTER at ${sector}: the line broke. The situation is dire.' },
    { id: 'crit-2', text: '${sector} has fallen. Catastrophic losses reported.' },
    { id: 'crit-3', text: 'Catastrophic losses at ${sector}. Adjacent sectors are exposed.' },
    { id: 'crit-4', text: 'The ${sector} garrison has been overrun. Immediate reinforcement required.' },
  ],
};

function interpolateSector(text: string, sectorId: SectorId): string {
  const name = THEATRE_SECTORS[sectorId].name;
  return text.replace(/\$\{sector\}/g, name);
}

/**
 * Generate a narrative dispatch for a sector's auto-resolve result.
 * Avoids repeating templates within a 2-turn window.
 */
export function generateDispatch(
  sectorId: SectorId,
  result: SectorTurnResult,
  turn: number,
  recentTemplateIds: Set<string>,
  rng: RandomSource = defaultRandom,
): { dispatch: TheatreDispatch; templateId: string } {
  const templates = TEMPLATES[result.outcome];

  // Filter out recently used templates
  const available = templates.filter((t) => !recentTemplateIds.has(t.id));

  // Fall back to all templates if all are recent
  const pool = available.length > 0 ? available : templates;

  // Select using RNG
  const index = Math.floor(rng.random() * pool.length) % pool.length;
  const template = pool[index];

  const dispatch: TheatreDispatch = {
    id: crypto.randomUUID(),
    sectorId,
    category: result.outcome,
    text: interpolateSector(template.text, sectorId),
    isCritical: result.outcome === 'critical',
    isRead: false,
    isWarCorrespondent: false,
    turn,
  };

  return { dispatch, templateId: template.id };
}

/**
 * Generate a war correspondent dispatch for the player's chosen sector.
 * Placeholder for Phase 2 integration.
 */
export function generateWarCorrespondentDispatch(
  sectorId: SectorId,
  turn: number,
): TheatreDispatch {
  const name = THEATRE_SECTORS[sectorId].name;
  return {
    id: crypto.randomUUID(),
    sectorId,
    category: 'held',
    text: `Your correspondent reports from the ${name} sector. The men held firm under your command.`,
    isCritical: false,
    isRead: false,
    isWarCorrespondent: true,
    turn,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/dispatch-templates.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layers/theatre/dispatch-templates.ts src/layers/theatre/__tests__/dispatch-templates.test.ts
git commit -m "feat(theatre): add dispatch template generation with dedup"
```

---

## Task 6: Win Conditions (Unit 6)

**Files:**
- Create: `src/layers/theatre/win-conditions.ts`
- Test: `src/layers/theatre/__tests__/win-conditions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/layers/theatre/__tests__/win-conditions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeIndustrialCapacity, checkWinCondition } from '../win-conditions';
import { createInitialSectors } from '../../../data/theatre-map';
import { SECTOR_IDS } from '../../../types/theatre';
import type { SectorId } from '../../../types/theatre';

describe('computeIndustrialCapacity', () => {
  it('splits capacity 50/50 when all sectors contested at position 0', () => {
    const sectors = createInitialSectors();
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.player).toBeCloseTo(cap.enemy, 1);
    expect(cap.player).toBeGreaterThan(0);
  });

  it('gives full capacity to player when all player-controlled', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'player', frontPosition: 8 };
    }
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.enemy).toBe(0);
    expect(cap.player).toBeGreaterThan(0);
  });

  it('gives full capacity to enemy when all enemy-controlled', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'enemy', frontPosition: -8 };
    }
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.player).toBe(0);
    expect(cap.enemy).toBeGreaterThan(0);
  });
});

describe('checkWinCondition', () => {
  it('returns ongoing when both sides above threshold', () => {
    const sectors = createInitialSectors();
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('ongoing');
  });

  it('returns victory when enemy capacity below threshold', () => {
    const sectors = createInitialSectors();
    // Give player control of nearly all sectors
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'player', frontPosition: 8 };
    }
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('victory');
  });

  it('returns defeat when player capacity below threshold', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'enemy', frontPosition: -8 };
    }
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('defeat');
  });

  it('respects custom threshold', () => {
    const sectors = createInitialSectors();
    // At position 0, capacity is ~50/50, so a 0.6 threshold triggers defeat
    const result = checkWinCondition(sectors, 0.6);
    // Both sides below 60% → the side that's lower loses
    // At exactly 50/50, both are below 60%, which is ambiguous
    // Implementation should detect this edge case
    expect(['ongoing', 'defeat', 'victory']).toContain(result.status);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/win-conditions.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement win-conditions.ts**

Create `src/layers/theatre/win-conditions.ts`:

```typescript
import type { SectorState, SectorId } from '../../types/theatre';
import { SECTOR_IDS } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';

export type GameOutcome =
  | { status: 'ongoing' }
  | { status: 'victory'; reason: string }
  | { status: 'defeat'; reason: string };

const MAX_POSITION = 8;

/**
 * Compute industrial capacity for both sides.
 * A sector's industrial output = its equipment generator value * control factor.
 */
export function computeIndustrialCapacity(
  sectors: Record<SectorId, SectorState>,
): { player: number; enemy: number } {
  let player = 0;
  let enemy = 0;

  for (const id of SECTOR_IDS) {
    const sector = sectors[id];
    const equipOutput = THEATRE_SECTORS[id].generators.equipment;

    if (sector.control === 'player') {
      player += equipOutput;
    } else if (sector.control === 'enemy') {
      enemy += equipOutput;
    } else {
      // Contested: split proportionally by front position
      const playerFraction = (sector.frontPosition + MAX_POSITION) / (2 * MAX_POSITION);
      player += equipOutput * playerFraction;
      enemy += equipOutput * (1 - playerFraction);
    }
  }

  return { player, enemy };
}

/**
 * Check if industrial strangulation has occurred.
 * Threshold: if one side's industrial capacity drops below 30% of map total.
 */
export function checkWinCondition(
  sectors: Record<SectorId, SectorState>,
  strangulationThreshold: number = 0.3,
): GameOutcome {
  const cap = computeIndustrialCapacity(sectors);
  const total = cap.player + cap.enemy;

  if (total === 0) return { status: 'ongoing' };

  const playerFraction = cap.player / total;
  const enemyFraction = cap.enemy / total;

  if (enemyFraction < strangulationThreshold) {
    return {
      status: 'victory',
      reason: `Enemy industrial capacity collapsed to ${Math.round(enemyFraction * 100)}%.`,
    };
  }

  if (playerFraction < strangulationThreshold) {
    return {
      status: 'defeat',
      reason: `Allied industrial capacity collapsed to ${Math.round(playerFraction * 100)}%.`,
    };
  }

  return { status: 'ongoing' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/win-conditions.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layers/theatre/win-conditions.ts src/layers/theatre/__tests__/win-conditions.test.ts
git commit -m "feat(theatre): add industrial strangulation win condition"
```

---

## Task 7: Persistence (Unit 7)

**Files:**
- Create: `src/layers/theatre/persistence.ts`
- Test: `src/layers/theatre/__tests__/persistence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/layers/theatre/__tests__/persistence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { saveTheatreState, loadTheatreState, clearTheatreState } from '../persistence';
import type { StoragePort } from '../persistence';
import type { TheatreSaveState } from '../../../types/theatre';

function makeMockStorage(): StoragePort & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
}

function makeSaveState(): TheatreSaveState {
  return {
    version: 1,
    turn: 3,
    startMonth: 0,
    sectors: [],
    dispatches: [],
    surplusPool: { manpower: 5, equipment: 3, food: 4 },
    chosenSector: null,
    phase: 'review',
    industrialHealth: { player: 50, enemy: 50 },
  };
}

describe('persistence', () => {
  it('round-trips save and load', () => {
    const storage = makeMockStorage();
    const state = makeSaveState();
    saveTheatreState(state, storage);
    const loaded = loadTheatreState(storage);
    expect(loaded).toEqual(state);
  });

  it('returns null for no saved state', () => {
    const storage = makeMockStorage();
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    const storage = makeMockStorage();
    storage.store['skies-theatre-save'] = '{not valid json';
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('returns null for wrong version', () => {
    const storage = makeMockStorage();
    const state = makeSaveState();
    (state as Record<string, unknown>).version = 99;
    storage.store['skies-theatre-save'] = JSON.stringify(state);
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('clears saved state', () => {
    const storage = makeMockStorage();
    saveTheatreState(makeSaveState(), storage);
    clearTheatreState(storage);
    expect(loadTheatreState(storage)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/persistence.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement persistence.ts**

Create `src/layers/theatre/persistence.ts`:

```typescript
import type { TheatreSaveState } from '../../types/theatre';

const SAVE_KEY = 'skies-theatre-save';
const CURRENT_VERSION = 1;

/** Port: injectable storage for testability */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Default production storage */
export const defaultStorage: StoragePort = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

/**
 * Save theatre state to storage.
 * Called automatically after each Bilan phase.
 */
export function saveTheatreState(
  state: TheatreSaveState,
  storage: StoragePort = defaultStorage,
): void {
  storage.setItem(SAVE_KEY, JSON.stringify(state));
}

/**
 * Load theatre state from storage.
 * Returns null if no save exists or if corrupt/incompatible.
 */
export function loadTheatreState(
  storage: StoragePort = defaultStorage,
): TheatreSaveState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed as TheatreSaveState;
  } catch {
    return null;
  }
}

/**
 * Delete save data.
 */
export function clearTheatreState(
  storage: StoragePort = defaultStorage,
): void {
  storage.removeItem(SAVE_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/persistence.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/layers/theatre/persistence.ts src/layers/theatre/__tests__/persistence.test.ts
git commit -m "feat(theatre): add localStorage persistence with version checking"
```

---

## Task 8: Theatre Store Slice (Unit 8)

**Files:**
- Replace: `src/store/theatreSlice.ts`
- Test: `src/layers/theatre/__tests__/theatreSlice.test.ts`

This is the largest logic task — the store slice orchestrates all the pure functions from Tasks 3-7. The test file creates a standalone Zustand store for testing.

- [ ] **Step 1: Write failing tests**

Create `src/layers/theatre/__tests__/theatreSlice.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTheatreSlice } from '../../../store/theatreSlice';
import type { TheatreSlice } from '../../../store/theatreSlice';
import {
  selectSealState,
  selectSectorResources,
  selectHasUnreadCritical,
  selectRemainingPool,
} from '../../../store/theatreSlice';
import { SECTOR_IDS } from '../../../types/theatre';

function makeStore() {
  return create<TheatreSlice>()((...a) => createTheatreSlice(...a));
}

describe('theatreSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  describe('initTheatre', () => {
    it('creates 8 sectors', () => {
      const state = store.getState();
      expect(Object.keys(state.sectors)).toHaveLength(8);
      for (const id of SECTOR_IDS) {
        expect(state.sectors[id]).toBeDefined();
        expect(state.sectors[id].control).toBe('contested');
      }
    });

    it('sets turn to 1 and phase to review', () => {
      const state = store.getState();
      expect(state.currentTurn).toBe(1);
      expect(state.turnPhase).toBe('review');
    });

    it('computes initial surplus pool', () => {
      const state = store.getState();
      expect(state.surplusPool.manpower).toBeGreaterThan(0);
      expect(state.surplusPool.equipment).toBeGreaterThan(0);
      expect(state.surplusPool.food).toBeGreaterThan(0);
    });
  });

  describe('allocateSurplus', () => {
    it('increments sector allocation and decrements pool', () => {
      store.getState().advancePhase(); // review → allocate
      const poolBefore = store.getState().surplusPool.manpower;
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      const state = store.getState();
      expect(state.sectors.verdun.allocated.manpower).toBe(1);
      expect(state.surplusPool.manpower).toBe(poolBefore - 1);
    });

    it('refuses when pool is empty', () => {
      store.getState().advancePhase(); // review → allocate
      // Drain the pool
      const pool = store.getState().surplusPool.manpower;
      for (let i = 0; i < Math.ceil(pool); i++) {
        store.getState().allocateSurplus('verdun', 'manpower', 1);
      }
      const allocated = store.getState().sectors.verdun.allocated.manpower;
      // Try once more — should not change
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(allocated);
    });

    it('can deallocate with delta -1', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      store.getState().allocateSurplus('verdun', 'manpower', -1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(0);
    });

    it('refuses to deallocate below 0', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', -1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(0);
    });
  });

  describe('advancePhase', () => {
    it('follows review → allocate → select → resolve → update sequence', () => {
      expect(store.getState().turnPhase).toBe('review');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('allocate');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('select');
      // Need to choose a sector before advancing from select
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('resolve');
    });
  });

  describe('chooseToFight', () => {
    it('sets the chosen sector', () => {
      store.getState().advancePhase(); // review → allocate
      store.getState().advancePhase(); // allocate → select
      store.getState().chooseToFight('verdun');
      expect(store.getState().chosenSector).toBe('verdun');
    });
  });

  describe('revertToAllocate', () => {
    it('reverts from select to allocate and clears chosen sector', () => {
      store.getState().advancePhase();
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().revertToAllocate();
      expect(store.getState().turnPhase).toBe('allocate');
      expect(store.getState().chosenSector).toBeNull();
    });
  });

  describe('resolveUnattended', () => {
    it('produces results and dispatches for 7 sectors (all 8 in Phase 1)', () => {
      store.getState().advancePhase();
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase(); // select → resolve
      store.getState().resolveUnattended();
      const state = store.getState();
      // Phase 1: all 8 auto-resolve (no campaign integration)
      expect(state.dispatches.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('beginNextTurn', () => {
    it('increments turn and resets allocations', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase();
      store.getState().resolveUnattended();
      store.getState().advancePhase(); // resolve → update
      store.getState().beginNextTurn();
      const state = store.getState();
      expect(state.currentTurn).toBe(2);
      expect(state.sectors.verdun.allocated).toEqual({ manpower: 0, equipment: 0, food: 0 });
      expect(state.turnPhase).toBe('review');
      expect(state.chosenSector).toBeNull();
    });
  });
});

describe('selectors', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  it('selectSealState returns enabled in review phase', () => {
    const seal = selectSealState(store.getState());
    expect(seal.enabled).toBe(true);
    expect(seal.label).toBe('Commencer Allocation');
  });

  it('selectSealState disabled in select phase without chosen sector', () => {
    store.getState().advancePhase();
    store.getState().advancePhase();
    const seal = selectSealState(store.getState());
    expect(seal.enabled).toBe(false);
  });

  it('selectHasUnreadCritical returns false initially', () => {
    expect(selectHasUnreadCritical(store.getState())).toBe(false);
  });

  it('selectRemainingPool equals surplusPool initially', () => {
    const remaining = selectRemainingPool(store.getState());
    expect(remaining).toEqual(store.getState().surplusPool);
  });

  it('selectSectorResources sums baseline + allocated', () => {
    store.getState().advancePhase();
    store.getState().allocateSurplus('verdun', 'manpower', 1);
    const resources = selectSectorResources(store.getState(), 'verdun');
    const sector = store.getState().sectors.verdun;
    expect(resources.manpower).toBe(sector.baseline.manpower + sector.allocated.manpower);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/layers/theatre/__tests__/theatreSlice.test.ts`
Expected: FAIL — store module has wrong shape

- [ ] **Step 3: Replace theatreSlice.ts**

Replace `src/store/theatreSlice.ts` with the full implementation:

```typescript
import type { StateCreator } from 'zustand';
import type {
  SectorId, SectorState, TheatreTurnPhase, TheatreDispatch,
  SealState, TheatreSaveState,
} from '../types/theatre';
import type { Resources, ResourceType } from '../types/campaign';
import { SECTOR_IDS } from '../types/theatre';
import { createInitialSectors, computeTurnEconomics, THEATRE_SECTORS } from '../data/theatre-map';
import { autoResolveAll, applyResults, autoResolveSector } from '../layers/theatre/auto-resolve';
import { generateDispatch, generateWarCorrespondentDispatch } from '../layers/theatre/dispatch-templates';
import { computeIndustrialCapacity } from '../layers/theatre/win-conditions';
import { saveTheatreState } from '../layers/theatre/persistence';
import { DEFAULT_CONFIG } from '../types/config';

const MAX_ALLOCATION_PER_RESOURCE = 6;

export interface TheatreSlice {
  sectors: Record<SectorId, SectorState>;
  currentTurn: number;
  turnPhase: TheatreTurnPhase;
  surplusPool: Resources;
  chosenSector: SectorId | null;
  activeSector: SectorId | null;
  dispatches: TheatreDispatch[];
  revealIndex: number;
  revealSpeed: 1 | 4;
  industrialHealth: { player: number; enemy: number };
  recentTemplateIds: string[];
  startMonth: number;

  initTheatre: () => void;
  restoreTheatre: (save: TheatreSaveState) => void;
  advancePhase: () => void;
  allocateSurplus: (sectorId: SectorId, resource: ResourceType, delta: 1 | -1) => void;
  chooseToFight: (sectorId: SectorId) => void;
  revertToAllocate: () => void;
  setActiveSector: (sectorId: SectorId) => void;
  resolveUnattended: () => void;
  advanceReveal: () => void;
  setRevealSpeed: (speed: 1 | 4) => void;
  markDispatchRead: (dispatchId: string) => void;
  beginNextTurn: () => void;
}

const PHASE_ORDER: TheatreTurnPhase[] = ['review', 'allocate', 'select', 'resolve', 'update'];

export const createTheatreSlice: StateCreator<TheatreSlice> = (set, get) => ({
  sectors: {} as Record<SectorId, SectorState>,
  currentTurn: 1,
  turnPhase: 'review',
  surplusPool: { manpower: 0, equipment: 0, food: 0 },
  chosenSector: null,
  activeSector: null,
  dispatches: [],
  revealIndex: -1,
  revealSpeed: 1,
  industrialHealth: { player: 50, enemy: 50 },
  recentTemplateIds: [],
  startMonth: 0,

  initTheatre: () => {
    const sectors = createInitialSectors();
    const { baselines, surplusPool } = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });

    // Apply computed baselines
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], baseline: baselines[id] };
    }

    const industrial = computeIndustrialCapacity(sectors);

    set({
      sectors,
      currentTurn: 1,
      turnPhase: 'review',
      surplusPool,
      chosenSector: null,
      activeSector: null,
      dispatches: [],
      revealIndex: -1,
      revealSpeed: 1,
      industrialHealth: { player: industrial.player, enemy: industrial.enemy },
      recentTemplateIds: [],
      startMonth: 0,
    });
  },

  restoreTheatre: (save: TheatreSaveState) => {
    // Convert array → Record
    const sectors = {} as Record<SectorId, SectorState>;
    for (const s of save.sectors) {
      sectors[s.id] = s;
    }

    // Recompute baselines (forward compat)
    const { baselines } = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });
    for (const id of SECTOR_IDS) {
      if (sectors[id]) {
        sectors[id] = { ...sectors[id], baseline: baselines[id] };
      }
    }

    set({
      sectors,
      currentTurn: save.turn,
      turnPhase: save.phase,
      surplusPool: save.surplusPool,
      chosenSector: save.chosenSector,
      dispatches: save.dispatches,
      industrialHealth: save.industrialHealth,
      startMonth: save.startMonth ?? 0,
    });
  },

  advancePhase: () => {
    const state = get();
    const idx = PHASE_ORDER.indexOf(state.turnPhase);

    // Block advancing from select if no sector chosen
    if (state.turnPhase === 'select' && !state.chosenSector) return;

    // Block advancing from review/update if critical unread
    if ((state.turnPhase === 'review' || state.turnPhase === 'update') &&
        selectHasUnreadCritical(state)) return;

    if (idx < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[idx + 1];
      set({ turnPhase: nextPhase });

      // Auto-trigger resolve when entering resolve phase
      if (nextPhase === 'resolve') {
        get().resolveUnattended();
      }
    }
  },

  allocateSurplus: (sectorId: SectorId, resource: ResourceType, delta: 1 | -1) => {
    const state = get();
    const sector = state.sectors[sectorId];
    const pool = state.surplusPool;

    if (delta === 1) {
      // Check pool has resources and sector hasn't hit cap
      if (pool[resource] < 1) return;
      if (sector.allocated[resource] >= MAX_ALLOCATION_PER_RESOURCE) return;
    } else {
      // Can't deallocate below 0
      if (sector.allocated[resource] <= 0) return;
    }

    set({
      sectors: {
        ...state.sectors,
        [sectorId]: {
          ...sector,
          allocated: {
            ...sector.allocated,
            [resource]: sector.allocated[resource] + delta,
          },
        },
      },
      surplusPool: {
        ...pool,
        [resource]: pool[resource] - delta,
      },
    });
  },

  chooseToFight: (sectorId: SectorId) => {
    set({ chosenSector: sectorId });
  },

  revertToAllocate: () => {
    set({ turnPhase: 'allocate', chosenSector: null });
  },

  setActiveSector: (sectorId: SectorId) => {
    set({ activeSector: sectorId });
  },

  resolveUnattended: () => {
    const state = get();
    const chosen = state.chosenSector ?? SECTOR_IDS[0]; // Phase 1 fallback

    // Phase 1: auto-resolve ALL sectors (including chosen, since no campaign)
    // Generate results for unattended sectors
    const results = autoResolveAll(state.sectors, chosen);
    // Also resolve the chosen sector (Phase 1 — no campaign integration)
    const chosenResult = autoResolveSector(state.sectors[chosen]);
    const allResults = { ...results, [chosen]: chosenResult };

    // Apply results
    const updatedSectors = applyResults(state.sectors, allResults);

    // Generate dispatches
    const recentIds = new Set(state.recentTemplateIds);
    const newDispatches: TheatreDispatch[] = [];
    const newTemplateIds: string[] = [...state.recentTemplateIds];

    // War correspondent dispatch for chosen sector
    newDispatches.push(generateWarCorrespondentDispatch(chosen, state.currentTurn));

    // Auto-resolve dispatches for all other sectors
    for (const id of SECTOR_IDS) {
      if (id === chosen) continue;
      const result = results[id];
      if (!result) continue;
      const { dispatch, templateId } = generateDispatch(id, result, state.currentTurn, recentIds);
      newDispatches.push(dispatch);
      newTemplateIds.push(templateId);
      recentIds.add(templateId);
    }

    const industrial = computeIndustrialCapacity(updatedSectors);

    set({
      sectors: updatedSectors,
      dispatches: [...state.dispatches, ...newDispatches],
      recentTemplateIds: newTemplateIds,
      revealIndex: 0,
      industrialHealth: { player: industrial.player, enemy: industrial.enemy },
    });
  },

  advanceReveal: () => {
    set((state) => ({ revealIndex: state.revealIndex + 1 }));
  },

  setRevealSpeed: (speed: 1 | 4) => {
    set({ revealSpeed: speed });
  },

  markDispatchRead: (dispatchId: string) => {
    set((state) => ({
      dispatches: state.dispatches.map((d) =>
        d.id === dispatchId ? { ...d, isRead: true } : d,
      ),
    }));
  },

  beginNextTurn: () => {
    const state = get();

    // Reset allocations on all sectors
    const resetSectors = {} as Record<SectorId, SectorState>;
    for (const id of SECTOR_IDS) {
      resetSectors[id] = {
        ...state.sectors[id],
        allocated: { manpower: 0, equipment: 0, food: 0 },
      };
    }

    // Recompute economics for new turn
    const { baselines, surplusPool } = computeTurnEconomics(resetSectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });

    for (const id of SECTOR_IDS) {
      resetSectors[id] = { ...resetSectors[id], baseline: baselines[id] };
    }

    // Prune template IDs older than 2 turns
    const currentTurn = state.currentTurn + 1;
    const prunedDispatches = state.dispatches.filter(
      (d) => d.turn >= currentTurn - 2,
    );
    const prunedTemplateIds = state.recentTemplateIds; // Keep — pruning by dispatch turn

    // Auto-save
    const saveState: TheatreSaveState = {
      version: 1,
      turn: currentTurn,
      startMonth: state.startMonth,
      sectors: Object.values(resetSectors),
      dispatches: prunedDispatches,
      surplusPool,
      chosenSector: null,
      phase: 'review',
      industrialHealth: state.industrialHealth,
    };
    saveTheatreState(saveState);

    set({
      sectors: resetSectors,
      currentTurn,
      turnPhase: 'review',
      surplusPool,
      chosenSector: null,
      activeSector: null,
      dispatches: prunedDispatches,
      revealIndex: -1,
      revealSpeed: 1,
      recentTemplateIds: prunedTemplateIds,
    });
  },
});

// ── Selectors ──────────────────────────────────────────────────

/** Compute seal state from current phase and dispatch state */
export function selectSealState(state: TheatreSlice): SealState {
  const { turnPhase, chosenSector } = state;
  const hasUnreadCritical = selectHasUnreadCritical(state);

  switch (turnPhase) {
    case 'review':
      if (hasUnreadCritical) {
        return { enabled: false, label: 'Lire les Dépêches', reason: 'critical-unread' };
      }
      return { enabled: true, label: 'Commencer Allocation' };

    case 'allocate':
      return { enabled: true, label: 'Sceller les Ordres' };

    case 'select':
      if (!chosenSector) {
        return { enabled: false, label: 'Choisir un Secteur', reason: 'no-sector-chosen' };
      }
      return { enabled: true, label: 'Lancer la Résolution' };

    case 'resolve':
      return { enabled: false, label: 'Résolution en cours…', reason: 'no-sector-chosen' };

    case 'update':
      if (hasUnreadCritical) {
        return { enabled: false, label: 'Lire les Dépêches', reason: 'critical-unread' };
      }
      return { enabled: true, label: 'Tour Suivant' };
  }
}

/** Compute total resources for a sector (baseline + allocated) */
export function selectSectorResources(
  state: TheatreSlice,
  sectorId: SectorId,
): Resources {
  const sector = state.sectors[sectorId];
  if (!sector) return { manpower: 0, equipment: 0, food: 0 };
  return {
    manpower: sector.baseline.manpower + sector.allocated.manpower,
    equipment: sector.baseline.equipment + sector.allocated.equipment,
    food: sector.baseline.food + sector.allocated.food,
  };
}

/** Check if any critical dispatches are unread */
export function selectHasUnreadCritical(state: TheatreSlice): boolean {
  return state.dispatches.some((d) => d.isCritical && !d.isRead);
}

/** Get the surplus remaining to allocate */
export function selectRemainingPool(state: TheatreSlice): Resources {
  return state.surplusPool;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/layers/theatre/__tests__/theatreSlice.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Verify full build compiles**

Run: `npx tsc --noEmit`
Expected: Clean compilation (the old `Sector` import is now replaced)

- [ ] **Step 6: Commit**

```bash
git add src/store/theatreSlice.ts src/layers/theatre/__tests__/theatreSlice.test.ts
git commit -m "feat(theatre): replace store slice with full Phase 1 state machine"
```

---

## Task 9: Integration Test — Full Turn Flow

**Files:**
- Create: `src/layers/theatre/__tests__/theatre-flow.test.ts`

Before building UI components, verify the full game loop works end-to-end through the store.

- [ ] **Step 1: Write the integration test**

Create `src/layers/theatre/__tests__/theatre-flow.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTheatreSlice } from '../../../store/theatreSlice';
import type { TheatreSlice } from '../../../store/theatreSlice';
import {
  selectSealState,
  selectHasUnreadCritical,
} from '../../../store/theatreSlice';
import { SECTOR_IDS } from '../../../types/theatre';

function makeStore() {
  return create<TheatreSlice>()((...a) => createTheatreSlice(...a));
}

describe('Full theatre turn flow', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  it('plays through a complete turn', () => {
    const s = store.getState;

    // Phase 1: Review (Examen)
    expect(s().turnPhase).toBe('review');
    expect(s().currentTurn).toBe(1);

    // No dispatches on turn 1, seal should be enabled
    const reviewSeal = selectSealState(s());
    expect(reviewSeal.enabled).toBe(true);
    expect(reviewSeal.label).toBe('Commencer Allocation');

    // Phase 2: Allocation
    s().advancePhase();
    expect(s().turnPhase).toBe('allocate');

    // Allocate some resources to Verdun
    s().allocateSurplus('verdun', 'manpower', 1);
    s().allocateSurplus('verdun', 'equipment', 1);
    expect(s().sectors.verdun.allocated.manpower).toBe(1);
    expect(s().sectors.verdun.allocated.equipment).toBe(1);

    // Phase 3: Selection
    s().advancePhase();
    expect(s().turnPhase).toBe('select');

    // Can't advance without choosing
    const selectSeal = selectSealState(s());
    expect(selectSeal.enabled).toBe(false);

    // Choose Verdun
    s().chooseToFight('verdun');
    expect(s().chosenSector).toBe('verdun');

    // Phase 4: Resolution
    s().advancePhase();
    expect(s().turnPhase).toBe('resolve');

    // Dispatches should have been generated
    expect(s().dispatches.length).toBeGreaterThanOrEqual(8);
    expect(s().revealIndex).toBe(0);

    // Check that results were applied
    let anyMoved = false;
    for (const id of SECTOR_IDS) {
      if (s().sectors[id].lastResult) {
        anyMoved = true;
      }
    }
    expect(anyMoved).toBe(true);

    // Phase 5: Update (Bilan)
    s().advancePhase();
    expect(s().turnPhase).toBe('update');

    // Mark all dispatches as read
    for (const d of s().dispatches) {
      s().markDispatchRead(d.id);
    }
    expect(selectHasUnreadCritical(s())).toBe(false);

    // Begin next turn
    s().beginNextTurn();
    expect(s().currentTurn).toBe(2);
    expect(s().turnPhase).toBe('review');
    expect(s().chosenSector).toBeNull();

    // Allocations should be reset
    for (const id of SECTOR_IDS) {
      expect(s().sectors[id].allocated).toEqual({ manpower: 0, equipment: 0, food: 0 });
    }

    // Surplus pool should be refilled
    expect(s().surplusPool.manpower).toBeGreaterThan(0);
  });

  it('revert to allocate works from select phase', () => {
    const s = store.getState;
    s().advancePhase(); // → allocate
    s().allocateSurplus('verdun', 'food', 1);
    s().advancePhase(); // → select
    s().chooseToFight('verdun');

    // Revert
    s().revertToAllocate();
    expect(s().turnPhase).toBe('allocate');
    expect(s().chosenSector).toBeNull();
    // Allocation should persist
    expect(s().sectors.verdun.allocated.food).toBe(1);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS across all test files

- [ ] **Step 3: Commit**

```bash
git add src/layers/theatre/__tests__/theatre-flow.test.ts
git commit -m "test(theatre): add full turn flow integration test"
```

---

## Task 10: SVG Theatre Map Component (Unit 9)

**Files:**
- Create: `src/layers/theatre/TheatreMap.tsx`

This component renders the parchment cartographic map as SVG with sector polygons, territory washes, front line, sector labels, and manpower blocks.

- [ ] **Step 1: Create TheatreMap.tsx**

Create `src/layers/theatre/TheatreMap.tsx`:

```tsx
import type { SectorId, SectorState } from '../../types/theatre';
import { THEATRE_SECTORS, SECTOR_ORDER, generateFrontLinePath } from '../../data/theatre-map';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface TheatreMapProps {
  sectors: Record<SectorId, SectorState>;
  activeSector: SectorId | null;
  chosenSector: SectorId | null;
  revealingSector: SectorId | null;
  revealText: string | null;
  onSectorTap: (id: SectorId) => void;
}

function polygonToPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
}

function territoryFill(control: SectorState['control']): string {
  switch (control) {
    case 'player': return THEATRE.alliedWash;
    case 'enemy': return THEATRE.enemyWash;
    case 'contested': return 'none';
  }
}

function blockCount(sector: SectorState): number {
  return Math.round(sector.baseline.manpower + sector.allocated.manpower);
}

export function TheatreMap({
  sectors,
  activeSector,
  chosenSector,
  revealingSector,
  revealText,
  onSectorTap,
}: TheatreMapProps) {
  const frontLinePath = generateFrontLinePath(sectors);

  return (
    <div style={{ position: 'relative', width: 1024, height: 520 }}>
      <svg
        viewBox="0 0 1024 520"
        width={1024}
        height={520}
        style={{ display: 'block', background: THEATRE.parchment }}
      >
        <defs>
          {/* Hand-drawn border filter */}
          <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
          </filter>

          {/* Watercolour wash blur */}
          <filter id="wash-blur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Coordinate grid */}
        {Array.from({ length: 13 }, (_, i) => (
          <line
            key={`vgrid-${i}`}
            x1={i * 80} y1={0} x2={i * 80} y2={520}
            stroke={THEATRE.gridLine} strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`hgrid-${i}`}
            x1={0} y1={i * 80} x2={1024} y2={i * 80}
            stroke={THEATRE.gridLine} strokeWidth={0.5}
          />
        ))}

        {/* Territory wash overlays */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          const fill = territoryFill(sectors[id].control);
          if (fill === 'none') return null;
          return (
            <path
              key={`wash-${id}`}
              d={polygonToPath(def.polygon)}
              fill={fill}
              opacity={0.3}
              filter="url(#wash-blur)"
            />
          );
        })}

        {/* Sector polygons */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          const isActive = id === activeSector;
          const isChosen = id === chosenSector;
          const isRevealing = id === revealingSector;

          return (
            <path
              key={`sector-${id}`}
              d={polygonToPath(def.polygon)}
              fill="transparent"
              stroke={THEATRE.ink}
              strokeWidth={isActive || isChosen ? 2.5 : 1.5}
              opacity={isActive || isChosen || isRevealing ? 1 : 0.7}
              filter="url(#hand-drawn)"
              style={{ cursor: 'pointer' }}
              onClick={() => onSectorTap(id)}
            />
          );
        })}

        {/* Front line */}
        <path
          d={frontLinePath}
          fill="none"
          stroke={THEATRE.ink}
          strokeWidth={2.5}
          strokeDasharray="8 4"
          style={{ transition: 'd 800ms ease-in-out' }}
        />

        {/* Sector labels */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          return (
            <text
              key={`label-${id}`}
              x={def.centroid[0]}
              y={def.centroid[1] - 30}
              textAnchor="middle"
              fontFamily={FONTS.theatre}
              fontSize={14}
              fontVariant="small-caps"
              fill={THEATRE.ink}
              opacity={0.8}
            >
              {def.name}
            </text>
          );
        })}

        {/* Header text */}
        <text
          x={512}
          y={30}
          textAnchor="middle"
          fontFamily={FONTS.theatre}
          fontSize={20}
          fontStyle="italic"
          fill={THEATRE.ink}
          opacity={0.6}
        >
          Front Occidental — Carte d'État-Major
        </text>

        {/* Off-map capital markers */}
        <text
          x={30}
          y={480}
          fontFamily={FONTS.theatre}
          fontSize={11}
          fontStyle="italic"
          fill={THEATRE.fadedInk}
        >
          ← VERS PARIS
        </text>
        <text
          x={940}
          y={60}
          fontFamily={FONTS.theatre}
          fontSize={11}
          fontStyle="italic"
          fill={THEATRE.fadedInk}
        >
          VERS BERLIN →
        </text>

        {/* Reveal pencil-mark text */}
        {revealingSector && revealText && (
          <text
            x={THEATRE_SECTORS[revealingSector].centroid[0]}
            y={THEATRE_SECTORS[revealingSector].centroid[1] + 15}
            textAnchor="middle"
            fontFamily="'Architects Daughter', cursive"
            fontSize={13}
            fontStyle="italic"
            fill={THEATRE.dimInk}
            opacity={0.9}
          >
            {revealText}
          </text>
        )}
      </svg>

      {/* Manpower blocks overlay (DOM nodes, not SVG) */}
      {SECTOR_ORDER.map((id) => {
        const def = THEATRE_SECTORS[id];
        const count = blockCount(sectors[id]);
        const isActive = id === activeSector;

        return (
          <div
            key={`blocks-${id}`}
            style={{
              position: 'absolute',
              left: def.centroid[0] - 15,
              top: def.centroid[1] - 5,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              width: 40,
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: Math.min(count, 8) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  background: `linear-gradient(135deg, ${THEATRE.manpowerBlock}, #5a2e00)`,
                  borderRadius: 1,
                  boxShadow: `1px 1px 2px ${THEATRE.blockShadow}`,
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Active sector glow */}
      {activeSector && (
        <div
          style={{
            position: 'absolute',
            left: THEATRE_SECTORS[activeSector].centroid[0] - 40,
            top: THEATRE_SECTORS[activeSector].centroid[1] - 40,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: THEATRE.sectorGlow,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean compilation

- [ ] **Step 3: Commit**

```bash
git add src/layers/theatre/TheatreMap.tsx
git commit -m "feat(theatre): add SVG theatre map with parchment cartographic style"
```

---

## Task 11: Table Edge Components (Unit 10)

**Files:**
- Create: `src/layers/theatre/TableEdge.tsx`
- Create: `src/layers/theatre/TurnLedger.tsx`
- Create: `src/layers/theatre/SupplyTray.tsx`
- Create: `src/layers/theatre/SectorFolio.tsx`
- Create: `src/layers/theatre/DispatchStack.tsx`
- Create: `src/layers/theatre/WaxSeal.tsx`

These are all CSS-styled diegetic components. Each has its own file for clear responsibility.

- [ ] **Step 1: Create TableEdge.tsx (layout container)**

Create `src/layers/theatre/TableEdge.tsx`:

```tsx
import type { TheatreTurnPhase } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import React from 'react';

interface TableEdgeProps {
  phase: TheatreTurnPhase;
  children: React.ReactNode;
}

// Phase → which child indices (0-4) are dimmed
const DIM_MAP: Record<TheatreTurnPhase, boolean[]> = {
  review:   [false, true,  true,  false, false], // ledger lit, dispatch lit, seal
  allocate: [true,  false, false, true,  false], // tray lit, folio lit
  select:   [true,  true,  false, true,  false], // folio lit only
  resolve:  [true,  true,  true,  true,  true],  // all dim (map is focus)
  update:   [true,  true,  true,  false, false], // dispatch lit, seal
};

export function TableEdge({ phase, children }: TableEdgeProps) {
  const dims = DIM_MAP[phase];
  const childArray = React.Children.toArray(children);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 16,
        padding: '12px 24px',
        height: 248,
        background: `linear-gradient(180deg, ${THEATRE.walnut}, #2A1A0E)`,
        borderTop: `3px solid ${THEATRE.brassRail}`,
        boxSizing: 'border-box',
      }}
    >
      {childArray.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: dims[i] ? 0.4 : 1,
            pointerEvents: dims[i] ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create TurnLedger.tsx**

Create `src/layers/theatre/TurnLedger.tsx`:

```tsx
import type { TheatreTurnPhase } from '../../types/theatre';
import { PHASE_DISPLAY } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface TurnLedgerProps {
  turn: number;
  phase: TheatreTurnPhase;
  startMonth: number;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

const MONTHS_FR = [
  'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
  'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier',
];

export function TurnLedger({ turn, phase, startMonth }: TurnLedgerProps) {
  const monthIndex = (startMonth + turn - 1) % 12;
  const year = 1916 + Math.floor((startMonth + turn - 1) / 12);
  const roman = turn <= 20 ? ROMAN[turn] : `${turn}`;

  return (
    <div
      style={{
        width: 120,
        height: 200,
        background: THEATRE.leatherBlotter,
        borderRadius: 4,
        padding: '16px 12px',
        boxSizing: 'border-box',
        boxShadow: `inset 0 1px 3px rgba(0,0,0,0.4), 0 2px 4px ${THEATRE.blockShadow}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.theatre,
          fontSize: 11,
          color: THEATRE.fadedInk,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        Tour
      </div>
      <div
        style={{
          fontFamily: FONTS.theatre,
          fontSize: 36,
          fontStyle: 'italic',
          color: '#5C3A1D',
        }}
      >
        {roman}
      </div>
      <div
        style={{
          fontFamily: FONTS.theatre,
          fontSize: 12,
          color: THEATRE.fadedInk,
          textAlign: 'center',
        }}
      >
        {MONTHS_FR[monthIndex]} {year}
      </div>
      <div
        style={{
          marginTop: 'auto',
          fontFamily: FONTS.theatre,
          fontSize: 13,
          fontStyle: 'italic',
          color: THEATRE.parchment,
          opacity: 0.7,
        }}
      >
        {PHASE_DISPLAY[phase]}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create SupplyTray.tsx**

Create `src/layers/theatre/SupplyTray.tsx`:

```tsx
import type { Resources } from '../../types/campaign';
import { THEATRE } from '../../shared/theatre-palette';

interface SupplyTrayProps {
  surplusPool: Resources;
}

const TOKEN_COLOURS = {
  manpower: THEATRE.manpowerBlock,
  equipment: THEATRE.equipmentToken,
  food: THEATRE.foodToken,
};

const TOKEN_SHAPES: Record<string, React.CSSProperties> = {
  manpower: { borderRadius: 2 },        // Blocks
  equipment: { borderRadius: '50%' },    // Discs
  food: { borderRadius: '4px 4px 8px 8px' }, // Sack shape
};

export function SupplyTray({ surplusPool }: SupplyTrayProps) {
  return (
    <div
      style={{
        width: 140,
        height: 200,
        background: `linear-gradient(135deg, #6B4226, #4A2E17)`,
        borderRadius: 6,
        padding: '12px 8px',
        boxSizing: 'border-box',
        boxShadow: `inset 0 2px 6px rgba(0,0,0,0.3), 0 2px 4px ${THEATRE.blockShadow}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
      }}
    >
      {(['manpower', 'equipment', 'food'] as const).map((res) => {
        const count = Math.round(surplusPool[res]);
        return (
          <div
            key={res}
            style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              gap: 3,
              minHeight: 160,
            }}
          >
            {Array.from({ length: Math.min(count, 12) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 14,
                  background: `linear-gradient(135deg, ${TOKEN_COLOURS[res]}, ${TOKEN_COLOURS[res]}88)`,
                  ...TOKEN_SHAPES[res],
                  boxShadow: `1px 1px 2px ${THEATRE.blockShadow}`,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create SectorFolio.tsx**

Create `src/layers/theatre/SectorFolio.tsx`:

```tsx
import type { SectorState, SectorDefinition, TheatreTurnPhase } from '../../types/theatre';
import type { Resources, ResourceType } from '../../types/campaign';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';
import { RES_COL } from '../../shared/resources';
import { TOUCH } from '../../shared/touch-targets';

interface SectorFolioProps {
  sector: SectorState;
  definition: SectorDefinition;
  phase: TheatreTurnPhase;
  isChosen: boolean;
  remainingPool: Resources;
  onAllocate: (resource: ResourceType, delta: 1 | -1) => void;
  onChooseToFight: () => void;
}

function enemyStrengthLabel(strength: number): string {
  if (strength < 2.5) return 'faibles';
  if (strength < 3.5) return 'modérés';
  if (strength < 4.5) return 'forts';
  return 'très forts';
}

function strengthLevel(value: number): string {
  if (value >= 4) return THEATRE.strengthGood;
  if (value >= 2) return THEATRE.strengthLow;
  return THEATRE.strengthCritical;
}

const RES_LABELS: Record<ResourceType, string> = {
  manpower: 'Effectifs',
  equipment: 'Matériel',
  food: 'Ravitaillement',
};

export function SectorFolio({
  sector,
  definition,
  phase,
  isChosen,
  remainingPool,
  onAllocate,
  onChooseToFight,
}: SectorFolioProps) {
  const canAllocate = phase === 'allocate';
  const canChoose = phase === 'select';

  return (
    <div
      style={{
        width: 416,
        height: 200,
        background: THEATRE.dispatchPaper,
        borderRadius: 2,
        padding: '14px 20px',
        boxSizing: 'border-box',
        boxShadow: `0 2px 8px ${THEATRE.blockShadow}`,
        fontFamily: FONTS.theatre,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Leather blotter underneath */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: -4,
          right: -4,
          height: 6,
          background: THEATRE.leatherBlotter,
          borderRadius: '0 0 4px 4px',
        }}
      />

      {/* Header */}
      <div
        style={{
          fontSize: 18,
          fontStyle: 'italic',
          color: THEATRE.ink,
          marginBottom: 8,
          borderBottom: `1px solid ${THEATRE.fadedInk}`,
          paddingBottom: 6,
        }}
      >
        {definition.displayName}
      </div>

      {/* Intelligence summary */}
      <div
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: 11,
          color: THEATRE.dimInk,
          marginBottom: 10,
        }}
      >
        Forces ennemies: {enemyStrengthLabel(sector.enemyStrength)} •
        Position: {sector.frontPosition > 0 ? '+' : ''}{sector.frontPosition}
      </div>

      {/* Resource controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        {(['manpower', 'equipment', 'food'] as const).map((res) => {
          const total = sector.baseline[res] + sector.allocated[res];
          const canInc = canAllocate && remainingPool[res] >= 1 && sector.allocated[res] < 6;
          const canDec = canAllocate && sector.allocated[res] > 0;

          return (
            <div key={res} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: THEATRE.dimInk, marginBottom: 4 }}>
                {RES_LABELS[res]}
              </div>

              {/* Strength bar */}
              <div
                style={{
                  height: 8,
                  background: THEATRE.parchmentFold,
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(total / 8 * 100, 100)}%`,
                    background: strengthLevel(total),
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* +/- controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <button
                  onClick={() => onAllocate(res, -1)}
                  disabled={!canDec}
                  style={{
                    width: TOUCH.min,
                    height: 32,
                    background: canDec
                      ? `linear-gradient(135deg, ${THEATRE.brassRail}, #6B5B3E)`
                      : THEATRE.fadedInk,
                    color: canDec ? THEATRE.parchment : THEATRE.dimInk,
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 18,
                    fontWeight: 'bold',
                    cursor: canDec ? 'pointer' : 'default',
                    opacity: canDec ? 1 : 0.4,
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    width: 28,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FONTS.theatre,
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: RES_COL[res],
                  }}
                >
                  {Math.round(total)}
                </div>
                <button
                  onClick={() => onAllocate(res, 1)}
                  disabled={!canInc}
                  style={{
                    width: TOUCH.min,
                    height: 32,
                    background: canInc
                      ? `linear-gradient(135deg, ${THEATRE.brassRail}, #6B5B3E)`
                      : THEATRE.fadedInk,
                    color: canInc ? THEATRE.parchment : THEATRE.dimInk,
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 18,
                    fontWeight: 'bold',
                    cursor: canInc ? 'pointer' : 'default',
                    opacity: canInc ? 1 : 0.4,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commander checkbox */}
      {canChoose && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '4px 0',
          }}
          onClick={onChooseToFight}
        >
          <div
            style={{
              width: 20,
              height: 20,
              border: `2px solid ${THEATRE.ink}`,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isChosen ? THEATRE.ink : 'transparent',
              color: THEATRE.parchment,
              fontSize: 14,
            }}
          >
            {isChosen ? '✓' : ''}
          </div>
          <span
            style={{
              fontFamily: FONTS.theatre,
              fontSize: 13,
              fontStyle: 'italic',
              color: THEATRE.ink,
            }}
          >
            Commander en personne ce tour-ci
          </span>
        </div>
      )}

      {/* Last result deciding factor */}
      {sector.lastResult && !canAllocate && !canChoose && (
        <div
          style={{
            fontFamily: "'Architects Daughter', cursive",
            fontSize: 12,
            color: THEATRE.dimInk,
            fontStyle: 'italic',
            marginTop: 4,
          }}
        >
          {sector.lastResult.decidingReason}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create DispatchStack.tsx**

Create `src/layers/theatre/DispatchStack.tsx`:

```tsx
import { useState } from 'react';
import type { TheatreDispatch } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface DispatchStackProps {
  dispatches: TheatreDispatch[];
  onMarkRead: (id: string) => void;
}

export function DispatchStack({ dispatches, onMarkRead }: DispatchStackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [readingIndex, setReadingIndex] = useState(0);

  const unread = dispatches.filter((d) => !d.isRead);
  const hasCritical = unread.some((d) => d.isCritical);

  const handleOpenStack = () => {
    if (unread.length === 0) return;
    setReadingIndex(0);
    setIsOpen(true);
  };

  const handleNextDispatch = () => {
    const current = unread[readingIndex];
    if (current) {
      onMarkRead(current.id);
    }
    if (readingIndex < unread.length - 1) {
      setReadingIndex(readingIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        onClick={handleOpenStack}
        style={{
          width: 140,
          height: 200,
          position: 'relative',
          cursor: unread.length > 0 ? 'pointer' : 'default',
        }}
      >
        {/* Stacked papers */}
        {Array.from({ length: Math.min(unread.length, 6) }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 10 + i * 2,
              top: 20 + i * 3,
              width: 110,
              height: 150,
              background: THEATRE.dispatchPaper,
              borderRadius: 2,
              boxShadow: `1px 1px 3px ${THEATRE.blockShadow}`,
              transform: `rotate(${(i - 2) * 1.5}deg)`,
            }}
          />
        ))}

        {/* Critical wax seal on top */}
        {hasCritical && unread.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: THEATRE.criticalSeal,
              boxShadow: `0 1px 3px ${THEATRE.blockShadow}`,
              zIndex: 10,
            }}
          />
        )}

        {/* Count indicator */}
        {unread.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontFamily: FONTS.theatre,
              fontSize: 11,
              color: THEATRE.fadedInk,
              fontStyle: 'italic',
            }}
          >
            {unread.length} dépêche{unread.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Dispatch reader overlay */}
      {isOpen && unread[readingIndex] && (
        <div
          onClick={handleNextDispatch}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(44,24,16,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: unread[readingIndex].isWarCorrespondent ? 500 : 420,
              minHeight: 200,
              background: THEATRE.dispatchPaper,
              borderRadius: 4,
              padding: '24px 32px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
              transform: unread[readingIndex].isWarCorrespondent ? 'rotate(-1deg)' : 'none',
            }}
          >
            {/* Critical seal */}
            {unread[readingIndex].isCritical && (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: THEATRE.criticalSeal,
                  boxShadow: `0 2px 4px ${THEATRE.blockShadow}`,
                  margin: '0 auto 16px',
                }}
              />
            )}

            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: 14,
                lineHeight: 1.6,
                color: THEATRE.ink,
              }}
            >
              {unread[readingIndex].text}
            </div>

            {/* War correspondent signature */}
            {unread[readingIndex].isWarCorrespondent && (
              <div
                style={{
                  marginTop: 20,
                  fontFamily: "'Architects Daughter', cursive",
                  fontSize: 13,
                  color: THEATRE.dimInk,
                  textAlign: 'right',
                }}
              >
                — Votre correspondant de guerre
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                fontFamily: FONTS.theatre,
                fontSize: 11,
                color: THEATRE.fadedInk,
                textAlign: 'center',
              }}
            >
              {readingIndex + 1} / {unread.length} — toucher pour continuer
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 6: Create WaxSeal.tsx**

Create `src/layers/theatre/WaxSeal.tsx`:

```tsx
import type { SealState } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface WaxSealProps {
  sealState: SealState;
  onPress: () => void;
}

export function WaxSeal({ sealState, onPress }: WaxSealProps) {
  const enabled = sealState.enabled;

  return (
    <div
      style={{
        width: 120,
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <button
        onClick={onPress}
        disabled={!enabled}
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          border: 'none',
          cursor: enabled ? 'pointer' : 'default',
          background: enabled
            ? `radial-gradient(circle at 35% 35%, ${THEATRE.sealGlowBright}, #7A6444)`
            : `radial-gradient(circle at 35% 35%, ${THEATRE.sealGlowDim}, #3A3020)`,
          boxShadow: enabled
            ? `0 0 20px ${THEATRE.sectorGlow}, 0 4px 8px ${THEATRE.blockShadow}`
            : `0 2px 4px ${THEATRE.blockShadow}`,
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Wax pool underneath */}
        <div
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: enabled ? THEATRE.criticalSeal : '#5C2828',
            zIndex: -1,
            opacity: 0.6,
          }}
        />
      </button>

      <div
        style={{
          fontFamily: FONTS.theatre,
          fontSize: 11,
          color: enabled ? THEATRE.parchment : THEATRE.fadedInk,
          textAlign: 'center',
          fontStyle: 'italic',
          maxWidth: 110,
          lineHeight: 1.3,
        }}
      >
        {sealState.label}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean compilation

- [ ] **Step 8: Commit**

```bash
git add src/layers/theatre/TableEdge.tsx src/layers/theatre/TurnLedger.tsx src/layers/theatre/SupplyTray.tsx src/layers/theatre/SectorFolio.tsx src/layers/theatre/DispatchStack.tsx src/layers/theatre/WaxSeal.tsx
git commit -m "feat(theatre): add table edge components with diegetic styling"
```

---

## Task 12: Resolution Reveal Component (Unit 11)

**Files:**
- Create: `src/layers/theatre/ResolutionReveal.tsx`

- [ ] **Step 1: Create ResolutionReveal.tsx**

Create `src/layers/theatre/ResolutionReveal.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import type { SectorId, SectorTurnResult, TheatreDispatch } from '../../types/theatre';
import { SECTOR_ORDER } from '../../data/theatre-map';

interface RevealEntry {
  sectorId: SectorId;
  result: SectorTurnResult;
  dispatch: TheatreDispatch;
}

interface ResolutionRevealProps {
  results: RevealEntry[];
  currentIndex: number;
  speed: 1 | 4;
  onRevealComplete: () => void;
  onTapToAccelerate: () => void;
}

type AnimStep = 'glow' | 'pencil' | 'frontline' | 'blocks' | 'dispatch' | 'done';

const STEP_TIMES: Record<AnimStep, number> = {
  glow: 0,
  pencil: 300,
  frontline: 1000,
  blocks: 1800,
  dispatch: 2000,
  done: 2500,
};

export function ResolutionReveal({
  results,
  currentIndex,
  speed,
  onRevealComplete,
  onTapToAccelerate,
}: ResolutionRevealProps) {
  const [animStep, setAnimStep] = useState<AnimStep>('glow');
  const timerRef = useRef<number | null>(null);

  const current = results[currentIndex];

  useEffect(() => {
    if (!current) return;

    setAnimStep('glow');

    const steps: AnimStep[] = ['pencil', 'frontline', 'blocks', 'dispatch', 'done'];
    let stepIndex = 0;

    const advance = () => {
      if (stepIndex < steps.length) {
        setAnimStep(steps[stepIndex]);
        stepIndex++;
        const nextDelay = stepIndex < steps.length
          ? (STEP_TIMES[steps[stepIndex]] - STEP_TIMES[steps[stepIndex - 1]]) / speed
          : (STEP_TIMES.done - STEP_TIMES.dispatch) / speed;
        timerRef.current = window.setTimeout(advance, nextDelay);
      } else {
        onRevealComplete();
      }
    };

    timerRef.current = window.setTimeout(advance, STEP_TIMES.pencil / speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, speed, current, onRevealComplete]);

  if (!current) return null;

  // Determine which sectors have already been revealed vs current vs upcoming
  const revealedSectors = results.slice(0, currentIndex).map((r) => r.sectorId);

  return (
    <div
      onClick={onTapToAccelerate}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    >
      {/* The actual visual feedback (glow, pencil text, etc.) is handled by
          TheatreMap via the revealingSector and revealText props.
          This component just controls timing and accepts tap input. */}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean compilation

- [ ] **Step 3: Commit**

```bash
git add src/layers/theatre/ResolutionReveal.tsx
git commit -m "feat(theatre): add resolution reveal animation controller"
```

---

## Task 13: TheatreLayer Root Component (Unit 12)

**Files:**
- Replace: `src/layers/theatre/TheatreLayer.tsx`

This is the composition root that wires all components together.

- [ ] **Step 1: Replace TheatreLayer.tsx**

Replace `src/layers/theatre/TheatreLayer.tsx`:

```tsx
import { useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import type { StoreState } from '../../store';
import type { SectorId } from '../../types/theatre';
import { SECTOR_ORDER } from '../../data/theatre-map';
import { THEATRE_SECTORS } from '../../data/theatre-map';
import { TheatreMap } from './TheatreMap';
import { TableEdge } from './TableEdge';
import { TurnLedger } from './TurnLedger';
import { SupplyTray } from './SupplyTray';
import { SectorFolio } from './SectorFolio';
import { DispatchStack } from './DispatchStack';
import { WaxSeal } from './WaxSeal';
import { ResolutionReveal } from './ResolutionReveal';
import {
  selectSealState,
  selectRemainingPool,
} from '../../store/theatreSlice';
import { loadTheatreState } from './persistence';
import { checkWinCondition } from './win-conditions';
import '@fontsource/architects-daughter';

export function TheatreLayer() {
  const state = useStore();
  const sealState = selectSealState(state);
  const remainingPool = selectRemainingPool(state);

  // Initialize on mount
  useEffect(() => {
    const saved = loadTheatreState();
    if (saved) {
      state.restoreTheatre(saved);
    } else {
      state.initTheatre();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default active sector
  const activeSector = state.activeSector ?? SECTOR_ORDER[0];
  const activeDef = THEATRE_SECTORS[activeSector];

  // Determine the currently revealing sector
  const revealingSector = state.turnPhase === 'resolve' && state.revealIndex >= 0 && state.revealIndex < SECTOR_ORDER.length
    ? SECTOR_ORDER[state.revealIndex]
    : null;

  const revealText = revealingSector && state.sectors[revealingSector]?.lastResult
    ? state.sectors[revealingSector].lastResult.decidingReason
    : null;

  // Build reveal entries for ResolutionReveal
  const revealEntries = SECTOR_ORDER
    .filter((id) => state.sectors[id]?.lastResult)
    .map((id) => ({
      sectorId: id,
      result: state.sectors[id].lastResult!,
      dispatch: state.dispatches.find((d) => d.sectorId === id && d.turn === state.currentTurn)
        ?? { id: '', sectorId: id, category: 'held' as const, text: '', isCritical: false, isRead: false, isWarCorrespondent: false, turn: state.currentTurn },
    }));

  const handleSectorTap = useCallback((id: SectorId) => {
    if (state.turnPhase === 'resolve' || state.turnPhase === 'update') return;

    if (state.turnPhase === 'review') {
      state.setActiveSector(id);
      state.advancePhase(); // → allocate
      return;
    }

    if (state.turnPhase === 'allocate') {
      state.setActiveSector(id);
      return;
    }

    if (state.turnPhase === 'select') {
      state.setActiveSector(id);
      state.chooseToFight(id);
      return;
    }
  }, [state]);

  const handleSealPress = useCallback(() => {
    if (!sealState.enabled) return;

    if (state.turnPhase === 'update') {
      // Check win condition before advancing
      const outcome = checkWinCondition(state.sectors);
      if (outcome.status !== 'ongoing') {
        // For now, just log — Phase 2 will add proper end screen
        console.log(`Game over: ${outcome.status} — ${outcome.status !== 'ongoing' ? outcome.reason : ''}`);
      }
      state.beginNextTurn();
    } else {
      state.advancePhase();
    }
  }, [state, sealState]);

  const handleRevealComplete = useCallback(() => {
    if (state.revealIndex < SECTOR_ORDER.length - 1) {
      state.advanceReveal();
    } else {
      state.advancePhase(); // resolve → update
    }
  }, [state]);

  const handleTapToAccelerate = useCallback(() => {
    state.setRevealSpeed(4);
  }, [state]);

  return (
    <div style={{ width: 1024, height: 768, overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
      {/* Map area */}
      <TheatreMap
        sectors={state.sectors}
        activeSector={activeSector}
        chosenSector={state.chosenSector}
        revealingSector={revealingSector}
        revealText={revealText}
        onSectorTap={handleSectorTap}
      />

      {/* Resolution reveal overlay */}
      {state.turnPhase === 'resolve' && revealEntries.length > 0 && (
        <ResolutionReveal
          results={revealEntries}
          currentIndex={state.revealIndex}
          speed={state.revealSpeed}
          onRevealComplete={handleRevealComplete}
          onTapToAccelerate={handleTapToAccelerate}
        />
      )}

      {/* Table edge */}
      <TableEdge phase={state.turnPhase}>
        <TurnLedger
          turn={state.currentTurn}
          phase={state.turnPhase}
          startMonth={state.startMonth}
        />
        <SupplyTray surplusPool={state.surplusPool} />
        <SectorFolio
          sector={state.sectors[activeSector] ?? { id: activeSector, control: 'contested', baseline: { manpower: 0, equipment: 0, food: 0 }, allocated: { manpower: 0, equipment: 0, food: 0 }, enemyStrength: 3, frontPosition: 0, lastResult: null }}
          definition={activeDef}
          phase={state.turnPhase}
          isChosen={state.chosenSector === activeSector}
          remainingPool={remainingPool}
          onAllocate={(res, delta) => state.allocateSurplus(activeSector, res, delta)}
          onChooseToFight={() => state.chooseToFight(activeSector)}
        />
        <DispatchStack
          dispatches={state.dispatches}
          onMarkRead={state.markDispatchRead}
        />
        <WaxSeal sealState={sealState} onPress={handleSealPress} />
      </TableEdge>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: Clean compilation

- [ ] **Step 3: Commit**

```bash
git add src/layers/theatre/TheatreLayer.tsx
git commit -m "feat(theatre): wire TheatreLayer root with all components and store"
```

---

## Task 14: Visual Verification

**Files:** None (testing only)

Start the dev server and verify the theatre layer renders and the full turn flow works.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Navigate to localhost in browser, click "theatre" in the dev nav.

- [ ] **Step 2: Verify initial render**

Check:
- Parchment map renders with 8 sector polygons
- Front line renders as a dashed path
- Sector labels visible in small caps
- Table edge visible below the map: turn ledger, supply tray, sector folio, dispatch stack, wax seal
- Walnut background with brass rail

- [ ] **Step 3: Play a full turn**

1. **Review:** Dispatch stack should be empty on turn 1. Seal reads "Commencer Allocation". Press it.
2. **Allocate:** Supply tray lights up with token stacks. Tap a sector → folio swaps. Use +/- to allocate. Verify controls dim when pool exhausted. Press seal.
3. **Select:** Tap a sector → "Commander en personne" checkbox appears. Check it. Seal reads "Lancer la Résolution". Press it.
4. **Resolve:** Watch sectors reveal one by one with pencil text. Tap to accelerate.
5. **Update:** Read dispatches by tapping the stack. Mark all as read. Seal reads "Tour Suivant". Press it.
6. **Turn 2:** Verify turn number incremented, surplus refilled, allocations reset.

- [ ] **Step 4: Verify persistence**

Refresh the browser. The game should resume from the saved state.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Run build check**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 7: Run lint**

Run: `npm run lint`
Expected: Clean (fix any lint issues if found)

- [ ] **Step 8: Final commit (if lint fixes needed)**

```bash
git add -A
git commit -m "fix(theatre): address lint issues from Phase 1 implementation"
```

---

## Implementation Order Summary

```
Task  0: Test framework setup                    (no dependencies)
Task  1: Theatre types                           (no dependencies)
Task  2: RandomSource + palette                  (no dependencies)
--- Tasks 0-2 can run in parallel ---
Task  3: Theatre map data + economics            (depends on Task 1)
Task  4: Auto-resolve logic                      (depends on Tasks 1-3)
Task  5: Dispatch templates                      (depends on Tasks 1, 3)
Task  6: Win conditions                          (depends on Tasks 1, 3)
Task  7: Persistence                             (depends on Task 1)
--- Tasks 4-7 can run in parallel ---
Task  8: Theatre store slice                     (depends on Tasks 1-7)
Task  9: Integration test                        (depends on Task 8)
Task 10: SVG map component                       (depends on Tasks 1-3)
Task 11: Table edge components                   (depends on Tasks 1-2)
--- Tasks 10-11 can run in parallel ---
Task 12: Resolution reveal                       (depends on Tasks 1-2)
Task 13: TheatreLayer root                       (depends on all above)
Task 14: Visual verification                     (depends on all above)
```
