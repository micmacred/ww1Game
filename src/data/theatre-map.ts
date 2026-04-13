import type { SectorDefinition, SectorId, SectorState } from '../types/theatre';
import type { Resources } from '../types/campaign';
import { SECTOR_IDS } from '../types/theatre';

const PIXELS_PER_POSITION = 3;

export const THEATRE_SECTORS: Record<SectorId, SectorDefinition> = {
  flandres: {
    id: 'flandres',
    name: 'Flandres',
    displayName: 'Secteur de Flandres',
    polygon: [[60, 80], [160, 60], [180, 140], [140, 180], [50, 160]],
    centroid: [120, 120],
    adjacentTo: ['artois'],
    generators: { manpower: 4, equipment: 3, food: 3 },
  },
  artois: {
    id: 'artois',
    name: 'Artois',
    displayName: "Secteur d'Artois",
    polygon: [[160, 60], [300, 100], [280, 200], [180, 200], [180, 140]],
    centroid: [220, 140],
    adjacentTo: ['flandres', 'picardie'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
  picardie: {
    id: 'picardie',
    name: 'Picardie',
    displayName: 'Secteur de Picardie',
    polygon: [[300, 100], [440, 160], [420, 260], [280, 260], [280, 200]],
    centroid: [340, 190],
    adjacentTo: ['artois', 'champagne'],
    generators: { manpower: 3, equipment: 3, food: 4 },
  },
  champagne: {
    id: 'champagne',
    name: 'Champagne',
    displayName: 'Secteur de Champagne',
    polygon: [[440, 160], [560, 200], [540, 300], [420, 300], [420, 260]],
    centroid: [460, 240],
    adjacentTo: ['picardie', 'verdun'],
    generators: { manpower: 4, equipment: 3, food: 4 },
  },
  verdun: {
    id: 'verdun',
    name: 'Verdun',
    displayName: 'Secteur de Verdun',
    polygon: [[560, 200], [660, 240], [640, 340], [540, 340], [540, 300]],
    centroid: [580, 270],
    adjacentTo: ['champagne', 'lorraine'],
    generators: { manpower: 5, equipment: 4, food: 2 },
  },
  lorraine: {
    id: 'lorraine',
    name: 'Lorraine',
    displayName: 'Secteur de Lorraine',
    polygon: [[660, 240], [780, 280], [760, 370], [640, 370], [640, 340]],
    centroid: [700, 310],
    adjacentTo: ['verdun', 'vosges'],
    generators: { manpower: 3, equipment: 5, food: 3 },
  },
  vosges: {
    id: 'vosges',
    name: 'Vosges',
    displayName: 'Secteur des Vosges',
    polygon: [[780, 280], [880, 320], [860, 410], [760, 410], [760, 370]],
    centroid: [810, 350],
    adjacentTo: ['lorraine', 'alsace'],
    generators: { manpower: 2, equipment: 3, food: 4 },
  },
  alsace: {
    id: 'alsace',
    name: 'Alsace',
    displayName: "Secteur d'Alsace",
    polygon: [[880, 320], [970, 360], [960, 450], [860, 450], [860, 410]],
    centroid: [910, 390],
    adjacentTo: ['vosges'],
    generators: { manpower: 3, equipment: 4, food: 3 },
  },
};

/** Ordered array for iteration (west to east) */
export const SECTOR_ORDER: SectorId[] = [
  'flandres', 'artois', 'picardie', 'champagne',
  'verdun', 'lorraine', 'vosges', 'alsace',
];

/** Generate the SVG front line path from sector front positions */
export function generateFrontLinePath(
  sectors: Record<SectorId, { frontPosition: number }>,
): string {
  const points = SECTOR_ORDER.map((id) => {
    const def = THEATRE_SECTORS[id];
    const yOffset = -sectors[id].frontPosition * PIXELS_PER_POSITION;
    return { x: def.centroid[0], y: def.centroid[1] + yOffset };
  });

  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = (p1.x - p0.x) / 3;
    const cp1x = p0.x + dx;
    const cp1y = p0.y;
    const cp2x = p1.x - dx;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  return d;
}

/** Compute baseline and surplus for a new turn */
export function computeTurnEconomics(
  sectors: Record<SectorId, SectorState>,
  config: { surplusToBaselineRatio: number; maxPosition: number },
): {
  baselines: Record<SectorId, Resources>;
  surplusPool: Resources;
} {
  const baselines = {} as Record<SectorId, Resources>;
  const surplusPool: Resources = { manpower: 0, equipment: 0, food: 0 };

  for (const id of SECTOR_IDS) {
    const sector = sectors[id];
    const gen = THEATRE_SECTORS[id].generators;

    let controlFraction: number;
    if (sector.control === 'player') {
      controlFraction = 1;
    } else if (sector.control === 'enemy') {
      controlFraction = 0;
    } else {
      controlFraction = (sector.frontPosition + config.maxPosition) / (2 * config.maxPosition);
    }

    const rawBaseline: Resources = {
      manpower: gen.manpower * controlFraction,
      equipment: gen.equipment * controlFraction,
      food: gen.food * controlFraction,
    };

    const kept: Resources = {
      manpower: rawBaseline.manpower * (1 - config.surplusToBaselineRatio),
      equipment: rawBaseline.equipment * (1 - config.surplusToBaselineRatio),
      food: rawBaseline.food * (1 - config.surplusToBaselineRatio),
    };

    baselines[id] = kept;

    surplusPool.manpower += rawBaseline.manpower * config.surplusToBaselineRatio;
    surplusPool.equipment += rawBaseline.equipment * config.surplusToBaselineRatio;
    surplusPool.food += rawBaseline.food * config.surplusToBaselineRatio;
  }

  // Round surplus pool to 1 decimal for clean display
  surplusPool.manpower = Math.round(surplusPool.manpower * 10) / 10;
  surplusPool.equipment = Math.round(surplusPool.equipment * 10) / 10;
  surplusPool.food = Math.round(surplusPool.food * 10) / 10;

  return { baselines, surplusPool };
}

/** Initial sector states for a new game */
export function createInitialSectors(): Record<SectorId, SectorState> {
  const sectors = {} as Record<SectorId, SectorState>;

  for (const id of SECTOR_IDS) {
    sectors[id] = {
      id,
      control: 'contested',
      baseline: { manpower: 0, equipment: 0, food: 0 },
      allocated: { manpower: 0, equipment: 0, food: 0 },
      enemyStrength: 2.5 + Math.random() * 2.0,
      frontPosition: 0,
      lastResult: null,
    };
  }

  return sectors;
}
