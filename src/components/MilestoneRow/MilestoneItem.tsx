// MilestoneItem (DESIGN §7.4 "Milestone item (small)"; PRD FR-J5): Journey side-panel item —
// index · title + year · diagonal arrow. The whole item is a button that opens the pop-up (A-6).

import { twoDigit } from '../../lib/format.ts';
import { Icon } from '../icons/Icon.tsx';
import styles from './MilestoneItem.module.css';

export interface MilestoneItemProps {
  readonly index: number;
  readonly title: string;
  readonly year: string;
  readonly onActivate: () => void;
}

export function MilestoneItem({ index, title, year, onActivate }: MilestoneItemProps) {
  return (
    <button type="button" className={styles.item} onClick={onActivate}>
      <span className={styles.index}>{twoDigit(index)}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.year}>{year}</span>
      </span>
      <span className={styles.arrow}>
        <Icon name="arrow-up-right" />
      </span>
    </button>
  );
}
