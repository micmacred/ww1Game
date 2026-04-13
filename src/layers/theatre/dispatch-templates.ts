import type { SectorId, DispatchCategory, TheatreDispatch, SectorTurnResult } from '../../types/theatre';
import { THEATRE_SECTORS } from '../../data/theatre-map';
import type { RandomSource } from '../../shared/random';
import { defaultRandom } from '../../shared/random';

interface Template {
  id: string;
  text: string;
}

const TEMPLATES: Record<DispatchCategory, Template[]> = {
  held: [
    { id: 'held-1', text: 'The ${sector} sector held under heavy probing. Casualties light.' },
    { id: 'held-2', text: 'Quiet on the ${sector} front. Patrols exchanged.' },
    { id: 'held-3', text: '${sector} positions maintained. The mud remains the chief enemy.' },
    { id: 'held-4', text: 'The line at ${sector} absorbed the day\'s shelling. No ground given.' },
  ],
  'lost-ground': [
    { id: 'lost-1', text: 'German pressure forced a small withdrawal east of ${sector}. Two trench lines lost.' },
    { id: 'lost-2', text: 'The line at ${sector} bent but did not break. Reserves committed.' },
    { id: 'lost-3', text: 'A salient was pinched off in ${sector}. Two companies lost.' },
    { id: 'lost-4', text: '${sector} yielded a kilometre of ground. The dead were not all collected.' },
  ],
  'gained-ground': [
    { id: 'gain-1', text: 'An unexpected breakthrough at ${sector} — German positions fell.' },
    { id: 'gain-2', text: 'The ${sector} attack made progress. Three trench lines taken at heavy cost.' },
    { id: 'gain-3', text: '${sector} pushed forward. The new line is being consolidated.' },
    { id: 'gain-4', text: 'Our forces at ${sector} advanced under cover of dawn mist. Objectives taken.' },
  ],
  critical: [
    { id: 'crit-1', text: 'DISASTER at ${sector}: the line broke. The situation is dire.' },
    { id: 'crit-2', text: '${sector} has fallen. Catastrophic losses reported.' },
    { id: 'crit-3', text: 'Catastrophic losses at ${sector}. Adjacent sectors are exposed.' },
    { id: 'crit-4', text: 'The ${sector} garrison has been overrun. Immediate reinforcement required.' },
  ],
};

function interpolateSector(text: string, sectorId: SectorId): string {
  const name = THEATRE_SECTORS[sectorId].name;
  return text.replace(/\$\{sector\}/g, name);
}

export function generateDispatch(
  sectorId: SectorId,
  result: SectorTurnResult,
  turn: number,
  recentTemplateIds: Set<string>,
  rng: RandomSource = defaultRandom,
): { dispatch: TheatreDispatch; templateId: string } {
  const templates = TEMPLATES[result.outcome];
  const available = templates.filter((t) => !recentTemplateIds.has(t.id));
  const pool = available.length > 0 ? available : templates;
  const index = Math.floor(rng.random() * pool.length) % pool.length;
  const template = pool[index];

  const dispatch: TheatreDispatch = {
    id: crypto.randomUUID(),
    sectorId,
    category: result.outcome,
    text: interpolateSector(template.text, sectorId),
    isCritical: result.outcome === 'critical',
    isRead: false,
    isWarCorrespondent: false,
    turn,
  };

  return { dispatch, templateId: template.id };
}

export function generateWarCorrespondentDispatch(
  sectorId: SectorId,
  turn: number,
): TheatreDispatch {
  const name = THEATRE_SECTORS[sectorId].name;
  return {
    id: crypto.randomUUID(),
    sectorId,
    category: 'held',
    text: `Your correspondent reports from the ${name} sector. The men held firm under your command.`,
    isCritical: false,
    isRead: false,
    isWarCorrespondent: true,
    turn,
  };
}
