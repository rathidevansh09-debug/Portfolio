// Project card (PRD FR-W4; DESIGN §7.4). STATIC until Phase 11 (owner decision, Phase 10): no
// button, no focus stop, no pointer cursor, no hover circle, no caption arrow and no hover change,
// because nothing opens yet. M-07a, the hover circle (play / arrow, always visible on touch) and
// the caption arrow are built in Phase 11 together with the pop-up; they are deferred, not removed.
//
// Motion here: M-05 entrance (fades in and rises 32 px when 8 % visible, 0.6 s, column stagger
// 0.06 s; exit fades and scales to 0.96; remaining cards glide) and M-06 image drift (−12 → +12 px
// as the card crosses the screen). Motion off (MO-5): final state, no drift.

import { motion } from 'motion/react';
import { useRef, type Ref } from 'react';
import { MediaImage } from '../../components/media/MediaImage/MediaImage.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { isPending, type OrPending } from '../../content/pending.ts';
import type { Copy, Project, ProjectType } from '../../content/schema.ts';
import { copyText } from '../../lib/copy.ts';
import { twoDigit } from '../../lib/format.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { useScrollLinked } from '../../motion/hooks/useScrollLinked.ts';
import { card, distance, duration, ease, stagger, threshold } from '../../motion/tokens.ts';
import styles from './ProjectCard.module.css';

export type TypeChipLabels = Readonly<Record<ProjectType, OrPending<Copy>>>;

export interface ProjectCardProps {
  readonly project: Project;
  /** Position in the current results (0-based); the card shows it as 01, 02, … */
  readonly index: number;
  /** Column in the current layout, for the M-05 stagger. */
  readonly column: number;
  readonly chipLabels: TypeChipLabels;
  readonly fallback: { readonly mark: string; readonly label: string };
  /** Given by AnimatePresence (popLayout) to measure the card as it leaves. */
  readonly ref?: Ref<HTMLLIElement>;
}

const DRIFT = ['start end', 'end start'] as const;

export function ProjectCard({
  project,
  index,
  column,
  chipLabels,
  fallback,
  ref,
}: ProjectCardProps) {
  const { motionOn } = useMotionPreference();
  const media = useRef<HTMLDivElement>(null);
  const drift = useScrollLinked(media, {
    offset: [...DRIFT],
    output: [-card.drift, card.drift],
    offValue: 0,
  });
  const { cover, type, primaryCategory } = project;
  // Chip: the project's type must be known and its wording supplied (both may be PENDING).
  const chip: OrPending<Copy> = isPending(type) ? type : chipLabels[type];

  return (
    <motion.li
      ref={ref}
      className={styles.item}
      data-first={index === 0 ? '' : undefined}
      layout={motionOn ? 'position' : false}
      initial={motionOn ? { opacity: 0, y: distance.reveal } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: threshold.card }}
      exit={{
        opacity: 0,
        scale: card.exitScale,
        transition: { duration: card.glide, ease: [...ease.signature] },
      }}
      transition={{
        duration: duration.cardReveal,
        delay: column * stagger.cardColumn,
        ease: [...ease.signature],
        layout: { duration: card.glide, ease: [...ease.signature] },
      }}
    >
      <article className={styles.card}>
        <div ref={media} className={styles.media}>
          <motion.div className={styles.picture} style={{ y: drift }}>
            {isPending(cover) ? (
              <PendingMarker note={cover.note} variant="fill" />
            ) : (
              <MediaImage image={cover} fallback={fallback} fit="cover" />
            )}
          </motion.div>
          {isPending(chip) ? (
            <PendingMarker note={chip.note} className={styles.chip} />
          ) : (
            <span className={styles.chip}>{copyText(chip)}</span>
          )}
          <span className={styles.frame} aria-hidden="true" />
        </div>
        <div className={styles.caption}>
          <span className={styles.number}>{twoDigit(index + 1)}</span>
          <span className={styles.text}>
            <h3 className={styles.title}>{project.title}</h3>
            {isPending(primaryCategory) ? (
              <PendingMarker note={primaryCategory.note} />
            ) : (
              <span className={styles.category}>{primaryCategory}</span>
            )}
          </span>
        </div>
      </article>
    </motion.li>
  );
}
