// PrimaryButton (DESIGN §7.2; PRD D-06): text + arrow icon spaced apart, accent fill with dark
// text. `variant="solid"` is the form send button (gap 25 px, full width on phones).

import { Icon, type IconName } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './PrimaryButton.module.css';

export type PrimaryButtonProps = ActionProps & {
  readonly variant?: 'primary' | 'solid';
  /** Trailing icon; defaults to an arrow. */
  readonly icon?: IconName;
};

export function PrimaryButton({
  variant = 'primary',
  icon = 'arrow-right',
  ...props
}: PrimaryButtonProps) {
  return (
    <ActionBase
      {...props}
      className={[styles.button, variant === 'solid' ? styles.solid : '', props.className]
        .filter(Boolean)
        .join(' ')}
    >
      <span>{props.children}</span>
      <Icon name={icon} />
    </ActionBase>
  );
}
