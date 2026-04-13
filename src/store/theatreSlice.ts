import type { StateCreator } from 'zustand';
import type {
  SectorId, SectorState, TheatreTurnPhase, TheatreDispatch,
  SealState, TheatreSaveState,
} from '../types/theatre';
import type { Resources, ResourceType } from '../types/campaign';
import { SECTOR_IDS } from '../types/theatre';
import { createInitialSectors, computeTurnEconomics } from '../data/theatre-map';
import { autoResolveAll, applyResults, autoResolveSector } from '../layers/theatre/auto-resolve';
import { generateDispatch, generateWarCorrespondentDispatch } from '../layers/theatre/dispatch-templates';
import { computeIndustrialCapacity } from '../layers/theatre/win-conditions';
import { saveTheatreState } from '../layers/theatre/persistence';
import { DEFAULT_CONFIG } from '../types/config';

const MAX_ALLOCATION_PER_RESOURCE = 6;

export interface TheatreSlice {
  sectors: Record<SectorId, SectorState>;
  currentTurn: number;
  turnPhase: TheatreTurnPhase;
  surplusPool: Resources;
  chosenSector: SectorId | null;
  activeSector: SectorId | null;
  dispatches: TheatreDispatch[];
  revealIndex: number;
  revealSpeed: 1 | 4;
  industrialHealth: { player: number; enemy: number };
  recentTemplateIds: string[];
  startMonth: number;

  initTheatre: () => void;
  restoreTheatre: (save: TheatreSaveState) => void;
  advancePhase: () => void;
  allocateSurplus: (sectorId: SectorId, resource: ResourceType, delta: 1 | -1) => void;
  chooseToFight: (sectorId: SectorId) => void;
  revertToAllocate: () => void;
  setActiveSector: (sectorId: SectorId) => void;
  resolveUnattended: () => void;
  advanceReveal: () => void;
  setRevealSpeed: (speed: 1 | 4) => void;
  markDispatchRead: (dispatchId: string) => void;
  beginNextTurn: () => void;
}

const PHASE_ORDER: TheatreTurnPhase[] = ['review', 'allocate', 'select', 'resolve', 'update'];

