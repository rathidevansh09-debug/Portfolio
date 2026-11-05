// One case-study block in the pop-up (PRD FR-M4, FR-M5, FR-M7; DESIGN §8.10; D-05, D-16, D-17).
// Numbered accent eyebrow ("01 / OVERVIEW") as the block's H3, optional H4 sub-title, then the
// items: paragraphs, bullet lists, images with captions (full panel width), videos, before/after
// pairs, and galleries (Final Designs only). Outcomes use the shared MilestoneRow.
// The whole block reveals once per opening as it enters the pop-up's scroll area (M-03b).

import { MilestoneRow } from '../components/MilestoneRow/MilestoneRow.tsx';
import { MediaImage } from '../components/media/MediaImage/MediaImage.tsx';
import type { ContentItem, Outcome } from '../content/schema.ts';
import { groupContent, sectionEyebrow } from '../lib/caseStudy.ts';
import type { VisibleSection } from '../lib/selectors.ts';
import { Reveal } from '../motion/Reveal.tsx';
import { Gallery, type GalleryLabels } from './Gallery.tsx';
import { MODAL_IMAGE_SIZES, ModalMedia, type ModalMediaLabels } from './ModalMedia.tsx';
import styles from './CaseStudyBlock.module.css';

export interface CaseStudyBlockLabels {
  readonly media: ModalMediaLabels;
  readonly gallery: GalleryLabels;
}

export interface CaseStudyBlockProps {
  /** 1-based position among the visible sections. */
  readonly position: number;
  /** Section label, e.g. "OVERVIEW". */
  readonly label: string;
  readonly section: VisibleSection;
  readonly labels: CaseStudyBlockLabels;
}

export function CaseStudyBlock({ position, label, section, labels }: CaseStudyBlockProps) {
  return (
    <Reveal mode="modal" as="section" className={styles.block}>
      <h3 className={styles.eyebrow}>{sectionEyebrow(position, label)}</h3>
      {section.key === 'outcomes' ? (
        <Outcomes outcomes={section.outcomes} />
      ) : (
        <>
          {section.section.heading ? (
            <h4 className={styles.subtitle}>{section.section.heading}</h4>
          ) : null}
          <div className={styles.items}>
            {groupContent(section.section.items, section.key === 'finalDesigns').map((piece, i) =>
              piece.kind === 'gallery' ? (
                <div key={i} className={styles.bleed}>
                  <Gallery images={piece.images} labels={labels.gallery} />
                </div>
              ) : (
                <Item key={i} item={piece.item} labels={labels} />
              ),
            )}
          </div>
        </>
      )}
    </Reveal>
  );
}

function Item({
  item,
  labels,
}: {
  readonly item: ContentItem;
  readonly labels: CaseStudyBlockLabels;
}) {
  switch (item.kind) {
    case 'paragraph':
      return <p className={styles.paragraph}>{item.text}</p>;
    case 'bullets':
      return (
        <ul className={styles.bullets}>
          {item.items.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ul>
      );
    case 'image':
      return (
        <figure className={`${styles.bleed} ${styles.figure}`}>
          <MediaImage
            image={item}
            fallback={labels.media.imageFallback}
            sizes={MODAL_IMAGE_SIZES}
          />
          {item.caption ? <figcaption className={styles.caption}>{item.caption}</figcaption> : null}
        </figure>
      );
    case 'video':
    case 'beforeAfter':
      return (
        <div className={styles.bleed}>
          <ModalMedia media={item} labels={labels.media} />
        </div>
      );
  }
}

function Outcomes({ outcomes }: { readonly outcomes: readonly Outcome[] }) {
  return (
    <ul className={styles.outcomes}>
      {outcomes.map((o, i) => (
        <MilestoneRow key={i} index={i + 1} title={o.label} value={o.value} />
      ))}
    </ul>
  );
}
