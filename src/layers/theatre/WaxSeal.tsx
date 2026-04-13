import type { SealState } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface WaxSealProps {
  sealState: SealState;
  onPress: () => void;
}

export function WaxSeal({ sealState, onPress }: WaxSealProps) {
  const enabled = sealState.enabled;

  return (
    <div style={{
      width: 120, height: 200, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      <button
        onClick={onPress}
        disabled={!enabled}
        style={{
          width: 88, height: 88, borderRadius: '50%', border: 'none',
          cursor: enabled ? 'pointer' : 'default',
          background: enabled
            ? `radial-gradient(circle at 35% 35%, ${THEATRE.sealGlowBright}, #7A6444)`
            : `radial-gradient(circle at 35% 35%, ${THEATRE.sealGlowDim}, #3A3020)`,
          boxShadow: enabled
            ? `0 0 20px ${THEATRE.sectorGlow}, 0 4px 8px ${THEATRE.blockShadow}`
            : `0 2px 4px ${THEATRE.blockShadow}`,
          position: 'relative',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: enabled ? THEATRE.criticalSeal : '#5C2828',
          zIndex: -1, opacity: 0.6,
        }} />
      </button>
      <div style={{
        fontFamily: FONTS.theatre, fontSize: 11,
        color: enabled ? THEATRE.parchment : THEATRE.fadedInk,
        textAlign: 'center', fontStyle: 'italic', maxWidth: 110, lineHeight: 1.3,
      }}>
        {sealState.label}
      </div>
    </div>
  );
}
