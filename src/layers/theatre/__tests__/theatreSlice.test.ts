import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTheatreSlice } from '../../../store/theatreSlice';
import type { TheatreSlice } from '../../../store/theatreSlice';
import {
  selectSealState,
  selectSectorResources,
  selectHasUnreadCritical,
  selectRemainingPool,
} from '../../../store/theatreSlice';
import { SECTOR_IDS } from '../../../types/theatre';

function makeStore() {
  return create<TheatreSlice>()((...a) => createTheatreSlice(...a));
}

describe('theatreSlice', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  describe('initTheatre', () => {
    it('creates 8 sectors', () => {
      const state = store.getState();
      expect(Object.keys(state.sectors)).toHaveLength(8);
      for (const id of SECTOR_IDS) {
        expect(state.sectors[id]).toBeDefined();
        expect(state.sectors[id].control).toBe('contested');
      }
    });

    it('sets turn to 1 and phase to review', () => {
      const state = store.getState();
      expect(state.currentTurn).toBe(1);
      expect(state.turnPhase).toBe('review');
    });

    it('computes initial surplus pool', () => {
      const state = store.getState();
      expect(state.surplusPool.manpower).toBeGreaterThan(0);
      expect(state.surplusPool.equipment).toBeGreaterThan(0);
      expect(state.surplusPool.food).toBeGreaterThan(0);
    });
  });

  describe('allocateSurplus', () => {
    it('increments sector allocation and decrements pool', () => {
      store.getState().advancePhase(); // review → allocate
      const poolBefore = store.getState().surplusPool.manpower;
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      const state = store.getState();
      expect(state.sectors.verdun.allocated.manpower).toBe(1);
      expect(state.surplusPool.manpower).toBe(poolBefore - 1);
    });

    it('refuses when pool is empty', () => {
      store.getState().advancePhase();
      const pool = store.getState().surplusPool.manpower;
      for (let i = 0; i < Math.ceil(pool); i++) {
        store.getState().allocateSurplus('verdun', 'manpower', 1);
      }
      const allocated = store.getState().sectors.verdun.allocated.manpower;
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(allocated);
    });

    it('can deallocate with delta -1', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      store.getState().allocateSurplus('verdun', 'manpower', -1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(0);
    });

    it('refuses to deallocate below 0', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', -1);
      expect(store.getState().sectors.verdun.allocated.manpower).toBe(0);
    });
  });

  describe('advancePhase', () => {
    it('follows review → allocate → select → resolve → update sequence', () => {
      expect(store.getState().turnPhase).toBe('review');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('allocate');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('select');
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase();
      expect(store.getState().turnPhase).toBe('resolve');
    });
  });

  describe('chooseToFight', () => {
    it('sets the chosen sector', () => {
      store.getState().advancePhase();
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      expect(store.getState().chosenSector).toBe('verdun');
    });
  });

  describe('revertToAllocate', () => {
    it('reverts from select to allocate and clears chosen sector', () => {
      store.getState().advancePhase();
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().revertToAllocate();
      expect(store.getState().turnPhase).toBe('allocate');
      expect(store.getState().chosenSector).toBeNull();
    });
  });

  describe('resolveUnattended', () => {
    it('produces results and dispatches for sectors', () => {
      store.getState().advancePhase();
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase(); // → resolve (triggers resolveUnattended)
      const state = store.getState();
      expect(state.dispatches.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('beginNextTurn', () => {
    it('increments turn and resets allocations', () => {
      store.getState().advancePhase();
      store.getState().allocateSurplus('verdun', 'manpower', 1);
      store.getState().advancePhase();
      store.getState().chooseToFight('verdun');
      store.getState().advancePhase(); // → resolve
      store.getState().advancePhase(); // → update
      store.getState().beginNextTurn();
      const state = store.getState();
      expect(state.currentTurn).toBe(2);
      expect(state.sectors.verdun.allocated).toEqual({ manpower: 0, equipment: 0, food: 0 });
      expect(state.turnPhase).toBe('review');
      expect(state.chosenSector).toBeNull();
    });
  });
});

describe('selectors', () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    store.getState().initTheatre();
  });

  it('selectSealState returns enabled in review phase', () => {
    const seal = selectSealState(store.getState());
    expect(seal.enabled).toBe(true);
    expect(seal.label).toBe('Begin Allocation');
  });

  it('selectSealState disabled in select phase without chosen sector', () => {
    store.getState().advancePhase();
    store.getState().advancePhase();
    const seal = selectSealState(store.getState());
    expect(seal.enabled).toBe(false);
  });

  it('selectHasUnreadCritical returns false initially', () => {
    expect(selectHasUnreadCritical(store.getState())).toBe(false);
  });

  it('selectRemainingPool equals surplusPool initially', () => {
    const remaining = selectRemainingPool(store.getState());
    expect(remaining).toEqual(store.getState().surplusPool);
  });

  it('selectSectorResources sums baseline + allocated', () => {
    store.getState().advancePhase();
    store.getState().allocateSurplus('verdun', 'manpower', 1);
    const resources = selectSectorResources(store.getState(), 'verdun');
    const sector = store.getState().sectors.verdun;
    expect(resources.manpower).toBe(sector.baseline.manpower + sector.allocated.manpower);
  });
});
