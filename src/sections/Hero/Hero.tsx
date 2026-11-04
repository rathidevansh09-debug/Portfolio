// Hero `#home` (PRD FR-HE1–HE8, §13 first load; DESIGN §8.1, §9.2, §10; ARCHITECTURE §6.2).
// Layers, back to front (DESIGN §6.4): giant word → portrait → text → top strip → bottom strip.
//
// Motion (values from motion/tokens.ts):
//   M-01   word revealed top → bottom by a clip (1.4 s, signature) [OBSERVED direction]
//   M-02a  portrait fades in (1.2 s, 0.2 s delay, provisional ease-out [TO VERIFY])
//   M-02b  intro (HeroIntro) · M-02c side column (HeroSide)
//   gate   all entrances wait for fonts + portrait, capped (useHeroStartGate)
//   M-04   scroll-out depth: word +180 px; portrait +85 px and 1.08× from bottom centre; intro −55 px
//   M-18   static availability dot (no pulse)
// Entrance and depth live on separate elements so their transforms never collide.
// Motion off (MO-5): everything renders in its final position; no depth.
//
// "Play showreel" is visual only until the pop-up exists (owner decision, Phase 9); Phase 11
// connects it using lib/showreel.ts (A-7).

import { motion } from 'motion/react';
import { useRef } from 'react';
import { PlayCircleGlyph } from '../../components/actions/PlayCircle/PlayCircle.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import { MediaImage } from '../../components/media/MediaImage/MediaImage.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { isPending } from '../../content/pending.ts';
import type { ProfileContent } from '../../content/schema.ts';
import { fillTemplate } from '../../lib/format.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { useScrollLinked } from '../../motion/hooks/useScrollLinked.ts';
import { ease, hero } from '../../motion/tokens.ts';
import { HeroIntro } from './HeroIntro.tsx';
import { HeroSide } from './HeroSide.tsx';
import { useHeroStartGate } from './useHeroStartGate.ts';
import styles from './Hero.module.css';

export interface HeroLabels {
  readonly supportingLine: string;
  readonly hello: string;
  readonly availability: string;
  readonly manifestoLines: readonly string[];
  readonly seeMyWork: string;
  readonly downloadCv: string;
  readonly playShowreel: string;
  readonly showreelSecondary: string;
  readonly scrollToDiscover: string;
  /** "SELECTED WORK / {start}–2026" (draft). */
  readonly editionTemplate: string;
  readonly imageFallback: { readonly mark: string; readonly label: string };
}

export interface HeroProps {
  readonly id: string;
  readonly profile: ProfileContent;
  readonly labels: HeroLabels;
  /** Selected Work anchor for "See my work". */
  readonly workHref: string;
}

/** The hero's scroll-out: progress 0 at the top of the page, 1 when the hero has left. */
const SCROLL_OUT = ['start start', 'end start'] as const;

export function Hero({ id, profile, labels, workHref }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { motionOn } = useMotionPreference();
  const portrait = profile.portrait;
  const started = useHeroStartGate(ref, !isPending(portrait), motionOn);
  const enter = (to: Record<string, number | string>) => (started ? to : undefined);

  const offset = [...SCROLL_OUT];
  const wordY = useScrollLinked(ref, { offset, output: [0, hero.depth.wordY], offValue: 0 });
  const portraitY = useScrollLinked(ref, {
    offset,
    output: [0, hero.depth.portraitY],
    offValue: 0,
  });
  const portraitScale = useScrollLinked(ref, {
    offset,
    output: [1, hero.depth.portraitScale],
    offValue: 1,
  });
  const introY = useScrollLinked(ref, { offset, output: [0, hero.depth.introY], offValue: 0 });

  const { availability, editionStartYear } = profile;

  return (
    <section id={id} ref={ref} className={styles.hero} data-started={started ? '' : undefined}>
      <div className={styles.top}>
        <p className={styles.topRole}>
          <span className={styles.topStrong}>{profile.topStripRole}</span>
          <span>{labels.supportingLine}</span>
        </p>
        {isPending(availability.shown) ? (
          <PendingMarker note={availability.shown.note} />
        ) : availability.shown ? (
          <p className={styles.availability}>
            <span className={styles.dot} aria-hidden="true" />
            {labels.availability}
          </p>
        ) : null}
      </div>

      <motion.div
        className={styles.wordDepth}
        style={{ y: wordY }}
        aria-hidden="true"
        data-hero-part="word-depth"
      >
        <motion.span
          className={styles.word}
          data-hero-part="word"
          initial={motionOn ? { clipPath: 'inset(0% 0% 100% 0%)' } : false}
          animate={enter({ clipPath: 'inset(0% 0% 0% 0%)' })}
          transition={{ duration: hero.word.duration, ease: [...ease.signature] }}
        >
          {profile.heroWord}
        </motion.span>
      </motion.div>

      <motion.div
        className={styles.portrait}
        style={{ y: portraitY, scale: portraitScale }}
        data-hero-portrait=""
      >
        <motion.div
          className={styles.portraitFade}
          data-hero-part="portrait"
          initial={motionOn ? { opacity: 0 } : false}
          animate={enter({ opacity: 1 })}
          transition={{
            duration: hero.portrait.duration,
            delay: hero.portrait.delay,
            ease: hero.portrait.ease,
          }}
        >
          {isPending(portrait) ? (
            <PendingMarker note={portrait.note} variant="fill" />
          ) : (
            <MediaImage
              image={portrait}
              fallback={labels.imageFallback}
              fit="contain"
              priority
              className={styles.portraitMedia}
            />
          )}
        </motion.div>
      </motion.div>

      <HeroIntro
        hello={labels.hello}
        name={profile.heroName}
        roleLines={profile.roleLines}
        description={profile.intro}
        location={profile.location}
        workLabel={labels.seeMyWork}
        workHref={workHref}
        started={started}
        motionOn={motionOn}
        depthY={introY}
      />

      <HeroSide
        manifestoLines={labels.manifestoLines}
        stats={profile.stats}
        cv={profile.cv}
        cvLabel={labels.downloadCv}
        started={started}
        motionOn={motionOn}
      />

      <div className={styles.bottom}>
        {/* Visual only until Phase 11 connects the pop-up (owner decision). */}
        <p className={styles.reel}>
          <PlayCircleGlyph className={styles.reelCircle} />
          <span>{labels.playShowreel}</span>
          <span className={styles.reelSecondary}>{labels.showreelSecondary}</span>
        </p>
        <p className={styles.scroll}>
          {labels.scrollToDiscover}
          <Icon name="arrow-down" className={styles.scrollArrow} />
        </p>
        {isPending(editionStartYear) ? (
          <PendingMarker note={editionStartYear.note} className={styles.edition} />
        ) : (
          <p className={styles.edition}>
            {fillTemplate(labels.editionTemplate, { start: editionStartYear })}
          </p>
        )}
      </div>
    </section>
  );
}
