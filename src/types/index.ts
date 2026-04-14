export type {
  ResourceType,
  Resources,
  AirActionType,
  AircraftPool,
  PulseResult,
  DecidingFactor,
  Segment,
  DispatchEntry,
  CampaignPhase,
} from './campaign';

export type {
  SectorId, SectorDefinition, SectorState, SectorTurnResult,
  DispatchCategory, TheatreDispatch, TheatreTurnPhase,
  SealState, TheatreSaveState,
} from './theatre';
export { SECTOR_IDS, PHASE_DISPLAY, PHASE_DISPLAY_FR } from './theatre';

export type {
  DogfightOrder,
  PilotRank,
  Pilot,
} from './action';

export type {
  Layer,
  GamePhase,
} from './game';

export type { GameConfig } from './config';
export { DEFAULT_CONFIG } from './config';
