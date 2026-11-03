// ImageFallback (DESIGN §7.5; PRD §13): shown when an image fails — the "D." mark above
// "Preview unavailable". Both strings come from content (site.favicon.monogram, ui.states).

import styles from './ImageFallback.module.css';

export interface ImageFallbackProps {
  /** The Devansh mark, from content (site.favicon.monogram: "D."). */
  readonly mark: string;
  /** "Preview unavailable" (ui.states.imageUnavailable). */
  readonly label: string;
  readonly className?: string;
}

export function ImageFallback({ mark, label, className }: ImageFallbackProps) {
  return (
    <div
      className={[styles.fallback, className].filter(Boolean).join(' ')}
      role="img"
      aria-label={label}
    >
      <span className={styles.mark} aria-hidden="true">
        {mark}
      </span>
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
    </div>
  );
}
