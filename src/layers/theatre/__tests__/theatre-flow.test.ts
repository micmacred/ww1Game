import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTheatreSlice } from '../../../store/theatreSlice';
import type { TheatreSlice } from '../../../store/theatreSlice';
import {
  selectSealState,
  selectHasUnreadCritical,
} from '../../../store/theatreSlice';
import { SECTOR_IDS } from '../../../types/theatre';

function makeStore() {
  return create<TheatreSlice>()((...a) => createTheatreSlice(...a));
}

describe('Full theatre turn flow', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  it('plays through a complete turn', () => {
    const s = store.getState;

    // Phase 1: Review (Examen)
    expect(s().turnPhase).toBe('review');
    expect(s().currentTurn).toBe(1);
    const reviewSeal = selectSealState(s());
    expect(reviewSeal.enabled).toBe(true);
    expect(reviewSeal.label).toBe('Begin Allocation');

    // Phase 2: Allocation
    s().advancePhase();
    expect(s().turnPhase).toBe('allocate');
    s().allocateSurplus('verdun', 'manpower', 1);
    s().allocateSurplus('verdun', 'equipment', 1);
    expect(s().sectors.verdun.allocated.manpower).toBe(1);
    expect(s().sectors.verdun.allocated.equipment).toBe(1);

    // Phase 3: Selection
    s().advancePhase();
    expect(s().turnPhase).toBe('select');
    const selectSeal = selectSealState(s());
    expect(selectSeal.enabled).toBe(false);
    s().chooseToFight('verdun');
    expect(s().chosenSector).toBe('verdun');

    // Phase 4: Resolution
    s().advancePhase();
    expect(s().turnPhase).toBe('resolve');
    expect(s().dispatches.length).toBeGreaterThanOrEqual(8);
    expect(s().revealIndex).toBe(0);
    let anyMoved = false;
    for (const id of SECTOR_IDS) {
      if (s().sectors[id].lastResult) anyMoved = true;
    }
    expect(anyMoved).toBe(true);

    // Phase 5: Update (Bilan)
    s().advancePhase();
    expect(s().turnPhase).toBe('update');
    for (const d of s().dispatches) {
      s().markDispatchRead(d.id);
    }
    expect(selectHasUnreadCritical(s())).toBe(false);

    // Begin next turn
    s().beginNextTurn();
    expect(s().currentTurn).toBe(2);
    expect(s().turnPhase).toBe('review');
    expect(s().chosenSector).toBeNull();
    for (const id of SECTOR_IDS) {
      expect(s().sectors[id].allocated).toEqual({ manpower: 0, equipment: 0, food: 0 });
    }
    expect(s().surplusPool.manpower).toBeGreaterThan(0);
  });

  it('revert to allocate works from select phase', () => {
    const s = store.getState;
    s().advancePhase(); // → allocate
    s().allocateSurplus('verdun', 'food', 1);
    s().advancePhase(); // → select
    s().chooseToFight('verdun');
    s().revertToAllocate();
    expect(s().turnPhase).toBe('allocate');
    expect(s().chosenSector).toBeNull();
    expect(s().sectors.verdun.allocated.food).toBe(1);
  });
});
