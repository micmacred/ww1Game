// ── Campaign Layer Types ─────────────────────────────────────
// Extracted from frontline-v7.jsx prototype

export type ResourceType = 'manpower' | 'equipment' | 'food';

export type Resources = Record<ResourceType, number>;

export type AirActionType = 'dogfight' | 'bombing' | 'recon';

export type AircraftPool = Record<AirActionType, number>;

export interface PulseResult {
  result: 'advance' | 'hold' | 'retreat';
  amount: number;
}

export interface DecidingFactor {
  res: ResourceType;
  reason: string;
}

export interface Segment {
  id: number;
  name: string;
  position: number;
  resources: Resources;
  enemyStrength: number;
  airBonus: number;
  airType: AirActionType | null;
  lastResult: 'advance' | 'hold' | 'retreat' | null;
  lastAmount: number;
  lastFactor: DecidingFactor | null;
  lastAirNote: string | null;
  flash: boolean;
}

export interface DispatchEntry {
  pulse: number | '\u2014';
  major: boolean;
  summary: string;
  detail: string;
  airLines: string[];
}

export type CampaignPhase = 'allocation' | 'battle' | 'complete';
