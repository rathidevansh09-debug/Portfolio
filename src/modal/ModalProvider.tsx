// Pop-up state (ARCHITECTURE §3.1, §3.2, §3.4): which item is open and which element opened it, so
// focus can return there on close (FR-M8). One pop-up for the whole page, opened from the Hero,
// Selected Work, Journey and Contact. The pop-up itself (native <dialog>, M-13, M-03b) is built in
// Phase 11; this context holds the state only (owner decision, Phase 8).

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { JourneyMilestone, Project, Video } from '../content/schema.ts';

/** The three pop-up content types (ARCHITECTURE §3.4; AGENTS §8). */
export type ModalItem =
  | { readonly kind: 'project'; readonly project: Project }
  | { readonly kind: 'showreel'; readonly video: Video }
  | { readonly kind: 'milestone'; readonly milestone: JourneyMilestone };

export interface ModalState {
  readonly item: ModalItem | null;
  /** The element that opened the pop-up; focus returns to it on close. */
  readonly opener: HTMLElement | null;
  readonly openModal: (item: ModalItem, opener: HTMLElement | null) => void;
  readonly closeModal: () => void;
}

const ModalContext = createContext<ModalState | null>(null);

export function ModalProvider({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState<{ item: ModalItem; opener: HTMLElement | null } | null>(null);

  const openModal = useCallback((item: ModalItem, opener: HTMLElement | null) => {
    setOpen({ item, opener });
  }, []);
  const closeModal = useCallback(() => setOpen(null), []);

  const value = useMemo(
    () => ({
      item: open?.item ?? null,
      opener: open?.opener ?? null,
      openModal,
      closeModal,
    }),
    [open, openModal, closeModal],
  );

  return <ModalContext value={value}>{children}</ModalContext>;
}

export function useModal(): ModalState {
  const value = use(ModalContext);
  if (!value) throw new Error('useModal must be used inside <ModalProvider>');
  return value;
}
