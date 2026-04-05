// ── Action Layer Types ───────────────────────────────────────
// Placeholder types — will expand when action layer is prototyped

export type DogfightOrder =
  | 'flank-left'
  | 'flank-right'
  | 'dive'
  | 'protect'
  | 'focus-fire'
  | 'scatter'
  | 'disengage';

export type PilotRank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Pilot {
  id: string;
  name: string;
  medals: PilotRank;
  kills: number;
  status: 'active' | 'bench' | 'kia';
}
