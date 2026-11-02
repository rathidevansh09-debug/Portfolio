import { useSyncExternalStore } from 'react';

/** Live result of a CSS media query (system reduced motion, pointer capability). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** A real mouse: mouse-only effects (magnetic pull, hover states) are gated on this (PRD MO-6). */
export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

export function useFinePointer(): boolean {
  return useMediaQuery(FINE_POINTER_QUERY);
}
