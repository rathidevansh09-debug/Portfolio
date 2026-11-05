// Page composition in the fixed section order (PRD §5; ARCHITECTURE §3.1).
// Providers: motion preference (MO-5) → pop-up state. The film grain is the body::after layer in
// base.css (owner decision, Phase 8: no separate Grain component). Footer: Phase 14.
// The pop-up (ProjectModal) is a separate code chunk, rendered only while open (PopUp below).

import { Suspense, useEffect } from 'react';
import { content } from './content/index.ts';
import { Header, type NavItem } from './layout/Header/Header.tsx';
import { ReadingProgress } from './layout/ReadingProgress/ReadingProgress.tsx';
import { SectionBoundary } from './layout/SectionBoundary/SectionBoundary.tsx';
import { SectionPlaceholder } from './layout/SectionPlaceholder/SectionPlaceholder.tsx';
import { SkipLink } from './layout/SkipLink/SkipLink.tsx';
import { Hero, type HeroLabels } from './sections/Hero/Hero.tsx';
import { SelectedWork, type SelectedWorkLabels } from './sections/SelectedWork/SelectedWork.tsx';
import { copyText } from './lib/copy.ts';
import { currentContentMode, publishedProjects } from './lib/selectors.ts';
import { showreelTarget } from './lib/showreel.ts';
import { LazyProjectModal, prefetchProjectModalWhenIdle } from './modal/loadProjectModal.ts';
import { ModalProvider, useModal } from './modal/ModalProvider.tsx';
import type { ProjectModalLabels } from './modal/ProjectModal.tsx';
import { MotionPreferenceProvider } from './motion/MotionPreference.tsx';

const { ui, profile, site, projects, projectIndex, filters, brands } = content;

// Section anchors (PRD §5). Breakdown has no anchor and no nav link.
const HOME: NavItem = { id: 'home', label: copyText(ui.nav.home) };
const NAV: readonly NavItem[] = [
  { id: 'portfolio', label: copyText(ui.nav.work) },
  { id: 'impact', label: copyText(ui.nav.impact) },
  { id: 'about', label: copyText(ui.nav.about) },
  { id: 'experience', label: copyText(ui.nav.journey) },
  { id: 'contact', label: copyText(ui.nav.contact) },
];
const TALK: NavItem = { id: 'contact', label: copyText(ui.nav.letsTalk) };
const MOTION_LABELS = {
  on: copyText(ui.nav.motionOn),
  off: copyText(ui.nav.motionOff),
  systemNote: copyText(ui.nav.motionSystemNote),
};
const MENU_LABELS = { open: copyText(ui.nav.menuButton), close: copyText(ui.nav.closeMenu) };
const SECTION_FALLBACK = copyText(ui.states.sectionUnavailable);
// A-7: the showreel, or the first featured project when it may be shown (owner decision, Phase 11).
const SHOWREEL = showreelTarget(
  profile.showreel,
  publishedProjects(projects, currentContentMode()),
  projectIndex,
);

const IMAGE_FALLBACK = {
  mark: site.favicon.monogram,
  label: copyText(ui.states.imageUnavailable),
};
const HERO_LABELS: HeroLabels = {
  supportingLine: copyText(profile.supportingLine),
  hello: copyText(profile.helloLine),
  availability: copyText(profile.availability.text),
  manifestoLines: profile.manifestoLines.map(copyText),
  seeMyWork: copyText(ui.hero.seeMyWork),
  downloadCv: copyText(ui.hero.downloadCv),
  playShowreel: copyText(ui.hero.playShowreel),
  showreelSecondary: copyText(ui.hero.showreelSecondary),
  scrollToDiscover: copyText(ui.hero.scrollToDiscover),
  editionTemplate: copyText(ui.hero.editionLabel),
  imageFallback: IMAGE_FALLBACK,
};

const WORK_LABELS: SelectedWorkLabels = {
  eyebrow: copyText(ui.work.eyebrow),
  headline: copyText(ui.work.headline),
  allWork: copyText(ui.work.allWorkToggle),
  selectedWork: copyText(ui.work.selectedWorkToggle),
  filterAll: copyText(ui.work.filterAll),
  filtersLabel: copyText(ui.work.filtersLabel),
  search: copyText(ui.work.search),
  showMore: copyText(ui.work.showMore),
  count: copyText(ui.work.count),
  empty: copyText(ui.work.empty),
  resetSearch: copyText(ui.work.resetSearch),
  announcement: copyText(ui.work.resultAnnouncement),
  // Chip wording may be PENDING; the card shows a development marker or nothing.
  chips: {
    'case-study': ui.work.typeCaseStudy,
    website: ui.work.typeWebsite,
    'video-motion': ui.work.typeVideoMotion,
    'before-after': ui.work.typeBeforeAfter,
  },
  imageFallback: IMAGE_FALLBACK,
  brands: {
    headingLine1: copyText(ui.brands.headingLine1),
    headingLine2: copyText(ui.brands.headingLine2),
    seeAll: copyText(ui.brands.seeAll),
    showStrip: copyText(ui.brands.showStrip),
    autoScroll: copyText(ui.brands.autoScroll),
    previous: copyText(ui.brands.previous),
    next: copyText(ui.brands.next),
    region: copyText(ui.brands.regionLabel),
    imageFallback: IMAGE_FALLBACK,
  },
};

