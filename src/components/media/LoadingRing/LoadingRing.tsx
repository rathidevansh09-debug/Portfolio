// LoadingRing (DESIGN §7.5; M-19): 25 px ring spinning once per second, linear, with a visible
// label such as "Loading…". The spin stops when motion is off (MO-5).

import styles from './LoadingRing.module.css';

export interface LoadingRingProps {
  /** Visible and announced status text (ui.states.loading). */
  readonly label: string;
  readonly className?: string;
}

export function LoadingRing({ label, className }: LoadingRingProps) {
  return (
    <div className={[styles.status, className].filter(Boolean).join(' ')} role="status">
      <span className={styles.ring} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
