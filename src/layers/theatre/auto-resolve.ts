import type { SectorState, SectorTurnResult, SectorId } from '../../types/theatre';
import type { Resources, ResourceType } from '../../types/campaign';
import { SECTOR_IDS } from '../../types/theatre';
import { RES_WEIGHT, RES_OUTCOME } from '../../shared/resources';
import type { RandomSource } from '../../shared/random';
import { defaultRandom } from '../../shared/random';

const RES_KEYS: readonly ResourceType[] = ['manpower', 'equipment', 'food'];
const MAX_FRONT_MOVEMENT = 1; // WWI pace cap

export function sectorStrength(baseline: Resources, allocated: Resources): number {
  let total = 0;
  for (const r of RES_KEYS) {
    total += (baseline[r] + allocated[r]) * RES_WEIGHT[r];
  }
  return total;
}

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

  const frontMovement = Math.max(-MAX_FRONT_MOVEMENT, Math.min(MAX_FRONT_MOVEMENT, rawMovement));

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
    updated[id] = { ...sector, frontPosition: newPosition, control, lastResult: result };
  }
  return updated;
}
