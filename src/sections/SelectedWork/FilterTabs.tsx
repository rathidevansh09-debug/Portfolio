// Filter tabs (PRD FR-W2, D-03; DESIGN §7.4, §8.2; M-10). "All" plus only the filters that at
// least one published project carries. Toggle buttons in a labelled group; the pressed state is
// announced. The selected tab is `ink` with a 2 px accent underline that slides to it (Motion
// shared-layout animation, ≈ 0.35 s [APPROX]); with motion off it is a plain element that jumps.
// The row scrolls sideways without a visible scrollbar when it overflows.

import { motion } from 'motion/react';
import { useId } from 'react';
import type { Filter } from '../../content/schema.ts';
import type { FilterChoice } from '../../lib/filtering.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { ease, filterUnderline } from '../../motion/tokens.ts';
import styles from './FilterTabs.module.css';

export interface FilterTabsProps {
  readonly filters: readonly Filter[];
  readonly allLabel: string;
  readonly groupLabel: string;
  readonly selected: FilterChoice;
  readonly onSelect: (choice: FilterChoice) => void;
}

export function FilterTabs({ filters, allLabel, groupLabel, selected, onSelect }: FilterTabsProps) {
  const underlineId = useId();
  const { motionOn } = useMotionPreference();
  const tabs: { key: FilterChoice; label: string }[] = [
    { key: 'all', label: allLabel },
    ...filters.map((f) => ({ key: f.key, label: f.label })),
  ];
  return (
    <div className={styles.tabs} role="group" aria-label={groupLabel}>
      {tabs.map((tab) => {
        const pressed = tab.key === selected;
        return (
          <button
            key={tab.key}
            type="button"
            className={styles.tab}
            aria-pressed={pressed}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
            {pressed && motionOn ? (
              <motion.span
                layoutId={underlineId}
                className={styles.underline}
                aria-hidden="true"
                transition={{ duration: filterUnderline.duration, ease: [...ease.signature] }}
              />
            ) : pressed ? (
              // Motion off (MO-5): the underline jumps. A plain element, because a skipped
              // shared-layout animation could leave it at the previous tab's position (Firefox).
              <span className={styles.underline} aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
