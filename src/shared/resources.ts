// Resource constants — extracted from frontline-v7.jsx prototype

import type { ResourceType, Resources } from '../types';

export const TOTAL_RES: Resources   = { manpower: 18, equipment: 18, food: 18 };
export const DEFAULT_RES: Resources = { manpower: 6,  equipment: 6,  food: 6  };

/** Relative weight of each resource in composite strength — must sum to 1.0 */
export const RES_WEIGHT: Record<ResourceType, number> = {
  manpower: 0.4,
  equipment: 0.3,
  food: 0.3,
};

export const RES: readonly ResourceType[] = ['manpower', 'equipment', 'food'] as const;

export const RES_ICON: Record<ResourceType, string> = {
  manpower: '👥',
  equipment: '⚙️',
  food: '🌾',
};

export const RES_COL: Record<ResourceType, string> = {
  manpower: '#7b3f00',
  equipment: '#1a3c5e',
  food: '#2d5a1b',
};

export const RES_BG: Record<ResourceType, string> = {
  manpower: '#f5e6d3',
  equipment: '#dce8f5',
  food: '#ddf0dd',
};

export const RES_DESC: Record<ResourceType, { short: string; long: string }> = {
  manpower:  { short: 'Troop numbers', long: 'Raw bodies on the line. Biggest single factor (40% of strength).' },
  equipment: { short: 'Arms & ammunition', long: 'Combat hitting power and defensive capability (30% of strength).' },
  food:      { short: 'Supply lines', long: 'Sustains effectiveness across the full 3-minute campaign (30% of strength).' },
};

export const RES_OUTCOME: Record<ResourceType, { adv: string; ret: string }> = {
  manpower:  { adv: 'troop weight told', ret: 'outmanned on the line' },
  equipment: { adv: 'superior firepower', ret: 'outgunned' },
  food:      { adv: 'well-supplied troops', ret: 'supply lines failing' },
};

export type ResourceLevel = 'good' | 'low' | 'critical';

export const LEVEL_COL: Record<ResourceLevel, string> = {
  good: '#2d6a2d',
  low: '#b7770d',
  critical: '#c0392b',
};

export const LEVEL_BG: Record<ResourceLevel, string> = {
  good: '#d4efdf',
  low: '#fef3cd',
  critical: '#fde8e8',
};
