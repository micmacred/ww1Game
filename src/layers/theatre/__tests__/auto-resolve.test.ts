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
    expect(sectors).toEqual(original);
    for (const id of Object.keys(results) as SectorId[]) {
      expect(updated[id].lastResult).toEqual(results[id]);
      expect(updated[id].frontPosition).toBe(
        sectors[id].frontPosition + results[id].frontMovement,
      );
    }
  });

  it('updates control state when front crosses threshold', () => {
    const sectors = createInitialSectors();
    sectors.flandres = { ...sectors.flandres, frontPosition: 5 };
    const results = autoResolveAll(sectors, 'verdun', makeRng(0.01));
    if (results.flandres && results.flandres.frontMovement === 1) {
      const updated = applyResults(sectors, results);
      expect(updated.flandres.control).toBe('player');
    }
  });
});
