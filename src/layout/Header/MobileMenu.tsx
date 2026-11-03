// Mobile menu (PRD FR-H6, M-17; DESIGN §7.3; ARCHITECTURE §3.2, §10), phones ≤ 600 px only.
// A disclosure: the menu button announces open/closed (aria-expanded) and controls a drop-down
// list of Home + the five sections. Not modal (no focus trap, page still scrolls), like the
// reference. Closes on a link tap, the button, or Escape (focus then returns to the button).
// M-17: fades in and drops 12 px from above; reverses on close; instant when motion is off.

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState } from 'react';
import { IconButton } from '../../components/actions/IconButton/IconButton.tsx';
import { Icon } from '../../components/icons/Icon.tsx';
import { twoDigit } from '../../lib/format.ts';
import { useMotionPreference } from '../../motion/MotionPreference.tsx';
import { useMediaQuery } from '../../motion/hooks/useMediaQuery.ts';
import { mobileMenu } from '../../motion/tokens.ts';
import type { NavItem } from './Header.tsx';
import styles from './MobileMenu.module.css';

/** DESIGN §10 XS breakpoint: the desktop nav becomes this menu. */
const PHONE_QUERY = '(max-width: 600px)';

export interface MobileMenuProps {
  /** Home first, then the five sections (FR-H6). */
  readonly items: readonly NavItem[];
  readonly labels: { readonly open: string; readonly close: string };
}

export function MobileMenu({ items, labels }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const { motionOn } = useMotionPreference();
  const phone = useMediaQuery(PHONE_QUERY);
  // Above 600 px the menu does not exist, so it is reported closed (keeps aria-expanded truthful).
  const shown = open && phone;
  const menuId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const buttonWrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!shown) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const button = buttonWrapRef.current?.querySelector('button');
      const focusInMenu =
        panelRef.current?.contains(document.activeElement) || document.activeElement === button;
      setOpen(false);
      if (focusInMenu) button?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shown]);

  return (
    <>
      <span ref={buttonWrapRef} className={styles.toggleWrap}>
        <IconButton
          icon={shown ? 'close' : 'menu'}
          iconSize={24}
          label={shown ? labels.close : labels.open}
          borderless
          aria-expanded={shown}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
        />
      </span>
      <AnimatePresence>
        {shown ? (
          <motion.nav
            ref={panelRef}
            id={menuId}
            className={styles.panel}
            // Motion off (MO-5): render the final state from the first frame.
            initial={motionOn ? { opacity: 0, y: mobileMenu.y } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: mobileMenu.y }}
            transition={{ duration: mobileMenu.duration }}
          >
            {items.map((item, i) => (
              <a
                key={item.id}
                className={styles.row}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
              >
                <span className={styles.index}>{twoDigit(i + 1)}</span>
                {item.label}
                <Icon name="arrow-up-right" size={18} className={styles.arrow} />
              </a>
            ))}
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </>
  );
}
