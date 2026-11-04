// Project grid (PRD FR-W4; DESIGN §8.2, §10): 3 columns (phones 2, first card full width). M-05:
// filtered-out cards fade and scale to 0.96 while the rest glide to their new places
// (AnimatePresence + layout, ≈ 0.35 s [APPROX]); each card's entrance is in ProjectCard.

import { AnimatePresence } from 'motion/react';
import type { Project } from '../../content/schema.ts';
import { useMediaQuery } from '../../motion/hooks/useMediaQuery.ts';
import { ProjectCard, type TypeChipLabels } from './ProjectCard.tsx';
import styles from './ProjectGrid.module.css';

/** DESIGN §10 XS breakpoint: two columns, the first card spanning both. */
const PHONE_QUERY = '(max-width: 600px)';

export interface ProjectGridProps {
  readonly items: readonly Project[];
  readonly chipLabels: TypeChipLabels;
  readonly fallback: { readonly mark: string; readonly label: string };
}

/** Column of a card in the current layout, for the M-05 column stagger. */
function columnOf(index: number, phone: boolean): number {
  if (!phone) return index % 3;
  return index === 0 ? 0 : (index - 1) % 2;
}

export function ProjectGrid({ items, chipLabels, fallback }: ProjectGridProps) {
  const phone = useMediaQuery(PHONE_QUERY);
  return (
    // role="list": list styling is removed, which drops list semantics in Safari.
    <ul className={styles.grid} role="list">
      <AnimatePresence mode="popLayout">
        {items.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={index}
            column={columnOf(index, phone)}
            chipLabels={chipLabels}
            fallback={fallback}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
