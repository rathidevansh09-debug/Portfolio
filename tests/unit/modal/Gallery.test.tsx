import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ImageRef } from '../../../src/content/schema.ts';
import { Gallery } from '../../../src/modal/Gallery.tsx';
import { image } from '../fixtures.ts';

// Fictional images only.
const labels = {
  previous: 'Test previous image',
  next: 'Test next image',
  imageFallback: { mark: 'T.', label: 'Test unavailable' },
};
const images: ImageRef[] = [1, 2, 3].map((n) => ({
  ...image(`Test gallery ${n}`),
  ...(n === 2 ? { caption: 'Test caption two' } : {}),
}));

describe('gallery (DESIGN §8.10; owner decisions, Phase 11)', () => {
  it('one image at a time, "01 / 03" counter announced politely', () => {
    render(<Gallery images={images} labels={labels} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Test gallery 1' })).toBeTruthy();
    const counter = screen.getByText('01 / 03');
    expect(counter.getAttribute('aria-live')).toBe('polite');
  });

  it('next / previous step through the images, wrapping at both ends [REC]', () => {
    render(<Gallery images={images} labels={labels} />);
    const next = screen.getByRole('button', { name: 'Test next image' });
    const previous = screen.getByRole('button', { name: 'Test previous image' });
    fireEvent.click(next);
    expect(screen.getByText('02 / 03')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Test gallery 2' })).toBeTruthy();
    expect(screen.getByText('Test caption two')).toBeTruthy();
    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText('01 / 03')).toBeTruthy();
    fireEvent.click(previous);
    expect(screen.getByText('03 / 03')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Test gallery 3' })).toBeTruthy();
  });
});
