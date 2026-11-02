// Page scroll progress for the reading-progress bar (M-15): spring-smoothed (100 / 28) while motion
// is on; follows scroll directly when motion is off (MO-5).

import { useScroll, useSpring } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useMotionPreference } from '../MotionPreference.tsx';
import { spring } from '../tokens.ts';

export function usePageProgress(): MotionValue<number> {
  const { motionOn } = useMotionPreference();
  const { scrollYProgress } = useScroll();
  const smoothed = useSpring(scrollYProgress, spring.progress);
  return motionOn ? smoothed : scrollYProgress;
}
