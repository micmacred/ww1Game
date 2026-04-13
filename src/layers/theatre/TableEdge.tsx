import type { TheatreTurnPhase } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import React from 'react';

interface TableEdgeProps {
  phase: TheatreTurnPhase;
  children: React.ReactNode;
}

const DIM_MAP: Record<TheatreTurnPhase, boolean[]> = {
  review:   [false, true,  true,  false, false],
  allocate: [true,  false, false, true,  false],
  select:   [true,  true,  false, true,  false],
  resolve:  [true,  true,  true,  true,  true],
  update:   [true,  true,  true,  false, false],
};

export function TableEdge({ phase, children }: TableEdgeProps) {
  const dims = DIM_MAP[phase];
  const childArray = React.Children.toArray(children);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 16,
        padding: '12px 24px',
        height: 248,
        background: `linear-gradient(180deg, ${THEATRE.walnut}, #2A1A0E)`,
        borderTop: `3px solid ${THEATRE.brassRail}`,
        boxSizing: 'border-box',
      }}
    >
      {childArray.map((child, i) => (
        <div
          key={i}
          style={{
            opacity: dims[i] ? 0.4 : 1,
            pointerEvents: dims[i] ? 'none' : 'auto',
            transition: 'opacity 0.3s ease',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
