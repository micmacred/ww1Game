import { describe, it, expect } from 'vitest';
import { saveTheatreState, loadTheatreState, clearTheatreState } from '../persistence';
import type { StoragePort } from '../persistence';
import type { TheatreSaveState } from '../../../types/theatre';

function makeMockStorage(): StoragePort & { store: Record<string, string> } {
  const store: Record<string, string> = {};
  return {
    store,
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
}

function makeSaveState(): TheatreSaveState {
  return {
    version: 1,
    turn: 3,
    startMonth: 0,
    sectors: [],
    dispatches: [],
    surplusPool: { manpower: 5, equipment: 3, food: 4 },
    chosenSector: null,
    phase: 'review',
    industrialHealth: { player: 50, enemy: 50 },
  };
}

describe('persistence', () => {
  it('round-trips save and load', () => {
    const storage = makeMockStorage();
    const state = makeSaveState();
    saveTheatreState(state, storage);
    const loaded = loadTheatreState(storage);
    expect(loaded).toEqual(state);
  });

  it('returns null for no saved state', () => {
    const storage = makeMockStorage();
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    const storage = makeMockStorage();
    storage.store['skies-theatre-save'] = '{not valid json';
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('returns null for wrong version', () => {
    const storage = makeMockStorage();
    const state = makeSaveState();
    (state as unknown as Record<string, unknown>).version = 99;
    storage.store['skies-theatre-save'] = JSON.stringify(state);
    expect(loadTheatreState(storage)).toBeNull();
  });

  it('clears saved state', () => {
    const storage = makeMockStorage();
    saveTheatreState(makeSaveState(), storage);
    clearTheatreState(storage);
    expect(loadTheatreState(storage)).toBeNull();
  });
});
