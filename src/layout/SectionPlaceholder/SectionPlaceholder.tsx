// TEMPORARY development placeholder (owner decision, Phase 8). Stands in for a page section until
// its own phase builds it (Hero 9, Selected Work 10, Impact and Breakdown 12, About and Journey 13,
// Contact 14), so anchor navigation and active-section detection can be built and tested now.
// Not a design: no content, no final visuals. Each placeholder is deleted when its section exists;
// this file is deleted in Phase 14.

import { PENDING_LABEL } from '../../content/pending.ts';
import styles from './SectionPlaceholder.module.css';

export interface SectionPlaceholderProps {
  /** Section anchor (none for Breakdown). */
  readonly id?: string;
  /** Development name of the section, for identification only. */
  readonly name: string;
  /** Phase that replaces this placeholder. */
  readonly phase: number;
}

export function SectionPlaceholder({ id, name, phase }: SectionPlaceholderProps) {
  return (
    <section id={id} className={styles.placeholder} data-placeholder={name}>
      <p className={styles.marker}>
        {PENDING_LABEL} · Temporary development placeholder: {name} (Phase {phase})
      </p>
    </section>
  );
}
