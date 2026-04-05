// ── Theatre Layer Types ──────────────────────────────────────
// Placeholder types — will expand in M2

import type { Resources } from './campaign';

export type SectorId = string;

export interface Sector {
  id: SectorId;
  name: string;
  control: 'player' | 'enemy' | 'contested';
  resources: Resources;
  isCapital: boolean;
}

export type TheatreTurnPhase =
  | 'review'
  | 'allocate'
  | 'select'
  | 'resolve'
  | 'update';
