// Selected Work `#portfolio` (PRD FR-W1–W9, FR-B1–B5, §13; DESIGN §8.2, §8.3; ARCHITECTURE §3.2,
// §4.6, A-8). State: view (Selected / All), filter, search text, number of results revealed.
//
// Owner decisions (Phase 10):
//   - [OBSERVED reference] choosing a filter or typing a search switches to All view; switching
//     back to Selected resets the filter to All and clears the search; "Reset search" clears the
//     search and resets the filter (focus moves to the search box).
//   - Only published projects (permission) and permitted client brands are shown; featured
//     projects without permission are simply missing (no substitute).
//   - Production with no published project: the heading row only — no toggle, toolbar, grid or
//     Brands block. Development shows PENDING projects for review.
//   - Each card is one control that opens the project pop-up (Phase 11; see ProjectCard).

import { useId, useRef, useState, type ReactNode } from 'react';
import { TextLink } from '../../components/actions/TextLink/TextLink.tsx';
import { PendingMarker } from '../../components/PendingMarker/PendingMarker.tsx';
import { SectionHeading } from '../../components/typography/SectionHeading/SectionHeading.tsx';
import { isPending, type OrPending } from '../../content/pending.ts';
import type { Brand, Filter, Project, ProjectIndex } from '../../content/schema.ts';
import {
  availableFilters,
  browse,
  PAGE_SIZE,
  revealMore,
  type FilterChoice,
  type WorkMode,
} from '../../lib/filtering.ts';
import { fillTemplate } from '../../lib/format.ts';
import { currentContentMode, publishedBrands, publishedProjects } from '../../lib/selectors.ts';
import { prefetchProjectModal } from '../../modal/loadProjectModal.ts';
import { useModal } from '../../modal/ModalProvider.tsx';
import { BrandsStrip, type BrandsStripLabels } from './BrandsStrip.tsx';
import { EmptyState } from './EmptyState.tsx';
import { FilterTabs } from './FilterTabs.tsx';
import { LoadMore } from './LoadMore.tsx';
import { ProjectGrid } from './ProjectGrid.tsx';
import type { TypeChipLabels } from './ProjectCard.tsx';
import { SearchBox } from './SearchBox.tsx';
import styles from './SelectedWork.module.css';

export interface SelectedWorkLabels {
  readonly eyebrow: string;
  readonly headline: string;
  readonly allWork: string;
  readonly selectedWork: string;
  readonly filterAll: string;
  readonly filtersLabel: string;
  readonly search: string;
  readonly showMore: string;
  /** "{shown} of {total} projects". */
  readonly count: string;
  /** "No work found for '{query}'." */
  readonly empty: string;
  readonly resetSearch: string;
  /** Screen-reader result count, e.g. "{count} projects shown" (A-8). */
  readonly announcement: string;
  readonly chips: TypeChipLabels;
  readonly imageFallback: { readonly mark: string; readonly label: string };
  readonly brands: BrandsStripLabels;
}

export interface SelectedWorkProps {
  readonly id: string;
  readonly projects: readonly Project[];
  readonly index: ProjectIndex;
  readonly filters: readonly Filter[];
  readonly brands: OrPending<readonly Brand[]>;
  readonly labels: SelectedWorkLabels;
}

export function SelectedWork({ id, projects, index, filters, brands, labels }: SelectedWorkProps) {
  const headingId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const { openModal } = useModal();
  const [view, setView] = useState<WorkMode>('selected');
  const [filter, setFilter] = useState<FilterChoice>('all');
  const [query, setQuery] = useState('');
  const [revealed, setRevealed] = useState(PAGE_SIZE);
  // Bumped on every visitor change so the live region re-announces even an unchanged count.
  const [announced, setAnnounced] = useState(0);

  const published = publishedProjects(projects, currentContentMode());
  const shownBrands = publishedBrands(brands);
  const heading = (action?: ReactNode) => (
    <SectionHeading
      id={headingId}
      eyebrow={labels.eyebrow}
      title={labels.headline}
      action={action}
    />
  );

  if (published.length === 0) {
    return (
      <section id={id} className={styles.section} aria-labelledby={headingId}>
        {heading()}
      </section>
    );
  }

  const result = browse({
    projects: published,
    index,
    filters,
    mode: view,
    filter,
    query,
    revealed,
  });
  const tabs = availableFilters(published, filters);

  const changed = () => {
    setRevealed(PAGE_SIZE);
    setAnnounced((n) => n + 1);
  };
  const toggleView = () => {
    if (view === 'selected') setView('all');
    else {
      setView('selected');
      setFilter('all');
      setQuery('');
    }
    changed();
  };
  const selectFilter = (choice: FilterChoice) => {
    setFilter(choice);
    setView('all');
    changed();
  };
  const search = (value: string) => {
    setQuery(value);
    if (value.trim() !== '') setView('all');
    changed();
  };
  const resetSearch = () => {
    setQuery('');
    setFilter('all');
    changed();
    searchRef.current?.focus();
  };

  return (
    <section id={id} className={styles.section} aria-labelledby={headingId}>
      {heading(
        // DESIGN §8.2: "ALL WORK →" in Selected view; "SELECTED WORK" (no arrow) in All view.
        <TextLink onClick={toggleView} icon={view === 'selected' ? 'arrow-right' : null}>
          {view === 'selected' ? labels.allWork : labels.selectedWork}
        </TextLink>,
      )}

      <div className={styles.toolbar}>
        <FilterTabs
          filters={tabs}
          allLabel={labels.filterAll}
          groupLabel={labels.filtersLabel}
          selected={filter}
          onSelect={selectFilter}
        />
        <SearchBox label={labels.search} value={query} onChange={search} inputRef={searchRef} />
      </div>

      {result.items.length > 0 ? (
        <ProjectGrid
          items={result.items}
          chipLabels={labels.chips}
          fallback={labels.imageFallback}
          onOpen={(project, opener) => {
            // The pop-up's code is usually prefetched already (idle, hover, focus, press).
            void prefetchProjectModal().then(() => openModal({ kind: 'project', project }, opener));
          }}
        />
      ) : (
        <EmptyState
          message={fillTemplate(labels.empty, { query: query.trim() })}
          resetLabel={labels.resetSearch}
          onReset={resetSearch}
        />
      )}

      {view === 'all' && result.hasMore ? (
        <LoadMore
          label={labels.showMore}
          count={fillTemplate(labels.count, { shown: result.items.length, total: result.total })}
          onMore={() => setRevealed(revealMore)}
        />
      ) : null}

      <p className={styles.srOnly} aria-live="polite">
        {announced > 0
          ? fillTemplate(labels.announcement, { count: result.total }) +
            (announced % 2 === 0 ? ' ' : '')
          : ''}
      </p>

      {shownBrands.length > 0 ? (
        <BrandsStrip brands={shownBrands} labels={labels.brands} />
      ) : isPending(brands) ? (
        <div className={styles.brandsPending}>
          <PendingMarker note={brands.note} />
        </div>
      ) : null}
    </section>
  );
}
