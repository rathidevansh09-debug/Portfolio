// Hero harness: the real Hero with FICTIONAL test values (never site content) so the stats rule can
// be checked with 0, 1, 2 and 3 verified stats (?stats=N). The portrait stays PENDING: no portrait
// is invented or generated. Test fixture only.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/tokens.css';
import '../../../src/styles/fonts.css';
import '../../../src/styles/base.css';
import { content } from '../../../src/content/index.ts';
import type { ProfileContent, Stat } from '../../../src/content/schema.ts';
import { copyText } from '../../../src/lib/copy.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { initMotion } from '../../../src/motion/preference.ts';
import { Hero } from '../../../src/sections/Hero/Hero.tsx';

const count = Math.min(3, Math.max(0, Number(new URLSearchParams(location.search).get('stats'))));
const stats: Stat[] = Array.from({ length: count }, (_, i) => ({
  value: String((i + 1) * 10),
  suffix: '+',
  label: `TEST STAT LABEL ${i + 1}`,
  verified: true,
}));

const { profile, ui, site } = content;
const testProfile: ProfileContent = {
  ...profile,
  intro: 'Test description text for layout checks only. It is not site content.',
  location: 'TEST CITY, TEST COUNTRY',
  availability: { ...profile.availability, shown: true },
  stats,
  cv: {
    kind: 'document',
    href: '#test-cv',
    label: 'Test CV',
    preview: {
      kind: 'image',
      alt: 'Test',
      asset: {
        sources: {},
        img: { src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', w: 1, h: 1 },
      },
    },
  },
  editionStartYear: 2000,
};

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
initMotion();
createRoot(root).render(
  <StrictMode>
    <MotionPreferenceProvider>
      <Hero
        id="home"
        profile={testProfile}
        workHref="#portfolio"
        labels={{
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
          imageFallback: {
            mark: site.favicon.monogram,
            label: copyText(ui.states.imageUnavailable),
          },
        }}
      />
      <div id="portfolio" style={{ height: '150vh' }} />
    </MotionPreferenceProvider>
  </StrictMode>,
);
