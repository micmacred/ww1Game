import type { SectorState, SectorDefinition, TheatreTurnPhase } from '../../types/theatre';
import type { Resources, ResourceType } from '../../types/campaign';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';
import { RES_COL } from '../../shared/resources';
import { TOUCH } from '../../shared/touch-targets';

interface SectorFolioProps {
  sector: SectorState;
  definition: SectorDefinition;
  phase: TheatreTurnPhase;
  isChosen: boolean;
  remainingPool: Resources;
  onAllocate: (resource: ResourceType, delta: 1 | -1) => void;
  onChooseToFight: () => void;
}

function enemyStrengthLabel(strength: number): string {
  if (strength < 2.5) return 'faibles';
  if (strength < 3.5) return 'modérés';
  if (strength < 4.5) return 'forts';
  return 'très forts';
}

function strengthLevel(value: number): string {
  if (value >= 4) return THEATRE.strengthGood;
  if (value >= 2) return THEATRE.strengthLow;
  return THEATRE.strengthCritical;
}

const RES_LABELS: Record<ResourceType, string> = {
  manpower: 'Effectifs',
  equipment: 'Matériel',
  food: 'Ravitaillement',
};

export function SectorFolio({
  sector, definition, phase, isChosen, remainingPool, onAllocate, onChooseToFight,
}: SectorFolioProps) {
  const canAllocate = phase === 'allocate';
  const canChoose = phase === 'select';

  return (
    <div style={{
      width: 416, height: 200, background: THEATRE.dispatchPaper,
      borderRadius: 2, padding: '14px 20px', boxSizing: 'border-box',
      boxShadow: `0 2px 8px ${THEATRE.blockShadow}`,
      fontFamily: FONTS.theatre, position: 'relative', overflow: 'hidden',
    }}>
      {/* Leather blotter underneath */}
      <div style={{
        position: 'absolute', bottom: 0, left: -4, right: -4, height: 6,
        background: THEATRE.leatherBlotter, borderRadius: '0 0 4px 4px',
      }} />

      {/* Header */}
      <div style={{
        fontSize: 18, fontStyle: 'italic', color: THEATRE.ink,
        marginBottom: 8, borderBottom: `1px solid ${THEATRE.fadedInk}`, paddingBottom: 6,
      }}>
        {definition.displayName}
      </div>

      {/* Intelligence summary */}
      <div style={{
        fontFamily: "'Special Elite', monospace", fontSize: 11,
        color: THEATRE.dimInk, marginBottom: 10,
      }}>
        Forces ennemies: {enemyStrengthLabel(sector.enemyStrength)} •
        Position: {sector.frontPosition > 0 ? '+' : ''}{sector.frontPosition}
      </div>

      {/* Resource controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        {(['manpower', 'equipment', 'food'] as const).map((res) => {
          const total = sector.baseline[res] + sector.allocated[res];
          const canInc = canAllocate && remainingPool[res] >= 1 && sector.allocated[res] < 6;
          const canDec = canAllocate && sector.allocated[res] > 0;

          return (
            <div key={res} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: THEATRE.dimInk, marginBottom: 4 }}>
                {RES_LABELS[res]}
              </div>
              <div style={{
                height: 8, background: THEATRE.parchmentFold,
                borderRadius: 4, overflow: 'hidden', marginBottom: 6,
              }}>
                <div style={{
                  height: '100%', width: `${Math.min(total / 8 * 100, 100)}%`,
                  background: strengthLevel(total), borderRadius: 4,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <button
                  onClick={() => onAllocate(res, -1)}
                  disabled={!canDec}
                  style={{
                    width: TOUCH.min, height: 32,
                    background: canDec ? `linear-gradient(135deg, ${THEATRE.brassRail}, #6B5B3E)` : THEATRE.fadedInk,
                    color: canDec ? THEATRE.parchment : THEATRE.dimInk,
                    border: 'none', borderRadius: 4, fontSize: 18, fontWeight: 'bold',
                    cursor: canDec ? 'pointer' : 'default', opacity: canDec ? 1 : 0.4,
                  }}
                >−</button>
                <div style={{
                  width: 28, height: 32, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: FONTS.theatre, fontSize: 16,
                  fontWeight: 'bold', color: RES_COL[res],
                }}>{Math.round(total)}</div>
                <button
                  onClick={() => onAllocate(res, 1)}
                  disabled={!canInc}
                  style={{
                    width: TOUCH.min, height: 32,
                    background: canInc ? `linear-gradient(135deg, ${THEATRE.brassRail}, #6B5B3E)` : THEATRE.fadedInk,
                    color: canInc ? THEATRE.parchment : THEATRE.dimInk,
                    border: 'none', borderRadius: 4, fontSize: 18, fontWeight: 'bold',
                    cursor: canInc ? 'pointer' : 'default', opacity: canInc ? 1 : 0.4,
                  }}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commander checkbox */}
      {canChoose && (
        <div onClick={onChooseToFight} style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0',
        }}>
          <div style={{
            width: 20, height: 20, border: `2px solid ${THEATRE.ink}`,
            borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isChosen ? THEATRE.ink : 'transparent', color: THEATRE.parchment, fontSize: 14,
          }}>
            {isChosen ? '✓' : ''}
          </div>
          <span style={{
            fontFamily: FONTS.theatre, fontSize: 13, fontStyle: 'italic', color: THEATRE.ink,
          }}>
            Commander en personne ce tour-ci
          </span>
        </div>
      )}

      {/* Last result deciding factor */}
      {sector.lastResult && !canAllocate && !canChoose && (
        <div style={{
          fontFamily: "'Architects Daughter', cursive", fontSize: 12,
          color: THEATRE.dimInk, fontStyle: 'italic', marginTop: 4,
        }}>
          {sector.lastResult.decidingReason}
        </div>
      )}
    </div>
  );
}
