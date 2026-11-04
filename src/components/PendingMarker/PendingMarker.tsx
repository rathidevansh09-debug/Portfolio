// PENDING marker (ARCHITECTURE §4.1 rule 5; PRD §13; AGENTS §5; owner decision, Phase 9).
// Development: a visible PENDING placeholder with the note, so the owner can see what to supply
// and where. Production builds render nothing. The launch check blocks publishing while any
// PENDING value remains, so nothing pending ships.

import { PENDING_LABEL } from '../../content/pending.ts';
import styles from './PendingMarker.module.css';

export interface PendingMarkerProps {
  /** What the owner must supply (the pending note). */
  readonly note: string;
  /** 'inline' sits in a line of text; 'fill' fills its positioned parent (e.g. an image box). */
  readonly variant?: 'inline' | 'fill';
  readonly className?: string;
}

export function PendingMarker({ note, variant = 'inline', className }: PendingMarkerProps) {
  if (!import.meta.env.DEV) return null;
  return (
    <span
      className={[styles.marker, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-pending=""
    >
      <strong className={styles.label}>{PENDING_LABEL}</strong>
      <span className={styles.note}>{note}</span>
    </span>
  );
}
