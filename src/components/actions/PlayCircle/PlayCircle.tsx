// PlayCircle (DESIGN §7.2): 32 px circle, 1 px accent ring, play glyph; on hover fills accent and
// the glyph turns dark (0.3 s). Its own button when `label` is given; otherwise a decorative part
// of a larger button (e.g. "▶ PLAY SHOWREEL").

import { Icon } from '../../icons/Icon.tsx';
import { ActionBase, type ActionButtonProps } from '../ActionBase.tsx';
import styles from './PlayCircle.module.css';

export function PlayCircleGlyph({ className }: { readonly className?: string }) {
  return (
    <span className={[styles.circle, className].filter(Boolean).join(' ')} aria-hidden="true">
      <Icon name="play" />
    </span>
  );
}

export type PlayCircleProps = Omit<ActionButtonProps, 'children' | 'aria-label'> & {
  /** Accessible name, e.g. the PENDING ui.states.playVideo wording. */
  readonly label: string;
};

export function PlayCircle({ label, ...props }: PlayCircleProps) {
  return (
    <ActionBase
      {...props}
      aria-label={label}
      className={[styles.button, props.className].filter(Boolean).join(' ')}
    >
      <PlayCircleGlyph />
    </ActionBase>
  );
}
