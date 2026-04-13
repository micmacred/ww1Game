import { useEffect, useRef } from 'react';
import type { SectorId, SectorTurnResult, TheatreDispatch } from '../../types/theatre';

interface RevealEntry {
  sectorId: SectorId;
  result: SectorTurnResult;
  dispatch: TheatreDispatch;
}

interface ResolutionRevealProps {
  results: RevealEntry[];
  currentIndex: number;
  speed: 1 | 4;
  onRevealComplete: () => void;
  onTapToAccelerate: () => void;
}

type AnimStep = 'glow' | 'pencil' | 'frontline' | 'blocks' | 'dispatch' | 'done';

const STEP_TIMES: Record<AnimStep, number> = {
  glow: 0,
  pencil: 300,
  frontline: 1000,
  blocks: 1800,
  dispatch: 2000,
  done: 2500,
};

export function ResolutionReveal({
  results,
  currentIndex,
  speed,
  onRevealComplete,
  onTapToAccelerate,
}: ResolutionRevealProps) {
  const timerRef = useRef<number | null>(null);

  const current = results[currentIndex];

  useEffect(() => {
    if (!current) return;

    const steps: AnimStep[] = ['pencil', 'frontline', 'blocks', 'dispatch', 'done'];
    let stepIndex = 0;

    const advance = () => {
      if (stepIndex < steps.length) {
        stepIndex++;
        const nextDelay = stepIndex < steps.length
          ? (STEP_TIMES[steps[stepIndex]] - STEP_TIMES[steps[stepIndex - 1]]) / speed
          : (STEP_TIMES.done - STEP_TIMES.dispatch) / speed;
        timerRef.current = window.setTimeout(advance, nextDelay);
      } else {
        onRevealComplete();
      }
    };

    timerRef.current = window.setTimeout(advance, STEP_TIMES.pencil / speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, speed, current, onRevealComplete]);

  if (!current) return null;

  return (
    <div
      onClick={onTapToAccelerate}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        zIndex: 50,
      }}
    />
  );
}
