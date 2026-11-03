import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ImageFallback } from '../../../src/components/media/ImageFallback/ImageFallback.tsx';
import { LoadingRing } from '../../../src/components/media/LoadingRing/LoadingRing.tsx';
import { MediaImage } from '../../../src/components/media/MediaImage/MediaImage.tsx';
import type { ImageRef } from '../../../src/content/schema.ts';

const fallback = { mark: 'D.', label: 'Preview unavailable' };
const picture: ImageRef = {
  kind: 'image',
  alt: 'Test image',
  asset: {
    sources: { avif: '/t-400.avif 400w, /t-800.avif 800w', webp: '/t-400.webp 400w' },
    img: { src: '/t.png', w: 800, h: 485 },
  },
};

describe('MediaImage (DESIGN §7.5; ARCHITECTURE §8.1)', () => {
  it('renders <picture> sources, reserves space from the asset size and loads lazily', () => {
    const { container } = render(<MediaImage image={picture} fallback={fallback} />);
    const box = container.firstElementChild as HTMLElement;
    expect(box.style.aspectRatio).toBe('800 / 485');
    expect(box.dataset.state).toBe('loading');
    const sources = container.querySelectorAll('source');
    expect([...sources].map((s) => s.getAttribute('type'))).toEqual(['image/avif', 'image/webp']);
    const img = screen.getByRole('img', { name: 'Test image' });
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('width')).toBe('800');
  });

  it('loads eagerly with high priority for the hero portrait', () => {
    render(<MediaImage image={picture} fallback={fallback} priority />);
    const img = screen.getByRole('img', { name: 'Test image' });
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('fades in on load and shows the fallback on error', () => {
    const { container, rerender } = render(<MediaImage image={picture} fallback={fallback} />);
    fireEvent.load(screen.getByRole('img', { name: 'Test image' }));
    expect((container.firstElementChild as HTMLElement).dataset.state).toBe('loaded');
    rerender(<MediaImage key="b" image={picture} fallback={fallback} />);
    fireEvent.error(screen.getByRole('img', { name: 'Test image' }));
    expect(screen.getByRole('img', { name: 'Preview unavailable' })).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Test image' })).toBeNull();
  });

  it('renders an SVG asset as a plain image and fills its parent in contain mode', () => {
    const { container } = render(
      <MediaImage
        image={{
          kind: 'image',
          alt: 'Logo',
          asset: { format: 'svg', src: '/l.svg', width: 130, height: 55 },
        }}
        fallback={fallback}
        fit="contain"
      />,
    );
    expect(container.querySelector('picture')).toBeNull();
    expect((container.firstElementChild as HTMLElement).dataset.fit).toBe('contain');
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe('');
  });
});

describe('ImageFallback and LoadingRing', () => {
  it('ImageFallback shows the mark and label, announced once', () => {
    render(<ImageFallback mark="D." label="Preview unavailable" />);
    expect(screen.getByRole('img', { name: 'Preview unavailable' }).textContent).toBe(
      'D.Preview unavailable',
    );
  });

  it('LoadingRing is a status with its visible label', () => {
    render(<LoadingRing label="Loading…" />);
    expect(screen.getByRole('status').textContent).toBe('Loading…');
  });
});
