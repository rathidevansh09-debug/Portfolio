// Scroll-progress mapping helper for scroll-linked effects (M-04 hero depth, M-06 card drift,
// M-08 comparison, M-09 timeline). Maps the target's progress through the screen (0 → 1) onto an
// output range. Motion off (MO-5): returns a static `offValue` (e.g. 0 px, 50 % cut, full line).

import { useMotionValue, useScroll, useTransform } from 'motion/react';
import type { MotionValue, UseScrollOptions } from 'motion/react';
import type { RefObject } from 'react';
import { useMotionPreference } from '../MotionPreference.tsx';

export interface ScrollLinkedOptions {
  /** Start and end of the progress range, e.g. ['start end', 'end start'] (tokens/DESIGN §9.3). */
  readonly offset: UseScrollOptions['offset'];
  /** Output values at progress 0 and 1, e.g. [-12, 12] (tokens.ts). */
  readonly output: readonly [number, number];
  /** Static value while motion is off. */
  readonly offValue: number;
}

export function useScrollLinked(
  target: RefObject<HTMLElement | null>,
  { offset, output, offValue }: ScrollLinkedOptions,
): MotionValue<number> {
  const { motionOn } = useMotionPreference();
  const { scrollYProgress } = useScroll({ target, offset });
  const mapped = useTransform(scrollYProgress, [0, 1], [...output]);
  const still = useMotionValue(offValue);
  return motionOn ? mapped : still;
}

/** Raw 0 → 1 progress of the target through the screen (for custom mappings such as M-08). */
export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  offset: UseScrollOptions['offset'],
): MotionValue<number> {
  return useScroll({ target, offset }).scrollYProgress;
}
