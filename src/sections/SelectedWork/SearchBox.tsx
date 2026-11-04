// Search box (PRD FR-W3; DESIGN §7.4): magnifier + visible "Search" label + borderless input. The
// visible label names the input (no placeholder, owner decision). 16 px on phones (iPhone zoom
// rule, DESIGN §5.2).

import type { RefObject } from 'react';
import { Icon } from '../../components/icons/Icon.tsx';
import styles from './SearchBox.module.css';

export interface SearchBoxProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchBox({ label, value, onChange, inputRef }: SearchBoxProps) {
  return (
    <label className={styles.search}>
      <Icon name="search" className={styles.icon} />
      <span className={styles.label}>{label}</span>
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}
