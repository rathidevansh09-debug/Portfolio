// Case-study layout logic for the pop-up (PRD FR-M4, FR-M5; DESIGN §8.10). Framework-free.

import type { ContentItem, ImageRef } from '../content/schema.ts';
import { twoDigit } from './format.ts';

/** "01 / OVERVIEW": numbers follow the visible sections, so they stay continuous (D-16). */
export function sectionEyebrow(position: number, label: string): string {
  return `${twoDigit(position)} / ${label}`;
}

export type CaseStudyPiece =
  | { readonly kind: 'item'; readonly item: ContentItem }
  | { readonly kind: 'gallery'; readonly images: readonly ImageRef[] };

const isImage = (item: ContentItem): item is ImageRef => item.kind === 'image';

/**
 * Groups a section's items for display. With `galleries` on (Final Designs only — owner decision,
 * Phase 11), each run of two or more consecutive images becomes one gallery; a single image and
 * every other item stay inline, in their original order.
 */
export function groupContent(items: readonly ContentItem[], galleries: boolean): CaseStudyPiece[] {
  if (!galleries) return items.map((item) => ({ kind: 'item', item }));
  const pieces: CaseStudyPiece[] = [];
  let run: ImageRef[] = [];
  const flush = () => {
    if (run.length >= 2) pieces.push({ kind: 'gallery', images: run });
    else for (const item of run) pieces.push({ kind: 'item', item });
    run = [];
  };
  for (const item of items) {
    if (isImage(item)) run.push(item);
    else {
      flush();
      pieces.push({ kind: 'item', item });
    }
  }
  flush();
  return pieces;
}

/** Gallery step with wrap-around at both ends [REC] (owner decision, Phase 11). */
export function stepGallery(index: number, count: number, direction: 1 | -1): number {
  if (count <= 0) return 0;
  return (((index + direction) % count) + count) % count;
}
