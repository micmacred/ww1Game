import { useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import type { SectorId } from '../../types/theatre';
import { SECTOR_ORDER, THEATRE_SECTORS } from '../../data/theatre-map';
import { TheatreMap } from './TheatreMap';
import { TableEdge } from './TableEdge';
import { TurnLedger } from './TurnLedger';
import { SupplyTray } from './SupplyTray';
import { SectorFolio } from './SectorFolio';
import { DispatchStack } from './DispatchStack';
import { WaxSeal } from './WaxSeal';
import { ResolutionReveal } from './ResolutionReveal';
import {
  selectSealState,
  selectRemainingPool,
} from '../../store/theatreSlice';
import { loadTheatreState } from './persistence';
import { checkWinCondition } from './win-conditions';
// @ts-expect-error — font package has no type declarations
import '@fontsource/architects-daughter';

export function TheatreLayer() {
  const state = useStore();
  const sealState = selectSealState(state);
  const remainingPool = selectRemainingPool(state);

  // Initialize on mount
  useEffect(() => {
    const saved = loadTheatreState();
    if (saved) {
      state.restoreTheatre(saved);
    } else {
      state.initTheatre();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default active sector
  const activeSector = state.activeSector ?? SECTOR_ORDER[0];
  const activeDef = THEATRE_SECTORS[activeSector];

  // Determine the currently revealing sector
  const revealingSector = state.turnPhase === 'resolve' && state.revealIndex >= 0 && state.revealIndex < SECTOR_ORDER.length
    ? SECTOR_ORDER[state.revealIndex]
    : null;

  const revealText = revealingSector && state.sectors[revealingSector]?.lastResult
    ? state.sectors[revealingSector].lastResult.decidingReason
    : null;

  // Build reveal entries for ResolutionReveal
  const revealEntries = SECTOR_ORDER
    .filter((id) => state.sectors[id]?.lastResult)
    .map((id) => ({
      sectorId: id,
      result: state.sectors[id].lastResult!,
      dispatch: state.dispatches.find((d) => d.sectorId === id && d.turn === state.currentTurn)
        ?? { id: '', sectorId: id, category: 'held' as const, text: '', isCritical: false, isRead: false, isWarCorrespondent: false, turn: state.currentTurn },
    }));

  const handleSectorTap = useCallback((id: SectorId) => {
    if (state.turnPhase === 'resolve' || state.turnPhase === 'update') return;

    if (state.turnPhase === 'review') {
      state.setActiveSector(id);
      state.advancePhase();
      return;
    }

    if (state.turnPhase === 'allocate') {
      state.setActiveSector(id);
      return;
    }

    if (state.turnPhase === 'select') {
      state.setActiveSector(id);
      state.chooseToFight(id);
      return;
    }
  }, [state]);

  const handleSealPress = useCallback(() => {
    if (!sealState.enabled) return;

    if (state.turnPhase === 'update') {
      const outcome = checkWinCondition(state.sectors);
      if (outcome.status !== 'ongoing') {
        console.log(`Game over: ${outcome.status} — ${'reason' in outcome ? outcome.reason : ''}`);
      }
      state.beginNextTurn();
    } else {
      state.advancePhase();
    }
  }, [state, sealState]);

  const handleRevealComplete = useCallback(() => {
    if (state.revealIndex < SECTOR_ORDER.length - 1) {
      state.advanceReveal();
    } else {
      state.advancePhase();
    }
  }, [state]);

  const handleTapToAccelerate = useCallback(() => {
    state.setRevealSpeed(4);
  }, [state]);

  // Don't render until the store is initialized
  const hasInitialized = Object.keys(state.sectors).length > 0;
  if (!hasInitialized) {
    return <div style={{ width: 1024, height: 768, background: '#F5E6D3' }} />;
  }

  return (
    <div style={{ width: 1024, height: 768, overflow: 'hidden', position: 'relative', margin: '0 auto' }}>
      {/* Map area */}
      <TheatreMap
        sectors={state.sectors}
        activeSector={activeSector}
        chosenSector={state.chosenSector}
        revealingSector={revealingSector}
        revealText={revealText}
        onSectorTap={handleSectorTap}
      />

      {/* Resolution reveal overlay */}
      {state.turnPhase === 'resolve' && revealEntries.length > 0 && (
        <ResolutionReveal
          results={revealEntries}
          currentIndex={state.revealIndex}
          speed={state.revealSpeed}
          onRevealComplete={handleRevealComplete}
          onTapToAccelerate={handleTapToAccelerate}
        />
      )}

      {/* Table edge */}
      <TableEdge phase={state.turnPhase}>
        <TurnLedger
          turn={state.currentTurn}
          phase={state.turnPhase}
          startMonth={state.startMonth}
        />
        <SupplyTray surplusPool={state.surplusPool} />
        <SectorFolio
          sector={state.sectors[activeSector] ?? { id: activeSector, control: 'contested', baseline: { manpower: 0, equipment: 0, food: 0 }, allocated: { manpower: 0, equipment: 0, food: 0 }, enemyStrength: 3, frontPosition: 0, lastResult: null }}
          definition={activeDef}
          phase={state.turnPhase}
          isChosen={state.chosenSector === activeSector}
          remainingPool={remainingPool}
          onAllocate={(res, delta) => state.allocateSurplus(activeSector, res, delta)}
        />
        <DispatchStack
          dispatches={state.dispatches}
          onMarkRead={state.markDispatchRead}
        />
        <WaxSeal sealState={sealState} onPress={handleSealPress} />
      </TableEdge>
    </div>
  );
}
