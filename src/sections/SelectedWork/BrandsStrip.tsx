// Brands strip "The Bigger Picture" (PRD FR-B1–B5, D-12; DESIGN §7.4, §8.3; M-12, M-07b).
// Client brands with permission only (the caller passes published brands; employers never).
//
// M-12: endless leftward travel (≈ 38 px/s [APPROX], tokens) of identical logo sets; the position
// is kept fractional (R-2). Pauses while hovered or focused, while off-screen, and with the
// "Logo auto-scroll" toggle (stable name; aria-pressed = auto-scroll on). A press or drag on the
// strip switches auto-scroll off; the toggle resumes it [OBSERVED reference]. The previous/next
// buttons scroll 70 % of the visible width. With the strip focused, ArrowLeft/ArrowRight scroll it
// 40 px in every browser (WebKit has no native key scrolling here). Motion off: stopped, so the
// auto-scroll toggle is not shown (it would have no effect); still scrollable by hand and keys. Only the first set is exposed to screen
// readers; the copies are hidden. "See all" swaps the strip for a static grid of logos with names
// and hides the strip controls [OBSERVED].

import { useEffect, useId, useRef, useState } from 'react';
import { IconButton } from '../../components/actions/IconButton/IconButton.tsx';
import { ActionBase } from '../../components/actions/ActionBase.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import { MediaImage } from '../../components/media/MediaImage/MediaImage.tsx';
import type { Brand } from '../../content/schema.ts';
import { fillTemplate } from '../../lib/format.ts';
import { advanceStrip, arrowStep, KEY_STEP } from '../../lib/logoStrip.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { useIsVisible } from '../../motion/hooks/useRevealInView.ts';
import styles from './BrandsStrip.module.css';

/** The strip waits for an arrow's smooth scroll to finish before moving on (implementation guard). */
const ARROW_SCROLL_MS = 800;

export interface BrandsStripLabels {
  readonly headingLine1: string;
  readonly headingLine2: string;
  /** "SEE ALL ({count})". */
  readonly seeAll: string;
  readonly showStrip: string;
  /** Stable accessible name of the auto-scroll toggle. */
  readonly autoScroll: string;
  readonly previous: string;
  readonly next: string;
  readonly region: string;
  readonly imageFallback: { readonly mark: string; readonly label: string };
}

export interface BrandsStripProps {
  readonly brands: readonly Brand[];
  readonly labels: BrandsStripLabels;
}

function Logo({
  brand,
  fallback,
}: {
  readonly brand: Brand;
  readonly fallback: BrandsStripLabels['imageFallback'];
}) {
  return (
    <span className={styles.logoBox}>
      <MediaImage
        image={brand.logo}
        fallback={fallback}
        fit="contain"
        className={styles.logoMedia}
      />
    </span>
  );
}

