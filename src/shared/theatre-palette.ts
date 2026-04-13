/** Theatre layer colour palette — parchment cartographic style */
export const THEATRE = {
  // Parchment surface
  parchment: '#F5E6D3',
  parchmentFold: '#E8D5B7',
  ink: '#2C1810',
  fadedInk: '#B8A890',
  dimInk: '#5C5040',

  // Territory washes (semi-transparent in use)
  alliedWash: '#B8C8D8',
  enemyWash: '#D8B8B8',

  // Wooden blocks & tokens
  manpowerBlock: '#7b3f00',
  equipmentToken: '#1a3c5e',
  foodToken: '#2d5a1b',
  blockBevel: '#8B7355',
  blockShadow: 'rgba(44,24,16,0.4)',

  // Selection & glow (warm lamp-light, NEVER blue)
  sectorGlow: 'rgba(180,140,80,0.6)',
  sealGlowBright: '#A8916A',
  sealGlowDim: '#5C5040',

  // Table edge
  walnut: '#3D2817',
  brassRail: '#8B7355',
  leatherBlotter: '#4A3728',
  dispatchPaper: '#F0E8D8',
  criticalSeal: '#8B3A3A',

  // Strength indicators
  strengthGood: '#2d6a2d',
  strengthLow: '#b7770d',
  strengthCritical: '#c0392b',

  // Grid overlay
  gridLine: 'rgba(44,24,16,0.08)',
} as const;

export type TheatreColour = typeof THEATRE;
