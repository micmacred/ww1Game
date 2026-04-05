import { StateCreator } from 'zustand';
import type { Sector, TheatreTurnPhase } from '../types';

export interface TheatreSlice {
  sectors: Sector[];
  currentTurn: number;
  turnPhase: TheatreTurnPhase;
  setSectors: (sectors: Sector[]) => void;
  setCurrentTurn: (turn: number) => void;
  setTurnPhase: (phase: TheatreTurnPhase) => void;
}

export const createTheatreSlice: StateCreator<TheatreSlice> = (set) => ({
  sectors: [],
  currentTurn: 1,
  turnPhase: 'review',
  setSectors: (sectors) => set({ sectors }),
  setCurrentTurn: (turn) => set({ currentTurn: turn }),
  setTurnPhase: (phase) => set({ turnPhase: phase }),
});
