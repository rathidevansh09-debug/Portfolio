// TextLink (DESIGN §7.2): label + arrow spaced apart; on hover the label turns accent and the
// arrow slides 5 px right (0.3 s, M-07b).

import { Icon, type IconName } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './TextLink.module.css';

export type TextLinkProps = ActionProps & {
  /** Trailing icon; `null` for a text-only link (e.g. the "SELECTED WORK" toggle, DESIGN §8.2). */
  readonly icon?: IconName | null;
};

export function TextLink({ icon = 'arrow-right', ...props }: TextLinkProps) {
  return (
    <ActionBase {...props} className={[styles.link, props.className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{props.children}</span>
      {icon === null ? null : (
        <span className={styles.arrow}>
          <Icon name={icon} />
        </span>
      )}
    </ActionBase>
  );
}
