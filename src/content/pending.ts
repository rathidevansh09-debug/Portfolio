// PENDING marker (ARCHITECTURE §4.1 rule 5; PRD §11 placeholder rule; AGENTS §5).
// Any content the owner has not supplied yet is an explicit PENDING value — never plausible text.
//
// Rendering contract (implemented by components from Phase 7):
// - Development: a field that is Pending renders a visible "PENDING" placeholder of the same
//   size/shape as the real content, showing `note` so the owner knows what to supply.
// - Production: selectors (src/lib/selectors.ts) drop pending items; the launch check
//   (`npm run check:launch`) fails while any Pending value remains, so nothing pending ships.

export interface Pending {
  readonly kind: 'pending';
  /** What the owner must supply, in plain English. Shown in the development placeholder. */
  readonly note: string;
}

export const PENDING_LABEL = 'PENDING';

export function pending(note: string): Pending {
  return { kind: 'pending', note };
}

export function isPending(value: unknown): value is Pending {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'pending' &&
    typeof (value as { note?: unknown }).note === 'string'
  );
}

/** A value that is either supplied or still pending. */
export type OrPending<T> = T | Pending;