const MODAL_LABELS: ProjectModalLabels = {
  close: copyText(ui.popup.close),
  sections: {
    overview: copyText(ui.popup.overview),
    problem: copyText(ui.popup.problem),
    research: copyText(ui.popup.research),
    processAndDecisions: copyText(ui.popup.processAndDecisions),
    finalDesigns: copyText(ui.popup.finalDesigns),
    outcomes: copyText(ui.popup.outcomes),
  },
  facts: {
    client: copyText(ui.popup.factClient),
    year: copyText(ui.popup.factYear),
    myRole: copyText(ui.popup.factMyRole),
    team: copyText(ui.popup.factTeam),
    platform: copyText(ui.popup.factPlatform),
    tools: copyText(ui.popup.factTools),
  },
  showreelEyebrow: copyText(ui.hero.showreelSecondary),
  openDocument: copyText(ui.popup.openDocument),
  visitLiveSite: copyText(ui.popup.visitLiveSite),
  media: {
    sliderLabel: copyText(ui.breakdown.sliderLabel),
    toggleWireframe: copyText(ui.popup.toggleWireframe),
    toggleFinal: copyText(ui.popup.toggleFinal),
    video: {
      play: copyText(ui.states.playVideo),
      loading: copyText(ui.states.loading),
      error: copyText(ui.states.videoError),
      tryAgain: copyText(ui.states.tryAgain),
      openOriginal: copyText(ui.states.openOriginal),
      restrictedNote: copyText(ui.states.restrictedNote),
    },
    imageFallback: IMAGE_FALLBACK,
  },
  gallery: {
    previous: copyText(ui.popup.galleryPrevious),
    next: copyText(ui.popup.galleryNext),
    imageFallback: IMAGE_FALLBACK,
  },
  unavailable: SECTION_FALLBACK,
};

/** The pop-up host: prefetches the pop-up's code when idle; renders it only while an item is open. */
function PopUp() {
  const { item, opener, closeModal } = useModal();
  useEffect(() => prefetchProjectModalWhenIdle(), []);
  if (!item) return null;
  return (
    // Openers wait for the code before opening, so there is no loading state to show.
    <Suspense fallback={null}>
      <LazyProjectModal item={item} opener={opener} onClosed={closeModal} labels={MODAL_LABELS} />
    </Suspense>
  );
}

// TEMPORARY development placeholders (owner decision, Phase 8), replaced by each section's phase.
const SECTIONS: readonly { id?: string; name: string; phase: number }[] = [
  { id: 'impact', name: 'Impact & Milestones', phase: 12 },
  { name: 'Breakdown', phase: 12 },
  { id: 'about', name: 'About', phase: 13 },
  { id: 'experience', name: 'Journey', phase: 13 },
  { id: 'contact', name: 'Contact', phase: 14 },
];

export default function App() {
  return (
    <MotionPreferenceProvider>
      <ModalProvider>
        <SkipLink targetId="portfolio" label={copyText(ui.nav.skipToWork)} />
        <ReadingProgress />
        <Header
          wordmark={profile.wordmark}
          home={HOME}
          items={NAV}
          talk={TALK}
          motionLabels={MOTION_LABELS}
          menuLabels={MENU_LABELS}
        />
        <main>
          <SectionBoundary id={HOME.id} fallback={SECTION_FALLBACK}>
            <Hero
              id={HOME.id}
              profile={profile}
              labels={HERO_LABELS}
              workHref="#portfolio"
              showreel={SHOWREEL}
            />
          </SectionBoundary>
          <SectionBoundary id="portfolio" fallback={SECTION_FALLBACK}>
            <SelectedWork
              id="portfolio"
              projects={projects}
              index={projectIndex}
              filters={filters}
              brands={brands}
              labels={WORK_LABELS}
            />
          </SectionBoundary>
          {SECTIONS.map((section) => (
            <SectionBoundary key={section.name} id={section.id} fallback={SECTION_FALLBACK}>
              <SectionPlaceholder id={section.id} name={section.name} phase={section.phase} />
            </SectionBoundary>
          ))}
        </main>
        <PopUp />
      </ModalProvider>
    </MotionPreferenceProvider>
  );
}
