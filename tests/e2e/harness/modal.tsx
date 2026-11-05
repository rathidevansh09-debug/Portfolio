// Pop-up harness: the real Selected Work cards and the real ProjectModal with FICTIONAL "TEST"
// projects, a TEST showreel and TEST Journey milestones (generated SVG images, missing local clip,
// fictional embed address). Test fixture only: never site content, never in the production build.
// Interface wording comes from content/ui.ts; wording still PENDING there uses "Test …" labels.

import { StrictMode, Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/tokens.css';
import '../../../src/styles/fonts.css';
import '../../../src/styles/base.css';
import { content } from '../../../src/content/index.ts';
import type {
  ImageRef,
  JourneyMilestone,
  Project,
  ProjectIndex,
  PublicImage,
  Video,
} from '../../../src/content/schema.ts';
import { approved } from '../../../src/content/schema.ts';
import { copyText } from '../../../src/lib/copy.ts';
import {
  LazyProjectModal,
  prefetchProjectModal,
  prefetchProjectModalWhenIdle,
} from '../../../src/modal/loadProjectModal.ts';
import { ModalProvider, useModal, type ModalItem } from '../../../src/modal/ModalProvider.tsx';
import type { ProjectModalLabels } from '../../../src/modal/ProjectModal.tsx';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { initMotion } from '../../../src/motion/preference.ts';
import { SelectedWork } from '../../../src/sections/SelectedWork/SelectedWork.tsx';

const svg = (w: number, h: number, label: string, bg: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="100%" height="100%" fill="${bg}"/>` +
      `<text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(h / 8)}" fill="#00d5e8">${label}</text>` +
      `</svg>`,
  )}`;

function testImage(w: number, h: number, label: string, caption?: string): ImageRef {
  return {
    kind: 'image',
    alt: label,
    asset: { sources: {}, img: { src: svg(w, h, label, '#0b1416'), w, h } },
    ...(caption ? { caption } : {}),
  };
}
const testPoster = (label: string): PublicImage => ({
  src: svg(1600, 900, label, '#14201f'),
  width: 1600,
  height: 900,
});

const LONG =
  'Test paragraph. This fictional text exists only to give the pop-up enough height to scroll ' +
  'inside its own area, so the sticky heading bar and the once-per-opening block reveals can be ' +
  'checked. It carries no real project information.';

const localClip: Video = {
  kind: 'video',
  title: 'Test local clip',
  poster: testPoster('TEST POSTER'),
  // Deliberately missing: exercises the error state without any third-party request.
  source: { type: 'local', src: '/tests/e2e/harness/missing-test-clip.mp4' },
  hasSpeech: false,
};
const embedClip: Video = {
  kind: 'video',
  title: 'Test embedded clip',
  poster: testPoster('TEST EMBED POSTER'),
  source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=TESTtest000' },
  hasSpeech: false,
};

const base = (n: number, over: Partial<Project>): Project => ({
  slug: `test-${n}`,
  title: `Test project ${n}`,
  client: null,
  tags: ['product-saas'],
  primaryCategory: `Test category ${n}`,
  type: 'case-study',
  year: 2020 + n,
  cover: testImage(1920, 1164, `TEST ${n}`),
  heroMedia: testImage(1600, 900, `TEST HERO ${n}`),
  summary: `Test summary ${n}. A fictional one-paragraph summary for the pop-up harness.`,
  facts: {},
  externalLink: null,
  sections: {},
  permissionConfirmed: true,
  ...over,
});

const projects: Project[] = [
  base(1, {
    title: 'Test full case study',
    externalLink: { href: 'https://example.com/test', label: approved('Test visit site') },
    facts: {
      client: { value: 'Test client', verified: true },
      year: { value: '2021', verified: true },
      myRole: { value: 'Test role', verified: true },
      team: { value: 'Test team (unverified)', verified: false },
      platform: { value: 'Test platform', verified: true },
      tools: { value: 'Test tools', verified: true },
    },
    sections: {
      overview: { items: [{ kind: 'paragraph', text: LONG }] },
      problem: {
        items: [
          { kind: 'bullets', items: ['Test point one', 'Test point two', 'Test point three'] },
        ],
      },
      research: {
        heading: 'Test research sub-title',
        items: [
          { kind: 'paragraph', text: LONG },
          testImage(1600, 1000, 'TEST INLINE', 'Test inline caption'),
        ],
      },
      processAndDecisions: {
        items: [
          { kind: 'paragraph', text: LONG },
          {
            kind: 'beforeAfter',
            before: testImage(1600, 900, 'TEST WIREFRAME'),
            after: testImage(1600, 900, 'TEST FINAL'),
          },
        ],
      },
      finalDesigns: {
        items: [
          testImage(1600, 900, 'TEST GALLERY 1', 'Test gallery caption 1'),
          testImage(900, 1200, 'TEST GALLERY 2', 'Test gallery caption 2'),
          testImage(1600, 900, 'TEST GALLERY 3'),
          { kind: 'paragraph', text: LONG },
        ],
      },
      outcomes: [
        { value: '+1', label: 'Test outcome one', verified: true },
        { value: '+2', label: 'Test outcome two', verified: true },
        { value: '+3', label: 'Test unverified outcome', verified: false },
      ],
    },
  }),
  base(2, {
    title: 'Test minimal project',
    sections: {
      finalDesigns: {
        items: [testImage(1600, 900, 'TEST MIN 1'), testImage(1600, 900, 'TEST MIN 2')],
      },
    },
  }),
  base(3, { title: 'Test local video', type: 'video-motion', heroMedia: localClip }),
  base(4, { title: 'Test embed video', type: 'video-motion', heroMedia: embedClip }),
  base(5, {
    title: 'Test before after',
    type: 'before-after',
    heroMedia: {
      kind: 'beforeAfter',
      before: testImage(1600, 900, 'TEST HERO WIREFRAME'),
      after: testImage(1600, 900, 'TEST HERO FINAL'),
    },
  }),
];
const index: ProjectIndex = {
  displayOrder: projects.map((p) => p.slug),
  featured: ['test-1', 'test-2', 'test-3'],
};

const milestones: JourneyMilestone[] = [
  {
    title: 'Test document milestone',
    year: 2019,
    verified: true,
    opens: {
      kind: 'document',
      href: '/tests/e2e/harness/test-document.pdf',
      label: 'Test document',
      preview: testImage(1200, 1600, 'TEST DOC PREVIEW'),
    },
  },
  {
    title: 'Test image milestone',
    year: 2018,
    verified: true,
    opens: testImage(1600, 900, 'TEST AWARD'),
  },
];

const { ui, site } = content;
const fallback = { mark: site.favicon.monogram, label: copyText(ui.states.imageUnavailable) };
const testChip = approved('TEST TYPE');

const MODAL_LABELS: ProjectModalLabels = {
  close: 'Test close',
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
  visitLiveSite: 'Test fallback link label',
  media: {
    sliderLabel: copyText(ui.breakdown.sliderLabel),
    toggleWireframe: copyText(ui.popup.toggleWireframe),
    toggleFinal: copyText(ui.popup.toggleFinal),
    video: {
      play: 'Test play {title}',
      loading: copyText(ui.states.loading),
      error: copyText(ui.states.videoError),
      tryAgain: copyText(ui.states.tryAgain),
      openOriginal: copyText(ui.states.openOriginal),
      restrictedNote: copyText(ui.states.restrictedNote),
    },
    imageFallback: fallback,
  },
  gallery: { previous: 'Test previous image', next: 'Test next image', imageFallback: fallback },
  unavailable: 'Test section unavailable',
};

function PopUp() {
  const { item, opener, closeModal } = useModal();
  // ?idle=off keeps the idle prefetch from running (code-splitting test).
  const idle = new URLSearchParams(location.search).get('idle') !== 'off';
  useEffect(() => (idle ? prefetchProjectModalWhenIdle() : undefined), [idle]);
  if (!item) return null;
  return (
    <Suspense fallback={null}>
      <LazyProjectModal item={item} opener={opener} onClosed={closeModal} labels={MODAL_LABELS} />
    </Suspense>
  );
}

function ExtraOpeners() {
  const { openModal } = useModal();
  const open = (item: ModalItem) => (e: { currentTarget: HTMLElement }) => {
    const opener = e.currentTarget;
    void prefetchProjectModal().then(() => openModal(item, opener));
  };
  return (
    <p style={{ display: 'flex', gap: 16, padding: 24 }}>
      <button type="button" onClick={open({ kind: 'showreel', video: localClip })}>
        Test open showreel
      </button>
      {milestones.map((m) => (
        <button key={m.title} type="button" onClick={open({ kind: 'milestone', milestone: m })}>
          Test open {m.title}
        </button>
      ))}
    </p>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
initMotion();
createRoot(root).render(
  <StrictMode>
    <MotionPreferenceProvider>
      <ModalProvider>
        <div style={{ height: '30vh' }} />
        <ExtraOpeners />
        <SelectedWork
          id="portfolio"
          projects={projects}
          index={index}
          filters={content.filters}
          brands={[]}
          labels={{
            eyebrow: copyText(ui.work.eyebrow),
            headline: copyText(ui.work.headline),
            allWork: copyText(ui.work.allWorkToggle),
            selectedWork: copyText(ui.work.selectedWorkToggle),
            filterAll: copyText(ui.work.filterAll),
            filtersLabel: 'Test filter group',
            search: copyText(ui.work.search),
            showMore: copyText(ui.work.showMore),
            count: copyText(ui.work.count),
            empty: copyText(ui.work.empty),
            resetSearch: copyText(ui.work.resetSearch),
            announcement: 'TEST {count} projects',
            chips: {
              'case-study': testChip,
              website: testChip,
              'video-motion': testChip,
              'before-after': testChip,
            },
            imageFallback: fallback,
            brands: {
              headingLine1: 'TEST',
              headingLine2: 'TEST',
              seeAll: 'TEST',
              showStrip: 'TEST',
              autoScroll: 'TEST',
              previous: 'TEST',
              next: 'TEST',
              region: 'TEST',
              imageFallback: fallback,
            },
          }}
        />
        <div style={{ height: '200vh' }} />
        <PopUp />
      </ModalProvider>
    </MotionPreferenceProvider>
  </StrictMode>,
);
