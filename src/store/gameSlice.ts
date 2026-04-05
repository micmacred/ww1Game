import { StateCreator } from 'zustand';
import type { Layer, GamePhase } from '../types';

export interface GameSlice {
  currentLayer: Layer;
  gamePhase: GamePhase;
  setLayer: (layer: Layer) => void;
  setGamePhase: (phase: GamePhase) => void;
}

export const createGameSlice: StateCreator<GameSlice> = (set) => ({
  currentLayer: 'theatre',
  gamePhase: 'menu',
  setLayer: (layer) => set({ currentLayer: layer }),
  setGamePhase: (phase) => set({ gamePhase: phase }),
});
