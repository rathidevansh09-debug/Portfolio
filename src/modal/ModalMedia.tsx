// Pop-up media box (DESIGN §8.10; PRD FR-M2, FR-M5, FR-M10; ARCHITECTURE §8.1, §8.2).
// One box for the three media kinds, used for the hero media and for videos and before/after
// pairs inside case-study blocks:
//   image        shown whole on `surface-sunken`, never cropped; 16 : 9 (XS 4 : 3), max 60 % of
//                the screen height
//   video        VideoPlayer (local file or YouTube/Vimeo embed) with its loading/error states
//   beforeAfter  ComparisonSlider resting at 50 % (no scroll-linked motion in the pop-up) with a
//                "Wireframe" / "Final" toggle row underneath. Wireframe shows the wireframe fully
//                (divider at 100), Final the final design (divider at 0); neither is selected at
//                the initial 50 %, and dragging clears the selection (owner decision, Phase 11).

import { useState } from 'react';
import { ComparisonSlider } from '../components/ComparisonSlider/ComparisonSlider.tsx';
import { MediaImage } from '../components/media/MediaImage/MediaImage.tsx';
import {
  VideoPlayer,
  type VideoPlayerLabels,
} from '../components/media/VideoPlayer/VideoPlayer.tsx';
import type { BeforeAfter, HeroMedia } from '../content/schema.ts';
import { fillTemplate } from '../lib/format.ts';
import styles from './ModalMedia.module.css';

export interface ModalMediaLabels {
  readonly sliderLabel: string;
  readonly toggleWireframe: string;
  readonly toggleFinal: string;
  readonly video: VideoPlayerLabels;
  readonly imageFallback: { readonly mark: string; readonly label: string };
}

/** Image `sizes` hint: the panel is at most 1040 px wide (DESIGN §8.10). */
export const MODAL_IMAGE_SIZES = '(max-width: 1100px) 100vw, 1040px';

export function ModalMedia({
  media,
  labels,
}: {
  readonly media: HeroMedia;
  readonly labels: ModalMediaLabels;
}) {
  if (media.kind === 'image') {
    return (
      <div className={styles.still}>
        <MediaImage
          image={media}
          fallback={labels.imageFallback}
          fit="contain"
          sizes={MODAL_IMAGE_SIZES}
        />
      </div>
    );
  }
  if (media.kind === 'video') {
    return (
      <VideoPlayer
        video={media}
        labels={{ ...labels.video, play: fillTemplate(labels.video.play, { title: media.title }) }}
        ratio="popup"
        className={styles.video}
      />
    );
  }
  return <BeforeAfterMedia pair={media} labels={labels} />;
}

type Shown = 'wireframe' | 'final' | null;
const POSITION = { wireframe: 100, final: 0 } as const;

function BeforeAfterMedia({
  pair,
  labels,
}: {
  readonly pair: BeforeAfter;
  readonly labels: ModalMediaLabels;
}) {
  const [shown, setShown] = useState<Shown>(null);
  const toggles = [
    { key: 'wireframe', label: labels.toggleWireframe },
    { key: 'final', label: labels.toggleFinal },
  ] as const;
  return (
    <div>
      <ComparisonSlider
        pair={pair}
        mode="static"
        ratio="popup"
        label={labels.sliderLabel}
        fallback={labels.imageFallback}
        value={shown ? POSITION[shown] : undefined}
        onUserChange={() => setShown(null)}
      />
      <div className={styles.toggles}>
        {toggles.map((t) => (
          <button
            key={t.key}
            type="button"
            className={styles.toggle}
            aria-pressed={shown === t.key}
            onClick={() => setShown(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
