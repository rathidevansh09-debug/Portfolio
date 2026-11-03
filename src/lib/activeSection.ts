// Active-section detection for the header nav (M-16; ARCHITECTURE §6.2). Framework-free.
//
// A section becomes active when it crosses the band 15 %–35 % from the top of the screen
// (motion/tokens.ts). Reference behaviour [OBSERVED, 3 Nov 2026]:
//   - the Hero (no nav link) clears the active link;
//   - a section that is not watched (Breakdown, the footer) keeps the previous link active;
//   - when two watched sections share the band, the lower one (the one entering) wins
//     [TO VERIFY in the Phase 16 fidelity pass].

import { activeSection as band } from '../motion/tokens.ts';

/**
 * Picks the active link from the watched sections currently inside the band.
 * @param inBand ids of watched sections intersecting the band
 * @param order  watched section ids in page order
 * @param clears ids that clear the active link (the Hero)
 */
export function pickActiveSection(
  inBand: ReadonlySet<string>,
  order: readonly string[],
  previous: string | null,
  clears: ReadonlySet<string>,
): string | null {
  const lowest = order.filter((id) => inBand.has(id)).at(-1);
  if (lowest === undefined) return previous;
  return clears.has(lowest) ? null : lowest;
}

/** The detection band as an IntersectionObserver root margin: 15 % from the top, 65 % from the bottom. */
export const BAND_ROOT_MARGIN = `-${Math.round(band.bandTop * 100)}% 0px -${Math.round((1 - band.bandBottom) * 100)}% 0px`;

/**
 * Watches the given sections and reports the active link whenever it changes.
 * Returns a function that stops watching.
 */
export function watchActiveSection(
  order: readonly string[],
  clears: ReadonlySet<string>,
  onChange: (active: string | null) => void,
): () => void {
  const inBand = new Set<string>();
  let active: string | null = null;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inBand.add(entry.target.id);
        else inBand.delete(entry.target.id);
      }
      const next = pickActiveSection(inBand, order, active, clears);
      if (next !== active) {
        active = next;
        onChange(next);
      }
    },
    { rootMargin: BAND_ROOT_MARGIN, threshold: 0 },
  );
  for (const id of order) {
    const element = document.getElementById(id);
    if (element) observer.observe(element);
  }
  return () => observer.disconnect();
}
