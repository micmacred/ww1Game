import { describe, it, expect } from 'vitest';
import { generateDispatch, generateWarCorrespondentDispatch } from '../dispatch-templates';
import type { SectorTurnResult } from '../../../types/theatre';
import type { RandomSource } from '../../../shared/random';

function makeRng(value: number): RandomSource {
  return { random: () => value };
}

describe('generateDispatch', () => {
  const heldResult: SectorTurnResult = {
    outcome: 'held',
    frontMovement: 0,
    decidingResource: 'manpower',
    decidingReason: 'troop weight told',
  };

  it('generates a dispatch with correct sector and category', () => {
    const { dispatch } = generateDispatch('verdun', heldResult, 1, new Set(), makeRng(0));
    expect(dispatch.sectorId).toBe('verdun');
    expect(dispatch.category).toBe('held');
    expect(dispatch.isCritical).toBe(false);
    expect(dispatch.isRead).toBe(false);
    expect(dispatch.isWarCorrespondent).toBe(false);
    expect(dispatch.turn).toBe(1);
  });

  it('interpolates sector name into dispatch text', () => {
    const { dispatch } = generateDispatch('verdun', heldResult, 1, new Set(), makeRng(0));
    expect(dispatch.text).toContain('Verdun');
  });

  it('marks critical dispatches', () => {
    const criticalResult: SectorTurnResult = {
      outcome: 'critical',
      frontMovement: -1,
      decidingResource: 'equipment',
      decidingReason: 'outgunned',
    };
    const { dispatch } = generateDispatch('verdun', criticalResult, 1, new Set(), makeRng(0));
    expect(dispatch.isCritical).toBe(true);
    expect(dispatch.category).toBe('critical');
  });

  it('avoids recently used templates', () => {
    const usedIds = new Set<string>();
    const templateIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { dispatch, templateId } = generateDispatch(
        'verdun', heldResult, 1, usedIds, makeRng(i * 0.25),
      );
      templateIds.push(templateId);
      usedIds.add(templateId);
      expect(dispatch.text.length).toBeGreaterThan(0);
    }
    const uniqueIds = new Set(templateIds);
    expect(uniqueIds.size).toBe(templateIds.length);
  });

  it('has at least 4 templates per category', () => {
    const categories = ['held', 'lost-ground', 'gained-ground', 'critical'] as const;
    for (const cat of categories) {
      const result: SectorTurnResult = {
        outcome: cat,
        frontMovement: cat === 'held' ? 0 : cat === 'gained-ground' ? 1 : -1,
        decidingResource: 'manpower',
        decidingReason: 'test',
      };
      const usedIds = new Set<string>();
      for (let i = 0; i < 4; i++) {
        const { templateId } = generateDispatch(
          'verdun', result, 1, usedIds, makeRng(i * 0.2),
        );
        usedIds.add(templateId);
      }
      expect(usedIds.size).toBe(4);
    }
  });
});

describe('generateWarCorrespondentDispatch', () => {
  it('returns a dispatch marked as war correspondent', () => {
    const dispatch = generateWarCorrespondentDispatch('verdun', 1);
    expect(dispatch.isWarCorrespondent).toBe(true);
    expect(dispatch.sectorId).toBe('verdun');
    expect(dispatch.turn).toBe(1);
  });
});
