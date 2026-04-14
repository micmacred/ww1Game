import type { SectorId, SectorState } from '../../types/theatre';
import { THEATRE_SECTORS, SECTOR_ORDER, generateFrontLinePath } from '../../data/theatre-map';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface TheatreMapProps {
  sectors: Record<SectorId, SectorState>;
  activeSector: SectorId | null;
  chosenSector: SectorId | null;
  revealingSector: SectorId | null;
  revealText: string | null;
  onSectorTap: (id: SectorId) => void;
}

function polygonToPath(points: [number, number][]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
}

function territoryFill(control: SectorState['control']): string {
  switch (control) {
    case 'player': return THEATRE.alliedWash;
    case 'enemy': return THEATRE.enemyWash;
    case 'contested': return 'none';
  }
}

const TOKEN_STYLES: Record<string, React.CSSProperties> = {
  manpower: { borderRadius: 1, background: `linear-gradient(135deg, ${THEATRE.manpowerBlock}, #5a2e00)` },
  equipment: { borderRadius: '50%', background: `linear-gradient(135deg, ${THEATRE.equipmentToken}, #0e2a44)` },
  food: { borderRadius: '4px 4px 6px 6px', background: `linear-gradient(135deg, ${THEATRE.foodToken}, #1a3d10)` },
};

