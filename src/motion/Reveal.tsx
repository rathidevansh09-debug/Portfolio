// Reveal — the standard scroll reveal (M-03) and the pop-up block reveal (M-03b).
// Fades in and rises 32 px over 0.75 s with the signature easing once 12 % is visible (DESIGN §9.3).
//
// page  (M-03, MO-2 page rule): replays every time the element re-enters the screen, including
//       when scrolling back up.
// modal (M-03b, MO-2 pop-up exception, D-17): measured against the pop-up's own scroll area
//       (provided by <RevealScrollRoot>); each block reveals once per opening. The pop-up's content
//       unmounts on close, so the next opening starts fresh and replays.
// Motion off / reduced motion (MO-5): renders in its final state with no animation.

import { motion } from 'motion/react';
import { createContext, use } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useMotionPreference } from './MotionPreference.tsx';
import { distance, duration, ease, threshold } from './tokens.ts';

const RevealRootContext = createContext<RefObject<HTMLElement | null> | null>(null);

/** Wraps the pop-up's scrollable area so modal-mode reveals measure visibility against it. */
export function RevealScrollRoot({
  rootRef,
  children,
}: {
  readonly rootRef: RefObject<HTMLElement | null>;
  readonly children: ReactNode;
}) {
  return <RevealRootContext value={rootRef}>{children}</RevealRootContext>;
}

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  li: motion.li,
  ul: motion.ul,
  p: motion.p,
} as const;

export type RevealTag = keyof typeof motionTags;

export interface RevealProps {
  readonly children: ReactNode;
  readonly mode?: 'page' | 'modal';
  /** Extra delay in seconds for staggered groups, from tokens.ts `stagger` (e.g. row × 0.045). */
  readonly delay?: number;
  /** Fraction visible before revealing: 12 % by default, cards use `threshold.card` (8 %). */
  readonly amount?: number;
  readonly as?: RevealTag;
  readonly className?: string;
  readonly id?: string;
  readonly 'data-testid'?: string;
}

export function Reveal({
  children,
  mode = 'page',
  delay = 0,
  amount = threshold.reveal,
  as = 'div',
  className,
  id,
  'data-testid': testId,
}: RevealProps) {
  const { motionOn } = useMotionPreference();
  const root = use(RevealRootContext);
  if (mode === 'modal' && !root) {
    throw new Error(
      '<Reveal mode="modal"> must be inside <RevealScrollRoot> (the pop-up scroll area)',
    );
  }

  if (!motionOn) {
    const Tag = as;
    return (
      <Tag className={className} id={id} data-testid={testId}>
        {children}
      </Tag>
    );
  }

  // All entries share the same props here; the cast keeps JSX typing simple.
  const MotionTag = motionTags[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      id={id}
      data-testid={testId}
      initial={{ opacity: 0, y: distance.reveal }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        once: mode === 'modal',
        amount,
        ...(mode === 'modal' && root ? { root } : {}),
      }}
      transition={{ duration: duration.reveal, ease: [...ease.signature], delay }}
    >
      {children}
    </MotionTag>
  );
}
