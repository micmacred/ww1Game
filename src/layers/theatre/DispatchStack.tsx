import { useState } from 'react';
import type { TheatreDispatch } from '../../types/theatre';
import { THEATRE } from '../../shared/theatre-palette';
import { FONTS } from '../../shared/typography';

interface DispatchStackProps {
  dispatches: TheatreDispatch[];
  onMarkRead: (id: string) => void;
}

export function DispatchStack({ dispatches, onMarkRead }: DispatchStackProps) {
  const [readingIndex, setReadingIndex] = useState(0);
  // Snapshot of unread dispatches, captured when reader opens — stable during reading
  const [snapshot, setSnapshot] = useState<TheatreDispatch[]>([]);

  const unread = dispatches.filter((d) => !d.isRead);
  const hasCritical = unread.some((d) => d.isCritical);
  const isOpen = snapshot.length > 0;

  const handleOpenStack = () => {
    if (unread.length === 0) return;
    setSnapshot([...unread]);
    setReadingIndex(0);
  };

  const current = isOpen ? snapshot[readingIndex] : null;

  const handleNextDispatch = () => {
    if (current) onMarkRead(current.id);
    if (readingIndex < snapshot.length - 1) {
      setReadingIndex(readingIndex + 1);
    } else {
      setSnapshot([]);
    }
  };

  return (
    <>
      <div onClick={handleOpenStack} style={{
        width: 140, height: 200, position: 'relative',
        cursor: unread.length > 0 ? 'pointer' : 'default',
      }}>
        {Array.from({ length: Math.min(unread.length, 6) }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 10 + i * 2, top: 20 + i * 3,
            width: 110, height: 150, background: THEATRE.dispatchPaper,
            borderRadius: 2, boxShadow: `1px 1px 3px ${THEATRE.blockShadow}`,
            transform: `rotate(${(i - 2) * 1.5}deg)`,
          }} />
        ))}
        {hasCritical && unread.length > 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10, width: 24, height: 24,
            borderRadius: '50%', background: THEATRE.criticalSeal,
            boxShadow: `0 1px 3px ${THEATRE.blockShadow}`, zIndex: 10,
          }} />
        )}
        {unread.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            fontFamily: FONTS.theatre, fontSize: 11, color: THEATRE.fadedInk, fontStyle: 'italic',
          }}>
            {unread.length} dispatch{unread.length > 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {isOpen && current && (
        <div onClick={handleNextDispatch} style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(44,24,16,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <div style={{
            width: current.isWarCorrespondent ? 500 : 420,
            minHeight: 200, background: THEATRE.dispatchPaper, borderRadius: 4,
            padding: '24px 32px', boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
            transform: current.isWarCorrespondent ? 'rotate(-1deg)' : 'none',
          }}>
            {current.isCritical && (
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: THEATRE.criticalSeal,
                boxShadow: `0 2px 4px ${THEATRE.blockShadow}`, margin: '0 auto 16px',
              }} />
            )}
            <div style={{
              fontFamily: "'Special Elite', monospace", fontSize: 14,
              lineHeight: 1.6, color: THEATRE.ink,
            }}>
              {current.text}
            </div>
            {current.isWarCorrespondent && (
              <div style={{
                marginTop: 20, fontFamily: "'Architects Daughter', cursive",
                fontSize: 13, color: THEATRE.dimInk, textAlign: 'right',
              }}>
                — Your war correspondent
              </div>
            )}
            <div style={{
              marginTop: 16, fontFamily: FONTS.theatre, fontSize: 11,
              color: THEATRE.fadedInk, textAlign: 'center',
            }}>
              {readingIndex + 1} / {snapshot.length} — tap to continue
            </div>
          </div>
        </div>
      )}
    </>
  );
}
