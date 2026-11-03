// TextLink (DESIGN §7.2): label + arrow spaced apart; on hover the label turns accent and the
// arrow slides 5 px right (0.3 s, M-07b).

import { Icon, type IconName } from '../../icons/Icon.tsx';
import { ActionBase, type ActionProps } from '../ActionBase.tsx';
import styles from './TextLink.module.css';

export type TextLinkProps = ActionProps & {
  readonly icon?: IconName;
};

export function TextLink({ icon = 'arrow-right', ...props }: TextLinkProps) {
  return (
    <ActionBase {...props} className={[styles.link, props.className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{props.children}</span>
      <span className={styles.arrow}>
        <Icon name={icon} />
      </span>
    </ActionBase>
  );
}
