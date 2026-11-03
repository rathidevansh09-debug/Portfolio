// Component harness: renders every Phase 7 shared component, in each state, with the real design
// tokens, fonts, motion provider and interface wording (src/content/ui.ts; PENDING wording shows as
// "PENDING"). Test fixture only — the titles, images and URLs below are fictional test data, the
// images are generated SVG data URIs (no media files), and the inline layout styles are not site
// design values. Video and caption URLs under /__harness/ are answered by Playwright routes.

import { StrictMode, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/styles/tokens.css';
import '../../../src/styles/fonts.css';
import '../../../src/styles/base.css';
import { ComparisonSlider } from '../../../src/components/ComparisonSlider/ComparisonSlider.tsx';
import { MilestoneItem } from '../../../src/components/MilestoneRow/MilestoneItem.tsx';
import { MilestoneRow } from '../../../src/components/MilestoneRow/MilestoneRow.tsx';
import { IconButton } from '../../../src/components/actions/IconButton/IconButton.tsx';
import { OutlineButton } from '../../../src/components/actions/OutlineButton/OutlineButton.tsx';
import { PlayCircle } from '../../../src/components/actions/PlayCircle/PlayCircle.tsx';
import { PrimaryButton } from '../../../src/components/actions/PrimaryButton/PrimaryButton.tsx';
import { RoundArrowCta } from '../../../src/components/actions/RoundArrowCta/RoundArrowCta.tsx';
import { TextLink } from '../../../src/components/actions/TextLink/TextLink.tsx';
import { Asterisk } from '../../../src/components/icons/Asterisk.tsx';
import { HandleChevrons } from '../../../src/components/icons/HandleChevrons.tsx';
import { Icon, SOCIAL_ICON, type IconName } from '../../../src/components/icons/Icon.tsx';
import { Laurel } from '../../../src/components/icons/Laurel.tsx';
import { QuoteMark } from '../../../src/components/icons/QuoteMark.tsx';
import { ImageFallback } from '../../../src/components/media/ImageFallback/ImageFallback.tsx';
import { LoadingRing } from '../../../src/components/media/LoadingRing/LoadingRing.tsx';
import { MediaImage } from '../../../src/components/media/MediaImage/MediaImage.tsx';
import { VideoPlayer } from '../../../src/components/media/VideoPlayer/VideoPlayer.tsx';
import { DisplayHeading } from '../../../src/components/typography/DisplayHeading/DisplayHeading.tsx';
import { Eyebrow } from '../../../src/components/typography/Eyebrow/Eyebrow.tsx';
import { SectionHeading } from '../../../src/components/typography/SectionHeading/SectionHeading.tsx';
import { isPending, PENDING_LABEL, type OrPending } from '../../../src/content/pending.ts';
import { profile } from '../../../src/content/profile.ts';
import type { BeforeAfter, Copy, ImageRef, Video } from '../../../src/content/schema.ts';
import { site } from '../../../src/content/site.ts';
import { ui } from '../../../src/content/ui.ts';
import {
  MotionPreferenceProvider,
  useMotionPreference,
} from '../../../src/motion/MotionPreference.tsx';
import { initMotion } from '../../../src/motion/preference.ts';

const text = (copy: OrPending<Copy>) => (isPending(copy) ? PENDING_LABEL : copy.text);

/** A generated SVG test image (fictional), as a data URI: no file, no network request. */
function testImage(w: number, h: number, label: string, fg: string, bg: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<rect x="8%" y="12%" width="40%" height="30%" fill="none" stroke="${fg}" stroke-width="6"/>` +
    `<rect x="8%" y="52%" width="84%" height="8%" fill="${fg}" opacity="0.5"/>` +
    `<rect x="8%" y="66%" width="60%" height="8%" fill="${fg}" opacity="0.3"/>` +
    `<text x="92%" y="22%" text-anchor="end" font-family="sans-serif" font-size="${Math.round(h / 12)}" fill="${fg}">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const picture = (src: string, w: number, h: number, alt: string): ImageRef => ({
  kind: 'image',
  alt,
  asset: { sources: {}, img: { src, w, h } },
});

const WIRE = testImage(1750, 1000, 'TEST WIREFRAME', '#8a8a8a', '#1b1b1b');
const FINAL = testImage(1750, 1000, 'TEST FINAL', '#00d5e8', '#0b1416');
const SQUARE = testImage(1000, 1000, 'TEST SQUARE', '#00d5e8', '#0b1416');
const POSTER = {
  src: testImage(1600, 900, 'TEST POSTER', '#8a8a8a', '#141414'),
  width: 1600,
  height: 900,
};

const breakdownPair: BeforeAfter = {
  kind: 'beforeAfter',
  before: picture(WIRE, 1750, 1000, 'Test wireframe'),
  after: picture(FINAL, 1750, 1000, 'Test final design'),
};
// Different aspect ratios: the square final design is letterboxed, never stretched (FR-BD4).
const popupPair: BeforeAfter = {
  kind: 'beforeAfter',
  before: picture(WIRE, 1750, 1000, 'Test wireframe, pop-up'),
  after: picture(SQUARE, 1000, 1000, 'Test square final design, pop-up'),
};

const videos: Record<'local' | 'youtube' | 'vimeo', Video> = {
  local: {
    kind: 'video',
    title: 'Test local clip',
    poster: POSTER,
    source: { type: 'local', src: '/__harness/test-clip.mp4' },
    hasSpeech: true,
    captionsFile: { src: '/__harness/test-clip.en.vtt', lang: 'en' },
  },
  youtube: {
    kind: 'video',
    title: 'Test YouTube video',
    poster: POSTER,
    source: { type: 'youtube', url: 'https://www.youtube.com/watch?v=abcdefghijk' },
    hasSpeech: false,
  },
  vimeo: {
    kind: 'video',
    title: 'Test Vimeo video',
    poster: POSTER,
    source: { type: 'vimeo', url: 'https://vimeo.com/123456789' },
    hasSpeech: false,
  },
};

const videoLabels = {
  play: text(ui.states.playVideo),
  loading: text(ui.states.loading),
  error: text(ui.states.videoError),
  tryAgain: text(ui.states.tryAgain),
  openOriginal: text(ui.states.openOriginal),
  restrictedNote: text(ui.states.restrictedNote),
};
const fallback = { mark: site.favicon.monogram, label: text(ui.states.imageUnavailable) };

const ICONS: IconName[] = [
  'arrow-down',
  'arrow-right',
  'arrow-up-right',
  'chevron-left',
  'chevron-right',
  'alert',
  'download',
  'image-off',
  'link',
  'mail',
  'map-pin',
  'minus',
  'pause',
  'phone',
  'play',
  'plus',
  'search',
  'close',
];

const block = { padding: '48px 16px', borderTop: '1px solid var(--line)' } as const;
const row = { display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' } as const;

function Group({ id, children }: { readonly id: string; readonly children: ReactNode }) {
  return (
    <section data-testid={id} aria-label={`Test group: ${id}`} style={block}>
      {children}
    </section>
  );
}

function Harness() {
  const { motionOn, toggleOwnerPreference } = useMotionPreference();
  const [activated, setActivated] = useState('none');
  return (
    <>
      <header style={{ ...row, padding: '8px 16px' }}>
        <span data-testid="motion-state">{motionOn ? 'on' : 'off'}</span>
        <button type="button" data-testid="motion-toggle" onClick={toggleOwnerPreference}>
          Toggle motion (test)
        </button>
      </header>
      <main>
        <Group id="typography">
          <DisplayHeading lines={[profile.heroName]} level={1} size="hero-name" />
          <Eyebrow>{text(ui.impact.eyebrow)}</Eyebrow>
          <Eyebrow tone="accent">{text(ui.breakdown.eyebrow)}</Eyebrow>
          <DisplayHeading
            lines={[text(ui.impact.headlineLine1), text(ui.impact.headlineLine2)]}
            level={2}
            size="display-impact"
          />
          <DisplayHeading
            lines={[text(ui.breakdown.headlineLine1), text(ui.breakdown.headlineLine2)]}
            level={2}
            size="display-breakdown"
            accent="last-line"
          />
          <SectionHeading
            eyebrow={text(ui.about.eyebrow)}
            title="TEST SECTION."
            action={<TextLink href="#actions">TEST LINK</TextLink>}
          />
          <SectionHeading eyebrow="TEST" title="TEST JOURNEY TITLE" level={3} variant="journey" />
        </Group>

        <Group id="actions">
          <div style={row}>
            <PrimaryButton href="#actions" data-testid="primary">
              {text(ui.hero.seeMyWork)}
            </PrimaryButton>
            <PrimaryButton variant="solid" onClick={() => setActivated('solid')}>
              TEST SOLID
            </PrimaryButton>
            <OutlineButton href="#actions" icon="download" data-testid="outline">
              {text(ui.hero.downloadCv)}
            </OutlineButton>
            <OutlineButton onClick={() => setActivated('outline')} block>
              {text(ui.impact.showMore)}
            </OutlineButton>
            <TextLink href="#actions">TEST TEXT LINK</TextLink>
            <TextLink
              href="https://example.com/"
              external
              icon="arrow-up-right"
              data-testid="external"
            >
              TEST EXTERNAL
            </TextLink>
          </div>
          <div style={{ ...row, marginTop: 32 }}>
            <IconButton
              icon="chevron-left"
              label="Test previous"
              onClick={() => setActivated('prev')}
            />
            <IconButton
              icon="close"
              label="Test close"
              borderless
              onClick={() => setActivated('close')}
            />
            <IconButton
              icon={SOCIAL_ICON}
              label="Test social link"
              href="https://example.com/"
              external
            />
            <PlayCircle label="Test play" onClick={() => setActivated('play')} />
            <RoundArrowCta href="#actions" data-testid="magnetic-cta">
              TEST CTA
            </RoundArrowCta>
          </div>
          <p data-testid="activated">{activated}</p>
        </Group>

        <Group id="icons">
          <div style={row}>
            {ICONS.map((name) => (
              <Icon key={name} name={name} />
            ))}
            <Icon name="mail" label="Test labelled icon" />
            <span style={{ color: 'var(--accent)' }}>
              <Asterisk />
            </span>
            <QuoteMark />
            <Laurel />
            <Laurel side="right" />
            <HandleChevrons />
          </div>
        </Group>

        <Group id="media">
          <div
            style={{
              display: 'grid',
              gap: 24,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <MediaImage
              image={picture(FINAL, 1750, 1000, 'Test image, natural')}
              fallback={fallback}
            />
            <div style={{ position: 'relative', aspectRatio: '4 / 3' }} data-testid="cover-box">
              <MediaImage
                image={picture(SQUARE, 1000, 1000, 'Test image, cover')}
                fallback={fallback}
                fit="cover"
              />
            </div>
            <div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
              <MediaImage
                image={picture(SQUARE, 1000, 1000, 'Test image, contain')}
                fallback={fallback}
                fit="contain"
              />
            </div>
            <div data-testid="broken-image">
              <MediaImage
                image={picture('data:image/png;base64,AAAA', 800, 500, 'Test broken image')}
                fallback={fallback}
              />
            </div>
            <div style={{ position: 'relative', aspectRatio: '16 / 10' }}>
              <ImageFallback mark={fallback.mark} label={fallback.label} />
            </div>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                aspectRatio: '16 / 10',
                background: 'var(--surface-sunken)',
              }}
            >
              <LoadingRing label={text(ui.states.loading)} />
            </div>
          </div>
        </Group>

        <Group id="video">
          <div
            style={{
              display: 'grid',
              gap: 32,
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <div data-testid="video-local">
              <VideoPlayer video={videos.local} labels={videoLabels} />
            </div>
            <div data-testid="video-youtube">
              <VideoPlayer video={videos.youtube} labels={videoLabels} />
            </div>
            <div data-testid="video-vimeo">
              <VideoPlayer video={videos.vimeo} labels={videoLabels} />
            </div>
          </div>
        </Group>

        <Group id="milestones">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <MilestoneRow
              index={1}
              title="Test milestone one"
              context="Test context"
              value="2024"
            />
            <MilestoneRow index={2} title="Test outcome" value="TEST" />
            <MilestoneRow index={3} title="Test milestone without value" />
          </ul>
          <ul style={{ listStyle: 'none', margin: '32px 0 0', padding: 0, maxWidth: 520 }}>
            <li>
              <MilestoneItem
                index={1}
                title="Test item one"
                year="2025"
                onActivate={() => setActivated('item-1')}
              />
            </li>
            <li>
              <MilestoneItem
                index={2}
                title="Test item two"
                year="2023"
                onActivate={() => setActivated('item-2')}
              />
            </li>
          </ul>
        </Group>

        <Group id="comparison-static">
          <ComparisonSlider
            pair={popupPair}
            mode="static"
            ratio="popup"
            label={`${text(ui.breakdown.sliderLabel)} (static test)`}
            fallback={fallback}
          />
        </Group>

        <div style={{ height: '60vh' }} />
        <Group id="comparison-scroll">
          <ComparisonSlider
            pair={breakdownPair}
            mode="scroll"
            label={text(ui.breakdown.sliderLabel)}
            beforeLabel={text(ui.breakdown.labelBefore)}
            afterLabel={text(ui.breakdown.labelAfter)}
            fallback={fallback}
          />
        </Group>
        <div style={{ height: '120vh' }} />
      </main>
    </>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
initMotion();
createRoot(root).render(
  <StrictMode>
    <MotionPreferenceProvider>
      <Harness />
    </MotionPreferenceProvider>
  </StrictMode>,
);
