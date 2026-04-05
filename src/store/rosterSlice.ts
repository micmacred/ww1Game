import type { StateCreator } from 'zustand';
import type { Pilot } from '../types';

export interface RosterSlice {
  pilots: Pilot[];
  setPilots: (pilots: Pilot[]) => void;
}

export const createRosterSlice: StateCreator<RosterSlice> = (set) => ({
  pilots: [],
  setPilots: (pilots) => set({ pilots }),
});
