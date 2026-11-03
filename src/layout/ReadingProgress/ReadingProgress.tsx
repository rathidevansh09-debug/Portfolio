// Reading-progress bar (M-15; PRD FR-H7; DESIGN §7.1): a 2 px accent bar fixed to the very top,
// growing from the left with page scroll. Spring-smoothed (100 / 28) while motion is on; follows
// scroll directly when motion is off (MO-5). Animated with a transform only (MO-4). Decorative.

import { motion } from 'motion/react';
import { usePageProgress } from '../../motion/hooks/usePageProgress.ts';
import styles from './ReadingProgress.module.css';

export function ReadingProgress() {
  const progress = usePageProgress();
  return <motion.div className={styles.bar} style={{ scaleX: progress }} aria-hidden="true" />;
}
