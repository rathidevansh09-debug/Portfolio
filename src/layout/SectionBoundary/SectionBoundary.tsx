// Section error containment (ARCHITECTURE §11.2): if one section fails while rendering, only that
// section is replaced by a quiet message; the rest of the page keeps working. The fallback keeps
// the section's anchor so navigation still lands. React reports the caught error in the console,
// so nothing is swallowed during development; visitors never see technical details.

import { Component, type ReactNode } from 'react';
import styles from './SectionBoundary.module.css';

export interface SectionBoundaryProps {
  readonly children: ReactNode;
  /** The section's anchor id, kept on the fallback. */
  readonly id?: string;
  /** Quiet message (ui.states.sectionUnavailable). */
  readonly fallback: string;
}

interface SectionBoundaryState {
  readonly failed: boolean;
}

export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  override state: SectionBoundaryState = { failed: false };

  static getDerivedStateFromError(): SectionBoundaryState {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section id={this.props.id} className={styles.fallback}>
        <p className={styles.message}>{this.props.fallback}</p>
      </section>
    );
  }
}
