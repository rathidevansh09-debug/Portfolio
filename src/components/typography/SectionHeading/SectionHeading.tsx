// SectionHeading (DESIGN §7.1): eyebrow + title on the left, an optional text link on the right,
// aligned to the bottom, 22 px above the content. Selected Work and Journey use the Manrope
// `section-title` style with an accent full stop (DESIGN §5.1, §8.2, §8.7).

import type { ReactNode } from 'react';
import { Eyebrow } from '../Eyebrow/Eyebrow.tsx';
import { withAccentStop } from '../accentStop.tsx';
import styles from './SectionHeading.module.css';

export interface SectionHeadingProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly level?: 2 | 3;
  /** 'section' = Selected Work sizes; 'journey' = Journey sizes (DESIGN §5.4). */
  readonly variant?: 'section' | 'journey';
  /** Usually a <TextLink>, e.g. "ALL WORK →" or "RESUME ↓". */
  readonly action?: ReactNode;
  readonly id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  level = 2,
  variant = 'section',
  action,
  id,
}: SectionHeadingProps) {
  const Title = level === 2 ? 'h2' : 'h3';
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title id={id} className={styles.title} data-variant={variant}>
          {withAccentStop(title, styles.accent ?? '')}
        </Title>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
