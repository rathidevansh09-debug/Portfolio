// Eyebrow (DESIGN §7.1): small uppercase label above a heading, e.g. "01 / SELECTED WORK".
// Muted by default; accent for sub-headings inside panels.

import styles from './Eyebrow.module.css';

export interface EyebrowProps {
  readonly children: string;
  readonly tone?: 'muted' | 'accent';
  readonly className?: string;
}

export function Eyebrow({ children, tone = 'muted', className }: EyebrowProps) {
  return (
    <p className={[styles.eyebrow, className].filter(Boolean).join(' ')} data-tone={tone}>
      {children}
    </p>
  );
}
