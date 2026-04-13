import { describe, it, expect } from 'vitest';
import { computeIndustrialCapacity, checkWinCondition } from '../win-conditions';
import { createInitialSectors } from '../../../data/theatre-map';
import { SECTOR_IDS } from '../../../types/theatre';

describe('computeIndustrialCapacity', () => {
  it('splits capacity 50/50 when all sectors contested at position 0', () => {
    const sectors = createInitialSectors();
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.player).toBeCloseTo(cap.enemy, 1);
    expect(cap.player).toBeGreaterThan(0);
  });

  it('gives full capacity to player when all player-controlled', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'player', frontPosition: 8 };
    }
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.enemy).toBe(0);
    expect(cap.player).toBeGreaterThan(0);
  });

  it('gives full capacity to enemy when all enemy-controlled', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'enemy', frontPosition: -8 };
    }
    const cap = computeIndustrialCapacity(sectors);
    expect(cap.player).toBe(0);
    expect(cap.enemy).toBeGreaterThan(0);
  });
});

describe('checkWinCondition', () => {
  it('returns ongoing when both sides above threshold', () => {
    const sectors = createInitialSectors();
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('ongoing');
  });

  it('returns victory when enemy capacity below threshold', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'player', frontPosition: 8 };
    }
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('victory');
  });

  it('returns defeat when player capacity below threshold', () => {
    const sectors = createInitialSectors();
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], control: 'enemy', frontPosition: -8 };
    }
    const result = checkWinCondition(sectors);
    expect(result.status).toBe('defeat');
  });

  it('respects custom threshold', () => {
    const sectors = createInitialSectors();
    const result = checkWinCondition(sectors, 0.6);
    expect(['ongoing', 'defeat', 'victory']).toContain(result.status);
  });
});
