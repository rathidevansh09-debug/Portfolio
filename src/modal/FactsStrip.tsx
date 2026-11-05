// Facts strip (PRD FR-M3, D-20, D-21, D-22; DESIGN §8.10): label/value pairs for the six fixed
// fields in their fixed order. Only present, verified facts are shown (selectors.verifiedFacts),
// so the grid closes up; with none, the strip is not rendered. My Role appears only here.

import type { Fact, Facts } from '../content/schema.ts';
import styles from './FactsStrip.module.css';

export type FactLabels = Readonly<Record<keyof Facts, string>>;

export function FactsStrip({
  facts,
  labels,
}: {
  readonly facts: readonly { readonly key: keyof Facts; readonly fact: Fact }[];
  readonly labels: FactLabels;
}) {
  if (facts.length === 0) return null;
  return (
    <dl className={styles.strip}>
      {facts.map(({ key, fact }) => (
        <div key={key} className={styles.fact}>
          <dt className={styles.label}>{labels[key]}</dt>
          <dd className={styles.value}>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