export function TheatreMap({
  sectors,
  activeSector,
  chosenSector,
  revealingSector,
  revealText,
  onSectorTap,
}: TheatreMapProps) {
  const frontLinePath = generateFrontLinePath(sectors);

  return (
    <div style={{ position: 'relative', width: 1024, height: 520 }}>
      <svg
        viewBox="0 0 1024 520"
        width={1024}
        height={520}
        style={{ display: 'block', background: THEATRE.parchment }}
      >
        <defs>
          {/* Hand-drawn border filter */}
          <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
          </filter>

          {/* Watercolour wash blur */}
          <filter id="wash-blur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Coordinate grid */}
        {Array.from({ length: 13 }, (_, i) => (
          <line
            key={`vgrid-${i}`}
            x1={i * 80} y1={0} x2={i * 80} y2={520}
            stroke={THEATRE.gridLine} strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`hgrid-${i}`}
            x1={0} y1={i * 80} x2={1024} y2={i * 80}
            stroke={THEATRE.gridLine} strokeWidth={0.5}
          />
        ))}

        {/* Territory wash overlays */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          const fill = territoryFill(sectors[id].control);
          if (fill === 'none') return null;
          return (
            <path
              key={`wash-${id}`}
              d={polygonToPath(def.polygon)}
              fill={fill}
              opacity={0.3}
              filter="url(#wash-blur)"
            />
          );
        })}

        {/* Sector polygons */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          const isActive = id === activeSector;
          const isChosen = id === chosenSector;
          const isRevealing = id === revealingSector;

          return (
            <path
              key={`sector-${id}`}
              d={polygonToPath(def.polygon)}
              fill="transparent"
              stroke={THEATRE.ink}
              strokeWidth={isActive || isChosen ? 2.5 : 1.5}
              opacity={isActive || isChosen || isRevealing ? 1 : 0.7}
              filter="url(#hand-drawn)"
              style={{ cursor: 'pointer' }}
              onClick={() => onSectorTap(id)}
            />
          );
        })}

        {/* Front line */}
        <path
          d={frontLinePath}
          fill="none"
          stroke={THEATRE.ink}
          strokeWidth={2.5}
          strokeDasharray="8 4"
          style={{ transition: 'd 800ms ease-in-out' }}
        />

        {/* Sector labels */}
        {SECTOR_ORDER.map((id) => {
          const def = THEATRE_SECTORS[id];
          return (
            <text
              key={`label-${id}`}
              x={def.centroid[0]}
              y={def.centroid[1] - 30}
              textAnchor="middle"
              fontFamily={FONTS.theatre}
              fontSize={14}
              fontVariant="small-caps"
              fill={THEATRE.ink}
              opacity={0.8}
            >
              {def.name}
            </text>
          );
        })}

        {/* Header text */}
        <text
          x={512}
          y={30}
          textAnchor="middle"
          fontFamily={FONTS.theatre}
          fontSize={20}
          fontStyle="italic"
          fill={THEATRE.ink}
          opacity={0.6}
        >
          Western Front — Staff Map
        </text>

        {/* Off-map capital markers */}
        <text
          x={30}
          y={480}
          fontFamily={FONTS.theatre}
          fontSize={11}
          fontStyle="italic"
          fill={THEATRE.fadedInk}
        >
          ← TO PARIS
        </text>
        <text
          x={940}
          y={60}
          fontFamily={FONTS.theatre}
          fontSize={11}
          fontStyle="italic"
          fill={THEATRE.fadedInk}
        >
          TO BERLIN →
        </text>

        {/* Reveal pencil-mark text */}
        {revealingSector && revealText && (
          <text
            x={THEATRE_SECTORS[revealingSector].centroid[0]}
            y={THEATRE_SECTORS[revealingSector].centroid[1] + 15}
            textAnchor="middle"
            fontFamily="'Architects Daughter', cursive"
            fontSize={13}
            fontStyle="italic"
            fill={THEATRE.dimInk}
            opacity={0.9}
          >
            {revealText}
          </text>
        )}
      </svg>

      {/* Manpower tokens — near the front (just below centroid, player side) */}
      {SECTOR_ORDER.map((id) => {
        const def = THEATRE_SECTORS[id];
        const count = Math.round(sectors[id].allocated.manpower);
        if (count <= 0) return null;
        return (
          <div
            key={`manpower-${id}`}
            style={{
              position: 'absolute',
              left: def.centroid[0] - 12,
              top: def.centroid[1] + 10,
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              width: 36,
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: Math.min(count, 6) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  ...TOKEN_STYLES.manpower,
                  boxShadow: `1px 1px 2px ${THEATRE.blockShadow}`,
                }}
              />
            ))}
          </div>
        );
      })}

      {/* Equipment + Food tokens — deeper in the rear (further below centroid) */}
      {SECTOR_ORDER.map((id) => {
        const def = THEATRE_SECTORS[id];
        const sector = sectors[id];
        const hasRear = sector.allocated.equipment + sector.allocated.food > 0;
        if (!hasRear) return null;
        return (
          <div
            key={`rear-${id}`}
            style={{
              position: 'absolute',
              left: def.centroid[0] - 16,
              top: def.centroid[1] + 38,
              display: 'flex',
              gap: 6,
              pointerEvents: 'none',
            }}
          >
            {(['equipment', 'food'] as const).map((res) => {
              const count = Math.round(sector.allocated[res]);
              if (count <= 0) return null;
              return (
                <div key={res} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
                  {Array.from({ length: Math.min(count, 6) }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        ...TOKEN_STYLES[res],
                        boxShadow: `1px 1px 2px ${THEATRE.blockShadow}`,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Command marker — flag on chosen sector */}
      {chosenSector && (
        <div
          style={{
            position: 'absolute',
            left: THEATRE_SECTORS[chosenSector].centroid[0] - 8,
            top: THEATRE_SECTORS[chosenSector].centroid[1] - 28,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Flag */}
          <div style={{
            width: 16,
            height: 12,
            background: `linear-gradient(135deg, ${THEATRE.criticalSeal}, #6B2222)`,
            borderRadius: '0 3px 3px 0',
            boxShadow: `1px 1px 3px ${THEATRE.blockShadow}`,
            marginLeft: 2,
          }} />
          {/* Pole */}
          <div style={{
            width: 2,
            height: 18,
            background: THEATRE.ink,
            marginTop: -1,
          }} />
        </div>
      )}

      {/* Active sector glow */}
      {activeSector && (
        <div
          style={{
            position: 'absolute',
            left: THEATRE_SECTORS[activeSector].centroid[0] - 40,
            top: THEATRE_SECTORS[activeSector].centroid[1] - 40,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: THEATRE.sectorGlow,
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
