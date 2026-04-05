// Aircraft constants — extracted from frontline-v7.jsx prototype

import type { AirActionType, AircraftPool } from '../types';

export const AIRCRAFT_START: AircraftPool = { dogfight: 4, bombing: 3, recon: 3 };

export const AIR_ICONS: Record<AirActionType, string> = {
  dogfight: '✈',
  bombing: '💣',
  recon: '📷',
};

export const AIR_LABELS: Record<AirActionType, string> = {
  dogfight: 'Fighters',
  bombing: 'Bombers',
  recon: 'Recon',
};

export const ATTRITION_RISK: Record<AirActionType, { sub: number; major: number }> = {
  dogfight: { sub: 0.22, major: 0.38 },  // most dangerous
  bombing:  { sub: 0.15, major: 0.28 },
  recon:    { sub: 0.10, major: 0.20 },  // least dangerous
};

export const AIR_BONUS: Record<AirActionType, number> = {
  dogfight: 1.5,
  bombing: 1.2,
  recon: 0.8,
};
