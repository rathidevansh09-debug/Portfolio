// MediaImage (DESIGN §7.5; ARCHITECTURE §8.1): responsive image in a reserved box.
// - Processed images (PictureAsset): <picture> with AVIF/WebP sources and a fallback <img>.
// - SVG (SvgAsset): plain <img>.
// - Space is reserved from the asset's own size, so nothing jumps while loading (CLS).
// - Loading: `surface-media` box; loaded: fades in over 0.5 s (instant when motion is off);
//   failed: ImageFallback ("D." + "Preview unavailable").
// - Lazy by default; `priority` loads eagerly with high priority (the hero portrait).

import { useState } from 'react';
import { assetSize, type ImageRef } from '../../../content/schema.ts';
import { ImageFallback } from '../ImageFallback/ImageFallback.tsx';
import styles from './MediaImage.module.css';

export interface MediaImageProps {
  readonly image: ImageRef;
  /** Fallback wording from content: the mark ("D.") and "Preview unavailable". */
  readonly fallback: { readonly mark: string; readonly label: string };
  /** `sizes` hint for responsive sources, e.g. "(max-width: 600px) 100vw, 33vw". */
  readonly sizes?: string;
  readonly priority?: boolean;
  /**
   * 'natural' reserves a box at the image's own aspect ratio. 'cover' / 'contain' fill the
   * parent box, which must be positioned and sized (they are absolutely positioned), e.g. cards (cover) or the comparison stage (contain,
   * letterboxed, never stretched — ARCHITECTURE §8.1).
   */
  readonly fit?: 'natural' | 'cover' | 'contain';
  readonly className?: string;
}

type LoadState = 'loading' | 'loaded' | 'error';

export function MediaImage({
  image,
  fallback,
  sizes,
  priority = false,
  fit = 'natural',
  className,
}: MediaImageProps) {
  const [state, setState] = useState<LoadState>('loading');
  const { width, height } = assetSize(image.asset);
  const src = 'img' in image.asset ? image.asset.img.src : image.asset.src;

  const img = (
    <img
      className={styles.img}
      src={src}
      width={width}
      height={height}
      alt={image.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setState('loaded')}
      onError={() => setState('error')}
    />
  );

  return (
    <div
      className={[styles.box, className].filter(Boolean).join(' ')}
      data-fit={fit}
      data-state={state}
      style={fit === 'natural' ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {state === 'error' ? (
        <ImageFallback mark={fallback.mark} label={fallback.label} />
      ) : 'sources' in image.asset ? (
        <picture>
          {Object.entries(image.asset.sources).map(([format, srcSet]) => (
            <source key={format} type={`image/${format}`} srcSet={srcSet} sizes={sizes} />
          ))}
          {img}
        </picture>
      ) : (
        img
      )}
    </div>
  );
}
