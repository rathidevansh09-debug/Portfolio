// ComparisonSlider (DESIGN §7.4; PRD FR-BD2–BD4, M-08; ARCHITECTURE §3.3, §8.1, §10).
// One component in two modes:
//   scroll — Breakdown: while the stage travels through the screen the divider moves 90 % → 10 %;
//            from the visitor's first drag or key press, the visitor controls it.
//   static — pop-up before/after: rests at 50 %.
// The control is a native range input stretched over the stage (invisible), so drag, arrow keys
// and screen readers all work natively; the visible focus ring surrounds the whole stage.
// Motion off (MO-5): rests at 50 % and stays draggable and keyboard-operable.
// Static mode can also be set from outside (`value`): the pop-up's Wireframe / Final toggle moves
// the divider to show one image fully; `onUserChange` reports the visitor's own drags and keys.
// Drift (M-08 ±30 px): disabled until Phase 16 verifies which element drifts (owner decision).
// Images are fitted without distortion (letterboxed when aspect ratios differ, §8.1).

import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { BeforeAfter } from '../../content/schema.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { useScrollProgress } from '../../motion/hooks/useScrollLinked.ts';
import { comparison } from '../../motion/tokens.ts';
import { HandleChevrons } from '../icons/HandleChevrons.tsx';
import { MediaImage } from '../media/MediaImage/MediaImage.tsx';
import styles from './ComparisonSlider.module.css';

export interface ComparisonSliderProps {
  /** before = wireframe, after = final design (Phase 5 decision). */
  readonly pair: BeforeAfter;
  readonly mode: 'scroll' | 'static';
  /** Accessible name of the range control (ui.breakdown.sliderLabel). */
  readonly label: string;
  /** Optional corner labels, e.g. "WIREFRAME" / "FINAL DESIGN" (ui.breakdown). */
  readonly beforeLabel?: string;
  readonly afterLabel?: string;
  /** Image-failure wording passed to MediaImage. */
  readonly fallback: { readonly mark: string; readonly label: string };
  /** Stage proportion: Breakdown 1.75 : 1 (phones 1.5 : 1); pop-up 16 : 9 (phones 4 : 3). */
  readonly ratio?: 'breakdown' | 'popup';
  /** Divider position (0–100) set from outside; undefined leaves it where it is. */
  readonly value?: number;
  /** Called when the visitor drags or uses the keys. */
  readonly onUserChange?: (value: number) => void;
  readonly className?: string;
}

const percent = (v: number) => `${Math.round(v)}%`;

function syncInput(input: HTMLInputElement | null, v: number) {
  if (!input) return;
  input.value = String(Math.round(v));
  input.setAttribute('aria-valuetext', percent(v));
}

export function ComparisonSlider({
  pair,
  mode,
  label,
  beforeLabel,
  afterLabel,
  fallback,
  ratio = 'breakdown',
  value,
  onUserChange,
  className,
}: ComparisonSliderProps) {
  const { motionOn } = useMotionPreference();
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userControlled = useRef(false);
  const followsScroll = mode === 'scroll' && motionOn;

  const progress = useScrollProgress(stageRef, ['start end', 'end start']);
  const cut = useMotionValue<number>(comparison.rest);
  const clip = useTransform(cut, (v) => `inset(0 0 0 ${v}%)`);
  const left = useTransform(cut, (v) => `${v}%`);

  const setCut = (v: number) => {
    cut.set(v);
    syncInput(inputRef.current, v);
  };

  useMotionValueEvent(progress, 'change', (p) => {
    if (!followsScroll || userControlled.current) return;
    setCut(comparison.start - p * (comparison.start - comparison.end));
  });

  // On mount and when the mode or motion setting changes (unless the visitor has taken over):
  // scroll mode starts from the current scroll position; static mode and motion off rest at 50 %.
  useEffect(() => {
    if (userControlled.current) return;
    const start = followsScroll
      ? comparison.start - progress.get() * (comparison.start - comparison.end)
      : comparison.rest;
    cut.set(start);
    syncInput(inputRef.current, start);
  }, [followsScroll, progress, cut]);

  // A position set from outside (the pop-up toggle) applies whenever it changes.
  useEffect(() => {
    if (value === undefined) return;
    cut.set(value);
    syncInput(inputRef.current, value);
  }, [value, cut]);

  const takeOver = (v: number) => {
    userControlled.current = true;
    setCut(v);
    onUserChange?.(v);
  };

  return (
    <div
      ref={stageRef}
      className={[styles.stage, className].filter(Boolean).join(' ')}
      data-ratio={ratio}
      data-mode={mode}
    >
      <MediaImage image={pair.before} fallback={fallback} fit="contain" />
      <motion.div className={styles.after} style={{ clipPath: clip }}>
        <MediaImage image={pair.after} fallback={fallback} fit="contain" />
      </motion.div>
      {beforeLabel ? (
        <span className={`${styles.label} ${styles.labelBefore}`}>{beforeLabel}</span>
      ) : null}
      {afterLabel ? (
        <span className={`${styles.label} ${styles.labelAfter}`}>{afterLabel}</span>
      ) : null}
      <motion.div className={styles.divider} style={{ left }} aria-hidden="true">
        <span className={styles.handle}>
          <HandleChevrons />
        </span>
      </motion.div>
      <input
        ref={inputRef}
        className={styles.input}
        type="range"
        min={0}
        max={100}
        step={1}
        defaultValue={comparison.rest}
        aria-label={label}
        aria-valuetext={percent(comparison.rest)}
        onInput={(e) => takeOver(Number(e.currentTarget.value))}
        onPointerDown={() => {
          userControlled.current = true;
        }}
        onKeyDown={() => {
          userControlled.current = true;
        }}
      />
    </div>
  );
}
