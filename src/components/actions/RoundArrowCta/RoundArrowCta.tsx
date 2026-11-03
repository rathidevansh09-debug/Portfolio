// RoundArrowCta (DESIGN §7.2; PRD FR-C1): 35 px ring with an arrow + accent label, e.g.
// "START A CONVERSATION". Magnetic pull on a real mouse (M-14 via useMagnetic); none on touch
// screens or when motion is off.

import { motion } from 'motion/react';
import { useRef } from 'react';
import { useMagnetic } from '../../../motion/hooks/useMagnetic.ts';
import { Icon } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './RoundArrowCta.module.css';

export type RoundArrowCtaProps = ActionProps;

export function RoundArrowCta(props: RoundArrowCtaProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { x, y } = useMagnetic(ref);
  return (
    <motion.span ref={ref} className={styles.magnet} style={{ x, y }}>
      <ActionBase {...props} className={[styles.cta, props.className].filter(Boolean).join(' ')}>
        <span className={styles.ring} aria-hidden="true">
          <Icon name="arrow-up-right" />
        </span>
        <span>{props.children}</span>
      </ActionBase>
    </motion.span>
  );
}
