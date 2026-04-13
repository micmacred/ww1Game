import type { TheatreTurnPhase } from '../../types/theatre';
import { PHASE_DISPLAY } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface TurnLedgerProps {
  turn: number;
  phase: TheatreTurnPhase;
  startMonth: number;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

const MONTHS_FR = [
  'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
  'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier',
];

export function TurnLedger({ turn, phase, startMonth }: TurnLedgerProps) {
  const monthIndex = (startMonth + turn - 1) % 12;
  const year = 1916 + Math.floor((startMonth + turn - 1) / 12);
  const roman = turn <= 20 ? ROMAN[turn] : `${turn}`;

  return (
    <div
      style={{
        width: 120,
        height: 200,
        background: THEATRE.leatherBlotter,
        borderRadius: 4,
        padding: '16px 12px',
        boxSizing: 'border-box',
        boxShadow: `inset 0 1px 3px rgba(0,0,0,0.4), 0 2px 4px ${THEATRE.blockShadow}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div style={{ fontFamily: FONTS.theatre, fontSize: 11, color: THEATRE.fadedInk, textTransform: 'uppercase', letterSpacing: 2 }}>
        Tour
      </div>
      <div style={{ fontFamily: FONTS.theatre, fontSize: 36, fontStyle: 'italic', color: '#5C3A1D' }}>
        {roman}
      </div>
      <div style={{ fontFamily: FONTS.theatre, fontSize: 12, color: THEATRE.fadedInk, textAlign: 'center' }}>
        {MONTHS_FR[monthIndex]} {year}
      </div>
      <div style={{ marginTop: 'auto', fontFamily: FONTS.theatre, fontSize: 13, fontStyle: 'italic', color: THEATRE.parchment, opacity: 0.7 }}>
        {PHASE_DISPLAY[phase]}
      </div>
    </div>
  );
}
