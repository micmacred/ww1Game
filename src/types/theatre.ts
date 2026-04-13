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
