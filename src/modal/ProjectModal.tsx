// The pop-up (PRD FR-M1–M10, FR-HE8, FR-J5; DESIGN §8.10, §9.3; ARCHITECTURE §3.4, R-6, R-7).
// One native modal <dialog> for projects, the showreel and Journey milestone items. Rendered only
// while open; its content unmounts on close, so M-03b block reveals start fresh at each opening.
//
// Opening: page scroll locked (lib/scrollLock), dialog shown as modal (the page behind becomes
// inert), focus moves to the panel; the dialog is labelled by the title.
// M-13: the backdrop layer fades 0 → 1 and the panel moves +45 px → 0 and scales 0.97 → 1
// (≈ 0.35 s, signature); the reverse on close. Motion off (MO-5): instant.
//
// Closing (owner decision, Phase 11):
//   Normal path — Escape (the dialog's `cancel` event, default prevented), the close button and a
//   backdrop press all call requestClose(). It ignores repeats, plays the M-13 exit, and only then
//   closes the dialog and cleans up (R-6).
//   Fallback — the dialog's `close` event is defensive cleanup for unexpected native closures
//   (e.g. a browser closing the dialog without a `cancel` event); it cleans up at once.
//   Cleanup (finish) is idempotent: scroll and focus are restored, and the state reset, once.
// A backdrop press counts only when it both starts and ends on the backdrop.

import { AnimatePresence, motion, type Transition, type Variants } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { OutlineButton } from '../components/actions/OutlineButton/OutlineButton.tsx';
import { PendingMarker } from '../components/PendingMarker/PendingMarker.tsx';
import { isPending, type OrPending } from '../content/pending.ts';
import type { CaseStudySections, Project, ProjectLink, Video } from '../content/schema.ts';
import { lockScroll, unlockScroll } from '../lib/scrollLock.ts';
import { currentContentMode, verifiedFacts, visibleSections } from '../lib/selectors.ts';
import { SectionBoundary } from '../layout/SectionBoundary/SectionBoundary.tsx';
import { useMotionPreference } from '../motion/MotionPreference.tsx';
import { RevealScrollRoot } from '../motion/Reveal.tsx';
import { ease, popup } from '../motion/tokens.ts';
import { CaseStudyBlock } from './CaseStudyBlock.tsx';
import { FactsStrip, type FactLabels } from './FactsStrip.tsx';
import type { GalleryLabels } from './Gallery.tsx';
import { MilestoneView } from './MilestoneView.tsx';
import type { ModalItem } from './ModalProvider.tsx';
import { ModalHeading } from './ModalHeading.tsx';
import { ModalMedia, type ModalMediaLabels } from './ModalMedia.tsx';
import { SummaryRow } from './SummaryRow.tsx';
import styles from './ProjectModal.module.css';

export interface ProjectModalLabels {
  /** Close button's accessible name (ui.popup.close). */
  readonly close: string;
  readonly sections: Readonly<Record<keyof CaseStudySections, string>>;
  readonly facts: FactLabels;
  /** Heading-bar eyebrow for the showreel ("MOTION / VIDEO"). */
  readonly showreelEyebrow: string;
  readonly openDocument: string;
  /** External-link button wording when a project has no label of its own (ui.popup.visitLiveSite). */
  readonly visitLiveSite: string;
  readonly media: ModalMediaLabels;
  readonly gallery: GalleryLabels;
  /** Quiet message if the pop-up's content fails to render (ui.states.sectionUnavailable). */
  readonly unavailable: string;
}

export interface ProjectModalProps {
  readonly item: ModalItem;
  /** Focus returns here on close (FR-M8). */
  readonly opener: HTMLElement | null;
  /** Called once, after the dialog has closed and been cleaned up. */
  readonly onClosed: () => void;
  readonly labels: ProjectModalLabels;
}

const BACKDROP: Variants = { hidden: { opacity: 0 }, shown: { opacity: 1 } };
const PANEL: Variants = {
  hidden: { y: popup.y, scale: popup.scale },
  shown: { y: 0, scale: 1 },
};