export function BrandsStrip({ brands, labels }: BrandsStripProps) {
  const { motionOn } = useMotionPreference();
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [copies, setCopies] = useState(2);
  const viewport = useRef<HTMLDivElement>(null);
  const firstSet = useRef<HTMLDivElement>(null);
  const hold = useRef({ hover: false, focus: false, until: 0 });
  const visible = useIsVisible(viewport);
  const gridId = useId();

  // Enough identical sets for a seamless loop: one set must be at least as wide as the strip.
  useEffect(() => {
    const el = viewport.current;
    const set = firstSet.current;
    if (!el || !set) return;
    const measure = () => {
      const needed = Math.max(2, Math.ceil(el.clientWidth / Math.max(set.offsetWidth, 1)) + 1);
      setCopies((n) => (n === needed ? n : needed));
    };
    // ResizeObserver reports once as soon as observing starts, then on every size change.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    observer.observe(set);
    return () => observer.disconnect();
  }, [expanded]);

  // M-12 frame loop.
  useEffect(() => {
    if (!motionOn || expanded || paused || !visible) return;
    const el = viewport.current;
    const set = firstSet.current;
    if (!el || !set) return;
    let position = el.scrollLeft;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - last;
      last = now;
      const h = hold.current;
      if (h.hover || h.focus || now < h.until) {
        position = el.scrollLeft;
      } else {
        // Follow a manual scroll (keyboard, wheel); otherwise keep the fractional position (R-2).
        if (Math.abs(el.scrollLeft - position) > 1) position = el.scrollLeft;
        position = advanceStrip(position, elapsed, set.offsetWidth);
        el.scrollLeft = position;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [motionOn, expanded, paused, visible]);

  /** Scrolls the strip by `step` px, jumping one identical set first at either end (loop). */
  const scrollStrip = (step: number) => {
    const el = viewport.current;
    const set = firstSet.current;
    if (!el || !set) return;
    let from = el.scrollLeft;
    // Jump by one identical set first when the step would run past either end.
    if (from + step < 0) from += set.offsetWidth;
    else if (from + step > el.scrollWidth - el.clientWidth) from -= set.offsetWidth;
    el.scrollLeft = from;
    hold.current.until = performance.now() + ARROW_SCROLL_MS;
    el.scrollTo({ left: from + step, behavior: motionOn ? 'smooth' : 'auto' });
  };
  const scrollByArrow = (direction: 1 | -1) => {
    const el = viewport.current;
    if (el) scrollStrip(arrowStep(el.clientWidth) * direction);
  };

  return (
    <div className={styles.brands}>
      <div className={styles.heading}>
        <h3 className={styles.title}>
          <span className={styles.line1}>{labels.headingLine1}</span>
          <span className={styles.line2}>{labels.headingLine2}</span>
        </h3>
        <div className={styles.controls}>
          <ActionBase
            className={styles.seeAll}
            aria-expanded={expanded}
            aria-controls={gridId}
            onClick={() => setExpanded((e) => !e)}
          >
            <span>
              {expanded ? labels.showStrip : fillTemplate(labels.seeAll, { count: brands.length })}
            </span>
            <Icon name={expanded ? 'minus' : 'plus'} />
          </ActionBase>
          {expanded ? null : (
            <>
              {motionOn ? (
                <IconButton
                  icon={paused ? 'play' : 'pause'}
                  label={labels.autoScroll}
                  aria-pressed={!paused}
                  borderless
                  className={styles.control}
                  onClick={() => setPaused((p) => !p)}
                />
              ) : null}
              <IconButton
                icon="chevron-left"
                label={labels.previous}
                borderless
                className={styles.control}
                onClick={() => scrollByArrow(-1)}
              />
              <IconButton
                icon="chevron-right"
                label={labels.next}
                borderless
                className={styles.control}
                onClick={() => scrollByArrow(1)}
              />
            </>
          )}
        </div>
      </div>

      {expanded ? (
        <div id={gridId} className={styles.grid}>
          {brands.map((brand, i) => (
            <div key={`${brand.name}-${i}`} className={styles.cell}>
              <Logo brand={brand} fallback={labels.imageFallback} />
              <span className={styles.name}>{brand.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={viewport}
          className={styles.viewport}
          role="region"
          aria-label={labels.region}
          tabIndex={0}
          data-paused={paused ? '' : undefined}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') hold.current.hover = true;
          }}
          onPointerLeave={() => {
            hold.current.hover = false;
          }}
          onPointerDown={() => setPaused(true)}
          onFocus={() => {
            hold.current.focus = true;
          }}
          onBlur={() => {
            hold.current.focus = false;
          }}
          onKeyDown={(e) => {
            // Only when the strip itself has focus, never for a control inside it.
            if (e.target !== e.currentTarget) return;
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
            e.preventDefault(); // the strip scrolls, not the page
            scrollStrip(e.key === 'ArrowRight' ? KEY_STEP : -KEY_STEP);
          }}
        >
          <div className={styles.rail}>
            {Array.from({ length: copies }, (_, copy) => (
              <div
                key={copy}
                ref={copy === 0 ? firstSet : undefined}
                className={styles.set}
                aria-hidden={copy > 0 ? true : undefined}
              >
                {brands.map((brand, i) => (
                  <div key={`${brand.name}-${i}`} className={styles.logo}>
                    <Logo brand={brand} fallback={labels.imageFallback} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
