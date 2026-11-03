// DisplayHeading (DESIGN §7.1, §5.5): Anton heading whose final full stop, or whole final line, is
// in the accent colour (e.g. "THE WORK." / "THE IMPACT." with the second line accent).

import { withAccentStop } from '../accentStop.tsx';
import styles from './DisplayHeading.module.css';

export type DisplaySize =
  | 'hero-name'
  | 'display-breakdown'
  | 'display-contact'
  | 'display-about'
  | 'display-impact'
  | 'display-milestones';

export interface DisplayHeadingProps {
  /** One or more lines, each on its own line. */
  readonly lines: readonly string[];
  readonly level: 1 | 2 | 3;
  readonly size: DisplaySize;
  /** 'stop': the final full stop is accent. 'last-line': the whole final line is accent. */
  readonly accent?: 'stop' | 'last-line' | 'none';
  readonly className?: string;
  readonly id?: string;
}

export function DisplayHeading({
  lines,
  level,
  size,
  accent = 'stop',
  className,
  id,
}: DisplayHeadingProps) {
  const Tag = (['h1', 'h2', 'h3'] as const)[level - 1] ?? 'h2';
  const last = lines.length - 1;
  return (
    <Tag id={id} className={[styles.heading, className].filter(Boolean).join(' ')} data-size={size}>
      {lines.map((line, i) => {
        const isLast = i === last;
        if (isLast && accent === 'last-line') {
          return (
            <span key={i} className={`${styles.line} ${styles.accent}`}>
              {line}
            </span>
          );
        }
        return (
          <span key={i} className={styles.line}>
            {isLast && accent === 'stop' ? withAccentStop(line, styles.accent ?? '') : line}
          </span>
        );
      })}
    </Tag>
  );
}
