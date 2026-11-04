// Hero intro block (PRD FR-HE4, FR-HE5; DESIGN §8.1): "Hello, I'm" → DEVANSH. (the page's only
// H1) → role (two lines) → description → "See my work →" → location. Entrance M-02b (fades in and
// slides 35 px from the left, 0.9 s, 0.35 s delay) on the inner block; the outer wrapper carries
// the M-04 depth (intro moves up 55 px as the hero scrolls out), so the transforms never collide.

import { motion, type MotionValue } from 'motion/react';
import { PrimaryButton } from '../../components/actions/PrimaryButton/PrimaryButton.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { DisplayHeading } from '../../components/typography/DisplayHeading/DisplayHeading.tsx';
import { isPending, type OrPending } from '../../content/pending.ts';
import { ease, hero } from '../../motion/tokens.ts';
import styles from './HeroIntro.module.css';

export interface HeroIntroProps {
  readonly hello: string;
  readonly name: string;
  readonly roleLines: readonly [string, string];
  readonly description: OrPending<string>;
  readonly location: OrPending<string>;
  /** "See my work" — arrow → (PRD FR-HE4; owner decision I-5). */
  readonly workLabel: string;
  readonly workHref: string;
  readonly started: boolean;
  readonly motionOn: boolean;
  readonly depthY: MotionValue<number>;
}

export function HeroIntro({
  hello,
  name,
  roleLines,
  description,
  location,
  workLabel,
  workHref,
  started,
  motionOn,
  depthY,
}: HeroIntroProps) {
  return (
    <motion.div className={styles.depth} style={{ y: depthY }} data-hero-part="intro-depth">
      <motion.div
        className={styles.intro}
        data-hero-part="intro"
        initial={motionOn ? { opacity: 0, x: hero.intro.x } : false}
        animate={started ? { opacity: 1, x: 0 } : undefined}
        transition={{
          duration: hero.intro.duration,
          delay: hero.intro.delay,
          ease: [...ease.signature],
        }}
      >
        <p className={styles.hello}>{hello}</p>
        <DisplayHeading lines={[name]} level={1} size="hero-name" className={styles.name} />
        <p className={styles.role}>
          <span>{roleLines[0]}</span> <span>{roleLines[1]}</span>
        </p>
        {isPending(description) ? (
          <PendingMarker note={description.note} className={styles.description} />
        ) : (
          <p className={styles.description}>{description}</p>
        )}
        <div className={styles.action}>
          <PrimaryButton href={workHref} icon="arrow-right">
            {workLabel}
          </PrimaryButton>
        </div>
        {isPending(location) ? (
          <PendingMarker note={location.note} className={styles.locationSlot} />
        ) : (
          <p className={styles.location}>
            <Icon name="map-pin" className={styles.pin} />
            {location}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
