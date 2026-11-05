// Selected Work + Brands harness: the real SelectedWork section with FICTIONAL "TEST" projects and
// generated "TEST LOGO" SVGs (owner decision 3, Phase 10). Test fixture only: never site content,
// never in the production build. Query: ?brands=N limits the logos (strip with few logos).
// Cards open the pop-up state (ModalProvider); the pop-up itself is exercised in modal.tsx.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/tokens.css';
import '../../../src/styles/fonts.css';
import '../../../src/styles/base.css';
import { content } from '../../../src/content/index.ts';
import { pending } from '../../../src/content/pending.ts';
import type {
  Brand,
  FilterKey,
  ImageRef,
  Project,
  ProjectIndex,
  ProjectType,
} from '../../../src/content/schema.ts';
import { approved } from '../../../src/content/schema.ts';
import { copyText } from '../../../src/lib/copy.ts';
import { ModalProvider } from '../../../src/modal/ModalProvider.tsx';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { initMotion } from '../../../src/motion/preference.ts';
import { SelectedWork } from '../../../src/sections/SelectedWork/SelectedWork.tsx';

/** A generated SVG test image (fictional), as a data URI. */
function testImage(w: number, h: number, label: string, fg: string, bg: string): ImageRef {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(h / 5)}" fill="${fg}">${label}</text>` +
    `</svg>`;
  return {
    kind: 'image',
    alt: label,
    asset: { sources: {}, img: { src: `data:image/svg+xml,${encodeURIComponent(svg)}`, w, h } },
  };
}

const TAGS: FilterKey[][] = [
  ['product-saas', 'dashboards-data'],
  ['ecommerce'],
  ['ecommerce', 'visual-design'],
  ['design-systems'],
  ['motion-video'],
  ['product-saas'],
  ['ecommerce'],
  ['visual-design'],
  ['dashboards-data'],
  ['motion-video', 'visual-design'],
  ['ecommerce'],
  ['product-saas'],
  ['design-systems', 'product-saas'],
  ['visual-design'],
];
const TYPES: ProjectType[] = ['case-study', 'website', 'video-motion', 'before-after'];

const project = (n: number, permitted = true): Project => ({
  slug: `test-${n}`,
  title: `Test project ${n}`,
  client: n % 3 === 0 ? `Test client ${n}` : null,
  tags: TAGS[(n - 1) % TAGS.length] ?? ['ecommerce'],
  primaryCategory: `Test category ${n}`,
  type: TYPES[(n - 1) % TYPES.length] ?? 'case-study',
  year: 2000 + n,
  cover: testImage(1920, 1164, `TEST ${n}`, '#00d5e8', '#0b1416'),
  heroMedia: pending('Not needed in the harness'),
  summary: pending('Not needed in the harness'),
  facts: pending('Not needed in the harness'),
  externalLink: null,
  sections: pending('Not needed in the harness'),
  permissionConfirmed: permitted,
});

const projects: Project[] = [
  ...Array.from({ length: 14 }, (_, i) => project(i + 1)),
  project(99, false), // never shown: no permission
];
const index: ProjectIndex = {
  displayOrder: projects.map((p) => p.slug),
  featured: ['test-2', 'test-5', 'test-9'],
};

const logoCount = Number(new URLSearchParams(location.search).get('brands') ?? '12');
const brands: Brand[] = [
  ...Array.from({ length: logoCount }, (_, i) => ({
    name: `Test logo ${i + 1}`,
    logo: testImage(260, 110, `TEST LOGO ${i + 1}`, '#f2efeb', '#1c2425'),
    permissionConfirmed: true,
  })),
  {
    name: 'Unpermitted test logo',
    logo: testImage(260, 110, 'NO PERMISSION', '#f2efeb', '#600'),
    permissionConfirmed: false,
  },
];

const { ui, site } = content;
const fallback = { mark: site.favicon.monogram, label: copyText(ui.states.imageUnavailable) };
// Fictional chip wording for the harness only (site chip wording is PENDING).
const testChip = approved('TEST TYPE');

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
initMotion();
createRoot(root).render(
  <StrictMode>
    <MotionPreferenceProvider>
      <ModalProvider>
        <div style={{ height: '40vh' }} />
        <SelectedWork
          id="portfolio"
          projects={projects}
          index={index}
          filters={content.filters}
          brands={brands}
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
              headingLine1: copyText(ui.brands.headingLine1),
              headingLine2: copyText(ui.brands.headingLine2),
              seeAll: copyText(ui.brands.seeAll),
              showStrip: 'TEST SHOW STRIP',
              autoScroll: copyText(ui.brands.autoScroll),
              previous: 'Test previous',
              next: 'Test next',
              region: 'Test logo strip',
              imageFallback: fallback,
            },
          }}
        />
        <div style={{ height: '120vh' }} />
      </ModalProvider>
    </MotionPreferenceProvider>
  </StrictMode>,
);
