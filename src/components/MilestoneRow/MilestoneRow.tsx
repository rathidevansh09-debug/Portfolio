// MilestoneRow (DESIGN §7.4 "Milestone row (large)"; ARCHITECTURE §3.3): one row component for
// Impact milestones and pop-up Outcomes — index · title + context · trailing value (the year, or
// an outcome value) in Anton accent. Min height 89 px; grows to fit (DESIGN §5.6).

import { twoDigit } from '../../lib/format.ts';
import styles from './MilestoneRow.module.css';

export interface MilestoneRowProps {
  /** 1-based position; shown as "01". */
  readonly index: number;
  readonly title: string;
  readonly context?: string;
  /** The year (Impact) or the outcome value (pop-up Outcomes). */
  readonly value?: string;
  readonly as?: 'li' | 'div';
}

export function MilestoneRow({ index, title, context, value, as: Tag = 'li' }: MilestoneRowProps) {
  return (
    <Tag className={styles.row}>
      <span className={styles.index}>{twoDigit(index)}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {context ? <span className={styles.context}>{context}</span> : null}
      </span>
      {value ? <span className={styles.value}>{value}</span> : null}
    </Tag>
  );
}
