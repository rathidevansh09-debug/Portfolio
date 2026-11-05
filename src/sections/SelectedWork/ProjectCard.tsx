// Project card (PRD FR-W4, FR-W5, FR-W8; DESIGN §7.4). One control per card (owner decision 1,
// Phase 11): a single <button> inside the H3 title, whose click area is stretched over the whole
// card — one tab stop, valid HTML (no heading inside a button, no nested controls), named by the
// title. Opens the pop-up; the pop-up's code is fetched on hover, focus or press.
//
// Motion: M-05 entrance (fades in and rises 32 px when 8 % visible, 0.6 s, column stagger 0.06 s;
// exit fades and scales to 0.96; remaining cards glide) · M-06 image drift (−12 → +12 px) ·
// M-07a hover, mouse only (image 1.055×, saturation 55 → 100 %, hover circle fades in and rises
// to centre, caption arrow 3 px up-right in accent) — deferred from Phase 10, built here. The
// circle also shows on keyboard focus; on touch screens it is always visible (MO-6). Motion off
// (MO-5): no entrance or drift; hover changes are instant.

import { motion } from 'motion/react';
import { useRef, type Ref } from 'react';
import { Icon } from '../../components/icons/Icon.tsx';
import { MediaImage } from '../../components/media/MediaImage/MediaImage.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { isPending, type OrPending } from '../../content/pending.ts';
import type { Copy, Project, ProjectType } from '../../content/schema.ts';
import { copyText } from '../../lib/copy.ts';
import { twoDigit } from '../../lib/format.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { warmProjectModal } from '../../modal/loadProjectModal.ts';
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
  /** Opens the pop-up for this project; `opener` gets focus back on close. */
  readonly onOpen: (project: Project, opener: HTMLElement) => void;
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
  onOpen,
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
  // FR-W4: a play icon for video projects, an arrow otherwise.
  const circleIcon = !isPending(type) && type === 'video-motion' ? 'play' : 'arrow-up-right';

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
              <MediaImage image={cover} fallback={fallback} fit="cover" className={styles.image} />
            )}
          </motion.div>
          {isPending(chip) ? (
            <PendingMarker note={chip.note} className={styles.chip} />
          ) : (
            <span className={styles.chip}>{copyText(chip)}</span>
          )}
          <span className={styles.frame} aria-hidden="true" />
          <span className={styles.circle} aria-hidden="true">
            <Icon name={circleIcon} />
          </span>
        </div>
        <div className={styles.caption}>
          <span className={styles.number}>{twoDigit(index + 1)}</span>
          <span className={styles.text}>
            <h3 className={styles.title}>
              <button
                type="button"
                className={styles.open}
                onClick={(e) => onOpen(project, e.currentTarget)}
                onPointerEnter={warmProjectModal}
                onPointerDown={warmProjectModal}
                onFocus={warmProjectModal}
              >
                {project.title}
              </button>
            </h3>
            {isPending(primaryCategory) ? (
              <PendingMarker note={primaryCategory.note} />
            ) : (
              <span className={styles.category}>{primaryCategory}</span>
            )}
          </span>
          <Icon name="arrow-up-right" className={styles.arrow} />
        </div>
      </article>
    </motion.li>
  );
}