export const createTheatreSlice: StateCreator<TheatreSlice> = (set, get) => ({
  sectors: {} as Record<SectorId, SectorState>,
  currentTurn: 1,
  turnPhase: 'review',
  surplusPool: { manpower: 0, equipment: 0, food: 0 },
  chosenSector: null,
  activeSector: null,
  dispatches: [],
  revealIndex: -1,
  revealSpeed: 1,
  industrialHealth: { player: 50, enemy: 50 },
  recentTemplateIds: [],
  startMonth: 0,

  initTheatre: () => {
    const sectors = createInitialSectors();
    const { baselines, surplusPool } = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });
    for (const id of SECTOR_IDS) {
      sectors[id] = { ...sectors[id], baseline: baselines[id] };
    }
    const industrial = computeIndustrialCapacity(sectors);
    set({
      sectors,
      currentTurn: 1,
      turnPhase: 'review',
      surplusPool,
      chosenSector: null,
      activeSector: null,
      dispatches: [],
      revealIndex: -1,
      revealSpeed: 1,
      industrialHealth: { player: industrial.player, enemy: industrial.enemy },
      recentTemplateIds: [],
      startMonth: 0,
    });
  },

  restoreTheatre: (save: TheatreSaveState) => {
    const sectors = {} as Record<SectorId, SectorState>;
    for (const s of save.sectors) {
      sectors[s.id] = s;
    }
    const { baselines } = computeTurnEconomics(sectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });
    for (const id of SECTOR_IDS) {
      if (sectors[id]) {
        sectors[id] = { ...sectors[id], baseline: baselines[id] };
      }
    }
    set({
      sectors,
      currentTurn: save.turn,
      turnPhase: save.phase,
      surplusPool: save.surplusPool,
      chosenSector: save.chosenSector,
      dispatches: save.dispatches,
      industrialHealth: save.industrialHealth,
      startMonth: save.startMonth ?? 0,
    });
  },

  advancePhase: () => {
    const state = get();
    const idx = PHASE_ORDER.indexOf(state.turnPhase);
    if (state.turnPhase === 'select' && !state.chosenSector) return;
    if ((state.turnPhase === 'review' || state.turnPhase === 'update') &&
        selectHasUnreadCritical(state)) return;
    if (idx < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[idx + 1];
      set({ turnPhase: nextPhase });
      if (nextPhase === 'resolve') {
        get().resolveUnattended();
      }
    }
  },

  allocateSurplus: (sectorId: SectorId, resource: ResourceType, delta: 1 | -1) => {
    const state = get();
    const sector = state.sectors[sectorId];
    const pool = state.surplusPool;
    if (delta === 1) {
      if (pool[resource] < 1) return;
      if (sector.allocated[resource] >= MAX_ALLOCATION_PER_RESOURCE) return;
    } else {
      if (sector.allocated[resource] <= 0) return;
    }
    set({
      sectors: {
        ...state.sectors,
        [sectorId]: {
          ...sector,
          allocated: {
            ...sector.allocated,
            [resource]: sector.allocated[resource] + delta,
          },
        },
      },
      surplusPool: {
        ...pool,
        [resource]: pool[resource] - delta,
      },
    });
  },

  chooseToFight: (sectorId: SectorId) => {
    set({ chosenSector: sectorId });
  },

  revertToAllocate: () => {
    set({ turnPhase: 'allocate', chosenSector: null });
  },

  setActiveSector: (sectorId: SectorId) => {
    set({ activeSector: sectorId });
  },

  resolveUnattended: () => {
    const state = get();
    const chosen = state.chosenSector ?? SECTOR_IDS[0];
    const results = autoResolveAll(state.sectors, chosen);
    const chosenResult = autoResolveSector(state.sectors[chosen]);
    const allResults = { ...results, [chosen]: chosenResult };
    const updatedSectors = applyResults(state.sectors, allResults);
    const recentIds = new Set(state.recentTemplateIds);
    const newDispatches: TheatreDispatch[] = [];
    const newTemplateIds: string[] = [...state.recentTemplateIds];
    newDispatches.push(generateWarCorrespondentDispatch(chosen, state.currentTurn));
    for (const id of SECTOR_IDS) {
      if (id === chosen) continue;
      const result = results[id];
      if (!result) continue;
      const { dispatch, templateId } = generateDispatch(id, result, state.currentTurn, recentIds);
      newDispatches.push(dispatch);
      newTemplateIds.push(templateId);
      recentIds.add(templateId);
    }
    const industrial = computeIndustrialCapacity(updatedSectors);
    set({
      sectors: updatedSectors,
      dispatches: [...state.dispatches, ...newDispatches],
      recentTemplateIds: newTemplateIds,
      revealIndex: 0,
      industrialHealth: { player: industrial.player, enemy: industrial.enemy },
    });
  },

  advanceReveal: () => {
    set((state) => ({ revealIndex: state.revealIndex + 1 }));
  },

  setRevealSpeed: (speed: 1 | 4) => {
    set({ revealSpeed: speed });
  },

  markDispatchRead: (dispatchId: string) => {
    set((state) => ({
      dispatches: state.dispatches.map((d) =>
        d.id === dispatchId ? { ...d, isRead: true } : d,
      ),
    }));
  },

  beginNextTurn: () => {
    const state = get();
    const resetSectors = {} as Record<SectorId, SectorState>;
    for (const id of SECTOR_IDS) {
      resetSectors[id] = {
        ...state.sectors[id],
        allocated: { manpower: 0, equipment: 0, food: 0 },
      };
    }
    const { baselines, surplusPool } = computeTurnEconomics(resetSectors, {
      surplusToBaselineRatio: DEFAULT_CONFIG.surplusToBaselineRatio,
      maxPosition: DEFAULT_CONFIG.maxPosition,
    });
    for (const id of SECTOR_IDS) {
      resetSectors[id] = { ...resetSectors[id], baseline: baselines[id] };
    }
    const currentTurn = state.currentTurn + 1;
    const prunedDispatches = state.dispatches.filter(
      (d) => d.turn >= currentTurn - 2,
    );
    const saveState: TheatreSaveState = {
      version: 1,
      turn: currentTurn,
      startMonth: state.startMonth,
      sectors: Object.values(resetSectors),
      dispatches: prunedDispatches,
      surplusPool,
      chosenSector: null,
      phase: 'review',
      industrialHealth: state.industrialHealth,
    };
    saveTheatreState(saveState);
    set({
      sectors: resetSectors,
      currentTurn,
      turnPhase: 'review',
      surplusPool,
      chosenSector: null,
      activeSector: null,
      dispatches: prunedDispatches,
      revealIndex: -1,
      revealSpeed: 1,
      recentTemplateIds: state.recentTemplateIds,
    });
  },
});

// ── Selectors ──────────────────────────────────────────────────

export function selectSealState(state: TheatreSlice): SealState {
  const { turnPhase, chosenSector } = state;
  const hasUnreadCritical = selectHasUnreadCritical(state);

  switch (turnPhase) {
    case 'review':
      if (hasUnreadCritical) {
        return { enabled: false, label: 'Lire les Dépêches', reason: 'critical-unread' };
      }
      return { enabled: true, label: 'Commencer Allocation' };
    case 'allocate':
      return { enabled: true, label: 'Sceller les Ordres' };
    case 'select':
      if (!chosenSector) {
        return { enabled: false, label: 'Choisir un Secteur', reason: 'no-sector-chosen' };
      }
      return { enabled: true, label: 'Lancer la Résolution' };
    case 'resolve':
      return { enabled: false, label: 'Résolution en cours…', reason: 'no-sector-chosen' };
    case 'update':
      if (hasUnreadCritical) {
        return { enabled: false, label: 'Lire les Dépêches', reason: 'critical-unread' };
      }
      return { enabled: true, label: 'Tour Suivant' };
  }
}

export function selectSectorResources(
  state: TheatreSlice,
  sectorId: SectorId,
): Resources {
  const sector = state.sectors[sectorId];
  if (!sector) return { manpower: 0, equipment: 0, food: 0 };
  return {
    manpower: sector.baseline.manpower + sector.allocated.manpower,
    equipment: sector.baseline.equipment + sector.allocated.equipment,
    food: sector.baseline.food + sector.allocated.food,
  };
}

export function selectHasUnreadCritical(state: TheatreSlice): boolean {
  return state.dispatches.some((d) => d.isCritical && !d.isRead);
}

export function selectRemainingPool(state: TheatreSlice): Resources {
  return state.surplusPool;
}
