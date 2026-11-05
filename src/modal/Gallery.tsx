// Image gallery inside a case-study block (DESIGN §8.10; owner decisions, Phase 11): a run of two
// or more consecutive Final Designs images. One image at a time, shown whole in a stable box so
// the controls do not move; previous/next icon buttons (wrapping at both ends [REC]) and a
// "02 / 05" counter that screen readers hear when it changes. No swipe and no project-to-project
// navigation.

import { useState } from 'react';
import { IconButton } from '../components/actions/IconButton/IconButton.tsx';
import { MediaImage } from '../components/media/MediaImage/MediaImage.tsx';
import type { ImageRef } from '../content/schema.ts';
import { stepGallery } from '../lib/caseStudy.ts';
import { twoDigit } from '../lib/format.ts';
import { MODAL_IMAGE_SIZES } from './ModalMedia.tsx';
import styles from './Gallery.module.css';

export interface GalleryLabels {
  readonly previous: string;
  readonly next: string;
  readonly imageFallback: { readonly mark: string; readonly label: string };
}

export function Gallery({
  images,
  labels,
}: {
  readonly images: readonly ImageRef[];
  readonly labels: GalleryLabels;
}) {
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0];
  if (!image) return null;
  const step = (direction: 1 | -1) => setIndex((i) => stepGallery(i, images.length, direction));

  return (
    <figure className={styles.gallery}>
      <div className={styles.stage}>
        {/* Keyed so each image gets its own loading / fallback state. */}
        <MediaImage
          key={index}
          image={image}
          fallback={labels.imageFallback}
          fit="contain"
          sizes={MODAL_IMAGE_SIZES}
        />
      </div>
      <div className={styles.bar}>
        {image.caption ? (
          <figcaption className={styles.caption}>{image.caption}</figcaption>
        ) : (
          <span />
        )}
        <div className={styles.controls}>
          <IconButton
            icon="chevron-left"
            label={labels.previous}
            borderless
            onClick={() => step(-1)}
          />
          <p className={styles.counter} aria-live="polite" aria-atomic="true">
            {twoDigit(index + 1)} / {twoDigit(images.length)}
          </p>
          <IconButton icon="chevron-right" label={labels.next} borderless onClick={() => step(1)} />
        </div>
      </div>
    </figure>
  );
}
