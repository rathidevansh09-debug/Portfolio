// Motion toggle (PRD FR-H4, FR-G3, MO-5; DESIGN §7.2; ARCHITECTURE §10).
// A switch whose accessible name is its visible text ("Motion on" / "Motion off") and whose state is
// announced as on/off. Pause icon while motion runs, play icon while it is off [OBSERVED reference].
//
// Saved choice vs system setting vs effective motion (Phase 6/8 owner decisions):
//   - the switch always shows the EFFECTIVE state (motion runs only if the saved choice is "on" and
//     the system does not ask to reduce motion);
//   - when the system "Reduce motion" setting is on, motion stays off whatever the saved choice is,
//     so the switch is shown as unavailable (aria-disabled, still focusable so it can be discovered)
//     and is described by an explanation; activating it does nothing (owner decision 5B).

import { useId } from 'react';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import styles from './MotionToggle.module.css';

export interface MotionToggleLabels {
  readonly on: string;
  readonly off: string;
  /** Why the toggle is unavailable while the system asks for reduced motion. */
  readonly systemNote: string;
}

export function MotionToggle({ labels }: { readonly labels: MotionToggleLabels }) {
  const { motionOn, systemReduced, toggleOwnerPreference } = useMotionPreference();
  const noteId = useId();
  return (
    <>
      <button
        type="button"
        role="switch"
        className={styles.toggle}
        aria-checked={motionOn}
        aria-disabled={systemReduced || undefined}
        aria-describedby={systemReduced ? noteId : undefined}
        onClick={systemReduced ? undefined : toggleOwnerPreference}
      >
        <Icon name={motionOn ? 'pause' : 'play'} size={13} />
        <span>{motionOn ? labels.on : labels.off}</span>
      </button>
      {systemReduced ? (
        <span id={noteId} className={styles.note}>
          {labels.systemNote}
        </span>
      ) : null}
    </>
  );
}
