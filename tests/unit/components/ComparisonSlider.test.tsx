import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ComparisonSlider } from '../../../src/components/ComparisonSlider/ComparisonSlider.tsx';
import type { BeforeAfter } from '../../../src/content/schema.ts';
import { MotionPreferenceProvider } from '../../../src/motion/MotionPreference.tsx';
import { MOTION_STORAGE_KEY } from '../../../src/motion/preference.ts';

const pic = (alt: string) => ({
  kind: 'image' as const,
  alt,
  asset: { sources: {}, img: { src: `/${alt}.png`, w: 1750, h: 1000 } },
});
const pair: BeforeAfter = { kind: 'beforeAfter', before: pic('Wireframe'), after: pic('Final') };
const fallback = { mark: 'D.', label: 'Preview unavailable' };

beforeEach(() => {
  localStorage.clear();
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

const renderSlider = (mode: 'scroll' | 'static') =>
  render(
    <MotionPreferenceProvider>
      <ComparisonSlider
        pair={pair}
        mode={mode}
        label="Compare test"
        beforeLabel="BEFORE"
        afterLabel="AFTER"
        fallback={fallback}
      />
    </MotionPreferenceProvider>,
  );

describe('ComparisonSlider (M-08; ARCHITECTURE §10)', () => {
  it('is a native, labelled range control resting at 50 % in static mode', () => {
    renderSlider('static');
    const range = screen.getByRole('slider', { name: 'Compare test' }) as HTMLInputElement;
    expect(range.type).toBe('range');
    expect(range.value).toBe('50');
    expect(range.getAttribute('aria-valuetext')).toBe('50%');
    expect(screen.getByText('BEFORE')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Final' })).toBeTruthy();
  });

  it('the visitor takes control: input moves the divider and the spoken value follows', () => {
    renderSlider('scroll');
    const range = screen.getByRole('slider', { name: 'Compare test' }) as HTMLInputElement;
    fireEvent.input(range, { target: { value: '30' } });
    expect(range.value).toBe('30');
    expect(range.getAttribute('aria-valuetext')).toBe('30%');
  });

  it('with motion off it rests at 50 % and stays operable (MO-5)', () => {
    localStorage.setItem(MOTION_STORAGE_KEY, 'off');
    renderSlider('scroll');
    const range = screen.getByRole('slider', { name: 'Compare test' }) as HTMLInputElement;
    expect(range.value).toBe('50');
    fireEvent.input(range, { target: { value: '72' } });
    expect(range.getAttribute('aria-valuetext')).toBe('72%');
  });

  it('fits both images without distortion (contain, letterboxed)', () => {
    const { container } = renderSlider('static');
    const boxes = container.querySelectorAll('[data-fit]');
    expect(boxes).toHaveLength(2);
    boxes.forEach((b) => expect((b as HTMLElement).dataset.fit).toBe('contain'));
  });
});
