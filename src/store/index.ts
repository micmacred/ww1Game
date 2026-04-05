import { create } from 'zustand';
import { createGameSlice, type GameSlice } from './gameSlice';
import { createCampaignSlice, type CampaignSlice } from './campaignSlice';
import { createTheatreSlice, type TheatreSlice } from './theatreSlice';
import { createRosterSlice, type RosterSlice } from './rosterSlice';

export type StoreState = GameSlice & CampaignSlice & TheatreSlice & RosterSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createGameSlice(...a),
  ...createCampaignSlice(...a),
  ...createTheatreSlice(...a),
  ...createRosterSlice(...a),
}));
