// What "Play showreel" opens (PRD FR-HE7, FR-HE8; ARCHITECTURE A-7). Prepared in Phase 9; the
// button is connected to the pop-up in Phase 11 (owner decision).
//
// A-7: the showreel when one is supplied; when there is none, the first featured project in the
// confirmed DS-4 order (PNG Jewellers). While the showreel is still PENDING the same fallback
// applies; the launch check blocks publishing until the owner supplies or declines a showreel.

import { isPending, type OrPending } from '../content/pending.ts';
import type { Project, ProjectIndex, Video } from '../content/schema.ts';

/** Same shapes as the pop-up items (src/modal/ModalProvider.tsx). */
export type ShowreelTarget =
  | { readonly kind: 'showreel'; readonly video: Video }
  | { readonly kind: 'project'; readonly project: Project };

export function showreelTarget(
  showreel: OrPending<Video | null>,
  projects: readonly Project[],
  index: ProjectIndex,
): ShowreelTarget | null {
  if (!isPending(showreel) && showreel !== null) return { kind: 'showreel', video: showreel };
  const first = index.featured[0];
  const project = projects.find((p) => p.slug === first);
  return project ? { kind: 'project', project } : null;
}
