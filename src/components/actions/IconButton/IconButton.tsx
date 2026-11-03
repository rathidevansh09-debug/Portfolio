// IconButton (DESIGN §7.2): 44 × 44 px square, one icon, required accessible name. Bordered by
// default; borderless in the Brands strip and the pop-up.

import { Icon, type IconName } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './IconButton.module.css';

// Distributive, so both the link and the button branch of ActionProps keep their own props.
type WithoutContent<T> = T extends unknown ? Omit<T, 'children' | 'aria-label'> : never;

export type IconButtonProps = WithoutContent<ActionProps> & {
  readonly icon: IconName;
  /** Accessible name (from content/ui.ts). Required: the button has no visible text. */
  readonly label: string;
  readonly borderless?: boolean;
};

export function IconButton({ icon, label, borderless = false, ...props }: IconButtonProps) {
  return (
    <ActionBase
      {...(props as ActionProps)}
      aria-label={label}
      className={[styles.button, borderless ? styles.borderless : '', props.className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name={icon} />
    </ActionBase>
  );
}
