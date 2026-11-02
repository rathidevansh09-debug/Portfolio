// MotionPreferenceProvider — one switch for every animation (PRD MO-5, FR-G3; ARCHITECTURE §3.2).
// Combines the owner toggle (saved in the browser) with the system "Reduce motion" setting, keeps
// the <html data-motion> attribute in sync, and sets Motion's defaults (MO-1).
//
// Motion's own reducedMotion setting only disables transform/layout animations (opacity still
// plays), so it is not relied on: animated components read `motionOn` and render their final state
// when it is false. `skipAnimations` is an extra safeguard (Phase 1 Task 2 audit).

import { MotionConfig } from 'motion/react';
import { createContext, use, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from './hooks/useMediaQuery.ts';
import {
  REDUCED_MOTION_QUERY,
  applyMotionAttribute,
  isMotionOn,
  ownerPreferenceStore,
  type OwnerPreference,
} from './preference.ts';
import { ease } from './tokens.ts';

export interface MotionPreference {
  /** True when animations should run. False → every animated component renders its final state. */
  readonly motionOn: boolean;
  /** The visitor's saved toggle choice. */
  readonly ownerPreference: OwnerPreference;
  /** The system "Reduce motion" setting. When true, motion stays off whatever the toggle says. */
  readonly systemReduced: boolean;
  readonly setOwnerPreference: (value: OwnerPreference) => void;
  readonly toggleOwnerPreference: () => void;
}

const MotionPreferenceContext = createContext<MotionPreference | null>(null);

export function MotionPreferenceProvider({ children }: { readonly children: ReactNode }) {
  const ownerPreference = useSyncExternalStore(
    ownerPreferenceStore.subscribe,
    ownerPreferenceStore.get,
    () => 'on' as const,
  );
  const systemReduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const motionOn = isMotionOn(ownerPreference, systemReduced);

  useEffect(() => {
    applyMotionAttribute(document.documentElement, motionOn);
  }, [motionOn]);

  const setOwnerPreference = useCallback((value: OwnerPreference) => {
    ownerPreferenceStore.set(value);
  }, []);
  const toggleOwnerPreference = useCallback(() => {
    ownerPreferenceStore.set(ownerPreferenceStore.get() === 'on' ? 'off' : 'on');
  }, []);

  const value = useMemo(
    () => ({ motionOn, ownerPreference, systemReduced, setOwnerPreference, toggleOwnerPreference }),
    [motionOn, ownerPreference, systemReduced, setOwnerPreference, toggleOwnerPreference],
  );

  return (
    <MotionPreferenceContext value={value}>
      <MotionConfig
        transition={{ ease: [...ease.signature] }}
        reducedMotion={motionOn ? 'never' : 'always'}
        skipAnimations={!motionOn}
      >
        {children}
      </MotionConfig>
    </MotionPreferenceContext>
  );
}

export function useMotionPreference(): MotionPreference {
  const value = use(MotionPreferenceContext);
  if (!value) throw new Error('useMotionPreference must be used inside <MotionPreferenceProvider>');
  return value;
}
