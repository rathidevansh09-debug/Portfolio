// Motion preference logic (PRD MO-5, FR-G3; ARCHITECTURE §3.2, §6.1). Framework-free so it can be
// unit-tested and run at start-up before React renders.

import { cssMotionVariables } from './tokens.ts';

export type OwnerPreference = 'on' | 'off';

/** The only value the site stores in the visitor's browser (ARCHITECTURE §11.3). */
export const MOTION_STORAGE_KEY = 'devansh-portfolio:motion';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Motion runs only when the visitor has not switched it off AND the system does not ask to reduce it. */
export function isMotionOn(owner: OwnerPreference, systemReduced: boolean): boolean {
  return owner === 'on' && !systemReduced;
}

/** Saved choice; defaults to "on". Storage can be unavailable (private mode, blocked): treated as unset. */
export function readOwnerPreference(
  storage: Pick<Storage, 'getItem'> | undefined,
): OwnerPreference {
  try {
    return storage?.getItem(MOTION_STORAGE_KEY) === 'off' ? 'off' : 'on';
  } catch {
    return 'on';
  }
}

export function writeOwnerPreference(
  storage: Pick<Storage, 'setItem'> | undefined,
  value: OwnerPreference,
): void {
  try {
    storage?.setItem(MOTION_STORAGE_KEY, value);
  } catch {
    // Not persisted when storage is unavailable; the choice still applies for this visit.
  }
}

/** data-motion="off" on <html> makes CSS transitions instant and anchor scrolling a jump (base.css). */
export function applyMotionAttribute(root: HTMLElement, motionOn: boolean): void {
  if (motionOn) root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', 'off');
}

/** Publishes the CSS-relevant motion tokens as custom properties (ARCHITECTURE §5). */
export function publishMotionCssVariables(root: HTMLElement): void {
  for (const [name, value] of Object.entries(cssMotionVariables))
    root.style.setProperty(name, value);
}

function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Start-up, before React renders: CSS motion variables + the correct root attribute (no flash). */
export function initMotion(): void {
  const root = document.documentElement;
  publishMotionCssVariables(root);
  const systemReduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  applyMotionAttribute(root, isMotionOn(readOwnerPreference(safeLocalStorage()), systemReduced));
}

// ── Owner-preference store (shared by every component through the provider) ──────────
const listeners = new Set<() => void>();

export const ownerPreferenceStore = {
  get(): OwnerPreference {
    return readOwnerPreference(safeLocalStorage());
  },
  set(value: OwnerPreference): void {
    writeOwnerPreference(safeLocalStorage(), value);
    listeners.forEach((notify) => notify());
  },
  subscribe(notify: () => void): () => void {
    listeners.add(notify);
    // Keep tabs in sync when the choice changes in another tab.
    const onStorage = (e: StorageEvent) => {
      if (e.key === MOTION_STORAGE_KEY) notify();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(notify);
      window.removeEventListener('storage', onStorage);
    };
  },
};
