// Skip link (PRD FR-G2; DESIGN §7.1; ARCHITECTURE §10): the first focusable element. Hidden above
// the screen until it receives keyboard focus; jumps to Selected Work.

import styles from './SkipLink.module.css';

export interface SkipLinkProps {
  /** Section id to jump to. */
  readonly targetId: string;
  readonly label: string;
}

export function SkipLink({ targetId, label }: SkipLinkProps) {
  return (
    <a className={styles.skip} href={`#${targetId}`}>
      {label}
    </a>
  );
}
