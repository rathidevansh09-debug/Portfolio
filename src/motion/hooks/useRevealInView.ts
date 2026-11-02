// In-view helper for components that drive their own animation from visibility (e.g. M-05 card
// reveal at 8 %, M-12 logo strip pausing off-screen). Motion off (MO-5): always "in view", so
// content renders in its final state.

import { useInView } from 'motion/react';
import type { RefObject } from 'react';
import { useMotionPreference } from '../MotionPreference.tsx';
import { threshold } from '../tokens.ts';

export interface RevealInViewOptions {
  /** Fraction visible; defaults to the 12 % reveal threshold. */
  readonly amount?: number;
  /** true = reveal once (pop-up blocks); false = replay on re-entry (page). */
  readonly once?: boolean;
  /** Scroll container to measure against (the pop-up), instead of the window. */
  readonly root?: RefObject<Element | null>;
}

export function useRevealInView(
  target: RefObject<Element | null>,
  { amount = threshold.reveal, once = false, root }: RevealInViewOptions = {},
): boolean {
  const { motionOn } = useMotionPreference();
  const inView = useInView(target, { amount, once, ...(root ? { root } : {}) });
  return motionOn ? inView : true;
}

/** Raw visibility, independent of the motion setting (e.g. pausing work while off-screen). */
export function useIsVisible(target: RefObject<Element | null>, amount = 0): boolean {
  return useInView(target, { amount });
}
