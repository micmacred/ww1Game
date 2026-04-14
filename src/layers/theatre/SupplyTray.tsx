import type { Resources } from '../../types/campaign';
import { THEATRE } from '../../shared/theatre-palette';

interface SupplyTrayProps {
  surplusPool: Resources;
}

const TOKEN_COLOURS = {
  manpower: THEATRE.manpowerBlock,
  equipment: THEATRE.equipmentToken,
  food: THEATRE.foodToken,
};

const TOKEN_SHAPES: Record<string, React.CSSProperties> = {
  manpower: { borderRadius: 2 },
  equipment: { borderRadius: '50%' },
  food: { borderRadius: '4px 4px 8px 8px' },
};

export function SupplyTray({ surplusPool }: SupplyTrayProps) {
  return (
    <div
      style={{
        width: 140,
        height: 200,
        background: `linear-gradient(135deg, #6B4226, #4A2E17)`,
        borderRadius: 6,
        padding: '12px 8px',
        boxSizing: 'border-box',
        boxShadow: `inset 0 2px 6px rgba(0,0,0,0.3), 0 2px 4px ${THEATRE.blockShadow}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
      }}
    >
      {(['manpower', 'equipment', 'food'] as const).map((res) => {
        const count = Math.floor(surplusPool[res]);
        return (
          <div
            key={res}
            style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              gap: 3,
              minHeight: 160,
            }}
          >
            {Array.from({ length: Math.min(count, 12) }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 14,
                  background: `linear-gradient(135deg, ${TOKEN_COLOURS[res]}, ${TOKEN_COLOURS[res]}88)`,
                  ...TOKEN_SHAPES[res],
                  boxShadow: `1px 1px 2px ${THEATRE.blockShadow}`,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