export function ProjectModal({ item, opener, onClosed, labels }: ProjectModalProps) {
  const { motionOn } = useMotionPreference();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const finishedRef = useRef(false);
  const press = useRef({ down: false, up: false });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    closingRef.current = true;
    unlockScroll();
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    onClosed();
  }, [opener, onClosed]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (motionOn) setClosing(true);
    else finish();
  }, [motionOn, finish]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    lockScroll();
    if (!dialog.open) dialog.showModal();
    panelRef.current?.focus({ preventScroll: true });
    // Unmount safety net; after finish() both calls do nothing.
    return () => {
      if (dialog.open) dialog.close();
      unlockScroll();
    };
  }, []);

  const outsidePanel = (target: EventTarget) =>
    !(target instanceof Node && panelRef.current?.contains(target));
  const transition: Transition = { duration: popup.duration, ease: [...ease.signature] };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClose={() => {
        // A close event while the dialog is open again (development re-mount) is stale.
        if (!dialogRef.current?.open) finish();
      }}
      onPointerDown={(e) => {
        press.current = { down: outsidePanel(e.target), up: false };
      }}
      onPointerUp={(e) => {
        press.current.up = press.current.down && outsidePanel(e.target);
      }}
      onClick={(e) => {
        const { down, up } = press.current;
        press.current = { down: false, up: false };
        if (down && up && outsidePanel(e.target)) requestClose();
      }}
    >
      <AnimatePresence onExitComplete={finish}>
        {closing ? null : (
          <motion.div
            key="backdrop"
            className={styles.backdrop}
            variants={BACKDROP}
            initial={motionOn ? 'hidden' : false}
            animate="shown"
            exit="hidden"
            transition={transition}
            data-testid="modal-backdrop"
          >
            <motion.div
              ref={panelRef}
              className={styles.panel}
              variants={PANEL}
              transition={transition}
              tabIndex={-1}
            >
              <ModalHeading
                eyebrow={eyebrowFor(item, labels)}
                closeLabel={labels.close}
                onClose={requestClose}
              />
              <RevealScrollRoot rootRef={panelRef}>
                <SectionBoundary fallback={labels.unavailable}>
                  <ModalBody item={item} titleId={titleId} labels={labels} />
                </SectionBoundary>
              </RevealScrollRoot>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

const isDevelopment = () => currentContentMode() === 'development';

/** The project's own link label takes precedence; a missing or blank one uses the fallback. */
function linkLabel(link: ProjectLink, fallback: string): string {
  return link.label && link.label.text.trim() !== '' ? link.label.text : fallback;
}

/** A PENDING value shows its marker in development and nothing in production. */
function pendingOr<T>(value: OrPending<T>, render: (v: T) => ReactNode): ReactNode {
  if (!isPending(value)) return render(value);
  return isDevelopment() ? <PendingMarker note={value.note} /> : null;
}

function eyebrowFor(item: ModalItem, labels: ProjectModalLabels): ReactNode {
  switch (item.kind) {
    case 'project': {
      // "Primary category · year" (FR-M2).
      const parts = [
        pendingOr(item.project.primaryCategory, (c) => c),
        pendingOr(item.project.year, (y) => String(y)),
      ].filter((p) => p !== null);
      return parts.map((part, i) => (
        <span key={i} className={styles.eyebrowPart}>
          {i > 0 ? <span aria-hidden="true">·</span> : null}
          {part}
        </span>
      ));
    }
    case 'showreel':
      return labels.showreelEyebrow;
    case 'milestone':
      return String(item.milestone.year);
  }
}

function ModalBody({
  item,
  titleId,
  labels,
}: {
  readonly item: ModalItem;
  readonly titleId: string;
  readonly labels: ProjectModalLabels;
}) {
  switch (item.kind) {
    case 'project':
      return <ProjectView project={item.project} titleId={titleId} labels={labels} />;
    case 'showreel':
      return <ShowreelView video={item.video} titleId={titleId} labels={labels} />;
    case 'milestone':
      return (
        <MilestoneView
          milestone={item.milestone}
          titleId={titleId}
          openDocument={labels.openDocument}
          media={labels.media}
        />
      );
  }
}

function ProjectView({
  project,
  titleId,
  labels,
}: {
  readonly project: Project;
  readonly titleId: string;
  readonly labels: ProjectModalLabels;
}) {
  const sections = visibleSections(project.sections);
  return (
    <>
      {isPending(project.heroMedia) ? (
        isDevelopment() ? (
          <div className={styles.pendingMedia}>
            <PendingMarker note={project.heroMedia.note} variant="fill" />
          </div>
        ) : null
      ) : (
        <ModalMedia media={project.heroMedia} labels={labels.media} />
      )}
      <SummaryRow
        titleId={titleId}
        title={project.title}
        summary={pendingOr(project.summary, (s) => s)}
        action={pendingOr(project.externalLink, (link) =>
          link ? (
            <OutlineButton href={link.href} external icon="arrow-up-right">
              {linkLabel(link, labels.visitLiveSite)}
            </OutlineButton>
          ) : null,
        )}
      />
      {isPending(project.facts) ? (
        <DevPending note={project.facts.note} />
      ) : (
        <FactsStrip facts={verifiedFacts(project.facts)} labels={labels.facts} />
      )}
      {isPending(project.sections) ? <DevPending note={project.sections.note} /> : null}
      {sections.map((section, i) => (
        <CaseStudyBlock
          key={section.key}
          position={i + 1}
          label={labels.sections[section.key]}
          section={section}
          labels={{ media: labels.media, gallery: labels.gallery }}
        />
      ))}
    </>
  );
}

function ShowreelView({
  video,
  titleId,
  labels,
}: {
  readonly video: Video;
  readonly titleId: string;
  readonly labels: ProjectModalLabels;
}) {
  return (
    <>
      <ModalMedia media={video} labels={labels.media} />
      <SummaryRow titleId={titleId} title={video.title} />
    </>
  );
}

function DevPending({ note }: { readonly note: string }) {
  return isDevelopment() ? (
    <div className={styles.pendingRow}>
      <PendingMarker note={note} />
    </div>
  ) : null;
}
