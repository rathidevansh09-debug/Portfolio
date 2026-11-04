// Empty state (PRD FR-W7, §13; DESIGN §7.5): "No work found for '…'." + "Reset search".

import { TextLink } from '../../components/actions/TextLink/TextLink.tsx';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /** Already filled with the visitor's query. */
  readonly message: string;
  readonly resetLabel: string;
  readonly onReset: () => void;
}

export function EmptyState({ message, resetLabel, onReset }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.message}>{message}</p>
      <TextLink onClick={onReset}>{resetLabel}</TextLink>
    </div>
  );
}
