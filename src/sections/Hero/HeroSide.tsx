// Hero side column (PRD FR-HE6; DESIGN §8.1): ✳ manifesto → 0–3 VERIFIED stats → "Download CV".
// Stats rule: 3, 2 or 1 verified stats stack from the top and the CV link always follows; with 0
// the column shows the manifesto and the CV link only. No figure is ever invented (FR-HE6).
// Entrance M-02c: fades in and slides 30 px from the right, 1.0 s, 0.55 s delay.

import { motion } from 'motion/react';
import { ActionBase } from '../../components/actions/ActionBase.tsx';
import { Asterisk } from '../../components/icons/Asterisk.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { isPending, type OrPending } from '../../content/pending.ts';
import type { DocumentRef, Stat } from '../../content/schema.ts';
import { copyText } from '../../lib/copy.ts';
import { verifiedStats } from '../../lib/selectors.ts';
import { ease, hero } from '../../motion/tokens.ts';
import styles from './HeroSide.module.css';

export interface HeroSideProps {
  readonly manifestoLines: readonly string[];
  readonly stats: OrPending<readonly Stat[]>;
  readonly cv: OrPending<DocumentRef>;
  readonly cvLabel: string;
  readonly started: boolean;
  readonly motionOn: boolean;
}

export function HeroSide({ manifestoLines, stats, cv, cvLabel, started, motionOn }: HeroSideProps) {
  const shown = isPending(stats) ? [] : verifiedStats(stats);
  return (
    <motion.div
      className={styles.side}
      data-hero-part="side"
      initial={motionOn ? { opacity: 0, x: hero.side.x } : false}
      animate={started ? { opacity: 1, x: 0 } : undefined}
      transition={{
        duration: hero.side.duration,
        delay: hero.side.delay,
        ease: [...ease.signature],
      }}
    >
      <div className={styles.manifesto}>
        <span className={styles.ring} aria-hidden="true">
          <Asterisk />
        </span>
        <p>
          {manifestoLines.map((line) => (
            <span key={line} className={styles.line}>
              {line}
            </span>
          ))}
        </p>
      </div>
      <div className={styles.stats}>
        {isPending(stats) ? <PendingMarker note={stats.note} className={styles.pending} /> : null}
        {shown.map((stat) => (
          <div key={`${stat.value}-${stat.label}`} className={styles.stat}>
            <span className={styles.number}>
              {stat.value}
              {stat.suffix ? <span className={styles.suffix}>{stat.suffix}</span> : null}
            </span>
            {stat.link ? (
              <a className={styles.statLink} href={stat.link.href}>
                {stat.label}
                <span className={styles.srOnly}> — {copyText(stat.link.label)}</span>
                <Icon name="arrow-up-right" className={styles.accentIcon} />
              </a>
            ) : (
              <p className={styles.label}>{stat.label}</p>
            )}
          </div>
        ))}
        {isPending(cv) ? (
          <PendingMarker note={cv.note} className={styles.pending} />
        ) : (
          <ActionBase className={styles.cv} href={cv.href} download>
            <Icon name="download" className={styles.accentIcon} />
            <span className={styles.cvLabel}>{cvLabel}</span>
          </ActionBase>
        )}
      </div>
    </motion.div>
  );
}
