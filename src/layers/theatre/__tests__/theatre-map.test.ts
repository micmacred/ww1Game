import { describe, it, expect } from 'vitest';
import {
  THEATRE_SECTORS,
  SECTOR_ORDER,
  createInitialSectors,
  computeTurnEconomics,
  generateFrontLinePath,
} from '../../../data/theatre-map';
import { SECTOR_IDS } from '../../../types/theatre';

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
    for (const id of SECTOR_IDS) {
      const gen = THEATRE_SECTORS[id].generators;
      const rawM = gen.manpower * 0.5;
      const rawE = gen.equipment * 0.5;
      const rawF = gen.food * 0.5;
      expect(result.baselines[id].manpower).toBeCloseTo(rawM * 0.7, 1);
      expect(result.baselines[id].equipment).toBeCloseTo(rawE * 0.7, 1);
      expect(result.baselines[id].food).toBeCloseTo(rawF * 0.7, 1);
    }

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
    expect(path).toMatch(/^M/);
    expect(path).toContain('C');
  });
});
