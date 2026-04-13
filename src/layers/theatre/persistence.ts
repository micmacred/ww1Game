import type { TheatreSaveState } from '../../types/theatre';

const SAVE_KEY = 'skies-theatre-save';
const CURRENT_VERSION = 1;

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const defaultStorage: StoragePort = typeof window !== 'undefined'
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export function saveTheatreState(
  state: TheatreSaveState,
  storage: StoragePort = defaultStorage,
): void {
  storage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadTheatreState(
  storage: StoragePort = defaultStorage,
): TheatreSaveState | null {
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed as TheatreSaveState;
  } catch {
    return null;
  }
}

export function clearTheatreState(
  storage: StoragePort = defaultStorage,
): void {
  storage.removeItem(SAVE_KEY);
}
