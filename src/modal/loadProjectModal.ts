// Code-split pop-up (IMPLEMENTATION_PLAN Phase 11 task 10; ARCHITECTURE §9.2 JavaScript budget).
// The pop-up's code is a separate chunk, fetched once: when the browser is idle after load, or
// earlier when a visitor points at, focuses or presses something that opens it. Openers wait for
// the same promise, so the pop-up never shows a loading state for its own code.

import { lazy } from 'react';

/** Latest the idle prefetch waits (implementation guard, not a design value). */
const IDLE_TIMEOUT_MS = 2000;

let request: Promise<typeof import('./ProjectModal.tsx')> | null = null;

/** Starts (or reuses) the download of the pop-up's code. */
export function prefetchProjectModal(): Promise<typeof import('./ProjectModal.tsx')> {
  // A failed download is forgotten, so the next attempt tries again.
  request ??= import('./ProjectModal.tsx').catch((error: unknown) => {
    request = null;
    throw error;
  });
  return request;
}

/**
 * Warm-up only (idle, hover, focus, press): a failed download is ignored here — the next warm-up
 * or the visitor's click tries again — so it never surfaces as an unhandled error.
 */
export function warmProjectModal(): void {
  prefetchProjectModal().catch(() => {});
}

export const LazyProjectModal = lazy(() =>
  prefetchProjectModal().then((m) => ({ default: m.ProjectModal })),
);

/** Prefetches once the browser is idle (falls back to a short timer where unsupported). */
export function prefetchProjectModalWhenIdle(): () => void {
  const run = () => warmProjectModal();
  // Not available in every browser (Safari), despite the DOM typings.
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(run, IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(id);
}
