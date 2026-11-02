// Magnetic pull (M-14): the element follows the pointer by 12 % horizontally / 20 % vertically of
// its offset from the element's centre, on a spring (220 / 20), and springs back on leave.
// Mouse only (PRD MO-6): no effect on touch screens. Disabled when motion is off (MO-5).

import { useMotionValue, useSpring } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useMotionPreference } from '../MotionPreference.tsx';
import { magnetic, spring } from '../tokens.ts';
import { useFinePointer } from './useMediaQuery.ts';

export function useMagnetic(target: RefObject<HTMLElement | null>): {
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const { motionOn } = useMotionPreference();
  const finePointer = useFinePointer();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, spring.magnetic);
  const y = useSpring(rawY, spring.magnetic);
  const active = motionOn && finePointer;

  useEffect(() => {
    const el = target.current;
    if (!el || !active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const box = el.getBoundingClientRect();
      rawX.set((e.clientX - (box.left + box.width / 2)) * magnetic.x);
      rawY.set((e.clientY - (box.top + box.height / 2)) * magnetic.y);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [target, active, rawX, rawY]);

  return { x, y };
}
