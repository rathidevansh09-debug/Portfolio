// OutlineButton (DESIGN §7.2): 1 px border, label + optional icon (e.g. "Show more work ↓",
// "Visit live site ↗", "Try again").

import { Icon, type IconName } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './OutlineButton.module.css';

export type OutlineButtonProps = ActionProps & {
  readonly icon?: IconName;
  /** Full width (e.g. "Show more" and pop-up buttons on phones). */
  readonly block?: boolean;
};

export function OutlineButton({ icon, block = false, ...props }: OutlineButtonProps) {
  return (
    <ActionBase
      {...props}
      className={[styles.button, block ? styles.block : '', props.className]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{props.children}</span>
      {icon ? <Icon name={icon} /> : null}
    </ActionBase>
  );
}
