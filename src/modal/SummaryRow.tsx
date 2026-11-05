// Pop-up summary row (PRD FR-M3; DESIGN §8.10): the title (the dialog's accessible name) and a
// one-paragraph summary on the left, an optional outline button on the right. On phones the
// button drops below at full width (FR-M9).

import type { ReactNode } from 'react';
import styles from './SummaryRow.module.css';

export function SummaryRow({
  titleId,
  title,
  summary,
  action,
}: {
  readonly titleId: string;
  readonly title: string;
  readonly summary?: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {summary ? <p className={styles.summary}>{summary}</p> : null}
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
