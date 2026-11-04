// "Show more work ↓" + "X of Y projects" (PRD FR-W6; DESIGN §8.2). Shown only while more results
// exist (PRD §13: fewer projects than one page → hidden).

import { OutlineButton } from '../../components/actions/OutlineButton/OutlineButton.tsx';
import styles from './LoadMore.module.css';

export interface LoadMoreProps {
  readonly label: string;
  /** Already filled, e.g. "9 of 14 projects". */
  readonly count: string;
  readonly onMore: () => void;
}

export function LoadMore({ label, count, onMore }: LoadMoreProps) {
  return (
    <div className={styles.row}>
      <OutlineButton icon="arrow-down" onClick={onMore} className={styles.button}>
        {label}
      </OutlineButton>
      <span className={styles.count}>{count}</span>
    </div>
  );
}
