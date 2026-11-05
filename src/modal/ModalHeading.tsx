// Pop-up heading bar (PRD FR-M2, D-14; DESIGN §8.10): accent eyebrow on the left (category · year,
// "MOTION / VIDEO" or a milestone's year) and the borderless close button on the right. It stays
// fixed at the top of the pop-up while the content scrolls.

import type { ReactNode } from 'react';
import { IconButton } from '../components/actions/IconButton/IconButton.tsx';
import styles from './ModalHeading.module.css';

export function ModalHeading({
  eyebrow,
  closeLabel,
  onClose,
}: {
  readonly eyebrow: ReactNode;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  return (
    <div className={styles.heading}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <IconButton icon="close" label={closeLabel} borderless onClick={onClose} />
    </div>
  );
}
