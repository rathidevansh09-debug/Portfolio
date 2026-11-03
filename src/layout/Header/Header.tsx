// Sticky header (PRD FR-H1–H6, M-16; DESIGN §7.3, §10; ARCHITECTURE §3.1, §3.2).
// Wordmark (links to the Hero) · desktop nav with the active-section dot · Motion toggle ·
// "Let's talk →" (hidden ≤ 800 px) · mobile menu button (≤ 600 px).
// Wording and anchors arrive as props (components never contain content).

import { useEffect, useState } from 'react';
import { Icon } from '../../components/icons/Icon.tsx';
import { watchActiveSection } from '../../lib/activeSection.ts';
import { MobileMenu } from './MobileMenu.tsx';
import { MotionToggle, type MotionToggleLabels } from './MotionToggle.tsx';
import styles from './Header.module.css';

export interface NavItem {
  /** Section anchor id. */
  readonly id: string;
  readonly label: string;
}

export interface HeaderProps {
  /** `DEVANSH`, no ® (FR-H1, FR-G7). */
  readonly wordmark: string;
  /** The Hero: linked by the wordmark, listed first in the mobile menu, clears the active link. */
  readonly home: NavItem;
  /** Desktop nav, in page order (FR-H2). */
  readonly items: readonly NavItem[];
  /** "Let's talk" target and label (FR-H5). */
  readonly talk: NavItem;
  readonly motionLabels: MotionToggleLabels;
  readonly menuLabels: { readonly open: string; readonly close: string };
}

export function Header({ wordmark, home, items, talk, motionLabels, menuLabels }: HeaderProps) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(
    () =>
      watchActiveSection([home.id, ...items.map((item) => item.id)], new Set([home.id]), setActive),
    [home.id, items],
  );

  return (
    <header className={styles.header}>
      <a className={styles.wordmark} href={`#${home.id}`}>
        {wordmark}
      </a>
      <nav className={styles.nav}>
        {items.map((item) => (
          <a
            key={item.id}
            className={styles.link}
            href={`#${item.id}`}
            aria-current={active === item.id ? 'location' : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className={styles.actions}>
        <MotionToggle labels={motionLabels} />
        <a className={styles.talk} href={`#${talk.id}`}>
          {talk.label}
          {/* PRD FR-H5 "Let's talk →" (owner decision 3: PRD precedence over DESIGN's ↗). */}
          <Icon name="arrow-right" className={styles.talkArrow} />
        </a>
        <MobileMenu items={[home, ...items]} labels={menuLabels} />
      </div>
    </header>
  );
}
