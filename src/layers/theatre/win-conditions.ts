import type { SectorState, SectorId } from '../../types/theatre';
import { SECTOR_IDS } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';

export type GameOutcome =
  | { status: 'ongoing' }
  | { status: 'victory'; reason: string }
  | { status: 'defeat'; reason: string };

const MAX_POSITION = 8;

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
      const playerFraction = (sector.frontPosition + MAX_POSITION) / (2 * MAX_POSITION);
      player += equipOutput * playerFraction;
      enemy += equipOutput * (1 - playerFraction);
    }
  }

  return { player, enemy };
}

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
