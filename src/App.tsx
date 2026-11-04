// Page composition in the fixed section order (PRD §5; ARCHITECTURE §3.1).
// Providers: motion preference (MO-5) → pop-up state. The film grain is the body::after layer in
// base.css (owner decision, Phase 8: no separate Grain component). Footer: Phase 14.
// The pop-up itself (ProjectModal) is rendered here from Phase 11.

import { content } from './content/index.ts';
import { Header, type NavItem } from './layout/Header/Header.tsx';
import { ReadingProgress } from './layout/ReadingProgress/ReadingProgress.tsx';
import { SectionBoundary } from './layout/SectionBoundary/SectionBoundary.tsx';
import { SectionPlaceholder } from './layout/SectionPlaceholder/SectionPlaceholder.tsx';
import { SkipLink } from './layout/SkipLink/SkipLink.tsx';
import { Hero, type HeroLabels } from './sections/Hero/Hero.tsx';
import { copyText } from './lib/copy.ts';
import { ModalProvider } from './modal/ModalProvider.tsx';
import { MotionPreferenceProvider } from './motion/MotionPreference.tsx';

const { ui, profile, site } = content;

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
  imageFallback: { mark: site.favicon.monogram, label: copyText(ui.states.imageUnavailable) },
};

// TEMPORARY development placeholders (owner decision, Phase 8), replaced by each section's phase.
const SECTIONS: readonly { id?: string; name: string; phase: number }[] = [
  { id: 'portfolio', name: 'Selected Work', phase: 10 },
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
            <Hero id={HOME.id} profile={profile} labels={HERO_LABELS} workHref="#portfolio" />
          </SectionBoundary>
          {SECTIONS.map((section) => (
            <SectionBoundary key={section.name} id={section.id} fallback={SECTION_FALLBACK}>
              <SectionPlaceholder id={section.id} name={section.name} phase={section.phase} />
            </SectionBoundary>
          ))}
        </main>
      </ModalProvider>
    </MotionPreferenceProvider>
  );
}
