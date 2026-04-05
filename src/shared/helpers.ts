// Pure helper functions — extracted from frontline-v7.jsx prototype
// Logic is IDENTICAL to the prototype; do not refactor.

import type { Resources, DecidingFactor, PulseResult, Segment } from '../types';
import { RES, RES_WEIGHT, RES_OUTCOME } from './resources';
import { SEG_NAMES } from './front';

export function segStr(res: Resources, airBonus: number = 0): number {
  return res.manpower * RES_WEIGHT.manpower
       + res.equipment * RES_WEIGHT.equipment
       + res.food * RES_WEIGHT.food
       + (airBonus || 0);
}

export function decidingFactor(
  res: Resources,
  result: 'advance' | 'hold' | 'retreat',
): DecidingFactor {
  // Which resource contributed most (advance) or least (retreat)?
  if (result === 'advance' || result === 'hold') {
    const best = RES.reduce((a, r) =>
      res[r] * RES_WEIGHT[r] > res[a] * RES_WEIGHT[a] ? r : a, RES[0]);
    return { res: best, reason: RES_OUTCOME[best].adv };
  } else {
    const worst = RES.reduce((a, r) =>
      res[r] * RES_WEIGHT[r] < res[a] * RES_WEIGHT[a] ? r : a, RES[0]);
    return { res: worst, reason: RES_OUTCOME[worst].ret };
  }
}

export function resLevel(val: number): 'good' | 'low' | 'critical' {
  if (val >= 4) return 'good';
  if (val >= 2) return 'low';
  return 'critical';
}

export function rollSegment(
  res: Resources,
  enemyStr: number,
  airBonus: number,
  isMajor: boolean,
): PulseResult {
  const pw = segStr(res, airBonus);
  const threshold = pw / (pw + enemyStr);
  const r = Math.random();
  if (isMajor) {
    if (r < threshold * 0.40)  return { result: 'advance', amount: 3 };
    if (r < threshold * 0.75)  return { result: 'advance', amount: 2 };
    if (r < threshold)          return { result: 'advance', amount: 1 };
    if (r < threshold + 0.10)  return { result: 'hold',    amount: 0 };
    if (r < threshold + 0.25)  return { result: 'retreat', amount: 1 };
    if (r < threshold + 0.40)  return { result: 'retreat', amount: 2 };
    return                      { result: 'retreat', amount: 3 };
  } else {
    if (r < threshold * 0.50)  return { result: 'advance', amount: 1 };
    if (r < threshold + 0.20)  return { result: 'hold',    amount: 0 };
    return                      { result: 'retreat', amount: 1 };
  }
}

export function makeSegments(): Segment[] {
  return SEG_NAMES.map((name, i) => ({
    id: i, name,
    position: 0,
    resources: { manpower: 2, equipment: 2, food: 2 },
    enemyStrength: 2.8 + Math.random() * 1.4,
    airBonus: 0,
    airType: null,
    lastResult: null,
    lastAmount: 0,
    lastFactor: null,
    lastAirNote: null,
    flash: false,
  }));
}
