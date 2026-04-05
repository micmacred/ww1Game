import type { StateCreator } from 'zustand';
import type {
  CampaignPhase,
  Segment,
  Resources,
  DispatchEntry,
  AircraftPool,
} from '../types';
import { DEFAULT_RES, AIRCRAFT_START, makeSegments } from '../shared';

export interface CampaignSlice {
  phase: CampaignPhase;
  segments: Segment[];
  reserves: Resources;
  pulseTimer: number;
  pulseCount: number;
  score: number;
  log: DispatchEntry[];
  selectedSegment: number | null;
  rolling: boolean;
  majorFlash: boolean;
  aircraft: AircraftPool;
  initCampaign: () => void;
  setCampaignPhase: (phase: CampaignPhase) => void;
  setSelectedSegment: (id: number | null) => void;
  setSegments: (segments: Segment[]) => void;
  setReserves: (reserves: Resources) => void;
  setPulseTimer: (timer: number) => void;
  setPulseCount: (count: number) => void;
  setScore: (score: number) => void;
  setLog: (log: DispatchEntry[]) => void;
  setRolling: (rolling: boolean) => void;
  setMajorFlash: (flash: boolean) => void;
  setAircraft: (aircraft: AircraftPool) => void;
}

export const createCampaignSlice: StateCreator<CampaignSlice> = (set) => ({
  phase: 'allocation',
  segments: makeSegments(),
  reserves: { ...DEFAULT_RES },
  pulseTimer: 0,
  pulseCount: 0,
  score: 0,
  log: [],
  selectedSegment: null,
  rolling: false,
  majorFlash: false,
  aircraft: { ...AIRCRAFT_START },
  initCampaign: () =>
    set({
      phase: 'allocation',
      segments: makeSegments(),
      reserves: { ...DEFAULT_RES },
      pulseTimer: 0,
      pulseCount: 0,
      score: 0,
      log: [],
      selectedSegment: null,
      rolling: false,
      majorFlash: false,
      aircraft: { ...AIRCRAFT_START },
    }),
  setCampaignPhase: (phase) => set({ phase }),
  setSelectedSegment: (id) => set({ selectedSegment: id }),
  setSegments: (segments) => set({ segments }),
  setReserves: (reserves) => set({ reserves }),
  setPulseTimer: (timer) => set({ pulseTimer: timer }),
  setPulseCount: (count) => set({ pulseCount: count }),
  setScore: (score) => set({ score }),
  setLog: (log) => set({ log }),
  setRolling: (rolling) => set({ rolling }),
  setMajorFlash: (flash) => set({ majorFlash: flash }),
  setAircraft: (aircraft) => set({ aircraft }),
});
