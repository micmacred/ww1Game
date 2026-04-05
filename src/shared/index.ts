// Barrel re-exports for shared constants and helpers

export { SUB_PULSE_SEC, NUM_PULSES, MAJOR_EVERY } from './timing';

export {
  TOTAL_RES, DEFAULT_RES, RES_WEIGHT, RES,
  RES_ICON, RES_COL, RES_BG, RES_DESC, RES_OUTCOME,
} from './resources';

export { NUM_SEGMENTS, MAX_POS, SEG_NAMES } from './front';

export {
  AIRCRAFT_START, AIR_ICONS, AIR_LABELS, ATTRITION_RISK, AIR_BONUS,
} from './aircraft';

export {
  segStr, decidingFactor, resLevel, rollSegment, makeSegments,
} from './helpers';

export { FONTS } from './typography';
export type { LayerFont } from './typography';

export { TOUCH } from './touch-targets';
